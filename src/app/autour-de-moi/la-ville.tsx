"use client";

// 🏛️ LA VILLE — le fil social local.
//
// « "La ville" fait découvrir et réagir. » Trois sortes de publications :
// les essais partagés (« Essai virtuel »), les découvertes (« Vécu sur
// place » quand l'auteur le dit, « Découverte » sinon), et la vie locale (les
// cinq natures d'avant, plus les sorties ouvertes à tous, en événements).
//
// CE QUI NE CHANGE PAS : la vie locale s'efface, les essais et découvertes
// restent jusqu'à ce que leur auteur les retire. Rien n'est publié tout seul :
// « Qu'as-tu envie de partager ? » demande quoi, puis à qui — « Mes amis »
// d'abord, « Public dans ma ville » seulement en le choisissant, avec un
// avertissement quand c'est son visage.
//
// LES AVATARS SONT DES INITIALES, comme dans Ensemble.
import { useState, useSyncExternalStore } from "react";
import type { CarteAutour } from "@/lib/direct/apercu-habitant";
import {
  abonnerVus,
  AUCUN_VU,
  caMInteresse,
  chargerVus,
  ilYA,
  marquerVu,
  NATURES,
  publierDansLaVille,
  reagirVille,
  repondreVille,
  resteDit,
  retirerDeLaVille,
  type MessageVille,
} from "@/lib/direct/la-ville";
import type { PieceGardee } from "@/lib/direct/pieces-gardees";
import type { Salon } from "@/lib/direct/salons";

const TEINTES = ["#FF5FA8", "#F5A23A", "#7FB7FF", "#7BD3A8", "#C99BFF", "#FF8A65"];
function teinte(nom: string): string {
  let h = 0;
  for (const c of nom) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TEINTES[h % TEINTES.length];
}

type Filtre = "pour-toi" | "amis" | "autour";

/** Une ligne de « La suite de vos échanges » : une nouveauté qui me concerne. */
export type Suite = { cle: string; qui: string; texte: string; ouvrir: () => void };

