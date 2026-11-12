import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ArrowDownToLine,
  ArrowUpRight,
  Bookmark,
  BriefcaseBusiness,
  ChevronDown,
  FileText,
  Globe2,
  GraduationCap,
  Languages,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  UserRound,
  X,
} from 'lucide-react';
import {
  getHealthCheckQueryKey,
  useHealthCheck,
  useMatchProfile,
  type MatchedJob,
  type MatchResponse,
  type SuggestedRole,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth/mammoth.browser';

type Language = 'ar' | 'en';

const CV_TEXT_KEY = 'mirsad.cv-text.v2';
const CV_NAME_KEY = 'mirsad.cv-name.v2';
const SKILLS_KEY = 'mirsad.skills.v2';
const COUNTRY_KEY = 'mirsad.country.v2';
const RESULT_KEY = 'mirsad.result.v2';
const SAVED_JOBS_KEY = 'mirsad.saved-jobs.v1';
const MAX_CV_CHARS = 60_000;

const queryClient = new QueryClient();
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const COUNTRIES: Array<{ code: string; ar: string; en: string }> = [
  { code: 'JO', ar: 'الأردن', en: 'Jordan' },
  { code: 'SA', ar: 'السعودية', en: 'Saudi Arabia' },
  { code: 'AE', ar: 'الإمارات', en: 'UAE' },
  { code: 'QA', ar: 'قطر', en: 'Qatar' },
  { code: 'KW', ar: 'الكويت', en: 'Kuwait' },
  { code: 'EG', ar: 'مصر', en: 'Egypt' },
  { code: '', ar: 'أي مكان (عالمي)', en: 'Anywhere (worldwide)' },
];

const text = {
  ar: {
    brand: 'مِرْصاد', brandSub: 'رادار الفرص المهنية', workspace: 'مساحة العمل',
    navAnalyze: 'تحليل ملفي', navRoles: 'الوظائف المقترحة', navJobs: 'الفرص المطابقة', navSaved: 'المحفوظات',
    eyebrow: 'مطابقة بالذكاء الاصطناعي',
    headline: 'ارفع سيرتك أو اكتب مهاراتك، ونقترح عليك الوظائف المناسبة.',
    intro: 'يحلل الذكاء الاصطناعي خبرتك ويقترح مسميات وظيفية تناسبك، ثم يبحث عن وظائف منشورة ويرتبها حسب نسبة التطابق ويوضح المهارات الناقصة.',
    upload: 'السيرة الذاتية', fileHint: 'PDF أو DOCX', drop: 'اسحب الملف هنا أو اضغط للاختيار',
    selectedFile: 'الملف المحدد', removeFile: 'إزالة', noFile: 'لم يتم اختيار ملف', parsing: 'تتم قراءة الملف…',
    parserError: 'تعذرت قراءة الملف. جرّب ملف PDF أو DOCX صالحاً.', docUnsupported: 'صيغة DOC القديمة غير مدعومة؛ احفظ الملف بصيغة DOCX.',
    scanned: 'لم نجد نصاً في الملف (قد يكون صورة ممسوحة). اكتب مهاراتك في الخانة بدلاً منه.',
    or: 'أو / و', skills: 'مهاراتك وخبرتك', skillsPlaceholder: 'مثال: ASP.NET Core، Angular، TypeScript، SQL Server، سنتان خبرة كمطور Full Stack…',
    country: 'أبحث عن وظائف متاحة لمن يقيم في', analyze: 'حلّل وابحث عن وظائف', analyzing: 'جارٍ التحليل…',
    needInput: 'ارفع سيرتك الذاتية أو اكتب مهاراتك أولاً.',
    steps: ['قراءة خبرتك ومهاراتك…', 'اختيار المسميات الوظيفية المناسبة…', 'البحث عن وظائف منشورة…', 'حساب نسبة التطابق لكل وظيفة…'],
    stepsNote: 'قد يستغرق ذلك حتى دقيقة.',
    errorTitle: 'لم يكتمل التحليل', serverDown: 'لا يوجد رد من سيرفر الـ API. تأكد أن السيرفر شغّال (pnpm dev) وراجع الأخطاء في الـ terminal.', retry: 'إعادة المحاولة',
    profileTitle: 'ملفك المهني كما فهمه الذكاء الاصطناعي', seniority: 'المستوى', years: 'سنوات الخبرة', yourSkills: 'مهاراتك',
    rolesTitle: 'مسميات وظيفية تناسبك', fit: 'ملاءمة', searchOn: 'ابحث عنها في',
    missingTitle: 'مهارات تزيد فرصك', missingSub: 'مطلوبة في الوظائف التي وجدناها وغير موجودة في ملفك.', inJobs: 'وظيفة تطلبها',
    jobsTitle: 'وظائف مرتبة حسب التطابق', jobsSub: 'وظائف عن بُعد منشورة على Himalayas. تحقّق من التفاصيل لدى صاحب العمل.',
    worldwideNote: 'لم نجد وظائف كافية لبلدك فقط، فأضفنا وظائف عالمية؛ تأكد من شروط الموقع في كل إعلان.',
    allRoles: 'كل المسميات', minScore: 'أدنى تطابق', savedOnly: 'المحفوظة فقط',
    match: 'تطابق', strong: 'مناسبة جداً', good: 'مناسبة', stretch: 'تحتاج تطوير', weak: 'ضعيفة',
    youHave: 'عندك', youLack: 'ينقصك', apply: 'التقديم', save: 'حفظ', saved: 'محفوظ', posted: 'نُشرت', notListed: 'غير مذكور',
    remote: 'عن بُعد', showDescription: 'عرض وصف الوظيفة', hideDescription: 'إخفاء الوصف', viewOnHimalayas: 'الإعلان على Himalayas', foundFor: 'من بحث',
    noJobs: 'لم نجد وظائف منشورة لهذه المسميات حالياً.', noJobsSub: 'جرّب البحث في المنصات المقترحة أعلاه.', noFiltered: 'لا توجد وظائف تطابق هذه التصفية.',
    empty: 'ابدأ برفع سيرتك أو كتابة مهاراتك، وستظهر النتائج هنا.',
    newAnalysis: 'تحليل جديد', status: 'الخدمة', statusUp: 'متاحة', statusDown: 'غير متصلة', checking: 'جارٍ التحقق',
    privacyTitle: 'عن الخصوصية',
    privacy: 'يُقرأ ملفك في المتصفح، ثم يُرسل نصه ومهاراتك إلى السيرفر وإلى خدمة الذكاء الاصطناعي (Google Gemini أو Claude) للتحليل فقط. لا يحفظ السيرفر سيرتك. لا تضع بيانات حساسة لا تريد مشاركتها.',
    languageToggle: 'English', footer: 'مِرْصاد · قرارك المهني بيدك', analyzedWith: 'تم التحليل بواسطة',
  },
  en: {
    brand: 'Mirsad', brandSub: 'Your opportunity radar', workspace: 'Workspace',
    navAnalyze: 'Analyze profile', navRoles: 'Suggested roles', navJobs: 'Matched jobs', navSaved: 'Saved jobs',
    eyebrow: 'AI-powered matching',
    headline: 'Upload your CV or list your skills, and see which jobs fit you.',
    intro: 'AI reads your experience, suggests job titles that fit, then finds published jobs, ranks them by match and shows the skills you are missing.',
    upload: 'Your CV', fileHint: 'PDF or DOCX', drop: 'Drop a file here or click to choose',
    selectedFile: 'Selected file', removeFile: 'Remove', noFile: 'No file selected', parsing: 'Reading the file…',
    parserError: 'Could not read this file. Try a valid PDF or DOCX document.', docUnsupported: 'Legacy DOC files are not supported; please save as DOCX.',
    scanned: 'No text found in this file (it may be a scanned image). Type your skills in the box instead.',
    or: 'and / or', skills: 'Your skills and experience', skillsPlaceholder: 'e.g. ASP.NET Core, Angular, TypeScript, SQL Server, 2 years as a full stack developer…',
    country: 'Find jobs open to people living in', analyze: 'Analyze & find jobs', analyzing: 'Analyzing…',
    needInput: 'Upload your CV or enter your skills first.',
    steps: ['Reading your experience and skills…', 'Choosing job titles that fit…', 'Searching published jobs…', 'Scoring each job against your profile…'],
    stepsNote: 'This can take up to a minute.',
    errorTitle: 'The analysis did not finish', serverDown: 'No response from the API server. Make sure it is running (pnpm dev) and check the terminal for errors.', retry: 'Try again',
    profileTitle: 'Your profile, as the AI understood it', seniority: 'Level', years: 'Years of experience', yourSkills: 'Your skills',
    rolesTitle: 'Job titles that fit you', fit: 'Fit', searchOn: 'Search it on',
    missingTitle: 'Skills that would boost your chances', missingSub: 'Asked for by the jobs we found, but missing from your profile.', inJobs: 'jobs ask for it',
    jobsTitle: 'Jobs ranked by match', jobsSub: 'Remote jobs published on Himalayas. Verify details with the employer.',
    worldwideNote: 'Not enough jobs were open to your country only, so worldwide jobs were added; check each listing’s location rules.',
    allRoles: 'All titles', minScore: 'Minimum match', savedOnly: 'Saved only',
    match: 'match', strong: 'Strong fit', good: 'Good fit', stretch: 'Stretch', weak: 'Weak fit',
    youHave: 'You have', youLack: 'Missing', apply: 'Apply', save: 'Save', saved: 'Saved', posted: 'Posted', notListed: 'Not listed',
    remote: 'Remote', showDescription: 'Show job description', hideDescription: 'Hide description', viewOnHimalayas: 'Listing on Himalayas', foundFor: 'Found for',
    noJobs: 'No published jobs were found for these titles right now.', noJobsSub: 'Try the job-board searches suggested above.', noFiltered: 'No jobs match these filters.',
    empty: 'Start by uploading your CV or typing your skills; results will appear here.',
    newAnalysis: 'New analysis', status: 'Service', statusUp: 'online', statusDown: 'offline', checking: 'checking',
    privacyTitle: 'About privacy',
    privacy: 'Your file is read in the browser, then its text and your skills are sent to the server and to the AI service (Google Gemini or Claude) for analysis only. The server does not store your CV. Leave out anything sensitive you do not want to share.',
    languageToggle: 'العربية', footer: 'Mirsad · Your career decisions stay yours', analyzedWith: 'Analyzed with',
  },
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    if (value === null || value === '') localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be disabled; the app still works without it.
  }
}

