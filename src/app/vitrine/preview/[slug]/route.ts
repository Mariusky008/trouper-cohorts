import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

function rewriteAssetUrls(html: string, assetBase: string, token: string) {
  const base = String(assetBase || "").trim();
  const t = String(token || "").trim();
  if (!base || !t) return html;
  const suffix = `?t=${encodeURIComponent(t)}`;
  let out = String(html || "");
  out = out.replace(/(src|href)=(["'])assets\/([^"']+)\2/gi, (_m, attr: string, q: string, path: string) => {
    return `${attr}=${q}${base}${path}${suffix}${q}`;
  });
  out = out.replace(/url\(\s*(["']?)assets\/([^"')]+)\1\s*\)/gi, (_m, q: string, path: string) => {
    const quote = q || "";
    return `url(${quote}${base}${path}${suffix}${quote})`;
  });
  return out;
}

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const normalizedSlug = String(slug || "").trim().toLowerCase();
  if (!normalizedSlug) return new Response("Not found", { status: 404 });

  const token = String(new URL(request.url).searchParams.get("t") || "").trim().toLowerCase();
  if (!token) return new Response("Not found", { status: 404 });

  const supabase = createAdminClient();
  const { data: site, error } = await supabase
    .from("human_vitrine_sites")
    .select("slug,preview_storage_prefix,preview_token")
    .eq("slug", normalizedSlug)
    .maybeSingle();

  const previewToken = String(site?.preview_token || "").trim().toLowerCase();
  if (error || !site || !previewToken || previewToken !== token) {
    return new Response("Not found", { status: 404 });
  }

  const storagePrefix = String(site.preview_storage_prefix || "").trim();
  if (!storagePrefix) return new Response("Not found", { status: 404 });

  const htmlPath = `${storagePrefix.replace(/\/+$/g, "")}/index.html`;
  const { data: file, error: downloadError } = await supabase.storage.from("vitrines").download(htmlPath);
  if (downloadError || !file) return new Response("Not found", { status: 404 });

  const htmlRaw = await file.text();
  const html = rewriteAssetUrls(htmlRaw, `/preview/${normalizedSlug}/assets/`, token);
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
