"use client";

// Le tableau des villes : le lien d'espace municipal, et les deux réglages qui
// ne peuvent pas venir du code.
//
// LE LIEN EST MASQUÉ PAR DÉFAUT. Il contient un jeton qui donne le droit de
// publier au nom de la ville ; l'afficher en clair sur une page qu'on ouvre en
// réunion ou qu'on partage à l'écran le donnerait à qui regarde. On le révèle
// sur demande, et le bouton « Copier » évite d'avoir à le lire du tout.
import { useState } from "react";

export type VilleRow = {
  slug: string;
  nom: string;
  seuil: number;
  quartiers: string[];
  auteurNom: string;
  lienEspace: string;
  lienDirect: string;
  commerces: number;
  commercesSitues: number;
  publications: number;
  publicationsDuJour: number;
  abonnes: number;
  abonnesConfirmes: number;
};

function Ville({ v }: { v: VilleRow }) {
  const [seuil, setSeuil] = useState(v.seuil);
  const [quartiers, setQuartiers] = useState(v.quartiers.join(", "));
  const [auteur, setAuteur] = useState(v.auteurNom);
  const [visible, setVisible] = useState(false);
  const [copie, setCopie] = useState(false);
  const [etat, setEtat] = useState<"" | "envoi" | "ok" | "erreur">("");

  const enregistrer = async () => {
    setEtat("envoi");
    try {
      const r = await fetch("/api/admin/direct/ville", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          villeSlug: v.slug,
          seuilCompteur: seuil,
          quartiers: quartiers.split(",").map((q) => q.trim()).filter(Boolean),
          auteurNom: auteur.trim(),
        }),
      });
      setEtat(r.ok ? "ok" : "erreur");
    } catch {
      setEtat("erreur");
    }
  };

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(v.lienEspace);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      setVisible(true); // presse-papiers refusé → au moins qu'on puisse le lire
    }
  };

  // Le compteur ne s'affichera jamais si le seuil dépasse ce que la ville peut
  // produire. Le dire ici évite de chercher pendant des semaines pourquoi le
  // chiffre reste masqué.
  const seuilTropHaut = v.commerces > 0 && seuil > v.commerces;

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-lg font-black text-slate-950">{v.nom}</h2>
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">{v.slug}</code>
        <a href={v.lienDirect} target="_blank" rel="noreferrer" className="ml-auto text-xs font-bold text-emerald-700 underline">
          Ouvrir Le Direct ↗
        </a>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Commerces</p>
          <p className="text-xl font-black text-slate-900">{v.commerces}</p>
        </div>
        <div className="rounded-xl border bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Situés</p>
          <p className="text-xl font-black text-slate-900">{v.commercesSitues}</p>
          {v.commerces > 0 && v.commercesSitues === 0 && (
            // Sans coordonnées, aucune carte n'affichera jamais de distance.
            <p className="mt-0.5 text-[10px] leading-tight text-amber-700">géocodage en attente</p>
          )}
        </div>
        <div className="rounded-xl border bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Dans le fil</p>
          <p className="text-xl font-black text-slate-900">{v.publications}</p>
          <p className="mt-0.5 text-[10px] leading-tight text-slate-500">{v.publicationsDuJour} aujourd&apos;hui</p>
        </div>
        <div className="rounded-xl border bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Abonnés</p>
          <p className="text-xl font-black text-slate-900">{v.abonnesConfirmes}</p>
          {v.abonnes > v.abonnesConfirmes && (
            <p className="mt-0.5 text-[10px] leading-tight text-slate-500">
              +{v.abonnes - v.abonnesConfirmes} non confirmé{v.abonnes - v.abonnesConfirmes > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-dashed bg-slate-50 p-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Espace municipal</p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
          Ce lien donne le droit de publier au nom de la ville. À transmettre au service concerné, pas
          à afficher en réunion.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copier}
            className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white"
          >
            {copie ? "Copié ✓" : "Copier le lien"}
          </button>
          <button
            type="button"
            onClick={() => setVisible((x) => !x)}
            className="rounded-full border px-3 py-1.5 text-xs font-bold text-slate-700"
          >
            {visible ? "Masquer" : "Afficher"}
          </button>
        </div>
        {visible && (
          <code className="mt-2 block break-all rounded bg-white p-2 text-[11px] text-slate-700">{v.lienEspace}</code>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Seuil du compteur</span>
          <input
            type="number"
            min={1}
            max={200}
            value={seuil}
            onChange={(e) => setSeuil(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
          <span className="mt-1 block text-[10px] leading-tight text-slate-500">
            En dessous, « x choses se passent » cède la place à une phrase sans chiffre.
          </span>
          {seuilTropHaut && (
            <span className="mt-1 block text-[10px] font-bold leading-tight text-amber-700">
              Plus élevé que le nombre de commerces : le chiffre ne s&apos;affichera probablement jamais.
            </span>
          )}
        </label>

        <label className="block">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Quartiers</span>
          <input
            type="text"
            value={quartiers}
            onChange={(e) => setQuartiers(e.target.value)}
            placeholder="Centre-ville, Le Sablar…"
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
          <span className="mt-1 block text-[10px] leading-tight text-slate-500">
            Séparés par des virgules. Servent de repère quand la position est refusée.
          </span>
        </label>

        <label className="block">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Signature municipale</span>
          <input
            type="text"
            value={auteur}
            onChange={(e) => setAuteur(e.target.value)}
            placeholder={`Ville de ${v.nom}`}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
          <span className="mt-1 block text-[10px] leading-tight text-slate-500">
            Le nom affiché dans le fil sur ses publications.
          </span>
        </label>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={enregistrer}
          disabled={etat === "envoi"}
          className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:bg-slate-300"
        >
          {etat === "envoi" ? "Enregistrement…" : "Enregistrer"}
        </button>
        {etat === "ok" && <span className="text-xs font-bold text-emerald-700">Enregistré ✓</span>}
        {etat === "erreur" && <span className="text-xs font-bold text-red-600">Échec — réessayez.</span>}
      </div>
    </div>
  );
}

export function VilleReglages({ villes }: { villes: VilleRow[] }) {
  return (
    <div className="space-y-4">
      {villes.map((v) => (
        <Ville key={v.slug} v={v} />
      ))}
    </div>
  );
}
