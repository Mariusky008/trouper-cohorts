"use client";

// ✅ « C'EST FAIT » — le Fantôme accompagne jusqu'à l'action réelle.
//
// « Il ne doit pas seulement aider à choisir : il accompagne l'utilisateur
// jusqu'à l'action réelle auprès du commerçant. » ClikMe découvre → aide à
// choisir → agit. La vidéo se joue une fois, à la place de la carte d'action,
// là où l'on était — pas sur une nouvelle page.
//
// ═══ LA RÈGLE : JAMAIS AVANT QUE LA DEMANDE SOIT PARTIE ═══════════════════
//
// « Ne jamais montrer "C'est fait" avant d'avoir reçu la confirmation que la
// demande est partie. Le Fantôme ne doit jamais prétendre avoir fait quelque
// chose qui n'a pas réellement été transmis. »
//
// AUJOURD'HUI, TOUTES LES DEMANDES PARTENT PAR WHATSAPP (voir `prevenir.ts`) :
// l'application ouvre le message déjà écrit, mais ne voit pas le bouton
// « Envoyer ». La seule confirmation possible est donc celle de la personne
// (« C'est envoyé », « Je l'ai prévenu ») — c'est après elle, et seulement
// chez un vrai commerce (jamais sur un numéro de fiction), que la vidéo vient.
// Et les mots s'en tiennent à ce qu'on sait : « Vous avez prévenu Lili Ross
// by me. » — « techniquement, la seule chose certaine est que l'utilisateur
// nous a confirmé l'avoir envoyée » (`voie: "whatsapp"`). « La boutique a
// reçu votre demande » est réservé au jour où un envoi passera par notre
// serveur et reviendra confirmé (`voie: "serveur"`).
//
// LE SUCCÈS OU L'ÉCHEC, JAMAIS LES DEUX : « Ils ne doivent jamais pouvoir
// apparaître simultanément. » Un seul composant, une seule place : avec
// `echec`, il dit « Je n'ai pas réussi à envoyer votre demande. Réessayer → »
// — sans la vidéo ; sans `echec`, il joue « C'est fait ». Il n'existe pas
// d'écran d'échec à poser à côté.

import { VideoFantome } from "./video-fantome";

/** Ce qui a été demandé : les mots changent avec le métier. */
export type GenreFait = "mise-de-cote" | "reservation" | "demande" | "sortie";

/** Le genre de la demande, d'après la famille du commerce (`familleDuDouble`) ou sa branche. */
export function genreDuFait(famille?: string | null): GenreFait {
  const f = famille ?? "";
  if (/^(mode|librairie|createur|fleurs)$/.test(f) || /mode|friperie|librair|fleur/.test(f)) return "mise-de-cote";
  if (/^(table|restaurant|boulangerie|traiteur)$/.test(f)) return "reservation";
  if (/^(bar|sortie|evenement)$/.test(f)) return "sortie";
  return "demande";
}

/** Ce qu'on sait quand la personne l'a envoyé elle-même : elle l'a prévenu. */
const PREVENU = (lieu?: string) => `Vous avez prévenu ${lieu || "le commerce"}.`;
/** Le nom court de l'action, pour le rappel de l'échec : « Mise de côté · Lili Ross by me ». */
const ACTION: Record<GenreFait, string> = {
  "mise-de-cote": "Mise de côté",
  reservation: "Réservation",
  demande: "Demande",
  sortie: "Sortie",
};

/** Ce qu'on saura quand le serveur aura confirmé la réception. */
const RECU: Record<GenreFait, string> = {
  "mise-de-cote": "La boutique a reçu votre demande de mise de côté.",
  reservation: "Le restaurant a reçu votre demande de réservation.",
  demande: "Le salon a reçu votre demande.",
  sortie: "Votre demande est partie.",
};

