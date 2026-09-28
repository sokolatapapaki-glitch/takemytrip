import { readCity } from "@/lib/cityStore";
import ActivityList from "@/components/ActivityList";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CityPage({ params }: { params: Promise<{ cityId: string }> }) {
  const { cityId } = await params;
  let city;
  try { city = await readCity(cityId); } catch { notFound(); }
  return (
    <div>
      <a href="/" style={{ fontSize: 13 }}>← Πόλεις</a>
      <ActivityList city={city!} cityId={cityId} />
    </div>
  );
}
