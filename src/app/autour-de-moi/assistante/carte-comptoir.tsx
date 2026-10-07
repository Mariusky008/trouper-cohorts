"use client";

// 📋 MA CARTE — ses rubriques, ses lignes et ses prix, écrits par lui.
//
// « Pour les restaurants avec la carte des menus, comment la rentre-t-il dans
// son admin ? Il faudrait le prévoir pour les restaurants, bars et tout
// commerce qui possède une carte, comme les coiffeurs (coupe, shampoing,
// massages…), onglerie, etc. Ce n'est pas pour les essayages, mais pour que ça
// arrive directement sur leur CARTE et PRIX, plutôt qu'avoir des photos
// recueillies sur leur fiche Google. »
//
// UNE CARTE SE PENSE EN RUBRIQUES : Entrées, Plats, Desserts ; Coupes,
// Couleur, Soins. L'écran les montre comme une carte imprimée — un titre de
// rubrique, ses lignes dessous (nom, détail, prix) — et il les renomme, en
// ajoute, en retire. On lui propose celles de son métier pour commencer, et,
// chez un vrai commerçant, la carte lue sur ses photos Google pour ne pas tout
// retaper.
//
// RIEN NE PART AVANT « PUBLIER MA CARTE ». Une carte à moitié écrite ne doit
// pas apparaître sur sa page pendant qu'il cherche le prix du tiramisu.
//
// OÙ ELLE VA — voir `lib/direct/vitrine.ts` :
//   · un VRAI commerçant : la colonne `services`, que sa page lit en premier ;
//     sa carte remplace alors la carte lue et les pages du menu Google ;
//   · la DÉMONSTRATION : ce téléphone, sous l'identifiant du commerce.
import { useEffect, useState, useSyncExternalStore } from "react";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import {
  abonnerVitrines,
  chargerVitrines,
  MAX_LIGNES_CARTE,
  motsDeLaCarte,
  poserLaCarte,
  VITRINES_VIDES,
  type LigneCarte,
} from "@/lib/direct/vitrine";

type Ligne = { cle: string; nom: string; detail: string; prix: string; duree?: string };
type Rubrique = { cle: string; titre: string; lignes: Ligne[] };
type Service = { name: string; price?: string; desc?: string; duration?: string; rubrique?: string };

let compteur = 0;
const cle = () => `k${Date.now().toString(36)}${(compteur++).toString(36)}`;
const ligneVide = (): Ligne => ({ cle: cle(), nom: "", detail: "", prix: "" });

/** Les lignes à plat → les rubriques, dans l'ordre où elles apparaissent. */
function enRubriques(lignes: (LigneCarte & { duree?: string })[]): Rubrique[] {
  const r: Rubrique[] = [];
  for (const l of lignes) {
    const titre = l.rubrique ?? "";
    let g = r.find((x) => x.titre === titre);
    if (!g) r.push((g = { cle: cle(), titre, lignes: [] }));
    g.lignes.push({ cle: cle(), nom: l.nom, detail: l.detail ?? "", prix: l.prix ?? "", duree: l.duree });
  }
  return r;
}

/** Les rubriques → les lignes à plat, sans les lignes laissées vides. */
function aPlat(r: Rubrique[]): (LigneCarte & { duree?: string })[] {
  return r.flatMap((g) =>
    g.lignes
      .filter((l) => l.nom.trim())
      .map((l) => ({
        rubrique: g.titre.trim() || undefined,
        nom: l.nom.trim(),
        prix: l.prix.trim() || undefined,
        detail: l.detail.trim() || undefined,
        duree: l.duree,
      })),
  );
}

const depuisServices = (l: Service[] | undefined) =>
  (l ?? []).map((s) => ({ rubrique: s.rubrique, nom: s.name, prix: s.price, detail: s.desc, duree: s.duration }));

