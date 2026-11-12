// 🔀 UNE SECONDE APP, L'INTERRUPTEUR « UNIVERS POUR TOUS » ALLUMÉ (`lib/direct/univers-pour-tous.ts`) — pour les essais
// de la bascule : la même construction que l'app de la CI (:3821), lancée sur un autre port avec
// `CLIKME_UNIVERS_POUR_TOUS=1` ; elle partage le faux Supabase de l'essai. Arrêtée à la fin de l'essai.
import { spawn } from "node:child_process";

export async function lancerSecondeApp({ port = 3822, env = { CLIKME_UNIVERS_POUR_TOUS: "1" } } = {}) {
  const enfant = spawn("npx", ["next", "start", "-p", String(port)], { env: { ...process.env, ...env }, stdio: "ignore", detached: true });
  const arreter = () => {
    try {
      process.kill(-enfant.pid, "SIGTERM");
    } catch {
      /* déjà arrêtée */
    }
  };
  process.on("exit", arreter);
  const base = `http://localhost:${port}`;
  for (let i = 0; i < 60; i++) {
    const prete = await fetch(`${base}/autour-de-moi/assistante`)
      .then((r) => r.ok)
      .catch(() => false);
    if (prete) return { base, arreter };
    await new Promise((r) => setTimeout(r, 1000));
  }
  arreter();
  throw new Error("la seconde app (l'interrupteur allumé) ne répond pas");
}