export function LaVille({
  messages,
  amis,
  sorties,
  suites,
  essais,
  commerces,
  onEssayer,
  onPage,
  onDiscuter,
  onSortie,
  onOuvrirSalon,
  onMessageVille,
  demandePartage = 0,
}: {
  messages: MessageVille[];
  /** Les gens avec qui je partage des conversations : mes amis, dans la maquette. */
  amis: string[];
  /** Les sorties ouvertes à tous où je ne suis pas encore. */
  sorties: Salon[];
  /** Les nouveautés qui me concernent (calculées par l'application). */
  suites: Suite[];
  /** Mes essais gardés, pour les partager. */
  essais: PieceGardee[];
  /** Les commerces près de moi, pour une découverte. */
  commerces: CarteAutour[];
  onEssayer: (ref: { carte: string; piece: string }) => void;
  onPage: (id: string) => void;
  /** « En discuter avec mes amis » : une conversation dans Ensemble, liée à la publication. */
  onDiscuter: (m: MessageVille) => void;
  /** « En faire une sortie ». */
  onSortie: (m: MessageVille) => void;
  onOuvrirSalon: (cle: string) => void;
  /** Le composeur existant de la vie locale (question, bon plan…). */
  onMessageVille: () => void;
  /** Change à chaque appui sur le fantôme de la barre : « Qu'as-tu envie de partager ? ». */
  demandePartage?: number;
}) {
  const vus = useSyncExternalStore(abonnerVus, chargerVus, () => AUCUN_VU);
  const aDesAmis = amis.length > 0;
  const [filtre, setFiltre] = useState<Filtre>(aDesAmis ? "pour-toi" : "autour");
  const [ouvertes, setOuvertes] = useState<string[]>([]);
  const [reponse, setReponse] = useState<Record<string, string>>({});
  const [chezQui, setChezQui] = useState<string | null>(null);
  const [compose, setCompose] = useState<null | "choix" | "essai" | "decouverte">(null);
  const [suiteDe, setSuiteDe] = useState<MessageVille | null>(null);
  // LE FANTÔME DE LA BARRE EST LE BOUTON « PARTAGER » DE CETTE PAGE. Une
  // demande nouvelle se voit pendant le rendu, sans effet.
  const [demandeVue, setDemandeVue] = useState(demandePartage);
  if (demandePartage !== demandeVue) {
    setDemandeVue(demandePartage);
    setSuiteDe(null);
    setCompose("choix");
  }
  /** L'heure d'ouverture de l'écran : une sortie sans date se range une demi-heure avant. */
  const [ouverture] = useState(() => Date.now());

  const estAmi = (q: string) => amis.includes(q);
  const visible = (m: MessageVille) => m.visibilite !== "amis" || m.qui === "Vous" || estAmi(m.qui);
  const vivants = messages.filter(visible);

  // LES SORTIES OUVERTES À TOUS, EN ÉVÉNEMENTS — elles quittent Ensemble.
  const evenements = sorties.map((x) => ({
    cle: x.cle,
    a: x.activite ?? ouverture - 30 * 60_000,
    salon: x,
  }));

  type Entree = { cle: string; a: number; m?: MessageVille; salon?: Salon; score: number };
  const entrees: Entree[] = [
    ...vivants.map((m) => ({
      cle: m.id,
      a: m.a,
      m,
      // UN CLASSEMENT SIMPLE : le plus récent, et les amis remontent de deux heures.
      score: m.a + (estAmi(m.qui) || m.qui === "Vous" ? 2 * 3600_000 : 0),
    })),
    ...evenements.map((e) => ({ cle: e.cle, a: e.a, salon: e.salon, score: e.a })),
  ];
  const fil =
    filtre === "amis"
      ? entrees.filter((e) => e.m && (estAmi(e.m.qui) || e.m.qui === "Vous")).sort((a, b) => b.a - a.a)
      : filtre === "autour"
        ? entrees
            .filter((e) => e.salon || (e.m && e.m.visibilite !== "amis"))
            .sort((a, b) => b.a - a.a || (a.m?.metres ?? 0) - (b.m?.metres ?? 0))
        : entrees.sort((a, b) => b.score - a.score);

  const basculerReponses = (m: MessageVille) => {
    setOuvertes((o) => (o.includes(m.id) ? o.filter((x) => x !== m.id) : [...o, m.id]));
    if (m.qui === "Vous") marquerVu(m.id, m.reponses.length);
  };

  // MES PUBLICATIONS QUI ONT DE NOUVELLES RÉPONSES — la suite de mes échanges.
  const reponduesAMoi: Suite[] = messages
    .filter((m) => m.qui === "Vous" && m.reponses.length > (vus[m.id] ?? 0))
    .map((m) => ({
      cle: `rep:${m.id}`,
      qui: m.reponses[m.reponses.length - 1].qui,
      texte: `a répondu à « ${m.texte.slice(0, 40)}${m.texte.length > 40 ? "…" : ""} »`,
      ouvrir: () => {
        setFiltre("pour-toi");
        setOuvertes((o) => [...new Set([...o, m.id])]);
        marquerVu(m.id, m.reponses.length);
        window.setTimeout(() => document.getElementById(`lv-${m.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
      },
    }));
  const toutesSuites = [...reponduesAMoi, ...suites];

  return (
    <div className="lv">
      <StylesLaVille />
      <header className="lv-tete">
        <h1>La ville</h1>
        <p>Les envies, les découvertes et la vie autour de toi</p>
      </header>

      <nav className="lv-filtres" aria-label="Filtrer le fil">
        {aDesAmis && (
          <button type="button" className={filtre === "pour-toi" ? "on" : ""} onClick={() => setFiltre("pour-toi")}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z" />
              <circle cx="12" cy="10" r="2.3" />
            </svg>
            Pour toi
          </button>
        )}
        {aDesAmis && (
          <button type="button" className={filtre === "amis" ? "on" : ""} onClick={() => setFiltre("amis")}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="9" cy="8" r="3.2" />
              <circle cx="17" cy="9" r="2.6" />
              <path d="M3 20c.6-3.4 3-5.4 6-5.4s5.4 2 6 5.4M15.5 14.8c2.6.2 4.6 2 5 5.2" />
            </svg>
            Mes amis
          </button>
        )}
        <button type="button" className={filtre === "autour" ? "on" : ""} onClick={() => setFiltre("autour")}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 3 3 10.5l7.5 2.4L13 21 21 3Z" />
          </svg>
          Autour de moi
        </button>
      </nav>

      {/* ═══ LA SUITE DE VOS ÉCHANGES ═══ — seulement s'il y a du neuf, et vrai. */}
      {toutesSuites.length > 0 && (
        <section className="lv-suites" aria-label="La suite de vos échanges">
          {toutesSuites.slice(0, 3).map((s) => (
            <button key={s.cle} type="button" className="lv-suite" onClick={s.ouvrir}>
              <span className="lv-av petit" style={{ background: teinte(s.qui) }} aria-hidden="true">
                {s.qui[0]?.toUpperCase()}
              </span>
              <span>
                <b>La suite de vos échanges</b>
                <em>
                  {s.qui} {s.texte} <s aria-hidden="true">→</s>
                </em>
              </span>
              <s className="lv-chev" aria-hidden="true">
                ›
              </s>
            </button>
          ))}
        </section>
      )}

      {fil.length === 0 && (
        <p className="lv-vide">
          {filtre === "amis"
            ? "Tes amis n’ont encore rien partagé. Invite-les depuis Ma maison, ou partage le premier."
            : "Rien pour l’instant autour de toi. Sois le premier à dire ce qui se passe."}
        </p>
      )}

      {fil.map((e) =>
        e.salon ? (
          <CarteSortie key={e.cle} s={e.salon} onOuvrir={() => onOuvrirSalon(e.salon!.cle)} onQui={setChezQui} />
        ) : (
          <CartePublication
            key={e.cle}
            m={e.m!}
            ami={estAmi(e.m!.qui)}
            suiteDeQuoi={e.m!.suite ? messages.find((x) => x.id === e.m!.suite) : undefined}
            ouverte={ouvertes.includes(e.m!.id)}
            reponse={reponse[e.m!.id] ?? ""}
            setReponse={(t) => setReponse((r) => ({ ...r, [e.m!.id]: t }))}
            onReponses={() => basculerReponses(e.m!)}
            onQui={setChezQui}
            onEssayer={onEssayer}
            onPage={onPage}
            onDiscuter={onDiscuter}
            onSortie={onSortie}
            onSuite={() => {
              setSuiteDe(e.m!);
              setCompose(e.m!.genre === "essai" ? "essai" : "decouverte");
            }}
          />
        ),
      )}


      {compose && (
        <Composeur
          etape={compose}
          setEtape={setCompose}
          essais={essais}
          commerces={commerces}
          suiteDe={suiteDe}
          onFermer={() => {
            setCompose(null);
            setSuiteDe(null);
          }}
          onMessageVille={() => {
            setCompose(null);
            onMessageVille();
          }}
          onPublie={(visibilite) => {
            setCompose(null);
            setSuiteDe(null);
            setFiltre(visibilite === "amis" && aDesAmis ? "amis" : aDesAmis ? "pour-toi" : "autour");
          }}
        />
      )}

      {chezQui && (
        <ChezQuelquun
          qui={chezQui}
          publications={vivants.filter((m) => m.qui === chezQui)}
          onFermer={() => setChezQui(null)}
          onPage={onPage}
        />
      )}
    </div>
  );
}

function Avatar({ qui, onQui }: { qui: string; onQui: (q: string) => void }) {
  const moi = qui === "Vous";
  return (
    <button
      type="button"
      className="lv-av"
      style={{ background: moi ? "linear-gradient(135deg,#F5A23A,#FF7DBE)" : teinte(qui) }}
      onClick={() => !moi && onQui(qui)}
      aria-label={moi ? "Toi" : `La maison de ${qui}`}
    >
      {moi ? "★" : qui[0]?.toUpperCase()}
    </button>
  );
}

function typeDe(m: MessageVille): { mot: string; icone: string; ton: string } {
  if (m.genre === "essai") return { mot: "Essai virtuel", icone: "✨", ton: "rose" };
  if (m.genre === "decouverte") return m.vecu ? { mot: "Vécu sur place", icone: "📍", ton: "or" } : { mot: "Découverte", icone: "🔭", ton: "or" };
  const n = NATURES[m.nature];
  return { mot: n.label, icone: n.emoji, ton: m.nature === "evenement" ? "rose" : "neutre" };
}

function CartePublication({
  m,
  ami,
  suiteDeQuoi,
  ouverte,
  reponse,
  setReponse,
  onReponses,
  onQui,
  onEssayer,
  onPage,
  onDiscuter,
  onSortie,
  onSuite,
}: {
  m: MessageVille;
  ami: boolean;
  suiteDeQuoi?: MessageVille;
  ouverte: boolean;
  reponse: string;
  setReponse: (t: string) => void;
  onReponses: () => void;
  onQui: (q: string) => void;
  onEssayer: (ref: { carte: string; piece: string }) => void;
  onPage: (id: string) => void;
  onDiscuter: (m: MessageVille) => void;
  onSortie: (m: MessageVille) => void;
  onSuite: () => void;
}) {
  const t = typeDe(m);
  const moi = m.qui === "Vous";
  const reste = resteDit(m);
  const envoyer = () => {
    const x = reponse.trim();
    if (!x) return;
    repondreVille(m.id, x);
    setReponse("");
  };
  return (
    <article className="lv-carte" id={`lv-${m.id}`}>
      <header className="lv-h">
        <Avatar qui={m.qui} onQui={onQui} />
        <div className="lv-h-t">
          <span className="lv-nom">
            <b>{moi ? "Toi" : m.qui}</b> <u>· {ilYA(m) === "à l'instant" ? "à l’instant" : ilYA(m)}</u>
          </span>
          <span className="lv-lieu">
            📍 {m.ou}
            {m.distance && m.distance !== "0 m" ? ` · ${m.distance}` : ""}
            <i>{m.visibilite === "amis" ? " · 👥 Amis" : " · 🌍 Public"}</i>
          </span>
        </div>
        <span className={`lv-type ${t.ton}`}>
          {t.icone} {t.mot}
        </span>
      </header>
      {suiteDeQuoi && <p className="lv-suitede">↪ Suite de : « {suiteDeQuoi.texte.slice(0, 50)} »</p>}
      <p className="lv-texte">{m.texte}</p>
      {m.photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="lv-photo" src={m.photo} alt="" loading="lazy" />
      )}
      {m.commerce && (
        <button type="button" className="lv-commerce" onClick={() => onPage(m.commerce!.id)}>
          {m.reference ? `${m.reference.nom} · ` : ""}
          {m.commerce.nom} ›
        </button>
      )}

      {/* LES ACTIONS DU TYPE — deux, comme sur la maquette. */}
      <div className="lv-actions">
        {m.genre === "essai" ? (
          <>
            <button type="button" className="lv-b" onClick={onReponses}>
              💬 Commenter
            </button>
            {m.reference && !moi && (
              <button type="button" className="lv-b or" onClick={() => onEssayer(m.reference!)}>
                ✨ Essayer sur moi
              </button>
            )}
          </>
        ) : m.genre === "decouverte" ? (
          <>
            {m.commerce && (
              <button type="button" className="lv-b" onClick={() => onPage(m.commerce!.id)}>
                🔭 Découvrir
              </button>
            )}
            <button type="button" className="lv-b or" onClick={() => onDiscuter(m)}>
              👥 En discuter avec mes amis
            </button>
          </>
        ) : m.nature === "evenement" || m.nature === "cherche" ? (
          <>
            <button type="button" className="lv-b" onClick={onReponses}>
              💬 Répondre
            </button>
            <button type="button" className="lv-b or" onClick={() => onSortie(m)}>
              👥 En faire une sortie →
            </button>
          </>
        ) : (
          <>
            <button type="button" className="lv-b" onClick={onReponses}>
              💬 Répondre
            </button>
            <button type="button" className="lv-b or" onClick={() => onDiscuter(m)}>
              👥 En parler à mes amis
            </button>
          </>
        )}
      </div>

      <footer className="lv-pied">
        <button type="button" className={`lv-coeur${m.monCoeur ? " on" : ""}`} onClick={() => reagirVille(m.id)}>
          ❤️ {m.coeurs > 0 ? m.coeurs : ""}
        </button>
        <button type="button" className="lv-rep" onClick={onReponses}>
          💬 {m.reponses.length === 0 ? "Répondre" : `${m.reponses.length} réponse${m.reponses.length > 1 ? "s" : ""}`}
        </button>
        {m.nature === "cherche" && !m.genre && (
          <button type="button" className="lv-rep" onClick={() => caMInteresse(m.id)}>
            🙋 {(m.interesses ?? []).includes("Vous") ? "Intéressé·e" : "Ça m’intéresse"}
          </button>
        )}
        {moi && m.genre && (
          <button type="button" className="lv-rep" onClick={onSuite}>
            ↪ Publier la suite
          </button>
        )}
        {moi && (
          <button type="button" className="lv-rep" onClick={() => retirerDeLaVille(m.id)}>
            Retirer
          </button>
        )}
        {reste && <span className="lv-reste">s’efface dans {reste}</span>}
        {ami && !moi && <span className="lv-ami">ton ami·e</span>}
      </footer>

      {ouverte && (
        <div className="lv-reponses">
          {m.reponses.map((r) => (
            <p key={r.id}>
              <b>{r.qui === "Vous" ? "Toi" : r.qui}</b> {r.texte}
            </p>
          ))}
          <form
            onSubmit={(ev) => {
              ev.preventDefault();
              envoyer();
            }}
          >
            <input value={reponse} onChange={(ev) => setReponse(ev.target.value)} placeholder="Ta réponse…" maxLength={280} />
            <button type="submit" disabled={!reponse.trim()}>
              ↑
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

function CarteSortie({ s, onOuvrir, onQui }: { s: Salon; onOuvrir: () => void; onQui: (q: string) => void }) {
  return (
    <article className="lv-carte">
      <header className="lv-h">
        <Avatar qui={s.parQui} onQui={onQui} />
        <div className="lv-h-t">
          <span className="lv-nom">
            <b>{s.parQui}</b> · {s.quand}
          </span>
          <span className="lv-lieu">
            📍 {s.ou}
            {s.distance ? ` · ${s.distance}` : ""}
            <i> · 🌍 Ouvert à tous</i>
          </span>
        </div>
        <span className="lv-type rose">🎪 Événement</span>
      </header>
      <div className="lv-sortie">
        <p className="lv-texte">{s.annonce ?? s.sujet}</p>
        {s.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.photo} alt="" loading="lazy" />
        )}
      </div>
      <p className="lv-viennent">
        {s.viennent.length} {s.viennent.length > 1 ? "viennent" : "vient"}
        {s.reste ? ` · ${s.reste}` : ""}
      </p>
      <div className="lv-actions">
        <button type="button" className="lv-b" onClick={onOuvrir}>
          💬 En discuter
        </button>
        <button type="button" className="lv-b or" onClick={onOuvrir}>
          👥 Je viens →
        </button>
      </div>
    </article>
  );
}

/* ═══ « QU'AS-TU ENVIE DE PARTAGER ? » ═══ — quoi, puis à qui. */
function Composeur({
  etape,
  setEtape,
  essais,
  commerces,
  suiteDe,
  onFermer,
  onMessageVille,
  onPublie,
}: {
  etape: "choix" | "essai" | "decouverte";
  setEtape: (e: "choix" | "essai" | "decouverte") => void;
  essais: PieceGardee[];
  commerces: CarteAutour[];
  suiteDe: MessageVille | null;
  onFermer: () => void;
  onMessageVille: () => void;
  onPublie: (v: "amis" | "public") => void;
}) {
  const [essai, setEssai] = useState<PieceGardee | null>(null);
  const [commerce, setCommerce] = useState<CarteAutour | null>(
    suiteDe?.commerce ? (commerces.find((c) => c.id === suiteDe.commerce!.id) ?? null) : null,
  );
  const [texte, setTexte] = useState("");
  const [vecu, setVecu] = useState(false);
  // « MES AMIS » D'ABORD : le public se choisit.
  const [visibilite, setVisibilite] = useState<"amis" | "public">("amis");

  const pret = etape === "essai" ? Boolean(essai || suiteDe) && texte.trim().length > 0 : Boolean(commerce || suiteDe) && texte.trim().length > 0;

  const publier = () => {
    if (etape === "essai") {
      const ref = essai ? { carte: essai.carte, piece: essai.piece, nom: essai.nom } : suiteDe?.reference;
      publierDansLaVille({
        texte,
        genre: "essai",
        visibilite,
        photo: essai?.image ?? suiteDe?.photo,
        commerce: essai ? { id: essai.carte, nom: essai.lieu } : suiteDe?.commerce,
        reference: ref,
        suite: suiteDe?.id,
      });
    } else {
      const c = commerce ? { id: commerce.id, nom: commerce.nom } : suiteDe?.commerce;
      publierDansLaVille({
        texte,
        genre: "decouverte",
        visibilite,
        photo: commerce?.photo ?? suiteDe?.photo,
        commerce: c,
        vecu,
        suite: suiteDe?.id,
      });
    }
    onPublie(visibilite);
  };

  return (
    <div className="lv-fond" role="dialog" aria-label="Partager" onClick={onFermer}>
      <div className="lv-feuille" onClick={(e) => e.stopPropagation()}>
        <span className="lv-poignee" aria-hidden="true" />
        {etape === "choix" ? (
          <>
            <h2>Qu’as-tu envie de partager ?</h2>
            <button type="button" className="lv-choix" onClick={() => setEtape("essai")}>
              <span>✨</span>
              <b>Un de mes essais</b>
              <em>Une coupe, une tenue, des lunettes essayées sur toi</em>
            </button>
            <button type="button" className="lv-choix" onClick={() => setEtape("decouverte")}>
              <span>📍</span>
              <b>Une découverte</b>
              <em>Un restaurant, une boutique, un lieu qui t’a plu</em>
            </button>
            <button type="button" className="lv-choix" onClick={onMessageVille}>
              <span>💬</span>
              <b>Un message sur la ville</b>
              <em>Une question, un événement, un bon plan</em>
            </button>
          </>
        ) : (
          <>
            <h2>{suiteDe ? "La suite" : etape === "essai" ? "Partager un essai" : "Partager une découverte"}</h2>
            {suiteDe && <p className="lv-note">↪ Reliée à « {suiteDe.texte.slice(0, 60)} »</p>}

            {etape === "essai" && !suiteDe && (
              essais.length === 0 ? (
                <p className="lv-note">Tu n’as pas encore d’essai gardé. Essaie une coupe ou une tenue chez un commerçant : il se range dans Ma maison, et tu pourras le partager ici.</p>
              ) : (
                <div className="lv-picks">
                  {essais.map((p) => (
                    <button
                      key={`${p.carte}|${p.piece}`}
                      type="button"
                      className={`lv-pick${essai === p ? " on" : ""}`}
                      onClick={() => {
                        setEssai(p);
                        if (!texte) setTexte(`${p.nom} sur moi, vous en pensez quoi ?`);
                      }}
                      style={p.image ? { backgroundImage: `url("${p.image}")` } : undefined}
                    >
                      <span>{p.nom}</span>
                    </button>
                  ))}
                </div>
              )
            )}

            {etape === "decouverte" && !suiteDe && (
              <div className="lv-picks">
                {commerces.slice(0, 10).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`lv-pick${commerce?.id === c.id ? " on" : ""}`}
                    onClick={() => setCommerce(c)}
                    style={c.photo ? { backgroundImage: `url("${c.photo}")` } : undefined}
                  >
                    <span>{c.nom}</span>
                  </button>
                ))}
              </div>
            )}

            <textarea
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              maxLength={280}
              rows={2}
              placeholder={etape === "essai" ? "Ça me va ? Vous en pensez quoi ?" : "Ce que tu en as pensé…"}
            />

            {etape === "decouverte" && (
              <label className="lv-coche">
                <input type="checkbox" checked={vecu} onChange={(e) => setVecu(e.target.checked)} />
                J’y suis allé·e (la publication dira « Vécu sur place »)
              </label>
            )}

            <div className="lv-qui" role="radiogroup" aria-label="Qui la voit">
              <button type="button" role="radio" aria-checked={visibilite === "amis"} className={visibilite === "amis" ? "on" : ""} onClick={() => setVisibilite("amis")}>
                👥 Mes amis
              </button>
              <button type="button" role="radio" aria-checked={visibilite === "public"} className={visibilite === "public" ? "on" : ""} onClick={() => setVisibilite("public")}>
                🌍 Public dans ma ville
              </button>
            </div>
            {visibilite === "public" && etape === "essai" && (
              <p className="lv-attention">⚠️ Ta photo — et donc ton visage — sera visible par tous les habitants de ta ville.</p>
            )}

            <button type="button" className="lv-publier" disabled={!pret} onClick={publier}>
              Publier
            </button>
            {!suiteDe && (
              <button type="button" className="lv-retour" onClick={() => setEtape("choix")}>
                ← Autre chose
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* LA MAISON D'UN HABITANT — dans la maquette, ce qu'il a rendu visible ici. */
function ChezQuelquun({
  qui,
  publications,
  onFermer,
  onPage,
}: {
  qui: string;
  publications: MessageVille[];
  onFermer: () => void;
  onPage: (id: string) => void;
}) {
  const adresses = [...new Map(publications.filter((m) => m.commerce).map((m) => [m.commerce!.id, m.commerce!])).values()];
  return (
    <div className="lv-fond" role="dialog" aria-label={`Chez ${qui}`} onClick={onFermer}>
      <div className="lv-feuille" onClick={(e) => e.stopPropagation()}>
        <span className="lv-poignee" aria-hidden="true" />
        <div className="lv-chez">
          <span className="lv-av grand" style={{ background: teinte(qui) }} aria-hidden="true">
            {qui[0]?.toUpperCase()}
          </span>
          <div>
            <h2>Chez {qui}</h2>
            <p className="lv-note">Ce que {qui} partage avec toi.</p>
          </div>
        </div>
        {adresses.length > 0 && (
          <>
            <h3>Ses adresses</h3>
            <div className="lv-adresses">
              {adresses.map((c) => (
                <button key={c.id} type="button" onClick={() => onPage(c.id)}>
                  {c.nom} ›
                </button>
              ))}
            </div>
          </>
        )}
        <h3>Ses publications</h3>
        {publications.length === 0 ? (
          <p className="lv-note">Rien de visible pour toi en ce moment.</p>
        ) : (
          publications.map((m) => (
            <p key={m.id} className="lv-pub">
              {typeDe(m).icone} {m.texte}
            </p>
          ))
        )}
        <p className="lv-note petite">Sa maison complète s’ouvrira quand les comptes existeront : dans la maquette, chacun garde la sienne sur son téléphone.</p>
        <button type="button" className="lv-retour" onClick={onFermer}>
          Fermer
        </button>
      </div>
    </div>
  );
}

function StylesLaVille() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.lv{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;padding:4px 2px calc(28px + env(safe-area-inset-bottom,0px));
  color:#FFF4E6;font-family:var(--font-clikme),system-ui,sans-serif;}
.lv-tete{margin:2px 4px 14px;}
.lv-tete h1{margin:0;font-size:34px;font-weight:800;letter-spacing:-.02em;line-height:1.05;}
.lv-tete p{margin:6px 0 0;font-size:15px;color:#D9C6B2;}
.lv-filtres{display:flex;gap:6px;margin:0 2px 14px;}
.lv-filtres button{flex:1;display:flex;align-items:center;justify-content:center;gap:5px;height:44px;padding:0 6px;border-radius:999px;cursor:pointer;
  font:inherit;font-size:13px;font-weight:700;color:#FFF4E6;background:#211813;border:1px solid rgba(255,214,170,.22);white-space:nowrap;}
.lv-filtres button.on{color:#2A1608;background:linear-gradient(180deg,#F8B451,#E8932A);border-color:transparent;}
.lv-filtres svg{flex:none;width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linejoin:round;}
.lv-suites{margin:0 2px 12px;display:grid;gap:8px;}
.lv-suite{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;width:100%;padding:12px 14px;border-radius:18px;cursor:pointer;
  text-align:left;color:inherit;font:inherit;background:#211813;border:1px solid rgba(255,214,170,.18);}
.lv-suite b{display:block;font-size:15px;}
.lv-suite em{display:block;font-style:normal;font-size:13px;color:#CDB9A5;margin-top:2px;}
.lv-suite em s,.lv-chev{text-decoration:none;}
.lv-chev{font-size:24px;color:#CDB9A5;}
.lv-vide{margin:0 4px 14px;padding:16px;border-radius:16px;border:1px dashed rgba(255,214,170,.2);font-size:14px;color:#CDB9A5;line-height:1.4;}
.lv-carte{margin:0 2px 12px;padding:14px;border-radius:20px;background:#211813;border:1px solid rgba(255,214,170,.14);}
.lv-h{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;}
.lv-av{display:grid;place-items:center;width:48px;height:48px;border-radius:50%;border:2px solid #1C1411;cursor:pointer;
  font:inherit;font-weight:800;font-size:20px;color:#1C1009;padding:0;}
.lv-av.petit{width:40px;height:40px;font-size:17px;cursor:default;}
.lv-av.grand{width:64px;height:64px;font-size:28px;cursor:default;}
.lv-h-t{min-width:0;}
.lv-nom{display:block;font-size:14px;color:#CDB9A5;}
.lv-nom b{font-size:17px;color:#FFF4E6;}
.lv-nom u{text-decoration:none;white-space:nowrap;}
.lv-lieu{display:block;margin-top:2px;font-size:13px;color:#F5B65A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.lv-lieu i{font-style:normal;color:#BFA894;}
.lv-type{align-self:start;padding:5px 10px;border-radius:999px;font-size:12px;font-weight:700;white-space:nowrap;
  background:rgba(255,244,230,.06);border:1px solid rgba(255,244,230,.2);}
.lv-type.rose{color:#FF8CC6;background:rgba(255,46,154,.12);border-color:rgba(255,46,154,.4);}
.lv-type.or{color:#FFC46B;background:rgba(245,162,58,.12);border-color:rgba(245,162,58,.45);}
.lv-suitede{margin:10px 0 0;font-size:13px;color:#FF8CC6;}
.lv-texte{margin:10px 0 0;font-size:17px;line-height:1.35;}
.lv-photo{display:block;width:100%;max-height:340px;object-fit:cover;margin-top:10px;border-radius:16px;}
.lv-commerce{display:block;margin-top:6px;padding:0;border:0;background:none;color:#CDB9A5;font:inherit;font-size:13px;cursor:pointer;text-align:left;}
.lv-sortie{display:grid;grid-template-columns:1fr 42%;gap:12px;align-items:center;}
.lv-sortie img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:14px;margin-top:10px;}
.lv-viennent{margin:8px 0 0;font-size:13px;color:#F5B65A;}
.lv-actions{display:grid;grid-template-columns:1fr 1.3fr;gap:10px;margin-top:12px;}
.lv-b{display:flex;align-items:center;justify-content:center;gap:6px;min-height:48px;padding:8px 10px;border-radius:14px;cursor:pointer;
  font:inherit;font-size:14px;font-weight:700;color:#FFF4E6;background:none;border:1.5px solid rgba(255,244,230,.55);}
.lv-b.or{color:#2A1608;border-color:transparent;background:linear-gradient(180deg,#F8B451,#E8932A);}
.lv-pied{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;margin-top:10px;font-size:13px;color:#CDB9A5;}
.lv-coeur,.lv-rep{border:0;background:none;color:inherit;font:inherit;font-size:13px;cursor:pointer;padding:2px 0;}
.lv-coeur.on{color:#FF7DBE;}
.lv-reste{margin-left:auto;font-size:12px;color:#9C8775;}
.lv-ami{margin-left:auto;font-size:12px;color:#FFC46B;}
.lv-reponses{margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,214,170,.12);}
.lv-reponses p{margin:0 0 6px;font-size:14px;line-height:1.35;}
.lv-reponses p b{color:#F5A23A;margin-right:4px;}
.lv-reponses form{display:flex;gap:8px;margin-top:6px;}
.lv-reponses input{flex:1;min-width:0;height:42px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,214,170,.22);background:#17100D;color:#FFF4E6;font:inherit;font-size:14px;}
.lv-reponses form button{width:42px;height:42px;border-radius:50%;border:0;background:#F5A23A;color:#2A1608;font-weight:800;cursor:pointer;}
.lv-reponses form button:disabled{opacity:.4;}
.lv-fond{position:fixed;inset:0;z-index:60;display:flex;align-items:flex-end;justify-content:center;background:rgba(10,6,4,.6);}
.lv-feuille{width:min(520px,100%);max-height:86vh;overflow-y:auto;padding:10px 16px calc(18px + env(safe-area-inset-bottom,0px));
  border-radius:24px 24px 0 0;background:#1C1411;border:1px solid rgba(255,214,170,.18);color:#FFF4E6;font-family:var(--font-clikme),system-ui,sans-serif;
  animation:lvMonte .25s ease both;}
@keyframes lvMonte{from{transform:translateY(30px);opacity:0;}to{transform:none;opacity:1;}}
.lv-poignee{display:block;width:44px;height:5px;margin:0 auto 10px;border-radius:99px;background:rgba(255,244,230,.25);}
.lv-feuille h2{margin:0 0 12px;font-size:22px;font-weight:800;}
.lv-feuille h3{margin:14px 0 8px;font-size:15px;color:#F5A23A;}
.lv-choix{display:grid;grid-template-columns:auto 1fr;grid-template-areas:"i b" "i e";column-gap:12px;width:100%;margin-bottom:10px;padding:14px;border-radius:16px;
  cursor:pointer;text-align:left;color:inherit;font:inherit;background:#241A15;border:1px solid rgba(255,214,170,.16);}
.lv-choix span{grid-area:i;font-size:26px;align-self:center;}
.lv-choix b{grid-area:b;font-size:16px;}
.lv-choix em{grid-area:e;font-style:normal;font-size:13px;color:#CDB9A5;}
.lv-picks{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;margin-bottom:10px;scrollbar-width:none;}
.lv-pick{flex:none;position:relative;width:104px;height:120px;border-radius:14px;cursor:pointer;overflow:hidden;padding:0;
  border:2px solid transparent;background:#2A1F1B center / cover no-repeat;}
.lv-pick.on{border-color:#F5A23A;}
.lv-pick span{position:absolute;left:0;right:0;bottom:0;padding:6px;font-size:11px;font-weight:700;color:#FFF4E6;text-align:left;
  background:linear-gradient(transparent,rgba(0,0,0,.8));}
.lv-feuille textarea{width:100%;padding:12px 14px;border-radius:14px;border:1px solid rgba(255,214,170,.22);background:#17100D;color:#FFF4E6;
  font:inherit;font-size:15px;resize:none;}
.lv-coche{display:flex;align-items:center;gap:8px;margin-top:10px;font-size:14px;color:#EADBC8;}
.lv-qui{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;}
.lv-qui button{height:46px;border-radius:999px;cursor:pointer;font:inherit;font-size:14px;font-weight:700;color:#FFF4E6;background:#211813;border:1px solid rgba(255,214,170,.22);}
.lv-qui button.on{color:#2A1608;background:linear-gradient(180deg,#F8B451,#E8932A);border-color:transparent;}
.lv-attention{margin:8px 0 0;padding:10px 12px;border-radius:12px;font-size:13px;color:#FFD9EC;background:rgba(255,46,154,.12);border:1px solid rgba(255,46,154,.35);}
.lv-publier{display:block;width:100%;height:54px;margin-top:14px;border:0;border-radius:999px;cursor:pointer;font:inherit;font-size:17px;font-weight:800;
  color:#fff;background:linear-gradient(135deg,#FF4FB0,#FF2E9A 60%,#E0187F);}
.lv-publier:disabled{opacity:.4;}
.lv-retour{display:block;width:100%;margin-top:8px;padding:12px;border-radius:999px;border:1px solid rgba(255,244,230,.3);background:none;color:#FFF4E6;font:inherit;font-weight:700;cursor:pointer;}
.lv-note{margin:0 0 10px;font-size:14px;color:#CDB9A5;line-height:1.4;}
.lv-note.petite{margin-top:14px;font-size:12px;color:#9C8775;}
.lv-chez{display:flex;align-items:center;gap:14px;margin-bottom:6px;}
.lv-chez h2{margin:0;}
.lv-adresses{display:flex;flex-wrap:wrap;gap:8px;}
.lv-adresses button{padding:8px 12px;border-radius:999px;border:1px solid rgba(245,162,58,.5);background:none;color:#FFC46B;font:inherit;font-size:13px;font-weight:700;cursor:pointer;}
.lv-pub{margin:0 0 8px;padding:10px 12px;border-radius:12px;background:#241A15;font-size:14px;}
`,
      }}
    />
  );
}
