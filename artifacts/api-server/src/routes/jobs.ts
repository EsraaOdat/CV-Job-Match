import { Router, type IRouter } from "express";
import {
  SearchJobsQueryParams,
  SearchJobsResponse,
} from "@workspace/api-zod";
import { fetchHimalayas, SOURCE_NOTE, type CachedResult } from "../lib/himalayas";

const router: IRouter = Router();

function toResponse(entry: CachedResult, cacheStatus: "fresh" | "stale") {
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
  try {
    const { entry, cacheStatus } = await fetchHimalayas(
      parsed.data.q?.trim(),
      parsed.data.country,
      parsed.data.page,
    );
    res.json(toResponse(entry, cacheStatus));
  } catch (error) {
    req.log.error({ source: "Himalayas", err: error }, "Remote job source request failed");
    res.status(502).json({
      error: "The public remote-job source is temporarily unavailable. Try again shortly.",
    });
  }
});

export default router;
