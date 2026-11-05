"use client";

/**
 * 🗣️ LE MESSAGE REÇU — la figurine qui parle (`FigurineQuiParle`), ses commerces préférés, « Et toi ? », et
 * « Signaler ce message ». Voir `page.tsx`.
 *
 * UN MESSAGE DE L'ANCIENNE DÉMONSTRATION (`m.demo`, jusqu'au 5 novembre 2026) : écrit par quelqu'un avec la figurine
 * de ClikMe (pas la sienne) — on le dit, et « À ton tour » mène à « Crée ta figurine ».
 */
import Link from "next/link";
import { useState } from "react";
import type { MessageFigurine } from "@/lib/direct/ma-figurine";
import { sentimentDe } from "@/lib/direct/ma-figurine";
import { FigurineQuiParle, STYLES_FIGURINE_QUI_PARLE } from "@/app/collection/figurine-qui-parle";

export function MessageRecu({ message: m }: { message: MessageFigurine }) {
  const [signale, setSignale] = useState(m.signale);
  const [envoi, setEnvoi] = useState(false);
  const [ecoute, setEcoute] = useState(false);

  async function signaler() {
    if (m.signale || !window.confirm("Signaler ce message ? Il ne s’affichera plus.")) return;
    setEnvoi(true);
    const r = await fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "signaler", id: m.id }) }).catch(() => null);
    setEnvoi(false);
    if (r?.ok) setSignale(true);
  }

  return (
    <main className="mr">
      <Link className="mr-logo" href="/">
        Clik<b>Me</b>
      </Link>
      {signale || m.signale ? (
        <section className="mr-signale">
          <b>Ce message a été signalé.</b>
          <p>Il ne s’affiche plus. Merci de nous l’avoir dit.</p>
        </section>
      ) : (
        <>
          <h1>
            <b>{m.prenom || "Quelqu’un"}</b> t’a envoyé {m.demo ? "une figurine qui parle" : "sa figurine"}
          </h1>
          <p className="mr-dit">
            {sentimentDe(m.sentiment) ? (
              <>
                {sentimentDe(m.sentiment)!.emoji} {m.demo ? "Elle" : "Sa figurine"} est {sentimentDe(m.sentiment)!.dit}
                {m.danse ? " et elle danse 🕺" : ""}. Touche « Écouter » : elle te parle.
              </>
            ) : m.danse ? (
              "🕺 Sa figurine danse ! Touche « Écouter » : elle te parle."
            ) : (
              "Touche « Écouter » : elle te parle."
            )}
          </p>
          <FigurineQuiParle
            neutre={m.neutre}
            parle={m.parle}
            // (son visage pour ce sentiment, s'il est fait : la page n'a besoin que de celui-là)
            expressions={m.sentiment && m.expression ? { [m.sentiment]: m.expression } : undefined}
            src={`/api/direct/ma-figurine/son?m=${m.id}`}
            onFin={() => setEcoute(true)}
            etiquette={ecoute ? "▶ Réécouter" : "▶ Écouter"}
            sentiment={m.sentiment}
            danse={Boolean(m.danse)}
            className={`mr-fig${!m.signale && m.or ? " mr-or" : ""}`}
          />
          {/* ✍️ ce qu'elle dit, quand le message vient d'un texte */}
          {m.texte && <p className="mr-bulle">« {m.texte} »</p>}
          {m.demo && (
            <p className="mr-auteur">
              ✍️ Message écrit par {m.prenom || "quelqu’un"}, avec la figurine de démonstration de ClikMe.
            </p>
          )}
          {m.commerces.length > 0 && (
            <section className="mr-bloc" aria-labelledby="mr-commerces">
              <h2 id="mr-commerces">Ses commerces préférés</h2>
              <ul className="mr-commerces">
                {m.commerces.map((c) => (
                  <li key={c.slug}>
                    <a href={`/f/${encodeURIComponent(c.slug)}`}>
                      <span className="mr-com-fig">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={c.figurine} alt="" loading="lazy" />
                      </span>
                      <span className="mr-com-texte">
                        <b>{c.nom}</b>
                        {c.ville && <small>{c.ville}</small>}
                      </span>
                      <span className="mr-com-voir">Voir ›</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
      {!m.signale && m.demo ? (
        <section className="mr-toi">
          <b>À ton tour !</b>
          <p>
            Crée ta figurine avec ta photo, c’est gratuit : choisis son émotion, écris ce qu’elle dit, et envoie-la à qui tu veux.
          </p>
          <Link className="mr-bouton" href="/collection#creer">
            Créer ma figurine
          </Link>
        </section>
      ) : (
        <section className="mr-toi">
          <b>Et toi ?</b>
          <p>
            Crée la tienne avec ta photo, c’est gratuit : elle dit ce que tu veux, change de visage avec ce qu’elle ressent, et tu
            l’envoies à qui tu veux. Chaque achat chez un commerce ClikMe lui ajoute une option.
          </p>
          <Link className="mr-bouton" href="/collection#creer">
            Créer ma figurine
          </Link>
        </section>
      )}
      {!signale && !m.signale && (
        <button type="button" className="mr-signaler" onClick={signaler} disabled={envoi}>
          Signaler ce message
        </button>
      )}
      <style>{STYLES_MR + STYLES_FIGURINE_QUI_PARLE}</style>
    </main>
  );
}

const STYLES_MR = `
.mr{min-height:100dvh;box-sizing:border-box;max-width:520px;margin:0 auto;padding:calc(18px + env(safe-area-inset-top)) 16px calc(28px + env(safe-area-inset-bottom));text-align:center;
  background:radial-gradient(90% 40% at 50% 0%,rgba(255,46,154,.28),transparent 70%),linear-gradient(180deg,#1E0C18,#12060F 50%);color:#FFF4E6;
  font-family:var(--font-clikme),Poppins,system-ui,-apple-system,"Segoe UI",sans-serif;font-size:15px;line-height:1.45;-webkit-font-smoothing:antialiased}
body{background:#12060F}
.mr-logo{display:inline-block;font-size:18px;font-weight:900;color:#FFF4E6;text-decoration:none}
.mr-logo b{color:#FF2E9A}
.mr h1{margin:14px 0 0;font-size:28px;line-height:1.12;font-weight:900;letter-spacing:-.02em}
.mr h1 b{background:linear-gradient(135deg,#fff,#FFC8E6 45%,#F2C46B);-webkit-background-clip:text;background-clip:text;color:transparent}
.mr-dit{margin:6px 0 18px;color:#D9C3CB}
.mr-fig .fqp-fig{width:min(300px,78vw);border-radius:30px}
.mr-or .fqp-fig{box-shadow:0 0 0 4px #F2C46B,0 0 44px rgba(255,214,120,.6),0 22px 44px -18px rgba(0,0,0,.9)}
.mr-bulle{position:relative;margin:16px auto 0;max-width:340px;padding:14px 18px;border-radius:22px;background:#FFF4E6;color:#2A0F1F;font-size:17px;font-weight:800;line-height:1.35}
.mr-bulle::before{content:"";position:absolute;left:50%;top:-9px;width:18px;height:18px;margin-left:-9px;background:#FFF4E6;transform:rotate(45deg)}
.mr-auteur{margin:12px auto 0;max-width:340px;font-size:12.5px;line-height:1.4;color:#A88E99}
.mr-bloc{margin:28px 0 0;text-align:left}
.mr-bloc h2{margin:0 0 10px;font-size:19px;font-weight:900}
.mr-commerces{display:grid;gap:8px;margin:0;padding:0;list-style:none}
.mr-commerces a{display:flex;align-items:center;gap:12px;padding:8px 12px 8px 8px;border-radius:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#FFF4E6;text-decoration:none}
.mr-com-fig{flex:none;width:52px;height:52px;border-radius:12px;background:linear-gradient(160deg,#FFA24A,#7C3110);overflow:hidden}
.mr-com-fig img{width:100%;height:100%;object-fit:contain;object-position:bottom}
.mr-com-texte{display:flex;flex-direction:column;min-width:0}
.mr-com-texte b{font-size:15px;overflow-wrap:anywhere}
.mr-com-texte small{font-size:12px;color:#A88E99}
.mr-com-voir{margin-left:auto;font-size:13px;font-weight:800;color:#FF7AC0}
.mr-toi{margin:28px 0 0;padding:18px 16px;border-radius:22px;background:linear-gradient(135deg,rgba(255,46,154,.18),rgba(242,196,107,.14));border:1px solid rgba(242,196,107,.4)}
.mr-toi > b{font-size:20px;font-weight:900}
.mr-toi p{margin:6px 0 14px;color:#D9C3CB;font-size:14px}
.mr-bouton{display:inline-block;padding:14px 26px;border-radius:999px;background:#FF2E9A;color:#fff;font-weight:900;text-decoration:none;box-shadow:0 10px 24px -10px rgba(255,46,154,.9)}
.mr-signale{margin:30px 0 0;padding:22px 16px;border-radius:22px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1)}
.mr-signale b{font-size:18px}
.mr-signale p{margin:6px 0 0;color:#D9C3CB}
.mr-signaler{display:block;margin:22px auto 0;border:0;background:none;color:#8D7580;font:inherit;font-size:12.5px;text-decoration:underline;cursor:pointer}
`;
