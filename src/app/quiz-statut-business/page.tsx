"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  weight: ["400", "500", "600", "700", "900"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

type Letter = "A" | "B" | "C" | "D";

type Question = {
  id: number;
  prompt: string;
  options: { key: Letter; label: string }[];
};

type ResultContent = {
  title: string;
  impact: string;
  body: string[];
  cost: string[];
  nextStep: string;
};

const QUESTIONS: Question[] = [
  {
    id: 1,
    prompt: "Quand vous pensez à vos clients, laquelle de ces phrases vous ressemble le plus ?",
    options: [
      { key: "A", label: "J’ai l’impression que peu de gens savent vraiment que j’existe" },
      { key: "B", label: "Je prends ce qui tombe, même si ce n’est pas idéal" },
      { key: "C", label: "J’ai des contacts, mais ça ne se transforme pas vraiment" },
      { key: "D", label: "J’ai des clients, mais je sens que je plafonne" },
    ],
  },
  {
    id: 2,
    prompt: "D’où viennent la plupart de vos opportunités aujourd’hui ?",
    options: [
      { key: "A", label: "Du hasard ou de quelques posts" },
      { key: "B", label: "De ma prospection / relances / énergie du moment" },
      { key: "C", label: "De quelques recommandations irrégulières" },
      { key: "D", label: "Du bouche-à-oreille, mais sans vrai système structuré" },
    ],
  },
  {
    id: 3,
    prompt: "Si vous arrêtez de prospecter ou de travailler pendant 30 jours, que se passe-t-il ?",
    options: [
      { key: "A", label: "Plus rien ou presque" },
      { key: "B", label: "Je panique, car mon activité ralentit très vite" },
      { key: "C", label: "Quelques opportunités tombent encore, mais c’est imprévisible" },
      { key: "D", label: "J’ai encore du flux, mais je sens que ça dépend trop de ma présence" },
    ],
  },
  {
    id: 4,
    prompt: "Quand quelqu’un cherche un professionnel de votre métier dans votre ville, votre nom revient-il naturellement ?",
    options: [
      { key: "A", label: "Rarement, voire jamais" },
      { key: "B", label: "Parfois, mais seulement dans certains cercles" },
      { key: "C", label: "Oui, auprès de quelques personnes-clés" },
      { key: "D", label: "Souvent, et de plus en plus régulièrement" },
    ],
  },
  {
    id: 5,
    prompt: "Votre réseau actuel vous apporte-t-il vraiment du chiffre d’affaires ?",
    options: [
      { key: "A", label: "Honnêtement, non" },
      { key: "B", label: "Un peu, mais ce n’est pas stable" },
      { key: "C", label: "Oui, de temps en temps" },
      { key: "D", label: "Oui, mais je pourrais largement mieux l’organiser" },
    ],
  },
  {
    id: 6,
    prompt: "Lequel de ces problèmes vous parle le plus ?",
    options: [
      { key: "A", label: "Personne ne pense à moi au bon moment" },
      { key: "B", label: "Je cours après les opportunités" },
      { key: "C", label: "Je parle à beaucoup de monde, mais peu d’affaires concrètes" },
      { key: "D", label: "Je suis bon… mais je reste trop dépendant de moi-même" },
    ],
  },
  {
    id: 7,
    prompt: "Quand vous rendez service ou recommandez quelqu’un, qu’obtenez-vous en retour ?",
    options: [
      { key: "A", label: "Pas grand-chose" },
      { key: "B", label: "Parfois un merci… rarement plus" },
      { key: "C", label: "Quelques retours, mais rien de structuré" },
      { key: "D", label: "J’aide beaucoup de monde, mais je sens que je valorise mal cette position" },
    ],
  },
  {
    id: 8,
    prompt: "Votre ambition réelle, si vous êtes honnête ?",
    options: [
      { key: "A", label: "Sortir de l’anonymat" },
      { key: "B", label: "Arrêter de survivre et respirer enfin" },
      { key: "C", label: "Transformer mes relations en vraies opportunités" },
      { key: "D", label: "Devenir une référence locale incontournable" },
    ],
  },
];

