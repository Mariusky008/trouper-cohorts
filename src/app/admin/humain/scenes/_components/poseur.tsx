"use client";

// LE POSEUR DE ZONE — la photo choisie (sa devanture ou sa photo ClikMe),
// quatre coins cliqués dessus, ajustables au doigt, le petit fantôme dans un
// angle si on le veut, et l'aperçu de l'affiche telle que le fil la montrera.
import { useRef, useState } from "react";
import { fantomeEnCoin, type Point, type Quad, type SceneVitrine } from "@/lib/direct/scenes-ville";
import { SceneDuFil } from "@/app/autour-de-moi/scene-ville";

const ESSAI_EXEMPLE: Record<string, string> = {
  visage: "/direct/accueil/coiffure-apres.jpg",
  "en-pied": "/direct/essai/mode-depot-apres.jpg",
  mains: "/direct/ongles2.jpeg",
};
const ORDRE = ["haut gauche", "haut droite", "bas droite", "bas gauche"];

export function PoseurDeZone({
  slug,
  nom,
  ville,
  metier,
  photos,
  zone,
  decor: decorPose,
  fantome: fantomePose,
  aReposer,
  cadrage,
  hote,
}: {
  slug: string;
  nom: string;
  ville: string;
  metier: string;
  photos: { quoi: string; url: string }[];
  zone?: Quad;
  decor?: string;
  fantome?: "gauche" | "droite";
  aReposer: boolean;
  cadrage: string;
  hote: string;
}) {
  const [couverture, setDecor] = useState(decorPose ?? photos[0].url);
  const [fantome, setFantome] = useState<"" | "gauche" | "droite">(fantomePose ?? "");
  const [coins, setCoins] = useState<Point[]>(zone ?? []);
  // `null` tant que la photo n'a pas dit sa forme : on ne clique pas avant.
  const [ratioLu, setRatio] = useState<number | null>(null);
  const ratio = ratioLu ?? 1.5;
  const pret = ratioLu !== null;
  const [tire, setTire] = useState<number | null>(null);
  const [etat, setEtat] = useState<"" | "envoi" | "ok" | "erreur">("");
  const cadre = useRef<HTMLDivElement | null>(null);

  const ici = (e: { clientX: number; clientY: number }): Point => {
    const r = cadre.current!.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    return [+x.toFixed(4), +y.toFixed(4)];
  };

  const enregistrer = async (avecZone: boolean) => {
    setEtat("envoi");
    try {
      const r = await fetch("/api/admin/direct/scenes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug,
          zone: avecZone ? { decor: couverture, ratio: +ratio.toFixed(4), coins, ...(fantome ? { fantome } : {}) } : null,
        }),
      });
      setEtat(r.ok ? "ok" : "erreur");
      if (r.ok && !avecZone) setCoins([]);
    } catch {
      setEtat("erreur");
    }
  };

  const complet = coins.length === 4;
  const apercu: SceneVitrine | null = complet
    ? {
        v: 2,
        rendu: "vitrine",
        decor: couverture,
        ratio,
        affiche: { coins: coins as Quad, cadrage: cadrage as SceneVitrine["affiche"]["cadrage"], mot: "" },
        ...(fantome ? { calques: [fantomeEnCoin(hote, fantome, ratio)] } : {}),
      }
    : null;

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-900">
          {nom} <span className="text-sm font-normal text-slate-500">· {metier} · {ville}</span>
        </h2>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${zone ? "bg-emerald-100 text-emerald-800" : aReposer ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-600"}`}>
          {zone ? "Zone posée" : aReposer ? "Photo changée : zone à reposer" : "Pas de zone"}
        </span>
      </header>
      {photos.length > 1 && (
        <div className="flex flex-wrap gap-2 text-sm">
          {photos.map((p) => (
            <button
              key={p.url}
              type="button"
              onClick={() => {
                if (p.url === couverture) return;
                // UNE AUTRE PHOTO, D'AUTRES COINS : la zone se repose.
                setDecor(p.url);
                setCoins([]);
                setRatio(null);
              }}
              className={`rounded-full border px-3 py-1 ${p.url === couverture ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300"}`}
            >
              {p.quoi}
            </button>
          ))}
        </div>
      )}
      <div
        key={couverture}
        ref={cadre}
        className="relative w-full touch-none select-none overflow-hidden rounded-xl"
        style={{ aspectRatio: String(ratio) }}
        onPointerDown={(e) => {
          if (!pret) return;
          if (coins.length < 4) setCoins((c) => [...c, ici(e)]);
        }}
        onPointerMove={(e) => {
          if (tire === null) return;
          const p = ici(e);
          setCoins((c) => c.map((x, i) => (i === tire ? p : x)));
        }}
        onPointerUp={() => setTire(null)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={couverture}
          alt={`Photo de ${nom}`}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
          // LA FORME VRAIE DE LA PHOTO, AVANT TOUT CLIC : sans elle, le cadre
          // la recadrerait et les coins seraient mesurés sur une autre image.
          // Lue au chargement, et au montage si elle était déjà là — une image
          // en cache se charge avant que React n'écoute son « load ».
          ref={(i) => {
            if (i?.complete && i.naturalWidth) {
              const r = i.naturalWidth / Math.max(1, i.naturalHeight);
              if (Math.abs(r - ratio) > 0.001) setRatio(r);
            }
          }}
          onLoad={(e) => setRatio(e.currentTarget.naturalWidth / Math.max(1, e.currentTarget.naturalHeight))}
        />
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {coins.length > 1 && (
            <polygon
              points={coins.map(([x, y]) => `${x * 100},${y * 100}`).join(" ")}
              fill="rgba(245,162,58,.28)"
              stroke="#F5A23A"
              strokeWidth=".5"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
        {coins.map(([x, y], i) => (
          <button
            key={i}
            type="button"
            aria-label={`Coin ${ORDRE[i]}`}
            className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-white bg-amber-500 text-[10px] font-bold text-white shadow"
            style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
            onPointerDown={(e) => {
              e.stopPropagation();
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              setTire(i);
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <p className="text-sm text-slate-600">
        {complet ? "Fais glisser un coin pour l’ajuster." : `Clique le coin ${ORDRE[coins.length]} (${coins.length + 1}/4).`}
      </p>
      <label className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
        Son petit fantôme :
        <select value={fantome} onChange={(e) => setFantome(e.target.value as "" | "gauche" | "droite")} className="rounded-lg border border-slate-300 px-2 py-1">
          <option value="">aucun (sa photo ClikMe a souvent déjà le sien)</option>
          <option value="gauche">dans l’angle gauche</option>
          <option value="droite">dans l’angle droit</option>
        </select>
      </label>
      {apercu && (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-700">Aperçu avec un essai d’exemple :</p>
          <div className="max-w-sm">
            <SceneDuFil scene={apercu} photo={ESSAI_EXEMPLE[cadrage] ?? ESSAI_EXEMPLE.visage} repli={{ essai: true }} />
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={!complet || etat === "envoi"} onClick={() => void enregistrer(true)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">
          Enregistrer la zone
        </button>
        <button type="button" onClick={() => setCoins([])} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          Recommencer
        </button>
        {(zone || aReposer) && (
          <button type="button" onClick={() => void enregistrer(false)} className="rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-700">
            Retirer la zone
          </button>
        )}
        {etat === "ok" && <span className="self-center text-sm text-emerald-700">Enregistré.</span>}
        {etat === "erreur" && <span className="self-center text-sm text-rose-700">Échec de l’enregistrement.</span>}
      </div>
    </section>
  );
}
