import { useMemo, useRef, useState } from "react";

type Language = "ar" | "en";
type ListingKind = "published" | "lead";
type Opportunity = {
  id: number;
  kind: ListingKind;
  score: number;
  role: { ar: string; en: string };
  company: { ar: string; en: string };
  location: string[];
  mode: string[];
  summary: { ar: string; en: string };
  source: { ar: string; en: string };
  freshness: { ar: string; en: string };
  strengths: { ar: string[]; en: string[] };
  gaps: { ar: string[]; en: string[] };
};

const opportunities: Opportunity[] = [
  {
    id: 1,
    kind: "published",
    score: 91,
    role: { ar: "منسّق عمليات", en: "Operations Coordinator" },
    company: { ar: "مدار للخدمات اللوجستية", en: "Madar Logistics" },
    location: ["amman"],
    mode: ["onsite"],
    summary: {
      ar: "تنسيق سير العمل اليومي وتحسين وضوح العمليات بين الفرق.",
      en: "Coordinate daily workflows and improve operational clarity across teams.",
    },
    source: { ar: "صفحة الوظائف الرسمية", en: "Official careers page" },
    freshness: { ar: "تاريخ النشر: ١٢ يونيو · توضيحي", en: "Posted 12 Jun · illustrative" },
    strengths: {
      ar: ["تنظيم العمليات وتوثيق الإجراءات", "خبرة في التنسيق بين أصحاب المصلحة", "إجادة العربية والإنجليزية"],
      en: ["Process coordination and documentation", "Cross-functional stakeholder experience", "Arabic and English fluency"],
    },
    gaps: {
      ar: ["لم يظهر في الملف استخدام نظام ERP"],
      en: ["ERP platform experience is not shown in the profile"],
    },
  },
  {
    id: 2,
    kind: "published",
    score: 86,
    role: { ar: "أخصائي نجاح العملاء", en: "Customer Success Specialist" },
    company: { ar: "نواة للتقنية المالية", en: "Nawa Fintech" },
    location: ["amman", "remote"],
    mode: ["hybrid", "remote"],
    summary: {
      ar: "مساعدة العملاء على تحقيق قيمة مستمرة من المنتجات الرقمية.",
      en: "Help customers get lasting value from digital products.",
    },
    source: { ar: "لينكدإن · إعلان شركة", en: "LinkedIn · company post" },
    freshness: { ar: "تاريخ النشر: ١٠ يونيو · توضيحي", en: "Posted 10 Jun · illustrative" },
    strengths: {
      ar: ["التواصل مع العملاء وحل المشكلات", "كتابة واضحة باللغتين", "متابعة التفاصيل حتى الإغلاق"],
      en: ["Customer communication and problem solving", "Clear writing in both languages", "Reliable follow-through"],
    },
    gaps: {
      ar: ["خبرة مباشرة في SaaS غير مؤكدة"],
      en: ["Direct SaaS experience is not confirmed"],
    },
  },
  {
    id: 3,
    kind: "lead",
    score: 78,
    role: { ar: "مسؤول برامج وشراكات", en: "Programs & Partnerships Officer" },
    company: { ar: "أثر للتنمية الإقليمية", en: "Athar Regional Development" },
    location: ["amman", "gulf"],
    mode: ["hybrid", "remote"],
    summary: {
      ar: "إشارة توظيف محتملة مستنتجة من نمو الفريق ومشاريع حديثة؛ ليست وظيفة منشورة.",
      en: "A potential hiring signal inferred from team growth and recent projects; not a published vacancy.",
    },
    source: { ar: "إشارات عامة عن نمو الفريق", en: "Public team-growth signals" },
    freshness: { ar: "إشارة رُصدت مؤخراً · توضيحي", en: "Signal observed recently · illustrative" },
    strengths: {
      ar: ["تنسيق البرامج ومتابعة النتائج", "خبرة في بناء الشراكات", "معرفة بسياق المنطقة"],
      en: ["Program coordination and outcome tracking", "Partnership-building experience", "Regional context"],
    },
    gaps: {
      ar: ["إدارة المنح غير مذكورة", "لا يوجد إعلان رسمي للتحقق من المتطلبات"],
      en: ["Grant management is not mentioned", "No official listing to verify requirements"],
    },
  },
  {
    id: 4,
    kind: "published",
    score: 73,
    role: { ar: "مساعد موارد بشرية", en: "People Operations Assistant" },
    company: { ar: "جسر للاستشارات", en: "Jisr Consulting" },
    location: ["gulf", "remote"],
    mode: ["remote"],
    summary: {
      ar: "دعم تجربة الموظف وعمليات الموارد البشرية ضمن فريق موزّع.",
      en: "Support employee experience and people operations in a distributed team.",
    },
    source: { ar: "بوابة توظيف إقليمية", en: "Regional careers portal" },
    freshness: { ar: "تاريخ النشر: ٨ يونيو · توضيحي", en: "Posted 8 Jun · illustrative" },
    strengths: {
      ar: ["التعامل الدقيق مع المعلومات", "تنسيق الجداول والمتابعة", "التواصل المهني"],
      en: ["Careful handling of information", "Scheduling and follow-up", "Professional communication"],
    },
    gaps: {
      ar: ["أنظمة الموارد البشرية غير مذكورة", "معرفة بقوانين العمل الخليجية مطلوبة"],
      en: ["HR systems are not mentioned", "Gulf labor-law familiarity is required"],
    },
  },
];

