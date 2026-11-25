"use client";

/**
 * 🎞️ DÉCOUVRIR, LE FIL « DE PIÈCE EN PIÈCE » (le lot F1, 23 novembre 2026 ; `lib/direct/fil-decouvrir.ts`,
 * `docs/univers/fil.md`).
 *
 * L'onglet Découvrir s'ouvre sur un fil plein écran : on glisse vers le haut, et chaque écran est UNE PIÈCE — un salon
 * en direct (son gradin, ses figurines, leurs bulles), le salon de la musique, une figurine posée dans Autour avec son
 * mot du jour, l'humeur de ses proches ; puis tous les autres salons, même sans personne (« Sois le premier » : sa télé,
 * ce qui s'y est dit aujourd'hui, et on s'y assoit le premier). Sa figurine est au bord de la pièce (en bas à droite) :
 * toucher deux fois l'écran (ou la toucher, elle) et elle réagit — dans un salon, pour de vrai : elle s'y assoit le
 * temps qu'on y est, sa réaction part au salon, et ceux qui sont là la voient. Chaque bouton ouvre ce qui existe déjà.
 * L'ancienne page de Découvrir (ma télé du jour, tous les salons) est derrière « Tous les salons » (`#salons`).
 * 🏡 Le lot F2 (25 novembre 2026) : les maisons ouvertes de ceux de son âge qui partagent une de ses passions — sa pièce,
 * sa figurine ; « 🚪 Frapper à sa porte » (la visite), « 👋 Lui faire coucou » (toucher deux fois aussi) ; et, en haut,
 * la surprise d'une visite qui l'attend dans « Messages » (🎁 un cadeau, 🚪 quelqu'un qui a frappé).
 * 🎬 Le lot F3 (25 novembre 2026) : la séance en cours chez un proche (« Léa et Sam regardent ensemble ») — « M'asseoir
 * avec eux » s'il est invité, sinon « 🙋 Demander à les rejoindre » (l'hôte lui fait une place d'un toucher) ; et dans un
 * salon où sa figurine est entrée, « 👋 Sam te fait signe » quand quelqu'un lui fait signe pour de vrai.
 * 🪑 La pièce du salon (25 novembre 2026, la maquette validée : « la vidéo et les sièges vides ou remplis, avec le siège
 * qui m'est destiné, c'est suffisant ») : la télé et les fauteuils dans une même pièce ; chaque place libre est un
 * fauteuil vide (sans gradin validé) ; la sienne brille, « Ta place » — la toucher, c'est s'asseoir ; sa figurine n'est
 * plus au bord de la pièce dans un salon, elle y a sa place. En bas : « M'asseoir », « Inviter ». Sur un ordinateur : la
 * pièce à gauche, le salon et ses boutons à droite.
 */
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { OngletVisible } from "./guide";
import { FigurineAssise } from "./autour";
import { MEMOIRE_FIL, ecrireMemoire, lireMemoire } from "./memoire-locale";
import { vignetteYouTube } from "@/lib/direct/tele";
import { PLAN_GRADIN, type PlaceGradin } from "@/lib/direct/salons-gradins";
import { GESTES_SALON, PLACES_SALON, REACTIONS_SALON, type MessageSalon, type PresentSalon } from "@/lib/direct/salons-ouverts";
import { REACTIONS_MUSIQUE } from "@/lib/direct/platine";
import { PHRASES_FIL as P, reactionDuFil, titreDeSeance, type BulleFil, type FilVue, type MaisonFil, type PieceFil, type SalonFil, type SeanceFil } from "@/lib/direct/fil-decouvrir";

const ROUTE = "/api/direct/fil-decouvrir";
const SALONS = "/api/direct/salons-ouverts";
const VISITES = "/api/direct/visites";
/** La mémoire du fil ne vaut que dix minutes : ce qui était en direct ne l'est plus. */
const MEMOIRE_MS = 10 * 60_000;
const CLE_INDICE = "clikme-fil-indice-vu";

const cleDe = (p: PieceFil) => (p.sorte === "salon" ? `s:${p.theme}` : p.sorte === "autour" ? `a:${p.figurine.id}` : p.sorte === "maison" ? `m:${p.cle}` : p.sorte === "seance" ? `e:${p.cle}` : "h");
const heuresRestantes = (fin: string) => Math.max(1, Math.round((Date.parse(fin) - Date.now()) / 3600_000));
const texteDe = (m: MessageSalon) =>
  m.sorte === "texte" ? (m.texte ?? "") : m.sorte === "reaction" ? ([...REACTIONS_SALON, ...REACTIONS_MUSIQUE].find((r) => r.cle === m.cle)?.e ?? "") : (GESTES_SALON.find((g) => g.cle === m.cle)?.e ?? "");
const enPresent = (p: PresentSalon) => ({ q: p.q, prenom: p.prenom, src: p.figurine?.src ?? "", place: p.place });

/**
 * Les nouvelles du serveur : les pièces déjà là gardent leur place (on ne bouge pas sous son doigt) — seulement leur
 * contenu, à jour ; celles qui n'y sont plus restent jusqu'au prochain retour ; les nouvelles s'ajoutent à la fin.
 */
function fusionner(avant: PieceFil[], apres: PieceFil[]): PieceFil[] {
  const neuves = new Map(apres.map((p) => [cleDe(p), p]));
  const gardees = avant.map((p) => neuves.get(cleDe(p)) ?? p);
  const deja = new Set(avant.map(cleDe));
  return [...gardees, ...apres.filter((p) => !deja.has(cleDe(p)))];
}

type Reaction = { k: string; e: string; texte: string; n: number };

