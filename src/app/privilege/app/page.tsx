import { PrivilegeFreshGuard } from "@/components/privilege/privilege-fresh-guard";

type PrivilegeAppPageProps = {
  searchParams?: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

export default async function PrivilegeAppPage({ searchParams }: PrivilegeAppPageProps) {
  const resolvedSearchParams = (await searchParams) || {};
  const ville = String(resolvedSearchParams.ville || "dax").trim().toLowerCase() || "dax";
  const query = new URLSearchParams();
  query.set("ville", ville);
  query.set("v", "20260614-immersif-v34-mystvideo");
  for (const [key, rawValue] of Object.entries(resolvedSearchParams)) {
    if (!rawValue) continue;
    if (key === "ville") continue;
    if (Array.isArray(rawValue)) {
      for (const item of rawValue) {
        if (typeof item === "string" && item.length > 0) query.append(key, item);
      }
    } else if (typeof rawValue === "string" && rawValue.length > 0) {
      query.set(key, rawValue);
    }
  }
  return (
    <main className="h-dvh w-full overflow-hidden bg-[#F8F5EE]">
      <PrivilegeFreshGuard />
      <iframe
        title="Popey Privilege Catalogue"
        src={`/popey-privilege-catalogue.html?${query.toString()}`}
        className="h-full w-full border-0"
      />
    </main>
  );
}

