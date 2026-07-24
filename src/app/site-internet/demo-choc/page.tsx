// DÉMO « CHOC » de démarchage — page HÔTE prête à dégainer sur le terrain.
// Un VRAI site premium (comme ceux que construit Popey), avec l'assistante IA en
// vedette : Marius l'ouvre devant le prospect, réserve une chambre, et à la
// confirmation l'assistante recommande le commerce démarché (la « cible » de
// l'admin) avec son offre + le lien vers son site. Un seul lien, effet garanti.
//
// HONNÊTETÉ : hôtel de DÉMONSTRATION (badge visible), pas un vrai établissement ;
// avis illustratifs (labellisés). La cible se règle dans l'admin (« 🎯 Cibler »).
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { DemarchageBooking, type DemarchageTarget } from "../apercu/[slug]/demarchage-booking";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const str = (v: unknown) => String(v ?? "").trim();
const capWords = (s: string) => s.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_m, p, c) => p + c.toUpperCase());
const ACCENT = "#1C5B63";

export default async function DemoChocPage() {
  const supabase = createAdminClient();
  let target: DemarchageTarget | null = null;
  try {
    const { data } = await supabase
      .from("human_vitrine_sites")
      .select("slug, business_name, city, activite, current_offer")
      .eq("metadata->>demarchage_target", "true")
      .limit(1)
      .maybeSingle();
    const t = data as Record<string, unknown> | null;
    const tSlug = str(t?.slug);
    if (t && tSlug) {
      const rawOffer = t.current_offer && typeof t.current_offer === "object" ? (t.current_offer as Record<string, unknown>) : null;
      const offText = rawOffer ? str(rawOffer.text) : "";
      target = {
        slug: tSlug,
        nom: str(t.business_name) || "notre partenaire",
        ville: capWords(str(t.city)) || "votre ville",
        activite: str(t.activite) || "ses prestations",
        offerText: offText || "une offre de bienvenue rien que pour vous",
        offerIsExample: !offText,
      };
    }
  } catch {
    /* pas de cible exploitable */
  }

  const ville = target?.ville || "Dax";
  // Photos réelles (banque libre) superposées à un dégradé de repli : si une image
  // ne charge pas, on voit le dégradé — jamais d'image cassée.
  const rooms = [
    { n: "Chambre Source", d: "Lit king, vue jardin, salle d'eau en pierre.", p: "119 €", g: "linear-gradient(150deg,#3A5C58,#20302E)", img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=70" },
    { n: "Suite Thermale", d: "Bain balnéo privatif, terrasse, peignoirs.", p: "189 €", g: "linear-gradient(150deg,#5A6B4A,#2C3626)", img: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=800&q=70" },
    { n: "Chambre Cosy", d: "Idéale escapade, petit-déjeuner inclus.", p: "94 €", g: "linear-gradient(150deg,#6B5A46,#33291E)", img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=70" },
  ];
  const reviews = [
    { t: "Accueil aux petits soins, chambre magnifique et le spa est un vrai bonheur. On reviendra sans hésiter.", n: "Séjour de septembre" },
    { t: "Emplacement parfait pour visiter la ville, personnel adorable et petit-déjeuner délicieux.", n: "Week-end en couple" },
  ];

  return (
    <main className="hoc">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="hoc-demo">✦ Démonstration Popey · exemple de site partenaire</div>

      {/* ── HERO immersif + assistante IA ── */}
      <header className="hoc-hero">
        <div className="hoc-bg" aria-hidden="true" />
        <div className="hoc-veil" aria-hidden="true" />
        <div className="hoc-top">
          <div className="hoc-brand">✦ Hôtel du Collectif</div>
          <span className="hoc-open"><i />Réception 24 h/24</span>
        </div>
        <div className="hoc-spacer" aria-hidden="true" />
        <div className="hoc-hero-body">
          <div className="hoc-eyebrow">Boutique-hôtel &amp; spa · {ville}</div>
          <h1 className="hoc-h1">Un séjour d&apos;exception,<br />au cœur de {ville}.</h1>
          <div className="hoc-meta"><span className="hoc-stars">★★★★</span><b>4,9</b><span className="hoc-sub">· 320 avis</span></div>

          <div className="hoc-assist">
            <div className="hoc-ahead">
              <span className="hoc-av">✦</span>
              <span><span className="hoc-anm">Léa · votre concierge</span><span className="hoc-aon"><i /> en ligne · répond tout de suite</span></span>
            </div>
            <div className="hoc-say">Bonjour 👋 Bienvenue à l&apos;Hôtel du Collectif. Je réserve votre chambre, réponds à vos questions et prépare votre séjour — à toute heure.</div>
            <div className="hoc-chips">
              <button type="button" className="hoc-chip primary" data-book-demo>📅 Réserver une chambre</button>
              <button type="button" className="hoc-chip ghost" data-book-demo>💬 Poser une question</button>
            </div>
          </div>
        </div>
        <div className="hoc-scroll">↓ Découvrir</div>
      </header>

      {/* ── CHAMBRES ── */}
      <section className="hoc-sec">
        <div className="hoc-k">Nos chambres</div>
        <div className="hoc-sh">Choisissez votre cocon</div>
        <div className="hoc-rooms">
          {rooms.map((r) => (
            <div className="hoc-room" key={r.n}>
              <div className="hoc-room-img" style={{ backgroundImage: `url("${r.img}"), ${r.g}` }} aria-hidden="true"><span className="hoc-room-tag">Dès {r.p} / nuit</span></div>
              <div className="hoc-room-b">
                <div className="hoc-room-n">{r.n}</div>
                <div className="hoc-room-d">{r.d}</div>
                <button type="button" className="hoc-room-cta" data-book-demo>Réserver →</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── EXPÉRIENCE ── */}
      <section className="hoc-sec alt">
        <div className="hoc-k">L&apos;expérience</div>
        <div className="hoc-sh">Tout pour un séjour parfait</div>
        <div className="hoc-am">
          {[
            { i: "♨️", t: "Spa & thermes" },
            { i: "🥐", t: "Petit-déjeuner maison" },
            { i: "🌿", t: "Jardin & terrasse" },
            { i: "🅿️", t: "Parking privé" },
            { i: "🛎️", t: "Conciergerie 24/7" },
            { i: "📶", t: "Wi-Fi rapide" },
          ].map((a) => (
            <div className="hoc-amc" key={a.t}><span>{a.i}</span>{a.t}</div>
          ))}
        </div>
      </section>

      {/* ── AVIS ── */}
      <section className="hoc-sec">
        <div className="hoc-k">Ils ont séjourné</div>
        <div className="hoc-sh">4,9 / 5 — l&apos;avis des voyageurs</div>
        <div className="hoc-revs">
          {reviews.map((r) => (
            <div className="hoc-rev" key={r.n}>
              <div className="hoc-rev-s">★★★★★</div>
              <div className="hoc-rev-t">« {r.t} »</div>
              <div className="hoc-rev-n">{r.n} · exemple</div>
            </div>
          ))}
        </div>
      </section>

      {!target && (
        <section className="hoc-sec alt">
          <div className="hoc-warn">
            <b>Aucune cible active.</b> Va dans{" "}
            <Link href="/admin/humain/site-internet" className="hoc-warn-a">l&apos;admin Site internet</Link>{" "}
            et clique <b>« 🎯 Cibler »</b> sur le commerce que tu démarches. Il apparaîtra à la fin de la réservation.
          </div>
        </section>
      )}

      <footer className="hoc-foot">Hôtel du Collectif · démonstration Popey</footer>

      {/* Barre fixe */}
      <div className="hoc-bar">
        <button type="button" className="hoc-bar-a ghost" data-book-demo>💬 Concierge</button>
        <button type="button" className="hoc-bar-a solid" data-book-demo>📅 Réserver</button>
      </div>

      {target && <DemarchageBooking target={target} hostNom="Hôtel du Collectif" accent={ACCENT} />}
    </main>
  );
}

const CSS = `
.hoc{--a:${ACCENT};--ink:#141210;--cream:#F7F3EC;--muted:#6E6A62;--line:#E7E2D8;--gold:#C9A24A;
  font-family:'Inter',system-ui,-apple-system,sans-serif;color:var(--ink);background:var(--cream);max-width:520px;margin:0 auto;-webkit-font-smoothing:antialiased;position:relative;padding-bottom:76px;}
.hoc *{box-sizing:border-box;}
.hoc .hoc-demo{background:#141210;color:#D8CDB6;font-size:11px;text-align:center;padding:7px 14px;letter-spacing:.04em;}
/* HERO */
.hoc .hoc-hero{position:relative;min-height:560px;display:flex;flex-direction:column;overflow:hidden;}
.hoc .hoc-bg{position:absolute;inset:0;z-index:0;background-color:#16211F;background-repeat:no-repeat;background-position:center;background-size:cover;
  background-image:
    url("https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=70"),
    radial-gradient(120% 80% at 18% 8%,rgba(201,162,74,.45),transparent 52%),
    radial-gradient(110% 90% at 92% 18%,rgba(28,91,99,.7),transparent 58%),
    linear-gradient(160deg,#25433F 0%,#16211F 56%,#0E1513 100%);}
.hoc .hoc-veil{position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(9,13,11,.5),rgba(9,13,11,.28) 32%,rgba(9,13,11,.78) 78%,rgba(9,13,11,.95));}
.hoc .hoc-top{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;padding:20px 22px 0;}
.hoc .hoc-spacer{flex:1;min-height:70px;}
.hoc .hoc-brand{font-family:Georgia,serif;color:#fff;font-size:17px;font-weight:600;letter-spacing:.01em;}
.hoc .hoc-open{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:rgba(255,255,255,.9);background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);border-radius:999px;padding:6px 11px;}
.hoc .hoc-open i{width:6px;height:6px;border-radius:50%;background:#5FD98A;box-shadow:0 0 0 3px rgba(95,217,138,.3);}
.hoc .hoc-hero-body{position:relative;z-index:2;padding:0 20px;}
.hoc .hoc-eyebrow{font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.82);font-weight:600;}
.hoc .hoc-h1{font-family:Georgia,serif;color:#fff;font-weight:600;font-size:37px;line-height:1.06;margin:10px 0 0;letter-spacing:-.01em;text-shadow:0 3px 24px rgba(0,0,0,.4);}
.hoc .hoc-meta{display:flex;align-items:center;gap:8px;margin-top:13px;color:#fff;font-size:13px;font-weight:700;}
.hoc .hoc-stars{color:var(--gold);letter-spacing:1px;}
.hoc .hoc-meta .hoc-sub{opacity:.8;font-weight:500;}
/* Assistante */
.hoc .hoc-assist{margin-top:18px;background:rgba(255,255,255,.14);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);
  border:1px solid rgba(255,255,255,.24);border-radius:22px;padding:15px 15px 16px;box-shadow:0 24px 60px -24px rgba(0,0,0,.7);animation:hocUp .6s cubic-bezier(.2,.8,.2,1);}
@keyframes hocUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
.hoc .hoc-ahead{display:flex;align-items:center;gap:10px;}
.hoc .hoc-av{position:relative;width:38px;height:38px;border-radius:12px;flex:none;display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;
  background:linear-gradient(140deg,#ffffff33,#ffffff11),var(--a);box-shadow:0 6px 16px -6px rgba(0,0,0,.5);}
.hoc .hoc-av::after{content:"";position:absolute;inset:-4px;border-radius:15px;border:1.5px solid rgba(255,255,255,.5);opacity:0;animation:hocRing 2s ease-out infinite;}
@keyframes hocRing{0%{opacity:.55;transform:scale(1)}100%{opacity:0;transform:scale(1.35)}}
.hoc .hoc-anm{display:block;color:#fff;font-size:13.5px;font-weight:800;line-height:1.1;}
.hoc .hoc-aon{display:flex;align-items:center;gap:5px;font-size:10.5px;color:rgba(255,255,255,.85);margin-top:2px;}
.hoc .hoc-aon i{width:6px;height:6px;border-radius:50%;background:#5FD98A;}
.hoc .hoc-say{color:#fff;font-size:14px;line-height:1.5;margin:12px 2px 0;text-shadow:0 1px 8px rgba(0,0,0,.3);}
.hoc .hoc-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;}
.hoc .hoc-chip{display:inline-flex;align-items:center;gap:7px;border:none;font-family:inherit;cursor:pointer;border-radius:999px;padding:13px 17px;font-size:13.5px;font-weight:800;}
.hoc .hoc-chip.primary{background:#fff;color:#141210;flex:1;justify-content:center;min-width:160px;box-shadow:0 12px 26px -12px rgba(0,0,0,.6);}
.hoc .hoc-chip.ghost{background:rgba(255,255,255,.16);color:#fff;border:1px solid rgba(255,255,255,.3);}
.hoc .hoc-chip:active{transform:translateY(1px);}
.hoc .hoc-scroll{position:relative;z-index:2;text-align:center;color:rgba(255,255,255,.7);font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;padding:14px 0 14px;}
/* SECTIONS */
.hoc .hoc-sec{padding:34px 22px;}
.hoc .hoc-sec.alt{background:#fff;border-top:1px solid var(--line);border-bottom:1px solid var(--line);}
.hoc .hoc-k{font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--a);font-weight:700;}
.hoc .hoc-sh{font-family:Georgia,serif;font-size:23px;font-weight:600;margin-top:7px;line-height:1.15;}
.hoc .hoc-rooms{display:flex;flex-direction:column;gap:14px;margin-top:18px;}
.hoc .hoc-room{border:1px solid var(--line);border-radius:18px;overflow:hidden;background:#fff;box-shadow:0 18px 40px -30px rgba(0,0,0,.5);}
.hoc .hoc-room-img{position:relative;height:140px;background-size:cover;background-position:center;background-color:#20302E;}
.hoc .hoc-room-tag{position:absolute;bottom:10px;left:12px;background:rgba(255,255,255,.92);color:#141210;font-size:12px;font-weight:800;border-radius:999px;padding:6px 12px;}
.hoc .hoc-room-b{padding:14px 15px 15px;}
.hoc .hoc-room-n{font-family:Georgia,serif;font-size:17px;font-weight:600;}
.hoc .hoc-room-d{font-size:13px;color:var(--muted);line-height:1.5;margin-top:4px;}
.hoc .hoc-room-cta{margin-top:12px;background:var(--a);color:#fff;border:none;border-radius:11px;padding:11px 16px;font-size:13.5px;font-weight:800;font-family:inherit;cursor:pointer;box-shadow:0 12px 24px -12px var(--a);}
.hoc .hoc-am{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px;}
.hoc .hoc-amc{display:flex;align-items:center;gap:11px;background:var(--cream);border:1px solid var(--line);border-radius:13px;padding:13px 14px;font-size:13.5px;font-weight:600;}
.hoc .hoc-amc span{font-size:20px;}
.hoc .hoc-revs{display:flex;flex-direction:column;gap:12px;margin-top:18px;}
.hoc .hoc-rev{border:1px solid var(--line);border-radius:15px;padding:15px 16px;background:#fff;}
.hoc .hoc-rev-s{color:var(--gold);font-size:14px;letter-spacing:1px;}
.hoc .hoc-rev-t{font-size:13.5px;font-style:italic;line-height:1.5;margin-top:8px;color:#2A2620;}
.hoc .hoc-rev-n{font-size:11.5px;color:var(--muted);margin-top:9px;}
.hoc .hoc-warn{background:#FFF7E8;border:1px solid #F0DCA8;border-radius:13px;padding:14px 16px;font-size:13.5px;line-height:1.55;color:#7A5A16;}
.hoc .hoc-warn-a{color:#B45309;font-weight:800;}
.hoc .hoc-foot{text-align:center;font-size:11.5px;color:var(--muted);padding:22px;}
/* Barre fixe */
.hoc .hoc-bar{position:fixed;left:0;right:0;bottom:0;z-index:40;max-width:520px;margin:0 auto;display:flex;gap:9px;padding:10px 12px calc(11px + env(safe-area-inset-bottom));
  background:rgba(247,243,236,.96);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-top:1px solid var(--line);}
.hoc .hoc-bar-a{flex:1;border:none;font-family:inherit;cursor:pointer;border-radius:22px;padding:13px;font-size:13.5px;font-weight:800;}
.hoc .hoc-bar-a.ghost{flex:none;background:#fff;border:1px solid var(--a);color:var(--a);padding:13px 18px;}
.hoc .hoc-bar-a.solid{background:var(--a);color:#fff;box-shadow:0 12px 24px -12px var(--a);}
@media(prefers-reduced-motion:reduce){.hoc .hoc-av::after,.hoc .hoc-assist{animation:none;}}
@media(min-width:600px){.hoc .hoc-h1{font-size:44px;}.hoc .hoc-am{grid-template-columns:repeat(3,1fr);}}
`;
