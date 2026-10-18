"use client";

// Voir `page.tsx`. La page d'un membre de l'équipe : les mêmes pièces que le
// comptoir (`echanges-comptoir.tsx`, `echanges-reels.tsx`,
// `echanges-ville.tsx`), réduites à ce qui est à lui.
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { FamilleDouble } from "@/lib/direct/double-metiers";
import { CLE_ACCES_COMPTOIR, JOURS_VALIDITE, PAR_PERSONNE, chezNom, deNom, type BonReel, type EtatEchanges, type ModePaiement } from "@/lib/echanges/echanges";
import { ChoixDuPaiement, Feuille, PastilleCredit, Pile, StylesEchanges, visageDe, type Offre } from "@/app/autour-de-moi/assistante/echanges-comptoir";
import { BonVue, StylesReels } from "@/app/autour-de-moi/assistante/echanges-reels";
import { StylesVille, VilleFermee, messageInvitation } from "@/app/autour-de-moi/assistante/echanges-ville";
import { BoutonSon, FeteDuMatch, StylesMagie, ecouterLePremierGeste, jouer, vibrer } from "@/app/autour-de-moi/assistante/echanges-magie";

type Commerce = { nom: string; slug: string; famille: FamilleDouble; metier: string; branche: string; photo: string };
type Reponse = { etat?: EtatEchanges; ok?: boolean; message?: string; code?: string; error?: string };
type Panneau = "solde" | "bons" | "valider" | "comment";

const ROUTE = "/api/site-internet/pro/echanges";

/* GARDER SON ACCÈS SOUS LA MAIN : l'astuce « ajoute cette page à ton écran
   d'accueil », pour un téléphone, et pas une fois l'accès déjà posé sur
   l'écran d'accueil (il s'ouvre alors seul, en plein écran). L'icône rouvre
   bien SON accès : la page a son propre manifeste (`manifest.webmanifest`). */
type Appareil = "ios" | "android";
function lireAppareil(): Appareil | null {
  try {
    const n = window.navigator as Navigator & { standalone?: boolean };
    if (n.standalone || window.matchMedia("(display-mode: standalone)").matches) return null;
    const ua = n.userAgent;
    if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && n.maxTouchPoints > 1)) return "ios";
    if (/Android/i.test(ua)) return "android";
  } catch {
    /* rien : pas d'astuce */
  }
  return null;
}

async function appeler(jeton: string, action: string, extra: Record<string, unknown> = {}): Promise<Reponse> {
  try {
    const r = await fetch(ROUTE, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ membre: jeton, action, ...extra }) });
    const j = (await r.json().catch(() => ({}))) as Reponse;
    if (!r.ok) return { error: j.error || "Le réseau ne répond pas. Réessaie dans un instant." };
    return j;
  } catch {
    return { error: "Le réseau ne répond pas. Réessaie dans un instant." };
  }
}

