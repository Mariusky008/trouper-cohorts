// 🛡️ LA CONFIDENTIALITÉ DE CLIKME — l'audit UX du 28 novembre 2026, lot 5 (`docs/audit-ux.md`, section 10) : la seule
// politique en ligne (`/legal/privacy`) était celle de Popey Academy, sans un mot des selfies, des figurines ni des
// mineurs. Celle-ci dit ce que l'appli fait vraiment (relu dans le code le 28/11). TEXTE LÉGAL : relu et validé par le
// propriétaire avant d'être fusionné ; à tenir à jour quand un service ou une durée change.
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Confidentialité · ClikMe",
  description: "Ce que ClikMe garde, pourquoi, combien de temps, avec qui, et comment tout effacer.",
  alternates: { canonical: "/collection/confidentialite" },
};

/** Qui répond de vos données (les mentions légales : `/legal/mentions`). */
const RESPONSABLE = { nom: "Ibrelisle", adresse: "23 rue Paul Lahragou, 40100 Dax", contact: "contact@popey.academy" };
const MISE_A_JOUR = "28 novembre 2026";

export default function Confidentialite() {
  return (
    <main className="cf">
      <Link href="/collection#moi" className="cf-retour">
        ‹ Moi
      </Link>
      <h1>Confidentialité</h1>
      <p className="cf-date">Mise à jour le {MISE_A_JOUR}</p>
      <p className="cf-chapo">
        ClikMe sert à regarder des vidéos ensemble, avec ta figurine. Voici, sans jargon, ce que l’appli garde de toi, pourquoi, combien de temps, qui d’autre le voit, et comment tout effacer.
      </p>

      <h2>Ce que ClikMe garde</h2>
      <ul>
        <li>
          <b>Ton selfie</b>, pour fabriquer ta figurine (et la refaire si tu le demandes). Il n’est montré à personne.
        </li>
        <li>
          <b>Ta figurine</b> et ses expressions, ton prénom et ta ville : c’est ce que les autres voient de toi.
        </li>
        <li>
          <b>Ton âge déclaré</b> (15 ans ou plus, et si tu as 18 ans ou plus), pour adapter ce qui t’est proposé.
        </li>
        <li>
          <b>Ce que tu fais dans l’appli</b> : tes proches, tes messages (écrits, vocaux, photos, vidéos, PDF), ta maison et ce que tu y mets, tes réactions et tes mots sous les vidéos, tes groupes, ton humeur du jour, tes passions.
        </li>
        <li>
          <b>Ton adresse e-mail</b>, seulement si tu sauvegardes ta figurine, pour t’envoyer un code et la retrouver sur un autre téléphone.
        </li>
        <li>
          <b>Un identifiant de ce téléphone</b> (un cookie), pour que tu restes connecté. Pas de publicité, pas de mesure d’audience, aucune revente.
        </li>
      </ul>

      <h2>Pourquoi</h2>
      <p>Pour faire marcher l’appli que tu utilises : te montrer ta figurine, te relier à tes proches, garder vos conversations et ce que tu ranges chez toi. Rien d’autre, et jamais pour de la publicité.</p>

      <h2>Qui le voit</h2>
      <ul>
        <li>
          <b>Tes proches</b> : ce que tu leur envoies, ta maison (selon « Qui peut venir voir ta pièce »), ton humeur du jour.
        </li>
        <li>
          <b>Les autres</b>, dans les salons et sous les vidéos : ta figurine, ton prénom, tes réactions et tes mots. Tu peux empêcher ta figurine de réapparaître dans les salons (Moi, « Ma figurine peut réapparaître dans les salons »).
        </li>
        <li>
          <b>Les services qui font tourner ClikMe</b>, chacun pour sa tâche seulement : Vercel (l’hébergement, en Irlande), Supabase (la base et les fichiers), OpenAI et Google Gemini (fabriquer ta figurine à partir de ton selfie, comprendre un vocal, vérifier qu’une photo est acceptable), ElevenLabs (la voix du texte que tu fais dire à ta figurine dans « Ma collection »), Resend (l’e-mail du code), YouTube (les vidéos, lues depuis YouTube).
        </li>
      </ul>

      <h2>Combien de temps</h2>
      <ul>
        <li>Ton humeur du jour s’efface à minuit ; une figurine posée « Autour » part au bout de 24 heures.</li>
        <li>Un fichier déposé mais jamais envoyé est effacé au bout de 24 heures.</li>
        <li>Le reste est gardé tant que ton compte existe. Tu peux effacer un message que tu as envoyé dans les 24 heures.</li>
      </ul>

      <h2>Les plus jeunes</h2>
      <p>ClikMe est ouvert à partir de 15 ans. Les groupes ouverts aux inconnus sont réservés aux adultes, et l’appli ne pose jamais de question sur la vie amoureuse aux 15-17 ans.</p>

      <h2>Tes droits, et comment tout effacer</h2>
      <ul>
        <li>
          <b>Tout effacer</b> : Moi, « Supprimer mon compte ». C’est immédiat et définitif : ta figurine, ton selfie, ta maison, tes messages (chez tes proches aussi), tes réactions, tes mots et tes moments partent.
        </li>
        <li>
          <b>Voir et effacer ce que ta figurine sait de toi</b> : Moi, « Mes données ».
        </li>
        <li>
          <b>Te déconnecter</b> : Moi, « Se déconnecter ».
        </li>
        <li>
          Pour toute autre demande (accès, rectification, opposition), écris à <b>{RESPONSABLE.contact}</b>. Tu peux aussi saisir la CNIL (cnil.fr).
        </li>
      </ul>

      <h2>Qui en répond</h2>
      <p>
        {RESPONSABLE.nom}, {RESPONSABLE.adresse}. Contact : {RESPONSABLE.contact}. Voir aussi les <Link href="/legal/mentions">mentions légales</Link>.
      </p>
      <style>{STYLES}</style>
    </main>
  );
}

const STYLES = `
body{background:#12040E}
.cf{max-width:680px;margin:0 auto;padding:max(16px,env(safe-area-inset-top)) max(18px,env(safe-area-inset-right)) 48px max(18px,env(safe-area-inset-left));color:#FFF4E6;font-family:var(--font-poppins),"Poppins",system-ui,sans-serif;line-height:1.55}
.cf-retour{display:inline-flex;align-items:center;min-height:40px;color:#FF8FCB;font-weight:800;text-decoration:none}
.cf h1{margin:6px 0 2px;font-size:30px;font-weight:900;letter-spacing:-.02em}
.cf h2{margin:26px 0 8px;font-size:18px;font-weight:900;color:#FF8FCB}
.cf p,.cf li{font-size:15px;color:#E9D6DF}
.cf b{color:#FFF4E6}
.cf ul{margin:0;padding-left:20px;display:grid;gap:7px}
.cf-date{margin:0;font-size:13px!important;color:#B79AAE!important}
.cf-chapo{margin:14px 0 0;font-size:16px!important;color:#FFF4E6!important}
.cf a{color:#FF8FCB}
`;
