"use client";

// 🏠 MA MAISON — l'onglet qui remplace « Profil ».
//
// « "Ma maison" exprime et conserve. » En haut, qui habite là (« Chez Léa »).
// Au centre, la maison : une pièce par univers, et dans chaque pièce le
// fantôme des commerces adoptés — on la touche, elle s'ouvre sur eux. Dessous,
// ce qu'on garde : ses essais, ses découvertes, ses publications.
//
// UN DÉCOR FIXE, DES FANTÔMES POSÉS DESSUS : aucun moteur 3D, aucune image
// fabriquée à chaque geste. Chaque pièce prend le décor et le fantôme du
// métier qu'elle accueille (`ma-maison.ts`).
//
// LES ESSAIS SONT PRIVÉS PAR DÉFAUT. « Voir comme mes amis » montre la maison
// telle qu'un ami la verrait : sans les essais privés, sans les réservations,
// sans les conversations.
import { useState, useSyncExternalStore } from "react";
import type { CarteAutour } from "@/lib/direct/apercu-habitant";
import type { MessageVille } from "@/lib/direct/la-ville";
import type { FantomePose } from "@/lib/direct/mes-fantomes";
import type { PieceGardee } from "@/lib/direct/pieces-gardees";
import {
  abonnerMaison,
  chargerMaison,
  direPresentation,
  habillage,
  MAISON_VIDE,
  partagerEssai,
  PIECES,
  rangerLaMaison,
  type ClePiece,
} from "@/lib/direct/ma-maison";

type Essai = { cle: string; titre: string; lieu: string; photo?: string; carte?: string; piece?: PieceGardee; trace?: FantomePose };

const rien = () => () => {};

