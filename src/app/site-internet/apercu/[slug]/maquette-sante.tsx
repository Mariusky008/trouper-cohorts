// Maquette PROFIL C (santé encadrée) — SPEC « maquette configurable » v2.
// Un vrai site plein des données Google du praticien (photos, horaires, adresse,
// téléphone) + textes proposés par métier (catalogue déterministe). Au milieu :
// le configurateur (3 questions) qui met en avant LA brique qui le sert. Aucun
// avis, aucun WhatsApp (déontologie), encart urgence en pied. Une seule barre
// fixe (Appeler + Prendre RDV) ; l'accueil intelligent s'ouvre en surimpression.
import { LeadForm } from "../../[slug]/lead-form";
import { Gallery } from "./gallery";
import { ScrollReveal } from "./scroll-reveal";
import { AccueilIntelligent } from "./accueil-intelligent";
import { MaquetteAssistant } from "./maquette-demos";
import { ScanBeacon } from "./scan-beacon";
import { DemoTour } from "./demo-tour";
import { LivingHero } from "./living-hero";
import { CercleSection } from "./cercle-section";
import { ReseauSection } from "./reseau-section";
import { computeOpenState } from "@/lib/site-internet/opening-hours";
import type { Confirmation, Moteur, Profil } from "@/lib/site-internet/metier-profiles";
import type { MetierContent, Service, UseCase } from "@/lib/site-internet/metier-content";

export type ReviewSnippet = { name: string; text: string; stars: number | null };

export type MaquetteSanteProps = {
  slug: string;
  profil: Profil;
  nom: string;
  metierLabel: string;
  villeAff: string;
  adresse: string;
  horaires: Array<{ jours?: string; horaires?: string }>;
  photos: string[];
  accent: string;
  accentSoft: string;
  showUrgence: boolean;
  termePublic: string;
  confirmation: Confirmation;
  moteur: Moteur;
  busyWord: string;
  content: MetierContent;
  // Avis : "prominent" (A), "doux" (B), "none" (C). Rien ne s'affiche sans vrais avis.
  avisMode: "prominent" | "doux" | "none";
  note: string | null;
  reviewsCount: number | null;
  reviewsTop: ReviewSnippet[];
  reviewLink: string; // deep link « écrire un avis Google »
  reviewsUrl: string; // page des avis Google existants
  bookingHref: string; // page de réservation réelle si dispos configurées, sinon ""
  services: Service[]; // prestations RÉELLES saisies par le pro (jamais de tarif inventé publié)
  proMotifs: UseCase[]; // motifs saisis par le pro → override des motifs de la config métier
  published: boolean; // true = site en ligne pour de vrai (retire l'habillage démo)
  telHref: string;
  waHref: string; // WhatsApp (profil A seulement, sinon "")
  doctolibHref: string; // réservation en ligne existante (profil B), sinon ""
  mapsHref: string;
  phoneDisplay: string;
  offer: { text: string; until: string | null } | null; // « Offre du moment » (bandeau haut de site)
  isResto: boolean; // vocabulaire « tables » vs « créneaux » (Démo Vivante)
  clientWord: string; // terme public au singulier (client / patient…) pour la Démo Vivante
};

