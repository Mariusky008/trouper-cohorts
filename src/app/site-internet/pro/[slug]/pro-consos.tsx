"use client";

// Espace Pro — « 🎁 Mes consos offertes ». Ce que le bar offre d'habitude quand
// sa soirée est calme : combien, quoi, combien de temps le code vaut.
// Voir `lib/site-internet/consos-offertes.ts`.
import { useEffect, useState } from "react";
import { REGLAGES_CONSOS_PAR_DEFAUT, type ReglagesConsos } from "@/lib/site-internet/consos-offertes";

export function ProConsos({ slug, token }: { slug: string; token: string }) {
  const [r, setR] = useState<ReglagesConsos>(REGLAGES_CONSOS_PAR_DEFAUT);
  const [occupe, setOccupe] = useState(false);
  const [mot, setMot] = useState("");

  useEffect(() => {
    let fini = false;
    void fetch("/api/site-internet/consos-offertes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, token, action: "lire" }),
    })
      .then((x) => (x.ok ? x.json() : null))
      .then((j) => {
        if (!fini && j?.reglages) setR(j.reglages as ReglagesConsos);
      })
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, [slug, token]);

  const changer = (p: Partial<ReglagesConsos>) => {
    setR((v) => ({ ...v, ...p }));
    setMot("");
  };
  const enregistrer = async () => {
    setOccupe(true);
    try {
      const x = await fetch("/api/site-internet/consos-offertes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, token, action: "poser", ...r }),
      });
      const j = (await x.json().catch(() => ({}))) as { reglages?: ReglagesConsos; error?: string };
      if (x.ok && j.reglages) setR(j.reglages);
      setMot(x.ok ? "✓ Enregistré" : j.error || "Enregistrement impossible.");
    } catch {
      setMot("Enregistrement impossible.");
    } finally {
      setOccupe(false);
    }
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .consos .a-title{font-family:var(--fd),Georgia,serif;font-weight:700;font-size:19px;}
          .pro .consos .a-sub{font-size:13px;color:var(--soft);margin-top:4px;line-height:1.45;}
          .pro .consos .interrupteur{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;margin-top:14px;padding:12px 14px;
            border-radius:12px;border:1px solid var(--hair);background:#F6F5F0;font:inherit;font-size:14px;font-weight:700;text-align:left;cursor:pointer;color:inherit;}
          .pro .consos .interrupteur i{flex:none;position:relative;width:44px;height:26px;border-radius:999px;background:#CFCAC0;transition:background .2s;}
          .pro .consos .interrupteur i::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .2s;}
          .pro .consos .interrupteur i.on{background:#2F8F5B;}
          .pro .consos .interrupteur i.on::after{transform:translateX(18px);}
          .pro .consos .ligne{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:14px;font-size:13px;font-weight:600;}
          .pro .consos .pas{display:flex;align-items:center;gap:12px;}
          .pro .consos .pas button,.pro .consos .choix button{min-width:40px;height:36px;padding:0 12px;border-radius:999px;border:1px solid var(--hair);background:#fff;font:inherit;font-size:14px;font-weight:700;cursor:pointer;}
          .pro .consos .pas button:disabled{opacity:.4;cursor:default;}
          .pro .consos .pas b{min-width:18px;text-align:center;font-size:18px;}
          .pro .consos .choix{display:flex;gap:6px;}
          .pro .consos .choix button.on{background:#1F1B16;color:#fff;border-color:#1F1B16;}
          .pro .consos label.champ{display:flex;flex-direction:column;gap:4px;margin-top:14px;font-size:13px;font-weight:600;}
          .pro .consos label.champ input{height:40px;padding:0 12px;border-radius:10px;border:1px solid var(--hair);font:inherit;font-size:14px;font-weight:400;}
          .pro .consos ul{margin:14px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px;font-size:13px;line-height:1.4;}
          .pro .consos .loi{margin-top:12px;padding:10px 12px;border-radius:10px;border:1px dashed #C9A45C;background:#FBF6EA;font-size:12px;line-height:1.45;color:#5E4B2B;}
          .pro .consos .bas{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:14px;}
          .pro .consos .bas button{height:42px;padding:0 18px;border-radius:999px;border:0;background:#1F1B16;color:#fff;font:inherit;font-size:14px;font-weight:700;cursor:pointer;}
          .pro .consos .bas button:disabled{opacity:.5;}
          .pro .consos .bas span{font-size:12.5px;color:var(--soft);}
          .pro .consos .demo{display:inline-block;margin-top:12px;font-size:13px;font-weight:700;color:#B5541B;}
          .pro .consos .note{margin-top:8px;font-size:12px;color:var(--faint);line-height:1.45;}
          `,
        }}
      />
      <div className="consos">
        <div className="a-title">🎁 Mes consos offertes</div>
        <div className="a-sub">
          Ce soir c’est calme ? Depuis le salon de votre soirée, offrez quelques consos tirées au sort parmi ceux qui ont dit « Je compte
          venir ». Les gagnants reçoivent un code ; vous le validez d’un appui au comptoir, et vous voyez combien sont vraiment venus grâce à
          ça.
        </div>
        <button type="button" className="interrupteur" role="switch" aria-checked={r.actif} onClick={() => changer({ actif: !r.actif })}>
          <span>Je veux pouvoir offrir des consos</span>
          <i className={r.actif ? "on" : ""} aria-hidden="true" />
        </button>
        {r.actif && (
          <>
            <div className="ligne">
              <span>Combien, d’habitude</span>
              <span className="pas">
                <button type="button" aria-label="Une de moins" disabled={r.nombre <= 1} onClick={() => changer({ nombre: r.nombre - 1 })}>
                  −
                </button>
                <b>{r.nombre}</b>
                <button type="button" aria-label="Une de plus" disabled={r.nombre >= 5} onClick={() => changer({ nombre: r.nombre + 1 })}>
                  +
                </button>
              </span>
            </div>
            <label className="champ">
              Ce qui est offert
              <input value={r.quoi} onChange={(e) => changer({ quoi: e.target.value })} maxLength={80} />
            </label>
            <div className="ligne">
              <span>Code valable</span>
              <span className="choix">
                {([30, 45] as const).map((d) => (
                  <button key={d} type="button" className={r.duree === d ? "on" : ""} aria-pressed={r.duree === d} onClick={() => changer({ duree: d })}>
                    {d} min
                  </button>
                ))}
              </span>
            </div>
            <ul>
              <li>🎟️ Tirage au sort parmi ceux qui comptent venir — pas au plus rapide.</li>
              <li>☝️ Une seule par personne et par soirée.</li>
              <li>✅ Le gagnant montre son code ; vous le validez d’un appui.</li>
            </ul>
            <div className="loi">
              L’alcool offert est encadré : pas d’« à volonté » ni d’« open bar », et la publicité pour l’alcool est limitée par la loi Évin.
              Proposez « une boisson au choix, avec ou sans alcool », et faites vérifier votre offre avant de la lancer.
            </div>
          </>
        )}
        <div className="bas">
          <button type="button" disabled={occupe} onClick={() => void enregistrer()}>
            {occupe ? "Enregistrement…" : "Enregistrer"}
          </button>
          {mot && <span>{mot}</span>}
        </div>
        <a className="demo" href="/autour-de-moi?carte=bar-terrasse" target="_blank" rel="noreferrer">
          Voir comment ça marche, dans la démonstration →
        </a>
        <div className="note">
          Dans la démonstration : ouvrez « Découvrir cette soirée », puis « Démo · côté bar ». Le lancement en direct depuis le salon de
          votre soirée arrive avec les soirées des vrais lieux ; vos réglages sont gardés d’ici là.
        </div>
      </div>
    </>
  );
}
