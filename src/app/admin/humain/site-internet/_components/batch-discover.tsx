"use client";

// Découverte EN LOT : lance la recherche Apify pour une matrice métiers × villes,
// et crée automatiquement les prospects « à cibler » (Famille A = pas de vrai
// site ; Famille B = site avec un défaut réel mesuré — sinon écarté).
// L'orchestration est côté navigateur (séquentielle) : chaque recherche prend
// 20-60 s et dépasserait le délai d'un serveur → c'est cet onglet qui pilote la
// file. Garde-le ouvert pendant que ça tourne. « +N de plus » relance sans
// jamais recréer les commerces déjà faits.
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  METIER_LABELS,
  METIER_DEFAULT_ON,
  resolveMetier,
  metierFamily,
  FAMILY_LABEL,
  type MetierFamily,
} from "@/lib/site-internet/metier-profiles";

// Couleurs de la pastille « famille » (ce que la lettre a le droit de dire).
const FAM_BADGE: Record<MetierFamily, string> = {
  A: "bg-amber-100 text-amber-700",
  B: "bg-teal-100 text-teal-700",
  C: "bg-indigo-100 text-indigo-700",
  D: "bg-slate-200 text-slate-700",
};
const familyOf = (label: string): MetierFamily => metierFamily(resolveMetier(label).entry);

// Tous les métiers connus (source unique : metier-profiles). Cochés par défaut =
// les métiers « réserve » prêts (bien-être, beauté, santé) ; les autres (artisans,
// droit) sont disponibles mais décochés.
const METIERS_DEFAUT = METIER_LABELS;
const DEFAULT_ON = new Set(METIER_DEFAULT_ON);
const VILLES_DEFAUT = ["Dax", "Bayonne", "Anglet", "Biarritz", "Pau", "Bordeaux"];

type ComboState = {
  status: "idle" | "running" | "done" | "error";
  created: number; // cumulés sur les relances
  excludedFine: number; // site correct → écarté (Famille B)
  failed: number;
  exhausted: boolean; // plus de nouvelle cible active
  note: string;
};

const comboKey = (ville: string, metier: string) => `${ville}::${metier}`;
const EMPTY: ComboState = { status: "idle", created: 0, excludedFine: 0, failed: 0, exhausted: false, note: "" };

