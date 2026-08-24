import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "./lib/supabaseClient";
import {
  Search, User, ShoppingBag, X, Plus, Minus, Star, ChevronDown, ChevronUp,
  Instagram, Mail, Phone, MapPin, Clock, Trash2, Menu, Heart,
  Leaf, Droplet, Sun, ShieldCheck, Sparkles, ArrowRight, Send, Check,
  LayoutGrid, Package, ClipboardList, MessageSquare, Settings as SettingsIcon,
  DollarSign, Users, TrendingUp, Pencil, Upload, ArrowLeft,
  ImagePlus, CheckCircle2, XCircle, Eye, EyeOff, Copy, Tag, Bell,
  Download, Printer, Layers, Megaphone, FileText, Shield, UserPlus,
  Truck, CreditCard, Percent, Gift, AlertTriangle, Coins, Inbox,
  Palette, SlidersHorizontal, PanelTop, PanelBottom, GripVertical,
  Code2, Link as LinkIcon, Type, Building2, LogOut, Wallet, PackageCheck, Lock, FlaskConical, Scan, ChevronRight
} from "lucide-react";
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid
} from "recharts";

/* ---------------------------------------------------------------
   VIINA — Super Admin Master Control Panel edition.

   Architecture note for future maintenance: `theme`, `layout`,
   `header`, `footer`, `announcement`, `banner`, and `currencySettings`
   are all owned by the root App component and passed down as props.
   Storefront shadows the module-level `palette` / `fontDisplay` /
   `fontBody` with values built from the live `theme` prop, so every
   color/font/section-order/visibility change made in the admin
   Customizer re-renders on the storefront immediately — no rebuild,
   no hardcoded values. There is no backend/database here: state
   lives in memory for the session, same as the rest of this artifact.
   Two explicit simplifications, called out again in Settings:
   - "Drag-and-drop" section reordering is up/down buttons, not a
     literal drag gesture.
   - The Custom JS injector stores the script but does not execute
     it (running arbitrary injected JS would be a real security
     hole); Custom CSS *is* genuinely injected via a <style> tag.
------------------------------------------------------------------ */

const DEFAULT_THEME = {
  cream: "#FBF7F1", creamDeep: "#F3ECE1", beige: "#EAE0D2", nude: "#D9C0A8", nudeDeep: "#C9A883",
  sage: "#6E7C60", sageDeep: "#4F5A44", sageMist: "#DCE3D3", ink: "#2B2620", inkSoft: "#5C554B",
  bronze: "#A67C52", gold: "#B99656", white: "#FFFFFF",
  headingFont: "'Noto Serif Arabic', serif", bodyFont: "'Vazirmatn', sans-serif", logoFont: "'Cinzel', serif",
  fontScale: "متوسط", preset: "مینیمال گرم", customCSS: "", customJS: "",
  /* site-wide defaults for newly created custom pages / blog posts —
     each page can still override any of these individually */
  pageDefaults: { fontSize: "متوسط", textAlign: "right", backgroundColor: "", textColor: "" },
};

const THEME_PRESETS = {
  "مینیمال گرم": { cream: "#FBF7F1", creamDeep: "#F3ECE1", beige: "#EAE0D2", nude: "#D9C0A8", nudeDeep: "#C9A883", sage: "#6E7C60", sageDeep: "#4F5A44", sageMist: "#DCE3D3", ink: "#2B2620", inkSoft: "#5C554B", bronze: "#A67C52", gold: "#B99656", white: "#FFFFFF" },
  "لوکس ناب": { cream: "#F7F1E8", creamDeep: "#EFE4D0", beige: "#E3D2B8", nude: "#CBA876", nudeDeep: "#B8905A", sage: "#5C6B4E", sageDeep: "#33402A", sageMist: "#D8DCC7", ink: "#1E1A14", inkSoft: "#564C3C", bronze: "#8C6A3A", gold: "#C6A15B", white: "#FFFFFF" },
  "پاستلی ملایم": { cream: "#FDF6F8", creamDeep: "#F8ECEF", beige: "#F1E1E6", nude: "#E7C8D6", nudeDeep: "#D9AFC4", sage: "#9FB5AE", sageDeep: "#728A81", sageMist: "#E4EEE8", ink: "#3A2E33", inkSoft: "#7A6870", bronze: "#C99BAE", gold: "#D9B98C", white: "#FFFFFF" },
  "حالت تیره": { cream: "#1C1B19", creamDeep: "#242220", beige: "#3A362F", nude: "#C9A883", nudeDeep: "#B8905A", sage: "#8A9A7E", sageDeep: "#A8B79A", sageMist: "#33392F", ink: "#F3ECE1", inkSoft: "#B7AF9F", bronze: "#C9A15E", gold: "#D4B876", white: "#2A2824" },
};
/* Note: IranSansX / Dana / Yekan Bakh are commercial fonts that require a
   licensed hosting source and can't be pulled from a free CDN here, so the
   Persian options below use the closest freely-licensed, high-quality
   equivalents (Vazirmatn / Noto Serif Arabic / Estedad) already loaded. */
const HEADING_FONT_OPTIONS = [
  { label: "Noto Serif Arabic (سریف لوکس)", value: "'Noto Serif Arabic', serif" },
  { label: "Cormorant Garamond (سریف مد روز، برای عناوین لاتین)", value: "'Cormorant Garamond', 'Noto Serif Arabic', serif" },
  { label: "Estedad (فارسی، هندسی و شیک)", value: "'Estedad', sans-serif" },
  { label: "Lalezar (نمایشی)", value: "'Lalezar', cursive" },
  { label: "Vazirmatn (مدرن بدون‌سریف)", value: "'Vazirmatn', sans-serif" },
];
const BODY_FONT_OPTIONS = [
  { label: "Vazirmatn (پیش‌فرض)", value: "'Vazirmatn', sans-serif" },
  { label: "Estedad", value: "'Estedad', sans-serif" },
  { label: "Noto Serif Arabic", value: "'Noto Serif Arabic', serif" },
];
const LOGO_FONT_OPTIONS = [
  { label: "Cinzel (لوکس، حکاکی‌شده)", value: "'Cinzel', serif" },
  { label: "Cormorant Garamond (ظریف و مد)", value: "'Cormorant Garamond', serif" },
  { label: "Inter (مینیمال مدرن)", value: "'Inter', sans-serif" },
  { label: "Noto Serif Arabic", value: "'Noto Serif Arabic', serif" },
];
const FONT_SCALE_OPTIONS = { "کوچک": 0.92, "متوسط": 1, "بزرگ": 1.1, "خیلی بزرگ": 1.25 };
const PAGE_FONT_SIZE_MAP = { "کوچک": 13.5, "متوسط": 15, "بزرگ": 17, "خیلی بزرگ": 19 };
const TEXT_ALIGN_OPTIONS = [
  { key: "right", label: "راست" }, { key: "center", label: "وسط" },
  { key: "left", label: "چپ" }, { key: "justify", label: "توجیه‌شده" },
];

const DEFAULT_LAYOUT = {
  desktopCols: 4, mobileCols: 2, itemsPerPage: 12,
  showStockQty: false, showLowStock: true, showRatings: true, showReviewCount: true,
  showWishlist: true, showDiscountBadge: true, showQuickView: true,
};
const GRID_COLS_CLASS = {
  "1-3": "grid-cols-1 lg:grid-cols-3", "1-4": "grid-cols-1 lg:grid-cols-4", "1-5": "grid-cols-1 lg:grid-cols-5",
  "2-3": "grid-cols-2 lg:grid-cols-3", "2-4": "grid-cols-2 lg:grid-cols-4", "2-5": "grid-cols-2 lg:grid-cols-5",
};
const ITEMS_PER_PAGE_OPTIONS = [8, 12, 16, 24, "نامحدود"];

const HEADER_LAYOUT_OPTIONS = ["استیکی", "لوگو چپ", "لوگو وسط", "شیشه‌ای شناور", "شفاف روی هیرو"];
const DEFAULT_HEADER = {
  layoutStyle: "استیکی", showSearch: true, showAccount: true, showCart: true,
  navLinks: [
    { label: "خانه", href: "#home" }, { label: "فروشگاه", href: "#shop" }, { label: "دسته‌بندی‌ها", href: "#categories" },
    { label: "درباره ما", href: "#about" }, { label: "نظرات", href: "#reviews" }, { label: "تماس با ما", href: "#contact" },
  ],
};
const DEFAULT_ANNOUNCEMENT = { enabled: false, text: "", bg: "#4F5A44", color: "#FFFFFF", link: "#shop" };

const DEFAULT_FOOTER = {
  col1Title: "VIINA", col1Text: "۱۰٪ تخفیف برای اولین خرید بگیرید، به‌علاوه دسترسی زودهنگام به کالکشن‌های تازه.",
  col2Title: "فروشگاه", col2Links: [{ label: "محصولات", href: "#shop" }, { label: "دسته‌بندی‌ها", href: "#categories" }],
  col3Title: "خدمات مشتریان", col3Links: [{ label: "حریم خصوصی", href: "#" }, { label: "شرایط استفاده", href: "#" }, { label: "قوانین ارسال", href: "#" }, { label: "قوانین بازگشت کالا", href: "#" }],
  col4Title: "تماس با ما", contactEmail: "hello@viina.co", contactPhone: "+98 21 9100 0000", contactAddress: "تهران، ایران",
  social: { instagram: "", tiktok: "", telegram: "", whatsapp: "", youtube: "", pinterest: "" },
  socialEnabled: { instagram: true, tiktok: true, telegram: false, whatsapp: false, youtube: false, pinterest: true },
  copyright: "© 2026 ویینا اسکین‌کر — تمامی حقوق محفوظ است.",
  showPaymentBadges: true,
};

const DEFAULT_BANNER = { enabled: false, image: "", text: "", link: "#shop" };
const DEFAULT_WELCOME_MODAL = {
  enabled: true,
  headlineFa: "به وینا خوش آمدید",
  headlineEn: "Welcome to VIINA",
  subtitle: "تجربه‌ای ناب از شادابی و درخشش طبیعی پوست",
  ctaText: "شروع تجربه شادابی",
  image: "", imageWidth: 132, imageHeight: 132,
};

const DEFAULT_AUTH_SETTINGS = {
  mascotEnabled: true,
  showGoogleButton: true,
  backgroundStyle: "aura", // "aura" | "minimal"
  loginHeading: "خوش برگشتید",
  loginSubtitle: "برای ادامه خرید وارد حساب کاربری خود شوید.",
  signupHeading: "به ویینا بپیوندید",
  signupSubtitle: "چند لحظه‌ای تا شروع تجربه ویینا فاصله دارید.",
};

/* Admin identity now lives entirely in Supabase Auth (see
   AdminLoginPage) — real server-verified auth, not a client-side
   compared value like this build used to have. */

const DEFAULT_QUIZ_SETTINGS = {
  enabled: true,
  buttonText: "مشاوره هوشمند پوست",
};
/* seeded with a sensible 3-question starting point (skin type, main
   concern, age range) so the quiz isn't blank on first load — every
   question, option, and the result bundles below are fully editable
   from the admin panel */
const DEFAULT_QUIZ_QUESTIONS = [
  { id: "q-skin", question: "نوع پوست شما چیست؟", options: [
    { id: "o-dry", label: "خشک", resultId: "" }, { id: "o-oily", label: "چرب", resultId: "" },
    { id: "o-combo", label: "مختلط", resultId: "" }, { id: "o-sensitive", label: "حساس", resultId: "" },
  ] },
  { id: "q-concern", question: "مهم‌ترین دغدغه پوستی شما؟", options: [
    { id: "o-hydration", label: "آبرسانی و کم‌آبی", resultId: "" }, { id: "o-aging", label: "چین‌وچروک و ضدپیری", resultId: "" },
    { id: "o-glow", label: "کدری و کم‌نوری پوست", resultId: "" }, { id: "o-irritation", label: "حساسیت و التهاب", resultId: "" },
  ] },
  { id: "q-age", question: "محدوده سنی شما؟", options: [
    { id: "o-a1", label: "زیر ۲۵", resultId: "" }, { id: "o-a2", label: "۲۵ تا ۳۵", resultId: "" },
    { id: "o-a3", label: "۳۵ تا ۴۵", resultId: "" }, { id: "o-a4", label: "بالای ۴۵", resultId: "" },
  ] },
];
/* the routine/bundle a given final answer resolves to — starts empty;
   the admin links products to each result and the last question's
   options to a result via the Quiz Builder */
const DEFAULT_QUIZ_RESULTS = [];

const DEFAULT_REWARDS_SETTINGS = {
  enabled: true,
  clubName: "باشگاه درخشش ویینا",
  earnRatePct: 5,
};

const HOME_SECTIONS_DEFAULT = [
  { key: "hero", label: "بخش هیرو", visible: true },
  { key: "banner", label: "بنر تبلیغاتی", visible: true },
  { key: "bestsellers", label: "اسلایدر پرفروش‌ترین‌ها", visible: true },
  { key: "categories", label: "دسته‌بندی‌ها (گالری نامتقارن)", visible: true },
  { key: "concerns", label: "خرید بر اساس نیاز پوستی", visible: true },
  { key: "routine", label: "تکمیل روتین (Cleanser+Serum+Cream)", visible: true },
  { key: "bundles", label: "بسته‌های روتین کامل", visible: true },
  { key: "glowSlider", label: "اسلایدر پیش/پس از درخشش پوست", visible: true },
  { key: "ingredients", label: "دایره‌المعارف ترکیبات", visible: true },
  { key: "shop", label: "همه محصولات", visible: true },
  { key: "about", label: "درباره ما", visible: true },
  { key: "reviews", label: "نظرات مشتریان", visible: true },
  { key: "trust", label: "ضمانت اصالت و اعتماد", visible: true },
  { key: "journal", label: "ژورنال ویینا", visible: true },
  { key: "contact", label: "تماس و سوالات متداول", visible: true },
];

/* ---------------- currency & digit formatting ---------------- */

const CURRENCY_OPTIONS = [
  { code: "toman", labels: ["تومان", "تومان ایران", "Toman"] },
  { code: "usd", labels: ["$"] },
];
const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
function toPersianDigits(str) {
  return String(str).replace(/[0-9]/g, (d) => FA_DIGITS[d]);
}
function formatPrice(amount, settings) {
  const s = settings || { currency: "toman", digitStyle: "en", currencyLabel: "تومان" };
  const n = Math.round(Number(amount) || 0);
  let formatted = n.toLocaleString("en-US");
  if (s.digitStyle === "fa") formatted = toPersianDigits(formatted);
  if (s.currency === "usd") return `$${formatted}`;
  return `${formatted} ${s.currencyLabel || "تومان"}`;
}

/* ---------------- static reference data (not store content) ---------------- */

const SKIN_TAG_OPTIONS = ["خشک", "چرب", "حساس", "مختلط", "بالغ", "همه پوست‌ها"];
const SKIN_CONCERN_OPTIONS = [
  { key: "جوش و منافذ", icon: Droplet, blurb: "کنترل چربی و پاک‌سازی منافذ" },
  { key: "لک و تیرگی", icon: Sun, blurb: "روشن‌کننده و یکنواخت‌کننده رنگ پوست" },
  { key: "دهیدراته و خشکی", icon: Leaf, blurb: "آبرسانی عمیق و تقویت سد پوستی" },
  { key: "چروک و جوانسازی", icon: Sparkles, blurb: "ضد چروک و افزایش شادابی پوست" },
];
const PRODUCT_TAG_OPTIONS = ["جدید", "پرفروش‌ترین‌ها", "ضد پیری", "آبرسانی"];
const CATEGORY_ICON_OPTIONS = [
  { key: "droplet", icon: Droplet }, { key: "sparkles", icon: Sparkles }, { key: "leaf", icon: Leaf },
  { key: "sun", icon: Sun }, { key: "shield", icon: ShieldCheck }, { key: "tag", icon: Tag },
];
const ORDER_STATUS_OPTIONS = ["در انتظار", "در حال پردازش", "ارسال شد", "تحویل داده شد", "لغو شده", "بازپرداخت شده"];
const PAYMENT_STATUS_OPTIONS = ["پرداخت‌شده", "در انتظار", "ناموفق"];
const REVIEW_STATUS_OPTIONS = ["تأیید شده", "در انتظار بررسی", "رد شده"];

const PAYMENT_METHODS_DEFAULT = ["کارت اعتباری (زرین‌پال)", "پی‌پال", "استرایپ", "اپل‌پی", "پرداخت در محل (COD)"];
const SHIPPING_REGIONS_DEFAULT = [{ region: "داخل کشور", rate: 150000 }, { region: "بین‌المللی", rate: 900000 }];
const NOTIFICATION_TEMPLATES_DEFAULT = [
  { name: "تأیید سفارش", subject: "سفارش شما ثبت شد", enabled: true },
  { name: "به‌روزرسانی ارسال", subject: "سفارش شما ارسال شد", enabled: true },
  { name: "ایمیل خوش‌آمدگویی", subject: "به ویینا خوش آمدید", enabled: false },
];
const DEFAULT_AUTH_LINKS = { signIn: "#", signUp: "#", forgotPassword: "#", accountDashboard: "#" };

const FAQS_DEFAULT = [
  { q: "ارسال سفارش چقدر طول می‌کشد؟", a: "سفارش‌ها ظرف ۱ تا ۲ روز کاری ارسال می‌شوند. تحویل استاندارد داخل کشور ۳ تا ۵ روز کاری و برای آدرس‌های بین‌المللی ۷ تا ۱۲ روز کاری طول می‌کشد." },
  { q: "قوانین بازگشت کالا چگونه است؟", a: "بازگشت کالاهای باز نشده تا ۳۰ روز پس از تحویل امکان‌پذیر است. اگر محصولی با پوست شما سازگار نبود، با ما تماس بگیرید تا به‌صورت موردی بررسی کنیم." },
  { q: "چطور بفهمم کدام محصولات برای نوع پوستم مناسب است؟", a: "در صفحه هر محصول، نشان نوع پوست و نگرانی‌های اصلی ذکر شده است. اگر مطمئن نیستید، تیم پشتیبانی ما می‌تواند با چند سؤال کوتاه یک روتین مناسب پیشنهاد دهد." },
  { q: "آیا محصولات ویینا فاقد آزمایش حیوانی هستند؟", a: "بله. تمام محصولات گلچین‌شده در ویینا فاقد آزمایش حیوانی هستند و بیشتر آن‌ها گیاهی (وگان) نیز هستند. فهرست کامل ترکیبات روی صفحه هر محصول درج شده است." },
  { q: "آیا می‌توانم سفارشم را پیگیری کنم؟", a: "به‌محض ارسال سفارش، لینک رهگیری از طریق ایمیل برای شما ارسال می‌شود و می‌توانید وضعیت را هر زمان از حساب کاربری خود بررسی کنید." },
];
const HERO_CMS_DEFAULT = {
  headline: "پوست خود را با ظرافتی ناب پرورش دهید",
  subtitle: "گیاهان ارگانیک، پشتیبانی‌شده با تحقیقات پوستی. هر قلم از کالکشن ویینا برای بازگرداندن تعادل طبیعی پوست شما دستچین شده.",
  ctaText: "مشاهده محصولات", ctaLink: "#shop", bgImage: "", imageWidth: 420, imageHeight: 420,
};

/* ================================================================
   Dynamic routing — Super Admin "Page & Category Routing" system.
   `slugify` normalizes any admin-entered title into a safe, unique
   URL segment (keeps Persian + Latin letters/digits, everything
   else becomes a hyphen) so newly created pages/categories always
   get a working #/page/<slug> or #/category/<slug> route the moment
   they're saved — no hardcoded route list to maintain.
================================================================= */
function slugify(str) {
  return String(str || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
function uniqueSlug(base, existingSlugs) {
  let candidate = slugify(base) || "page";
  let i = 2;
  while (existingSlugs.includes(candidate)) { candidate = `${slugify(base) || "page"}-${i}`; i += 1; }
  return candidate;
}

/* ================================================================
   SEO — dynamic <head> management + Schema.org JSON-LD injection.
   Pure DOM helpers (no React state): they find-or-create the tag
   they own and only ever touch that one tag, so multiple calls
   across re-renders update in place instead of duplicating. Safe
   to call during SSR-less client rendering only (guarded by the
   `typeof document` check for defensive robustness).
================================================================= */
const BRAND_NAME = "VIINA";
function upsertMetaTag(attr, key, content) {
  if (typeof document === "undefined" || !content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute("content", content);
}
function upsertLinkTag(rel, href) {
  if (typeof document === "undefined" || !href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) { el = document.createElement("link"); el.setAttribute("rel", rel); document.head.appendChild(el); }
  el.setAttribute("href", href);
}
function upsertJsonLd(id, data) {
  if (typeof document === "undefined") return;
  let el = document.getElementById(id);
  if (!data) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement("script"); el.type = "application/ld+json"; el.id = id; document.head.appendChild(el); }
  el.textContent = JSON.stringify(data);
}
/* Auto-generated, high-converting SEO meta description: brand +
   the product's own luxury-retailer copy + targeted skin type. */
function buildProductSeoDescription(p) {
  if (!p) return "";
  const benefit = (p.shortDescription || p.description || "").trim();
  const skin = (p.skinTags && p.skinTags.length) ? `مناسب پوست ${p.skinTags.join("، ")}` : "";
  const parts = [
    `خرید ${p.name} از ${BRAND_NAME}`,
    benefit,
    skin,
    "کالکشن لوکس گلچین‌شده با ضمانت ۱۰۰٪ اصالت کالا و ارسال سریع.",
  ].filter(Boolean);
  return parts.join(" — ").slice(0, 300);
}
/* Search-optimized alt/aria-label text combining product name,
   brand, and primary category — used both for real <img> tags and
   as the accessible name of the decorative product illustration. */
function buildProductAltText(p, categories) {
  if (!p) return "";
  const cat = (categories || []).find((c) => c.id === p.category);
  return [p.name, cat ? cat.name : "", `خرید از ${BRAND_NAME}`].filter(Boolean).join(" - ");
}

/* ================================================================
   Supabase persistence layer.
   Every admin-editable content slice (products, theme, header, the
   custom pages, etc.) is stored as ONE ROW in a single `site_content`
   table: { id: '<slice key>', data: <jsonb>, updated_at }. This is a
   deliberately simple "site config as JSON" schema rather than a
   fully normalized relational one — it maps directly onto the app's
   existing useState shape, so every admin screen keeps working with
   zero UI changes, and it's easy to reason about and back up.

   NOT stored here: `cart`/`user` (per-visitor session state, not
   site content) and admin credentials (see AdminLoginPage — auth is
   handled by real Supabase Auth, never by a row a visitor could read
   with the public anon key).
================================================================= */
async function fetchAllSiteContent() {
  const map = {};
  try {
    const { data, error } = await supabase.from("site_content").select("id, data");
    if (error) throw error;
    (data || []).forEach((row) => { map[row.id] = row.data; });
  } catch (err) {
    /* Table missing, offline, or Supabase not configured yet — the app
       still works using each slice's local default; nothing crashes. */
    console.error("VIINA: could not load site content from Supabase, using defaults.", err);
  }
  return map;
}
/* Drop-in useState replacement for admin-editable content: reads its
   initial value from the bulk fetch above (so there's no flash of
   default content) and debounce-saves every change back to its own
   `site_content` row. The very first write (the initial hydration) is
   skipped so loading data never immediately re-triggers a save. */
function useSyncedState(key, initialValue) {
  const [value, setValue] = useState(initialValue);
  const skipNextSave = useRef(true);
  useEffect(() => {
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    const t = setTimeout(() => {
      supabase.from("site_content").upsert({ id: key, data: value, updated_at: new Date().toISOString() })
        .then(({ error }) => { if (error) console.error(`VIINA: could not save "${key}" to Supabase.`, error); });
    }, 600); /* debounced so fast typing doesn't fire a write per keystroke */
    return () => clearTimeout(t);
  }, [key, value]);
  return [value, setValue];
}

const DEFAULT_CUSTOM_PAGES = [
  {
    id: "page-journal-1", title: "۳ اشتباه رایج در روتین شب که مانع درخشش پوست می‌شود", slug: "3-common-night-routine-mistakes",
    navLabel: "ژورنال", isJournal: true, fontSize: "", textAlign: "", backgroundColor: "", textColor: "",
    content: "شست‌وشوی ناکافی، رد شدن از مرحله سرم، و استفاده نکردن از کرم شب مناسب نوع پوست، سه اشتباهی هستند که بیشتر افراد بدون آگاهی مرتکب می‌شوند.\n\nپوست در طول شب فرصت بازسازی طبیعی خود را دارد؛ اگر این مراحل به‌درستی طی نشوند، این فرآیند به‌طور کامل اتفاق نمی‌افتد. برای شروع، پاک‌سازی دوگانه (Double Cleansing) را امتحان کنید و سپس سرم را روی پوست کاملاً تمیز و خشک اعمال کنید.\n\nدر پایان، کرم شب را به‌عنوان مهر و موم‌کننده رطوبت و ترکیبات فعال روی پوست بزنید تا در طول شب اثرگذار باشند.",
  },
  {
    id: "page-journal-2", title: "راهنمای انتخاب سرم مناسب برای هر نوع پوست", slug: "how-to-choose-the-right-serum",
    navLabel: "ژورنال", isJournal: true, fontSize: "", textAlign: "", backgroundColor: "", textColor: "",
    content: "انتخاب سرم مناسب می‌تواند نتیجه روتین پوستی شما را کاملاً متحول کند. برای پوست‌های خشک، به‌دنبال ترکیباتی مانند هیالورونیک اسید و سراماید باشید.\n\nپوست‌های چرب و مستعد جوش معمولاً به سرم‌های حاوی نیاسینامید یا سالیسیلیک اسید بهتر پاسخ می‌دهند. برای لک و تیرگی، ویتامین C و آربوتین گزینه‌های شناخته‌شده‌ای هستند.\n\nهمیشه پیش از افزودن یک ترکیب فعال جدید، آن را روی بخش کوچکی از پوست تست کنید و به‌آرامی وارد روتین خود کنید.",
  },
  {
    id: "page-journal-3", title: "گلس اسکین در خانه؛ از کجا شروع کنیم؟", slug: "glass-skin-at-home",
    navLabel: "ژورنال", isJournal: true, fontSize: "", textAlign: "", backgroundColor: "", textColor: "",
    content: "افکت «گلس اسکین» نتیجه آبرسانی لایه‌به‌لایه و پوستی صاف و بدون منافذ باز است. این روند با پاک‌سازی ملایم شروع می‌شود، سپس تونر آبرسان، اسنس، و در نهایت سرم و مرطوب‌کننده به ترتیب غلظت اعمال می‌شوند.\n\nقانون طلایی این است: از سبک‌ترین بافت به سنگین‌ترین بافت حرکت کنید تا هر لایه به‌درستی جذب پوست شود.\n\nبا استفاده مداوم طی ۲ تا ۴ هفته، پوست شما شفافیت و درخشش بیشتری پیدا می‌کند.",
  },
];
/* Starter routine bundles — admin selects real products for each from
   the "بسته‌های روتین" tab; titles/discount are pre-filled as a template. */
const DEFAULT_BUNDLES = [
  { id: "bundle-1", title: "روتین پایه پوست چرب", slug: "routine-oily-skin-basics", description: "پاک‌کننده، تونر کنترل‌چربی و سرم سبک — سه قدم ساده برای پوست شاداب و بدون براقی اضافه.", discountPercent: 15, productIds: [] },
  { id: "bundle-2", title: "پک آبرسانی عمیق گلاس اسکین", slug: "glass-skin-hydration-set", description: "ترکیبی از تونر آبرسان، سرم هیالورونیک و کرم مرطوب‌کننده برای پوستی صاف و درخشان.", discountPercent: 20, productIds: [] },
];

/* ---------------- shared helpers (theme-agnostic) ---------------- */

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, visible];
}
function Reveal({ children, className = "", delay = 0 }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(32px) scale(0.98)",
        transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
/* a fluid blur-to-focus reveal for section headlines specifically —
   kept separate from Reveal (used on every grid card) since animating
   filter:blur on dozens of simultaneous elements would be costly */
function RevealHeading({ children, className = "", delay = 0 }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(22px)",
        filter: visible ? "blur(0px)" : "blur(6px)",
        transition: `opacity 1s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 1s cubic-bezier(0.16,1,0.3,1) ${delay}s, filter 1s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
/* subtle scroll-linked parallax offset, capped so it never runs away on long pages */
function useParallax(factor = 0.15) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setOffset(Math.min(window.scrollY * factor, 120));
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [factor]);
  return offset;
}
/* faint pearlescent glow — a soft blurred gradient blob for ambient luxury backdrop */
function GlowBlob({ colors, style, className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute rounded-full ${className}`}
      style={{ background: `radial-gradient(circle, ${colors[0]} 0%, ${colors[1]} 45%, transparent 72%)`, filter: "blur(60px)", opacity: 0.55, ...style }}
    />
  );
}
/* click-and-drag horizontal scroll for desktop mouse — native browser
   scrolling already handles touch/trackpad swipe, this just adds the
   same feel for a mouse drag */
function useDragScroll() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let isDown = false, startX = 0, startScroll = 0, moved = false;
    function onDown(e) { isDown = true; moved = false; startX = e.pageX; startScroll = el.scrollLeft; el.style.cursor = "grabbing"; }
    function onMove(e) {
      if (!isDown) return;
      const dx = e.pageX - startX;
      if (Math.abs(dx) > 4) moved = true;
      el.scrollLeft = startScroll - dx;
    }
    function onUp() { isDown = false; el.style.cursor = "grab"; }
    function onClickCapture(e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }
    el.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    el.addEventListener("click", onClickCapture, true);
    return () => {
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      el.removeEventListener("click", onClickCapture, true);
    };
  }, []);
  return ref;
}
function Bottle({ tint, ink, white, label }) {
  return (
    <div className="relative flex flex-col items-center" style={{ filter: "drop-shadow(0 10px 18px rgba(43,38,32,0.15))" }} role={label ? "img" : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : "true"}>
      <div className="rounded-sm" style={{ width: 14, height: 10, background: ink, opacity: 0.75 }} />
      <div className="rounded-sm" style={{ width: 20, height: 6, background: ink, opacity: 0.55, marginTop: 1 }} />
      <div className="rounded-2xl" style={{ width: 54, height: 78, background: `linear-gradient(155deg, ${white}CC, ${tint})`, border: `1px solid ${white}66` }} />
    </div>
  );
}
function Stars({ rating, size = 14, color = "#A67C52" }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} style={{ color, fill: i <= Math.round(rating) ? color : "transparent" }} />)}
    </div>
  );
}
function EmptyState({ icon: Icon, title, subtitle, actionLabel, onAction, compact, palette }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "py-10 px-5" : "py-16 px-6"} rounded-3xl`} style={{ background: palette.white, border: `1px dashed ${palette.beige}` }}>
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: palette.creamDeep }}>
        <Icon size={22} style={{ color: palette.sageDeep }} />
      </div>
      <p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 18, color: palette.ink }} className="mb-1.5">{title}</p>
      {subtitle && <p style={{ color: palette.inkSoft, fontSize: 13.5 }} className="max-w-sm mb-5">{subtitle}</p>}
      {actionLabel && onAction && (
        <button onClick={onAction} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium" style={{ background: palette.sageDeep, color: palette.white }}>
          <Plus size={15} /> {actionLabel}
        </button>
      )}
    </div>
  );
}

/* first-visit welcome overlay — dismissal is remembered via the
   artifact's persistent key/value storage (best-effort; if storage
   isn't available it just falls back to showing once per page load) */
function WelcomeModal({ config, theme, onDismiss }) {
  const palette = theme;
  const [ripples, setRipples] = useState([]);
  const [closing, setClosing] = useState(false);

  function fireRipple(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 650);
  }
  function handleClose() {
    setClosing(true);
    setTimeout(onDismiss, 320);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <style>{`
        @keyframes welcomeFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes welcomeFadeOut { from { opacity:1 } to { opacity:0 } }
        @keyframes welcomeScaleIn { 0% { opacity:0; transform: translateY(28px) scale(0.92);} 100% { opacity:1; transform: translateY(0) scale(1);} }
        @keyframes welcomeScaleOut { 0% { opacity:1; transform: translateY(0) scale(1);} 100% { opacity:0; transform: translateY(16px) scale(0.95);} }
        @keyframes staggerUp { from { opacity:0; transform: translateY(14px);} to { opacity:1; transform: translateY(0);} }
        @keyframes mascotFloat { 0%,100% { transform: translateY(0) rotate(-2deg);} 50% { transform: translateY(-16px) rotate(2deg);} }
        @keyframes dropPulse { 0%,100% { border-radius: 42% 58% 65% 35% / 45% 40% 60% 55%; } 50% { border-radius: 58% 42% 45% 55% / 40% 55% 45% 60%; } }
        @keyframes glossSheen { 0% { transform: translateX(-120%) rotate(20deg);} 100% { transform: translateX(220%) rotate(20deg);} }
        @keyframes ambientDrift { 0% { transform: translateY(0) scale(1); opacity: 0.35; } 50% { opacity: 0.75; } 100% { transform: translateY(-90px) scale(1.3); opacity: 0; } }
        @keyframes rippleExpand { from { transform: scale(0); opacity: 0.45; } to { transform: scale(14); opacity: 0; } }
        .welcome-particle { animation: ambientDrift linear infinite; }
        .welcome-stagger { opacity: 0; animation: staggerUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards; }
        .welcome-cta { position: relative; overflow: hidden; }
        .welcome-ripple { position: absolute; border-radius: 9999px; background: rgba(255,255,255,0.55); pointer-events: none; animation: rippleExpand 0.65s ease-out forwards; width: 16px; height: 16px; margin-left: -8px; margin-top: -8px; }
      `}</style>

      <div className="absolute inset-0 backdrop-blur-md" style={{ background: `${palette.ink}9E`, animation: `${closing ? "welcomeFadeOut" : "welcomeFadeIn"} 0.5s ease forwards` }} onClick={handleClose} />

      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden backdrop-blur-xl border"
        style={{
          background: `${palette.cream}B3`,
          borderColor: `${palette.white}55`,
          boxShadow: `0 50px 120px -24px ${palette.ink}70, inset 0 1px 0 ${palette.white}66`,
          animation: `${closing ? "welcomeScaleOut" : "welcomeScaleIn"} 0.5s cubic-bezier(0.16,1,0.3,1) forwards`,
        }}
      >
        {/* ambient glow field behind the glass, visible through the blur */}
        <div className="pointer-events-none absolute -top-24 -right-16 w-64 h-64 rounded-full" style={{ background: `radial-gradient(circle, ${palette.sage}88, transparent 70%)`, filter: "blur(30px)" }} />
        <div className="pointer-events-none absolute -bottom-24 -left-16 w-64 h-64 rounded-full" style={{ background: `radial-gradient(circle, ${palette.nude}88, transparent 70%)`, filter: "blur(30px)" }} />
        {[
          { top: "14%", left: "18%", size: 6, dur: 6, delay: 0 },
          { top: "60%", left: "10%", size: 4, dur: 7.5, delay: 1.1 },
          { top: "24%", left: "82%", size: 5, dur: 6.8, delay: 0.5 },
          { top: "72%", left: "78%", size: 7, dur: 8.2, delay: 1.8 },
          { top: "44%", left: "50%", size: 4, dur: 5.5, delay: 2.4 },
        ].map((d, i) => (
          <span key={i} aria-hidden="true" className="welcome-particle pointer-events-none absolute rounded-full" style={{ top: d.top, left: d.left, width: d.size, height: d.size, background: palette.white, boxShadow: `0 0 10px ${palette.white}`, animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s` }} />
        ))}

        <button onClick={handleClose} className="absolute top-4 left-4 z-20 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-transform hover:scale-110" style={{ background: `${palette.white}55`, border: `1px solid ${palette.white}66` }} aria-label="بستن">
          <X size={15} color={palette.ink} />
        </button>

        <div className="relative z-10 flex flex-col items-center text-center px-8 pt-14 pb-10">
          {/* configurable image, or the 3D-styled droplet + glass bottle mascot as fallback */}
          {config.image ? (
            <div className="mb-7"><AnimatedHeroImage src={config.image} width={config.imageWidth} height={config.imageHeight} palette={palette} rounded="1.75rem" /></div>
          ) : (
            <div className="relative mb-7" style={{ width: 132, height: 132, animation: "mascotFloat 5s ease-in-out infinite" }}>
              <div className="pointer-events-none absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, ${palette.sage}55, transparent 68%)`, filter: "blur(18px)" }} />
              {/* organic glowing droplet */}
              <div
                className="absolute"
                style={{
                  width: 96, height: 96, top: 10, left: 18,
                  background: `linear-gradient(150deg, ${palette.white}EE, ${palette.sageMist}CC 55%, ${palette.sage}99)`,
                  border: `1px solid ${palette.white}AA`,
                  boxShadow: `0 18px 34px -10px ${palette.sageDeep}55, inset -6px -6px 14px ${palette.sageDeep}22, inset 6px 6px 14px ${palette.white}AA`,
                  animation: "dropPulse 6s ease-in-out infinite",
                }}
              />
              {/* glass serum bottle, offset in front of the droplet */}
              <div className="absolute" style={{ width: 40, height: 66, right: 8, bottom: 4 }}>
                <div className="mx-auto rounded-sm" style={{ width: 16, height: 9, background: `${palette.ink}CC` }} />
                <div className="relative overflow-hidden rounded-2xl mt-0.5" style={{ width: 40, height: 56, background: `linear-gradient(155deg, ${palette.white}CC, ${palette.bronze}55)`, border: `1px solid ${palette.white}AA`, boxShadow: `0 12px 24px -8px ${palette.ink}44` }}>
                  <div className="absolute inset-x-0 bottom-0" style={{ height: "45%", background: `linear-gradient(0deg, ${palette.bronze}77, transparent)` }} />
                  <div className="absolute" style={{ width: 10, height: "140%", top: "-20%", left: 4, background: `${palette.white}99`, transform: "rotate(20deg)", animation: "glossSheen 3.2s ease-in-out infinite" }} />
                </div>
              </div>
            </div>
          )}

          <h2 className="welcome-stagger mb-1" style={{ fontFamily: theme.headingFont, fontWeight: 700, fontSize: 27, color: palette.ink, lineHeight: 1.5, animationDelay: "0.15s" }}>{config.headlineFa}</h2>
          <p className="welcome-stagger mb-4" style={{ fontFamily: theme.bodyFont, fontSize: 12.5, fontWeight: 500, color: palette.sageDeep, letterSpacing: "0.14em", animationDelay: "0.28s" }} dir="ltr">
            {config.headlineEn?.toUpperCase()}
          </p>
          <p className="welcome-stagger max-w-xs mb-8" style={{ color: palette.inkSoft, fontSize: 14.5, lineHeight: 1.9, animationDelay: "0.4s" }}>{config.subtitle}</p>

          <button
            onMouseDown={fireRipple}
            onClick={handleClose}
            className="welcome-cta welcome-stagger rounded-full px-9 py-3.5 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: `linear-gradient(120deg, ${palette.sageDeep}, ${palette.sage})`,
              color: palette.white,
              boxShadow: `0 16px 36px -10px ${palette.sageDeep}99`,
              animationDelay: "0.52s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 20px 44px -8px ${palette.sageDeep}CC`; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = `0 16px 36px -10px ${palette.sageDeep}99`; }}
          >
            {ripples.map((r) => <span key={r.id} className="welcome-ripple" style={{ left: r.x, top: r.y }} />)}
            {config.ctaText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* illustrative "AI visual skin analysis" — a fully client-side
   simulation: user picks a photo (never uploaded anywhere), a short
   loading state plays, then an illustrative mock report is shown
   along with a routine pulled from real store products. No real
   image analysis takes place. */
function AiSkinScannerModal({ palette, headingFont, products, fmt, onAddToCart, onClose }) {
  const [step, setStep] = useState("start"); // start | analyzing | result
  const [previewSrc, setPreviewSrc] = useState("");
  const scores = { hydration: 62, oil: 45, redness: 30, wrinkles: 22 };
  const suggested = products.slice(0, 3);

  function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreviewSrc(reader.result);
    reader.readAsDataURL(file);
  }
  function runScan() {
    setStep("analyzing");
    setTimeout(() => setStep("result"), 1800);
  }
  const ScoreBar = ({ label, value }) => (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1"><span style={{ fontSize: 12.5, color: palette.inkSoft }}>{label}</span><span style={{ fontSize: 12.5, color: palette.ink, fontWeight: 600 }}>{value}٪</span></div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: palette.creamDeep }}><div className="h-full rounded-full" style={{ width: `${value}%`, background: palette.sageDeep }} /></div>
    </div>
  );
  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: `${palette.ink}90` }} onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl p-6" style={{ background: palette.white, maxHeight: "88vh", overflowY: "auto" }}>
        <button onClick={onClose} className="absolute top-4 left-4" aria-label="بستن"><X size={18} style={{ color: palette.inkSoft }} /></button>
        <div className="flex items-center gap-2 mb-1"><Sparkles size={16} style={{ color: palette.sageDeep }} /><p style={{ fontFamily: headingFont, fontSize: 19, color: palette.ink }}>تحلیل هوشمند پوست</p></div>
        <p style={{ fontSize: 12, color: palette.inkSoft }} className="mb-5">یک شبیه‌سازی از تحلیل بصری پوست — نتیجه صرفاً جنبه آموزشی و پیشنهادی دارد.</p>

        {step === "start" && (
          <div className="flex flex-col items-center gap-4">
            <label className="w-full aspect-square max-w-[220px] rounded-3xl flex flex-col items-center justify-center gap-2 cursor-pointer border-2 border-dashed" style={{ borderColor: palette.beige, background: palette.creamDeep, overflow: "hidden" }}>
              {previewSrc ? <img src={previewSrc} alt="پیش‌نمایش عکس آپلودشده برای تحلیل پوست" className="w-full h-full object-cover" /> : (
                <>
                  <ImagePlus size={26} style={{ color: palette.sageDeep }} />
                  <span style={{ fontSize: 12, color: palette.inkSoft }}>آپلود عکس پوست</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
            <button onClick={runScan} className="w-full rounded-full py-3 text-sm font-medium" style={{ background: palette.sageDeep, color: palette.white }}>شروع اسکن</button>
          </div>
        )}

        {step === "analyzing" && (
          <div className="flex flex-col items-center gap-4 py-10">
            <div className="w-14 h-14 rounded-full border-4 animate-spin" style={{ borderColor: palette.creamDeep, borderTopColor: palette.sageDeep }} />
            <p style={{ fontSize: 13.5, color: palette.inkSoft }}>در حال تحلیل تصویر…</p>
          </div>
        )}

        {step === "result" && (
          <div>
            <div className="mb-5">
              <ScoreBar label="رطوبت پوست" value={scores.hydration} />
              <ScoreBar label="چربی پوست" value={scores.oil} />
              <ScoreBar label="قرمزی و التهاب" value={scores.redness} />
              <ScoreBar label="خطوط ریز و چروک" value={scores.wrinkles} />
            </div>
            <p style={{ fontFamily: headingFont, fontSize: 15, color: palette.ink }} className="mb-3">روتین پیشنهادی</p>
            {suggested.length === 0 ? (
              <p style={{ fontSize: 12.5, color: palette.inkSoft }}>پس از افزودن محصول به فروشگاه، پیشنهادها اینجا نمایش داده می‌شود.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {suggested.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-2xl p-2.5" style={{ background: palette.creamDeep }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${p.tint}55` }}><Bottle tint={p.tint} ink={palette.ink} white={palette.white} label={`${p.name} - خرید از ${BRAND_NAME}`} /></div>
                    <div className="flex-1 min-w-0"><p style={{ fontSize: 13, color: palette.ink }} className="truncate">{p.name}</p><p style={{ fontSize: 11.5, color: palette.inkSoft }}>{fmt(p.salePrice || p.price)}</p></div>
                    <button onClick={() => onAddToCart(p.id)} className="rounded-full px-3 py-1.5 text-[11px] font-medium shrink-0" style={{ background: palette.sageDeep, color: palette.white }}>افزودن</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


function GlowCompareSlider({ palette }) {
  const [pos, setPos] = useState(55);
  return (
    <div className="relative w-full max-w-2xl mx-auto rounded-[2rem] overflow-hidden select-none" style={{ aspectRatio: "16/9", boxShadow: `0 30px 70px -20px ${palette.ink}40` }}>
      <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 40% 35%, ${palette.beige}, ${palette.inkSoft}66 70%)`, filter: "saturate(0.55) brightness(0.9)" }} />
      <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 45% 35%, ${palette.white}, ${palette.nude} 55%, ${palette.sageMist} 100%)`, clipPath: `inset(0 0 0 ${100 - pos}%)`, transition: "clip-path 0.05s linear" }}>
        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 55% 35%, ${palette.white}CC, transparent 45%)`, mixBlendMode: "overlay" }} />
      </div>
      <div className="absolute inset-y-0 pointer-events-none" style={{ left: `${pos}%`, width: 2, background: palette.white, boxShadow: "0 0 12px rgba(0,0,0,0.35)" }} />
      <div className="absolute top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center shadow-lg pointer-events-none" style={{ left: `calc(${pos}% - 22px)`, background: palette.white }}>
        <div className="flex gap-0.5"><ChevronDown size={12} style={{ color: palette.sageDeep, transform: "rotate(90deg)" }} /><ChevronDown size={12} style={{ color: palette.sageDeep, transform: "rotate(-90deg)" }} /></div>
      </div>
      <span className="absolute top-4 right-4 rounded-full px-3 py-1 text-[11px] font-medium" style={{ background: `${palette.ink}99`, color: palette.white }}>پیش از استفاده</span>
      <span className="absolute top-4 left-4 rounded-full px-3 py-1 text-[11px] font-medium" style={{ background: `${palette.sageDeep}CC`, color: palette.white }}>پس از ۲ هفته</span>
      <input type="range" min="0" max="100" value={pos} onChange={(e) => setPos(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize" aria-label="مقایسه پیش و پس از استفاده" />
    </div>
  );
}

/* configurable hero/welcome-modal image: gentle float, glow-pulse aura,
   subtle scroll-linked micro-rotation, and a slow diagonal shimmer sweep —
   applied to whatever image the admin uploads (keyframes live in the
   Storefront-level <style> block: float-slow, auraPulse, shimmerSweep) */
function AnimatedHeroImage({ src, width = 420, height = 420, palette, rounded = "2rem", alt = `${BRAND_NAME} — محصولات مراقبت پوستی لوکس` }) {
  const scrollOffset = useParallax(0.05);
  if (!src) return null;
  const w = Math.max(80, Math.min(Number(width) || 420, 720));
  const h = Math.max(80, Math.min(Number(height) || 420, 720));
  return (
    <div className="relative flex items-center justify-center" style={{ width: "min(100%, " + w + "px)", height: "min(78vw, " + h + "px)" }}>
      <div className="pointer-events-none absolute" style={{ inset: "-14%", borderRadius: rounded, background: `radial-gradient(circle, ${palette.sage}55, transparent 72%)`, filter: "blur(28px)", animation: "auraPulse 4.5s ease-in-out infinite" }} />
      <div style={{ transform: `rotate(${scrollOffset * 0.06}deg)`, transition: "transform 0.15s linear", width: "100%", height: "100%" }}>
        <div className="float-slow" style={{ width: "100%", height: "100%" }}>
          <div className="relative overflow-hidden w-full h-full" style={{ borderRadius: rounded, boxShadow: `0 30px 80px -20px ${palette.ink}45`, border: `1px solid ${palette.white}80` }}>
            <img src={src} alt={alt} className="w-full h-full object-cover" />
            <div className="pointer-events-none absolute inset-0" style={{ background: `linear-gradient(115deg, transparent 40%, ${palette.white}66 50%, transparent 60%)`, backgroundSize: "250% 250%", animation: "shimmerSweep 5.5s ease-in-out infinite" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* =================================================================
   STOREFRONT — fully driven by props from the root App component.
   `theme` is shadowed in as the local `palette`/font variables so
   every existing style={{...palette.X}} call below just works with
   whatever colors/fonts the admin Customizer currently has set.
================================================================== */

function Storefront({ products, categories, reviews, currencySettings, theme, layout, header, announcement, footer, banner, homeSections, faqs, welcomeModal, cart, setCart, user, freeShipThreshold, ingredientLibrary, quizSettings, quizQuestions, quizResults, rewardsSettings, onOpenAdmin, onGoAuth, onGoCheckout, customPage, initialCategorySlug, customPages = [], bundles = [] }) {
  const palette = theme;
  const fontDisplay = { fontFamily: theme.headingFont };
  const fontBody = { fontFamily: theme.bodyFont };
  const zoom = FONT_SCALE_OPTIONS[theme.fontScale] || 1;

  const [cartOpen, setCartOpen] = useState(false);
  const [filter, setFilter] = useState("همه");
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [addedFlash, setAddedFlash] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [quickView, setQuickView] = useState(null);
  const [routineSelection, setRoutineSelection] = useState({});
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showWelcome, setShowWelcome] = useState(false);
  const sliderRef = useDragScroll();

  /* dynamic category routing: #/category/<slug> resolves to a live
     category id here so newly created categories are browsable via
     their own URL the moment the admin saves them — no hardcoding */
  const [activeCategoryId, setActiveCategoryId] = useState(() => {
    if (!initialCategorySlug) return null;
    return categories.find((c) => c.slug === initialCategorySlug)?.id || null;
  });
  useEffect(() => {
    if (!initialCategorySlug) { setActiveCategoryId(null); return; }
    setActiveCategoryId(categories.find((c) => c.slug === initialCategorySlug)?.id || null);
  }, [initialCategorySlug, categories]);
  const activeCategory = categories.find((c) => c.id === activeCategoryId) || null;
  function clearCategoryFilter() { window.location.hash = "shop"; setActiveCategoryId(null); }

  /* "Shop by Skin Concern" filter — independent of the category/tag
     filters above, and combinable with them */
  const [activeConcern, setActiveConcern] = useState(null);
  function clearConcernFilter() { setActiveConcern(null); }

  /* Product comparison drawer — up to 3 products at a time */
  const [compareList, setCompareList] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);
  function toggleCompare(id) {
    setCompareList((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  /* AI visual skin-analysis modal (simulation) */
  const [aiScannerOpen, setAiScannerOpen] = useState(false);

  /* ================================================================
     SEO — dynamic <head> + Schema.org JSON-LD, kept in sync with
     whatever the customer is currently looking at (home, a category,
     a skin-concern filter, a custom page, or an open product quick
     view). Runs client-side only; never touches visual rendering. */
  useEffect(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const siteUrl = origin || "https://viina.example";
    const brandDesc = "ویینا؛ عرضه‌کننده تخصصی و گلچین‌شده محصولات مراقبت پوستی لوکس — کالکشن ویژه، دستچین‌شده از بهترین برندهای جهانی، با ضمانت ۱۰۰٪ اصالت کالا.";

    upsertJsonLd("ld-organization", {
      "@context": "https://schema.org",
      "@type": "Store",
      name: BRAND_NAME,
      alternateName: "ویینا",
      description: brandDesc,
      url: siteUrl,
      image: header.heroImage || undefined,
      address: { "@type": "PostalAddress", addressCountry: "IR" },
      priceRange: "$$",
    });

    let pageTitle = `${BRAND_NAME} | فروشگاه لوکس مراقبت پوست`;
    let pageDesc = brandDesc;
    let ogImage = header.heroImage || "";
    let ogType = "website";
    const breadcrumbs = [{ name: "خانه", url: `${siteUrl}/` }];

    if (customPage) {
      pageTitle = `${customPage.title} | ${BRAND_NAME}`;
      pageDesc = (customPage.content || "").replace(/\s+/g, " ").trim().slice(0, 220) || pageDesc;
      ogType = customPage.isJournal ? "article" : "website";
      breadcrumbs.push({ name: customPage.navLabel || customPage.title, url: `${siteUrl}/#/page/${customPage.slug}` });
    } else if (activeCategory) {
      pageTitle = `${activeCategory.name} | خرید آنلاین از ${BRAND_NAME}`;
      pageDesc = activeCategory.description || `خرید ${activeCategory.name} از کالکشن لوکس ${BRAND_NAME} با ضمانت اصالت کالا و ارسال سریع.`;
      breadcrumbs.push({ name: activeCategory.name, url: `${siteUrl}/#/category/${activeCategory.slug || activeCategory.id}` });
    } else if (activeConcern) {
      pageTitle = `محصولات مناسب ${activeConcern} | ${BRAND_NAME}`;
      pageDesc = `بهترین محصولات ${BRAND_NAME} برای ${activeConcern}؛ گلچین‌شده برای نتیجه بهتر و پوستی سالم‌تر.`;
      breadcrumbs.push({ name: activeConcern, url: `${siteUrl}/#shop` });
    }

    if (quickView) {
      pageTitle = `${quickView.name} | خرید از ${BRAND_NAME}`;
      pageDesc = buildProductSeoDescription(quickView);
      ogImage = quickView.mainImage || ogImage;
      ogType = "product";
      breadcrumbs.push({ name: quickView.name, url: `${siteUrl}/#shop` });
    }

    document.title = pageTitle;
    upsertMetaTag("name", "description", pageDesc);
    upsertMetaTag("property", "og:title", pageTitle);
    upsertMetaTag("property", "og:description", pageDesc);
    upsertMetaTag("property", "og:type", ogType);
    upsertMetaTag("property", "og:site_name", BRAND_NAME);
    if (ogImage) upsertMetaTag("property", "og:image", ogImage);
    upsertMetaTag("name", "twitter:card", "summary_large_image");
    upsertMetaTag("name", "twitter:title", pageTitle);
    upsertMetaTag("name", "twitter:description", pageDesc);
    if (ogImage) upsertMetaTag("name", "twitter:image", ogImage);
    upsertLinkTag("canonical", `${siteUrl}/${typeof window !== "undefined" ? window.location.hash : ""}`);

    upsertJsonLd("ld-breadcrumb", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((b, i) => ({ "@type": "ListItem", position: i + 1, name: b.name, item: b.url })),
    });

    upsertJsonLd("ld-product", quickView ? {
      "@context": "https://schema.org",
      "@type": "Product",
      name: quickView.name,
      image: quickView.mainImage ? [quickView.mainImage] : undefined,
      description: buildProductSeoDescription(quickView),
      brand: { "@type": "Brand", name: BRAND_NAME },
      sku: quickView.sku || undefined,
      offers: {
        "@type": "Offer",
        priceCurrency: currencySettings.currency === "toman" ? "IRT" : "IRR",
        price: String(quickView.salePrice || quickView.price || 0),
        availability: quickView.stockStatus === "ناموجود" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        url: `${siteUrl}/#shop`,
      },
      aggregateRating: quickView.rating > 0 ? { "@type": "AggregateRating", ratingValue: String(quickView.rating), reviewCount: String(quickView.reviews || 1) } : undefined,
    } : null);

    upsertJsonLd("ld-faq", faqs && faqs.length > 0 ? {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    } : null);
  }, [customPage, activeCategory, activeConcern, quickView, faqs, header.heroImage, currencySettings.currency]);

  useEffect(() => {
    if (!welcomeModal.enabled) return;
    const seen = typeof window !== "undefined" && window.localStorage ? window.localStorage.getItem("viina_welcome_seen") : null;
    if (!seen) setShowWelcome(true);
  }, [welcomeModal.enabled]);

  function dismissWelcome() {
    setShowWelcome(false);
    try { window.localStorage.setItem("viina_welcome_seen", "true"); } catch { /* private-browsing mode, etc — non-fatal */ }
  }
  const [visibleCount, setVisibleCount] = useState(layout.itemsPerPage === "نامحدود" ? Infinity : Number(layout.itemsPerPage) || 12);

  const FREE_SHIP = Number(freeShipThreshold) || 750000;

  const dynamicFilters = useMemo(() => ["همه", ...Array.from(new Set(products.map((p) => p.tag).filter(Boolean)))], [products]);
  const approvedReviews = useMemo(() => reviews.filter((r) => r.status === "تأیید شده"), [reviews]);
  const filteredProducts = useMemo(() => {
    let list = filter === "همه" ? products : products.filter((p) => p.tag === filter);
    if (activeCategoryId) list = list.filter((p) => p.category === activeCategoryId);
    if (activeConcern) list = list.filter((p) => (p.concerns || []).includes(activeConcern));
    return list;
  }, [filter, products, activeCategoryId, activeConcern]);
  const visibleProducts = filteredProducts.slice(0, visibleCount);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || (p.category || "").includes(q) || (p.tag || "").toLowerCase().includes(q)).slice(0, 5);
  }, [query, products]);

  const cartItems = cart.map((c) => ({ ...c, product: products.find((p) => p.id === c.id) })).filter((c) => c.product);
  const subtotal = cartItems.reduce((s, c) => s + (c.product.salePrice || c.product.price) * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const shipProgress = Math.min(100, (subtotal / FREE_SHIP) * 100);

  function addToCart(id) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === id);
      if (existing) return prev.map((c) => (c.id === id ? { ...c, qty: c.qty + 1 } : c));
      return [...prev, { id, qty: 1 }];
    });
    setAddedFlash(id); setCartOpen(true);
    setTimeout(() => setAddedFlash(null), 900);
  }
  function changeQty(id, delta) { setCart((prev) => prev.map((c) => (c.id === id ? { ...c, qty: c.qty + delta } : c)).filter((c) => c.qty > 0)); }
  function removeItem(id) { setCart((prev) => prev.filter((c) => c.id !== id)); }
  const [pulseId, setPulseId] = useState(null);
  function toggleWishlist(id) {
    setWishlist((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    setPulseId(id); setTimeout(() => setPulseId((p) => (p === id ? null : p)), 500);
  }

  const gridColsClass = GRID_COLS_CLASS[`${layout.mobileCols}-${layout.desktopCols}`] || "grid-cols-2 lg:grid-cols-4";

  const fmt = (n) => formatPrice(n, currencySettings);
  const heroParallax = useParallax(0.16);
  const rewardPoints = (price) => Math.round((Number(price) || 0) * ((rewardsSettings?.earnRatePct || 0) / 100));

  /* the quiz resolves to whichever admin-defined "result" the option
     selected on the LAST question links to — earlier questions are
     part of the guided experience but the final answer decides the
     bundle, which keeps the admin's mapping simple and predictable */
  const quizLastQuestion = quizQuestions && quizQuestions.length > 0 ? quizQuestions[quizQuestions.length - 1] : null;
  const quizResolvedResult = useMemo(() => {
    if (!quizLastQuestion) return null;
    const chosenOptionId = quizAnswers[quizLastQuestion.id];
    const chosenOption = quizLastQuestion.options.find((o) => o.id === chosenOptionId);
    if (!chosenOption || !chosenOption.resultId) return null;
    return (quizResults || []).find((r) => r.id === chosenOption.resultId) || null;
  }, [quizAnswers, quizLastQuestion, quizResults]);
  const quizRecommendations = useMemo(() => {
    if (!quizResolvedResult) return [];
    return (quizResolvedResult.productIds || []).map((id) => products.find((p) => p.id === id)).filter(Boolean);
  }, [quizResolvedResult, products]);
  const quizSubtotal = quizRecommendations.reduce((s, p) => s + (p.salePrice || p.price), 0);
  const quizDiscountPct = quizResolvedResult?.discountPct || 0;
  const quizDiscounted = Math.round(quizSubtotal * (1 - quizDiscountPct / 100));

  function resetQuiz() { setQuizStep(0); setQuizAnswers({}); }
  function selectQuizAnswer(questionId, optionId) {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    setQuizStep((s) => Math.min(s + 1, (quizQuestions?.length || 1)));
  }
  function addQuizRoutineToCart() {
    quizRecommendations.forEach((p) => addToCart(p.id));
    setQuizOpen(false);
    resetQuiz();
    setCartOpen(true);
  }

  /* ---------------- header variants ---------------- */
  const isTransparentHero = header.layoutStyle === "شفاف روی هیرو";
  const isFloatingGlass = header.layoutStyle === "شیشه‌ای شناور";
  const isCenteredLogo = header.layoutStyle === "لوگو وسط";

  function renderHeader() {
    return (
      <header
        className={`${isTransparentHero ? "absolute" : "sticky"} top-0 z-40 w-full backdrop-blur-md ${isFloatingGlass ? "px-3 pt-3" : ""}`}
        style={isTransparentHero ? {} : { background: isFloatingGlass ? "transparent" : `${palette.cream}CC`, backdropFilter: isFloatingGlass ? "none" : "blur(18px) saturate(160%)", WebkitBackdropFilter: isFloatingGlass ? "none" : "blur(18px) saturate(160%)", boxShadow: `0 1px 0 ${palette.beige}80` }}
      >
        <div
          className={`max-w-7xl mx-auto px-5 md:px-8 flex items-center h-16 md:h-20 gap-4 backdrop-blur-md ${isCenteredLogo ? "justify-between" : "justify-between"} ${isFloatingGlass ? "rounded-full border shadow-lg" : "border-b"}`}
          style={{ background: isFloatingGlass ? `${palette.white}B8` : "transparent", backdropFilter: isFloatingGlass ? "blur(22px) saturate(160%)" : "none", WebkitBackdropFilter: isFloatingGlass ? "blur(22px) saturate(160%)" : "none", borderColor: isTransparentHero ? "transparent" : `${palette.beige}90`, transition: "background 0.4s ease, box-shadow 0.4s ease" }}
        >
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 -mr-2" onClick={() => setMenuOpen((v) => !v)} aria-label="باز و بسته کردن منو">
              <Menu size={22} color={isTransparentHero ? palette.white : palette.ink} />
            </button>
            {!isCenteredLogo && (
              <a href="#home" style={{ fontFamily: theme.logoFont, fontWeight: 600, letterSpacing: "0.14em", color: isTransparentHero ? palette.white : palette.ink }} className="text-2xl md:text-3xl">VIINA</a>
            )}
          </div>

          {isCenteredLogo && (
            <a href="#home" style={{ fontFamily: theme.logoFont, fontWeight: 600, letterSpacing: "0.14em", color: palette.ink }} className="text-2xl md:text-3xl absolute left-1/2 -translate-x-1/2 hidden md:block">VIINA</a>
          )}

          <nav className="hidden lg:flex items-center gap-8" style={{ fontSize: 14 }}>
            {header.navLinks.map((l) => (
              <a key={l.label} href={l.href} className="hover:opacity-60 transition-opacity" style={{ color: isTransparentHero ? palette.white : palette.inkSoft }}>{l.label}</a>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            {header.showSearch && (
              <div className="relative hidden sm:block">
                <div className="flex items-center gap-2 rounded-full px-3.5 py-2 border transition-all" style={{ borderColor: searchFocused ? palette.sage : palette.beige, background: palette.white, width: searchFocused ? 240 : 180 }}>
                  <Search size={16} style={{ color: palette.inkSoft }} />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                    placeholder="جستجوی محصولات" className="bg-transparent outline-none text-sm w-full" style={{ color: palette.ink }} />
                </div>
                {searchFocused && suggestions.length > 0 && (
                  <div className="absolute top-full mt-2 left-0 right-0 rounded-2xl border shadow-lg overflow-hidden z-50" style={{ background: palette.white, borderColor: palette.beige }}>
                    {suggestions.map((p) => (
                      <button key={p.id} onClick={() => { setQuery(p.name); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }}
                        className="w-full text-right px-4 py-2.5 text-sm flex items-center justify-between hover:opacity-70 transition-opacity" style={{ borderTop: `1px solid ${palette.creamDeep}`, color: palette.ink }}>
                        <span>{p.name}</span><span style={{ color: palette.inkSoft, fontSize: 12 }}>{fmt(p.salePrice || p.price)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {header.showAccount && (
              user ? (
                <button onClick={onGoAuth} className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors hover:opacity-70" style={{ background: `${palette.sageMist}90`, color: palette.sageDeep }} aria-label="حساب کاربری">
                  <User size={15} /> <span className="hidden sm:inline">{user.firstName}</span>
                </button>
              ) : (
                <button onClick={onGoAuth} className="btn-shine inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-transform duration-300 hover:scale-105" style={{ background: isTransparentHero ? `${palette.white}30` : palette.sageDeep, color: isTransparentHero ? palette.white : palette.white, border: isTransparentHero ? `1px solid ${palette.white}70` : "none" }}>
                  <User size={14} /> ورود / ثبت‌نام
                </button>
              )
            )}
            {header.showCart && (
              <button className="relative p-2 hover:opacity-60 transition-opacity" aria-label="سبد خرید" onClick={() => setCartOpen(true)}>
                <ShoppingBag size={20} color={isTransparentHero ? palette.white : palette.ink} />
                {cartCount > 0 && <span className="absolute -top-0.5 -left-0.5 flex items-center justify-center rounded-full text-[10px] font-semibold" style={{ width: 17, height: 17, background: palette.sageDeep, color: palette.white }}>{cartCount}</span>}
              </button>
            )}
          </div>
        </div>
        {menuOpen && (
          <nav className="lg:hidden flex flex-col px-5 py-4 gap-3" style={{ background: palette.cream }}>
            {!user && (
              <button onClick={onGoAuth} className="self-start rounded-full px-4 py-2 text-xs font-medium mb-1" style={{ background: palette.sageDeep, color: palette.white }}>ورود / ثبت‌نام</button>
            )}
            {header.navLinks.map((l) => <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)} className="py-1.5 text-sm" style={{ color: palette.inkSoft }}>{l.label}</a>)}
          </nav>
        )}
      </header>
    );
  }

  /* ---------------- home sections ---------------- */
  const sectionRenderers = {
    hero: () => (
      <section id="home" key="hero" className="relative overflow-hidden">
        <GlowBlob colors={[`${palette.sageMist}`, `${palette.sage}00`]} style={{ width: 520, height: 520, top: -160, left: "-8%", transform: `translateY(${heroParallax * 0.4}px)` }} />
        <GlowBlob colors={[`${palette.nude}`, `${palette.nude}00`]} style={{ width: 420, height: 420, top: 60, right: "-10%", transform: `translateY(${-heroParallax * 0.3}px)` }} />
        <GlowBlob colors={[`${palette.cream}`, `${palette.cream}00`]} style={{ width: 320, height: 320, bottom: -80, left: "20%", opacity: 0.7 }} />
        {[
          { top: "18%", left: "12%", size: 7, dur: 9, delay: 0, drift: 14 },
          { top: "62%", left: "6%", size: 5, dur: 7, delay: 1.4, drift: -10 },
          { top: "30%", left: "48%", size: 6, dur: 10, delay: 2.2, drift: 18 },
          { top: "70%", left: "58%", size: 4, dur: 6.5, delay: 0.8, drift: -8 },
          { top: "12%", left: "70%", size: 8, dur: 11, delay: 3, drift: 12 },
        ].map((d, i) => (
          <span key={i} aria-hidden="true" className="water-particle pointer-events-none absolute rounded-full hidden md:block"
            style={{ top: d.top, left: d.left, width: d.size, height: d.size, background: `${palette.white}CC`, boxShadow: `0 0 8px ${palette.white}`, animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s`, "--drift": `${d.drift}px` }} />
        ))}
        <div className={`relative max-w-7xl mx-auto px-5 md:px-8 pb-16 md:pb-24 grid lg:grid-cols-2 gap-10 items-center ${isTransparentHero ? "pt-32 md:pt-40" : "pt-14 md:pt-20"}`}>
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-5 backdrop-blur-md" style={{ background: `${palette.white}66`, border: `1px solid ${palette.white}90`, color: palette.sageDeep, fontSize: 13, fontWeight: 600 }}>
              <Droplet size={13} /> گیاهی · مبتنی بر علم · گلچین‌شده با دقت
            </span>
            <h1 style={{ ...fontDisplay, fontWeight: 500, lineHeight: 1.35, color: palette.ink }} className="text-4xl md:text-5xl xl:text-6xl mb-6">
              {header.heroHeadline || ""}
            </h1>
            <p style={{ color: palette.inkSoft, fontSize: 17, lineHeight: 1.9 }} className="max-w-md mb-9">{header.heroSubtitle || ""}</p>
            <div className="flex flex-wrap items-center gap-4">
              <a href={header.heroCtaLink || "#shop"} className="btn-shine inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium transition-all duration-300 hover:scale-[1.03]" style={{ background: palette.sageDeep, color: palette.white, boxShadow: `0 8px 24px -6px ${palette.sageDeep}66` }}>
                {header.heroCtaText || "مشاهده محصولات"} <ArrowRight size={16} style={{ transform: "scaleX(-1)" }} />
              </a>
              <button onClick={() => setAiScannerOpen(true)} className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium border backdrop-blur-md transition-all duration-300 hover:scale-[1.03]" style={{ borderColor: `${palette.white}90`, background: `${palette.white}55`, color: palette.ink }}>
                <Scan size={15} style={{ color: palette.sageDeep }} /> اسکن پوست با هوش مصنوعی
              </button>
              <a href="#about" className="text-sm font-medium underline underline-offset-4" style={{ color: palette.ink }}>داستان ما</a>
            </div>
          </Reveal>
          <Reveal delay={0.15} className="relative flex items-center justify-center">
            <div aria-hidden="true" className="absolute rounded-full" style={{ width: "min(460px,92vw)", height: "min(460px,92vw)", border: `1px solid ${palette.white}80` }} />
            <div aria-hidden="true" className="absolute rounded-full" style={{ width: "min(500px,96vw)", height: "min(500px,96vw)", border: `1px solid ${palette.white}40` }} />
            <Leaf size={26} className="absolute float-slow" style={{ top: "6%", left: "2%", color: palette.sageDeep, opacity: 0.65 }} />
            <Leaf size={20} className="absolute float-slow" style={{ bottom: "10%", right: "4%", color: palette.sage, opacity: 0.55, animationDelay: "1.2s", transform: "scaleX(-1)" }} />
            {header.heroImage ? (
              <AnimatedHeroImage src={header.heroImage} width={header.heroImageWidth} height={header.heroImageHeight} palette={palette} alt={`${BRAND_NAME} — ${header.heroHeadline || "محصولات مراقبت پوستی لوکس"}`} />
            ) : (
              <div
                className="drop-anim relative flex items-center justify-center backdrop-blur-sm"
                style={{ width: "min(420px, 88vw)", height: "min(420px, 88vw)", background: `linear-gradient(150deg, ${palette.white}55, ${palette.sageMist})`, border: `1px solid ${palette.white}70`, transform: `translateY(${-heroParallax}px)`, transition: "transform 0.1s linear", boxShadow: `0 30px 80px -20px ${palette.sageDeep}40` }}
              >
                <div className="float-slow flex items-end gap-6">
                  <div className="scale-125"><Bottle tint={palette.nude} ink={palette.ink} white={palette.white} /></div>
                  <div className="scale-150 -mb-2"><Bottle tint={palette.sage} ink={palette.ink} white={palette.white} /></div>
                  <div className="scale-100 mb-1"><Bottle tint={palette.creamDeep} ink={palette.ink} white={palette.white} /></div>
                </div>
              </div>
            )}
          </Reveal>
        </div>
      </section>
    ),
    banner: () => banner.enabled ? (
      <section key="banner" className="max-w-7xl mx-auto px-5 md:px-8 py-6">
        <Reveal>
          <a href={banner.link || "#shop"} className="flex flex-col sm:flex-row items-center gap-4 rounded-3xl p-6 overflow-hidden transition-transform duration-500 hover:-translate-y-0.5" style={{ background: `linear-gradient(120deg, ${palette.sageMist}, ${palette.beige})`, boxShadow: `0 10px 30px -12px ${palette.sageDeep}33` }}>
            {banner.image && <div className="w-16 h-16 rounded-2xl bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${banner.image})`, background: palette.white }} />}
            <p style={{ ...fontDisplay, fontSize: 18, color: palette.ink }} className="flex-1 text-center sm:text-right">{banner.text}</p>
            <ArrowRight size={18} style={{ color: palette.sageDeep, transform: "scaleX(-1)" }} className="shrink-0" />
          </a>
        </Reveal>
      </section>
    ) : null,
    categories: () => (
      <section id="categories" key="categories" className="max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-24">
        <RevealHeading className="mb-10 md:mb-14 max-w-xl">
          <p style={{ color: palette.sageDeep, fontSize: 13, fontWeight: 600 }} className="mb-3">خرید بر اساس دسته‌بندی</p>
          <h2 style={{ ...fontDisplay, fontWeight: 500, color: palette.ink }} className="text-3xl md:text-4xl">آیینی برای هر مرحله</h2>
        </RevealHeading>
        {categories.length === 0 ? (
          <EmptyState icon={Layers} title="هنوز دسته‌بندی‌ای اضافه نشده است" subtitle="دسته‌بندی‌های فروشگاه به‌زودی از پنل مدیریت اضافه می‌شوند." palette={palette} />
        ) : (
          <div className="columns-2 md:columns-3 gap-4 md:gap-5">
            {categories.map((c, i) => {
              const Icon = c.icon || Tag;
              /* asymmetric rhythm: heights and vertical offsets cycle so tiles
                 never line up into a uniform grid, giving the editorial-gallery feel */
              const heightClass = ["h-56", "h-72", "h-64", "h-80", "h-60"][i % 5];
              const offsetClass = i % 3 === 1 ? "md:mt-10" : i % 3 === 2 ? "md:mt-4" : "md:mt-0";
              return (
                <div key={c.id} className={`break-inside-avoid mb-4 md:mb-5 ${offsetClass}`}>
                  <Reveal delay={i * 0.06}>
                    <button onClick={() => { setFilter("همه"); if (c.slug) { window.location.hash = "/category/" + encodeURIComponent(c.slug); } setActiveCategoryId(c.id); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }}
                      className={`group relative w-full ${heightClass} rounded-3xl overflow-hidden flex flex-col items-center justify-center gap-3 border transition-all duration-500 hover:-translate-y-1.5`}
                      style={{ borderColor: palette.beige, background: palette.white, boxShadow: `0 0 0 rgba(0,0,0,0)` }}>
                      <div className="absolute inset-0 transition-all duration-700 group-hover:scale-110 opacity-80" style={{ background: `linear-gradient(${150 + i * 20}deg, ${palette.creamDeep}, ${palette.sageMist})` }} />
                      <div className="relative z-10 rounded-full p-4 transition-transform duration-500 group-hover:-translate-y-1" style={{ background: palette.white }}><Icon size={24} style={{ color: palette.sageDeep }} /></div>
                      <div className="relative z-10 text-center px-2">
                        <p style={{ ...fontDisplay, fontSize: 18, color: palette.ink }}>{c.name}</p>
                        <p style={{ fontSize: 11.5, color: palette.inkSoft }} className="mt-0.5">{c.blurb}</p>
                      </div>
                      <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `${palette.sageDeep}CC` }}>
                        <span className="text-sm font-medium" style={{ color: palette.white }}>مشاهده محصولات</span>
                      </div>
                    </button>
                  </Reveal>
                </div>
              );
            })}
          </div>
        )}
      </section>
    ),
    concerns: () => (
      <section id="concerns" key="concerns" className="max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-20">
        <RevealHeading className="mb-10 max-w-xl">
          <p style={{ color: palette.sageDeep, fontSize: 13, fontWeight: 600 }} className="mb-3">دسته‌بندی بر اساس عارضه پوستی</p>
          <h2 style={{ ...fontDisplay, fontWeight: 500, color: palette.ink }} className="text-3xl md:text-4xl">خرید بر اساس نیاز پوستی</h2>
        </RevealHeading>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {SKIN_CONCERN_OPTIONS.map((c, i) => {
            const Icon = c.icon;
            return (
              <Reveal key={c.key} delay={i * 0.06}>
                <button
                  onClick={() => { setActiveConcern(c.key); setFilter("همه"); setActiveCategoryId(null); window.location.hash = "shop"; document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }}
                  className="group relative w-full h-44 md:h-52 rounded-3xl overflow-hidden flex flex-col items-center justify-center gap-3 border transition-all duration-500 hover:-translate-y-1.5"
                  style={{ borderColor: activeConcern === c.key ? palette.sageDeep : palette.beige, background: palette.white }}
                >
                  <div className="absolute inset-0 transition-all duration-700 group-hover:scale-110 opacity-80" style={{ background: `linear-gradient(${140 + i * 25}deg, ${palette.creamDeep}, ${palette.sageMist})` }} />
                  <div className="relative z-10 rounded-full p-3.5 transition-transform duration-500 group-hover:-translate-y-1" style={{ background: palette.white }}><Icon size={22} style={{ color: palette.sageDeep }} /></div>
                  <div className="relative z-10 text-center px-3">
                    <p style={{ ...fontDisplay, fontSize: 15.5, color: palette.ink }}>{c.key}</p>
                    <p style={{ fontSize: 11, color: palette.inkSoft }} className="mt-1 hidden md:block">{c.blurb}</p>
                  </div>
                </button>
              </Reveal>
            );
          })}
        </div>
      </section>
    ),
    bestsellers: () => {
      const featured = products.filter((pr) => pr.tag === "پرفروش‌ترین‌ها");
      const list = (featured.length > 0 ? featured : products).slice(0, 10);
      if (list.length === 0) return null;
      return (
        <section key="bestsellers" className="py-16 md:py-20 overflow-hidden">
          <div className="max-w-7xl mx-auto px-5 md:px-8 flex items-end justify-between mb-8">
            <RevealHeading>
              <p style={{ color: palette.sageDeep, fontSize: 13, fontWeight: 600 }} className="mb-3">پرفروش‌ترین‌های ویینا</p>
              <h2 style={{ ...fontDisplay, fontWeight: 500, color: palette.ink }} className="text-3xl md:text-4xl">مورد علاقه مشتریان</h2>
            </RevealHeading>
            <p className="hidden sm:block" style={{ fontSize: 12.5, color: palette.inkSoft }}>برای پیمایش بکشید ←</p>
          </div>
          <div ref={sliderRef} className="bestseller-track flex gap-5 overflow-x-auto px-5 md:px-8 pb-4 snap-x snap-proximity cursor-grab select-none" style={{ scrollbarWidth: "none" }}>
            {list.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.04} className="snap-start shrink-0" >
                <div className="product-card group rounded-3xl overflow-hidden border flex flex-col" style={{ width: "min(78vw, 300px)", borderColor: palette.beige, background: palette.white, "--glow": `${palette.bronze}4D` }}>
                  <div className="relative flex items-center justify-center overflow-hidden" style={{ height: 260, background: palette.creamDeep }}>
                    <div className="product-lifestyle absolute inset-0 opacity-0 group-hover:opacity-100" style={{ background: `radial-gradient(circle at 60% 30%, ${palette.nudeDeep}55, ${palette.bronze}33 45%, transparent 75%)` }} />
                    <div className="relative z-[5] drop-anim flex items-center justify-center transition-transform duration-500 group-hover:scale-110" style={{ width: 172, height: 172, background: `${p.tint}55` }}>
                      <div className="scale-150"><Bottle tint={p.tint} ink={palette.ink} white={palette.white} label={`${p.name} - خرید از ${BRAND_NAME}`} /></div>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    {p.tag && <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-medium mb-2 self-start" style={{ background: `${palette.bronze}22`, color: palette.bronze, boxShadow: `0 0 14px ${palette.bronze}33` }}><Sparkles size={10} />{p.tag}</span>}
                    <h3 style={{ ...fontDisplay, fontSize: 19, color: palette.ink }} className="mb-3 flex-1">{p.name}</h3>
                    <div className="flex items-center justify-between gap-2">
                      <span style={{ ...fontDisplay, fontSize: 16, color: palette.ink }}>{fmt(p.salePrice || p.price)}</span>
                      <button onClick={() => addToCart(p.id)} className="rounded-full px-4 py-2 text-xs font-medium" style={{ background: addedFlash === p.id ? palette.sage : palette.ink, color: palette.white }}>
                        {addedFlash === p.id ? "افزوده شد ✓" : "افزودن"}
                      </button>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      );
    },
    routine: () => {
      const steps = [...categories].sort((a, b) => a.order - b.order).slice(0, 3).map((c) => ({ category: c, options: products.filter((pr) => pr.category === c.id) })).filter((s) => s.options.length > 0);
      if (steps.length < 2) return null;
      const total = steps.reduce((sum, s) => {
        const chosenId = routineSelection[s.category.id] ?? s.options[0].id;
        const chosen = s.options.find((o) => o.id === chosenId);
        return sum + (chosen ? (chosen.salePrice || chosen.price) : 0);
      }, 0);
      function selectedFor(step) { return routineSelection[step.category.id] ?? step.options[0].id; }
      function shopFullSet() {
        steps.forEach((s) => addToCart(selectedFor(s)));
      }
      return (
        <section key="routine" className="relative py-16 md:py-24 overflow-hidden" style={{ background: palette.sageMist }}>
          <GlowBlob colors={[`${palette.nude}`, `${palette.nude}00`]} style={{ width: 480, height: 480, top: "-10%", left: "-8%" }} />
          <div className="relative max-w-7xl mx-auto px-5 md:px-8">
            <RevealHeading className="mb-10 md:mb-14 max-w-xl">
              <p style={{ color: palette.sageDeep, fontSize: 13, fontWeight: 600 }} className="mb-3">روتین خود را بسازید</p>
              <h2 style={{ ...fontDisplay, fontWeight: 500, color: palette.ink }} className="text-3xl md:text-4xl">یک قدم تا روتین کامل</h2>
              <p style={{ color: palette.inkSoft, fontSize: 14.5 }} className="mt-3">از هر مرحله یک محصول انتخاب کنید و مجموعه کامل را یک‌جا به سبد اضافه کنید.</p>
            </RevealHeading>
            <div className={`grid gap-6 mb-10`} style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
              {steps.map((s, si) => {
                const chosenId = selectedFor(s);
                const themeStep = [{ label: "پاک‌سازی", icon: Droplet }, { label: "آبرسانی", icon: Sparkles }, { label: "درخشش", icon: Sun }][si] || { label: "", icon: Leaf };
                const StepIcon = themeStep.icon;
                return (
                  <Reveal key={s.category.id} delay={si * 0.08}>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0" style={{ background: palette.sageDeep, color: palette.white }}>{si + 1}</span>
                        <p style={{ ...fontDisplay, fontSize: 16, color: palette.ink }}>{s.category.name}</p>
                      </div>
                      {themeStep.label && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-medium mb-3" style={{ background: `${palette.white}90`, color: palette.sageDeep }}>
                          <StepIcon size={11} /> {themeStep.label}
                        </span>
                      )}
                      <div className="flex flex-col gap-2.5">
                        {s.options.slice(0, 4).map((opt) => {
                          const active = opt.id === chosenId;
                          return (
                            <button key={opt.id} onClick={() => setRoutineSelection((prev) => ({ ...prev, [s.category.id]: opt.id }))}
                              className="flex items-center gap-3 rounded-2xl p-3 border text-right transition-all duration-300"
                              style={{ background: active ? palette.white : `${palette.white}80`, borderColor: active ? palette.sageDeep : palette.beige, boxShadow: active ? `0 10px 24px -12px ${palette.sageDeep}55` : "none" }}>
                              <div className="rounded-xl flex items-center justify-center shrink-0" style={{ width: 44, height: 44, background: `${opt.tint}55` }}><div className="scale-[0.45]"><Bottle tint={opt.tint} ink={palette.ink} white={palette.white} /></div></div>
                              <div className="flex-1 min-w-0">
                                <p className="truncate" style={{ fontSize: 13, color: palette.ink }}>{opt.name}</p>
                                <p style={{ fontSize: 12, color: palette.inkSoft }}>{fmt(opt.salePrice || opt.price)}</p>
                              </div>
                              <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: active ? palette.sageDeep : palette.beige }}>
                                {active && <div className="w-2 h-2 rounded-full" style={{ background: palette.sageDeep }} />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
            <Reveal delay={0.2}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl p-6" style={{ background: palette.white }}>
                <div>
                  <p style={{ fontSize: 12.5, color: palette.inkSoft }}>مجموع روتین انتخابی</p>
                  <p style={{ ...fontDisplay, fontSize: 24, color: palette.ink }}>{fmt(total)}</p>
                </div>
                <button onClick={shopFullSet} className="btn-shine inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium transition-transform duration-300 hover:scale-[1.03]" style={{ background: palette.sageDeep, color: palette.white, boxShadow: `0 10px 28px -10px ${palette.sageDeep}66` }}>
                  خرید مجموعه کامل <ArrowRight size={16} style={{ transform: "scaleX(-1)" }} />
                </button>
              </div>
            </Reveal>
          </div>
        </section>
      );
    },
    bundles: () => {
      const validBundles = bundles
        .map((b) => ({ ...b, items: (b.productIds || []).map((id) => products.find((pr) => pr.id === id)).filter(Boolean) }))
        .filter((b) => b.items.length >= 2);
      if (validBundles.length === 0) return null;
      return (
        <section key="bundles" className="max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-20">
          <RevealHeading className="mb-10 max-w-xl">
            <p style={{ color: palette.sageDeep, fontSize: 13, fontWeight: 600 }} className="mb-3">بسته‌های روتین کامل با یک کلیک</p>
            <h2 style={{ ...fontDisplay, fontWeight: 500, color: palette.ink }} className="text-3xl md:text-4xl">روتین کامل، انتخاب هوشمندانه</h2>
          </RevealHeading>
          <div className="grid md:grid-cols-2 gap-6">
            {validBundles.map((b, i) => {
              const originalTotal = b.items.reduce((s, p) => s + (p.salePrice || p.price), 0);
              const bundlePrice = Math.round(originalTotal * (1 - (b.discountPercent || 0) / 100));
              return (
                <Reveal key={b.id} delay={i * 0.08}>
                  <div id={`bundle-${b.slug || b.id}`} className="rounded-3xl p-6 md:p-7 h-full flex flex-col" style={{ background: palette.white, border: `1px solid ${palette.beige}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 style={{ ...fontDisplay, fontSize: 20, color: palette.ink }}>{b.title}</h3>
                      {b.discountPercent > 0 && <span className="rounded-full px-2.5 py-1 text-[10.5px] font-medium" style={{ background: `${palette.bronze}22`, color: palette.bronze }}>{b.discountPercent}٪ تخفیف بسته</span>}
                    </div>
                    {b.description && <p style={{ fontSize: 13, color: palette.inkSoft }} className="mb-4">{b.description}</p>}
                    <div className="flex items-center gap-3 mb-5 flex-wrap">
                      {b.items.map((p) => (
                        <div key={p.id} className="flex items-center gap-2 rounded-full pl-3 pr-1.5 py-1.5" style={{ background: palette.creamDeep }}>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `${p.tint}55` }}><Bottle tint={p.tint} ink={palette.ink} white={palette.white} label={`${p.name} - خرید از ${BRAND_NAME}`} /></div>
                          <span style={{ fontSize: 11.5, color: palette.ink }}>{p.name}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-3">
                      <div>
                        <span style={{ ...fontDisplay, fontSize: 20, color: palette.ink }}>{fmt(bundlePrice)}</span>
                        {b.discountPercent > 0 && <span style={{ fontSize: 12, color: palette.inkSoft, textDecoration: "line-through" }} className="mr-2">{fmt(originalTotal)}</span>}
                      </div>
                      <button onClick={() => b.items.forEach((p) => addToCart(p.id))} className="btn-shine rounded-full px-5 py-2.5 text-xs font-medium shrink-0" style={{ background: palette.sageDeep, color: palette.white }}>
                        افزودن کامل روتین به سبد خرید
                      </button>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>
      );
    },
    glowSlider: () => (
      <section key="glowSlider" className="relative py-16 md:py-24 overflow-hidden">
        <GlowBlob colors={[`${palette.sageMist}`, `${palette.sageMist}00`]} style={{ width: 440, height: 440, top: "-6%", right: "-6%" }} />
        <div className="relative max-w-7xl mx-auto px-5 md:px-8">
          <RevealHeading className="mb-10 md:mb-14 max-w-xl mx-auto text-center">
            <p style={{ color: palette.sageDeep, fontSize: 13, fontWeight: 600 }} className="mb-3">نتیجه‌ای که حس می‌کنید</p>
            <h2 style={{ ...fontDisplay, fontWeight: 500, color: palette.ink }} className="text-3xl md:text-4xl mb-3">شفافیت و شادابی، از نو</h2>
            <p style={{ color: palette.inkSoft, fontSize: 14.5 }}>نوار زیر را بکشید تا تفاوت آبرسانی و درخشش پوست را ببینید.</p>
          </RevealHeading>
          <Reveal delay={0.1}><GlowCompareSlider palette={palette} /></Reveal>
        </div>
      </section>
    ),
    ingredients: () => {
      if (!ingredientLibrary || ingredientLibrary.length === 0) return null;
      return (
        <section key="ingredients" id="ingredients" className="relative py-16 md:py-24 overflow-hidden" style={{ background: palette.creamDeep }}>
          <GlowBlob colors={[`${palette.sage}`, `${palette.sage}00`]} style={{ width: 420, height: 420, top: "-8%", left: "-6%" }} />
          <div className="relative max-w-7xl mx-auto px-5 md:px-8">
            <RevealHeading className="mb-10 md:mb-14 max-w-xl">
              <p style={{ color: palette.sageDeep, fontSize: 13, fontWeight: 600 }} className="mb-3">دایره‌المعارف ترکیبات</p>
              <h2 style={{ ...fontDisplay, fontWeight: 500, color: palette.ink }} className="text-3xl md:text-4xl mb-3">Ingredientspedia</h2>
              <p style={{ color: palette.inkSoft, fontSize: 14.5 }}>با ترکیبات طبیعی داخل کالکشن ویینا و فایده هرکدام برای پوست آشنا شوید.</p>
            </RevealHeading>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {ingredientLibrary.map((ing, i) => {
                const inProducts = products.filter((p) => (p.ingredients || "").toLowerCase().includes(ing.name.toLowerCase()));
                return (
                  <Reveal key={ing.id} delay={(i % 6) * 0.05}>
                    <div className="rounded-3xl p-6 h-full flex flex-col" style={{ background: palette.white, border: `1px solid ${palette.beige}` }}>
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4" style={{ background: palette.sageMist }}>
                        <Leaf size={18} style={{ color: palette.sageDeep }} />
                      </div>
                      <p style={{ ...fontDisplay, fontSize: 18, color: palette.ink }} className="mb-2">{ing.name}</p>
                      <p style={{ color: palette.inkSoft, fontSize: 13.5, lineHeight: 1.85 }} className="flex-1 mb-4">{ing.benefit}</p>
                      {inProducts.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-3 border-t" style={{ borderColor: palette.creamDeep }}>
                          {inProducts.slice(0, 3).map((p) => (
                            <span key={p.id} className="rounded-full px-2.5 py-1 text-[10.5px] font-medium" style={{ background: palette.sageMist, color: palette.sageDeep }}>{p.name}</span>
                          ))}
                          {inProducts.length > 3 && <span style={{ fontSize: 10.5, color: palette.inkSoft }}>{`+${inProducts.length - 3} محصول دیگر`}</span>}
                        </div>
                      )}
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      );
    },
    shop: () => (
      <section id="shop" key="shop" className="relative py-16 md:py-24 overflow-hidden" style={{ background: palette.creamDeep }}>
        <GlowBlob colors={[`${palette.nudeDeep}`, `${palette.nudeDeep}00`]} style={{ width: 460, height: 460, top: "10%", left: "-6%" }} />
        <GlowBlob colors={[`${palette.sageMist}`, `${palette.sageMist}00`]} style={{ width: 380, height: 380, bottom: "-5%", right: "-4%" }} />
        <div className="relative max-w-7xl mx-auto px-5 md:px-8">
          <RevealHeading className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <p style={{ color: palette.sageDeep, fontSize: 13, fontWeight: 600 }} className="mb-3">محصولات منتخب</p>
              <h2 style={{ ...fontDisplay, fontWeight: 500, color: palette.ink }} className="text-3xl md:text-4xl">{activeCategory ? activeCategory.name : activeConcern ? activeConcern : "کالکشن ویینا"}</h2>
              {activeCategory && (
                <button onClick={clearCategoryFilter} className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium border" style={{ borderColor: palette.beige, color: palette.inkSoft }}>
                  <X size={12} /> بازگشت به همه دسته‌بندی‌ها
                </button>
              )}
              {activeConcern && (
                <button onClick={clearConcernFilter} className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium border" style={{ borderColor: palette.beige, color: palette.inkSoft }}>
                  <X size={12} /> حذف فیلتر نیاز پوستی
                </button>
              )}
            </div>
            {products.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {dynamicFilters.map((f) => (
                  <button key={f} onClick={() => setFilter(f)} className="rounded-full px-4 py-2 text-sm transition-colors"
                    style={{ background: filter === f ? palette.sageDeep : palette.white, color: filter === f ? palette.white : palette.inkSoft, border: `1px solid ${filter === f ? palette.sageDeep : palette.beige}` }}>
                    {f}
                  </button>
                ))}
              </div>
            )}
          </RevealHeading>

          {products.length === 0 ? (
            <EmptyState icon={Package} title="هنوز محصولی اضافه نشده است" subtitle="محصولات فروشگاه پس از افزودن از پنل مدیریت، اینجا نمایش داده می‌شوند." palette={palette} />
          ) : (
            <>
              <div className={`grid ${gridColsClass} gap-5 md:gap-6`}>
                {visibleProducts.map((p, i) => {
                  const isLow = p.stockStatus === "موجودی کم";
                  const isOut = p.stockStatus === "ناموجود";
                  return (
                    <Reveal key={p.id} delay={(i % 4) * 0.06}>
                      <div className="product-card group rounded-3xl overflow-hidden border flex flex-col h-full" style={{ borderColor: palette.beige, background: palette.white, "--glow": `${palette.bronze}4D` }}>
                        <div className="relative p-6 flex items-center justify-center overflow-hidden" style={{ background: palette.creamDeep }}>
                          <div className="product-lifestyle absolute inset-0 opacity-0 group-hover:opacity-100" style={{ background: `radial-gradient(circle at 60% 30%, ${palette.nudeDeep}55, ${palette.bronze}33 45%, transparent 75%)` }} />
                          {p.skin && <span className="absolute top-3 right-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-medium" style={{ background: palette.white, color: palette.sageDeep }}>{p.skin}</span>}
                          {layout.showWishlist && (
                            <button onClick={() => toggleWishlist(p.id)} className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110" style={{ background: `${palette.white}DD` }} aria-label="افزودن به علاقه‌مندی‌ها">
                              <Heart size={14} className={pulseId === p.id ? "heart-pulse" : ""} style={{ color: palette.bronze }} fill={wishlist.includes(p.id) ? palette.bronze : "transparent"} />
                            </button>
                          )}
                          <button onClick={() => toggleCompare(p.id)} className={`absolute ${layout.showWishlist ? "top-14" : "top-3"} left-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110`} style={{ background: compareList.includes(p.id) ? palette.sageDeep : `${palette.white}DD` }} aria-label="افزودن به مقایسه" title="مقایسه محصول">
                            <Layers size={14} style={{ color: compareList.includes(p.id) ? palette.white : palette.bronze }} />
                          </button>
                          {layout.showQuickView && (
                            <button onClick={() => setQuickView(p)} className="absolute bottom-3 inset-x-3 z-10 rounded-full py-1.5 text-xs font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 flex items-center justify-center gap-1.5" style={{ background: `${palette.ink}CC`, color: palette.white }}>
                              <Eye size={12} /> نمای سریع
                            </button>
                          )}
                          <div className="relative z-[5] drop-anim flex items-center justify-center transition-transform duration-500 group-hover:scale-110" style={{ width: 128, height: 128, background: `${p.tint}55` }}>
                            <Bottle tint={p.tint} ink={palette.ink} white={palette.white} label={buildProductAltText(p, categories)} />
                          </div>
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                          {p.tag && <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-medium mb-2 self-start" style={{ background: `${palette.bronze}22`, color: palette.bronze, boxShadow: `0 0 14px ${palette.bronze}33` }}><Sparkles size={10} />{p.tag}</span>}
                          <h3 style={{ ...fontDisplay, fontSize: 18, color: palette.ink }} className="mb-2 flex-1">{p.name}</h3>
                          {layout.showRatings && p.reviews > 0 && (
                            <div className="flex items-center gap-1.5 mb-2">
                              <Stars rating={p.rating} color={palette.bronze} />
                              {layout.showReviewCount && <span style={{ fontSize: 12, color: palette.inkSoft }}>{p.rating} ({p.reviews})</span>}
                            </div>
                          )}
                          {(layout.showStockQty || (layout.showLowStock && (isLow || isOut))) && (
                            <p style={{ fontSize: 11.5, color: isOut ? "#A5453A" : isLow ? "#8A6A2A" : palette.inkSoft }} className="mb-2">
                              {isOut ? "ناموجود" : layout.showLowStock && isLow ? `تنها ${p.qty} عدد باقی مانده` : layout.showStockQty ? `${p.qty} عدد موجود` : ""}
                            </p>
                          )}
                          {rewardsSettings?.enabled && (
                            <p className="flex items-center gap-1 mb-2" style={{ fontSize: 11, color: palette.bronze }}>
                              <Sparkles size={11} /> {fmt(rewardPoints(p.salePrice || p.price))} اعتبار {rewardsSettings.clubName}
                            </p>
                          )}
                          <div className="flex items-center justify-between gap-2 mt-auto">
                            <span style={{ ...fontDisplay, fontSize: 15.5, color: palette.ink }}>
                              {layout.showDiscountBadge && p.salePrice ? (
                                <span className="flex flex-col">
                                  <span>{fmt(p.salePrice)}</span>
                                  <span style={{ fontSize: 11, color: palette.inkSoft, textDecoration: "line-through" }}>{fmt(p.price)}</span>
                                </span>
                              ) : fmt(p.price)}
                            </span>
                            <button onClick={() => addToCart(p.id)} disabled={isOut} className="rounded-full px-4 py-2 text-xs font-medium transition-all duration-300 hover:scale-105 shrink-0" style={{ background: isOut ? palette.beige : addedFlash === p.id ? palette.sage : palette.ink, color: isOut ? palette.inkSoft : palette.white }}>
                              {isOut ? "ناموجود" : addedFlash === p.id ? "افزوده شد ✓" : "افزودن به سبد"}
                            </button>
                          </div>

                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
              {visibleCount < filteredProducts.length && (
                <div className="flex justify-center mt-10">
                  <button onClick={() => setVisibleCount((v) => v + (Number(layout.itemsPerPage) || 12))} className="rounded-full px-6 py-3 text-sm font-medium border" style={{ borderColor: palette.beige, color: palette.ink }}>
                    نمایش بیشتر
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    ),
    about: () => (
      <section id="about" key="about" className="relative max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center overflow-hidden">
        {[
          { top: "10%", left: "44%", size: 5, dur: 8, delay: 0.3 },
          { top: "68%", left: "38%", size: 4, dur: 7, delay: 1.6 },
        ].map((d, i) => (
          <span key={i} aria-hidden="true" className="water-particle pointer-events-none absolute rounded-full hidden lg:block"
            style={{ top: d.top, left: d.left, width: d.size, height: d.size, background: `${palette.sage}CC`, boxShadow: `0 0 8px ${palette.sage}`, animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s`, "--drift": "10px" }} />
        ))}
        <Reveal className="order-2 lg:order-1">
          <p style={{ color: palette.sageDeep, fontSize: 13, fontWeight: 600 }} className="mb-3">فلسفه ما</p>
          <h2 style={{ ...fontDisplay, fontWeight: 500, color: palette.ink }} className="text-3xl md:text-4xl mb-5">گلچین‌شده با دقت و صبر</h2>
          <p style={{ color: palette.inkSoft, fontSize: 16, lineHeight: 1.95 }} className="mb-5">ویینا از یک دغدغه ساده شروع شد: بازاریابی محصولات پوستی جلوتر از علم آن‌ها حرکت می‌کرد. ویینا فروشگاه تخصصی محصولات مراقبت پوستی است؛ تیم ما در کنار متخصصان پوست، معتبرترین برندهای دنیا را با کمترین و هدفمندترین ترکیبات برای شما گلچین می‌کند.</p>
          <p style={{ color: palette.inkSoft, fontSize: 16, lineHeight: 1.95 }} className="mb-8">موجودی هر محصول در مقیاس محدود تأمین می‌شود، تا آنچه دریافت می‌کنید همیشه تازه و اصل باشد.</p>
          <div className="grid grid-cols-3 gap-4">
            {[["موجودی محدود", Leaf], ["تست‌شده توسط متخصص پوست", ShieldCheck], ["بدون آزمایش حیوانی", Heart]].map(([label, Icon]) => (
              <div key={label} className="text-center">
                <Icon size={20} className="mx-auto mb-2" style={{ color: palette.sageDeep }} />
                <p style={{ fontSize: 12, color: palette.inkSoft }}>{label}</p>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.1} className="order-1 lg:order-2 flex justify-center">
          <div className="drop-anim flex items-center justify-center" style={{ width: "min(360px,80vw)", height: "min(360px,80vw)", background: `linear-gradient(150deg, ${palette.sageMist}, ${palette.nude}88)` }}>
            <Sparkles size={56} style={{ color: palette.sageDeep }} className="float-slow" />
          </div>
        </Reveal>
      </section>
    ),
    reviews: () => (
      <section id="reviews" key="reviews" className="relative py-16 md:py-24 overflow-hidden" style={{ background: palette.sageMist }}>
        <GlowBlob colors={[`${palette.bronze}`, `${palette.bronze}00`]} style={{ width: 500, height: 500, top: "-8%", right: "-8%" }} />
        <div className="relative max-w-7xl mx-auto px-5 md:px-8">
          <RevealHeading className="mb-10 md:mb-14 max-w-xl">
            <p style={{ color: palette.sageDeep, fontSize: 13, fontWeight: 600 }} className="mb-3">نتایج واقعی</p>
            <h2 style={{ ...fontDisplay, fontWeight: 500, color: palette.ink }} className="text-3xl md:text-4xl">نظر جامعه مشتریان ما</h2>
          </RevealHeading>
          {approvedReviews.length === 0 ? (
            <EmptyState icon={MessageSquare} title="هنوز نظری ثبت نشده است" subtitle="نظرات تأییدشده مشتریان پس از ثبت، اینجا نمایش داده می‌شوند." palette={palette} />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {approvedReviews.map((t, i) => (
                <Reveal key={t.id} delay={i * 0.06}>
                  <div className="rounded-3xl p-6 h-full flex flex-col" style={{ background: palette.white }}>
                    <div className="flex items-center justify-between mb-3">
                      <Stars rating={t.rating} color={palette.gold || palette.bronze} />
                      <span className="flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-1" style={{ background: palette.sageMist, color: palette.sageDeep }}><Check size={11} /> خریدار تأییدشده</span>
                    </div>
                    <p style={{ color: palette.inkSoft, fontSize: 14, lineHeight: 1.85 }} className="flex-1 mb-4">«{t.text}»</p>
                    <div><p style={{ ...fontDisplay, fontSize: 15, color: palette.ink }}>{t.name}</p>{t.product && <p style={{ fontSize: 12, color: palette.inkSoft }}>{t.product}</p>}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
          <Reveal delay={0.1} className="mt-14 md:mt-20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2"><Instagram size={18} style={{ color: palette.sageDeep }} /><p style={{ ...fontDisplay, fontSize: 20, color: palette.ink }}>@viina.skin</p></div>
              <a href="#" className="text-sm underline underline-offset-4" style={{ color: palette.ink }}>دنبال کنید</a>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {[palette.nude, palette.sage, palette.beige, palette.nudeDeep, palette.creamDeep, palette.sageDeep].map((tint, i) => (
                <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: tint }}><Instagram size={22} style={{ color: `${palette.white}CC` }} /></div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    ),
    trust: () => (
      <section key="trust" className="max-w-7xl mx-auto px-5 md:px-8 py-14">
        <div className="rounded-3xl p-8 md:p-10 grid sm:grid-cols-3 gap-8" style={{ background: palette.ink }}>
          {[
            { icon: ShieldCheck, title: "ضمانت ۱۰۰٪ اصالت کالا", desc: "هر محصول با بچ‌کد اصیل و قابل استعلام از تولیدکننده اصلی عرضه می‌شود." },
            { icon: Truck, title: "شرایط نگهداری استاندارد", desc: "زنجیره نگهداری سرد و بسته‌بندی ایمن، از انبار تا درب منزل شما." },
            { icon: Clock, title: "پشتیبانی سریع و پاسخگو", desc: "تیم مشاوره پوستی ویینا همه‌روزه پاسخگوی سوالات شماست." },
          ].map((t, i) => (
            <Reveal key={i} delay={i * 0.08} className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${palette.white}18` }}><t.icon size={19} style={{ color: palette.gold || "#D9C39A" }} /></div>
              <div>
                <p style={{ ...fontDisplay, fontSize: 15.5, color: palette.white }} className="mb-1">{t.title}</p>
                <p style={{ fontSize: 12.5, color: `${palette.white}AA` }} className="leading-relaxed">{t.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    ),
    journal: () => {
      const journalPages = customPages.filter((pg) => pg.isJournal).slice(0, 3);
      if (journalPages.length === 0) return null;
      return (
        <section key="journal" className="max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-20">
          <RevealHeading className="mb-10 max-w-xl">
            <p style={{ color: palette.sageDeep, fontSize: 13, fontWeight: 600 }} className="mb-3">ژورنال ویینا</p>
            <h2 style={{ ...fontDisplay, fontWeight: 500, color: palette.ink }} className="text-3xl md:text-4xl">راهنمای مراقبت از پوست</h2>
          </RevealHeading>
          <div className="grid md:grid-cols-3 gap-6">
            {journalPages.map((pg, i) => (
              <Reveal key={pg.id} delay={i * 0.08}>
                <a href={`#/page/${pg.slug}`} className="group block h-full" aria-label={`${pg.title} — مطالعه مقاله در ژورنال ${BRAND_NAME}`}>
                  <article className="rounded-3xl overflow-hidden h-full" style={{ background: palette.white, border: `1px solid ${palette.beige}` }}>
                    <div className="h-36 relative overflow-hidden transition-transform duration-500 group-hover:scale-105" style={{ background: `linear-gradient(${130 + i * 30}deg, ${palette.sageMist}, ${palette.creamDeep})` }}>
                      <FileText size={28} className="absolute bottom-4 right-4" style={{ color: `${palette.sageDeep}AA` }} />
                    </div>
                    <div className="p-5">
                      <h3 style={{ ...fontDisplay, fontSize: 15.5, color: palette.ink }} className="mb-2 leading-snug">{pg.title}</h3>
                      <p style={{ fontSize: 12.5, color: palette.inkSoft }} className="line-clamp-2 mb-3">{(pg.content || "").slice(0, 90)}…</p>
                      <span className="inline-flex items-center gap-1 text-xs font-medium underline underline-offset-4" style={{ color: palette.sageDeep }}>ادامه مطلب <ChevronRight size={13} style={{ transform: "scaleX(-1)" }} /></span>
                    </div>
                  </article>
                </a>
              </Reveal>
            ))}
          </div>
        </section>
      );
    },
    contact: () => (
      <section id="contact" key="contact" className="max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-24 grid lg:grid-cols-2 gap-14">
        <Reveal>
          <p style={{ color: palette.sageDeep, fontSize: 13, fontWeight: 600 }} className="mb-3">در تماس باشید</p>
          <h2 style={{ ...fontDisplay, fontWeight: 500, color: palette.ink }} className="text-3xl md:text-4xl mb-8">ما اینجا هستیم تا کمک کنیم</h2>
          {contactSent ? (
            <div className="rounded-3xl p-8 flex flex-col items-center text-center" style={{ background: palette.sageMist }}>
              <Check size={28} style={{ color: palette.sageDeep }} className="mb-3" />
              <p style={{ ...fontDisplay, fontSize: 20, color: palette.ink }} className="mb-1">پیام ارسال شد</p>
              <p style={{ color: palette.inkSoft, fontSize: 14 }}>ظرف یک روز کاری پاسخ خواهیم داد.</p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setContactSent(true); }} className="grid sm:grid-cols-2 gap-4">
              <input required placeholder="نام" className="rounded-2xl px-4 py-3 text-sm border outline-none" style={{ borderColor: palette.beige, background: palette.white, color: palette.ink }} />
              <input required type="email" placeholder="ایمیل" className="rounded-2xl px-4 py-3 text-sm border outline-none" style={{ borderColor: palette.beige, background: palette.white, color: palette.ink }} />
              <input required placeholder="موضوع" className="sm:col-span-2 rounded-2xl px-4 py-3 text-sm border outline-none" style={{ borderColor: palette.beige, background: palette.white, color: palette.ink }} />
              <textarea required placeholder="پیام" rows={4} className="sm:col-span-2 rounded-2xl px-4 py-3 text-sm border outline-none resize-none" style={{ borderColor: palette.beige, background: palette.white, color: palette.ink }} />
              <button type="submit" className="sm:col-span-2 rounded-full px-6 py-3.5 text-sm font-medium flex items-center justify-center gap-2" style={{ background: palette.sageDeep, color: palette.white }}>ارسال پیام <Send size={15} style={{ transform: "scaleX(-1)" }} /></button>
            </form>
          )}
          <div className="grid grid-cols-3 gap-4 mt-9">
            {[[Mail, footer.contactEmail], [Phone, footer.contactPhone], [Clock, "شنبه تا چهارشنبه، ۹ تا ۱۸"]].map(([Icon, label]) => (
              <div key={label} className="flex flex-col items-start gap-2"><Icon size={16} style={{ color: palette.sageDeep }} /><p style={{ fontSize: 12, color: palette.inkSoft }}>{label}</p></div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4"><MapPin size={16} style={{ color: palette.sageDeep }} /><p style={{ fontSize: 12, color: palette.inkSoft }}>{footer.contactAddress}</p></div>
        </Reveal>
        <Reveal delay={0.1}>
          <p style={{ color: palette.sageDeep, fontSize: 13, fontWeight: 600 }} className="mb-3">سوالات</p>
          <h2 style={{ ...fontDisplay, fontWeight: 500, color: palette.ink }} className="text-3xl md:text-4xl mb-8">سوالات متداول</h2>
          <div className="divide-y" style={{ borderColor: palette.beige }}>
            {faqs.map((f, i) => (
              <div key={f.q + i} style={{ borderColor: palette.beige }} className="border-t first:border-t-0 py-4">
                <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} className="w-full flex items-center justify-between text-right gap-4">
                  <span style={{ ...fontDisplay, fontSize: 16, color: palette.ink }}>{f.q}</span>
                  <ChevronDown size={18} style={{ transform: openFaq === i ? "rotate(180deg)" : "none", transition: "transform 0.3s", color: palette.sageDeep, flexShrink: 0 }} />
                </button>
                <div className="accordion-body" style={{ gridTemplateRows: openFaq === i ? "1fr" : "0fr" }}>
                  <div className="overflow-hidden"><p style={{ color: palette.inkSoft, fontSize: 14, lineHeight: 1.9 }} className="pt-3 pl-8">{f.a}</p></div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>
    ),
  };

  return (
    <>
    <div dir="rtl" lang="fa" style={{ ...fontBody, background: palette.cream, color: palette.ink, zoom }} className="min-h-screen w-full">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Arabic:wght@400;500;600;700&family=Vazirmatn:wght@300;400;500;600;700&family=Estedad:wght@400;500;600;700&family=Lalezar&family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Inter:wght@400;500;600&display=swap');
        * { scroll-behavior: smooth; }
        ::selection { background: ${palette.sageMist}; color: ${palette.sageDeep}; }
        @keyframes dropMorph { 0%{border-radius:42% 58% 65% 35%/45% 40% 60% 55%;} 50%{border-radius:60% 40% 40% 60%/55% 60% 40% 45%;} 100%{border-radius:42% 58% 65% 35%/45% 40% 60% 55%;} }
        .drop-anim { animation: dropMorph 10s ease-in-out infinite; }
        @keyframes floatSlow { 0%,100%{transform:translateY(0px);} 50%{transform:translateY(-10px);} }
        .float-slow { animation: floatSlow 6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .drop-anim, .float-slow { animation: none !important; } }
        input:focus, button:focus-visible, a:focus-visible { outline: 2px solid ${palette.sage}; outline-offset: 2px; }
        .accordion-body { transition: grid-template-rows 0.35s ease; display: grid; }
        .product-card { transition: transform 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.5s cubic-bezier(0.16,1,0.3,1); }
        .product-card:hover { transform: translateY(-10px); box-shadow: 0 28px 54px -18px var(--glow, rgba(0,0,0,0.18)); }
        .product-lifestyle { transition: opacity 0.6s cubic-bezier(0.16,1,0.3,1); }
        .bestseller-track::-webkit-scrollbar { display: none; }
        .bestseller-track { scrollbar-width: none; -ms-overflow-style: none; }
        @keyframes waterDrift { 0% { transform: translateY(0) translateX(0); opacity:0; } 10% { opacity:0.8; } 90% { opacity:0.6; } 100% { transform: translateY(-140px) translateX(var(--drift,10px)); opacity:0; } }
        .water-particle { animation: waterDrift linear infinite; }
        @keyframes heartPulse { 0% { transform:scale(1);} 35% { transform:scale(1.5);} 60% { transform:scale(0.9);} 100% { transform:scale(1);} }
        .heart-pulse { animation: heartPulse 0.5s cubic-bezier(0.16,1,0.3,1); }
        @keyframes auraPulse { 0%,100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 0.85; transform: scale(1.06); } }
        @keyframes shimmerSweep { 0% { background-position: 200% 200%; } 100% { background-position: -50% -50%; } }
        .btn-shine { position: relative; overflow: hidden; }
        .btn-shine::after { content: ""; position: absolute; inset: 0; background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%); background-size: 250% 250%; background-position: 200% 200%; transition: background-position 0.7s ease; }
        .btn-shine:hover::after { background-position: -50% -50%; }
        ${theme.customCSS || ""}
      `}</style>

      {announcement.enabled && announcement.text && (
        <a href={announcement.link || "#"} className="block text-center text-xs font-medium py-2 px-4" style={{ background: announcement.bg, color: announcement.color }}>{announcement.text}</a>
      )}

      {renderHeader()}

      <main>
        {customPage ? (() => {
          const pd = theme.pageDefaults || {};
          const pageFontKey = customPage.fontSize || pd.fontSize || "متوسط";
          const pageFontPx = PAGE_FONT_SIZE_MAP[pageFontKey] || 15;
          const pageAlign = customPage.textAlign || pd.textAlign || "right";
          const pageBg = customPage.backgroundColor || pd.backgroundColor || "";
          const pageColor = customPage.textColor || pd.textColor || palette.inkSoft;
          return (
            <article className="max-w-3xl mx-auto px-5 md:px-8 py-16 md:py-24 min-h-[50vh]" style={{ background: pageBg || "transparent", textAlign: pageAlign }}>
              <p style={{ color: palette.sageDeep, fontSize: 13, fontWeight: 600 }} className="mb-3">{customPage.navLabel || "صفحه"}</p>
              <h1 style={{ ...fontDisplay, fontWeight: 500, color: pageColor === palette.inkSoft ? palette.ink : pageColor }} className="text-3xl md:text-4xl mb-6">{customPage.title}</h1>
              <div style={{ color: pageColor, fontSize: pageFontPx, lineHeight: 2.1 }} className="whitespace-pre-line">{customPage.content}</div>
            </article>
          );
        })() : (
          homeSections.filter((s) => s.visible).map((s) => sectionRenderers[s.key] && sectionRenderers[s.key]())
        )}
      </main>

      {/* ---------------- Footer ---------------- */}
      <footer className="overflow-hidden relative" style={{ background: palette.ink, color: palette.cream }}>
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-14 md:py-16">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <p style={{ fontFamily: theme.logoFont, fontWeight: 600, letterSpacing: "0.1em" }} className="text-2xl mb-4">{footer.col1Title}</p>
              <p style={{ color: "#C9C2B6", fontSize: 14, lineHeight: 1.9 }} className="max-w-sm mb-6">{footer.col1Text}</p>
              {subscribed ? (
                <p style={{ color: palette.sageMist, fontSize: 14 }} className="flex items-center gap-2"><Check size={16} /> ثبت شدید — صندوق ورودی ایمیل خود را بررسی کنید.</p>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); setSubscribed(true); }} className="flex gap-2 max-w-sm">
                  <input required type="email" placeholder="ایمیل شما" className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none" style={{ background: "#3A342C", color: palette.cream }} />
                  <button type="submit" className="rounded-full px-5 py-2.5 text-sm font-medium" style={{ background: palette.sage, color: palette.ink }}>عضویت</button>
                </form>
              )}
            </div>
            <div>
              <p style={{ fontSize: 12 }} className="mb-4 text-white/70">{footer.col2Title}</p>
              <div className="flex flex-col gap-2.5 text-sm" style={{ color: "#C9C2B6" }}>
                {footer.col2Links.map((l) => <a key={l.label} href={l.href} className="hover:text-white transition-colors">{l.label}</a>)}
              </div>
            </div>
            <div>
              <p style={{ fontSize: 12 }} className="mb-4 text-white/70">{footer.col3Title}</p>
              <div className="flex flex-col gap-2.5 text-sm" style={{ color: "#C9C2B6" }}>
                {footer.col3Links.map((l) => <a key={l.label} href={l.href} className="hover:text-white transition-colors">{l.label}</a>)}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 mb-8">
            {Object.entries(footer.socialEnabled).filter(([, v]) => v).map(([key]) => (
              <a key={key} href={footer.social[key] || "#"} className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold" style={{ background: "#3A342C" }}>
                {key === "instagram" ? <Instagram size={16} /> : key.slice(0, 2).toUpperCase()}
              </a>
            ))}
          </div>
          {footer.showPaymentBadges && (
            <div className="flex flex-wrap gap-2 mb-8">
              {["زرین‌پال", "Visa/Mastercard", "Apple Pay"].map((b) => (
                <span key={b} className="rounded-full px-3 py-1 text-[11px]" style={{ background: "#3A342C", color: "#C9C2B6" }}>{b}</span>
              ))}
            </div>
          )}
          <div className="pt-6 border-t flex flex-col sm:flex-row justify-between gap-2" style={{ borderColor: "#3A342C" }}>
            <p style={{ fontSize: 12, color: "#8A8377" }}>{footer.copyright}</p>
            <button onClick={onOpenAdmin} style={{ fontSize: 12, color: "#8A8377" }} className="hover:text-white transition-colors underline underline-offset-4 self-start sm:self-auto">پنل مدیریت</button>
          </div>
        </div>
      </footer>
    </div>

    {welcomeModal.enabled && showWelcome && <WelcomeModal config={welcomeModal} theme={theme} onDismiss={dismissWelcome} />}

    {/* ---------------- Skin Quiz trigger ----------------
        Rendered as a sibling of (not nested inside) the zoomed page
        container above: CSS `zoom` on an ancestor creates a new
        containing block for `position: fixed` descendants in some
        browsers, which was silently breaking this button's fixed
        positioning while scrolling. Keeping it — and every other
        fixed-position overlay below — outside that container fixes
        it for good. */}
    {quizSettings?.enabled && quizQuestions && quizQuestions.length > 0 && (
      <button
        onClick={() => { resetQuiz(); setQuizOpen(true); }}
        className="btn-shine fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full pl-5 pr-4 py-3.5 text-sm font-medium transition-transform duration-300 hover:scale-105"
        style={{ position: "fixed", background: palette.sageDeep, color: palette.white, boxShadow: `0 16px 36px -10px ${palette.sageDeep}99`, fontFamily: theme.bodyFont }}
      >
        <Sparkles size={16} /> {quizSettings.buttonText}
      </button>
    )}

      {/* ---------------- Skin Quiz modal ---------------- */}
      {quizOpen && quizQuestions && quizQuestions.length > 0 && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 backdrop-blur-sm" style={{ background: `${palette.ink}88` }} onClick={() => setQuizOpen(false)} />
          <div className="relative w-full max-w-lg rounded-3xl overflow-hidden backdrop-blur-xl border" style={{ background: `${palette.white}E6`, borderColor: `${palette.white}90`, boxShadow: `0 50px 120px -24px ${palette.ink}55` }}>
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: palette.beige }}>
              <p style={{ ...fontDisplay, fontSize: 19, color: palette.ink }}>مشاور هوشمند پوست</p>
              <button onClick={() => setQuizOpen(false)} aria-label="بستن"><X size={19} color={palette.ink} /></button>
            </div>

            <div className="px-6 pt-4">
              <div className="flex gap-1.5 mb-5">
                {quizQuestions.map((q, i) => (
                  <div key={q.id} className="flex-1 h-1.5 rounded-full" style={{ background: i <= quizStep ? palette.sageDeep : palette.creamDeep }} />
                ))}
              </div>
            </div>

            <div className="px-6 pb-6 min-h-[220px]">
              {quizStep < quizQuestions.length && (() => {
                const q = quizQuestions[quizStep];
                return (
                  <div>
                    <p style={{ ...fontDisplay, fontSize: 17, color: palette.ink }} className="mb-4">{q.question}</p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {q.options.map((opt) => (
                        <button key={opt.id} onClick={() => selectQuizAnswer(q.id, opt.id)} className="rounded-2xl py-3.5 px-3 text-sm font-medium border transition-all"
                          style={{ background: quizAnswers[q.id] === opt.id ? palette.sageDeep : palette.white, color: quizAnswers[q.id] === opt.id ? palette.white : palette.ink, borderColor: quizAnswers[q.id] === opt.id ? palette.sageDeep : palette.beige }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {quizStep > 0 && <button onClick={() => setQuizStep((s) => s - 1)} className="text-xs underline underline-offset-4 mt-4" style={{ color: palette.inkSoft }}>بازگشت</button>}
                  </div>
                );
              })()}

              {quizStep >= quizQuestions.length && (
                <div>
                  <p style={{ ...fontDisplay, fontSize: 17, color: palette.ink }} className="mb-1">روتین پیشنهادی شما</p>
                  {quizRecommendations.length === 0 ? (
                    <EmptyState compact icon={Package} title="هنوز روتینی برای این پاسخ تنظیم نشده" subtitle="این نتیجه هنوز از پنل مدیریت به هیچ محصولی متصل نشده است." palette={palette} />
                  ) : (
                    <>
                      {quizResolvedResult?.name && <p style={{ color: palette.inkSoft, fontSize: 13 }} className="mb-4">{quizResolvedResult.name}</p>}
                      <div className="flex flex-col gap-2.5 mb-5">
                        {quizRecommendations.map((p) => (
                          <div key={p.id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: palette.creamDeep }}>
                            <div className="rounded-xl flex items-center justify-center shrink-0" style={{ width: 44, height: 44, background: `${p.tint}55` }}><div className="scale-[0.45]"><Bottle tint={p.tint} ink={palette.ink} white={palette.white} /></div></div>
                            <p className="flex-1 truncate" style={{ fontSize: 13, color: palette.ink }}>{p.name}</p>
                            <span style={{ fontSize: 12.5, color: palette.inkSoft }}>{fmt(p.salePrice || p.price)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between rounded-2xl p-4 mb-4" style={{ background: palette.sageMist }}>
                        <div>
                          {quizDiscountPct > 0 && <p style={{ fontSize: 11.5, color: palette.inkSoft, textDecoration: "line-through" }}>{fmt(quizSubtotal)}</p>}
                          <p style={{ ...fontDisplay, fontSize: 19, color: palette.ink }}>{fmt(quizDiscounted)}</p>
                        </div>
                        {quizDiscountPct > 0 && <span className="rounded-full px-3 py-1.5 text-xs font-medium" style={{ background: palette.sageDeep, color: palette.white }}>{quizDiscountPct}٪ تخفیف روتین</span>}
                      </div>
                      <button onClick={addQuizRoutineToCart} className="btn-shine w-full rounded-full py-3.5 text-sm font-medium" style={{ background: palette.sageDeep, color: palette.white }}>
                        افزودن همه محصولات پیشنهادی به سبد خرید
                      </button>
                    </>
                  )}
                  <button onClick={() => setQuizStep(quizQuestions.length - 1)} className="text-xs underline underline-offset-4 mt-4 block" style={{ color: palette.inkSoft }}>بازگشت</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Compare: floating bar ---------------- */}
      {compareList.length > 0 && !compareOpen && (
        <div className="fixed bottom-5 inset-x-0 z-[55] flex justify-center px-4 pointer-events-none">
          <button onClick={() => setCompareOpen(true)} className="pointer-events-auto inline-flex items-center gap-3 rounded-full pl-3 pr-5 py-2.5 shadow-2xl" style={{ background: palette.ink, color: palette.white }}>
            <span className="flex items-center gap-1.5 text-sm font-medium"><Layers size={15} /> مقایسه ({compareList.length})</span>
            <span className="rounded-full px-3 py-1.5 text-xs font-medium" style={{ background: palette.white, color: palette.ink }}>مشاهده</span>
          </button>
        </div>
      )}

      {/* ---------------- Compare: side-by-side drawer ---------------- */}
      {compareOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0" style={{ background: `${palette.ink}88` }} onClick={() => setCompareOpen(false)} />
          <div className="relative w-full sm:max-w-4xl max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-6" style={{ background: palette.white }}>
            <div className="flex items-center justify-between mb-5">
              <p style={{ ...fontDisplay, fontSize: 20, color: palette.ink }}>مقایسه محصولات</p>
              <button onClick={() => setCompareOpen(false)} aria-label="بستن"><X size={18} style={{ color: palette.inkSoft }} /></button>
            </div>
            {compareList.length === 0 ? (
              <EmptyState icon={Layers} title="محصولی برای مقایسه انتخاب نشده" subtitle="از روی کارت هر محصول، دکمه مقایسه را بزنید." palette={palette} />
            ) : (
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${compareList.length}, minmax(0, 1fr))` }}>
                {compareList.map((id) => {
                  const p = products.find((pr) => pr.id === id);
                  if (!p) return null;
                  const ingredientList = (p.ingredients || "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4);
                  return (
                    <div key={id} className="rounded-2xl p-4 flex flex-col" style={{ border: `1px solid ${palette.beige}` }}>
                      <button onClick={() => toggleCompare(id)} className="self-end mb-2" aria-label="حذف از مقایسه"><X size={14} style={{ color: palette.inkSoft }} /></button>
                      <div className="rounded-xl flex items-center justify-center mb-3 mx-auto" style={{ width: 88, height: 88, background: `${p.tint}55` }}>
                        <Bottle tint={p.tint} ink={palette.ink} white={palette.white} label={buildProductAltText(p, categories)} />
                      </div>
                      <p style={{ ...fontDisplay, fontSize: 15, color: palette.ink }} className="mb-2 text-center">{p.name}</p>
                      <div className="flex flex-col gap-2.5 mt-2 text-xs" style={{ color: palette.inkSoft }}>
                        <div><p className="font-medium mb-0.5" style={{ color: palette.ink }}>قیمت</p><p>{fmt(p.salePrice || p.price)}</p></div>
                        <div><p className="font-medium mb-0.5" style={{ color: palette.ink }}>حجم</p><p>{p.volume || "—"}</p></div>
                        <div><p className="font-medium mb-0.5" style={{ color: palette.ink }}>مناسب پوست</p><p>{(p.skinTags || []).join("، ") || "—"}</p></div>
                        <div><p className="font-medium mb-0.5" style={{ color: palette.ink }}>ترکیبات کلیدی</p><p>{ingredientList.join("، ") || "—"}</p></div>
                      </div>
                      <button onClick={() => addToCart(p.id)} className="mt-4 rounded-full py-2 text-xs font-medium" style={{ background: palette.sageDeep, color: palette.white }}>افزودن به سبد</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- AI Visual Skin Analysis (simulation) ---------------- */}
      {aiScannerOpen && <AiSkinScannerModal palette={palette} headingFont={theme.headingFont} products={products} fmt={fmt} onAddToCart={addToCart} onClose={() => setAiScannerOpen(false)} />}

      {/* ---------------- Quick View ---------------- */}
      {quickView && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: `${palette.ink}88` }} onClick={() => setQuickView(null)} />
          <div className="relative w-full max-w-lg rounded-3xl p-6 flex flex-col sm:flex-row gap-5" style={{ background: palette.white }}>
            <button onClick={() => setQuickView(null)} className="absolute top-4 left-4" aria-label="بستن"><X size={18} /></button>
            <div className="rounded-2xl flex items-center justify-center shrink-0 mx-auto sm:mx-0" style={{ width: 140, height: 140, background: `${quickView.tint}55` }}>
              <Bottle tint={quickView.tint} ink={palette.ink} white={palette.white} label={buildProductAltText(quickView, categories)} />
            </div>
            <div className="flex-1">
              {quickView.tag && <p style={{ fontSize: 11, color: palette.bronze }} className="font-medium mb-1">{quickView.tag}</p>}
              <p style={{ ...fontDisplay, fontSize: 20, color: palette.ink }} className="mb-2">{quickView.name}</p>
              {quickView.shortDescription && <p style={{ color: palette.inkSoft, fontSize: 13.5 }} className="mb-3">{quickView.shortDescription}</p>}
              <p style={{ ...fontDisplay, fontSize: 18, color: palette.ink }} className="mb-4">{fmt(quickView.salePrice || quickView.price)}</p>
              <button onClick={() => { addToCart(quickView.id); setQuickView(null); }} className="rounded-full px-5 py-2.5 text-sm font-medium" style={{ background: palette.sageDeep, color: palette.white }}>افزودن به سبد</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Cart Drawer ---------------- */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-start">
          <div className="absolute inset-0 backdrop-blur-sm" style={{ background: `${palette.ink}55` }} onClick={() => setCartOpen(false)} />
          <div className="relative w-full sm:w-[420px] h-full flex flex-col shadow-2xl backdrop-blur-md" style={{ background: `${palette.white}E6`, backdropFilter: "blur(20px) saturate(160%)", WebkitBackdropFilter: "blur(20px) saturate(160%)", animation: "slideIn 0.45s cubic-bezier(0.16,1,0.3,1)" }}>
            <style>{`@keyframes slideIn { from { transform: translateX(-100%);} to { transform: translateX(0);} }`}</style>
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: `${palette.beige}90` }}>
              <p style={{ ...fontDisplay, fontSize: 20, color: palette.ink }}>سبد خرید شما ({cartCount})</p>
              <button onClick={() => setCartOpen(false)} aria-label="بستن سبد خرید"><X size={20} /></button>
            </div>
            <div className="px-6 py-4 border-b" style={{ borderColor: palette.beige }}>
              <p style={{ fontSize: 12, color: palette.inkSoft }} className="mb-2">{shipProgress >= 100 ? "ارسال رایگان فعال شد 🎉" : `${fmt(FREE_SHIP - subtotal)} تا ارسال رایگان باقی مانده است`}</p>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: palette.creamDeep }}><div className="h-full rounded-full transition-all duration-500" style={{ width: `${shipProgress}%`, background: palette.sageDeep }} /></div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                  <ShoppingBag size={32} style={{ color: palette.beige }} />
                  <p style={{ color: palette.inkSoft, fontSize: 14 }}>سبد خرید شما خالی است.</p>
                  <button onClick={() => setCartOpen(false)} className="text-sm underline underline-offset-4">ادامه خرید</button>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {cartItems.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <div className="rounded-2xl flex items-center justify-center shrink-0" style={{ width: 68, height: 68, background: `${c.product.tint}55` }}><div className="scale-75"><Bottle tint={c.product.tint} ink={palette.ink} white={palette.white} label={`${c.product.name} - خرید از ${BRAND_NAME}`} /></div></div>
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <p style={{ ...fontDisplay, fontSize: 15, color: palette.ink }} className="leading-tight">{c.product.name}</p>
                          <button onClick={() => removeItem(c.id)} aria-label="حذف مورد"><Trash2 size={15} style={{ color: palette.inkSoft }} /></button>
                        </div>
                        <p style={{ fontSize: 13, color: palette.inkSoft }} className="mt-1">{fmt(c.product.salePrice || c.product.price)}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <button onClick={() => changeQty(c.id, -1)} className="w-6 h-6 rounded-full flex items-center justify-center border" style={{ borderColor: palette.beige }}><Minus size={12} /></button>
                          <span style={{ fontSize: 13 }}>{c.qty}</span>
                          <button onClick={() => changeQty(c.id, 1)} className="w-6 h-6 rounded-full flex items-center justify-center border" style={{ borderColor: palette.beige }}><Plus size={12} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {cartItems.length > 0 && (
              <div className="px-6 py-5 border-t" style={{ borderColor: palette.beige }}>
                <div className="flex items-center justify-between mb-4"><span style={{ color: palette.inkSoft, fontSize: 14 }}>جمع جزء</span><span style={{ ...fontDisplay, fontSize: 20, color: palette.ink }}>{fmt(subtotal)}</span></div>
                <button onClick={() => { setCartOpen(false); user ? onGoCheckout() : onGoAuth(); }} className="btn-shine w-full rounded-full py-3.5 text-sm font-medium" style={{ background: palette.sageDeep, color: palette.white }}>تسویه‌حساب</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* =================================================================
   AUTH PAGE — interactive mascots + login/signup form
   (mouse-tracking eyes, password-focus blink, show/hide-password
   surprise, and a happy bounce on button hover/submit — done with
   plain CSS transitions + a shared mouse-position hook, since
   Framer Motion isn't available as a library in this environment)
================================================================== */
function useMousePosition(active) {
  const [pos, setPos] = useState({ x: -9999, y: -9999 });
  useEffect(() => {
    if (!active) return;
    function onMove(e) { setPos({ x: e.clientX, y: e.clientY }); }
    function onTouch(e) { if (e.touches[0]) setPos({ x: e.touches[0].clientX, y: e.touches[0].clientY }); }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("touchstart", onTouch, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchstart", onTouch);
    };
  }, [active]);
  return pos;
}



/* fixed, cute pastel palette per character — independent of the site
   theme, since these are illustrated characters with their own
   personality/branding, not theme-following chrome */
const MASCOT_PALETTES = {
  drop: { light: "#DEF6FC", base: "#8FD9EF", deep: "#4FA9CC", shadow: "#3A87A8" },
  bottle: { light: "#FFE7E1", base: "#FFA79A", deep: "#FF7B68", shadow: "#E05B47", cap: "#4A4038" },
  jar: { light: "#FFF6E0", base: "#F6DE9B", deep: "#E8BF67", shadow: "#C99A44", lid: "#E3A75E" },
  leaf: { light: "#E7F7DA", base: "#A8DD8E", deep: "#79BB5C", shadow: "#5D9944" },
};

/**
 * `eyesClosed` rule (simplified, strict — no other conditions apply):
 *   - password field focused -> eyesClosed = true, for the entire
 *     duration of focus, regardless of the show/hide toggle
 *   - password field blurred (or any other field, e.g. email) -> eyesClosed = false
 * The caller (AuthPage) computes this from isPasswordActive alone;
 * Mascot only renders whatever boolean it's given.
 */
function Mascot({ kind, mouse, eyesClosed, surprised, excited, size = 84, delay = 0 }) {
  const ref = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (!ref.current || eyesClosed) { setOffset({ x: 0, y: 0 }); return; }
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2.6;
    const dx = mouse.x - cx, dy = mouse.y - cy;
    const dist = Math.hypot(dx, dy) || 1;
    const maxR = surprised ? 4 : 2.6;
    const r = Math.min(maxR, dist / 24);
    setOffset({ x: (dx / dist) * r, y: (dy / dist) * r });
  }, [mouse, eyesClosed, surprised]);

  const c = MASCOT_PALETTES[kind];
  const gid = `m-${kind}`;
  const pupilVisible = !eyesClosed;
  const eyelidVisible = eyesClosed;
  const handsCovering = eyesClosed;

  return (
    <div ref={ref} className="relative select-none" style={{ width: size, height: size * 1.3, animation: "mascotBob 3.6s ease-in-out infinite", animationDelay: `${delay}s` }}>
      <div style={{ width: "100%", height: "100%", transform: excited ? "translateY(-8px) rotate(-4deg) scale(1.06)" : "translateY(0) rotate(0deg) scale(1)", transition: "transform 0.45s cubic-bezier(0.34,1.56,0.64,1)", filter: `drop-shadow(0 12px 16px ${c.shadow}55)` }}>
        <svg viewBox="0 0 120 140" width="100%" height="100%">
          <defs>
            <linearGradient id={`${gid}-body`} x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor={c.light} />
              <stop offset="55%" stopColor={c.base} />
              <stop offset="100%" stopColor={c.deep} />
            </linearGradient>
            <radialGradient id={`${gid}-shine`} cx="35%" cy="26%" r="45%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>
          </defs>

          {kind === "drop" && (
            <path d="M60,8 C92,52 102,80 102,98 C102,120 83,136 60,136 C37,136 18,120 18,98 C18,80 28,52 60,8 Z" fill={`url(#${gid}-body)`} stroke={c.shadow} strokeOpacity="0.25" strokeWidth="1.5" />
          )}
          {kind === "bottle" && (
            <>
              <rect x="44" y="6" width="32" height="20" rx="8" fill={c.cap} />
              <rect x="52" y="20" width="16" height="18" rx="6" fill={`url(#${gid}-body)`} />
              <rect x="22" y="34" width="76" height="98" rx="32" fill={`url(#${gid}-body)`} stroke={c.shadow} strokeOpacity="0.2" strokeWidth="1.5" />
            </>
          )}
          {kind === "jar" && (
            <>
              <rect x="12" y="18" width="96" height="26" rx="13" fill={c.lid} stroke={c.shadow} strokeOpacity="0.2" strokeWidth="1.5" />
              <rect x="14" y="40" width="92" height="88" rx="24" fill={`url(#${gid}-body)`} stroke={c.shadow} strokeOpacity="0.2" strokeWidth="1.5" />
            </>
          )}
          {kind === "leaf" && (
            <>
              <path d="M60,10 C104,26 106,88 60,132 C14,88 16,26 60,10 Z" fill={`url(#${gid}-body)`} stroke={c.shadow} strokeOpacity="0.25" strokeWidth="1.5" />
              <path d="M60,26 L60,118" stroke={c.shadow} strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
            </>
          )}

          <ellipse cx="46" cy="46" rx="30" ry="20" fill={`url(#${gid}-shine)`} />

          <ellipse cx="32" cy="90" rx="9" ry="5.5" fill="#FF9E9E" opacity="0.55" />
          <ellipse cx="88" cy="90" rx="9" ry="5.5" fill="#FF9E9E" opacity="0.55" />

          <path d={surprised ? "M32,52 Q40,42 48,52" : excited ? "M32,56 Q40,48 48,55" : "M32,58 Q40,52 48,58"} stroke="#3A332C" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d={surprised ? "M72,52 Q80,42 88,52" : excited ? "M72,55 Q80,48 88,56" : "M72,58 Q80,52 88,58"} stroke="#3A332C" strokeWidth="3" strokeLinecap="round" fill="none" />

          {/* open, cursor-tracking eyes by default; closed eyelid + hidden
              pupil only when eyesClosed is explicitly true (password state) */}
          {[40, 80].map((ex, i) => (
            <g key={i}>
              <circle cx={ex} cy="76" r={surprised ? 15.5 : 12.5} fill="#FFFFFF" stroke="#3A332C" strokeOpacity="0.12" strokeWidth="1" />
              <circle cx={ex + offset.x} cy={76 + offset.y} r={surprised ? 7.5 : 6.2} fill="#2E2A24" opacity={pupilVisible ? 1 : 0} style={{ transition: "opacity 0.18s ease" }} />
              <circle cx={ex + offset.x - 2} cy={76 + offset.y - 2.2} r="1.8" fill="#FFFFFF" opacity={pupilVisible ? 0.9 : 0} style={{ transition: "opacity 0.18s ease" }} />
              <path d={`M${ex - 13},76 Q${ex},76 ${ex + 13},76`} stroke="#3A332C" strokeWidth="3" strokeLinecap="round" fill="none" opacity={eyelidVisible ? 1 : 0} style={{ transition: "opacity 0.18s ease" }} />
            </g>
          ))}

          <path d={excited ? "M50,98 Q60,113 70,98" : "M52,98 Q60,104 68,98"} stroke="#3A332C" strokeWidth="3" strokeLinecap="round" fill="none" />

          {/* little hands — rest at the sides; slide straight up (pure
              translate, no rotation/transform-origin dependency) only
              when handsCovering (== eyesClosed) is true */}
          <ellipse cx="10" cy="100" rx="13" ry="11" fill={`url(#${gid}-body)`} stroke={c.shadow} strokeOpacity="0.3" strokeWidth="1"
            style={{ transform: handsCovering ? "translate(32px, -22px) scale(1.15)" : "translate(0px, 0px) scale(1)", transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)" }} />
          <ellipse cx="110" cy="100" rx="13" ry="11" fill={`url(#${gid}-body)`} stroke={c.shadow} strokeOpacity="0.3" strokeWidth="1"
            style={{ transform: handsCovering ? "translate(-32px, -22px) scale(1.15)" : "translate(0px, 0px) scale(1)", transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)" }} />
        </svg>
      </div>
    </div>
  );
}

/* frosted-glass text input with a floating label. Floating-label
   show/hide is done with React state (focused / hasValue) rather than
   Tailwind's peer-[...] arbitrary variants, since this environment
   only ships Tailwind's predefined utility set without a JIT compiler
   — the glass styling itself uses real, predefined Tailwind classes
   (bg-white/30, border-white/50, ring-emerald-600/40, etc). */
function FloatingInput({ label, type = "text", value, onChange, required, dir, icon, onFocus, onBlur, maxLength }) {
  const [focused, setFocused] = useState(false);
  const active = focused || (value && value.length > 0);
  return (
    <div className="relative">
      <input
        type={type} required={required} value={value} onChange={onChange} dir={dir} maxLength={maxLength}
        onFocus={(e) => { setFocused(true); onFocus && onFocus(e); }}
        onBlur={(e) => { setFocused(false); onBlur && onBlur(e); }}
        placeholder=" "
        className={`w-full rounded-2xl px-4 pt-5 pb-2.5 text-sm border outline-none backdrop-blur-md bg-white/30 border-white/50 text-slate-800 placeholder-slate-500 transition-all duration-200 ${focused ? "bg-white/40 ring-2 ring-emerald-600/40 border-white/70" : ""}`}
      />
      <label
        className="absolute pointer-events-none transition-all duration-200 text-slate-500"
        style={{ right: 16, top: active ? 7 : "50%", transform: active ? "translateY(0) scale(0.78)" : "translateY(-50%) scale(1)", transformOrigin: "right top", color: active ? "#059669" : undefined, fontSize: 13 }}
      >
        {label}
      </label>
      {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2">{icon}</div>}
    </div>
  );
}

function AuthPage({ theme, authSettings, onLogin, onBack }) {
  const palette = theme;
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordActive, setIsPasswordActive] = useState(false);
  const [surprised, setSurprised] = useState(false);
  const [excited, setExcited] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", password: "" });
  const mouse = useMousePosition(true);

  /* phone + OTP step. No real SMS gateway exists in this artifact
     (same honesty note as the simulated Zarinpal step in checkout),
     so verification is simulated against a fixed demo code. */
  const DEMO_OTP = "1234";
  const [authStep, setAuthStep] = useState("form"); // "form" | "otp"
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const otpRefs = useRef([]);

  function isValidIranPhone(v) { return /^09\d{9}$/.test(v); }

  function finishLogin() {
    onLogin({ firstName: form.firstName || "کاربر", lastName: form.lastName, phone: form.phone });
  }

  function handleOtpDigitChange(i, raw) {
    const digit = raw.replace(/[^0-9]/g, "").slice(-1);
    const chars = otp.split("");
    chars[i] = digit;
    const next = chars.join("").slice(0, 4);
    setOtp(next);
    setOtpError(false);
    if (digit && i < 3) otpRefs.current[i + 1]?.focus();
  }
  function handleOtpKeyDown(i, e) {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  }
  useEffect(() => {
    if (authStep !== "otp" || otp.length !== 4 || otpVerifying) return;
    setOtpVerifying(true);
    setTimeout(() => {
      if (otp === DEMO_OTP) {
        setExcited(true);
        setTimeout(finishLogin, 400);
      } else {
        setOtpError(true);
        setOtp("");
        otpRefs.current[0]?.focus();
        setOtpVerifying(false);
      }
    }, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, authStep]);

  // Strict rule, no other conditions: eyes are closed for exactly as
  // long as the password field is focused, full stop. They reopen
  // only on blur — clicking the show/hide icon does not reopen them
  // (that click doesn't blur the input), it only flashes a separate
  // "surprised" eyebrow reaction on top of the still-closed eyes.
  const shouldCloseEyes = isPasswordActive;

  function togglePassword() {
    setShowPassword((v) => !v);
    setSurprised(true);
    setTimeout(() => setSurprised(false), 750);
  }
  function handleSubmit(e) {
    e.preventDefault();
    if (!isValidIranPhone(form.phone)) return;
    setExcited(true);
    setTimeout(() => { setExcited(false); setAuthStep("otp"); }, 350);
  }

  const isMinimal = authSettings.backgroundStyle === "minimal";

  return (
    <div dir="rtl" lang="fa" style={{ fontFamily: theme.bodyFont, background: isMinimal ? palette.cream : `linear-gradient(160deg, ${palette.cream}, ${palette.sageMist} 60%, ${palette.nude}33)`, color: palette.ink }} className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Arabic:wght@400;500;600;700&family=Vazirmatn:wght@300;400;500;600;700&family=Cinzel:wght@600&display=swap');
        @keyframes mascotBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
        @keyframes hydrationBubble { 0% { transform: translateY(0) scale(0.8); opacity: 0; } 15% { opacity: 0.8; } 85% { opacity: 0.5; } 100% { transform: translateY(-120px) scale(1.1); opacity: 0; } }
        .hydration-bubble { animation: hydrationBubble linear infinite; }
        @keyframes auraDrift1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,30px) scale(1.12); } }
        @keyframes auraDrift2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-35px,-25px) scale(1.08); } }
        @keyframes auraDrift3 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-20px,35px) scale(1.15); } }
        @keyframes podiumGlow { 0%,100% { opacity: 0.5; } 50% { opacity: 0.85; } }
        @keyframes otpEnter { 0% { transform: rotate(-220deg) scale(0.3); opacity: 0; } 65% { transform: rotate(12deg) scale(1.08); opacity: 1; } 100% { transform: rotate(0deg) scale(1); opacity: 1; } }
        @keyframes otpShakeX { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-9px); } 40% { transform: translateX(9px); } 60% { transform: translateX(-6px); } 80% { transform: translateX(6px); } }
        .otp-shake { animation: otpShakeX 0.45s ease; }
      `}</style>

      {!isMinimal && (
        <>
          <div aria-hidden="true" className="absolute rounded-full pointer-events-none" style={{ width: 560, height: 560, top: "-16%", left: "-12%", background: `radial-gradient(circle, ${palette.sage}55, transparent 70%)`, filter: "blur(50px)", animation: "auraDrift1 14s ease-in-out infinite" }} />
          <div aria-hidden="true" className="absolute rounded-full pointer-events-none" style={{ width: 480, height: 480, bottom: "-14%", right: "-10%", background: `radial-gradient(circle, ${palette.nude}55, transparent 70%)`, filter: "blur(50px)", animation: "auraDrift2 17s ease-in-out infinite" }} />
          <div aria-hidden="true" className="absolute rounded-full pointer-events-none" style={{ width: 360, height: 360, top: "35%", left: "45%", background: `radial-gradient(circle, ${palette.white}70, transparent 72%)`, filter: "blur(45px)", animation: "auraDrift3 20s ease-in-out infinite" }} />
        </>
      )}

      <button onClick={onBack} className="absolute top-6 right-6 z-20 inline-flex items-center gap-1.5 text-sm font-medium rounded-full px-4 py-2.5 backdrop-blur-md transition-transform hover:scale-105" style={{ background: `${palette.white}80`, color: palette.ink, border: `1px solid ${palette.white}90` }}>
        <ArrowRight size={14} /> بازگشت به فروشگاه
      </button>

      <div className={`relative z-10 w-full max-w-4xl grid overflow-hidden backdrop-blur-2xl border rounded-3xl ${authSettings.mascotEnabled ? "lg:grid-cols-2" : ""}`} style={{ background: `${palette.white}60`, borderColor: `${palette.white}66`, boxShadow: `0 60px 140px -28px ${palette.ink}60, inset 0 1px 0 ${palette.white}80`, maxWidth: authSettings.mascotEnabled ? undefined : 460 }}>
        {authSettings.mascotEnabled && (
          <div className="relative flex flex-col items-center justify-center gap-3 lg:gap-8 px-5 pt-8 pb-6 lg:p-10 overflow-hidden" style={{ background: `radial-gradient(circle at 30% 20%, ${palette.sageMist}CC, ${palette.nude}55 55%, ${palette.sage}33 100%)` }}>
            {[
              { left: "12%", size: 8, dur: 5.5, delay: 0 },
              { left: "28%", size: 5, dur: 7, delay: 1.2 },
              { left: "48%", size: 6, dur: 6, delay: 2.4 },
              { left: "65%", size: 4, dur: 8, delay: 0.6 },
              { left: "82%", size: 7, dur: 6.5, delay: 1.8 },
            ].map((b, i) => (
              <span key={i} aria-hidden="true" className="hydration-bubble pointer-events-none absolute rounded-full bottom-0" style={{ left: b.left, width: b.size, height: b.size, background: `${palette.white}CC`, boxShadow: `0 0 8px ${palette.white}`, animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s` }} />
            ))}
            <p className="hidden lg:block relative z-10" style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.14em", fontWeight: 600, fontSize: 22, color: palette.ink }}>VIINA</p>

            <div className="relative z-10 w-full max-w-[280px]">
              <div aria-hidden="true" className="absolute left-1/2 -translate-x-1/2 rounded-full" style={{ bottom: 6, width: "88%", height: 22, background: `radial-gradient(ellipse, ${palette.white}CC, transparent 75%)`, filter: "blur(6px)", animation: "podiumGlow 3.4s ease-in-out infinite" }} />
              <div className="relative grid grid-cols-4 gap-2.5 sm:gap-5 lg:gap-7 rounded-2xl backdrop-blur-md border px-3 py-4" style={{ background: `${palette.white}35`, borderColor: `${palette.white}60`, boxShadow: `inset 0 1px 0 ${palette.white}80` }}>
                <Mascot kind="drop" mouse={mouse} eyesClosed={shouldCloseEyes} surprised={surprised} excited={excited} size={58} delay={0} />
                <Mascot kind="bottle" mouse={mouse} eyesClosed={shouldCloseEyes} surprised={surprised} excited={excited} size={58} delay={0.4} />
                <Mascot kind="jar" mouse={mouse} eyesClosed={shouldCloseEyes} surprised={surprised} excited={excited} size={58} delay={0.8} />
                <Mascot kind="leaf" mouse={mouse} eyesClosed={shouldCloseEyes} surprised={surprised} excited={excited} size={58} delay={1.2} />
              </div>
              <div aria-hidden="true" className="mx-auto rounded-full" style={{ width: "70%", height: 5, marginTop: 6, background: `linear-gradient(90deg, transparent, ${palette.white}CC, transparent)`, filter: "blur(1px)" }} />
            </div>

            <p className="hidden lg:block max-w-[220px] relative z-10" style={{ color: palette.inkSoft, fontSize: 13, textAlign: "center", lineHeight: 1.8 }}>دوستان کوچک ویینا همراه شما در مسیر مراقبت از پوست</p>
          </div>
        )}

        <div className="p-6 sm:p-8">
          {authStep === "form" ? (
            <>
              <div className="flex rounded-full p-1 mb-8 backdrop-blur-md" style={{ background: `${palette.white}55`, border: `1px solid ${palette.white}70` }}>
                <button onClick={() => setMode("login")} className="flex-1 rounded-full py-2.5 text-sm font-medium transition-all" style={{ background: mode === "login" ? palette.sageDeep : "transparent", color: mode === "login" ? palette.white : palette.inkSoft }}>ورود</button>
                <button onClick={() => setMode("signup")} className="flex-1 rounded-full py-2.5 text-sm font-medium transition-all" style={{ background: mode === "signup" ? palette.sageDeep : "transparent", color: mode === "signup" ? palette.white : palette.inkSoft }}>ثبت‌نام</button>
              </div>

              <h1 style={{ fontFamily: theme.headingFont, fontSize: 24, color: palette.ink }} className="mb-2">{mode === "login" ? authSettings.loginHeading : authSettings.signupHeading}</h1>
              <p style={{ color: palette.inkSoft, fontSize: 13.5 }} className="mb-7">{mode === "login" ? authSettings.loginSubtitle : authSettings.signupSubtitle}</p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {mode === "signup" && (
                  <div className="grid grid-cols-2 gap-3">
                    <FloatingInput label="نام" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
                    <FloatingInput label="نام خانوادگی" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
                  </div>
                )}
                <FloatingInput
                  label="شماره موبایل (مثلاً 0912xxxxxxx)" type="tel" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9]/g, "").slice(0, 11) })}
                  required dir="ltr" maxLength={11}
                />
                <FloatingInput
                  label="رمز عبور" type={showPassword ? "text" : "password"} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onFocus={() => setIsPasswordActive(true)} onBlur={() => setIsPasswordActive(false)}
                  required dir="ltr"
                  icon={
                    <button type="button" onClick={togglePassword} className="pointer-events-auto" aria-label="نمایش/پنهان کردن رمز عبور">
                      {showPassword ? <EyeOff size={16} className="text-slate-500" /> : <Eye size={16} className="text-slate-500" />}
                    </button>
                  }
                />
                {form.phone.length > 0 && !isValidIranPhone(form.phone) && (
                  <p style={{ fontSize: 11.5, color: "#A5453A" }} className="-mt-2">شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.</p>
                )}
                {mode === "login" && <a href="#" className="self-end text-xs underline underline-offset-4" style={{ color: palette.sageDeep }}>رمز عبور را فراموش کرده‌اید؟</a>}

                <button
                  type="submit" onMouseEnter={() => setExcited(true)} onMouseLeave={() => setExcited(false)}
                  className="btn-shine rounded-full py-3.5 text-sm font-medium mt-2 transition-transform duration-300 hover:-translate-y-0.5"
                  style={{ background: palette.sageDeep, color: palette.white, boxShadow: `0 14px 32px -10px ${palette.sageDeep}88` }}
                >
                  {mode === "login" ? "دریافت کد تایید" : "ثبت‌نام و دریافت کد تایید"}
                </button>
              </form>

              {authSettings.showGoogleButton && (
                <>
                  <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px" style={{ background: palette.beige }} />
                    <span style={{ fontSize: 11.5, color: palette.inkSoft }}>یا</span>
                    <div className="flex-1 h-px" style={{ background: palette.beige }} />
                  </div>

                  <button
                    type="button"
                    onClick={() => { setExcited(true); setTimeout(() => onLogin({ firstName: "کاربر", lastName: "گوگل", email: "user@gmail.com" }), 400); }}
                    onMouseEnter={() => setExcited(true)} onMouseLeave={() => setExcited(false)}
                    className="w-full flex items-center justify-center gap-2.5 rounded-full py-3 text-sm font-medium border backdrop-blur-md transition-colors"
                    style={{ borderColor: `${palette.white}80`, color: palette.ink, background: `${palette.white}55` }}
                  >
                    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34 5.1 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-3.5z" />
                      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34 5.1 29.3 3 24 3c-7.7 0-14.4 4.3-17.7 11.7z" />
                      <path fill="#4CAF50" d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 36.2 26.7 37 24 37c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 40.6 16.2 45 24 45z" />
                      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.2 5.2C40.9 36 44 30.6 44 24c0-1.4-.1-2.7-.4-3.5z" />
                    </svg>
                    ورود با گوگل
                  </button>
                </>
              )}

              <p style={{ fontSize: 11.5, color: palette.inkSoft }} className="text-center mt-6">با ادامه، شما <a href="#" className="underline">شرایط استفاده</a> و <a href="#" className="underline">حریم خصوصی</a> ویینا را می‌پذیرید.</p>
            </>
          ) : (
            <div className="flex flex-col items-center text-center">
              <button onClick={() => { setAuthStep("form"); setOtp(""); setOtpError(false); }} className="self-start inline-flex items-center gap-1.5 text-xs font-medium mb-6" style={{ color: palette.inkSoft }}>
                <ArrowRight size={13} /> ویرایش شماره موبایل
              </button>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: palette.sageMist }}>
                <Phone size={22} style={{ color: palette.sageDeep }} />
              </div>
              <h1 style={{ fontFamily: theme.headingFont, fontSize: 22, color: palette.ink }} className="mb-2">تایید شماره موبایل</h1>
              <p style={{ color: palette.inkSoft, fontSize: 13.5 }} className="mb-8 max-w-xs">کد ۴ رقمی ارسال‌شده به شماره <span dir="ltr" style={{ fontWeight: 600, color: palette.ink }}>{form.phone}</span> را وارد کنید.</p>

              <div className="flex items-center justify-center gap-3 mb-4" dir="ltr">
                {[0, 1, 2, 3].map((i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    value={otp[i] || ""}
                    onChange={(e) => handleOtpDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    inputMode="numeric"
                    maxLength={1}
                    autoFocus={i === 0}
                    className={`otp-box w-14 h-14 rounded-2xl text-center text-xl font-semibold border-2 outline-none ${otpError ? "otp-shake" : ""}`}
                    style={{
                      borderColor: otpError ? "#C0392B" : palette.sageDeep,
                      color: otpError ? "#C0392B" : palette.ink,
                      background: `${palette.white}90`,
                      animation: `otpEnter 0.55s cubic-bezier(.34,1.56,.64,1) ${i * 0.09}s both`,
                    }}
                  />
                ))}
              </div>

              {otpError && (
                <p style={{ fontSize: 12.5, color: "#C0392B" }} className="mb-2 flex items-center gap-1.5"><AlertTriangle size={13} /> کد وارد شده اشتباه است، دوباره تلاش کنید.</p>
              )}
              {otpVerifying && !otpError && <p style={{ fontSize: 12.5, color: palette.inkSoft }} className="mb-2">در حال بررسی کد…</p>}

              <button type="button" onClick={() => { setOtp(""); setOtpError(false); }} className="text-xs underline underline-offset-4 mt-3" style={{ color: palette.sageDeep }}>ارسال مجدد کد</button>
              <p style={{ fontSize: 10.5, color: palette.inkSoft }} className="mt-6 max-w-xs leading-relaxed">در این پیش‌نمایش پیامک واقعی ارسال نمی‌شود؛ برای ادامه کد <b dir="ltr">1234</b> را وارد کنید.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


/* =================================================================
   CHECKOUT PAGE — full shipping/personal-info form + order summary.
   No real payment backend exists here, so "Zarinpal" acts as a
   clearly-labeled simulated payment step (same honesty note as the
   admin panel's payment settings).
================================================================== */
const PROVINCES = ["تهران", "اصفهان", "فارس", "خراسان رضوی", "آذربایجان شرقی", "خوزستان", "البرز", "مازندران", "گیلان", "کرمان"];
const SHIPPING_METHODS = [
  { id: "express", label: "پست پیشتاز", desc: "۲ تا ۳ روز کاری", price: 150000, icon: Truck },
  { id: "tipax", label: "تیپاکس", desc: "۱ تا ۲ روز کاری", price: 220000, icon: PackageCheck },
  { id: "courier", label: "پیک اختصاصی (ویژه تهران)", desc: "همان روز، فقط تهران", price: 90000, icon: MapPin },
];

function CheckoutPage({ cart, products, user, currencySettings, theme, rewardsSettings, onBack, onPlaceOrder }) {
  const palette = theme;
  const fmt = (n) => formatPrice(n, currencySettings);
  const [form, setForm] = useState({
    firstName: user?.firstName || "", lastName: user?.lastName || "", phone: user?.phone || "", email: user?.email || "",
    province: "", city: "", address: "", postalCode: "", unit: "", notes: "",
  });
  const [shippingMethod, setShippingMethod] = useState("express");
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);

  const cartItems = cart.map((c) => ({ ...c, product: products.find((p) => p.id === c.id) })).filter((c) => c.product);
  const subtotal = cartItems.reduce((s, c) => s + (c.product.salePrice || c.product.price) * c.qty, 0);
  const shipCost = SHIPPING_METHODS.find((m) => m.id === shippingMethod)?.price || 0;
  const total = subtotal + shipCost;
  const earnedPoints = Math.round(subtotal * ((rewardsSettings?.earnRatePct || 0) / 100));

  function handlePay(e) {
    e.preventDefault();
    if (cartItems.length === 0) return;
    setPlacing(true);
    setTimeout(() => { setPlacing(false); setPlaced(true); }, 1200);
  }

  if (placed) {
    return (
      <div dir="rtl" lang="fa" style={{ fontFamily: theme.bodyFont, background: palette.cream, color: palette.ink }} className="min-h-screen w-full flex items-center justify-center p-4">
        <div className="text-center max-w-sm rounded-[2rem] p-10" style={{ background: palette.white, boxShadow: `0 40px 100px -20px ${palette.ink}30` }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: palette.sageMist }}><Check size={28} style={{ color: palette.sageDeep }} /></div>
          <h1 style={{ fontFamily: theme.headingFont, fontSize: 22, color: palette.ink }} className="mb-2">سفارش شما ثبت شد</h1>
          <p style={{ color: palette.inkSoft, fontSize: 14 }} className="mb-6">جزئیات سفارش به ایمیل شما ارسال می‌شود. از خرید شما سپاسگزاریم 🌿</p>
          <button onClick={() => onPlaceOrder()} className="rounded-full px-6 py-3 text-sm font-medium" style={{ background: palette.sageDeep, color: palette.white }}>بازگشت به فروشگاه</button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" lang="fa" style={{ fontFamily: theme.bodyFont, background: palette.cream, color: palette.ink }} className="min-h-screen w-full">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Arabic:wght@400;500;600;700&family=Vazirmatn:wght@300;400;500;600;700&display=swap');`}</style>
      <div className="sticky top-0 z-20 border-b backdrop-blur-md" style={{ background: `${palette.cream}E8`, borderColor: palette.beige }}>
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: palette.ink }}><ArrowRight size={15} /> بازگشت</button>
          <p style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.1em", fontWeight: 600 }}>VIINA</p>
          <span style={{ fontSize: 12.5, color: palette.inkSoft }}>تسویه‌حساب</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 md:px-8 py-10 grid lg:grid-cols-[1fr_380px] gap-8">
        {cartItems.length === 0 && !placing ? (
          <div className="lg:col-span-2"><EmptyState icon={ShoppingBag} title="سبد خرید شما خالی است" subtitle="برای ادامه، ابتدا محصولی به سبد خرید اضافه کنید." actionLabel="بازگشت به فروشگاه" onAction={onBack} palette={palette} /></div>
        ) : (
          <>
            <form onSubmit={handlePay} className="flex flex-col gap-6">
              <div className="rounded-3xl p-6" style={{ background: palette.white, border: `1px solid ${palette.beige}` }}>
                <div className="flex items-center gap-2 mb-4"><User size={16} style={{ color: palette.sageDeep }} /><p style={{ fontFamily: theme.headingFont, fontSize: 17 }}>اطلاعات شخصی</p></div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input required placeholder="نام" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="rounded-2xl px-4 py-3 text-sm border outline-none" style={{ borderColor: palette.beige }} />
                  <input required placeholder="نام خانوادگی" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="rounded-2xl px-4 py-3 text-sm border outline-none" style={{ borderColor: palette.beige }} />
                  <input required placeholder="شماره موبایل" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-2xl px-4 py-3 text-sm border outline-none" style={{ borderColor: palette.beige }} dir="ltr" />
                  <input required type="email" placeholder="ایمیل" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-2xl px-4 py-3 text-sm border outline-none" style={{ borderColor: palette.beige }} dir="ltr" />
                </div>
              </div>

              <div className="rounded-3xl p-6" style={{ background: palette.white, border: `1px solid ${palette.beige}` }}>
                <div className="flex items-center gap-2 mb-4"><Building2 size={16} style={{ color: palette.sageDeep }} /><p style={{ fontFamily: theme.headingFont, fontSize: 17 }}>آدرس ارسال</p></div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <select required value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="rounded-2xl px-4 py-3 text-sm border outline-none bg-white" style={{ borderColor: palette.beige }}>
                    <option value="" disabled>استان</option>
                    {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input required placeholder="شهر" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="rounded-2xl px-4 py-3 text-sm border outline-none" style={{ borderColor: palette.beige }} />
                  <input required placeholder="کد پستی" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} className="rounded-2xl px-4 py-3 text-sm border outline-none" style={{ borderColor: palette.beige }} dir="ltr" />
                  <input placeholder="واحد / پلاک" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="rounded-2xl px-4 py-3 text-sm border outline-none" style={{ borderColor: palette.beige }} />
                  <textarea required rows={2} placeholder="آدرس کامل پستی" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="sm:col-span-2 rounded-2xl px-4 py-3 text-sm border outline-none resize-none" style={{ borderColor: palette.beige }} />
                </div>
              </div>

              <div className="rounded-3xl p-6" style={{ background: palette.white, border: `1px solid ${palette.beige}` }}>
                <div className="flex items-center gap-2 mb-4"><Truck size={16} style={{ color: palette.sageDeep }} /><p style={{ fontFamily: theme.headingFont, fontSize: 17 }}>روش ارسال</p></div>
                <div className="flex flex-col gap-2.5">
                  {SHIPPING_METHODS.map((m) => {
                    const Icon = m.icon; const active = shippingMethod === m.id;
                    return (
                      <button type="button" key={m.id} onClick={() => setShippingMethod(m.id)} className="flex items-center gap-3 rounded-2xl p-3.5 border text-right transition-all"
                        style={{ borderColor: active ? palette.sageDeep : palette.beige, background: active ? palette.sageMist : palette.white }}>
                        <Icon size={18} style={{ color: palette.sageDeep }} />
                        <div className="flex-1">
                          <p style={{ fontSize: 13.5 }}>{m.label}</p>
                          <p style={{ fontSize: 11.5, color: palette.inkSoft }}>{m.desc}</p>
                        </div>
                        <span style={{ fontSize: 13, fontFamily: theme.headingFont }}>{fmt(m.price)}</span>
                        <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: active ? palette.sageDeep : palette.beige }}>
                          {active && <div className="w-2 h-2 rounded-full" style={{ background: palette.sageDeep }} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl p-6" style={{ background: palette.white, border: `1px solid ${palette.beige}` }}>
                <div className="flex items-center gap-2 mb-4"><FileText size={16} style={{ color: palette.sageDeep }} /><p style={{ fontFamily: theme.headingFont, fontSize: 17 }}>توضیحات سفارش</p></div>
                <textarea rows={3} placeholder="مثلاً: ساعت ترجیحی تحویل یا توضیحات ویژه دیگر…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-2xl px-4 py-3 text-sm border outline-none resize-none" style={{ borderColor: palette.beige }} />
              </div>

              <button type="submit" disabled={placing} className="btn-shine lg:hidden rounded-full py-3.5 text-sm font-medium flex items-center justify-center gap-2" style={{ background: palette.sageDeep, color: palette.white }}>
                <Wallet size={16} /> {placing ? "در حال انتقال به درگاه…" : `پرداخت ${fmt(total)} با زرین‌پال`}
              </button>
            </form>

            <div className="lg:sticky lg:top-24 h-fit rounded-3xl p-6 flex flex-col gap-5" style={{ background: palette.white, border: `1px solid ${palette.beige}` }}>
              <p style={{ fontFamily: theme.headingFont, fontSize: 17 }}>خلاصه سفارش</p>
              <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pl-1">
                {cartItems.map((c) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <div className="rounded-xl flex items-center justify-center shrink-0" style={{ width: 44, height: 44, background: `${c.product.tint}55` }}><div className="scale-50"><Bottle tint={c.product.tint} ink={palette.ink} white={palette.white} label={`${c.product.name} - خرید از ${BRAND_NAME}`} /></div></div>
                    <div className="flex-1 min-w-0"><p className="truncate" style={{ fontSize: 13 }}>{c.product.name}</p><p style={{ fontSize: 11.5, color: palette.inkSoft }}>{c.qty} × {fmt(c.product.salePrice || c.product.price)}</p></div>
                    <span style={{ fontSize: 13 }}>{fmt((c.product.salePrice || c.product.price) * c.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2 pt-4 border-t text-sm" style={{ borderColor: palette.beige }}>
                <div className="flex justify-between" style={{ color: palette.inkSoft }}><span>جمع جزء</span><span>{fmt(subtotal)}</span></div>
                <div className="flex justify-between" style={{ color: palette.inkSoft }}><span>هزینه ارسال</span><span>{fmt(shipCost)}</span></div>
                <div className="flex justify-between pt-2 mt-1 border-t" style={{ borderColor: palette.beige, fontFamily: theme.headingFont, fontSize: 17 }}><span>مبلغ کل</span><span>{fmt(total)}</span></div>
              </div>
              {rewardsSettings?.enabled && earnedPoints > 0 && (
                <div className="flex items-center gap-2 rounded-2xl p-3.5" style={{ background: palette.sageMist }}>
                  <Sparkles size={15} style={{ color: palette.sageDeep }} />
                  <p style={{ fontSize: 12.5, color: palette.sageDeep }}>با این خرید <b>{fmt(earnedPoints)}</b> اعتبار {rewardsSettings.clubName} دریافت می‌کنید.</p>
                </div>
              )}
              <button type="button" onClick={handlePay} disabled={placing} className="btn-shine hidden lg:flex rounded-full py-3.5 text-sm font-medium items-center justify-center gap-2 transition-transform hover:-translate-y-0.5" style={{ background: palette.sageDeep, color: palette.white, boxShadow: `0 14px 32px -10px ${palette.sageDeep}88` }}>
                <Wallet size={16} /> {placing ? "در حال انتقال به درگاه…" : "پرداخت با زرین‌پال"}
              </button>
              <p style={{ fontSize: 10.5, color: palette.inkSoft }} className="text-center">درگاه پرداخت زرین‌پال در این پیش‌نمایش شبیه‌سازی شده و پرداخت واقعی انجام نمی‌شود.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


const STOCK_STYLE = { "موجود": { bg: "sageMist", fg: "sageDeep" }, "موجودی کم": { bg: "#F2E4C9", fg: "#8A6A2A" }, "ناموجود": { bg: "#F4DCD6", fg: "#A5453A" } };
const ORDER_STYLE = {
  "در انتظار": { bg: "#F2E4C9", fg: "#8A6A2A" }, "در حال پردازش": { bg: "sageMist", fg: "sageDeep" }, "ارسال شد": { bg: "#DCE7F0", fg: "#3B6284" },
  "تحویل داده شد": { bg: "sageDeep", fg: "white" }, "لغو شده": { bg: "#F4DCD6", fg: "#A5453A" }, "بازپرداخت شده": { bg: "beige", fg: "inkSoft" },
};
const PAYMENT_STYLE = { "پرداخت‌شده": { bg: "sageMist", fg: "sageDeep" }, "در انتظار": { bg: "#F2E4C9", fg: "#8A6A2A" }, "ناموفق": { bg: "#F4DCD6", fg: "#A5453A" } };
const REVIEW_STYLE = { "تأیید شده": { bg: "sageMist", fg: "sageDeep" }, "در انتظار بررسی": { bg: "#F2E4C9", fg: "#8A6A2A" }, "رد شده": { bg: "#F4DCD6", fg: "#A5453A" } };
const DISCOUNT_STYLE = { "فعال": { bg: "sageMist", fg: "sageDeep" }, "منقضی شده": { bg: "#F4DCD6", fg: "#A5453A" } };
function resolveStyle(style, palette) { return { bg: palette[style.bg] || style.bg, fg: palette[style.fg] || style.fg }; }

function orderTotal(o) { return o.items.reduce((s, it) => s + it.price * it.qty, 0); }
function downloadCSV(filename, header, rows) {
  const csv = [header.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

function Badge({ label, bg, fg }) {
  return <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap" style={{ background: bg, color: fg }}>{label}</span>;
}
function StatWidget({ icon: Icon, label, value, warn, palette }) {
  return (
    <div className="rounded-3xl p-5 flex flex-col gap-3" style={{ background: palette.white, border: `1px solid ${palette.beige}` }}>
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: warn ? "#F4DCD6" : palette.sageMist }}>
        <Icon size={17} style={{ color: warn ? "#A5453A" : palette.sageDeep }} />
      </div>
      <div><p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 24, color: palette.ink }}>{value}</p><p style={{ fontSize: 12.5, color: palette.inkSoft }}>{label}</p></div>
    </div>
  );
}
function Toggle({ label, on, onChange, palette }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span style={{ fontSize: 14, color: palette.ink }}>{label}</span>
      <button onClick={() => onChange(!on)} className="w-11 h-6 rounded-full relative transition-colors shrink-0" style={{ background: on ? palette.sageDeep : palette.beige }} aria-pressed={on}>
        <span className="absolute top-0.5 rounded-full transition-all" style={{ width: 20, height: 20, background: palette.white, right: on ? 22 : 2 }} />
      </button>
    </div>
  );
}
function FieldLabel({ children, palette }) { return <label style={{ fontSize: 12, color: palette.inkSoft }} className="block mb-1.5">{children}</label>; }
function TextInput({ palette, ...props }) {
  return <input {...props} className={`w-full rounded-2xl px-4 py-2.5 text-sm border outline-none ${props.className || ""}`} style={{ borderColor: palette.beige, color: palette.ink, background: palette.white, ...(props.style || {}) }} />;
}
function TextArea({ palette, ...props }) {
  return <textarea {...props} className={`w-full rounded-2xl px-4 py-2.5 text-sm border outline-none resize-none ${props.className || ""}`} style={{ borderColor: palette.beige, color: palette.ink, background: palette.white, ...(props.style || {}) }} />;
}
function SelectInput({ children, palette, ...props }) {
  return <select {...props} className={`w-full rounded-2xl px-4 py-2.5 text-sm border outline-none bg-white ${props.className || ""}`} style={{ borderColor: palette.beige, color: palette.ink }}>{children}</select>;
}
function ModalShell({ onClose, title, children, wide, palette }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: `${palette.ink}88` }} onClick={onClose} />
      <div className={`relative w-full ${wide ? "max-w-2xl" : "max-w-lg"} max-h-[85vh] overflow-y-auto rounded-3xl p-6 md:p-7`} style={{ background: palette.white }}>
        <div className="flex items-center justify-between mb-5">
          <p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 21, color: palette.ink }}>{title}</p>
          <button onClick={onClose} aria-label="بستن"><X size={20} color={palette.ink} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* The admin panel keeps a fixed, legible neutral skin regardless of
   whichever theme/preset is currently live on the storefront —
   an admin console that repainted itself dark-mode-black while you
   were trying to configure dark mode would be a bad time. */
const ADMIN_PALETTE = THEME_PRESETS["مینیمال گرم"];

/* ---------------- Product form ---------------- */
function emptyProductDraft() {
  return { title: "", sku: "", tag: "جدید", shortDescription: "", description: "", price: "", salePrice: "", cost: "",
    stock: "", threshold: "10", category: "", subCategory: "", skinTags: [], concerns: [], volume: "", ingredients: "",
    mainImage: "", hoverImage: "", extraImage: "", metaTitle: "", metaDescription: "", slug: "" };
}
function ProductFormModal({ draft, setDraft, onCancel, onSave, isEdit, categories }) {
  const p = ADMIN_PALETTE;
  function toggleSkinTag(tag) { setDraft((d) => ({ ...d, skinTags: d.skinTags.includes(tag) ? d.skinTags.filter((t) => t !== tag) : [...d.skinTags, tag] })); }
  function toggleConcern(c) { setDraft((d) => ({ ...d, concerns: d.concerns.includes(c) ? d.concerns.filter((t) => t !== c) : [...d.concerns, c] })); }
  return (
    <ModalShell onClose={onCancel} title={isEdit ? "ویرایش محصول" : "افزودن محصول جدید"} wide palette={p}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p style={{ fontSize: 12, color: p.sageDeep, fontWeight: 600 }}>اطلاعات پایه</p>
          <div><FieldLabel palette={p}>عنوان محصول</FieldLabel><TextInput palette={p} required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><FieldLabel palette={p}>کد SKU</FieldLabel><TextInput palette={p} value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} placeholder="VN-1001" dir="ltr" /></div>
            <div><FieldLabel palette={p}>برچسب محصول</FieldLabel>
              <SelectInput palette={p} value={draft.tag} onChange={(e) => setDraft({ ...draft, tag: e.target.value })}>
                {PRODUCT_TAG_OPTIONS.map((t) => <option key={t}>{t}</option>)}
              </SelectInput>
            </div>
          </div>
          <div><FieldLabel palette={p}>توضیح کوتاه</FieldLabel><TextInput palette={p} value={draft.shortDescription} onChange={(e) => setDraft({ ...draft, shortDescription: e.target.value })} placeholder="یک خط معرفی برای کارت محصول" /></div>
          <div><FieldLabel palette={p}>توضیحات کامل</FieldLabel><TextArea palette={p} rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
        </div>

        <div className="flex flex-col gap-3 pt-2 border-t" style={{ borderColor: p.creamDeep }}>
          <p style={{ fontSize: 12, color: p.sageDeep, fontWeight: 600 }} className="pt-3">قیمت‌گذاری و موجودی (تومان)</p>
          <div className="grid grid-cols-2 gap-4">
            <div><FieldLabel palette={p}>قیمت اصلی</FieldLabel><TextInput palette={p} required type="number" min="0" step="1000" placeholder="1200000" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} /></div>
            <div><FieldLabel palette={p}>قیمت با تخفیف (اختیاری)</FieldLabel><TextInput palette={p} type="number" min="0" step="1000" value={draft.salePrice} onChange={(e) => setDraft({ ...draft, salePrice: e.target.value })} /></div>
            <div><FieldLabel palette={p}>بهای تمام‌شده هر واحد</FieldLabel><TextInput palette={p} type="number" min="0" step="1000" value={draft.cost} onChange={(e) => setDraft({ ...draft, cost: e.target.value })} /></div>
            <div><FieldLabel palette={p}>تعداد موجودی</FieldLabel><TextInput palette={p} required type="number" min="0" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: e.target.value })} /></div>
            <div className="col-span-2"><FieldLabel palette={p}>آستانه هشدار موجودی کم</FieldLabel><TextInput palette={p} type="number" min="0" value={draft.threshold} onChange={(e) => setDraft({ ...draft, threshold: e.target.value })} /></div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2 border-t" style={{ borderColor: p.creamDeep }}>
          <p style={{ fontSize: 12, color: p.sageDeep, fontWeight: 600 }} className="pt-3">دسته‌بندی</p>
          {categories.length === 0 ? (
            <p style={{ fontSize: 12.5, color: "#A5453A" }}>ابتدا از تب «دسته‌بندی‌ها» یک دسته‌بندی اضافه کنید.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div><FieldLabel palette={p}>دسته‌بندی اصلی</FieldLabel>
                <SelectInput palette={p} required value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                  <option value="" disabled>انتخاب کنید</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </SelectInput>
              </div>
              <div><FieldLabel palette={p}>زیردسته</FieldLabel><TextInput palette={p} value={draft.subCategory} onChange={(e) => setDraft({ ...draft, subCategory: e.target.value })} placeholder="مثلاً سرم روشن‌کننده" /></div>
            </div>
          )}
          <div><FieldLabel palette={p}>برچسب نوع پوست</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {SKIN_TAG_OPTIONS.map((tag) => (
                <button type="button" key={tag} onClick={() => toggleSkinTag(tag)} className="rounded-full px-3 py-1.5 text-xs font-medium border transition-colors"
                  style={{ background: draft.skinTags.includes(tag) ? p.sageDeep : p.white, color: draft.skinTags.includes(tag) ? p.white : p.inkSoft, borderColor: draft.skinTags.includes(tag) ? p.sageDeep : p.beige }}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div><FieldLabel palette={p}>نیاز/عارضه پوستی (برای بخش «خرید بر اساس نیاز پوستی»)</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {SKIN_CONCERN_OPTIONS.map((c) => (
                <button type="button" key={c.key} onClick={() => toggleConcern(c.key)} className="rounded-full px-3 py-1.5 text-xs font-medium border transition-colors"
                  style={{ background: draft.concerns.includes(c.key) ? p.bronze : p.white, color: draft.concerns.includes(c.key) ? p.white : p.inkSoft, borderColor: draft.concerns.includes(c.key) ? p.bronze : p.beige }}>
                  {c.key}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><FieldLabel palette={p}>حجم محصول</FieldLabel><TextInput palette={p} value={draft.volume} onChange={(e) => setDraft({ ...draft, volume: e.target.value })} placeholder="مثلاً ۵۰ میل" /></div>
          </div>
          <div><FieldLabel palette={p}>فهرست ترکیبات</FieldLabel><TextArea palette={p} rows={2} value={draft.ingredients} onChange={(e) => setDraft({ ...draft, ingredients: e.target.value })} placeholder="ترکیبات را با ویرگول جدا کنید" /></div>
        </div>

        <div className="flex flex-col gap-3 pt-2 border-t" style={{ borderColor: p.creamDeep }}>
          <p style={{ fontSize: 12, color: p.sageDeep, fontWeight: 600 }} className="pt-3">گالری تصاویر</p>
          {[["mainImage", "تصویر اصلی"], ["hoverImage", "تصویر هاور"], ["extraImage", "تصویر تکمیلی"]].map(([key, label]) => (
            <div key={key} className="flex items-center gap-2 rounded-2xl px-4 py-2.5 border" style={{ borderColor: p.beige }}>
              <ImagePlus size={15} style={{ color: p.inkSoft }} />
              <input placeholder={`${label} — آدرس تصویر یا آپلود`} value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} className="flex-1 text-sm outline-none" style={{ color: p.ink }} />
              <label className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer shrink-0" style={{ background: p.creamDeep, color: p.inkSoft }}>
                <Upload size={12} /> آپلود<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && setDraft({ ...draft, [key]: e.target.files[0].name })} />
              </label>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 pt-2 border-t" style={{ borderColor: p.creamDeep }}>
          <p style={{ fontSize: 12, color: p.sageDeep, fontWeight: 600 }} className="pt-3">سئو و متادیتا</p>
          <div><FieldLabel palette={p}>عنوان متا</FieldLabel><TextInput palette={p} value={draft.metaTitle} onChange={(e) => setDraft({ ...draft, metaTitle: e.target.value })} /></div>
          <div><FieldLabel palette={p}>توضیحات متا</FieldLabel><TextArea palette={p} rows={2} value={draft.metaDescription} onChange={(e) => setDraft({ ...draft, metaDescription: e.target.value })} /></div>
          <div><FieldLabel palette={p}>آدرس (Slug)</FieldLabel><TextInput palette={p} value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} dir="ltr" /></div>
        </div>

        <div className="sticky bottom-0 -mx-6 md:-mx-7 -mb-6 md:-mb-7 px-6 md:px-7 pb-6 md:pb-7 pt-4 mt-2 flex gap-3" style={{ background: p.white }}>
          <button type="button" onClick={onCancel} className="flex-1 rounded-full py-3 text-sm font-medium border" style={{ borderColor: p.beige, color: p.ink }}>انصراف</button>
          <button type="submit" disabled={categories.length === 0} className="flex-1 rounded-full py-3 text-sm font-medium" style={{ background: categories.length === 0 ? p.beige : p.sageDeep, color: categories.length === 0 ? p.inkSoft : p.white }}>{isEdit ? "ذخیره تغییرات" : "افزودن محصول"}</button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ---------------- Category form ---------------- */
function emptyCategoryDraft() { return { name: "", slug: "", banner: "", description: "", featured: false, order: "1", icon: "tag" }; }
function CategoryFormModal({ draft, setDraft, onCancel, onSave, isEdit }) {
  const p = ADMIN_PALETTE;
  return (
    <ModalShell onClose={onCancel} title={isEdit ? "ویرایش دسته‌بندی" : "افزودن دسته‌بندی"} palette={p}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="flex flex-col gap-4">
        <div><FieldLabel palette={p}>نام دسته‌بندی</FieldLabel><TextInput palette={p} required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
        <div><FieldLabel palette={p}>آدرس (Slug)</FieldLabel><TextInput palette={p} value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} dir="ltr" /></div>
        <div><FieldLabel palette={p}>آیکون</FieldLabel>
          <div className="flex gap-2">
            {CATEGORY_ICON_OPTIONS.map((opt) => (
              <button type="button" key={opt.key} onClick={() => setDraft({ ...draft, icon: opt.key })} className="w-10 h-10 rounded-2xl flex items-center justify-center border"
                style={{ background: draft.icon === opt.key ? p.sageDeep : p.white, borderColor: draft.icon === opt.key ? p.sageDeep : p.beige }}>
                <opt.icon size={16} color={draft.icon === opt.key ? p.white : p.inkSoft} />
              </button>
            ))}
          </div>
        </div>
        <div><FieldLabel palette={p}>تصویر بنر</FieldLabel>
          <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5 border" style={{ borderColor: p.beige }}>
            <ImagePlus size={15} style={{ color: p.inkSoft }} />
            <input placeholder="آدرس تصویر یا آپلود" value={draft.banner} onChange={(e) => setDraft({ ...draft, banner: e.target.value })} className="flex-1 text-sm outline-none" style={{ color: p.ink }} />
            <label className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer shrink-0" style={{ background: p.creamDeep, color: p.inkSoft }}>
              <Upload size={12} /> آپلود<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && setDraft({ ...draft, banner: e.target.files[0].name })} />
            </label>
          </div>
        </div>
        <div><FieldLabel palette={p}>توضیحات</FieldLabel><TextArea palette={p} rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-4 items-center">
          <div><FieldLabel palette={p}>ترتیب نمایش</FieldLabel><TextInput palette={p} type="number" min="1" value={draft.order} onChange={(e) => setDraft({ ...draft, order: e.target.value })} /></div>
          <Toggle palette={p} label="دسته ویژه" on={draft.featured} onChange={(v) => setDraft({ ...draft, featured: v })} />
        </div>
        <div className="sticky bottom-0 -mx-6 md:-mx-7 -mb-6 md:-mb-7 px-6 md:px-7 pb-6 md:pb-7 pt-4 mt-2 flex gap-3" style={{ background: p.white }}>
          <button type="button" onClick={onCancel} className="flex-1 rounded-full py-3 text-sm font-medium border" style={{ borderColor: p.beige, color: p.ink }}>انصراف</button>
          <button type="submit" className="flex-1 rounded-full py-3 text-sm font-medium" style={{ background: p.sageDeep, color: p.white }}>{isEdit ? "ذخیره تغییرات" : "افزودن دسته‌بندی"}</button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ---------------- Coupon form ---------------- */
function emptyCouponDraft() { return { code: "", type: "درصدی", value: "", minPurchase: "0", categories: [], usageLimit: "100", expiry: "" }; }
function CouponFormModal({ draft, setDraft, onCancel, onSave, categories }) {
  const p = ADMIN_PALETTE;
  function toggleCategory(id) { setDraft((d) => ({ ...d, categories: d.categories.includes(id) ? d.categories.filter((c) => c !== id) : [...d.categories, id] })); }
  return (
    <ModalShell onClose={onCancel} title="ایجاد کد تخفیف" palette={p}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="flex flex-col gap-4">
        <div><FieldLabel palette={p}>کد تخفیف</FieldLabel><TextInput palette={p} required value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })} dir="ltr" placeholder="SUMMER25" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><FieldLabel palette={p}>نوع تخفیف</FieldLabel><SelectInput palette={p} value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>{["درصدی", "مبلغ ثابت", "ارسال رایگان"].map((t) => <option key={t}>{t}</option>)}</SelectInput></div>
          <div><FieldLabel palette={p}>مقدار {draft.type === "مبلغ ثابت" ? "(تومان)" : draft.type === "درصدی" ? "(٪)" : ""}</FieldLabel><TextInput palette={p} type="number" min="0" value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} disabled={draft.type === "ارسال رایگان"} /></div>
          <div><FieldLabel palette={p}>حداقل مبلغ خرید (تومان)</FieldLabel><TextInput palette={p} type="number" min="0" step="1000" value={draft.minPurchase} onChange={(e) => setDraft({ ...draft, minPurchase: e.target.value })} /></div>
          <div><FieldLabel palette={p}>سقف استفاده (هر کاربر)</FieldLabel><TextInput palette={p} type="number" min="0" value={draft.usageLimit} onChange={(e) => setDraft({ ...draft, usageLimit: e.target.value })} /></div>
          <div className="col-span-2"><FieldLabel palette={p}>تاریخ انقضا</FieldLabel><TextInput palette={p} required type="date" value={draft.expiry} onChange={(e) => setDraft({ ...draft, expiry: e.target.value })} /></div>
        </div>
        <div><FieldLabel palette={p}>دسته‌بندی‌های مشمول (خالی = همه)</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button type="button" key={c.id} onClick={() => toggleCategory(c.id)} className="rounded-full px-3 py-1.5 text-xs font-medium border transition-colors"
                style={{ background: draft.categories.includes(c.id) ? p.sageDeep : p.white, color: draft.categories.includes(c.id) ? p.white : p.inkSoft, borderColor: draft.categories.includes(c.id) ? p.sageDeep : p.beige }}>
                {c.name}
              </button>
            ))}
            {categories.length === 0 && <span style={{ fontSize: 12, color: p.inkSoft }}>هنوز دسته‌بندی‌ای وجود ندارد.</span>}
          </div>
        </div>
        <div className="sticky bottom-0 -mx-6 md:-mx-7 -mb-6 md:-mb-7 px-6 md:px-7 pb-6 md:pb-7 pt-4 mt-2 flex gap-3" style={{ background: p.white }}>
          <button type="button" onClick={onCancel} className="flex-1 rounded-full py-3 text-sm font-medium border" style={{ borderColor: p.beige, color: p.ink }}>انصراف</button>
          <button type="submit" className="flex-1 rounded-full py-3 text-sm font-medium" style={{ background: p.sageDeep, color: p.white }}>ایجاد کد تخفیف</button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ---------------- Review form (manual add) + reply ---------------- */
function emptyReviewDraft() { return { name: "", product: "", rating: "5", text: "", status: "تأیید شده" }; }
function ReviewFormModal({ draft, setDraft, onCancel, onSave }) {
  const p = ADMIN_PALETTE;
  return (
    <ModalShell onClose={onCancel} title="افزودن نظر" palette={p}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div><FieldLabel palette={p}>نام مشتری</FieldLabel><TextInput palette={p} required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
          <div><FieldLabel palette={p}>امتیاز</FieldLabel><SelectInput palette={p} value={draft.rating} onChange={(e) => setDraft({ ...draft, rating: e.target.value })}>{[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} ستاره</option>)}</SelectInput></div>
        </div>
        <div><FieldLabel palette={p}>محصول مرتبط</FieldLabel><TextInput palette={p} value={draft.product} onChange={(e) => setDraft({ ...draft, product: e.target.value })} placeholder="نام محصول (اختیاری)" /></div>
        <div><FieldLabel palette={p}>متن نظر</FieldLabel><TextArea palette={p} required rows={3} value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} /></div>
        <div><FieldLabel palette={p}>وضعیت</FieldLabel><SelectInput palette={p} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>{REVIEW_STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}</SelectInput></div>
        <div className="sticky bottom-0 -mx-6 md:-mx-7 -mb-6 md:-mb-7 px-6 md:px-7 pb-6 md:pb-7 pt-4 mt-2 flex gap-3" style={{ background: p.white }}>
          <button type="button" onClick={onCancel} className="flex-1 rounded-full py-3 text-sm font-medium border" style={{ borderColor: p.beige, color: p.ink }}>انصراف</button>
          <button type="submit" className="flex-1 rounded-full py-3 text-sm font-medium" style={{ background: p.sageDeep, color: p.white }}>افزودن نظر</button>
        </div>
      </form>
    </ModalShell>
  );
}
function ReplyModal({ review, onCancel, onSend }) {
  const p = ADMIN_PALETTE;
  const [text, setText] = useState(`سلام ${review.name.split(" ")[0]}،\n\nممنون از اینکه تجربه‌تان را با ما در میان گذاشتید.\n\nتیم ویینا`);
  return (
    <ModalShell onClose={onCancel} title="پاسخ به نظر مشتری" palette={p}>
      <div className="rounded-2xl p-4 mb-4" style={{ background: p.creamDeep }}>
        <div className="flex items-center gap-2 mb-1"><p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 14.5, color: p.ink }}>{review.name}</p><Stars rating={review.rating} size={12} color={p.bronze} /></div>
        <p style={{ fontSize: 13, color: p.inkSoft }}>{review.text}</p>
      </div>
      <FieldLabel palette={p}>پاسخ شما</FieldLabel>
      <TextArea palette={p} rows={6} value={text} onChange={(e) => setText(e.target.value)} />
      <div className="flex gap-3 mt-4">
        <button onClick={onCancel} className="flex-1 rounded-full py-3 text-sm font-medium border" style={{ borderColor: p.beige, color: p.ink }}>انصراف</button>
        <button onClick={() => onSend(text)} className="flex-1 rounded-full py-3 text-sm font-medium flex items-center justify-center gap-2" style={{ background: p.sageDeep, color: p.white }}>ارسال پاسخ <Send size={14} style={{ transform: "scaleX(-1)" }} /></button>
      </div>
    </ModalShell>
  );
}

/* ---------------- Order details drawer ---------------- */
function OrderDetailsDrawer({ order, onClose, onSetStatus, onGenerateTracking, currencySettings }) {
  const p = ADMIN_PALETTE;
  const fmt = (n) => formatPrice(n, currencySettings);
  if (!order) return null;
  const total = orderTotal(order);
  const timeline = ORDER_STATUS_OPTIONS.filter((s) => s !== "لغو شده" && s !== "بازپرداخت شده");
  const currentIdx = timeline.indexOf(order.status);
  function printSlip() { window.print(); }
  function downloadInvoice() {
    const lines = order.items.map((it) => `${it.name} x${it.qty} — ${fmt(it.price * it.qty)}`);
    const content = [`فاکتور سفارش ${order.id}`, `مشتری: ${order.customer}`, `تاریخ: ${order.date}`, "", ...lines, "", `مبلغ کل: ${fmt(total)}`].join("\n");
    const blob = new Blob(["\uFEFF" + content], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `invoice-${order.id}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }
  return (
    <div className="fixed inset-0 z-50 flex justify-start">
      <div className="absolute inset-0" style={{ background: `${p.ink}66` }} onClick={onClose} />
      <div className="relative w-full sm:w-[440px] h-full flex flex-col shadow-2xl overflow-y-auto" style={{ background: p.white, animation: "slideIn 0.35s ease" }}>
        <style>{`@keyframes slideIn { from { transform: translateX(-100%);} to { transform: translateX(0);} }`}</style>
        <div className="flex items-center justify-between px-6 py-5 border-b sticky top-0" style={{ borderColor: p.beige, background: p.white }}>
          <p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 19, color: p.ink }}>سفارش {order.id}</p>
          <button onClick={onClose} aria-label="بستن"><X size={20} color={p.ink} /></button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 15, color: p.ink }}>{order.customer}</p>
            <p style={{ fontSize: 12.5, color: p.inkSoft }} dir="ltr" className="text-right">{order.email}</p>
            <p style={{ fontSize: 12.5, color: p.inkSoft }} dir="ltr" className="text-right">{order.phone}</p>
          </div>
          <div>
            <p style={{ fontSize: 12, color: p.sageDeep, fontWeight: 600 }} className="mb-3">وضعیت سفارش</p>
            <div className="flex items-center">
              {timeline.map((s, i) => (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center gap-1.5" style={{ opacity: currentIdx >= i ? 1 : 0.35 }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: currentIdx >= i ? p.sageDeep : p.beige }}>
                      {currentIdx > i ? <Check size={12} color={p.white} /> : <span style={{ width: 6, height: 6, borderRadius: 999, background: currentIdx >= i ? p.white : p.inkSoft }} />}
                    </div>
                    <span style={{ fontSize: 10, color: p.inkSoft, textAlign: "center" }} className="max-w-[54px]">{s}</span>
                  </div>
                  {i < timeline.length - 1 && <div className="flex-1 h-px mx-1" style={{ background: currentIdx > i ? p.sageDeep : p.beige }} />}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div><FieldLabel palette={p}>تغییر وضعیت سفارش</FieldLabel>
            <SelectInput palette={p} value={order.status} onChange={(e) => onSetStatus(order.id, e.target.value)}>{ORDER_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}</SelectInput>
          </div>
          <div className="rounded-2xl p-4" style={{ background: p.creamDeep }}>
            <div className="flex items-center justify-between mb-2">
              <p style={{ fontSize: 13, color: p.inkSoft }}>شماره رهگیری</p>
              {!order.trackingNumber && <button onClick={() => onGenerateTracking(order.id)} className="text-xs font-medium underline underline-offset-4" style={{ color: p.sageDeep }}>ایجاد شماره رهگیری</button>}
            </div>
            <p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 15, color: p.ink }} dir="ltr" className="text-right">{order.trackingNumber || "—"}</p>
          </div>
          <div>
            <p style={{ fontSize: 12, color: p.sageDeep, fontWeight: 600 }} className="mb-2">اقلام سفارش</p>
            <div className="flex flex-col gap-2">
              {order.items.map((it, i) => (
                <div key={i} className="flex items-center justify-between text-sm" style={{ color: p.ink }}><span>{it.name} <span style={{ color: p.inkSoft }}>× {it.qty}</span></span><span>{fmt(it.price * it.qty)}</span></div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: p.beige }}>
              <span style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 16, color: p.ink }}>مبلغ کل</span><span style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 18, color: p.ink }}>{fmt(total)}</span>
            </div>
          </div>
          <div><p style={{ fontSize: 12, color: p.sageDeep, fontWeight: 600 }} className="mb-2">آدرس ارسال و صورتحساب</p><p style={{ fontSize: 13, color: p.inkSoft, lineHeight: 1.8 }}>{order.address}</p></div>
          <div className="flex gap-3 pb-6">
            <button onClick={downloadInvoice} className="flex-1 rounded-full py-3 text-sm font-medium border flex items-center justify-center gap-2" style={{ borderColor: p.beige, color: p.ink }}><Download size={14} /> دانلود فاکتور</button>
            <button onClick={printSlip} className="flex-1 rounded-full py-3 text-sm font-medium border flex items-center justify-center gap-2" style={{ borderColor: p.beige, color: p.ink }}><Printer size={14} /> چاپ برگه بسته‌بندی</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrdersTable({ orders, setStatus, onOpenDetails, compact, currencySettings }) {
  const p = ADMIN_PALETTE;
  const fmt = (n) => formatPrice(n, currencySettings);
  return (
    <table className="w-full text-sm min-w-[760px]">
      <thead><tr style={{ borderBottom: `1px solid ${p.beige}` }}>{["شماره سفارش", "مشتری", "تاریخ", "پرداخت", "مبلغ", "وضعیت پرداخت", "وضعیت سفارش", ""].map((h) => <th key={h} className="text-right px-5 py-3 font-medium" style={{ color: p.inkSoft, fontSize: 12 }}>{h}</th>)}</tr></thead>
      <tbody>
        {orders.map((o) => {
          const st = resolveStyle(ORDER_STYLE[o.status], p); const ps = resolveStyle(PAYMENT_STYLE[o.paymentStatus], p);
          return (
            <tr key={o.id} style={{ borderBottom: `1px solid ${p.creamDeep}` }}>
              <td className="px-5 py-3" style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 14, color: p.ink }}>{o.id}</td>
              <td className="px-5 py-3" style={{ color: p.ink }}><p>{o.customer}</p><p style={{ fontSize: 11, color: p.inkSoft }} dir="ltr" className="text-right">{o.email}</p></td>
              <td className="px-5 py-3" style={{ color: p.inkSoft, fontSize: 12.5 }}>{o.date.replace("T", " · ")}</td>
              <td className="px-5 py-3" style={{ color: p.inkSoft }}>{o.paymentMethod}</td>
              <td className="px-5 py-3" style={{ color: p.ink }}>{fmt(orderTotal(o))}</td>
              <td className="px-5 py-3"><Badge label={o.paymentStatus} bg={ps.bg} fg={ps.fg} /></td>
              <td className="px-5 py-3">
                {compact ? <Badge label={o.status} bg={st.bg} fg={st.fg} /> : (
                  <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} className="rounded-full px-3 py-1.5 text-xs font-medium border outline-none" style={{ background: st.bg, color: st.fg, borderColor: "transparent" }}>
                    {ORDER_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
              </td>
              <td className="px-5 py-3">{onOpenDetails && <button onClick={() => onOpenDetails(o)} aria-label="مشاهده جزئیات سفارش"><Eye size={16} style={{ color: p.inkSoft }} /></button>}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ================================================================
   TAB: Overview
================================================================= */
function OverviewTab({ products, categories, orders, currencySettings, onQuickAdd, onQuickCoupon, onExportReport }) {
  const p = ADMIN_PALETTE;
  const fmt = (n) => formatPrice(n, currencySettings);
  const revenue = orders.reduce((s, o) => s + orderTotal(o), 0);
  const aov = orders.length ? revenue / orders.length : 0;
  const activeProducts = products.filter((pr) => pr.stockStatus !== "ناموجود").length;
  const lowStock = products.filter((pr) => pr.stockStatus === "موجودی کم" || pr.stockStatus === "ناموجود").length;
  const newCustomers = new Set(orders.map((o) => o.email)).size;

  const salesByCategory = categories.map((c, i) => ({ name: c.name, value: products.filter((pr) => pr.category === c.id).length, color: [p.sageDeep, p.sage, p.nudeDeep, p.bronze, p.inkSoft][i % 5] })).filter((c) => c.value > 0);

  const soldQtyByName = {};
  orders.forEach((o) => o.items.forEach((it) => { soldQtyByName[it.name] = (soldQtyByName[it.name] || 0) + it.qty; }));
  const topProducts = products.map((pr) => ({ ...pr, sold: soldQtyByName[pr.name] || 0 })).filter((pr) => pr.sold > 0).sort((a, b) => b.sold - a.sold).slice(0, 5);

  const salesByDay = {};
  orders.forEach((o) => { const day = o.date.slice(0, 10); salesByDay[day] = (salesByDay[day] || 0) + orderTotal(o); });
  const trendData = Object.entries(salesByDay).sort(([a], [b]) => a.localeCompare(b)).map(([day, sales]) => ({ day, sales }));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatWidget palette={p} icon={DollarSign} label="مجموع درآمد" value={fmt(revenue)} />
        <StatWidget palette={p} icon={ClipboardList} label="مجموع سفارش‌ها" value={orders.length} />
        <StatWidget palette={p} icon={Percent} label="میانگین ارزش سفارش" value={fmt(aov)} />
        <StatWidget palette={p} icon={Package} label="محصولات فعال" value={activeProducts} />
        <StatWidget palette={p} icon={AlertTriangle} label="هشدار موجودی کم" value={lowStock} warn={lowStock > 0} />
        <StatWidget palette={p} icon={Users} label="مشتریان" value={newCustomers} />
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={onQuickAdd} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium" style={{ background: p.sageDeep, color: p.white }}><Plus size={15} /> افزودن محصول</button>
        <button onClick={onQuickCoupon} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium border" style={{ borderColor: p.beige, color: p.ink }}><Gift size={15} /> ایجاد کد تخفیف</button>
        <button onClick={onExportReport} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium border" style={{ borderColor: p.beige, color: p.ink }}><Download size={15} /> خروجی گزارش فروش</button>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-3xl p-5 md:p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
          <p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }} className="mb-4">روند فروش</p>
          {trendData.length === 0 ? (
            <EmptyState compact icon={TrendingUp} title="داده‌ای برای نمایش وجود ندارد" subtitle="روند فروش پس از ثبت اولین سفارش نمایش داده می‌شود." palette={p} />
          ) : (
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <LineChart data={trendData}>
                  <CartesianGrid vertical={false} stroke={p.creamDeep} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: p.inkSoft }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: p.inkSoft }} width={40} orientation="right" />
                  <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${p.beige}`, fontSize: 12 }} />
                  <Line type="monotone" dataKey="sales" stroke={p.sageDeep} strokeWidth={2.5} dot={{ r: 3, fill: p.sageDeep }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="rounded-3xl p-5 md:p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
          <p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }} className="mb-2">فروش بر اساس دسته‌بندی</p>
          {salesByCategory.length === 0 ? (
            <EmptyState compact icon={Layers} title="داده‌ای وجود ندارد" palette={p} />
          ) : (
            <>
              <div style={{ width: "100%", height: 160 }}>
                <ResponsiveContainer>
                  <PieChart><Pie data={salesByCategory} dataKey="value" nameKey="name" innerRadius={42} outerRadius={65} paddingAngle={3}>{salesByCategory.map((c, i) => <Cell key={i} fill={c.color} />)}</Pie><Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${p.beige}`, fontSize: 12 }} /></PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-1.5 mt-2">{salesByCategory.map((c) => <div key={c.name} className="flex items-center justify-between text-xs"><span className="flex items-center gap-1.5" style={{ color: p.ink }}><span style={{ width: 8, height: 8, borderRadius: 999, background: c.color }} />{c.name}</span><span style={{ color: p.inkSoft }}>{c.value}</span></div>)}</div>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="rounded-3xl overflow-hidden" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
          <p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }} className="px-6 pt-5 pb-3">سفارش‌های اخیر</p>
          {orders.length === 0 ? <div className="px-6 pb-6"><EmptyState compact icon={Inbox} title="هنوز سفارشی ثبت نشده است" palette={p} /></div> : <OrdersTable orders={orders.slice(0, 4)} compact currencySettings={currencySettings} />}
        </div>
        <div className="rounded-3xl p-5 md:p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
          <p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }} className="mb-4">محصولات پرفروش</p>
          {topProducts.length === 0 ? <EmptyState compact icon={Package} title="هنوز فروشی ثبت نشده است" palette={p} /> : (
            <div className="flex flex-col gap-3">
              {topProducts.map((pr, i) => (
                <div key={pr.id} className="flex items-center gap-3">
                  <span style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 14, color: p.inkSoft, width: 18 }}>{i + 1}</span>
                  <div className="rounded-lg flex items-center justify-center shrink-0" style={{ width: 32, height: 32, background: `${pr.tint}55` }}><div className="scale-[0.35]"><Bottle tint={pr.tint} ink={p.ink} white={p.white} /></div></div>
                  <p className="flex-1 truncate" style={{ fontSize: 13.5, color: p.ink }}>{pr.name}</p>
                  <span style={{ fontSize: 12, color: p.inkSoft }}>{pr.sold} فروش</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   TAB: Products
================================================================= */
function ProductsTab({ products, categories, currencySettings, onAdd, onEdit, onDuplicate, onDelete, onBulkDelete, onBulkStatus, onGotoCategories }) {
  const p = ADMIN_PALETTE;
  const fmt = (n) => formatPrice(n, currencySettings);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("همه");
  const [statusFilter, setStatusFilter] = useState("همه");
  const [selected, setSelected] = useState([]);
  const [bulkStatus, setBulkStatus] = useState("موجود");

  if (categories.length === 0) {
    return <EmptyState icon={Layers} title="ابتدا یک دسته‌بندی اضافه کنید" subtitle="برای افزودن محصول، حداقل باید یک دسته‌بندی در فروشگاه وجود داشته باشد." actionLabel="رفتن به دسته‌بندی‌ها" onAction={onGotoCategories} palette={p} />;
  }
  if (products.length === 0) {
    return <EmptyState icon={Package} title="هنوز محصولی اضافه نشده است" subtitle="اولین محصول فروشگاه خود را اضافه کنید." actionLabel="افزودن محصول جدید" onAction={onAdd} palette={p} />;
  }

  const filtered = products.filter((pr) => {
    const matchesSearch = !search.trim() || pr.name.toLowerCase().includes(search.toLowerCase()) || (pr.sku || "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "همه" || pr.category === categoryFilter;
    const matchesStatus = statusFilter === "همه" || pr.stockStatus === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });
  function toggleSelect(id) { setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]); }
  function toggleSelectAll() { setSelected(selected.length === filtered.length ? [] : filtered.map((pr) => pr.id)); }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-full px-4 py-2 border max-w-xs" style={{ borderColor: p.beige, background: p.white }}>
          <Search size={15} style={{ color: p.inkSoft }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو بر اساس نام یا SKU" className="flex-1 text-sm outline-none bg-transparent" style={{ color: p.ink }} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SelectInput palette={p} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="!w-auto"><option value="همه">همه دسته‌بندی‌ها</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</SelectInput>
          <SelectInput palette={p} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="!w-auto"><option value="همه">همه وضعیت‌ها</option>{Object.keys(STOCK_STYLE).map((s) => <option key={s} value={s}>{s}</option>)}</SelectInput>
          <button onClick={onAdd} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium shrink-0" style={{ background: p.sageDeep, color: p.white }}><Plus size={15} /> افزودن محصول جدید</button>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3" style={{ background: p.sageMist }}>
          <span style={{ fontSize: 13, color: p.sageDeep, fontWeight: 500 }}>{selected.length} مورد انتخاب شده</span>
          <SelectInput palette={p} value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="!w-auto !py-1.5">{Object.keys(STOCK_STYLE).map((s) => <option key={s} value={s}>{s}</option>)}</SelectInput>
          <button onClick={() => { onBulkStatus(selected, bulkStatus); setSelected([]); }} className="text-xs font-medium rounded-full px-3 py-1.5" style={{ background: p.sageDeep, color: p.white }}>اعمال وضعیت</button>
          <button onClick={() => { onBulkDelete(selected); setSelected([]); }} className="text-xs font-medium rounded-full px-3 py-1.5 border flex items-center gap-1" style={{ borderColor: "#A5453A", color: "#A5453A" }}><Trash2 size={12} /> حذف گروهی</button>
        </div>
      )}

      <div className="rounded-3xl overflow-x-auto" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <table className="w-full text-sm min-w-[860px]">
          <thead><tr style={{ borderBottom: `1px solid ${p.beige}` }}>
            <th className="px-5 py-3"><input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleSelectAll} /></th>
            {["تصویر", "نام", "SKU", "دسته‌بندی", "قیمت", "قیمت با تخفیف", "موجودی", "وضعیت", ""].map((h) => <th key={h} className="text-right px-5 py-3 font-medium" style={{ color: p.inkSoft, fontSize: 12 }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filtered.map((pr) => {
              const cat = categories.find((c) => c.id === pr.category); const st = resolveStyle(STOCK_STYLE[pr.stockStatus], p);
              return (
                <tr key={pr.id} style={{ borderBottom: `1px solid ${p.creamDeep}` }}>
                  <td className="px-5 py-3"><input type="checkbox" checked={selected.includes(pr.id)} onChange={() => toggleSelect(pr.id)} /></td>
                  <td className="px-5 py-3"><div className="rounded-xl flex items-center justify-center" style={{ width: 42, height: 42, background: `${pr.tint}55` }}><div className="scale-50"><Bottle tint={pr.tint} ink={p.ink} white={p.white} /></div></div></td>
                  <td className="px-5 py-3" style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 14, color: p.ink }}>{pr.name}</td>
                  <td className="px-5 py-3" style={{ color: p.inkSoft, fontSize: 12 }} dir="ltr">{pr.sku}</td>
                  <td className="px-5 py-3" style={{ color: p.inkSoft }}>{cat?.name || "—"}</td>
                  <td className="px-5 py-3" style={{ color: p.ink }}>{fmt(pr.price)}</td>
                  <td className="px-5 py-3" style={{ color: p.ink }}>{pr.salePrice ? fmt(pr.salePrice) : "—"}</td>
                  <td className="px-5 py-3" style={{ color: p.ink }}>{pr.qty}</td>
                  <td className="px-5 py-3"><Badge label={pr.stockStatus} bg={st.bg} fg={st.fg} /></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <button onClick={() => onEdit(pr)} aria-label="ویرایش محصول"><Pencil size={15} style={{ color: p.inkSoft }} /></button>
                      <button onClick={() => onDuplicate(pr)} aria-label="کپی محصول"><Copy size={15} style={{ color: p.inkSoft }} /></button>
                      <button onClick={() => onDelete(pr.id)} aria-label="حذف محصول"><Trash2 size={15} style={{ color: "#A5453A" }} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={9} className="text-center py-10" style={{ color: p.inkSoft, fontSize: 13 }}>محصولی با این مشخصات یافت نشد.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================================================================
   TAB: Categories
================================================================= */
function CategoriesTab({ categories, products, onAdd, onEdit, onDelete, onToggleFeatured }) {
  const p = ADMIN_PALETTE;
  if (categories.length === 0) return <EmptyState icon={Layers} title="هنوز دسته‌بندی‌ای اضافه نشده است" subtitle="اولین دسته‌بندی فروشگاه خود را ایجاد کنید." actionLabel="افزودن دسته‌بندی" onAction={onAdd} palette={p} />;
  const sorted = [...categories].sort((a, b) => a.order - b.order);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p style={{ color: p.inkSoft, fontSize: 13.5 }}>{categories.length} دسته‌بندی</p>
        <button onClick={onAdd} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium" style={{ background: p.sageDeep, color: p.white }}><Plus size={15} /> افزودن دسته‌بندی</button>
      </div>
      <div className="flex flex-col gap-3">
        {sorted.map((c) => {
          const Icon = c.icon || Tag; const count = products.filter((pr) => pr.category === c.id).length;
          return (
            <div key={c.id} className="rounded-3xl p-4 flex items-center gap-4" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
              <span style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 13, color: p.inkSoft, width: 20 }}>{c.order}</span>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: p.sageMist }}><Icon size={18} style={{ color: p.sageDeep }} /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 15.5, color: p.ink }}>{c.name}</p>{c.featured && <Badge label="ویژه" bg={p.sageMist} fg={p.sageDeep} />}</div>
                <p style={{ fontSize: 12, color: p.inkSoft }} className="truncate">{c.description || "بدون توضیح"} · {count} محصول</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={() => onToggleFeatured(c.id)} className="text-xs font-medium rounded-full px-3 py-1.5 border" style={{ borderColor: p.beige, color: p.inkSoft }}>{c.featured ? "حذف از ویژه" : "افزودن به ویژه"}</button>
                <button onClick={() => onEdit(c)} aria-label="ویرایش دسته‌بندی"><Pencil size={15} style={{ color: p.inkSoft }} /></button>
                <button onClick={() => onDelete(c.id)} aria-label="حذف دسته‌بندی"><Trash2 size={15} style={{ color: "#A5453A" }} /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================
   TAB: Pages & Routing — Super Admin control over custom pages.
   Every saved page gets a guaranteed-unique slug (via uniqueSlug)
   and is immediately reachable at #/page/<slug>; the toggles below
   push/remove that URL from the header nav and footer menu, so
   nothing about routing or menus is hardcoded — it all flows from
   this list.
================================================================= */
function PagesTab({ customPages, onAdd, onEdit, onDelete, onToggleHeaderNav, onToggleFooterNav, headerNavLinks, footerLinks }) {
  const p = ADMIN_PALETTE;
  if (customPages.length === 0) return <EmptyState icon={LinkIcon} title="هنوز صفحه‌ای ایجاد نشده است" subtitle="صفحات دلخواه (درباره ما، حریم خصوصی، سوالات متداول و…) را با آدرس اختصاصی خودشان اینجا بسازید." actionLabel="افزودن صفحه" onAction={onAdd} palette={p} />;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p style={{ color: p.inkSoft, fontSize: 13.5 }}>{customPages.length} صفحه · مسیرها به‌صورت خودکار در سایت فعال می‌شوند</p>
        <button onClick={onAdd} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium" style={{ background: p.sageDeep, color: p.white }}><Plus size={15} /> افزودن صفحه</button>
      </div>
      <div className="flex flex-col gap-3">
        {customPages.map((pg) => {
          const inHeader = headerNavLinks.some((l) => l.href === `#/page/${pg.slug}`);
          const inFooter = footerLinks.some((l) => l.href === `#/page/${pg.slug}`);
          return (
            <div key={pg.id} className="rounded-3xl p-4 flex flex-col md:flex-row md:items-center gap-4" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: p.sageMist }}><LinkIcon size={17} style={{ color: p.sageDeep }} /></div>
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 15.5, color: p.ink }}>{pg.title}</p>
                <p style={{ fontSize: 12, color: p.inkSoft }} dir="ltr" className="truncate">#/page/{pg.slug}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button onClick={() => onToggleHeaderNav(pg)} className="text-xs font-medium rounded-full px-3 py-1.5 border" style={{ borderColor: inHeader ? p.sageDeep : p.beige, background: inHeader ? p.sageMist : "transparent", color: inHeader ? p.sageDeep : p.inkSoft }}>{inHeader ? "در منوی هدر ✓" : "افزودن به منوی هدر"}</button>
                <button onClick={() => onToggleFooterNav(pg)} className="text-xs font-medium rounded-full px-3 py-1.5 border" style={{ borderColor: inFooter ? p.sageDeep : p.beige, background: inFooter ? p.sageMist : "transparent", color: inFooter ? p.sageDeep : p.inkSoft }}>{inFooter ? "در فوتر ✓" : "افزودن به فوتر"}</button>
                <button onClick={() => onEdit(pg)} aria-label="ویرایش صفحه"><Pencil size={15} style={{ color: p.inkSoft }} /></button>
                <button onClick={() => onDelete(pg.id)} aria-label="حذف صفحه"><Trash2 size={15} style={{ color: "#A5453A" }} /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function emptyPageDraft() { return { title: "", slug: "", navLabel: "", content: "", fontSize: "", textAlign: "", backgroundColor: "", textColor: "", isJournal: false }; }
function PageFormModal({ draft, setDraft, onCancel, onSave, isEdit }) {
  const p = ADMIN_PALETTE;
  return (
    <ModalShell onClose={onCancel} title={isEdit ? "ویرایش صفحه" : "افزودن صفحه"} palette={p}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="flex flex-col gap-4">
        <div><FieldLabel palette={p}>عنوان صفحه</FieldLabel><TextInput palette={p} required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
        <div><FieldLabel palette={p}>آدرس (Slug) — خالی بگذارید تا خودکار ساخته شود</FieldLabel><TextInput palette={p} value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} dir="ltr" placeholder="about-us" /></div>
        <div><FieldLabel palette={p}>برچسب کوتاه در منو (اختیاری)</FieldLabel><TextInput palette={p} value={draft.navLabel} onChange={(e) => setDraft({ ...draft, navLabel: e.target.value })} /></div>
        <div><FieldLabel palette={p}>محتوای صفحه</FieldLabel><TextArea palette={p} rows={8} required value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} /></div>
        <label className="flex items-center gap-2.5 rounded-2xl px-4 py-3 cursor-pointer" style={{ background: p.creamDeep }}>
          <input type="checkbox" checked={draft.isJournal} onChange={(e) => setDraft({ ...draft, isJournal: e.target.checked })} className="w-4 h-4" />
          <span style={{ fontSize: 13, color: p.ink }}>نمایش به‌عنوان کارت مقاله ژورنال در صفحه اصلی</span>
        </label>

        <div className="rounded-2xl p-4" style={{ background: p.creamDeep, border: `1px solid ${p.beige}` }}>
          <div className="flex items-center gap-2 mb-3"><Type size={15} style={{ color: p.sageDeep }} /><p style={{ fontSize: 13, fontWeight: 600, color: p.ink }}>ظاهر این صفحه (اختیاری — پیش‌فرض از تنظیمات تم استفاده می‌شود)</p></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel palette={p}>اندازه فونت</FieldLabel>
              <SelectInput palette={p} value={draft.fontSize} onChange={(e) => setDraft({ ...draft, fontSize: e.target.value })}>
                <option value="">پیش‌فرض تم</option>
                {Object.keys(FONT_SCALE_OPTIONS).map((k) => <option key={k} value={k}>{k}</option>)}
              </SelectInput>
            </div>
            <div>
              <FieldLabel palette={p}>چینش متن</FieldLabel>
              <SelectInput palette={p} value={draft.textAlign} onChange={(e) => setDraft({ ...draft, textAlign: e.target.value })}>
                <option value="">پیش‌فرض تم</option>
                {TEXT_ALIGN_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
              </SelectInput>
            </div>
            <div>
              <FieldLabel palette={p}>رنگ پس‌زمینه</FieldLabel>
              <div className="flex items-center gap-2">
                <input type="color" value={draft.backgroundColor || "#FBF7F1"} onChange={(e) => setDraft({ ...draft, backgroundColor: e.target.value })} className="w-10 h-10 rounded-lg border p-0.5" style={{ borderColor: p.beige }} />
                <TextInput palette={p} value={draft.backgroundColor} onChange={(e) => setDraft({ ...draft, backgroundColor: e.target.value })} dir="ltr" placeholder="پیش‌فرض تم" className="flex-1" />
              </div>
            </div>
            <div>
              <FieldLabel palette={p}>رنگ متن</FieldLabel>
              <div className="flex items-center gap-2">
                <input type="color" value={draft.textColor || "#5C554B"} onChange={(e) => setDraft({ ...draft, textColor: e.target.value })} className="w-10 h-10 rounded-lg border p-0.5" style={{ borderColor: p.beige }} />
                <TextInput palette={p} value={draft.textColor} onChange={(e) => setDraft({ ...draft, textColor: e.target.value })} dir="ltr" placeholder="پیش‌فرض تم" className="flex-1" />
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 -mx-6 md:-mx-7 -mb-6 md:-mb-7 px-6 md:px-7 pb-6 md:pb-7 pt-4 mt-2 flex gap-3" style={{ background: p.white }}>
          <button type="button" onClick={onCancel} className="flex-1 rounded-full py-3 text-sm font-medium border" style={{ borderColor: p.beige, color: p.ink }}>انصراف</button>
          <button type="submit" className="flex-1 rounded-full py-3 text-sm font-medium" style={{ background: p.sageDeep, color: p.white }}>{isEdit ? "ذخیره تغییرات" : "افزودن صفحه"}</button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ================================================================
   TAB: Routine Bundles — curated multi-product sets sold with a
   single bundled discount. Each bundle references real product IDs
   selected below; the storefront hides any bundle whose selected
   products don't exist yet (e.g. right after creation) so nothing
   broken is ever shown to customers.
================================================================= */
function emptyBundleDraft() { return { title: "", description: "", discountPercent: "15", productIds: [] }; }
function BundlesTab({ bundles, products, onAdd, onEdit, onDelete }) {
  const p = ADMIN_PALETTE;
  if (bundles.length === 0) return <EmptyState icon={PackageCheck} title="هنوز بسته روتینی ایجاد نشده است" subtitle="چند محصول را در قالب یک روتین کامل با تخفیف ویژه بسته‌بندی کنید." actionLabel="افزودن بسته روتین" onAction={onAdd} palette={p} />;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p style={{ color: p.inkSoft, fontSize: 13.5 }}>{bundles.length} بسته روتین</p>
        <button onClick={onAdd} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium" style={{ background: p.sageDeep, color: p.white }}><Plus size={15} /> افزودن بسته روتین</button>
      </div>
      <div className="flex flex-col gap-3">
        {bundles.map((b) => {
          const items = (b.productIds || []).map((id) => products.find((pr) => pr.id === id)).filter(Boolean);
          return (
            <div key={b.id} className="rounded-3xl p-4 flex flex-col md:flex-row md:items-center gap-4" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: p.sageMist }}><PackageCheck size={17} style={{ color: p.sageDeep }} /></div>
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 15.5, color: p.ink }}>{b.title}</p>
                <p style={{ fontSize: 12, color: p.inkSoft }} className="truncate">{items.length > 0 ? items.map((it) => it.name).join("، ") : "هنوز محصولی انتخاب نشده"} · {b.discountPercent}٪ تخفیف</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => onEdit(b)} aria-label="ویرایش بسته"><Pencil size={15} style={{ color: p.inkSoft }} /></button>
                <button onClick={() => onDelete(b.id)} aria-label="حذف بسته"><Trash2 size={15} style={{ color: "#A5453A" }} /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function BundleFormModal({ draft, setDraft, onCancel, onSave, isEdit, products }) {
  const p = ADMIN_PALETTE;
  function toggleProduct(id) { setDraft((d) => ({ ...d, productIds: d.productIds.includes(id) ? d.productIds.filter((x) => x !== id) : [...d.productIds, id] })); }
  return (
    <ModalShell onClose={onCancel} title={isEdit ? "ویرایش بسته روتین" : "افزودن بسته روتین"} palette={p}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="flex flex-col gap-4">
        <div><FieldLabel palette={p}>عنوان بسته</FieldLabel><TextInput palette={p} required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="مثلاً روتین پایه پوست چرب" /></div>
        <div><FieldLabel palette={p}>توضیح کوتاه</FieldLabel><TextArea palette={p} rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
        <div><FieldLabel palette={p}>درصد تخفیف بسته</FieldLabel><TextInput palette={p} type="number" min="0" max="90" value={draft.discountPercent} onChange={(e) => setDraft({ ...draft, discountPercent: e.target.value })} /></div>
        <div>
          <FieldLabel palette={p}>محصولات این بسته</FieldLabel>
          {products.length === 0 ? (
            <p style={{ fontSize: 12.5, color: "#A5453A" }}>ابتدا از تب «مدیریت محصولات» چند محصول اضافه کنید.</p>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto rounded-2xl border p-2" style={{ borderColor: p.beige }}>
              {products.map((pr) => (
                <label key={pr.id} className="flex items-center gap-2.5 rounded-xl px-3 py-2 cursor-pointer" style={{ background: draft.productIds.includes(pr.id) ? p.creamDeep : "transparent" }}>
                  <input type="checkbox" checked={draft.productIds.includes(pr.id)} onChange={() => toggleProduct(pr.id)} className="w-4 h-4" />
                  <span style={{ fontSize: 13, color: p.ink }} className="flex-1">{pr.name}</span>
                  <span style={{ fontSize: 11.5, color: p.inkSoft }}>{(pr.salePrice || pr.price).toLocaleString("en-US")}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="sticky bottom-0 -mx-6 md:-mx-7 -mb-6 md:-mb-7 px-6 md:px-7 pb-6 md:pb-7 pt-4 mt-2 flex gap-3" style={{ background: p.white }}>
          <button type="button" onClick={onCancel} className="flex-1 rounded-full py-3 text-sm font-medium border" style={{ borderColor: p.beige, color: p.ink }}>انصراف</button>
          <button type="submit" className="flex-1 rounded-full py-3 text-sm font-medium" style={{ background: p.sageDeep, color: p.white }}>{isEdit ? "ذخیره تغییرات" : "افزودن بسته"}</button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ================================================================
   TAB: Customers (derived from orders — no directory of its own)
================================================================= */
function CustomersTab({ orders, currencySettings }) {
  const p = ADMIN_PALETTE;
  const fmt = (n) => formatPrice(n, currencySettings);
  if (orders.length === 0) return <EmptyState icon={Users} title="هنوز مشتری‌ای ثبت نشده است" subtitle="فهرست مشتریان از روی سفارش‌های ثبت‌شده ساخته می‌شود." palette={p} />;
  const map = {};
  orders.forEach((o) => {
    if (!map[o.email]) map[o.email] = { name: o.customer, email: o.email, phone: o.phone, total: 0, count: 0, since: o.date };
    map[o.email].total += orderTotal(o);
    map[o.email].count += 1;
    if (o.date < map[o.email].since) map[o.email].since = o.date;
  });
  const customers = Object.values(map).sort((a, b) => b.total - a.total);
  return (
    <div className="rounded-3xl overflow-x-auto" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
      <table className="w-full text-sm min-w-[640px]">
        <thead><tr style={{ borderBottom: `1px solid ${p.beige}` }}>{["نام", "ایمیل", "تلفن", "مجموع خرید", "تعداد سفارش", "مشتری از تاریخ"].map((h) => <th key={h} className="text-right px-5 py-3 font-medium" style={{ color: p.inkSoft, fontSize: 12 }}>{h}</th>)}</tr></thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.email} style={{ borderBottom: `1px solid ${p.creamDeep}` }}>
              <td className="px-5 py-3" style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 14, color: p.ink }}>{c.name}</td>
              <td className="px-5 py-3" style={{ color: p.inkSoft, fontSize: 12.5 }} dir="ltr">{c.email}</td>
              <td className="px-5 py-3" style={{ color: p.inkSoft, fontSize: 12.5 }} dir="ltr">{c.phone}</td>
              <td className="px-5 py-3" style={{ color: p.ink }}>{fmt(c.total)}</td>
              <td className="px-5 py-3" style={{ color: p.ink }}>{c.count}</td>
              <td className="px-5 py-3" style={{ color: p.inkSoft, fontSize: 12.5 }}>{c.since.slice(0, 10)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ================================================================
   TAB: Reviews
================================================================= */
function ReviewsTab({ reviews, onAdd, onApprove, onReject, onDelete, onReply }) {
  const p = ADMIN_PALETTE;
  if (reviews.length === 0) return <EmptyState icon={MessageSquare} title="هنوز نظری ثبت نشده است" subtitle="نظرات مشتریان اینجا برای بررسی نمایش داده می‌شوند." actionLabel="افزودن نظر" onAction={onAdd} palette={p} />;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end"><button onClick={onAdd} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium" style={{ background: p.sageDeep, color: p.white }}><Plus size={15} /> افزودن نظر</button></div>
      <div className="rounded-3xl overflow-x-auto" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <table className="w-full text-sm min-w-[760px]">
          <thead><tr style={{ borderBottom: `1px solid ${p.beige}` }}>{["مشتری", "محصول", "امتیاز", "متن نظر", "تاریخ", "وضعیت", ""].map((h) => <th key={h} className="text-right px-5 py-3 font-medium" style={{ color: p.inkSoft, fontSize: 12 }}>{h}</th>)}</tr></thead>
          <tbody>
            {reviews.map((r) => {
              const st = resolveStyle(REVIEW_STYLE[r.status], p);
              return (
                <tr key={r.id} style={{ borderBottom: `1px solid ${p.creamDeep}` }}>
                  <td className="px-5 py-3" style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 14, color: p.ink }}>{r.name}</td>
                  <td className="px-5 py-3" style={{ color: p.inkSoft, fontSize: 12.5 }}>{r.product || "—"}</td>
                  <td className="px-5 py-3"><Stars rating={r.rating} size={12} color={p.bronze} /></td>
                  <td className="px-5 py-3 max-w-[260px]"><p className="truncate" style={{ fontSize: 12.5, color: p.inkSoft }}>{r.text}</p></td>
                  <td className="px-5 py-3" style={{ color: p.inkSoft, fontSize: 12 }}>{r.date}</td>
                  <td className="px-5 py-3"><Badge label={r.status} bg={st.bg} fg={st.fg} /></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      {r.status !== "تأیید شده" && <button onClick={() => onApprove(r.id)} aria-label="تأیید نظر"><CheckCircle2 size={16} style={{ color: p.sageDeep }} /></button>}
                      {r.status !== "رد شده" && <button onClick={() => onReject(r.id)} aria-label="رد نظر"><XCircle size={16} style={{ color: "#A5453A" }} /></button>}
                      <button onClick={() => onReply(r)} aria-label="پاسخ به نظر"><MessageSquare size={15} style={{ color: p.inkSoft }} /></button>
                      <button onClick={() => onDelete(r.id)} aria-label="حذف نظر"><Trash2 size={15} style={{ color: "#A5453A" }} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================================================================
   TAB: Promotions
================================================================= */
function PromotionsTab({ discounts, onAdd, onDelete, onToggleStatus, currencySettings }) {
  const p = ADMIN_PALETTE;
  const fmt = (n) => formatPrice(n, currencySettings);
  if (discounts.length === 0) return <EmptyState icon={Gift} title="هنوز کد تخفیفی ایجاد نشده است" subtitle="کدهای تخفیف فروشگاه اینجا نمایش داده می‌شوند." actionLabel="ایجاد کد تخفیف" onAction={onAdd} palette={p} />;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p style={{ color: p.inkSoft, fontSize: 13.5 }}>{discounts.length} کد تخفیف</p>
        <button onClick={onAdd} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium" style={{ background: p.sageDeep, color: p.white }}><Plus size={15} /> ایجاد کد تخفیف</button>
      </div>
      <div className="rounded-3xl overflow-x-auto" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <table className="w-full text-sm min-w-[680px]">
          <thead><tr style={{ borderBottom: `1px solid ${p.beige}` }}>{["کد", "نوع", "مقدار", "استفاده‌شده", "انقضا", "وضعیت", ""].map((h) => <th key={h} className="text-right px-5 py-3 font-medium" style={{ color: p.inkSoft, fontSize: 12 }}>{h}</th>)}</tr></thead>
          <tbody>
            {discounts.map((d) => {
              const st = resolveStyle(DISCOUNT_STYLE[d.status], p);
              return (
                <tr key={d.code} style={{ borderBottom: `1px solid ${p.creamDeep}` }}>
                  <td className="px-5 py-3" style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 14, color: p.ink }} dir="ltr">{d.code}</td>
                  <td className="px-5 py-3" style={{ color: p.inkSoft }}>{d.type}</td>
                  <td className="px-5 py-3" style={{ color: p.ink }}>{d.type === "ارسال رایگان" ? "—" : d.type === "درصدی" ? `٪${d.value}` : fmt(d.value)}</td>
                  <td className="px-5 py-3" style={{ color: p.inkSoft }}>{d.usageCount} / {d.usageLimit}</td>
                  <td className="px-5 py-3" style={{ color: p.inkSoft, fontSize: 12.5 }}>{d.expiry}</td>
                  <td className="px-5 py-3"><button onClick={() => onToggleStatus(d.code)}><Badge label={d.status} bg={st.bg} fg={st.fg} /></button></td>
                  <td className="px-5 py-3"><button onClick={() => onDelete(d.code)} aria-label="حذف کد تخفیف"><Trash2 size={15} style={{ color: "#A5453A" }} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================================================================
   TAB: Content (Hero + Homepage Promo Banner + FAQ Builder)
================================================================= */
/* ================================================================
   TAB: Skin Quiz Builder — dynamic question/option editor plus a
   routine "results" library where the admin hand-picks the exact
   products (and discount) each quiz outcome recommends.
================================================================= */
function emptyQuizResultDraft() { return { id: "res-" + Date.now(), name: "", productIds: [], discountPct: "10" }; }

function QuizBuilderTab({ quizSettings, setQuizSettings, quizQuestions, setQuizQuestions, quizResults, setQuizResults, products }) {
  const p = ADMIN_PALETTE;
  const lastQuestionId = quizQuestions.length > 0 ? quizQuestions[quizQuestions.length - 1].id : null;

  function addQuestion() {
    setQuizQuestions((prev) => [...prev, { id: "q-" + Date.now(), question: "سؤال جدید", options: [{ id: "o-" + Date.now(), label: "گزینه ۱", resultId: "" }] }]);
  }
  function removeQuestion(qi) { setQuizQuestions((prev) => prev.filter((_, i) => i !== qi)); }
  function updateQuestionText(qi, text) { setQuizQuestions((prev) => prev.map((q, i) => i === qi ? { ...q, question: text } : q)); }
  function addOption(qi) {
    setQuizQuestions((prev) => prev.map((q, i) => i === qi ? { ...q, options: [...q.options, { id: "o-" + Date.now(), label: "گزینه جدید", resultId: "" }] } : q));
  }
  function updateOption(qi, oi, key, value) {
    setQuizQuestions((prev) => prev.map((q, i) => i === qi ? { ...q, options: q.options.map((o, j) => j === oi ? { ...o, [key]: value } : o) } : q));
  }
  function removeOption(qi, oi) {
    setQuizQuestions((prev) => prev.map((q, i) => i === qi ? { ...q, options: q.options.filter((_, j) => j !== oi) } : q));
  }

  const [resultDraftOpen, setResultDraftOpen] = useState(false);
  const [editingResultIndex, setEditingResultIndex] = useState(null);
  const [resultDraft, setResultDraft] = useState(emptyQuizResultDraft());

  function openAddResult() { setEditingResultIndex(null); setResultDraft(emptyQuizResultDraft()); setResultDraftOpen(true); }
  function openEditResult(i) { setEditingResultIndex(i); setResultDraft({ ...quizResults[i], discountPct: String(quizResults[i].discountPct) }); setResultDraftOpen(true); }
  function toggleResultProduct(id) {
    setResultDraft((d) => ({ ...d, productIds: d.productIds.includes(id) ? d.productIds.filter((x) => x !== id) : [...d.productIds, id] }));
  }
  function saveResult() {
    const cleaned = { ...resultDraft, discountPct: Number(resultDraft.discountPct) || 0 };
    if (editingResultIndex != null) {
      setQuizResults((prev) => prev.map((r, i) => i === editingResultIndex ? cleaned : r));
    } else {
      setQuizResults((prev) => [...prev, cleaned]);
    }
    setResultDraftOpen(false);
  }
  function removeResult(id) {
    if (window.confirm("این نتیجه حذف شود؟ گزینه‌هایی که به آن متصل بودند دیگر روتینی نشان نمی‌دهند.")) {
      setQuizResults((prev) => prev.filter((r) => r.id !== id));
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <div className="flex items-center gap-2 mb-4"><Sparkles size={17} style={{ color: p.sageDeep }} /><p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }}>تنظیمات کلی</p></div>
        <Toggle palette={p} label="نمایش دکمه شناور مشاور پوست در فروشگاه" on={quizSettings.enabled} onChange={(v) => setQuizSettings({ ...quizSettings, enabled: v })} />
        <div className="mt-2"><FieldLabel palette={p}>متن دکمه شناور</FieldLabel><TextInput palette={p} value={quizSettings.buttonText} onChange={(e) => setQuizSettings({ ...quizSettings, buttonText: e.target.value })} /></div>
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <div className="flex items-center justify-between mb-2">
          <p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }}>سوالات کوییز</p>
          <button onClick={addQuestion} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium" style={{ background: p.sageDeep, color: p.white }}><Plus size={13} /> افزودن سؤال</button>
        </div>
        <p style={{ fontSize: 12, color: p.inkSoft }} className="mb-4">فقط گزینه‌های <b>آخرین سؤال</b> به یک «نتیجه» (روتین پیشنهادی) متصل می‌شوند؛ سوالات قبلی صرفاً بخشی از تجربه کاربر هستند.</p>
        {quizQuestions.length === 0 ? (
          <EmptyState compact icon={Sparkles} title="هنوز سؤالی اضافه نشده است" actionLabel="افزودن سؤال" onAction={addQuestion} palette={p} />
        ) : (
          <div className="flex flex-col gap-4">
            {quizQuestions.map((q, qi) => (
              <div key={q.id} className="rounded-2xl p-4" style={{ background: p.creamDeep }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0" style={{ background: p.sageDeep, color: p.white }}>{qi + 1}</span>
                  <TextInput palette={p} value={q.question} onChange={(e) => updateQuestionText(qi, e.target.value)} style={{ background: p.white }} className="flex-1" />
                  <button onClick={() => removeQuestion(qi)} aria-label="حذف سؤال" className="shrink-0"><Trash2 size={16} style={{ color: "#A5453A" }} /></button>
                </div>
                <div className="flex flex-col gap-2 pr-8">
                  {q.options.map((opt, oi) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <TextInput palette={p} value={opt.label} onChange={(e) => updateOption(qi, oi, "label", e.target.value)} style={{ background: p.white }} className="flex-1 !py-2" />
                      {q.id === lastQuestionId && (
                        <SelectInput palette={p} value={opt.resultId} onChange={(e) => updateOption(qi, oi, "resultId", e.target.value)} className="!w-auto !py-2">
                          <option value="">— بدون نتیجه —</option>
                          {quizResults.map((r) => <option key={r.id} value={r.id}>{r.name || "(بدون نام)"}</option>)}
                        </SelectInput>
                      )}
                      <button onClick={() => removeOption(qi, oi)} aria-label="حذف گزینه" className="shrink-0"><X size={15} style={{ color: p.inkSoft }} /></button>
                    </div>
                  ))}
                  <button onClick={() => addOption(qi)} className="self-start inline-flex items-center gap-1 text-xs font-medium mt-1" style={{ color: p.sageDeep }}><Plus size={12} /> افزودن گزینه</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <div className="flex items-center justify-between mb-2">
          <p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }}>روتین‌های پیشنهادی (نتایج)</p>
          <button onClick={openAddResult} disabled={products.length === 0} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium" style={{ background: products.length === 0 ? p.beige : p.sageDeep, color: products.length === 0 ? p.inkSoft : p.white }}><Plus size={13} /> افزودن نتیجه</button>
        </div>
        <p style={{ fontSize: 12, color: p.inkSoft }} className="mb-4">برای هر نتیجه، محصولات دقیق روتین و درصد تخفیف آن را انتخاب کنید؛ سپس آن را از گزینه‌های آخرین سؤال بالا انتخاب کنید تا به کاربر نمایش داده شود.</p>
        {products.length === 0 && <p style={{ fontSize: 12.5, color: "#A5453A" }} className="mb-3">ابتدا از تب «مدیریت محصولات» چند محصول اضافه کنید.</p>}
        {quizResults.length === 0 ? (
          <EmptyState compact icon={Gift} title="هنوز نتیجه‌ای تعریف نشده است" palette={p} />
        ) : (
          <div className="flex flex-col gap-2.5">
            {quizResults.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3 rounded-2xl p-3.5" style={{ background: p.creamDeep }}>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 14, color: p.ink }} className="truncate">{r.name || "(بدون نام)"}</p>
                  <p style={{ fontSize: 11.5, color: p.inkSoft }}>{r.productIds.length} محصول · {r.discountPct}٪ تخفیف</p>
                </div>
                <button onClick={() => openEditResult(i)} aria-label="ویرایش نتیجه"><Pencil size={15} style={{ color: p.inkSoft }} /></button>
                <button onClick={() => removeResult(r.id)} aria-label="حذف نتیجه"><Trash2 size={15} style={{ color: "#A5453A" }} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {resultDraftOpen && (
        <ModalShell onClose={() => setResultDraftOpen(false)} title={editingResultIndex != null ? "ویرایش نتیجه" : "افزودن نتیجه"} wide palette={p}>
          <div className="flex flex-col gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><FieldLabel palette={p}>نام نتیجه (برای نمایش به کاربر)</FieldLabel><TextInput palette={p} value={resultDraft.name} onChange={(e) => setResultDraft({ ...resultDraft, name: e.target.value })} placeholder="مثلاً روتین آبرسانی برای پوست خشک" /></div>
              <div><FieldLabel palette={p}>درصد تخفیف روتین</FieldLabel><TextInput palette={p} type="number" min="0" max="100" value={resultDraft.discountPct} onChange={(e) => setResultDraft({ ...resultDraft, discountPct: e.target.value })} /></div>
            </div>
            <div>
              <FieldLabel palette={p}>محصولات این روتین</FieldLabel>
              {products.length === 0 ? <p style={{ fontSize: 12.5, color: p.inkSoft }}>محصولی برای انتخاب وجود ندارد.</p> : (
                <div className="grid sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {products.map((pr) => {
                    const active = resultDraft.productIds.includes(pr.id);
                    return (
                      <button type="button" key={pr.id} onClick={() => toggleResultProduct(pr.id)} className="flex items-center gap-2 rounded-2xl p-2.5 border text-right transition-all"
                        style={{ background: active ? p.sageMist : p.white, borderColor: active ? p.sageDeep : p.beige }}>
                        <div className="rounded-lg flex items-center justify-center shrink-0" style={{ width: 32, height: 32, background: `${pr.tint}55` }}><div className="scale-[0.35]"><Bottle tint={pr.tint} ink={p.ink} white={p.white} /></div></div>
                        <span className="flex-1 truncate" style={{ fontSize: 12.5, color: p.ink }}>{pr.name}</span>
                        {active && <Check size={14} style={{ color: p.sageDeep }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="sticky bottom-0 -mx-6 md:-mx-7 -mb-6 md:-mb-7 px-6 md:px-7 pb-6 md:pb-7 pt-4 mt-2 flex gap-3" style={{ background: p.white }}>
              <button onClick={() => setResultDraftOpen(false)} className="flex-1 rounded-full py-3 text-sm font-medium border" style={{ borderColor: p.beige, color: p.ink }}>انصراف</button>
              <button onClick={saveResult} disabled={!resultDraft.name.trim()} className="flex-1 rounded-full py-3 text-sm font-medium" style={{ background: !resultDraft.name.trim() ? p.beige : p.sageDeep, color: !resultDraft.name.trim() ? p.inkSoft : p.white }}>{editingResultIndex != null ? "ذخیره تغییرات" : "افزودن نتیجه"}</button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}


function ContentTab({ hero, setHero, banner, setBanner, faqs, setFaqs, welcomeModal, setWelcomeModal, ingredientLibrary, setIngredientLibrary }) {
  const p = ADMIN_PALETTE;
  const [saved, setSaved] = useState(false);

  function updateFaq(i, key, value) { setFaqs((prev) => prev.map((f, idx) => idx === i ? { ...f, [key]: value } : f)); }
  function moveFaq(i, dir) {
    setFaqs((prev) => { const next = [...prev]; const j = i + dir; if (j < 0 || j >= next.length) return prev; [next[i], next[j]] = [next[j], next[i]]; return next; });
  }
  function removeFaq(i) { setFaqs((prev) => prev.filter((_, idx) => idx !== i)); }
  function addFaq() { setFaqs((prev) => [...prev, { q: "سؤال جدید", a: "پاسخ را اینجا وارد کنید." }]); }

  function updateIngredient(i, key, value) { setIngredientLibrary((prev) => prev.map((ing, idx) => idx === i ? { ...ing, [key]: value } : ing)); }
  function removeIngredient(i) { setIngredientLibrary((prev) => prev.filter((_, idx) => idx !== i)); }
  function addIngredient() { setIngredientLibrary((prev) => [...prev, { id: Date.now(), name: "ترکیب جدید", benefit: "فایده این ترکیب را اینجا توضیح دهید." }]); }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <div className="flex items-center gap-2 mb-2"><Sparkles size={17} style={{ color: p.sageDeep }} /><p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }}>مودال خوش‌آمدگویی</p></div>
        <p style={{ fontSize: 12, color: p.inkSoft }} className="mb-3">در اولین بازدید هر کاربر (به‌صورت مرورگر) یک‌بار نمایش داده می‌شود.</p>
        <Toggle palette={p} label="نمایش مودال خوش‌آمدگویی" on={welcomeModal.enabled} onChange={(v) => setWelcomeModal({ ...welcomeModal, enabled: v })} />
        <div className="grid sm:grid-cols-2 gap-4 mt-2">
          <div><FieldLabel palette={p}>عنوان فارسی</FieldLabel><TextInput palette={p} value={welcomeModal.headlineFa} onChange={(e) => setWelcomeModal({ ...welcomeModal, headlineFa: e.target.value })} /></div>
          <div><FieldLabel palette={p}>عنوان انگلیسی</FieldLabel><TextInput palette={p} value={welcomeModal.headlineEn} onChange={(e) => setWelcomeModal({ ...welcomeModal, headlineEn: e.target.value })} dir="ltr" /></div>
        </div>
        <div className="mt-4"><FieldLabel palette={p}>زیرعنوان</FieldLabel><TextArea palette={p} rows={2} value={welcomeModal.subtitle} onChange={(e) => setWelcomeModal({ ...welcomeModal, subtitle: e.target.value })} /></div>
        <div className="mt-4"><FieldLabel palette={p}>متن دکمه</FieldLabel><TextInput palette={p} value={welcomeModal.ctaText} onChange={(e) => setWelcomeModal({ ...welcomeModal, ctaText: e.target.value })} /></div>
        <div className="mt-4">
          <FieldLabel palette={p}>تصویر مودال (در صورت خالی بودن، ماسکات پیش‌فرض نمایش داده می‌شود)</FieldLabel>
          <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5 border mb-3" style={{ borderColor: p.beige }}>
            <ImagePlus size={15} style={{ color: p.inkSoft }} />
            <input placeholder="آدرس تصویر یا آپلود" value={welcomeModal.image} onChange={(e) => setWelcomeModal({ ...welcomeModal, image: e.target.value })} className="flex-1 text-sm outline-none" style={{ color: p.ink }} />
            <label className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer shrink-0" style={{ background: p.creamDeep, color: p.inkSoft }}><Upload size={12} /> آپلود<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && setWelcomeModal({ ...welcomeModal, image: e.target.files[0].name })} /></label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><FieldLabel palette={p}>عرض تصویر (پیکسل)</FieldLabel><TextInput palette={p} type="number" min="80" max="720" value={welcomeModal.imageWidth} onChange={(e) => setWelcomeModal({ ...welcomeModal, imageWidth: e.target.value })} /></div>
            <div><FieldLabel palette={p}>ارتفاع تصویر (پیکسل)</FieldLabel><TextInput palette={p} type="number" min="80" max="720" value={welcomeModal.imageHeight} onChange={(e) => setWelcomeModal({ ...welcomeModal, imageHeight: e.target.value })} /></div>
          </div>
          <p style={{ fontSize: 11, color: p.inkSoft }} className="mt-2">جلوه‌های شناوری، درخشش نرم و انعکاس نور به‌صورت خودکار روی تصویر اعمال می‌شوند.</p>
        </div>
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }} className="mb-4">بخش هیرو (صفحه اصلی)</p>
        <form onSubmit={(e) => { e.preventDefault(); setSaved(true); }} className="flex flex-col gap-4">
          <div><FieldLabel palette={p}>عنوان اصلی</FieldLabel><TextInput palette={p} value={hero.headline} onChange={(e) => setHero({ ...hero, headline: e.target.value })} /></div>
          <div><FieldLabel palette={p}>زیرعنوان</FieldLabel><TextArea palette={p} rows={2} value={hero.subtitle} onChange={(e) => setHero({ ...hero, subtitle: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><FieldLabel palette={p}>متن دکمه CTA</FieldLabel><TextInput palette={p} value={hero.ctaText} onChange={(e) => setHero({ ...hero, ctaText: e.target.value })} /></div>
            <div><FieldLabel palette={p}>لینک دکمه CTA</FieldLabel><TextInput palette={p} value={hero.ctaLink} onChange={(e) => setHero({ ...hero, ctaLink: e.target.value })} dir="ltr" /></div>
          </div>
          <div><FieldLabel palette={p}>تصویر اصلی هیرو (در صورت خالی بودن، ویژوال پیش‌فرض نمایش داده می‌شود)</FieldLabel>
            <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5 border" style={{ borderColor: p.beige }}>
              <ImagePlus size={15} style={{ color: p.inkSoft }} />
              <input placeholder="آدرس فایل یا آپلود" value={hero.bgImage} onChange={(e) => setHero({ ...hero, bgImage: e.target.value })} className="flex-1 text-sm outline-none" style={{ color: p.ink }} />
              <label className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer shrink-0" style={{ background: p.creamDeep, color: p.inkSoft }}><Upload size={12} /> آپلود<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && setHero({ ...hero, bgImage: e.target.files[0].name })} /></label>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div><FieldLabel palette={p}>عرض تصویر (پیکسل)</FieldLabel><TextInput palette={p} type="number" min="80" max="720" value={hero.imageWidth} onChange={(e) => setHero({ ...hero, imageWidth: e.target.value })} /></div>
              <div><FieldLabel palette={p}>ارتفاع تصویر (پیکسل)</FieldLabel><TextInput palette={p} type="number" min="80" max="720" value={hero.imageHeight} onChange={(e) => setHero({ ...hero, imageHeight: e.target.value })} /></div>
            </div>
            <p style={{ fontSize: 11, color: p.inkSoft }} className="mt-2">شناوری نرم، هاله درخشان و انعکاس نور به‌صورت خودکار روی این تصویر اعمال می‌شود.</p>
          </div>
          <button type="submit" className="self-start rounded-full px-6 py-2.5 text-sm font-medium" style={{ background: p.sageDeep, color: p.white }}>{saved ? "ذخیره شد ✓" : "ذخیره تغییرات"}</button>
        </form>
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <div className="flex items-center gap-2 mb-2"><Megaphone size={17} style={{ color: p.sageDeep }} /><p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }}>بنر تبلیغاتی صفحه اصلی</p></div>
        <p style={{ fontSize: 12, color: p.inkSoft }} className="mb-3">این بنر بین بخش هیرو و دسته‌بندی‌ها نمایش داده می‌شود — جدا از نوار اعلان بالای سایت (که در بخش «هدر و ناوبری» تنظیم می‌شود).</p>
        <Toggle palette={p} label="نمایش بنر" on={banner.enabled} onChange={(v) => setBanner({ ...banner, enabled: v })} />
        <div className="mt-2"><FieldLabel palette={p}>متن بنر</FieldLabel><TextInput palette={p} value={banner.text} onChange={(e) => setBanner({ ...banner, text: e.target.value })} /></div>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div><FieldLabel palette={p}>لینک مقصد</FieldLabel><TextInput palette={p} value={banner.link} onChange={(e) => setBanner({ ...banner, link: e.target.value })} dir="ltr" /></div>
          <div><FieldLabel palette={p}>تصویر بنر</FieldLabel><TextInput palette={p} value={banner.image} onChange={(e) => setBanner({ ...banner, image: e.target.value })} placeholder="آدرس تصویر" /></div>
        </div>
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <div className="flex items-center justify-between mb-4">
          <p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }}>ویرایشگر سوالات متداول</p>
          <button onClick={addFaq} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium" style={{ background: p.sageDeep, color: p.white }}><Plus size={13} /> افزودن سؤال</button>
        </div>
        {faqs.length === 0 ? <EmptyState compact icon={MessageSquare} title="سؤالی اضافه نشده است" palette={p} /> : (
          <div className="flex flex-col gap-3">
            {faqs.map((f, i) => (
              <div key={i} className="rounded-2xl p-4" style={{ background: p.creamDeep }}>
                <div className="flex items-start gap-2">
                  <div className="flex-1 flex flex-col gap-2">
                    <TextInput palette={p} value={f.q} onChange={(e) => updateFaq(i, "q", e.target.value)} style={{ background: p.white }} />
                    <TextArea palette={p} rows={2} value={f.a} onChange={(e) => updateFaq(i, "a", e.target.value)} style={{ background: p.white }} />
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button onClick={() => moveFaq(i, -1)} disabled={i === 0} aria-label="جابه‌جایی به بالا" style={{ opacity: i === 0 ? 0.3 : 1 }}><ChevronUp size={16} color={p.ink} /></button>
                    <button onClick={() => moveFaq(i, 1)} disabled={i === faqs.length - 1} aria-label="جابه‌جایی به پایین" style={{ opacity: i === faqs.length - 1 ? 0.3 : 1 }}><ChevronDown size={16} color={p.ink} /></button>
                    <button onClick={() => removeFaq(i)} aria-label="حذف سؤال"><Trash2 size={15} style={{ color: "#A5453A" }} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><Leaf size={17} style={{ color: p.sageDeep }} /><p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }}>دایره‌المعارف ترکیبات (Ingredientspedia)</p></div>
          <button onClick={addIngredient} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium" style={{ background: p.sageDeep, color: p.white }}><Plus size={13} /> افزودن ترکیب</button>
        </div>
        <p style={{ fontSize: 12, color: p.inkSoft }} className="mb-4">هر ترکیب که اینجا اضافه کنید، به‌طور خودکار با محصولاتی که نام آن در فهرست «ترکیبات» شان آمده مرتبط می‌شود.</p>
        {ingredientLibrary.length === 0 ? (
          <EmptyState compact icon={Leaf} title="هنوز ترکیبی اضافه نشده است" palette={p} />
        ) : (
          <div className="flex flex-col gap-3">
            {ingredientLibrary.map((ing, i) => (
              <div key={ing.id} className="rounded-2xl p-4 flex items-start gap-2" style={{ background: p.creamDeep }}>
                <div className="flex-1 flex flex-col gap-2">
                  <TextInput palette={p} value={ing.name} onChange={(e) => updateIngredient(i, "name", e.target.value)} style={{ background: p.white }} placeholder="نام ترکیب (مثلاً آلوئه‌ورا)" />
                  <TextArea palette={p} rows={2} value={ing.benefit} onChange={(e) => updateIngredient(i, "benefit", e.target.value)} style={{ background: p.white }} placeholder="فایده این ترکیب برای پوست" />
                </div>
                <button onClick={() => removeIngredient(i)} aria-label="حذف ترکیب" className="shrink-0"><Trash2 size={15} style={{ color: "#A5453A" }} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   TAB: Customizer — Branding, Layout, Header, Footer
   (this is the module that makes admin changes reflect live on
   the storefront: it edits the theme/layout/header/footer state
   that lives in the root App and is passed straight to Storefront)
================================================================= */

function ColorField({ label, value, onChange }) {
  const p = ADMIN_PALETTE;
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span style={{ fontSize: 13, color: p.ink }}>{label}</span>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 rounded-lg border cursor-pointer" style={{ borderColor: p.beige }} />
        <span style={{ fontSize: 11, color: p.inkSoft, fontFamily: "monospace" }} dir="ltr">{value}</span>
      </div>
    </div>
  );
}

function BrandingSubTab({ theme, setTheme }) {
  const p = ADMIN_PALETTE;
  function applyPreset(name) { setTheme({ ...theme, preset: name, ...THEME_PRESETS[name] }); }
  const colorFields = [
    ["رنگ اصلی برند", "sageDeep"], ["رنگ ثانویه/تاکیدی", "bronze"], ["رنگ طلایی لوکس", "gold"], ["پس‌زمینه", "cream"], ["پس‌زمینه کارت‌ها", "white"],
    ["متن بدنه", "inkSoft"], ["متن عنوان‌ها", "ink"], ["پس‌زمینه دکمه (عادی)", "sageDeep"], ["حالت هاور/کارت روشن", "sageMist"],
  ];
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }} className="mb-1">پیش‌تنظیم تم</p>
        <p style={{ fontSize: 12, color: p.inkSoft }} className="mb-4">یکی از پیش‌تنظیم‌ها را انتخاب کنید یا رنگ‌ها را پایین‌تر به‌صورت دستی تنظیم کنید.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.keys(THEME_PRESETS).map((name) => (
            <button key={name} onClick={() => applyPreset(name)} className="rounded-2xl p-3 border text-right" style={{ borderColor: theme.preset === name ? p.sageDeep : p.beige, background: theme.preset === name ? p.sageMist : p.white }}>
              <div className="flex gap-1 mb-2">{["cream", "sage", "ink", "bronze"].map((k) => <span key={k} className="w-4 h-4 rounded-full" style={{ background: THEME_PRESETS[name][k] }} />)}</div>
              <p style={{ fontSize: 12.5, color: p.ink }}>{name}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }} className="mb-4">رنگ‌های سفارشی</p>
        <div className="grid sm:grid-cols-2 gap-x-6">
          {colorFields.map(([label, key]) => <ColorField key={key} label={label} value={theme[key]} onChange={(v) => setTheme({ ...theme, [key]: v })} />)}
        </div>
        <p style={{ fontSize: 11, color: p.inkSoft }} className="mt-3">نشان‌ها (Badge) به‌طور خودکار از ترکیب رنگ اصلی و پس‌زمینه کارت‌ها ساخته می‌شوند.</p>
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <div className="flex items-center gap-2 mb-4"><Type size={17} style={{ color: p.sageDeep }} /><p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }}>تایپوگرافی</p></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><FieldLabel palette={p}>فونت عنوان‌ها</FieldLabel><SelectInput palette={p} value={theme.headingFont} onChange={(e) => setTheme({ ...theme, headingFont: e.target.value })}>{HEADING_FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</SelectInput></div>
          <div><FieldLabel palette={p}>فونت متن بدنه</FieldLabel><SelectInput palette={p} value={theme.bodyFont} onChange={(e) => setTheme({ ...theme, bodyFont: e.target.value })}>{BODY_FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</SelectInput></div>
          <div className="sm:col-span-2"><FieldLabel palette={p}>فونت لوگو (VIINA)</FieldLabel><SelectInput palette={p} value={theme.logoFont} onChange={(e) => setTheme({ ...theme, logoFont: e.target.value })}>{LOGO_FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</SelectInput></div>
        </div>
        <div className="mt-4"><FieldLabel palette={p}>اندازه فونت</FieldLabel>
          <div className="flex gap-2">
            {Object.keys(FONT_SCALE_OPTIONS).map((s) => (
              <button key={s} onClick={() => setTheme({ ...theme, fontScale: s })} className="rounded-full px-4 py-2 text-xs font-medium border" style={{ background: theme.fontScale === s ? p.sageDeep : p.white, color: theme.fontScale === s ? p.white : p.inkSoft, borderColor: theme.fontScale === s ? p.sageDeep : p.beige }}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <div className="flex items-center gap-2 mb-2"><Code2 size={17} style={{ color: p.sageDeep }} /><p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }}>افزودن کد سفارشی</p></div>
        <div className="mb-4">
          <FieldLabel palette={p}>CSS سفارشی (به‌صورت زنده روی فروشگاه اعمال می‌شود)</FieldLabel>
          <TextArea palette={p} rows={4} value={theme.customCSS} onChange={(e) => setTheme({ ...theme, customCSS: e.target.value })} placeholder=".my-class { color: red; }" dir="ltr" style={{ fontFamily: "monospace", fontSize: 12.5 }} />
        </div>
        <div>
          <FieldLabel palette={p}>اسکریپت JS سفارشی (مثلاً کد آنالیتیکس)</FieldLabel>
          <TextArea palette={p} rows={4} value={theme.customJS} onChange={(e) => setTheme({ ...theme, customJS: e.target.value })} placeholder="<!-- کد ردیابی خود را اینجا قرار دهید -->" dir="ltr" style={{ fontFamily: "monospace", fontSize: 12.5 }} />
          <p style={{ fontSize: 11, color: "#A5453A" }} className="mt-2">به دلایل امنیتی، اسکریپت‌های جاوااسکریپت در این پیش‌نمایش ذخیره می‌شوند اما اجرا نمی‌شوند.</p>
        </div>
      </div>
    </div>
  );
}

function LayoutSubTab({ layout, setLayout, homeSections, setHomeSections }) {
  const p = ADMIN_PALETTE;
  function moveSection(i, dir) {
    setHomeSections((prev) => { const next = [...prev]; const j = i + dir; if (j < 0 || j >= next.length) return prev; [next[i], next[j]] = [next[j], next[i]]; return next; });
  }
  function toggleSection(i) { setHomeSections((prev) => prev.map((s, idx) => idx === i ? { ...s, visible: !s.visible } : s)); }
  const visibilityToggles = [
    ["نمایش تعداد موجودی", "showStockQty"], ["نمایش نشان موجودی کم", "showLowStock"], ["نمایش امتیاز ستاره‌ای", "showRatings"],
    ["نمایش تعداد نظرات", "showReviewCount"], ["نمایش آیکون علاقه‌مندی (Wishlist)", "showWishlist"], ["نمایش نشان تخفیف", "showDiscountBadge"], ["نمایش دکمه نمای سریع", "showQuickView"],
  ];
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }} className="mb-4">چیدمان شبکه محصولات</p>
        <div className="grid sm:grid-cols-2 gap-4 mb-2">
          <div><FieldLabel palette={p}>تعداد ستون در دسکتاپ</FieldLabel>
            <div className="flex gap-2">{[3, 4, 5].map((n) => <button key={n} onClick={() => setLayout({ ...layout, desktopCols: n })} className="flex-1 rounded-xl py-2 text-sm font-medium border" style={{ background: layout.desktopCols === n ? p.sageDeep : p.white, color: layout.desktopCols === n ? p.white : p.inkSoft, borderColor: layout.desktopCols === n ? p.sageDeep : p.beige }}>{n}</button>)}</div>
          </div>
          <div><FieldLabel palette={p}>تعداد ستون در موبایل</FieldLabel>
            <div className="flex gap-2">{[1, 2].map((n) => <button key={n} onClick={() => setLayout({ ...layout, mobileCols: n })} className="flex-1 rounded-xl py-2 text-sm font-medium border" style={{ background: layout.mobileCols === n ? p.sageDeep : p.white, color: layout.mobileCols === n ? p.white : p.inkSoft, borderColor: layout.mobileCols === n ? p.sageDeep : p.beige }}>{n}</button>)}</div>
          </div>
        </div>
        <div><FieldLabel palette={p}>تعداد محصولات نمایش‌داده‌شده (پیش از «نمایش بیشتر»)</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {ITEMS_PER_PAGE_OPTIONS.map((n) => <button key={n} onClick={() => setLayout({ ...layout, itemsPerPage: n })} className="rounded-full px-4 py-2 text-xs font-medium border" style={{ background: layout.itemsPerPage === n ? p.sageDeep : p.white, color: layout.itemsPerPage === n ? p.white : p.inkSoft, borderColor: layout.itemsPerPage === n ? p.sageDeep : p.beige }}>{n}</button>)}
          </div>
        </div>
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }} className="mb-2">نمایش عناصر کارت محصول</p>
        <div className="divide-y" style={{ borderColor: p.creamDeep }}>
          {visibilityToggles.map(([label, key]) => <Toggle key={key} palette={p} label={label} on={layout[key]} onChange={(v) => setLayout({ ...layout, [key]: v })} />)}
        </div>
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }} className="mb-1">ترتیب و نمایش بخش‌های صفحه اصلی</p>
        <p style={{ fontSize: 12, color: p.inkSoft }} className="mb-4">با دکمه‌های بالا/پایین ترتیب بخش‌ها را تغییر دهید؛ با آیکون چشم، نمایش هر بخش را روشن یا خاموش کنید.</p>
        <div className="flex flex-col gap-2">
          {homeSections.map((s, i) => (
            <div key={s.key} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: p.creamDeep, opacity: s.visible ? 1 : 0.5 }}>
              <GripVertical size={15} style={{ color: p.inkSoft }} />
              <span className="flex-1 text-sm" style={{ color: p.ink }}>{s.label}</span>
              <button onClick={() => moveSection(i, -1)} disabled={i === 0} aria-label="جابه‌جایی به بالا" style={{ opacity: i === 0 ? 0.3 : 1 }}><ChevronUp size={16} color={p.ink} /></button>
              <button onClick={() => moveSection(i, 1)} disabled={i === homeSections.length - 1} aria-label="جابه‌جایی به پایین" style={{ opacity: i === homeSections.length - 1 ? 0.3 : 1 }}><ChevronDown size={16} color={p.ink} /></button>
              <button onClick={() => toggleSection(i)} aria-label={s.visible ? "پنهان کردن بخش" : "نمایش بخش"}><Eye size={16} color={s.visible ? p.sageDeep : p.inkSoft} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NavLinkListEditor({ links, setLinks }) {
  const p = ADMIN_PALETTE;
  function update(i, key, value) { setLinks((prev) => prev.map((l, idx) => idx === i ? { ...l, [key]: value } : l)); }
  function remove(i) { setLinks((prev) => prev.filter((_, idx) => idx !== i)); }
  function add() { setLinks((prev) => [...prev, { label: "لینک جدید", href: "#" }]); }
  return (
    <div className="flex flex-col gap-2">
      {links.map((l, i) => (
        <div key={i} className="flex items-center gap-2">
          <TextInput palette={p} value={l.label} onChange={(e) => update(i, "label", e.target.value)} className="!py-2" placeholder="عنوان" />
          <TextInput palette={p} value={l.href} onChange={(e) => update(i, "href", e.target.value)} className="!py-2" placeholder="#لینک" dir="ltr" />
          <button onClick={() => remove(i)} aria-label="حذف لینک" className="shrink-0"><Trash2 size={15} style={{ color: "#A5453A" }} /></button>
        </div>
      ))}
      <button onClick={add} className="self-start inline-flex items-center gap-1.5 text-xs font-medium mt-1" style={{ color: p.sageDeep }}><Plus size={13} /> افزودن لینک</button>
    </div>
  );
}

function HeaderSubTab({ header, setHeader, announcement, setAnnouncement }) {
  const p = ADMIN_PALETTE;
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <div className="flex items-center gap-2 mb-4"><PanelTop size={17} style={{ color: p.sageDeep }} /><p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }}>سبک هدر</p></div>
        <div className="flex flex-wrap gap-2 mb-5">
          {HEADER_LAYOUT_OPTIONS.map((s) => <button key={s} onClick={() => setHeader({ ...header, layoutStyle: s })} className="rounded-full px-4 py-2 text-xs font-medium border" style={{ background: header.layoutStyle === s ? p.sageDeep : p.white, color: header.layoutStyle === s ? p.white : p.inkSoft, borderColor: header.layoutStyle === s ? p.sageDeep : p.beige }}>{s}</button>)}
        </div>
        <div className="divide-y" style={{ borderColor: p.creamDeep }}>
          <Toggle palette={p} label="نمایش نوار جستجو" on={header.showSearch} onChange={(v) => setHeader({ ...header, showSearch: v })} />
          <Toggle palette={p} label="نمایش آیکون حساب کاربری" on={header.showAccount} onChange={(v) => setHeader({ ...header, showAccount: v })} />
          <Toggle palette={p} label="نمایش آیکون سبد خرید" on={header.showCart} onChange={(v) => setHeader({ ...header, showCart: v })} />
        </div>
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <div className="flex items-center gap-2 mb-4"><LinkIcon size={17} style={{ color: p.sageDeep }} /><p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }}>منوی اصلی ناوبری</p></div>
        <NavLinkListEditor links={header.navLinks} setLinks={(fn) => setHeader({ ...header, navLinks: typeof fn === "function" ? fn(header.navLinks) : fn })} />
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <div className="flex items-center gap-2 mb-2"><Megaphone size={17} style={{ color: p.sageDeep }} /><p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }}>نوار اعلان بالای سایت</p></div>
        <Toggle palette={p} label="فعال‌سازی نوار اعلان" on={announcement.enabled} onChange={(v) => setAnnouncement({ ...announcement, enabled: v })} />
        <div className="mt-2"><FieldLabel palette={p}>متن اعلان</FieldLabel><TextInput palette={p} value={announcement.text} onChange={(e) => setAnnouncement({ ...announcement, text: e.target.value })} placeholder="مثلاً: ۱۰٪ تخفیف با کد WELCOME10" /></div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <ColorField label="پس‌زمینه" value={announcement.bg} onChange={(v) => setAnnouncement({ ...announcement, bg: v })} />
          <ColorField label="رنگ متن" value={announcement.color} onChange={(v) => setAnnouncement({ ...announcement, color: v })} />
          <div><FieldLabel palette={p}>لینک مقصد</FieldLabel><TextInput palette={p} value={announcement.link} onChange={(e) => setAnnouncement({ ...announcement, link: e.target.value })} dir="ltr" /></div>
        </div>
      </div>
    </div>
  );
}

function FooterSubTab({ footer, setFooter }) {
  const p = ADMIN_PALETTE;
  const socialKeys = [["instagram", "اینستاگرام"], ["tiktok", "تیک‌تاک"], ["telegram", "تلگرام"], ["whatsapp", "واتساپ"], ["youtube", "یوتیوب"], ["pinterest", "پینترست"]];
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <div className="flex items-center gap-2 mb-4"><PanelBottom size={17} style={{ color: p.sageDeep }} /><p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }}>ستون ۱ — برند</p></div>
        <div className="flex flex-col gap-3">
          <div><FieldLabel palette={p}>عنوان</FieldLabel><TextInput palette={p} value={footer.col1Title} onChange={(e) => setFooter({ ...footer, col1Title: e.target.value })} /></div>
          <div><FieldLabel palette={p}>متن</FieldLabel><TextArea palette={p} rows={2} value={footer.col1Text} onChange={(e) => setFooter({ ...footer, col1Text: e.target.value })} /></div>
        </div>
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }} className="mb-3">ستون ۲ — فروشگاه</p>
        <TextInput palette={p} value={footer.col2Title} onChange={(e) => setFooter({ ...footer, col2Title: e.target.value })} className="mb-3" />
        <NavLinkListEditor links={footer.col2Links} setLinks={(fn) => setFooter({ ...footer, col2Links: typeof fn === "function" ? fn(footer.col2Links) : fn })} />
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }} className="mb-3">ستون ۳ — خدمات مشتریان و صفحات قانونی</p>
        <TextInput palette={p} value={footer.col3Title} onChange={(e) => setFooter({ ...footer, col3Title: e.target.value })} className="mb-3" />
        <NavLinkListEditor links={footer.col3Links} setLinks={(fn) => setFooter({ ...footer, col3Links: typeof fn === "function" ? fn(footer.col3Links) : fn })} />
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }} className="mb-3">ستون ۴ — اطلاعات تماس</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><FieldLabel palette={p}>ایمیل</FieldLabel><TextInput palette={p} value={footer.contactEmail} onChange={(e) => setFooter({ ...footer, contactEmail: e.target.value })} dir="ltr" /></div>
          <div><FieldLabel palette={p}>تلفن</FieldLabel><TextInput palette={p} value={footer.contactPhone} onChange={(e) => setFooter({ ...footer, contactPhone: e.target.value })} dir="ltr" /></div>
          <div className="sm:col-span-2"><FieldLabel palette={p}>آدرس</FieldLabel><TextInput palette={p} value={footer.contactAddress} onChange={(e) => setFooter({ ...footer, contactAddress: e.target.value })} /></div>
        </div>
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }} className="mb-3">شبکه‌های اجتماعی</p>
        <div className="flex flex-col gap-2">
          {socialKeys.map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <button onClick={() => setFooter({ ...footer, socialEnabled: { ...footer.socialEnabled, [key]: !footer.socialEnabled[key] } })} className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: footer.socialEnabled[key] ? p.sageDeep : p.creamDeep }}>
                {footer.socialEnabled[key] ? <Check size={14} color={p.white} /> : <X size={14} color={p.inkSoft} />}
              </button>
              <span style={{ fontSize: 13, color: p.ink, width: 76 }}>{label}</span>
              <TextInput palette={p} value={footer.social[key]} onChange={(e) => setFooter({ ...footer, social: { ...footer.social, [key]: e.target.value } })} className="!py-2" placeholder="آدرس لینک" dir="ltr" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }} className="mb-3">کپی‌رایت و نشان‌های پرداخت</p>
        <div><FieldLabel palette={p}>متن کپی‌رایت</FieldLabel><TextInput palette={p} value={footer.copyright} onChange={(e) => setFooter({ ...footer, copyright: e.target.value })} /></div>
        <div className="mt-3"><Toggle palette={p} label="نمایش نشان‌های درگاه پرداخت (زرین‌پال، ویزا، اپل‌پی)" on={footer.showPaymentBadges} onChange={(v) => setFooter({ ...footer, showPaymentBadges: v })} /></div>
      </div>
    </div>
  );
}

function CustomizerTab({ theme, setTheme, layout, setLayout, homeSections, setHomeSections, header, setHeader, announcement, setAnnouncement, footer, setFooter }) {
  const p = ADMIN_PALETTE;
  const [sub, setSub] = useState("branding");
  const subTabs = [
    { key: "branding", label: "ظاهر و رنگ‌ها", icon: Palette },
    { key: "layout", label: "چیدمان و نمایش", icon: SlidersHorizontal },
    { key: "header", label: "هدر و ناوبری", icon: PanelTop },
    { key: "footer", label: "فوتر", icon: PanelBottom },
  ];
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        {subTabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setSub(t.key)} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium border" style={{ background: sub === t.key ? p.sageDeep : p.white, color: sub === t.key ? p.white : p.inkSoft, borderColor: sub === t.key ? p.sageDeep : p.beige }}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>
      {sub === "branding" && <BrandingSubTab theme={theme} setTheme={setTheme} />}
      {sub === "layout" && <LayoutSubTab layout={layout} setLayout={setLayout} homeSections={homeSections} setHomeSections={setHomeSections} />}
      {sub === "header" && <HeaderSubTab header={header} setHeader={setHeader} announcement={announcement} setAnnouncement={setAnnouncement} />}
      {sub === "footer" && <FooterSubTab footer={footer} setFooter={setFooter} />}
    </div>
  );
}

/* ================================================================
   TAB: Theme & Typography — dedicated, site-wide controls for the
   global font-size preset and primary/accent colors, plus default
   typography & color rules newly created custom pages / blog posts
   inherit (each page can still override these individually from
   its own edit screen).
================================================================= */
function TypographyTab({ theme, setTheme }) {
  const p = ADMIN_PALETTE;
  function setPageDefault(key, value) { setTheme({ ...theme, pageDefaults: { ...(theme.pageDefaults || {}), [key]: value } }); }
  const pd = theme.pageDefaults || {};
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <div className="flex items-center gap-2 mb-1"><Type size={17} style={{ color: p.sageDeep }} /><p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }}>اندازه فونت کلی سایت</p></div>
        <p style={{ fontSize: 12, color: p.inkSoft }} className="mb-4">این تنظیم روی کل فروشگاه — از جمله محصولات و صفحات سفارشی — به‌صورت زنده اعمال می‌شود.</p>
        <div className="flex flex-wrap gap-2">
          {Object.keys(FONT_SCALE_OPTIONS).map((s) => (
            <button key={s} onClick={() => setTheme({ ...theme, fontScale: s })} className="rounded-full px-5 py-2.5 text-sm font-medium border" style={{ background: theme.fontScale === s ? p.sageDeep : p.white, color: theme.fontScale === s ? p.white : p.inkSoft, borderColor: theme.fontScale === s ? p.sageDeep : p.beige }}>{s}</button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <div className="flex items-center gap-2 mb-1"><Palette size={17} style={{ color: p.sageDeep }} /><p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }}>رنگ پس‌زمینه اصلی و رنگ‌های تاکیدی</p></div>
        <p style={{ fontSize: 12, color: p.inkSoft }} className="mb-3">این رنگ‌ها زبان بصری اصلی کل سایت را می‌سازند. برای دسترسی به تمام فیلدهای رنگی، به تب «شخصی‌سازی سایت» بروید.</p>
        <div className="grid sm:grid-cols-2 gap-x-6">
          <ColorField label="پس‌زمینه اصلی سایت" value={theme.cream} onChange={(v) => setTheme({ ...theme, cream: v })} />
          <ColorField label="رنگ متن اصلی" value={theme.ink} onChange={(v) => setTheme({ ...theme, ink: v })} />
          <ColorField label="رنگ تاکیدی اصلی (سبز)" value={theme.sageDeep} onChange={(v) => setTheme({ ...theme, sageDeep: v })} />
          <ColorField label="رنگ تاکیدی ثانویه (طلایی)" value={theme.gold} onChange={(v) => setTheme({ ...theme, gold: v })} />
        </div>
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <div className="flex items-center gap-2 mb-1"><FileText size={17} style={{ color: p.sageDeep }} /><p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }}>ظاهر پیش‌فرض صفحات سفارشی و بلاگ</p></div>
        <p style={{ fontSize: 12, color: p.inkSoft }} className="mb-4">این تنظیمات پیش‌فرضِ هر صفحه‌ای است که از تب «صفحات و مسیرها» ساخته می‌شود؛ هر صفحه در فرم ویرایش خودش می‌تواند این مقادیر را جداگانه بازنویسی کند.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel palette={p}>اندازه فونت پیش‌فرض</FieldLabel>
            <SelectInput palette={p} value={pd.fontSize || "متوسط"} onChange={(e) => setPageDefault("fontSize", e.target.value)}>
              {Object.keys(FONT_SCALE_OPTIONS).map((k) => <option key={k} value={k}>{k}</option>)}
            </SelectInput>
          </div>
          <div>
            <FieldLabel palette={p}>چینش متن پیش‌فرض</FieldLabel>
            <SelectInput palette={p} value={pd.textAlign || "right"} onChange={(e) => setPageDefault("textAlign", e.target.value)}>
              {TEXT_ALIGN_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
            </SelectInput>
          </div>
          <div>
            <FieldLabel palette={p}>رنگ پس‌زمینه پیش‌فرض</FieldLabel>
            <div className="flex items-center gap-2">
              <input type="color" value={pd.backgroundColor || "#FBF7F1"} onChange={(e) => setPageDefault("backgroundColor", e.target.value)} className="w-10 h-10 rounded-lg border p-0.5 cursor-pointer" style={{ borderColor: p.beige }} />
              <TextInput palette={p} value={pd.backgroundColor || ""} onChange={(e) => setPageDefault("backgroundColor", e.target.value)} dir="ltr" placeholder="شفاف (پیش‌فرض تم)" className="flex-1" />
            </div>
          </div>
          <div>
            <FieldLabel palette={p}>رنگ متن پیش‌فرض</FieldLabel>
            <div className="flex items-center gap-2">
              <input type="color" value={pd.textColor || "#5C554B"} onChange={(e) => setPageDefault("textColor", e.target.value)} className="w-10 h-10 rounded-lg border p-0.5 cursor-pointer" style={{ borderColor: p.beige }} />
              <TextInput palette={p} value={pd.textColor || ""} onChange={(e) => setPageDefault("textColor", e.target.value)} dir="ltr" placeholder="پیش‌فرض تم" className="flex-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   TAB: Settings — general info, currency & pricing, payments,
   shipping & tax, notifications, auth links, admin users & roles
================================================================= */
function SettingsTab({ products, setProducts, currencySettings, setCurrencySettings, authLinks, setAuthLinks, users, setUsers,
  paymentMethods, setPaymentMethods, zarinpalId, setZarinpalId, shipping, setShipping, freeShipThreshold, setFreeShipThreshold,
  taxRate, setTaxRate, templates, setTemplates, authSettings, setAuthSettings, quizSettings, setQuizSettings, rewardsSettings, setRewardsSettings }) {
  const p = ADMIN_PALETTE;
  const [saved, setSaved] = useState(false);
  const [multiplierPct, setMultiplierPct] = useState("10");
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userDraft, setUserDraft] = useState({ name: "", email: "", role: "ویرایشگر" });
  const [pwForm, setPwForm] = useState({ newPassword: "", confirmPassword: "" });
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);

  async function changeAdminPassword(e) {
    e.preventDefault();
    setPwSaved(false);
    if (pwForm.newPassword.length < 6) { setPwError("رمز عبور جدید باید حداقل ۶ کاراکتر باشد."); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError("رمز عبور جدید و تکرار آن یکسان نیستند."); return; }
    setPwError("");
    setPwBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.newPassword });
      if (error) throw error;
      setPwForm({ newPassword: "", confirmPassword: "" });
      setPwSaved(true);
    } catch (err) {
      setPwError(err.message || "به‌روزرسانی رمز عبور با خطا مواجه شد.");
    } finally {
      setPwBusy(false);
    }
  }

  function updateShippingRate(i, rate) { setShipping((prev) => prev.map((r, idx) => idx === i ? { ...r, rate: Number(rate) || 0 } : r)); }
  function addUser() {
    if (!userDraft.name || !userDraft.email) return;
    setUsers((prev) => [...prev, { ...userDraft, status: "فعال" }]);
    setUserDraft({ name: "", email: "", role: "ویرایشگر" });
    setUserModalOpen(false);
  }
  function removeUser(email) { setUsers((prev) => prev.filter((u) => u.email !== email)); }
  function applyMultiplier() {
    const pct = Number(multiplierPct) || 0;
    if (!window.confirm(`قیمت همه محصولات (${products.length} مورد) به میزان ${pct}٪ تغییر کند؟`)) return;
    setProducts((prev) => prev.map((pr) => ({
      ...pr,
      price: Math.round(pr.price * (1 + pct / 100)),
      salePrice: pr.salePrice ? Math.round(pr.salePrice * (1 + pct / 100)) : pr.salePrice,
    })));
  }

  return (
    <div className="max-w-3xl flex flex-col gap-6">
      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }} className="mb-4">تنظیمات عمومی</p>
        <form onSubmit={(e) => { e.preventDefault(); setSaved(true); }} className="grid sm:grid-cols-2 gap-4">
          <div><FieldLabel palette={p}>نام فروشگاه</FieldLabel><TextInput palette={p} defaultValue="VIINA Skincare" /></div>
          <div><FieldLabel palette={p}>ایمیل پشتیبانی</FieldLabel><TextInput palette={p} defaultValue="hello@viina.co" type="email" dir="ltr" /></div>
          <div><FieldLabel palette={p}>شماره تماس</FieldLabel><TextInput palette={p} defaultValue="+98 21 9100 0000" dir="ltr" /></div>
          <div className="sm:col-span-2"><FieldLabel palette={p}>آدرس فروشگاه</FieldLabel><TextInput palette={p} defaultValue="تهران، ایران" /></div>
          <button type="submit" className="sm:col-span-2 self-start rounded-full px-6 py-2.5 text-sm font-medium" style={{ background: p.sageDeep, color: p.white }}>{saved ? "ذخیره شد ✓" : "ذخیره تغییرات"}</button>
        </form>
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <div className="flex items-center gap-2 mb-4"><Coins size={17} style={{ color: p.sageDeep }} /><p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }}>ارز و قیمت‌گذاری</p></div>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div><FieldLabel palette={p}>ارز پایه فروشگاه</FieldLabel>
            <SelectInput palette={p} value={currencySettings.currency} onChange={(e) => setCurrencySettings({ ...currencySettings, currency: e.target.value, currencyLabel: e.target.value === "usd" ? "$" : currencySettings.currencyLabel })}>
              <option value="toman">تومان ایران (تومان)</option><option value="usd">دلار آمریکا ($)</option>
            </SelectInput>
          </div>
          {currencySettings.currency === "toman" && (
            <div><FieldLabel palette={p}>برچسب نمایشی تومان</FieldLabel>
              <SelectInput palette={p} value={currencySettings.currencyLabel} onChange={(e) => setCurrencySettings({ ...currencySettings, currencyLabel: e.target.value })}>
                {["تومان", "تومان ایران", "Toman"].map((l) => <option key={l}>{l}</option>)}
              </SelectInput>
            </div>
          )}
        </div>
        <div className="mb-4">
          <FieldLabel palette={p}>شیوه نمایش اعداد</FieldLabel>
          <div className="flex gap-2">
            <button onClick={() => setCurrencySettings({ ...currencySettings, digitStyle: "fa" })} className="flex-1 rounded-xl py-2.5 text-sm border" style={{ background: currencySettings.digitStyle === "fa" ? p.sageDeep : p.white, color: currencySettings.digitStyle === "fa" ? p.white : p.ink, borderColor: currencySettings.digitStyle === "fa" ? p.sageDeep : p.beige }}>
              ارقام فارسی — مثال: {toPersianDigits("850,000")} تومان
            </button>
            <button onClick={() => setCurrencySettings({ ...currencySettings, digitStyle: "en" })} className="flex-1 rounded-xl py-2.5 text-sm border" style={{ background: currencySettings.digitStyle === "en" ? p.sageDeep : p.white, color: currencySettings.digitStyle === "en" ? p.white : p.ink, borderColor: currencySettings.digitStyle === "en" ? p.sageDeep : p.beige }}>
              ارقام انگلیسی — مثال: 850,000 تومان
            </button>
          </div>
          <p style={{ fontSize: 11, color: p.inkSoft }} className="mt-2">جداکننده هزارگان (کاما) در هر دو حالت به‌صورت خودکار اعمال می‌شود.</p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: p.creamDeep }}>
          <p style={{ fontSize: 12, color: p.sageDeep, fontWeight: 600 }} className="mb-2">ابزار تغییر دسته‌جمعی قیمت‌ها</p>
          <p style={{ fontSize: 11.5, color: p.inkSoft }} className="mb-3">درصد افزایش یا کاهش قیمت همه محصولات (برای مثال به‌روزرسانی نرخ ارز). عدد منفی برای کاهش قیمت استفاده کنید.</p>
          <div className="flex items-center gap-2">
            <TextInput palette={p} type="number" value={multiplierPct} onChange={(e) => setMultiplierPct(e.target.value)} className="!w-28" />
            <span style={{ fontSize: 13, color: p.ink }}>٪</span>
            <button onClick={applyMultiplier} disabled={products.length === 0} className="rounded-full px-4 py-2 text-xs font-medium" style={{ background: products.length === 0 ? p.beige : p.sageDeep, color: products.length === 0 ? p.inkSoft : p.white }}>اعمال روی همه محصولات</button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <div className="flex items-center gap-2 mb-2"><CreditCard size={17} style={{ color: p.sageDeep }} /><p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }}>درگاه‌های پرداخت</p></div>
        <div className="divide-y mb-4" style={{ borderColor: p.creamDeep }}>
          {Object.keys(paymentMethods).map((m) => <Toggle key={m} palette={p} label={m} on={paymentMethods[m]} onChange={(v) => setPaymentMethods((prev) => ({ ...prev, [m]: v }))} />)}
        </div>
        <div><FieldLabel palette={p}>شناسه پذیرنده زرین‌پال (Merchant ID)</FieldLabel><TextInput palette={p} value={zarinpalId} onChange={(e) => setZarinpalId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" dir="ltr" /></div>
        <p style={{ fontSize: 11, color: "#A5453A" }} className="mt-2">اتصال واقعی به درگاه‌های بانکی ایرانی و تبدیل خودکار تومان به ریال در این پیش‌نمایش فعال نیست؛ این فیلد فقط برای ذخیره تنظیمات است.</p>
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <div className="flex items-center gap-2 mb-4"><Truck size={17} style={{ color: p.sageDeep }} /><p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }}>ارسال و مالیات</p></div>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div><FieldLabel palette={p}>آستانه ارسال رایگان (تومان)</FieldLabel><TextInput palette={p} type="number" step="1000" value={freeShipThreshold} onChange={(e) => setFreeShipThreshold(e.target.value)} /></div>
          <div><FieldLabel palette={p}>درصد مالیات</FieldLabel><TextInput palette={p} type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} /></div>
        </div>
        <FieldLabel palette={p}>نرخ ارسال منطقه‌ای (تومان)</FieldLabel>
        <div className="flex flex-col gap-2">
          {shipping.map((r, i) => (
            <div key={r.region} className="flex items-center gap-3">
              <span className="flex-1 text-sm" style={{ color: p.ink }}>{r.region}</span>
              <input type="number" value={r.rate} onChange={(e) => updateShippingRate(i, e.target.value)} className="w-32 rounded-xl px-3 py-1.5 text-sm border outline-none" style={{ borderColor: p.beige, color: p.ink }} />
              <span style={{ fontSize: 12, color: p.inkSoft }}>تومان</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <div className="flex items-center gap-2 mb-2"><Sparkles size={17} style={{ color: p.sageDeep }} /><p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }}>مشاور هوشمند پوست (Skin Quiz)</p></div>
        <p style={{ fontSize: 12.5, color: p.inkSoft }}>سوالات، گزینه‌ها و روتین‌های پیشنهادی این ماژول اکنون در تب اختصاصی «مشاور هوشمند پوست» در نوار کناری مدیریت می‌شود.</p>
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <div className="flex items-center gap-2 mb-4"><Gift size={17} style={{ color: p.sageDeep }} /><p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }}>باشگاه امتیاز (GLOW Club)</p></div>
        <Toggle palette={p} label="نمایش امتیاز وفاداری روی محصولات و تسویه‌حساب" on={rewardsSettings.enabled} onChange={(v) => setRewardsSettings({ ...rewardsSettings, enabled: v })} />
        <div className="grid sm:grid-cols-2 gap-4 mt-2">
          <div><FieldLabel palette={p}>نام باشگاه</FieldLabel><TextInput palette={p} value={rewardsSettings.clubName} onChange={(e) => setRewardsSettings({ ...rewardsSettings, clubName: e.target.value })} /></div>
          <div><FieldLabel palette={p}>درصد اعتبار بازگشتی از مبلغ خرید</FieldLabel><TextInput palette={p} type="number" min="0" max="100" value={rewardsSettings.earnRatePct} onChange={(e) => setRewardsSettings({ ...rewardsSettings, earnRatePct: Number(e.target.value) || 0 })} /></div>
        </div>
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <div className="flex items-center gap-2 mb-2"><Mail size={17} style={{ color: p.sageDeep }} /><p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }}>قالب‌های اطلاع‌رسانی خودکار</p></div>
        <div className="flex flex-col gap-1 divide-y" style={{ borderColor: p.creamDeep }}>
          {templates.map((t, i) => (
            <div key={t.name} className="flex items-center justify-between py-3">
              <div><p style={{ fontSize: 14, color: p.ink }}>{t.name}</p><p style={{ fontSize: 11.5, color: p.inkSoft }}>{t.subject}</p></div>
              <div className="flex items-center gap-3">
                <button className="text-xs font-medium underline underline-offset-4" style={{ color: p.sageDeep }}>ویرایش</button>
                <button onClick={() => setTemplates((prev) => prev.map((x, idx) => idx === i ? { ...x, enabled: !x.enabled } : x))} className="rounded-full relative" style={{ background: t.enabled ? p.sageDeep : p.beige, width: 40, height: 22 }}>
                  <span className="absolute top-0.5 rounded-full" style={{ width: 18, height: 18, background: p.white, right: t.enabled ? 20 : 2 }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <div className="flex items-center gap-2 mb-4"><User size={17} style={{ color: p.sageDeep }} /><p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }}>تنظیمات صفحه ورود و ثبت‌نام</p></div>
        <div className="divide-y mb-4" style={{ borderColor: p.creamDeep }}>
          <Toggle palette={p} label="نمایش مسکات‌های تعاملی (Interactive Mascot Animation)" on={authSettings.mascotEnabled} onChange={(v) => setAuthSettings({ ...authSettings, mascotEnabled: v })} />
          <Toggle palette={p} label="نمایش دکمه ورود با گوگل" on={authSettings.showGoogleButton} onChange={(v) => setAuthSettings({ ...authSettings, showGoogleButton: v })} />
        </div>
        <div className="mb-4">
          <FieldLabel palette={p}>سبک پس‌زمینه</FieldLabel>
          <div className="flex gap-2">
            <button type="button" onClick={() => setAuthSettings({ ...authSettings, backgroundStyle: "aura" })} className="flex-1 rounded-xl py-2.5 text-sm border" style={{ background: authSettings.backgroundStyle === "aura" ? p.sageDeep : p.white, color: authSettings.backgroundStyle === "aura" ? p.white : p.ink, borderColor: authSettings.backgroundStyle === "aura" ? p.sageDeep : p.beige }}>هاله پاستلی درخشان</button>
            <button type="button" onClick={() => setAuthSettings({ ...authSettings, backgroundStyle: "minimal" })} className="flex-1 rounded-xl py-2.5 text-sm border" style={{ background: authSettings.backgroundStyle === "minimal" ? p.sageDeep : p.white, color: authSettings.backgroundStyle === "minimal" ? p.white : p.ink, borderColor: authSettings.backgroundStyle === "minimal" ? p.sageDeep : p.beige }}>شیشه‌ای مینیمال</button>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><FieldLabel palette={p}>عنوان صفحه ورود</FieldLabel><TextInput palette={p} value={authSettings.loginHeading} onChange={(e) => setAuthSettings({ ...authSettings, loginHeading: e.target.value })} /></div>
          <div><FieldLabel palette={p}>زیرعنوان صفحه ورود</FieldLabel><TextInput palette={p} value={authSettings.loginSubtitle} onChange={(e) => setAuthSettings({ ...authSettings, loginSubtitle: e.target.value })} /></div>
          <div><FieldLabel palette={p}>عنوان صفحه ثبت‌نام</FieldLabel><TextInput palette={p} value={authSettings.signupHeading} onChange={(e) => setAuthSettings({ ...authSettings, signupHeading: e.target.value })} /></div>
          <div><FieldLabel palette={p}>زیرعنوان صفحه ثبت‌نام</FieldLabel><TextInput palette={p} value={authSettings.signupSubtitle} onChange={(e) => setAuthSettings({ ...authSettings, signupSubtitle: e.target.value })} /></div>
        </div>
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <div className="flex items-center gap-2 mb-4"><LinkIcon size={17} style={{ color: p.sageDeep }} /><p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }}>لینک‌های ورود و ثبت‌نام</p></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><FieldLabel palette={p}>لینک ورود (Sign In)</FieldLabel><TextInput palette={p} value={authLinks.signIn} onChange={(e) => setAuthLinks({ ...authLinks, signIn: e.target.value })} dir="ltr" /></div>
          <div><FieldLabel palette={p}>لینک ثبت‌نام (Sign Up)</FieldLabel><TextInput palette={p} value={authLinks.signUp} onChange={(e) => setAuthLinks({ ...authLinks, signUp: e.target.value })} dir="ltr" /></div>
          <div><FieldLabel palette={p}>لینک فراموشی رمز عبور</FieldLabel><TextInput palette={p} value={authLinks.forgotPassword} onChange={(e) => setAuthLinks({ ...authLinks, forgotPassword: e.target.value })} dir="ltr" /></div>
          <div><FieldLabel palette={p}>لینک داشبورد حساب کاربری</FieldLabel><TextInput palette={p} value={authLinks.accountDashboard} onChange={(e) => setAuthLinks({ ...authLinks, accountDashboard: e.target.value })} dir="ltr" /></div>
        </div>
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <div className="flex items-center gap-2 mb-2"><Lock size={17} style={{ color: p.sageDeep }} /><p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }}>تغییر رمز عبور مدیریت</p></div>
        <p style={{ fontSize: 12, color: p.inkSoft }} className="mb-4">ورود به پنل مدیریت اکنون از طریق Supabase Auth انجام می‌شود. رمز عبور کاربر مدیر را از همین‌جا تغییر دهید — ایمیل ورود ثابت می‌ماند.</p>
        <form onSubmit={changeAdminPassword} className="flex flex-col gap-3.5 max-w-sm">
          <div><FieldLabel palette={p}>رمز عبور جدید</FieldLabel><TextInput palette={p} type="password" required minLength={6} value={pwForm.newPassword} onChange={(e) => { setPwForm({ ...pwForm, newPassword: e.target.value }); setPwError(""); setPwSaved(false); }} dir="ltr" /></div>
          <div><FieldLabel palette={p}>تکرار رمز عبور جدید</FieldLabel><TextInput palette={p} type="password" required minLength={6} value={pwForm.confirmPassword} onChange={(e) => { setPwForm({ ...pwForm, confirmPassword: e.target.value }); setPwError(""); setPwSaved(false); }} dir="ltr" /></div>
          {pwError && <p style={{ fontSize: 12, color: "#A5453A" }}>{pwError}</p>}
          <button type="submit" disabled={pwBusy} className="self-start rounded-full px-6 py-2.5 text-sm font-medium disabled:opacity-60" style={{ background: p.sageDeep, color: p.white }}>{pwBusy ? "در حال ذخیره…" : pwSaved ? "ذخیره شد ✓" : "به‌روزرسانی رمز عبور"}</button>
        </form>
      </div>

      <div className="rounded-3xl p-6" style={{ background: p.white, border: `1px solid ${p.beige}` }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><Shield size={17} style={{ color: p.sageDeep }} /><p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 17, color: p.ink }}>مدیریت کاربران و نقش‌ها</p></div>
          <button onClick={() => setUserModalOpen(true)} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium" style={{ background: p.sageDeep, color: p.white }}><UserPlus size={13} /> افزودن کاربر</button>
        </div>
        <p style={{ fontSize: 11.5, color: p.inkSoft }} className="mb-4">دسترسی واقعی به پنل مدیریت از طریق Supabase Auth کنترل می‌شود (Authentication → Add user در داشبورد Supabase). فهرست زیر صرفاً یادداشت داخلی نقش‌های تیم است.</p>
        {users.length === 0 ? <EmptyState compact icon={Shield} title="هنوز کاربر ادمین دیگری اضافه نشده است" palette={p} /> : (
          <div className="flex flex-col gap-3">
            {users.map((u) => (
              <div key={u.email} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: p.sageMist }}><User size={14} style={{ color: p.sageDeep }} /></div>
                <div className="flex-1 min-w-0"><p style={{ fontSize: 14, color: p.ink }} className="truncate">{u.name}</p><p style={{ fontSize: 11.5, color: p.inkSoft }} dir="ltr" className="text-right truncate">{u.email}</p></div>
                <Badge label={u.role} bg={p.creamDeep} fg={p.inkSoft} />
                <Badge label={u.status} bg={u.status === "فعال" ? p.sageMist : "#F4DCD6"} fg={u.status === "فعال" ? p.sageDeep : "#A5453A"} />
                <button onClick={() => removeUser(u.email)} aria-label="حذف کاربر"><Trash2 size={15} style={{ color: "#A5453A" }} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {userModalOpen && (
        <ModalShell onClose={() => setUserModalOpen(false)} title="افزودن کاربر ادمین" palette={p}>
          <div className="flex flex-col gap-4">
            <div><FieldLabel palette={p}>نام</FieldLabel><TextInput palette={p} value={userDraft.name} onChange={(e) => setUserDraft({ ...userDraft, name: e.target.value })} /></div>
            <div><FieldLabel palette={p}>ایمیل</FieldLabel><TextInput palette={p} type="email" value={userDraft.email} onChange={(e) => setUserDraft({ ...userDraft, email: e.target.value })} dir="ltr" /></div>
            <div><FieldLabel palette={p}>نقش</FieldLabel><SelectInput palette={p} value={userDraft.role} onChange={(e) => setUserDraft({ ...userDraft, role: e.target.value })}>{["مدیر کل (Super Admin)", "مدیر فروشگاه (Store Manager)", "پشتیبان (Support Agent)"].map((r) => <option key={r}>{r}</option>)}</SelectInput></div>
            <div className="sticky bottom-0 -mx-6 md:-mx-7 -mb-6 md:-mb-7 px-6 md:px-7 pb-6 md:pb-7 pt-4 mt-2 flex gap-3" style={{ background: p.white }}>
              <button onClick={() => setUserModalOpen(false)} className="flex-1 rounded-full py-3 text-sm font-medium border" style={{ borderColor: p.beige, color: p.ink }}>انصراف</button>
              <button onClick={addUser} className="flex-1 rounded-full py-3 text-sm font-medium" style={{ background: p.sageDeep, color: p.white }}>افزودن کاربر</button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

/* ================================================================
   ADMIN LOGIN — dedicated, isolated portal at #/viina-admin-portal.
   Deliberately a separate component from the customer AuthPage (no
   mascots, no Google button, no signup) — dark luxury glass. Backed
   by real Supabase Auth (email/password), created once from the
   Supabase dashboard — see the setup README.
================================================================= */
function AdminLoginPage({ onSuccess, onBack }) {
  const p = ADMIN_PALETTE;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [shake, setShake] = useState(false);
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setChecking(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: username.trim(), password });
      if (authError) throw authError;
      onSuccess();
    } catch (err) {
      setError(true);
      setErrorMessage(err.message === "Invalid login credentials" ? "" : err.message);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div dir="rtl" lang="fa" style={{ fontFamily: "'Vazirmatn', sans-serif", background: `radial-gradient(circle at 30% 20%, #2A3129, ${p.ink} 60%)`, color: p.cream }} className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Arabic:wght@500;600;700&family=Vazirmatn:wght@400;500;600;700&display=swap');
        @keyframes portalGlowDrift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,-20px) scale(1.1); } }
        @keyframes shakeX { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-6px); } 80% { transform: translateX(6px); } }
        .admin-shake { animation: shakeX 0.5s ease; }
      `}</style>
      <div aria-hidden="true" className="absolute rounded-full pointer-events-none" style={{ width: 520, height: 520, top: "-14%", left: "-10%", background: `radial-gradient(circle, ${p.sageDeep}55, transparent 70%)`, filter: "blur(60px)", animation: "portalGlowDrift 16s ease-in-out infinite" }} />
      <div aria-hidden="true" className="absolute rounded-full pointer-events-none" style={{ width: 440, height: 440, bottom: "-12%", right: "-8%", background: `radial-gradient(circle, ${p.bronze}44, transparent 70%)`, filter: "blur(60px)", animation: "portalGlowDrift 20s ease-in-out infinite reverse" }} />

      <button onClick={onBack} className="absolute top-6 right-6 z-20 inline-flex items-center gap-1.5 text-sm font-medium rounded-full px-4 py-2.5 backdrop-blur-md transition-transform hover:scale-105" style={{ background: "#FFFFFF14", color: p.cream, border: "1px solid #FFFFFF22" }}>
        <ArrowRight size={14} /> بازگشت به فروشگاه
      </button>

      <div className={`relative z-10 w-full max-w-sm rounded-3xl overflow-hidden backdrop-blur-2xl border px-8 py-10 ${shake ? "admin-shake" : ""}`} style={{ background: "#FFFFFF0F", borderColor: "#FFFFFF22", boxShadow: "0 60px 140px -28px #00000090, inset 0 1px 0 #FFFFFF1A" }}>
        <div className="flex flex-col items-center mb-7">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${p.sageDeep}55`, border: `1px solid ${p.sage}55` }}>
            <Lock size={22} style={{ color: p.sage }} />
          </div>
          <p style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.14em", fontWeight: 600, fontSize: 18 }}>VIINA</p>
          <p style={{ fontSize: 12, color: "#B7AF9F" }} className="mt-1">پرتال مدیریت — دسترسی محدود</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl px-4 py-3 mb-5" style={{ background: "#4A1F1F", border: "1px solid #7A3333" }}>
            <AlertTriangle size={15} style={{ color: "#E88" }} />
            <p style={{ fontSize: 12.5, color: "#F3D5D5" }}>{errorMessage || "ایمیل یا رمز عبور مدیریت اشتباه است"}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label style={{ fontSize: 11.5, color: "#B7AF9F" }} className="block mb-1.5">ایمیل مدیر</label>
            <div className="flex items-center gap-2 rounded-2xl px-4 py-3 border" style={{ background: "#FFFFFF0D", borderColor: "#FFFFFF22" }}>
              <User size={15} style={{ color: "#8A8377" }} />
              <input type="email" required value={username} onChange={(e) => { setUsername(e.target.value); setError(false); }} className="flex-1 bg-transparent outline-none text-sm" style={{ color: p.cream }} dir="ltr" autoComplete="username" />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11.5, color: "#B7AF9F" }} className="block mb-1.5">رمز عبور</label>
            <div className="flex items-center gap-2 rounded-2xl px-4 py-3 border" style={{ background: "#FFFFFF0D", borderColor: "#FFFFFF22" }}>
              <Lock size={15} style={{ color: "#8A8377" }} />
              <input required type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(false); }} className="flex-1 bg-transparent outline-none text-sm" style={{ color: p.cream }} dir="ltr" autoComplete="current-password" />
              <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label="نمایش/پنهان کردن رمز عبور">
                {showPassword ? <EyeOff size={15} style={{ color: "#8A8377" }} /> : <Eye size={15} style={{ color: "#8A8377" }} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={checking} className="rounded-full py-3.5 text-sm font-medium mt-2 transition-transform duration-300 hover:-translate-y-0.5" style={{ background: p.sageDeep, color: p.white, boxShadow: `0 14px 32px -10px ${p.sageDeep}AA` }}>
            {checking ? "در حال بررسی…" : "ورود به پنل مدیریت"}
          </button>
        </form>

        <p style={{ fontSize: 10.5, color: "#8A8377" }} className="text-center mt-6 leading-relaxed">این صفحه کاملاً از ورود مشتریان جداست. دسترسی فقط برای مدیران مجاز است.</p>
      </div>
    </div>
  );
}

/* ================================================================
   AdminDashboard — composes every tab. Products/categories/reviews
   are lifted state (props from App) so they also drive the live
   storefront. Orders/discounts/customizer/settings are admin-only
   concerns and stay local to this component.
================================================================= */
const NAV_ITEMS = [
  { key: "overview", label: "نمای کلی / آمار", icon: LayoutGrid },
  { key: "products", label: "مدیریت محصولات", icon: Package },
  { key: "categories", label: "دسته‌بندی‌ها", icon: Layers },
  { key: "pages", label: "صفحات و مسیرها", icon: LinkIcon },
  { key: "bundles", label: "بسته‌های روتین", icon: PackageCheck },
  { key: "orders", label: "مدیریت سفارش‌ها", icon: ClipboardList },
  { key: "customers", label: "مشتریان", icon: Users },
  { key: "reviews", label: "مدیریت نظرات", icon: MessageSquare },
  { key: "promotions", label: "تخفیف‌ها و کدها", icon: Gift },
  { key: "content", label: "محتوای صفحه اصلی", icon: FileText },
  { key: "quiz", label: "مشاور هوشمند پوست", icon: Sparkles },
  { key: "customizer", label: "شخصی‌سازی سایت", icon: Palette },
  { key: "typography", label: "تم و تایپوگرافی", icon: Type },
  { key: "settings", label: "تنظیمات", icon: SettingsIcon },
];

function AdminDashboard({
  products, setProducts, categories, setCategories, reviews, setReviews,
  currencySettings, setCurrencySettings, theme, setTheme, layout, setLayout,
  homeSections, setHomeSections, header, setHeader, announcement, setAnnouncement,
  footer, setFooter, banner, setBanner, hero, setHero, faqs, setFaqs, welcomeModal, setWelcomeModal, authSettings, setAuthSettings,
  freeShipThreshold, setFreeShipThreshold, ingredientLibrary, setIngredientLibrary, quizSettings, setQuizSettings,
  quizQuestions, setQuizQuestions, quizResults, setQuizResults, rewardsSettings, setRewardsSettings,
  customPages, setCustomPages, bundles, setBundles, onExit, onLogout,
}) {
  const p = ADMIN_PALETTE;
  const [tab, setTab] = useState("overview");
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState("همه");
  const [openOrder, setOpenOrder] = useState(null);
  const [replyingReview, setReplyingReview] = useState(null);
  const [discounts, setDiscounts] = useState([]);
  const [authLinks, setAuthLinks] = useState(DEFAULT_AUTH_LINKS);
  const [users, setUsers] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState(() => Object.fromEntries(PAYMENT_METHODS_DEFAULT.map((m) => [m, true])));
  const [zarinpalId, setZarinpalId] = useState("");
  const [shipping, setShipping] = useState(SHIPPING_REGIONS_DEFAULT);
  const [taxRate, setTaxRate] = useState("9");
  const [templates, setTemplates] = useState(NOTIFICATION_TEMPLATES_DEFAULT);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(emptyProductDraft());
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState(null);
  const [catDraft, setCatDraft] = useState(emptyCategoryDraft());
  const [pageModalOpen, setPageModalOpen] = useState(false);
  const [editingPageId, setEditingPageId] = useState(null);
  const [pageDraft, setPageDraft] = useState(emptyPageDraft());
  const [bundleModalOpen, setBundleModalOpen] = useState(false);
  const [editingBundleId, setEditingBundleId] = useState(null);
  const [bundleDraft, setBundleDraft] = useState(emptyBundleDraft());
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [couponDraft, setCouponDraft] = useState(emptyCouponDraft());
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewDraft, setReviewDraft] = useState(emptyReviewDraft());

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);

  const lowStockProducts = products.filter((pr) => pr.stockStatus === "موجودی کم" || pr.stockStatus === "ناموجود");

  /* ---- product handlers ---- */
  function openAdd() { setEditingId(null); setDraft(emptyProductDraft()); setModalOpen(true); }
  function openEdit(pr) {
    setEditingId(pr.id);
    setDraft({
      title: pr.name, sku: pr.sku || "", tag: pr.tag || "جدید", shortDescription: pr.shortDescription || "", description: pr.description || "",
      price: String(pr.price), salePrice: pr.salePrice != null ? String(pr.salePrice) : "", cost: pr.cost != null ? String(pr.cost) : "",
      stock: String(pr.qty), threshold: String(pr.threshold || 10), category: pr.category, subCategory: pr.subCategory || "",
      skinTags: pr.skinTags || [], concerns: pr.concerns || [], volume: pr.volume || "", ingredients: pr.ingredients || "", mainImage: pr.mainImage || "", hoverImage: pr.hoverImage || "",
      extraImage: pr.extraImage || "", metaTitle: pr.metaTitle || "", metaDescription: pr.metaDescription || "", slug: pr.slug || "",
    });
    setModalOpen(true);
  }
  function saveDraft() {
    const qty = Number(draft.stock);
    const threshold = Number(draft.threshold) || 10;
    const stockStatus = qty <= 0 ? "ناموجود" : qty <= threshold ? "موجودی کم" : "موجود";
    const otherSlugs = products.filter((pr) => pr.id !== editingId).map((pr) => pr.slug).filter(Boolean);
    const slug = uniqueSlug(draft.slug || draft.title, otherSlugs);
    const autoMetaDescription = draft.metaDescription || buildProductSeoDescription({ name: draft.title, shortDescription: draft.shortDescription, description: draft.description, skinTags: draft.skinTags });
    const fields = {
      name: draft.title, sku: draft.sku, tag: draft.tag, shortDescription: draft.shortDescription, description: draft.description,
      price: Number(draft.price) || 0, salePrice: draft.salePrice ? Number(draft.salePrice) : null, cost: Number(draft.cost) || 0,
      qty, threshold, stockStatus, category: draft.category, subCategory: draft.subCategory, skinTags: draft.skinTags, concerns: draft.concerns, volume: draft.volume,
      ingredients: draft.ingredients, mainImage: draft.mainImage, hoverImage: draft.hoverImage, extraImage: draft.extraImage,
      metaTitle: draft.metaTitle || `${draft.title} | ${BRAND_NAME}`, metaDescription: autoMetaDescription, slug,
      skin: draft.skinTags[0] ? `مناسب پوست ${draft.skinTags.join("، ")}` : "",
    };
    if (editingId != null) {
      setProducts((prev) => prev.map((pr) => pr.id === editingId ? { ...pr, ...fields } : pr));
    } else {
      const nextId = Math.max(0, ...products.map((pr) => pr.id)) + 1;
      const tints = [p.nude, p.sage, p.beige, p.nudeDeep, p.sageDeep, p.creamDeep];
      setProducts((prev) => [...prev, { id: nextId, rating: 0, reviews: 0, tint: tints[nextId % tints.length], ...fields }]);
    }
    setModalOpen(false);
  }
  function deleteProduct(id) { if (window.confirm("این محصول از کاتالوگ حذف شود؟")) setProducts((prev) => prev.filter((pr) => pr.id !== id)); }
  function duplicateProduct(pr) {
    const nextId = Math.max(0, ...products.map((x) => x.id)) + 1;
    setProducts((prev) => [...prev, { ...pr, id: nextId, name: `${pr.name} (کپی)`, sku: pr.sku ? `${pr.sku}-COPY` : "" }]);
  }
  function bulkDelete(ids) { if (window.confirm(`${ids.length} محصول انتخاب‌شده حذف شوند؟`)) setProducts((prev) => prev.filter((pr) => !ids.includes(pr.id))); }
  function bulkStatus(ids, status) { setProducts((prev) => prev.map((pr) => ids.includes(pr.id) ? { ...pr, stockStatus: status } : pr)); }

  /* ---- category handlers ---- */
  function openAddCategory() { setEditingCatId(null); setCatDraft(emptyCategoryDraft()); setCatModalOpen(true); }
  function openEditCategory(c) {
    setEditingCatId(c.id);
    const iconKey = CATEGORY_ICON_OPTIONS.find((o) => o.icon === c.icon)?.key || "tag";
    setCatDraft({ name: c.name, slug: c.slug || "", banner: c.banner || "", description: c.description || "", featured: !!c.featured, order: String(c.order || 1), icon: iconKey });
    setCatModalOpen(true);
  }
  function saveCategory() {
    const iconComp = CATEGORY_ICON_OPTIONS.find((o) => o.key === catDraft.icon)?.icon || Tag;
    const otherSlugs = categories.filter((c) => c.id !== editingCatId).map((c) => c.slug).filter(Boolean);
    const slug = uniqueSlug(catDraft.slug || catDraft.name, otherSlugs);
    const fields = { name: catDraft.name, slug, banner: catDraft.banner, description: catDraft.description, featured: catDraft.featured, order: Number(catDraft.order) || 1, icon: iconComp, blurb: catDraft.description.slice(0, 24) };
    if (editingCatId != null) {
      setCategories((prev) => prev.map((c) => c.id === editingCatId ? { ...c, ...fields } : c));
    } else {
      const id = slug + "-" + Date.now();
      setCategories((prev) => [...prev, { id, ...fields }]);
    }
    setCatModalOpen(false);
  }
  function deleteCategory(id) { if (window.confirm("این دسته‌بندی حذف شود؟")) setCategories((prev) => prev.filter((c) => c.id !== id)); }
  function toggleFeaturedCategory(id) { setCategories((prev) => prev.map((c) => c.id === id ? { ...c, featured: !c.featured } : c)); }

  /* ---- page & routing handlers ----
     Slugs are guaranteed unique across every existing page, so a
     newly created page is always reachable at its own #/page/<slug>
     the instant it's saved — nothing to hardcode elsewhere. */
  function openAddPage() { setEditingPageId(null); setPageDraft(emptyPageDraft()); setPageModalOpen(true); }
  function openEditPage(pg) { setEditingPageId(pg.id); setPageDraft({ title: pg.title, slug: pg.slug, navLabel: pg.navLabel || "", content: pg.content, fontSize: pg.fontSize || "", textAlign: pg.textAlign || "", backgroundColor: pg.backgroundColor || "", textColor: pg.textColor || "", isJournal: !!pg.isJournal }); setPageModalOpen(true); }
  function savePage() {
    const otherSlugs = customPages.filter((pg) => pg.id !== editingPageId).map((pg) => pg.slug);
    const slug = uniqueSlug(pageDraft.slug || pageDraft.title, otherSlugs);
    const styleFields = { fontSize: pageDraft.fontSize, textAlign: pageDraft.textAlign, backgroundColor: pageDraft.backgroundColor, textColor: pageDraft.textColor, isJournal: pageDraft.isJournal };
    if (editingPageId != null) {
      const prevSlug = customPages.find((pg) => pg.id === editingPageId)?.slug;
      setCustomPages((prev) => prev.map((pg) => pg.id === editingPageId ? { ...pg, title: pageDraft.title, slug, navLabel: pageDraft.navLabel, content: pageDraft.content, ...styleFields } : pg));
      /* keep any live menu links pointed at the page's new URL instead of breaking them */
      if (prevSlug && prevSlug !== slug) {
        setHeader((h) => ({ ...h, navLinks: h.navLinks.map((l) => l.href === `#/page/${prevSlug}` ? { ...l, href: `#/page/${slug}` } : l) }));
        setFooter((f) => ({
          ...f,
          col2Links: f.col2Links.map((l) => l.href === `#/page/${prevSlug}` ? { ...l, href: `#/page/${slug}` } : l),
          col3Links: f.col3Links.map((l) => l.href === `#/page/${prevSlug}` ? { ...l, href: `#/page/${slug}` } : l),
        }));
      }
    } else {
      setCustomPages((prev) => [...prev, { id: `page-${Date.now()}`, title: pageDraft.title, slug, navLabel: pageDraft.navLabel, content: pageDraft.content, ...styleFields }]);
    }
    setPageModalOpen(false);
  }
  function deletePage(id) {
    if (!window.confirm("این صفحه حذف شود؟")) return;
    const pg = customPages.find((p2) => p2.id === id);
    setCustomPages((prev) => prev.filter((p2) => p2.id !== id));
    if (pg) {
      setHeader((h) => ({ ...h, navLinks: h.navLinks.filter((l) => l.href !== `#/page/${pg.slug}`) }));
      setFooter((f) => ({ ...f, col2Links: f.col2Links.filter((l) => l.href !== `#/page/${pg.slug}`), col3Links: f.col3Links.filter((l) => l.href !== `#/page/${pg.slug}`) }));
    }
  }
  function toggleHeaderNavForPage(pg) {
    const href = `#/page/${pg.slug}`;
    setHeader((h) => h.navLinks.some((l) => l.href === href)
      ? { ...h, navLinks: h.navLinks.filter((l) => l.href !== href) }
      : { ...h, navLinks: [...h.navLinks, { label: pg.navLabel || pg.title, href }] });
  }
  function toggleFooterNavForPage(pg) {
    const href = `#/page/${pg.slug}`;
    setFooter((f) => f.col3Links.some((l) => l.href === href)
      ? { ...f, col3Links: f.col3Links.filter((l) => l.href !== href) }
      : { ...f, col3Links: [...f.col3Links, { label: pg.navLabel || pg.title, href }] });
  }

  /* ---- routine bundle handlers ---- */
  function openAddBundle() { setEditingBundleId(null); setBundleDraft(emptyBundleDraft()); setBundleModalOpen(true); }
  function openEditBundle(b) { setEditingBundleId(b.id); setBundleDraft({ title: b.title, description: b.description, discountPercent: String(b.discountPercent), productIds: b.productIds || [] }); setBundleModalOpen(true); }
  function saveBundle() {
    const otherSlugs = bundles.filter((b) => b.id !== editingBundleId).map((b) => b.slug).filter(Boolean);
    const slug = uniqueSlug(bundleDraft.title, otherSlugs);
    const fields = { title: bundleDraft.title, slug, description: bundleDraft.description, discountPercent: Number(bundleDraft.discountPercent) || 0, productIds: bundleDraft.productIds };
    if (editingBundleId != null) {
      setBundles((prev) => prev.map((b) => b.id === editingBundleId ? { ...b, ...fields } : b));
    } else {
      setBundles((prev) => [...prev, { id: `bundle-${Date.now()}`, ...fields }]);
    }
    setBundleModalOpen(false);
  }
  function deleteBundle(id) { if (window.confirm("این بسته روتین حذف شود؟")) setBundles((prev) => prev.filter((b) => b.id !== id)); }

  /* ---- order handlers ---- */
  function setOrderStatus(id, status) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    setOpenOrder((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
  }
  function generateTracking(id) {
    const num = "VN" + Math.floor(10000000 + Math.random() * 89999999);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, trackingNumber: num } : o)));
    setOpenOrder((prev) => (prev && prev.id === id ? { ...prev, trackingNumber: num } : prev));
  }

  /* ---- review handlers ---- */
  function setReviewStatus(id, status) { setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r))); }
  function removeReview(id) { setReviews((prev) => prev.filter((r) => r.id !== id)); }
  function openAddReview() { setReviewDraft(emptyReviewDraft()); setReviewModalOpen(true); }
  function saveReview() {
    const nextId = Math.max(0, ...reviews.map((r) => r.id)) + 1;
    setReviews((prev) => [...prev, { id: nextId, name: reviewDraft.name, product: reviewDraft.product, rating: Number(reviewDraft.rating), text: reviewDraft.text, date: new Date().toISOString().slice(0, 10), status: reviewDraft.status }]);
    setReviewModalOpen(false);
  }

  /* ---- coupon handlers ---- */
  function saveCoupon() {
    setDiscounts((prev) => [...prev, { code: couponDraft.code, type: couponDraft.type, value: Number(couponDraft.value) || 0, minPurchase: Number(couponDraft.minPurchase) || 0, usageLimit: Number(couponDraft.usageLimit) || 0, usageCount: 0, expiry: couponDraft.expiry, status: "فعال" }]);
    setCouponModalOpen(false); setCouponDraft(emptyCouponDraft());
  }
  function deleteCoupon(code) { setDiscounts((prev) => prev.filter((d) => d.code !== code)); }
  function toggleCouponStatus(code) { setDiscounts((prev) => prev.map((d) => d.code === code ? { ...d, status: d.status === "فعال" ? "منقضی شده" : "فعال" } : d)); }

  function exportSalesReport() {
    downloadCSV("viina-sales-report.csv", ["شماره سفارش", "مشتری", "تاریخ", "روش پرداخت", "وضعیت پرداخت", "وضعیت سفارش", "مبلغ"],
      orders.map((o) => [o.id, o.customer, o.date, o.paymentMethod, o.paymentStatus, o.status, orderTotal(o)]));
  }

  const visibleOrders = orderFilter === "همه" ? orders : orders.filter((o) => o.status === orderFilter);

  return (
    <div dir="rtl" lang="fa" style={{ fontFamily: "'Vazirmatn', sans-serif", background: p.creamDeep, color: p.ink }} className="min-h-screen w-full flex">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Arabic:wght@400;500;600;700&family=Vazirmatn:wght@300;400;500;600;700&family=Cinzel:wght@500;600;700&display=swap');
        input:focus, select:focus, textarea:focus, button:focus-visible { outline: 2px solid ${p.sage}; outline-offset: 2px; }
        @media print { aside, header, .no-print { display: none !important; } }
      `}</style>

      <aside className={`fixed lg:sticky top-0 right-0 z-40 h-screen w-64 shrink-0 flex flex-col justify-between transition-transform duration-300 no-print backdrop-blur-md border-l ${mobileNavOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`} style={{ background: `${p.ink}D9`, backdropFilter: "blur(20px) saturate(160%)", WebkitBackdropFilter: "blur(20px) saturate(160%)", color: p.cream, borderColor: "#3A342C", transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
        <div className="overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-6">
            <p style={{ fontFamily: "'Cinzel', serif", fontWeight: 600, letterSpacing: "0.12em" }} className="text-xl">VIINA</p>
            <span style={{ fontSize: 10, color: "#8A8377" }}>مدیریت</span>
          </div>
          <nav className="flex flex-col gap-1 px-3">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon; const active = tab === item.key;
              return (
                <button key={item.key} onClick={() => { setTab(item.key); setMobileNavOpen(false); }} className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm text-right transition-colors" style={{ background: active ? p.sageDeep : "transparent", color: active ? p.white : "#C9C2B6" }}>
                  <Icon size={16} />{item.label}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="px-3 pb-6 flex flex-col gap-1">
          <button onClick={onExit} className="w-full flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm" style={{ color: "#C9C2B6" }}><ArrowLeft size={16} style={{ transform: "scaleX(-1)" }} /> مشاهده فروشگاه</button>
          <button onClick={onLogout} className="w-full flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm" style={{ color: "#E8A5A5" }}><LogOut size={16} /> خروج از حساب مدیریت</button>
        </div>
      </aside>
      {mobileNavOpen && <div className="fixed inset-0 z-30 lg:hidden" style={{ background: `${p.ink}77` }} onClick={() => setMobileNavOpen(false)} />}

      <main className="flex-1 min-w-0">
        <div className="sticky top-0 z-20 flex items-center justify-between px-5 md:px-8 h-16 border-b no-print" style={{ background: `${p.creamDeep}E8`, backdropFilter: "blur(8px)", borderColor: p.beige }}>
          <div className="flex items-center gap-3 min-w-0">
            <button className="lg:hidden p-1 shrink-0" onClick={() => setMobileNavOpen(true)} aria-label="باز کردن منو"><Menu size={20} /></button>
            <p style={{ fontFamily: "'Noto Serif Arabic', serif", fontSize: 19, color: p.ink }} className="truncate">{NAV_ITEMS.find((n) => n.key === tab)?.label}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <button onClick={() => setAlertsOpen((v) => !v)} className="relative p-2" aria-label="هشدارها">
                <Bell size={18} style={{ color: p.inkSoft }} />
                {lowStockProducts.length > 0 && <span className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 rounded-full" style={{ background: "#A5453A" }} />}
              </button>
              {alertsOpen && (
                <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl shadow-lg border overflow-hidden z-50" style={{ background: p.white, borderColor: p.beige }}>
                  <p style={{ fontSize: 12, color: p.inkSoft }} className="px-4 pt-3 pb-2">هشدارهای موجودی</p>
                  {lowStockProducts.length === 0 ? <p style={{ fontSize: 12.5, color: p.ink }} className="px-4 pb-4">هشداری وجود ندارد.</p> : lowStockProducts.map((pr) => (
                    <button key={pr.id} onClick={() => { setTab("products"); setAlertsOpen(false); }} className="w-full text-right px-4 py-2.5 text-sm flex items-center justify-between hover:opacity-70 border-t" style={{ borderColor: p.creamDeep, color: p.ink }}>
                      <span className="truncate">{pr.name}</span><Badge label={pr.stockStatus} bg={resolveStyle(STOCK_STYLE[pr.stockStatus], p).bg} fg={resolveStyle(STOCK_STYLE[pr.stockStatus], p).fg} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: p.sageMist }}><User size={16} style={{ color: p.sageDeep }} /></div>
          </div>
        </div>

        <div className="px-5 md:px-8 py-7 max-w-7xl">
          {tab === "overview" && <OverviewTab products={products} categories={categories} orders={orders} currencySettings={currencySettings} onQuickAdd={openAdd} onQuickCoupon={() => setCouponModalOpen(true)} onExportReport={exportSalesReport} />}
          {tab === "products" && <ProductsTab products={products} categories={categories} currencySettings={currencySettings} onAdd={openAdd} onEdit={openEdit} onDuplicate={duplicateProduct} onDelete={deleteProduct} onBulkDelete={bulkDelete} onBulkStatus={bulkStatus} onGotoCategories={() => setTab("categories")} />}
          {tab === "categories" && <CategoriesTab categories={categories} products={products} onAdd={openAddCategory} onEdit={openEditCategory} onDelete={deleteCategory} onToggleFeatured={toggleFeaturedCategory} />}
          {tab === "pages" && <PagesTab customPages={customPages} onAdd={openAddPage} onEdit={openEditPage} onDelete={deletePage} onToggleHeaderNav={toggleHeaderNavForPage} onToggleFooterNav={toggleFooterNavForPage} headerNavLinks={header.navLinks} footerLinks={footer.col3Links} />}
          {tab === "bundles" && <BundlesTab bundles={bundles} products={products} onAdd={openAddBundle} onEdit={openEditBundle} onDelete={deleteBundle} />}
          {tab === "orders" && (
            <div className="flex flex-col gap-5">
              {orders.length === 0 ? <EmptyState icon={Inbox} title="هنوز سفارشی ثبت نشده است" subtitle="سفارش‌های مشتریان پس از تکمیل خرید از فروشگاه، اینجا نمایش داده می‌شوند." palette={p} /> : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {["همه", ...ORDER_STATUS_OPTIONS].map((f) => (
                      <button key={f} onClick={() => setOrderFilter(f)} className="rounded-full px-4 py-2 text-sm" style={{ background: orderFilter === f ? p.sageDeep : p.white, color: orderFilter === f ? p.white : p.inkSoft, border: `1px solid ${orderFilter === f ? p.sageDeep : p.beige}` }}>{f}</button>
                    ))}
                  </div>
                  <div className="rounded-3xl overflow-hidden" style={{ background: p.white, border: `1px solid ${p.beige}` }}><OrdersTable orders={visibleOrders} setStatus={setOrderStatus} onOpenDetails={setOpenOrder} currencySettings={currencySettings} /></div>
                </>
              )}
            </div>
          )}
          {tab === "customers" && <CustomersTab orders={orders} currencySettings={currencySettings} />}
          {tab === "reviews" && <ReviewsTab reviews={reviews} onAdd={openAddReview} onApprove={(id) => setReviewStatus(id, "تأیید شده")} onReject={(id) => setReviewStatus(id, "رد شده")} onDelete={removeReview} onReply={setReplyingReview} />}
          {tab === "promotions" && <PromotionsTab discounts={discounts} onAdd={() => setCouponModalOpen(true)} onDelete={deleteCoupon} onToggleStatus={toggleCouponStatus} currencySettings={currencySettings} />}
          {tab === "content" && <ContentTab hero={hero} setHero={setHero} banner={banner} setBanner={setBanner} faqs={faqs} setFaqs={setFaqs} welcomeModal={welcomeModal} setWelcomeModal={setWelcomeModal} ingredientLibrary={ingredientLibrary} setIngredientLibrary={setIngredientLibrary} />}
          {tab === "quiz" && <QuizBuilderTab quizSettings={quizSettings} setQuizSettings={setQuizSettings} quizQuestions={quizQuestions} setQuizQuestions={setQuizQuestions} quizResults={quizResults} setQuizResults={setQuizResults} products={products} />}
          {tab === "customizer" && <CustomizerTab theme={theme} setTheme={setTheme} layout={layout} setLayout={setLayout} homeSections={homeSections} setHomeSections={setHomeSections} header={header} setHeader={setHeader} announcement={announcement} setAnnouncement={setAnnouncement} footer={footer} setFooter={setFooter} />}
          {tab === "typography" && <TypographyTab theme={theme} setTheme={setTheme} />}
          {tab === "settings" && (
            <SettingsTab products={products} setProducts={setProducts} currencySettings={currencySettings} setCurrencySettings={setCurrencySettings}
              authLinks={authLinks} setAuthLinks={setAuthLinks} users={users} setUsers={setUsers} paymentMethods={paymentMethods} setPaymentMethods={setPaymentMethods}
              zarinpalId={zarinpalId} setZarinpalId={setZarinpalId} shipping={shipping} setShipping={setShipping} freeShipThreshold={freeShipThreshold} setFreeShipThreshold={setFreeShipThreshold}
              taxRate={taxRate} setTaxRate={setTaxRate} templates={templates} setTemplates={setTemplates} authSettings={authSettings} setAuthSettings={setAuthSettings}
              quizSettings={quizSettings} setQuizSettings={setQuizSettings} rewardsSettings={rewardsSettings} setRewardsSettings={setRewardsSettings} />
          )}
        </div>
      </main>

      {modalOpen && <ProductFormModal draft={draft} setDraft={setDraft} onCancel={() => setModalOpen(false)} onSave={saveDraft} isEdit={editingId != null} categories={categories} />}
      {catModalOpen && <CategoryFormModal draft={catDraft} setDraft={setCatDraft} onCancel={() => setCatModalOpen(false)} onSave={saveCategory} isEdit={editingCatId != null} />}
      {pageModalOpen && <PageFormModal draft={pageDraft} setDraft={setPageDraft} onCancel={() => setPageModalOpen(false)} onSave={savePage} isEdit={editingPageId != null} />}
      {bundleModalOpen && <BundleFormModal draft={bundleDraft} setDraft={setBundleDraft} onCancel={() => setBundleModalOpen(false)} onSave={saveBundle} isEdit={editingBundleId != null} products={products} />}
      {couponModalOpen && <CouponFormModal draft={couponDraft} setDraft={setCouponDraft} onCancel={() => setCouponModalOpen(false)} onSave={saveCoupon} categories={categories} />}
      {reviewModalOpen && <ReviewFormModal draft={reviewDraft} setDraft={setReviewDraft} onCancel={() => setReviewModalOpen(false)} onSave={saveReview} />}
      {openOrder && <OrderDetailsDrawer order={orders.find((o) => o.id === openOrder.id) || openOrder} onClose={() => setOpenOrder(null)} onSetStatus={setOrderStatus} onGenerateTracking={generateTracking} currencySettings={currencySettings} />}
      {replyingReview && <ReplyModal review={replyingReview} onCancel={() => setReplyingReview(null)} onSend={() => setReplyingReview(null)} />}
    </div>
  );
}

/* ---------------- root: owns all lifted state, routes between storefront & admin ---------------- */

/* ================================================================
   Background wallpaper layer (z-0) — a dark, persistent backdrop
   carrying a DENSE grid of gently floating/shimmering skincare
   accents (droplets, serum bottles, leaves, stars, sparkles). It
   tiles the ENTIRE viewport behind everything else, edge to edge,
   so wherever the floating content card (z-20, fully opaque) does
   NOT cover, the wallpaper is clearly visible and animated; wherever
   the card DOES cover, icons are simply painted over by the card's
   opaque background and disappear — correct stacking order, no
   clip-path math needed.
================================================================= */
const FRAME_ICON_SET = [Droplet, FlaskConical, Leaf, Star, Sparkles];
function buildFrameIcons() {
  const cols = 14;
  const rows = 9;
  const items = [];
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const rowOffset = r % 2 === 0 ? 0 : 100 / cols / 2; // brick-lay stagger for an organic wallpaper feel
      const left = Math.min(99, (c + 0.5) * (100 / cols) + rowOffset);
      const top = (r + 0.5) * (100 / rows);
      items.push({
        key: `${r}-${c}`,
        top: `${top}%`,
        left: `${left}%`,
        Icon: FRAME_ICON_SET[idx % FRAME_ICON_SET.length],
        size: 11 + (idx % 3) * 3,
        delay: (idx % 12) * 0.22,
        duration: 3 + (idx % 5) * 0.45,
        idx,
      });
      idx += 1;
    }
  }
  return items;
}
const FRAME_ICONS = buildFrameIcons();
function SkincareFrameBorder({ palette }) {
  const pal = palette || DEFAULT_THEME;
  const colors = [pal.gold || "#D9C39A", pal.sageMist || "#DCE3D3", pal.beige || "#EAE0D2"];
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <style>{`
        @keyframes viinaFrameFloat { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.45; } 50% { transform: translateY(-6px) scale(1.22); opacity: 0.95; } }
        .viina-frame-icon { animation-name: viinaFrameFloat; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
        @media (prefers-reduced-motion: reduce) { .viina-frame-icon { animation: none !important; opacity: 0.6 !important; } }
      `}</style>
      {FRAME_ICONS.map((it) => (
        <div key={it.key} className="viina-frame-icon absolute -translate-x-1/2 -translate-y-1/2" style={{ top: it.top, left: it.left, animationDelay: `${it.delay}s`, animationDuration: `${it.duration}s` }}>
          <it.Icon size={it.size} style={{ color: colors[it.idx % colors.length] }} />
        </div>
      ))}
    </div>
  );
}

/* ================================================================
   Root export — loads every site_content row from Supabase ONCE,
   then hands it to AppShell (which owns all the actual app logic,
   unchanged) so every piece of admin-editable state can hydrate
   from the database on its very first render instead of flashing
   default content and then popping to the real data. */
export default function App() {
  const [remoteContent, setRemoteContent] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetchAllSiteContent().then((map) => { if (!cancelled) setRemoteContent(map); });
    return () => { cancelled = true; };
  }, []);

  if (!remoteContent) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#171717" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: "#3A362F", borderTopColor: "#B99656" }} />
          <p style={{ color: "#D9C39A", fontFamily: "'Vazirmatn', sans-serif", fontSize: 13 }}>در حال بارگذاری ویینا…</p>
        </div>
      </div>
    );
  }
  return <AppShell remoteContent={remoteContent} />;
}

function AppShell({ remoteContent }) {
  function routeFromHash() {
    const h = window.location.hash;
    if (h === "#/admin") return "admin";
    if (h === "#/viina-admin-portal") return "adminLogin";
    if (h === "#/auth" || h === "#/login") return "auth";
    if (h === "#/checkout") return "checkout";
    if (h.startsWith("#/page/")) return "page";
    if (h.startsWith("#/category/")) return "category";
    return "store";
  }
  function slugFromHash() {
    const m = window.location.hash.match(/^#\/(?:page|category)\/(.+)$/);
    return m ? decodeURIComponent(m[1]) : "";
  }
  const [route, setRoute] = useState(routeFromHash);
  const [routeSlug, setRouteSlug] = useState(slugFromHash);
  const [products, setProducts] = useSyncedState("products", remoteContent.products ?? []);
  const [categories, setCategories] = useSyncedState("categories", remoteContent.categories ?? []);
  const [reviews, setReviews] = useSyncedState("reviews", remoteContent.reviews ?? []);
  const [currencySettings, setCurrencySettings] = useSyncedState("currencySettings", remoteContent.currencySettings ?? { currency: "toman", currencyLabel: "تومان", digitStyle: "en" });
  const [theme, setTheme] = useSyncedState("theme", remoteContent.theme ?? DEFAULT_THEME);
  const [layout, setLayout] = useSyncedState("layout", remoteContent.layout ?? DEFAULT_LAYOUT);
  const [homeSections, setHomeSections] = useSyncedState("homeSections", remoteContent.homeSections ?? HOME_SECTIONS_DEFAULT);
  const [header, setHeader] = useSyncedState("header", remoteContent.header ?? { ...DEFAULT_HEADER, heroHeadline: HERO_CMS_DEFAULT.headline, heroSubtitle: HERO_CMS_DEFAULT.subtitle, heroCtaText: HERO_CMS_DEFAULT.ctaText, heroCtaLink: HERO_CMS_DEFAULT.ctaLink, heroImage: HERO_CMS_DEFAULT.bgImage, heroImageWidth: HERO_CMS_DEFAULT.imageWidth, heroImageHeight: HERO_CMS_DEFAULT.imageHeight });
  const [announcement, setAnnouncement] = useSyncedState("announcement", remoteContent.announcement ?? DEFAULT_ANNOUNCEMENT);
  const [footer, setFooter] = useSyncedState("footer", remoteContent.footer ?? DEFAULT_FOOTER);
  const [banner, setBanner] = useSyncedState("banner", remoteContent.banner ?? DEFAULT_BANNER);
  const [hero, setHeroState] = useSyncedState("hero", remoteContent.hero ?? HERO_CMS_DEFAULT);
  const [faqs, setFaqs] = useSyncedState("faqs", remoteContent.faqs ?? FAQS_DEFAULT);
  const [welcomeModal, setWelcomeModal] = useSyncedState("welcomeModal", remoteContent.welcomeModal ?? DEFAULT_WELCOME_MODAL);
  const [authSettings, setAuthSettings] = useSyncedState("authSettings", remoteContent.authSettings ?? DEFAULT_AUTH_SETTINGS);
  const [freeShipThreshold, setFreeShipThreshold] = useSyncedState("freeShipThreshold", remoteContent.freeShipThreshold ?? "750000");
  const [ingredientLibrary, setIngredientLibrary] = useSyncedState("ingredientLibrary", remoteContent.ingredientLibrary ?? []);
  const [quizSettings, setQuizSettings] = useSyncedState("quizSettings", remoteContent.quizSettings ?? DEFAULT_QUIZ_SETTINGS);
  const [quizQuestions, setQuizQuestions] = useSyncedState("quizQuestions", remoteContent.quizQuestions ?? DEFAULT_QUIZ_QUESTIONS);
  const [quizResults, setQuizResults] = useSyncedState("quizResults", remoteContent.quizResults ?? DEFAULT_QUIZ_RESULTS);
  const [rewardsSettings, setRewardsSettings] = useSyncedState("rewardsSettings", remoteContent.rewardsSettings ?? DEFAULT_REWARDS_SETTINGS);
  const [customPages, setCustomPages] = useSyncedState("customPages", remoteContent.customPages ?? DEFAULT_CUSTOM_PAGES);
  const [bundles, setBundles] = useSyncedState("bundles", remoteContent.bundles ?? DEFAULT_BUNDLES);
  /* Per-visitor session state — deliberately NOT synced to Supabase */
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [postLoginGoCheckout, setPostLoginGoCheckout] = useState(false);
  /* Admin identity now lives in Supabase Auth (see AdminLoginPage) —
     never stored as a readable row in site_content. */
  const [adminAuthed, setAdminAuthed] = useState(false);

  useEffect(() => {
    const onHashChange = () => { setRoute(routeFromHash()); setRouteSlug(slugFromHash()); };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (route === "checkout" && !user) goAuthThenCheckout();
  }, [route, user]);

  /* Real admin session persistence via Supabase Auth — it keeps its
     own token in the browser's localStorage, so a page refresh (or
     coming back tomorrow) keeps the admin signed in on the deployed
     site, not just inside this preview. */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setAdminAuthed(!!data.session); });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => { setAdminAuthed(!!session); });
    return () => sub.subscription.unsubscribe();
  }, []);

  /* keep the visible URL honest: hitting /admin without a session
     shows the portal's hash instead of silently rendering it under /admin */
  useEffect(() => {
    if (route === "admin" && !adminAuthed) window.location.hash = "/viina-admin-portal";
  }, [route, adminAuthed]);

  function goAdmin() { window.location.hash = "/admin"; setRoute("admin"); }
  function goAdminPortal() { window.location.hash = "/viina-admin-portal"; setRoute("adminLogin"); }
  function goStore() { window.location.hash = ""; setRoute("store"); }
  function goAuth() { setPostLoginGoCheckout(false); window.location.hash = "/auth"; setRoute("auth"); }
  function goCheckout() { window.location.hash = "/checkout"; setRoute("checkout"); }
  function goAuthThenCheckout() { setPostLoginGoCheckout(true); window.location.hash = "/auth"; setRoute("auth"); }
  function handleLogin(userInfo) {
    setUser(userInfo);
    if (postLoginGoCheckout) { goCheckout(); } else { goStore(); }
  }
  function handleAdminLoginSuccess() {
    /* adminAuthed flips true via the onAuthStateChange listener above */
    window.location.hash = "/admin";
    setRoute("admin");
  }
  function handleAdminLogout() {
    supabase.auth.signOut();
    goAdminPortal();
  }

  /* hero content lives in one place; header carries the fields the
     storefront actually reads (kept in sync so the Content tab's
     "Hero Section" editor is the single source of truth) */
  function setHero(next) {
    const resolved = typeof next === "function" ? next(hero) : next;
    setHeroState(resolved);
    setHeader((h) => ({ ...h, heroHeadline: resolved.headline, heroSubtitle: resolved.subtitle, heroCtaText: resolved.ctaText, heroCtaLink: resolved.ctaLink, heroImage: resolved.bgImage, heroImageWidth: resolved.imageWidth, heroImageHeight: resolved.imageHeight }));
  }

  let content;
  if (route === "adminLogin" || (route === "admin" && !adminAuthed)) {
    content = <AdminLoginPage onSuccess={handleAdminLoginSuccess} onBack={goStore} />;
  } else if (route === "admin") {
    content = (
      <AdminDashboard
        products={products} setProducts={setProducts} categories={categories} setCategories={setCategories}
        reviews={reviews} setReviews={setReviews} currencySettings={currencySettings} setCurrencySettings={setCurrencySettings}
        theme={theme} setTheme={setTheme} layout={layout} setLayout={setLayout} homeSections={homeSections} setHomeSections={setHomeSections}
        header={header} setHeader={setHeader} announcement={announcement} setAnnouncement={setAnnouncement} footer={footer} setFooter={setFooter}
        banner={banner} setBanner={setBanner} hero={hero} setHero={setHero} faqs={faqs} setFaqs={setFaqs}
        welcomeModal={welcomeModal} setWelcomeModal={setWelcomeModal} authSettings={authSettings} setAuthSettings={setAuthSettings}
        freeShipThreshold={freeShipThreshold} setFreeShipThreshold={setFreeShipThreshold} ingredientLibrary={ingredientLibrary} setIngredientLibrary={setIngredientLibrary}
        quizSettings={quizSettings} setQuizSettings={setQuizSettings} quizQuestions={quizQuestions} setQuizQuestions={setQuizQuestions}
        quizResults={quizResults} setQuizResults={setQuizResults} rewardsSettings={rewardsSettings} setRewardsSettings={setRewardsSettings}
        customPages={customPages} setCustomPages={setCustomPages} bundles={bundles} setBundles={setBundles}
        onExit={goStore} onLogout={handleAdminLogout}
      />
    );
  } else if (route === "auth") {
    content = <AuthPage theme={theme} authSettings={authSettings} onLogin={handleLogin} onBack={goStore} />;
  } else if (route === "checkout") {
    content = !user ? null : (
      <CheckoutPage
        cart={cart} products={products} user={user} currencySettings={currencySettings} theme={theme} rewardsSettings={rewardsSettings}
        onBack={goStore} onPlaceOrder={() => { setCart([]); goStore(); }}
      />
    );
  } else if (route === "page") {
    const matchedPage = customPages.find((pg) => pg.slug === routeSlug);
    const pageToShow = matchedPage || { title: "صفحه پیدا نشد", navLabel: "خطای ۴۰۴", content: "این صفحه وجود ندارد یا حذف شده است. ممکن است آدرس تغییر کرده باشد." };
    content = (
      <Storefront
        products={products} categories={categories} reviews={reviews} currencySettings={currencySettings}
        theme={theme} layout={layout} header={header} announcement={announcement} footer={footer} banner={banner}
        homeSections={homeSections} faqs={faqs} welcomeModal={welcomeModal} cart={cart} setCart={setCart} user={user}
        freeShipThreshold={freeShipThreshold} ingredientLibrary={ingredientLibrary} quizSettings={quizSettings} quizQuestions={quizQuestions} quizResults={quizResults} rewardsSettings={rewardsSettings}
        onOpenAdmin={goAdmin} onGoAuth={goAuth} onGoCheckout={goCheckout} customPage={pageToShow} customPages={customPages} bundles={bundles}
      />
    );
  } else if (route === "category") {
    content = (
      <Storefront
        products={products} categories={categories} reviews={reviews} currencySettings={currencySettings}
        theme={theme} layout={layout} header={header} announcement={announcement} footer={footer} banner={banner}
        homeSections={homeSections} faqs={faqs} welcomeModal={welcomeModal} cart={cart} setCart={setCart} user={user}
        freeShipThreshold={freeShipThreshold} ingredientLibrary={ingredientLibrary} quizSettings={quizSettings} quizQuestions={quizQuestions} quizResults={quizResults} rewardsSettings={rewardsSettings}
        onOpenAdmin={goAdmin} onGoAuth={goAuth} onGoCheckout={goCheckout} initialCategorySlug={routeSlug} customPages={customPages} bundles={bundles}
      />
    );
  } else {
    content = (
      <Storefront
        products={products} categories={categories} reviews={reviews} currencySettings={currencySettings}
        theme={theme} layout={layout} header={header} announcement={announcement} footer={footer} banner={banner}
        homeSections={homeSections} faqs={faqs} welcomeModal={welcomeModal} cart={cart} setCart={setCart} user={user}
        freeShipThreshold={freeShipThreshold} ingredientLibrary={ingredientLibrary} quizSettings={quizSettings} quizQuestions={quizQuestions} quizResults={quizResults} rewardsSettings={rewardsSettings}
        onOpenAdmin={goAdmin} onGoAuth={goAuth} onGoCheckout={goCheckout} customPages={customPages} bundles={bundles}
      />
    );
  }

  /* Two explicit stacking layers, in DOM + z-index order:
       z-0  → fixed, full-bleed dark wallpaper carrying the animated
              skincare icons — strictly the backdrop, nothing else
              is allowed to render behind it.
       z-20 → the entire site, wrapped in a smaller, opaque, rounded
              "card" that floats above the wallpaper with a heavy
              drop-shadow. Anything from the wallpaper layer that
              falls under the card's footprint is simply painted
              over (correct stacking order), so icons visually
              vanish behind the card as intended. */
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-neutral-900">
      {/* Layer 0 — background icon wallpaper, strictly behind everything */}
      <div className="fixed inset-0 z-0 overflow-hidden bg-neutral-900 pointer-events-none" aria-hidden="true">
        <SkincareFrameBorder palette={theme} />
      </div>

      {/* Layer 20 — foreground floating main content card.
          Edge-to-edge on mobile (no gutter/border/shadow so the app
          reads as true 100%-width there); the floating "card lifted
          off a dark wallpaper" treatment — gutter, rounded corners,
          border, heavy drop-shadow — only engages at md+ so the
          z-index layer structure itself is unchanged either way. */}
      <div className="fixed inset-0 z-20 flex items-stretch justify-center p-0 md:p-6 pointer-events-none">
        <div
          className="relative z-20 my-0 mx-auto w-full max-w-6xl rounded-none md:rounded-3xl overflow-hidden overflow-y-auto overflow-x-hidden shadow-none md:shadow-[0_20px_60px_rgba(0,0,0,0.4)] border-0 md:border md:border-white/20 pointer-events-auto"
          style={{ background: theme.cream || "#FBF7F1" }}
        >
          {content}
        </div>
      </div>
    </div>
  );
}