export function MaMaison({
  prenom,
  adoptes,
  pieces,
  traces,
  publications,
  onPage,
  onVoirPiece,
  onVoirTrace,
  onPartager,
  onDecouvrir,
  onReglages,
  onNePlusSuivre,
  demandeVisite = 0,
}: {
  prenom: string;
  /** Les commerces adoptés (suivis), tels que l'application les connaît. */
  adoptes: CarteAutour[];
  pieces: PieceGardee[];
  traces: FantomePose[];
  /** Ce que j'ai dit dans La ville. */
  publications: MessageVille[];
  /** Ouvre la page d'un commerce. */
  onPage: (c: { id: string }) => void;
  onVoirPiece: (p: PieceGardee) => void;
  onVoirTrace: (t: FantomePose) => void;
  /** Partager un essai avec ses amis : ouvre la conversation. */
  onPartager: (e: { titre: string; lieu: string; photo?: string; carte?: string }) => void;
  /** Aller découvrir des commerces (Le Direct). */
  onDecouvrir: () => void;
  /** Les réglages du compte (l'ancien « Mon espace »). */
  onReglages: () => void;
  onNePlusSuivre: (id: string) => void;
  /** Change à chaque appui sur le fantôme de la barre : « Faire visiter ma maison ». */
  demandeVisite?: number;
}) {
  const monte = useSyncExternalStore(rien, () => true, () => false);
  const reglages = useSyncExternalStore(abonnerMaison, chargerMaison, () => MAISON_VIDE);
  const [commeAmi, setCommeAmi] = useState(false);
  const [onglet, setOnglet] = useState<"essais" | "decouvertes" | "publications">("essais");
  const [ouverte, setOuverte] = useState<ClePiece | null>(null);
  const [edition, setEdition] = useState(false);
  const [presentation, setPresentation] = useState("");
  const [invite, setInvite] = useState("");
  const [visite, setVisite] = useState(false);
  // LE FANTÔME DE LA BARRE FAIT VISITER LA MAISON. Une demande nouvelle se
  // voit pendant le rendu, sans effet.
  const [demandeVue, setDemandeVue] = useState(demandeVisite);
  if (demandeVisite !== demandeVue) {
    setDemandeVue(demandeVisite);
    setOuverte(null);
    setVisite(true);
  }

  const maison = rangerLaMaison(adoptes);
  const nbFantomes = adoptes.length;
  const nom = prenom.trim();

  // MES ESSAIS : les pièces essayées et gardées, et les traces d'un essai.
  const essais: Essai[] = [
    ...pieces.map((p) => ({ cle: `piece:${p.carte}|${p.piece}`, titre: p.nom, lieu: p.lieu, photo: p.image, carte: p.carte, piece: p })),
    ...traces
      .filter((t) => t.essai)
      .map((t) => ({ cle: `trace:${t.id}`, titre: t.essai?.quoi ?? t.mot, lieu: t.souvenir.lieu, photo: t.photo, carte: t.souvenir.cle, trace: t })),
  ];
  const partage = (cle: string) => reglages.partages.includes(cle);
  const essaisVus = commeAmi ? essais.filter((e) => partage(e.cle)) : essais;
  // MES DÉCOUVERTES : les lieux où j'ai laissé mon fantôme — ce que J'AI dit y avoir vécu.
  const decouvertes = traces.filter((t) => !t.essai);

  const inviter = async () => {
    const url = `${window.location.origin}/autour-de-moi`;
    const texte = `Viens voir ma maison sur Clikme${nom ? ` — chez ${nom}` : ""} : mes bonnes adresses et mes coups de cœur.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Ma maison Clikme", text: texte, url });
        return;
      }
      await navigator.clipboard.writeText(`${texte} ${url}`);
      setInvite("Lien copié : colle-le à tes amis.");
    } catch {
      setInvite("Partage annulé.");
    }
    window.setTimeout(() => setInvite(""), 3500);
  };

  const pieceOuverte = PIECES.find((p) => p.cle === ouverte);

  return (
    <div className="mm">
      <StylesMaMaison />
      <header className="mm-tete">
        <div>
          <h1>Ma maison</h1>
          <p>Mon univers, mes essais, mes bonnes adresses</p>
        </div>
        {!commeAmi && (
          <button type="button" className="mm-roue" onClick={onReglages} aria-label="Réglages">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="3.2" />
              <path d="M12 2.8v2.4M12 18.8v2.4M4.2 7.5l2 1.2M17.8 15.3l2 1.2M4.2 16.5l2-1.2M17.8 8.7l2-1.2" />
              <path d="M12 6.2a5.8 5.8 0 1 0 0 11.6 5.8 5.8 0 0 0 0-11.6Z" />
            </svg>
          </button>
        )}
      </header>

      {commeAmi && (
        <div className="mm-commeami">
          <span>👀 Tes amis voient ta maison ainsi : sans tes essais privés, tes réservations ni tes conversations.</span>
          <button type="button" onClick={() => setCommeAmi(false)}>
            Revenir
          </button>
        </div>
      )}

      {/* ═══ QUI HABITE LÀ ═══ */}
      <section className="mm-qui">
        <span className="mm-av" aria-hidden="true">
          {(nom[0] ?? "🙂").toUpperCase()}
        </span>
        <div className="mm-qui-t">
          <b>{nom ? `Chez ${nom}` : "Chez toi"}</b>
          {edition ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                direPresentation(presentation);
                setEdition(false);
              }}
            >
              <input
                autoFocus
                value={presentation}
                maxLength={120}
                onChange={(e) => setPresentation(e.target.value)}
                placeholder="Mes goûts, mes essais, mes bonnes adresses."
              />
              <button type="submit">OK</button>
            </form>
          ) : (
            <em>
              {(monte && reglages.presentation) || "Mes goûts, mes essais, mes bonnes adresses."}
              {!commeAmi && (
                <button
                  type="button"
                  className="mm-edit"
                  onClick={() => {
                    setPresentation(reglages.presentation);
                    setEdition(true);
                  }}
                >
                  Modifier
                </button>
              )}
            </em>
          )}
        </div>
        {!commeAmi && (
          <button type="button" className="mm-voir" onClick={() => setCommeAmi(true)}>
            Voir comme mes amis <s aria-hidden="true">›</s>
          </button>
        )}
      </section>

      {/* ═══ LA MAISON ═══ — une pièce par univers. */}
      <div className="mm-maison" aria-label="Ma maison et ses pièces">
        <div className="mm-toit" aria-hidden="true">
          <span className="mm-chem" />
        </div>
        <div className="mm-murs">
          {PIECES.map((p) => {
            const ici = maison[p.cle];
            const h = habillage(p, ici[0]);
            const vide = ici.length === 0;
            return (
              <button
                key={p.cle}
                type="button"
                className={`mm-piece${vide ? " vide" : ""}`}
                onClick={() => setOuverte(p.cle)}
                aria-label={vide ? `${p.nom} : vide` : `${p.nom} : ${ici.map((c) => c.nom).join(", ")}`}
              >
                <span className="mm-decor" style={{ backgroundImage: `url("${h.decor}")` }} />
                {!vide && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="mm-fant" src={h.fantome} alt="" loading="lazy" draggable={false} />
                )}
                {ici.length > 1 && <span className="mm-nb">{ici.length}</span>}
                <span className="mm-etiq">{vide ? `＋ ${p.nom}` : ici[0].nom}</span>
              </button>
            );
          })}
        </div>
        <div className="mm-compte">
          <span aria-hidden="true">👻</span>
          {nbFantomes === 0
            ? "Aucun fantôme adopté"
            : `${nbFantomes} fantôme${nbFantomes > 1 ? "s" : ""} adopté${nbFantomes > 1 ? "s" : ""}`}
        </div>
      </div>

      {/* ÉTAT INITIAL : rien d'adopté, on dit comment la remplir. */}
      {nbFantomes === 0 && !commeAmi && (
        <div className="mm-accueil">
          <b>Ta maison est encore vide.</b>
          <span>Touche le cœur « Suivre » d’un commerce que tu aimes : son fantôme vient s’installer dans la pièce qui lui va.</span>
          <button type="button" onClick={onDecouvrir}>
            Découvrir les commerces <s aria-hidden="true">→</s>
          </button>
        </div>
      )}

      {/* ═══ CE QUE JE GARDE ═══ */}
      <nav className="mm-onglets" aria-label="Ce que je garde">
        {(
          [
            ["essais", "Mes essais"],
            ["decouvertes", "Mes découvertes"],
            ["publications", "Mes publications"],
          ] as const
        ).map(([k, t]) => (
          <button key={k} type="button" className={onglet === k ? "on" : ""} onClick={() => setOnglet(k)}>
            {t}
          </button>
        ))}
      </nav>

      {onglet === "essais" && (
        <section className="mm-liste">
          {essaisVus.length === 0 && (
            <p className="mm-vide">
              {commeAmi
                ? "Aucun essai partagé avec tes amis."
                : "Tes essais apparaîtront ici : une coupe, une tenue, des lunettes essayées sur toi. Ils restent privés tant que tu ne les partages pas."}
            </p>
          )}
          {essaisVus.map((e) => (
            <article key={e.cle} className="mm-essai">
              <button
                type="button"
                className="mm-essai-ph"
                onClick={() => (e.piece ? onVoirPiece(e.piece) : e.trace && onVoirTrace(e.trace))}
                style={e.photo ? { backgroundImage: `url("${e.photo}")` } : undefined}
                aria-label={`Voir ${e.titre}`}
              >
                {!e.photo && <span aria-hidden="true">👻</span>}
              </button>
              <div className="mm-essai-t">
                <b>{e.titre}</b>
                <em>{e.lieu}</em>
                <span className={`mm-badge${partage(e.cle) ? " amis" : ""}`}>
                  {partage(e.cle) ? "👥 Partagé avec mes amis" : "🔒 Privé"}
                </span>
                {!commeAmi &&
                  (partage(e.cle) ? (
                    <button type="button" className="mm-lien" onClick={() => partagerEssai(e.cle, false)}>
                      Rendre privé
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="mm-or"
                      onClick={() => {
                        partagerEssai(e.cle, true);
                        onPartager({ titre: e.titre, lieu: e.lieu, photo: e.photo, carte: e.carte });
                      }}
                    >
                      Partager avec mes amis <s aria-hidden="true">→</s>
                    </button>
                  ))}
              </div>
            </article>
          ))}
        </section>
      )}

      {onglet === "decouvertes" && (
        <section className="mm-liste">
          {decouvertes.length === 0 && (
            <p className="mm-vide">Les lieux où tu laisses ton fantôme — « j’y étais », ta photo, ton mot — se rangent ici.</p>
          )}
          {decouvertes.map((t) => (
            <button key={t.id} type="button" className="mm-decouv" onClick={() => onVoirTrace(t)}>
              <span className="mm-decouv-ph" style={t.photo ? { backgroundImage: `url("${t.photo}")` } : undefined}>
                {!t.photo && "👻"}
              </span>
              <span>
                <b>{t.souvenir.lieu}</b>
                <em>{t.mot}</em>
              </span>
              <s aria-hidden="true">›</s>
            </button>
          ))}
        </section>
      )}

      {onglet === "publications" && (
        <section className="mm-liste">
          {publications.length === 0 && (
            <p className="mm-vide">Ce que tu dis dans La ville — une question, un bon plan, un coup de cœur — se retrouve ici.</p>
          )}
          {publications.map((m) => (
            <div key={m.id} className="mm-pub">
              <b>{m.texte}</b>
              <em>
                {m.ou} · {m.reponses.length} réponse{m.reponses.length > 1 ? "s" : ""} · {m.coeurs} ❤️
              </em>
            </div>
          ))}
        </section>
      )}

      {!commeAmi && (
        <button type="button" className="mm-inviter" onClick={() => void inviter()}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="9" cy="8" r="3.5" />
            <path d="M2.5 20c.6-3.7 3.3-6 6.5-6s5.9 2.3 6.5 6M19 8v6M16 11h6" />
          </svg>
          Inviter un ami chez moi
        </button>
      )}
      {invite && <p className="mm-toast">{invite}</p>}

      {/* ═══ FAIRE VISITER MA MAISON ═══
          Le geste du fantôme sur cette page. Le partage part d'un appui DANS
          la feuille : un téléphone ne laisse ouvrir son menu de partage qu'au
          doigt, jamais au milieu d'un rendu. */}
      {visite && (
        <div className="mm-fond" role="dialog" aria-label="Faire visiter ma maison" onClick={() => setVisite(false)}>
          <div className="mm-fiche" onClick={(e) => e.stopPropagation()}>
            <span className="mm-poignee" aria-hidden="true" />
            <h2>Faire visiter ma maison</h2>
            <p className="mm-visite-p">
              {nbFantomes > 0
                ? `${nbFantomes} fantôme${nbFantomes > 1 ? "s" : ""} habite${nbFantomes > 1 ? "nt" : ""} chez toi. `
                : "Ta maison est encore vide. "}
              Tes amis verront tes bonnes adresses, tes découvertes et les essais que tu as choisi de partager — jamais les autres.
            </p>
            <button
              type="button"
              className="mm-inviter"
              onClick={() => {
                setVisite(false);
                void inviter();
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="9" cy="8" r="3.5" />
                <path d="M2.5 20c.6-3.7 3.3-6 6.5-6s5.9 2.3 6.5 6M19 8v6M16 11h6" />
              </svg>
              Inviter un ami chez moi
            </button>
            <button
              type="button"
              className="mm-visite-voir"
              onClick={() => {
                setVisite(false);
                setCommeAmi(true);
              }}
            >
              👀 Voir ce que mes amis verront
            </button>
          </div>
        </div>
      )}

      {/* ═══ LA FICHE D'UNE PIÈCE ═══ */}
      {pieceOuverte && (
        <div className="mm-fond" role="dialog" aria-label={pieceOuverte.nom} onClick={() => setOuverte(null)}>
          <div className="mm-fiche" onClick={(e) => e.stopPropagation()}>
            <span className="mm-poignee" aria-hidden="true" />
            <h2>{pieceOuverte.nom}</h2>
            {maison[pieceOuverte.cle].length === 0 ? (
              <div className="mm-fiche-vide">
                <p>Personne n’habite encore {pieceOuverte.nom.toLowerCase()}. Adopte {pieceOuverte.invite} près de chez toi : son fantôme s’y installera.</p>
                <button
                  type="button"
                  className="mm-or"
                  onClick={() => {
                    setOuverte(null);
                    onDecouvrir();
                  }}
                >
                  Découvrir {pieceOuverte.invite} <s aria-hidden="true">→</s>
                </button>
              </div>
            ) : (
              maison[pieceOuverte.cle].map((c) => {
                const lies = essais.filter((e) => e.carte === c.id && (!commeAmi || partage(e.cle)));
                const vus = decouvertes.filter((t) => t.souvenir.cle === c.id);
                return (
                  <div key={c.id} className="mm-com">
                    <div className="mm-com-h">
                      <span className="mm-com-ph" style={c.photo ? { backgroundImage: `url("${c.photo}")` } : undefined} />
                      <span>
                        <b>{c.nom}</b>
                        <em>
                          {c.metier}
                          {c.distance ? ` · ${c.distance}` : ""}
                        </em>
                      </span>
                    </div>
                    {(lies.length > 0 || vus.length > 0) && (
                      <ul>
                        {lies.map((e) => (
                          <li key={e.cle}>✨ Essai : {e.titre}</li>
                        ))}
                        {vus.map((t) => (
                          <li key={t.id}>👻 {t.mot}</li>
                        ))}
                      </ul>
                    )}
                    <div className="mm-com-b">
                      <button type="button" className="mm-or" onClick={() => onPage(c)}>
                        Sa page <s aria-hidden="true">→</s>
                      </button>
                      {!commeAmi && (
                        <button type="button" className="mm-lien" onClick={() => onNePlusSuivre(c.id)}>
                          Ne plus suivre
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <button type="button" className="mm-fermer" onClick={() => setOuverte(null)}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StylesMaMaison() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.mm{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;padding:4px 2px calc(30px + env(safe-area-inset-bottom,0px));
  color:#FFF4E6;font-family:var(--font-clikme),system-ui,sans-serif;}
.mm-tete{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin:2px 4px 14px;}
.mm-tete h1{margin:0;font-size:34px;font-weight:800;letter-spacing:-.02em;line-height:1.05;}
.mm-tete p{margin:6px 0 0;font-size:15px;color:#D9C6B2;}
.mm-roue{flex:none;display:grid;place-items:center;width:48px;height:48px;border-radius:50%;cursor:pointer;background:none;border:0;color:#FFF4E6;}
.mm-roue svg{width:28px;height:28px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;}
.mm-commeami{display:flex;align-items:center;gap:10px;margin:0 2px 12px;padding:10px 12px;border-radius:14px;
  background:rgba(255,46,154,.12);border:1px solid rgba(255,46,154,.35);font-size:13px;color:#FFD9EC;}
.mm-commeami button{flex:none;border:0;border-radius:999px;padding:8px 12px;background:#FF2E9A;color:#fff;font:inherit;font-weight:700;cursor:pointer;}
.mm-qui{display:grid;grid-template-columns:auto 1fr;grid-template-areas:"av t" "v v";gap:10px 14px;align-items:center;
  margin:0 2px 14px;padding:14px;border-radius:20px;background:#211813;border:1px solid rgba(255,214,170,.14);}
.mm-av{grid-area:av;display:grid;place-items:center;width:64px;height:64px;border-radius:50%;font-size:28px;font-weight:800;
  color:#1C1009;background:linear-gradient(135deg,#F5A23A,#FF7DBE);border:2px solid rgba(255,244,230,.6);}
.mm-qui-t{grid-area:t;min-width:0;}
.mm-qui-t b{display:block;font-size:22px;font-weight:800;}
.mm-qui-t em{display:block;font-style:normal;font-size:14px;color:#CDB9A5;margin-top:3px;}
.mm-qui-t form{display:flex;gap:6px;margin-top:6px;}
.mm-qui-t input{flex:1;min-width:0;height:38px;padding:0 12px;border-radius:999px;border:1px solid rgba(255,214,170,.25);background:#17100D;color:#FFF4E6;font:inherit;font-size:14px;}
.mm-qui-t form button{border:0;border-radius:999px;padding:0 14px;background:#F5A23A;color:#2A1608;font:inherit;font-weight:800;cursor:pointer;}
.mm-edit{margin-left:8px;border:0;background:none;color:#F5A23A;font:inherit;font-size:13px;font-weight:600;cursor:pointer;padding:0;}
.mm-voir{grid-area:v;justify-self:end;border:0;background:none;color:#FFF4E6;font:inherit;font-size:14px;font-weight:600;cursor:pointer;}
.mm-voir s{text-decoration:none;margin-left:4px;}

/* LA MAISON : un toit, des murs de bois, six pièces éclairées. */
.mm-maison{position:relative;margin:4px 0 6px;padding:0 6px;}
.mm-toit{position:relative;height:74px;margin:0 -2px;clip-path:polygon(50% 0,100% 100%,0 100%);
  background:repeating-linear-gradient(170deg,#4a2f22 0 9px,#3a241a 9px 18px);}
.mm-toit::after{content:"";position:absolute;left:50%;bottom:10px;width:34px;height:24px;transform:translateX(-50%);
  border-radius:6px 6px 0 0;background:radial-gradient(circle at 50% 70%,#FFD08A,#F5A23A 55%,#8a4f1c);box-shadow:0 0 18px rgba(255,190,110,.7);}
.mm-chem{position:absolute;right:22%;top:14px;width:18px;height:34px;background:#5b3a29;}
.mm-murs{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:6px;border-radius:0 0 8px 8px;
  background:linear-gradient(180deg,#6b4430,#4b2e20);box-shadow:0 18px 30px -12px rgba(0,0,0,.8);}
.mm-piece{position:relative;height:clamp(118px,33vw,150px);overflow:hidden;border:0;border-radius:6px;padding:0;cursor:pointer;
  background:#1C1411;box-shadow:inset 0 0 0 1px rgba(0,0,0,.4);}
.mm-decor{position:absolute;inset:0;background:center / cover no-repeat;filter:brightness(.88) saturate(1.15);}
.mm-piece::after{content:"";position:absolute;inset:0;background:radial-gradient(90% 70% at 50% 20%,rgba(255,200,120,.25),transparent 70%),
  linear-gradient(180deg,transparent 45%,rgba(18,12,9,.55));pointer-events:none;}
.mm-piece.vide .mm-decor{filter:brightness(.38) grayscale(.6);}
.mm-fant{position:absolute;z-index:1;left:50%;bottom:22px;height:78%;transform:translateX(-50%);filter:drop-shadow(0 6px 8px rgba(0,0,0,.55));}
.mm-etiq{position:absolute;z-index:2;left:50%;bottom:6px;transform:translateX(-50%);max-width:92%;padding:5px 12px;border-radius:999px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px;font-weight:700;color:#FFF4E6;
  background:rgba(28,18,12,.85);border:1.5px solid #E7A84B;}
.mm-nb{position:absolute;z-index:2;top:6px;right:6px;display:grid;place-items:center;min-width:24px;height:24px;padding:0 6px;border-radius:999px;
  font-size:12px;font-weight:800;color:#2A1608;background:#F5A23A;box-shadow:0 2px 8px rgba(0,0,0,.5);}
.mm-piece.vide .mm-etiq{border-style:dashed;border-color:rgba(255,214,170,.45);color:#D9C6B2;}
.mm-compte{display:flex;align-items:center;justify-content:center;gap:8px;width:max-content;margin:-14px auto 0;position:relative;z-index:2;
  padding:8px 16px;border-radius:999px;font-size:14px;font-weight:700;background:#2A1E18;border:1.5px solid #E7A84B;}
.mm-accueil{margin:14px 2px 0;padding:16px;border-radius:18px;text-align:center;background:#211813;border:1px dashed rgba(245,162,58,.45);}
.mm-accueil b{display:block;font-size:17px;}
.mm-accueil span{display:block;margin:6px 0 12px;font-size:14px;color:#CDB9A5;line-height:1.4;}
.mm-accueil button,.mm-or{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:0;border-radius:999px;cursor:pointer;
  padding:10px 16px;font:inherit;font-weight:800;font-size:14px;color:#2A1608;background:linear-gradient(180deg,#F8B451,#E8932A);}
.mm-or s,.mm-accueil s{text-decoration:none;}
.mm-onglets{display:flex;gap:6px;margin:18px 2px 12px;}
.mm-onglets button{flex:1;padding:11px 6px;border-radius:999px;cursor:pointer;font:inherit;font-size:13px;font-weight:700;
  color:#FFF4E6;background:#211813;border:1px solid rgba(255,214,170,.18);}
.mm-onglets button.on{color:#2A1608;background:linear-gradient(180deg,#F8B451,#E8932A);border-color:transparent;}
.mm-liste{margin:0 2px;}
.mm-vide{padding:16px;border-radius:16px;border:1px dashed rgba(255,214,170,.2);font-size:14px;color:#CDB9A5;line-height:1.4;}
.mm-essai{display:grid;grid-template-columns:42% 1fr;gap:12px;margin-bottom:10px;padding:10px;border-radius:18px;background:#211813;border:1px solid rgba(255,214,170,.14);}
.mm-essai-ph{aspect-ratio:4/3;border:0;border-radius:12px;background:#2A1F1B center / cover no-repeat;cursor:pointer;font-size:30px;}
.mm-essai-t{display:flex;flex-direction:column;align-items:flex-start;gap:6px;min-width:0;}
.mm-essai-t b{font-size:16px;line-height:1.2;}
.mm-essai-t em{font-style:normal;font-size:13px;color:#CDB9A5;}
.mm-badge{padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600;background:rgba(255,244,230,.08);border:1px solid rgba(255,244,230,.2);}
.mm-badge.amis{color:#FFD08A;border-color:rgba(245,162,58,.5);}
.mm-lien{border:0;background:none;color:#CDB9A5;font:inherit;font-size:13px;cursor:pointer;padding:2px 0;text-decoration:underline;}
.mm-decouv{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;width:100%;margin-bottom:10px;padding:10px;border-radius:16px;
  cursor:pointer;text-align:left;color:inherit;font:inherit;background:#211813;border:1px solid rgba(255,214,170,.14);}
.mm-decouv-ph{display:grid;place-items:center;width:58px;height:58px;border-radius:12px;background:#2A1F1B center / cover no-repeat;}
.mm-decouv b{display:block;font-size:15px;}
.mm-decouv em{display:block;font-style:normal;font-size:13px;color:#CDB9A5;}
.mm-decouv s{text-decoration:none;font-size:22px;color:#CDB9A5;}
.mm-pub{margin-bottom:10px;padding:12px 14px;border-radius:16px;background:#211813;border:1px solid rgba(255,214,170,.14);}
.mm-pub b{display:block;font-size:15px;font-weight:600;}
.mm-pub em{display:block;margin-top:4px;font-style:normal;font-size:12px;color:#CDB9A5;}
.mm-inviter{display:flex;align-items:center;justify-content:center;gap:10px;width:calc(100% - 4px);height:58px;margin:18px 2px 0;border:0;border-radius:18px;cursor:pointer;
  font:inherit;font-size:17px;font-weight:800;color:#2A1608;background:linear-gradient(180deg,#F8B451,#E8932A);box-shadow:0 12px 26px -12px rgba(245,162,58,.8);}
.mm-inviter svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;}
.mm-visite-p{margin:0 0 4px;font-size:14px;line-height:1.45;color:#CDB9A5;}
.mm-visite-voir{display:block;width:calc(100% - 4px);height:50px;margin:10px 2px 0;border-radius:18px;cursor:pointer;font:inherit;font-size:15px;font-weight:700;
  color:#FFF4E6;background:transparent;border:1px solid rgba(255,214,170,.3);}
.mm-toast{margin:8px 2px 0;text-align:center;font-size:13px;color:#FFD08A;}
.mm-fond{position:fixed;inset:0;z-index:60;display:flex;align-items:flex-end;justify-content:center;background:rgba(10,6,4,.6);}
.mm-fiche{width:min(520px,100%);max-height:82vh;overflow-y:auto;padding:10px 16px calc(18px + env(safe-area-inset-bottom,0px));
  border-radius:24px 24px 0 0;background:#1C1411;border:1px solid rgba(255,214,170,.18);animation:mmMonte .25s ease both;}
@keyframes mmMonte{from{transform:translateY(30px);opacity:0;}to{transform:none;opacity:1;}}
.mm-poignee{display:block;width:44px;height:5px;margin:0 auto 10px;border-radius:99px;background:rgba(255,244,230,.25);}
.mm-fiche h2{margin:0 0 12px;font-size:22px;font-weight:800;}
.mm-fiche-vide p{font-size:14px;color:#CDB9A5;line-height:1.45;}
.mm-com{margin-bottom:12px;padding:12px;border-radius:16px;background:#241A15;border:1px solid rgba(255,214,170,.14);}
.mm-com-h{display:flex;align-items:center;gap:12px;}
.mm-com-ph{flex:none;width:52px;height:52px;border-radius:12px;background:#2A1F1B center / cover no-repeat;}
.mm-com-h b{display:block;font-size:16px;}
.mm-com-h em{display:block;font-style:normal;font-size:13px;color:#CDB9A5;}
.mm-com ul{margin:10px 0 0;padding:0;list-style:none;font-size:13px;color:#EADBC8;display:grid;gap:4px;}
.mm-com-b{display:flex;align-items:center;justify-content:space-between;margin-top:10px;}
.mm-fermer{display:block;width:100%;margin-top:6px;padding:12px;border-radius:999px;border:1px solid rgba(255,244,230,.3);background:none;color:#FFF4E6;font:inherit;font-weight:700;cursor:pointer;}
`,
      }}
    />
  );
}