function displayDate(value: string | Date | null, language: Language, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-JO' : 'en', { dateStyle: 'medium' }).format(date);
}

function scoreTone(score: number) {
  if (score >= 80) return { key: 'strong' as const, ring: '#4f8a6c', bg: '#e3efe5', fg: '#2f6a4f' };
  if (score >= 60) return { key: 'good' as const, ring: '#7fa18d', bg: '#ebf1e9', fg: '#4d7562' };
  if (score >= 40) return { key: 'stretch' as const, ring: '#c9a067', bg: '#f6eedf', fg: '#8a6a3c' };
  return { key: 'weak' as const, ring: '#c78568', bg: '#f7ebe5', fg: '#996b54' };
}

function boardLinks(role: string, countryCode: string) {
  const keyword = encodeURIComponent(role);
  const country = COUNTRIES.find((c) => c.code === countryCode)?.en ?? '';
  const location = encodeURIComponent(country && countryCode ? country : 'Worldwide');
  return [
    { name: 'LinkedIn', href: `https://www.linkedin.com/jobs/search/?keywords=${keyword}&location=${location}` },
    { name: 'Bayt', href: `https://www.bayt.com/en/${countryCode === 'JO' ? 'jordan' : 'international'}/jobs/?q=${keyword}` },
    { name: 'Indeed', href: `https://www.indeed.com/jobs?q=${keyword}&l=${location}` },
  ];
}

