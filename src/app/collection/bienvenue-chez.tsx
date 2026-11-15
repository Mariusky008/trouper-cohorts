"use client";

/**
 * 👋 LA BIENVENUE « ENTRE CHEZ PABLITO » (`lib/direct/bienvenue.ts` : le pourquoi, les bulles, l'interrupteur) — 15
 * novembre 2026. Le nouveau venu est l'invité de Pablito, dans le VRAI univers du propriétaire (son décor du moment, sa
 * figurine dans son fauteuil, ses clés, la saison : `chez-pablito-serveur.ts`). La conversation avec Pablito, présentée
 * comme sur WhatsApp (comme la bienvenue d'avant, `bienvenue.tsx`, dont elle reprend le haut, le fil et les réponses),
 * devient la démo : au-dessus, son univers, où chaque chose se vit d'un toucher.
 *
 * Rien n'est enregistré : « Je le range ? » et le souvenir sont joués pour la bienvenue. Sans son univers (pas encore
 * adopté), `BienvenueSelonPablito` ouvre l'ancienne.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SONS_PABLITO } from "@/lib/direct/guide";
import { BULLES_CHEZ, REPONSES_CHEZ, SOUVENIRS_CHEZ, WEEKEND, momentDuMot, type UniversDePablito } from "@/lib/direct/bienvenue";
import type { CleUnivers } from "@/lib/direct/univers-creation";
import { VISIBILITES, type Visibilite } from "@/lib/direct/monde";
import { VISIBILITES_DITES, objetDe } from "@/lib/direct/visites";
import { Guide, debloquerLaVoix, useVoixBulle } from "./guide";
import { BienvenueTuto, PablitoDebout } from "./bienvenue";
import { TAILLE_FIGURINE, useCadreVisible } from "../univers/monde/monde";
import type { Boucle } from "@/lib/direct/compagnons";
import { ChatDePablito, STYLES_CHAT_BIENVENUE } from "./chat-bienvenue";

const mouvementReduit = () => typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
const heureDuTelephone = () => new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const borne = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

type Moi = { apres: number; t: string };
type Rangement = { choix: number; reponse?: "oui" | "non"; rappel?: boolean };

/** 👋 La bienvenue chez Pablito (son univers est là) : la conversation, son univers au-dessus, « Je crée ma figurine ». */
export function BienvenueChezPablito({ univers, onFini, onCreer }: { univers: UniversDePablito; onFini: () => void; onCreer: () => void }) {
  const [reduit] = useState(mouvementReduit);
  const [heure] = useState(heureDuTelephone);
  // la bulle en cours ; « Pablito écrit… » avant elle ; ses lettres déjà écrites ; ce qu'on lui a répondu
  const [i, setI] = useState(0);
  const [ecrit, setEcrit] = useState(() => !mouvementReduit());
  const [n, setN] = useState(0);
  const [moi, setMoi] = useState<Moi[]>([]);
  // ce qui se passe dans son univers
  const [revele, setRevele] = useState(false);
  const [brume, setBrume] = useState(false);
  const [points, setPoints] = useState(false);
  const [cle, setCle] = useState<CleUnivers | null>(null);
  const [attenteFinie, setAttenteFinie] = useState(false);
  const [range, setRange] = useState<Rangement | null>(null);
  const [badge, setBadge] = useState("");
  const [invite, setInvite] = useState(false);
  const [souvenir, setSouvenir] = useState<string | null>(null);
  const [piece, setPiece] = useState(false);
  const [secret, setSecret] = useState(false);
  const [accesActif, setAccesActif] = useState(false);
  const [acces, setAcces] = useState(0);
  const [esquisse, setEsquisse] = useState(false);
  const [recolore, setRecolore] = useState(false);
  const [saute, setSaute] = useState(0);
  // 🐾 son chat : un geste demandé (un temps), le calme (rien ne se passe : il vient sur ses genoux), son nom
  const [geste, setGeste] = useState<Boucle | null>(null);
  const [calme, setCalme] = useState(false);
  const [nomChat, setNomChat] = useState(false);
  const finGeste = useRef(0);

  const fil = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const b = BULLES_CHEZ[i];
  const derniere = i === BULLES_CHEZ.length - 1;
  const vu = reduit ? b.t.length : n;
  const avecVoix = Boolean(SONS_PABLITO[b.son]);
  const rythme = avecVoix ? Math.min(140, Math.max(22, (b.duree * 1000 * 0.92) / Math.ceil(b.t.length / 2))) : 22;
  const tape = !ecrit && vu < b.t.length;
  const dit = !ecrit && !tape;
  const voix = useVoixBulle(ecrit ? undefined : SONS_PABLITO[b.son]);
  const parle = tape || voix.parle;

  // « Pablito écrit… », puis sa bulle ; elle se tape, deux lettres à la fois, au rythme de sa voix
  useEffect(() => {
    if (!ecrit) return;
    const t = window.setTimeout(() => setEcrit(false), 750);
    return () => window.clearTimeout(t);
  }, [ecrit, i]);
  useEffect(() => {
    if (ecrit || reduit || n >= b.t.length) return;
    const t = window.setTimeout(() => setN((x) => Math.min(b.t.length, x + 2)), rythme);
    return () => window.clearTimeout(t);
  }, [ecrit, n, b.t.length, reduit, rythme]);

  // 🎬 la scène, calée sur ses mots (la bulle s'écrit au rythme de sa voix)
  useEffect(() => {
    if (ecrit) return;
    const t = (mot: string) => (reduit ? 0 : momentDuMot(b.t, mot, b.duree) * 1000);
    const plus: number[] = [];
    const a = (ms: number, f: () => void) => plus.push(window.setTimeout(f, ms));
    if (b.moment === "gris") {
      a(t("Mais ici"), () => {
        setRevele(true);
        setBrume(true);
      });
      a(t("Mais ici") + 2800, () => setBrume(false));
    }
    if (b.moment === "chez") {
      a(t("Touche-en un"), () => setPoints(true));
      // (personne ne touche : la suite s'offre quand même)
      a(b.duree * 1000 + 6000, () => setAttenteFinie(true));
    }
    if (b.moment === "visite") a(t("Tes proches"), () => setInvite(true));
    if (b.moment === "grandit") {
      a(t("De nouveaux"), () => setPiece(true));
      a(t("certains secrets"), () => setSecret(true));
      a(t("avec des portes"), () => setAccesActif(true));
    }
    if (b.moment === "fin") {
      a(0, () => setEsquisse(true));
      a(t("je dessine"), () => setRecolore(true));
    }
    return () => plus.forEach((x) => window.clearTimeout(x));
  }, [ecrit, b.moment, b.t, b.duree, reduit]);
  // « Qui peut entrer » : ses réglages, l'un après l'autre
  useEffect(() => {
    if (!accesActif) return;
    const t = window.setInterval(() => setAcces((x) => (x + 1) % VISIBILITES.length), 1400);
    return () => window.clearInterval(t);
  }, [accesActif]);
  // la visite, puis « laisse-moi un souvenir » : ses deux bulles se suivent
  const suite = useRef<() => void>(() => undefined);
  useEffect(() => {
    if (!dit || b.moment !== "visite") return;
    const t = window.setTimeout(() => suite.current(), reduit ? 0 : 900);
    return () => window.clearTimeout(t);
  }, [dit, b.moment, reduit]);

  // 🐾 rien ne se passe (la bulle dite, sept secondes sans un toucher) : le chat vient ronronner sur ses genoux
  useEffect(() => {
    if (!dit || calme) return;
    const t = window.setTimeout(() => setCalme(true), reduit ? 0 : 7000);
    return () => window.clearTimeout(t);
  }, [dit, calme, i, moi.length, range, souvenir, cle, reduit]);
  // (son nom, la première fois qu'on le voit)
  useEffect(() => {
    if (!revele || !univers.compagnon) return;
    const a = window.setTimeout(() => setNomChat(true), 1600);
    const z = window.setTimeout(() => setNomChat(false), 4600);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(z);
    };
  }, [revele, univers.compagnon]);

  // la conversation reste en bas
  useEffect(() => {
    const f = fil.current;
    if (f) f.scrollTop = f.scrollHeight;
  }, [i, vu, ecrit, dit, moi.length, range, souvenir]);
  // « Échap » : passer
  const fini = useRef(onFini);
  useEffect(() => {
    fini.current = onFini;
  });
  useEffect(() => {
    const echap = (e: KeyboardEvent) => e.key === "Escape" && fini.current();
    window.addEventListener("keydown", echap);
    return () => window.removeEventListener("keydown", echap);
  }, []);

  // 📐 la scène : son décor couvre la boîte, cadré sur sa figurine (ou le sol, pour le souvenir)
  const [boite, setBoite] = useState({ l: 360, h: 420 });
  const [ratio, setRatio] = useState(2 / 3);
  useEffect(() => {
    const el = scene.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => setBoite({ l: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const cadre = useCadreVisible(univers.figurine?.assise);
  const hote = univers.hote ?? { x: 0.36, y: 0.8, echelle: 1 };
  const place = univers.place
    ? (() => {
        const h = univers.place.hauteur / Math.max(0.3, cadre.bas - cadre.haut);
        return { x: univers.place.x, bas: Math.min(1.08, univers.place.y + (1 - cadre.bas) * h), hauteur: h };
      })()
    : { x: hote.x, bas: Math.max(hote.y, 0.9), hauteur: TAILLE_FIGURINE * Math.min(1.15, Math.max(0.9, hote.echelle)) };
  const basPlace = Math.max(place.bas, place.hauteur + 0.02);
  const auSol = b.moment === "souvenir" || b.moment === "merci";
  // (« Touche-en un » : la caméra cadre ses clés et sa figurine ensemble)
  const centres = univers.cles.filter((c) => c.zone).map((c) => ({ c, x: c.zone![0] + c.zone![2] / 2, y: c.zone![1] + c.zone![3] / 2 }));
  const surCles = b.moment === "chez" && points && centres.length > 0;
  const moyenne = (l: number[]) => l.reduce((a, x) => a + x, 0) / Math.max(1, l.length);
  const fx = surCles ? (moyenne(centres.map((k) => k.x)) + place.x) / 2 : place.x;
  const fy = auSol ? basPlace - place.hauteur * 0.3 : surCles ? (moyenne(centres.map((k) => k.y)) + basPlace - place.hauteur * 0.8) / 2 : basPlace - place.hauteur * 0.55;
  let ml = boite.l;
  let mh = boite.l / ratio;
  if (mh < boite.h) {
    mh = boite.h;
    ml = boite.h * ratio;
  }
  const tx = borne(boite.l / 2 - fx * ml, boite.l - ml, 0);
  const ty = borne(boite.h / 2 - fy * mh, boite.h - mh, 0);
  // (au-dessus de sa tête, à l'écran : là où sa figurine demande « Je le range ? »)
  const teteX = borne(tx + place.x * ml, 120, boite.l - 120);
  const teteY = ty + (basPlace - place.hauteur * 0.92) * mh;
  // (le souvenir se pose à ses pieds, à côté d'elle)
  const souvenirX = borne(place.x + (place.x > 0.6 ? -0.17 : 0.17), 0.12, 0.88);
  const souvenirY = Math.min(0.97, basPlace + 0.01);

  // 🐾 un geste du chat, un temps (puis il reprend ce que le moment lui demande)
  const jouerChat = (boucle: Boucle, ms: number) => {
    setCalme(false);
    setGeste(boucle);
    window.clearTimeout(finGeste.current);
    finGeste.current = window.setTimeout(() => setGeste(null), ms);
  };
  const avancer = (texte?: string) => {
    debloquerLaVoix();
    setCalme(false);
    if (texte) setMoi((m) => [...m, { apres: i, t: texte }]);
    setCle(null);
    setBadge("");
    setI((x) => Math.min(BULLES_CHEZ.length - 1, x + 1));
    setN(0);
    setEcrit(!reduit);
  };
  useEffect(() => {
    suite.current = () => avancer();
  });
  const toucherFil = () => {
    if (voix.bloque) return voix.rejouer();
    if (tape) setN(b.t.length);
  };
  // 📅 « Tu fais quoi ce week-end ? » → « Je le range ? » → l'étagère, puis le rappel du jour venu
  const choisirWeekend = (k: number) => {
    debloquerLaVoix();
    setMoi((m) => [...m, { apres: i, t: WEEKEND[k].dit }]);
    setRange({ choix: k });
    jouerChat("alerte", 2600);
  };
  const repondreRange = (oui: boolean) => {
    if (!range) return;
    setMoi((m) => [...m, { apres: i, t: oui ? "Oui, range-le" : "Non merci" }]);
    setRange({ ...range, reponse: oui ? "oui" : "non" });
    if (oui) jouerChat("saut", 1800);
    else setCalme(false);
    setBadge(oui ? "Noté !" : "D’accord, je n’y touche pas.");
    window.setTimeout(() => setBadge(""), 2200);
    if (oui) window.setTimeout(() => setRange((r) => (r ? { ...r, rappel: true } : r)), reduit ? 0 : 1300);
  };
  // 🎁 « Laisse-moi un souvenir ! » : il se pose chez lui ; « Merci, je le garde. »
  const laisserSouvenir = (objet: string) => {
    debloquerLaVoix();
    const o = objetDe(objet);
    setMoi((m) => [...m, { apres: i, t: `${o?.emoji ?? ""} ${o?.nom ?? ""}`.trim() }]);
    setSouvenir(objet);
    jouerChat("renifle", 3600);
    window.setTimeout(() => avancer(), reduit ? 0 : 1100);
  };

  // 🐾 ce que le moment demande au chat : il dort quand la brume se lève, l'invité le réveille ; il ronronne sur les
  // genoux de Pablito pendant qu'il raconte son univers qui s'agrandit, ou quand rien ne se passe
  const chatDuMoment: Boucle = b.moment === "gris" ? "dort" : b.moment === "grandit" ? "genoux" : "assis";
  const chatVoulu: Boucle = geste ?? (calme ? "genoux" : chatDuMoment);
  const chatVisible = revele && i >= 1 && !esquisse;

  // (ses clés que l'on voit dans la scène : celles qui tombent hors du cadre ne s'offrent pas)
  const cles = centres
    .filter((k) => {
      const x = tx + k.x * ml;
      const y = ty + k.y * mh;
      return x >= 16 && x <= boite.l - 16 && y >= 16 && y <= boite.h - 16;
    })
    .map((k) => k.c);
  const visibilite: Visibilite = VISIBILITES[acces];
  const rangement = range ? WEEKEND[range.choix] : null;
  const pretAContinuer = b.moment !== "chez" || cles.length === 0 || Boolean(cle) || attenteFinie;
  const objet = souvenir ? objetDe(souvenir) : null;

  const reponses = (): ReactNode => {
    if (b.moment === "fin")
      return (
        <span className="bv-choix bv-fin">
          <button type="button" className="tu-creer" onClick={onCreer}>
            📸 Je crée ma figurine
          </button>
          <button type="button" className="bv-plus-tard" onClick={onFini}>
            Plus tard
          </button>
          <span className="bv-indice">
            Une question ? Touche le logo <b>ClikMe</b>, en haut, quand tu veux.
          </span>
        </span>
      );
    if (b.moment === "range") {
      if (!range)
        return (
          <span className="bc-choix">
            {WEEKEND.map((w, k) => (
              <button key={w.cle} type="button" className="bc-option" onClick={() => choisirWeekend(k)}>
                {w.dit}
              </button>
            ))}
          </span>
        );
      if (!range.reponse)
        return (
          <span className="bc-choix">
            <button type="button" className="bv-repondre" onClick={() => repondreRange(true)}>
              Oui, range-le
            </button>
            <button type="button" className="bc-option" onClick={() => repondreRange(false)}>
              Non merci
            </button>
          </span>
        );
      if (range.reponse === "oui" && !range.rappel) return null;
    }
    if (b.moment === "souvenir") {
      if (souvenir) return null;
      return (
        <span className="bc-choix">
          {SOUVENIRS_CHEZ.map((c) => {
            const o = objetDe(c);
            return o ? (
              <button key={c} type="button" className="bc-option" onClick={() => laisserSouvenir(c)}>
                {o.emoji} {o.nom}
              </button>
            ) : null;
          })}
        </span>
      );
    }
    if (b.moment === "visite") return null;
    if (!pretAContinuer) return <span className="bc-indice">👆 Touche un objet de chez Pablito, dans la scène</span>;
    const r = REPONSES_CHEZ[b.moment];
    return r ? (
      <span className="bv-choix">
        <button type="button" className="bv-repondre" onClick={() => avancer(r)}>
          {r}
        </button>
      </span>
    ) : null;
  };

  return (
    <div className="tu bv bc" role="dialog" aria-modal="true" aria-label="Pablito t’accueille chez lui" data-moment={b.moment} data-rang={i + 1} data-dit={dit ? "oui" : "non"}>
      <div className="bv-app">
        <header className="bv-haut">
          <span className="bv-logo" aria-hidden="true">
            Clik<b>Me</b>
          </span>
          <span className="bv-points" aria-hidden="true">
            {BULLES_CHEZ.map((_, k) => (
              <i key={k} className={k < i ? "fait" : k === i ? "la" : undefined} />
            ))}
          </span>
          {!derniere && (
            <button type="button" className="tu-passer" onClick={onFini}>
              Passer
            </button>
          )}
        </header>

        {/* 🏡 son univers */}
        <div className={`bc-scene${i === 0 ? " grand" : ""}`} ref={scene}>
          <div
            className={`bc-monde${i === 0 ? " flou" : ""}${esquisse && !recolore ? " esquisse" : ""}`}
            style={{ width: ml, height: mh, transform: `translate(${tx}px,${ty}px)` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="bc-decor"
              src={univers.decor}
              alt="L’univers de Pablito"
              onLoad={(e) => {
                const im = e.currentTarget;
                if (im.naturalWidth && im.naturalHeight) setRatio(im.naturalWidth / im.naturalHeight);
              }}
            />
            {univers.figurine && (
              <button
                type="button"
                key={saute}
                className={`bc-place${parle && i > 0 && !esquisse ? " parle" : ""}${saute ? " saute" : ""}${esquisse ? " vide" : ""}`}
                style={{ left: `${place.x * 100}%`, top: `${basPlace * 100}%`, height: `${place.hauteur * 100}%` }}
                aria-label="La figurine de Pablito"
                onClick={() => setSaute((x) => x + 1)}
              >
                <span className="bc-ombre" aria-hidden="true" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="bc-fig" src={univers.figurine.assise} alt="" draggable={false} />
                {univers.figurine.parle && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="bc-fig bc-fig-p" src={univers.figurine.parle} alt="" draggable={false} />
                )}
                {esquisse && <span className="bc-ta-place">Ta place</span>}
              </button>
            )}
            {univers.compagnon && (
              <ChatDePablito
                boucles={univers.compagnon.boucles}
                nom={univers.compagnon.nom}
                voulue={chatVoulu}
                place={{ x: place.x, bas: basPlace, hauteur: place.hauteur }}
                ailleurs={geste === "renifle" && souvenir ? { x: borne(souvenirX + (souvenirX > place.x ? 0.1 : -0.1), 0.08, 0.92), bas: souvenirY } : undefined}
                visible={chatVisible}
                montrerNom={nomChat}
                onToucher={() => {
                  // (sur les genoux, il continue de ronronner : on voit son nom ; ailleurs, un saut de joie)
                  if (chatVoulu !== "genoux") jouerChat("saut", 1600);
                  setNomChat(true);
                  window.setTimeout(() => setNomChat(false), 2200);
                }}
              />
            )}
            {points &&
              b.moment === "chez" &&
              cles.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`bc-point${cle?.id === c.id ? " pris" : ""}`}
                  aria-label={majuscule(c.quoi)}
                  style={{ left: `${(c.zone![0] + c.zone![2] / 2) * 100}%`, top: `${(c.zone![1] + c.zone![3] / 2) * 100}%` }}
                  onClick={() => {
                    setCle(c);
                    setCalme(false);
                  }}
                />
              ))}
            {objet && (
              <span className="bc-souvenir" style={{ left: `${souvenirX * 100}%`, top: `${souvenirY * 100}%` }} aria-label={`${objet.nom}, de ta part`}>
                {objet.emoji}
                <small>de ta part</small>
              </span>
            )}
          </div>

          {/* 1 · Pablito debout, en grand */}
          <span className={`bc-accueil${i === 0 ? "" : " parti"}`} aria-hidden="true">
            <PablitoDebout parle={i === 0 && parle} />
          </span>
          {/* 2 · une conversation comme les autres… puis la brume se lève sur son univers */}
          {i >= 1 && (
            <span className={`bc-gris${revele ? " parti" : ""}`} aria-hidden="true">
              <span className="bc-gris-haut">
                <i />
                Léa
              </span>
              <span className="bc-gris-msg a">Coucou ! Ça va ?</span>
              <span className="bc-gris-msg b">Oui et toi ?</span>
              <span className="bc-gris-msg a">On se voit quand ?</span>
            </span>
          )}
          {brume && <span className="bc-brume" aria-hidden="true" />}
          {revele && univers.saison && !esquisse && (
            <span className="bc-saison">
              {univers.saison.emoji} {univers.saison.nom}
            </span>
          )}
          {revele && i >= 2 && !esquisse && <span className="bc-chez">Chez Pablito</span>}

          {/* 3 · ses clés : ce qui est là, et pourquoi */}
          {b.moment === "chez" && points && cles.length > 0 && !cle && <span className="bc-indice-scene">👆 Touche un objet</span>}
          {b.moment === "chez" && cle && (
            <span className="bc-cle" role="status">
              <b>🔑 {majuscule(cle.quoi)}</b>
              <span>{cle.source === "dit" ? `« ${cle.pourquoi} »` : cle.pourquoi}</span>
              {cle.source === "dit" && <small>— Pablito</small>}
            </span>
          )}

          {/* 4 · « Je le range ? », l'étagère, le rappel */}
          {b.moment === "range" && rangement && (
            <>
              <span className={`bc-etagere${range?.reponse === "oui" ? " pleine" : ""}`} aria-hidden="true">
                <small>Notre étagère</small>
                <span className="bc-planche">{range?.reponse === "oui" && <span className="bc-objet">📅</span>}</span>
                {range?.reponse === "oui" && <span className="bc-etiquette">{rangement.range.replace(/^📅\s*/, "")}</span>}
              </span>
              {!range?.reponse && (
                <span className="bc-range" style={{ left: teteX, top: Math.max(96, teteY) }} role="status">
                  <small>Je le range ?</small>
                  <b>{rangement.range}</b>
                </span>
              )}
              {range?.reponse === "oui" && <span className="bc-range vole" style={{ left: teteX, top: Math.max(96, teteY) }} aria-hidden="true"><b>{rangement.range}</b></span>}
              {range?.rappel && (
                <span className="bc-rappel" role="status">
                  <small>🔔 {rangement.rappel.quand} · le jour venu</small>
                  <b>Pablito : {rangement.rappel.dit}</b>
                </span>
              )}
            </>
          )}
          {badge && (
            <span className="bc-badge" style={{ left: teteX, top: Math.max(40, teteY - 6) }} role="status">
              {badge}
            </span>
          )}

          {/* 5 · en visite, un souvenir */}
          {invite && (b.moment === "visite" || b.moment === "souvenir") && <span className="bc-visite">🚪 Tu es chez Pablito, en visite</span>}

          {/* 6 · son univers s'agrandit : une nouvelle pièce, un endroit secret, qui peut entrer */}
          {b.moment === "grandit" && (
            <>
              {piece && <span className="bc-etiquette-flotte p1">✨ Une nouvelle pièce</span>}
              {secret && <span className="bc-etiquette-flotte p2">🔒 Un endroit secret</span>}
              {accesActif && (
                <span className="bc-acces">
                  <small>Qui peut entrer</small>
                  <span key={visibilite}>{VISIBILITES_DITES[visibilite].titre}</span>
                </span>
              )}
            </>
          )}
        </div>

        {/* 💬 la conversation avec Pablito */}
        <div className="bv-fil" ref={fil} aria-live="polite" aria-label="Ta conversation avec Pablito" onClick={toucherFil}>
          <span className="bv-jour">Aujourd’hui</span>
          {BULLES_CHEZ.slice(0, i + 1).map((x, k) => {
            const enCours = k === i;
            return (
              <div key={k} className="bv-msgs">
                <div className="bv-msg pablito">
                  <span className="bv-tete">
                    <Guide visage={x.visage} parle={enCours && parle} />
                  </span>
                  <div className="bv-bulle">
                    {k === 0 && <span className="bv-qui">Pablito</span>}
                    {enCours && ecrit ? (
                      <span className="bv-ecrit" aria-label="Pablito écrit">
                        <i />
                        <i />
                        <i />
                      </span>
                    ) : (
                      <>
                        <span className="bv-texte">{enCours ? x.t.slice(0, vu) : x.t}</span>
                        {enCours && tape && <i className="bv-curseur" aria-hidden="true" />}
                        {(!enCours || dit) && <span className="bv-heure">{heure}</span>}
                        {enCours && voix.bloque && (
                          <button type="button" className="tu-ecouter" onClick={voix.rejouer}>
                            🔊 Touche pour l’entendre
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {moi
                  .filter((m) => m.apres === k)
                  .map((m, j) => (
                    <div key={j} className="bv-msg moi">
                      <div className="bv-bulle">
                        {m.t}
                        <span className="bv-heure">
                          {heure}
                          <span className="bv-lu">✓✓</span>
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            );
          })}
        </div>

        {/* ce qu'on lui répond */}
        <footer className="bv-reponses">
          {dit && reponses()}
        </footer>
      </div>
    </div>
  );

}

/**
 * 👋 LA BIENVENUE, selon l'univers de Pablito : adopté, chez lui (`BienvenueChezPablito`) ; sinon, l'ancienne
 * (`BienvenueTuto`). Le temps de le demander : un voile sombre.
 */
export function BienvenueSelonPablito({ onFini, onCreer }: { onFini: () => void; onCreer: () => void }) {
  const [univers, setUnivers] = useState<UniversDePablito | null | undefined>(undefined);
  useEffect(() => {
    let fini = false;
    fetch("/api/direct/chez-pablito")
      .then((r) => r.json())
      .then((j: { univers?: UniversDePablito | null }) => !fini && setUnivers(j.univers ?? null))
      .catch(() => !fini && setUnivers(null));
    return () => {
      fini = true;
    };
  }, []);
  if (univers === undefined) return <div className="tu bv" aria-busy="true" />;
  if (!univers) return <BienvenueTuto onFini={onFini} onCreer={onCreer} />;
  return <BienvenueChezPablito univers={univers} onFini={onFini} onCreer={onCreer} />;
}

export const STYLES_BIENVENUE_CHEZ = STYLES_CHAT_BIENVENUE + `
.bc{font-family:var(--font-clikme),Poppins,system-ui,-apple-system,"Segoe UI",sans-serif}
/* 🏡 son univers : le décor couvre la boîte, cadré sur sa figurine ; la caméra glisse d'un moment à l'autre */
.bc-scene{position:relative;flex:0 0 54%;min-height:260px;overflow:hidden;background:#12040E;transition:flex-basis .7s cubic-bezier(.3,.9,.3,1);-webkit-user-select:none;user-select:none}
.bc-scene.grand{flex-basis:62%}
.bc-monde{position:absolute;left:0;top:0;transition:transform 1s cubic-bezier(.3,.9,.3,1),filter 1s}
.bc-monde.flou{filter:blur(7px) brightness(.45) saturate(1.1)}
.bc-decor{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:filter 2.6s ease-in-out}
.bc-monde.esquisse .bc-decor{filter:grayscale(1) sepia(.35) contrast(1.35) brightness(1.12)}
.bc-place{position:absolute;transform:translate(-50%,-100%);aspect-ratio:2/3;display:flex;align-items:flex-end;justify-content:center;padding:0;border:0;background:none;cursor:pointer}
.bc-fig{position:relative;height:100%;width:auto;object-fit:contain;filter:drop-shadow(0 6px 8px rgba(0,0,0,.35));transition:opacity .8s,filter .8s}
.bc-fig-p{position:absolute;bottom:0;left:50%;transform:translateX(-50%);opacity:0}
.bc-place.parle .bc-fig-p{animation:bv-bouche .28s steps(1) infinite}
.bc-place.saute{animation:bc-saute .55s cubic-bezier(.2,1.6,.4,1)}
.bc-place.vide .bc-fig{filter:brightness(0) invert(1) drop-shadow(0 0 10px rgba(255,255,255,.9));opacity:.38}
.bc-place.vide .bc-fig-p{display:none}
.bc-ombre{position:absolute;bottom:-4%;left:10%;width:80%;height:12%;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.45),rgba(0,0,0,0))}
.bc-ta-place{position:absolute;left:50%;top:38%;transform:translateX(-50%);padding:4px 11px;border-radius:999px;background:#FFF4E6;color:#2A0F1F;font-size:13px;font-weight:900;white-space:nowrap;animation:bc-pop .5s cubic-bezier(.2,1.5,.4,1)}
.bc-point{position:absolute;width:30px;height:30px;margin:-15px 0 0 -15px;padding:0;border-radius:50%;border:3px solid #fff;background:rgba(43,26,12,.5);box-shadow:0 0 0 0 rgba(255,255,255,.6);animation:bc-pulse 1.4s infinite;cursor:pointer}
.bc-point.pris{background:#FF2E9A;animation:none}
.bc-souvenir{position:absolute;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;font-size:38px;line-height:1;filter:drop-shadow(0 6px 5px rgba(0,0,0,.4));animation:bc-tombe .7s cubic-bezier(.3,1.5,.5,1)}
.bc-souvenir small{margin-top:3px;padding:1px 7px;border-radius:999px;background:rgba(255,244,230,.9);color:#2A0F1F;font-size:10px;font-weight:800}
/* 1 · Pablito debout */
.bc-accueil{position:absolute;inset:0;transition:opacity .6s,transform .7s cubic-bezier(.2,1.2,.4,1);pointer-events:none}
.bc-accueil .bv-debout{position:absolute}
.bc-accueil.parti{opacity:0;transform:scale(.6)}
/* 2 · la conversation grise, puis la brume */
.bc-gris{position:absolute;inset:0;display:flex;flex-direction:column;gap:9px;padding:14px 16px;background:#E9E6E2;color:#2b2b2b;transition:opacity 1.1s,transform 1.1s,filter 1.1s;animation:bc-entre .5s ease-out}
.bc-gris.parti{opacity:0;transform:scale(1.08);filter:blur(10px);pointer-events:none}
.bc-gris-haut{display:flex;align-items:center;gap:8px;padding-bottom:8px;border-bottom:1px solid #d3cfca;font-size:14px;font-weight:700;color:#555}
.bc-gris-haut i{width:28px;height:28px;border-radius:50%;background:#c9c4be}
.bc-gris-msg{max-width:70%;padding:8px 12px;border-radius:14px;font-size:14px;font-weight:600;background:#fff}
.bc-gris-msg.b{align-self:flex-end;background:#d7dde4}
.bc-brume{position:absolute;inset:0;background:radial-gradient(circle at 50% 60%,rgba(255,255,255,.15),rgba(255,248,236,.96) 70%);animation:bc-brume 2.8s ease-out forwards;pointer-events:none}
.bc-saison,.bc-chez{position:absolute;top:10px;padding:5px 10px;border-radius:999px;font-size:12.5px;font-weight:800;pointer-events:none;animation:bc-entre .5s ease-out}
.bc-saison{left:10px;background:rgba(255,250,240,.88);color:#2b1a0c}
.bc-chez{right:10px;background:rgba(18,4,14,.72);color:#FFF4E6}
/* 3 · ses clés */
.bc-indice-scene{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);padding:6px 12px;border-radius:999px;background:rgba(18,4,14,.78);color:#FFF4E6;font-size:13px;font-weight:800;white-space:nowrap;pointer-events:none;animation:bc-appelle 1.6s ease-in-out infinite}
.bc-cle{position:absolute;left:12px;right:12px;bottom:12px;display:flex;flex-direction:column;gap:3px;padding:10px 13px;border-radius:16px;background:#FFF4E6;color:#2A0F1F;font-size:14px;font-weight:600;line-height:1.35;box-shadow:0 14px 28px -14px #000;animation:bc-monte .35s cubic-bezier(.2,1.3,.4,1)}
.bc-cle b{font-size:14.5px;font-weight:900}
.bc-cle small{align-self:flex-end;font-size:11.5px;font-weight:800;color:#C21D78}
/* 4 · « Je le range ? », l'étagère, le rappel */
.bc-range{position:absolute;transform:translate(-50%,-100%);display:flex;flex-direction:column;gap:2px;max-width:230px;padding:9px 13px;border-radius:16px 16px 16px 5px;background:#FFF4E6;color:#2A0F1F;box-shadow:0 14px 28px -12px #000;animation:bc-pop .45s cubic-bezier(.2,1.5,.4,1)}
.bc-range small{font-size:11px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:#C21D78}
.bc-range b{font-size:14.5px;font-weight:800}
.bc-range.vole{animation:bc-vole .9s cubic-bezier(.5,0,.7,.4) forwards}
.bc-etagere{position:absolute;right:10px;top:46px;display:flex;flex-direction:column;align-items:center;gap:2px;width:132px;padding:6px 8px 8px;border-radius:14px;background:rgba(18,4,14,.72);color:#FFF4E6;animation:bc-entre .5s ease-out}
.bc-etagere small{font-size:10px;font-weight:900;letter-spacing:.07em;text-transform:uppercase;color:#F2C46B}
.bc-planche{position:relative;display:flex;justify-content:center;align-items:flex-end;width:100%;height:34px;border-bottom:7px solid #A36A35;border-radius:0 0 3px 3px}
.bc-objet{font-size:26px;line-height:1;animation:bc-pose .6s .7s cubic-bezier(.2,1.5,.4,1) both}
.bc-etiquette{font-size:11px;font-weight:800;text-align:center;line-height:1.25;animation:bc-entre .4s .9s both}
.bc-rappel{position:absolute;left:12px;right:12px;bottom:12px;display:flex;flex-direction:column;gap:2px;padding:10px 13px;border-radius:16px;background:rgba(30,12,24,.94);border:1px solid rgba(255,143,203,.35);color:#FFF4E6;box-shadow:0 14px 28px -12px #000;animation:bc-descend .5s cubic-bezier(.2,1.3,.4,1)}
.bc-rappel small{font-size:11.5px;font-weight:800;color:#CDB4C0}
.bc-rappel b{font-size:14.5px}
.bc-badge{position:absolute;transform:translate(-50%,-100%);padding:5px 11px;border-radius:12px;background:#FFF4E6;color:#2A0F1F;font-size:13px;font-weight:900;white-space:nowrap;pointer-events:none;animation:bc-pop .4s cubic-bezier(.2,1.6,.4,1)}
/* 5 · en visite */
.bc-visite{position:absolute;left:50%;top:44px;transform:translateX(-50%);padding:6px 12px;border-radius:999px;background:#FFF4E6;color:#2A0F1F;font-size:13px;font-weight:800;white-space:nowrap;box-shadow:0 12px 24px -10px #000;animation:bc-descend .5s cubic-bezier(.2,1.3,.4,1)}
/* 6 · son univers s'agrandit */
.bc-etiquette-flotte{position:absolute;left:12px;padding:6px 12px;border-radius:999px;background:rgba(18,4,14,.8);border:1.5px solid rgba(255,143,203,.55);color:#FFF4E6;font-size:13px;font-weight:800;white-space:nowrap;animation:bc-flotte .5s cubic-bezier(.2,1.5,.4,1)}
.bc-etiquette-flotte.p1{top:46px}
.bc-etiquette-flotte.p2{top:86px;border-color:#F2C46B}
.bc-acces{position:absolute;right:10px;bottom:12px;display:flex;flex-direction:column;align-items:flex-end;gap:4px}
.bc-acces small{padding:2px 8px;border-radius:999px;background:rgba(18,4,14,.7);font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#FFF4E6}
.bc-acces span{padding:6px 12px;border-radius:999px;background:#3A1230;border:1.5px solid rgba(255,143,203,.55);font-size:13px;font-weight:800;white-space:nowrap;animation:bv-change .45s ease-out}
/* ce qu'on lui répond */
.bc-choix{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;animation:bv-monte .3s ease-out}
.bc-option{min-height:44px;padding:0 16px;border:1.5px solid rgba(255,143,203,.45);border-radius:999px;background:rgba(255,255,255,.05);color:#FFF4E6;font-size:14.5px;font-weight:800;cursor:pointer}
.bc-indice{align-self:center;text-align:center;font-size:13.5px;font-weight:700;color:#CDB4C0}
@keyframes bc-saute{40%{transform:translate(-50%,-112%)}}
@keyframes bc-pulse{0%{box-shadow:0 0 0 0 rgba(255,255,255,.6)}100%{box-shadow:0 0 0 14px rgba(255,255,255,0)}}
@keyframes bc-tombe{from{opacity:0;transform:translate(-50%,-260%) rotate(-20deg)}}
@keyframes bc-brume{0%{opacity:1}100%{opacity:0}}
@keyframes bc-entre{from{opacity:0}}
@keyframes bc-monte{from{opacity:0;transform:translateY(10px)}}
@keyframes bc-descend{from{opacity:0;transform:translate(var(--dx,0),-14px)}}
@keyframes bc-pop{from{opacity:0;transform:translate(-50%,-80%) scale(.5)}}
@keyframes bc-vole{to{opacity:0;left:calc(100% - 76px);top:70px;transform:translate(-50%,-50%) scale(.2)}}
@keyframes bc-pose{from{opacity:0;transform:translateY(-14px) scale(.4)}}
@keyframes bc-flotte{from{opacity:0;transform:scale(.6)}}
@keyframes bc-appelle{50%{transform:translateX(-50%) scale(1.04)}}
.bc-visite{--dx:-50%}
@media (prefers-reduced-motion:reduce){.bc *{animation:none!important;transition:none!important}}
`;
