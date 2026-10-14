"use client";

// 👻 LE FANTÔME QU'ON RÉVEILLE — « Il serait bien que l'on puisse cliquer sur
// ce fantôme qui dort pour le réveiller, et le voir partir regarder chez les
// commerçants du jour si, en fonction de ce qu'on a déposé dans nos pièces, il
// y a des choses en synergie avec mes envies. On attendrait qu'il revienne, et
// soit il a quelque chose pour nous, soit rien ; s'il a quelque chose, les
// pièces qui ont reçu quelque chose s'illuminent avec le nombre de surprises. »
//
// QUATRE TEMPS, EN HAUT DE MA MAISON, À LA PLACE DE L'ENVELOPPE :
//   · il dort — sur son canapé, les « z » qui montent ; on le touche ;
//   · il sursaute, et part ;
//   · SA TOURNÉE : la vidéo de la loupe, et dessous le journal de ses visites,
//     commerce par commerce — « je regarde… », puis « rien pour vous » ou
//     « ✨ Mon Dressing ». C'est ce qui fait patienter : on voit le travail ;
//   · il rentre — avec l'enveloppe (« J'ai trouvé 5 choses pour vous ») et
//     les pièces s'allument (voir `ma-maison.tsx`), ou les mains vides, et il
//     le dit.
//
// CE QU'IL RAPPORTE EST SU AU DÉPART (`partir`) et posé au retour (`rentrer`) :
// le journal peut dire où il trouve, et rien n'apparaît avant qu'il rentre.
// DANS LA DÉMONSTRATION, il rentre toujours avec cinq trouvailles
// (`lib/direct/surprises-demo.ts`) ; DANS UNE VRAIE VILLE, c'est la vraie
// tournée, faite tout de suite — et elle peut ne rien rapporter.
//
// PUIS, DANS LES PIÈCES : `TrouveesDeLaPiece`, ce qu'il a trouvé pour CETTE
// pièce, et pour un vêtement ou une coupe déjà essayés, la révélation sur la
// personne (`EssaiSurMoi`) : sa photo d'avant, puis le rideau, et elle avec.
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { VideoFantome, mouvementReduit } from "@/components/direct/video-fantome";
import { pieceParCle } from "@/lib/direct/maison";
import { abonnerMaisonPrivee, chargerMaisonPrivee, maisonPriveeServeur, reagirALaSurprise, voirLaSurprise } from "@/lib/direct/maison-memoire";
import { sourceDe, type CommerceDuJour, type Surprise } from "@/lib/direct/surprises";

type Phase = "dort" | "sursaut" | "tournee" | "retour" | "rien";
type Visite = { c: CommerceDuJour; s?: Surprise };

/**
 * LE CHEMIN DE SA TOURNÉE : les commerces où il trouve, et quelques-uns où il
 * ne trouve rien — sans eux, ce ne serait pas une recherche. Un « rien » pour
 * commencer, puis deux trouvailles, un « rien »… sept visites au plus.
 */
function itineraire(commerces: CommerceDuJour[], trouvees: Surprise[]): Visite[] {
  const parCarte = new Map<string, Surprise>();
  for (const s of trouvees) if (!parCarte.has(s.carte)) parCarte.set(s.carte, s);
  const avec: Visite[] = [...parCarte].map(([id, s]) => ({
    c: commerces.find((x) => x.id === id) ?? { id, nom: s.lieu, distance: s.distance, photo: s.photo },
    s,
  }));
  const sans: Visite[] = commerces
    .filter((c) => !parCarte.has(c.id) && c.photo)
    .slice(0, Math.max(2, 6 - avec.length))
    .map((c) => ({ c }));
  const r: Visite[] = [];
  let a = 0;
  let b = 0;
  while (a < avec.length || b < sans.length) {
    if (b < sans.length) r.push(sans[b++]);
    for (let k = 0; k < 2 && a < avec.length; k++) r.push(avec[a++]);
  }
  return r.slice(0, 7);
}

const pluriel = (n: number, un: string, plusieurs: string) => `${n} ${n > 1 ? plusieurs : un}`;

