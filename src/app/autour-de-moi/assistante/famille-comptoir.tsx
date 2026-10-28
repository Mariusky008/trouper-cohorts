"use client";

// 👻 MA FAMILLE — au comptoir : ceux qui ont libéré leur fantôme chez lui, et ce qu'ils font.
//
// En tête de l'accueil, une carte : « Aujourd'hui 17 · record 29 », les nouveaux du jour, et ce qu'il
// manque pour battre le record. Elle ouvre l'écran, qui dit, dans l'ordre où il en a besoin :
//   · LA FOULE DU JOUR et le record à battre (on repart de zéro chaque matin) ;
//   · SON LIEN (`clikme.fr/f/<lien>`), celui de sa bio et de la fin de ses vidéos ;
//   · SES PALIERS : combien en or, en argent, en bronze, et ses fidèles par leur prénom ;
//   · SON PARCOURS DE LA SEMAINE : sa page ouverte → un fantôme libéré → venus pour de vrai, en
//     pourcentages. WhatsApp s'y ajoutera avec le numéro de ClikMe ;
//   · LE MOT DU JOUR : il épingle un des petits mots d'aujourd'hui ou d'hier, qui s'affiche en haut
//     de sa page avec le prénom et le numéro de son auteur ;
//   · 🔔 UN BON PLAN POUR SA FAMILLE (« Il me reste des tables ») : l'or le voit tout de suite sur sa
//     page, l'argent puis le bronze après (`OUVERTURE_BON_PLAN`) ; « C'est complet » le retire ;
//   · 🎁 JE TE GÂTE : ce qu'il peut offrir à sa famille ce mois-ci (« 10 × un café ») — il l'offre sur
//     leurs petits mots, et sa page dit combien il en reste à gagner.
//
// 🚀 SON DÉPART, EN TROIS GESTES (le chantier « après l'inscription ») : son lien en premier dans sa bio
// (réseau par réseau), son carton QR au comptoir (`/f/<lien>/carton`), et la phrase de la fin de ses
// vidéos. Chacun se coche ; tant que ce n'est pas fini, la carte de l'accueil le rappelle (« 1/3 »).
// Ce téléphone retient ce qui est coché. Seulement pour un vrai commerçant : il a un vrai lien.
//
// LA DÉMONSTRATION a une famille inventée (`familleAuComptoirDemo`), et le mot qu'il épingle reste
// dans ce téléphone. Un vrai commerçant lit la sienne (`api/site-internet/pro/famille`).
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import {
  BON_PLAN_MAX,
  DUREES_BON_PLAN,
  EMOJI_GRADE,
  familleAuComptoirDemo,
  GATE_MAX,
  ideesDeBonPlan,
  ideesDeSurprises,
  SURPRISES_MAX,
  SURPRISE_STOCK_MAX,
  OUVERTURE_BON_PLAN,
  ouvertureDuBonPlan,
  resteDuGate,
  type BonPlanComptoir,
  type DureeBonPlan,
  manquePourRecord,
  NOM_GRADE,
  recordBattu,
  regleEnMots,
  tauxDe,
  type FamilleAuComptoir,
  type Grade,
} from "@/lib/direct/famille";
import { lookDe } from "@/lib/direct/look";
import { jourParis } from "@/lib/jour-paris";
import { STYLES_CARNET } from "./carnet-comptoir";
import { plusDe, plusPermis, plusPropre } from "@/lib/direct/previens-les";

const nb = (n: number) => n.toLocaleString("fr-FR").replace(/ /g, " ");

/* LE MOT ÉPINGLÉ DANS LA DÉMONSTRATION, dans ce téléphone, pour la journée. */
const cleDemo = (c: CommerceComptoir) => `clikme:famille-demo:${c.id}`;
function epingleDemo(c: CommerceComptoir): string {
  try {
    const v = JSON.parse(window.localStorage.getItem(cleDemo(c)) || "null") as { id?: string; jour?: string } | null;
    return v?.id && v.jour === jourParis() ? v.id : "";
  } catch {
    return "";
  }
}
/* SON BON PLAN ET CE QU'IL OFFRE, DANS LA DÉMONSTRATION : dans ce téléphone aussi. */
const cleBonPlan = (c: CommerceComptoir) => `clikme:bonplan-demo:${c.id}`;
const cleGate = (c: CommerceComptoir) => `clikme:gate-demo:${c.id}`;
function lireLocal<T>(cle: string): T | null {
  try {
    return JSON.parse(window.localStorage.getItem(cle) || "null") as T | null;
  } catch {
    return null;
  }
}
function garderLocal(cle: string, v: unknown) {
  try {
    if (v === null) window.localStorage.removeItem(cle);
    else window.localStorage.setItem(cle, JSON.stringify(v));
  } catch {
    /* stockage indisponible : le geste vit le temps de la visite */
  }
}
const planDemo = (texte: string, publieLe: string, finLe: string): BonPlanComptoir => ({
  id: "demo",
  texte,
  publieLe,
  finLe,
  ouvertures: { or: ouvertureDuBonPlan(publieLe, "or"), argent: ouvertureDuBonPlan(publieLe, "argent"), bronze: ouvertureDuBonPlan(publieLe, "bronze") },
});
function avecDemo(f: FamilleAuComptoir, c: CommerceComptoir): FamilleAuComptoir {
  const bp = lireLocal<{ texte: string; publieLe: string; finLe: string }>(cleBonPlan(c));
  const g = lireLocal<{ mois: string; quoi: string; combien: number }>(cleGate(c));
  const mois = jourParis().slice(0, 7);
  return {
    ...f,
    bonPlan: bp && Date.parse(bp.finLe) > Date.now() ? planDemo(bp.texte, bp.publieLe, bp.finLe) : null,
    gate: g && g.mois === mois ? { mois, quoi: g.quoi, combien: g.combien, offerts: 0 } : null,
    gateDernier: g ? { quoi: g.quoi, combien: g.combien } : null,
  };
}

