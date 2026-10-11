"use client";

// 🎬 MA CUISINE ET MON MIROIR — le Fantôme montre le geste, dans la pièce même.
//
// « Pas de popup vidéo. Elles doivent toutes apparaître à l'endroit exact où
// l'action ou l'état existe déjà. Ça donne l'impression que le Fantôme vit
// réellement dans ClikMe. » Comme Mes Sorties : la vidéo en haut de la pièce,
// sous son titre, une seule lecture, la dernière image reste — voir
// `VideoFantome`. Les mots sont en HTML, sous la vidéo.
//
//   · MA CUISINE — « Ma Cuisine ne demande pas de remplir un long
//     questionnaire. » La vidéo tant que la pièce n'a presque aucun signal
//     (moins de `CUISINE_SIGNAUX` gestes remarqués), puis une phrase, et
//     « Comment ça marche ? » pour la revoir. Une seule question explicite :
//     « Je ne mange pas de… ».
//   · MON MIROIR — « Gardez une photo de vous ici. » La vidéo tant qu'aucune
//     photo de référence n'est gardée (`miroir-photo.ts`) ; ensuite « Votre
//     Miroir est prêt », et la photo sert aux essais « sur moi ».

import { useRef, useState } from "react";
import { VideoFantome } from "@/components/direct/video-fantome";
import type { ChoixPiece } from "@/lib/direct/maison";
import { garderPhotoMiroir, oublierPhotoMiroir, useMiroir } from "@/lib/direct/miroir-photo";

/** Assez de gestes pour que la cuisine « commence à savoir » : la vidéo ne se lance plus d'elle-même. */
export const CUISINE_SIGNAUX = 3;

// ─── MA CUISINE ────────────────────────────────────────────────────────────

/** La vidéo, ses deux phrases, puis la seule question qui rend service tout de suite. */
export function TutoCuisine({
  choix,
  coches,
  onChoisir,
}: {
  choix?: ChoixPiece;
  coches: Set<string>;
  onChoisir: (cle: string, on: boolean) => void;
}) {
  return (
    <section className="mz-sorties mt-tuto">
      <VideoFantome nom="cuisine" classe="mz-video" />
      {/* COURT, POUR UN TÉLÉPHONE : « Le mot "simplement" n'apporte pas grand-chose. » */}
      <p className="mt-q">👻 Montrez-moi ce qui vous donne envie.</p>
      <p className="mt-s">À midi, je repère les plats du jour pour vous.</p>
      {/* LA SEULE QUESTION EXPLICITE VRAIMENT UTILE — le reste s'apprend en
          vivant : ❤️, « pas vraiment », une réservation, un plat regardé, un
          duel. Rien à remplir. */}
      {choix && (
        <>
          <p className="mz-question mt-question">{choix.titre}</p>
          <div className="mz-puces centre">
            {choix.options.map((o) => {
              const on = coches.has(o.cle);
              return (
                <button key={o.cle} type="button" className={`mz-puce${on ? " on" : ""}`} aria-pressed={on} onClick={() => onChoisir(o.cle, on)}>
                  {on ? "✓ " : ""}
                  {o.mot}
                </button>
              );
            })}
          </div>
        </>
      )}
      <StylesTutos />
    </section>
  );
}

// ─── MON MIROIR ────────────────────────────────────────────────────────────

