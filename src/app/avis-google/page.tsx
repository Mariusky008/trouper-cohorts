export default function AvisGooglePage() {
  return (
    <main className="bg-white text-neutral-900">
      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section className="bg-neutral-900 text-white py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block bg-neutral-800 border border-neutral-700 text-emerald-400 text-xs font-semibold tracking-widest uppercase rounded-full px-4 py-1.5 mb-6">
            ⭐ SPÉCIALISTE AVIS GOOGLE
          </span>
          <h1 className="font-[family-name:var(--font-cormorant)] text-5xl sm:text-7xl font-light leading-tight mb-6">
            Devenez LA référence<br className="hidden sm:block" /> Google de votre ville
          </h1>
          <p className="text-neutral-300 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
            Vos clients partagent leur expérience automatiquement via WhatsApp.
            Vous obtenez +10 avis réels par mois, sans effort.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a
              href="https://wa.me/33622129675"
              className="bg-white text-neutral-900 rounded-full px-8 py-3 font-semibold hover:bg-neutral-100 transition-colors"
            >
              Démarrer maintenant — 79€/mois
            </a>
            <a
              href="#comment-ca-marche"
              className="border border-white text-white rounded-full px-8 py-3 font-semibold hover:bg-white hover:text-neutral-900 transition-colors"
            >
              Voir comment ça marche ↓
            </a>
          </div>
          <p className="text-neutral-400 text-sm">
            ✓ Sans engagement &nbsp;·&nbsp; ✓ Résultats dès le 1er mois &nbsp;·&nbsp; ✓ Zéro effort de votre part
          </p>
        </div>
      </section>

      {/* ─── PROBLEM ──────────────────────────────────────────────────────── */}
      <section className="bg-white py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="font-[family-name:var(--font-cormorant)] text-4xl sm:text-5xl font-light text-center mb-12">
            Vos concurrents vous passent devant sur Google
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="text-3xl mb-4">📉</div>
              <p className="text-neutral-700 leading-relaxed">
                <strong className="block text-neutral-900 mb-1">60 avis contre 300</strong>
                Le client choisit toujours celui qui a le plus d&rsquo;avis. C&rsquo;est mathématique.
              </p>
            </div>
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="text-3xl mb-4">🔇</div>
              <p className="text-neutral-700 leading-relaxed">
                <strong className="block text-neutral-900 mb-1">Le silence des clients satisfaits</strong>
                Les mauvaises expériences finissent sur Google. Les bonnes restent silencieuses.
              </p>
            </div>
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="text-3xl mb-4">⬇️</div>
              <p className="text-neutral-700 leading-relaxed">
                <strong className="block text-neutral-900 mb-1">Google vous déclasse</strong>
                Sans avis récents, Google vous déclasse au profit de vos concurrents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="comment-ca-marche" className="bg-slate-50 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="font-[family-name:var(--font-cormorant)] text-4xl sm:text-5xl font-light text-center mb-12">
            3 étapes, 10 secondes par client
          </h2>
          <div className="grid sm:grid-cols-3 gap-8 mb-10">
            <div className="text-center">
              <div className="text-5xl mb-4">📱</div>
              <div className="text-emerald-600 font-semibold text-sm uppercase tracking-wide mb-2">Étape 1</div>
              <h3 className="font-semibold text-lg mb-2">Vous saisissez</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Après chaque prestation, vous notez le prénom et numéro du client.
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">💬</div>
              <div className="text-emerald-600 font-semibold text-sm uppercase tracking-wide mb-2">Étape 2</div>
              <h3 className="font-semibold text-lg mb-2">On envoie automatiquement</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Le lendemain, votre client reçoit un WhatsApp avec un bouton pour laisser son avis.
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">📈</div>
              <div className="text-emerald-600 font-semibold text-sm uppercase tracking-wide mb-2">Étape 3</div>
              <h3 className="font-semibold text-lg mb-2">Vous montez dans Google</h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                Les avis s&rsquo;accumulent. Vous remontez. Les nouveaux clients vous trouvent.
              </p>
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center max-w-2xl mx-auto">
            <p className="text-emerald-800 font-medium">
              Les clients insatisfaits ? Leur message vous arrive en privé — vous gérez avant que ça devienne public.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 500 REVIEWS ARGUMENT ────────────────────────────────────────── */}
      <section className="bg-neutral-900 text-white py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-[family-name:var(--font-cormorant)] text-4xl sm:text-6xl font-light mb-8">
            500 avis : le seuil où vous devenez imbattable
          </h2>
          <p className="text-neutral-300 text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
            Dans votre ville, combien de concurrents ont plus de 200 avis ? Un ou deux.
            Celui qui en a 500 devient LA référence. Les autres travaillent pour lui.
            À 79€/mois, vous y êtes en moins de 4 ans — et vous prenez de l&rsquo;avance dès le 6ème mois.
          </p>
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="bg-neutral-800 rounded-2xl p-6">
              <div className="text-emerald-400 text-4xl font-bold mb-2">+10</div>
              <div className="text-neutral-300 text-sm">avis / mois en moyenne</div>
            </div>
            <div className="bg-neutral-800 rounded-2xl p-6">
              <div className="text-emerald-400 text-4xl font-bold mb-2">4,6★</div>
              <div className="text-neutral-300 text-sm">note moyenne de nos clients</div>
            </div>
            <div className="bg-neutral-800 rounded-2xl p-6">
              <div className="text-emerald-400 text-4xl font-bold mb-2">J+30</div>
              <div className="text-neutral-300 text-sm">premiers résultats dès le 1er mois</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHAT'S INCLUDED ─────────────────────────────────────────────── */}
      <section className="bg-white py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="font-[family-name:var(--font-cormorant)] text-4xl sm:text-5xl font-light text-center mb-12">
            Ce qui est inclus dans votre abonnement
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {[
              "Envois WhatsApp automatiques J+1 et J+6",
              "Page de filtrage (les insatisfaits restent privés)",
              "Tableau de bord avec vos stats en temps réel",
              "Rapport mensuel d'évolution",
              "Réponse à vos avis Google (1x/semaine)",
              "Support WhatsApp direct avec Jean-Philippe",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 p-4 rounded-xl bg-slate-50">
                <span className="text-emerald-600 font-bold mt-0.5">✅</span>
                <span className="text-neutral-700 text-sm leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ──────────────────────────────────────────────────────── */}
      <section className="bg-slate-50 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="max-w-md mx-auto">
            <div className="rounded-2xl border-2 border-neutral-900 bg-white p-8 shadow-lg text-center">
              <div className="text-5xl font-bold mb-1">79€</div>
              <div className="text-neutral-500 mb-2">/ mois</div>
              <div className="text-sm text-neutral-500 mb-6">Sans engagement — résiliez quand vous voulez</div>
              <ul className="text-left space-y-3 mb-8">
                {[
                  "Envois WhatsApp automatiques J+1 et J+6",
                  "Page de filtrage (les insatisfaits restent privés)",
                  "Tableau de bord avec vos stats en temps réel",
                  "Rapport mensuel d'évolution",
                  "Réponse à vos avis Google (1x/semaine)",
                  "Support WhatsApp direct avec Jean-Philippe",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-neutral-700">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href="https://wa.me/33622129675"
                className="block w-full bg-neutral-900 text-white rounded-full px-8 py-3 font-semibold hover:bg-neutral-700 transition-colors text-center mb-4"
              >
                Démarrer maintenant
              </a>
              <a
                href="https://wa.me/33622129675"
                className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                ou contactez Jean-Philippe sur WhatsApp →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ROI CALCULATOR ───────────────────────────────────────────────── */}
      <section className="bg-white py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="font-[family-name:var(--font-cormorant)] text-4xl sm:text-5xl font-light text-center mb-12">
            Calculez votre retour sur investissement
          </h2>
          <div className="max-w-2xl mx-auto">
            <div className="grid sm:grid-cols-3 gap-4 mb-8 text-center">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="text-2xl font-bold text-neutral-900 mb-1">50€ à 200€</div>
                <div className="text-sm text-neutral-500">de chiffre d&rsquo;affaires par nouveau client grâce à Google</div>
              </div>
              <div className="flex items-center justify-center text-3xl text-neutral-300 font-light">vs</div>
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="text-2xl font-bold text-emerald-600 mb-1">79€</div>
                <div className="text-sm text-neutral-500">par mois pour notre service</div>
              </div>
            </div>
            <div className="bg-neutral-900 text-white rounded-2xl p-8 text-center mb-6">
              <p className="text-xl font-semibold mb-2">
                Il suffit d&rsquo;1 nouveau client par mois pour être rentable.
              </p>
            </div>
            <p className="text-center text-emerald-700 font-semibold text-lg">
              La plupart de nos clients constatent 3 à 5 nouveaux clients dès le 2ème mois.
            </p>
          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="bg-white py-16 sm:py-24 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="font-[family-name:var(--font-cormorant)] text-4xl sm:text-5xl font-light text-center mb-12">
            Questions fréquentes
          </h2>
          <div className="max-w-2xl mx-auto space-y-3">
            <details className="group rounded-2xl border bg-white overflow-hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer font-semibold text-neutral-900 hover:bg-slate-50 transition-colors list-none">
                Est-ce que mes clients vont trouver ça bizarre ?
                <span className="text-neutral-400 group-open:rotate-180 transition-transform text-lg">↓</span>
              </summary>
              <div className="px-6 pb-6 text-neutral-600 leading-relaxed text-sm">
                Non, le message WhatsApp est naturel et personnalisé avec le nom de votre établissement.
                Le taux de clic est de 40% en moyenne.
              </div>
            </details>
            <details className="group rounded-2xl border bg-white overflow-hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer font-semibold text-neutral-900 hover:bg-slate-50 transition-colors list-none">
                Et si un client est insatisfait ?
                <span className="text-neutral-400 group-open:rotate-180 transition-transform text-lg">↓</span>
              </summary>
              <div className="px-6 pb-6 text-neutral-600 leading-relaxed text-sm">
                Il ne va pas sur Google — il vous envoie un message privé. Vous gérez le problème directement.
                Seuls les clients satisfaits laissent un avis public.
              </div>
            </details>
            <details className="group rounded-2xl border bg-white overflow-hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer font-semibold text-neutral-900 hover:bg-slate-50 transition-colors list-none">
                Je dois installer quelque chose ?
                <span className="text-neutral-400 group-open:rotate-180 transition-transform text-lg">↓</span>
              </summary>
              <div className="px-6 pb-6 text-neutral-600 leading-relaxed text-sm">
                Non. Juste accéder à un formulaire sur votre téléphone pour noter prénom + numéro après chaque client.
                10 secondes.
              </div>
            </details>
            <details className="group rounded-2xl border bg-white overflow-hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer font-semibold text-neutral-900 hover:bg-slate-50 transition-colors list-none">
                Combien de temps avant de voir des résultats ?
                <span className="text-neutral-400 group-open:rotate-180 transition-transform text-lg">↓</span>
              </summary>
              <div className="px-6 pb-6 text-neutral-600 leading-relaxed text-sm">
                Les premiers avis arrivent dans les 48h suivant le lancement. En général +10 avis dès le 1er mois.
              </div>
            </details>
            <details className="group rounded-2xl border bg-white overflow-hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer font-semibold text-neutral-900 hover:bg-slate-50 transition-colors list-none">
                Sans engagement, ça veut dire quoi ?
                <span className="text-neutral-400 group-open:rotate-180 transition-transform text-lg">↓</span>
              </summary>
              <div className="px-6 pb-6 text-neutral-600 leading-relaxed text-sm">
                Vous payez mois par mois. Vous arrêtez quand vous voulez, sans frais ni justification.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="bg-neutral-900 text-white py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-[family-name:var(--font-cormorant)] text-4xl sm:text-5xl font-light mb-6">
            Prêt à devenir la référence de votre ville ?
          </h2>
          <p className="text-neutral-400 mb-8 text-lg">
            Réponse garantie sous 2h
          </p>
          <a
            href="https://wa.me/33622129675"
            className="inline-flex items-center gap-2 bg-white text-neutral-900 rounded-full px-8 py-4 font-semibold hover:bg-neutral-100 transition-colors text-lg"
          >
            💬 Contacter Jean-Philippe sur WhatsApp
          </a>
        </div>
      </section>
    </main>
  );
}