function errorMessage(error: unknown, fallback: string, serverDown: string) {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string') {
      return (data as { error: string }).error;
    }
  }
  // No JSON error body: the request never reached the API server (not running, or crashed).
  const status = error && typeof error === 'object' && 'status' in error ? (error as { status?: unknown }).status : undefined;
  if (status === undefined || status === 500 || status === 502 || status === 503 || status === 504 || status === 404) {
    return `${serverDown}${typeof status === 'number' ? ` (HTTP ${status})` : ''}`;
  }
  return `${fallback} (HTTP ${String(status)})`;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AppRouter />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function AppRouter() {
  const [location] = useLocation();
  return (
    <ErrorBoundary resetKey={location}>
      <Switch>
        <Route path="/" component={MatchDashboard} />
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

function MatchDashboard() {
  const [language, setLanguage] = useState<Language>('ar');
  const [cvText, setCvText] = useState(() => readStorage<string>(CV_TEXT_KEY, ''));
  const [fileName, setFileName] = useState(() => readStorage<string>(CV_NAME_KEY, ''));
  const [skills, setSkills] = useState(() => readStorage<string>(SKILLS_KEY, ''));
  const [country, setCountry] = useState(() => readStorage<string>(COUNTRY_KEY, 'JO'));
  const [result, setResult] = useState<MatchResponse | null>(() => readStorage<MatchResponse | null>(RESULT_KEY, null));
  const [savedIds, setSavedIds] = useState<string[]>(() => readStorage<string[]>(SAVED_JOBS_KEY, []));
  const [parseError, setParseError] = useState('');
  const [parsing, setParsing] = useState(false);
  const [inputError, setInputError] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [savedOnly, setSavedOnly] = useState(false);
  const [step, setStep] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = text[language];
  const isArabic = language === 'ar';
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), staleTime: 60_000 } });

  const match = useMatchProfile({
    mutation: {
      onSuccess: (data) => {
        setResult(data);
        setRoleFilter('');
        setMinScore(0);
        setSavedOnly(false);
        requestAnimationFrame(() => document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth' }));
      },
    },
  });

  useEffect(() => writeStorage(CV_TEXT_KEY, cvText), [cvText]);
  useEffect(() => writeStorage(CV_NAME_KEY, fileName), [fileName]);
  useEffect(() => writeStorage(SKILLS_KEY, skills), [skills]);
  useEffect(() => writeStorage(COUNTRY_KEY, country), [country]);
  useEffect(() => writeStorage(RESULT_KEY, result), [result]);
  useEffect(() => writeStorage(SAVED_JOBS_KEY, savedIds), [savedIds]);

  // Advance the progress message while the request runs.
  useEffect(() => {
    if (!match.isPending) return;
    setStep(0);
    const timers = [6_000, 14_000, 20_000].map((ms, index) => window.setTimeout(() => setStep(index + 1), ms));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [match.isPending]);

  const handleFile = async (file?: File) => {
    if (!file) return;
    setParseError('');
    setInputError(false);
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'doc') return setParseError(t.docUnsupported);
    if (!['pdf', 'docx'].includes(extension ?? '')) return setParseError(t.parserError);
    setParsing(true);
    try {
      const buffer = await file.arrayBuffer();
      let extracted = '';
      if (extension === 'pdf') {
        const document = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
        const pages: string[] = [];
        for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
          const page = await document.getPage(pageNumber);
          const content = await page.getTextContent();
          pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
        }
        extracted = pages.join('\n');
      } else {
        const converted = await mammoth.extractRawText({ arrayBuffer: buffer });
        extracted = converted.value;
      }
      extracted = extracted.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
      if (!extracted) {
        setParseError(t.scanned);
        return;
      }
      setCvText(extracted.slice(0, MAX_CV_CHARS));
      setFileName(file.name);
    } catch {
      setParseError(t.parserError);
    } finally {
      setParsing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeFile = () => {
    setCvText('');
    setFileName('');
    setParseError('');
  };

  const analyze = () => {
    if (!cvText.trim() && skills.trim().length < 3) {
      setInputError(true);
      return;
    }
    setInputError(false);
    match.mutate({ data: { cvText: cvText || undefined, skills: skills.trim() || undefined, language, country: country || null } });
  };

  const toggleSaved = (jobId: string) =>
    setSavedIds((current) => (current.includes(jobId) ? current.filter((id) => id !== jobId) : [...current, jobId]));

  const visibleJobs = useMemo(
    () => (result?.jobs ?? []).filter((item) =>
      (!roleFilter || item.role === roleFilter) && item.matchScore >= minScore && (!savedOnly || savedIds.includes(item.job.id))),
    [result, roleFilter, minScore, savedOnly, savedIds],
  );

  return (
    <main dir={isArabic ? 'rtl' : 'ltr'} lang={language} className="mirsad-shell mirsad-noise selection:bg-[#dbece3]">
      <div className="mx-auto flex min-h-[100dvh] max-w-[1480px]">
        <aside className="mirsad-aside hidden w-[238px] shrink-0 flex-col border-e border-[#dce2d9] px-5 py-7 lg:flex">
          <a href="#top" className="mb-12 flex items-center gap-3 text-inherit no-underline">
            <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#1c4b46] text-[#f7f5e9]"><Search className="h-5 w-5" /></span>
            <span><span className="block text-[17px] font-extrabold tracking-tight">{t.brand}</span><span className="block text-[10px] text-[#71827a]">{t.brandSub}</span></span>
          </a>
          <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-[#89958a]">{t.workspace}</div>
          <nav className="space-y-1">
            <NavLink href="#analyze" icon={<UserRound className="h-[17px] w-[17px]" />} label={t.navAnalyze} active />
            <NavLink href="#roles" icon={<Target className="h-[17px] w-[17px]" />} label={t.navRoles} />
            <NavLink href="#jobs" icon={<BriefcaseBusiness className="h-[17px] w-[17px]" />} label={t.navJobs} badge={result?.jobs.length || undefined} />
            <NavLink href="#jobs" onClick={() => setSavedOnly(true)} icon={<Bookmark className="h-[17px] w-[17px]" />} label={t.navSaved} badge={savedIds.length || undefined} />
          </nav>
          <div className="mt-auto rounded-2xl border border-[#d6e1d8] bg-[#e8efe7] p-4">
            <div className="mb-2 flex items-center gap-2 text-[12px] font-bold"><ShieldCheck className="h-4 w-4 text-[#48766a]" />{t.privacyTitle}</div>
            <p className="m-0 text-[10px] leading-[1.7] text-[#6c7d73]">{t.privacy}</p>
          </div>
        </aside>

        <div id="top" className="min-w-0 flex-1">
          <header className="mirsad-header sticky top-0 z-20 border-b border-[#e1e4dc] px-4 py-3 sm:px-7 lg:px-10">
            <div className="mx-auto flex max-w-[1160px] items-center justify-between gap-3">
              <div className="flex items-center gap-2 lg:hidden">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1c4b46] text-[#f7f5e9]"><Search className="h-4 w-4" /></span>
                <span className="text-[15px] font-extrabold">{t.brand}</span>
              </div>
              <div className="ms-auto flex items-center gap-2">
                <div className={`hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold sm:flex ${health.isError ? 'border-[#ead4ca] bg-[#f9eee9] text-[#996b54]' : 'border-[#d8e4dc] bg-[#ebf1eb] text-[#54736a]'}`} aria-live="polite">
                  <span className={`h-1.5 w-1.5 rounded-full ${health.isLoading ? 'bg-[#bd9b61]' : health.isError ? 'bg-[#c78568]' : 'bg-[#7fa18d]'}`} />
                  {t.status}: {health.isLoading ? t.checking : health.isError ? t.statusDown : t.statusUp}
                </div>
                <button type="button" onClick={() => setLanguage(isArabic ? 'en' : 'ar')} className="mirsad-button rounded-full px-3.5 py-2 text-[11px]">
                  <Languages className="h-3.5 w-3.5" />{t.languageToggle}
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1160px] px-4 pb-12 pt-7 sm:px-7 sm:pt-9 lg:px-10">
            <section className="mirsad-enter mb-6">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em] text-[#8b9b8f]"><Sparkles className="h-3.5 w-3.5 text-[#d7845c]" />{t.eyebrow}</div>
              <h1 className="m-0 max-w-[760px] font-serif text-[28px] font-medium leading-[1.3] tracking-[-.03em] text-[#173c39] sm:text-[38px]">{t.headline}</h1>
              <p className="mb-0 mt-3 max-w-[720px] text-[12px] leading-6 text-[#73847a]">{t.intro}</p>
            </section>

            {/* Input */}
            <section id="analyze" className="mirsad-card mb-8 scroll-mt-24 overflow-hidden">
              <div className="grid gap-0 md:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
                <div className="mirsad-soft border-b border-[#e3e8df] p-5 md:border-b-0 md:border-e sm:p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#d7e6d8] text-[#527a6c]"><Upload className="h-4 w-4" /></span>
                    <div><h2 className="m-0 text-[14px] font-extrabold">{t.upload}</h2><p className="mb-0 mt-0.5 text-[10px] text-[#758b7d]">{t.fileHint}</p></div>
                  </div>
                  <input ref={inputRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" aria-label={t.upload} onChange={(event) => void handleFile(event.currentTarget.files?.[0])} />
                  <button type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void handleFile(event.dataTransfer.files[0]); }} className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#afc6b4] bg-[#f3f6ef]/80 px-3 py-7 text-center text-[11px] font-semibold text-[#557568] hover:bg-[#f8faf5]">
                    <ArrowDownToLine className="h-5 w-5" />{t.drop}
                  </button>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#dce9dc] text-[#5c8071]"><FileText className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[9px] font-bold text-[#84968a]">{t.selectedFile}</div>
                      <div className="truncate text-[11px] text-[#557065]" aria-live="polite">{parsing ? t.parsing : fileName || t.noFile}</div>
                    </div>
                    {cvText && <button type="button" onClick={removeFile} className="mirsad-button px-2 py-1.5 text-[9px]"><X className="h-3 w-3" />{t.removeFile}</button>}
                  </div>
                  {parseError && <p role="alert" className="mb-0 mt-2 text-[10px] font-semibold text-[#a54c3d]">{parseError}</p>}
                </div>

                <div className="p-5 sm:p-6">
                  <label className="block">
                    <span className="mb-1.5 flex items-center justify-between text-[11px] font-bold text-[#5f766a]"><span>{t.skills}</span><span className="text-[9px] font-normal text-[#98a298]">{t.or}</span></span>
                    <textarea value={skills} onChange={(event) => { setSkills(event.target.value); setInputError(false); }} rows={5} maxLength={4000} className="mirsad-input min-h-[120px] resize-y text-[12px] leading-6" placeholder={t.skillsPlaceholder} />
                  </label>
                  <label className="mt-4 block">
                    <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-[#5f766a]"><MapPin className="h-3.5 w-3.5" />{t.country}</span>
                    <select value={country} onChange={(event) => setCountry(event.target.value)} className="mirsad-input text-[12px]">
                      {COUNTRIES.map((c) => <option key={c.code || 'ww'} value={c.code}>{c[language]}</option>)}
                    </select>
                  </label>
                  {inputError && <p role="alert" className="mb-0 mt-3 text-[11px] font-semibold text-[#a54c3d]">{t.needInput}</p>}
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button type="button" onClick={analyze} disabled={match.isPending || parsing} className="mirsad-button mirsad-button-primary px-5 py-3 text-[12px] disabled:opacity-60">
                      {match.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {match.isPending ? t.analyzing : t.analyze}
                    </button>
                    {result && !match.isPending && <button type="button" onClick={() => { setResult(null); removeFile(); setSkills(''); }} className="text-[11px] font-bold text-[#8b765f] underline decoration-[#d5b89d] underline-offset-4">{t.newAnalysis}</button>}
                  </div>
                </div>
              </div>
            </section>

            {match.isPending && <Progress steps={t.steps} step={step} note={t.stepsNote} />}

            {match.isError && !match.isPending && (
              <div className="mirsad-card mb-8 flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center" role="alert">
                <div className="flex-1">
                  <div className="text-[13px] font-extrabold text-[#875d4b]">{t.errorTitle}</div>
                  <p className="mb-0 mt-1 text-[11px] leading-5 text-[#875d4b]">{errorMessage(match.error, t.errorTitle, t.serverDown)}</p>
                </div>
                <button type="button" onClick={analyze} className="mirsad-button px-3 py-2 text-[11px]"><RefreshCw className="h-3.5 w-3.5" />{t.retry}</button>
              </div>
            )}

            {!result && !match.isPending && !match.isError && (
              <div className="mirsad-card flex items-center gap-3 p-5 text-[12px] text-[#74867a]"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e6eee5] text-[#568071]"><Search className="h-4 w-4" /></span>{t.empty}</div>
            )}

            {result && !match.isPending && (
              <>
                {/* Profile + missing skills */}
                <section className="mb-8 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
                  <article className="mirsad-card p-5 sm:p-6">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e6eee5] text-[#568071]"><UserRound className="h-4 w-4" /></span>
                      <h2 className="m-0 text-[14px] font-extrabold">{t.profileTitle}</h2>
                    </div>
                    {result.profile.summary && <p className="mb-4 mt-0 text-[12px] leading-6 text-[#5f7268]">{result.profile.summary}</p>}
                    <div className="mb-4 flex flex-wrap gap-6">
                      <Stat label={t.seniority} value={result.profile.seniority || t.notListed} />
                      <Stat label={t.years} value={result.profile.yearsOfExperience !== null ? String(result.profile.yearsOfExperience) : t.notListed} />
                    </div>
                    <div className="mb-2 text-[9px] font-bold text-[#98a298]">{t.yourSkills}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.profile.skills.map((skill) => <bdi key={skill} className="rounded-md bg-[#edf2eb] px-2 py-1 text-[10px] font-semibold text-[#577267]">{skill}</bdi>)}
                    </div>
                  </article>

                  <article className="mirsad-card p-5 sm:p-6">
                    <div className="mb-1 flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f6eedf] text-[#a66d48]"><GraduationCap className="h-4 w-4" /></span>
                      <h2 className="m-0 text-[14px] font-extrabold">{t.missingTitle}</h2>
                    </div>
                    <p className="mb-3 mt-1 text-[10px] text-[#87928a]">{t.missingSub}</p>
                    {result.missingSkills.length ? (
                      <ul className="m-0 list-none space-y-2.5 p-0">
                        {result.missingSkills.map((item) => (
                          <li key={item.skill} className="rounded-xl border border-[#efe2d4] bg-[#fbf6ef] px-3 py-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[12px] font-extrabold text-[#8a5f3f]">{item.skill}</span>
                              {item.jobCount > 0 && <span className="text-[9px] font-bold text-[#a88c72]">{item.jobCount} {t.inJobs}</span>}
                            </div>
                            {item.reason && <p className="mb-0 mt-1 text-[10px] leading-5 text-[#8f7a66]">{item.reason}</p>}
                          </li>
                        ))}
                      </ul>
                    ) : <p className="m-0 text-[11px] text-[#87928a]">—</p>}
                  </article>
                </section>

                {/* Suggested roles */}
                <section id="roles" className="mb-8 scroll-mt-24">
                  <h2 className="mb-4 mt-0 text-[20px] font-extrabold tracking-[-.03em]">{t.rolesTitle}</h2>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {result.suggestedRoles.map((role) => <RoleCard key={role.title} role={role} country={result.meta.requestedCountry ?? ''} t={t} />)}
                  </div>
                </section>

                {/* Jobs */}
                <section id="jobs" className="scroll-mt-24">
                  <div className="mb-3">
                    <h2 className="m-0 text-[20px] font-extrabold tracking-[-.03em]">{t.jobsTitle} <span className="text-[13px] font-bold text-[#9aa79d]">({visibleJobs.length})</span></h2>
                    <p className="mb-0 mt-1 text-[10px] text-[#87938a]">{t.jobsSub}</p>
                  </div>
                  {result.meta.searchedWorldwide && <div className="mb-3 rounded-xl border border-[#e7d6c7] bg-[#f9efe4] px-3.5 py-2.5 text-[10px] leading-5 text-[#8b6e58]">{t.worldwideNote}</div>}

                  {result.jobs.length > 0 && (
                    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-[16px] border border-[#e2e3db] bg-[#fbfbf7] px-4 py-3">
                      <button type="button" aria-pressed={!roleFilter} onClick={() => setRoleFilter('')} className="mirsad-tag">{t.allRoles}</button>
                      {[...new Set(result.jobs.map((j) => j.role))].map((role) => (
                        <button key={role} type="button" aria-pressed={roleFilter === role} onClick={() => setRoleFilter(roleFilter === role ? '' : role)} className="mirsad-tag"><bdi>{role}</bdi></button>
                      ))}
                      <label className="ms-auto flex items-center gap-2 text-[10px] font-bold text-[#87948a]">
                        {t.minScore}
                        <select value={minScore} onChange={(event) => setMinScore(Number(event.target.value))} className="mirsad-input w-auto py-1.5 text-[10px]">
                          {[0, 40, 60, 80].map((v) => <option key={v} value={v}>{v}%+</option>)}
                        </select>
                      </label>
                      <label className="mirsad-tag cursor-pointer">
                        <input type="checkbox" checked={savedOnly} onChange={(event) => setSavedOnly(event.target.checked)} className="accent-[#47796c]" />{t.savedOnly}
                      </label>
                    </div>
                  )}

                  {result.jobs.length === 0 ? (
                    <EmptyState title={t.noJobs} sub={t.noJobsSub} />
                  ) : visibleJobs.length === 0 ? (
                    <EmptyState title={t.noFiltered} />
                  ) : (
                    <div className="space-y-3">
                      {visibleJobs.map((item) => <JobCard key={item.job.id} item={item} language={language} saved={savedIds.includes(item.job.id)} onToggleSave={() => toggleSaved(item.job.id)} />)}
                    </div>
                  )}
                  <p className="mb-0 mt-4 text-[9px] text-[#9aa79d]">{t.analyzedWith} {result.meta.model} · {displayDate(result.meta.fetchedAt, language, '')}</p>
                </section>
              </>
            )}

            <section className="mt-10 rounded-[20px] border border-[#dce5db] bg-[#eff3eb] px-4 py-4 sm:px-5 lg:hidden">
              <div className="mb-1 flex items-center gap-2 text-[12px] font-extrabold"><ShieldCheck className="h-4 w-4 text-[#48766a]" />{t.privacyTitle}</div>
              <p className="m-0 text-[10px] leading-5 text-[#718277]">{t.privacy}</p>
            </section>

            <footer className="mt-10 border-t border-[#e1e4dc] pt-5 text-center text-[10px] text-[#87948a]">{t.footer}</footer>
          </div>
        </div>
      </div>
    </main>
  );
}

function NavLink({ href, icon, label, badge, active, onClick }: { href: string; icon: ReactNode; label: string; badge?: number; active?: boolean; onClick?: () => void }) {
  return (
    <a href={href} onClick={onClick} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold no-underline ${active ? 'bg-[#dfe9df] text-[#194e48]' : 'text-[#6c7b73] hover:bg-[#e7ebe2]'}`}>
      {icon}{label}{badge ? <span className="ms-auto text-[10px]">{badge}</span> : null}
    </a>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div><div className="mb-1 text-[9px] font-bold text-[#98a298]">{label}</div><div className="text-[13px] font-extrabold text-[#385c52]">{value}</div></div>;
}

function Progress({ steps, step, note }: { steps: string[]; step: number; note: string }) {
  return (
    <div className="mirsad-card mb-8 p-5 sm:p-6" aria-live="polite">
      <ol className="m-0 list-none space-y-2.5 p-0">
        {steps.map((label, index) => (
          <li key={label} className={`flex items-center gap-2.5 text-[12px] ${index < step ? 'text-[#4d7562]' : index === step ? 'font-bold text-[#24453f]' : 'text-[#a9b3ab]'}`}>
            <span className={`grid h-5 w-5 place-items-center rounded-full text-[9px] ${index < step ? 'bg-[#dcebdf]' : index === step ? 'bg-[#1c4b46] text-white' : 'bg-[#eef1ec]'}`}>
              {index === step ? <RefreshCw className="h-3 w-3 animate-spin" /> : index + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>
      <p className="mb-0 mt-3 text-[10px] text-[#98a298]">{note}</p>
    </div>
  );
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const tone = scoreTone(score);
  return (
    <div className="flex shrink-0 flex-col items-center">
      <div className="grid h-[58px] w-[58px] place-items-center rounded-full" style={{ background: `conic-gradient(${tone.ring} ${score * 3.6}deg, #edf0ea 0deg)` }}>
        <div className="grid h-[46px] w-[46px] place-items-center rounded-full bg-[#fbfbf7] text-[14px] font-extrabold" style={{ color: tone.fg }}>{score}%</div>
      </div>
      <span className="mt-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold" style={{ background: tone.bg, color: tone.fg }}>{label}</span>
    </div>
  );
}

function RoleCard({ role, country, t }: { role: SuggestedRole; country: string; t: (typeof text)['ar'] }) {
  const tone = scoreTone(role.fitScore);
  return (
    <article className="mirsad-card flex flex-col p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="m-0 text-[15px] font-extrabold leading-snug text-[#24453f]"><bdi>{role.title}</bdi></h3>
        <span className="shrink-0 rounded-md px-2 py-1 text-[10px] font-extrabold" style={{ background: tone.bg, color: tone.fg }}>{t.fit} {role.fitScore}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#edf0ea]"><div className="h-full rounded-full" style={{ width: `${role.fitScore}%`, background: tone.ring }} /></div>
      {role.reason && <p className="mb-0 mt-3 flex-1 text-[11px] leading-5 text-[#6f8277]">{role.reason}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="me-1 text-[9px] font-bold text-[#98a298]">{t.searchOn}</span>
        {boardLinks(role.searchQuery, country).map((board) => (
          <a key={board.name} href={board.href} target="_blank" rel="noreferrer noopener" className="mirsad-button px-2.5 py-1.5 text-[10px] no-underline">{board.name}<ArrowUpRight className="h-3 w-3" /></a>
        ))}
      </div>
    </article>
  );
}

function JobCard({ item, language, saved, onToggleSave }: { item: MatchedJob; language: Language; saved: boolean; onToggleSave: () => void }) {
  const t = text[language];
  const { job } = item;
  const [open, setOpen] = useState(false);
  const tone = scoreTone(item.matchScore);
  const salary = job.minSalary !== null || job.maxSalary !== null
    ? `${job.currency ?? ''} ${job.minSalary ?? '—'}${job.maxSalary !== null ? `–${job.maxSalary}` : ''}${job.salaryPeriod ? ` / ${job.salaryPeriod}` : ''}`.trim()
    : '';
  return (
    <article className="mirsad-card mirsad-job overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex gap-4">
          <ScoreBadge score={item.matchScore} label={t[tone.key]} />
          <div className="min-w-0 flex-1">
            <h3 className="m-0 text-[16px] font-extrabold leading-tight tracking-[-.02em] text-[#24453f] sm:text-[17px]"><bdi>{job.title}</bdi></h3>
            <div className="mt-1 text-[11px] font-semibold text-[#718279]"><bdi>{job.companyName}</bdi></div>
            {item.reason && <p className="mb-0 mt-2 text-[11px] leading-5 text-[#5f7268]">{item.reason}</p>}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {item.matchedSkills.map((skill) => <span key={`m-${skill}`} className="rounded-md bg-[#e1ece1] px-2 py-0.5 text-[9px] font-semibold text-[#3f6b56]">✓ {skill}</span>)}
              {item.missingSkills.map((skill) => <span key={`x-${skill}`} className="rounded-md bg-[#f7ebe5] px-2 py-0.5 text-[9px] font-semibold text-[#9a5f45]">✗ {skill}</span>)}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[9px] text-[#89958c]">
              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{job.locationRestrictions.length ? job.locationRestrictions.join(' · ') : t.remote}</span>
              {job.employmentType && <span>{job.employmentType}</span>}
              {job.seniority && <span>{job.seniority}</span>}
              {salary && <span className="font-semibold text-[#607a6b]">{salary}</span>}
              <span>{t.posted}: {displayDate(job.publishedAt, language, t.notListed)}</span>
              <span>{t.foundFor}: <bdi>{item.role}</bdi></span>
            </div>
            {open && <p className="mb-0 mt-3 whitespace-pre-line text-[11px] leading-[1.75] text-[#77877e]" dir="auto">{job.description}</p>}
            {job.description && (
              <button type="button" onClick={() => setOpen((v) => !v)} className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-[#286258]">
                <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />{open ? t.hideDescription : t.showDescription}
              </button>
            )}
          </div>
          <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
            <a href={job.applicationUrl} target="_blank" rel="noreferrer noopener" className="mirsad-button mirsad-button-primary px-3 py-2 text-[10px] no-underline">{t.apply}<ArrowUpRight className="h-3.5 w-3.5" /></a>
            <button type="button" onClick={onToggleSave} aria-pressed={saved} className={`mirsad-button px-3 py-2 text-[10px] ${saved ? 'border-[#abc5b4] bg-[#e7f0e7]' : ''}`}><Bookmark className={`h-3.5 w-3.5 ${saved ? 'fill-current' : ''}`} />{saved ? t.saved : t.save}</button>
          </div>
        </div>
        <div className="mt-3 flex gap-2 sm:hidden">
          <a href={job.applicationUrl} target="_blank" rel="noreferrer noopener" className="mirsad-button mirsad-button-primary flex-1 justify-center px-3 py-2 text-[10px] no-underline">{t.apply}<ArrowUpRight className="h-3.5 w-3.5" /></a>
          <button type="button" onClick={onToggleSave} aria-pressed={saved} className="mirsad-button px-3 py-2 text-[10px]"><Bookmark className={`h-3.5 w-3.5 ${saved ? 'fill-current' : ''}`} />{saved ? t.saved : t.save}</button>
        </div>
      </div>
      <div className="mirsad-divider" />
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-[9px] text-[#89958c] sm:px-5">
        <span className="flex items-center gap-1.5"><Globe2 className="h-3 w-3" />Himalayas</span>
        <a href={job.sourceUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 font-semibold no-underline hover:underline" style={{ color: tone.fg }}>{t.viewOnHimalayas}<ArrowUpRight className="h-3 w-3" /></a>
      </div>
    </article>
  );
}

function EmptyState({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mirsad-card flex flex-col items-center px-6 py-10 text-center">
      <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[#e9efe7] text-[#5b7f70]"><BriefcaseBusiness className="h-5 w-5" /></span>
      <h3 className="m-0 text-[14px] font-extrabold">{title}</h3>
      {sub && <p className="mb-0 mt-2 max-w-md text-[11px] leading-5 text-[#87938a]">{sub}</p>}
    </div>
  );
}

export default App;
