import Dashboard, { type SchoolSummary } from "./dashboard";

const DISTRICT_URL =
  "https://api.mealviewer.com/api/v4/physicalLocation/district/OrangeCountyFL/1";

type RawSchool = {
  id?: number;
  name?: string;
  physicalLocationLookup?: string;
  physicalLocationAbbreviation?: string;
  city?: string;
  address?: string;
};
type RawDistrictResponse = { data?: RawSchool[] };

function parseSchools(json: RawDistrictResponse): SchoolSummary[] {
  const data = json.data ?? [];
  const out: SchoolSummary[] = [];
  for (const s of data) {
    if (
      typeof s.id !== "number" ||
      typeof s.name !== "string" ||
      typeof s.physicalLocationLookup !== "string" ||
      s.physicalLocationLookup.length === 0
    ) {
      continue;
    }
    out.push({
      id: s.id,
      name: s.name,
      slug: s.physicalLocationLookup,
      abbreviation: typeof s.physicalLocationAbbreviation === "string" ? s.physicalLocationAbbreviation : "",
      city: typeof s.city === "string" ? s.city : "",
      address: typeof s.address === "string" ? s.address : "",
    });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

async function fetchSchools(): Promise<SchoolSummary[] | null> {
  try {
    const res = await fetch(DISTRICT_URL, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as RawDistrictResponse;
    return parseSchools(json);
  } catch {
    return null;
  }
}

export default async function Page() {
  const schools = await fetchSchools();
  return <Dashboard schools={schools} />;
}
