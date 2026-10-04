// LA MODÉRATION DE LA VILLE — les publications d'habitants signalées.
//
// Chacun peut signaler une publication de La ville (`/ville/<ville>`). Au
// troisième signalement, elle est masquée en attendant la décision prise ici :
// la garder (elle réapparaît, et ne sera plus masquée par de nouveaux
// signalements) ou la retirer (elle quitte le fil de tout le monde).
// Voir la migration `20261006120000_ville_partagee.sql`.
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Moderation, type PublicationSignalee } from "./_components/moderation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const str = (v: unknown) => (v == null ? "" : String(v));

async function lireLesSignalees(): Promise<{ liste: PublicationSignalee[]; migree: boolean }> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("human_ville_publications")
      .select("id, ville_slug, qui, donnees, visibilite, cree_le, signalements, masque")
      .gt("signalements", 0)
      .is("verdict", null)
      .is("retire_le", null)
      .order("signalements", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as Record<string, unknown>[];
    const ids = rows.map((r) => str(r.id));
    const { data: sig } = ids.length
      ? await supabase.from("human_ville_signalements").select("publication, motif").in("publication", ids)
      : { data: [] };
    const motifs = new Map<string, string[]>();
    for (const s of (sig ?? []) as Record<string, unknown>[]) {
      const m = str(s.motif);
      if (m) motifs.set(str(s.publication), [...(motifs.get(str(s.publication)) ?? []), m]);
    }
    return {
      migree: true,
      liste: rows.map((r) => {
        const d = (r.donnees ?? {}) as Record<string, unknown>;
        return {
          id: str(r.id),
          ville: str(r.ville_slug),
          qui: str(r.qui),
          texte: str(d.texte),
          photo: str(d.photo) || undefined,
          visibilite: str(r.visibilite),
          quand: new Date(str(r.cree_le)).toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "short", timeStyle: "short" }),
          signalements: Number(r.signalements) || 0,
          masque: Boolean(r.masque),
          motifs: motifs.get(str(r.id)) ?? [],
        };
      }),
    };
  } catch {
    return { liste: [], migree: false };
  }
}

export default async function ModerationVillePage() {
  const { liste, migree } = await lireLesSignalees();
  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <Link href="/admin/humain" className="text-sm text-slate-500">
        ← Admin
      </Link>
      <h1 className="text-2xl font-black text-slate-900">La ville · publications signalées</h1>
      <p className="text-slate-600">
        Au troisième signalement, une publication est masquée en attendant ta décision. Garder la rend de nouveau visible ; retirer la sort du fil
        de tout le monde.
      </p>
      {!migree ? (
        <p className="rounded-xl bg-amber-50 p-4 text-amber-900">
          La table n’existe pas encore : applique la migration <code>20261006120000_ville_partagee.sql</code> dans Supabase.
        </p>
      ) : liste.length === 0 ? (
        <p className="rounded-xl bg-slate-50 p-4 text-slate-600">Aucune publication signalée. 🎉</p>
      ) : (
        liste.map((p) => <Moderation key={p.id} p={p} />)
      )}
    </main>
  );
}