const copy = {
  ar: {
    brand: "مِرْصاد", brandSub: "رادار الفرص المهنية", navMatches: "الفرص المناسبة", navProfile: "ملفي المهني",
    navSaved: "المحفوظات", navPrivacy: "الخصوصية", dashboard: "مساحة فرصك", greeting: "خطوة مهنية أوضح، تبدأ من خبرتك.",
    demo: "بيانات تجريبية", demoNote: "كل الملفات والفرص المعروضة أمثلة توضيحية فقط — ليست وظائف حالية ولا نتيجة تحليل CV.",
    profileTitle: "ملف مهني قابل للتعديل", profileSub: "راجع هذه العينة كما لو أنها استُخرجت من سيرتك. لا تحفظ معلوماتك هنا.",
    edit: "تعديل الملف", role: "المجال / المسمّى", experience: "الخبرة", location: "الموقع المفضّل",
    skills: "مهارات مستخلصة", languages: "اللغات", profileRole: "عمليات وتنسيق برامج", profileExperience: "٥ سنوات", profileLocation: "عمّان، الأردن",
    skillsList: ["تنسيق المشاريع", "إدارة أصحاب المصلحة", "كتابة التقارير", "تحليل البيانات", "خدمة العملاء"],
    uploadTitle: "أضف سيرتك الذاتية", uploadText: "PDF أو DOC أو DOCX · اختر الملف من جهازك", uploadButton: "اختيار ملف",
    localOnly: "محلي على جهازك", localHint: "في هذا النموذج، لا يُرفع الملف ولا يُقرأ محتواه. يظهر اسم الملف فقط.",
    selected: "الملف المحدد", noFile: "لم يتم اختيار ملف بعد", privacyTitle: "أنت تتحكم ببياناتك",
    privacyText: "لا يوجد رفع أو تحليل في هذا النموذج. لا تُدخل بيانات شخصية حقيقية.",
    filters: "تصفية الفرص", filtersSub: "اختر ما يناسبك — يمكن اختيار أكثر من خيار.", place: "الموقع", workMode: "نمط العمل",
    locations: { amman: "عمّان", jordan: "الأردن", gulf: "الخليج", remote: "عن بُعد" },
    modes: { onsite: "من مقر الشركة", hybrid: "هجين", remote: "عن بُعد" },
    clear: "إعادة الضبط", results: "فرص قد تناسب خبرتك", resultSub: "ترتيب مبدئي حسب المهارات والخبرة، مع توضيح أسباب المطابقة.",
    count: "فرص توضيحية", sort: "الأقرب لملفك", published: "إعلان منشور", lead: "إشارة توظيف محتملة",
    publishedHint: "وظيفة منشورة من مصدر محدد", leadHint: "استنتاج احتمالي، وليس شاغراً معلناً",
    match: "توافق", details: "لماذا قد تناسبك؟", hideDetails: "إخفاء التفاصيل", strengths: "نقاط توافق", gaps: "متطلبات غير واضحة / فجوات",
    source: "المصدر", freshness: "الحداثة", save: "حفظ", saved: "محفوظ", noResults: "لا توجد نتائج بهذه التصفية",
    noResultsSub: "جرّب إزالة أحد الفلاتر لعرض فرص توضيحية أخرى.", footer: "مِرْصاد · نموذج توضيحي غير متصل بمصادر وظائف",
  },
  en: {
    brand: "Mirsad", brandSub: "Your opportunity radar", navMatches: "Matched opportunities", navProfile: "Career profile",
    navSaved: "Saved", navPrivacy: "Privacy", dashboard: "Your opportunity space", greeting: "A clearer next move, grounded in your experience.",
    demo: "Illustrative demo", demoNote: "Every profile and opportunity shown is illustrative only—not a current opening or a CV analysis result.",
    profileTitle: "Editable career profile", profileSub: "Review this sample as if it came from your CV. Nothing is saved here.",
    edit: "Edit profile", role: "Field / role", experience: "Experience", location: "Preferred location", skills: "Extracted skills",
    languages: "Languages", profileRole: "Operations & program coordination", profileExperience: "5 years", profileLocation: "Amman, Jordan",
    skillsList: ["Project coordination", "Stakeholder management", "Report writing", "Data analysis", "Customer support"],
    uploadTitle: "Add your CV", uploadText: "PDF, DOC or DOCX · select a file from your device", uploadButton: "Choose a file",
    localOnly: "Stays on this device", localHint: "In this mockup, the file is never uploaded or read. Only its filename is shown.",
    selected: "Selected file", noFile: "No file selected yet", privacyTitle: "Your data stays yours",
    privacyText: "This mockup does not upload or analyze files. Please don't enter real personal information.",
    filters: "Refine opportunities", filtersSub: "Choose what works for you. Select multiple options.", place: "Location", workMode: "Work mode",
    locations: { amman: "Amman", jordan: "Jordan", gulf: "Gulf", remote: "Remote" },
    modes: { onsite: "On-site", hybrid: "Hybrid", remote: "Remote" },
    clear: "Reset", results: "Opportunities that may fit", resultSub: "A starting point based on skills and experience, with transparent reasons.",
    count: "illustrative matches", sort: "Closest match", published: "Published listing", lead: "Potential hiring lead",
    publishedHint: "Published opening from a named source", leadHint: "Inferred signal, not an advertised vacancy",
    match: "match", details: "Why it may fit", hideDetails: "Hide details", strengths: "Fit reasons", gaps: "Unclear / missing requirements",
    source: "Source", freshness: "Freshness", save: "Save", saved: "Saved", noResults: "No results for these filters",
    noResultsSub: "Try removing a filter to see other illustrative opportunities.", footer: "Mirsad · Illustrative mockup, not connected to job sources",
  },
};

