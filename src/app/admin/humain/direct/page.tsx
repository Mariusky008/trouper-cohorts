// LE DIRECT — pilotage des villes.
//
// Cette page existe pour une raison précise : les jetons d'espace ville sont
// générés en base et n'apparaissent NULLE PART ailleurs. Sans elle, personne ne
// peut envoyer son lien à une mairie, et l'espace ville — construit, testé,
// déployé — reste inaccessible pour toujours. Une fonctionnalité dont le seul
// point d'entrée est une requête SQL n'est pas une fonctionnalité.
//
// Elle sert aussi à régler le seuil du compteur et les quartiers, deux valeurs
// qui ne peuvent pas être devinées depuis le code : la première est éditoriale,
// la seconde est de la connaissance locale.
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/site-url";
import { villeSlug } from "@/lib/direct/ville";
import { VilleReglages, type VilleRow } from "./_components/ville-reglages";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const str = (v: unknown) => (v == null ? "" : String(v));

/**
 * Les publications encore vivantes, par ville, dont celles du jour.
 *
 * Hors du composant : une lecture d'horloge pendant le rendu rendrait le
 * résultat dépendant du moment où React se relance.
 */
function compterVivantes(pubs: Array<Record<string, unknown>>) {
  const maintenant = Date.now();
  const debutJour = new Date();
  debutJour.setHours(0, 0, 0, 0);
  const vivantes = new Map<string, { total: number; duJour: number }>();
  for (const p of pubs) {
    const fin = str(p.expire_le);
    if (fin && Date.parse(fin) <= maintenant) continue;
    const k = str(p.ville_slug);
    const e = vivantes.get(k) ?? { total: 0, duJour: 0 };
    e.total++;
    if (Date.parse(str(p.publie_le)) >= debutJour.getTime()) e.duJour++;
    vivantes.set(k, e);
  }
  return { vivantes };
}

export default async function AdminDirectPage() {
  const supabase = createAdminClient();

  const [cfgRes, sitesRes, pubsRes, habRes] = await Promise.all([
    supabase.from("human_villes_config").select("ville_slug, ville, seuil_compteur, quartiers, auteur_nom, admin_token").order("ville_slug"),
    supabase.from("human_vitrine_sites").select("city, latitude").eq("channel", "letter").eq("published", true).limit(1000),
    supabase.from("human_publications").select("ville_slug, publie_le, retire_le, expire_le").is("retire_le", null).limit(2000),
    supabase.from("human_habitants").select("ville_slug, email, confirmed_at, unsubscribed_at").limit(5000),
  ]);

  const rows = <T,>(d: unknown) => (Array.isArray(d) ? (d as T[]) : []);
  const erreur = cfgRes.error?.message || "";

  // Commerces par ville, et combien ont des coordonnées : sans elles, la
  // distance tombe toujours sur le repli — c'est le premier chiffre à regarder
  // quand quelqu'un dit « je ne vois jamais de distance ».
  const commerces = new Map<string, { total: number; situes: number }>();
  for (const s of rows<Record<string, unknown>>(sitesRes.data)) {
    const k = villeSlug(str(s.city));
    if (!k) continue;
    const e = commerces.get(k) ?? { total: 0, situes: 0 };
    e.total++;
    if (typeof s.latitude === "number") e.situes++;
    commerces.set(k, e);
  }

  const { vivantes } = compterVivantes(rows<Record<string, unknown>>(pubsRes.data));

  const abonnes = new Map<string, { total: number; confirmes: number }>();
  for (const h of rows<Record<string, unknown>>(habRes.data)) {
    if (!str(h.email) || str(h.unsubscribed_at)) continue;
    const k = str(h.ville_slug);
    const e = abonnes.get(k) ?? { total: 0, confirmes: 0 };
    e.total++;
    if (str(h.confirmed_at)) e.confirmes++;
    abonnes.set(k, e);
  }

  const villes: VilleRow[] = rows<Record<string, unknown>>(cfgRes.data).map((c) => {
    const slug = str(c.ville_slug);
    const com = commerces.get(slug) ?? { total: 0, situes: 0 };
    const viv = vivantes.get(slug) ?? { total: 0, duJour: 0 };
    const ab = abonnes.get(slug) ?? { total: 0, confirmes: 0 };
    return {
      slug,
      nom: str(c.ville) || slug,
      seuil: typeof c.seuil_compteur === "number" ? c.seuil_compteur : 12,
      quartiers: Array.isArray(c.quartiers) ? c.quartiers.map(str) : [],
      auteurNom: str(c.auteur_nom),
      lienEspace: `${SITE_URL}/direct-ville/${slug}?k=${str(c.admin_token)}`,
      lienDirect: `${SITE_URL}/ville/${slug}`,
      commerces: com.total,
      commercesSitues: com.situes,
      publications: viv.total,
      publicationsDuJour: viv.duJour,
      abonnes: ab.total,
      abonnesConfirmes: ab.confirmes,
    };
  });

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">100% Humain</p>
        <h1 className="mt-1 text-2xl font-black sm:text-3xl">Le Direct</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
          Les villes couvertes, leur lien d&apos;espace municipal, et les deux réglages qui ne peuvent
          pas être devinés depuis le code : le seuil du compteur et les quartiers.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border bg-slate-50 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Villes</p>
            <p className="mt-1 text-3xl font-black text-slate-950">{villes.length}</p>
          </div>
          <div className="rounded-2xl border bg-slate-50 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Publications vivantes</p>
            <p className="mt-1 text-3xl font-black text-slate-950">
              {villes.reduce((n, v) => n + v.publications, 0)}
            </p>
          </div>
          <div className="rounded-2xl border bg-slate-50 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Abonnés confirmés</p>
            <p className="mt-1 text-3xl font-black text-slate-950">
              {villes.reduce((n, v) => n + v.abonnesConfirmes, 0)}
            </p>
          </div>
        </div>
      </div>

      {erreur ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
          <strong>Configuration illisible.</strong> {erreur}
        </div>
      ) : villes.length === 0 ? (
        <div className="rounded-2xl border bg-white p-5 text-sm text-muted-foreground">
          Aucune ville configurée. La migration d&apos;amorçage crée une ligne par ville ayant au moins
          un commerce publié — si cette liste est vide, c&apos;est qu&apos;aucune fiche n&apos;est publiée
          avec un champ « ville » renseigné.
        </div>
      ) : (
        <VilleReglages villes={villes} />
      )}
    </section>
  );
}