const RESULT_MAP: Record<Letter, ResultContent> = {
  A: {
    title: "Vous êtes : L’Invisible",
    impact: "Vous êtes peut-être excellent… mais votre marché ne le sait pas encore.",
    body: [
      "Votre plus grand problème n’est pas la concurrence.",
      "C’est l’oubli.",
      "Vous avez du savoir-faire, mais pas encore de place claire dans l’écosystème local.",
      "Tant que les bonnes personnes ne pensent pas à vous au bon moment, votre valeur reste sous-exploitée.",
    ],
    cost: [
      "Des opportunités qui passent chez d’autres",
      "Une impression de crier dans le vide",
      "Un talent qui reste trop discret",
    ],
    nextStep: "Créer vos premiers relais de confiance, pas juste “plus de visibilité”.",
  },
  B: {
    title: "Vous êtes : Le Chasseur de Miettes",
    impact: "Vous travaillez… mais trop souvent dans l’urgence.",
    body: [
      "Vous acceptez ce qui tombe, même quand ce n’est pas idéal.",
      "Vous ne choisissez pas encore vraiment vos clients : ce sont eux qui vous choisissent.",
    ],
    cost: [
      "Fatigue",
      "Pression permanente",
      "Mauvais clients",
      "Dépendance au mois suivant",
    ],
    nextStep: "Construire un flux d’opportunités plus prévisible grâce à des partenaires stratégiques.",
  },
  C: {
    title: "Vous êtes : Le Recommandé",
    impact: "Vous avez des opportunités… mais sans vraie maîtrise.",
    body: [
      "Quelques personnes pensent déjà à vous.",
      "Mais vous ne savez jamais quand la prochaine recommandation va tomber.",
      "Vous n’êtes plus invisible.",
      "Mais vous n’avez pas encore un système.",
    ],
    cost: [
      "Incertitude",
      "Difficulté à prévoir",
      "Dépendance à la chance",
      "Croissance non maîtrisée",
    ],
    nextStep: "Transformer les recommandations informelles en système récurrent.",
  },
  D: {
    title: "Vous êtes : Le Technicien Solo",
    impact: "Vous êtes bon. Très bon. Mais votre système reste fragile.",
    body: [
      "Vos clients viennent surtout grâce à votre compétence.",
      "Le problème ? Si vous ralentissez, le moteur ralentit aussi.",
      "Vous avez de la valeur.",
      "Mais votre activité dépend encore trop de vous.",
    ],
    cost: [
      "Plafond de verre",
      "Dépendance à votre temps",
      "Croissance lente",
      "Sensation d’être prisonnier de votre propre expertise",
    ],
    nextStep: "Passer d’une activité portée par vous… à une position portée par un écosystème.",
  },
};

const PYRAMID_LEVELS = [
  { label: "L’Ambassadeur / Mentor", width: "w-[44%]", tone: "bg-[#6B1E22] text-white" },
  { label: "Le Notable", width: "w-[56%]", tone: "bg-[#8A2A31] text-white" },
  { label: "Le Connecteur Naturel", width: "w-[66%]", tone: "bg-[#A44A50] text-white" },
  { label: "Le Recommandé", width: "w-[74%]", tone: "bg-[#BF6F74] text-white" },
  { label: "Le Technicien Solo", width: "w-[82%]", tone: "bg-[#D4989C] text-[#2A1112]" },
  { label: "Le Réseautard “Petit Four”", width: "w-[90%]", tone: "bg-[#E5B9BB] text-[#2A1112]" },
  { label: "Le Chasseur de Miettes", width: "w-[96%]", tone: "bg-[#F1D8DA] text-[#2A1112]" },
  { label: "L’Invisible", width: "w-full", tone: "bg-[#F7E9EA] text-[#2A1112]" },
];

const STATUS_BY_LETTER: Record<Letter, string> = {
  A: "L’Invisible",
  B: "Le Chasseur de Miettes",
  C: "Le Recommandé",
  D: "Le Technicien Solo",
};

const PRIMARY_CTA = "Trouver mon partenaire stratégique";

