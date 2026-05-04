type ScoutPreviewPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function toQueryString(searchParams: Record<string, string | string[] | undefined> | undefined) {
  const params = new URLSearchParams();
  if (!searchParams) return "";
  for (const [key, value] of Object.entries(searchParams)) {
    if (!value) continue;
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (typeof entry === "string" && entry.length > 0) params.append(key, entry);
      }
      continue;
    }
    if (typeof value === "string" && value.length > 0) params.set(key, value);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export default async function EclaireurWebappPreviewPage({ searchParams }: ScoutPreviewPageProps) {
  const resolved = (await searchParams) || {};
  const query = toQueryString(resolved);
  return (
    <main className="h-screen w-full overflow-hidden bg-[#07090C]">
      <iframe
        title="Popey Eclaireur Webapp Preview"
        src={`/popey-eclaireur-webapp-preview.html${query}`}
        className="h-full w-full border-0"
      />
    </main>
  );
}