export function EspaceMembre({ jeton, prenom, commerce }: { jeton: string; prenom: string; commerce: Commerce }) {
  const [etat, setEtat] = useState<EtatEchanges | null>(null);
  const [erreur, setErreur] = useState("");
  const [bienvenue, setBienvenue] = useState(false);
  const [astuce, setAstuce] = useState<Appareil | null>(null);
  const cleAstuce = `clikme-membre-ecran-accueil-${jeton.slice(0, 10)}`;
  const visage = commerce.photo || visageDe(commerce.branche, commerce.metier);

  const charger = useCallback(async () => {
    const r = await appeler(jeton, "etat");
    if (r.etat) {
      setEtat(r.etat);
      setErreur("");
    } else setErreur(r.error || "Lecture impossible pour l'instant.");
  }, [jeton]);

  useEffect(() => {
    let fini = false;
    // CE TÉLÉPHONE EST CELUI D'UN MEMBRE : la page d'un bon scanné (`/bon/<code>`) peut le valider.
    try {
      window.localStorage.setItem(CLE_ACCES_COMPTOIR, JSON.stringify({ membre: jeton, slug: commerce.slug, nom: commerce.nom }));
    } catch {
      /* stockage interdit : il tapera le code ici */
    }
    // LE MOT DE BIENVENUE, LA PREMIÈRE FOIS SUR CE TÉLÉPHONE.
    const cle = `clikme-membre-bienvenue-${jeton.slice(0, 10)}`;
    let premiere = false;
    try {
      premiere = !window.localStorage.getItem(cle);
      window.localStorage.setItem(cle, "1");
    } catch {
      premiere = false;
    }
    // L'ASTUCE DE L'ÉCRAN D'ACCUEIL, jusqu'à ce qu'il touche « Compris ».
    let astuceVue = true;
    try {
      astuceVue = Boolean(window.localStorage.getItem(`clikme-membre-ecran-accueil-${jeton.slice(0, 10)}`));
    } catch {
      astuceVue = true;
    }
    const appareil = astuceVue ? null : lireAppareil();
    appeler(jeton, "etat").then((r) => {
      if (fini) return;
      if (r.etat) {
        setEtat(r.etat);
        if (premiere) setBienvenue(true);
        if (appareil) setAstuce(appareil);
      } else setErreur(r.error || "Lecture impossible pour l'instant.");
    });
    const auRetour = () => {
      if (document.visibilityState === "visible") void charger();
    };
    document.addEventListener("visibilitychange", auRetour);
    return () => {
      fini = true;
      document.removeEventListener("visibilitychange", auRetour);
    };
  }, [jeton, commerce.slug, commerce.nom, charger]);

  return (
    <main className="cz em">
      <StylesMembre />
      <StylesEchanges />
      <StylesMagie />
      <StylesVille />
      <StylesReels />
      <div className="ec">
        {!(etat?.pret) && <TeteMembre visage={visage} prenom={prenom} nom={commerce.nom} />}
        {!etat ? (
          <div className="ec-fin-pile">
            {erreur ? (
              <>
                <p>{erreur}</p>
                <button type="button" className="cz-lien" onClick={() => void charger()}>
                  Réessayer
                </button>
              </>
            ) : (
              <p>Un instant…</p>
            )}
          </div>
        ) : !etat.pret ? (
          <div className="ec-fin-pile">
            <p>
              <b>L’échange entre commerçants ouvre bientôt.</b>
            </p>
          </div>
        ) : (
          <PageMembre jeton={jeton} prenom={prenom} visage={visage} commerce={commerce} etat={etat} setEtat={setEtat} />
        )}
      </div>
      {bienvenue && etat && (
        <Feuille titre={`Bienvenue ${prenom} 👋`} onFermer={() => setBienvenue(false)}>
          <p className="ec-gris">
            Tu fais partie de l’équipe {deNom(commerce.nom)}. Tu as <b>{PAR_PERSONNE} € par mois</b>, rien qu’à toi, à dépenser chez les commerçants ClikMe{etat.maVille.nom ? ` de ${etat.maVille.nom}` : ""}.
          </p>
          <p className="ec-gris">Ce que tu prends, {commerce.nom} le rend en ses produits : jamais en euros, et jamais par toi.</p>
          <p className="ec-regle">🔒 Garde ce lien : c’est ton accès personnel. Ne le partage pas.</p>
          <button type="button" className="cz-go grand" onClick={() => setBienvenue(false)}>
            C’est parti
          </button>
        </Feuille>
      )}
      {astuce && !bienvenue && etat && (
        <Feuille
          titre="Garde ton accès sous la main 📲"
          onFermer={() => setAstuce(null)}
        >
          <p className="ec-gris">
            Ajoute cette page à ton écran d’accueil : elle s’ouvrira d’un geste, comme une application, sans rechercher le message avec ton lien.
          </p>
          <ol className="ec-regles">
            {astuce === "ios" ? (
              <>
                <li>Ouverte depuis WhatsApp ? Ouvre-la d’abord dans Safari.</li>
                <li>
                  Touche <b>Partager</b> (le carré avec la flèche vers le haut).
                </li>
                <li>
                  Choisis <b>« Sur l’écran d’accueil »</b>, puis « Ajouter ».
                </li>
              </>
            ) : (
              <>
                <li>Ouverte depuis WhatsApp ? Ouvre-la d’abord dans Chrome.</li>
                <li>
                  Touche le menu <b>⋮</b>, en haut à droite.
                </li>
                <li>
                  Choisis <b>« Ajouter à l’écran d’accueil »</b> (ou « Installer l’application »).
                </li>
              </>
            )}
          </ol>
          <p className="ec-petit">Sinon, garde le message WhatsApp avec ton lien : il t’ouvre toujours la même page.</p>
          <button
            type="button"
            className="cz-go grand"
            onClick={() => {
              try {
                window.localStorage.setItem(cleAstuce, "1");
              } catch {
                /* tant pis : elle reviendra à la prochaine visite */
              }
              setAstuce(null);
            }}
          >
            Compris
          </button>
        </Feuille>
      )}
    </main>
  );
}

