"use client";

/**
 * 🛋️ LE SALON DU DUO — L'ÉCRAN DE LA CONVERSATION (`docs/univers/salon-du-duo.md`, sections 3, 4.2 et 4.3 ; le lot S2,
 * première partie). Ce qu'on voit, de haut en bas, comme sur la maquette :
 *
 * - **l'en-tête** : ‹ retour, l'avatar et le prénom de l'autre, sa présence (« Là, maintenant ») ;
 * - **la scène** : la pièce du duo et les deux figurines posées (le moteur, `./moteur`) ; **une bulle par figurine**,
 *   au-dessus de sa tête, jamais coupée par la caméra (posée hors d'elle, aux ancres que le moteur donne) — le dernier
 *   message de chacun, seul ; « 💬 Messagerie » en bas à droite, avec ses non-lus ; un petit message en haut (« toast ») ;
 * - **la saisie** : « Écris à Camille… », ➤.
 *
 * **Écrire** : la bulle part de ma figurine tout de suite (avant la réponse du serveur), sa tête sautille le temps de la
 * phrase ; l'autre figurine réagit à ce qui est dit (`reactionAuTexte`, `./bulles`) ; l'envoi suit
 * (`POST /api/direct/proches { action: "ecrire" }`) ; un échec défait la bulle, rend le texte et le dit.
 * **💬 Messagerie** : toute la conversation par jour (les écrits, les vocaux qu'on écoute, les photos, les vidéos, les
 * mèmes), construite à l'ouverture (elle s'ouvre sans attendre).
 *
 * L'ouverture (une requête, la vignette floue, la pièce décodée hors de l'affichage, les temps mesurés) : le lot S0b
 * (`./ouvrir`). La suite du lot S2 : le pouls (la présence en direct, « … »), l'arrivée (« depuis ta dernière visite »),
 * la pièce du duo qu'on choisit et dont on change.
 */
import { useEffect, useRef, useState } from "react";
import { creerScene } from "./moteur";
import { envoyerMesures, imagesDe, marquer, mesures, ouvrir, prechargerImage } from "./ouvrir";
import { aRejouer, derniersDeChacun, dureeDite, heureDite, nomDuJour, parJour, reactionAuTexte, tempsDeParole, texteDeBulle, type ARejouer } from "./bulles";
import { autreQue, miseEnSceneDe, type CataloguePieces, type Flamme, type OptionsScene, type OuvertureSalon, type PieceDuSalon, type Qui, type Scene, type SceneSalon } from "@/lib/direct/salon";
import { PIECES_DUO, type PieceDuo } from "@/lib/direct/pieces-duo";
import { prochainRendezVous } from "./bulles";
import { texteDuMessage, type Fil, type MemeFil, type MessageFil } from "@/lib/direct/talkie";

type Pret = Pick<OptionsScene, "plaque" | "largeur" | "hauteur" | "figurines">;
export type ChargementSalon =
  | { etat: "charge"; flou?: string }
  | { etat: "manque"; message: string }
  | { etat: "pret"; ouverture: OuvertureSalon; pret: Pret; flou: string; deja: boolean; calques: boolean };

/** Cette conversation a-t-elle déjà été ouverte sur ce téléphone ? (et la noter) */
function dejaVue(cle: string): boolean {
  try {
    const k = `salon:vu:${cle}`;
    const vu = localStorage.getItem(k) === "1";
    localStorage.setItem(k, "1");
    return vu;
  } catch {
    return false;
  }
}

/** 🚪 Ouvrir une conversation : la requête, la vignette floue dès qu'elle arrive, puis la pièce et les calques décodés. */
export async function chargerSalon(cle: string, surFlou: (flou: string) => void): Promise<ChargementSalon> {
  const o = await ouvrir(cle);
  const sc = o.scene;
  if (!sc) return { etat: "manque", message: `La pièce de votre conversation avec ${o.fil.lui.prenom} n’est pas encore faite.` };
  surFlou(sc.plaque.flou);
  // (la plaque d'abord — elle s'affiche —, les calques des figurines pendant ce temps)
  const [plaque, ...calques] = imagesDe(o);
  const enRoute = Promise.all(calques.map((i) => prechargerImage(i)));
  await prechargerImage(plaque);
  marquer("salon:plaque");
  await enRoute;
  const c = sc.calques;
  return {
    etat: "pret",
    ouverture: o,
    flou: sc.plaque.flou,
    deja: dejaVue(cle),
    calques: !!c,
    // (ma figurine à gauche, tournée vers la droite ; la sienne à droite, tournée vers la gauche)
    pret: { plaque: sc.plaque.src, largeur: sc.plaque.largeur, hauteur: sc.plaque.hauteur, figurines: c ? { moi: { calque: c.a, sens: 1 }, autre: { calque: c.b, sens: -1 } } : {} },
  };
}

/** Le nom d'une pièce, avec son emoji (« 🌿 La terrasse »). */
const nomDePiece = (p: PieceDuo) => {
  const x = PIECES_DUO.find((y) => y.cle === p);
  return x ? `${x.emoji} ${x.nom}` : p;
};

/** L'autre figurine réagit à ce qui est dit (la maquette, telle quelle). `la` : l'autre est là (sinon elle somnole). */
function reagir(s: Scene, q: Qui, texte: string, la: boolean) {
  const f = s.figurine(q);
  if (f.dort || !la) {
    f.secouer(0.3);
    return;
  }
  const haut = s.repere(q, "haut");
  switch (reactionAuTexte(texte)) {
    case "coeurs":
      s.fx.rougir(q, 2200);
      s.fx.eclatCoeurs(s.repere(q, "tete"), 6);
      f.pencher(8, 1500);
      break;
    case "rire":
      f.rire(1);
      s.fx.jaillir("😂", { x: haut.x, y: haut.y + 0.02 }, 1, { taille: 3.6 });
      break;
    case "question":
      f.pencher(11, 1400);
      s.fx.texteQuiMonte("?", { x: haut.x + (q === "moi" ? 0.07 : -0.07), y: haut.y + 0.03 }, { taille: 4.2, c: "#ffe27a" });
      break;
    case "surprise":
      f.sursaut(0.7);
      break;
    default:
      f.pencher(6, 1200);
  }
}

