"use client";

/**
 * 🤪 CLIK, LA MASCOTTE DE « MA COLLECTION » — 5 novembre 2026 (« une figurine marrante peut accueillir et dire quelque
 * chose pour expliquer vite fait ce qu'il faut faire… au lieu de mettre des fantômes partout, il faut mettre des
 * figurines d'exemple comme la figurine marrante qu'il va falloir que tu crées »).
 *
 * UNE FIGURINE DESSINÉE (SVG), pas une image : une grosse tête sur un ressort et un socle en bois, comme les vraies.
 * Elle rebondit sur son ressort, cligne des yeux, salue, et parle (sa bouche bouge) quand elle explique quelque chose
 * (`MascotteDit`). Elle porte la tenue de chaque édition du mois (`edition` : la couronne de la galette, le bonnet de
 * l'automne, le chapeau de sorcière d'Halloween…) : c'est elle, la figurine d'exemple, partout où il y avait un fantôme.
 * Dorée (`or`), holographique (`rare`), en silhouette (`ombre`, une édition à venir). Sans animation : `fixe` (les
 * petites cases de l'album), et pour qui les a coupées.
 */
import { useEffect, useId, useState, type ReactNode } from "react";
import { THEMES } from "@/app/f/[slug]/collection";

export type Humeur = "content" | "surpris" | "clin";

type Props = {
  edition?: string | null;
  parle?: boolean;
  salue?: boolean;
  humeur?: Humeur;
  or?: boolean;
  rare?: boolean;
  ombre?: boolean;
  fixe?: boolean;
  className?: string;
  titre?: string;
};

const PEAU = ["#FFE7D8", "#F3B794"];

