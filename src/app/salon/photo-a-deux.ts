/**
 * 📸 LA PHOTO À DEUX (`docs/univers/salon-du-duo.md`, section 4.4 ; le lot S6) — « la photo à deux fait un flash et
 * accroche la photo au mur » : au moment du flash, le téléphone compose la photo de leurs deux figurines dans la pièce,
 * telle qu'on la voit (la pièce, puis chaque calque à sa place, leurs têtes penchées comprises), cadrée sur le duo, en
 * paysage. Les images sont relues avec CORS (le seau répond au CORS) : la toile n'est jamais « salie ».
 *
 * Puis elle part comme une photo du ＋ (`depot.ts` : déposée tout droit au seau, vérifiée par le serveur), avec sa
 * légende, et s'accroche au mur.
 *
 * MODULE DU NAVIGATEUR (il touche au DOM) : à n'importer que dans un composant client.
 */

/** La largeur de la photo (en pixels) ; sa hauteur suit le cadrage (4/3). */
const LARGEUR = 1200;

const charger = (src: string) =>
  new Promise<HTMLImageElement>((ok, ko) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.decoding = "async";
    i.onload = () => ok(i);
    i.onerror = () => ko(new Error("image"));
    i.src = src;
  });

/** La photo de leurs deux figurines dans la pièce (`racine` : le conteneur de la scène), ou rien si elle ne peut se faire. */
export async function photoADeux(racine: HTMLElement): Promise<Blob | null> {
  const stage = racine.querySelector<HTMLElement>(".sc-stage");
  const plaque = stage?.querySelector<HTMLImageElement>(".sc-plaque");
  const figs = stage ? [...stage.querySelectorAll<HTMLElement>(".sc-fig")] : [];
  if (!stage || !plaque || !figs.length) return null;
  // (le cadrage : les deux figurines, avec de l'air autour, en 4/3, dans la pièce)
  const rects = figs.map((f) => f.getBoundingClientRect());
  const g = Math.min(...rects.map((r) => r.left));
  const d = Math.max(...rects.map((r) => r.right));
  const h = Math.min(...rects.map((r) => r.top));
  const b = Math.max(...rects.map((r) => r.bottom));
  const pr = plaque.getBoundingClientRect();
  let w = (d - g) * 1.45;
  let ht = w * 0.75;
  if ((b - h) * 1.3 > ht) {
    ht = (b - h) * 1.3;
    w = ht / 0.75;
  }
  w = Math.min(w, pr.width);
  ht = Math.min(ht, pr.height, w * 0.75);
  const cx = (g + d) / 2;
  const cy = h + (b - h) * 0.46;
  const x0 = Math.max(pr.left, Math.min(pr.right - w, cx - w / 2));
  const y0 = Math.max(pr.top, Math.min(pr.bottom - ht, cy - ht / 2));
  const k = LARGEUR / w;
  const toile = document.createElement("canvas");
  toile.width = LARGEUR;
  toile.height = Math.round(ht * k);
  const ctx = toile.getContext("2d");
  if (!ctx) return null;
  // (les calques, avec leur boîte qui les coupe, dans l'ordre de la page : le corps, puis la tête)
  const calques = figs.flatMap((f) =>
    [...f.querySelectorAll<HTMLElement>(".sc-calque")].map((boite) => ({ boite: boite.getBoundingClientRect(), img: boite.querySelector("img"), r: boite.querySelector("img")?.getBoundingClientRect() })),
  );
  try {
    const [fond, ...imgs] = await Promise.all([charger(plaque.currentSrc || plaque.src), ...calques.map((c) => (c.img ? charger(c.img.currentSrc || c.img.src) : Promise.resolve(null)))]);
    const ou = (r: { left: number; top: number; width: number; height: number }) => [(r.left - x0) * k, (r.top - y0) * k, r.width * k, r.height * k] as const;
    ctx.drawImage(fond, ...ou(pr));
    calques.forEach((c, i) => {
      const img = imgs[i];
      if (!img || !c.r) return;
      ctx.save();
      ctx.beginPath();
      ctx.rect(...ou(c.boite));
      ctx.clip();
      ctx.drawImage(img, ...ou(c.r));
      ctx.restore();
    });
    // (un léger halo chaud, comme un flash)
    const halo = ctx.createRadialGradient(toile.width / 2, toile.height * 0.45, 0, toile.width / 2, toile.height * 0.45, toile.width * 0.7);
    halo.addColorStop(0, "rgba(255,248,230,.16)");
    halo.addColorStop(1, "rgba(255,248,230,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, toile.width, toile.height);
  } catch {
    return null;
  }
  return new Promise<Blob | null>((ok) => {
    try {
      toile.toBlob((x) => ok(x), "image/jpeg", 0.9);
    } catch {
      ok(null);
    }
  });
}
