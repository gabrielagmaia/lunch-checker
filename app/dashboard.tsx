"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Beef,
  Calendar,
  Check,
  Drumstick,
  EggFried,
  ExternalLink,
  GraduationCap,
  Info,
  Loader2,
  Pizza,
  Salad,
  Sandwich,
  Search,
  Soup,
  Sparkles,
  Utensils,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from "lucide-react";

export type SchoolSummary = {
  id: number;
  name: string;
  slug: string;
  abbreviation: string;
  city: string;
  address: string;
};

type LunchDay = {
  day: string;
  items: string[];
};

type MenuState =
  | { state: "loading" }
  | { state: "ok"; days: LunchDay[] }
  | { state: "empty" }
  | { state: "error" };

const MAX_SELECT = 3;

function pickIcon(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes("pizza")) return Pizza;
  if (
    n.includes("chicken") ||
    n.includes("nugget") ||
    n.includes("tender") ||
    n.includes("corn dog") ||
    n.includes("drumstick") ||
    n.includes("turkey")
  )
    return Drumstick;
  if (
    n.includes("burger") ||
    n.includes("beef") ||
    n.includes("pork") ||
    n.includes("steak") ||
    n.includes("meatball") ||
    n.includes("sausage") ||
    n.includes("ham")
  )
    return Beef;
  if (n.includes("sandwich") || n.includes("wrap") || n.includes("sub"))
    return Sandwich;
  if (
    n.includes("salad") ||
    n.includes("vegg") ||
    n.includes("broccoli") ||
    n.includes("carrot") ||
    n.includes("green")
  )
    return Salad;
  if (
    n.includes("soup") ||
    n.includes("mac") ||
    n.includes("pasta") ||
    n.includes("alfredo") ||
    n.includes("cheese")
  )
    return Soup;
  if (
    n.includes("egg") ||
    n.includes("pancake") ||
    n.includes("waffle") ||
    n.includes("french toast") ||
    n.includes("breakfast")
  )
    return EggFried;
  return UtensilsCrossed;
}

function mealviewerUrl(slug: string): string {
  return `https://schools.mealviewer.com/school/${slug}`;
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function weekRangeLabel(): string {
  const now = new Date();
  const day = now.getDay();
  const monOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + monOffset);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const startStr = `${MONTH_NAMES[monday.getMonth()]} ${monday.getDate()}`;
  const endStr =
    monday.getMonth() === friday.getMonth()
      ? `${friday.getDate()}`
      : `${MONTH_NAMES[friday.getMonth()]} ${friday.getDate()}`;
  return `${startStr} – ${endStr}`;
}

export default function Dashboard({
  schools,
}: {
  schools: SchoolSummary[] | null;
}) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 via-sky-50 to-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <BrandHeader />
        {schools === null ? <DistrictError /> : <DashboardBody schools={schools} />}
      </div>
    </main>
  );
}

function BrandHeader() {
  return (
    <header className="mb-8 flex items-start gap-3 sm:mb-10 sm:gap-4">
      <div className="shrink-0 rounded-xl bg-blue-900 p-2.5 shadow-sm shadow-blue-900/20 sm:p-3">
        <Utensils className="h-5 w-5 text-white sm:h-6 sm:w-6" />
      </div>
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-blue-950 sm:text-3xl">
          Lunch Checker
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Compare this week&apos;s lunch menus across Orange County public schools.
        </p>
      </div>
    </header>
  );
}

function DistrictError() {
  return (
    <section className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-5 shadow-sm shadow-amber-100/60 sm:gap-4 sm:px-6">
      <div className="shrink-0 rounded-lg bg-amber-100 p-2 ring-1 ring-inset ring-amber-200">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-blue-950">
          We couldn&apos;t load the school list
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-700">
          The Orange County FL district feed is unavailable right now. Please refresh in a few minutes.
        </p>
      </div>
    </section>
  );
}

