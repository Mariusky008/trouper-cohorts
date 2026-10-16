/**
 * 🧪 UN FAUX POSTPEER, EN MÉMOIRE — pour voir ce qui part sur ses réseaux.
 *
 * Il répond comme l'intermédiaire (`/v1/posts`) et GARDE chaque envoi : le
 * texte de chaque réseau, ses photos ou sa vidéo, le bouton du post Google.
 * `GET /__posts` les rend tous. Il ne publie rien nulle part.
 *
 *   node scripts/faux-postpeer.mjs [port]          (54400 par défaut)
 *
 * puis lancer l'application avec
 *   POSTPEER_API_KEY=faux POSTPEER_BASE_URL=http://127.0.0.1:54400/v1
 *
 * `REFUSER=video` (variable) : il refuse les vidéos, pour essayer le repli en photo.
 */
import http from "node:http";

const PORT = Number(process.argv[2] || 54400);
const posts = [];
const lire = (req) =>
  new Promise((ok) => {
    const b = [];
    req.on("data", (c) => b.push(c));
    req.on("end", () => ok(Buffer.concat(b).toString()));
  });

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    const rendre = (code, json) => {
      res.writeHead(code, { "content-type": "application/json" });
      res.end(JSON.stringify(json));
    };
    if (url.pathname === "/__posts") return rendre(200, posts);
    if (url.pathname === "/__vider") return (posts.length = 0), rendre(200, { ok: true });
    if (req.method === "POST" && url.pathname === "/v1/posts") {
      if (req.headers["x-access-key"] !== "faux") return rendre(401, { error: "clé" });
      const corps = JSON.parse((await lire(req)) || "{}");
      posts.push(corps);
      const video = (corps.mediaItems ?? []).some((m) => m.type === "video");
      const refuse = video && process.env.REFUSER === "video";
      return rendre(200, {
        success: !refuse,
        status: refuse ? "failed" : "published",
        postId: `faux-${posts.length}`,
        platforms: (corps.platforms ?? []).map((p) => ({
          platform: p.platform,
          success: !refuse,
          ...(refuse ? { error: "video refusée (essai)" } : { platformPostUrl: `https://example.invalid/${p.platform}/${posts.length}` }),
        })),
      });
    }
    rendre(404, { error: "inconnu" });
  })
  .listen(PORT, "127.0.0.1", () => console.log(`faux PostPeer sur http://127.0.0.1:${PORT}`));
