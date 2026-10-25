"use client";

// 📲 « OUI, PRÉVIENS-LES » — au comptoir, Mike propose, le commerçant dit oui.
//
// « 11 personnes ont promis de venir après votre vidéo. Si c'est calme aujourd'hui,
// je peux les prévenir pour vous. On le fait ? » C'est la scène de Mike dans les
// tours du fantôme (`outils/tour-du-fantome/LISEZ-MOI.md`), ici pour de vrai :
//
//   · UNE CARTE EN HAUT DE L'ACCUEIL quand des personnes ont laissé leur numéro pour
//     être prévenues et qu'on peut leur écrire aujourd'hui : « Oui, préviens-les »,
//     ou « Pas aujourd'hui » (elle revient demain).
//   · L'ÉCRAN : il dit ce qui est vrai aujourd'hui — quand, combien de places s'il le
//     sait, un petit plus s'il en veut un (rien par défaut), tu ou vous — et Mike écrit
//     un message par personne. Il le relit, le change s'il veut, et touche « Envoyer » :
//     SON WhatsApp s'ouvre sur la conversation de cette personne, le message prêt.
//     Rien ne part par ClikMe, et rien ne part à toute la ville.
//
// Les règles (deux messages par semaine, rien avant 9 h ni après 20 h 30, un petit plus
// rare et jamais d'alcool…) sont dans `lib/direct/previens-les.ts`, et revérifiées par la
// route. LA DÉMONSTRATION n'a pas de numéros (prénoms inventés) : rien ne s'ouvre, on
// voit seulement le message partir.
import { useEffect, useState } from "react";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import type { LigneCarnet } from "@/lib/direct/carnet";
import { lookDe } from "@/lib/direct/look";
import { jourParis } from "@/lib/jour-paris";
import {
  HEURES_FERMEES,
  heureOuverte,
  lienWhatsApp,
  messagePour,
  peutLuiEcrire,
  plusDe,
  plusPermis,
  plusPourLui,
  plusPropre,
  quandsDe,
  sorteDe,
} from "@/lib/direct/previens-les";
import type { CarnetDuComptoir } from "./carnet-comptoir";

/** Ceux qu'on peut prévenir aujourd'hui : un numéro, pas de stop, et les règles le permettent. */
export function aPrevenir(lignes: LigneCarnet[], maintenant = Date.now()): LigneCarnet[] {
  return lignes.filter((l) => l.prevenir && !l.stop && peutLuiEcrire(l.messages, maintenant).oui);
}

/* « PAS AUJOURD'HUI » : la carte revient demain. Gardé dans ce téléphone, par commerce. */
const clePasAujourdhui = (c: CommerceComptoir) => `clikme:mike-pas-aujourdhui:${c.id}`;
function lirePasAujourdhui(c: CommerceComptoir): string {
  try {
    return window.localStorage.getItem(clePasAujourdhui(c)) ?? "";
  } catch {
    return "";
  }
}

/* TU OU VOUS : il choisit une fois, Mike s'en souvient. Le carnet de messages tutoie. */
const cleTu = (c: CommerceComptoir) => `clikme:mike-tu:${c.id}`;
function lireTu(c: CommerceComptoir): boolean {
  try {
    return window.localStorage.getItem(cleTu(c)) !== "vous";
  } catch {
    return true;
  }
}

/** Ce que Mike propose, selon ce qui se libère chez lui. */
function proposition(commerce: CommerceComptoir): string {
  const sorte = sorteDe(commerce.famille);
  if (sorte === "table") return "Une table libre aujourd’hui ? Je les préviens sur ton WhatsApp.";
  if (sorte === "creneau") return "Un créneau libre ? Je les préviens sur ton WhatsApp.";
  return "C’est calme aujourd’hui ? Je les préviens sur ton WhatsApp.";
}

