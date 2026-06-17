// App client Popey v3 (plateforme de fidélité). Sert le HTML statique popey-app-v3.html
// dans une iframe plein écran, en passant la ville + le contexte de partage (ref_id…).
// L'ancienne app /privilege/[ville] reste en parallèle le temps de basculer.
type Props = {
  params: { ville: string } | Promise<{ ville: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function PopeyClientAppPage({ params, searchParams }: Props) {
  const resolvedParams = await Promise.resolve(params);
  const citySlug = String(resolvedParams?.ville || "dax").trim().toLowerCase() || "dax";
  const resolvedSearchParams = (await searchParams) || {};
  const query = new URLSearchParams();
  query.set("ville", citySlug);
  query.set("v", "20260617-cf-banner");
  for (const [key, rawValue] of Object.entries(resolvedSearchParams)) {
    if (!rawValue) continue;
    if (Array.isArray(rawValue)) {
      for (const item of rawValue) {
        if (typeof item === "string" && item.length > 0) query.append(key, item);
      }
    } else if (typeof rawValue === "string" && rawValue.length > 0) {
      query.set(key, rawValue);
    }
  }
  return (
    <main className="h-dvh w-full overflow-hidden bg-[#0B0D12]">
      <iframe
        title="Popey — Catalogue Privilège"
        src={`/popey-app-v3.html?${query.toString()}`}
        className="h-full w-full border-0"
      />
    </main>
  );
}
