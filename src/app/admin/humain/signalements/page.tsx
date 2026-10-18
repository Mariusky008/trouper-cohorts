// 🚩 L'ÉCHANGE · LES SIGNALEMENTS — les bons non honorés, et les pauses à lever.
//
// Deux commerces différents signalent le même commerçant : ses offres passent en
// pause toutes seules (`20261025120000_echanges_signalements.sql`). Il ne peut pas
// les remettre en ligne lui-même. ClikMe lui parle, puis lève la pause ici, en
// disant ce qu'il conclut des signalements : non fondés, ou fondés (c'est réglé).
// Dans les deux cas son offre revient comme elle était, et son compte repart de zéro.
//
// Ici, et seulement ici, on voit QUI a signalé.
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { motifEnMots } from "@/lib/echanges/echanges";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Signalement = {
  id: string;
  bon_id: string;
  signale_par: string;
  fournisseur_id: string;
  motif: string;
  detail: string | null;
  statut: string;
  cree_le: string;
};
type Pause = { site_id: string; depuis: string; offre_active_avant: boolean };

async function lever(formulaire: FormData) {
  "use server";
  if (!(await isCurrentUserAdmin())) return;
  const site = String(formulaire.get("site") ?? "");
  const decision = String(formulaire.get("decision") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(site) || !["fonde", "rejete"].includes(decision)) return;
  await createAdminClient().rpc("echanges_lever_pause", { p_site: site, p_decision: decision });
  revalidatePath("/admin/humain/signalements");
}

/** Hors du composant : une lecture d'horloge pendant le rendu le rendrait impur. */
async function lire() {
  const supabase = createAdminClient();
  const { data: ls, error } = await supabase
    .from("human_echanges_signalements")
    .select("id, bon_id, signale_par, fournisseur_id, motif, detail, statut, cree_le")
    .order("cree_le", { ascending: false })
    .limit(300);
  if (error) return { absente: true as const };
  const signalements = (ls ?? []) as Signalement[];
  const { data: lz } = await supabase.from("human_echanges_pauses").select("site_id, depuis, offre_active_avant").is("levee_le", null).limit(200);
  const pauses = (lz ?? []) as Pause[];
  const ids = [...new Set([...signalements.flatMap((s) => [s.signale_par, s.fournisseur_id]), ...pauses.map((p) => p.site_id)])];
  const noms = new Map<string, string>();
  if (ids.length) {
    const { data: lo } = await supabase.from("human_echanges_offres").select("site_id, commerce, ville").in("site_id", ids.slice(0, 500));
    for (const o of (lo ?? []) as Array<{ site_id: string; commerce: string; ville: string }>) noms.set(o.site_id, o.ville ? `${o.commerce} (${o.ville})` : o.commerce);
  }
  const bonsIds = signalements.map((s) => s.bon_id);
  const titres = new Map<string, string>();
  if (bonsIds.length) {
    const { data: lb } = await supabase.from("human_echanges_bons").select("id, titre, prix").in("id", bonsIds.slice(0, 500));
    for (const b of (lb ?? []) as Array<{ id: string; titre: string; prix: number }>) titres.set(b.id, `${b.titre} · ${b.prix} €`);
  }
  return { absente: false as const, signalements, pauses, noms, titres };
}

const jour = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" }).format(new Date(iso));

export default async function Page() {
  const lu = await lire();
  if (lu.absente) {
    return (
      <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
        <h1 className="text-2xl font-black">L’échange · signalements</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          La migration <code>20261025120000_echanges_signalements.sql</code> n’est pas encore appliquée : rien à montrer.
        </p>
      </section>
    );
  }
  const { signalements, pauses, noms, titres } = lu;
  const nom = (id: string) => noms.get(id) ?? "Commerce inconnu";
  const enPause = new Set(pauses.map((p) => p.site_id));
  const ouvertsSansPause = signalements.filter((s) => s.statut === "ouvert" && !enPause.has(s.fournisseur_id));
  const traites = signalements.filter((s) => s.statut !== "ouvert").slice(0, 30);

  const Ligne = ({ s }: { s: Signalement }) => (
    <li className="rounded-xl border bg-slate-50 px-3 py-2 text-sm">
      <b>{motifEnMots(s.motif)}</b> · {titres.get(s.bon_id) ?? "bon"} · le {jour(s.cree_le)}
      <div className="text-slate-600">Signalé par {nom(s.signale_par)}</div>
      {s.detail && <div className="mt-1 text-slate-800">« {s.detail} »</div>}
    </li>
  );

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-rose-700">L’échange</p>
        <h1 className="mt-1 text-2xl font-black sm:text-3xl">Les signalements</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
          Un bon non honoré se signale par celui qui l’a pris. Deux commerces différents : les offres du commerçant passent en pause, et
          lui seul ne peut pas les remettre. Parlez-lui, puis levez la pause ici.
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-lg font-black">En pause · {pauses.length}</h2>
        {pauses.length === 0 && <p className="mt-2 text-sm text-muted-foreground">Aucun commerce en pause.</p>}
        <div className="mt-3 space-y-4">
          {pauses.map((p) => (
            <article key={p.site_id} className="rounded-2xl border p-4">
              <h3 className="font-black">{nom(p.site_id)}</h3>
              <p className="text-sm text-slate-600">
                En pause depuis le {jour(p.depuis)}
                {p.offre_active_avant ? "" : " · son offre était déjà hors ligne : elle le restera"}
              </p>
              <ul className="mt-2 space-y-2">
                {signalements
                  .filter((s) => s.fournisseur_id === p.site_id && s.statut === "ouvert")
                  .map((s) => (
                    <Ligne key={s.id} s={s} />
                  ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={lever}>
                  <input type="hidden" name="site" value={p.site_id} />
                  <input type="hidden" name="decision" value="rejete" />
                  <button type="submit" className="rounded-full border px-4 py-2 text-sm font-bold hover:bg-slate-50">
                    Lever la pause · non fondés
                  </button>
                </form>
                <form action={lever}>
                  <input type="hidden" name="site" value={p.site_id} />
                  <input type="hidden" name="decision" value="fonde" />
                  <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white">
                    Lever la pause · fondés, c’est réglé
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-lg font-black">Signalés une fois · {ouvertsSansPause.length}</h2>
        <p className="mt-1 text-sm text-muted-foreground">Pas encore de pause : un second commerce doit le signaler.</p>
        <ul className="mt-3 space-y-2">
          {ouvertsSansPause.map((s) => (
            <li key={s.id}>
              <div className="mb-1 text-sm font-black">{nom(s.fournisseur_id)}</div>
              <ul>
                <Ligne s={s} />
              </ul>
            </li>
          ))}
        </ul>
      </div>

      {traites.length > 0 && (
        <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-black">Déjà traités</h2>
          <ul className="mt-3 space-y-1 text-sm text-slate-700">
            {traites.map((s) => (
              <li key={s.id}>
                {nom(s.fournisseur_id)} · {motifEnMots(s.motif)} · {s.statut === "fonde" ? "fondé" : "non fondé"} · le {jour(s.cree_le)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