export function CarteComptoir({
  commerce,
  dossier,
  onRetour,
}: {
  commerce: CommerceComptoir;
  /** Le dossier de son fantôme, pour son visage. */
  dossier: string;
  onRetour: () => void;
}) {
  const mots = motsDeLaCarte(commerce.famille, commerce.metier);
  const reel = commerce.reel;
  const locales = useSyncExternalStore(abonnerVitrines, chargerVitrines, () => VITRINES_VIDES);
  /** null : pas encore lue ; [] : vide. */
  const [rubriques, setRubriques] = useState<Rubrique[] | null>(null);
  /** La carte lue sur ses photos Google, pour partir d'elle. */
  const [lue, setLue] = useState<LigneCarte[]>([]);
  const [modifie, setModifie] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);

  /* LES RUBRIQUES DE SON MÉTIER, une ligne vide dans chacune : il voit tout de
     suite la forme d'une carte, au lieu d'une page blanche. */
  const pourCommencer = (): Rubrique[] => mots.rubriques.map((titre) => ({ cle: cle(), titre, lignes: [ligneVide()] }));

  // LA DÉMONSTRATION : SA CARTE EST DANS LE TÉLÉPHONE, lue une fois à l'arrivée.
  const [demoLue, setDemoLue] = useState(false);
  if (!reel && !demoLue) {
    setDemoLue(true);
    const deja = locales.cartes[commerce.id] ?? [];
    setRubriques(deja.length ? enRubriques(deja) : pourCommencer());
  }

  // UN VRAI COMMERÇANT : SA CARTE EST EN BASE.
  useEffect(() => {
    if (!reel) return;
    let fini = false;
    fetch("/api/site-internet/pro/services", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: reel.slug, token: reel.token, action: "get" }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { services?: Service[]; lue?: LigneCarte[] }) => {
        if (fini) return;
        const deja = depuisServices(j.services);
        setRubriques(deja.length ? enRubriques(deja) : pourCommencer());
        setLue(Array.isArray(j.lue) ? j.lue : []);
      })
      .catch(() => {
        if (fini) return;
        setRubriques(pourCommencer());
        setMessage({ ok: false, texte: "Ta carte n’a pas pu être lue. Vérifie ta connexion avant de publier." });
      });
    return () => {
      fini = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reel]);

  const changer = (f: (r: Rubrique[]) => Rubrique[]) => {
    setRubriques((r) => f(r ?? []));
    setModifie(true);
    setMessage(null);
  };
  const changerRubrique = (k: string, maj: Partial<Rubrique>) => changer((r) => r.map((g) => (g.cle === k ? { ...g, ...maj } : g)));
  const changerLigne = (k: string, l: string, maj: Partial<Ligne>) =>
    changer((r) => r.map((g) => (g.cle === k ? { ...g, lignes: g.lignes.map((x) => (x.cle === l ? { ...x, ...maj } : x)) } : g)));

  const total = (rubriques ?? []).reduce((n, g) => n + g.lignes.length, 0);
  const remplies = aPlat(rubriques ?? []).length;
  const plein = total >= MAX_LIGNES_CARTE;

  const publier = async () => {
    const lignes = aPlat(rubriques ?? []);
    if (!reel) {
      const souci = poserLaCarte(
        commerce.id,
        lignes.map((l) => ({ rubrique: l.rubrique, nom: l.nom, prix: l.prix, detail: l.detail })),
      );
      setModifie(false);
      setMessage(souci ? { ok: false, texte: souci } : { ok: true, texte: lignes.length ? "C’est publié : ta carte est sur ta page, avec ses prix." : "Ta carte est vidée : ta page reprend sa carte d’avant." });
      return;
    }
    setEnvoi(true);
    try {
      const r = await fetch("/api/site-internet/pro/services", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug: reel.slug,
          token: reel.token,
          action: "set",
          services: lignes.map((l) => ({ name: l.nom, price: l.prix, desc: l.detail, rubrique: l.rubrique, duration: l.duree })),
        }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(j.error || `Erreur ${r.status}`);
      setModifie(false);
      setMessage({
        ok: true,
        texte: lignes.length
          ? "C’est publié : ta carte est sur ta page, avec ses prix. Elle remplace celle lue sur Google."
          : "Ta carte est vidée : ta page reprend celle lue sur Google.",
      });
    } catch (e) {
      setMessage({ ok: false, texte: `La carte n’a pas pu partir : ${e instanceof Error ? e.message : "réessaie"}.` });
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="crt">
      <StylesCarte />
      <div className="crt-haut">
        <button type="button" className="crt-retour" onClick={onRetour}>
          ‹ Mon comptoir
        </button>
        <span className="crt-compte">
          {remplies} ligne{remplies > 1 ? "s" : ""}
        </span>
      </div>

      <section className="crt-intro">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${dossier}visage.webp`} alt="" />
        <div>
          <h2>{mots.titre}</h2>
          <p>Écris-la comme sur ton ardoise : tes rubriques, chaque ligne et son prix. Elle s’affiche telle quelle sur ta page{reel ? ", à la place de celle lue sur Google" : ""}.</p>
        </div>
      </section>

      {lue.length > 0 && remplies === 0 && (
        <button
          type="button"
          className="crt-lue"
          onClick={() => {
            changer(() => enRubriques(lue));
            setMessage({ ok: true, texte: "Voilà la carte lue sur tes photos Google. Corrige ce qui ne va pas, puis publie." });
          }}
        >
          <b>Partir de la carte lue sur ta fiche Google</b>
          <span>
            {lue.length} ligne{lue.length > 1 ? "s" : ""} déjà lue{lue.length > 1 ? "s" : ""} : tu corriges au lieu de tout retaper.
          </span>
        </button>
      )}

      {rubriques === null ? (
        <p className="crt-vide">Je relis ta carte…</p>
      ) : (
        rubriques.map((g, gi) => (
          <section key={g.cle} className="crt-rub" aria-label={g.titre || "Rubrique sans titre"}>
            <div className="crt-rub-t">
              <input
                value={g.titre}
                maxLength={40}
                placeholder="Nom de la rubrique"
                aria-label="Nom de la rubrique"
                onChange={(e) => changerRubrique(g.cle, { titre: e.target.value })}
              />
              <button
                type="button"
                className="crt-x"
                aria-label={`Retirer la rubrique ${g.titre}`}
                onClick={() => changer((r) => r.filter((x) => x.cle !== g.cle))}
              >
                ✕
              </button>
            </div>
            {g.lignes.map((l, li) => (
              <div key={l.cle} className="crt-ligne">
                <input
                  className="crt-nom"
                  value={l.nom}
                  maxLength={80}
                  placeholder={gi === 0 && li === 0 ? mots.exemple.nom : "Nom"}
                  aria-label="Nom"
                  onChange={(e) => changerLigne(g.cle, l.cle, { nom: e.target.value })}
                />
                <input
                  className="crt-prix"
                  value={l.prix}
                  maxLength={40}
                  placeholder={gi === 0 && li === 0 ? mots.exemple.prix : "Prix"}
                  aria-label="Prix"
                  onChange={(e) => changerLigne(g.cle, l.cle, { prix: e.target.value })}
                />
                <input
                  className="crt-detail"
                  value={l.detail}
                  maxLength={160}
                  placeholder={gi === 0 && li === 0 ? `${mots.exemple.detail} (facultatif)` : "Détail (facultatif)"}
                  aria-label="Détail"
                  onChange={(e) => changerLigne(g.cle, l.cle, { detail: e.target.value })}
                />
                <button
                  type="button"
                  className="crt-x"
                  aria-label={`Retirer ${l.nom || "cette ligne"}`}
                  onClick={() => changer((r) => r.map((x) => (x.cle === g.cle ? { ...x, lignes: x.lignes.filter((y) => y.cle !== l.cle) } : x)))}
                >
                  ✕
                </button>
              </div>
            ))}
            {!plein && (
              <button
                type="button"
                className="crt-plus"
                onClick={() => changer((r) => r.map((x) => (x.cle === g.cle ? { ...x, lignes: [...x.lignes, ligneVide()] } : x)))}
              >
                + Une ligne{g.titre ? ` dans « ${g.titre} »` : ""}
              </button>
            )}
          </section>
        ))
      )}

      {rubriques !== null && !plein && (
        <button type="button" className="crt-rub-plus" onClick={() => changer((r) => [...r, { cle: cle(), titre: "", lignes: [ligneVide()] }])}>
          + Une rubrique
        </button>
      )}
      {plein && <p className="crt-vide">{MAX_LIGNES_CARTE} lignes au plus : retire-en une pour en ajouter.</p>}

      {message && (
        <p className={`crt-message${message.ok ? "" : " non"}`} role="status">
          {message.texte}
        </p>
      )}

      <div className="crt-pied">
        <button type="button" className="cz-go crt-publier" disabled={!modifie || envoi || rubriques === null} onClick={() => void publier()}>
          {envoi ? "Envoi…" : modifie ? "Publier ma carte" : "Ta carte est à jour"}
        </button>
      </div>
    </div>
  );
}

function StylesCarte() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.crt{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:12px 16px 0;scrollbar-width:none;display:flex;flex-direction:column;gap:14px;}
.crt::-webkit-scrollbar{display:none;}
.crt-haut{display:flex;align-items:center;justify-content:space-between;}
.crt-retour{border:1px solid var(--trait);border-radius:999px;padding:9px 16px;background:var(--nappe);font-weight:700;}
.crt-compte{font-size:14px;font-weight:700;color:var(--gris);}
.crt-intro{display:grid;grid-template-columns:64px 1fr;gap:14px;align-items:center;padding:14px;border-radius:22px;
  background:var(--nappe);border:1px solid var(--trait);}
.crt-intro img{width:64px;height:64px;border-radius:50%;object-fit:cover;background:var(--nappe2);}
.crt-intro h2{margin:0;font-family:var(--font-clikme),sans-serif;font-size:19px;font-weight:800;letter-spacing:-.01em;}
.crt-intro p{margin:4px 0 0;font-size:14px;line-height:1.4;color:var(--gris);}
.crt-lue{display:grid;gap:3px;text-align:left;padding:14px 16px;border-radius:18px;border:1px solid var(--ambre);
  background:rgba(245,162,58,.12);color:inherit;}
.crt-lue b{font-size:15px;}
.crt-lue span{font-size:13px;color:var(--gris);}
.crt-rub{display:grid;grid-template-columns:minmax(0,1fr);gap:8px;padding:12px;border-radius:20px;background:var(--nappe);border:1px solid var(--trait);}
.crt-rub-t{display:flex;gap:8px;align-items:center;}
.crt-rub-t input{flex:1;width:auto;min-width:0;height:40px;padding:0 4px;border:0;border-bottom:1px solid var(--trait);background:none;
  font-family:var(--font-clikme),sans-serif;font-size:17px;font-weight:800;color:var(--ambre);}
.crt-ligne{display:grid;grid-template-columns:minmax(0,1fr) 84px 36px;gap:6px;padding:8px;border-radius:14px;background:var(--nappe2);}
.crt-ligne input{width:100%;min-width:0;box-sizing:border-box;height:38px;padding:0 10px;border-radius:10px;border:1px solid var(--trait);background:var(--fond);font-size:15px;}
.crt-ligne .crt-detail{grid-column:1 / 3;font-size:13.5px;height:34px;}
.crt-ligne .crt-prix{text-align:right;font-weight:700;}
.crt-ligne .crt-x{grid-row:1;grid-column:3;}
.crt-x{width:36px;height:36px;flex:none;border-radius:50%;border:1px solid var(--trait);background:none;color:var(--gris);}
.crt-plus{justify-self:start;border:0;background:none;padding:4px 2px;font-size:14px;font-weight:700;color:var(--ambre);}
.crt-rub-plus{height:46px;border-radius:16px;border:1px dashed var(--trait);background:none;font-weight:700;color:var(--gris);}
.crt-vide{margin:0;padding:16px;border-radius:16px;border:1px dashed var(--trait);text-align:center;font-size:14px;color:var(--gris);}
.crt-message{margin:0;padding:10px 14px;border-radius:14px;font-size:14px;background:rgba(80,190,120,.14);border:1px solid rgba(80,190,120,.4);}
.crt-message.non{background:rgba(245,162,58,.14);border-color:rgba(245,162,58,.4);}
.crt-pied{position:sticky;bottom:0;margin:0 -16px;padding:12px 16px calc(14px + env(safe-area-inset-bottom,0px));
  background:linear-gradient(to top,var(--fond) 70%,transparent);}
.crt-publier:disabled{opacity:.5;}
`,
      }}
    />
  );
}
