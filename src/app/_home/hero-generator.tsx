"use client";

// Hero interactif de la page d'accueil : « entrez vos infos → je construis votre
// site en 1 minute → testez-le ». Envoie au générateur public (vraies données
// Google via Apify), montre une construction animée pendant l'attente, puis
// redirige vers la maquette (qui lance la Démo Vivante).
import { useEffect, useRef, useState } from "react";
import { vocabulaire } from "@/lib/site-internet/actions-flash";
import { reduirePhoto } from "@/lib/site-internet/reduire-photo";
import { CONSIGNES_PHOTOS, PHOTOS_DU_LIEU, type CleLieu } from "@/lib/site-internet/photos-du-lieu";

const WA_HREF = "https://wa.me/33768233347?text=" +
  encodeURIComponent("Bonjour Marius, je voudrais voir ce que Popey construirait pour mon activité.");

const STEPS = [
  "Je cherche votre établissement sur Google…",
  "Je récupère vos photos et vos avis…",
  "Je choisis vos couleurs et vos textes…",
  "J'installe votre assistante IA…",
  "Je construis votre site…",
  "Presque prêt…",
];

export function HeroGenerator() {
  const [nom, setNom] = useState("");
  const [ville, setVille] = useState("");
  const [activite, setActivite] = useState("");
  const [building, setBuilding] = useState(false);
  const [step, setStep] = useState(0);
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState("");
  const [limited, setLimited] = useState(false);
  /**
   * LA PHOTO DE SA DEVANTURE, FACULTATIVE. « Peut-être que la meilleure
   * solution serait de mettre la photo de son commerce s'il en a une
   * (optionnel). » Elle devient le point de départ de sa photo ClikMe ; sans
   * elle, on part de sa fiche Google, et rien ne bloque.
   */
  const [photo, setPhoto] = useState("");
  const [photoDit, setPhotoDit] = useState("");
  /**
   * SES AUTRES PHOTOS, FACULTATIVES, CHACUNE SOUS SON INTITULÉ — « il faudra
   * que sous chaque photo téléchargée il y ait le bon intitulé ». Envoyées
   * une à une juste après la création de sa page (le jeton que rend
   * `public-generate`), puis modifiables depuis son Espace Pro. Voir
   * `photos-du-lieu.ts`.
   */
  const [autres, setAutres] = useState<Partial<Record<CleLieu, string>>>({});
  const [voirAutres, setVoirAutres] = useState(false);
  const [envoi, setEnvoi] = useState("");
  const timers = useRef<number[]>([]);

  const ready = nom.trim().length >= 2 && ville.trim().length >= 2 && activite.trim().length >= 2;

  useEffect(() => () => timers.current.forEach((t) => clearInterval(t)), []);

  // LA VILLE S'ALLUME AU RYTHME DE LA SAISIE.
  //
  // Ce formulaire ANNONCE ce qu'il contient, il ne pilote rien : la
  // constellation de fond écoute, la ligne d'état écoute, et demain autre chose
  // écoutera. Leur passer des propriétés obligerait à remonter cet état dans la
  // page — qui est rendue par le serveur, ce qui est exactement ce qui la rend
  // rapide sur le seul écran où la vitesse décide.
  //
  // DANS UN EFFET et pas dans les `onChange` : un `dispatchEvent` pendant le
  // rendu est un effet de bord au mauvais moment, et React peut rejouer un
  // rendu. Ici, l'événement suit l'état, une fois qu'il est posé.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("clikme-champs", { detail: { nom, activite, ville } }));
  }, [nom, activite, ville]);

  const startAnim = () => {
    setStep(0);
    setPct(0);
    // Progression douce vers ~94 % en ~55 s (l'appel Apify couvre l'attente).
    const t1 = window.setInterval(() => setPct((v) => (v < 94 ? v + Math.max(0.4, (94 - v) / 28) : v)), 650);
    const t2 = window.setInterval(() => setStep((s) => (s < STEPS.length - 1 ? s + 1 : s)), 6000);
    timers.current.push(t1, t2);
  };
  const stopAnim = () => {
    timers.current.forEach((t) => clearInterval(t));
    timers.current = [];
  };

  // LES MOTS DU MÉTIER QU'IL VIENT DE TAPER. Même fonction que l'espace pro :
  // un aperçu qui demande « une table » à un coiffeur montre le site de
  // quelqu'un d'autre. Calculé pendant le rendu — c'est une fonction pure.
  const v = vocabulaire(activite.trim() || "commerce", "reserve", "flux");

  const submit = async () => {
    if (!ready || building) return;
    setErr("");
    setLimited(false);
    setBuilding(true);
    startAnim();
    try {
      const r = await fetch("/api/site-internet/public-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: nom.trim(),
          city: ville.trim(),
          activite: activite.trim(),
          ...(photo ? { photo } : {}),
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.slug) {
        // SES PHOTOS, UNE À UNE, AVEC LEUR INTITULÉ. Une photo refusée ne
        // bloque rien : il la remettra depuis son Espace Pro.
        const aEnvoyer = [...(photo ? [["devanture", photo] as const] : []), ...Object.entries(autres)].filter(
          (x): x is [string, string] => Boolean(x[1]),
        );
        if (j.jetonPhotos && aEnvoyer.length) {
          let n = 0;
          for (const [cle, valeur] of aEnvoyer) {
            setEnvoi(`J'enregistre vos photos… ${++n}/${aEnvoyer.length}`);
            await fetch("/api/site-internet/photos-lieu", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slug: j.slug, jeton: j.jetonPhotos, action: "poser", cle, photo: valeur }),
            }).catch(() => null);
          }
        }
        stopAnim();
        setPct(100);
        setStep(STEPS.length - 1);
        // Petit temps de complétion avant de basculer vers la maquette.
        window.setTimeout(() => { window.location.href = `/site-internet/apercu/${j.slug}`; }, 900);
        return;
      }
      stopAnim();
      setBuilding(false);
      setLimited(Boolean(j.limited));
      setErr(typeof j.error === "string" ? j.error : "La construction a échoué. Réessayez dans un instant.");
    } catch {
      stopAnim();
      setBuilding(false);
      setErr("Connexion interrompue. Réessayez dans un instant.");
    }
  };

  return (
    <>
      <div className="gen">
        <div className="gen-row">
          <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom de votre établissement" aria-label="Nom de votre établissement" />
        </div>
        <div className="gen-row two">
          <input value={activite} onChange={(e) => setActivite(e.target.value)} placeholder="Votre activité (ex. coiffeur)" aria-label="Votre activité" />
          <input value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Votre ville" aria-label="Votre ville" onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
        </div>
        <label className={`genphoto${photo ? " on" : ""}`}>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setPhotoDit("");
              try {
                setPhoto(await reduirePhoto(f));
              } catch {
                setPhoto("");
                setPhotoDit("Cette photo n'a pas pu être lue. Essayez-en une autre, ou continuez sans.");
              }
            }}
          />
          {photo ? <img src={photo} alt="" /> : <span aria-hidden="true">📷</span>}
          <b>{photo ? "Photo de votre devanture ajoutée" : "Photo de votre devanture"}</b>
          <em>{photo ? "Touchez pour en choisir une autre" : "Facultatif — de face, de jour, en entier. Sinon on prend celle de votre fiche Google"}</em>
        </label>
        {photoDit && <div className="generr">{photoDit}</div>}
        {!voirAutres ? (
          <button type="button" className="genplus" onClick={() => setVoirAutres(true)}>
            ➕ Ajouter d&apos;autres photos <em>(facultatif)</em>
          </button>
        ) : (
          <div className="genlieu">
            <p>
              Elles servent à votre page et à La ville. {CONSIGNES_PHOTOS} Vous pourrez les changer plus tard dans votre Espace Pro.
            </p>
            <div className="genlieu-g">
              {PHOTOS_DU_LIEU.filter((x) => x.cle !== "devanture").map((x) => (
                <label key={x.cle} className={`genlieu-c${autres[x.cle] ? " on" : ""}`} title={x.conseil}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      try {
                        const v = await reduirePhoto(f);
                        setAutres((a) => ({ ...a, [x.cle]: v }));
                      } catch {
                        setPhotoDit(`« ${x.intitule} » n'a pas pu être lue. Essayez-en une autre, ou continuez sans.`);
                      }
                    }}
                  />
                  {autres[x.cle] ? <img src={autres[x.cle]} alt="" /> : <span aria-hidden="true">📷</span>}
                  <b>{x.intitule}</b>
                  <em>{x.conseil}</em>
                </label>
              ))}
            </div>
          </div>
        )}
        <button className="genbtn" onClick={submit} disabled={!ready}>
          ✨ Créer mon site gratuitement
        </button>
        {err && (
          <div className="generr">
            {err}
            {limited && (
              <a className="genwa" href={WA_HREF} target="_blank" rel="noreferrer">💬 Continuer sur WhatsApp</a>
            )}
          </div>
        )}
      </div>

      {building && (
        <div className="genov" role="dialog" aria-label="Construction de votre site">
          <div className="genov-inner">
            {/* Aperçu qui se « dessine » : les sections du site apparaissent une à une. */}
            <div className="bp-phone">
              <div className="bp-bar"><span /><span /><span /><em>{(nom.trim() || "votre-site").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 22)}.popey.fr</em></div>
              <div className="bp-screen">
                <div className={`bp-hero${step >= 1 ? " lit" : ""}`}>
                  <div className="bp-sh" />
                  <div className="bp-htxt">
                    <div className={`bp-name${step >= 1 ? " on" : ""}`}>{nom.trim() || "Votre établissement"}</div>
                    <div className={`bp-role${step >= 2 ? " on" : ""}`}>{[activite.trim(), ville.trim()].filter(Boolean).join(" · ") || "Votre activité"}</div>
                    <div className={`bp-stars${step >= 2 ? " on" : ""}`}>★★★★★ <span>avis Google</span></div>
                  </div>
                </div>
                <div className="bp-body">
                  <div className={`bp-thumbs${step >= 3 ? " on" : ""}`}><i /><i /><i /></div>
                  {/* LE BANDEAU D'ACTUALITÉ — la zone qui n'existe sur aucun
                      autre site, et donc la première à montrer. Il reste VIDE :
                      écrire une annonce à la place du commerçant, sur un site
                      qui porte son nom, serait parler pour lui avant même
                      qu'il ait cliqué. Il montre l'emplacement, pas le texte. */}
                  <div className={`bp-annonce${step >= 4 ? " on" : ""}`}>
                    <span className="bp-a-k">✦ Aujourd&apos;hui</span>
                    <span className="bp-a-t">votre actualité s&apos;affiche ici</span>
                  </div>
                  {/* CE QU'ELLE FAIT VRAIMENT. Elle répondait « Oui ! Je vous
                      réserve ça ? » : elle ne connaît ni le cahier de
                      réservations ni les disponibilités, et ne réserve rien.
                      Elle recueille et transmet — c'est ce que dit le reste du
                      produit, et l'aperçu le contredisait sur le premier écran
                      que voit un prospect. */}
                  <div className={`bp-chat${step >= 4 ? " on" : ""}`}>
                    <div className="bp-bub them">Bonsoir, il vous reste {v.un}&nbsp;{v.place} samedi&nbsp;?</div>
                    <div className="bp-bub me">Bonsoir 😊 Je note votre demande et je la transmets tout de suite.</div>
                  </div>
                  {/* LE DIRECT — la promesse du titre de la page, tenue dans
                      l'aperçu. Sans lui, on montrait un site vitrine avec un
                      robot de réservation : le produit d'il y a un an. */}
                  <div className={`bp-direct${step >= 5 ? " on" : ""}`}>
                    <span className="bp-d-k">📍 Le Direct de {ville.trim() || "votre ville"}</span>
                    <span className="bp-d-t">Votre actualité y paraît aussi, à côté des autres commerces.</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="genov-status">
              <div className="genov-title">Je construis le site de <b>{nom.trim() || "votre établissement"}</b>…</div>
              <div className="genov-step"><span className="genov-dot" />{envoi || STEPS[step]}</div>
              <div className="genov-bar"><i style={{ width: `${Math.min(100, Math.round(pct))}%` }} /></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
