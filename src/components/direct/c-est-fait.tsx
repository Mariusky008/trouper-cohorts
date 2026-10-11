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
// Et les mots s'en tiennent à ce qu'on sait : la demande EST PARTIE (`voie:
// "whatsapp"`). « La boutique a reçu votre demande » est réservé au jour où
// un envoi passera par notre serveur et reviendra confirmé (`voie: "serveur"`).
//
// L'ÉCHEC A SON ÉCRAN, `EnvoiRate` : « Je n'ai pas réussi à envoyer votre
// demande. Réessayer → » — jamais la vidéo à sa place.

import type { ReactNode } from "react";
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

const chez = (lieu?: string) => (lieu ? ` chez ${lieu}` : "");

/** Ce qu'on sait quand la personne l'a envoyé elle-même : c'est parti. */
const PARTI: Record<GenreFait, (lieu?: string) => string> = {
  "mise-de-cote": (l) => `Votre demande de mise de côté est partie${chez(l)}.`,
  reservation: (l) => `Votre demande de réservation est partie${chez(l)}.`,
  demande: (l) => `Votre demande est partie${chez(l)}.`,
  sortie: () => "Votre demande est partie.",
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
  classe?: string;
}) {
  const texte = voie === "serveur" ? RECU[genre] : PARTI[genre](lieu);
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

/** L'ENVOI N'EST PAS PARTI : on le dit, et on propose de recommencer. Jamais la vidéo. */
export function EnvoiRate({ onReessayer, enPlus, classe }: { onReessayer: () => void; enPlus?: ReactNode; classe?: string }) {
  return (
    <section className={`cf cf-rate${classe ? ` ${classe}` : ""}`} role="alert">
      <p className="cf-rate-t">Je n’ai pas réussi à envoyer votre demande.</p>
      {enPlus}
      <button type="button" className="cf-cta" onClick={onReessayer}>
        Réessayer →
      </button>
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
`,
      }}
    />
  );
}
