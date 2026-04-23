export default function AccueilTestPage() {
  const todayVsPopey = [
    "Tu connais du monde... mais rien ne se passe",
    "Les gens pensent a toi... mais trop tard",
    "Tu prospectes... alors que les opportunites sont deja autour de toi",
  ];

  const withPopey = [
    "Tu sais qui peut t apporter des clients",
    "Tu sais quoi leur dire",
    "Tu sais quand les activer",
    "Et tu vois les resultats en temps reel",
  ];

  const howItWorks = [
    {
      title: "1. Scan intelligent",
      bullets: ["On analyse ton reseau", "On detecte les profils utiles"],
    },
    {
      title: "2. Activation simple",
      bullets: ["Message pret a envoyer", "Humain, pas spam"],
    },
    {
      title: "3. Opportunites",
      bullets: ["Tes contacts t envoient des leads", "Directement dans l app"],
    },
    {
      title: "4. Suivi en live",
      bullets: ["Qui t envoie quoi", "Ou ca en est", "Combien ca rapporte"],
    },
  ];

  const proofs = [
    "J ai recupere 2 clients en 10 jours juste avec mon reseau.",
    "Premier lead recu en 48h apres activation de 6 contacts.",
    "On voit enfin un suivi clair: recu, RDV, offre, signe.",
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#172554_0%,#0f172a_55%,#090b16_100%)] text-white">
      <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_24px_80px_-36px_rgba(16,185,129,0.6)] sm:p-10">
          <p className="inline-flex rounded-full border border-emerald-300/35 bg-emerald-300/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-100">
            Popey - Landing test
          </p>
          <h1 className="mt-4 text-4xl font-black leading-[0.95] sm:text-6xl">
            Ton telephone contient deja tes prochains clients.
            <span className="mt-2 block bg-gradient-to-r from-cyan-200 via-white to-emerald-200 bg-clip-text text-transparent">
              On te montre comment les activer.
            </span>
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-white/85 sm:text-xl">
            Transforme ton carnet d adresses en reseau qui te recommande - sans prospecter, sans forcer.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a
              href="/popey-human/smart-scan"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-emerald-300/35 bg-emerald-300/20 px-6 text-sm font-black uppercase tracking-[0.08em] text-emerald-100 transition hover:bg-emerald-300/30"
            >
              Scanner mon reseau (gratuit)
            </a>
            <a
              href="#declencheur"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-6 text-sm font-black uppercase tracking-[0.08em] text-white/90 transition hover:bg-white/15"
            >
              Voir en 30 secondes
            </a>
          </div>
          <p className="mt-4 text-sm text-cyan-100/90">Attends... j ai deja des clients dans mon tel ? Oui.</p>
        </section>

        <section id="declencheur" className="mt-8 grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-rose-300/25 bg-rose-300/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-rose-100">Aujourd hui</p>
            <ul className="mt-3 space-y-2 text-sm text-white/85">
              {todayVsPopey.map((line) => (
                <li key={line}>- {line}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-3xl border border-emerald-300/25 bg-emerald-300/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-100">Avec Popey</p>
            <ul className="mt-3 space-y-2 text-sm text-white/90">
              {withPopey.map((line) => (
                <li key={line}>- {line}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="mt-8 rounded-3xl border border-cyan-300/25 bg-cyan-300/10 p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-100">Killer feature</p>
          <h2 className="mt-2 text-3xl font-black sm:text-5xl">Ton reseau devient une equipe commerciale.</h2>
          <p className="mt-4 text-sm leading-7 text-white/88 sm:text-base">
            Popey analyse ton telephone et identifie qui peut te recommander, qui peut t ouvrir des portes, qui peut devenir
            un apporteur d affaires. Ensuite tu actives en 1 clic, tu suis les opportunites, tu touches ton chiffre.
          </p>
          <p className="mt-5 text-lg font-black text-cyan-100">Tu ne cherches plus des clients. Ton reseau te les envoie.</p>
        </section>

        <section className="mt-8">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Comment ca marche</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {howItWorks.map((step) => (
              <article key={step.title} className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <h3 className="text-lg font-black">{step.title}</h3>
                <ul className="mt-2 space-y-1 text-sm text-white/85">
                  {step.bullets.map((bullet) => (
                    <li key={bullet}>- {bullet}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <p className="mt-4 rounded-2xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm font-black text-emerald-100">
            Scan -&gt; Active -&gt; Recois -&gt; Encaisse
          </p>
        </section>

        <section className="mt-8 rounded-3xl border border-white/15 bg-white/5 p-6">
          <h2 className="text-2xl font-black sm:text-4xl">Pourquoi quelqu un t enverrait des clients ?</h2>
          <p className="mt-3 text-sm leading-7 text-white/88 sm:text-base">
            Parce que tout le monde y gagne: tu penses a quelqu un, il gagne, tout le monde est content.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/15 bg-black/20 p-3 text-sm">Commission simple (ex: 10%)</div>
            <div className="rounded-xl border border-white/15 bg-black/20 p-3 text-sm">Reconnaissance concrete</div>
            <div className="rounded-xl border border-white/15 bg-black/20 p-3 text-sm">Renvoi d ascenseur naturel</div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-fuchsia-300/25 bg-fuchsia-300/10 p-6">
          <h2 className="text-2xl font-black sm:text-4xl">Ton reseau travaille, meme quand tu ne fais rien</h2>
          <p className="mt-3 text-sm leading-7 text-white/88 sm:text-base">
            Tu actives 10 personnes. 3 deviennent actives. Elles pensent a toi dans leur quotidien. Tu recuperes des opportunites
            sans bouger.
          </p>
          <p className="mt-4 text-lg font-black text-fuchsia-100">Ce n est plus toi qui cherches. C est ton reseau qui detecte.</p>
        </section>

        <section className="mt-8 rounded-3xl border border-amber-300/30 bg-amber-300/10 p-6">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-100">Preuves (crucial)</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {proofs.map((proof) => (
              <blockquote key={proof} className="rounded-2xl border border-white/15 bg-black/20 p-4 text-sm text-white/92">
                &quot;{proof}&quot;
              </blockquote>
            ))}
          </div>
          <p className="mt-3 text-xs text-white/70">Ajoute rapidement: captures d opportunites et gains reels (meme petits).</p>
        </section>

        <section className="mt-8 rounded-3xl border border-cyan-300/25 bg-cyan-300/10 p-6">
          <h2 className="text-2xl font-black sm:text-4xl">Pas de spam. Pas de forcing.</h2>
          <p className="mt-3 text-sm leading-7 text-white/90 sm:text-base">
            Popey n envoie rien a ta place. Tu restes toujours en controle. Tu actives uniquement les bonnes personnes,
            avec un message humain.
          </p>
        </section>

        <section className="mt-8 rounded-3xl border border-white/15 bg-white/5 p-6 sm:p-8">
          <h2 className="text-2xl font-black sm:text-4xl">Et si toi aussi tu renvoyais l ascenseur ?</h2>
          <p className="mt-3 text-sm leading-7 text-white/88 sm:text-base">
            Quand quelqu un t envoie un client, tu comprends qu il y a des opportunites partout autour de toi.
            Avec Popey, tu peux recommander des contacts, creer des opportunites, et etre recompense.
          </p>
          <p className="mt-4 text-lg font-black text-cyan-100">Tu passes de receveur a connecteur.</p>
          <div className="mt-4 rounded-2xl border border-emerald-300/35 bg-emerald-300/10 p-4 text-sm text-emerald-100">
            Unlock produit suggere: Mode Eclaireur active apres 1 opportunite recue ou 1 deal signe.
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-emerald-300/30 bg-emerald-300/15 p-6 text-center sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-100">CTA final</p>
          <h2 className="mt-2 text-3xl font-black sm:text-5xl">Active ton reseau. Tes prochains clients sont deja dedans.</h2>
          <a
            href="/popey-human/smart-scan"
            className="mx-auto mt-6 inline-flex h-12 items-center justify-center rounded-xl border border-emerald-300/40 bg-emerald-300/25 px-7 text-sm font-black uppercase tracking-[0.08em] text-emerald-50 transition hover:bg-emerald-300/35"
          >
            Scanner mon telephone
          </a>
          <p className="mt-4 text-xs text-emerald-100/85">
            Promesse: Je t aide a activer les bonnes personnes autour de toi pour generer du business, sans prospecter.
          </p>
        </section>
      </div>
    </main>
  );
}