export function FilDecouvrir({ onTousLesSalons, onAutour, onConversation }: { onTousLesSalons: () => void; onAutour: () => void; onConversation: (cle: string) => void }) {
  const visible = useContext(OngletVisible);
  const [fil, setFil] = useState<FilVue | null>(null);
  const [pieces, setPieces] = useState<PieceFil[]>([]);
  const [courante, setCourante] = useState("");
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [toast, setToast] = useState("");
  const [indice, setIndice] = useState(false);
  const [version, setVersion] = useState(0);
  const boite = useRef<HTMLDivElement>(null);
  /** les salons où sa figurine est entrée depuis le fil (thème → identifiant), et le dernier « je suis là » */
  const entres = useRef(new Map<string, string>());
  /** son identifiant court dans les salons (pour ne pas se compter parmi ceux qui le voient) */
  const monQ = useRef("");
  const [moiQ, setMoiQ] = useState("");
  const tapes = useRef<{ k: string; t: number } | null>(null);
  const appui = useRef<{ x: number; y: number } | null>(null);

  const dire = useCallback((t: string) => {
    setToast(t);
    window.setTimeout(() => setToast((x) => (x === t ? "" : x)), 2600);
  }, []);

  // ce que le fil montrait il y a moins de dix minutes, tout de suite ; puis le serveur (et toutes les 30 s, en direct)
  useEffect(() => {
    if (!visible) return;
    let fini = false;
    const deja = lireMemoire<FilVue>(MEMOIRE_FIL, MEMOIRE_MS);
    if (deja && !fil)
      void Promise.resolve().then(() => {
        if (fini) return;
        setFil(deja);
        setPieces(deja.pieces);
      });
    const charger = () =>
      fetch(ROUTE, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((j: { fil?: FilVue } | null) => {
          if (fini || !j?.fil) return;
          const f = j.fil;
          setFil(f);
          setPieces((avant) => (avant.length ? fusionner(avant, f.pieces) : f.pieces));
          ecrireMemoire(MEMOIRE_FIL, f);
        })
        .catch(() => undefined);
    void charger();
    const t = window.setInterval(() => document.visibilityState === "visible" && void charger(), 30_000);
    return () => {
      fini = true;
      window.clearInterval(t);
    };
    // (la mémoire seulement à la première ouverture)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, version]);

  // 💡 la première fois : le seul mode d'emploi
  useEffect(() => {
    if (!visible) return;
    let vu = true;
    try {
      vu = window.localStorage.getItem(CLE_INDICE) === "1";
    } catch {
      /* rien */
    }
    if (!vu) void Promise.resolve().then(() => setIndice(true));
  }, [visible]);
  const indiceVu = useCallback(() => {
    setIndice(false);
    try {
      window.localStorage.setItem(CLE_INDICE, "1");
    } catch {
      /* rien */
    }
  }, []);

  // la pièce qu'on regarde : celle qui remplit l'écran
  useEffect(() => {
    const b = boite.current;
    if (!b || !pieces.length) return;
    const io = new IntersectionObserver(
      (vus) => {
        for (const v of vus) if (v.isIntersecting) setCourante((v.target as HTMLElement).dataset.k ?? "");
      },
      { root: b, threshold: 0.6 },
    );
    b.querySelectorAll<HTMLElement>("[data-k]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pieces, fil?.age]);
  // (en glissant, l'indice s'en va ; sa réaction aussi)
  const premiere = useRef("");
  useEffect(() => {
    if (!courante) return;
    if (!premiere.current) premiere.current = courante;
    else if (courante !== premiere.current && indice) indiceVu();
    void Promise.resolve().then(() => setReaction((r) => (r && r.k !== courante ? null : r)));
  }, [courante, indice, indiceVu]);

  // 🚪 sa figurine quitte le salon quand on glisse plus loin (ou que l'onglet se cache)
  useEffect(() => {
    for (const [theme, id] of entres.current) {
      if (visible && courante === `s:${theme}`) continue;
      entres.current.delete(theme);
      void fetch(SALONS, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "sortir", salon: id }), keepalive: true }).catch(() => undefined);
    }
  }, [courante, visible]);

  // (⚡ revenu par « ‹ Retour » du navigateur, la page gardée telle quelle : « M'asseoir » ne clignote plus)
  useEffect(() => {
    const revenu = () => document.querySelectorAll("[data-part]").forEach((x) => x.removeAttribute("data-part"));
    window.addEventListener("pageshow", revenu);
    return () => window.removeEventListener("pageshow", revenu);
  }, []);

  // 💓 dans le salon où elle est entrée : il redit qu'il est là, et les nouvelles bulles arrivent (toutes les 6 s)
  useEffect(() => {
    if (!visible || !courante.startsWith("s:")) return;
    const theme = courante.slice(2);
    let depuis = Date.now() - 60_000;
    const battre = () => {
      const id = entres.current.get(theme);
      if (!id || document.visibilityState !== "visible") return;
      void fetch(`${SALONS}?salon=${encodeURIComponent(id)}&depuis=${depuis}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((j: { pouls?: { ici: string[]; nouveaux: PresentSalon[]; messages: MessageSalon[]; maintenant: number } } | null) => {
          const p = j?.pouls;
          if (!p) return;
          depuis = Math.max(depuis, ...p.messages.map((m) => m.le));
          // (👋 lot F3 : quelqu'un lui fait signe, pour de vrai — sa figurine le dit)
          const signe = p.messages.find((m) => m.sorte === "geste" && m.a && m.a === monQ.current && m.de !== monQ.current);
          if (signe) setReaction({ k: `s:${theme}`, e: "👋", texte: P.teFaitSigne(signe.prenom), n: Date.now() });
          setPieces((l) =>
            l.map((x) => {
              if (x.sorte !== "salon" || x.theme !== theme) return x;
              const ici = new Set(p.ici);
              const presents = [...x.presents.filter((y) => ici.has(y.q)), ...p.nouveaux.filter((n) => !x.presents.some((y) => y.q === n.q)).map(enPresent)];
              const neuves: BulleFil[] = p.messages.filter((m) => !x.bulles.some((b) => b.id === m.id)).map((m) => ({ id: m.id, q: m.de, prenom: m.prenom, texte: texteDe(m), le: m.le }));
              return { ...x, presents, bulles: [...x.bulles, ...neuves].filter((b) => b.texte).slice(-6) };
            }),
          );
        })
        .catch(() => undefined);
    };
    const t = window.setInterval(battre, 6000);
    return () => window.clearInterval(t);
  }, [visible, courante]);

  const piecesParCle = useMemo(() => new Map(pieces.map((p) => [cleDe(p), p])), [pieces]);

  /** ✨ Sa figurine réagit dans la pièce qu'on regarde ; dans un salon, pour de vrai. */
  const reagir = useCallback(
    async (k: string) => {
      const p = piecesParCle.get(k);
      if (!p) return;
      if (indice) indiceVu();
      const r = reactionDuFil(p);
      // (🏡 lot F2 : dans une maison, c'est un vrai coucou)
      if (p.sorte === "maison") return void coucou(p);
      const autres = p.sorte === "salon" ? p.presents.filter((x) => x.q !== monQ.current) : [];
      setReaction({ k, e: r.e, texte: p.sorte === "salon" ? P.teVoient(autres.length, autres[0]?.prenom) : "", n: Date.now() });
      if (p.sorte !== "salon") return;
      const poster = (corps: unknown) => fetch(SALONS, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) }).then(async (x) => ({ ok: x.ok, j: ((await x.json().catch(() => ({}))) ?? {}) as Record<string, unknown> }));
      let id = entres.current.get(p.theme);
      if (!id) {
        const e = await poster({ action: "entrer", theme: p.theme });
        const o = e.j.ouverture as { salon?: { id?: string }; moi?: string; presents?: PresentSalon[] } | undefined;
        if (!e.ok || !o?.salon?.id) {
          setReaction(null);
          if (e.j.age) return void setVersion((v) => v + 1);
          return dire(e.j.figurine ? P.sansFigurine : String(e.j.error ?? "Ça n’a pas marché."));
        }
        id = o.salon.id;
        if (o.moi) {
          monQ.current = o.moi;
          setMoiQ(o.moi);
        }
        entres.current.set(p.theme, id);
        // (sa figurine s'assoit dans le gradin, à sa place)
        setPieces((l) => l.map((x) => (x.sorte === "salon" && x.theme === p.theme ? { ...x, id: id!, presents: (o.presents ?? []).map(enPresent) } : x)));
      }
      await poster({ action: "ecrire", salon: id, sorte: "reaction", cle: r.cle });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [piecesParCle, indice, indiceVu, dire],
  );

  /** 👋 (lot F2) Lui faire coucou : sa figurine apparaît dans sa pièce, la personne est prévenue (une fois par jour). */
  async function coucou(p: MaisonFil) {
    const k = cleDe(p);
    setReaction({ k, e: "👋", texte: P.coucouEnvoye(p.prenom), n: Date.now() });
    if (p.coucou) return;
    const r = await fetch(VISITES, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "coucou", cle: p.cle }) })
      .then(async (x) => ({ ok: x.ok, j: ((await x.json().catch(() => ({}))) ?? {}) as { error?: string } }))
      .catch(() => ({ ok: false, j: {} as { error?: string } }));
    if (!r.ok) {
      setReaction(null);
      return dire(r.j.error || "Ça n’a pas marché.");
    }
    setPieces((l) => l.map((x) => (x.sorte === "maison" && x.cle === p.cle ? { ...x, coucou: "envoye" } : x)));
  }

  /** 🪑 Inviter quelqu'un à s'asseoir dans ce salon : le lien du salon (le partage du téléphone, sinon copié). */
  async function inviter(p: SalonFil) {
    const url = `${window.location.origin}/univers/salons?theme=${p.theme}`;
    const texte = P.invitationSalon(p.nom);
    try {
      if (navigator.share) return void (await navigator.share({ title: "ClikMe", text: texte, url }));
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(`${texte} ${url}`);
      dire(P.lienCopie);
    } catch {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${texte} ${url}`)}`, "_blank", "noopener");
    }
  }

  /** 🙋 (lot F3) Demander à rejoindre la séance d'un proche : l'hôte est prévenu ; invité déjà, on y va. */
  async function rejoindre(p: SeanceFil) {
    const r = await fetch(SALONS, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "rejoindre", chez: p.cle }) })
      .then(async (x) => ({ ok: x.ok, j: ((await x.json().catch(() => ({}))) ?? {}) as { error?: string; invite?: boolean; demande?: boolean } }))
      .catch(() => ({ ok: false, j: {} as { error?: string; invite?: boolean; demande?: boolean } }));
    if (!r.ok) return dire(r.j.error || "Ça n’a pas marché.");
    if (r.j.invite) return void window.location.assign(`/univers/salons?chez=${encodeURIComponent(p.cle)}`);
    setPieces((l) => l.map((x) => (x.sorte === "seance" && x.cle === p.cle ? { ...x, demande: true } : x)));
  }

  // toucher deux fois l'écran (pas un bouton, pas un lien)
  const surAppui = (e: React.PointerEvent) => {
    appui.current = { x: e.clientX, y: e.clientY };
  };
  const surLacher = (e: React.PointerEvent) => {
    const a = appui.current;
    appui.current = null;
    if (!a || Math.hypot(e.clientX - a.x, e.clientY - a.y) > 12) return;
    const el = e.target as HTMLElement;
    if (el.closest("a,button,input")) return;
    const k = el.closest<HTMLElement>("[data-k]")?.dataset.k;
    if (!k) return;
    const t = Date.now();
    if (tapes.current && tapes.current.k === k && t - tapes.current.t < 340) {
      tapes.current = null;
      void reagir(k);
    } else tapes.current = { k, t };
  };

  const repondreAge = async (adulte: boolean) => {
    await fetch(SALONS, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "age", adulte }) }).catch(() => undefined);
    setFil((f) => (f ? { ...f, age: undefined } : f));
    setVersion((v) => v + 1);
  };

  const moi = fil?.moi;
  const vide = fil && !fil.age && !pieces.length;
  return (
    <div className="fd" data-fil data-pieces={pieces.length}>
      <div className="fd-boite" ref={boite} onPointerDown={surAppui} onPointerUp={surLacher} onPointerCancel={() => (appui.current = null)}>
        {!fil && <div className="fd-carte fd-attente" aria-hidden="true" />}
        {fil?.age && (
          <section className="fd-carte fd-age" data-k="age" data-piece="age">
            <div className="fd-milieu">
              <h2>{P.age}</h2>
              <p>{P.ageChapo}</p>
              <button type="button" className="fd-bouton" data-age="adulte" onClick={() => void repondreAge(true)}>
                {P.adulte}
              </button>
              <button type="button" className="fd-bouton fd-second" data-age="jeune" onClick={() => void repondreAge(false)}>
                {P.jeune}
              </button>
            </div>
          </section>
        )}
        {pieces.map((p) => {
          const k = cleDe(p);
          return p.sorte === "salon" ? (
            <PieceSalon key={k} k={k} p={p} moi={moiQ} reaction={reaction && reaction.k === k ? reaction : null} onInviter={() => void inviter(p)} />
          ) : p.sorte === "maison" ? (
            <section key={k} className="fd-carte fd-maison" data-k={k} data-piece="maison" data-maison={p.cle} data-coucou={p.coucou ?? undefined}>
              <span className="fd-etiquette">{P.maisonEtiquette(p.passion.e, p.passion.nom)}</span>
              <div className="fd-milieu fd-chez">
                <div className="fd-chez-piece" style={{ backgroundImage: `url(${p.image})` }}>
                  {p.coucou === "repondu" && (
                    <span className="fd-bulle-fixe fd-chez-bulle" data-repondu>
                      {P.coucouRepondu(p.prenom)}
                    </span>
                  )}
                  <span className="fd-chez-fig">
                    <FigurineAssise f={p.figurine} hauteur={190} />
                  </span>
                </div>
              </div>
              <div className="fd-bas">
                <h2>{P.maisonTitre(p.prenom)}</h2>
                <p>{p.coucou === "envoye" ? P.coucouEnvoye(p.prenom) : P.maisonSous(p.passion.court)}</p>
                <span className="fd-boutons">
                  <a className="fd-bouton" href={`/univers/chez/${encodeURIComponent(p.cle)}`} data-frapper>
                    {P.frapper}
                  </a>
                  {!p.coucou && (
                    <button type="button" className="fd-bouton fd-second" data-faire-coucou onClick={() => void coucou(p)}>
                      {P.coucou}
                    </button>
                  )}
                </span>
              </div>
            </section>
          ) : p.sorte === "seance" ? (
            <PieceSeance key={k} k={k} p={p} onRejoindre={() => void rejoindre(p)} />
          ) : p.sorte === "autour" ? (
            <section key={k} className="fd-carte fd-autour" data-k={k} data-piece="autour" data-pose={p.figurine.id}>
              <span className="fd-etiquette">📍 {P.autourEtiquette(p.nomLieu)}</span>
              <div className="fd-milieu fd-pose">
                <p className="fd-mot" data-mot>
                  {p.figurine.mot}
                </p>
                <FigurineAssise f={p.figurine} hauteur={230} />
              </div>
              <div className="fd-bas">
                <h2>{P.autourTitre(p.figurine.prenom)}</h2>
                <p>{P.autourSous(heuresRestantes(p.figurine.fin))}</p>
                <a className="fd-bouton" href={`/collection?autour=${encodeURIComponent(p.lieu)}&pose=${p.figurine.id}#autour`} data-asseoir-a-cote>
                  {P.asseoirACote}
                </a>
              </div>
            </section>
          ) : (
            <section key={k} className="fd-carte fd-humeur" data-k={k} data-piece="humeur">
              <span className="fd-etiquette">☀️ {P.humeurEtiquette}</span>
              <div className="fd-milieu fd-proches">
                {p.proches.map((x) => (
                  <button key={x.cle} type="button" className={`fd-proche${x.doux ? " doux" : ""}`} data-proche={x.cle} onClick={() => onConversation(x.cle)} aria-label={P.repondreA(x.prenom)}>
                    <span className="fd-bulle-fixe">
                      {x.emoji} {x.nom}
                    </span>
                    <FigurineAssise f={x.figurine} hauteur={p.proches.length > 2 ? 120 : 170} />
                    <small>{x.prenom}</small>
                  </button>
                ))}
              </div>
              <div className="fd-bas">
                <h2>{P.humeurTitre(p.proches[0].prenom, p.proches[0].nom)}</h2>
                <p>{p.proches[0].doux ? P.humeurDouce : P.humeurSous}</p>
                <button type="button" className="fd-bouton" data-repondre={p.proches[0].cle} onClick={() => onConversation(p.proches[0].cle)}>
                  {P.repondreA(p.proches[0].prenom)}
                </button>
              </div>
            </section>
          );
        })}
        {vide && (
          <section className="fd-carte fd-vide" data-k="vide" data-piece="vide">
            <div className="fd-milieu">
              <h2>{P.videTitre}</h2>
              <p>{P.videSous}</p>
              <button type="button" className="fd-bouton" onClick={onAutour}>
                {P.poserAutour}
              </button>
              <button type="button" className="fd-bouton fd-second" onClick={onTousLesSalons}>
                {P.tousLesSalons}
              </button>
            </div>
          </section>
        )}
      </div>

      {/* en haut : ce qui l'attend ailleurs, et « Tous les salons » */}
      <div className="fd-haut">
        {fil?.invitation ? (
          <a className="fd-pastille" href={`/univers/salons?chez=${encodeURIComponent(fil.invitation.cle)}`} data-invitation>
            {P.invitation(fil.invitation.prenom)}
          </a>
        ) : fil?.surprise ? (
          <a className="fd-pastille" href="#proches" data-surprise={fil.surprise.genre}>
            {fil.surprise.genre === "cadeau" ? P.surpriseCadeau(fil.surprise.prenom) : P.surpriseToc(fil.surprise.prenom)}
          </a>
        ) : fil?.demandes ? (
          <button type="button" className="fd-pastille" data-demandes onClick={onTousLesSalons}>
            {P.demandes(fil.demandes)} · {P.voir}
          </button>
        ) : (
          <span />
        )}
        <button type="button" className="fd-tous" data-tous-les-salons onClick={onTousLesSalons}>
          {P.tousLesSalons}
        </button>
      </div>

      {/* 🧍 sa figurine, au bord de la pièce : la toucher, c'est réagir */}
      {moi?.figurine && !courante.startsWith("s:") && (
        <div className="fd-moi" data-moi>
          {reaction && reaction.k === courante && (
            <span className="fd-reaction" key={reaction.n} data-reaction>
              <b>{reaction.e}</b>
              {reaction.texte && <small data-vu-par>{reaction.texte}</small>}
            </span>
          )}
          <button type="button" className={reaction && reaction.k === courante ? (reaction.e === "💃" ? "danse" : "saute") : ""} aria-label="Ma figurine : réagir" onClick={() => courante && void reagir(courante)}>
            <FigurineAssise f={moi.figurine} hauteur={92} />
            <small>Toi</small>
          </button>
        </div>
      )}

      {indice && pieces.length > 0 && (
        <div className="fd-indice" data-indice aria-live="polite">
          <span className="fd-fleche" aria-hidden="true">
            ︿
          </span>
          <b>{P.indice}</b>
          <small>{P.indiceDouble}</small>
        </div>
      )}
      {toast && (
        <p className="fd-toast" role="status" data-toast>
          {toast}
        </p>
      )}
    </div>
  );
}

