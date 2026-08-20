import type { Metadata } from "next";
import { MARQUE } from "@/lib/marque";
import { SITE_HOST } from "@/lib/site-url";

// LES TROIS PAGES LÉGALES AVAIENT LE MÊME TITRE, LA MÊME DESCRIPTION ET AUCUNE
// CANONIQUE — celui de la racine, hérité faute de `metadata` propre.
//
// Ce sont les SEULES pages fixes que le sitemap annonce à Google en dehors de
// l'accueil. Il en recevait donc trois qui, vues de son côté, portaient le titre
// de l'accueil, sa description, et un gabarit identique à 90 % (en-tête,
// sommaire latéral, encadré « Une question ? »). Search Console le dit
// littéralement : « Page en double sans URL canonique sélectionnée par
// l'utilisateur ». Trois des quatre pages proposées se neutralisaient entre
// elles, et c'est une des raisons pour lesquelles une seule page est indexée.
//
// La canonique est écrite en toutes lettres et non déduite de l'URL visitée :
// c'est ce qui empêche `?utm_source=…`, `/legal/mentions/` avec barre finale et
// une éventuelle variante `www` d'exister comme trois pages distinctes.
export const metadata: Metadata = {
  title: "Mentions légales",
  description: `Éditeur, hébergeur et directeur de la publication du site ${MARQUE}.`,
  alternates: { canonical: "/legal/mentions" },
};

export default function MentionsPage() {
  return (
    <article className="prose prose-slate prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900 prose-p:text-slate-600 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900 prose-li:text-slate-600">
      <div className="mb-8 border-b border-slate-100 pb-8">
        <h1 className="mb-2 text-3xl md:text-4xl">Mentions Légales</h1>
      </div>
      
      <h2>1. Éditeur du Site</h2>
      <p>
        Le présent site, accessible à l’URL <strong>{SITE_HOST}</strong> (ci-après le « Site »), est édité par :
      </p>
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 not-prose">
        <h3 className="font-bold text-slate-900 mb-2">Ibrelisle</h3>
        <ul className="space-y-1 text-slate-600 text-sm">
          <li><strong>Siège social :</strong> 23 rue paul lahragou, 40100 Dax</li>
          <li><strong>SIRET :</strong> 840 800 106</li>
          <li><strong>Email :</strong> <a href="mailto:contact@popey.academy" className="text-blue-600 hover:underline">contact@popey.academy</a></li>
        </ul>
      </div>

      <h2>2. Directeur de la publication</h2>
      <p>
        Directeur de la publication : <strong>Yann Ibrelisle</strong>
      </p>

      <h2>3. Hébergement</h2>
      <p>
        Le Site est hébergé par la société <strong>Vercel Inc.</strong>, dont le siège social est situé au :<br/>
        340 S Lemon Ave #4133<br/>
        Walnut, CA 91789<br/>
        États-Unis<br/>
        Site web : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">https://vercel.com</a>
      </p>

      <h2>4. Nous contacter</h2>
      <p>
        Par email : <a href="mailto:contact@popey.academy">contact@popey.academy</a><br/>
        Par courrier : 23 rue paul lahragou, 40100 Dax
      </p>

      <h2>5. Propriété Intellectuelle</h2>
      <p>
        L'ensemble de ce Site (structure, design, textes, images, animations, logo) relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. 
        Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
      </p>
      <p>
        Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du Site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de {MARQUE}.
        Toute exploitation non autorisée du site ou de l’un quelconque des éléments qu’il contient sera considérée comme constitutive d’une contrefaçon et poursuivie conformément aux dispositions des articles L.335-2 et suivants du Code de Propriété Intellectuelle.
      </p>

      <h2>6. Données Personnelles</h2>
      <p>
        Le traitement de vos données à caractère personnel est régi par notre <a href="/legal/privacy">Politique de Confidentialité</a>, conformément au Règlement Général sur la Protection des Données (RGPD) du 27 avril 2016.
      </p>
      <p>
        Pour toute question concernant vos données personnelles ou pour exercer vos droits, vous pouvez nous contacter à l'adresse : <a href="mailto:contact@popey.academy">contact@popey.academy</a>.
      </p>

      <h2>7. Cookies</h2>
      <p>
        Le Site peut collecter automatiquement des informations standards telles que tous types d'informations personnalisées qui permettent au site d'identifier ses visiteurs. Toutes les informations collectées indirectement ne seront utilisées que pour suivre le volume, le type et la configuration du trafic utilisant ce Site, pour en développer la conception et l'agencement et à d'autres fins administratives et de planification et plus généralement pour améliorer le service que nous vous offrons.
      </p>
    </article>
  );
}
