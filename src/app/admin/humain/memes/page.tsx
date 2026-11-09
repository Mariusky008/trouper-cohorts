// 📈 LES MÈMES : ÇA MARCHE ? — 6 novembre 2026, le patron : « mesurer pour savoir si ça marche vraiment ». Les gestes
// autour des mèmes (`clik_meme_evenement`, la migration `20261110090000_clik_meme_evenement.sql`), sur 7 et 30 jours,
// et jour par jour ; et le coefficient qui compte : les nouveaux créateurs par mème envoyé (au-dessus de 1, chaque mème
// en amène plus d'un : l'app grandit toute seule).
import Link from "next/link";
import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { parcoursPremierMeme, statsMemes, type EvenementMeme } from "@/lib/direct/ma-figurine-serveur";
import { statsReactions } from "@/lib/direct/mes-reactions-serveur";
import { etatNotifications } from "@/lib/direct/appli-collection-serveur";
import { statsTalkie } from "@/lib/direct/talkie-serveur";
import { GAGS, REACTIONS } from "@/lib/direct/mes-reactions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NOMS: Record<EvenementMeme, string> = {
  cree: "Mèmes créés",
  reponse: "Réponses en duo",
  vu: "Mèmes ouverts",
  clic: "« Crée ou réponds » touché",
  partage: "Partages",
  nouveau: "Nouveaux créateurs",
};
const ORDRE: EvenementMeme[] = ["cree", "vu", "clic", "nouveau", "reponse", "partage"];
const taux = (a: number, b: number) => (b ? `${(a / b).toFixed(2).replace(".", ",")}` : "—");
const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)} %` : "—");
const jourCourt = (j: string) => new Date(`${j}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });

/** « 42 s », « 3 min », « 2 h », « 3 j ». */
const duree = (sec: number) => (sec < 60 ? `${sec} s` : sec < 3600 ? `${Math.round(sec / 60)} min` : sec < 86_400 ? `${Math.round(sec / 3600)} h` : `${Math.round(sec / 86_400)} j`);
const mediane = (l: number[]) => (l.length ? l[Math.floor((l.length - 1) / 2)] : 0);

const carte: CSSProperties = { padding: 14, borderRadius: 12, background: "#f6f6f8", display: "flex", flexDirection: "column", gap: 4 };

