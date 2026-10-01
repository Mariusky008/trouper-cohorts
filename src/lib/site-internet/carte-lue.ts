/**
 * 📖 SA CARTE ET SES PRIX, LUS SUR LES PHOTOS DE SA FICHE GOOGLE.
 *
 * « Ça n'a pas récupéré la carte et les prix. » Sur sa fiche Google, on voit
 * pourtant ses plats et leurs prix — mais le robot d'Apify ne rend que le prix
 * moyen par personne et, parfois, un lien. LA CARTE, ELLE, EST EN PHOTO : la
 * page de menu imprimée, l'ardoise, le tableau. Les commerçants la
 * photographient et la publient sur leur fiche ; elle arrive parmi ses photos.
 *
 * ON LA FAIT LIRE PAR UN MODÈLE QUI VOIT. Ses photos de fiche lui sont
 * montrées ; il repère celles qui sont une carte et recopie les plats LISIBLES
 * avec leur prix exact. Une fraction de centime, une fois, après la lecture de
 * la fiche.
 *
 * CE QU'ON S'INTERDIT : compléter. Un prix illisible reste absent, un plat
 * deviné n'entre pas. Et la page le dit — « Lue sur les photos de sa carte ·
 * prix à confirmer sur place » — parce qu'une carte photographiée peut dater.
 * Dès qu'il saisit ses plats dans son Espace Pro, ce sont les siens qui
 * s'affichent.
 *
 * FICHIER SERVEUR.
 */
import { createAdminClient } from "@/lib/supabase/admin";

const s = (v: unknown) => (v == null ? "" : String(v)).trim();

export type PlatLu = { rubrique?: string; nom: string; prix?: string; detail?: string };

/** Ce que la page sait de la carte lue : les plats, et d'où ils viennent. */
export function carteLueDuDiagnostic(diag: unknown): PlatLu[] {
  const d = diag && typeof diag === "object" ? (diag as Record<string, unknown>) : {};
  const c = d.carte_lue && typeof d.carte_lue === "object" ? (d.carte_lue as Record<string, unknown>) : null;
  const plats = Array.isArray(c?.plats) ? (c?.plats as unknown[]) : [];
  return plats
    .map((p) => (p && typeof p === "object" ? (p as Record<string, unknown>) : {}))
    .map((p) => ({
      rubrique: s(p.rubrique).slice(0, 40) || undefined,
      nom: s(p.nom).slice(0, 90),
      prix: s(p.prix).slice(0, 20) || undefined,
      detail: s(p.detail).slice(0, 140) || undefined,
    }))
    .filter((p) => p.nom.length >= 2)
    .slice(0, 40);
}