/* ═══ 🚀 SON DÉPART, EN TROIS GESTES ═══════════════════════════════════════ */
const ETAPES_DEPART = [
  { id: "bio", titre: "Ton lien en premier dans ta bio", icone: "🔗" },
  { id: "carton", titre: "Ton carton QR sur ton comptoir", icone: "🖨️" },
  { id: "video", titre: "Le dire à la fin de tes vidéos", icone: "🎬" },
] as const;
type EtapeDepart = (typeof ETAPES_DEPART)[number]["id"];
/** La phrase à dire (ou à écrire) à la fin de chaque vidéo. */
export const PHRASE_FIN_DE_VIDEO = "Rejoins ma famille de fantômes : le lien est dans ma bio !";
/** Où mettre son lien, réseau par réseau. */
const BIO_PAR_RESEAU: { reseau: string; comment: string }[] = [
  { reseau: "Instagram", comment: "« Modifier le profil » → « Liens » → « Ajouter un lien externe ». Titre : « Rejoins la famille 👻 ». Mets-le en premier." },
  { reseau: "Facebook", comment: "Sur ta page, « Modifier » → la ligne « Site web »." },
  { reseau: "TikTok", comment: "« Modifier le profil » → « Site web » (avec un compte professionnel)." },
  { reseau: "WhatsApp Business", comment: "« Paramètres » → ton profil d’entreprise → « Site web »." },
  { reseau: "Google", comment: "Dans une mise à jour de ta fiche, le bouton « En savoir plus » avec ton lien." },
];
const cleDepart = (slug: string) => `clikme:depart:${slug}`;
const abonnesDepart = new Set<() => void>();
const abonnerDepart = (f: () => void) => {
  abonnesDepart.add(f);
  return () => void abonnesDepart.delete(f);
};
function lireDepart(slug: string): string {
  try {
    return window.localStorage.getItem(cleDepart(slug)) || "";
  } catch {
    return "";
  }
}
/** Ses gestes de départ, cochés sur ce téléphone. */
export function useDepart(slug: string | undefined) {
  const brut = useSyncExternalStore(abonnerDepart, () => (slug ? lireDepart(slug) : ""), () => "");
  const faits = new Set(brut.split(",").filter(Boolean));
  const cocher = (id: EtapeDepart, oui: boolean) => {
    if (!slug) return;
    const neufs = new Set(faits);
    if (oui) neufs.add(id);
    else neufs.delete(id);
    try {
      window.localStorage.setItem(cleDepart(slug), [...neufs].join(","));
    } catch {
      /* stockage indisponible */
    }
    abonnesDepart.forEach((f) => f());
  };
  const nb = ETAPES_DEPART.filter((e) => faits.has(e.id)).length;
  return { faits, cocher, nb, total: ETAPES_DEPART.length, fini: nb === ETAPES_DEPART.length };
}

/** « 12 h 05 », heure de Paris. */
export const heureEnClair = (iso: string) =>
  new Date(iso).toLocaleTimeString("fr-FR", { hour: "numeric", minute: "2-digit", timeZone: "Europe/Paris" }).replace(":", " h ");

function avecEpingle(f: FamilleAuComptoir, id: string): FamilleAuComptoir {
  const mots = f.mots.map((m) => ({ ...m, epingle: m.id === id }));
  const m = mots.find((x) => x.epingle);
  return { ...f, mots, motDuJour: m ? { texte: m.texte, prenom: m.prenom, numero: m.numero, grade: f.fideles.find((x) => x.numero === m.numero)?.grade ?? null } : null };
}

async function demander(reel: { slug: string; token: string }, corps: Record<string, unknown>): Promise<FamilleAuComptoir> {
  const r = await fetch("/api/site-internet/pro/famille", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slug: reel.slug, token: reel.token, ...corps }),
  });
  const j = (await r.json().catch(() => ({}))) as FamilleAuComptoir & { ok?: boolean; error?: string };
  if (!r.ok || !j.ok) throw new Error(String(j.error || "Ça n’a pas marché. Réessaie dans un instant."));
  return j;
}

/** Sa famille : lue une fois à l'accueil, relue à l'ouverture de l'écran ; et son geste (épingler). */
export function useFamille(commerce: CommerceComptoir) {
  const [f, setF] = useState<FamilleAuComptoir | null>(null);
  const [pret, setPret] = useState(false);
  const [ennui, setEnnui] = useState("");
  const [occupe, setOccupe] = useState("");
  const reel = commerce.reel;

  const charger = useCallback(async () => {
    if (!reel) {
      setF(avecDemo(avecEpingle(familleAuComptoirDemo(commerce.id, Date.now()), epingleDemo(commerce)), commerce));
      setPret(true);
      return;
    }
    try {
      setF(await demander(reel, { action: "lire" }));
    } catch {
      // La famille ne s'affiche pas plutôt que de mettre l'accueil en erreur.
      setF(null);
    } finally {
      setPret(true);
    }
  }, [commerce, reel]);

  useEffect(() => {
    void charger();
  }, [charger]);

  /** 📌 Ce mot devient le mot du jour (`id` vide : il le retire). */
  const epingler = async (id: string) => {
    setEnnui("");
    if (!reel) {
      try {
        if (id) window.localStorage.setItem(cleDemo(commerce), JSON.stringify({ id, jour: jourParis() }));
        else window.localStorage.removeItem(cleDemo(commerce));
      } catch {
        /* stockage indisponible : le mot reste épinglé le temps de la visite */
      }
      setF((x) => (x ? avecEpingle(x, id) : x));
      return;
    }
    setOccupe(id || "retirer");
    try {
      setF(await demander(reel, { action: "epingler", id }));
    } catch (e) {
      setEnnui(e instanceof Error ? e.message : String(e));
    } finally {
      setOccupe("");
    }
  };

  /** Un geste du comptoir : à la route (qui rend la famille relue), ou dans ce téléphone pour la démonstration. */
  const geste = async (quoi: string, corps: Record<string, unknown>, demo: () => void): Promise<boolean> => {
    setEnnui("");
    if (!reel) {
      demo();
      setF((x) => (x ? avecDemo(x, commerce) : x));
      return true;
    }
    setOccupe(quoi);
    try {
      setF(await demander(reel, corps));
      return true;
    } catch (e) {
      setEnnui(e instanceof Error ? e.message : String(e));
      return false;
    } finally {
      setOccupe("");
    }
  };

  /** 🔔 Un bon plan pour sa famille (il remplace celui d'avant). */
  const bonPlan = (texte: string, duree: DureeBonPlan) =>
    geste("bon-plan", { action: "bon-plan", texte, duree }, () => {
      const maintenant = Date.now();
      const soir = new Date();
      soir.setHours(23, 0, 0, 0);
      const fin = duree === "1h" ? maintenant + 3_600_000 : duree === "3h" ? maintenant + 3 * 3_600_000 : Math.max(soir.getTime(), maintenant + 3_600_000);
      garderLocal(cleBonPlan(commerce), { texte: texte.trim().slice(0, BON_PLAN_MAX), publieLe: new Date(maintenant).toISOString(), finLe: new Date(fin).toISOString() });
    });
  /** « C'est complet » : il le retire. */
  const retirerBonPlan = () => geste("bon-plan-retirer", { action: "bon-plan-retirer" }, () => garderLocal(cleBonPlan(commerce), null));
  /** 🎁 Ce qu'il peut offrir ce mois-ci. */
  const gate = (quoi: string, combien: number) =>
    geste("gate", { action: "gate", quoi, combien }, () => garderLocal(cleGate(commerce), { mois: jourParis().slice(0, 7), quoi: plusPropre(quoi), combien }));

  return { f, pret, ennui, occupe, recharger: charger, epingler, bonPlan, retirerBonPlan, gate, demo: !reel };
}
export type FamilleDuComptoir = ReturnType<typeof useFamille>;