export function MaquetteSante(p: MaquetteSanteProps) {
  const {
    slug, nom, metierLabel, villeAff, adresse, horaires, photos, accent, accentSoft,
    showUrgence, termePublic, confirmation, moteur, busyWord, content,
    avisMode, note, reviewsCount, reviewsTop, reviewLink, reviewsUrl, bookingHref, services, proMotifs, published, doctolibHref, mapsHref, phoneDisplay, offer, isResto, clientWord,
  } = p;
  // « Prendre rendez-vous » : vraie page de réservation si configurée, sinon accueil (démo).
  const rdvProps = bookingHref ? { href: bookingHref } : { "data-accueil-open": true };
  const bookLabel = confirmation === "devis" ? "Demander un devis" : confirmation === "rappel" ? "Être rappelé(e)" : confirmation === "acompte" ? "Réserver ma date" : "Prendre rendez-vous";

  // ── Sections « Pour quoi venir me voir ? » (motifs) et « Mes accompagnements »
  // (menu). Pilotées par la config métier : rien à afficher → section omise.
  // Honnêteté tarifs : les vrais tarifs viennent du pro (services) ; en maquette
  // on montre des EXEMPLES de présentation (labellisés), sans euro inventé.
  const motifs = (Array.isArray(proMotifs) && proMotifs.length ? proMotifs : content.motifs) ?? [];
  const proServices = Array.isArray(services) ? services : [];
  const demoServices = content.demoServices ?? [];
  const serviceList = proServices.length ? proServices : published ? [] : demoServices;
  const servicesAreExamples = !proServices.length && !published && demoServices.length > 0;
  // CTA d'une prestation : vraie page de réservation si dispo, sinon l'accueil
  // pré-qualifié sur cette prestation (effet « réservation sur la bonne offre »).
  const svcCta = (name: string) => (bookingHref ? { href: bookingHref } : { "data-accueil-motif": `Je voudrais réserver : ${name}` });
  const stars = (n: number | null) => "★".repeat(n != null ? Math.max(1, Math.min(5, Math.round(n))) : 5);
  const showAvis = avisMode !== "none" && note != null && reviewsCount != null && reviewsCount > 0;
  const roleLine = [metierLabel, villeAff].filter(Boolean).join(" · ");
  const gallery = photos;
  const shortAddr = adresse.replace(/,?\s*France\s*$/i, "").trim();
  const heures = horaires.filter((h) => h.jours || h.horaires).slice(0, 7);
  // Badge « Ouvert maintenant » depuis les vrais horaires (null si incertain).
  const openState = computeOpenState(horaires);
  const openLabel = openState
    ? openState.open
      ? openState.until === "24 h"
        ? "Ouvert 24 h/24"
        : `Ouvert · ferme à ${openState.until}`
      : openState.next
        ? `Fermé · ouvre à ${openState.next}`
        : "Fermé aujourd'hui"
    : "";

  // ── L'assistante « Confier une tâche » (P1b) : une bulle unique, 3 tâches
  // guidées, animations réutilisées. Déonto : avis + créneau seulement en commerce
  // (avisMode « prominent » = avis_sollicitation) ; santé/droit → répondre +
  // préparer. Le vrai compteur d'avis (#mqd-avis-count) se met à jour à la fin de
  // la démo avis. Mode maquette propriétaire uniquement.
  const assistantData = {
    nom,
    clientTerm: (termePublic || "client").replace(/s$/u, ""),
    reviewsCount,
    slot: "samedi 15 h 30",
    avisAllowed: avisMode === "prominent",
  };

  // Carte d'un avis Google réel (jamais inventé). Réutilisée pour les 2 mis en
  // avant ET ceux révélés via « Voir plus ».
  const reviewCard = (r: ReviewSnippet, i: number) => (
    <div className="rev-c" key={i}>
      <div className="q">« {r.text.length > 180 ? r.text.slice(0, 179).trimEnd() + "…" : r.text} »</div>
      <div className="a"><span className="s">{stars(r.stars)}</span>{r.name ? ` · ${r.name}` : ""} · Google</div>
    </div>
  );

  return (
    <main className="mqc">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .mqc{--bg:#F6F4EF;--surface:#FFF;--ink:#1C201C;--muted:#71766C;--line:#E7E4DC;
            --accent:${accent};--accent-soft:${accentSoft};--cream:#FBFAF7;--gold:#B8862F;
            font-family:'Inter',system-ui,-apple-system,sans-serif;color:var(--ink);background:var(--bg);
            max-width:520px;margin:0 auto;scroll-behavior:smooth;overscroll-behavior-y:none;-webkit-font-smoothing:antialiased;}
          .mqc *{box-sizing:border-box;}
          .mqc .banner{display:block;width:100%;border:none;font-family:inherit;background:var(--accent-soft);color:var(--accent);font-size:12px;font-weight:600;text-align:center;padding:10px 14px;line-height:1.35;cursor:pointer;}
          .mqc .banner b{font-weight:700;}
          .mqc .banner:hover{filter:brightness(.98);}
          /* OFFRE DU MOMENT (bandeau haut de site, piloté par le pro) */
          .mqc .offer-band{display:flex;align-items:center;gap:11px;width:100%;text-decoration:none;
            background:linear-gradient(100deg,var(--accent),color-mix(in srgb,var(--accent) 72%,#000));
            color:#fff;padding:12px 16px;line-height:1.35;}
          .mqc .offer-band .oi{flex:none;font-size:17px;line-height:1;}
          .mqc .offer-band .ot{font-size:13px;font-weight:600;flex:1;min-width:0;}
          .mqc .offer-band .ot b{font-weight:800;}
          .mqc .offer-band .og{flex:none;background:rgba(255,255,255,.2);border-radius:20px;padding:6px 13px;font-size:12px;font-weight:700;white-space:nowrap;}
          .mqc .offer-band:hover .og{background:rgba(255,255,255,.32);}
          @media (min-width:860px){.mqc .offer-band{padding:14px 22px;} .mqc .offer-band .ot{font-size:15px;}}
          /* HERO photo */
          .mqc .hero{position:relative;height:290px;overflow:hidden;}
          .mqc .hero .img{position:absolute;inset:0;background:linear-gradient(160deg,#5E6B5C,#39423A);background-size:cover;background-position:center;}
          .mqc .hero .veil{position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,20,15,.12),rgba(15,20,15,.86));}
          .mqc .hero .txt{position:absolute;left:0;right:0;bottom:0;padding:20px;color:var(--cream);}
          .mqc .hero .k{font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;opacity:.85;}
          .mqc .hero h2{font-family:Georgia,serif;font-weight:600;font-size:27px;line-height:1.08;margin:7px 0 5px;}
          .mqc .hero .meta{display:flex;align-items:center;flex-wrap:wrap;gap:9px;margin-top:10px;font-size:12.5px;font-weight:600;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.45);}
          .mqc .hero .meta .m-note{display:inline-flex;align-items:center;gap:5px;}
          .mqc .hero .meta .m-note b{color:#FFCF4D;font-weight:400;font-size:14px;line-height:1;}
          .mqc .hero .meta .m-sub{opacity:.85;font-weight:500;}
          .mqc .hero .meta .m-sep{opacity:.4;}
          .mqc .hero .meta .m-open{display:inline-flex;align-items:center;gap:6px;}
          .mqc .hero .meta .m-open i{width:7px;height:7px;border-radius:50%;background:#5FD98A;box-shadow:0 0 0 3px rgba(95,217,138,.32);}
          .mqc .hero .meta .m-open.off{opacity:.92;}
          .mqc .hero .meta .m-open.off i{background:#D6D3C8;box-shadow:none;}
          /* Apparition au scroll (classe ajoutée par ScrollReveal ; sinon visible) */
          .mqc .rvl{opacity:0;transform:translateY(16px);transition:opacity .55s ease,transform .55s ease;}
          .mqc .rvl.rvl-in{opacity:1;transform:none;}
          .mqc .hero .sub{font-size:12.5px;opacity:.85;margin-bottom:13px;}
          .mqc .hero .acts{display:flex;gap:8px;}
          .mqc .hero .acts a{flex:1;text-align:center;text-decoration:none;border-radius:24px;padding:12px 10px;font-size:12px;font-weight:600;cursor:pointer;line-height:1.15;}
          .mqc .a-call{background:var(--accent-soft);color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent);}
          .mqc .a-rdv{background:var(--accent);color:var(--cream);}
          /* TEASER */
          .mqc .teaser{background:var(--accent-soft);border-bottom:1px solid var(--line);padding:13px 18px;display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--ink);}
          .mqc .teaser .ic{flex:none;color:var(--accent);display:flex;}
          .mqc .teaser .tx{font-size:12.5px;line-height:1.45;}
          .mqc .teaser .tx b{color:var(--accent);font-weight:600;}
          .mqc .teaser .go2{margin-left:auto;flex:none;color:var(--accent);font-weight:700;font-size:16px;}
          /* SECTIONS */
          .mqc section{padding:24px 20px;}
          .mqc .alt{background:var(--surface);border-top:1px solid var(--line);border-bottom:1px solid var(--line);}
          .mqc .sec-k{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--accent);font-weight:600;margin-bottom:8px;}
          .mqc .sec-h{font-family:Georgia,serif;font-weight:600;font-size:20px;margin-bottom:9px;line-height:1.2;}
          .mqc .sec-p{font-size:13.5px;color:var(--muted);line-height:1.6;}
          .mqc .proposed{font-size:10.5px;color:var(--muted);font-style:italic;margin-top:10px;opacity:.85;}
          /* AVIS — prominent (A) / doux (B) */
          .mqc .rev-top{display:flex;align-items:center;gap:11px;margin-bottom:13px;}
          .mqc .rev-score{font-family:Georgia,serif;font-size:30px;font-weight:600;line-height:1;}
          .mqc .rev-stars{color:var(--gold);font-size:15px;letter-spacing:1px;}
          .mqc .rev-meta{font-size:11.5px;color:var(--muted);margin-top:3px;}
          .mqc .rev-c{border:1px solid var(--line);border-radius:12px;padding:12px 14px;background:var(--bg);margin-bottom:9px;}
          .mqc .rev-c .q{font-size:12.5px;line-height:1.45;font-style:italic;}
          .mqc .rev-c .a{font-size:11px;color:var(--muted);margin-top:6px;}
          .mqc .rev-c .a .s{color:var(--gold);}
          .mqc .rev-line{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--muted);}
          .mqc .rev-line .st{color:var(--gold);letter-spacing:.5px;}
          .mqc .rev-line b{color:var(--ink);font-weight:600;}
          .mqc .rev-more{margin-bottom:4px;}
          .mqc .rev-more summary{list-style:none;cursor:pointer;font-size:12.5px;font-weight:600;color:var(--accent);padding:7px 0;}
          .mqc .rev-more summary::-webkit-details-marker{display:none;}
          .mqc .rev-more summary::after{content:" ▾";}
          .mqc .rev-more[open] summary::after{content:" ▴";}
          .mqc .rev-links{display:flex;flex-wrap:wrap;gap:9px;margin-top:13px;}
          .mqc .rev-links a{flex:1;min-width:145px;text-align:center;text-decoration:none;border:1px solid var(--accent);border-radius:22px;padding:11px;font-size:12.5px;font-weight:600;color:var(--accent);background:var(--surface);}
          .mqc .rev-links a.leave{background:var(--gold);border-color:var(--gold);color:#fff;}
          /* CONTACT (WhatsApp A / Doctolib B) */
          .mqc .contact{display:flex;gap:10px;margin-top:14px;}
          .mqc .contact a{flex:1;text-align:center;border:1px solid var(--accent);color:var(--accent);border-radius:22px;padding:11px;font-size:12.5px;font-weight:600;text-decoration:none;}
          .mqc .contact a.wa{border-color:#25843f;color:#1a6b31;}
          /* CARTES */
          .mqc .cards{display:flex;flex-direction:column;gap:9px;margin-top:12px;}
          .mqc .c{border:1px solid var(--line);border-radius:12px;padding:13px 14px;background:var(--bg);}
          .mqc .c h4{font-family:Georgia,serif;font-size:14.5px;font-weight:600;margin-bottom:3px;}
          .mqc .c p{font-size:11.5px;color:var(--muted);line-height:1.45;}
          /* POUR QUOI VENIR ME VOIR (motifs cliquables) */
          .mqc .uc{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:14px;}
          .mqc .uc button{display:flex;flex-direction:column;align-items:flex-start;gap:5px;border:1px solid var(--line);background:var(--bg);border-radius:13px;padding:13px;text-align:left;font-family:inherit;cursor:pointer;color:var(--ink);transition:border-color .15s ease,transform .15s ease,box-shadow .15s ease;}
          .mqc .uc button:hover{border-color:var(--accent);transform:translateY(-1px);box-shadow:0 6px 16px -10px rgba(0,0,0,.35);}
          .mqc .uc .uc-i{font-size:21px;line-height:1;}
          .mqc .uc .uc-t{font-family:Georgia,serif;font-size:14px;font-weight:600;line-height:1.2;}
          .mqc .uc .uc-d{font-size:11px;color:var(--muted);line-height:1.4;}
          .mqc .uc-hint{font-size:11.5px;color:var(--muted);margin-top:12px;line-height:1.5;}
          .mqc .uc-hint b{color:var(--accent);font-weight:600;}
          /* MES ACCOMPAGNEMENTS (menu de prestations) */
          .mqc .svc{display:flex;flex-direction:column;gap:8px;margin-top:14px;}
          .mqc .svc .s{display:flex;align-items:center;gap:12px;border:1px solid var(--line);border-radius:13px;padding:13px 14px;background:var(--surface);}
          .mqc .svc .s .l{min-width:0;flex:1;}
          .mqc .svc .s .l .n{font-family:Georgia,serif;font-size:15px;font-weight:600;line-height:1.2;}
          .mqc .svc .s .l .meta{font-size:11.5px;color:var(--muted);margin-top:3px;}
          .mqc .svc .s .l .d{font-size:11.5px;color:var(--muted);line-height:1.45;margin-top:4px;}
          .mqc .svc .s .r{flex:none;text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:8px;}
          .mqc .svc .s .r .price{font-family:Georgia,serif;font-size:15px;font-weight:600;white-space:nowrap;}
          .mqc .svc .s .r .price.ask{font-size:11px;color:var(--muted);font-family:inherit;font-weight:500;}
          .mqc .svc .s .r .cta{text-decoration:none;background:var(--accent);color:var(--cream);border-radius:20px;padding:8px 14px;font-size:11.5px;font-weight:600;white-space:nowrap;cursor:pointer;}
          /* HORAIRES + CARTE */
          .mqc .hours{display:flex;flex-direction:column;margin-top:4px;}
          .mqc .hr{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line);font-size:12.5px;}
          .mqc .hr:last-child{border:none;}
          .mqc .hr .h{color:var(--muted);}
          .mqc .map{margin-top:12px;border:1px solid var(--line);border-radius:12px;overflow:hidden;}
          .mqc .map .mapf{width:100%;height:160px;border:0;display:block;}
          .mqc .map .addr{padding:11px 13px;background:var(--surface);font-size:12px;display:flex;justify-content:space-between;align-items:center;gap:10px;}
          .mqc .map .addr a{color:var(--accent);font-weight:600;text-decoration:none;white-space:nowrap;font-size:11.5px;}
          /* FAQ */
          .mqc .faq details{border-bottom:1px solid var(--line);}
          .mqc .faq summary{padding:12px 0;font-size:13px;font-weight:500;cursor:pointer;list-style:none;display:flex;justify-content:space-between;gap:10px;}
          .mqc .faq summary::-webkit-details-marker{display:none;}
          .mqc .faq summary::after{content:"+";color:var(--accent);font-weight:600;}
          .mqc .faq details[open] summary::after{content:"–";}
          .mqc .faq p{font-size:12.5px;color:var(--muted);line-height:1.55;padding:0 0 12px;}
          /* CONFIGURATEUR */
          .mqc .cfg{background:var(--accent);color:var(--cream);padding:24px 18px;}
          .mqc .cfg-lead{font-family:Georgia,serif;font-weight:600;font-size:20px;line-height:1.22;}
          .mqc .cfg-sub{font-size:12.5px;color:#CFE0D3;margin:8px 0 18px;line-height:1.5;}
          .mqc .cfg .q{margin-bottom:16px;}
          .mqc .cfg .lab{font-size:11.5px;font-weight:600;margin-bottom:8px;color:#DDEAE0;}
          .mqc .cfg .opts{display:flex;flex-direction:column;gap:6px;}
          .mqc .cfg .opt{border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.06);border-radius:11px;padding:11px 13px;font-size:12.5px;font-family:inherit;cursor:pointer;text-align:left;color:var(--cream);}
          .mqc .cfg .opt.on{background:var(--cream);color:var(--accent);font-weight:600;border-color:var(--cream);}
          .mqc .cfg .go{width:100%;background:var(--cream);color:var(--accent);border:none;border-radius:24px;padding:13px;font-size:13.5px;font-weight:600;font-family:inherit;cursor:pointer;margin-top:4px;}
          .mqc .cfg .go:disabled{opacity:.4;cursor:not-allowed;}
          .mqc .result{background:var(--accent-soft);border-top:1px solid var(--line);padding:22px 18px;}
          .mqc .result .ack{font-size:12.5px;line-height:1.5;margin-bottom:14px;}
          .mqc .result .ack b{color:var(--accent);}
          .mqc .feat{border:1px solid var(--accent);border-radius:13px;padding:15px;background:var(--surface);position:relative;}
          .mqc .feat .pill{position:absolute;top:-9px;left:13px;background:var(--accent);color:var(--cream);font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;font-weight:600;padding:3px 9px;border-radius:12px;}
          .mqc .feat h4{font-family:Georgia,serif;font-size:15px;font-weight:600;margin-bottom:5px;}
          .mqc .feat p{font-size:12px;color:var(--muted);line-height:1.5;}
          .mqc .feat ul{margin-top:8px;list-style:none;}
          .mqc .feat li{font-size:11.5px;padding:4px 0 4px 15px;position:relative;line-height:1.4;}
          .mqc .feat li::before{content:"—";position:absolute;left:0;color:var(--accent);}
          .mqc .others{margin-top:10px;font-size:11.5px;color:var(--muted);line-height:1.5;}
          /* CLÔTURE */
          .mqc .close{padding:24px 20px 28px;text-align:center;border-top:1px solid var(--line);}
          .mqc .close .t{font-family:Georgia,serif;font-size:18px;font-weight:600;margin-bottom:6px;}
          .mqc .close .p{font-size:12.5px;color:var(--muted);line-height:1.55;}
          .mqc .close .p b{color:var(--ink);}
          .mqc .close .lead{margin-top:16px;}
          .mqc .close .urg{font-size:10.5px;color:var(--muted);margin-top:14px;line-height:1.45;}
          .mqc .close .urg b{color:var(--ink);}
          /* BARRE FIXE unique */
          .mqc .bar{position:sticky;bottom:0;background:rgba(255,255,255,.97);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border-top:1px solid var(--line);padding:10px 12px calc(12px + env(safe-area-inset-bottom));display:flex;gap:8px;z-index:20;}
          .mqc .bar a{flex:1;text-align:center;text-decoration:none;border-radius:22px;padding:12px 10px;font-size:12px;font-weight:600;cursor:pointer;line-height:1.15;}
          .mqc .bar .call{background:var(--accent-soft);border:1px solid var(--accent);color:var(--accent);}
          .mqc .bar .rdv{background:var(--accent);color:var(--cream);}

          /* ══════════════ ORDINATEUR (≥ 860 px) ══════════════ */
          @media (min-width:860px){
            body{background:#E9E7E0;}
            .mqc{max-width:1120px;box-shadow:0 0 70px -24px rgba(0,0,0,.16);background:var(--surface);}
            .mqc .banner{font-size:13px;padding:12px 20px;}
            /* HERO : grande bannière */
            .mqc .hero{height:480px;}
            .mqc .hero .txt{padding:0 max(48px,calc((100% - 780px)/2)) 48px;}
            .mqc .hero .k{font-size:11px;letter-spacing:.22em;}
            .mqc .hero h2{font-size:50px;line-height:1.03;margin:12px 0 10px;}
            .mqc .hero .sub{font-size:15.5px;}
            .mqc .hero .meta{font-size:14px;gap:12px;margin-top:15px;}
            .mqc .hero .acts{max-width:470px;margin-top:20px;gap:12px;}
            .mqc .hero .acts a{font-size:14px;padding:15px;border-radius:28px;}
            /* SECTIONS : colonne lisible centrée, fond pleine largeur */
            .mqc section{padding:60px max(40px,calc((100% - 780px)/2));}
            .mqc .sec-k{font-size:11px;letter-spacing:.22em;}
            .mqc .sec-h{font-size:30px;line-height:1.18;}
            .mqc .sec-p{font-size:16.5px;line-height:1.75;}
            .mqc .uc{grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:22px;}
            .mqc .uc .uc-t{font-size:16px;}
            .mqc .uc .uc-d{font-size:12.5px;}
            .mqc .svc{margin-top:22px;gap:10px;}
            .mqc .svc .s .l .n{font-size:17px;}
            .mqc .map .mapf{height:230px;}
            .mqc .close{padding:64px max(40px,calc((100% - 780px)/2)) 110px;}
            .mqc .close .t{font-size:28px;}
            .mqc .close .p{font-size:15px;}
            /* Barre → pilule flottante centrée, élégante */
            .mqc .bar{max-width:460px;margin:0 auto;bottom:24px;border:1px solid var(--line);border-radius:28px;box-shadow:0 20px 44px -16px rgba(0,0,0,.32);padding:10px;}
            .mqc .bar a{padding:14px;font-size:13.5px;}
          }
          @media (min-width:1180px){
            .mqc{margin:0 auto;}
          }
        `,
        }}
      />

      <AccueilIntelligent
        slug={slug}
        profil="C"
        praticien={nom}
        termePublic={termePublic}
        accent={accent}
        faq={content.faq}
        showUrgence={showUrgence}
        confirmation={confirmation}
        moteur={moteur}
        busyWord={busyWord}
        hideBubble
        cloudTts={!published}
      />

      {/* Habillage DÉMO : teaser + simulation pro + bandeau. Retiré une fois publié. */}
      {!published && <ScanBeacon slug={slug} />}
      {!published && (
        <DemoTour
          slug={slug}
          nom={nom}
          metierLabel={metierLabel}
          villeAff={villeAff}
          note={note}
          reviewsCount={reviewsCount}
          avisAllowed={avisMode === "prominent"}
          isResto={isResto}
          clientWord={clientWord}
          demoChat={content.demoChat}
        />
      )}
      {!published && <MaquetteAssistant accent={accent} data={assistantData} slug={slug} />}
      <ScrollReveal />

      {!published && (
        <button type="button" className="banner" data-assistant-open>
          ✦ Maquette préparée pour {nom} — <b>vous, le pro&nbsp;: confiez une tâche à votre assistante</b> ↓
        </button>
      )}

      {offer && offer.text && (
        <a className="offer-band" href={`/offre/${slug}`}>
          <span className="oi">🎉</span>
          <span className="ot"><b>Offre du moment</b> · {offer.text}</span>
          <span className="og">Réserver →</span>
        </a>
      )}

      <LivingHero
        nom={nom}
        roleLine={roleLine}
        photos={photos}
        accent={accent}
        note={note}
        reviewsCount={reviewsCount}
        showAvis={showAvis}
        openLabel={openLabel}
        openOpen={Boolean(openState?.open)}
        bookLabel={bookLabel}
        bookHref={bookingHref}
        hasGallery={gallery.length > 0}
      />

      {!published && avisMode === "prominent" && <ReseauSection ville={villeAff} accent={accent} />}

      <section>
        <div className="sec-k">Mon approche</div>
        <div className="sec-h">{content.approcheTitre}</div>
        <div className="sec-p">{content.approcheCorps}</div>
      </section>

      {motifs.length > 0 && (
        <section className="alt">
          <div className="sec-k">Pour quoi venir me voir&nbsp;?</div>
          <div className="sec-h">Vous vous reconnaissez&nbsp;?</div>
          <div className="uc">
            {motifs.map((m) => (
              <button type="button" key={m.title} data-accueil-motif={m.title}>
                <span className="uc-i">{m.icon}</span>
                <span className="uc-t">{m.title}</span>
                <span className="uc-d">{m.desc}</span>
              </button>
            ))}
          </div>
          <div className="uc-hint">Touchez ce qui vous ressemble&nbsp;: <b>l&apos;accueil vous répond</b> et prépare votre rendez-vous.</div>
        </section>
      )}

      {serviceList.length > 0 && (
        <section>
          <div className="sec-k">Prestations</div>
          <div className="sec-h">Mes accompagnements</div>
          <div className="svc">
            {serviceList.map((s, i) => (
              <div className="s" key={`${s.name}-${i}`}>
                <div className="l">
                  <div className="n">{s.name}</div>
                  {s.duration ? <div className="meta">{s.duration}</div> : null}
                  {s.desc ? <div className="d">{s.desc}</div> : null}
                </div>
                <div className="r">
                  {s.price ? <div className="price">{s.price}</div> : <div className="price ask">Sur demande</div>}
                  <a className="cta" {...svcCta(s.name)}>Choisir</a>
                </div>
              </div>
            ))}
          </div>
          {servicesAreExamples && (
            <div className="proposed">Exemple de présentation — vos prestations et tarifs, à personnaliser ensemble.</div>
          )}
        </section>
      )}

      {gallery.length > 0 && (
        <section className="alt gallery-sec" id="mq-gallery">
          <div className="sec-k">{avisMode === "prominent" ? "Le travail" : "Le lieu"}</div>
          <div className="sec-h">{avisMode === "prominent" ? "Nos réalisations" : "En images"}</div>
          <Gallery photos={gallery} nom={nom} />
        </section>
      )}

      {serviceList.length === 0 && content.consultTitre && content.consultCartes.length > 0 && (
        <section>
          <div className="sec-k">Consultations</div>
          <div className="sec-h">{content.consultTitre}</div>
          <div className="cards">
            {content.consultCartes.map((c) => (
              <div className="c" key={c.h}><h4>{c.h}</h4><p>{c.p}</p></div>
            ))}
          </div>
          <div className="proposed">Textes proposés, ajustables ensemble.</div>
        </section>
      )}

      {showAvis && avisMode === "prominent" && (
        <section className="alt">
          <div className="sec-k">Avis</div>
          <div className="rev-top">
            <div className="rev-score">{note}</div>
            <div><div className="rev-stars">{stars(Number((note || "0").replace(",", ".")))}</div><div className="rev-meta"><span id="mqd-avis-count">{reviewsCount}</span> avis Google</div></div>
          </div>
          {reviewsTop.slice(0, 2).map((r, i) => reviewCard(r, i))}
          {reviewsTop.length > 2 && (
            <details className="rev-more">
              <summary>Voir plus d&apos;avis</summary>
              {reviewsTop.slice(2).map((r, i) => reviewCard(r, i + 2))}
            </details>
          )}
          <div className="rev-links">
            <a href={reviewsUrl} target="_blank" rel="noreferrer">Voir tous les avis sur Google →</a>
            <a className="leave" href={reviewLink} target="_blank" rel="noreferrer">★ Laisser un avis</a>
          </div>
        </section>
      )}

      {showAvis && avisMode === "doux" && (
        <section className="alt">
          <div className="rev-line"><span className="st">{stars(Number((note || "0").replace(",", ".")))}</span> <b>{note}</b> · {reviewsCount} avis Google</div>
          {reviewsTop.slice(0, 1).map((r, i) => (
            <div className="rev-c" key={i} style={{ marginTop: 12 }}>
              <div className="q">« {r.text.length > 160 ? r.text.slice(0, 159).trimEnd() + "…" : r.text} »</div>
              <div className="a"><span className="s">{stars(r.stars)}</span> · Patient vérifié · Google</div>
            </div>
          ))}
          <div className="rev-links">
            <a href={reviewsUrl} target="_blank" rel="noreferrer">Voir les avis sur Google →</a>
          </div>
        </section>
      )}

      {avisMode === "prominent" && <CercleSection slug={slug} accent={accent} nom={nom} />}

      <section id="rdv">
        <div className="sec-k">Rendez-vous</div>
        <div className="sec-h">Horaires &amp; accès</div>
        {heures.length > 0 && (
          <div className="hours">
            {heures.map((h, i) => (
              <div className="hr" key={i}><span className="d">{h.jours || ""}</span><span className="h">{h.horaires || ""}</span></div>
            ))}
          </div>
        )}
        <div className="map">
          <iframe
            className="mapf"
            title={`Localisation de ${nom}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(`${nom} ${shortAddr || villeAff}`)}&z=15&output=embed`}
          />
          <div className="map-addr addr"><span>{shortAddr || villeAff}</span><a href={mapsHref} target="_blank" rel="noreferrer">Itinéraire →</a></div>
        </div>
        {doctolibHref && (
          <div className="contact">
            <a href={doctolibHref} target="_blank" rel="noreferrer">Réserver en ligne</a>
          </div>
        )}
      </section>

      <section className="alt faq">
        <div className="sec-k">Questions fréquentes</div>
        <div className="sec-h">Avant de venir</div>
        {content.faq.map((f, i) => (
          <details key={i}><summary>{f.q}</summary><p>{f.a}</p></details>
        ))}
      </section>

      {published ? (
        <div className="close" id="site-rappel">
          <div className="t">{nom}</div>
          <div className="p">
            {roleLine}
            {shortAddr ? <><br />{shortAddr}</> : null}
          </div>
          <div className="lead"><a className="a-rdv" {...rdvProps} style={{ display: "inline-block", textDecoration: "none", background: accent, color: "var(--cream)", borderRadius: 24, padding: "12px 22px", fontSize: 13, fontWeight: 600 }}>Prendre rendez-vous</a></div>
          {showUrgence && (
            <div className="urg"><b>En cas d’urgence</b> : 15 (Samu) · 3114 (prévention du suicide, 24 h/24) · 112</div>
          )}
        </div>
      ) : (
        <div className="close" id="site-rappel">
          <div className="t">Ce site peut être le vôtre.</div>
          <div className="p">
            Il vous plaît ? On le met en ligne sous 72 h — ou on change ce que vous voulez.<br />
            Sinon, ça s’arrête là — sans frais, sans relance.
            {phoneDisplay ? <><br /><b>Marius · {phoneDisplay}</b></> : null}
          </div>
          <div className="lead"><LeadForm slug={slug} /></div>
          {showUrgence && (
            <div className="urg"><b>En cas d’urgence</b> : 15 (Samu) · 3114 (prévention du suicide, 24 h/24) · 112</div>
          )}
        </div>
      )}

      <div className="bar">
        <a className="call" data-accueil-open>💬 Parler à mon assistante</a>
        <a className="rdv" {...rdvProps}>Prendre rendez-vous</a>
      </div>
    </main>
  );
}
