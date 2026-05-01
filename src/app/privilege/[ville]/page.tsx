type PrivilegePageProps = {
  params: {
    ville: string;
  };
  searchParams?: {
    [key: string]: string | string[] | undefined;
  };
};

export default function PrivilegeByCityPage({ params, searchParams }: PrivilegePageProps) {
  const citySlug = String(params.ville || "dax").trim().toLowerCase() || "dax";
  const query = new URLSearchParams();
  query.set("ville", citySlug);
  if (searchParams) {
    for (const [key, rawValue] of Object.entries(searchParams)) {
      if (!rawValue) continue;
      if (Array.isArray(rawValue)) {
        for (const item of rawValue) {
          if (typeof item === "string" && item.length > 0) query.append(key, item);
        }
      } else if (typeof rawValue === "string" && rawValue.length > 0) {
        query.set(key, rawValue);
      }
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