/** Ce que dit la carte : la foule du jour et ce qu'il manque pour le record. */
function motDeLaCarte(f: FamilleAuComptoir): { titre: string; mot: string; chaud: boolean } {
  if (f.membres === 0) return { titre: "Ta famille commence aujourd’hui", mot: "Ton lien, à la fin de tes vidéos : les premiers fantômes arrivent", chaud: false };
  const titre = `Aujourd’hui ${nb(f.aujourdhui)}${f.record ? ` · record ${nb(Math.max(f.record, f.aujourdhui))}` : ""}`;
  const mots = [
    f.bonPlan && "🔔 Bon plan en cours",
    f.nouveaux > 0 && `+${nb(f.nouveaux)} ${f.nouveaux > 1 ? "nouveaux" : "nouveau"}`,
    recordBattu(f) ? "🎉 Record battu !" : f.record ? `Plus que ${nb(manquePourRecord(f))} pour le record` : "",
  ].filter(Boolean);
  return { titre, mot: mots.join(" · ") || `${nb(f.membres)} fantômes dans ta famille`, chaud: recordBattu(f) || f.nouveaux > 0 || Boolean(f.bonPlan) };
}

/** 👻 La carte en tête de l'accueil (`slug` : un vrai commerçant, qui a son départ à faire). */
export function CarteFamille({ famille, slug, onOuvrir }: { famille: FamilleDuComptoir; slug?: string; onOuvrir: () => void }) {
  const depart = useDepart(slug);
  if (famille.pret && !famille.f) return null;
  const base = famille.f ? motDeLaCarte(famille.f) : { titre: "", mot: "…", chaud: false };
  // 🚀 TANT QUE SON DÉPART N'EST PAS FAIT, la carte le rappelle.
  const m = slug && famille.f && !depart.fini ? { ...base, mot: `🚀 Ton départ : ${depart.nb}/${depart.total} · ${base.mot}`, chaud: true } : base;
  const jauge = famille.f?.record ? Math.min(100, Math.round((famille.f.aujourdhui / (famille.f.record + 1)) * 100)) : 0;
  return (
    <>
      <button type="button" className="ak-second fc-carte" onClick={onOuvrir}>
        <span className="ak-second-i" aria-hidden="true">
          👻
        </span>
        <span className="ak-cta-t">
          <b>Ma famille</b>
          {m.titre && <em className="fc-carte-titre">{m.titre}</em>}
          {jauge > 0 && (
            <span className="fc-jauge" aria-hidden="true">
              <i style={{ width: `${recordBattu(famille.f!) ? 100 : jauge}%` }} />
            </span>
          )}
          <i className={`ak-meta${m.chaud ? " chaud" : ""}`}>{m.mot}</i>
        </span>
        <s aria-hidden="true">›</s>
      </button>
      <style>{STYLES}</style>
    </>
  );
}

