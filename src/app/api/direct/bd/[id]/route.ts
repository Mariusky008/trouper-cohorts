/**
 * 🖋️ UNE CASE DU « FANTÔME DE DAX » : LA PHOTO, REDESSINÉE EN BD.
 *
 * GET /api/direct/bd/<id> rend le dessin de la source `<id>` de
 * `lib/direct/bd-dessin.ts` — rien d'autre ne se dessine ici.
 *
 * ON DESSINE UNE FOIS, ET LE RÉSEAU GARDE. La réponse se garde un an chez
 * Vercel (`s-maxage`) : le premier lecteur attend la génération, les suivants
 * reçoivent l'image d'un coup. Dans la même instance, deux lecteurs qui
 * arrivent ensemble attendent le même dessin au lieu d'en payer deux.
 *
 * UNE ADRESSE AVEC DES PARAMÈTRES EST REFUSÉE : `?x=1`, `?x=2`… seraient
 * autant d'entrées de cache, donc autant de générations payées. Une case n'a
 * qu'une adresse.
 *
 * EN CAS D'ÉCHEC, 503 : la page garde alors la photo filtrée qu'elle montre
 * déjà — voir `le-fantome-de-dax/magazine.tsx`.
 */
import { NextResponse } from "next/server";
import { consigneBD, SOURCES_BD, type SourceBD } from "@/lib/direct/bd-dessin";
import { moteurRefuse, moteursDImage, noterRefus } from "@/lib/direct/moteur-image";

export const maxDuration = 300;

type RouteContext = { params: Promise<{ id: string }> };
const s = (v: unknown) => String(v ?? "").trim();

const memoire = new Map<string, ArrayBuffer>();
const enCours = new Map<string, Promise<ArrayBuffer | null>>();

const TYPES: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

async function dessiner(id: string, src: SourceBD, origine: string): Promise<ArrayBuffer | null> {
  const cle = s(process.env.OPENAI_API_KEY);
  if (!cle) return null;
  const base = s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";
  const photo = await fetch(new URL(src.photo, origine)).catch(() => null);
  if (!photo?.ok) return null;
  const ext = src.photo.split(".").pop()?.toLowerCase() ?? "jpg";
  const fichier = new Blob([await photo.arrayBuffer()], { type: TYPES[ext] ?? "image/jpeg" });
  const { liste } = await moteursDImage(cle, base);
  for (const modele of liste) {
    const forme = new FormData();
    forme.append("model", modele);
    forme.append("prompt", consigneBD(src));
    forme.append("n", "1");
    forme.append("size", src.format);
    forme.append("quality", "high");
    forme.append("input_fidelity", "high");
    if (src.personnage) {
      forme.append("background", "transparent");
      forme.append("output_format", "png");
    } else {
      forme.append("output_format", "jpeg");
      forme.append("output_compression", "90");
    }
    forme.append("image[]", fichier, `source.${ext}`);
    const envoyer = () =>
      fetch(`${base}/v1/images/edits`, {
        method: "POST",
        headers: { authorization: `Bearer ${cle}` },
        body: forme,
        signal: AbortSignal.timeout((maxDuration - 20) * 1000),
      });
    let r = await envoyer();
    /* UN MODÈLE PEUT REFUSER UN RÉGLAGE : on retire ce qu'il nomme, une fois —
       même règle que la route d'essai. */
    if (!r.ok && r.status === 400) {
      const corps = await r.clone().text().catch(() => "");
      const inconnus = ["input_fidelity", "size", "quality", "background", "output_format", "output_compression"].filter((k) =>
        new RegExp(`(unknown|unsupported|unrecognized|not supported)[^.]{0,60}${k}|${k}[^.]{0,60}(unknown|unsupported|not supported|invalid)`, "i").test(corps),
      );
      if (inconnus.length) {
        for (const k of inconnus) forme.delete(k);
        r = await envoyer();
      }
    }
    if (!r.ok) {
      const corps = await r.text().catch(() => "");
      if (moteurRefuse(r.status, corps)) {
        noterRefus(modele);
        continue;
      }
      console.info("[bd] le dessin a échoué", JSON.stringify({ id, modele, statut: r.status, corps: corps.slice(0, 200) }));
      return null;
    }
    const j = (await r.json().catch(() => null)) as { data?: { b64_json?: string }[] } | null;
    const b = j?.data?.[0]?.b64_json;
    if (!b) return null;
    console.info("[bd] dessin prêt", JSON.stringify({ id, modele }));
    const octets = Buffer.from(b, "base64");
    return octets.buffer.slice(octets.byteOffset, octets.byteOffset + octets.byteLength) as ArrayBuffer;
  }
  return null;
}

export async function GET(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const src = SOURCES_BD[id];
  if (!src) return NextResponse.json({ erreur: "Case inconnue." }, { status: 404 });
  if (new URL(req.url).search) return NextResponse.json({ erreur: "Une case n'a qu'une adresse." }, { status: 400 });
  let image = memoire.get(id);
  if (!image) {
    let attente = enCours.get(id);
    if (!attente) {
      attente = dessiner(id, src, req.url).finally(() => enCours.delete(id));
      enCours.set(id, attente);
    }
    const fait = await attente;
    if (!fait) return NextResponse.json({ erreur: "Dessin indisponible." }, { status: 503, headers: { "cache-control": "no-store" } });
    memoire.set(id, fait);
    image = fait;
  }
  return new NextResponse(image, {
    headers: {
      "content-type": src.personnage ? "image/png" : "image/jpeg",
      "cache-control": "public, max-age=86400, s-maxage=31536000, immutable",
    },
  });
}