export function CestFait({
  genre,
  lieu,
  voie = "whatsapp",
  continuer = "Continuer →",
  onContinuer,
  onPartager,
  echec,
  photo,
  classe,
}: {
  genre: GenreFait;
  /** Le nom du commerce, quand on le connaît. */
  lieu?: string;
  /** D'où vient la confirmation — voir plus haut. */
  voie?: "whatsapp" | "serveur";
  /** « Voir ma demande → » ou « Continuer → ». */
  continuer?: string;
  onContinuer: () => void;
  /** « Partager dans mon salon → », quand il y a un salon où le dire. */
  onPartager?: () => void;
  /** L'ENVOI A ÉCHOUÉ (un envoi par le serveur qui revient en erreur) : l'échec À LA PLACE du succès. */
  echec?: { onReessayer: () => void };
  /** La photo de ce qu'on demandait (la pièce, le plat) : le rappel de l'échec la montre. */
  photo?: string;
  classe?: string;
}) {
  if (echec) {
    return (
      <section className={`cf cf-rate${classe ? ` ${classe}` : ""}`} role="alert">
        <p className="cf-rate-t">Je n’ai pas réussi à envoyer votre demande.</p>
        {/* LE RAPPEL DE CE QUI N'EST PAS PARTI : « énormément de vide, aucun
            rappel de ce qu'on essayait d'envoyer » donnait l'impression d'une
            page cassée. L'action et le commerce, en une petite carte. */}
        <div className="cf-rappel">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" />
          ) : null}
          <span>
            <b>👻 Ça n’est pas parti.</b>
            <em>
              {ACTION[genre]}
              {lieu ? ` · ${lieu}` : ""}
            </em>
          </span>
        </div>
        <button type="button" className="cf-cta" onClick={echec.onReessayer}>
          Réessayer →
        </button>
        <StylesCestFait />
      </section>
    );
  }
  const texte = voie === "serveur" ? RECU[genre] : PREVENU(lieu);
  return (
    <section className={`cf${classe ? ` ${classe}` : ""}`} role="status" aria-live="polite">
      <VideoFantome
        nom="fait"
        classe="cf-video"
        legendes={[
          {
            a: 0.6,
            texte: (
              <>
                <b className="cf-t">👻 C’est fait&nbsp;!</b>
                <span className="cf-s">{texte}</span>
              </>
            ),
          },
        ]}
      />
      <div className="cf-actions">
        <button type="button" className="cf-cta" onClick={onContinuer}>
          {continuer}
        </button>
        {onPartager && (
          <button type="button" className="cf-lien" onClick={onPartager}>
            Partager dans mon salon →
          </button>
        )}
      </div>
      <StylesCestFait />
    </section>
  );
}

function StylesCestFait() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.cf{display:block;}
.cf-video{width:100%;aspect-ratio:720 / 914;max-height:min(50vh,420px);border-radius:22px;}
.cf-video .vf-media{object-position:50% 30%;}
.cf-video .vf-legende{text-align:center;}
.cf-t{display:block;font-size:22px;line-height:1.15;font-weight:950;color:#FFF4E6;}
.cf-s{display:block;margin-top:5px;font-size:14px;line-height:1.35;font-weight:700;color:#F3D9B5;}
.cf-actions{display:flex;flex-direction:column;align-items:center;gap:6px;margin-top:12px;}
.cf-cta{display:block;width:100%;padding:13px 18px;border:0;border-radius:999px;cursor:pointer;font:inherit;font-size:15.5px;font-weight:900;
  color:#2A1708;background:linear-gradient(180deg,#FFC867,#F5A23A);box-shadow:0 10px 24px rgba(245,162,58,.28);}
.cf-lien{padding:6px 10px;border:0;background:none;cursor:pointer;font:inherit;font-size:13.5px;font-weight:800;color:#F6B54B;
  text-decoration:underline;text-underline-offset:3px;}
.cf-rate{padding:16px;border-radius:20px;background:rgba(255,155,138,.08);border:1px solid rgba(255,155,138,.3);}
.cf-rate-t{margin:0 0 12px;font-size:15px;font-weight:800;color:#FFE1DA;text-align:center;}
.cf-rappel{display:flex;align-items:center;gap:12px;margin:0 0 14px;padding:12px 14px;border-radius:16px;
  background:rgba(255,244,230,.06);border:1px solid rgba(255,244,230,.12);}
.cf-rappel img{flex:none;width:52px;height:52px;border-radius:12px;object-fit:cover;}
.cf-rappel span{min-width:0;display:flex;flex-direction:column;gap:3px;}
.cf-rappel b{font-size:15px;font-weight:900;color:#FFF4E6;}
.cf-rappel em{font-style:normal;font-size:13.5px;font-weight:700;color:#E9D7C2;}
`,
      }}
    />
  );
}
