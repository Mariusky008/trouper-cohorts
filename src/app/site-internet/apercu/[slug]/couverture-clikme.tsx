"use client";

// 📸 SA PHOTO CLIKME, CÔTÉ COMMERÇANT — la voir se faire, la choisir, la refuser.
//
// « Pour chaque inscription, on aurait pendant la création du site une étape
// qui consisterait à choisir la photo la plus appropriée. »
//
// DEUX MORCEAUX, PARCE QUE LA PAGE A ONGLETS NE MONTRE LE PIED QU'AUX INFOS :
//   · `VeilleCouverture` est posée sur toute la page. Elle lance le rendu s'il
//     n'a jamais été fait (les pages créées avant cette étape), suit son état,
//     et recharge la page quand la photo est prête — la façade change sous ses
//     yeux, pendant que la voix lui présente son site. Un bandeau discret dit
//     ce qui se passe ; rien ne bloque.
//   · `ChoixCouverture` est le panneau, au bout des infos : la photo faite, et
//     trois gestes — partir d'une autre de ses photos, refaire, ou garder sa
//     photo d'origine. C'est lui qui décide ; la photo ClikMe est une
//     proposition, pas une obligation.
//
// LE CLIENT NE VOIT NI L'UN NI L'AUTRE : la page ne les rend qu'au commerçant.
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Etat = {
  etat: "en_cours" | "prete" | "echec" | "originale";
  url?: string;
  source?: string;
  essais: number;
  erreur?: string;
} | null;