export function Mascotte({ edition, parle = false, salue = false, humeur = "content", or = false, rare = false, ombre = false, fixe = false, className, titre }: Props) {
  const u = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = (n: string) => `mq${u}${n}`;
  const th = (edition && THEMES[edition]) || (rare ? THEMES.rare : null);
  const chemise = th ? [th.a, th.b] : ["#FF6DB8", "#C2187A"];
  const e = edition ?? "";
  const lunettes = e === "ete";
  return (
    <svg
      viewBox="0 0 200 280"
      preserveAspectRatio="xMidYMax meet"
      className={`mq${parle ? " parle" : ""}${salue ? " salue" : ""}${or ? " or" : ""}${rare ? " rare" : ""}${ombre ? " ombre" : ""}${fixe ? " fixe" : ""}${className ? ` ${className}` : ""}`}
      role={titre ? "img" : undefined}
      aria-label={titre}
      aria-hidden={titre ? undefined : true}
    >
      <defs>
        <radialGradient id={id("peau")} cx="40%" cy="32%" r="75%">
          <stop offset="0" stopColor={PEAU[0]} />
          <stop offset="1" stopColor={PEAU[1]} />
        </radialGradient>
        <linearGradient id={id("chemise")} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={chemise[0]} />
          <stop offset="1" stopColor={chemise[1]} />
        </linearGradient>
        <linearGradient id={id("cheveux")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6A3D27" />
          <stop offset="1" stopColor="#3A2116" />
        </linearGradient>
        <linearGradient id={id("bois")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E0A970" />
          <stop offset="1" stopColor="#B57440" />
        </linearGradient>
        <linearGradient id={id("bois2")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8E5428" />
          <stop offset="1" stopColor="#5E3214" />
        </linearGradient>
        <linearGradient id={id("acier")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7E8592" />
          <stop offset=".45" stopColor="#F3F5F8" />
          <stop offset="1" stopColor="#8A909C" />
        </linearGradient>
        <linearGradient id={id("dore")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE58A" />
          <stop offset="1" stopColor="#D8961C" />
        </linearGradient>
      </defs>

      {/* l'ombre, le socle */}
      <ellipse cx="100" cy="268" rx="72" ry="8" fill="rgba(0,0,0,.28)" />
      <path d="M38 250 L38 261 A62 13 0 0 0 162 261 L162 250 Z" fill={`url(#${id("bois2")})`} />
      <ellipse cx="100" cy="250" rx="62" ry="13" fill={`url(#${id("bois")})`} />
      <ellipse cx="100" cy="250" rx="44" ry="8.5" fill="none" stroke="rgba(90,45,15,.18)" strokeWidth="1.5" />

      {/* le ressort */}
      <g className="m-ressort">
        {[0, 1, 2, 3, 4, 5, 6].map((k) => (
          <ellipse key={k} cx="100" cy={208 + k * 6.3} rx="15" ry="4.2" fill="none" stroke={`url(#${id("acier")})`} strokeWidth="3.3" />
        ))}
        <ellipse cx="100" cy="249" rx="12" ry="3" fill="#7E8592" />
      </g>

      {/* le haut : il rebondit */}
      <g className="m-haut">
        {/* le bras gauche (au repos), et ce qu'il tient */}
        <g transform="rotate(16 70 160)">
          <rect x="62" y="156" width="15" height="34" rx="7.5" fill={`url(#${id("chemise")})`} />
          <circle cx="69.5" cy="192" r="7.5" fill={`url(#${id("peau")})`} />
        </g>
        {e === "fete-des-meres" && (
          <g>
            <path d="M52 202 L60 176 L68 202 Z" fill="#F7E7C8" stroke="#E2C99A" strokeWidth="1" />
            <circle cx="54" cy="174" r="6" fill="#FF5C8A" />
            <circle cx="64" cy="170" r="6" fill="#FFD23F" />
            <circle cx="60" cy="162" r="6" fill="#FF8FB8" />
            <circle cx="54" cy="174" r="2" fill="#fff" opacity=".7" />
          </g>
        )}
        {e === "halloween" && (
          <g>
            <ellipse cx="58" cy="196" rx="12" ry="10" fill="#FF8A1F" />
            <path d="M52 188 Q58 194 64 188" stroke="#D9690F" strokeWidth="1.5" fill="none" />
            <rect x="56.5" y="182" width="3" height="6" rx="1.5" fill="#3E6B2A" />
            <path d="M53 196 l3 -3 l3 3 M59 196 l3 -3 l3 3" stroke="#5A2A06" strokeWidth="1.6" fill="none" />
          </g>
        )}
        {e === "rentree" && <rect x="44" y="184" width="22" height="16" rx="2" fill="#3B6FD8" stroke="#2A4FA0" strokeWidth="1.5" transform="rotate(-12 55 192)" />}

        {/* le corps */}
        <path d="M70 156 Q100 146 130 156 L141 195 Q100 207 59 195 Z" fill={`url(#${id("chemise")})`} />
        <path d="M88 152 Q100 163 112 152" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".9" />
        <circle cx="100" cy="174" r="2.4" fill="#fff" opacity=".85" />
        <circle cx="100" cy="186" r="2.4" fill="#fff" opacity=".85" />
        {e === "automne" && <path d="M78 150 Q100 162 122 150 L124 158 Q100 170 76 158 Z M112 158 L120 186 L110 186 L104 160 Z" fill="#B8471B" />}
        {e === "noel" && <path d="M78 150 Q100 162 122 150 L124 158 Q100 170 76 158 Z" fill="#fff" />}

        {/* le bras droit : il salue */}
        <g transform={salue ? "rotate(-150 130 160)" : "rotate(-16 130 160)"}>
          <g className="m-agite">
            <rect x="123" y="156" width="15" height="34" rx="7.5" fill={`url(#${id("chemise")})`} />
            <circle cx="130.5" cy="192" r="7.5" fill={`url(#${id("peau")})`} />
          </g>
        </g>

        {/* la tête : elle dodeline */}
        <g className="m-tete">
          {e === "paques" && (
            <g>
              <ellipse cx="74" cy="22" rx="11" ry="32" fill="#fff" transform="rotate(-14 74 22)" />
              <ellipse cx="74" cy="24" rx="5" ry="22" fill="#FFB6C8" transform="rotate(-14 74 24)" />
              <ellipse cx="126" cy="22" rx="11" ry="32" fill="#fff" transform="rotate(14 126 22)" />
              <ellipse cx="126" cy="24" rx="5" ry="22" fill="#FFB6C8" transform="rotate(14 126 24)" />
            </g>
          )}
          <rect x="92" y="136" width="16" height="18" rx="7" fill="#EBA886" />
          <ellipse cx="37" cy="98" rx="9" ry="12" fill={`url(#${id("peau")})`} />
          <ellipse cx="163" cy="98" rx="9" ry="12" fill={`url(#${id("peau")})`} />
          <ellipse cx="100" cy="90" rx="64" ry="58" fill={`url(#${id("peau")})`} />
          {/* ses cheveux, et sa mèche en ressort */}
          <path d="M37 88 C38 42 68 28 100 28 C132 28 162 42 163 88 C152 70 138 62 124 66 C114 56 88 56 78 66 C64 60 48 70 37 88 Z" fill={`url(#${id("cheveux")})`} />
          <path className="m-meche" d="M100 31 c-9 -5 -4 -19 5 -15 c9 4 3 17 -6 13 c-8 -4 -3 -16 6 -12" stroke="#4A2A1B" strokeWidth="5" fill="none" strokeLinecap="round" />

          {/* les yeux */}
          {(humeur === "clin" ? [76] : [76, 124]).map((x) => (
            <g key={x} className="m-oeil">
              <ellipse cx={x} cy="98" rx="13" ry="15" fill="#fff" />
              <circle cx={x + 1} cy="100" r="8" fill="#2E1B12" />
              <circle cx={x + 4.5} cy="95.5" r="3" fill="#fff" />
              <circle cx={x - 2.5} cy="104" r="1.4" fill="#fff" opacity=".8" />
            </g>
          ))}
          {humeur === "clin" && <path d="M112 100 Q124 91 136 100" stroke="#2E1B12" strokeWidth="4" fill="none" strokeLinecap="round" />}
          <g className="m-sourcils" transform={humeur === "surpris" ? "translate(0 -6)" : undefined}>
            <path d="M63 77 Q76 70 89 77" stroke="#4A2A1B" strokeWidth="3.6" fill="none" strokeLinecap="round" />
            <path d="M111 77 Q124 70 137 77" stroke="#4A2A1B" strokeWidth="3.6" fill="none" strokeLinecap="round" />
          </g>
          <ellipse cx="63" cy="121" rx="10" ry="6" fill="#FF8FA8" opacity=".5" />
          <ellipse cx="137" cy="121" rx="10" ry="6" fill="#FF8FA8" opacity=".5" />
          <ellipse cx="100" cy="111" rx="4.5" ry="3.2" fill="#E59A7A" opacity=".75" />
          {/* la bouche : fermée (un sourire), ouverte quand elle parle */}
          {humeur === "surpris" ? (
            <ellipse cx="100" cy="128" rx="7" ry="8" fill="#7A1F2B" />
          ) : (
            <>
              <path className="m-bouche-f" d="M86 124 Q100 137 114 124" stroke="#6A2A1C" strokeWidth="4" fill="none" strokeLinecap="round" />
              <g className="m-bouche-o">
                <path d="M85 122 Q100 148 115 122 Q100 128 85 122 Z" fill="#7A1F2B" />
                <ellipse cx="100" cy="136" rx="7" ry="3.6" fill="#FF7D8E" />
              </g>
            </>
          )}

          {/* sa tenue de l'édition */}
          {e === "galette" && (
            <g>
              <path d="M62 44 L69 16 L84 34 L100 8 L116 34 L131 16 L138 44 Z" fill={`url(#${id("dore")})`} stroke="#B07612" strokeWidth="2" strokeLinejoin="round" />
              <circle cx="100" cy="30" r="4" fill="#E5323B" />
              <circle cx="80" cy="38" r="3" fill="#3B6FD8" />
              <circle cx="120" cy="38" r="3" fill="#3B9B5A" />
            </g>
          )}
          {e === "saint-valentin" && <path d="M100 22 C92 10 76 18 84 30 L100 44 L116 30 C124 18 108 10 100 22 Z" fill="#FF3B6B" stroke="#C81E4C" strokeWidth="1.5" />}
          {e === "printemps" &&
            [
              [48, 64],
              [68, 44],
              [100, 36],
              [132, 44],
              [152, 64],
            ].map(([x, y], k) => (
              <g key={k}>
                {[0, 72, 144, 216, 288].map((a) => (
                  <circle key={a} cx={x + 6 * Math.cos((a * Math.PI) / 180)} cy={y + 6 * Math.sin((a * Math.PI) / 180)} r="4.6" fill={k % 2 ? "#FFB8D6" : "#fff"} />
                ))}
                <circle cx={x} cy={y} r="3.4" fill="#FFD23F" />
              </g>
            ))}
          {e === "musique" && (
            <g>
              <path d="M36 92 C36 26 164 26 164 92" stroke="#2B2B3A" strokeWidth="8" fill="none" strokeLinecap="round" />
              <rect x="24" y="80" width="18" height="30" rx="8" fill="#B98CFF" stroke="#2B2B3A" strokeWidth="3" />
              <rect x="158" y="80" width="18" height="30" rx="8" fill="#B98CFF" stroke="#2B2B3A" strokeWidth="3" />
            </g>
          )}
          {lunettes && (
            <g>
              <rect x="58" y="86" width="36" height="24" rx="10" fill="#1E1E2A" />
              <rect x="106" y="86" width="36" height="24" rx="10" fill="#1E1E2A" />
              <path d="M94 96 L106 96" stroke="#1E1E2A" strokeWidth="4" />
              <path d="M64 92 L74 92" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".6" />
              <path d="M112 92 L122 92" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".6" />
            </g>
          )}
          {e === "vacances" && (
            <g>
              <path d="M58 52 C58 12 142 12 142 52 Z" fill="#F5DC9A" />
              <path d="M60 42 L140 42 L141 50 L59 50 Z" fill="#FF6B6B" />
              <ellipse cx="100" cy="52" rx="84" ry="13" fill="#F2D28B" stroke="#D7AE5A" strokeWidth="2" />
            </g>
          )}
          {e === "rentree" && (
            <g transform="rotate(-30 156 70)">
              <rect x="148" y="40" width="9" height="46" rx="2" fill="#FFC93C" />
              <rect x="148" y="40" width="9" height="8" rx="2" fill="#FF8FB8" />
              <path d="M148 86 L152.5 96 L157 86 Z" fill="#F1D3A8" />
            </g>
          )}
          {e === "halloween" && (
            <g>
              <ellipse cx="100" cy="46" rx="72" ry="12" fill="#3A1F4A" />
              <path d="M64 46 L104 -14 Q112 -6 118 -2 L136 46 Z" fill="#4B2A60" />
              <path d="M66 38 L134 38 L136 46 L64 46 Z" fill="#FF8A1F" />
            </g>
          )}
          {e === "automne" && (
            <g>
              <path d="M36 72 C38 22 162 22 164 72 Z" fill="#E8742A" />
              {[54, 72, 90, 108, 126, 144].map((x) => (
                <path key={x} d={`M${x} 34 L${x} 70`} stroke="#C95D1C" strokeWidth="2" opacity=".5" />
              ))}
              <rect x="32" y="60" width="136" height="16" rx="8" fill="#C95D1C" />
              <circle cx="100" cy="20" r="11" fill="#F6B26B" />
            </g>
          )}
          {e === "noel" && (
            <g>
              <path d="M44 62 Q76 2 140 26 Q166 40 172 74 L156 70 Q150 50 136 46 L156 62 Z" fill="#E5323B" />
              <rect x="38" y="54" width="124" height="17" rx="8.5" fill="#fff" />
              <circle cx="168" cy="76" r="10" fill="#fff" />
            </g>
          )}
        </g>
      </g>

      {/* ce qui flotte autour */}
      {(rare || or) && (
        <g className="m-scintille" fill={or ? "#FFE58A" : "#C9B6FF"}>
          <path d="M28 46 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 Z" />
          <path d="M170 30 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 Z" />
          <path d="M176 140 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 Z" />
        </g>
      )}
      {e === "saint-valentin" && !fixe && (
        <g className="m-scintille" fill="#FF6B9A">
          <path d="M30 60 c-4 -6 -12 -2 -8 4 l8 8 l8 -8 c4 -6 -4 -10 -8 -4 Z" />
          <path d="M170 110 c-3 -5 -10 -2 -7 3 l7 7 l7 -7 c3 -5 -4 -8 -7 -3 Z" />
        </g>
      )}
      {e === "musique" && !fixe && (
        <g className="m-scintille" fill="#B98CFF">
          <path d="M168 40 v22 a6 5 0 1 1 -3 -4 v-14 l12 -3 v14 a6 5 0 1 1 -3 -4 v-10 Z" />
        </g>
      )}
    </svg>
  );
}

/** La figurine d'un commerce : la vraie s'il en a une ; sinon Clik, dans la tenue de l'édition (plus de fantôme). */
export function FigurineOuClik({ src, edition, className, fixe, or, rare, ombre }: { src?: string | null; edition?: string | null; className?: string; fixe?: boolean; or?: boolean; rare?: boolean; ombre?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element
  if (src && !src.startsWith("/direct/double/")) return <img className={className} src={src} alt="" draggable={false} loading="lazy" />;
  return <Mascotte className={className} edition={edition} fixe={fixe} or={or} rare={rare} ombre={ombre} />;
}

/**
 * 💬 CLIK EXPLIQUE — une bulle après l'autre, tapées comme un message (sa bouche bouge pendant qu'il « parle ») ;
 * un toucher passe à la suite. Dessous, ce qu'il propose de faire (`children`), tout de suite. Revenu sur la page, on ne réécoute
 * pas tout : la dernière bulle, et « ↺ Réécouter Clik » (`cle` : ce qu'on retient sur l'appareil).
 */
export function MascotteDit({
  repliques,
  edition,
  cle,
  salue = true,
  children,
  className,
}: {
  repliques: string[];
  edition?: string | null;
  cle?: string;
  salue?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  // DÉJÀ ÉCOUTÉ ? la dernière bulle, tout de suite. (Clik n'apparaît qu'une fois la page chargée dans le navigateur :
  // on lit ce qu'on a retenu dès le départ.)
  const [deja] = useState(() => {
    try {
      return Boolean(cle && typeof window !== "undefined" && window.localStorage.getItem(`clikme-clik-${cle}`));
    } catch {
      return false;
    }
  });
  const [reduit] = useState(() => typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches));
  const [i, setI] = useState(deja ? repliques.length - 1 : 0);
  const [n, setN] = useState(deja ? Number.MAX_SAFE_INTEGER : 0);
  const texte = repliques[i] ?? "";
  const vu = reduit ? texte.length : n;
  const parle = vu < texte.length;

  // la bulle se tape, lettre après lettre
  useEffect(() => {
    if (reduit || n >= texte.length) return;
    const t = window.setTimeout(() => setN((x) => Math.min(texte.length, x + 2)), 24);
    return () => window.clearTimeout(t);
  }, [n, texte.length, reduit]);
  const fin = i === repliques.length - 1 && !parle;
  useEffect(() => {
    if (!fin || !cle) return;
    try {
      window.localStorage.setItem(`clikme-clik-${cle}`, "1");
    } catch {
      /* rien */
    }
  }, [fin, cle]);

  const suite = () => {
    if (parle) return setN(texte.length);
    if (i < repliques.length - 1) {
      setI(i + 1);
      setN(0);
    }
  };
  return (
    <div className={`mqd${className ? ` ${className}` : ""}`}>
      <button type="button" className="mqd-clik" onClick={suite} aria-label="Clik, la mascotte">
        <Mascotte edition={edition} parle={parle} salue={salue && i === 0} />
      </button>
      <div className="mqd-droite">
        <button type="button" className="mqd-bulle" onClick={suite} aria-live="polite">
          <span className="mqd-nom">Clik</span>
          <span className="mqd-texte">
            {texte.slice(0, vu)}
            {parle && <i className="mqd-curseur" aria-hidden="true" />}
          </span>
          {!fin && (
            <span className="mqd-suite">
              {repliques.map((_, k) => (
                <i key={k} className={k <= i ? "vu" : ""} />
              ))}
              <b>{parle ? "…" : "Suite ›"}</b>
            </span>
          )}
        </button>
        {/* ce qu'il propose de faire : tout de suite (on n'attend pas la fin de ses bulles pour agir) */}
        {(children || (fin && repliques.length > 1)) && (
          <div className="mqd-fin">
            {children}
            {fin && repliques.length > 1 && (
              <button
                type="button"
                className="mqd-rejouer"
                onClick={() => {
                  setI(0);
                  setN(0);
                }}
              >
                ↺ Réécouter Clik
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const STYLES_MASCOTTE = `
.mq{display:block;width:100%;height:auto;overflow:visible}
.mq .m-haut,.mq .m-ressort,.mq .m-tete,.mq .m-agite{transform-box:view-box}
.mq .m-haut{transform-origin:100px 246px;animation:mq-bond 2.4s ease-in-out infinite}
.mq .m-ressort{transform-origin:100px 249px;animation:mq-ressort 2.4s ease-in-out infinite}
.mq .m-tete{transform-origin:100px 148px;animation:mq-dodeline 3.4s ease-in-out infinite}
.mq .m-oeil{transform-box:fill-box;transform-origin:center;animation:mq-cligne 4.6s infinite}
.mq.salue .m-agite{transform-origin:130px 160px;animation:mq-salut .55s ease-in-out infinite alternate}
.mq .m-bouche-o{opacity:0}
.mq.parle .m-bouche-o{animation:mq-bouche .26s steps(1) infinite}
.mq.parle .m-bouche-f{animation:mq-bouche .26s steps(1) infinite reverse}
.mq .m-scintille{animation:mq-scintille 1.8s ease-in-out infinite}
.mq.or{filter:sepia(1) saturate(3.4) hue-rotate(-12deg) brightness(1.05) drop-shadow(0 0 10px rgba(255,214,120,.55))}
.mq.ombre{filter:brightness(0);opacity:.5}
.mq.fixe *{animation:none!important}
@keyframes mq-bond{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes mq-ressort{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.16)}}
@keyframes mq-dodeline{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
@keyframes mq-cligne{0%,94%,100%{transform:scaleY(1)}96%{transform:scaleY(.08)}}
@keyframes mq-salut{from{transform:rotate(-12deg)}to{transform:rotate(14deg)}}
@keyframes mq-bouche{0%{opacity:1}50%{opacity:0}}
@keyframes mq-scintille{0%,100%{opacity:.35;transform:scale(.9)}50%{opacity:1;transform:scale(1.05)}}
/* Clik qui explique */
.mqd{display:grid;grid-template-columns:104px minmax(0,1fr);align-items:end;gap:6px}
.mqd-clik{display:block;padding:0;border:0;background:none;cursor:pointer;filter:drop-shadow(0 12px 14px rgba(0,0,0,.45))}
.mqd-droite{display:flex;flex-direction:column;gap:10px;min-width:0}
.mqd-bulle{position:relative;display:flex;flex-direction:column;gap:6px;width:100%;min-height:86px;padding:12px 14px 10px;border:0;border-radius:20px 20px 20px 6px;background:#FFF4E6;color:#2A0F1F;font:inherit;text-align:left;cursor:pointer;box-shadow:0 14px 30px -14px rgba(0,0,0,.8);animation:mqd-entre .35s cubic-bezier(.2,1.4,.4,1)}
.mqd-bulle::before{content:"";position:absolute;left:-7px;bottom:12px;width:16px;height:16px;background:#FFF4E6;transform:rotate(45deg);border-radius:3px}
.mqd-nom{font-size:11px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#FF2E9A}
.mqd-texte{font-size:15.5px;line-height:1.38;font-weight:700}
.mqd-curseur{display:inline-block;width:2px;height:1em;margin-left:2px;vertical-align:-2px;background:#FF2E9A;animation:mqd-curseur .6s steps(1) infinite}
.mqd-suite{display:flex;align-items:center;gap:4px}
.mqd-suite i{width:6px;height:6px;border-radius:50%;background:#E8C9D6}
.mqd-suite i.vu{background:#FF2E9A}
.mqd-suite b{margin-left:auto;font-size:12.5px;font-weight:900;color:#C2187A}
.mqd-fin{display:flex;flex-direction:column;gap:8px;animation:mqd-entre .4s cubic-bezier(.2,1.4,.4,1)}
.mqd-rejouer{align-self:flex-start;border:0;background:none;color:#A88E99;font:inherit;font-size:12.5px;text-decoration:underline;cursor:pointer}
@keyframes mqd-entre{from{opacity:0;transform:translateY(8px) scale(.97)}}
@keyframes mqd-curseur{50%{opacity:0}}
@media (min-width:860px){.mqd{grid-template-columns:150px minmax(0,1fr);gap:12px}.mqd-texte{font-size:17px}}
@media (prefers-reduced-motion:reduce){.mq *,.mqd *{animation:none!important}}
`;
