import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ArrowDownToLine,
  ArrowUpRight,
  Bookmark,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CircleHelp,
  FileText,
  Globe2,
  Languages,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  X,
} from 'lucide-react';
import {
  getHealthCheckQueryKey,
  getSearchJobsQueryKey,
  useHealthCheck,
  useSearchJobs,
  type JobListing,
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
type WorkMode = 'remote' | 'hybrid' | 'onsite';
type CandidateProfile = {
  targetRole: string;
  skills: string[];
  experience: string;
  languages: string;
  countryPreferences: string;
  workModes: WorkMode[];
};

const PROFILE_KEY = 'mirsad.profile.v1';
const CV_TEXT_KEY = 'mirsad.cv-text.v1';
const SAVED_JOBS_KEY = 'mirsad.saved-jobs.v1';
const EMPTY_PROFILE: CandidateProfile = {
  targetRole: '',
  skills: [],
  experience: '',
  languages: '',
  countryPreferences: 'Jordan · Remote worldwide',
  workModes: ['remote'],
};
const queryClient = new QueryClient();
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const text = {
  ar: {
    brand: 'مِرْصاد', brandSub: 'رادار الفرص المهنية', workspace: 'مساحة العمل',
    matches: 'الفرص المناسبة', profileNav: 'ملفي المهني', savedNav: 'المحفوظات', privacyNav: 'الخصوصية',
    headline: 'خطوة مهنية أوضح، تبدأ من خبرتك.', eyebrow: 'مساحة فرصك',
    intro: 'ارفع سيرتك بأمان، راجع ملفك بنفسك، ثم ابحث عن فرص منشورة تناسب كلماتك المفتاحية.',
    sourceNote: 'الوظائف الحية من Himalayas فقط، وليست قائمة شاملة. لا نعرض فرصاً غير منشورة أو درجات توافق مختلقة.',
    intake: 'ابدأ بملفك المهني', intakeSub: 'يمكنك البدء بكتابة المسمّى أو استخراج نص سيرتك هنا على جهازك.',
    upload: 'اختر السيرة الذاتية', fileHint: 'PDF أو DOCX · تتم القراءة داخل المتصفح فقط',
    drop: 'اسحب الملف إلى هنا أو استعرض جهازك', localOnly: 'يبقى على جهازك',
    localPrivacy: 'لا يُرسل ملفك أو نصه أو بيانات التواصل إلى خدمة البحث. تتم معالجة الملف في متصفحك فقط.',
    selectedFile: 'الملف المحدد', removeFile: 'إزالة الملف', noFile: 'لم يتم اختيار ملف',
    role: 'المسمّى أو المجال المستهدف', rolePlaceholder: 'مثال: مصمم منتجات، محاسب، مهندس مدني',
    skills: 'المهارات', skillsHint: 'افصل بين المهارات بفواصل', skillsPlaceholder: 'تحليل البيانات، إدارة المشاريع...',
    experience: 'سنوات الخبرة', experiencePlaceholder: 'مثال: 4 سنوات',
    languages: 'اللغات', languagesPlaceholder: 'العربية، الإنجليزية',
    countries: 'تفضيل الموقع', countriesPlaceholder: 'الأردن · الخليج · عن بُعد حول العالم',
    workMode: 'نمط العمل', remote: 'عن بُعد', hybrid: 'هجين', onsite: 'من مقر الشركة',
    saveProfile: 'تأكيد الملف والبحث', profileReady: 'ملفك جاهز للمراجعة', editProfile: 'تعديل الملف',
    profileSaved: 'حُفظ الملف محلياً على هذا الجهاز.', validation: 'أدخل مسمى مستهدفاً من كلمتين على الأقل للمتابعة.',
    parserError: 'تعذرت قراءة الملف. جرّب ملف PDF أو DOCX صالحاً.', docUnsupported: 'صيغة DOC القديمة غير مدعومة؛ احفظ الملف بصيغة DOCX.',
    parsing: 'تُقرأ السيرة على جهازك…', extracted: 'راجع المعلومات المستخرجة وعدّلها قبل البحث.',
    profileTitle: 'ملف مهني قابل للتعديل', profileSub: 'المعلومات أدناه قابلة للتعديل. لا يتم إرسالها إلى البحث.',
    status: 'حالة التطبيق', statusUp: 'الخدمة متاحة', statusDown: 'تعذر الاتصال بالخدمة', checking: 'جارٍ التحقق',
    searchButton: 'اعرض الوظائف المنشورة', changeQuery: 'تغيير كلمة البحث', live: 'نتائج مباشرة',
    resultsTitle: 'وظائف عن بُعد قد تناسب بحثك', source: 'المصدر', sourceAttribution: 'الوظائف منشورة عبر Himalayas',
    sourceDisclaimer: 'مصدر حي واحد؛ النتائج لا تمثل جميع الوظائف المتاحة. تحقّق من التفاصيل لدى جهة التوظيف.',
    loading: 'نبحث عن وظائف منشورة…', error: 'لم نتمكن من تحميل الوظائف الآن.', retry: 'إعادة المحاولة',
    empty: 'لم تظهر وظائف لهذه الكلمات حالياً.', emptySub: 'جرّب مسمى عاماً أو عدّل الكلمات المفتاحية.',
    noSearch: 'ابدأ بكتابة المسمّى المستهدف ثم أكّد ملفك لعرض النتائج الحية.',
    published: 'إعلان منشور', remoteLabel: 'عن بُعد', apply: 'التقديم لدى صاحب العمل',
    save: 'حفظ', saved: 'محفوظ', posted: 'تاريخ النشر', notListed: 'غير مذكور',
    filters: 'تصفية النتائج', savedOnly: 'المحفوظة فقط', salaryOnly: 'راتب معلن فقط',
    clearFilters: 'مسح التصفية', explain: 'لماذا ظهرت؟', closeExplain: 'إخفاء التوضيح',
    keywordExplain: 'هذا تقدير قائم على تداخل كلمات المسمّى والمهارات مع نص الإعلان، وليس درجة توافق أو تحليلاً ذكياً.',
    matchedTerms: 'كلمات مشتركة', noMatchedTerms: 'لا تظهر كلمات مهارات مشتركة واضحة؛ النتيجة ظهرت بناءً على المسمّى الذي بحثت عنه.',
    matchEstimate: 'تقدير تطابق الكلمات', roleOverlap: 'مسمّى البحث موجود في نص الإعلان',
    localTitle: 'ابحث مباشرة في منصات التوظيف', localSub: 'روابط بحث خارجية تستخدم مسمّاك الذي راجعته؛ لا نرسل إليها بيانات الوظائف من Himalayas.',
    jordanBoards: 'الأردن', gulfBoards: 'الخليج', directSearch: 'فتح بحث خارجي',
    localDisclaimer: 'ستغادر Mirsad عند فتح هذه الروابط. النتائج وشروط الخصوصية تتبع كل منصة.',
    privacyTitle: 'خصوصيتك أولاً', privacyOne: 'قراءة PDF وDOCX داخل المتصفح.', privacyTwo: 'السيرة والملف المحفوظان محلياً فقط.', privacyThree: 'يُرسل البحث المسمّى الذي راجعته والبلد والصفحة فقط.',
    privacyExpanded: 'لا نرسل نص السيرة أو المهارات أو بيانات التواصل. يمكنك حذف الملف المحفوظ من زر إزالة الملف أو مسح بيانات الموقع من إعدادات المتصفح.',
    privacyDetails: 'تفاصيل الخصوصية', footer: 'مِرْصاد · خصوصيتك وقرارك المهني بيدك',
    languageToggle: 'English', savedCount: 'وظيفة محفوظة', clearSaved: 'حذف المحفوظات',
    sourceMeta: 'محدّث', count: 'نتائج', anySalary: 'لا توجد وظائف براتب معلن ضمن هذه التصفية.',
  },
  en: {
    brand: 'Mirsad', brandSub: 'Your opportunity radar', workspace: 'Workspace',
    matches: 'Matched opportunities', profileNav: 'Career profile', savedNav: 'Saved jobs', privacyNav: 'Privacy',
    headline: 'A clearer next move, grounded in your experience.', eyebrow: 'Your opportunity space',
    intro: 'Add your CV privately, review your profile, then search published opportunities using your own keywords.',
    sourceNote: 'Live listings are from Himalayas only—not a comprehensive job board. No unposted vacancies or invented match scores.',
    intake: 'Start with your career profile', intakeSub: 'Enter a target role or extract CV text locally in this browser.',
    upload: 'Choose a CV', fileHint: 'PDF or DOCX · parsed in this browser only',
    drop: 'Drop a file here or browse your device', localOnly: 'Stays on this device',
    localPrivacy: 'Your file, its text, and contact details are never sent to job search. Parsing happens in your browser.',
    selectedFile: 'Selected file', removeFile: 'Remove file', noFile: 'No file selected',
    role: 'Target role or field', rolePlaceholder: 'e.g. Product designer, accountant, civil engineer',
    skills: 'Skills', skillsHint: 'Separate skills with commas', skillsPlaceholder: 'Data analysis, project management...',
    experience: 'Years of experience', experiencePlaceholder: 'e.g. 4 years',
    languages: 'Languages', languagesPlaceholder: 'Arabic, English',
    countries: 'Location preference', countriesPlaceholder: 'Jordan · Gulf · Remote worldwide',
    workMode: 'Work mode', remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site',
    saveProfile: 'Confirm profile & search', profileReady: 'Profile ready to review', editProfile: 'Edit profile',
    profileSaved: 'Profile saved locally on this device.', validation: 'Enter a target role with at least two characters to continue.',
    parserError: 'Could not read this file. Try a valid PDF or DOCX document.', docUnsupported: 'Legacy DOC files are not supported; please save as DOCX.',
    parsing: 'Reading your CV on this device…', extracted: 'Review and edit extracted details before searching.',
    profileTitle: 'Editable career profile', profileSub: 'Everything below is editable. It is not sent to job search.',
    status: 'App status', statusUp: 'Service available', statusDown: 'Service unavailable', checking: 'Checking',
    searchButton: 'Show published jobs', changeQuery: 'Change search keyword', live: 'Live results',
    resultsTitle: 'Remote jobs for your search', source: 'Source', sourceAttribution: 'Listings published via Himalayas',
    sourceDisclaimer: 'One live source; these results do not represent every available job. Verify details with the employer.',
    loading: 'Searching published jobs…', error: 'Jobs could not be loaded right now.', retry: 'Try again',
    empty: 'No published jobs found for these keywords right now.', emptySub: 'Try a broader role title or edit your keywords.',
    noSearch: 'Add a target role and confirm your profile to see live results.',
    published: 'Published listing', remoteLabel: 'Remote', apply: 'Apply on employer site',
    save: 'Save', saved: 'Saved', posted: 'Posted', notListed: 'Not listed',
    filters: 'Filter results', savedOnly: 'Saved only', salaryOnly: 'Salary listed',
    clearFilters: 'Clear filters', explain: 'Why shown?', closeExplain: 'Hide explanation',
    keywordExplain: 'This is a keyword overlap estimate from the role and skills against the listing text—not a match score or intelligent analysis.',
    matchedTerms: 'Shared terms', noMatchedTerms: 'No clear skill terms overlap; this appeared because it was returned for your role keyword.',
    matchEstimate: 'Keyword overlap estimate', roleOverlap: 'Your search role appears in the listing',
    localTitle: 'Search job boards directly', localSub: 'External search links use the role you reviewed; Himalayas listing data is never shared with them.',
    jordanBoards: 'Jordan', gulfBoards: 'Gulf', directSearch: 'Open external search',
    localDisclaimer: 'These links take you away from Mirsad. Results and privacy are governed by each platform.',
    privacyTitle: 'Privacy comes first', privacyOne: 'PDF and DOCX are read in your browser.', privacyTwo: 'Your CV and profile stay in local storage.', privacyThree: 'Only your reviewed role, country, and page are sent for job search.',
    privacyExpanded: 'CV text, skills, and contact details are never sent. Remove your locally saved CV with the remove button or clear this site’s data in browser settings.',
    privacyDetails: 'Privacy details', footer: 'Mirsad · Your data and career decisions stay yours',
    languageToggle: 'العربية', savedCount: 'saved jobs', clearSaved: 'Clear saved jobs',
    sourceMeta: 'Updated', count: 'results', anySalary: 'No jobs with a listed salary match these filters.',
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

function initialProfile() {
  const stored = readStorage<Partial<CandidateProfile> | null>(PROFILE_KEY, null);
  return stored ? { ...EMPTY_PROFILE, ...stored } : EMPTY_PROFILE;
}

function deriveProfile(textValue: string, current: CandidateProfile): CandidateProfile {
  const years = textValue.match(/(\d{1,2})\s*(?:\+?\s*)?(?:years?|yrs?|سنوات|سنة)/i)?.[0] ?? '';
  const vocabulary = [
    'project management', 'project coordination', 'data analysis', 'customer support',
    'customer service', 'accounting', 'financial analysis', 'sales', 'marketing',
    'software development', 'javascript', 'python', 'design', 'research', 'writing',
    'communication', 'leadership', 'operations', 'human resources', 'excel',
    'إدارة المشاريع', 'تحليل البيانات', 'خدمة العملاء', 'المحاسبة', 'التسويق',
    'المبيعات', 'التصميم', 'البرمجة', 'التواصل', 'القيادة', 'كتابة التقارير',
  ];
  const lower = textValue.toLocaleLowerCase();
  const foundSkills = vocabulary.filter((skill) => lower.includes(skill.toLocaleLowerCase()));
  const detectedLanguages = [
    /[\u0600-\u06ff]/.test(textValue) ? 'العربية' : '',
    /\benglish\b/i.test(textValue) ? 'English' : '',
  ].filter(Boolean).join('، ');
  return {
    ...current,
    skills: current.skills.length ? current.skills : foundSkills,
    experience: current.experience || years,
    languages: current.languages || detectedLanguages,
  };
}

function splitTerms(value: string) {
  return value.split(/[,،;\n]/).map((part) => part.trim()).filter(Boolean);
}

function displayDate(value: string | null, language: Language, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-JO' : 'en', { dateStyle: 'medium' }).format(date);
}

function matchTerms(job: JobListing, profile: CandidateProfile) {
  const searchable = `${job.title} ${job.description} ${job.categories.join(' ')}`.toLocaleLowerCase();
  return profile.skills.filter((skill) => skill.length > 1 && searchable.includes(skill.toLocaleLowerCase()));
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
        <Route path="/" component={OpportunityDashboard} />
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

function OpportunityDashboard() {
  const [language, setLanguage] = useState<Language>('ar');
  const [profile, setProfile] = useState<CandidateProfile>(initialProfile);
  const [profileReady, setProfileReady] = useState(() => Boolean(readStorage<Partial<CandidateProfile> | null>(PROFILE_KEY, null)?.targetRole));
  const [reviewedQuery, setReviewedQuery] = useState(() => initialProfile().targetRole);
  const [rawCv, setRawCv] = useState(() => readStorage<string>(CV_TEXT_KEY, ''));
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [parsing, setParsing] = useState(false);
  const [validationError, setValidationError] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [explanationOpen, setExplanationOpen] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>(() => readStorage<string[]>(SAVED_JOBS_KEY, []));
  const [savedOnly, setSavedOnly] = useState(false);
  const [salaryOnly, setSalaryOnly] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [showProfileForm, setShowProfileForm] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = text[language];
  const isArabic = language === 'ar';
  const q = reviewedQuery.trim();
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), staleTime: 60_000 } });
  const searchParams = { q, country: 'JO', page: 1 };
  const jobsQuery = useSearchJobs(searchParams, {
    query: { enabled: Boolean(q && profileReady), queryKey: getSearchJobsQueryKey(searchParams) },
  });
  const serverJobs = jobsQuery.data?.jobs ?? [];
  const filteredJobs = useMemo(() => serverJobs.filter((job) => {
    const bySaved = !savedOnly || savedIds.includes(job.id);
    const bySalary = !salaryOnly || job.minSalary !== null || job.maxSalary !== null;
    const needle = searchFilter.trim().toLocaleLowerCase();
    const byWords = !needle || `${job.title} ${job.companyName} ${job.description}`.toLocaleLowerCase().includes(needle);
    return bySaved && bySalary && byWords;
  }), [serverJobs, savedOnly, savedIds, salaryOnly, searchFilter]);

  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      localStorage.setItem(CV_TEXT_KEY, JSON.stringify(rawCv));
      localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(savedIds));
    } catch {
      // The flow remains usable when browser storage is unavailable.
    }
  }, [profile, rawCv, savedIds]);

  const setProfileField = <K extends keyof CandidateProfile>(key: K, value: CandidateProfile[K]) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    setParseError('');
    setValidationError(false);
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'doc') {
      setParseError(t.docUnsupported);
      return;
    }
    if (!['pdf', 'docx'].includes(extension ?? '')) {
      setParseError(t.parserError);
      return;
    }
    setParsing(true);
    setFileName(file.name);
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
        extracted = pages.join('\n').trim();
      } else {
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        extracted = result.value.trim();
      }
      if (!extracted) throw new Error('No readable text');
      setRawCv(extracted);
      setProfile((current) => deriveProfile(extracted, current));
      setShowProfileForm(true);
    } catch {
      setFileName('');
      setParseError(t.parserError);
    } finally {
      setParsing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const confirmProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (profile.targetRole.trim().length < 2) {
      setValidationError(true);
      return;
    }
    setValidationError(false);
    setProfile((current) => ({ ...current, targetRole: current.targetRole.trim() }));
    setReviewedQuery(profile.targetRole.trim());
    setProfileReady(true);
    setShowProfileForm(false);
  };

  const startSearch = () => {
    if (!profile.targetRole.trim()) {
      setValidationError(true);
      setShowProfileForm(true);
      return;
    }
    setReviewedQuery(profile.targetRole.trim());
    setProfileReady(true);
  };

  const toggleSaved = (jobId: string) => {
    setSavedIds((current) => current.includes(jobId) ? current.filter((id) => id !== jobId) : [...current, jobId]);
  };
  const removeFile = () => {
    setRawCv('');
    setFileName('');
    setParseError('');
    setProfile((current) => ({ ...current, skills: [], experience: '', languages: '' }));
    try { localStorage.removeItem(CV_TEXT_KEY); } catch { /* Storage may be disabled. */ }
  };
  const searchBoards = (region: 'jordan' | 'gulf') => {
    const keyword = encodeURIComponent(reviewedQuery.trim());
    if (region === 'jordan') return [
      { name: 'LinkedIn Jobs', href: `https://www.linkedin.com/jobs/search/?keywords=${keyword}&location=Jordan` },
      { name: 'Bayt', href: `https://www.bayt.com/en/jordan/jobs/?q=${keyword}` },
      { name: 'Akhtaboot', href: `https://www.akhtaboot.com/en/jordan/jobs?keywords=${keyword}` },
    ];
    return [
      { name: 'LinkedIn Jobs', href: `https://www.linkedin.com/jobs/search/?keywords=${keyword}&location=Gulf%20Cooperation%20Council` },
      { name: 'GulfTalent', href: `https://www.gulftalent.com/search?query=${keyword}` },
      { name: 'Bayt Gulf', href: `https://www.bayt.com/en/gulf/jobs/?q=${keyword}` },
    ];
  };

  return (
    <main dir={isArabic ? 'rtl' : 'ltr'} lang={language} className="mirsad-shell mirsad-noise selection:bg-[#dbece3]">
      <div className="mx-auto flex min-h-[100dvh] max-w-[1480px]">
        <aside className="mirsad-aside hidden w-[238px] shrink-0 flex-col border-e border-[#dce2d9] px-5 py-7 lg:flex">
          <a href="#top" className="mb-12 flex items-center gap-3 text-inherit no-underline" data-testid="link-brand">
            <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#1c4b46] text-[#f7f5e9]"><Search className="h-5 w-5" /></span>
            <span><span className="block text-[17px] font-extrabold tracking-tight">{t.brand}</span><span className="block text-[10px] text-[#71827a]">{t.brandSub}</span></span>
          </a>
          <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-[#89958a]">{t.workspace}</div>
          <nav aria-label={isArabic ? 'التنقل الرئيسي' : 'Main navigation'} className="space-y-1">
            <a href="#results" data-testid="link-nav-matches" className="flex items-center gap-3 rounded-xl bg-[#dfe9df] px-3 py-3 text-[13px] font-semibold text-[#194e48] no-underline">
              <BriefcaseBusiness className="h-[17px] w-[17px]" />{t.matches}<span className="ms-auto h-1.5 w-1.5 rounded-full bg-[#d7845c]" />
            </a>
            <a href="#profile" data-testid="link-nav-profile" className="flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold text-[#6c7b73] no-underline hover:bg-[#e7ebe2]">
              <UserRound className="h-[17px] w-[17px]" />{t.profileNav}
            </a>
            <a href="#results" onClick={() => setSavedOnly(true)} data-testid="link-nav-saved" className="flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold text-[#6c7b73] no-underline hover:bg-[#e7ebe2]">
              <Bookmark className="h-[17px] w-[17px]" />{t.savedNav}<span className="ms-auto text-[10px]">{savedIds.length || ''}</span>
            </a>
          </nav>
          <div id="privacy" className="mt-auto rounded-2xl border border-[#d6e1d8] bg-[#e8efe7] p-4">
            <div className="mb-2 flex items-center gap-2 text-[12px] font-bold"><ShieldCheck className="h-4 w-4 text-[#48766a]" />{t.privacyTitle}</div>
            <p className="m-0 text-[11px] leading-[1.7] text-[#6c7d73]">{t.privacyOne}</p>
            <button type="button" onClick={() => setPrivacyOpen((open) => !open)} aria-expanded={privacyOpen} data-testid="button-privacy-details" className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#286258]">
              {t.privacyDetails}<ChevronDown className={`h-3 w-3 transition-transform ${privacyOpen ? 'rotate-180' : ''}`} />
            </button>
            {privacyOpen && <p className="mb-0 mt-2 text-[10px] leading-[1.7] text-[#6c7d73]" data-testid="text-privacy-details">{t.privacyExpanded}</p>}
          </div>
          <AppStatus language={language} />
        </aside>

        <div id="top" className="min-w-0 flex-1">
          <header className="mirsad-header sticky top-0 z-20 border-b border-[#e1e4dc] px-4 py-3 sm:px-7 lg:px-10">
            <div className="mx-auto flex max-w-[1160px] items-center justify-between gap-3">
              <div className="flex items-center gap-2 lg:hidden">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1c4b46] text-[#f7f5e9]"><Search className="h-4 w-4" /></span>
                <span className="text-[15px] font-extrabold">{t.brand}</span>
              </div>
              <div className="hidden text-[12px] text-[#859087] sm:block">{t.brandSub}<span className="mx-2 text-[#c5cbc2]">/</span><span className="font-semibold text-[#516b60]">{t.matches}</span></div>
              <div className="ms-auto flex items-center gap-2">
                <div className={`hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold sm:flex ${health.isError ? 'border-[#ead4ca] bg-[#f9eee9] text-[#996b54]' : 'border-[#d8e4dc] bg-[#ebf1eb] text-[#54736a]'}`} data-testid="status-app-health" aria-live="polite">
                  <span className={`h-1.5 w-1.5 rounded-full ${health.isLoading ? 'bg-[#bd9b61]' : health.isError ? 'bg-[#c78568]' : 'bg-[#7fa18d]'}`} />
                  {t.status}: {health.isLoading ? t.checking : health.isError ? t.statusDown : t.statusUp}
                </div>
                <button type="button" onClick={() => setLanguage(isArabic ? 'en' : 'ar')} className="mirsad-button rounded-full px-3.5 py-2 text-[11px]" data-testid="button-language-toggle" aria-label={isArabic ? 'Switch to English' : 'التبديل إلى العربية'}>
                  <Languages className="h-3.5 w-3.5" />{t.languageToggle}
                </button>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e4d7c6] text-[11px] font-bold text-[#665747] ring-2 ring-[#fafaf6]" aria-label={isArabic ? 'ملف مهني محلي' : 'Local career profile'}>م</span>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1160px] px-4 pb-12 pt-7 sm:px-7 sm:pt-9 lg:px-10">
            <section className="mirsad-enter mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em] text-[#8b9b8f]"><span className="h-px w-5 bg-[#d7845c]" />{t.eyebrow}</div>
                <h1 className="m-0 max-w-[680px] font-serif text-[30px] font-medium leading-[1.24] tracking-[-.04em] text-[#173c39] sm:text-[40px]">{t.headline}</h1>
                <p className="mb-0 mt-3 max-w-[680px] text-[12px] leading-6 text-[#73847a]">{t.intro}</p>
              </div>
              <div className="max-w-[350px] rounded-xl border border-[#e7d6c7] bg-[#f9efe4] px-3.5 py-2.5 text-[10px] leading-[1.7] text-[#8b6e58]" data-testid="text-source-disclaimer">
                <span className="mb-1 inline-flex items-center gap-1.5 font-extrabold text-[#a66d48]"><CircleHelp className="h-3.5 w-3.5" />{t.live}</span>
                <div>{t.sourceNote}</div>
              </div>
            </section>

            <section id="profile" className="mb-5 grid scroll-mt-24 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,.85fr)]">
              <article className="mirsad-card overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e9ece5] px-5 py-4 sm:px-6">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e6eee5] text-[#568071]"><UserRound className="h-4 w-4" /></span>
                    <div><h2 className="m-0 text-[14px] font-extrabold tracking-tight">{t.profileTitle}</h2><p className="mb-0 mt-1 text-[10px] leading-relaxed text-[#87928a]">{t.profileSub}</p></div>
                  </div>
                  {profileReady && <button type="button" onClick={() => setShowProfileForm((show) => !show)} data-testid="button-edit-profile" className="mirsad-button px-3 py-1.5 text-[10px]">{showProfileForm ? t.profileReady : t.editProfile}</button>}
                </div>
                {showProfileForm || !profileReady ? (
                  <form onSubmit={confirmProfile} className="px-5 py-4 sm:px-6" noValidate>
                    <p className="mb-4 text-[10px] text-[#87928a]">{rawCv ? t.extracted : t.intakeSub}</p>
                    <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
                      <label className="sm:col-span-2">
                        <span className="mb-1.5 block text-[10px] font-bold text-[#72857a]">{t.role}<span className="text-[#c17756]"> *</span></span>
                        <input value={profile.targetRole} onChange={(event) => setProfileField('targetRole', event.target.value)} className="mirsad-input text-[12px]" placeholder={t.rolePlaceholder} data-testid="input-target-role" required aria-invalid={validationError} />
                      </label>
                      <label className="sm:col-span-2">
                        <span className="mb-1.5 flex items-center justify-between text-[10px] font-bold text-[#72857a]"><span>{t.skills}</span><span className="font-normal text-[#98a298]">{t.skillsHint}</span></span>
                        <input value={profile.skills.join(', ')} onChange={(event) => setProfileField('skills', splitTerms(event.target.value))} className="mirsad-input text-[12px]" placeholder={t.skillsPlaceholder} data-testid="input-skills" />
                      </label>
                      <label>
                        <span className="mb-1.5 block text-[10px] font-bold text-[#72857a]">{t.experience}</span>
                        <input value={profile.experience} onChange={(event) => setProfileField('experience', event.target.value)} className="mirsad-input text-[12px]" placeholder={t.experiencePlaceholder} data-testid="input-experience" />
                      </label>
                      <label>
                        <span className="mb-1.5 block text-[10px] font-bold text-[#72857a]">{t.languages}</span>
                        <input value={profile.languages} onChange={(event) => setProfileField('languages', event.target.value)} className="mirsad-input text-[12px]" placeholder={t.languagesPlaceholder} data-testid="input-languages" />
                      </label>
                      <label className="sm:col-span-2">
                        <span className="mb-1.5 block text-[10px] font-bold text-[#72857a]">{t.countries}</span>
                        <input value={profile.countryPreferences} onChange={(event) => setProfileField('countryPreferences', event.target.value)} className="mirsad-input text-[12px]" placeholder={t.countriesPlaceholder} data-testid="input-country-preferences" />
                      </label>
                    </div>
                    <fieldset className="mt-4 border-0 p-0">
                      <legend className="mb-2 text-[10px] font-bold text-[#72857a]">{t.workMode}</legend>
                      <div className="flex flex-wrap gap-2">
                        {(['remote', 'hybrid', 'onsite'] as const).map((mode) => (
                          <button key={mode} type="button" aria-pressed={profile.workModes.includes(mode)} onClick={() => setProfileField('workModes', profile.workModes.includes(mode) ? profile.workModes.filter((item) => item !== mode) : [...profile.workModes, mode])} className="mirsad-tag" data-testid={`button-workmode-${mode}`}>{t[mode]}</button>
                        ))}
                      </div>
                    </fieldset>
                    {validationError && <p className="mb-0 mt-3 text-[11px] font-semibold text-[#a54c3d]" role="alert" data-testid="text-profile-validation">{t.validation}</p>}
                    <button type="submit" className="mirsad-button mirsad-button-primary mt-5 px-4 py-2.5 text-[11px]" data-testid="button-confirm-profile"><Check className="h-4 w-4" />{t.saveProfile}</button>
                  </form>
                ) : (
                  <div className="grid gap-x-6 gap-y-4 px-5 py-4 sm:grid-cols-3 sm:px-6" data-testid="panel-profile-summary">
                    <div><div className="mb-1 text-[9px] font-bold text-[#98a298]">{t.role}</div><div className="text-[12px] font-bold text-[#385c52]" data-testid="text-profile-role">{profile.targetRole}</div></div>
                    <div><div className="mb-1 text-[9px] font-bold text-[#98a298]">{t.experience}</div><div className="text-[12px] font-bold text-[#385c52]">{profile.experience || t.notListed}</div></div>
                    <div><div className="mb-1 text-[9px] font-bold text-[#98a298]">{t.countries}</div><div className="flex items-center gap-1 text-[12px] font-bold text-[#385c52]"><MapPin className="h-3 w-3 text-[#7d9a89]" />{profile.countryPreferences || t.notListed}</div></div>
                    <div className="sm:col-span-2"><div className="mb-2 text-[9px] font-bold text-[#98a298]">{t.skills}</div><div className="flex flex-wrap gap-1.5">{profile.skills.length ? profile.skills.map((skill) => <span key={skill} className="rounded-md bg-[#edf2eb] px-2 py-1 text-[9px] font-semibold text-[#577267]">{skill}</span>) : <span className="text-[10px] text-[#87928a]">{t.notListed}</span>}</div></div>
                    <div><div className="mb-1 text-[9px] font-bold text-[#98a298]">{t.languages}</div><div className="text-[11px] font-semibold text-[#587064]">{profile.languages || t.notListed}</div></div>
                    <div className="sm:col-span-3"><button type="button" onClick={startSearch} className="mirsad-button mirsad-button-primary px-4 py-2.5 text-[11px]" data-testid="button-search-jobs"><Search className="h-4 w-4" />{t.searchButton}</button></div>
                  </div>
                )}
              </article>

              <article className="mirsad-soft relative overflow-hidden rounded-[22px] p-5 sm:p-6">
                <div className="pointer-events-none absolute -end-10 -top-12 h-36 w-36 rounded-full border border-[#cfdfd1]" />
                <div className="pointer-events-none absolute -end-1 -top-4 h-20 w-20 rounded-full border border-[#d7e3d6]" />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#d7e6d8] text-[#527a6c]"><Upload className="h-4 w-4" /></span>
                    <div><h2 className="m-0 text-[14px] font-extrabold">{t.upload}</h2><p className="mb-0 mt-1 text-[10px] text-[#758b7d]">{t.fileHint}</p></div>
                  </div>
                  <span className="hidden rounded-full border border-[#cbdacb] px-2 py-1 text-[9px] font-bold text-[#71877a] sm:inline-flex">{t.localOnly}</span>
                </div>
                <input ref={inputRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" aria-label={t.upload} onChange={(event) => void handleFile(event.currentTarget.files?.[0])} data-testid="input-cv-file" />
                <button type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void handleFile(event.dataTransfer.files[0]); }} className="relative mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#afc6b4] bg-[#f3f6ef]/80 px-3 py-4 text-center text-[10px] font-semibold text-[#557568] hover:bg-[#f8faf5]" data-testid="button-upload-cv">
                  <ArrowDownToLine className="h-4 w-4" />{t.drop}
                </button>
                <div className="relative mt-4 flex flex-wrap items-center gap-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#dce9dc] text-[#5c8071]"><FileText className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] font-bold text-[#84968a]">{t.selectedFile}</div>
                    <div className="truncate text-[10px] text-[#557065]" aria-live="polite" data-testid="text-selected-file">{parsing ? t.parsing : fileName || t.noFile}</div>
                  </div>
                  {(fileName || rawCv) && <button type="button" onClick={removeFile} className="mirsad-button px-2 py-1.5 text-[9px]" data-testid="button-remove-cv"><X className="h-3 w-3" />{t.removeFile}</button>}
                </div>
                {parseError && <p role="alert" className="relative mb-0 mt-2 text-[10px] font-semibold text-[#a54c3d]" data-testid="text-parser-error">{parseError}</p>}
                <p className="relative mb-0 mt-3 flex items-start gap-1.5 text-[9px] leading-[1.7] text-[#7a8d80]"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />{t.localPrivacy}</p>
              </article>
            </section>

            <section className="mb-8 rounded-[20px] border border-[#dce5db] bg-[#eff3eb] px-4 py-4 sm:px-5" aria-label={t.privacyTitle}>
              <div className="flex flex-wrap items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#dce9dc] text-[#527a6c]"><ShieldCheck className="h-4 w-4" /></span>
                <div className="min-w-[180px] flex-1">
                  <h2 className="m-0 text-[12px] font-extrabold">{t.privacyTitle}</h2>
                  <ul className="mb-0 mt-2 grid list-none gap-x-5 gap-y-1 p-0 text-[10px] leading-5 text-[#718277] sm:grid-cols-3">
                    <li>{t.privacyOne}</li><li>{t.privacyTwo}</li><li>{t.privacyThree}</li>
                  </ul>
                </div>
              </div>
            </section>

            <section id="results" className="scroll-mt-24" aria-labelledby="results-heading">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="mb-1 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#d7845c]" /><span className="text-[9px] font-bold uppercase tracking-[.16em] text-[#9b8a74]" data-testid="text-result-count">{jobsQuery.data ? `${filteredJobs.length} ${t.count}` : t.live}</span></div>
                  <h2 id="results-heading" className="m-0 text-[20px] font-extrabold tracking-[-.03em] sm:text-[23px]">{t.resultsTitle}</h2>
                  <p className="mb-0 mt-1 text-[10px] text-[#87938a]">{t.sourceDisclaimer}</p>
                </div>
                {profileReady && <button type="button" onClick={() => { setShowProfileForm(true); document.getElementById('profile')?.scrollIntoView({ behavior: 'smooth' }); }} className="mirsad-button px-3 py-2 text-[10px]" data-testid="button-edit-query"><Search className="h-3.5 w-3.5" />{t.changeQuery}</button>}
              </div>

              {jobsQuery.data && (
                <div className="mb-4 rounded-xl border border-[#d9e4dc] bg-[#f0f4ef] px-3.5 py-2.5 text-[10px] leading-5 text-[#657c6e]" data-testid="text-himalayas-attribution">
                  <span className="font-extrabold text-[#426b59]">{t.sourceAttribution}</span>
                  <span className="mx-2 text-[#a7b4a9]">·</span>{t.source} · Himalayas
                  {jobsQuery.data.meta?.fetchedAt && <span className="mx-2">· {t.sourceMeta}: {displayDate(jobsQuery.data.meta.fetchedAt, language, t.notListed)}</span>}
                </div>
              )}

              {profileReady && jobsQuery.data && (
                <div className="mb-4 flex flex-wrap items-center gap-2 rounded-[16px] border border-[#e2e3db] bg-[#fbfbf7] px-4 py-3">
                  <span className="me-1 text-[10px] font-bold text-[#87948a]">{t.filters}</span>
                  <label className="mirsad-tag cursor-pointer">
                    <input type="checkbox" checked={savedOnly} onChange={(event) => setSavedOnly(event.target.checked)} className="accent-[#47796c]" data-testid="filter-saved-only" />{t.savedOnly} ({savedIds.length})
                  </label>
                  <label className="mirsad-tag cursor-pointer">
                    <input type="checkbox" checked={salaryOnly} onChange={(event) => setSalaryOnly(event.target.checked)} className="accent-[#47796c]" data-testid="filter-salary-only" />{t.salaryOnly}
                  </label>
                  <label className="relative min-w-[170px] flex-1 sm:max-w-[270px]">
                    <Search className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#84968a]" />
                    <input value={searchFilter} onChange={(event) => setSearchFilter(event.target.value)} className="mirsad-input py-2 ps-9 text-[10px]" placeholder={t.filters} data-testid="input-filter-jobs" />
                  </label>
                  {(savedOnly || salaryOnly || searchFilter) && <button type="button" onClick={() => { setSavedOnly(false); setSalaryOnly(false); setSearchFilter(''); }} className="text-[10px] font-bold text-[#8b765f] underline decoration-[#d5b89d] underline-offset-4" data-testid="button-clear-filters">{t.clearFilters}</button>}
                </div>
              )}

              {jobsQuery.isLoading && profileReady && <JobSkeletons />}
              {jobsQuery.isError && profileReady && !responseErrorDismissed && (
                <div className="mirsad-card flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center" role="alert" data-testid="state-jobs-error">
                  <p className="m-0 flex-1 text-[12px] text-[#875d4b]">{t.error}</p>
                  <button type="button" onClick={() => void jobsQuery.refetch()} disabled={jobsQuery.isFetching} className="mirsad-button px-3 py-2 text-[10px] disabled:opacity-60" data-testid="button-retry-jobs"><RefreshCw className="h-3.5 w-3.5" />{t.retry}</button>
                </div>
              )}
              {!profileReady && <div className="mirsad-card flex items-center gap-3 p-5 text-[11px] text-[#74867a]" data-testid="state-no-search"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e6eee5] text-[#568071]"><Search className="h-4 w-4" /></span>{t.noSearch}</div>}
              {profileReady && jobsQuery.isSuccess && filteredJobs.length === 0 && (
                <div className="mirsad-card flex flex-col items-center px-6 py-10 text-center" data-testid="state-empty-jobs">
                  <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[#e9efe7] text-[#5b7f70]"><BriefcaseBusiness className="h-5 w-5" /></span>
                  <h3 className="m-0 text-[14px] font-extrabold">{salaryOnly && serverJobs.length ? t.anySalary : t.empty}</h3>
                  <p className="mb-0 mt-2 max-w-md text-[11px] leading-5 text-[#87938a]">{t.emptySub}</p>
                </div>
              )}
              {profileReady && jobsQuery.isSuccess && filteredJobs.length > 0 && (
                <div className="space-y-3" data-testid="list-live-jobs">
                  {filteredJobs.map((job) => <JobCard key={job.id} job={job} profile={profile} language={language} saved={savedIds.includes(job.id)} expanded={explanationOpen === job.id} onToggleSave={() => toggleSaved(job.id)} onToggleExplain={() => setExplanationOpen((id) => id === job.id ? null : job.id)} />)}
                </div>
              )}
            </section>

            <section className="mt-10" aria-labelledby="local-jobs-heading">
              <div className="mb-4">
                <div className="mb-1 text-[9px] font-bold uppercase tracking-[.16em] text-[#9b8a74]"><Globe2 className="me-1 inline h-3 w-3" />{t.jordanBoards} · {t.gulfBoards}</div>
                <h2 id="local-jobs-heading" className="m-0 text-[18px] font-extrabold tracking-[-.02em]">{t.localTitle}</h2>
                <p className="mb-0 mt-1 text-[10px] leading-5 text-[#87938a]">{t.localSub}</p>
              </div>
              {profileReady && reviewedQuery.trim() ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <BoardGroup title={t.jordanBoards} items={searchBoards('jordan')} locale={language} />
                  <BoardGroup title={t.gulfBoards} items={searchBoards('gulf')} locale={language} />
                </div>
              ) : <div className="mirsad-card px-5 py-4 text-[11px] text-[#87938a]" data-testid="state-local-search-waiting">{t.noSearch}</div>}
              <p className="mb-0 mt-3 text-[9px] leading-5 text-[#8a968d]">{t.localDisclaimer}</p>
            </section>

            <footer className="mt-10 border-t border-[#e1e4dc] pt-5 text-center text-[10px] text-[#87948a]" data-testid="text-app-footer">{t.footer}</footer>
          </div>
        </div>
      </div>
    </main>
  );
}