/** 🎬 (lot F3) Une séance chez un proche : sa télé, sa pièce, ceux qui y sont ; s'asseoir (invité) ou demander. */
function PieceSeance({ k, p, onRejoindre }: { k: string; p: SeanceFil; onRejoindre: () => void }) {
  const n = p.presents.length;
  return (
    <section className="fd-carte fd-seance" data-k={k} data-piece="seance" data-seance={p.cle} data-invite={p.invite ? "1" : undefined} data-demande={p.demande ? "1" : undefined}>
      <span className="fd-etiquette">
        <i className="fd-direct" aria-hidden="true" />
        {P.seanceEtiquette(p.hote)}
      </span>
      <div className="fd-tele" data-tele>
        {p.video ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vignetteYouTube(p.video.id)} alt="" referrerPolicy="no-referrer" loading="lazy" draggable={false} />
        ) : (
          <span className="fd-neige" aria-hidden="true" />
        )}
        <span className="fd-tele-titre">{p.video?.titre ?? ""}</span>
      </div>
      <div className="fd-scene">
        <div className="fd-seance-piece" style={p.image ? { backgroundImage: `url(${p.image})` } : undefined}>
          {p.presents.map((x, i) => (
            <span key={x.q} className="fd-seance-fig" data-q={x.q} style={{ left: `${((i + 1) / (n + 1)) * 100}%`, animationDelay: `${(i % 4) * 0.18}s` }}>
              {x.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={x.src} alt="" draggable={false} />
              ) : (
                <span className="fd-sans" aria-hidden="true" />
              )}
              <small>{x.prenom}</small>
            </span>
          ))}
        </div>
      </div>
      <div className="fd-bas">
        <h2 data-titre-seance>{titreDeSeance(p)}</h2>
        <p>{p.invite ? P.seanceInvite : p.demande ? P.seanceDemande(p.hote) : P.seanceSous(p.hote)}</p>
        {p.invite ? (
          <a className="fd-bouton" href={`/univers/salons?chez=${encodeURIComponent(p.cle)}`} data-asseoir-seance onClick={partir}>
            {P.asseoirAvecEux(n)}
          </a>
        ) : p.demande ? (
          <span className="fd-bouton fd-second" data-demande-envoyee>
            {P.demandeEnvoyee}
          </span>
        ) : (
          <button type="button" className="fd-bouton" data-rejoindre onClick={onRejoindre}>
            {P.rejoindre(n, p.presents[0]?.prenom ?? p.hote)}
          </button>
        )}
      </div>
    </section>
  );
}

