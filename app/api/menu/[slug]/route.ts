import { NextRequest } from "next/server";

export type LunchDay = {
  day: string;
  items: string[];
};

type RawFoodItem = { item_Name?: unknown };
type RawCafeteriaLine = { foodItemList?: { data?: RawFoodItem[] } };
type RawMenuBlock = {
  blockName?: string;
  cafeteriaLineList?: { data?: RawCafeteriaLine[] };
};
type RawSchedule = {
  dateInformation?: { weekDayName?: string };
  menuBlocks?: RawMenuBlock[];
};
type RawMealViewerResponse = { menuSchedules?: RawSchedule[] };

function formatDate(d: Date): string {
  const m = d.getMonth() + 1;
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}-${day}-${d.getFullYear()}`;
}

function currentWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const monOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + monOffset);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  return { start: formatDate(monday), end: formatDate(friday) };
}

function parseLunch(json: RawMealViewerResponse): LunchDay[] {
  const schedules = json.menuSchedules ?? [];
  const out: LunchDay[] = [];

  for (const day of schedules) {
    const lunch = day.menuBlocks?.find((b) => b.blockName === "Lunch");
    if (!lunch) continue;

    const mainLine = lunch.cafeteriaLineList?.data?.[0];
    const items = mainLine?.foodItemList?.data ?? [];

    const top2 = items
      .map((i) => i.item_Name)
      .filter((n): n is string => typeof n === "string" && n.length > 0)
      .slice(0, 2);

    if (top2.length === 0) continue;

    out.push({
      day: day.dateInformation?.weekDayName ?? "",
      items: top2,
    });
  }

  return out;
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;

  if (!/^[A-Za-z0-9_-]+$/.test(slug)) {
    return Response.json({ error: "invalid slug" }, { status: 400 });
  }

  const { start, end } = currentWeekRange();
  const url = `https://api.mealviewer.com/api/v4/school/${slug}/${start}/${end}/0`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return Response.json(
        { error: `upstream returned ${res.status}` },
        { status: 502 },
      );
    }
    const json = (await res.json()) as RawMealViewerResponse;
    const days = parseLunch(json);
    return Response.json(days);
  } catch {
    return Response.json({ error: "fetch failed" }, { status: 502 });
  }
}
