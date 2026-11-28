// 🧭 LA PAGE INTROUVABLE DE CLIKME — l'audit UX du 28 novembre 2026, lot 5b : une adresse qui n'existe pas, dans l'appli
// (`/collection/…`, `/univers/…`), montrait la page 404 des commerçants (fond blanc, « l'annonce que vous cherchiez est
// terminée »). Elle a maintenant celle de l'appli : sa nuit, son rose, et un chemin pour revenir. (Le code reste 404.)
import Link from "next/link";

export function PageIntrouvable() {
  return (
    <main className="pi" data-introuvable>
      <p className="pi-logo" aria-hidden="true">
        Clik<b>Me</b>
      </p>
      <p className="pi-grand" aria-hidden="true">
        🧭
      </p>
      <h1>Cette page n’existe pas</h1>
      <p>Le lien est peut-être incomplet, ou ce qu’il montrait a été effacé.</p>
      <Link href="/collection" className="pi-bouton">
        Revenir à ClikMe
      </Link>
      <style>{`
body{background:#12040E}
.pi{min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px max(20px,env(safe-area-inset-right)) 40px max(20px,env(safe-area-inset-left));box-sizing:border-box;text-align:center;color:#FFF4E6;font-family:var(--font-poppins),"Poppins",system-ui,sans-serif;background:radial-gradient(90% 60% at 50% 0%,#2C0C25,#12040E 70%)}
.pi-logo{margin:0 0 18px;font-weight:900;font-size:22px;letter-spacing:-.02em}
.pi-logo b{color:#FF2E9A}
.pi-grand{margin:0;font-size:56px;line-height:1}
.pi h1{margin:0;font-size:26px;font-weight:900;text-wrap:balance}
.pi p{margin:0;max-width:320px;color:#E9D6DF;font-size:15px;line-height:1.5}
.pi-bouton{display:inline-flex;align-items:center;min-height:50px;margin-top:10px;padding:0 26px;border-radius:999px;background:#FF2E9A;color:#fff;font-weight:900;font-size:16px;text-decoration:none;box-shadow:0 10px 22px -10px rgba(255,46,154,.95)}
`}</style>
    </main>
  );
}
