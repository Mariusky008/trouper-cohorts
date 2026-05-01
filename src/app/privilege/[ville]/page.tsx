type PrivilegePageProps = {
  params:
    | {
        ville: string;
      }
    | Promise<{
        ville: string;
      }>;
  searchParams?: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function PrivilegeByCityPage({ params, searchParams }: PrivilegePageProps) {
  const resolvedParams = await Promise.resolve(params);
  const citySlug = String(resolvedParams?.ville || "dax").trim().toLowerCase() || "dax";
  const resolvedSearchParams = (await searchParams) || {};
  const query = new URLSearchParams();
  query.set("ville", citySlug);
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
    <main className="h-screen w-full overflow-hidden bg-[#F8F5EE]">
      <iframe
        title="Popey Privilege Catalogue"
        src={`/popey-privilege-catalogue.html?${query.toString()}`}
        className="h-full w-full border-0"
      />
    </main>
  );
}