/** ▶ Un vocal, dans 💬 : on l'écoute (un seul à la fois). */
let enLecture: HTMLAudioElement | null = null;
function Vocal({ m }: { m: MessageFil }) {
  const [joue, setJoue] = useState(false);
  const dit = texteDuMessage(m.repliques);
  return (
    <span className="sd-vocal">
      <button
        type="button"
        className="sd-lire"
        aria-label={joue ? "Arrêter" : "Écouter"}
        onClick={() => {
          if (joue && enLecture) {
            enLecture.pause();
            setJoue(false);
            return;
          }
          enLecture?.pause();
          const a = new Audio(m.son);
          enLecture = a;
          a.onended = a.onpause = () => setJoue(false);
          void a.play().then(
            () => setJoue(true),
            () => setJoue(false),
          );
        }}
      >
        {joue ? "❚❚" : "▶"}
      </button>
      <small>🎙️ {dureeDite(m.duree)}</small>
      {dit && <q>{dit}</q>}
    </span>
  );
}

/** Un message dans 💬 Messagerie. */
function MessageDuFil({ m, prenom }: { m: MessageFil; prenom: string }) {
  return (
    <div className={`sd-msg ${m.moi ? "moi" : "autre"}`} data-message={m.id}>
      {m.genre === "ecrit" ? (
        <>
          {m.texte && <span className="sd-texte">{m.texte}</span>}
          {m.lien && (
            <a className="sd-lien" href={m.lien.url} target="_blank" rel="noopener noreferrer nofollow">
              🔗 {m.lien.titre || m.lien.site}
            </a>
          )}
        </>
      ) : m.genre === "photo" && m.photo ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="sd-piece" src={m.photo.url} width={m.photo.l} height={m.photo.h} alt={m.texte || "Une photo"} loading="lazy" />
          {m.texte && <span className="sd-texte">{m.texte}</span>}
        </>
      ) : m.genre === "video" && m.video ? (
        <>
          <video className="sd-piece" src={m.video.url} poster={m.video.vignette} width={m.video.l} height={m.video.h} controls playsInline preload="none" />
          {m.texte && <span className="sd-texte">{m.texte}</span>}
        </>
      ) : (
        <Vocal m={m} />
      )}
      <small>
        {m.moi ? "Toi" : prenom} · {heureDite(m.le)}
      </small>
    </div>
  );
}