/** 📲 La carte de Mike, en haut de l'accueil : seulement quand il y a quelqu'un à prévenir, et à une heure où l'on peut écrire. */
export function CarteMike({
  commerce,
  dossier,
  carnet,
  onOui,
}: {
  commerce: CommerceComptoir;
  dossier: string;
  carnet: CarnetDuComptoir;
  onOui: () => void;
}) {
  const [refuse, setRefuse] = useState(() => lirePasAujourdhui(commerce));
  if (!carnet.pret || !heureOuverte()) return null;
  const aujourdhui = jourParis();
  if (refuse === aujourdhui) return null;
  const n = aPrevenir(carnet.lignes).length;
  if (!n) return null;
  const pasAujourdhui = () => {
    try {
      window.localStorage.setItem(clePasAujourdhui(commerce), aujourdhui);
    } catch {
      /* stockage indisponible : la carte s'en va le temps de la visite */
    }
    setRefuse(aujourdhui);
  };
  return (
    <section className="pl-carte" aria-label="Mike, ton assistant">
      <div className="pl-carte-haut">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${dossier}visage.webp`} alt="" />
        <span>
          <b>Mike</b> · ton assistant
        </span>
      </div>
      <p className="pl-carte-dit">
        <b>
          {n} {n > 1 ? "personnes attendent" : "personne attend"} ton signal.
        </b>{" "}
        {proposition(commerce)}
      </p>
      <div className="pl-carte-boutons">
        <button type="button" className="pl-oui" onClick={onOui}>
          Oui, préviens-les
        </button>
        <button type="button" className="pl-non" onClick={pasAujourdhui}>
          Pas aujourd’hui
        </button>
      </div>
      <style>{STYLES}</style>
    </section>
  );
}

/** L'écran : ce qui est vrai aujourd'hui, puis un message par personne, envoyé depuis son WhatsApp. */
export function PreviensLes({
  commerce,
  dossier,
  carnet,
  onRetour,
}: {
  commerce: CommerceComptoir;
  dossier: string;
  carnet: CarnetDuComptoir;
  onRetour: () => void;
}) {
  const quands = quandsDe(commerce.famille);
  const suggestions = plusDe(commerce.famille);
  const sorte = sorteDe(commerce.famille);
  const [quand, setQuand] = useState(quands[0]);
  const [heure, setHeure] = useState("");
  const [places, setPlaces] = useState(0);
  /** Le petit plus : « » (rien), une suggestion, ou ce qu'il écrit (`autre`). */
  const [plus, setPlus] = useState("");
  const [autre, setAutre] = useState<string | null>(null);
  const [tu, setTu] = useState(() => lireTu(commerce));
  const [textes, setTextes] = useState<Record<string, string>>({});
  const [envoyes, setEnvoyes] = useState<Record<string, boolean>>({});
  const [numeros, setNumeros] = useState<Record<string, string> | null>(null);
  const [maintenant] = useState(() => Date.now());

  const { numeros: lireNumeros } = carnet;
  useEffect(() => {
    let fini = false;
    lireNumeros()
      .then((n) => {
        if (!fini) setNumeros(n);
      })
      .catch(() => {
        if (!fini) setNumeros({});
      });
    return () => {
      fini = true;
    };
  }, [lireNumeros]);

  const choisirTu = (oui: boolean) => {
    setTu(oui);
    try {
      window.localStorage.setItem(cleTu(commerce), oui ? "tu" : "vous");
    } catch {
      /* stockage indisponible */
    }
  };

  const choisirPlus = (p: string) => {
    setPlus(p);
    setAutre(null);
  };
  /** Il revient au message de Mike : on oublie ce qu'il avait écrit pour cette personne. */
  const oublierTexte = (ref: string) =>
    setTextes((t) => {
      const reste = { ...t };
      delete reste[ref];
      return reste;
    });

  const petitPlus = autre !== null ? plusPropre(autre) : plus;
  const plusInterdit = Boolean(petitPlus) && !plusPermis(petitPlus);
  const ouvert = heureOuverte();
  // Ceux qui voulaient être prévenus. Ceux qu'on ne peut pas prévenir aujourd'hui restent visibles, grisés, avec la raison.
  const destinataires = carnet.lignes.filter((l) => l.prevenir && !l.stop);
  const aEnvoyer = destinataires.filter((l) => !envoyes[l.ref] && peutLuiEcrire(l.messages, maintenant).oui).length;

  return (
    <div className="pl">
      <div className="pl-haut">
        <button type="button" className="pl-retour" onClick={onRetour}>
          ‹ Mon comptoir
        </button>
      </div>

      <section className="pl-mike">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${dossier}visage.webp`} alt="" />
        <div>
          <h2>Mike · ton assistant</h2>
          <p>
            Dis-moi ce qui est vrai aujourd’hui, j’écris les messages. Ils partent de ton WhatsApp, et seulement à ceux qui m’ont demandé de les
            prévenir.
          </p>
        </div>
      </section>

      {!ouvert && <p className="pl-ennui">{HEURES_FERMEES} Prépare tes messages, et reviens les envoyer demain matin.</p>}

      <section className="pl-bloc">
        <h3>Quand&nbsp;?</h3>
        <div className="pl-puces">
          {quands.map((q) => (
            <button key={q} type="button" className={q === quand ? "on" : ""} aria-pressed={q === quand} onClick={() => setQuand(q)}>
              {q}
            </button>
          ))}
        </div>
        <input className="pl-champ" value={heure} maxLength={20} onChange={(e) => setHeure(e.target.value)} placeholder="À quelle heure ? (facultatif)" aria-label="À quelle heure" />
      </section>

      {sorte !== "passage" && (
        <section className="pl-bloc">
          <h3>Combien {sorte === "table" ? "de places" : "de créneaux"}&nbsp;?</h3>
          <div className="pl-puces">
            {[0, 1, 2, 3, 4].map((n) => (
              <button key={n} type="button" className={n === places ? "on" : ""} aria-pressed={n === places} onClick={() => setPlaces(n)}>
                {n ? String(n) : "Je ne dis pas"}
              </button>
            ))}
          </div>
          <p className="pl-petit">Seulement si c’est vrai : Mike ne crée jamais de fausse urgence.</p>
        </section>
      )}

      <section className="pl-bloc">
        <h3>Un petit plus&nbsp;?</h3>
        <div className="pl-puces">
          <button type="button" className={!petitPlus && autre === null ? "on" : ""} onClick={() => choisirPlus("")}>
            Rien, juste prévenir
          </button>
          {suggestions.map((s) => (
            <button key={s} type="button" className={autre === null && plus === s ? "on" : ""} onClick={() => choisirPlus(s)}>
              {s}
            </button>
          ))}
          <button type="button" className={autre !== null ? "on" : ""} onClick={() => setAutre(autre ?? "")}>
            Autre…
          </button>
        </div>
        {autre !== null && (
          <input className="pl-champ" value={autre} maxLength={60} onChange={(e) => setAutre(e.target.value)} placeholder="Ce que tu offres, en quelques mots" aria-label="Le petit plus" autoFocus />
        )}
        {plusInterdit ? (
          <p className="pl-ennui">Pas d’alcool offert : la loi Évin l’interdit. Choisis autre chose.</p>
        ) : (
          <p className="pl-petit">C’est toi qui choisis, jamais imposé. Mike ne l’offre pas deux fois à la même personne.</p>
        )}
      </section>

      <section className="pl-bloc">
        <h3>Tu ou vous&nbsp;?</h3>
        <div className="pl-puces">
          <button type="button" className={tu ? "on" : ""} aria-pressed={tu} onClick={() => choisirTu(true)}>
            Tu
          </button>
          <button type="button" className={!tu ? "on" : ""} aria-pressed={!tu} onClick={() => choisirTu(false)}>
            Vous
          </button>
        </div>
      </section>

      <section className="pl-bloc">
        <h3>
          Les messages <i>{aEnvoyer}</i>
        </h3>
        {carnet.demo && <p className="pl-petit">Démonstration : ces prénoms sont inventés, rien ne part. Chez toi, WhatsApp s’ouvre avec le message.</p>}
        {carnet.ennui && (
          <p className="pl-ennui" role="alert">
            {carnet.ennui}
          </p>
        )}
        {destinataires.length === 0 && <p className="pl-vide">Personne à prévenir pour l’instant.</p>}
        {destinataires.map((l) => {
          const regle = peutLuiEcrire(l.messages, maintenant);
          const envoye = Boolean(envoyes[l.ref]);
          const sonPlus = !plusInterdit && plusPourLui(l.messages, petitPlus) ? petitPlus : "";
          const propose = messagePour({
            prenom: l.prenom,
            commerce: commerce.nom,
            famille: commerce.famille,
            quand,
            heure,
            places,
            plus: sonPlus,
            tu,
            premier: l.messages.length === 0,
          });
          const texte = textes[l.ref] ?? propose;
          const qui = l.prenom || "cette personne";
          const numero = numeros?.[l.ref] ?? "";
          const bloque = !envoye && !regle.oui;
          const peut = ouvert && !envoye && !bloque && texte.trim().length > 0;
          const marquer = async () => {
            if (await carnet.envoye(l.ref, texte.trim(), sonPlus)) setEnvoyes((e) => ({ ...e, [l.ref]: true }));
          };
          return (
            <article key={l.ref} className={`pl-msg${envoye ? " envoye" : ""}${bloque ? " bloque" : ""}`}>
              <div className="pl-msg-qui">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={lookDe(l.look).image} alt="" />
                <b>{l.prenom || "Sans prénom"}</b>
                {bloque && <em>{regle.pourquoi}</em>}
                {!bloque && !envoye && petitPlus && !sonPlus && !plusInterdit && <em>Sans le petit plus : déjà offert récemment</em>}
              </div>
              {!bloque && (
                <>
                  <textarea
                    className="pl-texte"
                    value={texte}
                    rows={Math.max(3, Math.ceil(texte.length / 36))}
                    disabled={envoye}
                    onChange={(e) => setTextes((t) => ({ ...t, [l.ref]: e.target.value }))}
                    aria-label={`Le message pour ${qui}`}
                  />
                  {envoye ? (
                    <p className="pl-fait" role="status">
                      ✓ Envoyé. {carnet.demo ? "Chez toi, sa réponse arrive sur ton WhatsApp." : "Sa réponse arrivera sur ton WhatsApp."}
                    </p>
                  ) : carnet.demo ? (
                    <button type="button" className="pl-envoyer" disabled={!peut} onClick={() => void marquer()}>
                      📲 Envoyer à {qui}
                    </button>
                  ) : numero ? (
                    <a
                      className={`pl-envoyer${peut ? "" : " eteint"}`}
                      href={peut ? lienWhatsApp(numero, texte.trim()) : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-disabled={!peut}
                      onClick={(e) => {
                        if (!peut) {
                          e.preventDefault();
                          return;
                        }
                        void marquer();
                      }}
                    >
                      📲 Envoyer à {qui}
                    </a>
                  ) : (
                    <p className="pl-petit">{numeros === null ? "…" : "Son numéro est introuvable : cette personne a peut-être dit stop entre-temps."}</p>
                  )}
                  {textes[l.ref] !== undefined && !envoye && (
                    <button type="button" className="pl-lien" onClick={() => oublierTexte(l.ref)}>
                      Revenir au message de Mike
                    </button>
                  )}
                </>
              )}
            </article>
          );
        })}
        <p className="pl-petit">WhatsApp s’ouvre sur sa conversation, le message prêt : touche Envoyer, puis reviens ici pour le suivant.</p>
      </section>
      <style>{STYLES}</style>
    </div>
  );
}

