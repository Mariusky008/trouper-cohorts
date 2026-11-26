/**
 * 📖 LE JOURNAL D'UN GROUPE (Mes groupes, le lot G7, 26 novembre 2026 ; `docs/univers/mes-groupes.md`, la maquette G0
 * validée, planche « Groupe »).
 *
 * Notre histoire, la plus récente d'abord, faite seulement de ce qui s'est vraiment passé :
 * - ✨ le groupe est né (après quelle séance, ou créé par qui) ; 👋 qui l'a rejoint ensuite (les fiches des membres) ;
 * - 📅 les rendez-vous posés ; 💡 les idées devenues des séances (à leur deuxième « Partant ! ») ;
 * - 🎬 les vidéos choisies pour la séance (deux 🙋, les sept derniers jours) ;
 * - 🛋️ les séances : ceux qui étaient là, dans le salon du groupe, à l'heure d'un rendez-vous (`noterPresence`, appelé par
 *   `entrerAuGroupe` : `groupes/journal/<id>/<fois>-<q>-<rdv>.json`, chacun la sienne).
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { ecrireJson, lireJson } from "./ma-figurine-serveur";
import { qui8 } from "./talkie-serveur";
import { jourAvant, jourParis } from "@/lib/jour-paris";
import { lireRdvs, reponsesDe } from "./groupes-vie-serveur";
import { cheminGroupe, dossierJourGroupe, enviesDuJour, estMembre, idGroupeValide, listerGroupes, membresDe, themesEnPlus } from "./groupes-chemins-serveur";
import { ENVIES_RETENUE, OUVERT_APRES_MS, OUVERT_AVANT_MS, PARTANTS_MIN, PHRASES_GRANDIR as PJG, PHRASES_JOURNAL as PJ, prochaineFois, themeDuGroupe, quandDuRdv, type EntreeJournal, type PlaceGroupe } from "./groupes";

type Supabase = ReturnType<typeof createAdminClient>;
type Resultat<T = object> = T & { error?: string; statut?: number };
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

const dossierJournal = (id: string) => `groupes/journal/${id}`;
/** Ma présence à une séance (une fois d'un rendez-vous). */
type FichePresence = { rdv: string; nom: string; e: string; fois: number; q: string; prenom: string; src: string; le: number };
const JOURS_CHOISIES = 7;
const LIGNES_MAX = 40;

/** 🛋️ J'entre dans le salon du groupe : si c'est l'heure d'un de ses rendez-vous, j'y étais (une fois par séance). */
export async function noterPresence(supabase: Supabase, gid: string, moi: { q: string; prenom: string; src: string }, maintenant = Date.now()): Promise<void> {
  const fiches = await lireRdvs(supabase, gid);
  for (const f of fiches) {
    const fois = prochaineFois(f, maintenant);
    if (fois == null || maintenant < fois - OUVERT_AVANT_MS || maintenant >= fois + OUVERT_APRES_MS) continue;
    if (f.idee && (await reponsesDe(supabase, gid, f.id)).filter((r) => r.fois === fois && r.r === "viens").length < PARTANTS_MIN) continue;
    const p: FichePresence = { rdv: f.id, nom: f.nom, e: f.e, fois, q: moi.q, prenom: moi.prenom, src: moi.src, le: maintenant };
    const chemin = `${dossierJournal(gid)}/${fois}-${moi.q}-${f.id.slice(-6)}.json`;
    const deja = await lireJson<Partial<FichePresence>>(supabase, chemin).catch(() => ({}) as Partial<FichePresence>);
    if (deja.q !== moi.q) await ecrireJson(supabase, chemin, p);
  }
}

type FicheGroupeJournal = { nom?: string; q?: string; prenom?: string; origine?: string; cree?: boolean; le?: number };