/** 👻 L'écran « Ma famille ». */
export function FamilleComptoir({
  commerce,
  dossier,
  famille,
  onRetour,
}: {
  commerce: CommerceComptoir;
  dossier: string;
  famille: FamilleDuComptoir;
  onRetour: () => void;
}) {
  const { recharger } = famille;
  useEffect(() => {
    void recharger();
  }, [recharger]);
  const f = famille.f;
  const tauxCages = f ? tauxDe(f.parcours.cages, f.parcours.pages) : null;
  const tauxVenues = f ? tauxDe(f.parcours.venues, f.parcours.cages) : null;
  const ORDRE: Grade[] = ["or", "argent", "bronze"];

  return (
    <div className="ck fc">
      <div className="ck-haut">
        <button type="button" className="ck-retour" onClick={onRetour}>
          ‹ Mon comptoir
        </button>
        {f && f.membres > 0 && <span className="ck-compte">{f.membres > 1 ? `${nb(f.membres)} fantômes` : "1 fantôme"}</span>}
      </div>

      <section className="ck-intro">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${dossier}visage.webp`} alt="" />
        <div>
          <h2>Ma famille</h2>
          <p>Ceux qui ont libéré leur fantôme chez toi. Chaque matin, la foule repart de zéro : à vous de battre le record.</p>
        </div>
      </section>

      {famille.demo && <p className="ck-note">Démonstration : ces chiffres et ces prénoms sont inventés.</p>}
      {famille.pret && !f && <p className="ck-vide">Ta famille ne s’affiche pas pour l’instant. Réessaie dans un instant.</p>}

      {f && (
        <>
          <section className="fc-foule" aria-live="polite">
            <div className="fc-l1">
              <b>{nb(f.aujourdhui)}</b>
              <span>
                {f.aujourdhui > 1 ? "fantômes" : "fantôme"}
                <br />
                aujourd’hui
              </span>
              {f.record !== null && f.record > 0 && (
                <em>
                  🏆 Record<strong>{nb(Math.max(f.record, f.aujourdhui))}</strong>
                </em>
              )}
            </div>
            {f.record !== null && f.record > 0 && (
              <span className="fc-jauge grande" aria-hidden="true">
                <i style={{ width: `${recordBattu(f) ? 100 : Math.min(100, Math.round((f.aujourdhui / (f.record + 1)) * 100))}%` }} />
              </span>
            )}
            <p>
              {recordBattu(f) ? (
                <b>🎉 Record battu aujourd’hui ! Dis-le dans ta prochaine vidéo.</b>
              ) : f.record ? (
                <>
                  Plus que <b>{nb(manquePourRecord(f))}</b> pour battre ton record.
                </>
              ) : f.membres === 0 ? (
                "Personne encore : mets ton lien à la fin de ta prochaine vidéo."
              ) : (
                "Le premier jour de ta famille : chaque fantôme compte pour le record."
              )}
            </p>
            <ul className="fc-petits">
              <li>
                Hier <b>{nb(f.hier)}</b>
              </li>
              <li>
                Nouveaux aujourd’hui <b>{nb(f.nouveaux)}</b>
              </li>
              <li>
                En tout <b>{nb(f.membres)}</b>
              </li>
            </ul>
          </section>

          {commerce.reel && <Depart slug={commerce.reel.slug} />}
          <BonPlanDuComptoir commerce={commerce} famille={famille} f={f} />
          <JeTeGate commerce={commerce} famille={famille} f={f} />
          <SurpriseDuChef commerce={commerce} />

          <section className="fc-paliers">
            <h3>Leurs écussons</h3>
            <div className="fc-tuiles">
              {ORDRE.map((g) => (
                <div key={g} className={`fc-tuile ${g}`}>
                  <span aria-hidden="true">{EMOJI_GRADE[g]}</span>
                  <b>{nb(f.paliers[g])}</b>
                  <small>{NOM_GRADE[g]}</small>
                </div>
              ))}
            </div>
            <p className="fc-regle">
              Argent : {regleEnMots("argent")}. Or : {regleEnMots("or")}. Plus l’écusson monte, plus tôt ils ont tes bons plans.
            </p>
            {f.fideles.length > 0 && (
              <ul className="fc-fideles" aria-label="Tes fidèles">
                {f.fideles.map((m) => (
                  <li key={m.numero}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={lookDe(m.look).image} alt="" />
                    <span>
                      <b>{m.prenom || "Sans prénom"}</b>
                      <small>
                        n°{nb(m.numero)} {EMOJI_GRADE[m.grade]}
                      </small>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="fc-parcours">
            <h3>
              Ton parcours <small>les 7 derniers jours</small>
            </h3>
            <ol>
              <li>
                <span aria-hidden="true">👀</span>
                <span>
                  Ont ouvert ta page
                  {f.parcours.pages === null && <small>Pas encore mesuré</small>}
                </span>
                <b>{f.parcours.pages === null ? "—" : nb(f.parcours.pages)}</b>
              </li>
              <li>
                <span aria-hidden="true">🔓</span>
                <span>
                  Ont libéré leur fantôme
                  {tauxCages !== null && <small>{tauxCages} % de ceux qui ont ouvert ta page</small>}
                </span>
                <b>{nb(f.parcours.cages)}</b>
              </li>
              <li className="bientot">
                <span aria-hidden="true">💬</span>
                <span>
                  Ont écrit à Mike sur WhatsApp
                  <small>Bientôt, avec le numéro de ClikMe</small>
                </span>
                <b>—</b>
              </li>
              <li>
                <span aria-hidden="true">🚶</span>
                <span>
                  Sont venus pour de vrai
                  {tauxVenues !== null && <small>{tauxVenues} % de ceux qui ont libéré leur fantôme</small>}
                </span>
                <b>{nb(f.parcours.venues)}</b>
              </li>
            </ol>
            <p className="fc-regle">Les venues, ce sont les « Passage aujourd’hui » que tu notes dans ton carnet.</p>
          </section>

          <section className="fc-mots">
            <h3>📌 Le mot du jour</h3>
            <p className="fc-regle">Il s’affiche en haut de ta page, avec le prénom et le numéro de son auteur. Un par jour.</p>
            {f.motDuJour && (
              <figure className="fc-motdujour">
                <blockquote>« {f.motDuJour.texte} »</blockquote>
                <figcaption>
                  {[f.motDuJour.prenom, f.motDuJour.numero ? `fantôme n°${nb(f.motDuJour.numero)}` : ""].filter(Boolean).join(" · ")}
                </figcaption>
              </figure>
            )}
            {!f.epinglable && <p className="ck-vide">Le mot du jour arrive bientôt sur ta page.</p>}
            {f.epinglable && f.mots.length === 0 && <p className="ck-vide">Pas encore de petit mot aujourd’hui. Ils arrivent avec les fantômes.</p>}
            {f.epinglable &&
              f.mots.map((m) => (
                <article key={m.id} className={`fc-mot${m.epingle ? " epingle" : ""}`}>
                  <q>{m.texte}</q>
                  <small>{[m.prenom, m.numero ? `n°${nb(m.numero)}` : ""].filter(Boolean).join(" · ")}</small>
                  <button
                    type="button"
                    className={`ck-passage${m.epingle ? " fait" : ""}`}
                    aria-pressed={m.epingle}
                    disabled={Boolean(famille.occupe)}
                    onClick={() => void famille.epingler(m.epingle ? "" : m.id)}
                  >
                    {m.epingle ? "✓ Mot du jour" : "📌 Épingler"}
                  </button>
                </article>
              ))}
            {famille.ennui && (
              <p className="ck-ennui" role="alert">
                {famille.ennui}
              </p>
            )}
          </section>
        </>
      )}
      <style>{STYLES_CARNET + STYLES}</style>
    </div>
  );
}

/**
 * 🚀 SON DÉPART : tant que ce n'est pas fini, les trois gestes, chacun à cocher ; ensuite, son lien en
 * petit (à copier), son carton et sa page.
 */
function Depart({ slug }: { slug: string }) {
  const depart = useDepart(slug);
  const [copie, setCopie] = useState(false);
  const [comment, setComment] = useState(false);
  const lien = `clikme.fr/f/${slug}`;
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(`https://${lien}`);
      setCopie(true);
      window.setTimeout(() => setCopie(false), 2200);
    } catch {
      /* presse-papiers refusé : le lien reste écrit, à recopier */
    }
  };
  const carton = `/f/${encodeURIComponent(slug)}/carton`;
  const ligneDuLien = (
    <div className="fc-lien-ligne">
      <code>{lien}</code>
      <button type="button" className="ck-passage" onClick={() => void copier()}>
        {copie ? "✓ Copié" : "Copier"}
      </button>
    </div>
  );
  if (depart.fini)
    return (
      <section className="fc-lien">
        <h3>Ton lien</h3>
        {ligneDuLien}
        <div className="fc-lien-bas">
          <a href={carton} target="_blank" rel="noopener noreferrer">
            🖨️ Mon carton QR
          </a>
          <a href={`/f/${encodeURIComponent(slug)}?moi=1`} target="_blank" rel="noopener noreferrer">
            Voir ma page ›
          </a>
        </div>
      </section>
    );
  const fait = (id: EtapeDepart) => depart.faits.has(id);
  const coche = (id: EtapeDepart) => (
    <button type="button" className={`fc-coche${fait(id) ? " fait" : ""}`} aria-pressed={fait(id)} onClick={() => depart.cocher(id, !fait(id))}>
      {fait(id) ? "✓ Fait" : "C’est fait"}
    </button>
  );
  return (
    <section className="fc-depart" aria-label="Ton départ">
      <h3>
        🚀 Ton départ, en 3 gestes{" "}
        <small>
          {depart.nb}/{depart.total}
        </small>
      </h3>
      <p className="fc-regle">Trois chemins mènent à ta famille : ta bio, ton comptoir, la fin de tes vidéos.</p>
      <ol>
        <li className={fait("bio") ? "fait" : ""}>
          <b>
            {ETAPES_DEPART[0].icone} {ETAPES_DEPART[0].titre}
          </b>
          {ligneDuLien}
          <button type="button" className="fc-comment" aria-expanded={comment} onClick={() => setComment(!comment)}>
            {comment ? "Masquer" : "Comment, réseau par réseau ?"}
          </button>
          {comment && (
            <ul className="fc-reseaux">
              {BIO_PAR_RESEAU.map((r) => (
                <li key={r.reseau}>
                  <b>{r.reseau}</b> {r.comment}
                </li>
              ))}
            </ul>
          )}
          {coche("bio")}
        </li>
        <li className={fait("carton") ? "fait" : ""}>
          <b>
            {ETAPES_DEPART[1].icone} {ETAPES_DEPART[1].titre}
          </b>
          <span>Ceux qui sont déjà chez toi le scannent avec leur appareil photo, sans appli.</span>
          <a className="fc-carton" href={carton} target="_blank" rel="noopener noreferrer">
            Imprimer mon carton ›
          </a>
          {coche("carton")}
        </li>
        <li className={fait("video") ? "fait" : ""}>
          <b>
            {ETAPES_DEPART[2].icone} {ETAPES_DEPART[2].titre}
          </b>
          <q>{PHRASE_FIN_DE_VIDEO}</q>
          {coche("video")}
        </li>
      </ol>
    </section>
  );
}