export function ReveilDuFantome({
  rien,
  toutOuvert,
  commerces,
  partir,
  rentrer,
  onDepart,
  onAllumer,
  onFini,
}: {
  /** Sa tournée du jour n'a rien trouvé d'assez bien. */
  rien: boolean;
  /** Il a déjà rapporté des surprises aujourd'hui, toutes ouvertes. */
  toutOuvert: boolean;
  commerces: CommerceDuJour[];
  /** Ce que sa tournée rapportera — su au départ, rien n'est encore posé. */
  partir: () => Surprise[];
  /** Il rentre : ses trouvailles sont posées dans la Maison. */
  rentrer: (trouvees: Surprise[]) => void;
  onDepart: () => void;
  /** « J'ai trouvé… » : c'est le moment où les pièces s'allument. */
  onAllumer: () => void;
  /** Il est rentré ; `vu` : sous nos yeux — sinon l'enveloppe jouera son retour. */
  onFini: (vu: boolean) => void;
}) {
  const [phase, setPhase] = useState<Phase>("dort");
  const [route, setRoute] = useState<{ visites: Visite[]; trouvees: Surprise[] } | null>(null);
  /** Combien de visites sont commencées (la dernière est « en cours »). */
  const [pas, setPas] = useState(0);
  /** LA TOURNÉE EST FINIE QUAND LA VIDÉO ET LE JOURNAL LE SONT — le dernier des deux la termine. */
  const fini = useRef({ video: false, journal: false });
  /** La tournée en cours : ses trouvailles, et si elles sont déjà posées dans la Maison. */
  const enCours = useRef<{ trouvees: Surprise[]; posees: boolean } | null>(null);
  const debutRetour = useRef(0);
  const rentrerSiFini = () => {
    if (!fini.current.video || !fini.current.journal || !route || phase !== "tournee") return;
    if (route.trouvees.length) {
      rentrer(route.trouvees);
      if (enCours.current) enCours.current.posees = true;
      debutRetour.current = Date.now();
      setPhase("retour");
    } else setPhase("rien");
  };
  const terminer = () => {
    enCours.current = null;
    setPhase("dort");
    setRoute(null);
    onFini(true);
  };
  const rappels = useRef({ onAllumer, rentrer, rentrerSiFini, terminer, onFini });
  useEffect(() => {
    rappels.current = { onAllumer, rentrer, rentrerSiFini, terminer, onFini };
  });
  /* ON QUITTE L'ENTRÉE PENDANT SA TOURNÉE (une pièce ouverte) : il rentre
     quand même — ses trouvailles sont posées, les pièces ne restent pas « en
     revue », et l'enveloppe attendra au retour. */
  useEffect(
    () => () => {
      const e = enCours.current;
      if (!e) return;
      if (!e.posees && e.trouvees.length) rappels.current.rentrer(e.trouvees);
      rappels.current.onFini(false);
    },
    [],
  );

  const reveiller = () => {
    if (phase !== "dort") return;
    const trouvees = partir();
    setRoute({ visites: itineraire(commerces, trouvees), trouvees });
    enCours.current = { trouvees, posees: false };
    setPas(0);
    fini.current = { video: false, journal: false };
    setPhase("sursaut");
    onDepart();
  };

  /* IL SURSAUTE, PUIS PART. */
  useEffect(() => {
    if (phase !== "sursaut") return;
    const t = window.setTimeout(() => setPhase("tournee"), mouvementReduit() ? 250 : 1300);
    return () => window.clearTimeout(t);
  }, [phase]);

  /* SES VISITES, UNE À UNE : environ six secondes en tout, le temps de la vidéo. */
  const n = route?.visites.length ?? 0;
  const duree = mouvementReduit() ? 380 : Math.min(1250, Math.max(800, 6400 / Math.max(n, 1)));
  useEffect(() => {
    if (phase !== "tournee" || pas > n) return;
    const t = window.setTimeout(
      () => {
        setPas(pas + 1);
        if (pas + 1 > n) {
          fini.current.journal = true;
          rappels.current.rentrerSiFini();
        }
      },
      pas === 0 ? 350 : duree,
    );
    return () => window.clearTimeout(t);
  }, [phase, pas, n, duree]);

  /* « J'AI TROUVÉ… » : les pièces s'allument au moment où il le dit. */
  useEffect(() => {
    if (phase !== "retour") return;
    const t = window.setTimeout(() => rappels.current.onAllumer(), mouvementReduit() ? 0 : 2700);
    return () => window.clearTimeout(t);
  }, [phase]);

  /* LES MAINS VIDES : il le dit, puis se rendort. */
  useEffect(() => {
    if (phase !== "rien") return;
    const t = window.setTimeout(() => rappels.current.terminer(), 4600);
    return () => window.clearTimeout(t);
  }, [phase]);

  const trouvees = route?.trouvees.length ?? 0;
  const vues = Math.min(pas, n);
  const faites = Math.max(0, Math.min(pas - 1, n));
  const trouveesVues = route ? route.visites.slice(0, faites).filter((v) => v.s).length : 0;

  return (
    <>
      {phase === "dort" || phase === "sursaut" ? (
        <button
          type="button"
          className={`rv rv-dort${phase === "sursaut" ? " sursaut" : ""}`}
          onClick={reveiller}
          aria-label="Réveiller le Fantôme : il va voir ce que les commerçants ont sorti aujourd'hui"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="rv-img" src="/direct/videos/rien-fin.webp" alt="" />
          <span className="rv-z" aria-hidden="true">
            <i>z</i>
            <i>z</i>
            <i>Z</i>
          </span>
          {phase === "sursaut" && (
            <b className="rv-hein" aria-hidden="true">
              Hein ?! J’y vais&nbsp;!
            </b>
          )}
          <span className="rv-bas">
            <b>{rien ? "Rien d’assez bien pour l’instant…" : toutOuvert ? "Vous avez tout ouvert 🎁" : "Chut… je fais la sieste"}</b>
            <em>
              {rien || toutOuvert
                ? "Réveillez-moi : je retourne voir chez vos commerçants s’il y a du neuf."
                : "Réveillez-moi : je file voir ce que vos commerçants ont sorti aujourd’hui."}
            </em>
            <s className="rv-cta">👆 Touchez-moi</s>
          </span>
        </button>
      ) : phase === "tournee" ? (
        <div className="rv" role="status" aria-label="Le Fantôme fait sa tournée">
          {/* UNE CLÉ PAR VIDÉO : à la même place, React gardait le lecteur de la
              tournée pour le retour — la vidéo ne changeait pas, et ne finissait jamais. */}
          <VideoFantome
            key="recherche"
            nom="recherche"
            vitesse={0.8}
            classe="rv-video"
            onFin={() => {
              fini.current.video = true;
              rentrerSiFini();
            }}
            legendes={[
              { a: 0, texte: <em className="rv-tour">Je file chez les commerçants du jour…</em> },
              { a: 2.6, texte: <em className="rv-tour">Je compare avec ce que vous avez mis dans vos pièces…</em> },
            ]}
          />
        </div>
      ) : phase === "retour" ? (
        <div className="rv rv-retour" role="status">
          <VideoFantome
            key="surprise"
            nom="surprise"
            classe="rv-video"
            /* SANS VIDÉO (mouvement réduit, lecture refusée) elle « finit » tout
               de suite : sa dernière image et « J'ai trouvé… » restent le temps de lire. */
            onFin={() => {
              window.setTimeout(() => rappels.current.terminer(), Math.max(0, 3200 - (Date.now() - debutRetour.current)));
            }}
            legendes={[
              { a: 0, texte: <em className="rv-tour">Me revoilà&nbsp;!</em> },
              {
                a: 2.7,
                texte: (
                  <b className="rv-trouve">
                    J&apos;ai trouvé {pluriel(trouvees, "chose", "choses")} pour vous
                  </b>
                ),
              },
            ]}
          />
          <span className="rv-eclats" aria-hidden="true">
            {Array.from({ length: 14 }, (_, i) => (
              <i key={i} style={{ "--a": `${i * 25.7}deg`, "--d": `${70 + ((i * 37) % 60)}px`, "--r": `${(i % 5) * 90}ms` } as CSSProperties} />
            ))}
          </span>
        </div>
      ) : (
        <div className="rv" role="status">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="rv-img" src="/direct/videos/recherche-fin.webp" alt="" />
          <span className="rv-bas">
            <b>{toutOuvert ? "Rien de neuf depuis ma dernière tournée." : "J’ai fait le tour : rien d’assez bien pour vous."}</b>
            <em>Je préfère ne rien vous proposer plutôt que du moyen. Je garde l’œil ouvert 👻</em>
          </span>
        </div>
      )}

      {/* ═══ LE JOURNAL DE SA TOURNÉE ═══ Ce qui fait patienter : on le voit
          entrer chez chacun, et ressortir avec quelque chose ou rien. À son
          retour, il se replie en une ligne : les pièces remontent et s'allument. */}
      {route && phase !== "dort" && phase !== "sursaut" && (
        <section className={`rv-journal${phase === "tournee" ? "" : " plie"}`} aria-live="polite">
          <p className="rv-journal-t">
            <span>👻 Ma tournée</span>
            <em>
              {phase === "tournee"
                ? `${vues}/${n} commerces · ${pluriel(trouveesVues, "trouvaille", "trouvailles")}`
                : `${pluriel(n, "commerce", "commerces")} · ${pluriel(trouvees, "trouvaille", "trouvailles")}`}
            </em>
          </p>
          <div className="rv-barre" aria-hidden="true">
            <i style={{ width: `${n ? (faites / n) * 100 : 100}%` }} />
          </div>
          <ol className="rv-visites">
            {route.visites.slice(0, vues).map((v, i) => {
              const enCours = i === pas - 1 && pas <= n;
              return (
                <li key={v.c.id} className={enCours ? "en-cours" : v.s ? "oui" : "non"}>
                  {v.c.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.c.photo} alt="" />
                  ) : (
                    <span className="rv-sans-photo" aria-hidden="true">🏪</span>
                  )}
                  <span className="rv-qui">
                    <b>{v.c.nom}</b>
                    <small>{[v.c.metier, v.c.distance].filter(Boolean).join(" · ")}</small>
                  </span>
                  <span className="rv-verdict">
                    {enCours ? (
                      <>
                        🔍 je regarde<span className="rv-points" aria-hidden="true">…</span>
                      </>
                    ) : v.s ? (
                      `✨ ${pieceParCle(v.s.piece).nom.replace(/^(Mon|Ma|Mes) /, "")}`
                    ) : (
                      "rien pour vous"
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}
      <StylesReveil />
    </>
  );
}

// ─── DANS LA PIÈCE : CE QU'IL A TROUVÉ ICI ─────────────────────────────────

/**
 * CE QUE LE FANTÔME A RAPPORTÉ POUR CETTE PIÈCE — en tête de la pièce (et du
 * dressing). Les ouvrir ici les compte comme ouvertes : l'enveloppe ne les
 * remontrera pas comme neuves.
 */
export function TrouveesDeLaPiece({ liste, onVoir, titre }: { liste: Surprise[]; onVoir: (s: Surprise) => void; titre?: string }) {
  /* CELLES QUI ÉTAIENT LÀ EN ENTRANT. Une surprise qui arrive pendant qu'on
     est dans la pièce (on vient de dire « Romans ») reste à ouvrir : elle a
     droit à sa pastille et à son enveloppe. */
  const [deja] = useState(liste);
  useEffect(() => {
    for (const s of deja) voirLaSurprise(s);
  }, [deja]);
  if (!liste.length) return null;
  const essayees = liste.filter((s) => s.surMoi);
  return (
    <section className="tr">
      <h2 className="tr-h">
        <i aria-hidden="true">✨</i>
        {titre ??
          (essayees.length === liste.length
            ? liste.length > 1
              ? "Le Fantôme vous les a déjà essayées"
              : "Le Fantôme vous l’a déjà essayée"
            : `Le Fantôme a trouvé ${pluriel(liste.length, "chose", "choses")} pour cette pièce`)}
      </h2>
      {liste.map((s) => (s.surMoi ? <EssaiSurMoi key={s.id} s={s} onVoir={onVoir} /> : <Trouvee key={s.id} s={s} onVoir={onVoir} />))}
      <StylesReveil />
    </section>
  );
}

function Avis({ s }: { s: Surprise }) {
  const etat = useSyncExternalStore(abonnerMaisonPrivee, chargerMaisonPrivee, maisonPriveeServeur);
  const aime = etat.memoire.jour?.avis[s.id] === 1;
  return (
    <button type="button" className={`tr-coeur${aime ? " on" : ""}`} aria-pressed={aime} onClick={() => reagirALaSurprise(s, 1)}>
      {aime ? "❤️ Noté" : "🤍 Ça me plaît"}
    </button>
  );
}

function Texte({ s, onVoir }: { s: Surprise; onVoir: (s: Surprise) => void }) {
  return (
    <div className="tr-texte">
      <small>{sourceDe(s, new Date())}</small>
      <b>
        {s.titre}
        {s.prix ? <span> · {s.prix.replace(/ /g, "\u00a0")}</span> : null}
      </b>
      <p>👻 {s.raison}</p>
      <div className="tr-actions">
        <button type="button" className="tr-voir" onClick={() => onVoir(s)}>
          {s.action.mot} →
        </button>
        <Avis s={s} />
      </div>
    </div>
  );
}

function Trouvee({ s, onVoir }: { s: Surprise; onVoir: (s: Surprise) => void }) {
  return (
    <article className="tr-carte">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="tr-photo" src={s.photo} alt="" />
      <Texte s={s} onVoir={onVoir} />
    </article>
  );
}

/**
 * ═══ SUR VOUS, DÉJÀ ═══════════════════════════════════════════════════════
 *
 * « Lorsque j'ouvre mon dressing, je découvre une photo de moi avec l'habit
 * qui m'a été proposé. » Sa photo telle qu'elle était, puis un rideau de
 * lumière passe, et elle est là, avec la pièce. Le rideau part quand la
 * photo est vraiment sous les yeux (la deuxième, quand on y descend). Ensuite,
 * un appui compare : avant, avec.
 */
function EssaiSurMoi({ s, onVoir }: { s: Surprise; onVoir: (s: Surprise) => void }) {
  const cadre = useRef<HTMLDivElement>(null);
  const [revele, setRevele] = useState(false);
  /** Le rideau est passé : on peut comparer. */
  const [pret, setPret] = useState(false);
  const [avant, setAvant] = useState(false);
  useEffect(() => {
    if (!revele) return;
    const t = window.setTimeout(() => setPret(true), mouvementReduit() ? 0 : 1750);
    return () => window.clearTimeout(t);
  }, [revele]);
  useEffect(() => {
    const el = cadre.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined" || mouvementReduit()) {
      const t = window.setTimeout(() => setRevele(true), 0);
      return () => window.clearTimeout(t);
    }
    let t = 0;
    const io = new IntersectionObserver(
      (vus) => {
        if (vus.some((v) => v.isIntersecting)) {
          io.disconnect();
          t = window.setTimeout(() => setRevele(true), 650);
        }
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(t);
    };
  }, []);
  if (!s.surMoi) return null;
  return (
    <article className="tr-carte tr-essai">
      <div
        ref={cadre}
        className={`tr-cadre${revele ? " revele" : ""}${avant ? " avant" : ""}`}
        role="button"
        tabIndex={0}
        aria-label={avant ? "Voir avec la pièce" : "Voir sans la pièce"}
        onClick={() => pret && setAvant((a) => !a)}
        onKeyDown={(e) => {
          if (pret && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setAvant((a) => !a);
          }
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="tr-avant" src={s.surMoi.avant} alt="Vous, avant" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="tr-apres" src={s.surMoi.apres} alt={`Vous, avec ${s.titre.toLowerCase()}`} />
        <i className="tr-trait" aria-hidden="true" />
        <span className="tr-etincelles" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <i key={i} style={{ "--x": `${12 + ((i * 41) % 76)}%`, "--y": `${10 + ((i * 29) % 70)}%`, "--r": `${i * 120}ms` } as CSSProperties} />
          ))}
        </span>
        <b className="tr-etiquette">{!pret ? "Vous, ce matin…" : avant ? "Vous, avant" : "Vous, avec"}</b>
        {pret && <em className="tr-comparer">Touchez pour comparer</em>}
      </div>
      <Texte s={s} onVoir={onVoir} />
    </article>
  );
}

function StylesReveil() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.rv{position:relative;display:block;width:calc(100% - 32px);margin:16px 16px 0;padding:0;height:clamp(210px,62vw,250px);border:0;border-radius:22px;overflow:hidden;isolation:isolate;
  background:#1A120D;text-align:left;color:#FFF4E6;box-shadow:0 10px 30px rgba(0,0,0,.35);}
button.rv{cursor:pointer;font:inherit;}
.rv .vf{position:absolute;inset:0;border-radius:22px;}
.rv-video .vf-media{object-position:50% 28%;}
.rv-retour .vf-legende{bottom:60px;}
.rv-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 54%;z-index:-2;}
.rv-dort .rv-img{animation:rv-souffle 4.2s ease-in-out infinite;transform-origin:50% 70%;}
@keyframes rv-souffle{0%,100%{transform:scale(1)}50%{transform:scale(1.025)}}
.rv::after{content:"";position:absolute;inset:auto 0 0 0;height:62%;z-index:-1;pointer-events:none;background:linear-gradient(180deg,transparent,rgba(12,7,4,.86));}
.rv-bas{position:absolute;left:14px;right:14px;bottom:12px;display:flex;flex-direction:column;align-items:flex-start;gap:4px;}
.rv-bas b{font-size:18px;line-height:1.15;font-weight:900;letter-spacing:-.01em;text-shadow:0 2px 12px rgba(0,0,0,.6);}
.rv-bas em{font-style:normal;font-size:13px;line-height:1.35;color:#F1DFC8;text-shadow:0 1px 8px rgba(0,0,0,.7);max-width:300px;}
.rv-cta{margin-top:6px;padding:8px 16px;border-radius:999px;text-decoration:none;font-size:14px;font-weight:850;color:#2A1606;
  background:linear-gradient(180deg,#FFD37A,#F6A53B);box-shadow:0 0 0 0 rgba(246,181,75,.55);animation:rv-appel 1.8s ease-out infinite;}
@keyframes rv-appel{0%{box-shadow:0 0 0 0 rgba(246,181,75,.6)}70%{box-shadow:0 0 0 14px rgba(246,181,75,0)}100%{box-shadow:0 0 0 0 rgba(246,181,75,0)}}
.rv-z{position:absolute;left:58%;top:16%;width:60px;height:70px;pointer-events:none;}
.rv-z i{position:absolute;left:0;bottom:0;font-style:normal;font-weight:900;color:#FFF4E6;text-shadow:0 0 12px rgba(255,220,160,.8);opacity:0;animation:rv-z 3.6s ease-in infinite;}
.rv-z i:nth-child(1){font-size:15px;}
.rv-z i:nth-child(2){font-size:20px;animation-delay:1.2s;}
.rv-z i:nth-child(3){font-size:26px;animation-delay:2.4s;}
@keyframes rv-z{0%{opacity:0;transform:translate(0,0) rotate(-8deg)}15%{opacity:1}100%{opacity:0;transform:translate(34px,-62px) rotate(12deg)}}
.rv-dort.sursaut .rv-img{animation:rv-sursaut .5s cubic-bezier(.3,1.6,.5,1) 2;}
@keyframes rv-sursaut{0%,100%{transform:none}25%{transform:translate(-4px,-6px) rotate(-1.2deg) scale(1.04)}50%{transform:translate(4px,-2px) rotate(1.2deg) scale(1.05)}75%{transform:translate(-2px,0) scale(1.03)}}
.rv-dort.sursaut .rv-z i{animation:rv-zfuit .5s ease-out forwards;}
@keyframes rv-zfuit{to{opacity:0;transform:translate(70px,-90px) scale(.4)}}
.rv-dort.sursaut .rv-cta{animation:none;opacity:.4;}
.rv-hein{position:absolute;left:50%;top:12px;transform:translateX(-50%);padding:8px 14px;border-radius:16px;font-size:15px;font-weight:900;color:#2A1606;background:#FFF1DC;white-space:nowrap;
  box-shadow:0 8px 20px rgba(0,0,0,.35);animation:rv-pop .35s cubic-bezier(.3,1.7,.5,1) both;}
@keyframes rv-pop{from{opacity:0;transform:translateX(-50%) scale(.4)}to{opacity:1;transform:translateX(-50%) scale(1)}}
.rv-tour{display:block;font-style:italic;font-weight:750;font-size:14px;line-height:1.3;color:#F3D9B5;}
.rv-trouve{display:block;font-size:19px;line-height:1.1;font-weight:950;letter-spacing:.01em;text-transform:uppercase;color:#FFF4E6;text-shadow:0 2px 18px rgba(246,181,75,.75);}
.rv-eclats{position:absolute;left:50%;top:46%;z-index:3;pointer-events:none;}
.rv-eclats i{position:absolute;left:0;top:0;width:8px;height:8px;border-radius:2px;background:#FFD37A;opacity:0;
  animation:rv-eclat 1.1s cubic-bezier(.2,.7,.3,1) forwards;animation-delay:calc(2.7s + var(--r));}
.rv-eclats i:nth-child(3n){background:#FF7AC8;}
.rv-eclats i:nth-child(4n){background:#fff;}
@keyframes rv-eclat{0%{opacity:0;transform:rotate(var(--a)) translateX(0) scale(.4)}20%{opacity:1}100%{opacity:0;transform:rotate(var(--a)) translateX(var(--d)) scale(1)}}

.rv-journal{margin:10px 16px 0;padding:12px 12px 10px;border-radius:18px;background:#221811;border:1px solid rgba(255,236,210,.1);overflow:hidden;
  max-height:330px;transition:max-height .7s ease,padding .7s ease,margin .7s ease;}
.rv-journal.plie{max-height:42px;}
.rv-journal-t{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:0;font-size:13px;font-weight:850;}
.rv-journal-t span{flex:none;white-space:nowrap;}
.rv-journal-t em{min-width:0;font-style:normal;font-size:12px;font-weight:700;color:#C9B8A8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rv-barre{height:4px;margin:8px 0 6px;border-radius:4px;background:rgba(255,236,210,.1);overflow:hidden;}
.rv-barre i{display:block;height:100%;border-radius:4px;background:linear-gradient(90deg,#F6A53B,#FFD37A);transition:width .5s ease;}
.rv-journal.plie .rv-barre,.rv-journal.plie .rv-visites{opacity:0;transition:opacity .3s;}
.rv-visites{display:flex;flex-direction:column;justify-content:flex-end;height:174px;margin:0;padding:0;list-style:none;overflow:hidden;}
.rv-visites li{flex:none;display:flex;align-items:center;gap:10px;height:52px;margin-top:6px;padding:0 8px 0 6px;border-radius:14px;background:rgba(255,236,210,.04);
  animation:rv-entre .4s cubic-bezier(.2,.8,.3,1) both;}
@keyframes rv-entre{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.rv-visites img,.rv-sans-photo{flex:none;width:40px;height:40px;border-radius:12px;object-fit:cover;display:grid;place-items:center;background:#2E2118;}
.rv-qui{flex:1;min-width:0;display:flex;flex-direction:column;}
.rv-qui b{font-size:13.5px;line-height:1.2;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rv-qui small{font-size:11.5px;color:#B3A59D;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rv-verdict{flex:none;font-size:12px;font-weight:800;color:#B3A59D;white-space:nowrap;}
.rv-visites li.oui{background:linear-gradient(90deg,rgba(246,181,75,.18),rgba(246,181,75,.06));box-shadow:inset 0 0 0 1px rgba(246,181,75,.45);}
.rv-visites li.oui .rv-verdict{color:#FFD37A;animation:rv-pop2 .45s cubic-bezier(.3,1.7,.5,1) both;}
@keyframes rv-pop2{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:none}}
.rv-visites li.en-cours .rv-verdict{color:#F3D9B5;}
.rv-points{display:inline-block;animation:rv-points 1s steps(4) infinite;overflow:hidden;vertical-align:bottom;width:1em;}
@keyframes rv-points{from{width:0}to{width:1em}}

.tr{margin:14px 0 4px;}
.mz .tr{margin:14px 16px 4px;}
.tr-h{display:flex;align-items:center;gap:8px;margin:0 0 10px;font-size:17px;line-height:1.2;font-weight:900;color:#FFE1A6;}
.tr-h i{font-style:normal;}
.tr-carte{margin:0 0 14px;border-radius:20px;overflow:hidden;background:#221811;border:1px solid rgba(246,181,75,.35);box-shadow:0 0 28px -8px rgba(246,181,75,.45);}
.tr-photo{display:block;width:100%;aspect-ratio:16/10;object-fit:cover;}
.tr-texte{padding:12px 14px 14px;display:flex;flex-direction:column;gap:5px;}
.tr-texte small{font-size:12px;color:#C9B8A8;font-weight:650;}
.tr-texte b{font-size:18px;line-height:1.2;font-weight:900;color:#FFF4E6;}
.tr-texte b span{color:#FFD37A;}
.tr-texte p{margin:2px 0 0;font-size:14px;line-height:1.4;color:#E9DACB;}
.tr-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;}
.tr-voir{flex:1 0 auto;padding:11px 14px;white-space:nowrap;border:0;border-radius:999px;cursor:pointer;font-size:14.5px;font-weight:850;color:#2A1606;background:linear-gradient(180deg,#FFD37A,#F6A53B);}
.tr-coeur{flex:none;padding:11px 14px;border-radius:999px;cursor:pointer;font-size:13.5px;font-weight:800;color:#FFF4E6;background:transparent;border:1px solid rgba(255,236,210,.3);}
.tr-coeur.on{border-color:#FF7AC8;background:rgba(255,122,200,.14);}
.tr-cadre{position:relative;aspect-ratio:4/5;max-height:470px;width:100%;overflow:hidden;cursor:pointer;background:#140D08;}
.tr-cadre img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%;}
.tr-apres{clip-path:inset(0 100% 0 0);transition:opacity .45s ease;}
.tr-cadre.revele .tr-apres{animation:tr-rideau 1.7s cubic-bezier(.65,0,.25,1) forwards;}
@keyframes tr-rideau{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
.tr-cadre.avant .tr-apres{opacity:0;}
.tr-trait{position:absolute;top:0;bottom:0;left:0;width:3px;opacity:0;background:#FFF4E6;box-shadow:0 0 18px 6px rgba(255,211,122,.85);}
.tr-cadre.revele .tr-trait{animation:tr-trait 1.7s cubic-bezier(.65,0,.25,1) forwards;}
@keyframes tr-trait{0%{left:0;opacity:1}92%{opacity:1}100%{left:100%;opacity:0}}
.tr-cadre::after{content:"";position:absolute;inset:auto 0 0 0;height:30%;background:linear-gradient(180deg,transparent,rgba(12,7,4,.6));pointer-events:none;}
.tr-etincelles i{position:absolute;left:var(--x);top:var(--y);width:14px;height:14px;opacity:0;z-index:2;
  background:radial-gradient(circle,#fff 0 18%,rgba(255,211,122,.9) 30%,transparent 62%);}
.tr-cadre.revele .tr-etincelles i{animation:tr-etincelle 1s ease-out forwards;animation-delay:calc(1.5s + var(--r));}
@keyframes tr-etincelle{0%{opacity:0;transform:scale(.2)}40%{opacity:1;transform:scale(1.4)}100%{opacity:0;transform:scale(.6)}}
.tr-etiquette{position:absolute;left:12px;top:12px;z-index:3;padding:6px 12px;border-radius:999px;font-size:13px;font-weight:850;color:#2A1606;background:#FFF1DC;}
.tr-comparer{position:absolute;right:12px;bottom:12px;z-index:3;font-style:normal;font-size:12px;font-weight:750;color:#FFF4E6;padding:5px 10px;border-radius:999px;background:rgba(12,7,4,.5);
  animation:rv-entre .4s ease both;}
@media (prefers-reduced-motion:reduce){
  .rv-dort .rv-img,.rv-z i,.rv-cta,.rv-visites li,.rv-hein{animation:none;}
  .rv-z i{opacity:.8;}
  .rv-z i:nth-child(2){transform:translate(14px,-22px);}
  .rv-z i:nth-child(3){transform:translate(30px,-46px);}
  .tr-apres{clip-path:none;}
  .tr-cadre.revele .tr-apres,.tr-cadre.revele .tr-trait,.tr-cadre.revele .tr-etincelles i,.rv-eclats i{animation:none;}
}
@media (max-width:340px){.rv-bas b{font-size:16px;}.rv-bas em{font-size:12px;}.rv-trouve{font-size:16px;}.rv-verdict{font-size:11px;}.tr-texte b{font-size:16px;}}
`,
      }}
    />
  );
}
