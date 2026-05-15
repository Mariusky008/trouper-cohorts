import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ slug: string; path: string[] }>;
};

function contentTypeForPath(value: string) {
  const ext = String(value || "").split(".").pop()?.toLowerCase() || "";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "svg") return "image/svg+xml";
  if (ext === "css") return "text/css";
  if (ext === "js") return "application/javascript";
  if (ext === "json") return "application/json";
  if (ext === "woff") return "font/woff";
  if (ext === "woff2") return "font/woff2";
  return "application/octet-stream";
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug, path } = await context.params;
  const normalizedSlug = String(slug || "").trim().toLowerCase();
  if (!normalizedSlug) return new Response("Not found", { status: 404 });
  if (!Array.isArray(path) || path.length === 0) return new Response("Not found", { status: 404 });
  if (path.some((part) => String(part).includes(".."))) return new Response("Not found", { status: 404 });

  const rel = path.map((part) => String(part || "").replace(/^\/+|\/+$/g, "")).filter(Boolean).join("/");
  if (!rel) return new Response("Not found", { status: 404 });

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
  const assetPath = `${storagePrefix.replace(/\/+$/g, "")}/assets/${rel}`;

  const { data: file, error: downloadError } = await supabase.storage.from("vitrines").download(assetPath);
  if (downloadError || !file) return new Response("Not found", { status: 404 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": contentTypeForPath(rel),
      "Cache-Control": "public, max-age=3600",
    },
  });
}