/** Une fraction (0 à 1) en pourcentage, pour placer dans la pièce. */
const pc = (x: number) => `${(x * 100).toFixed(2)}%`;
/** ⚡ (25 novembre 2026) le toucher de « M'asseoir » se voit tout de suite : le serveur entre pendant ce temps */
const partir = (e: React.MouseEvent<HTMLElement>) => {
  if (!e.metaKey && !e.ctrlKey && !e.shiftKey) e.currentTarget.setAttribute("data-part", "");
};

/**
 * 🛋️ Un salon : sa pièce — la télé, et devant elle les places (celles qui sont prises : leurs figurines ; les autres :
 * un fauteuil vide) ; la sienne brille (« Ta place » : la toucher, c'est s'asseoir) ; leurs dernières bulles, ou, sans
 * personne, ce qui s'y est dit aujourd'hui. En bas : « M'asseoir », « Inviter ».
 */
function PieceSalon({ k, p, moi, reaction, onInviter }: { k: string; p: SalonFil; moi: string; reaction: Reaction | null; onInviter: () => void }) {
  const plan: readonly PlaceGradin[] = p.gradin?.places.length ? p.gradin.places : PLAN_GRADIN;
  const musique = p.theme === "musique";
  // (la dernière bulle de chacun de ceux qui sont là)
  const bulles = new Map<string, BulleFil>();
  for (const b of p.bulles) bulles.set(b.q, b);
  const libres = Math.max(0, PLACES_SALON - p.presents.length);
  // (🪑 personne en ce moment : « Sois le premier », et ce qui s'y est dit aujourd'hui)
  const vide = !p.presents.length;
  const traces = vide ? (p.traces ?? []) : [];
  const passes = [...new Set(traces.map((t) => t.prenom))].slice(0, 3);
  // (« il y a 2 h » : compté depuis l'arrivée de la pièce à l'écran)
  const [maintenant] = useState(() => Date.now());
  // (les places libres, dans l'ordre du salon : la première est la sienne — celle que le salon lui donnera)
  const prises = new Set(p.presents.map((x) => x.place % plan.length));
  const placesLibres = plan.map((_, i) => i).filter((i) => !prises.has(i));
  const assis = moi ? p.presents.find((x) => x.q === moi) : undefined;
  const sienne = assis ? assis.place % plan.length : placesLibres[0];
  const ici = sienne === undefined ? undefined : plan[sienne];
  const salon = `/univers/salons?theme=${p.theme}`;
  return (
    <section className={`fd-carte fd-salon${vide ? " vide" : ""}`} data-k={k} data-piece="salon" data-theme={p.theme} data-salon={p.id} data-vide={vide ? "1" : undefined}>
      <span className="fd-etiquette">
        {vide ? (
          <>✨ {P.soisLePremier}</>
        ) : (
          <>
            <i className="fd-direct" aria-hidden="true" />
            {P.enDirect(p.presents.length)}
          </>
        )}
        {p.mien ? ` · ${P.tesPassions}` : ""}
      </span>
      <div className="fd-salle">
        <div className="fd-tele" data-tele>
          {p.video ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={vignetteYouTube(p.video.id)} alt="" referrerPolicy="no-referrer" loading="lazy" draggable={false} />
          ) : (
            <span className="fd-neige" aria-hidden="true" />
          )}
          <span className="fd-tele-titre">{musique ? (p.morceau ? P.choix(p.morceau.prenom) : P.radio) : p.video?.titre ?? ""}</span>
        </div>
        <div className="fd-scene">
          <div className="fd-gradin" style={p.gradin ? { backgroundImage: `url(${p.gradin.flou})` } : undefined} data-gradin={p.gradin ? "1" : "plan"}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.gradin && <img className="fd-gradin-img" src={p.gradin.src} alt="" draggable={false} loading="lazy" />}
            {/* (sans gradin validé : chaque place libre est un fauteuil vide) */}
            {!p.gradin &&
              placesLibres.map((i) => {
                const g = plan[i];
                return (
                  <span
                    key={`f${i}`}
                    className={`fd-fauteuil${i === sienne && !assis ? " sienne" : ""}`}
                    data-fauteuil={i}
                    style={{ left: pc(g.x), top: pc(g.y - g.hauteur * 0.6), width: pc(g.hauteur * 0.92), height: pc(g.hauteur * 0.6) }}
                    aria-hidden="true"
                  >
                    <i className="dos" />
                    <i className="assise" />
                    <i className="bras g" />
                    <i className="bras d" />
                  </span>
                );
              })}
            {traces.length > 0 && (
              <div className="fd-traces" data-traces>
                {traces.map((t) => (
                  <span key={t.id} className="fd-trace" data-trace>
                    <small>
                      {t.prenom} · {P.ilYa(maintenant - t.le)}
                    </small>
                    <span>{t.texte}</span>
                  </span>
                ))}
              </div>
            )}
            {p.presents.map((x, i) => {
              const g = plan[x.place % plan.length] ?? plan[i % plan.length];
              const b = bulles.get(x.q);
              return (
                <span key={x.q} className={`fd-fig${musique ? " danse" : ""}${x.q === moi ? " moi" : ""}`} data-q={x.q} style={{ left: pc(g.x), top: pc(g.y), height: pc(g.hauteur), animationDelay: `${(i % 4) * 0.18}s` }}>
                  {b && (
                    <span className="fd-bulle" key={b.id} data-bulle style={{ animationDelay: `${(i % 3) * 1.6}s` }}>
                      {b.texte}
                    </span>
                  )}
                  {x.src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={x.src} alt="" draggable={false} />
                  ) : (
                    <span className="fd-sans" aria-hidden="true" />
                  )}
                  <small>{x.q === moi ? P.toi : x.prenom}</small>
                </span>
              );
            })}
            {/* ✨ sa place : elle brille, la toucher, c'est s'asseoir */}
            {!assis && ici && (
              <a className="fd-ta-place" href={salon} data-ta-place onClick={partir} style={{ left: pc(ici.x), top: pc(ici.y), height: pc(ici.hauteur) }} aria-label={P.asseoirIci}>
                <svg viewBox="0 0 64 88" aria-hidden="true">
                  <circle cx="32" cy="24" r="20" />
                  <rect x="11" y="47" width="42" height="38" rx="17" />
                </svg>
                <small>{P.taPlace}</small>
              </a>
            )}
            {/* (sa réaction, au-dessus de sa place) */}
            {reaction && ici && (
              <span className="fd-reaction fd-reaction-ici" key={reaction.n} data-reaction style={{ left: pc(ici.x), top: pc(ici.y - ici.hauteur) }}>
                <b>{reaction.e}</b>
                {reaction.texte && <small data-vu-par>{reaction.texte}</small>}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="fd-bas">
        {p.proches?.length ? (
          <span className="fd-proches-la" data-proches-la>
            {P.prochesLa(p.proches)}
          </span>
        ) : null}
        <h2>
          {p.e} {p.nom}
        </h2>
        <p data-sous>{!vide ? P.places(libres) : musique ? P.radioTourne : passes.length ? P.yEtaient(passes) : P.premier}</p>
        <span className="fd-boutons">
          <a className="fd-bouton" href={salon} data-asseoir onClick={partir}>
            {musique ? P.entrerDanser : P.asseoir}
          </a>
          <button type="button" className="fd-bouton fd-second" data-inviter onClick={onInviter}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="9" cy="8" r="4" />
              <path d="M2 21c.8-4 3.6-6 7-6s6.2 2 7 6" />
              <path d="M19 8v6" />
              <path d="M16 11h6" />
            </svg>
            {P.inviter}
          </button>
        </span>
      </div>
    </section>
  );
}