function DashboardBody({ schools }: { schools: SchoolSummary[] }) {
  const [selected, setSelected] = useState<SchoolSummary[]>([]);
  const [view, setView] = useState<"picker" | "results">("picker");
  const [menus, setMenus] = useState<Record<string, MenuState>>({});
  const [isComparing, setIsComparing] = useState(false);

  function toggle(school: SchoolSummary) {
    setSelected((curr) => {
      if (curr.some((s) => s.slug === school.slug)) {
        return curr.filter((s) => s.slug !== school.slug);
      }
      if (curr.length >= MAX_SELECT) return curr;
      return [...curr, school];
    });
  }

  async function compare() {
    if (selected.length === 0 || isComparing) return;
    setIsComparing(true);

    const initial: Record<string, MenuState> = {};
    for (const s of selected) initial[s.slug] = { state: "loading" };
    setMenus(initial);

    selected.forEach(async (school) => {
      try {
        const res = await fetch(`/api/menu/${school.slug}`);
        if (!res.ok) {
          setMenus((prev) => ({ ...prev, [school.slug]: { state: "error" } }));
          return;
        }
        const data = (await res.json()) as LunchDay[];
        setMenus((prev) => ({
          ...prev,
          [school.slug]: data.length === 0 ? { state: "empty" } : { state: "ok", days: data },
        }));
      } catch {
        setMenus((prev) => ({ ...prev, [school.slug]: { state: "error" } }));
      }
    });

    await new Promise((r) => setTimeout(r, 280));
    setView("results");
    setIsComparing(false);
  }

  function back() {
    setView("picker");
  }

  if (view === "picker") {
    return (
      <PickerView
        schools={schools}
        selected={selected}
        onToggle={toggle}
        onCompare={compare}
        isComparing={isComparing}
      />
    );
  }

  return (
    <ComparisonView selected={selected} menus={menus} onBack={back} />
  );
}