const STYLES = `
.pl-carte{display:flex;flex-direction:column;gap:10px;padding:14px 16px;border-radius:22px;background:linear-gradient(135deg,rgba(37,211,102,.16),rgba(37,211,102,.05));
  border:1px solid rgba(37,211,102,.4);color:var(--creme,#FFF4E6);}
.pl-carte-haut{display:flex;align-items:center;gap:10px;font-size:13px;color:#BFE8CD;}
.pl-carte-haut img{width:38px;height:38px;border-radius:50%;object-fit:cover;background:var(--nappe2,#261B16);}
.pl-carte-haut b{font-family:var(--font-clikme),sans-serif;font-size:15px;font-weight:800;color:var(--creme,#FFF4E6);}
.pl-carte-dit{margin:0;font-size:14.5px;line-height:1.45;}
.pl-carte-dit b{font-family:var(--font-clikme),sans-serif;font-weight:800;}
.pl-carte-boutons{display:flex;flex-wrap:wrap;gap:8px;}
.pl-oui{min-height:42px;padding:0 18px;border:0;border-radius:999px;background:#25D366;color:#06260F;font-weight:800;font-size:14.5px;}
.pl-non{min-height:42px;padding:0 14px;border:0;background:none;color:var(--gris,#CDB8A4);font-weight:700;font-size:13.5px;}
.pl{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:12px 16px calc(28px + env(safe-area-inset-bottom,0px));scrollbar-width:none;
  display:flex;flex-direction:column;gap:16px;}
.pl::-webkit-scrollbar{display:none;}
.pl-haut{display:flex;align-items:center;}
.pl-retour{border:1px solid var(--trait);border-radius:999px;padding:9px 16px;background:var(--nappe);color:var(--creme);font-weight:700;}
.pl-mike{display:grid;grid-template-columns:64px 1fr;gap:14px;align-items:center;padding:14px;border-radius:22px;background:var(--nappe);border:1px solid rgba(37,211,102,.32);}
.pl-mike img{width:64px;height:64px;border-radius:50%;object-fit:cover;background:var(--nappe2);}
.pl-mike h2{margin:0;font-family:var(--font-clikme),sans-serif;font-size:18px;font-weight:800;}
.pl-mike p{margin:4px 0 0;font-size:14px;line-height:1.4;color:var(--gris);}
.pl-bloc{display:flex;flex-direction:column;gap:8px;}
.pl-bloc h3{margin:0 2px;display:flex;align-items:center;gap:8px;font-family:var(--font-clikme),sans-serif;font-size:16.5px;font-weight:800;}
.pl-bloc h3 i{font-style:normal;min-width:24px;height:24px;padding:0 7px;border-radius:999px;display:inline-grid;place-items:center;background:#25D366;color:#06260F;font-size:13px;}
.pl-puces{display:flex;flex-wrap:wrap;gap:6px;}
.pl-puces button{min-height:38px;padding:0 14px;border-radius:999px;border:1px solid var(--trait);background:var(--nappe);color:var(--creme);font-weight:700;font-size:13.5px;}
.pl-puces button.on{border-color:var(--rose);background:var(--rose);color:#fff;}
.pl-champ{width:100%;box-sizing:border-box;min-height:42px;padding:0 14px;border-radius:14px;border:1px solid var(--trait);background:var(--fond);color:var(--creme);font:inherit;font-size:15px;}
.pl-petit{margin:0 2px;font-size:12.5px;line-height:1.4;color:#9A7A62;}
.pl-ennui{margin:0;padding:10px 14px;border-radius:14px;background:rgba(255,46,154,.12);border:1px solid rgba(255,46,154,.4);font-size:13.5px;line-height:1.4;}
.pl-vide{margin:0;padding:16px;border-radius:16px;border:1px dashed var(--trait);text-align:center;font-size:14px;color:var(--gris);}
.pl-msg{display:flex;flex-direction:column;gap:8px;padding:12px;border-radius:18px;background:var(--nappe);border:1px solid var(--trait);}
.pl-msg.envoye{border-color:rgba(37,211,102,.45);}
.pl-msg.bloque{opacity:.6;}
.pl-msg-qui{display:flex;align-items:center;flex-wrap:wrap;gap:4px 10px;}
.pl-msg-qui img{width:34px;height:40px;object-fit:contain;object-position:50% 100%;}
.pl-msg-qui b{font-family:var(--font-clikme),sans-serif;font-size:16px;font-weight:800;}
.pl-msg-qui em{font-style:normal;font-size:12px;font-weight:700;padding:2px 9px;border-radius:999px;background:rgba(205,184,164,.14);color:var(--gris);}
.pl-texte{width:100%;box-sizing:border-box;padding:11px 12px;border-radius:14px;border:1px solid var(--trait);background:var(--fond);color:var(--creme);
  font:inherit;font-size:14.5px;line-height:1.45;resize:vertical;}
.pl-texte:disabled{opacity:.75;}
.pl-envoyer{display:flex;align-items:center;justify-content:center;min-height:46px;border:0;border-radius:999px;background:#25D366;color:#06260F;
  font-weight:800;font-size:15px;text-decoration:none;}
.pl-envoyer:disabled,.pl-envoyer.eteint{opacity:.45;}
.pl-fait{margin:0;padding:9px 12px;border-radius:12px;background:rgba(37,211,102,.1);color:#BFE8CD;font-size:13px;font-weight:700;text-align:center;}
.pl-lien{align-self:center;border:0;background:none;color:var(--gris);text-decoration:underline;font-size:13px;}
`;