function LineIcon({ name, className = "h-4 w-4" }: { name: string; className?: string }) {
  const common = { className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  if (name === "compass") return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="m15.7 8.3-2.2 5.2-5.2 2.2 2.2-5.2 5.2-2.2Z" /></svg>;
  if (name === "briefcase") return <svg {...common}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18m-11 0v2h4v-2" /></svg>;
  if (name === "user") return <svg {...common}><circle cx="12" cy="8" r="3.2" /><path d="M5 20c.6-3.1 3.1-5 7-5s6.4 1.9 7 5" /></svg>;
  if (name === "bookmark") return <svg {...common}><path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-3.8L6 21V4.8Z" /></svg>;
  if (name === "shield") return <svg {...common}><path d="M12 3 19 6v5c0 4.7-2.8 8-7 10-4.2-2-7-5.3-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></svg>;
  if (name === "upload") return <svg {...common}><path d="M12 15V4m-4 4 4-4 4 4" /><path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" /></svg>;
  if (name === "chevron") return <svg {...common}><path d="m6 9 6 6 6-6" /></svg>;
  if (name === "arrow") return <svg {...common}><path d="M5 12h14m-6-6 6 6-6 6" /></svg>;
  if (name === "check") return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
  if (name === "plus") return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
  if (name === "clock") return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
  if (name === "pin") return <svg {...common}><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></svg>;
  if (name === "globe") return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></svg>;
}

export function OpportunityDashboard() {
  const [language, setLanguage] = useState<Language>("ar");
  const [fileName, setFileName] = useState("");
  const [savedIds, setSavedIds] = useState<number[]>([2]);
  const [expandedIds, setExpandedIds] = useState<number[]>([1]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedModes, setSelectedModes] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [profileRole, setProfileRole] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const t = copy[language];
  const isArabic = language === "ar";
  const filtered = useMemo(
    () => opportunities.filter((item) =>
      (selectedLocations.length === 0 || item.location.some((v) => selectedLocations.includes(v))) &&
      (selectedModes.length === 0 || item.mode.some((v) => selectedModes.includes(v))),
    ),
    [selectedLocations, selectedModes],
  );

  const toggle = (items: string[], setItems: (next: string[]) => void, value: string) => {
    setItems(items.includes(value) ? items.filter((item) => item !== value) : [...items, value]);
  };
  const toggleNumber = (items: number[], setItems: (next: number[]) => void, value: number) => {
    setItems(items.includes(value) ? items.filter((item) => item !== value) : [...items, value]);
  };

  return (
    <main dir={isArabic ? "rtl" : "ltr"} lang={language} className="min-h-screen bg-[#f5f4ef] text-[#183b3a] selection:bg-[#dbece3]">
      <div className="mx-auto flex min-h-screen max-w-[1480px]">
        <aside className="hidden w-[238px] shrink-0 flex-col border-e border-[#dce2d9] bg-[#f0f1e9] px-5 py-7 lg:flex">
          <a href="#top" className="mb-12 flex items-center gap-3 text-inherit no-underline">
            <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#1c4b46] text-[#f7f5e9]"><LineIcon name="compass" className="h-5 w-5" /></span>
            <span><span className="block text-[17px] font-extrabold tracking-tight">{t.brand}</span><span className="block text-[10px] text-[#71827a]">{t.brandSub}</span></span>
          </a>
          <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-[#89958a]">{isArabic ? "مساحة العمل" : "Workspace"}</div>
          <nav aria-label={isArabic ? "التنقل الرئيسي" : "Main navigation"} className="space-y-1">
            {[
              [t.navMatches, "briefcase", true],
              [t.navProfile, "user", false],
              [t.navSaved, "bookmark", false],
            ].map(([label, icon, active]) => (
              <button key={label as string} type="button" className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start text-[13px] font-semibold transition-colors ${active ? "bg-[#dfe9df] text-[#194e48]" : "text-[#6c7b73] hover:bg-[#e7ebe2]"}`}>
                <LineIcon name={icon as string} className="h-[17px] w-[17px]" /><span>{label}</span>
                {active && <span className="ms-auto h-1.5 w-1.5 rounded-full bg-[#d7845c]" />}
              </button>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl border border-[#d6e1d8] bg-[#e8efe7] p-4">
            <div className="mb-2 flex items-center gap-2 text-[12px] font-bold"><LineIcon name="shield" className="h-4 w-4 text-[#48766a]" />{t.privacyTitle}</div>
            <p className="m-0 text-[11px] leading-[1.7] text-[#6c7d73]">{t.privacyText}</p>
            <a href="#privacy" className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#286258] no-underline">{t.navPrivacy}<LineIcon name={isArabic ? "arrow" : "arrow"} className={`h-3 w-3 ${isArabic ? "rotate-180" : ""}`} /></a>
          </div>
          <div className="mt-5 flex items-center gap-2 px-2 text-[10px] text-[#87948a]"><span className="h-2 w-2 rounded-full bg-[#86a99a]" />{t.demo}</div>
        </aside>

        <div id="top" className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-[#e1e4dc] bg-[#f5f4ef]/95 px-4 py-3 backdrop-blur-md sm:px-7 lg:px-10">
            <div className="mx-auto flex max-w-[1160px] items-center justify-between gap-3">
              <div className="flex items-center gap-2 lg:hidden">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1c4b46] text-[#f7f5e9]"><LineIcon name="compass" /></span>
                <span className="text-[15px] font-extrabold">{t.brand}</span>
              </div>
              <div className="hidden text-[12px] text-[#859087] sm:block">{t.brandSub}<span className="mx-2 text-[#c5cbc2]">/</span><span className="font-semibold text-[#516b60]">{t.navMatches}</span></div>
              <div className="ms-auto flex items-center gap-2">
                <span className="hidden items-center gap-1.5 rounded-full border border-[#d8e4dc] bg-[#ebf1eb] px-3 py-1.5 text-[10px] font-bold text-[#54736a] sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-[#7fa18d]" />{t.demo}</span>
                <button type="button" onClick={() => setLanguage(isArabic ? "en" : "ar")} className="rounded-full border border-[#d7ded6] bg-[#fafaf6] px-3.5 py-2 text-[11px] font-bold text-[#43655c] transition hover:border-[#91ada1] hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#52877b]" aria-label={isArabic ? "Switch to English" : "التبديل إلى العربية"}>
                  {isArabic ? "English" : "العربية"}
                </button>
                <button type="button" aria-label={isArabic ? "الملف الشخصي" : "Profile"} className="grid h-9 w-9 place-items-center rounded-full bg-[#e4d7c6] text-[11px] font-bold text-[#665747] ring-2 ring-[#fafaf6]">م</button>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1160px] px-4 pb-10 pt-7 sm:px-7 sm:pt-9 lg:px-10">
            <section className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em] text-[#8b9b8f]"><span className="h-px w-5 bg-[#d7845c]" />{t.dashboard}</div>
                <h1 className="m-0 max-w-[680px] font-serif text-[30px] font-medium leading-[1.24] tracking-[-.04em] text-[#173c39] sm:text-[40px]">{t.greeting}</h1>
              </div>
              <div className="max-w-[350px] rounded-xl border border-[#e7d6c7] bg-[#f9efe4] px-3.5 py-2.5 text-[10px] leading-[1.7] text-[#8b6e58]">
                <span className="mb-1 inline-flex items-center gap-1.5 font-extrabold text-[#a66d48]"><LineIcon name="info" className="h-3.5 w-3.5" />{t.demo}</span>
                <div>{t.demoNote}</div>
              </div>
            </section>

            <section className="mb-5 grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,.85fr)]">
              <article className="overflow-hidden rounded-[22px] border border-[#dce3da] bg-[#fbfbf7] shadow-[0_8px_30px_rgba(42,71,58,.045)]">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e9ece5] px-5 py-4 sm:px-6">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e6eee5] text-[#568071]"><LineIcon name="user" /></span>
                    <div><h2 className="m-0 text-[14px] font-extrabold tracking-tight">{t.profileTitle}</h2><p className="mb-0 mt-1 text-[10px] leading-relaxed text-[#87928a]">{t.profileSub}</p></div>
                  </div>
                  <button type="button" onClick={() => setEditing(!editing)} className="rounded-lg border border-[#d8e2d9] px-3 py-1.5 text-[10px] font-bold text-[#4f7467] transition hover:bg-[#eff4ee] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#52877b]">{editing ? (isArabic ? "تم" : "Done") : t.edit}</button>
                </div>
                <div className="grid gap-x-6 gap-y-4 px-5 py-4 sm:grid-cols-3 sm:px-6">
                  <div><div className="mb-1 text-[9px] font-bold text-[#98a298]">{t.role}</div>{editing ? <input aria-label={t.role} value={profileRole || t.profileRole} onChange={(e) => setProfileRole(e.target.value)} className="w-full rounded-lg border border-[#cfddd2] bg-white px-2 py-1.5 text-[11px] text-[#385c52] outline-none focus:ring-2 focus:ring-[#a9c7b5]" /> : <div className="text-[12px] font-bold text-[#385c52]">{profileRole || t.profileRole}</div>}</div>
                  <div><div className="mb-1 text-[9px] font-bold text-[#98a298]">{t.experience}</div><div className="text-[12px] font-bold text-[#385c52]">{t.profileExperience}</div></div>
                  <div><div className="mb-1 text-[9px] font-bold text-[#98a298]">{t.location}</div><div className="flex items-center gap-1 text-[12px] font-bold text-[#385c52]"><LineIcon name="pin" className="h-3 w-3 text-[#7d9a89]" />{t.profileLocation}</div></div>
                  <div className="sm:col-span-2"><div className="mb-2 text-[9px] font-bold text-[#98a298]">{t.skills}</div><div className="flex flex-wrap gap-1.5">{t.skillsList.map((skill) => <span key={skill} className="rounded-md bg-[#edf2eb] px-2 py-1 text-[9px] font-semibold text-[#577267]">{skill}</span>)}</div></div>
                  <div><div className="mb-1 text-[9px] font-bold text-[#98a298]">{t.languages}</div><div className="text-[11px] font-semibold text-[#587064]">{isArabic ? "العربية · الإنجليزية" : "Arabic · English"}</div></div>
                </div>
              </article>

              <article className="relative overflow-hidden rounded-[22px] border border-[#d8e4db] bg-[#eaf0e8] p-5 sm:p-6">
                <div className="pointer-events-none absolute -end-10 -top-12 h-36 w-36 rounded-full border border-[#cfdfd1]" />
                <div className="pointer-events-none absolute -end-1 -top-4 h-20 w-20 rounded-full border border-[#d7e3d6]" />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#d7e6d8] text-[#527a6c]"><LineIcon name="upload" /></span>
                    <div><h2 className="m-0 text-[14px] font-extrabold">{t.uploadTitle}</h2><p className="mb-0 mt-1 text-[10px] text-[#758b7d]">{t.uploadText}</p></div>
                  </div>
                  <span className="hidden rounded-full border border-[#cbdacb] px-2 py-1 text-[9px] font-bold text-[#71877a] sm:inline-flex">{t.localOnly}</span>
                </div>
                <input ref={fileInput} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" aria-label={t.uploadButton} onChange={(event) => setFileName(event.currentTarget.files?.[0]?.name ?? "")} />
                <div className="relative mt-5 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={() => fileInput.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-[#24574e] px-4 py-2.5 text-[11px] font-bold text-[#f5f5ea] transition hover:-translate-y-0.5 hover:bg-[#17473f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#648d7d] focus-visible:ring-offset-2"><LineIcon name="plus" className="h-4 w-4" />{t.uploadButton}</button>
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] font-bold text-[#84968a]">{t.selected}</div>
                    <div className="truncate text-[10px] text-[#557065]" aria-live="polite">{fileName || t.noFile}</div>
                  </div>
                </div>
                <p className="relative mb-0 mt-3 flex items-start gap-1.5 text-[9px] leading-[1.7] text-[#7a8d80]"><LineIcon name="shield" className="mt-0.5 h-3.5 w-3.5 shrink-0" />{t.localHint}</p>
              </article>
            </section>

            <section className="mb-5 rounded-[20px] border border-[#e2e3db] bg-[#fbfbf7] px-4 py-4 sm:px-5">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div><h2 className="m-0 text-[13px] font-extrabold">{t.filters}</h2><p className="mb-0 mt-1 text-[9px] text-[#8a968d]">{t.filtersSub}</p></div>
                {(selectedLocations.length > 0 || selectedModes.length > 0) && <button type="button" onClick={() => { setSelectedLocations([]); setSelectedModes([]); }} className="text-[10px] font-bold text-[#8b765f] underline decoration-[#d5b89d] underline-offset-4">{t.clear}</button>}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex min-w-[100px] items-center gap-1.5 text-[10px] font-bold text-[#87948a]"><LineIcon name="pin" className="h-3.5 w-3.5" />{t.place}</div>
                <div className="flex flex-wrap gap-1.5">
                  {(["amman", "jordan", "gulf", "remote"] as const).map((id) => <button key={id} type="button" aria-pressed={selectedLocations.includes(id)} onClick={() => toggle(selectedLocations, setSelectedLocations, id)} className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold transition ${selectedLocations.includes(id) ? "border-[#47796c] bg-[#47796c] text-white" : "border-[#dfe5dc] bg-[#f6f7f1] text-[#60786d] hover:border-[#a9c4b3]"}`}>{t.locations[id]}</button>)}
                </div>
                <div className="hidden h-6 w-px bg-[#e1e5dd] sm:block" />
                <div className="flex min-w-[94px] items-center gap-1.5 text-[10px] font-bold text-[#87948a]"><LineIcon name="globe" className="h-3.5 w-3.5" />{t.workMode}</div>
                <div className="flex flex-wrap gap-1.5">
                  {(["onsite", "hybrid", "remote"] as const).map((id) => <button key={id} type="button" aria-pressed={selectedModes.includes(id)} onClick={() => toggle(selectedModes, setSelectedModes, id)} className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold transition ${selectedModes.includes(id) ? "border-[#47796c] bg-[#47796c] text-white" : "border-[#dfe5dc] bg-[#f6f7f1] text-[#60786d] hover:border-[#a9c4b3]"}`}>{t.modes[id]}</button>)}
                </div>
              </div>
            </section>

            <section aria-labelledby="results-heading">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div><div className="mb-1 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#d7845c]" /><span className="text-[9px] font-bold uppercase tracking-[.16em] text-[#9b8a74]">{filtered.length} {t.count}</span></div><h2 id="results-heading" className="m-0 text-[20px] font-extrabold tracking-[-.03em] sm:text-[23px]">{t.results}</h2><p className="mb-0 mt-1 text-[10px] text-[#87938a]">{t.resultSub}</p></div>
                <button type="button" className="flex items-center gap-2 rounded-lg border border-[#dde3db] bg-[#fbfbf7] px-3 py-2 text-[10px] font-semibold text-[#6b7e72]"><span>{t.sort}</span><LineIcon name="chevron" className="h-3 w-3" /></button>
              </div>
              <div className="space-y-3">
                {filtered.map((item) => {
                  const expanded = expandedIds.includes(item.id);
                  const saved = savedIds.includes(item.id);
                  return (
                    <article key={item.id} className="overflow-hidden rounded-[19px] border border-[#dfe4dc] bg-[#fbfbf7] shadow-[0_5px_20px_rgba(42,71,58,.035)] transition-shadow hover:shadow-[0_10px_28px_rgba(42,71,58,.075)]">
                      <div className="p-4 sm:p-5">
                        <div className="flex flex-col gap-4 sm:flex-row">
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-1.5">
                              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[9px] font-extrabold ${item.kind === "published" ? "bg-[#e4eee4] text-[#4d7562]" : "bg-[#f7ebdb] text-[#98704d]"}`}><span className={`h-1.5 w-1.5 rounded-full ${item.kind === "published" ? "bg-[#6b9a7c]" : "bg-[#c4945b]"}`} />{item.kind === "published" ? t.published : t.lead}</span>
                              {item.kind === "lead" && <span className="text-[9px] text-[#98704d]">{t.leadHint}</span>}
                            </div>
                            <h3 className="m-0 text-[17px] font-extrabold leading-tight tracking-[-.025em] text-[#24453f] sm:text-[18px]">{item.role[language]}</h3>
                            <div className="mt-1 text-[11px] font-semibold text-[#718279]">{item.company[language]}</div>
                            <p className="mb-0 mt-2 max-w-[650px] text-[10px] leading-[1.65] text-[#77877e]">{item.summary[language]}</p>
                            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[9px] text-[#89958c]">
                              <span className="inline-flex items-center gap-1"><LineIcon name="pin" className="h-3 w-3" />{item.location.map((location) => t.locations[location as keyof typeof t.locations]).join(" · ")}</span>
                              <span className="inline-flex items-center gap-1"><LineIcon name="globe" className="h-3 w-3" />{item.mode.map((mode) => t.modes[mode as keyof typeof t.modes]).join(" · ")}</span>
                              <span className="inline-flex items-center gap-1"><LineIcon name="clock" className="h-3 w-3" />{item.freshness[language]}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-4 border-t border-[#eceee8] pt-3 sm:w-[145px] sm:flex-col sm:items-end sm:justify-start sm:border-0 sm:pt-1">
                            <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1.5">
                              <div className="flex items-center gap-2">
                                <div className="relative h-9 w-9">
                                  <svg className="h-9 w-9 -rotate-90" viewBox="0 0 40 40" aria-label={`${item.score}% ${t.match}`}><circle cx="20" cy="20" r="16" fill="none" stroke="#e2e9df" strokeWidth="3" /><circle cx="20" cy="20" r="16" fill="none" stroke="#648e78" strokeWidth="3" strokeDasharray={`${(item.score / 100) * 100.5} 100.5`} strokeLinecap="round" /></svg>
                                  <span className="absolute inset-0 grid place-items-center text-[9px] font-extrabold text-[#41685a]">{item.score}</span>
                                </div>
                                <span className="text-[10px] font-bold text-[#668073] sm:hidden">{t.match}</span>
                              </div>
                              <span className="hidden text-[9px] font-semibold text-[#8a988c] sm:inline">{t.match}</span>
                            </div>
                            <button type="button" onClick={() => toggleNumber(savedIds, setSavedIds, item.id)} aria-pressed={saved} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[10px] font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#52877b] ${saved ? "border-[#c9dbcf] bg-[#eaf1e9] text-[#4a7362]" : "border-[#dce3da] text-[#697d72] hover:bg-[#edf2eb]"}`}><LineIcon name="bookmark" className="h-3.5 w-3.5" />{saved ? t.saved : t.save}</button>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#eef0ea] pt-3">
                          <div className="text-[9px] text-[#8a968d]"><span className="font-bold text-[#75857a]">{t.source}: </span>{item.source[language]}</div>
                          <button type="button" aria-expanded={expanded} onClick={() => toggleNumber(expandedIds, setExpandedIds, item.id)} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold text-[#4d7868] transition hover:bg-[#edf2eb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#52877b]"><LineIcon name="info" className="h-3.5 w-3.5" />{expanded ? t.hideDetails : t.details}<LineIcon name="chevron" className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} /></button>
                        </div>
                        {expanded && <div className="mt-2 grid gap-3 rounded-xl bg-[#f2f5ef] p-3 sm:grid-cols-2 sm:p-4">
                          <div><div className="mb-2 flex items-center gap-1.5 text-[10px] font-extrabold text-[#557b67]"><LineIcon name="check" className="h-3.5 w-3.5" />{t.strengths}</div><ul className="m-0 space-y-1.5 p-0 text-[10px] leading-relaxed text-[#718178]">{item.strengths[language].map((reason) => <li key={reason} className="flex gap-2"><span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-[#83a58d]" />{reason}</li>)}</ul></div>
                          <div><div className="mb-2 flex items-center gap-1.5 text-[10px] font-extrabold text-[#9b7858]"><LineIcon name="info" className="h-3.5 w-3.5" />{t.gaps}</div><ul className="m-0 space-y-1.5 p-0 text-[10px] leading-relaxed text-[#837f71]">{item.gaps[language].map((gap) => <li key={gap} className="flex gap-2"><span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-[#c7a47d]" />{gap}</li>)}</ul></div>
                        </div>}
                      </div>
                    </article>
                  );
                })}
                {filtered.length === 0 && <div className="rounded-[20px] border border-dashed border-[#cbd8ce] bg-[#f9faf5] px-6 py-12 text-center"><span className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-[#e7efe6] text-[#658675]"><LineIcon name="compass" className="h-5 w-5" /></span><h3 className="m-0 text-[14px] font-bold">{t.noResults}</h3><p className="mb-0 mt-1 text-[11px] text-[#829087]">{t.noResultsSub}</p></div>}
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#e7dfd2] bg-[#f8f3e9] px-3.5 py-3 text-[9px] leading-relaxed text-[#897b67]">
                <LineIcon name="info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#b18a61]" /><span>{t.demoNote}</span>
              </div>
            </section>
            <footer id="privacy" className="mt-8 flex flex-col justify-between gap-2 border-t border-[#e0e4dc] pt-4 text-[9px] text-[#929d93] sm:flex-row"><span>{t.footer}</span><span className="inline-flex items-center gap-1.5"><LineIcon name="shield" className="h-3 w-3" />{t.privacyTitle}</span></footer>
          </div>
        </div>
      </div>
    </main>
  );
}
