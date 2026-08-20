// LA PAGE 404 — et la raison pour laquelle il n'y a PAS de `loading.tsx` à la
// racine de `src/app`.
//
// CE QUI S'EST PASSÉ, ET QUI NE SE VOIT PAS EN LISANT LE CODE. Un
// `src/app/loading.tsx` générique (« Chargement de votre espace… ») a longtemps
// vécu ici. Posé à la RACINE, il met CHAQUE route derrière une frontière de
// Suspense : Next envoie alors l'enveloppe HTML — et avec elle le code 200 —
// avant que la page n'ait fini de s'exécuter. Tout `notFound()` appelé ensuite
// arrive trop tard. Il remplace bien l'affichage, mais l'en-tête est parti.
//
// Conséquence, mesurée au navigateur sur deux routes indépendantes : un lien de
// commerce inexistant et un Clik expiré répondaient tous les deux HTTP 200 en
// affichant « introuvable ». Le fichier retiré, les deux répondent 404.
//
// Pour un visiteur, aucune différence. Pour Google, c'est un « soft 404 » : une
// page valide de plus, au contenu identique à toutes les autres adresses
// mortes. Il les met en concurrence, finit par comprendre qu'on lui ment, et se
// méfie du reste du site — ce que Search Console rapporte sous « Introuvable
// (404) » et « Explorée, actuellement non indexée ».
//
// SI QUELQU'UN VEUT REMETTRE UN ÉCRAN D'ATTENTE : qu'il le pose sur le segment
// qui en a besoin, jamais à la racine. Deux le font déjà (`/mon-reseau-local`,
// `/popey-human/app`) sans casser le reste. Et sans fichier racine, Next garde
// simplement la page précédente à l'écran pendant la navigation — ce qui est
// aussi la meilleure des deux expériences.
import Link from "next/link";
import type { Metadata } from "next";
import { MARQUE } from "@/lib/marque";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: false },
};

export default function NonTrouve() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Erreur 404</p>
      <h1 className="text-2xl font-black text-slate-900">Cette page n&apos;existe plus</h1>
      <p className="max-w-sm text-sm leading-relaxed text-slate-600">
        Le lien a peut-être expiré, ou l&apos;annonce que vous cherchiez est terminée.
        C&apos;est normal&nbsp;: sur {MARQUE}, ce qui est passé disparaît.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white"
      >
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
