"use client";

/**
 * 🏪 LE MÈME D'UN COMMERÇANT, REÇU — comme celui d'un client (`figurine/[id]/message-recu.tsx`) : la vidéo joue tout de
 * suite (le son au premier toucher), sans blabla. Dessous : son nom et ce qu'il annonce, « 📍 Voir sa page » (le bouton
 * qui compte pour lui), « 🎭 Crée ton mème, toi aussi », et « 📲 Partager ce mème ».
 */
import Link from "next/link";
import type { MemeCommerce } from "@/lib/direct/memes-commerces";
import { MemeVideo, PartagerCeMeme, STYLES_MR } from "@/app/figurine/[id]/message-recu";

export function MemeDuCommerce({ meme: m }: { meme: MemeCommerce }) {
  const noter = () =>
    void fetch("/api/direct/memes-commerces", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "geste", type: "partage", id: m.id }) }).catch(() => undefined);
  return (
    <main className="mr mc-com">
      <MemeVideo src={m.video} affiche={m.image || undefined} />
      <p className="mcom-qui">
        <b>{m.nom}</b>
        <span>
          {m.emoji} {m.titre}
          {m.ville ? ` · ${m.ville}` : ""}
        </span>
      </p>
      <a className="mr-bouton" href={`/meme/${m.id}/voir`}>
        📍 Voir sa page
      </a>
      <Link className="mcom-creer" href="/collection#figurine" prefetch={false}>
        🎭 Crée ton mème, toi aussi
      </Link>
      <PartagerCeMeme id={m.id} video={m.video} type={m.videoType} noter={noter} />
      <style>{STYLES_MR + STYLES_MCOM}</style>
    </main>
  );
}

const STYLES_MCOM = `
.mcom-qui{display:flex;flex-direction:column;gap:2px;margin:0}
.mcom-qui b{font-size:19px;font-weight:900}
.mcom-qui span{font-size:14px;color:#D9C3CB}
.mc-com .mr-meme{max-height:calc(100dvh - 230px)}
.mcom-creer{padding:12px 18px;border-radius:999px;border:1.5px solid rgba(255,46,154,.6);color:#FFC8E6;font-size:15px;font-weight:900;text-decoration:none}
`;
