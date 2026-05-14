export default function VitrineLandingPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#152B5E_0%,#0D1B3F_35%,#070B18_100%)] px-4 py-10 text-white">
      <section className="mx-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_45px_110px_-55px_rgba(14,165,233,0.6)] backdrop-blur-xl sm:p-10">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-200">Popey Academy</p>
        <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">Démonstrations personnalisées</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
          Cette page héberge des vitrines web préparées sur mesure pour des entreprises locales. Si vous avez reçu un lien, ouvrez-le
          directement : <span className="font-semibold text-white">vitrine.popey.academy/{"{slug}"}</span>.
        </p>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/80">
          <p className="font-semibold text-white">Besoin d'une vitrine pour votre entreprise ?</p>
          <p className="mt-1">
            Contactez-nous sur Popey Academy pour une démonstration rapide et un plan d'amélioration adapté à votre activité.
          </p>
        </div>
      </section>
    </main>
  );
}
