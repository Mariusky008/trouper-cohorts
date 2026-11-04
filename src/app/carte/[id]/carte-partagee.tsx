"use client";

/** 🃏 La page d'une carte partagée (voir `page.tsx`) : la carte, et « Et toi, qui es-tu ? ». */
import Link from "next/link";
import type { CartePersonnage } from "@/lib/direct/personnage";
import { CartePerso, STYLES_PERSONNAGE } from "@/app/collection/personnage";

export function CartePartagee({ carte: c }: { carte: CartePersonnage }) {
  return (
    <main className="cp">
      <Link className="cp-logo" href="/">
        Clik<b>Me</b>
      </Link>
      <h1>
        Voici <b>{c.prenom || "son personnage"}</b>
      </h1>
      <CartePerso carte={c} />
      <section className="cp-toi">
        <b>Et toi, qui es-tu ?</b>
        <p>Sept questions, et l’IA écrit ta carte. Puis crée ta figurine qui parle, avec ton visage : c’est gratuit.</p>
        <Link className="cp-bouton" href="/collection#personnage">
          🃏 Faire ma carte
        </Link>
      </section>
      <style>{STYLES_CP + STYLES_PERSONNAGE}</style>
    </main>
  );
}

const STYLES_CP = `
.cp{min-height:100dvh;box-sizing:border-box;max-width:520px;margin:0 auto;padding:calc(18px + env(safe-area-inset-top)) 16px calc(28px + env(safe-area-inset-bottom));text-align:center;
  background:radial-gradient(90% 40% at 50% 0%,rgba(255,46,154,.28),transparent 70%),linear-gradient(180deg,#1E0C18,#12060F 50%);color:#FFF4E6;
  font-family:var(--font-clikme),Poppins,system-ui,-apple-system,"Segoe UI",sans-serif;font-size:15px;line-height:1.45;-webkit-font-smoothing:antialiased}
body{background:#12060F}
.cp-logo{display:inline-block;font-size:18px;font-weight:900;color:#FFF4E6;text-decoration:none}
.cp-logo b{color:#FF2E9A}
.cp h1{margin:14px 0 16px;font-size:28px;line-height:1.12;font-weight:900;letter-spacing:-.02em}
.cp h1 b{background:linear-gradient(135deg,#fff,#FFC8E6 45%,#F2C46B);-webkit-background-clip:text;background-clip:text;color:transparent}
.cp .pc{text-align:left}
.cp-toi{margin:26px 0 0;padding:18px 16px;border-radius:22px;background:linear-gradient(135deg,rgba(255,46,154,.18),rgba(242,196,107,.14));border:1px solid rgba(242,196,107,.4)}
.cp-toi > b{font-size:20px;font-weight:900}
.cp-toi p{margin:6px 0 14px;color:#D9C3CB;font-size:14px}
.cp-bouton{display:inline-block;padding:14px 26px;border-radius:999px;background:#FF2E9A;color:#fff;font-weight:900;text-decoration:none;box-shadow:0 10px 24px -10px rgba(255,46,154,.9)}
`;
