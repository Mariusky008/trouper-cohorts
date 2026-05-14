import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const normalizedSlug = String(slug || "").trim().toLowerCase();
  if (!normalizedSlug) return new Response("Not found", { status: 404 });

  const supabase = createAdminClient();
  const { data: site, error } = await supabase
    .from("human_vitrine_sites")
    .select("slug,status,storage_prefix")
    .eq("slug", normalizedSlug)
    .maybeSingle();

  const status = String(site?.status || "").trim();
  if (error || !site || !["uploaded", "approved", "sent"].includes(status)) {
    return new Response("Not found", { status: 404 });
  }

  const storagePrefix = String(site.storage_prefix || normalizedSlug).trim() || normalizedSlug;
  const htmlPath = `${storagePrefix.replace(/\/+$/g, "")}/index.html`;

  const { data: file, error: downloadError } = await supabase.storage.from("vitrines").download(htmlPath);
  if (downloadError || !file) return new Response("Not found", { status: 404 });

  const html = await file.text();
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