/** 🔔 SON BON PLAN : celui en cours (ses heures, palier par palier), ou en écrire un. */
function BonPlanDuComptoir({ commerce, famille, f }: { commerce: CommerceComptoir; famille: FamilleDuComptoir; f: FamilleAuComptoir }) {
  const [texte, setTexte] = useState("");
  const [duree, setDuree] = useState<DureeBonPlan>("3h");
  const propre = texte.replace(/\s+/g, " ").trim();
  const interdit = Boolean(propre) && !plusPermis(propre);
  const bp = f.bonPlan;
  return (
    <section className="fc-bonplan">
      <h3>🔔 Un bon plan pour ta famille</h3>
      {!f.bonsPlansActifs ? (
        <p className="ck-vide">Les bons plans arrivent bientôt sur ta page.</p>
      ) : bp ? (
        <div className="fc-bp-encours">
          <q>{bp.texte}</q>
          <ul className="fc-bp-heures">
            <li>
              🥇 Or <b>{heureEnClair(bp.ouvertures.or)}</b>
            </li>
            <li>
              🥈 Argent <b>{heureEnClair(bp.ouvertures.argent)}</b>
            </li>
            <li>
              🥉 Bronze <b>{heureEnClair(bp.ouvertures.bronze)}</b>
            </li>
          </ul>
          <small>Jusqu’à {heureEnClair(bp.finLe)}</small>
          <button type="button" className="ck-passage" disabled={Boolean(famille.occupe)} onClick={() => void famille.retirerBonPlan()}>
            C’est complet : le retirer
          </button>
        </div>
      ) : (
        <div className="fc-bp-ecrire">
          <div className="fc-puces">
            {ideesDeBonPlan(commerce.branche).map((i) => (
              <button key={i} type="button" className={propre === i ? "on" : ""} onClick={() => setTexte(i)}>
                {i}
              </button>
            ))}
          </div>
          <input value={texte} maxLength={BON_PLAN_MAX} placeholder="Ou écris le tien" aria-label="Ton bon plan" onChange={(e) => setTexte(e.target.value)} />
          <div className="fc-puces" role="radiogroup" aria-label="Pour combien de temps">
            {DUREES_BON_PLAN.map((d) => (
              <button key={d.id} type="button" role="radio" aria-checked={duree === d.id} className={duree === d.id ? "on" : ""} onClick={() => setDuree(d.id)}>
                {d.mot}
              </button>
            ))}
          </div>
          {interdit && <p className="ck-ennui">Pas de promotion d’alcool : la loi Évin l’interdit.</p>}
          <button
            type="button"
            className="fc-envoyer"
            disabled={!propre || interdit || Boolean(famille.occupe)}
            onClick={() =>
              void famille.bonPlan(propre, duree).then((ok) => {
                if (ok) setTexte("");
              })
            }
          >
            🔔 Envoyer à ma famille
          </button>
        </div>
      )}
      <p className="fc-regle">
        Sur ta page, tes fantômes d’or le voient tout de suite, l’argent {OUVERTURE_BON_PLAN.argent} minutes après, le bronze {OUVERTURE_BON_PLAN.bronze} minutes après.
        Bientôt aussi sur WhatsApp, par Mike.
      </p>
    </section>
  );
}