/** 📖 Le journal du groupe, le plus récent d'abord. */
export async function journalDuGroupe(supabase: Supabase, moi: Habitant, groupe: unknown, maintenant = Date.now()): Promise<Resultat<{ journal?: EntreeJournal[] }>> {
  const gid = idGroupeValide(groupe);
  const q = qui8(moi.id);
  if (!gid || !(await estMembre(supabase, gid, q))) return { error: "Ce groupe n’existe pas.", statut: 404 };
  const auj = jourParis(new Date(maintenant));
  const jours = Array.from({ length: JOURS_CHOISIES }, (_, k) => jourAvant(auj, k));
  const [g, membres, rdvs, noms, parJour] = await Promise.all([
    lireJson<FicheGroupeJournal>(supabase, cheminGroupe(gid)).catch(() => ({}) as FicheGroupeJournal),
    membresDe(supabase, gid),
    lireRdvs(supabase, gid),
    listerGroupes(supabase, dossierJournal(gid), 120),
    Promise.all(jours.map(async (jour) => ({ jour, envies: await enviesDuJour(supabase, gid, jour).catch(() => []) }))),
  ]);
  const place = (m: { q: string; prenom: string; src: string }): PlaceGroupe => ({ q: m.q, prenom: m.prenom, src: m.src });
  const l: EntreeJournal[] = [];

  // ✨ la naissance, 👋 ceux qui ont rejoint ensuite
  const parArrivee = [...membres].sort((a, b) => a.le - b.le);
  const fondateurs = g.cree ? 1 : 2;
  const ne = g.cree ? Number(g.le) || parArrivee[0]?.le : parArrivee[1]?.le ?? parArrivee[0]?.le;
  if (ne) l.push({ id: "ne", le: ne, e: "✨", titre: PJ.ne, sous: g.cree ? PJ.neCree(s(g.prenom) || parArrivee[0]?.prenom || "") : PJ.neApres(s(g.nom)), ne: true });
  for (const m of parArrivee.slice(fondateurs)) l.push({ id: `rejoint-${m.q}`, le: m.le, e: "👋", titre: PJ.rejoint(m.prenom), qui: [place(m)] });

  // 📅 les rendez-vous posés ; 💡 les idées devenues des séances
  for (const f of rdvs) {
    if (!f.idee) {
      const quand = prochaineFois(f, maintenant) ?? f.quand ?? f.le;
      l.push({ id: `rdv-${f.id}`, le: f.le, e: f.e, titre: PJ.rdv(f.nom), sous: PJ.rdvPose(quandDuRdv({ recurrence: f.recurrence, jour: f.jour, heure: f.heure, quand }, maintenant), f.prenom) });
      continue;
    }
    const fois = prochaineFois(f, maintenant) ?? f.quand;
    const viens = (await reponsesDe(supabase, gid, f.id)).filter((r) => r.r === "viens" && r.fois === fois).sort((a, b) => a.le - b.le);
    if (viens.length >= PARTANTS_MIN) l.push({ id: `idee-${f.id}`, le: viens[PARTANTS_MIN - 1].le, e: "💡", titre: PJ.idee(f.prenom), sous: `« ${f.nom} »` });
  }

  // 🌱 (lot G8) les thèmes ajoutés
  for (const t of await themesEnPlus(supabase, gid).catch(() => [])) {
    const th = themeDuGroupe(t.theme);
    if (th) l.push({ id: `theme-${t.theme}`, le: t.le, e: th.e, titre: PJG.journalTheme(th.court), sous: PJG.journalThemePar(t.prenom) });
  }

  // 🎬 les vidéos choisies pour la séance (deux mains), jour par jour
  const dedans = new Map(membres.map((m) => [m.q, m]));
  for (const { jour, envies } of parJour) {
    const mains = new Map<string, { n: number; le: number; titre: string }>();
    for (const f of envies.filter((x) => dedans.has(x.q)).sort((a, b) => a.le - b.le))
      for (const v of f.videos) {
        if (!v?.id) continue;
        const x = mains.get(v.id) ?? { n: 0, le: f.le, titre: s(v.titre) };
        x.n++;
        x.le = Math.max(x.le, f.le);
        mains.set(v.id, x);
      }
    const choisies = [...mains.entries()].filter(([, x]) => x.n >= ENVIES_RETENUE);
    if (!choisies.length) continue;
    const proposees = await Promise.all(
      (await listerGroupes(supabase, dossierJourGroupe(gid, jour), 40)).map((n) =>
        lireJson<{ q?: string; prenom?: string; src?: string; video?: { id?: string }; mot?: string }>(supabase, `${dossierJourGroupe(gid, jour)}/${n}`).catch(() => ({}) as { q?: string }),
      ),
    );
    for (const [id, x] of choisies) {
      const de = proposees.find((p) => "video" in p && p.video?.id === id && p.q && dedans.has(p.q)) as { q: string; mot?: string } | undefined;
      const m = de ? dedans.get(de.q)! : null;
      l.push({ id: `choisie-${jour}-${id}`, le: x.le, e: "🎬", titre: m ? PJ.choisie(m.prenom) : PJ.choisieNouveaute, sous: de?.mot ? `« ${de.mot} »` : x.titre, video: id, ...(m ? { qui: [place(m)] } : {}) });
    }
  }

  // 🛋️ les séances : ceux qui étaient là
  const presences = (await Promise.all(noms.map((n) => lireJson<Partial<FichePresence>>(supabase, `${dossierJournal(gid)}/${n}`).catch(() => ({}) as Partial<FichePresence>)))).filter(
    (x): x is FichePresence => Boolean(x.rdv && x.q && x.fois),
  );
  const seances = new Map<string, FichePresence[]>();
  for (const p of presences) seances.set(`${p.rdv}-${p.fois}`, [...(seances.get(`${p.rdv}-${p.fois}`) ?? []), p]);
  for (const [cle, ps] of seances) {
    const tri = ps.sort((a, b) => a.le - b.le);
    const qui = tri.map((p) => (dedans.has(p.q) ? place(dedans.get(p.q)!) : { q: p.q, prenom: p.prenom, src: p.src }));
    l.push({ id: `seance-${cle}`, le: Math.min(tri[0].fois, tri[0].le), e: tri[0].e, titre: tri[0].nom, sous: PJ.etaientLa(qui.length), qui });
  }

  // (la naissance reste toujours, tout en bas)
  const tri = l.filter((x) => x.le <= maintenant + 60_000 && !x.ne).sort((a, b) => b.le - a.le);
  const naissance = l.find((x) => x.ne);
  return { journal: [...tri.slice(0, naissance ? LIGNES_MAX - 1 : LIGNES_MAX), ...(naissance ? [naissance] : [])] };
}