export function SalonDuDuo({ cle, onRetour, essai = false }: { cle: string; onRetour?: () => void; essai?: boolean }) {
  const [chargement, setChargement] = useState<ChargementSalon>({ etat: "charge" });
  const [messages, setMessages] = useState<MessageFil[]>([]);
  const [nonLus, setNonLus] = useState(0);
  const [texte, setTexte] = useState("");
  const [feuille, setFeuille] = useState(false);
  const [toast, setToast] = useState("");
  const [temps, setTemps] = useState<{ plaque?: number; pret?: number } | null>(null);
  const [memes, setMemes] = useState<MemeFil[]>([]);
  // 💓 (le pouls) l'autre est là ; sinon sa dernière visite ; il écrit
  const [la, setLa] = useState(false);
  const [vu, setVu] = useState<string | undefined>(undefined);
  const [ecrit, setEcrit] = useState(false);
  // 🚪 (l'arrivée) ce qu'il a laissé depuis ma dernière visite, rejoué un à un
  const [rejoue, setRejoue] = useState<ARejouer | null>(null);
  const [arriveeFaite, setArriveeFaite] = useState(false);
  // 🚪 (la pièce du duo) celle où l'on est ; les pièces prêtes (préchargées) ; la feuille du choix ; l'invitation reçue
  const [sceneVue, setSceneVue] = useState<SceneSalon | null>(null);
  const [catalogue, setCatalogue] = useState<CataloguePieces | null>(null);
  const [choix, setChoix] = useState<"depart" | "changer" | null>(null);
  const [invitation, setInvitation] = useState<PieceDuo | null>(null);
  // 🔥 leurs jours de suite
  const [flamme, setFlamme] = useState<Flamme | null>(null);
  const [flammeMonte, setFlammeMonte] = useState(0);
  const laRef = useRef(false);
  const sceneVueRef = useRef<SceneSalon | null>(null);
  const catalogueRef = useRef<CataloguePieces | null>(null);
  const monInvitation = useRef<PieceDuo | null>(null);
  const invitationsVues = useRef(new Set<string>());
  // (mes changements de pièce : leur nombre, et ceux en cours — un pouls parti avant ou pendant l'un d'eux ne dit pas la pièce)
  const mesChangements = useRef({ n: 0, enCours: 0 });
  const passer = useRef<(() => void) | null>(null);
  const feuilleOuverte = useRef(false);
  const lesMessages = useRef<MessageFil[]>([]);
  const prepare = useRef(0);
  const prenomRef = useRef("");
  const cadre = useRef<HTMLDivElement>(null);
  const ici = useRef<HTMLDivElement>(null);
  const liste = useRef<HTMLDivElement>(null);
  const scene = useRef<Scene | null>(null);
  const minuteToast = useRef<ReturnType<typeof setTimeout> | null>(null);
  const arriveeFaiteRef = useRef(false);
  const allerDansRef = useRef<(p: PieceDuo) => Promise<boolean>>(async () => false);
  const flammeRef = useRef<(q: "moi" | "lui") => void>(() => undefined);
  const flammeCourante = useRef<Flamme | null>(null);
  const montrerRef = useRef<(t: string, ms?: number) => void>(() => undefined);

  // 🚪 l'ouverture (une requête ; la vignette floue tout de suite ; la pièce et les calques décodés)
  useEffect(() => {
    let vivant = true;
    void chargerSalon(cle, (flou) => vivant && setChargement({ etat: "charge", flou }))
      .catch((e: unknown): ChargementSalon => ({ etat: "manque", message: e instanceof Error ? e.message : "La conversation ne s’ouvre pas." }))
      .then((c) => {
        if (!vivant) return;
        setChargement(c);
        if (c.etat === "pret") {
          setMessages(c.ouverture.fil.messages);
          setMemes(c.ouverture.fil.memes ?? []);
          setLa(c.ouverture.fil.la);
          setSceneVue(c.ouverture.scene);
          setFlamme(c.ouverture.flamme ?? null);
          setNonLus(c.ouverture.fil.messages.filter((m) => m.nouveau && !m.moi).length);
        }
      });
    return () => {
      vivant = false;
    };
  }, [cle]);

  const pret = chargement.etat === "pret" ? chargement : null;
  // 🎬 la scène de la pièce où l'on est (refaite quand on change de pièce : la plaque est déjà préchargée)
  useEffect(() => {
    const el = ici.current;
    if (!sceneVue || !el) return;
    const c = sceneVue.calques;
    const s = creerScene(el, {
      plaque: sceneVue.plaque.src,
      largeur: sceneVue.plaque.largeur,
      hauteur: sceneVue.plaque.hauteur,
      // (ma figurine à gauche, tournée vers la droite ; la sienne à droite, tournée vers la gauche ; la teinte du moment)
      figurines: c ? { moi: { calque: c.a, sens: 1 }, autre: { calque: c.b, sens: -1 } } : {},
      moment: sceneVue.moment,
      // (les bulles : au-dessus des têtes, là où la caméra les montre — écrit dans le style, jamais un rendu par image)
      surAncres: (a) => {
        const cad = cadre.current;
        if (!cad) return;
        const h = cad.clientHeight;
        const w = cad.clientWidth;
        cad.style.setProperty("--b-moi", `${Math.max(60, h - a.moi.y + 6)}px`);
        cad.style.setProperty("--b-autre", `${Math.max(60, h - a.autre.y + 6)}px`);
        cad.style.setProperty("--q-moi", `${Math.max(14, Math.min(150, a.moi.x - 16))}px`);
        cad.style.setProperty("--q-autre", `${Math.max(14, Math.min(150, w - a.autre.x - 16))}px`);
        cad.dataset.ancres = "1";
      },
    });
    scene.current = s;
    sceneVueRef.current = sceneVue;
    // (une pièce de plus : s'il n'est pas là et que l'arrivée est passée, sa figurine somnole déjà)
    if (!laRef.current && arriveeFaiteRef.current) s.figurine("autre").endormir();
    try {
      localStorage.setItem(`salon:piece:${cle}`, sceneVue.piece);
    } catch {
      // (sans stockage : la phrase « ✨ … vous a installés » pourra revenir, ce n'est pas grave)
    }
    return () => {
      s.detruire();
      if (scene.current === s) scene.current = null;
    };
  }, [sceneVue, cle]);

  // ⏱️ ses temps mesurés, une fois par ouverture ; 🚪 l'arrivée : ce qu'il a laissé depuis ma dernière visite, rejoué un à
  // un (12 s au plus ; un toucher passe la suite), puis, s'il n'est pas là, sa figurine somnole
  useEffect(() => {
    if (!pret) return;
    const raf = requestAnimationFrame(() => {
      marquer("salon:pret");
      setTemps(mesures());
      envoyerMesures(pret.deja);
    });
    const fil = pret.ouverture.fil;
    const suite = aRejouer(fil.messages, fil.memes ?? []);
    const minutes: ReturnType<typeof setTimeout>[] = [];
    const fin = () => {
      minutes.forEach(clearTimeout);
      passer.current = null;
      arriveeFaiteRef.current = true;
      setRejoue(null);
      setArriveeFaite(true);
      const s = scene.current;
      if (s && !laRef.current && !s.figurine("autre").dort) s.figurine("autre").endormir();
    };
    let t = 700;
    for (const x of suite) {
      minutes.push(
        setTimeout(() => {
          setRejoue(x);
          const s = scene.current;
          if (!s) return;
          s.figurine("autre").parler(tempsDeParole(x.texte));
          minutes.push(setTimeout(() => scene.current === s && reagir(s, "moi", x.texte, true), 450));
        }, t),
      );
      t += x.ms;
    }
    minutes.push(setTimeout(fin, suite.length ? t : 400));
    passer.current = suite.length ? fin : null;
    // (✨ l'autre nous a installés ailleurs depuis ma dernière visite)
    const sc = pret.ouverture.scene;
    let avant: string | null = null;
    try {
      avant = localStorage.getItem(`salon:piece:${cle}`);
    } catch {
      avant = null;
    }
    if (sc?.installePar === "autre" && avant && avant !== sc.piece) minutes.push(setTimeout(() => montrerRef.current(`✨ ${fil.lui.prenom} vous a installés · ${nomDePiece(sc.piece)}`, 3200), 300));
    return () => {
      cancelAnimationFrame(raf);
      minutes.forEach(clearTimeout);
      passer.current = null;
    };
  }, [pret, cle]);

  // 🚪 LES PIÈCES OÙ S'INSTALLER : demandées après l'ouverture, leurs plaques préchargées une à une (toute pièce s'ouvre
  // ensuite tout de suite) ; la toute première fois, « Où vous installez-vous ? »
  useEffect(() => {
    if (!pret) return;
    let fini = false;
    const t = setTimeout(async () => {
      const r = await fetch(`/api/direct/salon?pieces=${encodeURIComponent(cle)}`, { cache: "no-store" }).catch(() => null);
      const j = r?.ok ? ((await r.json().catch(() => null)) as { catalogue?: CataloguePieces } | null) : null;
      if (fini || !j?.catalogue) return;
      catalogueRef.current = j.catalogue;
      setCatalogue(j.catalogue);
      if (pret.ouverture.scene && pret.ouverture.scene.choisie === false) setChoix((c) => c ?? "depart");
      for (const p of j.catalogue.pieces) {
        if (fini) return;
        await prechargerImage(p.scene.plaque);
      }
    }, 600);
    return () => {
      fini = true;
      clearTimeout(t);
    };
  }, [pret, cle]);

  // 🟢 je suis là (toutes les minutes, page visible) : l'autre le voit
  useEffect(() => {
    if (!pret) return;
    const dire = () => {
      // (la réponse est lue : une réponse jamais lue laisse sa requête ouverte)
      if (document.visibilityState === "visible")
        void fetch("/api/direct/proches", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "la" }) })
          .then((r) => r.text())
          .catch(() => undefined);
    };
    dire();
    const n = setInterval(dire, 60_000);
    return () => clearInterval(n);
  }, [pret]);

  // 💓 LE POULS : toutes les 1,5 s quand l'autre est là, toutes les 10 s sinon, jamais page cachée ; on ne relit la
  // conversation que si son numéro a changé
  useEffect(() => {
    if (!pret) return;
    let fini = false;
    let minute: ReturnType<typeof setTimeout> | null = null;
    let laConnu = pret.ouverture.fil.la;
    let connu: number | null = null;
    const dernierConnu = Math.max(0, ...pret.ouverture.fil.messages.map((m) => Date.parse(m.le) || 0), ...(pret.ouverture.fil.memes ?? []).map((m) => Date.parse(m.le) || 0));
    const relire = async () => {
      const r = await fetch(`/api/direct/proches?fil=${encodeURIComponent(cle)}`, { cache: "no-store" }).catch(() => null);
      const j = r?.ok ? ((await r.json().catch(() => null)) as { fil?: Fil } | null) : null;
      const f = j?.fil;
      if (!f || fini) return;
      const connus = new Set(lesMessages.current.map((m) => m.id));
      const neufs = f.messages.filter((m) => !m.moi && !connus.has(m.id));
      setMessages((avant) => {
        // (mes envois pas encore confirmés restent)
        const enRoute = avant.filter((m) => m.id.startsWith("envoi-") && !f.messages.some((x) => x.moi && x.texte === m.texte));
        return [...f.messages, ...enRoute];
      });
      setMemes(f.memes ?? []);
      // (ses nouveaux messages : sa figurine les dit, la mienne réagit ; les non-lus, si 💬 est fermée)
      const s = scene.current;
      if (neufs.length && s) {
        const dernier = neufs[neufs.length - 1];
        if (s.figurine("autre").dort) s.figurine("autre").reveiller();
        s.figurine("autre").parler(tempsDeParole(texteDeBulle(dernier)));
        setTimeout(() => scene.current === s && reagir(s, "moi", texteDeBulle(dernier), true), 450);
      }
      if (neufs.length && !feuilleOuverte.current) setNonLus((n) => n + neufs.length);
      if (neufs.length) flammeRef.current("lui");
    };
    const battre = async () => {
      minute = null;
      if (fini || document.visibilityState !== "visible") return;
      const avant = mesChangements.current.n;
      const r = await fetch(`/api/direct/proches?pouls=${encodeURIComponent(cle)}`, { cache: "no-store" }).catch(() => null);
      const p = r?.ok ? ((await r.json().catch(() => null)) as { n?: number; la?: boolean; ecrit?: boolean; vu?: string; piece?: PieceDuo; invitation?: PieceDuo; refus?: boolean } | null) : null;
      if (fini) return;
      if (p) {
        const n = Number(p.n) || 0;
        const estLa = Boolean(p.la);
        setLa(estLa);
        setVu(p.vu);
        setEcrit(Boolean(p.ecrit));
        const s = scene.current;
        // (il arrive : sa figurine se réveille et fait coucou, la mienne se tourne vers elle ; il part : elle somnole)
        if (s && estLa !== laConnu) {
          if (estLa) {
            s.figurine("autre").reveiller();
            setTimeout(() => {
              if (scene.current !== s) return;
              if (miseEnSceneDe("coucou")) void s.geste("coucou", "autre");
              else s.fx.jaillir("👋", s.repere("autre", "haut"), 1, { taille: 4 });
              s.figurine("moi").pencher(8, 1400);
            }, 500);
          } else if (!s.figurine("autre").dort) s.figurine("autre").endormir();
        }
        laConnu = estLa;
        laRef.current = estLa;
        // 🚪 la pièce a changé (il a dit « Venir », ou nous a installés ailleurs pendant mon absence)
        const ici = sceneVueRef.current?.piece;
        const aJour = mesChangements.current.n === avant && !mesChangements.current.enCours;
        if (aJour && p.piece && ici && p.piece !== ici) {
          const dit = monInvitation.current === p.piece ? `✨ ${prenomRef.current} vous rejoint · ${nomDePiece(p.piece)}` : `✨ ${prenomRef.current} vous a installés · ${nomDePiece(p.piece)}`;
          monInvitation.current = null;
          void allerDansRef.current(p.piece).then((ok) => ok && montrerRef.current(dit, 3200));
        }
        // 🚪 il m'invite ailleurs ; il a dit « Pas maintenant » à mon invitation
        if (p.invitation && !invitationsVues.current.has(p.invitation)) {
          invitationsVues.current.add(p.invitation);
          setInvitation(p.invitation);
        }
        // (plus d'invitation en cours — il a répondu, elle a expiré : la suivante, même vers la même pièce, se montrera)
        if (!p.invitation) {
          setInvitation(null);
          invitationsVues.current.clear();
        }
        if (p.refus && monInvitation.current) {
          monInvitation.current = null;
          montrerRef.current(`${prenomRef.current} préfère rester ici pour l’instant`, 3200);
        }
        if (connu === null ? n > dernierConnu + 1500 : n !== connu) await relire();
        connu = n;
      }
      if (!fini) minute = setTimeout(battre, laConnu ? 1500 : 10_000);
    };
    const visible = () => {
      if (document.visibilityState === "visible" && !minute) void battre();
    };
    document.addEventListener("visibilitychange", visible);
    minute = setTimeout(battre, 1500);
    return () => {
      fini = true;
      if (minute) clearTimeout(minute);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [pret, cle]);

  // ✍️ « … » chez l'autre pendant que j'écris (redit toutes les 5 s ; fini à l'envoi ou quand la saisie se vide)
  const direQueJEcris = (oui: boolean) => {
    if (oui && Date.now() - prepare.current < 5000) return;
    if (!oui && !prepare.current) return;
    prepare.current = oui ? Date.now() : 0;
    void fetch("/api/direct/proches", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "prepare", cle, oui }), keepalive: !oui })
      .then((r) => r.text())
      .catch(() => undefined);
  };
  useEffect(() => {
    feuilleOuverte.current = feuille;
  }, [feuille]);
  useEffect(() => {
    lesMessages.current = messages;
  }, [messages]);

  // (la messagerie ouverte : en bas, le plus récent)
  useEffect(() => {
    if (!feuille) return;
    const l = liste.current;
    if (l) l.scrollTop = l.scrollHeight;
  }, [feuille, messages]);
  useEffect(() => () => void (minuteToast.current && clearTimeout(minuteToast.current)), []);

  const montrer = (t: string, ms = 2600) => {
    setToast(t);
    if (minuteToast.current) clearTimeout(minuteToast.current);
    minuteToast.current = setTimeout(() => setToast(""), ms);
  };
  useEffect(() => {
    montrerRef.current = montrer;
    laRef.current = la;
    allerDansRef.current = allerDans;
    flammeRef.current = monterLaFlamme;
  });
  useEffect(() => {
    flammeCourante.current = flamme;
  }, [flamme]);

  /** 🚪 Aller dans une pièce (sa scène est dans le catalogue, sa plaque préchargée : tout de suite). */
  async function allerDans(piece: PieceDuo): Promise<boolean> {
    let cat = catalogueRef.current;
    if (!cat?.pieces.some((x) => x.cle === piece)) {
      const r = await fetch(`/api/direct/salon?pieces=${encodeURIComponent(cle)}`, { cache: "no-store" }).catch(() => null);
      const j = r?.ok ? ((await r.json().catch(() => null)) as { catalogue?: CataloguePieces } | null) : null;
      if (j?.catalogue) {
        cat = j.catalogue;
        catalogueRef.current = cat;
        setCatalogue(cat);
      }
    }
    const p = cat?.pieces.find((x) => x.cle === piece);
    if (!p) return false;
    await prechargerImage(p.scene.plaque);
    setSceneVue(p.scene);
    return true;
  }

  /**
   * 🚪 S'installer dans une pièce : la première fois, ou quand l'autre n'est pas là, on y est tout de suite (l'envoi suit) ;
   * s'il est là, il est invité (« Venir » / « Pas maintenant »).
   */
  async function choisir(p: PieceDuSalon) {
    const depart = choix === "depart";
    setChoix(null);
    if (!sceneVue || (p.cle === sceneVue.piece && !depart)) return;
    await parMoi(() => sInstaller(p, depart));
  }
  /** (un changement de pièce de ma main : le pouls ne dit pas la pièce tant qu'il dure, ni s'il est parti avant sa fin) */
  async function parMoi(f: () => Promise<void>) {
    mesChangements.current.n += 1;
    mesChangements.current.enCours += 1;
    try {
      await f();
    } finally {
      mesChangements.current.enCours -= 1;
      mesChangements.current.n += 1;
    }
  }
  async function sInstaller(p: PieceDuSalon, depart: boolean) {
    if (!sceneVue) return;
    const direct = depart || !la || sceneVue.choisie === false;
    const avant = sceneVue;
    if (direct && p.cle !== sceneVue.piece) {
      await prechargerImage(p.scene.plaque);
      setSceneVue(p.scene);
    }
    const r = await fetch("/api/direct/salon", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "piece", cle, piece: p.cle }) }).catch(() => null);
    const j = r ? ((await r.json().catch(() => null)) as { piece?: PieceDuo; invitation?: boolean; error?: string } | null) : null;
    if (!r?.ok || !j) {
      if (direct) setSceneVue(avant);
      montrer(j?.error ? `Pas changé : ${j.error}` : "Pas changé : réessaie.");
      return;
    }
    if (j.invitation) {
      if (direct) setSceneVue(avant);
      monInvitation.current = p.cle;
      montrer(`🚪 Tu invites ${prenom} · ${p.emoji} ${p.nom}…`, 3600);
      return;
    }
    if (!direct) {
      await prechargerImage(p.scene.plaque);
      setSceneVue(p.scene);
    }
    montrer(`✨ Vous voilà · ${p.emoji} ${p.nom}`);
  }

  /** 🚪 Répondre à son invitation. */
  async function repondre(oui: boolean) {
    const piece = invitation;
    setInvitation(null);
    if (!piece) return;
    await parMoi(async () => {
      const r = await fetch("/api/direct/salon", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "venir", cle, oui }) }).catch(() => null);
      const j = r ? ((await r.json().catch(() => null)) as { piece?: PieceDuo; error?: string } | null) : null;
      if (!r?.ok) {
        montrer(j?.error ?? "Ça n’a pas marché : réessaie.");
        return;
      }
      if (oui && j?.piece && (await allerDans(j.piece))) montrer(`✨ Vous voilà · ${nomDePiece(j.piece)}`);
    });
  }

  /** 🔥 La flamme monte d'un cran au premier échange du jour (chacun a écrit aujourd'hui). */
  function monterLaFlamme(qui: "moi" | "lui") {
    const f = flammeCourante.current;
    if (!f || f[qui]) return;
    const g: Flamme = { ...f, [qui]: true };
    if (g.moi && g.lui) {
      g.jours = f.jours + 1;
      setFlammeMonte((n) => n + 1);
      montrer(`🔥 ${g.jours} jour${g.jours > 1 ? "s" : ""} de suite !`, 3000);
    }
    flammeCourante.current = g;
    setFlamme(g);
  }

  const fil = pret?.ouverture.fil;
  const prenom = fil?.lui.prenom ?? "";
  useEffect(() => {
    prenomRef.current = prenom;
  }, [prenom]);
  const peutEcrire = fil?.ecrire !== false;

  /** ✍️ Écrire : la bulle tout de suite, l'autre figurine réagit, puis l'envoi ; un échec défait et le dit. */
  async function envoyer() {
    const t = texte.trim();
    if (!t || !fil) return;
    const provisoire: MessageFil = { id: `envoi-${Date.now()}`, moi: true, le: new Date().toISOString(), duree: 0, son: "", repliques: [], genre: "ecrit", texte: t };
    setMessages((l) => [...l, provisoire]);
    setTexte("");
    direQueJEcris(false);
    const s = scene.current;
    if (s) {
      s.figurine("moi").parler(tempsDeParole(t));
      setTimeout(() => scene.current === s && reagir(s, autreQue("moi"), t, fil.la), 450);
    }
    try {
      const r = await fetch("/api/direct/proches", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "ecrire", cle, texte: t }) });
      const j = (await r.json().catch(() => null)) as { message?: MessageFil; error?: string } | null;
      if (!r.ok || !j?.message) throw new Error(j?.error || "");
      const vrai = j.message;
      setMessages((l) => l.map((m) => (m.id === provisoire.id ? vrai : m)));
      monterLaFlamme("moi");
    } catch (e) {
      setMessages((l) => l.filter((m) => m.id !== provisoire.id));
      setTexte((x) => x || t);
      montrer(e instanceof Error && e.message ? `Pas envoyé : ${e.message}` : "Pas envoyé : réessaie.");
    }
  }

  const { moi: monDernier, autre: sonDernierMessage } = derniersDeChacun(messages);
  // (pendant l'arrivée, sa bulle dit ce qui est rejoué — rien avant qu'elle commence ; ensuite, son dernier message)
  const arriveeAVenir = !arriveeFaite && !rejoue && fil ? aRejouer(fil.messages, fil.memes ?? []).length > 0 : false;
  const sonDernier = rejoue ?? (sonDernierMessage && !arriveeAVenir ? { id: sonDernierMessage.id, texte: texteDeBulle(sonDernierMessage) } : null);
  const jours = fil ? parJour(messages, memes) : [];
  const objetsEtagere = pret?.ouverture.vivant?.etagere?.objets ?? [];
  const souvenirs = objetsEtagere.length;
  const rdv = prochainRendezVous(objetsEtagere);
  const presence = la ? null : vu ? (nomDuJour(vu) === "Aujourd’hui" ? `Dernière visite à ${heureDite(vu)}` : nomDuJour(vu) === "Hier" ? `Dernière visite hier à ${heureDite(vu)}` : `Dernière visite ${nomDuJour(vu)}`) : "Pas là pour l’instant";
  const flou = chargement.etat !== "manque" ? chargement.flou : undefined;

  return (
    <main className="sd">
      <style>{STYLES_SALON}</style>
      <header className="sd-entete">
        {onRetour ? (
          <button type="button" className="sd-retour" aria-label="Retour" onClick={onRetour}>
            ‹
          </button>
        ) : (
          <a className="sd-retour" aria-label="Retour" href="/collection#proches">
            ‹
          </a>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {fil ? <img className="sd-avatar" src={fil.lui.neutre} alt="" /> : <span className="sd-avatar" aria-hidden />}
        <span className="sd-qui">
          <b>{prenom || "…"}</b>
          {fil && (
            <span data-presence={la ? "la" : "absent"}>
              {la ? (
                <>
                  <i className="sd-pt" /> Là, maintenant
                </>
              ) : (
                presence
              )}
            </span>
          )}
        </span>
        {souvenirs > 0 && (
          <span className="sd-pastille" data-souvenirs={souvenirs} aria-label={`${souvenirs} souvenirs sur votre étagère`}>
            <span className="e">📚</span>
            {souvenirs}
          </span>
        )}
        {flamme && flamme.jours > 0 && (
          <span key={flammeMonte} className={`sd-pastille${flammeMonte ? " monte" : ""}`} data-flamme={flamme.jours} aria-label={`${flamme.jours} jours de suite`}>
            <span className="e">🔥</span>
            {flamme.jours}
          </span>
        )}
      </header>

      <div
        ref={cadre}
        className="sd-scene"
        data-pret={pret ? "1" : undefined}
        data-calques={pret ? (pret.calques ? "poses" : "aucun") : undefined}
        data-flou={flou ? "1" : undefined}
        style={flou ? { backgroundImage: `url("${flou}")` } : undefined}
        onPointerDown={() => passer.current?.()}
      >
        <div ref={ici} className="sd-ici" />
        {pret && (
          <>
            <div className="sd-bulles moi" aria-live="polite">
              {monDernier && (
                <div key={monDernier.id} className="sd-bulle moi" data-bulle={monDernier.id}>
                  {texteDeBulle(monDernier)}
                </div>
              )}
            </div>
            <div className="sd-bulles autre" aria-live="polite">
              {sonDernier && (
                <div key={sonDernier.id} className="sd-bulle autre" data-bulle={sonDernier.id} data-rejoue={rejoue ? "1" : undefined}>
                  {sonDernier.texte}
                </div>
              )}
              {ecrit && (
                <div className="sd-bulle autre ecrit" data-ecrit aria-label={`${prenom} écrit`}>
                  <span className="sd-points">
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
              )}
            </div>
            {catalogue && sceneVue && catalogue.pieces.length > 1 && (
              <button type="button" className="sd-puce sd-porte" data-piece={sceneVue.piece} onClick={() => setChoix("changer")} aria-label="Changer de pièce">
                <span className="e">🚪</span>
                <span>{nomDePiece(sceneVue.piece)}</span>
              </button>
            )}
            {rdv && (
              <span className={`sd-puce sd-rdv${rdv.jour ? " jour" : ""}`} data-rdv>
                <span className="e">{rdv.emoji}</span>
                <span>
                  {rdv.titre} · {rdv.quand}
                </span>
              </span>
            )}
            {invitation && (
              <div className="sd-invite" role="alertdialog" aria-label="Une invitation" data-invitation={invitation}>
                <p>
                  🚪 {prenom} t’invite · {nomDePiece(invitation)}
                </p>
                <span>
                  <button type="button" className="oui" onClick={() => void repondre(true)}>
                    Venir
                  </button>
                  <button type="button" onClick={() => void repondre(false)}>
                    Pas maintenant
                  </button>
                </span>
              </div>
            )}
            <button
              type="button"
              className="sd-puce sd-fil"
              onClick={() => {
                setNonLus(0);
                setFeuille(true);
              }}
            >
              <span className="e">💬</span>
              <span>Messagerie</span>
              {nonLus > 0 && <span className="sd-badge">{nonLus}</span>}
            </button>
          </>
        )}
        <p className={`sd-toast${toast ? " vu" : ""}`} role="status">
          {toast}
        </p>
        {chargement.etat === "charge" && !flou && <p className="sd-attente">La pièce arrive…</p>}
        {chargement.etat === "manque" && <p className="sd-attente">{chargement.message}</p>}
        {essai && temps && (
          <p className="sd-temps" data-temps>
            La pièce à l’écran : <b>{temps.plaque ?? "—"} ms</b> · prête : <b>{temps.pret ?? "—"} ms</b>
            {pret?.deja ? " (déjà vue sur ce téléphone)" : " (première fois sur ce téléphone)"}
          </p>
        )}
      </div>

      <form
        className="sd-saisie"
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          void envoyer();
        }}
      >
        <input
          value={texte}
          onChange={(e) => {
            setTexte(e.target.value);
            direQueJEcris(e.target.value.trim().length > 0);
          }}
          placeholder={peutEcrire ? `Écris à ${prenom || "…"}…` : "L’écriture est en pause"}
          aria-label={`Écrire à ${prenom}`}
          maxLength={1000}
          enterKeyHint="send"
          disabled={!fil || !peutEcrire}
        />
        <button type="submit" className="sd-envoyer" aria-label="Envoyer" disabled={!texte.trim() || !fil || !peutEcrire}>
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M4 12l15-7-5 15-3-6z" fill="#fff" />
          </svg>
        </button>
      </form>

      {/* 💬 Messagerie : construite à l'ouverture, elle monte du bas (un voile derrière ; le voile ou la poignée la ferment) */}
      <div
        className={`sd-voile${feuille || choix ? " vu" : ""}`}
        onClick={() => {
          setFeuille(false);
          setChoix(null);
        }}
        aria-hidden
      />
      {/* 🚪 « Où vous installez-vous ? » (la toute première fois) ; « Changer de pièce » (à tout moment) */}
      <section className={`sd-choix${choix ? " vu" : ""}`} aria-label={choix === "depart" ? "Où vous installez-vous ?" : "Changer de pièce"} aria-hidden={!choix}>
        <button type="button" className="sd-poignee" onClick={() => setChoix(null)}>
          <h3>{choix === "depart" ? "Où vous installez-vous ?" : "Changer de pièce"}</h3>
        </button>
        <div className="sd-corps">
          <p className="sd-sous">{la && sceneVue?.choisie ? `${prenom} est là : ce sera une invitation.` : `${prenom} vous retrouvera dans la pièce que tu choisis.`}</p>
          <div className="sd-pieces">
            {catalogue?.pieces.map((p) => (
              <button key={p.cle} type="button" className={`sd-piece-carte${p.cle === sceneVue?.piece ? " ici" : ""}`} data-choisir={p.cle} onClick={() => void choisir(p)}>
                <span className="sd-vignette" style={{ backgroundImage: `url("${p.scene.plaque.flou}")` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.scene.plaque.src} srcSet={p.scene.plaque.srcset} sizes="45vw" alt="" loading="lazy" draggable={false} />
                </span>
                <b>
                  {p.emoji} {p.nom}
                </b>
                <small>{p.cle === sceneVue?.piece && choix !== "depart" ? "✓ Vous êtes ici" : p.cle === catalogue.proposee && choix === "depart" ? "✓ Ta pièce" : " "}</small>
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className={`sd-feuille${feuille ? " vu" : ""}`} aria-label="La messagerie" aria-hidden={!feuille}>
        <button type="button" className="sd-poignee" onClick={() => setFeuille(false)}>
          <h3>Toute la conversation avec {prenom}</h3>
        </button>
        <div className="sd-corps" ref={liste}>
          {jours.length ? (
            jours.map((j) => (
              <div key={j.jour} className="sd-jour-bloc">
                <div className="sd-jour">{j.jour}</div>
                {j.lignes.map((l) =>
                  l.sorte === "message" ? (
                    <MessageDuFil key={l.m.id} m={l.m} prenom={prenom} />
                  ) : (
                    <div key={`meme-${l.meme.id}`} className="sd-evt" data-meme={l.meme.id}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={l.meme.image} alt="" loading="lazy" />
                      <span>{l.meme.moi ? "🎭 Tu as envoyé un mème" : `🎭 ${prenom} t’a envoyé un mème`}</span>
                      <small>{heureDite(l.meme.le)}</small>
                    </div>
                  ),
                )}
              </div>
            ))
          ) : (
            <p className="sd-vide">Pas encore de message entre vous : écris le premier !</p>
          )}
        </div>
      </section>
    </main>
  );
}

// (les couleurs et les mesures de la maquette, section 3)
export const STYLES_SALON = `
.sd{--nuit:#1d0a1b;--carte:#2c1129;--trait:#5a3352;--or:#f2be6a;--rose:#ff2f8f;--creme:#fff6ea;--rosepale:#ffe0ee;--encre:#2a1424;--texte:#fbeef6;--doux:#c6a6bd;--vert:#45d483;
  --app:-apple-system,"SF Pro Rounded","SF Pro Text",system-ui,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;--emoji:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif;
  position:relative;height:100dvh;display:flex;flex-direction:column;overflow:hidden;background:var(--nuit);color:var(--texte);font-family:var(--app);-webkit-tap-highlight-color:transparent}
.sd button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;padding:0}
.sd button:focus-visible,.sd input:focus-visible{outline:2px solid var(--or);outline-offset:2px}
.sd-entete{flex:none;height:54px;display:flex;align-items:center;gap:9px;padding:env(safe-area-inset-top,0px) 12px 0 8px}
.sd-retour{width:26px;height:36px;display:grid;place-items:center;font-size:26px;line-height:1;color:var(--texte);text-decoration:none}
.sd-avatar{width:38px;height:38px;border-radius:50%;flex:none;object-fit:cover;background:var(--carte);box-shadow:0 0 0 2px var(--or)}
.sd-qui{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.15}
.sd-qui b{font-size:16.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sd-qui span{font-size:12px;color:var(--doux);display:flex;align-items:center;gap:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sd-pt{width:7px;height:7px;border-radius:50%;background:var(--vert);box-shadow:0 0 0 3px rgba(69,212,131,.22);flex:none}
.sd-pastille{display:flex;align-items:center;gap:4px;height:34px;padding:0 11px;border-radius:17px;border:1.5px solid rgba(242,190,106,.65);background:rgba(242,190,106,.08);font:700 15px var(--app);color:#ffd99a;flex:none;box-sizing:border-box}
.sd-pastille .e{font-family:var(--emoji);font-size:16px}
.sd-pastille.monte{animation:sd-monte .9s cubic-bezier(.2,1.6,.4,1)}
@keyframes sd-monte{0%{transform:scale(1)}35%{transform:scale(1.35)}100%{transform:scale(1)}}
.sd-scene{position:relative;flex:1;min-height:0;margin:2px 10px 0;border-radius:26px;overflow:hidden;background:#3a1f16 center 30%/cover no-repeat;box-shadow:inset 0 0 0 1px rgba(242,190,106,.18)}
.sd-ici{position:absolute;inset:0}
.sd-bulles{position:absolute;z-index:4;display:flex;flex-direction:column;gap:5px;pointer-events:none;max-width:calc(50% - 14px);transition:bottom 1.3s cubic-bezier(.22,.8,.2,1)}
.sd-bulles.moi{left:10px;bottom:var(--b-moi,60%);align-items:flex-start}
.sd-bulles.autre{right:10px;bottom:var(--b-autre,58%);align-items:flex-end}
.sd-scene:not([data-ancres]) .sd-bulles{visibility:hidden}
.sd-bulle{position:relative;max-width:100%;box-sizing:border-box;background:var(--creme);color:var(--encre);font:600 13px/1.3 var(--app);padding:8px 11px;border-radius:16px;box-shadow:0 6px 16px rgba(30,6,24,.35);animation:sd-bulle .38s cubic-bezier(.2,1.5,.4,1) both;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden}
.sd-bulle.moi{background:var(--rosepale);transform-origin:12% 100%}
.sd-bulle.autre{transform-origin:88% 100%}
.sd-bulles::after{content:"";position:absolute;bottom:-6px;width:12px;height:12px;transform:rotate(45deg);border-radius:2px}
.sd-bulles.moi:has(.sd-bulle)::after{left:var(--q-moi,22px);background:var(--rosepale)}
.sd-bulles.autre:has(.sd-bulle)::after{right:var(--q-autre,24px);background:var(--creme)}
@keyframes sd-bulle{0%{opacity:0;transform:scale(.5) translateY(8px)}100%{opacity:1;transform:none}}
.sd-bulle.ecrit{padding:10px 13px}
.sd-points{display:flex;gap:4px;align-items:center;height:10px}
.sd-points i{width:7px;height:7px;border-radius:50%;background:#8e6f83;animation:sd-point 1.1s ease-in-out infinite}
.sd-points i:nth-child(2){animation-delay:.15s}.sd-points i:nth-child(3){animation-delay:.3s}
@keyframes sd-point{0%,60%,100%{transform:none;opacity:.45}30%{transform:translateY(-4px);opacity:1}}
@media (prefers-reduced-motion:reduce){.sd-points i{animation:none}}
.sd-puce{position:absolute;z-index:5;display:flex;align-items:center;gap:6px;height:36px;padding:0 14px;border-radius:18px;font:700 13px var(--app);color:#fff;background:rgba(24,7,20,.72);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:0 4px 14px rgba(0,0,0,.25)}
.sd-puce .e{font-family:var(--emoji);font-size:16px}
.sd-fil{bottom:10px;right:10px}
.sd-porte{top:10px;left:10px;height:32px;padding:0 12px;font-size:12.5px;max-width:calc(50% - 20px)}
.sd-porte span:last-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sd-rdv{top:10px;right:10px;height:32px;padding:0 12px;font-size:12.5px;max-width:calc(50% - 20px)}
.sd-rdv span:last-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sd-rdv.jour{background:rgba(255,47,143,.82)}
.sd-invite{position:absolute;z-index:9;left:0;right:0;margin:0 auto;top:54px;width:min(320px,88%);box-sizing:border-box;padding:12px 14px;border-radius:18px;background:rgba(255,246,234,.97);color:var(--encre);box-shadow:0 12px 30px rgba(0,0,0,.35);animation:sd-bulle .38s cubic-bezier(.2,1.5,.4,1) both}
.sd-invite p{margin:0 0 10px;font:700 14px/1.35 var(--app);text-align:center}
.sd-invite span{display:flex;gap:8px;justify-content:center}
.sd-invite button{height:38px;padding:0 16px!important;border-radius:19px;background:rgba(42,20,36,.08)!important;font:700 14px var(--app)!important;color:var(--encre)!important}
.sd-invite button.oui{background:var(--rose)!important;color:#fff!important}
.sd-badge{min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:var(--rose);font:800 11px/18px var(--app);text-align:center;box-sizing:border-box}
.sd-toast{position:absolute;z-index:8;left:50%;top:12px;margin:0;transform:translate(-50%,-8px);width:max-content;max-width:88%;box-sizing:border-box;padding:9px 14px;border-radius:16px;background:rgba(255,246,234,.96);color:var(--encre);font:650 13px/1.3 var(--app);text-align:center;box-shadow:0 10px 26px rgba(0,0,0,.3);opacity:0;pointer-events:none;transition:opacity .3s ease,transform .3s ease}
.sd-toast.vu{opacity:1;transform:translate(-50%,0)}
.sd-attente{position:absolute;inset:auto 16px 45%;margin:0;text-align:center;font-weight:600}
.sd-temps{position:absolute;z-index:5;left:10px;bottom:10px;margin:0;max-width:calc(100% - 150px);padding:6px 9px;border-radius:12px;background:rgba(24,7,20,.62);font:600 11px/1.3 var(--app);font-variant-numeric:tabular-nums}
.sd-saisie{flex:none;display:flex;gap:9px;align-items:center;padding:8px 12px max(12px,env(safe-area-inset-bottom,0px))}
.sd-saisie input{flex:1;min-width:0;height:46px;box-sizing:border-box;border-radius:23px;border:1.5px solid var(--trait);background:#170816;color:var(--texte);padding:0 18px;font:500 15.5px var(--app)}
.sd-saisie input::placeholder{color:#97738b}
.sd-envoyer{width:48px;height:48px;border-radius:50%;flex:none;display:grid;place-items:center;background:var(--rose)!important;box-shadow:0 6px 18px rgba(255,47,143,.4);transition:transform .15s ease,opacity .15s ease}
.sd-envoyer:disabled{opacity:.45;box-shadow:none}
.sd-envoyer:not(:disabled):active{transform:scale(.92)}
.sd-envoyer svg{width:22px;height:22px}
.sd-voile{position:absolute;inset:0;z-index:20;background:rgba(10,3,9,.5);opacity:0;pointer-events:none;transition:opacity .3s ease}
.sd-voile.vu{opacity:1;pointer-events:auto}
.sd-feuille,.sd-choix{position:absolute;z-index:21;left:0;right:0;bottom:0;max-height:80%;display:flex;flex-direction:column;border-radius:26px 26px 0 0;background:#24101f;box-shadow:0 -10px 40px rgba(0,0,0,.45);transform:translateY(105%);visibility:hidden;transition:transform .38s cubic-bezier(.2,.9,.25,1),visibility 0s .38s}
.sd-feuille.vu,.sd-choix.vu{transform:none;visibility:visible;transition:transform .38s cubic-bezier(.2,.9,.25,1)}
.sd-poignee{flex:none;display:flex!important;flex-direction:column;align-items:center;gap:8px;padding:9px 16px 10px!important;border-bottom:1px solid rgba(255,255,255,.06)!important}
.sd-poignee::before{content:"";width:38px;height:5px;border-radius:3px;background:#5d3a54}
.sd-poignee h3{margin:0;font:700 15px var(--app);text-align:center}
.sd-corps{overflow-y:auto;overscroll-behavior:contain;padding:12px 16px 22px;display:flex;flex-direction:column;gap:8px;-webkit-overflow-scrolling:touch}
.sd-jour-bloc{display:flex;flex-direction:column;gap:8px}
.sd-jour{align-self:center;font:700 11px var(--app);letter-spacing:.06em;text-transform:uppercase;color:#a98a9f;margin-top:6px}
.sd-msg{max-width:78%;padding:8px 12px;border-radius:16px;font:550 14px/1.35 var(--app);background:var(--creme);color:var(--encre);align-self:flex-start;overflow-wrap:anywhere;display:flex;flex-direction:column;gap:4px}
.sd-msg.moi{align-self:flex-end;background:var(--rosepale)}
.sd-msg small{display:block;font-size:10.5px;color:#8e6f83}
.sd-lien{color:#8a1f5a;font-weight:700;text-decoration:underline;text-underline-offset:2px}
.sd-piece{display:block;max-width:180px;width:100%;height:auto;border-radius:10px}
.sd-vocal{display:flex;align-items:center;gap:7px;flex-wrap:wrap;min-width:180px}
.sd-lire{width:30px;height:30px;border-radius:50%;flex:none;display:grid!important;place-items:center;background:var(--rose)!important;color:#fff!important;font:800 11px var(--app)!important}
.sd-vocal small{font:700 11px var(--app);color:#8a6a7e}
.sd-vocal q{flex-basis:100%;font:italic 500 12px/1.35 var(--app);color:#5b3a50;quotes:"« " " »"}
.sd-evt{align-self:center;display:flex;align-items:center;gap:8px;max-width:92%;padding:6px 10px;border-radius:14px;background:rgba(255,255,255,.06);font:600 12.5px/1.3 var(--app)}
.sd-evt img{width:32px;height:32px;border-radius:8px;object-fit:cover;flex:none}
.sd-evt small{color:var(--doux);font-size:11px}
.sd-vide{margin:24px 0;text-align:center;color:var(--doux)}
.sd-sous{margin:0 0 4px;text-align:center;color:var(--doux);font:600 12.5px/1.35 var(--app)}
.sd-pieces{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.sd-piece-carte{display:flex!important;flex-direction:column;gap:5px;text-align:left;padding:0!important}
.sd-vignette{position:relative;display:block;aspect-ratio:2/3;border-radius:16px;overflow:hidden;background:#140812 center/cover no-repeat;box-shadow:inset 0 0 0 1px rgba(242,190,106,.18)}
.sd-vignette img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.sd-piece-carte.ici .sd-vignette{box-shadow:0 0 0 2.5px var(--or)}
.sd-piece-carte b{font:700 13.5px var(--app)}
.sd-piece-carte small{font:600 11.5px var(--app);color:var(--or);min-height:14px}
`;
