"use client";

// 🧠 CE QUE MON FANTÔME SAIT — l'écran où le commerçant apprend à son fantôme
// ce que ses clients lui demandent.
//
// « Il faudrait donc bien un endroit dans l'admin où le commerçant va donner
// tous les détails de son commerce, d'une manière ou d'une autre, pour que le
// chat puisse répondre. » — « Oui, fais-le. »
//
// TROIS CHOSES, DANS CET ORDRE :
//
//   1. TES CLIENTS ONT DEMANDÉ — les questions auxquelles son fantôme n'a pas
//      su répondre, la plus posée d'abord (« 3 clients ont demandé »). Il
//      répond une fois, et le fantôme le sait pour la suite. C'est la façon la
//      plus simple de le faire remplir : ce sont de vraies questions, posées
//      par de vrais clients.
//   2. LES QUESTIONS DE TON MÉTIER — dix, pas plus : les tailles et les
//      retouches à la friperie, la terrasse et le sans-gluten au restaurant.
//      Une jauge dit où il en est.
//   3. TES AUTRES RÉPONSES — ce qu'il a ajouté lui-même, ou appris de ses
//      clients, à relire et corriger.
//
// IL RÉPOND COMME IL VEUT : au clavier, ou au micro (la dictée écrit ses mots
// dans le champ, il corrige avant d'enregistrer). Et il peut ESSAYER son
// fantôme en bas de l'écran : poser la question d'un client et lire ce qu'il
// répond, avant qu'un client ne la pose.
//
// CHAQUE RÉPONSE S'ENREGISTRE SEULE, d'un bouton : rien ne se perd quand il
// est interrompu par un client entre deux questions.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { CarteAutour } from "@/lib/direct/apercu-habitant";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import { avecLeSavoir, ficheDuDouble, repondreSansIA, type ReponseDouble } from "@/lib/direct/double-chef";
import {
  avecReponseAuMetier,
  MAX_REPONSES,
  memeQuestion,
  questionsDuMetier,
  reponduesDuMetier,
  reponseAuMetier,
  savoirPourLeDouble,
  type QuestionEnAttente,
  type QuestionMetier,
  type SavoirFantome,
} from "@/lib/direct/savoir-fantome";
import { useMicro } from "./use-micro";
import type { SavoirDuComptoir } from "./use-savoir";

/** « Un client a demandé », « 3 clients ont demandé ». */
const combien = (n: number) => (n > 1 ? `${n} clients ont demandé` : "Un client a demandé");

/** « il y a 2 h », « hier », « le 12 mars » — quand la question est arrivée. */
function depuis(le: string): string {
  const t = Date.parse(le);
  if (!Number.isFinite(t)) return "";
  const min = Math.round((Date.now() - t) / 60_000);
  if (min < 2) return "à l’instant";
  if (min < 60) return `il y a ${min} min`;
  if (min < 24 * 60) return `il y a ${Math.round(min / 60)} h`;
  if (min < 48 * 60) return "hier";
  return `le ${new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`;
}

/**
 * SA CARTE, LE TEMPS D'UN ESSAI — pour un commerce du comptoir de
 * démonstration, qui n'existe que dans ce téléphone et que le serveur ne
 * connaît pas. Le double répond alors ici, avec les mêmes règles.
 */
function carteDuComptoir(c: CommerceComptoir): CarteAutour {
  return {
    id: c.id,
    branche: c.branche as CarteAutour["branche"],
    nom: c.nom,
    metier: c.metier,
    ville: "Dax",
    itineraire: "",
    metres: c.metres ?? 0,
    distance: c.distance ?? "",
    moments: [],
    photo: c.photo,
    fiche: { ou: c.adresse ?? "", horaires: c.horaires ?? "", mot: "" },
    ...(c.prenom ? { voix: { prenom: c.prenom } } : {}),
  };
}

type Ouvert = { cle: string; texte: string; question?: string } | null;