/** 🎁 JE TE GÂTE : ce qu'il peut offrir à sa famille ce mois-ci, et combien il en reste. */
function JeTeGate({ commerce, famille, f }: { commerce: CommerceComptoir; famille: FamilleDuComptoir; f: FamilleAuComptoir }) {
  const depart = f.gate ?? f.gateDernier;
  const [quoi, setQuoi] = useState(depart?.quoi ?? "");
  const [combien, setCombien] = useState(String(depart?.combien ?? 10));
  const [fait, setFait] = useState(false);
  const propre = plusPropre(quoi);
  const interdit = Boolean(propre) && !plusPermis(propre);
  const n = Number(combien);
  const valide = Boolean(propre) && !interdit && Number.isInteger(n) && n >= 0 && n <= GATE_MAX;
  const mois = new Date().toLocaleDateString("fr-FR", { month: "long", timeZone: "Europe/Paris" });
  if (!f.bonsPlansActifs) return null;
  return (
    <section className="fc-gate">
      <h3>🎁 Je te gâte</h3>
      <p className="fc-regle">Ce que tu peux offrir à ta famille en {mois}. Tu l’offres sur leurs petits mots (🎁 Offrir…), et ta page dit combien il en reste à gagner.</p>
      {f.gate && (
        <p className="fc-gate-etat">
          En {mois} : <b>{nb(f.gate.combien)} × {f.gate.quoi}</b> · {nb(f.gate.offerts)} {f.gate.offerts > 1 ? "offerts" : "offert"} · il en reste <b>{nb(resteDuGate(f.gate))}</b>
        </p>
      )}
      <div className="fc-gate-form">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={GATE_MAX}
          value={combien}
          aria-label="Combien ce mois-ci"
          onChange={(e) => setCombien(e.target.value)}
        />
        <span aria-hidden="true">×</span>
        <input value={quoi} maxLength={60} placeholder="ce que tu offres" aria-label="Ce que tu offres" onChange={(e) => setQuoi(e.target.value)} />
      </div>
      <div className="fc-puces">
        {plusDe(commerce.famille).map((p) => (
          <button key={p} type="button" className={propre === p ? "on" : ""} onClick={() => setQuoi(p)}>
            {p}
          </button>
        ))}
      </div>
      {interdit && <p className="ck-ennui">Pas d’alcool offert : la loi Évin l’interdit.</p>}
      <button
        type="button"
        className="fc-envoyer"
        disabled={!valide || Boolean(famille.occupe)}
        onClick={() =>
          void famille.gate(propre, n).then((ok) => {
            if (!ok) return;
            setFait(true);
            window.setTimeout(() => setFait(false), 2200);
          })
        }
      >
        {fait ? "✓ Enregistré" : f.gate ? "Changer" : "Enregistrer"}
      </button>
    </section>
  );
}

type EtatSurprises = {
  actif: boolean;
  surprises: { libelle: string; stock: number; pris: number }[];
  prises: { libelle: string; prenom: string; numero: number }[];
};

/**
 * 🎁 LA SURPRISE DU CHEF : ses surprises d'aujourd'hui, chacune avec combien il en offre. Sur sa page, sa famille
 * ouvre une cage dorée : une surprise au hasard, une par personne, tant qu'il en reste. Il voit qui a pris quoi.
 * Seulement chez un vrai commerçant (la route du comptoir, avec son jeton).
 */