export function TutoMiroir() {
  const miroir = useMiroir();
  /** « Comment ça marche ? » — revoir la vidéo, même avec une photo gardée. */
  const [revoir, setRevoir] = useState(false);
  const [range, setRange] = useState<"" | "en-cours" | "rate">("");
  const appareil = useRef<HTMLInputElement>(null);
  const album = useRef<HTMLInputElement>(null);

  const garder = async (f?: File) => {
    if (!f) return;
    setRange("en-cours");
    const ok = await garderPhotoMiroir(f);
    setRange(ok ? "" : "rate");
    if (ok) setRevoir(false);
  };
  /* DEUX CHAMPS, DEUX INTENTIONS (voir `mur-contenu.tsx`) : l'appareil photo,
     côté visage, et la photothèque. Un seul menu laissé au téléphone retire
     parfois « Prendre une photo » sans rien dire. */
  const champs = (
    <>
      <input
        ref={appareil}
        type="file"
        accept="image/*"
        capture="user"
        className="mt-fichier"
        onChange={(ev) => {
          void garder(ev.target.files?.[0]);
          ev.target.value = "";
        }}
      />
      <input
        ref={album}
        type="file"
        accept="image/*"
        className="mt-fichier"
        onChange={(ev) => {
          void garder(ev.target.files?.[0]);
          ev.target.value = "";
        }}
      />
    </>
  );
  const prive = (
    <p className="mt-prive">
      <span aria-hidden="true">🔒</span> Votre photo reste privée, sur ce téléphone. Vous décidez quand elle est utilisée.
    </p>
  );
  const rate = range === "rate" && <p className="mt-rate">Je n’ai pas pu garder cette photo. Essayez avec une autre.</p>;

  /* PAS ENCORE LU (le téléphone ouvre son tiroir) : la place, sans rien montrer de faux. */
  if (!miroir.pret) return <div className="mt-attente" aria-hidden="true" />;

  /* ═══ PAS DE PHOTO : LE TUTO ═══ « Si l'utilisateur supprime la photo,
     revenir à l'état initial avec la vidéo tuto. » */
  if (!miroir.photo || revoir) {
    return (
      <section className="mz-sorties mt-tuto">
        {champs}
        <VideoFantome key={revoir ? "revoir" : "tuto"} nom="miroir" classe="mz-video" />
        <p className="mt-q">👻 Gardez une photo de vous ici.</p>
        <p className="mt-s">Je pourrai vous faire essayer ce que vous trouvez dans les commerces de votre ville.</p>
        {miroir.photo ? (
          <button type="button" className="mz-cta large" onClick={() => setRevoir(false)}>
            Retour à mon Miroir
          </button>
        ) : (
          <>
            <button type="button" className="mz-cta large" disabled={range === "en-cours"} onClick={() => appareil.current?.click()}>
              {range === "en-cours" ? "Je la range…" : "📸 Ajouter ma photo"}
            </button>
            <button type="button" className="mt-lien" onClick={() => album.current?.click()}>
              Choisir dans mes photos
            </button>
          </>
        )}
        {rate}
        {prive}
        <StylesTutos />
      </section>
    );
  }

  /* ═══ LA PHOTO EST LÀ : LE MIROIR EST PRÊT ═══ Plus de vidéo d'elle-même. */
  return (
    <section className="mt-pret">
      {champs}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="mt-photo" src={miroir.photo} alt="Ma photo de référence" />
      <div className="mt-pret-t">
        <p className="mt-q gauche">👻 Votre Miroir est prêt.</p>
        <p className="mt-s gauche">Je peux maintenant vous montrer les coupes, lunettes, bijoux ou styles que vous trouvez dans ClikMe.</p>
        <div className="mt-actions">
          <button type="button" className="mt-lien" disabled={range === "en-cours"} onClick={() => appareil.current?.click()}>
            {range === "en-cours" ? "Je la range…" : "Changer de photo"}
          </button>
          <button type="button" className="mt-lien discret" onClick={() => void oublierPhotoMiroir()}>
            Retirer ma photo
          </button>
          <button type="button" className="mt-lien discret" onClick={() => setRevoir(true)}>
            Comment ça marche&nbsp;?
          </button>
        </div>
        {rate}
        {prive}
      </div>
      <StylesTutos />
    </section>
  );
}

/** Dans « Ce que vous m'avez dit » : la photo de référence, gardée ou non. */
export function MiroirDit() {
  const miroir = useMiroir();
  if (!miroir.pret) return null;
  return <p className="mz-note">{miroir.photo ? "Votre photo de référence est gardée ici, sur ce téléphone." : "Pas encore de photo de référence."}</p>;
}

function StylesTutos() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.mt-tuto .mt-q{margin:14px 0 0;text-align:center;font-size:18px;line-height:1.3;font-weight:900;color:#FFF4E6;}
.mt-tuto .mt-s{margin:6px auto 0;max-width:330px;text-align:center;font-size:14.5px;line-height:1.4;color:#E9D7C2;}
.mt-question{margin-top:18px;text-align:center;}
.mt-tuto .mz-cta.large{margin-top:16px;}
.mt-fichier{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;}
.mt-lien{display:block;margin:10px auto 0;padding:4px 8px;border:0;background:none;cursor:pointer;font:inherit;font-size:13.5px;font-weight:800;
  color:#F6B54B;text-decoration:underline;text-underline-offset:3px;}
.mt-lien.discret{color:#CDB8A4;font-weight:700;}
.mt-lien:disabled{opacity:.6;cursor:default;}
.mt-prive{margin:12px auto 0;max-width:330px;text-align:center;font-size:12.5px;line-height:1.4;color:#CDB8A4;}
.mt-rate{margin:10px auto 0;text-align:center;font-size:13px;font-weight:700;color:#FF9B8A;}
.mt-attente{min-height:120px;}
.mt-pret{display:flex;gap:14px;align-items:flex-start;margin:16px 16px 0;padding:14px;border-radius:20px;
  background:rgba(255,244,230,.05);border:1px solid rgba(255,244,230,.1);}
.mt-photo{flex:none;width:92px;height:118px;border-radius:16px;object-fit:cover;object-position:50% 25%;border:2px solid rgba(246,181,75,.55);}
.mt-pret-t{min-width:0;flex:1;}
.mt-q.gauche{margin:2px 0 0;font-size:17px;line-height:1.25;font-weight:900;color:#FFF4E6;}
.mt-s.gauche{margin:6px 0 0;font-size:13.5px;line-height:1.4;color:#E9D7C2;}
.mt-actions{display:flex;flex-wrap:wrap;gap:2px 10px;margin-top:6px;}
.mt-actions .mt-lien{margin:4px 0 0;padding:4px 0;}
.mt-pret .mt-prive{text-align:left;margin:8px 0 0;}
`,
      }}
    />
  );
}
