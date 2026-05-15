import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

function rewriteAssetUrls(html: string, assetBase: string) {
  const base = String(assetBase || "").trim();
  if (!base) return html;
  let out = String(html || "");
  out = out.replace(/(src|href)=(["'])(?:\.\/)?\/?assets\/([^"']+)\2/gi, (_m, attr: string, q: string, path: string) => {
    return `${attr}=${q}${base}${path}${q}`;
  });
  out = out.replace(/srcset=(["'])([^"']+)\1/gi, (_m, q: string, value: string) => {
    const next = String(value || "")
      .split(",")
      .map((part) => {
        const trimmed = part.trim();
        const [url, descriptor] = trimmed.split(/\s+/, 2);
        if (!url) return trimmed;
        const rewritten = url.replace(/^(?:\.\/)?\/?assets\//i, base);
        return descriptor ? `${rewritten} ${descriptor}` : rewritten;
      })
      .join(", ");
    return `srcset=${q}${next}${q}`;
  });
  out = out.replace(/url\(\s*(["']?)assets\/([^"')]+)\1\s*\)/gi, (_m, q: string, path: string) => {
    const quote = q || "";
    return `url(${quote}${base}${path}${quote})`;
  });
  out = out.replace(/url\(\s*(["']?)(?:\.\/)?\/?assets\/([^"')]+)\1\s*\)/gi, (_m, q: string, path: string) => {
    const quote = q || "";
    return `url(${quote}${base}${path}${quote})`;
  });
  return out;
}

function rewriteInternalLinks(html: string, pageBase: string) {
  const base = String(pageBase || "").trim();
  if (!base) return html;
  const baseWithSlash = base.endsWith("/") ? base : `${base}/`;
  return String(html || "").replace(/href=(["'])([^"']+)\1/gi, (m, q: string, href: string) => {
    const raw = String(href || "").trim();
    if (!raw) return m;
    const lower = raw.toLowerCase();
    if (
      lower.startsWith("http:") ||
      lower.startsWith("https:") ||
      lower.startsWith("mailto:") ||
      lower.startsWith("tel:") ||
      lower.startsWith("javascript:") ||
      lower.startsWith("data:") ||
      lower.startsWith("wa.me") ||
      lower.startsWith("whatsapp:")
    ) {
      return m;
    }
    if (raw.startsWith("/")) return m;

    if (raw.startsWith("#")) {
      const id = raw.slice(1).replace(/[^a-z0-9_-]/gi, "");
      if (!id) return m;
      return `href=${q}${baseWithSlash}${id}${q}`;
    }

    const withoutPrefix = raw.startsWith("./") ? raw.slice(2) : raw;
    const page = withoutPrefix.split(/[?#]/, 1)[0];
    if (!page) return m;
    if (page.startsWith("assets/")) return m;
    if (/\.[a-z0-9]{2,5}$/i.test(page)) return m;
    return `href=${q}${baseWithSlash}${page}${q}`;
  });
}

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

  const htmlRaw = await file.text();
  const withAssets = rewriteAssetUrls(htmlRaw, `/vitrine/${normalizedSlug}/assets/`);
  const html = rewriteInternalLinks(withAssets, `/${normalizedSlug}`);
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