function SurpriseDuChef({ commerce }: { commerce: CommerceComptoir }) {
  const reel = commerce.reel;
  const [etat, setEtat] = useState<EtatSurprises | null>(null);
  const [lignes, setLignes] = useState<{ libelle: string; stock: string }[]>([{ libelle: "", stock: "4" }]);
  const [ennui, setEnnui] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [fait, setFait] = useState(false);
  const appeler = useCallback(
    async (corps: Record<string, unknown>): Promise<EtatSurprises> => {
      const r = await fetch("/api/site-internet/pro/famille", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: reel?.slug, token: reel?.token, ...corps }),
      });
      const j = (await r.json().catch(() => null)) as (EtatSurprises & { ok?: boolean; error?: string }) | null;
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Ça n’a pas marché. Réessaie dans un instant.");
      return j;
    },
    [reel],
  );
  useEffect(() => {
    if (!reel) return;
    let fini = false;
    appeler({ action: "surprises-lire" })
      .then((j) => {
        if (fini) return;
        setEtat(j);
        if (j.surprises.length) setLignes(j.surprises.map((x) => ({ libelle: x.libelle, stock: String(x.stock) })));
      })
      .catch(() => {});
    return () => {
      fini = true;
    };
  }, [reel, appeler]);
  if (!reel || !etat?.actif) return null;
  const changer = (k: number, quoi: Partial<{ libelle: string; stock: string }>) => setLignes((l) => l.map((x, i) => (i === k ? { ...x, ...quoi } : x)));
  const mettreEnLigne = async () => {
    setOccupe(true);
    setEnnui("");
    try {
      const liste = lignes.filter((x) => x.libelle.trim()).map((x) => ({ libelle: x.libelle.trim(), stock: Number(x.stock) }));
      setEtat(await appeler({ action: "surprises", liste }));
      setFait(true);
      window.setTimeout(() => setFait(false), 2200);
    } catch (e) {
      setEnnui((e as Error).message);
    } finally {
      setOccupe(false);
    }
  };
  const interdite = lignes.some((x) => x.libelle.trim() && !plusPermis(x.libelle.trim()));
  return (
    <section className="fc-surprise">
      <h3>🎁 La surprise du chef</h3>
      <p className="fc-regle">Tes surprises d’aujourd’hui, et combien tu en offres. Sur ta page, ta famille ouvre une cage dorée : une surprise au hasard, une par personne, tant qu’il en reste.</p>
      {etat.surprises.length > 0 && (
        <p className="fc-surprise-etat">
          Aujourd’hui :{" "}
          {etat.surprises.map((x, k) => (
            <span key={k}>
              {k ? " · " : ""}
              {x.libelle} <b>{nb(x.pris)}/{nb(x.stock)}</b>
            </span>
          ))}
        </p>
      )}
      {etat.prises.length > 0 && (
        <p className="fc-regle fc-prises">
          Déjà prises : {etat.prises.map((x) => `${x.prenom || "un fantôme"} n°${x.numero} (${x.libelle})`).join(" · ")}
        </p>
      )}
      {lignes.map((l, k) => (
        <div className="fc-surprise-ligne" key={k}>
          <input type="number" inputMode="numeric" min={1} max={SURPRISE_STOCK_MAX} value={l.stock} aria-label="Combien" onChange={(e) => changer(k, { stock: e.target.value })} />
          <span aria-hidden="true">×</span>
          <input value={l.libelle} maxLength={80} placeholder="ta surprise" aria-label="Ta surprise" onChange={(e) => changer(k, { libelle: e.target.value })} />
        </div>
      ))}
      <div className="fc-puces">
        {ideesDeSurprises(commerce.branche).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() =>
              setLignes((l) => {
                const vide = l.findIndex((x) => !x.libelle.trim());
                if (vide >= 0) return l.map((x, i) => (i === vide ? { ...x, libelle: p } : x));
                return l.length < SURPRISES_MAX ? [...l, { libelle: p, stock: "4" }] : l;
              })
            }
          >
            {p}
          </button>
        ))}
      </div>
      {lignes.length < SURPRISES_MAX && (
        <button type="button" className="fc-lien-ajout" onClick={() => setLignes((l) => [...l, { libelle: "", stock: "4" }])}>
          + Une autre surprise
        </button>
      )}
      {interdite && <p className="ck-ennui">Pas d’alcool dans les surprises : la loi Évin l’interdit.</p>}
      {ennui && <p className="ck-ennui">{ennui}</p>}
      <button type="button" className="fc-envoyer" disabled={occupe || interdite} onClick={() => void mettreEnLigne()}>
        {fait ? "✓ En ligne" : etat.surprises.length ? "Mettre à jour" : "Mettre en ligne"}
      </button>
    </section>
  );
}

