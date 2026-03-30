import Link from "next/link";

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
      "C'est là que naît ce que nous appelons le Système Immunitaire Psychologique : seul, votre prospect doute ; en duo, il se sent protégé et passe à l'action.",
    ],
    bullets: [
      "Solo : une promesse perçue comme risquée.",
      "Duo structuré : une solution perçue comme complète.",
      "Solo : vous cherchez des leads froids.",
      "Duo : vous activez des audiences déjà confiantes.",
    ],
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
      "Le prix d'une Porsche qui ne roule jamais. Parce que votre réseau n'est pas industrialisé.",
      "Popey Academy ne vous coûte pas cet argent. Popey récupère une partie de l'argent que vous perdez déjà.",
    ],
  },
  {
    id: "method",
    title: "SECTION 4 — LA MÉTHODE POPEY EN 14 JOURS",
    heading: "Un mécanisme opérationnel. Pas une motivation passagère.",
    paragraphs: [
      "Objectif : transformer un partenariat flou en machine de cash répétable.",
    ],
    bullets: [
      "J1-J3 — Ingénierie de l'Offre Duo : création du Pack “Transformation 21 Jours” (Sport + Nutri) à 297€.",
      "J4-J7 — Activation Chirurgicale : script WhatsApp Zéro Spam, stories croisées, 20 messages ciblés.",
      "J8-J12 — Actif Business : lead magnet PDF pour capturer les prospects non acheteurs.",
      "J13-J14 — Réconciliation Financière : arbitrage Popey des commissions (110€/110€/77€ + bonus apporteur).",
    ],
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
      "Exclusion automatique des passagers clandestins.",
      "Flux continu d'opportunités business.",
    ],
  },
  {
    id: "filtre",
    title: "SECTION 6 — LE FILTRE DE L'ACADÉMIE",
    heading: "Nous ne sommes pas un club de networking.",
    paragraphs: [
      "Vous n'achetez pas un accès. Vous passez un filtre.",
    ],
    bullets: [
      "Vous avez une expertise réelle vendable.",
      "Vous avez une audience, même petite, mais activable.",
      "Vous respectez l'éthique de réciprocité : contribution avant extraction.",
    ],
  },
  {
    id: "securite",
    title: "SECTION 7 — GARANTIE DE SÉCURITÉ POPEY",
    heading: "Si le flux organique baisse, nous déclenchons un plan de secours.",
    paragraphs: [
      "Quand les KPIs de vente organique sont sous les seuils, Popey active un Boost de Visibilité.",
      "Nous investissons 50€ de budget publicitaire sur nos propres réseaux pour injecter des leads externes dans votre binôme.",
      "Vous n'êtes jamais laissé seul face au marché.",
    ],
  },
];

export default function PopeyHumanTestPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <section className="border-b border-[#D4AF37]/30">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <p className="text-xs tracking-[0.28em] text-[#D4AF37] font-semibold uppercase">Page test — Popey Academy 100% humain</p>
          <h1 className="mt-6 text-4xl md:text-6xl leading-tight font-black max-w-5xl">
            Cessez de quémander des clients.
            <br />
            <span className="text-[#D4AF37]">Commencez à orchestrer des actifs.</span>
          </h1>
          <p className="mt-8 text-lg md:text-2xl text-white/85 max-w-4xl leading-relaxed">
            Comment transformer un simple partenariat en une machine à 40 000€ de CA additionnel par an grâce au modèle Monthly Synergy™.
          </p>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#D4AF37]/40 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">Mois 1</p>
              <p className="mt-2 text-2xl font-black">149€</p>
              <p className="mt-2 text-sm text-white/70">Frais d&apos;entrée et preuve de concept.</p>
            </div>
            <div className="rounded-2xl border border-[#D4AF37]/40 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">Mois 2+</p>
              <p className="mt-2 text-2xl font-black">490€ / mois</p>
              <p className="mt-2 text-sm text-white/70">Accès à la Sphère des 20 et scalabilité.</p>
            </div>
            <div className="rounded-2xl border border-[#D4AF37]/40 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[#D4AF37]">Promesse</p>
              <p className="mt-2 text-2xl font-black">Monthly Synergy™</p>
              <p className="mt-2 text-sm text-white/70">Networking structuré, traçable, monétisable.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-xs tracking-[0.22em] uppercase text-[#D4AF37] font-semibold">SECTION 1 — LA VISION</p>
          <h2 className="mt-4 text-3xl md:text-5xl font-black max-w-4xl">Le problème n&apos;est pas le manque de talent. C&apos;est l&apos;absence de système.</h2>
          <p className="mt-6 max-w-4xl text-lg leading-relaxed text-white/85">
            Les coachs, nutritionnistes, agents immo et experts de terrain saturent parce qu&apos;ils vendent leur temps à l&apos;unité et chassent des leads froids. Popey Academy installe un système de Synergies Monétisables : deux métiers complémentaires, une offre conjointe, deux audiences activées, un tunnel court, un revenu traçable.
          </p>
          <ul className="mt-8 space-y-3 text-white/85">
            <li>• Vous arrêtez d&apos;improviser des partenariats.</li>
            <li>• Vous passez sur une machine opérée, mesurée, arbitrée.</li>
            <li>• Vous transformez le réseau dormant en cash immédiat.</li>
          </ul>
        </div>
      </section>

      {sections.map((section) => (
        <section key={section.id} className="border-b border-white/10">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <p className="text-xs tracking-[0.22em] uppercase text-[#D4AF37] font-semibold">{section.title}</p>
            <h2 className="mt-4 text-3xl md:text-5xl font-black max-w-5xl">{section.heading}</h2>

            <div className="mt-8 space-y-4 max-w-5xl">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-lg leading-relaxed text-white/85">{paragraph}</p>
              ))}
            </div>

            {section.bullets && (
              <ul className="mt-8 space-y-3 max-w-5xl text-white/90">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3">
                    <span className="mt-1 text-[#D4AF37]">◆</span>
                    <span className="leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ))}

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-3xl border border-[#D4AF37]/40 bg-gradient-to-br from-[#171717] to-[#0A0A0A] p-8 md:p-12">
            <p className="text-xs tracking-[0.22em] uppercase text-[#D4AF37] font-semibold">Audit d&apos;entrée</p>
            <h2 className="mt-4 text-3xl md:text-5xl font-black max-w-4xl">
              Vous voulez un réseau qui paie vos factures, pas un groupe WhatsApp décoratif ?
            </h2>
            <p className="mt-6 text-lg text-white/85 max-w-4xl leading-relaxed">
              Candidater à l&apos;Audit de Synergie. Nous évaluons votre profil, votre audience, votre potentiel de complémentarité et votre capacité à jouer la réciprocité. Si vous passez le filtre, on construit votre Monthly Synergy™.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href="/programme-commando/postuler"
                className="inline-flex items-center justify-center rounded-xl border border-[#D4AF37] bg-[#D4AF37] px-8 py-4 text-black font-black hover:bg-[#e7c766] transition-colors"
              >
                Candidater à l&apos;Audit de Synergie
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl border border-white/30 px-8 py-4 text-white font-bold hover:bg-white/5 transition-colors"
              >
                Retour à l&apos;accueil actuelle
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