/** Son prénom, son équipe — et, une fois la page là, son crédit du mois (le son est dans « Comment ça marche »). */
function TeteMembre({ visage, prenom, nom, children }: { visage: string; prenom: string; nom: string; children?: ReactNode }) {
  // Le bouton du son réveillait le son au premier geste ; l'en-tête le fait désormais.
  useEffect(() => ecouterLePremierGeste(), []);
  return (
    <header className="em-tete">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={visage} alt="" />
      <span>
        <b>{prenom}</b>
        <em>Équipe {deNom(nom)}</em>
      </span>
      {children}
    </header>
  );
}

function PageMembre({
  jeton,
  prenom,
  visage,
  commerce,
  etat,
  setEtat,
}: {
  jeton: string;
  prenom: string;
  visage: string;
  commerce: Commerce;
  etat: EtatEchanges;
  setEtat: (e: EtatEchanges) => void;
}) {
  const { maVille, moi, compte } = etat;
  const [vus, setVus] = useState<string[]>([]);
  const [choisie, setChoisie] = useState<Offre | null>(null);
  const [fete, setFete] = useState<{ bon: BonReel; offre: Offre } | null>(null);
  const [recu, setRecu] = useState<BonReel | null>(null);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [panneau, setPanneau] = useState<Panneau | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [code, setCode] = useState("");
  const [annonce, setAnnonce] = useState<{ texte: string; mauvais?: boolean } | null>(null);

  useEffect(() => {
    if (!annonce) return;
    const t = window.setTimeout(() => setAnnonce(null), 6500);
    return () => window.clearTimeout(t);
  }, [annonce]);

  /* Ses 50 € du mois : ce qu'il a pris ce mois-ci avec des crédits, lu sur ses bons (à moitié prix, il paie en euros). */
  const debutMois = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  }, []);
  const prisCeMois = etat.pris
    .filter((b) => b.mode !== "moitie" && (b.statut === "reserve" || b.statut === "utilise") && Date.parse(b.cree) >= debutMois)
    .reduce((s, b) => s + b.prix, 0);
  const persoReste = Math.max(0, PAR_PERSONNE - prisCeMois);

  const offres: Array<Offre & { villeSlug: string }> = useMemo(
    () =>
      etat.offres
        .filter((o) => o.villeOuverte)
        .map((o) => ({
          id: o.id,
          fournisseur: o.fournisseur,
          offre: o.offre,
          paiement: o.paiement,
          commerce: o.commerce,
          prenom: "",
          metier: o.metier || "Commerce",
          visage: visageDe(o.branche, o.metier),
          ville: o.ville,
          villeSlug: o.villeSlug,
          titre: o.titre,
          prix: o.prix,
          photo: o.photo,
          ou: o.aPied || o.ville,
          parMois: o.parMois,
          restant: o.restant,
          sansMoitie: o.sansMoitie,
        })),
    [etat.offres],
  );
  /* UNE PILE : sa ville d'abord, puis les autres villes ouvertes (le choix de la ville a été retiré). */
  const pile = offres
    .filter((o) => !vus.includes(o.id) && (o.restant ?? 1) > 0)
    .sort((a, b) => Number(a.villeSlug !== maVille.slug) - Number(b.villeSlug !== maVille.slug));

  const agir = async (action: string, extra: Record<string, unknown> = {}) => {
    setEnvoi(true);
    const r = await appeler(jeton, action, extra);
    setEnvoi(false);
    if (r.etat) setEtat(r.etat);
    if (r.error) setAnnonce({ texte: r.error, mauvais: true });
    else if (r.message) setAnnonce({ texte: r.message, mauvais: r.ok === false });
    return r;
  };

  const prendre = async (o: Offre, mode: ModePaiement) => {
    const r = await agir("prendre", { fournisseur: o.fournisseur ?? o.id, offre: o.offre ?? null, mode });
    setChoisie(null);
    const bon = r.ok && r.code ? r.etat?.pris.find((b) => b.code === r.code) : undefined;
    if (bon) setFete({ bon, offre: o });
  };

  return (
    <section className="ec-page">
      <TeteMembre visage={visage} prenom={prenom} nom={commerce.nom}>
        <PastilleCredit montant={moi.reste} onOuvrir={() => setPanneau("solde")} />
      </TeteMembre>

      {!etat.mien ? (
        <div className="ec-fin-pile">
          <p>
            <b>{commerce.nom} n’a pas encore publié son offre.</b> Dès que c’est fait, tu pourras prendre chez les autres commerçants.
          </p>
        </div>
      ) : !maVille.ouverte ? (
        <VilleFermee
          nom={maVille.nom}
          offres={maVille.offres}
          seuil={maVille.seuil}
          visages={maVille.deja.map((d) => d.photo || visageDe(d.branche, d.metier))}
          onInviter={() =>
            window.open(`https://wa.me/?text=${encodeURIComponent(messageInvitation(maVille.nom, Math.max(1, maVille.seuil - maVille.offres), window.location.origin))}`, "_blank", "noopener,noreferrer")
          }
        />
      ) : (
        <>
          {pile.length > 0 ? (
            <Pile key={pile[0].id} offres={pile} indice={vus.length === 0} onPasser={(o) => setVus((v) => [...v, o.id])} onPrendre={(o) => (setVus((v) => [...v, o.id]), setChoisie(o))} />
          ) : (
            <div className="ec-fin-pile">
              <p>{offres.length === 0 ? "Pas encore d’offre dans ta ville." : "Tu as vu toutes les offres."}</p>
              {offres.some((o) => (o.restant ?? 1) > 0) && (
                <button type="button" className="cz-lien" onClick={() => setVus([])}>
                  Les revoir
                </button>
              )}
            </div>
          )}
        </>
      )}

      <nav className="ec-tiroirs" aria-label="Plus d’informations">
        <button type="button" onClick={() => setPanneau("bons")}>
          Mes bons{etat.pris.length > 0 ? ` · ${etat.pris.length}` : ""}
        </button>
        <button type="button" onClick={() => setPanneau("valider")}>
          Valider un bon
        </button>
        <button type="button" onClick={() => setPanneau("comment")}>
          Comment ça marche
        </button>
      </nav>

      {annonce && (
        <button type="button" className={`ec-toast${annonce.mauvais ? " mauvais" : ""}`} role="status" onClick={() => setAnnonce(null)}>
          {annonce.texte}
        </button>
      )}

      {panneau === "solde" && (
        <Feuille titre="Mes 50 € du mois" onFermer={() => setPanneau(null)}>
          <div className="ec-lignes">
            <p>
              <span>Chaque mois, rien qu’à toi</span>
              <b>{PAR_PERSONNE} €</b>
            </p>
            <p>
              <span>Pris ce mois-ci</span>
              <b>− {prisCeMois} €</b>
            </p>
            <p className="total">
              <span>Il te reste</span>
              <b>{moi.reste} €</b>
            </p>
          </div>
          {moi.reste < persoReste ? (
            <p className="ec-regle">
              Le compte de {commerce.nom} est au plus bas : la boutique doit d’abord servir des commerçants ({compte.du} € à rendre en ses produits).
            </p>
          ) : (
            <p className="ec-gris">Tes {PAR_PERSONNE} € reviennent le 1er de chaque mois. Ils ne s’accumulent pas.</p>
          )}
          <p className="ec-petit">Ce que tu prends, {commerce.nom} le rend en ses produits : jamais en euros, et jamais par toi.</p>
        </Feuille>
      )}

      {panneau === "comment" && (
        <Feuille titre="Comment ça marche" onFermer={() => setPanneau(null)}>
          <ol className="ec-regles">
            <li>
              Tu as <b>{PAR_PERSONNE} € par mois, rien qu’à toi</b>, chez les commerçants ClikMe, offerts par {commerce.nom}.
            </li>
            <li>Glisse une offre à droite : « Je prends ». Tu reçois un bon (un QR) à montrer chez le commerçant.</li>
            <li>
              Avec tes crédits (0 €), ou <b>à moitié prix</b> quand l’offre le propose : tu règles la moitié en euros, sur place, et tes {PAR_PERSONNE} € ne bougent pas.
            </li>
            <li>Chaque commerçant dit, pour chacune de ses offres (jusqu’à 3), comment on la lui paie : la carte l’indique (« en échange seulement », « à −50 % seulement »).</li>
            <li>
              Ce que tu prends, {commerce.nom} le rend <b>en ses produits</b> : jamais en euros, et jamais par toi.
            </li>
            <li>Au comptoir, quand un commerçant vient avec un bon, valide-le : ta boutique gagne son prix. S’il a pris à moitié prix, encaisse la moitié en euros, et c’est tout.</li>
            <li>Un bon pas utilisé expire au bout de {JOURS_VALIDITE} jours.</li>
            <li>Ce lien est ton accès personnel : ne le partage pas.</li>
            <li>
              Pour le retrouver d’un geste, ajoute cette page à ton écran d’accueil — iPhone : Safari › Partager › « Sur l’écran d’accueil » ; Android : menu ⋮ › « Ajouter à l’écran d’accueil ».
            </li>
          </ol>
          <p className="ec-sons">
            <span>Les sons de l’échange</span>
            <BoutonSon />
          </p>
        </Feuille>
      )}

      {panneau === "bons" && (
        <Feuille titre="Mes bons" onFermer={() => setPanneau(null)}>
          {etat.pris.length === 0 && <p className="ec-gris">Tu n’as encore rien pris. Glisse une carte vers la droite pour prendre une offre.</p>}
          {etat.pris.map((b) => (
            <BonVue
              key={b.id}
              b={b}
              ouvert={ouvert === b.id}
              onOuvrir={() => setOuvert((x) => (x === b.id ? null : b.id))}
              onAnnuler={envoi ? undefined : () => void agir("annuler", { bon: b.id })}
            />
          ))}
        </Feuille>
      )}

      {panneau === "valider" && (
        <Feuille titre="Valider un bon" onFermer={() => setPanneau(null)}>
          <p className="ec-gris">
            Un commerçant vient chez {commerce.nom} avec un bon : scanne son QR avec l’appareil photo de ton téléphone, ou tape son code.
          </p>
          <form
            className="ec-code"
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await agir("valider", { code });
              if (r.ok) {
                setCode("");
                setPanneau(null);
                jouer("piece");
                vibrer([20, 40, 20]);
              }
            }}
          >
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CLK-XXXXXX"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              aria-label="Code du bon"
            />
            <button type="submit" className="cz-go" disabled={envoi || code.replace(/[^A-Z0-9]/gi, "").length < 6}>
              Valider
            </button>
          </form>
        </Feuille>
      )}

      {choisie && (
        <div className="ec-feuille" role="dialog" aria-label="Je prends">
          <div className="ec-feuille-c">
            {choisie.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={choisie.photo} alt="" />
            )}
            <h2>{choisie.titre}</h2>
            <p className="ec-gris">
              {chezNom(choisie.commerce).replace(/^chez/, "Chez")}
              {choisie.ou ? ` · ${choisie.ou}` : ""}
            </p>
            <ChoixDuPaiement
              prix={choisie.prix}
              reste={moi.reste}
              manque={
                persoReste < choisie.prix
                  ? `Il te reste ${persoReste} € de tes ${PAR_PERSONNE} € ce mois-ci (ils reviennent le 1er)`
                  : `Le compte de ${commerce.nom} est au plus bas : la boutique doit d’abord servir`
              }
              sansMoitie={choisie.sansMoitie}
              paiement={choisie.paiement}
              occupe={envoi}
              onPayer={(mode) => void prendre(choisie, mode)}
            />
            <button type="button" className="cz-lien" onClick={() => setChoisie(null)}>
              Pas maintenant
            </button>
          </div>
        </div>
      )}

      {fete && (
        <FeteDuMatch
          moi={commerce.photo || visageDe(commerce.branche, commerce.metier)}
          eux={fete.offre.photo || fete.offre.visage}
          titre={fete.offre.titre}
          commerce={fete.offre.commerce}
          prix={fete.offre.prix}
          aRegler={fete.bon.mode === "moitie" ? fete.bon.aRegler : undefined}
          onQr={() => {
            setRecu(fete.bon);
            setFete(null);
          }}
          onFermer={() => setFete(null)}
        />
      )}

      {recu && (
        <div className="ec-feuille" role="dialog" aria-label="Ton bon">
          <div className="ec-feuille-c">
            <h2 className="ec-bravo">Ton bon, {prenom}</h2>
            <BonVue b={recu} ouvert onOuvrir={() => undefined} />
            <p className="ec-gris ec-centre">Tu le retrouves dans « Mes bons ».</p>
            <button
              type="button"
              className="cz-go"
              onClick={() => setRecu(null)}
            >
              C’est noté
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/** L'habillage du comptoir, réduit à ce dont la page d'un membre a besoin. */
function StylesMembre() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.cz{--fond:#120C09;--nappe:#1C1411;--nappe2:#261B16;--creme:#FFF4E6;--gris:#CDB8A4;
  --ambre:#F5A23A;--rose:#FF2E9A;--trait:rgba(255,196,140,.14);
  position:fixed;inset:0;overflow:hidden;background:var(--fond);color:var(--creme);
  font-family:var(--font-geist-sans),system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
body{background:#0B0806;}
.cz :where(button,input,label){font:inherit;color:inherit;}
.cz button{cursor:pointer;-webkit-tap-highlight-color:transparent;}
.em{display:flex;flex-direction:column;}
.em .ec{width:100%;max-width:560px;margin:0 auto;padding-top:max(14px,env(safe-area-inset-top,0px));}
.em-tete{display:flex;align-items:center;gap:12px;}
.em-tete > img{width:48px;height:48px;border-radius:50%;object-fit:cover;background:var(--nappe2);border:2px solid rgba(245,162,58,.6);}
.em-tete > span{flex:1;min-width:0;display:flex;flex-direction:column;}
.em-tete > span b{font-family:var(--font-clikme),sans-serif;font-size:19px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.em-tete .ec-solde{flex-shrink:0;}
.em-tete > span em{font-style:normal;font-size:13px;color:var(--gris);}
.cz-go{position:relative;display:flex;align-items:center;justify-content:center;gap:10px;width:100%;
  min-height:56px;padding:0 22px;border:0;border-radius:999px;background:var(--rose);color:#fff;
  font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:18px;letter-spacing:-.02em;
  box-shadow:0 10px 28px rgba(255,46,154,.38);transition:transform .12s;}
.cz-go:active{transform:scale(.97);}
.cz-go:disabled{opacity:.45;}
.cz-go.grand{min-height:62px;font-size:20px;}
.cz-lien{align-self:center;background:none;border:0;padding:6px 10px;font-size:14.5px;font-weight:600;
  color:var(--gris);text-decoration:underline;text-underline-offset:3px;}
`,
      }}
    />
  );
}