export default async function PageMemes() {
  if (!(await isCurrentUserAdmin())) redirect("/admin");
  const supabase = createAdminClient();
  const [s, p, rx, nf, tk] = await Promise.all([statsMemes(supabase), parcoursPremierMeme(supabase), statsReactions(supabase), etatNotifications(supabase), statsTalkie(supabase)]);
  const totalRx = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);
  const enMoinsDUneMinute = p.delais.filter((d) => d <= 60).length;
  const k7 = s.sept.cree ? s.sept.nouveau / s.sept.cree : 0;
  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "24px 16px 60px", fontFamily: "system-ui, sans-serif", color: "#1d1d1f" }}>
      <p>
        <Link href="/admin/humain">← Admin</Link>
      </p>
      <h1 style={{ margin: "8px 0 4px" }}>Les mèmes : ça marche ?</h1>
      <p style={{ margin: 0, color: "#555" }}>
        Ce qui compte : les nouveaux créateurs par mème envoyé. Au-dessus de 1, chaque mème en amène plus d’un — l’app grandit toute seule. En dessous, on regarde où ça casse :
        ouvert ? touché ? créé ?
      </p>
      {!s.ok ? (
        <p style={{ marginTop: 20, padding: 14, borderRadius: 10, background: "#fff4e5" }}>
          La migration n’est pas encore appliquée : <code>supabase/migrations/20261110090000_clik_meme_evenement.sql</code>, dans l’éditeur SQL de Supabase. Rien ne se compte
          avant (les mèmes partent quand même).
        </p>
      ) : (
        <>
          <section style={{ marginTop: 20, padding: 18, borderRadius: 14, background: k7 >= 1 ? "#e9f9ef" : "#fff4e5" }}>
            <b style={{ fontSize: 15 }}>Le coefficient, sur 7 jours</b>
            <div style={{ fontSize: 40, fontWeight: 800 }}>{taux(s.sept.nouveau, s.sept.cree)}</div>
            <span style={{ color: "#555" }}>
              nouveau{s.sept.nouveau > 1 ? "x" : ""} créateur{s.sept.nouveau > 1 ? "s" : ""} par mème envoyé ({s.sept.nouveau} pour {s.sept.cree}) · sur 30 jours :{" "}
              {taux(s.trente.nouveau, s.trente.cree)}
            </span>
          </section>
          {/* 🎁 LE PARCOURS JUSQU'AU PREMIER MÈME (7 novembre 2026 : « mesure combien de gens vont jusqu'au premier envoi ») */}
          {p.ok && (
            <>
              <h2 style={{ margin: "26px 0 4px", fontSize: 18 }}>Le premier mème, sur 30 jours</h2>
              <p style={{ margin: "0 0 10px", color: "#555" }}>Ceux qui ont envoyé leur photo : jusqu’où vont-ils ?</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }} data-parcours="">
                {[
                  { nom: "Photo envoyée", n: p.photos, de: 0 },
                  { nom: "Figurine prête", n: p.pretes, de: p.photos },
                  { nom: "Premier mème", n: p.premiers, de: p.pretes },
                  { nom: "Mème envoyé (partagé ou ouvert)", n: p.envoyes, de: p.premiers },
                ].map((x) => (
                  <div key={x.nom} style={carte}>
                    <small style={{ color: "#666" }}>{x.nom}</small>
                    <b style={{ fontSize: 26 }}>{x.n}</b>
                    <small style={{ color: "#888" }}>{x.de ? `${pct(x.n, x.de)} de l’étape d’avant` : "\u00a0"}</small>
                  </div>
                ))}
              </div>
              <p style={{ margin: "12px 0 0", color: "#444" }}>
                Entre la figurine prête et le premier mème :{" "}
                {p.delais.length ? (
                  <>
                    <b>{duree(mediane(p.delais))}</b> (la moitié des gens) · en moins d’une minute : <b>{pct(enMoinsDUneMinute, p.delais.length)}</b> ({enMoinsDUneMinute} sur {p.delais.length})
                  </>
                ) : (
                  "pas encore de premier mème."
                )}
              </p>
            </>
          )}
          {/* ⚡ SES RÉACTIONS ET SES GAGS ENVOYÉS (7 novembre 2026 : « la figurine pourrait remplacer les emojis et les GIF ») */}
          {rx.ok && (
            <>
              <h2 style={{ margin: "26px 0 4px", fontSize: 18 }}>⚡ Réactions et gags envoyés</h2>
              <p style={{ margin: "0 0 10px", color: "#555" }}>
                Sur 7 jours : <b>{totalRx(rx.sept)}</b> · sur 30 jours : {totalRx(rx.trente)}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 8 }}>
                {[...REACTIONS, ...GAGS].map((x) => (
                  <div key={x.cle} style={carte}>
                    <small style={{ color: "#666" }}>
                      {x.emoji} {x.nom}
                    </small>
                    <b style={{ fontSize: 22 }}>{rx.sept[x.cle] ?? 0}</b>
                    <small style={{ color: "#888" }}>30 jours : {rx.trente[x.cle] ?? 0}</small>
                  </div>
                ))}
              </div>
            </>
          )}
          {/* 🎙️ LE TALKIE-WALKIE DES PROCHES (8 novembre 2026) : ce qu'on regarde chaque semaine */}
          {tk.ok && (
            <>
              <h2 style={{ margin: "26px 0 4px", fontSize: 18 }}>🎙️ Le talkie-walkie des proches, sur 7 jours</h2>
              <p style={{ margin: "0 0 10px", color: "#555" }}>Des messages qui partent, des proches qui répondent, des conversations qui durent : c’est ce qui dit si l’onglet « Proches » tient.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 8 }} data-talkie="">
                {[
                  { n: "Messages envoyés", v: String(tk.envoyes) },
                  { n: "Personnes qui ont parlé", v: String(tk.expediteurs) },
                  { n: "… plusieurs fois dans la semaine", v: String(tk.expediteursPlusieurs) },
                  { n: "Messages écoutés", v: String(tk.vus) },
                  { n: "Conversations", v: String(tk.conversations) },
                  { n: "… d’au moins trois échanges", v: String(tk.conversationsTroisEchanges) },
                  { n: "Taux de réponse", v: tk.envoyes ? `${tk.tauxReponse} %` : "—" },
                  { n: "📲 Liens WhatsApp envoyés", v: String(tk.liens) },
                  { n: "… ouverts", v: String(tk.liensOuverts) },
                  { n: "… figurines faites pour répondre", v: String(tk.liensFigurines) },
                  { n: "… réponses", v: String(tk.liensReponses) },
                ].map((x) => (
                  <div key={x.n} style={carte}>
                    <small style={{ color: "#666" }}>{x.n}</small>
                    <b style={{ fontSize: 22 }}>{x.v}</b>
                  </div>
                ))}
              </div>
            </>
          )}
          {/* 🔔 LE MÈME DU JOUR À 11 H 30 (le lot 3) : combien l'ont demandé, et ce qu'a donné le dernier envoi */}
          <h2 style={{ margin: "26px 0 4px", fontSize: 18 }}>🔔 Le mème du jour à 11 h 30</h2>
          {nf.cles ? (
            <p style={{ margin: "0 0 10px", color: "#444" }} data-notif="">
              <b>{nf.abonnes}</b> personne{nf.abonnes > 1 ? "s l’ont demandé" : " l’a demandé"} ·{" "}
              {nf.dernier ? (
                <>
                  dernier envoi le {nf.dernier.jour} : <b>{nf.dernier.envoyes}</b> notification{nf.dernier.envoyes > 1 ? "s parties" : " partie"}, {nf.dernier.dejaRepondu} déjà répondu, {nf.dernier.morts} téléphone
                  {nf.dernier.morts > 1 ? "s" : ""} abandonné{nf.dernier.morts > 1 ? "s" : ""} (effacé{nf.dernier.morts > 1 ? "s" : ""})
                </>
              ) : (
                "pas encore d’envoi."
              )}
            </p>
          ) : (
            <p style={{ margin: "0 0 10px", padding: 12, borderRadius: 10, background: "#fff4e5" }}>
              Les clés de notification manquent : rien ne part. Il faut <code>NEXT_PUBLIC_VAPID_PUBLIC_KEY</code>, <code>VAPID_PRIVATE_KEY</code> et <code>NEXT_PUBLIC_APP_EMAIL</code> sur Vercel
              (les mêmes que pour les salons).
            </p>
          )}
          <h2 style={{ margin: "26px 0 10px", fontSize: 18 }}>Le chemin, sur 7 jours</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
            {ORDRE.map((t) => (
              <div key={t} style={carte}>
                <small style={{ color: "#666" }}>{NOMS[t]}</small>
                <b style={{ fontSize: 26 }}>{s.sept[t]}</b>
                <small style={{ color: "#888" }}>30 jours : {s.trente[t]}</small>
              </div>
            ))}
          </div>
          <ul style={{ margin: "14px 0 0", paddingLeft: 18, color: "#444", lineHeight: 1.7 }}>
            <li>Ouverts par mème créé : {taux(s.sept.vu, s.sept.cree)}</li>
            <li>« Crée ou réponds » touché, sur les mèmes ouverts : {pct(s.sept.clic, s.sept.vu)}</li>
            <li>Nouveaux créateurs, sur « Crée ou réponds » touché : {pct(s.sept.nouveau, s.sept.clic)}</li>
            <li>Réponses en duo, sur les mèmes créés : {pct(s.sept.reponse, s.sept.cree)}</li>
          </ul>
          <h2 style={{ margin: "26px 0 10px", fontSize: 18 }}>Jour par jour</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid #ddd" }}>Jour</th>
                  {ORDRE.map((t) => (
                    <th key={t} style={{ textAlign: "right", padding: "6px 8px", borderBottom: "1px solid #ddd", whiteSpace: "nowrap" }}>
                      {NOMS[t]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.jours.map((j) => (
                  <tr key={j.jour}>
                    <td style={{ padding: "6px 8px", borderBottom: "1px solid #eee", whiteSpace: "nowrap" }}>{jourCourt(j.jour)}</td>
                    {ORDRE.map((t) => (
                      <td key={t} style={{ textAlign: "right", padding: "6px 8px", borderBottom: "1px solid #eee" }}>
                        {j.n[t] || ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
