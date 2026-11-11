import { Router, type IRouter } from "express";
import {
  SearchJobsQueryParams,
  SearchJobsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const SEARCH_URL = "https://himalayas.app/jobs/api/search";
const CACHE_TTL_MS = 15 * 60 * 1000;
const STALE_TTL_MS = 6 * 60 * 60 * 1000;
const SOURCE_NOTE =
  "Remote-only listings from Himalayas. Results are not comprehensive; local Jordan vacancies are searched directly on their source sites. Apply through the Himalayas link.";

type ProviderJob = {
  id?: unknown;
  guid?: unknown;
  title?: unknown;
  companyName?: unknown;
  company_name?: unknown;
  description?: unknown;
  excerpt?: unknown;
  employmentType?: unknown;
  job_type?: unknown;
  seniority?: unknown;
  locationRestrictions?: unknown;
  candidate_required_location?: unknown;
  categories?: unknown;
  category?: unknown;
  minSalary?: unknown;
  maxSalary?: unknown;
  currency?: unknown;
  salaryPeriod?: unknown;
  pubDate?: unknown;
  publication_date?: unknown;
  applicationLink?: unknown;
  companyLogo?: unknown;
};

type CachedResult = {
  jobs: Array<Record<string, unknown>>;
  totalCount: number;
  storedAt: number;
  page: number;
  requestedCountry: string | null;
};

const cache = new Map<string, CachedResult>();

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  const single = asString(value);
  return single ? [single] : [];
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asDate(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const timestamp =
    typeof value === "number" && value < 10_000_000_000 ? value * 1000 : value;
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function safeHimalayasUrl(value: unknown): string | null {
  const candidate = asString(value);
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" || url.hostname !== "himalayas.app") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function safeImageUrl(value: unknown): string | null {
  const candidate = asString(value);
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function toPlainText(value: unknown): string {
  const content = asString(value) ?? "";
  return content
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12_000);
}

function normalizeJob(job: ProviderJob): Record<string, unknown> | null {
  const id =
    asString(job.id) ??
    (typeof job.id === "number" ? String(job.id) : null) ??
    asString(job.guid);
  const title = asString(job.title);
  const companyName = asString(job.companyName) ?? asString(job.company_name);
  const applicationUrl = safeHimalayasUrl(job.applicationLink);
  const sourceUrl = safeHimalayasUrl(job.guid) ?? applicationUrl;
  if (!id || !title || !companyName || !applicationUrl || !sourceUrl) return null;

  return {
    id,
    title,
    companyName,
    description: toPlainText(job.description ?? job.excerpt),
    employmentType: asString(job.employmentType) ?? asString(job.job_type),
    seniority:
      asString(job.seniority) ??
      (asStringList(job.seniority).join(", ") || null),
    locationRestrictions: asStringList(
      job.locationRestrictions ?? job.candidate_required_location,
    ),
    categories: asStringList(job.categories ?? job.category),
    minSalary: asNumber(job.minSalary),
    maxSalary: asNumber(job.maxSalary),
    currency: asString(job.currency),
    salaryPeriod: asString(job.salaryPeriod),
    publishedAt: asDate(job.pubDate ?? job.publication_date),
    applicationUrl,
    sourceUrl,
    companyLogo: safeImageUrl(job.companyLogo),
    remote: true,
  };
}

function responseFromCache(
  entry: CachedResult,
  cacheStatus: "fresh" | "stale",
) {
  return SearchJobsResponse.parse({
    jobs: entry.jobs,
    meta: {
      source: "Himalayas",
      fetchedAt: new Date(entry.storedAt).toISOString(),
      totalCount: entry.totalCount,
      returnedCount: entry.jobs.length,
      page: entry.page,
      nextPage:
        entry.jobs.length >= 20 && entry.page < 100 ? entry.page + 1 : null,
      requestedCountry: entry.requestedCountry,
      cacheStatus,
      sourceNote: SOURCE_NOTE,
    },
  });
}

router.get("/jobs/search", async (req, res): Promise<void> => {
  const parsed = SearchJobsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid search filters." });
    return;
  }

  const q = parsed.data.q?.trim();
  const page = parsed.data.page;
  const country = parsed.data.country;
  const cacheKey = JSON.stringify({ q: q ?? "", country: country ?? "", page });
  const cached = cache.get(cacheKey);
  const age = cached ? Date.now() - cached.storedAt : Infinity;

  if (cached && age < CACHE_TTL_MS) {
    res.json(responseFromCache(cached, "fresh"));
    return;
  }

  const sourceUrl = new URL(SEARCH_URL);
  if (q) sourceUrl.searchParams.set("q", q);
  if (country) sourceUrl.searchParams.set("country", country);
  sourceUrl.searchParams.set("page", String(page));
  sourceUrl.searchParams.set("sort", "recent");

  try {
    const sourceResponse = await fetch(sourceUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "MirsadCareerMatcher/1.0",
      },
      signal: AbortSignal.timeout(12_000),
    });
    if (!sourceResponse.ok) {
      throw new Error(`Himalayas returned HTTP ${sourceResponse.status}`);
    }

    const payload: unknown = await sourceResponse.json();
    if (!payload || typeof payload !== "object") {
      throw new Error("Himalayas returned an invalid response.");
    }
    const provider = payload as {
      jobs?: unknown;
      totalCount?: unknown;
      total_count?: unknown;
    };
    const jobs = Array.isArray(provider.jobs)
      ? provider.jobs
          .map((job) =>
            job && typeof job === "object"
              ? normalizeJob(job as ProviderJob)
              : null,
          )
          .filter((job): job is Record<string, unknown> => job !== null)
      : null;
    if (!jobs) throw new Error("Himalayas response did not include job listings.");

    const totalCountCandidate = provider.totalCount ?? provider.total_count;
    const totalCount =
      typeof totalCountCandidate === "number" &&
      Number.isFinite(totalCountCandidate)
        ? Math.max(0, Math.floor(totalCountCandidate))
        : jobs.length;
    const entry: CachedResult = {
      jobs,
      totalCount,
      storedAt: Date.now(),
      page,
      requestedCountry: country ?? null,
    };
    cache.set(cacheKey, entry);
    res.json(responseFromCache(entry, "fresh"));
  } catch (error) {
    if (cached && age < STALE_TTL_MS) {
      req.log.warn(
        { source: "Himalayas", ageMs: age },
        "Serving a cached remote-job response after the source request failed",
      );
      res.json(responseFromCache(cached, "stale"));
      return;
    }

    req.log.error(
      { source: "Himalayas", err: error },
      "Remote job source request failed",
    );
    res.status(502).json({
      error: "The public remote-job source is temporarily unavailable. Try again shortly.",
    });
  }
});

export default router;
