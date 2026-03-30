import Link from "next/link";
import { Titan_One, Pacifico, Poppins } from "next/font/google";
import { cn } from "@/lib/utils";

const titanOne = Titan_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-titan",
});

const pacifico = Pacifico({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pacifico",
});

const poppins = Poppins({
  weight: ["400", "600", "700", "900"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

const sections = [
  {
    id: "miroir",
    title: "SECTION 2 — LE MIROIR DE L'ÉCHEC",
    heading: "Vous êtes compétent. Alors pourquoi votre réseau ne vous rapporte presque rien ?",
    paragraphs: [
      "Combien de cafés réseau ont fini en promesses polies et en zéro client réel ?",
      "Combien de “on s'envoie des clients” se transforment en silence radio ?",
      "Combien de fois avez-vous hésité à demander une commission, de peur de passer pour opportuniste ?",
      "Ce n'est pas votre talent qui bloque. C'est l'absence de structure.",
      "Un indépendant en solo vend son expertise. Deux experts bien orchestrés vendent une décision évidente.",
      "Seul, votre prospect doute ; en duo, il se sent protégé et passe à l'action.",
    ],
    bullets: [
      "Solo : une promesse perçue comme risquée.",
      "Duo structuré : une solution perçue comme complète.",
      "Solo : vous cherchez des leads froids.",
      "Duo : vous activez des audiences déjà confiantes.",
    ],
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "gap",
    title: "SECTION 3 — L'ÉQUATION DU GAP",
    heading: "Le manque à gagner n'est pas abstrait. Il est chiffrable.",
    paragraphs: [
      "Situation idéale : 5 000€ / mois de CA additionnel via votre réseau.",
      "Réalité actuelle : 500€ / mois irréguliers, souvent non pilotés.",
      "Écart : 4 500€ / mois.",
      "Sur 12 mois : 54 000€ laissés sur la table.",
      "Le prix d'une Porsche qui reste au garage, payé avec vos opportunités perdues.",
      "Popey ne crée pas un besoin artificiel : Popey récupère une partie de l'argent qui vous échappe déjà.",
    ],
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "method",
    title: "SECTION 4 — LA MÉTHODE POPEY EN 14 JOURS",
    heading: "Un mécanisme opérationnel. Pas une motivation passagère.",
    paragraphs: ["Objectif : transformer un partenariat flou en machine de cash répétable."],
    bullets: [
      "J1-J3 — Ingénierie de l'Offre Duo : création du Pack Transformation 21 Jours à 297€.",
      "J4-J7 — Activation Chirurgicale : script WhatsApp, stories croisées, 20 messages ciblés.",
      "J8-J12 — Actif Business : lead magnet PDF pour capturer les prospects non acheteurs.",
      "J13-J14 — Réconciliation Financière : arbitrage Popey des commissions (110€/110€/77€ + bonus apporteur).",
    ],
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "sphere",
    title: "SECTION 5 — LA PUISSANCE DE LA SPHÈRE DES 20",
    heading: "Mois 2+ : vous ne jouez plus en duo. Vous entrez dans une armée commerciale.",
    paragraphs: [
      "À 490€/mois, vous intégrez une architecture fermée de 20 métiers complémentaires.",
      "Ce n'est plus un partenariat. C'est un réseau où 19 professionnels ont un intérêt financier direct à vous envoyer des clients.",
      "Vous ne dépendez plus de votre seule énergie. Vous activez une force de frappe collective.",
    ],
    bullets: [
      "1 place par métier stratégique dans la sphère.",
      "Réciprocité mesurée : leads envoyés vs leads reçus.",
      "Exclusion des passagers clandestins.",
      "Flux continu d'opportunités business.",
    ],
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1600&auto=format&fit=crop",
  },
];

const ventures = [
  "Entreprise 1 — modèle B2C local",
  "Entreprise 2 — activité service premium",
  "Entreprise 3 — offre hybride produit/service",
  "Entreprise 4 — croissance par recommandation",
  "Entreprise 5 — repositionnement rentable",
  "Entreprise 6 — partenariat stratégique sectoriel",
  "Entreprise 7 — structuration orientée performance",
];

export default function PopeyHumanTestPage() {
  return (
    <main className={cn("min-h-screen bg-[#E2D9BC] text-[#2E130C] overflow-hidden", titanOne.variable, pacifico.variable, poppins.variable, "font-poppins")}>
      <section className="relative py-20 border-b-4 border-[#2E130C]">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#2E130C 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <p className="inline-block text-xs uppercase tracking-widest font-black bg-[#D2E8FF] border-2 border-[#2E130C] rounded-full px-4 py-2">
              Page test — Vision Popey Academy 100% humaine
            </p>
            <h1 className="mt-8 text-4xl md:text-6xl font-titan leading-tight">
              Cessez de quémander des clients.
              <br />
              <span className="text-[#B20B13] underline decoration-wavy">Commencez à orchestrer des actifs.</span>
            </h1>
            <p className="mt-6 text-lg md:text-2xl font-bold max-w-4xl mx-auto">
              Comment transformer un simple partenariat en une machine à 40 000€ de CA additionnel par an grâce au modèle Monthly Synergy™.
            </p>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { label: "Mois 1", value: "149€", desc: "Frais d'entrée et preuve de concept." },
              { label: "Mois 2+", value: "490€ / mois", desc: "Accès à la Sphère des 20 et scalabilité." },
              { label: "Promesse", value: "Monthly Synergy™", desc: "Networking structuré, traçable, monétisable." },
            ].map((card) => (
              <div key={card.label} className="bg-white rounded-3xl border-4 border-[#2E130C] p-6 shadow-[8px_8px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">{card.label}</p>
                <p className="text-3xl font-titan mt-2">{card.value}</p>
                <p className="font-bold mt-2 text-[#2E130C]/80">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#D2E8FF] border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
            <div className="bg-white rounded-3xl border-4 border-[#2E130C] p-8 shadow-[8px_8px_0px_0px_#2E130C]">
              <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">SECTION 1 — LA VISION</p>
              <h2 className="mt-4 text-3xl md:text-5xl font-titan">Le problème n&apos;est pas le manque de talent.</h2>
              <p className="mt-4 text-lg font-bold leading-relaxed">
                Les coachs, nutritionnistes, agents immo et experts terrain saturent parce qu&apos;ils vendent leur temps à l&apos;unité et chassent des leads froids.
              </p>
              <p className="mt-3 text-lg font-bold leading-relaxed">
                Popey Academy transforme ce chaos en système d&apos;exécution : deux métiers complémentaires, une offre commune, des audiences activées, un tunnel court, un revenu traçable.
              </p>
            </div>
            <div className="rounded-3xl overflow-hidden border-4 border-[#2E130C] shadow-[8px_8px_0px_0px_#2E130C]">
              <img src="https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1600&auto=format&fit=crop" alt="Équipe Popey en session stratégique" className="w-full h-[430px] object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-b-4 border-[#2E130C]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 bg-white rounded-3xl border-4 border-[#2E130C] p-6 shadow-[8px_8px_0px_0px_#2E130C] h-fit">
              <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">Fondateur</p>
              <h2 className="text-3xl font-titan mt-3">Mon histoire</h2>
              <div className="mt-5 rounded-2xl overflow-hidden border-4 border-[#2E130C]">
                <img src="/jeanphilipperoth.jpg" alt="Jean-Philippe Roth — Popey Academy" className="w-full h-[320px] object-cover" />
              </div>
              <p className="mt-5 font-bold leading-relaxed">
                J&apos;ai construit 7 entreprises. À chaque fois, le même mur : le réseau. Pas le manque de compétences. Pas le manque d&apos;énergie. Le manque de système pour transformer les relations en revenus.
              </p>
              <p className="mt-3 font-bold leading-relaxed">
                Popey Academy est la solution née de cette expérience terrain : industrialiser les synergies pour augmenter durablement le CA.
              </p>
            </div>
            <div className="lg:col-span-3 bg-[#D2E8FF] rounded-3xl border-4 border-[#2E130C] p-6 shadow-[8px_8px_0px_0px_#2E130C]">
              <h3 className="text-2xl font-titan">Parcours entrepreneurial (7 entreprises)</h3>
              <ul className="mt-5 space-y-3 font-bold">
                {ventures.map((venture) => (
                  <li key={venture} className="bg-white rounded-xl border-2 border-[#2E130C] px-4 py-3">
                    {venture}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {sections.map((section) => (
        <section key={section.id} className="py-16 border-b-4 border-[#2E130C]">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
              <div className="bg-white rounded-3xl border-4 border-[#2E130C] p-8 shadow-[8px_8px_0px_0px_#2E130C]">
                <p className="text-xs uppercase tracking-widest font-black text-[#B20B13]">{section.title}</p>
                <h2 className="mt-4 text-3xl md:text-5xl font-titan leading-tight">{section.heading}</h2>
                <div className="mt-6 space-y-3">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="font-bold leading-relaxed text-[#2E130C]/90">{paragraph}</p>
                  ))}
                </div>
                {section.bullets && (
                  <ul className="mt-6 space-y-2">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2 font-bold">
                        <span className="text-[#B20B13] mt-1">◆</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-3xl overflow-hidden border-4 border-[#2E130C] shadow-[8px_8px_0px_0px_#2E130C]">
                <img src={section.image} alt={section.heading} className="w-full h-[430px] object-cover" />
              </div>
            </div>
          </div>
        </section>
      ))}

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto bg-[#2E130C] text-[#E2D9BC] rounded-[2.5rem] border-4 border-[#B20B13] p-8 md:p-12 shadow-[10px_10px_0px_0px_#7A0000] text-center">
            <p className="text-xs uppercase tracking-widest font-black text-[#D2E8FF]">Audit d&apos;entrée</p>
            <h2 className="mt-4 text-3xl md:text-5xl font-titan leading-tight">
              Vous voulez un réseau qui paie vos factures, pas un groupe WhatsApp décoratif ?
            </h2>
            <p className="mt-6 text-lg font-bold leading-relaxed max-w-3xl mx-auto text-[#E2D9BC]/90">
              Candidater à l&apos;Audit de Synergie. On évalue votre expertise, votre audience, votre potentiel de complémentarité et votre discipline de réciprocité.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/programme-commando/postuler" className="inline-flex items-center justify-center rounded-xl border-2 border-[#2E130C] bg-[#B20B13] px-8 py-4 text-[#E2D9BC] font-titan shadow-[4px_4px_0px_0px_#2E130C] hover:bg-[#7A0000]">
                Candidater à l&apos;Audit de Synergie
              </Link>
              <Link href="/" className="inline-flex items-center justify-center rounded-xl border-2 border-[#E2D9BC] px-8 py-4 text-[#E2D9BC] font-bold hover:bg-[#E2D9BC]/10">
                Retour à l&apos;accueil actuelle
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
