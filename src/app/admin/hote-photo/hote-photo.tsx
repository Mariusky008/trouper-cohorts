"use client";

// 👻 L'HÔTE D'UNE PHOTO CLIKME — le voir, relancer le modèle, ou l'entourer.
//
// ON DESSINE SUR LA PHOTO ENTIÈRE, telle qu'elle a été rendue — pas sur la
// page, qui la recadre selon l'écran. Les coordonnées sont donc des fractions
// de l'image (0 à 1), exactement ce que la page lit ensuite (`couvertureHote`).
import { useEffect, useRef, useState } from "react";

type Boite = { x: number; y: number; w: number; h: number };
type Etat = {
  url?: string;
  hote?: Boite;
  hoteEssais?: number;
  hoteAt?: string;
  hoteErreur?: string;
  hoteMain?: boolean;
  etat?: string;
};

export function HotePhoto({ raccourcis }: { raccourcis: { slug: string; nom: string }[] }) {
  const [slug, setSlug] = useState("");
  const [saisie, setSaisie] = useState("");
  const [nom, setNom] = useState("");
  const [etat, setEtat] = useState<Etat | null>(null);
  const [message, setMessage] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [trace, setTrace] = useState<Boite | null>(null);
  const depart = useRef<{ x: number; y: number } | null>(null);
  const cadre = useRef<HTMLDivElement>(null);

  const charger = async (s: string) => {
    setSlug(s);
    setTrace(null);
    setMessage("");
    setEtat(null);
    const r = await fetch(`/api/admin/direct/hote?slug=${encodeURIComponent(s)}`, { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMessage(j.erreur ?? "lecture impossible");
      return;
    }
    setNom(j.nom ?? s);
    setEtat(j.etat ?? null);
  };

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("slug");
    if (s) void charger(s);
  }, []);

  const agir = async (corps: Record<string, unknown>, ok: string) => {
    setOccupe(true);
    setMessage("");
    try {
      const r = await fetch("/api/admin/direct/hote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, ...corps }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setMessage(j.erreur ?? "échec");
      else {
        setEtat(j.etat);
        setTrace(null);
        setMessage(j.etat?.hote ? ok : `Le modèle n'a rien trouvé : ${j.etat?.hoteErreur ?? "sans raison donnée"}.`);
      }
    } finally {
      setOccupe(false);
    }
  };

  /** Un point du doigt ou de la souris, en fraction de la photo. */
  const point = (e: React.PointerEvent) => {
    const r = cadre.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
    };
  };

  const boite = trace ?? etat?.hote ?? null;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-black">Le fantôme propriétaire, sur la photo ClikMe</h1>
      <p className="mt-1 text-sm text-slate-600">
        Il ne salue et ne fait entrer que si l’on sait où la photo le peint. Choisissez une page, puis entourez le
        fantôme propriétaire (celui de la porte ou du comptoir) en glissant sur la photo, et enregistrez.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {raccourcis.map((r) => (
          <button
            key={r.slug}
            type="button"
            onClick={() => void charger(r.slug)}
            className={`rounded-full border px-3 py-1.5 text-sm ${slug === r.slug ? "border-pink-500 bg-pink-50" : ""}`}
          >
            {r.nom}
          </button>
        ))}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (saisie.trim()) void charger(saisie.trim());
          }}
        >
          <input
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            placeholder="adresse de la page (ex. le-bordeaux-307d33)"
            className="w-72 rounded-md border px-3 py-1.5 text-sm"
          />
          <button type="submit" className="rounded-md border px-3 py-1.5 text-sm">
            Ouvrir
          </button>
        </form>
      </div>

      {message && <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900">{message}</p>}

      {slug && etat && (
        <section className="mt-6">
          <h2 className="text-lg font-bold">{nom}</h2>
          <ul className="mt-1 text-sm text-slate-600">
            <li>
              Hôte :{" "}
              {etat.hote ? (
                <b className="text-emerald-700">repéré{etat.hoteMain ? " à la main" : " par le modèle"}</b>
              ) : (
                <b className="text-rose-700">pas repéré</b>
              )}
            </li>
            <li>
              Essais du modèle : {etat.hoteEssais ?? 0}
              {etat.hoteAt ? ` — le dernier le ${new Date(etat.hoteAt).toLocaleString("fr-FR")}` : ""}
            </li>
            {etat.hoteErreur && <li>Dernière raison : {etat.hoteErreur}</li>}
          </ul>

          {!etat.url ? (
            <p className="mt-4 text-sm">Cette page n’a pas encore de photo ClikMe.</p>
          ) : (
            <>
              <div
                ref={cadre}
                className="relative mt-4 inline-block max-w-full cursor-crosshair touch-none select-none"
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  depart.current = point(e);
                  setTrace({ ...depart.current, w: 0, h: 0 });
                }}
                onPointerMove={(e) => {
                  if (!depart.current) return;
                  const a = depart.current;
                  const b = point(e);
                  setTrace({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) });
                }}
                onPointerUp={() => {
                  depart.current = null;
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={etat.url} alt="" draggable={false} className="block max-h-[75vh] w-auto max-w-full" />
                {boite && (
                  <span
                    className={`pointer-events-none absolute border-4 ${trace ? "border-pink-500" : "border-emerald-500"}`}
                    style={{
                      left: `${boite.x * 100}%`,
                      top: `${boite.y * 100}%`,
                      width: `${boite.w * 100}%`,
                      height: `${boite.h * 100}%`,
                    }}
                  />
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={occupe || !trace || trace.w < 0.03 || trace.h < 0.03}
                  onClick={() => void agir({ action: "poser", boite: trace }, "Enregistré : il saluera depuis cette place.")}
                  className="rounded-md bg-pink-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
                >
                  Enregistrer ce cadre
                </button>
                <button
                  type="button"
                  disabled={occupe}
                  onClick={() => void agir({ action: "relancer" }, "Le modèle l’a trouvé.")}
                  className="rounded-md border px-4 py-2 text-sm disabled:opacity-40"
                >
                  {occupe ? "…" : "Relancer le modèle"}
                </button>
                <a
                  href={`/site-internet/apercu/${slug}?via=affiche`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border px-4 py-2 text-sm"
                >
                  Voir la page
                </a>
              </div>
            </>
          )}
        </section>
      )}
    </main>
  );
}
