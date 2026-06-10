import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerUserIdWithProxyFallback } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PHOTO_BUCKET = "marketplace-privilege-offers";
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

function withStatus(base: string, status: "success" | "error", message: string) {
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}marketStatus=${encodeURIComponent(status)}&marketMessage=${encodeURIComponent(message)}`;
}

function toAbsolute(requestUrl: string, maybeRelative: string) {
  try {
    return new URL(maybeRelative, requestUrl);
  } catch {
    return new URL("/admin/humain/catalogue", requestUrl);
  }
}

function slugify(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isMissingTable(errorMessage: string) {
  const msg = String(errorMessage || "").toLowerCase();
  return (
    (msg.includes("human_privilege_tinder_profiles") || msg.includes("human_privilege_catalogue_settings")) &&
    (msg.includes("schema cache") || msg.includes("does not exist"))
  );
}

function safePhotoExtension(file: File): string {
  const fromName = String(file.name || "").split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(fromName)) return fromName;
  const mime = String(file.type || "").toLowerCase();
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "jpg";
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const currentUrl = String(formData.get("current_url") || "/admin/humain/catalogue");
  const intent = String(formData.get("intent") || "create").trim().toLowerCase();
  const profileId = String(formData.get("profile_id") || "").trim();

  const fail = (message: string) =>
    NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "error", message)), { status: 303 });
  const ok = (message: string) => {
    revalidatePath("/admin/humain/catalogue");
    revalidatePath("/privilege");
    return NextResponse.redirect(toAbsolute(request.url, withStatus(currentUrl, "success", message)), { status: 303 });
  };

  const userId = await getServerUserIdWithProxyFallback();
  if (!userId) return fail("Session requise.");

  const supabaseAdmin = createAdminClient();
  const { data: adminRow } = await supabaseAdmin.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (!adminRow) return fail("Acces admin requis.");

  // ── Réglage de la fréquence globale ──
  if (intent === "set_frequency") {
    const freqRaw = parseInt(String(formData.get("frequency") || "3"), 10);
    const frequency = Number.isFinite(freqRaw) ? Math.min(20, Math.max(1, freqRaw)) : 3;
    const { error } = await supabaseAdmin
      .from("human_privilege_catalogue_settings")
      .upsert({ key: "tinder_frequency", value: String(frequency), updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error && isMissingTable(error.message || "")) return fail("Table réglages absente. Exécute la migration SQL puis réessaie.");
    if (error) return fail(error.message || "Réglage impossible.");
    return ok(`Fréquence réglée : 1 profil tous les ${frequency} swipes.`);
  }

  if (intent === "delete") {
    if (!profileId) return fail("Profil introuvable.");
    const { error } = await supabaseAdmin.from("human_privilege_tinder_profiles").delete().eq("id", profileId);
    if (error && isMissingTable(error.message || "")) return fail("Table profils Tinder absente. Exécute la migration SQL puis réessaie.");
    if (error) return fail(error.message || "Suppression impossible.");
    return ok("Profil Tinder supprimé.");
  }

  if (intent === "toggle") {
    if (!profileId) return fail("Profil introuvable.");
    const nextStatus = String(formData.get("next_status") || "").trim();
    if (!["active", "inactive"].includes(nextStatus)) return fail("Statut invalide.");
    // On ne peut JAMAIS publier sans consentement explicite du commerçant.
    if (nextStatus === "active") {
      const { data: row } = await supabaseAdmin
        .from("human_privilege_tinder_profiles")
        .select("consent")
        .eq("id", profileId)
        .maybeSingle();
      if (!row || !(row as { consent?: boolean }).consent) {
        return fail("Consentement commerçant requis avant la mise en ligne. Coche la case dans le formulaire.");
      }
    }
    const { error } = await supabaseAdmin
      .from("human_privilege_tinder_profiles")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", profileId);
    if (error && isMissingTable(error.message || "")) return fail("Table profils Tinder absente. Exécute la migration SQL puis réessaie.");
    if (error) return fail(error.message || "Mise a jour impossible.");
    return ok(nextStatus === "active" ? "Profil mis en ligne." : "Profil mis hors ligne.");
  }

  // ── create / update ──
  const city = String(formData.get("city") || "").trim();
  const citySlug = slugify(city);
  const proName = String(formData.get("pro_name") || "").trim();
  const proTitle = String(formData.get("pro_title") || "").trim();
  const age = String(formData.get("age") || "").trim();
  const bio = String(formData.get("bio") || "").trim().slice(0, 220);
  const tags = String(formData.get("tags") || "").trim();
  const matchGift = String(formData.get("match_gift") || "").trim();
  const couponCode = String(formData.get("coupon_code") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const website = String(formData.get("website") || "").trim();
  const waPhone = String(formData.get("wa_phone") || "").replace(/[^0-9]/g, "");
  const compatRaw = parseInt(String(formData.get("compat") || "97"), 10);
  const compat = Number.isFinite(compatRaw) ? Math.min(100, Math.max(50, compatRaw)) : 97;
  const sortOrderRaw = parseInt(String(formData.get("sort_order") || "100"), 10);
  const sortOrder = Number.isFinite(sortOrderRaw) ? Math.max(0, sortOrderRaw) : 100;
  const consent = String(formData.get("consent") || "") === "on";
  const photoUrlRaw = String(formData.get("photo_url") || "").trim();
  const photoFileRaw = formData.get("photo_file");

  if (!city || !citySlug) return fail("Ville obligatoire.");
  if (!proName) return fail("Nom du commerçant obligatoire.");
  if (!proTitle) return fail("Métier · ville obligatoire.");

  let photoUrl = photoUrlRaw;
  if (photoFileRaw instanceof File && photoFileRaw.size > 0) {
    if (!String(photoFileRaw.type || "").startsWith("image/")) return fail("Le fichier photo doit être une image.");
    if (photoFileRaw.size > MAX_PHOTO_BYTES) return fail("La photo dépasse 8MB.");
    const ext = safePhotoExtension(photoFileRaw);
    const filePath = `privilege-tinder/${citySlug}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage.from(PHOTO_BUCKET).upload(filePath, photoFileRaw, {
      cacheControl: "3600",
      upsert: true,
      contentType: photoFileRaw.type || undefined,
    });
    if (uploadError) return fail(`Upload photo impossible: ${uploadError.message || "erreur storage"}`);
    const { data: publicData } = supabaseAdmin.storage.from(PHOTO_BUCKET).getPublicUrl(filePath);
    photoUrl = String(publicData?.publicUrl || "").trim();
  }

  const fields = {
    city,
    city_slug: citySlug,
    pro_name: proName,
    age: age || null,
    pro_title: proTitle,
    bio: bio || null,
    tags: tags || null,
    compat,
    match_gift: matchGift || null,
    coupon_code: couponCode || null,
    photo_url: photoUrl || null,
    address: address || null,
    phone: phone || null,
    website: website || null,
    wa_phone: waPhone || null,
    consent,
    updated_at: new Date().toISOString(),
    sort_order: sortOrder,
  };

  if (intent === "update") {
    if (!profileId) return fail("Profil introuvable.");
    // Si le consentement est retiré, on force le profil hors ligne.
    const payload = consent ? fields : { ...fields, status: "inactive" };
    const { error } = await supabaseAdmin.from("human_privilege_tinder_profiles").update(payload).eq("id", profileId);
    if (error && isMissingTable(error.message || "")) return fail("Table profils Tinder absente. Exécute la migration SQL puis réessaie.");
    if (error) return fail(error.message || "Mise a jour profil impossible.");
    return ok(consent ? "Profil Tinder mis à jour." : "Profil mis à jour (hors ligne : consentement décoché).");
  }

  // create : en ligne directement seulement si le consentement est coché.
  const insertPayload = { ...fields, status: consent ? "active" : "inactive" };
  const { error } = await supabaseAdmin.from("human_privilege_tinder_profiles").insert(insertPayload);
  if (error && isMissingTable(error.message || "")) return fail("Table profils Tinder absente. Exécute la migration SQL puis réessaie.");
  if (error) return fail(error.message || "Creation profil impossible.");
  return ok(consent ? "Profil Tinder créé et mis en ligne." : "Profil Tinder créé (hors ligne : coche le consentement pour publier).");
}