export function BatchDiscover() {
  const router = useRouter();
  const [metiers, setMetiers] = useState<string[]>(METIERS_DEFAUT);
  const [villes, setVilles] = useState<string[]>(VILLES_DEFAUT);
  const [selMetiers, setSelMetiers] = useState<Record<string, boolean>>(
    () => Object.fromEntries(METIERS_DEFAUT.map((m) => [m, DEFAULT_ON.has(m)]))
  );
  const [selVilles, setSelVilles] = useState<Record<string, boolean>>(
    () => Object.fromEntries(VILLES_DEFAUT.map((v) => [v, true]))
  );
  const [batchSize, setBatchSize] = useState(8);
  const [maxRating, setMaxRating] = useState("");
  const [combos, setCombos] = useState<Record<string, ComboState>>({});
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [newMetier, setNewMetier] = useState("");
  const [newVille, setNewVille] = useState("");
  const stopRef = useRef(false);

  const activeMetiers = useMemo(() => metiers.filter((m) => selMetiers[m]), [metiers, selMetiers]);
  const activeVilles = useMemo(() => villes.filter((v) => selVilles[v]), [villes, selVilles]);
  const comboCount = activeMetiers.length * activeVilles.length;

  const addLog = (line: string) =>
    setLog((l) => [...l.slice(-240), line]);

  const patchCombo = (key: string, patch: Partial<ComboState>) =>
    setCombos((c) => ({ ...c, [key]: { ...(c[key] ?? EMPTY), ...patch } }));

  const bumpCombo = (key: string, add: { created: number; excludedFine: number; failed: number }) =>
    setCombos((c) => {
      const prev = c[key] ?? EMPTY;
      return {
        ...c,
        [key]: {
          ...prev,
          created: prev.created + add.created,
          excludedFine: prev.excludedFine + add.excludedFine,
          failed: prev.failed + add.failed,
        },
      };
    });

  // ── Une combinaison ville × métier : 1 recherche → jusqu'à N créations ──────
  async function runCombo(ville: string, metier: string) {
    if (stopRef.current) return;
    const key = comboKey(ville, metier);
    patchCombo(key, { status: "running", note: "" });
    addLog(`🔎 ${ville} · ${metier} — recherche Apify…`);

    let candidates: Array<Record<string, unknown>> = [];
    try {
      const r = await fetch("/api/admin/humain/site-internet/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ville, activite: metier, maxRating: maxRating || undefined }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        patchCombo(key, { status: "error", note: String(j?.error || `Erreur ${r.status}`) });
        addLog(`❌ ${ville} · ${metier} : ${j?.error || r.status}`);
        return;
      }
      candidates = Array.isArray(j.candidates) ? j.candidates : [];
      if (candidates.length === 0) {
        patchCombo(key, { status: "done", note: String(j?.error || "Aucun commerce.") });
        addLog(`⚠️ ${ville} · ${metier} : ${j?.error || "aucun commerce"}`);
        return;
      }
    } catch {
      patchCombo(key, { status: "error", note: "réseau" });
      addLog(`❌ ${ville} · ${metier} : réseau`);
      return;
    }

    // Cibles fraîches et actives (le filtre anti-piège est déjà appliqué serveur).
    const fresh = candidates.filter((c) => c.active && !c.alreadyProspect);
    const pick = fresh.slice(0, batchSize);
    if (pick.length === 0) {
      patchCombo(key, { status: "done", exhausted: true, note: "Plus de nouvelle cible active." });
      addLog(`✅ ${ville} · ${metier} : plus de nouvelle cible active.`);
      router.refresh();
      return;
    }

    let created = 0;
    let excludedFine = 0;
    let failed = 0;
    for (const c of pick) {
      if (stopRef.current) break;
      const name = String(c.name || "");
      const hasSite = Boolean(c.hasSite);
      addLog(`  → ${name}${hasSite ? " (a un site)" : ""}…`);
      try {
        const dr = await fetch("/api/admin/humain/site-internet/diagnose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessName: name,
            city: ville,
            activite: metier,
            variant: hasSite ? undefined : "A",
            noInsertOnExclu: true,
            prefetched: {
              website: c.website,
              placeId: c.placeId,
              rating: c.rating,
              reviews: c.reviews,
              address: c.address,
              concurrents: c.competitors,
            },
          }),
        });
        const dj = await dr.json().catch(() => ({}));
        if (dj?.notCreated) {
          excludedFine++;
          addLog(`     ↷ écarté (site correct, rien à vendre honnêtement)`);
        } else if (dj?.slug) {
          created++;
          addLog(`     ✓ prospect créé`);
        } else {
          failed++;
          addLog(`     ✕ ${dj?.error || dr.status}`);
        }
      } catch {
        failed++;
        addLog(`     ✕ réseau`);
      }
    }
    bumpCombo(key, { created, excludedFine, failed });
    patchCombo(key, { status: "done", exhausted: pick.length < batchSize && fresh.length <= batchSize });
    addLog(`✅ ${ville} · ${metier} : ${created} créé(s), ${excludedFine} écarté(s), ${failed} échec(s).`);
    router.refresh();
  }

  async function runVille(ville: string) {
    if (busy) return;
    setBusy(true);
    stopRef.current = false;
    for (const m of activeMetiers) {
      if (stopRef.current) break;
      await runCombo(ville, m);
    }
    setBusy(false);
    addLog(`— ${ville} : terminé —`);
  }

  async function runAll() {
    if (busy) return;
    setBusy(true);
    stopRef.current = false;
    for (const v of activeVilles) {
      if (stopRef.current) break;
      for (const m of activeMetiers) {
        if (stopRef.current) break;
        await runCombo(v, m);
      }
    }
    setBusy(false);
    addLog(`— Tout terminé —`);
  }

  const stop = () => {
    stopRef.current = true;
    addLog("⏹ Arrêt demandé (fin du commerce en cours)…");
  };

  const toggle = (setter: React.Dispatch<React.SetStateAction<Record<string, boolean>>>, key: string) =>
    setter((p) => ({ ...p, [key]: !p[key] }));

  const addMetier = () => {
    const m = newMetier.trim().toLowerCase();
    if (!m || metiers.includes(m)) return;
    setMetiers((l) => [...l, m]);
    setSelMetiers((s) => ({ ...s, [m]: true }));
    setNewMetier("");
  };
  const addVille = () => {
    const v = newVille.trim();
    if (!v || villes.includes(v)) return;
    setVilles((l) => [...l, v]);
    setSelVilles((s) => ({ ...s, [v]: true }));
    setNewVille("");
  };

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">Découverte en lot</p>
      <h2 className="mt-1 text-xl font-black sm:text-2xl">Lancer les recherches, secteur par secteur</h2>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
        Coche les métiers et les villes, puis lance. On garde uniquement les commerces <strong>encore en activité</strong> (fiche non fermée, avis récent ou horaires) qui ont un <strong>vrai besoin</strong> : pas de site à eux, ou un site avec un défaut réel. Les prospects se créent tout seuls — tu n&apos;as plus qu&apos;à ouvrir la lettre.
      </p>
      <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
        ⚠️ Garde cet onglet <strong>ouvert</strong> pendant que ça tourne (chaque recherche = 20-60 s). Lance plutôt <strong>ville par ville</strong> pour suivre les résultats au fur et à mesure.
      </p>

      {/* Sélecteurs */}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Métiers ({activeMetiers.length})</p>
          <p className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
            {(["A", "B", "C", "D"] as const).map((f) => (
              <span key={f} className="inline-flex items-center gap-1">
                <span className={`inline-flex h-4 w-4 items-center justify-center rounded text-[9px] font-black ${FAM_BADGE[f]}`}>{f}</span>
                {FAMILY_LABEL[f]}
              </span>
            ))}
          </p>
          <div className="flex flex-wrap gap-2">
            {metiers.map((m) => {
              const fam = familyOf(m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggle(setSelMetiers, m)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${selMetiers[m] ? "border-sky-600 bg-sky-50 text-sky-800" : "border-slate-200 bg-white text-slate-400"}`}
                >
                  <span className={`inline-flex h-4 w-4 items-center justify-center rounded text-[9px] font-black ${FAM_BADGE[fam]}`} title={FAMILY_LABEL[fam]}>{fam}</span>
                  {m}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex gap-2">
            <input value={newMetier} onChange={(e) => setNewMetier(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addMetier()} placeholder="+ métier" className="h-8 flex-1 rounded-lg border bg-background px-2 text-xs" />
            <button type="button" onClick={addMetier} className="rounded-lg border px-2 text-xs font-semibold text-slate-600">Ajouter</button>
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Villes ({activeVilles.length})</p>
          <div className="flex flex-wrap gap-2">
            {villes.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => toggle(setSelVilles, v)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${selVilles[v] ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-400"}`}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input value={newVille} onChange={(e) => setNewVille(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addVille()} placeholder="+ ville" className="h-8 flex-1 rounded-lg border bg-background px-2 text-xs" />
            <button type="button" onClick={addVille} className="rounded-lg border px-2 text-xs font-semibold text-slate-600">Ajouter</button>
          </div>
        </div>
      </div>

      {/* Réglages + lancement global */}
      <div className="mt-5 flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold text-slate-600">
          Cibles par secteur
          <input type="number" min={1} max={30} value={batchSize} onChange={(e) => setBatchSize(Math.max(1, Math.min(30, Number(e.target.value) || 8)))} className="ml-2 h-9 w-16 rounded-lg border bg-background px-2 text-sm" />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Note max
          <select value={maxRating} onChange={(e) => setMaxRating(e.target.value)} className="ml-2 h-9 rounded-lg border bg-background px-2 text-sm">
            <option value="">Toutes</option>
            <option value="4">≤ 4,0</option>
            <option value="4.5">≤ 4,5</option>
          </select>
        </label>
        <button
          type="button"
          onClick={runAll}
          disabled={busy || comboCount === 0}
          className="rounded-full bg-sky-700 px-5 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "En cours…" : `🚀 Tout lancer (${comboCount} recherches)`}
        </button>
        {busy && (
          <button type="button" onClick={stop} className="rounded-full border border-red-300 px-4 py-2 text-sm font-bold text-red-700">
            ⏹ Arrêter
          </button>
        )}
        <span className="text-xs text-slate-500">≈ {comboCount} recherches Apify + jusqu&apos;à {comboCount * batchSize} créations</span>
      </div>

      {/* Grille par ville : lancer une ville, voir l'avancement de chaque métier */}
      {activeVilles.length > 0 && (
        <div className="mt-6 space-y-4">
          {activeVilles.map((ville) => (
            <div key={ville} className="rounded-xl border bg-slate-50/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900">{ville}</h3>
                <button
                  type="button"
                  onClick={() => runVille(ville)}
                  disabled={busy || activeMetiers.length === 0}
                  className="rounded-full bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Lancer {ville} ({activeMetiers.length})
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {activeMetiers.map((m) => {
                  const st = combos[comboKey(ville, m)] ?? EMPTY;
                  return (
                    <div key={m} className="flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-xs">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-800">{m}</div>
                        <div className="text-[11px] text-slate-500">
                          {st.status === "running" && <span className="text-sky-600">recherche…</span>}
                          {st.status === "error" && <span className="text-red-600">{st.note || "erreur"}</span>}
                          {st.status !== "running" && st.status !== "error" && (
                            <>
                              <span className="font-bold text-emerald-700">{st.created}</span> créé(s)
                              {st.excludedFine > 0 && <span className="text-slate-400"> · {st.excludedFine} écarté(s)</span>}
                              {st.failed > 0 && <span className="text-red-500"> · {st.failed} échec(s)</span>}
                              {st.exhausted && <span className="text-slate-400"> · épuisé</span>}
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (busy) return;
                          setBusy(true);
                          stopRef.current = false;
                          await runCombo(ville, m);
                          setBusy(false);
                        }}
                        disabled={busy}
                        className="shrink-0 rounded-full border border-sky-300 px-2.5 py-1 text-[11px] font-bold text-sky-700 disabled:opacity-50"
                      >
                        {st.created > 0 || st.status === "done" ? `+${batchSize} de plus` : `Découvrir ${batchSize}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Journal */}
      {log.length > 0 && (
        <div className="mt-6">
          <p className="mb-1 text-xs font-black uppercase tracking-wide text-slate-500">Journal</p>
          <pre className="max-h-64 overflow-auto rounded-lg border bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">
            {log.join("\n")}
          </pre>
        </div>
      )}
    </div>
  );
}