/** Le suivi partagé : l'état, et de quoi le changer. */
function useCouverture(slug: string, initial: Etat) {
  const router = useRouter();
  const [etat, setEtat] = useState<Etat>(initial);
  const [essaisMax, setEssaisMax] = useState(4);
  const [dit, setDit] = useState("");
  const [occupe, setOccupe] = useState(false);

  useEffect(() => setEtat(initial), [initial]);

  /* PENDANT LE RENDU, ON DEMANDE TOUTES LES CINQ SECONDES. Quand il change
     d'état, la page se recharge côté serveur : la nouvelle photo y entre sans
     perdre l'onglet ouvert ni la voix en cours. */
  useEffect(() => {
    if (etat?.etat !== "en_cours") return;
    const t = window.setInterval(async () => {
      try {
        const r = await fetch(`/api/site-internet/couverture?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
        const j = (await r.json()) as { etat: Etat; essaisMax?: number };
        if (j.essaisMax) setEssaisMax(j.essaisMax);
        if (j.etat && j.etat.etat !== "en_cours") {
          setEtat(j.etat);
          router.refresh();
        }
      } catch {
        /* réseau coupé : on redemandera au tour suivant */
      }
    }, 5000);
    return () => window.clearInterval(t);
  }, [etat?.etat, slug, router]);

  const demander = useCallback(
    async (corps: Record<string, unknown>) => {
      setOccupe(true);
      setDit("");
      try {
        const r = await fetch("/api/site-internet/couverture", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slug, ...corps }),
        });
        const j = (await r.json()) as { etat: Etat; raison?: string; essaisMax?: number };
        if (j.essaisMax) setEssaisMax(j.essaisMax);
        if (j.etat) setEtat(j.etat);
        if (j.raison && j.raison !== "déjà en cours") setDit(j.raison);
        // LA PAGE SE RELIT DANS TOUS LES CAS : la veille, posée ailleurs sur la
        // page, apprend ainsi qu'un rendu vient de partir.
        router.refresh();
      } catch {
        setDit("La demande n'est pas partie. Réessayez dans un instant.");
      } finally {
        setOccupe(false);
      }
    },
    [slug, router],
  );

  return { etat, essaisMax, dit, occupe, demander };
}

/**
 * LA VEILLE : lance une fois, suit, prévient. Elle ne lance QUE si rien n'a
 * jamais été tenté — un échec ou un refus ne se relance pas tout seul.
 */
export function VeilleCouverture({ slug, initial, aDesPhotos }: { slug: string; initial: Etat; aDesPhotos: boolean }) {
  const { etat, demander } = useCouverture(slug, initial);
  const lance = useRef(false);
  const [prete, setPrete] = useState(false);
  const etaitEnCours = useRef(initial?.etat === "en_cours");

  useEffect(() => {
    if (lance.current || initial || !aDesPhotos) return;
    lance.current = true;
    void demander({});
  }, [initial, aDesPhotos, demander]);

  useEffect(() => {
    if (etat?.etat === "en_cours") etaitEnCours.current = true;
    else if (etaitEnCours.current && etat?.etat === "prete") {
      etaitEnCours.current = false;
      setPrete(true);
      const t = window.setTimeout(() => setPrete(false), 5000);
      return () => window.clearTimeout(t);
    }
  }, [etat?.etat]);

  if (etat?.etat !== "en_cours" && !prete) return null;
  return (
    <>
      <style>{STYLE_VEILLE}</style>
      <div className="ccl-veille" role="status">
        {prete ? "✨ Votre photo ClikMe est prête" : "✨ Votre photo ClikMe se prépare…"}
      </div>
    </>
  );
}

/** LE PANNEAU, au bout des infos. */
export function ChoixCouverture({
  slug,
  initial,
  candidates,
}: {
  slug: string;
  initial: Etat;
  /** Ses photos, prêtes à afficher (dans l'ordre que le serveur numérote). */
  candidates: string[];
}) {
  const { etat, essaisMax, dit, occupe, demander } = useCouverture(slug, initial);
  const [choisir, setChoisir] = useState(false);
  const reste = Math.max(0, essaisMax - (etat?.essais ?? 0));
  const enCours = etat?.etat === "en_cours";

  return (
    <section className="ccl" aria-label="Votre photo ClikMe">
      <style>{STYLE_PANNEAU}</style>
      <p className="ccl-sur">Votre photo ClikMe</p>
      <h2>Votre devanture, dans l&apos;univers ClikMe.</h2>
      <p className="ccl-dit">
        On part d&apos;une photo de votre commerce et on la passe à la lumière ClikMe, avec nos fantômes
        dedans. Elle ouvre votre page ; vos vraies photos y restent, à côté.
      </p>

      {!candidates.length ? (
        <p className="ccl-note">
          Votre fiche n&apos;a pas encore de photo. Déposez celle de votre devanture dans votre Espace Pro :
          elle deviendra votre photo ClikMe.
        </p>
      ) : (
        <>
          <div className="ccl-vue">
            {etat?.url && etat.etat !== "originale" ? (
              <img src={etat.url} alt="Votre photo ClikMe" />
            ) : (
              <div className="ccl-vide">
                {enCours
                  ? "Elle se prépare… de vingt secondes à une minute."
                  : etat?.etat === "originale"
                    ? "Vous gardez votre photo d'origine."
                    : etat?.etat === "echec"
                      ? "Elle n'a pas pu être faite cette fois-ci."
                      : "Pas encore faite."}
              </div>
            )}
            {enCours && <span className="ccl-tourne" aria-hidden="true" />}
          </div>

          <div className="ccl-gestes">
            {etat?.etat === "originale" && etat.url ? (
              <button type="button" disabled={occupe} onClick={() => demander({ reprendre: true })}>
                Reprendre la photo ClikMe
              </button>
            ) : (
              <button
                type="button"
                disabled={occupe || enCours || reste === 0}
                onClick={() => demander(etat ? { refaire: true } : {})}
              >
                {etat ? "Refaire" : "Créer ma photo ClikMe"}
              </button>
            )}
            <button type="button" disabled={occupe || enCours || reste === 0} onClick={() => setChoisir((x) => !x)}>
              Partir d&apos;une autre photo
            </button>
            {etat?.url && etat.etat !== "originale" && (
              <button type="button" className="sobre" disabled={occupe || enCours} onClick={() => demander({ originale: true })}>
                Garder ma photo d&apos;origine
              </button>
            )}
          </div>

          {choisir && (
            <div className="ccl-choix">
              {candidates.slice(0, 8).map((src, i) => (
                <button
                  key={src.slice(0, 80) + i}
                  type="button"
                  disabled={occupe || enCours}
                  onClick={() => {
                    setChoisir(false);
                    void demander({ source: i });
                  }}
                  aria-label={`Partir de la photo ${i + 1}`}
                >
                  <img src={src} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
          <p className="ccl-note">
            {reste > 0
              ? `Encore ${reste} rendu${reste > 1 ? "s" : ""} possible${reste > 1 ? "s" : ""}.`
              : "Vous avez utilisé tous les rendus : écrivez-nous pour en refaire une."}
            {dit ? ` ${dit}` : ""}
          </p>
        </>
      )}
    </section>
  );
}

const STYLE_VEILLE = `
.ccl-veille{position:fixed;z-index:60;left:50%;transform:translateX(-50%);
  top:calc(58px + env(safe-area-inset-top,0px));padding:8px 14px;border-radius:999px;
  font:600 13px/1.2 system-ui,sans-serif;color:#1A0F08;white-space:nowrap;
  background:linear-gradient(140deg,#FFD38A,#F5A23A);
  box-shadow:0 10px 26px -10px rgba(245,162,58,.9);animation:cclVient .4s ease both;}
@keyframes cclVient{from{opacity:0;transform:translate(-50%,-8px);}to{opacity:1;transform:translate(-50%,0);}}
@media (prefers-reduced-motion: reduce){.ccl-veille{animation:none;}}
`;

const STYLE_PANNEAU = `
.ccl{margin:22px 0 0;padding:18px;border-radius:22px;color:#FFF4E6;
  background:#1C1411;border:1px solid rgba(245,162,58,.28);font-family:inherit;}
.ccl-sur{margin:0 0 4px;font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:#F5A23A;}
.ccl h2{margin:0 0 6px;font-size:20px;line-height:1.2;font-weight:800;letter-spacing:-.01em;}
.ccl-dit{margin:0 0 14px;font-size:14px;line-height:1.45;color:#CDB8A4;}
.ccl-vue{position:relative;border-radius:16px;overflow:hidden;aspect-ratio:4 / 5;max-height:420px;
  margin:0 auto;background:#120C09;border:1px solid rgba(255,196,140,.14);}
.ccl-vue img{display:block;width:100%;height:100%;object-fit:cover;}
.ccl-vide{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  padding:20px;text-align:center;font-size:14px;color:#CDB8A4;}
.ccl-tourne{position:absolute;right:12px;top:12px;width:22px;height:22px;border-radius:50%;
  border:3px solid rgba(245,162,58,.3);border-top-color:#F5A23A;animation:cclTourne 1s linear infinite;}
@keyframes cclTourne{to{transform:rotate(360deg);}}
.ccl-gestes{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}
.ccl-gestes button{flex:1 1 auto;padding:11px 14px;border-radius:999px;cursor:pointer;
  font:inherit;font-size:14px;font-weight:700;color:#1A0F08;border:0;
  background:linear-gradient(140deg,#FFC66B,#F5A23A);}
.ccl-gestes button.sobre{color:#FFF4E6;background:none;border:1px solid rgba(255,244,230,.25);}
.ccl-gestes button:disabled{opacity:.45;cursor:default;}
.ccl-choix{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px;}
.ccl-choix button{padding:0;border:0;border-radius:10px;overflow:hidden;aspect-ratio:1;cursor:pointer;
  background:#120C09;}
.ccl-choix img{display:block;width:100%;height:100%;object-fit:cover;}
.ccl-note{margin:10px 0 0;font-size:12.5px;color:#CDB8A4;}
`;