export default function QuizStatutBusinessPage() {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(Letter | null)[]>(Array(QUESTIONS.length).fill(null));
  const [selectedOption, setSelectedOption] = useState<Letter | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const quizRef = useRef<HTMLElement | null>(null);
  const analysisRef = useRef<HTMLDivElement | null>(null);

  const isComplete = answers.every(Boolean);
  const progress = isComplete ? 100 : Math.round(((currentIndex + 1) / QUESTIONS.length) * 100);

  const currentQuestion = QUESTIONS[currentIndex];

  const computedLetter = useMemo<Letter>(() => {
    const counts: Record<Letter, number> = { A: 0, B: 0, C: 0, D: 0 };
    answers.forEach((value) => {
      if (value) counts[value] += 1;
    });
    const sorted = (Object.entries(counts) as [Letter, number][])
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);
    const best = sorted[0];
    const ties = (Object.entries(counts) as [Letter, number][])
      .filter(([, score]) => score === counts[best])
      .map(([k]) => k);
    if (ties.length === 1) return best;
    return (answers[answers.length - 1] as Letter) || best;
  }, [answers]);

  const result = RESULT_MAP[computedLetter];
  const currentStatusLabel = STATUS_BY_LETTER[computedLetter];

  const startQuiz = () => {
    setStarted(true);
    requestAnimationFrame(() => {
      quizRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const selectAnswer = (letter: Letter) => {
    if (isAdvancing) return;
    setIsAdvancing(true);
    setSelectedOption(letter);
    const next = [...answers];
    next[currentIndex] = letter;
    setAnswers(next);
    window.setTimeout(() => {
      if (currentIndex < QUESTIONS.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
      setSelectedOption(null);
      setIsAdvancing(false);
    }, 210);
  };

  const goBack = () => {
    if (isAdvancing) return;
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  const resetQuiz = () => {
    setAnswers(Array(QUESTIONS.length).fill(null));
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAdvancing(false);
    setStarted(true);
  };

  return (
    <main className={`${poppins.variable} font-poppins min-h-screen bg-[#F6F2EC] text-[#111111]`}>
      <section className="relative overflow-hidden border-b border-black/10 bg-white">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#6B1E22]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-black/5 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div>
              <p className="inline-flex rounded-full border border-[#6B1E22]/25 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#6B1E22] shadow-sm">
                Quiz Statut Business
              </p>
              <h1 className="mt-4 text-4xl md:text-6xl font-black leading-[1.03] text-balance">
                Quel est votre vrai statut business dans votre ville ?
              </h1>
              <p className="mt-5 text-base md:text-xl font-medium leading-relaxed text-black/75 max-w-3xl">
                Vous êtes peut-être excellent dans votre métier.
                <br />
                Mais votre marché, lui, vous a déjà mis dans une case.
                <br />
                <br />
                Invisible. Sur-sollicité. Recommandé par hasard. Connu mais pas rentable.
                Découvrez en 2 minutes le vrai statut que vous occupez aujourd’hui… et surtout comment en sortir.
              </p>
              <div className="mt-7">
                <button
                  onClick={startQuiz}
                  className="inline-flex items-center justify-center rounded-xl bg-black px-7 py-3.5 text-sm font-black uppercase tracking-wide text-white transition hover:-translate-y-0.5 hover:shadow-[0_10px_0_0_#6B1E22]"
                >
                  Découvrir mon statut business
                </button>
                <p className="mt-3 text-xs font-bold uppercase tracking-wide text-black/60">
                  Quiz rapide • 2 minutes • Résultat immédiat
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white/95 p-5 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.4)] backdrop-blur">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-black/55">Ce que vous obtenez en 2 minutes</p>
              <div className="mt-4 space-y-2.5">
                <div className="rounded-xl border border-black/10 bg-[#FAFAFA] px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-black/55">Diagnostic</p>
                  <p className="mt-1 text-sm font-bold text-black/80">Votre statut business dominant aujourd’hui</p>
                </div>
                <div className="rounded-xl border border-black/10 bg-[#FAFAFA] px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-black/55">Coût caché</p>
                  <p className="mt-1 text-sm font-bold text-black/80">Ce que ce statut vous fait perdre chaque mois</p>
                </div>
                <div className="rounded-xl border border-[#6B1E22]/25 bg-[#6B1E22]/10 px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#6B1E22]">Plan d’action</p>
                  <p className="mt-1 text-sm font-black text-[#6B1E22]">La prochaine étape la plus rentable pour remonter de niveau</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-black/10 bg-white p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-black/55">Format du rendu</p>
                <p className="mt-1 text-sm font-semibold text-black/75">Rapport immédiat, lisible en moins de 60 secondes.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section ref={quizRef} className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-12 md:py-14">
          <div className="rounded-[24px] border border-black/10 bg-white p-5 md:p-7 shadow-[0_20px_45px_-26px_rgba(0,0,0,0.45)]">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.14em] font-black text-black/50">
                  {started ? `Question ${Math.min(currentIndex + 1, QUESTIONS.length)}/${QUESTIONS.length}` : "Prêt à démarrer"}
                </p>
                <p className="text-[11px] uppercase tracking-[0.14em] font-black text-[#6B1E22]">
                  {started ? `${progress}%` : "0%"}
                </p>
              </div>
              <div className="mt-2 h-2 rounded-full bg-black/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#6B1E22] to-[#8A2A31] transition-all duration-300"
                  style={{ width: `${started ? progress : 0}%` }}
                />
              </div>
              <div
                className="mt-3 grid gap-2"
                style={{ gridTemplateColumns: `repeat(${QUESTIONS.length}, minmax(0, 1fr))` }}
              >
                {QUESTIONS.map((q, idx) => (
                  <div
                    key={q.id}
                    className={`h-1.5 rounded-full ${
                      idx <= currentIndex && started ? "bg-[#6B1E22]" : "bg-black/10"
                    }`}
                  />
                ))}
              </div>
            </div>

            {!started && (
              <div className="text-center py-3">
                <button
                  onClick={startQuiz}
                  className="h-12 rounded-xl bg-black px-6 text-sm font-black uppercase tracking-wide text-white transition hover:bg-black/90"
                >
                  Découvrir mon statut business
                </button>
              </div>
            )}

            {started && !isComplete && (
              <div key={currentQuestion.id} className="animate-[slideIn_.28s_ease-out]">
                <h3 className="text-xl md:text-3xl font-black leading-snug">{currentQuestion.prompt}</h3>
                <div className="mt-6 grid gap-3">
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => selectAnswer(option.key)}
                      className={`group w-full rounded-2xl border px-4 py-4 text-left transition duration-200 ${
                        selectedOption === option.key
                          ? "border-[#6B1E22] bg-[#6B1E22]/10 scale-[1.01] shadow-[0_8px_20px_-12px_rgba(107,30,34,0.55)]"
                          : "border-black/12 bg-white hover:-translate-y-0.5 hover:border-[#6B1E22]/50 hover:bg-[#6B1E22]/5 hover:shadow-sm"
                      }`}
                      disabled={isAdvancing}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-black ${
                            selectedOption === option.key
                              ? "border-[#6B1E22] bg-[#6B1E22] text-white"
                              : "border-[#6B1E22]/30 bg-[#6B1E22]/8 text-[#6B1E22]"
                          }`}
                        >
                          {option.key}
                        </span>
                        <span className="text-sm md:text-base font-bold text-black/85 group-hover:text-black">
                          {option.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <button
                    onClick={goBack}
                    disabled={currentIndex === 0 || isAdvancing}
                    className="text-xs font-black uppercase tracking-wide text-black/55 disabled:opacity-30"
                  >
                    Retour
                  </button>
                  <p className="text-xs font-bold text-black/55">{isAdvancing ? "Validation..." : "Sélection instantanée"}</p>
                </div>
              </div>
            )}

            {started && isComplete && (
              <div className="space-y-6 animate-[fadeIn_.25s_ease-out]">
                <div ref={analysisRef} className="rounded-2xl border border-[#6B1E22]/20 bg-gradient-to-br from-[#6B1E22]/12 to-white p-5">
                  <p className="text-[11px] uppercase tracking-[0.14em] font-black text-[#6B1E22]">Résultat</p>
                  <h3 className="mt-1 text-2xl md:text-4xl font-black leading-tight">{result.title}</h3>
                  <p className="mt-3 text-base md:text-xl font-bold text-black/85">{result.impact}</p>
                </div>

                <div className="space-y-2">
                  {result.body.map((line) => (
                    <p key={line} className="text-sm md:text-base font-medium text-black/75 leading-relaxed">
                      {line}
                    </p>
                  ))}
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
                  <div className="rounded-xl border border-black/10 bg-[#FAFAFA] p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-black/55">Ce que ça vous coûte</p>
                    <ul className="mt-2 space-y-1.5 text-sm font-semibold text-black/75">
                      {result.cost.map((item) => (
                        <li key={item}>- {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-black/10 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-black/55">Prochaine étape</p>
                    <p className="mt-1 text-sm md:text-base font-bold text-black/85">{result.nextStep}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <Link
                    href="/popey-human"
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-black px-5 text-sm font-black uppercase tracking-wide text-white transition hover:bg-black/90"
                  >
                    {PRIMARY_CTA}
                  </Link>
                  <button
                    onClick={resetQuiz}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-black/15 px-5 text-sm font-black uppercase tracking-wide text-black/75"
                  >
                    Refaire le quiz
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {started && isComplete && (
        <>
          <section className="border-b border-black/10 bg-white">
            <div className="mx-auto max-w-5xl px-4 py-12">
              <p className="text-[11px] uppercase tracking-[0.14em] font-black text-[#6B1E22]/80">Promesse Popey</p>
              <h2 className="text-3xl md:text-5xl font-black leading-tight">
                Ne cherchez plus seulement des clients.
                <br />
                Construisez votre statut local.
              </h2>
              <p className="mt-5 text-base md:text-lg font-medium leading-relaxed text-black/75">
                Vos futurs clients achètent déjà ailleurs, mais votre enjeu principal est d’être la personne
                que le marché cite en premier au bon moment.
                Chez Popey, nous vous connectons à des partenaires stratégiques pour vous faire passer
                d’un statut subi à une position locale choisie, crédible et dominante.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 text-sm font-bold text-black/80">
                <p className="rounded-lg border border-black/10 bg-white px-3 py-2">Plus de centralité dans votre ville</p>
                <p className="rounded-lg border border-black/10 bg-white px-3 py-2">Plus de recommandations maîtrisées</p>
                <p className="rounded-lg border border-black/10 bg-white px-3 py-2">Plus de confiance perçue</p>
                <p className="rounded-lg border border-black/10 bg-white px-3 py-2">Plus de part de marché locale</p>
              </div>
              <div className="mt-6">
                <Link
                  href="/popey-human"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-black px-6 text-sm font-black uppercase tracking-wide text-white transition hover:bg-black/90"
                >
                  {PRIMARY_CTA}
                </Link>
              </div>
            </div>
          </section>
          <section className="border-b border-black/10 bg-[#FBF9F5]">
            <div className="mx-auto max-w-6xl px-4 py-12">
              <div className="max-w-4xl">
                <p className="text-[11px] uppercase tracking-[0.14em] font-black text-[#6B1E22]/80">Pyramide des statuts</p>
                <h2 className="text-2xl md:text-4xl font-black">Les 8 niveaux de statut business local</h2>
                <p className="mt-2 text-sm md:text-base font-medium text-black/70">
                  Vous venez de terminer le quiz. Voici où vous vous situez aujourd&apos;hui dans la pyramide.
                  Le niveau qui capte la plus grande part du marché est tout en haut : <span className="font-black">L’Ambassadeur / Mentor</span>.
                </p>
              </div>
              <div className="mt-8 flex flex-col items-center gap-2.5 animate-[fadeIn_.35s_ease-out]">
                {PYRAMID_LEVELS.map((level) => (
                  <div key={level.label} className="w-full flex flex-col items-center">
                    {level.label === currentStatusLabel && (
                      <button
                        onClick={() => analysisRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                        className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#6B1E22]/30 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-[#6B1E22]"
                      >
                        ↘ Vous êtes là • Cliquez pour voir votre analyse
                      </button>
                    )}
                    <div
                      className={`${level.width} ${level.tone} rounded-lg px-4 py-2.5 text-center text-xs md:text-sm font-black shadow-sm transition hover:scale-[1.01] ${
                        level.label === currentStatusLabel ? "ring-2 ring-[#6B1E22]/40" : ""
                      }`}
                    >
                      {level.label}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid sm:grid-cols-3 gap-2.5 text-xs font-bold uppercase tracking-[0.1em] text-black/60">
                <div className="rounded-lg border border-black/10 bg-white px-3 py-2 text-center">Base : visibilité faible</div>
                <div className="rounded-lg border border-black/10 bg-white px-3 py-2 text-center">Milieu : réseau actif</div>
                <div className="rounded-lg border border-black/10 bg-white px-3 py-2 text-center">Sommet : autorité locale</div>
              </div>
            </div>
          </section>
        </>
      )}

      <div className="fixed bottom-3 left-3 right-3 z-50 md:hidden">
        <Link
          href="/popey-human"
          className="flex h-12 items-center justify-center rounded-xl bg-[#6B1E22] px-4 text-sm font-black uppercase tracking-wide text-white shadow-[0_12px_28px_-14px_rgba(107,30,34,0.9)]"
        >
          {PRIMARY_CTA}
        </Link>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(8px) translateY(6px); }
          to { opacity: 1; transform: translateX(0) translateY(0); }
        }
      `}</style>
    </main>
  );
}