function PickerView({
  schools,
  selected,
  onToggle,
  onCompare,
  isComparing,
}: {
  schools: SchoolSummary[];
  selected: SchoolSummary[];
  onToggle: (s: SchoolSummary) => void;
  onCompare: () => void;
  isComparing: boolean;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.abbreviation.toLowerCase().includes(q),
    );
  }, [schools, query]);

  const isFull = selected.length >= MAX_SELECT;

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm shadow-sky-100/60 sm:mb-8 sm:p-7">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3 sm:mb-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold tracking-tight text-blue-950 sm:text-xl">
              Pick up to {MAX_SELECT} schools to compare
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
  Browse {schools.length} Orange County FL schools. Choose up to {MAX_SELECT} schools to compare this week&apos;s lunch menus side by side.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-900 ring-1 ring-inset ring-blue-100">
            {selected.length} of {MAX_SELECT} selected
          </span>
        </div>

        <div className="relative mb-5">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-600" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by school name, city, or abbreviation"
            className="w-full rounded-xl border border-sky-200 bg-white py-3 pl-10 pr-4 text-sm text-blue-950 placeholder:text-slate-400 shadow-sm shadow-sky-100/60 transition-colors hover:border-teal-300 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
          />
        </div>

        {selected.length > 0 && (
          <div className="mb-5 rounded-xl bg-teal-50/60 p-3 ring-1 ring-inset ring-teal-100">
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-teal-800/80">
              Selected
            </p>
            <div className="flex flex-wrap gap-2">
              {selected.map((s) => (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => onToggle(s)}
                  className="group inline-flex max-w-full items-center gap-2 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 py-1.5 pl-3 pr-2 text-xs font-semibold text-white shadow-sm shadow-teal-500/30 ring-1 ring-inset ring-teal-400/30 transition-transform hover:-translate-y-0.5 hover:shadow-md hover:shadow-teal-500/40"
                  aria-label={`Remove ${s.name}`}
                >
                  <GraduationCap className="h-3.5 w-3.5 shrink-0 text-white/90" />
                  <span className="max-w-[12rem] truncate sm:max-w-[16rem]">{s.name}</span>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 transition-colors group-hover:bg-white/30">
                    <X className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="max-h-[22rem] overflow-y-auto rounded-xl border border-sky-100 sm:max-h-[28rem]">
          {filtered.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No schools match &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <ul className="divide-y divide-sky-50">
              {filtered.map((school) => {
                const isSelected = selected.some((s) => s.slug === school.slug);
                const disabled = !isSelected && isFull;
                return (
                  <li key={school.slug}>
                    <button
                      type="button"
                      onClick={() => onToggle(school)}
                      disabled={disabled}
                      className={
                        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors " +
                        (isSelected
                          ? "bg-teal-50 hover:bg-teal-100"
                          : disabled
                            ? "cursor-not-allowed opacity-50"
                            : "hover:bg-sky-50")
                      }
                    >
                      <span
                        className={
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border " +
                          (isSelected
                            ? "border-teal-500 bg-teal-500 text-white"
                            : "border-sky-200 bg-white")
                        }
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-blue-950">
                            {school.name}
                          </span>
                          {school.abbreviation && (
                            <span className="rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-900/70">
                              {school.abbreviation}
                            </span>
                          )}
                        </div>
                        {school.city && (
                          <p className="truncate text-xs text-slate-500">
                            {school.city}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
        <p className="text-center text-xs text-slate-500 sm:text-right">
          {selected.length === 0
            ? "Select at least one school to continue."
            : `Ready to compare ${selected.length} ${selected.length === 1 ? "school" : "schools"}.`}
        </p>
        <button
          type="button"
          onClick={onCompare}
          disabled={selected.length === 0 || isComparing}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-900 to-blue-800 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-900/25 ring-1 ring-inset ring-white/10 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-900/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-md sm:w-auto"
        >
          {isComparing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Preparing comparison…</span>
            </>
          ) : (
            <>
              <span>Compare selected schools</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function ComparisonView({
  selected,
  menus,
  onBack,
}: {
  selected: SchoolSummary[];
  menus: Record<string, MenuState>;
  onBack: () => void;
}) {
  const gridCols =
    selected.length === 1
      ? "md:grid-cols-1"
      : selected.length === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-2 lg:grid-cols-3";

  const weekLabel = weekRangeLabel();

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wider text-blue-900/80 shadow-sm shadow-sky-100/60 transition-colors hover:border-teal-300 hover:bg-sky-50 hover:text-teal-700 sm:mb-7"
      >
        <ArrowLeft className="h-3.5 w-3.5 text-teal-600" />
        Back to school selection
      </button>

      <section className="mb-6 overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-white via-white to-sky-50/40 shadow-sm shadow-sky-100/60 sm:mb-7">
        <div className="px-5 py-6 sm:px-7 sm:py-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-900 ring-1 ring-inset ring-blue-100">
                <Calendar className="h-3 w-3 text-blue-700" />
                Week of {weekLabel}
              </span>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-blue-950 sm:text-3xl">
                Weekly lunch comparison
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {selected.length === 1
                  ? "Showing this week's lunch menu for the school you picked."
                  : `Comparing ${selected.length} Orange County FL schools side by side.`}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 ring-1 ring-inset ring-teal-200">
              <GraduationCap className="h-3.5 w-3.5 text-teal-600" />
              {selected.length} of {MAX_SELECT}
            </span>
          </div>
        </div>
        <div className="border-t border-sky-100 bg-white/50 px-5 py-4 sm:px-7">
          <div className="flex flex-wrap gap-2">
            {selected.map((s) => (
              <SchoolPill key={s.slug} school={s} />
            ))}
          </div>
        </div>
      </section>

      <SmartInsights selected={selected} menus={menus} />

      <div className={`grid gap-5 sm:gap-6 ${gridCols}`}>
        {selected.map((school) => (
          <SchoolCard
            key={school.slug}
            school={school}
            menu={menus[school.slug] ?? { state: "loading" }}
          />
        ))}
      </div>
    </div>
  );
}

function SchoolPill({ school }: { school: SchoolSummary }) {
  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-lg border border-sky-100 bg-white px-2.5 py-1.5 shadow-sm shadow-sky-100/40">
      <div className="shrink-0 rounded bg-teal-50 p-1 ring-1 ring-inset ring-teal-100">
        <GraduationCap className="h-3 w-3 text-teal-600" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold leading-tight text-blue-950">
          {school.name}
        </p>
        {school.city && (
          <p className="truncate text-[10px] leading-tight text-slate-500">
            {school.city}
          </p>
        )}
      </div>
    </div>
  );
}

function SchoolCard({
  school,
  menu,
}: {
  school: SchoolSummary;
  menu: MenuState;
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm shadow-sky-100/60">
      <div className="flex items-center gap-3 border-b border-sky-100 bg-gradient-to-r from-sky-50/70 to-white px-5 py-4 sm:px-6 sm:py-5">
        <div className="shrink-0 rounded-lg bg-teal-50 p-2 ring-1 ring-inset ring-teal-100">
          <GraduationCap className="h-5 w-5 text-teal-600" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="min-w-0 truncate text-base font-semibold text-blue-950">
              {school.name}
            </h2>
            {school.abbreviation && (
              <span className="shrink-0 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-900/70">
                {school.abbreviation}
              </span>
            )}
          </div>
          {school.city && (
            <p className="truncate text-xs text-slate-500">{school.city}</p>
          )}
        </div>
      </div>

      <div className="flex-1">
        <CardBody menu={menu} />
      </div>

      <div className="border-t border-sky-100 px-5 py-3 sm:px-6">
        <a
          href={mealviewerUrl(school.slug)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 transition-colors hover:text-teal-900"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View source menu
        </a>
      </div>
    </article>
  );
}

function CardBody({ menu }: { menu: MenuState }) {
  if (menu.state === "loading") {
    return (
      <div className="flex items-center gap-3 px-5 py-8 sm:px-6">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-teal-600" />
        <span className="text-sm text-slate-600">Loading this week&apos;s menu…</span>
      </div>
    );
  }

  if (menu.state === "error") {
    return (
      <div className="flex items-start gap-3 px-5 py-8 sm:px-6">
        <div className="shrink-0 rounded-md bg-amber-50 p-2 ring-1 ring-inset ring-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-blue-950">
            We couldn&apos;t load this menu
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            The school&apos;s meal service is unavailable right now. Try again in a few minutes.
          </p>
        </div>
      </div>
    );
  }

  if (menu.state === "empty") {
    return (
      <div className="flex items-start gap-3 px-5 py-8 sm:px-6">
        <div className="shrink-0 rounded-md bg-sky-50 p-2 ring-1 ring-inset ring-sky-100">
          <Info className="h-4 w-4 text-blue-700" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-blue-950">
            No lunch items posted
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            This school hasn&apos;t published a lunch menu for this week yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-sky-50">
      {menu.days.map(({ day, items }) => {
        const Icon = pickIcon(items[0] ?? "");
        return (
          <li
            key={day}
            className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-sky-50/50 sm:items-center sm:gap-4 sm:px-6 sm:py-4"
          >
            <span className="w-20 shrink-0 pt-0.5 text-xs font-semibold uppercase tracking-wider text-blue-900/60 sm:pt-0">
              {day}
            </span>
            <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
              <div className="shrink-0 rounded-md bg-sky-50 p-2 ring-1 ring-inset ring-sky-100">
                <Icon className="h-4 w-4 text-blue-700" />
              </div>
              <span className="min-w-0 break-words text-sm font-medium leading-snug text-slate-800">
                {items.join(" · ")}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const FOOD_KEYWORDS = [
  "pizza",
  "chicken",
  "burger",
  "sandwich",
  "cheese",
  "pasta",
  "taco",
  "salad",
  "soup",
  "wrap",
  "nugget",
  "beef",
  "pork",
  "fish",
  "turkey",
  "rice",
  "noodle",
  "egg",
  "ham",
  "hot dog",
  "corn dog",
  "mac",
  "tender",
  "wing",
  "meatball",
];

function findKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  return FOOD_KEYWORDS.filter((kw) => new RegExp(`\\b${kw}\\b`).test(lower));
}

type OkMenu = { name: string; days: LunchDay[] };

function pizzaDaysSummary(menus: OkMenu[]): { day: string; schools: string[] }[] {
  const map = new Map<string, Set<string>>();
  for (const m of menus) {
    for (const d of m.days) {
      const text = d.items.join(" ").toLowerCase();
      if (/\bpizza\b/.test(text)) {
        const set = map.get(d.day) ?? new Set<string>();
        set.add(m.name);
        map.set(d.day, set);
      }
    }
  }
  return Array.from(map.entries()).map(([day, set]) => ({
    day,
    schools: Array.from(set),
  }));
}

function topKeywordSummary(menus: OkMenu[]): { keyword: string; count: number } | null {
  const counts = new Map<string, number>();
  for (const m of menus) {
    for (const d of m.days) {
      const text = d.items.join(" ").toLowerCase();
      const found = new Set(findKeywords(text));
      for (const kw of found) counts.set(kw, (counts.get(kw) ?? 0) + 1);
    }
  }
  let top: { keyword: string; count: number } | null = null;
  for (const [k, v] of counts) {
    if (!top || v > top.count) top = { keyword: k, count: v };
  }
  return top;
}

function sharedDaysSummary(menus: OkMenu[]): { day: string; keyword: string }[] {
  if (menus.length < 2) return [];

  const dayKwCount = new Map<string, Map<string, number>>();
  for (const m of menus) {
    for (const d of m.days) {
      const text = d.items.join(" ").toLowerCase();
      const found = new Set(findKeywords(text));
      const kwCount = dayKwCount.get(d.day) ?? new Map<string, number>();
      for (const kw of found) kwCount.set(kw, (kwCount.get(kw) ?? 0) + 1);
      dayKwCount.set(d.day, kwCount);
    }
  }

  const out: { day: string; keyword: string }[] = [];
  for (const [day, kwCount] of dayKwCount) {
    let bestKw: string | null = null;
    let bestCount = 1;
    for (const [kw, cnt] of kwCount) {
      if (cnt >= 2 && cnt > bestCount) {
        bestKw = kw;
        bestCount = cnt;
      }
    }
    if (bestKw) out.push({ day, keyword: bestKw });
  }
  return out;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function SmartInsights({
  selected,
  menus,
}: {
  selected: SchoolSummary[];
  menus: Record<string, MenuState>;
}) {
  const isLoading = selected.some((s) => menus[s.slug]?.state === "loading");
  const okMenus: OkMenu[] = selected.flatMap((s) => {
    const m = menus[s.slug];
    return m?.state === "ok" ? [{ name: s.name, days: m.days }] : [];
  });

  if (isLoading) {
    return (
      <section className="mb-6 flex items-center gap-3 rounded-2xl border border-sky-100 bg-white px-5 py-4 shadow-sm shadow-sky-100/60 sm:mb-7 sm:px-6 sm:py-5">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-teal-600" />
        <span className="text-sm text-slate-600">
          Analyzing this week&apos;s menus…
        </span>
      </section>
    );
  }

  if (okMenus.length === 0) return null;

  const pizza = pizzaDaysSummary(okMenus);
  const common = topKeywordSummary(okMenus);
  const shared = sharedDaysSummary(okMenus);

  return (
    <section className="mb-6 rounded-2xl border border-sky-100 bg-white px-5 py-5 shadow-sm shadow-sky-100/60 sm:mb-7 sm:px-6 sm:py-6">
      <div className="mb-4 flex items-start gap-3 sm:mb-5">
        <div className="shrink-0 rounded-lg bg-teal-50 p-2 ring-1 ring-inset ring-teal-100">
          <Sparkles className="h-5 w-5 text-teal-600" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-blue-950 sm:text-lg">
            Smart insights
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Helpful patterns spotted across this week&apos;s selected menus.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <PizzaTile pizza={pizza} />
        <CommonTile common={common} />
        <SharedTile shared={shared} schoolCount={selected.length} />
      </div>
    </section>
  );
}

function PizzaTile({ pizza }: { pizza: { day: string; schools: string[] }[] }) {
  if (pizza.length === 0) {
    return (
      <InsightTile
        Icon={Pizza}
        accent="amber"
        label="Pizza days"
        value="No pizza this week"
        description="None of the selected schools list pizza on a weekday."
      />
    );
  }

  const days = pizza.map((p) => p.day);
  const totalAppearances = pizza.reduce((sum, p) => sum + p.schools.length, 0);
  return (
    <InsightTile
      Icon={Pizza}
      accent="amber"
      label="Pizza days"
      value={days.length === 1 ? days[0] : `${days.length} days`}
      chips={days.length > 1 ? days : undefined}
      description={`Pizza shows up on ${totalAppearances} ${totalAppearances === 1 ? "menu" : "menus"} this week.`}
    />
  );
}

function CommonTile({
  common,
}: {
  common: { keyword: string; count: number } | null;
}) {
  if (!common) {
    return (
      <InsightTile
        Icon={UtensilsCrossed}
        accent="sky"
        label="Most common"
        value="Variety this week"
        description="No single dish stands out across the menus."
      />
    );
  }
  const Icon = pickIcon(common.keyword);
  return (
    <InsightTile
      Icon={Icon}
      accent="sky"
      label="Most common"
      value={capitalize(common.keyword)}
      description={`Spotted in ${common.count} ${common.count === 1 ? "menu" : "menus"} this week.`}
    />
  );
}

function SharedTile({
  shared,
  schoolCount,
}: {
  shared: { day: string; keyword: string }[];
  schoolCount: number;
}) {
  if (schoolCount < 2) {
    return (
      <InsightTile
        Icon={Sparkles}
        accent="teal"
        label="Shared meals"
        value="Add another school"
        description="Pick at least two schools to spot overlapping dishes."
      />
    );
  }

  if (shared.length === 0) {
    return (
      <InsightTile
        Icon={Sparkles}
        accent="teal"
        label="Shared meals"
        value="No overlap"
        description="Each selected school serves something different this week."
      />
    );
  }

  const days = shared.map((s) => s.day);
  const kwCount = new Map<string, number>();
  for (const s of shared) kwCount.set(s.keyword, (kwCount.get(s.keyword) ?? 0) + 1);
  let topKw: string | null = null;
  let topCount = 0;
  for (const [k, v] of kwCount) {
    if (v > topCount) {
      topKw = k;
      topCount = v;
    }
  }

  return (
    <InsightTile
      Icon={Sparkles}
      accent="teal"
      label="Shared meals"
      value={days.length === 1 ? days[0] : `${days.length} days`}
      chips={days.length > 1 ? days : undefined}
      description={
        topKw
          ? `Often a ${topKw} match across the schools you selected.`
          : "Multiple schools share a dish on these days."
      }
    />
  );
}

const TILE_STYLES = {
  amber: {
    wrap: "border-amber-200 bg-gradient-to-br from-amber-50/80 to-amber-50/30",
    iconBg: "bg-amber-100",
    iconRing: "ring-amber-200",
    iconText: "text-amber-600",
    chipText: "text-amber-900",
    chipRing: "ring-amber-200",
  },
  sky: {
    wrap: "border-sky-200 bg-gradient-to-br from-sky-50/80 to-sky-50/30",
    iconBg: "bg-sky-100",
    iconRing: "ring-sky-200",
    iconText: "text-blue-700",
    chipText: "text-blue-900",
    chipRing: "ring-sky-200",
  },
  teal: {
    wrap: "border-teal-200 bg-gradient-to-br from-teal-50/80 to-teal-50/30",
    iconBg: "bg-teal-100",
    iconRing: "ring-teal-200",
    iconText: "text-teal-600",
    chipText: "text-teal-900",
    chipRing: "ring-teal-200",
  },
} as const;

function InsightTile({
  Icon,
  accent,
  label,
  value,
  chips,
  description,
}: {
  Icon: LucideIcon;
  accent: keyof typeof TILE_STYLES;
  label: string;
  value: string;
  chips?: string[];
  description: string;
}) {
  const styles = TILE_STYLES[accent];
  return (
    <div className={`flex flex-col rounded-xl border p-5 ${styles.wrap}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900/60">
          {label}
        </span>
        <div
          className={`shrink-0 rounded-md p-1.5 ring-1 ring-inset ${styles.iconBg} ${styles.iconRing}`}
        >
          <Icon className={`h-3.5 w-3.5 ${styles.iconText}`} />
        </div>
      </div>
      <p className="mt-3 break-words text-lg font-bold tracking-tight text-blue-950 sm:text-xl">
        {value}
      </p>
      {chips && chips.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <span
              key={c}
              className={`inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${styles.chipText} ${styles.chipRing}`}
            >
              <Calendar className={`h-3 w-3 ${styles.iconText}`} />
              {c}
            </span>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs leading-relaxed text-slate-600">{description}</p>
    </div>
  );
}

function formatList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