export function SavoirComptoir({
  commerce,
  dossier,
  savoir: { savoir, poser, relire },
  onRetour,
}: {
  commerce: CommerceComptoir;
  /** Le dossier de son fantôme, pour son visage. */
  dossier: string;
  savoir: SavoirDuComptoir;
  onRetour: () => void;
}) {
  const liste = useMemo(() => questionsDuMetier(commerce.famille, commerce.metier), [commerce.famille, commerce.metier]);
  const micro = useMicro();
  const [ouvert, setOuvert] = useState<Ouvert>(null);
  const [envoi, setEnvoi] = useState(false);
  const [mot, setMot] = useState<{ ok: boolean; texte: string } | null>(null);
  const [essai, setEssai] = useState("");
  const [reponseEssai, setReponseEssai] = useState<(ReponseDouble & { question: string }) | null>(null);
  const [essaiEnCours, setEssaiEnCours] = useState(false);

  /* EN ARRIVANT, ON RELIT : des questions ont pu tomber depuis l'accueil. */
  useEffect(() => {
    relire();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* LE PETIT MOT DU BAS S'EN VA TOUT SEUL. */
  useEffect(() => {
    if (!mot) return;
    const t = window.setTimeout(() => setMot(null), 3200);
    return () => window.clearTimeout(t);
  }, [mot]);

  const s = savoir;
  const repondues = s ? reponduesDuMetier(s, liste) : 0;
  const libres = s ? s.faq.filter((r) => !r.cle || !liste.some((m) => m.cle === r.cle)) : [];

  const ouvrir = (cle: string, texte = "", question?: string) => {
    if (micro.ecoute) void micro.arreter();
    setOuvert({ cle, texte, question });
  };
  const fermer = () => {
    if (micro.ecoute) void micro.arreter();
    setOuvert(null);
  };
  const ecrire = (texte: string) => setOuvert((o) => (o ? { ...o, texte } : o));

  /* ═══ LE MICRO ÉCRIT DANS LE CHAMP ═══ La dictée met ses mots à la suite de
     ce qui est déjà écrit : il peut parler, relire, corriger, reparler. */
  const dicter = () => {
    if (micro.ecoute) {
      void micro.arreter();
      return;
    }
    micro.ecouter((r) => {
      const t = r.texte.trim();
      if (t) setOuvert((o) => (o ? { ...o, texte: o.texte.trim() ? `${o.texte.trim()} ${t}` : t } : o));
      else if (r.erreur) setMot({ ok: false, texte: "Je n’ai rien entendu. Appuie sur le micro et parle, ou écris ta réponse." });
    });
  };

  const sauver = async (suite: SavoirFantome, ecarter: string[], bravo: string) => {
    setEnvoi(true);
    const souci = await poser(suite, ecarter);
    setEnvoi(false);
    if (souci) {
      setMot({ ok: false, texte: souci });
      return;
    }
    setMot({ ok: true, texte: bravo });
    fermer();
  };

  const tropDeReponses = (suite: SavoirFantome) => {
    if (suite.faq.length <= MAX_REPONSES) return false;
    setMot({ ok: false, texte: `${MAX_REPONSES} réponses au plus : efface-en une pour en ajouter.` });
    return true;
  };

  const repondreAuMetier = (m: QuestionMetier, texte: string) => {
    if (!s) return;
    const suite = avecReponseAuMetier(s, m, texte);
    if (tropDeReponses(suite)) return;
    void sauver(suite, [], texte.trim() ? "C’est appris : ton fantôme le dira avec tes mots." : "Réponse effacée.");
  };

  const repondreAuClient = (a: QuestionEnAttente, texte: string) => {
    if (!s || !texte.trim()) return;
    const suite = { ...s, faq: [...s.faq.filter((r) => !memeQuestion(r.q, a.q)), { q: a.q, a: texte.trim().slice(0, 600) }] };
    if (tropDeReponses(suite)) return;
    void sauver(suite, [a.q], "C’est appris : les prochains clients auront ta réponse.");
  };

  const ecarter = (a: QuestionEnAttente) => {
    if (!s) return;
    void sauver(s, [a.q], "Question écartée : ton fantôme continuera de la transmettre.");
  };

  const changerLibre = (q: string, texte: string) => {
    if (!s) return;
    const t = texte.trim();
    const suite = { ...s, faq: t ? s.faq.map((r) => (r.q === q && !r.cle ? { ...r, a: t.slice(0, 600) } : r)) : s.faq.filter((r) => r.q !== q) };
    void sauver(suite, [], t ? "C’est corrigé." : "Réponse effacée.");
  };

  const ajouterLibre = (q: string, texte: string) => {
    if (!s || !q.trim() || !texte.trim()) return;
    const suite = { ...s, faq: [...s.faq.filter((r) => !memeQuestion(r.q, q)), { q: q.trim().slice(0, 200), a: texte.trim().slice(0, 600) }] };
    if (tropDeReponses(suite)) return;
    void sauver(suite, [q], "C’est appris : ton fantôme le dira avec tes mots.");
  };

  /* ═══ ESSAYER SON FANTÔME ═══ La même route que ses clients, avec `essai` :
     la base est relue tout de suite et ses propres questions ne lui remontent
     pas. Un commerce du comptoir de démonstration, que le serveur ne connaît
     pas, reçoit sa réponse d'ici, par les mêmes règles. */
  const essayer = async () => {
    const question = essai.trim();
    if (!question || !s || essaiEnCours) return;
    setEssaiEnCours(true);
    const id = commerce.reel ? commerce.reel.slug : commerce.id;
    let r: ReponseDouble | null = null;
    try {
      const rep = await fetch("/api/direct/double", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, essai: true, messages: [{ de: "client", texte: question }], ...(commerce.reel ? {} : { savoirLocal: s }) }),
      });
      if (rep.ok) r = (await rep.json()) as ReponseDouble;
    } catch {
      r = null;
    }
    if (!r) {
      const fiche = ficheDuDouble(carteDuComptoir(commerce), { prenom: commerce.prenom });
      r = repondreSansIA(question, avecLeSavoir(fiche, savoirPourLeDouble(s, commerce.famille, commerce.metier)));
    }
    setReponseEssai({ ...r, question });
    setEssaiEnCours(false);
  };

  const zone = (cle: string, exemple: string, actions: ReactNode, avecQuestion = false) =>
    ouvert?.cle === cle ? (
      <div className="sf-zone">
        {avecQuestion && (
          <input
            className="sf-q"
            value={ouvert.question ?? ""}
            maxLength={200}
            placeholder="La question, comme un client la pose"
            aria-label="La question"
            onChange={(e) => setOuvert((o) => (o ? { ...o, question: e.target.value } : o))}
          />
        )}
        <textarea
          value={ouvert.texte}
          rows={3}
          maxLength={600}
          placeholder={`Par exemple : ${exemple}`}
          aria-label="Ta réponse"
          onChange={(e) => ecrire(e.target.value)}
          autoFocus={!avecQuestion}
        />
        {micro.ecoute && <p className="sf-direct">{micro.direct || "Je t’écoute… parle, puis touche le micro pour finir."}</p>}
        <div className="sf-outils">
          <button type="button" className={`sf-micro${micro.ecoute ? " ecoute" : ""}`} onClick={dicter} aria-label={micro.ecoute ? "Arrêter la dictée" : "Répondre à la voix"}>
            {micro.ecoute ? (
              <span className="sf-stop" aria-hidden="true" />
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
              </svg>
            )}
            {micro.ecoute ? "Finir" : "À la voix"}
          </button>
          {!avecQuestion && (
            <button type="button" className="sf-puce" onClick={() => ecrire("Non, ce n’est pas possible chez nous.")}>
              Non, pas chez moi
            </button>
          )}
        </div>
        <div className="sf-boutons">{actions}</div>
      </div>
    ) : null;

  return (
    <div className="sf">
      <StylesSavoir />
      <div className="sf-haut">
        <button type="button" className="sf-retour" onClick={onRetour}>
          ‹ Mon comptoir
        </button>
        <span className="sf-compte">
          {repondues}/{liste.length}
        </span>
      </div>

      <section className="sf-intro">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${dossier}visage.webp`} alt="" />
        <div>
          <h2>Ce que mon fantôme sait</h2>
          <p>Il répond à tes clients avec tes mots, et seulement eux. Ce qu’il ne sait pas, il te le demande ici.</p>
        </div>
      </section>

      <div className="sf-jauge" role="img" aria-label={`${repondues} questions de ton métier sur ${liste.length}`}>
        <span style={{ width: `${Math.round((repondues / Math.max(1, liste.length)) * 100)}%` }} />
      </div>
      <p className="sf-jauge-t">
        {repondues >= liste.length
          ? "🎉 Il connaît ton métier par cœur. Les questions de tes clients arriveront ici."
          : repondues
            ? `Il sait répondre à ${repondues} question${repondues > 1 ? "s" : ""} de ton métier sur ${liste.length}.`
            : "Dix questions que tes clients posent souvent. Une phrase suffit pour chacune."}
      </p>

      {s === null ? (
        <p className="sf-vide">Je relis ce que ton fantôme sait…</p>
      ) : (
        <>
          {/* ═══ 1. LES QUESTIONS DE SES CLIENTS ═══ */}
          {s.attente.length > 0 && (
            <section className="sf-bloc chaud">
              <h3>
                Tes clients ont demandé <i>{s.attente.length}</i>
              </h3>
              <p className="sf-sous">Ton fantôme n’a pas su répondre : il leur a dit qu’il te transmettait. Réponds une fois, il le saura pour la suite.</p>
              {s.attente.map((a) => {
                const cle = `a:${a.q}`;
                return (
                  <article key={cle} className={`sf-carte attente${ouvert?.cle === cle ? " ouverte" : ""}`}>
                    <small>
                      {combien(a.n)}
                      {a.le ? ` · ${depuis(a.le)}` : ""}
                    </small>
                    <b>« {a.q} »</b>
                    {ouvert?.cle !== cle && (
                      <div className="sf-boutons">
                        <button type="button" className="sf-oui" onClick={() => ouvrir(cle)}>
                          Répondre
                        </button>
                        <button type="button" className="sf-non" onClick={() => ecarter(a)} disabled={envoi}>
                          Ignorer
                        </button>
                      </div>
                    )}
                    {zone(
                      cle,
                      "Oui, sur demande, en 48 h.",
                      <>
                        <button type="button" className="sf-oui" disabled={envoi || !ouvert?.texte.trim()} onClick={() => ouvert && repondreAuClient(a, ouvert.texte)}>
                          {envoi ? "Envoi…" : "Apprendre à mon fantôme"}
                        </button>
                        <button type="button" className="sf-non" onClick={fermer}>
                          Annuler
                        </button>
                      </>,
                    )}
                  </article>
                );
              })}
            </section>
          )}

          {/* ═══ 2. LES QUESTIONS DE SON MÉTIER ═══ */}
          <section className="sf-bloc">
            <h3>Les questions de ton métier</h3>
            {liste.map((m) => {
              const cle = `m:${m.cle}`;
              const a = reponseAuMetier(s, m);
              return (
                <article key={cle} className={`sf-carte${a ? " sue" : ""}${ouvert?.cle === cle ? " ouverte" : ""}`}>
                  <button type="button" className="sf-tete" onClick={() => (ouvert?.cle === cle ? fermer() : ouvrir(cle, a))} aria-expanded={ouvert?.cle === cle}>
                    <span className="sf-coche" aria-hidden="true">
                      {a ? "✓" : ""}
                    </span>
                    <span>
                      <b>{m.question}</b>
                      {a && ouvert?.cle !== cle && <em>{a}</em>}
                    </span>
                    <s aria-hidden="true">{ouvert?.cle === cle ? "−" : a ? "✎" : "+"}</s>
                  </button>
                  {zone(
                    cle,
                    m.exemple,
                    <>
                      <button
                        type="button"
                        className="sf-oui"
                        disabled={envoi || (!ouvert?.texte.trim() && !a) || ouvert?.texte.trim() === a}
                        onClick={() => ouvert && repondreAuMetier(m, ouvert.texte)}
                      >
                        {envoi ? "Envoi…" : ouvert?.texte.trim() || !a ? "Apprendre à mon fantôme" : "Effacer ma réponse"}
                      </button>
                      <button type="button" className="sf-non" onClick={fermer}>
                        Annuler
                      </button>
                    </>,
                  )}
                </article>
              );
            })}
          </section>

          {/* ═══ 3. SES AUTRES RÉPONSES ═══ */}
          <section className="sf-bloc">
            <h3>Tes autres réponses</h3>
            {libres.length === 0 && ouvert?.cle !== "nouvelle" && (
              <p className="sf-sous">Celles que tu apprends à ton fantôme quand un client lui pose une question nouvelle, et celles que tu ajoutes toi-même.</p>
            )}
            {libres.map((r) => {
              const cle = `l:${r.q}`;
              return (
                <article key={cle} className={`sf-carte sue${ouvert?.cle === cle ? " ouverte" : ""}`}>
                  <button type="button" className="sf-tete" onClick={() => (ouvert?.cle === cle ? fermer() : ouvrir(cle, r.a))} aria-expanded={ouvert?.cle === cle}>
                    <span className="sf-coche" aria-hidden="true">
                      ✓
                    </span>
                    <span>
                      <b>{r.q}</b>
                      {ouvert?.cle !== cle && <em>{r.a}</em>}
                    </span>
                    <s aria-hidden="true">{ouvert?.cle === cle ? "−" : "✎"}</s>
                  </button>
                  {zone(
                    cle,
                    r.a,
                    <>
                      <button type="button" className="sf-oui" disabled={envoi || ouvert?.texte.trim() === r.a} onClick={() => ouvert && changerLibre(r.q, ouvert.texte)}>
                        {envoi ? "Envoi…" : ouvert?.texte.trim() ? "Enregistrer" : "Effacer cette réponse"}
                      </button>
                      <button type="button" className="sf-non" onClick={fermer}>
                        Annuler
                      </button>
                    </>,
                  )}
                </article>
              );
            })}
            {ouvert?.cle === "nouvelle" ? (
              <article className="sf-carte ouverte">
                {zone(
                  "nouvelle",
                  "Oui, on fait des paquets cadeaux, c’est offert.",
                  <>
                    <button
                      type="button"
                      className="sf-oui"
                      disabled={envoi || !ouvert.texte.trim() || !(ouvert.question ?? "").trim()}
                      onClick={() => ajouterLibre(ouvert.question ?? "", ouvert.texte)}
                    >
                      {envoi ? "Envoi…" : "Apprendre à mon fantôme"}
                    </button>
                    <button type="button" className="sf-non" onClick={fermer}>
                      Annuler
                    </button>
                  </>,
                  true,
                )}
              </article>
            ) : (
              <button type="button" className="sf-ajout" onClick={() => ouvrir("nouvelle", "", "")}>
                + Une question à moi
              </button>
            )}
          </section>

          {/* ═══ 4. L'ESSAYER ═══ */}
          <section className="sf-bloc sf-essai">
            <h3>Essaie ton fantôme</h3>
            <p className="sf-sous">Pose-lui la question d’un client, comme si tu étais devant ta porte.</p>
            <form
              className="sf-essai-f"
              onSubmit={(e) => {
                e.preventDefault();
                void essayer();
              }}
            >
              <input value={essai} maxLength={300} onChange={(e) => setEssai(e.target.value)} placeholder={liste[4]?.client ?? "Vous êtes ouverts dimanche ?"} aria-label="La question d’un client" />
              <button type="submit" disabled={!essai.trim() || essaiEnCours}>
                {essaiEnCours ? "…" : "Demander"}
              </button>
            </form>
            {reponseEssai && (
              <div className="sf-bulles" aria-live="polite">
                <p className="sf-bulle client">{reponseEssai.question}</p>
                <div className="sf-bulle fantome">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`${dossier}visage.webp`} alt="" />
                  <p>{reponseEssai.texte}</p>
                </div>
                {reponseEssai.transmise && (
                  <p className="sf-sous">
                    Il ne savait pas, alors il a promis de te transmettre. Quand un client la pose, la question arrive en haut de cet écran.{" "}
                    <button type="button" className="sf-lien" onClick={() => ouvrir("nouvelle", "", reponseEssai.question)}>
                      Lui apprendre maintenant
                    </button>
                  </p>
                )}
              </div>
            )}
          </section>
        </>
      )}

      {mot && (
        <p className={`sf-mot${mot.ok ? "" : " non"}`} role="status">
          {mot.texte}
        </p>
      )}
    </div>
  );
}

function StylesSavoir() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.sf{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:12px 16px calc(28px + env(safe-area-inset-bottom,0px));scrollbar-width:none;display:flex;flex-direction:column;gap:14px;}
.sf::-webkit-scrollbar{display:none;}
.sf-haut{display:flex;align-items:center;justify-content:space-between;}
.sf-retour{border:1px solid var(--trait);border-radius:999px;padding:9px 16px;background:var(--nappe);font-weight:700;}
.sf-compte{font-family:var(--font-clikme),sans-serif;font-size:15px;font-weight:800;color:var(--ambre);}
.sf-intro{display:grid;grid-template-columns:64px 1fr;gap:14px;align-items:center;padding:14px;border-radius:22px;background:var(--nappe);border:1px solid var(--trait);}
.sf-intro img{width:64px;height:64px;border-radius:50%;object-fit:cover;background:var(--nappe2);}
.sf-intro h2{margin:0;font-family:var(--font-clikme),sans-serif;font-size:19px;font-weight:800;letter-spacing:-.01em;}
.sf-intro p{margin:4px 0 0;font-size:14px;line-height:1.4;color:var(--gris);}
.sf-jauge{height:10px;border-radius:999px;background:var(--nappe2);overflow:hidden;}
.sf-jauge span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--ambre),var(--rose));transition:width .5s ease;}
.sf-jauge-t{margin:-6px 0 0;font-size:13.5px;color:var(--gris);}
.sf-vide{margin:0;padding:16px;border-radius:16px;border:1px dashed var(--trait);text-align:center;font-size:14px;color:var(--gris);}
.sf-bloc{display:flex;flex-direction:column;gap:8px;}
.sf-bloc h3{margin:6px 2px 0;display:flex;align-items:center;gap:8px;font-family:var(--font-clikme),sans-serif;font-size:17px;font-weight:800;letter-spacing:-.01em;}
.sf-bloc h3 i{font-style:normal;min-width:24px;height:24px;padding:0 7px;border-radius:999px;display:inline-grid;place-items:center;background:var(--rose);color:#fff;font-size:13px;}
.sf-sous{margin:0 2px;font-size:13.5px;line-height:1.4;color:var(--gris);}
.sf-bloc.chaud{padding:14px;border-radius:22px;border:1px solid var(--ambre);background:rgba(245,162,58,.08);box-shadow:0 0 26px rgba(245,162,58,.14);}
.sf-carte{display:flex;flex-direction:column;gap:8px;padding:4px;border-radius:18px;background:var(--nappe);border:1px solid var(--trait);}
.sf-carte.attente{padding:12px 14px;}
.sf-carte.attente small{font-size:12.5px;font-weight:700;color:var(--ambre);}
.sf-carte.attente b{font-family:var(--font-clikme),sans-serif;font-size:16px;line-height:1.3;}
.sf-carte.ouverte{border-color:rgba(245,162,58,.5);}
.sf-tete{display:grid;grid-template-columns:26px 1fr 22px;gap:10px;align-items:start;width:100%;padding:10px;border:0;background:none;color:inherit;text-align:left;}
.sf-tete b{display:block;font-size:15px;line-height:1.3;font-weight:700;}
.sf-tete em{margin-top:4px;font-style:normal;font-size:13.5px;line-height:1.35;color:var(--gris);
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.sf-tete s{text-decoration:none;font-size:18px;color:var(--gris);text-align:center;}
.sf-coche{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;border:1.5px solid var(--trait);font-size:14px;font-weight:800;}
.sf-carte.sue .sf-coche{border-color:transparent;background:rgba(80,190,120,.22);color:#8EE0A8;}
.sf-zone{display:flex;flex-direction:column;gap:8px;padding:0 10px 10px;}
.sf-carte.attente .sf-zone{padding:0;}
.sf-zone textarea,.sf-q{width:100%;box-sizing:border-box;border-radius:14px;border:1px solid var(--trait);background:var(--fond);color:var(--creme);
  font:inherit;font-size:15px;line-height:1.45;padding:11px 12px;}
.sf-zone textarea{resize:vertical;min-height:84px;}
.sf-q{font-weight:700;}
.sf-direct{margin:0;padding:8px 12px;border-radius:12px;background:rgba(255,46,154,.12);font-size:14px;color:var(--creme);}
.sf-outils{display:flex;flex-wrap:wrap;gap:8px;align-items:center;}
.sf-micro{display:inline-flex;align-items:center;gap:7px;height:40px;padding:0 15px 0 11px;border-radius:999px;border:0;background:var(--rose);color:#fff;font-weight:800;font-size:14px;}
.sf-micro svg{width:20px;height:20px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;}
.sf-micro svg rect{fill:#fff;stroke:none;}
.sf-micro.ecoute{animation:sf-pouls 1.2s ease-in-out infinite;}
.sf-stop{width:12px;height:12px;border-radius:3px;background:#fff;}
@keyframes sf-pouls{0%,100%{box-shadow:0 0 0 0 rgba(255,46,154,.55);}50%{box-shadow:0 0 0 9px rgba(255,46,154,0);}}
.sf-puce{height:36px;padding:0 13px;border-radius:999px;border:1px solid var(--trait);background:none;color:var(--gris);font-size:13.5px;font-weight:700;}
.sf-boutons{display:flex;gap:8px;}
.sf-oui{flex:1;min-height:44px;padding:0 14px;border-radius:14px;border:0;background:var(--ambre);color:#1B0F08;font-weight:800;font-size:15px;}
.sf-oui:disabled{opacity:.45;}
.sf-non{min-height:44px;padding:0 14px;border-radius:14px;border:1px solid var(--trait);background:none;color:var(--gris);font-weight:700;font-size:14px;}
.sf-ajout{height:46px;border-radius:16px;border:1px dashed var(--trait);background:none;font-weight:700;color:var(--gris);}
.sf-essai-f{display:flex;gap:8px;}
.sf-essai-f input{flex:1;min-width:0;height:46px;box-sizing:border-box;padding:0 14px;border-radius:14px;border:1px solid var(--trait);background:var(--fond);color:var(--creme);font-size:15px;}
.sf-essai-f button{height:46px;padding:0 16px;border-radius:14px;border:0;background:var(--rose);color:#fff;font-weight:800;}
.sf-essai-f button:disabled{opacity:.45;}
.sf-bulles{display:flex;flex-direction:column;gap:8px;}
.sf-bulle{margin:0;max-width:86%;padding:10px 13px;border-radius:18px;font-size:14.5px;line-height:1.4;}
.sf-bulle.client{align-self:flex-end;background:var(--rose);color:#fff;border-bottom-right-radius:6px;}
.sf-bulle.fantome{display:grid;grid-template-columns:32px 1fr;gap:9px;align-items:end;padding:0;background:none;}
.sf-bulle.fantome img{width:32px;height:32px;border-radius:50%;object-fit:cover;background:var(--nappe2);}
.sf-bulle.fantome p{margin:0;padding:10px 13px;border-radius:18px;border-bottom-left-radius:6px;background:var(--nappe2);}
.sf-lien{border:0;background:none;padding:0;color:var(--ambre);font-weight:800;text-decoration:underline;font-size:inherit;}
.sf-mot{position:sticky;bottom:12px;margin:0;padding:11px 14px;border-radius:14px;font-size:14px;font-weight:700;text-align:center;
  background:#1F3A2A;border:1px solid rgba(80,190,120,.5);box-shadow:0 10px 30px rgba(0,0,0,.4);animation:sf-monte .25s ease-out;}
.sf-mot.non{background:#3A2A17;border-color:rgba(245,162,58,.5);}
@keyframes sf-monte{from{transform:translateY(12px);opacity:0;}to{transform:none;opacity:1;}}
`,
      }}
    />
  );
}
