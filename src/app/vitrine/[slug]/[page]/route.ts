import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ slug: string; page: string }>;
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

function injectScrollToSection(html: string, sectionId: string) {
  const id = String(sectionId || "").trim().replace(/[^a-z0-9_-]/gi, "");
  if (!id || id === "accueil" || id === "home") return html;
  const script = `<script>(function(){try{var id=${JSON.stringify(
    id,
  )};var el=document.getElementById(id);if(!el){return;}setTimeout(function(){el.scrollIntoView({behavior:'smooth',block:'start'});},50);}catch(e){}})();</script>`;
  const text = String(html || "");
  if (text.includes(script)) return text;
  if (text.includes("</body>")) return text.replace("</body>", `${script}</body>`);
  return text + script;
}

function injectPageMode(html: string, sectionId: string) {
  const id = String(sectionId || "").trim().replace(/[^a-z0-9_-]/gi, "");
  if (!id || id === "accueil" || id === "home") return html;
  const css = `<style id="page-mode">body[data-page-mode="1"] section{display:none}body[data-page-mode="1"] section#accueil{display:block}body[data-page-mode="1"] section#${id}{display:block}body[data-page-mode="1"] section#contact{display:block}</style>`;
  const js = `<script>(function(){try{document.body.setAttribute('data-page-mode','1');}catch(e){}})();</script>`;
  let out = String(html || "");
  if (out.includes('id="page-mode"')) return out;
  if (out.includes("</head>")) out = out.replace("</head>", `${css}</head>`);
  if (out.includes("</body>")) out = out.replace("</body>", `${js}</body>`);
  else out = out + js;
  return out;
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug, page } = await context.params;
  const normalizedSlug = String(slug || "").trim().toLowerCase();
  const normalizedPage = String(page || "").trim().toLowerCase();
  if (!normalizedSlug || !normalizedPage) return new Response("Not found", { status: 404 });

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
  const withLinks = rewriteInternalLinks(withAssets, `/${normalizedSlug}`);
  const withPageMode = injectPageMode(withLinks, normalizedPage);
  const html = injectScrollToSection(withPageMode, normalizedPage);
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