export const STYLES_FIL = `
.fd{position:relative}
.fd-boite{position:fixed;inset:0;z-index:1;overflow-y:auto;overscroll-behavior:contain;scroll-snap-type:y mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;background:#0B0409}
.fd-boite::-webkit-scrollbar{display:none}
.fd-carte{position:relative;height:100dvh;box-sizing:border-box;scroll-snap-align:start;scroll-snap-stop:always;display:flex;flex-direction:column;gap:10px;
  padding:calc(64px + env(safe-area-inset-top)) 16px calc(112px + env(safe-area-inset-bottom));overflow:hidden;touch-action:manipulation;-webkit-user-select:none;user-select:none;
  background:radial-gradient(90% 50% at 50% 35%,rgba(255,46,154,.16),transparent 70%),#0B0409}
.fd-salon[data-theme="musique"]{background:radial-gradient(90% 50% at 50% 35%,rgba(122,92,255,.22),transparent 70%),#130A1E}
.fd-autour{background:radial-gradient(80% 45% at 50% 40%,rgba(242,196,107,.2),transparent 70%),#1E120E}
.fd-humeur{background:radial-gradient(80% 45% at 50% 40%,rgba(255,122,192,.18),transparent 70%),#1A0C18}
.fd-seance{background:radial-gradient(80% 45% at 50% 40%,rgba(255,170,90,.18),transparent 70%),#1A0F0A}
.fd-seance-piece{position:relative;width:100%;max-width:520px;height:100%;border-radius:20px;background:#22140E center/cover;box-shadow:0 18px 40px -16px #000,inset 0 0 0 1px rgba(255,255,255,.12)}
.fd-seance-fig{position:absolute;bottom:6%;height:62%;translate:-50% 0;display:flex;flex-direction:column;align-items:center;animation:fd-flotte 3.2s ease-in-out infinite}
.fd-seance-fig img{height:100%;width:auto;max-width:none;filter:drop-shadow(0 6px 8px rgba(0,0,0,.5));-webkit-user-drag:none}
.fd-seance-fig small{position:absolute;bottom:2px;left:50%;transform:translateX(-50%);padding:1px 7px;border-radius:999px;background:rgba(0,0,0,.62);font-size:10.5px;font-weight:800;white-space:nowrap}
.fd-proches-la{display:inline-flex;padding:4px 11px;border-radius:999px;background:#FFE3F1;color:#1A0D14;font-size:12.5px;font-weight:900}
.fd-maison{background:radial-gradient(80% 45% at 50% 40%,rgba(127,240,196,.16),transparent 70%),#0E1714}
.fd-chez{justify-content:center}
.fd-chez-piece{position:relative;width:100%;max-width:460px;height:100%;max-height:52dvh;border-radius:22px;background-size:cover;background-position:center;box-shadow:0 18px 40px -16px #000,inset 0 0 0 1px rgba(255,255,255,.12)}
.fd-chez-fig{position:absolute;left:50%;bottom:6%;transform:translateX(-50%)}
.fd-chez-bulle{position:absolute;left:50%;top:10%;transform:translateX(-50%);z-index:1;white-space:nowrap;animation:fd-surgit .35s cubic-bezier(.2,1.4,.4,1)}
.fd-boutons{display:flex;flex-wrap:wrap;gap:8px}
.fd-attente{background:linear-gradient(100deg,#0B0409 30%,#1A0D16 50%,#0B0409 70%);background-size:200% 100%;animation:mc-reflet 1.4s linear infinite}
.fd-etiquette{align-self:flex-start;display:inline-flex;align-items:center;gap:7px;max-width:calc(100% - 150px);padding:5px 12px 5px 10px;border-radius:999px;background:rgba(255,255,255,.12);font-size:12.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fd-direct{width:8px;height:8px;border-radius:50%;background:#FF4D6D;animation:fd-direct 1.4s ease-in-out infinite}
.fd-tele{position:relative;flex:none;width:100%;max-width:520px;align-self:center;aspect-ratio:16/9;max-height:26dvh;border-radius:16px;overflow:hidden;background:#140A12;box-shadow:inset 0 0 0 5px #1E1420}
.fd-tele img{width:100%;height:100%;object-fit:cover;display:block}
.fd-neige{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,.04) 0 2px,transparent 2px 4px)}
.fd-tele-titre{position:absolute;left:0;right:0;bottom:0;padding:16px 12px 8px;background:linear-gradient(transparent,rgba(0,0,0,.78));font-size:12.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fd-scene{flex:1 1 auto;min-height:0;display:flex;justify-content:center;align-items:flex-end}
.fd-gradin{position:relative;height:100%;max-height:100%;aspect-ratio:1/1;max-width:100%;border-radius:18px;overflow:visible;background:radial-gradient(70% 60% at 50% 70%,rgba(255,255,255,.06),transparent 70%);background-size:cover;background-position:center}
.fd-gradin-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:18px}
.fd-fig{position:absolute;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;transform-origin:50% 100%}
.fd-fig img{height:100%;width:auto;max-width:none;filter:drop-shadow(0 6px 8px rgba(0,0,0,.5));-webkit-user-drag:none}
.fd-fig.danse img{animation:fd-danse .8s ease-in-out infinite;transform-origin:50% 100%}
.fd-fig small{position:absolute;bottom:2px;left:50%;transform:translateX(-50%);padding:1px 7px;border-radius:999px;background:rgba(0,0,0,.62);font-size:10.5px;font-weight:800;white-space:nowrap}
.fd-sans{display:block;height:100%;aspect-ratio:.6;border-radius:40% 40% 14px 14px;background:rgba(255,255,255,.1)}
.fd-bulle{position:absolute;bottom:calc(100% - 6px);left:50%;transform:translateX(-50%);z-index:2;max-width:170px;padding:6px 10px;border-radius:14px;background:#fff;color:#1A0D14;font-size:12.5px;font-weight:800;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  box-shadow:0 6px 16px rgba(0,0,0,.35);opacity:0;animation:fd-bulle 5s ease-in-out infinite}
.fd-salon.vide .fd-gradin-img{opacity:.82}
.fd-traces{position:absolute;left:50%;top:14%;z-index:1;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:7px;width:max-content;max-width:92%}
.fd-trace{display:flex;flex-direction:column;align-items:flex-start;max-width:230px;padding:6px 11px 7px;border-radius:14px 14px 14px 4px;background:rgba(255,255,255,.9);color:#1A0D14;font-size:13px;font-weight:800;line-height:1.25;
  box-shadow:0 6px 16px rgba(0,0,0,.35)}
.fd-trace span{max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fd-trace small{font-size:10.5px;font-weight:700;color:#7A5A68}
.fd-milieu{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center}
.fd-milieu h2{margin:0;font-size:22px;font-weight:800;line-height:1.2}
.fd-milieu p{margin:0;font-size:14.5px;color:#D9C3CB}
.fd-pose{gap:10px}
.fd-milieu .fd-mot{position:relative;margin:0;max-width:300px;padding:16px 20px;border-radius:22px;background:#fff;color:#1A0D14;font-size:22px;font-weight:900;line-height:1.2;box-shadow:0 14px 30px rgba(0,0,0,.45)}
.fd-mot::after{content:"";position:absolute;left:50%;bottom:-12px;margin-left:-10px;border:12px solid transparent;border-bottom:0;border-top-color:#fff}
.fd-proches{flex-direction:row;flex-wrap:wrap;align-items:center;align-content:center;gap:10px 16px}
.fd-proche{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;padding:0;border:0;background:none;color:#fff;font:inherit;cursor:pointer}
.fd-proche small{padding:1px 8px;border-radius:999px;background:rgba(0,0,0,.6);font-size:11.5px;font-weight:800}
.fd-bulle-fixe{max-width:150px;padding:6px 10px;border-radius:14px;background:#fff;color:#1A0D14;font-size:12px;font-weight:800;line-height:1.2}
.fd-proche.doux .fd-bulle-fixe{background:#FFE3F1}
.fd-bas{flex:none;display:flex;flex-direction:column;align-items:flex-start;gap:5px;padding-right:104px}
.fd-bas h2{margin:0;font-size:19px;font-weight:800;line-height:1.25}
.fd-bas p{margin:0 0 4px;font-size:13.5px;color:#E6D8DF}
.fd-bouton{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 22px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-size:15.5px;font-weight:800;text-decoration:none;cursor:pointer;box-shadow:0 10px 22px -8px rgba(255,46,154,.9)}
.fd-second{background:rgba(255,255,255,.1);box-shadow:inset 0 0 0 1px rgba(255,255,255,.2)}
.fd-haut{position:fixed;left:0;right:0;top:calc(58px + env(safe-area-inset-top));z-index:3;display:flex;justify-content:space-between;align-items:center;gap:8px;padding:0 12px;pointer-events:none}
.fd-haut>*{pointer-events:auto}
.fd-tous,.fd-pastille{min-height:36px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.28);background:rgba(11,4,9,.55);color:#fff;font:inherit;font-size:13px;font-weight:700;display:inline-flex;align-items:center;text-decoration:none;cursor:pointer;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.fd-pastille{background:#FF2E9A;border-color:transparent;max-width:62vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fd-moi{position:fixed;right:10px;bottom:calc(104px + env(safe-area-inset-bottom));z-index:4;display:flex;flex-direction:column;align-items:center}
.fd-moi>button{display:flex;flex-direction:column;align-items:center;padding:0;border:0;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent;transform-origin:50% 100%}
.fd-moi>button small{margin-top:-4px;padding:1px 10px;border-radius:999px;background:#FF2E9A;color:#fff;font-size:11px;font-weight:900}
.fd-moi>button.saute{animation:fd-saute .5s cubic-bezier(.2,1.4,.4,1) 2}
.fd-moi>button.danse{animation:fd-danse .7s ease-in-out 4}
.fd-reaction{position:absolute;bottom:calc(100% + 18px);right:0;z-index:2;display:flex;flex-direction:column;align-items:flex-end;gap:4px;animation:fd-surgit .35s cubic-bezier(.2,1.4,.4,1)}
.fd-reaction b{padding:6px 12px;border-radius:16px;background:#fff;font-size:26px;line-height:1.1}
.fd-reaction small{padding:3px 9px;border-radius:10px;background:rgba(11,4,9,.85);color:#fff;font-size:11.5px;font-weight:800;white-space:nowrap}
.fd-indice{position:fixed;left:50%;top:42%;z-index:5;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none;text-align:center;width:max-content;max-width:calc(100vw - 32px)}
.fd-indice b{padding:9px 16px;border-radius:999px;background:rgba(11,4,9,.85);font-size:14.5px;font-weight:800}
.fd-indice small{padding:5px 12px;border-radius:999px;background:rgba(11,4,9,.75);font-size:12.5px;font-weight:700;color:#F2DDE7}
.fd-fleche{font-size:34px;line-height:1;animation:fd-flotte 1.6s ease-in-out infinite}
.fd-toast{position:fixed;left:50%;top:calc(104px + env(safe-area-inset-top));z-index:6;transform:translateX(-50%);margin:0;padding:10px 16px;border-radius:14px;background:rgba(20,6,14,.95);color:#fff;font-size:14px;max-width:calc(100vw - 32px);text-align:center;box-shadow:0 10px 30px -10px #000}
@media (min-width:860px){.fd-carte{padding-left:max(16px,calc(50vw - 300px));padding-right:max(16px,calc(50vw - 300px))}}
/* 🪑 la pièce du salon : la télé et les fauteuils, ensemble */
.fd-salle{position:relative;flex:1 1 auto;min-height:0;display:flex;flex-direction:column;gap:10px;padding:12px 12px 6px;border-radius:26px;overflow:hidden;
  background:radial-gradient(55% 30% at 8% 12%,rgba(245,162,58,.22),transparent 70%),radial-gradient(55% 30% at 92% 12%,rgba(245,162,58,.18),transparent 70%),linear-gradient(180deg,#3a2418 0%,#2c1b12 44%,#3b2316 44.4%,#22130b 100%);
  box-shadow:inset 0 0 0 1px rgba(255,196,140,.14)}
.fd-salon[data-theme="musique"] .fd-salle{background:radial-gradient(55% 30% at 8% 12%,rgba(255,46,154,.2),transparent 70%),radial-gradient(55% 30% at 92% 12%,rgba(245,162,58,.18),transparent 70%),linear-gradient(180deg,#2e1a2a 0%,#24131f 44%,#33202a 44.4%,#1c0f17 100%)}
.fd-salle .fd-tele{box-shadow:0 18px 30px -14px rgba(0,0,0,.85),0 0 40px rgba(245,162,58,.18),inset 0 0 0 6px #0b0806}
.fd-salle .fd-gradin{background-color:transparent}
.fd-fauteuil{position:absolute;transform:translateX(-50%);pointer-events:none}
.fd-fauteuil i{position:absolute;display:block}
.fd-fauteuil .dos{left:12%;right:12%;top:0;height:64%;border-radius:16px 16px 8px 8px;background:linear-gradient(180deg,#7d3654,#5a2239)}
.fd-fauteuil .assise{left:6%;right:6%;bottom:0;height:44%;border-radius:10px;background:linear-gradient(180deg,#8e4062,#612641)}
.fd-fauteuil .bras{bottom:0;width:20%;height:62%;border-radius:10px;background:linear-gradient(180deg,#6a2a45,#4a1b30)}
.fd-fauteuil .bras.g{left:0}.fd-fauteuil .bras.d{right:0}
.fd-fauteuil.sienne::before{content:"";position:absolute;left:-40%;right:-40%;bottom:-30%;height:80%;border-radius:50%;background:radial-gradient(closest-side,rgba(255,46,154,.6),rgba(255,46,154,0));animation:fd-brille 2.2s ease-in-out infinite}
[data-part]{animation:fd-part .9s ease-in-out infinite;pointer-events:none}
@keyframes fd-part{50%{opacity:.55;transform:scale(.97)}}
.fd-ta-place{position:absolute;z-index:2;translate:-50% -100%;display:flex;flex-direction:column;align-items:center;text-decoration:none;-webkit-tap-highlight-color:transparent}
.fd-ta-place svg{height:100%;width:auto;overflow:visible}
.fd-ta-place circle,.fd-ta-place rect{fill:rgba(255,46,154,.16);stroke:#FF2E9A;stroke-width:2.5;stroke-dasharray:5 4}
.fd-ta-place small{position:absolute;top:calc(100% + 4px);left:50%;transform:translateX(-50%);padding:3px 10px;border-radius:999px;background:#FF2E9A;color:#120c09;font-size:12px;font-weight:900;white-space:nowrap}
.fd-ta-place:focus-visible{outline:3px solid #F5A23A;outline-offset:4px;border-radius:12px}
.fd-fig.moi small{background:#FF2E9A;color:#fff}
.fd-reaction-ici{right:auto;bottom:auto;translate:-50% -100%;align-items:center;z-index:3;pointer-events:none}
.fd-salon .fd-bas{padding-right:0;align-self:stretch}
.fd-salon .fd-boutons{width:100%;flex-wrap:nowrap}
.fd-salon .fd-boutons .fd-bouton{gap:7px}
.fd-salon .fd-boutons>a.fd-bouton{flex:1 1 auto}
@keyframes fd-brille{0%,100%{opacity:.5}50%{opacity:1}}
/* sur un ordinateur : la pièce à gauche, le salon et ses boutons à droite */
@media (min-width:1000px){
  .fd-salon{display:grid;grid-template-columns:minmax(0,1fr) 340px;grid-template-rows:auto minmax(0,1fr);column-gap:28px;row-gap:12px;padding-top:calc(104px + env(safe-area-inset-top));padding-left:max(24px,calc(50vw - 600px));padding-right:max(24px,calc(50vw - 600px))}
  .fd-salon>.fd-etiquette{grid-column:1;grid-row:1;justify-self:start}
  .fd-salon>.fd-salle{grid-column:1;grid-row:2}
  .fd-salon>.fd-bas{grid-column:2;grid-row:1 / span 2;align-self:center;gap:10px}
  .fd-salon .fd-bas h2{font-size:31px;line-height:1.08;letter-spacing:-.03em}
  .fd-salon .fd-bas p{font-size:15px}
  .fd-salon .fd-boutons{flex-direction:column;align-items:stretch}
  .fd-salon .fd-tele{max-height:36dvh}
}
@keyframes fd-direct{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes fd-bulle{0%,8%{opacity:0;transform:translate(-50%,6px) scale(.85)}14%,72%{opacity:1;transform:translate(-50%,0)}86%,100%{opacity:0;transform:translate(-50%,-4px)}}
@keyframes fd-danse{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg) translateY(-4px)}}
@keyframes fd-saute{0%,100%{transform:none}40%{transform:translateY(-16px) scale(1.06)}}
@keyframes fd-surgit{from{opacity:0;transform:translateY(10px) scale(.6)}}
@keyframes fd-flotte{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@media (prefers-reduced-motion:reduce){.fd *{animation:none!important}.fd-bulle{opacity:1}}
`;
