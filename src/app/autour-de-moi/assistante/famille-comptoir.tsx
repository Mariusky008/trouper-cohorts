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
//     de sa page avec le prénom et le numéro de son auteur.
//
// LA DÉMONSTRATION a une famille inventée (`familleAuComptoirDemo`), et le mot qu'il épingle reste
// dans ce téléphone. Un vrai commerçant lit la sienne (`api/site-internet/pro/famille`).
import { useCallback, useEffect, useState } from "react";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import {
  EMOJI_GRADE,
  familleAuComptoirDemo,
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
      setF(avecEpingle(familleAuComptoirDemo(commerce.id, Date.now()), epingleDemo(commerce)));
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

  return { f, pret, ennui, occupe, recharger: charger, epingler, demo: !reel };
}
export type FamilleDuComptoir = ReturnType<typeof useFamille>;

/** Ce que dit la carte : la foule du jour et ce qu'il manque pour le record. */
function motDeLaCarte(f: FamilleAuComptoir): { titre: string; mot: string; chaud: boolean } {
  if (f.membres === 0) return { titre: "Ta famille commence aujourd’hui", mot: "Ton lien, à la fin de tes vidéos : les premiers fantômes arrivent", chaud: false };
  const titre = `Aujourd’hui ${nb(f.aujourdhui)}${f.record ? ` · record ${nb(Math.max(f.record, f.aujourdhui))}` : ""}`;
  const mots = [
    f.nouveaux > 0 && `+${nb(f.nouveaux)} ${f.nouveaux > 1 ? "nouveaux" : "nouveau"}`,
    recordBattu(f) ? "🎉 Record battu !" : f.record ? `Plus que ${nb(manquePourRecord(f))} pour le record` : "",
  ].filter(Boolean);
  return { titre, mot: mots.join(" · ") || `${nb(f.membres)} fantômes dans ta famille`, chaud: recordBattu(f) || f.nouveaux > 0 };
}

/** 👻 La carte en tête de l'accueil. */
export function CarteFamille({ famille, onOuvrir }: { famille: FamilleDuComptoir; onOuvrir: () => void }) {
  if (famille.pret && !famille.f) return null;
  const m = famille.f ? motDeLaCarte(famille.f) : { titre: "", mot: "…", chaud: false };
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
  const [copie, setCopie] = useState(false);
  const f = famille.f;
  const lien = commerce.reel ? `clikme.fr/f/${commerce.reel.slug}` : "";
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(`https://${lien}`);
      setCopie(true);
      window.setTimeout(() => setCopie(false), 2200);
    } catch {
      /* presse-papiers refusé : le lien reste écrit, à recopier */
    }
  };
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

          {lien && (
            <section className="fc-lien">
              <h3>Ton lien</h3>
              <p>À mettre en premier dans ta bio, et à dire à la fin de tes vidéos.</p>
              <div>
                <code>{lien}</code>
                <button type="button" className="ck-passage" onClick={() => void copier()}>
                  {copie ? "✓ Copié" : "Copier"}
                </button>
              </div>
              <a href={`/f/${encodeURIComponent(commerce.reel!.slug)}?moi=1`} target="_blank" rel="noopener noreferrer">
                Voir ma page ›
              </a>
            </section>
          )}

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

const STYLES = `
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
.fc-lien div{display:flex;gap:8px;align-items:center;}
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