/** Une photo, demandée à notre route photo-fiche (même porte que partout ailleurs). */
async function lire(src: string, origine: string): Promise<{ type: string; donnees: string } | null> {
  const adresse = /^https?:\/\//i.test(src) ? `${origine}/api/photo-fiche?u=${encodeURIComponent(src)}` : src.startsWith("/") ? `${origine}${src}` : "";
  if (!adresse) return null;
  try {
    const r = await fetch(adresse, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
    const type = (r.headers.get("content-type") || "").split(";")[0];
    if (!r.ok || !type.startsWith("image/")) return null;
    const octets = Buffer.from(await r.arrayBuffer());
    if (octets.length < 2_000 || octets.length > 6_000_000) return null;
    return { type, donnees: octets.toString("base64") };
  } catch {
    return null;
  }
}

const CONSIGNE = `Ces photos viennent de la fiche Google d'un restaurant ou d'un bar.
Certaines peuvent montrer SA CARTE : une page de menu, une ardoise, un tableau, un panneau de prix.
Recopie UNIQUEMENT les plats et boissons que tu lis clairement sur ces cartes, avec leur prix exact tel qu'écrit (ex. « 5,90 € »).
Règles :
- N'invente rien. Un plat illisible n'entre pas. Un prix illisible reste vide.
- Ne déduis rien des photos de plats servis : seulement ce qui est ÉCRIT sur une carte.
- « rubrique » = le titre de section tel qu'écrit sur la carte (« Entrées », « Tapas », « Desserts »), sinon vide.
- « detail » = la description courte écrite sous le plat, sinon vide.
- Au plus 40 lignes.
Réponds uniquement en JSON : {"plats":[{"rubrique":"","nom":"","prix":"","detail":""}]}. Si aucune carte n'est lisible : {"plats":[]}.`;

/** Faut-il (re)tenter la lecture ? Fiche lue, des photos, pas de carte, pas d'essai récent. */
export function carteALire(diag: unknown): boolean {
  const d = diag && typeof diag === "object" ? (diag as Record<string, unknown>) : {};
  const essai = Date.parse(s(d.carte_essai_at));
  return (
    d.places_found === true &&
    !d.carte_lue &&
    Array.isArray(d.photos) &&
    d.photos.length > 0 &&
    !(Number.isFinite(essai) && Date.now() - essai < 30 * 60_000)
  );
}

/**
 * LIT SA CARTE UNE FOIS, si ce n'est pas déjà fait et qu'il a des photos.
 * Rend le nombre de plats lus (0 si aucune carte lisible).
 */
export async function lireLaCarte(slug: string, origine: string): Promise<number> {
  const cle = s(process.env.GEMINI_API_KEY) || s(process.env.GOOGLE_API_KEY);
  if (!cle) return 0;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("human_vitrine_sites")
    .select("id, diagnostic")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const row = (data as Record<string, unknown> | null) ?? null;
  if (!row) return 0;
  const diag = (row.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;
  if (diag.carte_lue) return carteLueDuDiagnostic(diag).length;
  const photos = (Array.isArray(diag.photos) ? diag.photos : []).map(s).filter(Boolean).slice(0, 16);
  if (!photos.length) return 0;
  // UNE TENTATIVE PAR DEMI-HEURE AU PLUS : la page peut demander à chaque
  // visite, la lecture ne part qu'une fois. On note l'essai AVANT de payer.
  const essai = Date.parse(s(diag.carte_essai_at));
  if (Number.isFinite(essai) && Date.now() - essai < 30 * 60_000) return 0;
  await supabase
    .from("human_vitrine_sites")
    .update({ diagnostic: { ...diag, carte_essai_at: new Date().toISOString() } })
    .eq("id", s(row.id));

  const images = (await Promise.all(photos.map((p) => lire(p, origine)))).filter(Boolean) as { type: string; donnees: string }[];
  if (!images.length) return 0;
  const base = s(process.env.GEMINI_BASE_URL) || "https://generativelanguage.googleapis.com";
  const modele = s(process.env.GEMINI_VISION_MODEL) || "gemini-2.5-flash";
  let plats: PlatLu[] = [];
  let erreur = "";
  try {
    const r = await fetch(`${base}/v1beta/models/${modele}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": cle },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [...images.map((i) => ({ inlineData: { mimeType: i.type, data: i.donnees } })), { text: CONSIGNE }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!r.ok) erreur = `Gemini ${r.status}`;
    else {
      const j = (await r.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const texte = (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
      const brut = JSON.parse(texte.slice(texte.indexOf("{"), texte.lastIndexOf("}") + 1)) as { plats?: unknown };
      plats = carteLueDuDiagnostic({ carte_lue: { plats: brut.plats } });
    }
  } catch (e) {
    erreur = e instanceof Error ? e.message.slice(0, 160) : "lecture impossible";
  }
  // ON RELIT AVANT D'ÉCRIRE : la fiche ou la photo ClikMe ont pu écrire entre-temps.
  const { data: frais } = await supabase.from("human_vitrine_sites").select("diagnostic").eq("id", s(row.id)).maybeSingle();
  const d2 = ((frais as Record<string, unknown> | null)?.diagnostic ?? diag) as Record<string, unknown>;
  // UN ÉCHEC NE SE GRAVE PAS COMME « AUCUNE CARTE » : on garde la raison, et
  // la lecture pourra repartir à la prochaine visite (après la demi-heure).
  await supabase
    .from("human_vitrine_sites")
    .update({
      diagnostic: erreur
        ? { ...d2, carte_lue_erreur: erreur }
        : { ...d2, carte_lue: { plats, at: new Date().toISOString(), photos: images.length }, carte_lue_erreur: null },
    })
    .eq("id", s(row.id));
  return plats.length;
}