const STYLES = `
.fc-lien-ajout{align-self:flex-start;padding:0;border:0;background:none;color:var(--ambre,#F5A23A);font:inherit;font-size:13.5px;font-weight:700;cursor:pointer}
.fc-prises{font-size:12.5px}
.fc-bonplan,.fc-gate,.fc-surprise{display:flex;flex-direction:column;gap:8px;}
.fc-bp-encours{display:flex;flex-direction:column;gap:8px;padding:12px 14px;border-radius:18px;background:var(--nappe);border:1.5px solid var(--ambre);}
.fc-bp-encours q{font-size:16px;font-weight:700;line-height:1.35;}
.fc-bp-encours small{font-size:12.5px;color:var(--gris);}
.fc-bp-heures{display:flex;flex-wrap:wrap;gap:6px;list-style:none;margin:0;padding:0;}
.fc-bp-heures li{padding:4px 10px;border-radius:999px;background:var(--fond);border:1px solid var(--trait);font-size:12.5px;}
.fc-bp-heures b{margin-left:4px;}
.fc-bp-ecrire{display:flex;flex-direction:column;gap:8px;}
.fc-bp-ecrire input,.fc-gate-form input,.fc-surprise-ligne input{min-height:42px;padding:0 12px;border-radius:12px;border:1px solid var(--trait);background:var(--fond);color:var(--creme);font:inherit;font-size:15px;}
.fc-puces{display:flex;flex-wrap:wrap;gap:6px;}
.fc-puces button{min-height:34px;padding:0 12px;border-radius:999px;border:1px solid var(--trait);background:var(--nappe);color:var(--creme);font-weight:700;font-size:13px;}
.fc-puces button.on{border-color:var(--ambre);background:var(--ambre);color:#2A1404;}
.fc-envoyer{min-height:46px;border:0;border-radius:14px;background:var(--rose,#FF2E9A);color:#fff;font-weight:800;font-size:15px;}
.fc-envoyer:disabled{opacity:.45;}
.fc-gate-form,.fc-surprise-ligne{display:grid;grid-template-columns:84px auto 1fr;gap:8px;align-items:center;}
.fc-gate-form span,.fc-surprise-ligne span{font-weight:800;color:var(--gris);}
.fc-gate-etat,.fc-surprise-etat{margin:0;padding:10px 14px;border-radius:14px;background:rgba(245,162,58,.1);border:1px solid rgba(245,162,58,.35);font-size:14px;}
.fc-gate-etat b{color:var(--ambre);}
.fc-carte .fc-carte-titre{font-family:var(--font-clikme),sans-serif;font-style:normal;font-size:15px;font-weight:800;color:var(--creme);}
.fc-jauge{display:block;height:6px;margin-top:6px;border-radius:3px;background:rgba(255,255,255,.1);overflow:hidden;}
.fc-jauge i{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,var(--rose,#FF2E9A),#F2C46B);}
.fc-jauge.grande{height:9px;margin-top:10px;}
.fc h3{margin:6px 2px 0;display:flex;align-items:baseline;gap:8px;font-family:var(--font-clikme),sans-serif;font-size:17px;font-weight:800;letter-spacing:-.01em;}
.fc h3 small{font-size:12.5px;font-weight:700;color:var(--gris);}
.fc-regle{margin:0 2px;font-size:12.5px;line-height:1.45;color:var(--gris);}
.fc-foule{padding:14px;border-radius:20px;background:var(--nappe);border:1px solid var(--trait);}
.fc-l1{display:flex;align-items:center;gap:10px;}
.fc-l1 b{font-family:var(--font-clikme),sans-serif;font-size:40px;font-weight:800;line-height:1;}
.fc-l1 span{font-size:13.5px;line-height:1.2;color:var(--gris);}
.fc-l1 em{margin-left:auto;text-align:right;font-style:normal;font-size:12.5px;font-weight:700;color:#F2C46B;line-height:1.15;}
.fc-l1 em strong{display:block;font-family:var(--font-clikme),sans-serif;font-size:24px;font-weight:800;}
.fc-foule p{margin:10px 0 0;font-size:14px;line-height:1.4;}
.fc-petits{display:flex;flex-wrap:wrap;gap:6px 14px;list-style:none;margin:10px 0 0;padding:0;font-size:12.5px;color:var(--gris);}
.fc-petits b{color:var(--creme);}
.fc-lien{display:flex;flex-direction:column;gap:6px;padding:14px;border-radius:20px;background:var(--nappe);border:1px solid var(--trait);}
.fc-lien h3{margin:0;}
.fc-lien p{margin:0;font-size:13px;color:var(--gris);}
.fc-lien-ligne{display:flex;gap:8px;align-items:center;}
.fc-lien-ligne code{flex:1;min-width:0;padding:9px 12px;border-radius:12px;background:var(--fond);border:1px solid var(--trait);font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.fc-lien-bas{display:flex;justify-content:space-between;gap:10px;}
.fc-depart{display:flex;flex-direction:column;gap:8px;}
.fc-depart ol{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;}
.fc-depart li{display:flex;flex-direction:column;gap:8px;padding:12px 14px;border-radius:18px;background:var(--nappe);border:1.5px solid var(--ambre);}
.fc-depart li.fait{border-color:var(--trait);opacity:.75;}
.fc-depart li > b{font-size:15px;}
.fc-depart li > span{font-size:13px;color:var(--gris);}
.fc-depart q{font-size:15px;font-style:italic;line-height:1.35;}
.fc-coche{align-self:flex-start;min-height:36px;padding:0 14px;border-radius:999px;border:1.5px solid var(--ambre);background:none;color:var(--ambre);font-weight:800;font-size:13.5px;}
.fc-coche.fait{border-color:#3DE2A6;color:#3DE2A6;}
.fc-comment{align-self:flex-start;border:0;background:none;padding:0;color:var(--ambre);font-weight:700;font-size:13px;text-decoration:underline;}
.fc-reseaux{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;font-size:13px;line-height:1.4;color:var(--gris);}
.fc-reseaux b{color:var(--creme);}
.fc-carton{font-size:14px;font-weight:700;color:var(--ambre);text-decoration:none;}
.fc-lien code{flex:1;min-width:0;padding:9px 12px;border-radius:12px;background:var(--fond);border:1px solid var(--trait);font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.fc-lien a{font-size:14px;font-weight:700;color:var(--ambre);text-decoration:none;}
.fc-paliers,.fc-parcours,.fc-mots{display:flex;flex-direction:column;gap:8px;}
.fc-tuiles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.fc-tuile{display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 6px;border-radius:16px;background:var(--nappe);border:1px solid var(--trait);}
.fc-tuile span{font-size:24px;}
.fc-tuile b{font-family:var(--font-clikme),sans-serif;font-size:22px;font-weight:800;}
.fc-tuile small{font-size:12px;color:var(--gris);}
.fc-tuile.or{border-color:rgba(233,190,92,.55);}
.fc-fideles{display:flex;gap:8px;overflow-x:auto;list-style:none;margin:0;padding:2px 0 4px;scrollbar-width:none;}
.fc-fideles::-webkit-scrollbar{display:none;}
.fc-fideles li{flex:none;display:flex;align-items:center;gap:6px;padding:6px 10px 6px 6px;border-radius:999px;background:var(--nappe);border:1px solid var(--trait);}
.fc-fideles img{width:30px;height:30px;object-fit:contain;}
.fc-fideles span{display:flex;flex-direction:column;line-height:1.15;}
.fc-fideles b{font-size:13.5px;}
.fc-fideles small{font-size:11.5px;color:var(--gris);}
.fc-parcours ol{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;}
.fc-parcours li{display:grid;grid-template-columns:28px 1fr auto;align-items:center;gap:8px;padding:10px 12px;border-radius:16px;background:var(--nappe);border:1px solid var(--trait);}
.fc-parcours li > span:first-child{font-size:20px;text-align:center;}
.fc-parcours li span{display:flex;flex-direction:column;font-size:14px;line-height:1.3;}
.fc-parcours li small{font-size:12px;color:var(--gris);}
.fc-parcours li b{font-family:var(--font-clikme),sans-serif;font-size:20px;font-weight:800;}
.fc-parcours li.bientot{opacity:.55;border-style:dashed;}
.fc-motdujour{margin:0;padding:12px 14px;border-radius:16px;background:var(--creme);color:#2C0912;}
.fc-motdujour blockquote{margin:0;font-family:var(--font-enseigne),Georgia,serif;font-style:italic;font-weight:700;font-size:17px;line-height:1.3;}
.fc-motdujour figcaption{margin-top:4px;font-size:12.5px;font-weight:600;color:#7A5560;}
.fc-mot{display:grid;grid-template-columns:1fr auto;gap:2px 10px;align-items:center;padding:10px 12px;border-radius:16px;background:var(--nappe);border:1px solid var(--trait);}
.fc-mot.epingle{border-color:var(--ambre);}
.fc-mot q{font-size:14.5px;line-height:1.35;}
.fc-mot small{grid-column:1;font-size:12px;color:var(--gris);}
.fc-mot button{grid-column:2;grid-row:1 / span 2;}
`;