function AppStatus({ language }: { language: Language }) {
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), staleTime: 60_000 } });
  const t = text[language];
  return (
    <div className="mt-5 flex items-center gap-2 px-2 text-[10px] text-[#87948a]" data-testid="status-app-health-sidebar" aria-live="polite">
      <span className={`h-2 w-2 rounded-full ${health.isLoading ? 'bg-[#bd9b61]' : health.isError ? 'bg-[#c78568]' : 'bg-[#86a99a]'}`} />
      <span>{t.status}: {health.isLoading ? t.checking : health.isError ? t.statusDown : t.statusUp}</span>
    </div>
  );
}

function JobCard({ job, profile, language, saved, expanded, onToggleSave, onToggleExplain }: {
  job: JobListing; profile: CandidateProfile; language: Language; saved: boolean; expanded: boolean; onToggleSave: () => void; onToggleExplain: () => void;
}) {
  const t = text[language];
  const overlap = matchTerms(job, profile);
  const date = displayDate(job.publishedAt, language, t.notListed);
  const salary = job.minSalary !== null || job.maxSalary !== null
    ? `${job.currency ?? ''} ${job.minSalary ?? '—'}${job.maxSalary !== null ? `–${job.maxSalary}` : ''}${job.salaryPeriod ? ` / ${job.salaryPeriod}` : ''}`.trim()
    : '';
  return (
    <article className="mirsad-card mirsad-job overflow-hidden" data-testid={`card-live-job-${job.id}`}>
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md bg-[#e4eee4] px-2 py-1 text-[9px] font-extrabold text-[#4d7562]" data-testid={`badge-published-${job.id}`}><span className="h-1.5 w-1.5 rounded-full bg-[#6b9a7c]" />{t.published}</span>
              {job.remote && <span className="rounded-md bg-[#edf1e9] px-2 py-1 text-[9px] font-bold text-[#738578]">{t.remoteLabel}</span>}
            </div>
            <h3 className="m-0 text-[17px] font-extrabold leading-tight tracking-[-.025em] text-[#24453f] sm:text-[18px]" data-testid={`text-job-title-${job.id}`}>{job.title}</h3>
            <div className="mt-1 text-[11px] font-semibold text-[#718279]" data-testid={`text-job-company-${job.id}`}>{job.companyName}</div>
            <p className="mb-0 mt-2 max-w-[760px] text-[11px] leading-[1.7] text-[#77877e] line-clamp-3">{job.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[9px] text-[#89958c]">
              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{job.locationRestrictions.length ? job.locationRestrictions.join(' · ') : t.remoteLabel}</span>
              {job.employmentType && <span>{job.employmentType}</span>}
              {job.seniority && <span>{job.seniority}</span>}
              {salary && <span className="font-semibold text-[#607a6b]" data-testid={`text-job-salary-${job.id}`}>{salary}</span>}
              <span className="inline-flex items-center gap-1"><span>{t.posted}:</span>{date}</span>
            </div>
            {job.categories.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{job.categories.slice(0, 5).map((category) => <span key={category} className="rounded-md bg-[#f0f2eb] px-2 py-1 text-[9px] text-[#687d71]">{category}</span>)}</div>}
          </div>
          <div className="flex shrink-0 items-start gap-2 sm:flex-col sm:items-end">
            <button type="button" onClick={onToggleExplain} aria-expanded={expanded} className="mirsad-button px-3 py-2 text-[10px]" data-testid={`button-explain-${job.id}`}><Sparkles className="h-3.5 w-3.5" />{expanded ? t.closeExplain : t.explain}</button>
            <button type="button" onClick={onToggleSave} aria-pressed={saved} className={`mirsad-button px-3 py-2 text-[10px] ${saved ? 'border-[#abc5b4] bg-[#e7f0e7]' : ''}`} data-testid={`button-save-job-${job.id}`}><Bookmark className={`h-3.5 w-3.5 ${saved ? 'fill-current' : ''}`} />{saved ? t.saved : t.save}</button>
            <a href={job.applicationUrl} target="_blank" rel="noreferrer noopener" className="mirsad-button mirsad-button-primary px-3 py-2 text-[10px] no-underline" data-testid={`link-apply-job-${job.id}`}>{t.apply}<ArrowUpRight className="h-3.5 w-3.5" /></a>
          </div>
        </div>
        {expanded && <div className="mt-4 rounded-xl border border-[#e4e9df] bg-[#f5f7f1] px-4 py-3" data-testid={`panel-match-explanation-${job.id}`}>
          <div className="mb-1.5 text-[10px] font-extrabold text-[#466b5c]">{t.matchEstimate}</div>
          <p className="mb-2 text-[10px] leading-5 text-[#718277]">{t.keywordExplain}</p>
          {overlap.length > 0 ? <div className="mb-2"><span className="me-2 text-[9px] font-bold text-[#829085]">{t.matchedTerms}</span>{overlap.map((term) => <span key={term} className="me-1.5 inline-block rounded-md bg-[#e1ece1] px-2 py-1 text-[9px] font-semibold text-[#527466]">{term}</span>)}</div> : <p className="mb-2 text-[9px] text-[#829085]">{t.noMatchedTerms}</p>}
          {job.title.toLocaleLowerCase().includes(profile.targetRole.toLocaleLowerCase()) && <p className="mb-0 text-[9px] text-[#829085]">{t.roleOverlap}</p>}
        </div>}
      </div>
      <div className="mirsad-divider" />
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-[9px] text-[#89958c] sm:px-5">
        <span className="flex items-center gap-1.5"><Globe2 className="h-3 w-3" />{t.source}: Himalayas</span>
        <a href={job.sourceUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 font-semibold text-[#547769] no-underline hover:underline" data-testid={`link-source-job-${job.id}`}>{t.published}<ArrowUpRight className="h-3 w-3" /></a>
      </div>
    </article>
  );
}

function BoardGroup({ title, items, locale }: { title: string; items: { name: string; href: string }[]; locale: Language }) {
  const t = text[locale];
  return (
    <article className="mirsad-card p-4 sm:p-5" data-testid={`panel-board-${title === t.jordanBoards ? 'jordan' : 'gulf'}`}>
      <h3 className="m-0 text-[12px] font-extrabold text-[#375c50]">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => <a key={item.name} href={item.href} target="_blank" rel="noreferrer noopener" className="mirsad-button px-3 py-2 text-[10px] no-underline" data-testid={`link-board-${item.name.toLowerCase().replace(/\s+/g, '-')}`}>
          {item.name}<ArrowUpRight className="h-3.5 w-3.5" /><span className="sr-only"> — {t.directSearch}</span>
        </a>)}
      </div>
    </article>
  );
}

function JobSkeletons() {
  return (
    <div className="space-y-3" aria-label="Loading jobs" data-testid="state-jobs-loading">
      {[0, 1].map((item) => <div key={item} className="mirsad-card p-5">
        <div className="mirsad-skeleton mb-3 h-5 w-24" />
        <div className="mirsad-skeleton mb-2 h-6 w-2/5" />
        <div className="mirsad-skeleton mb-4 h-3 w-1/4" />
        <div className="mirsad-skeleton mb-2 h-3 w-full" />
        <div className="mirsad-skeleton h-3 w-3/4" />
      </div>)}
    </div>
  );
}

export default App;
