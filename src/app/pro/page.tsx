// App PRO Popey v3 (espace commerçant : Activité, Valider, Coup de feu, Offres, Fidélité).
// Sert popey-pro-v3.html en iframe plein écran. Accès par lien magique : ?p=<slug> ou ?token=<token>.
type Props = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function PopeyProAppPage({ searchParams }: Props) {
  const sp = (await searchParams) || {};
  const query = new URLSearchParams();
  query.set("v", "20260617-pro-fans");
  for (const [key, rawValue] of Object.entries(sp)) {
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
        title="Popey — Espace Pro"
        src={`/popey-pro-v3.html?${query.toString()}`}
        className="h-full w-full border-0"
      />
    </main>
  );
}
