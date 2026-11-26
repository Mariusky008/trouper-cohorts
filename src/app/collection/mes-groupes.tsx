"use client";

/**
 * 👥 MES GROUPES (le lot G1, 26 novembre 2026 ; `docs/univers/mes-groupes.md`) : l'onglet qui a pris la place
 * d'« Autour » dans le menu (Autour est devenu une tuile 📍 de Ma maison, son écran ne change pas).
 *
 * Découvrir, c'est rencontrer par hasard, tout de suite ; Mes groupes, c'est RETROUVER, à une heure. La maquette validée
 * par le propriétaire le 26 novembre 2026 a quatre rangées : « Mes groupes actifs », « Propositions de groupes »,
 * « Avec mes proches », « Tous mes groupes ». Le lot G1 n'ouvre que celle qui existe déjà, « Avec mes proches » — ce qui
 * était dans Découvrir, déplacé, sans rien de neuf :
 *   · 📺 ma télé du jour, ma séance à quatre places (on y invite ses proches) ;
 *   · 🎬 les invitations devant la télé d'un proche (« Venir », « Pas maintenant ») — elles ont quitté le haut du fil ;
 *   · 🛋️ les séances en cours chez mes proches (« M'asseoir avec eux » si je suis invité, sinon « Demander à les
 *     rejoindre ») ;
 *   · 👯 les demandes de proche reçues dans un salon (« Accepter », « Non merci »).
 * « ＋ Proposer », en haut : pour l'instant, il ouvre ma séance (proposer un groupe arrive avec le lot G2). Les autres
 * rangées arrivent avec leurs lots : jamais une rangée vide, jamais un chiffre inventé.
 */
import { useCallback, useContext, useEffect, useState } from "react";
import { OngletVisible } from "./guide";
import { MEMOIRE_GROUPES, MEMOIRE_TELE, ecrireMemoire, lireMemoire } from "./memoire-locale";
import { vignetteYouTube } from "@/lib/direct/tele";
import { THEMES_DECOUVRIR } from "@/lib/direct/decouvrir";
import { PHRASES_SALONS as PS, PLACES_SEANCE, type DemandeProche, type InvitationTele } from "@/lib/direct/salons-ouverts";
import { PHRASES_FIL as PF, titreDeSeance, type SeanceFil } from "@/lib/direct/fil-decouvrir";
import type { TeleDuJour } from "@/lib/direct/tele-du-jour";
import { OUVERT_AVANT_MS, PHRASES_GROUPES_GARDES as PG, PHRASES_PROPOSITIONS as PP, PHRASES_VIE_DU_GROUPE as PV, aParis, heureLisible, quandLisible, type GroupeVue, type PropositionGroupe } from "@/lib/direct/groupes";
import { ProposerGroupe } from "./proposer-groupe";
import { ApercuVideo, useSuspendreApercus } from "./apercu-video";
import { CreerGroupe, EspaceGroupe, Figurine, STYLES_FIGURINES_GROUPE, salonDuGroupe } from "./groupe-espace";

const ROUTE = "/api/direct/mes-groupes";
const SALONS = "/api/direct/salons-ouverts";
const SEANCE = "/univers/salons?chez=moi";
/** (ce qui est en direct ne le reste pas : la mémoire ne vaut que dix minutes) */
const MEMOIRE_MS = 10 * 60_000;
const chez = (cle: string) => `/univers/salons?chez=${encodeURIComponent(cle)}`;

export type MesGroupesVue = { invitations: InvitationTele[]; demandes: DemandeProche[]; seances: SeanceFil[]; propositions?: PropositionGroupe[]; groupes?: GroupeVue[]; adulte?: boolean };
/** Ce qui attend un geste de moi (la pastille de l'onglet) : les invitations, les demandes de proche, les groupes où un proche m'invite. */
export const enAttenteDe = (v: MesGroupesVue | null) => (v ? v.invitations.length + v.demandes.length + (v.groupes ?? []).filter((g) => g.invite).length : 0);

export const PHRASES_GROUPES = {
  titre: "Mes groupes",
  proposer: "Proposer",
  avecMesProches: "Avec mes proches",
  maTele: "Ma télé du jour",
  ouvrirSeance: "▶ Ouvrir ma séance",
  enDirect: "● en direct",
  placeLibre: "Place libre",
  toi: "Toi",
  vide: "Invite tes proches devant ta télé : leurs invitations et leurs séances arrivent ici.",
  reseau: "Pas de réseau : réessaie dans un instant.",
} as const;
const P = PHRASES_GROUPES;

export function MesGroupes({ onAttente }: { onAttente?: (n: number) => void }) {
  const visible = useContext(OngletVisible);
  const [v, setV] = useState<MesGroupesVue | null>(null);
  const [tele, setTele] = useState<TeleDuJour | null>(null);
  const [note, setNote] = useState("");
  const [erreur, setErreur] = useState("");
  const [proposer, setProposer] = useState(false);
  const [autre, setAutre] = useState<PropositionGroupe | null>(null);
  // (💛 lot G4 : l'espace d'un groupe ouvert ; « Un groupe avec mes proches »)
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [creer, setCreer] = useState(false);

  const charger = useCallback(async () => {
    const r = await fetch(ROUTE, { cache: "no-store" }).catch(() => null);
    const j = (r?.ok ? await r.json().catch(() => null) : null) as Partial<MesGroupesVue> | null;
    if (!j) return setErreur(P.reseau);
    const n: MesGroupesVue = { invitations: j.invitations ?? [], demandes: j.demandes ?? [], seances: j.seances ?? [], propositions: j.propositions ?? [], groupes: j.groupes ?? [], ...(j.adulte ? { adulte: true } : {}) };
    setErreur("");
    setV(n);
    ecrireMemoire(MEMOIRE_GROUPES, n);
    onAttente?.(enAttenteDe(n));
  }, [onAttente]);

  useEffect(() => {
    // (⚡ la dernière fois, tout de suite ; le serveur la remplace dès qu'il répond)
    const deja = lireMemoire<MesGroupesVue>(MEMOIRE_GROUPES, MEMOIRE_MS);
    const t = lireMemoire<TeleDuJour>(MEMOIRE_TELE);
    void Promise.resolve().then(() => {
      if (deja) setV((x) => x ?? deja);
      if (t) setTele((x) => x ?? t);
    });
    fetch("/api/direct/tele-du-jour", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { tele?: TeleDuJour } | null) => {
        if (!j?.tele) return;
        setTele(j.tele);
        ecrireMemoire(MEMOIRE_TELE, j.tele);
      })
      .catch(() => undefined);
  }, []);
  // (chaque fois qu'il revient sur l'onglet : ce qui est en direct a pu changer)
  useEffect(() => {
    if (visible) void Promise.resolve().then(charger);
  }, [visible, charger]);

  const poster = (corps: Record<string, unknown>) =>
    fetch(SALONS, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) })
      .then(async (r) => ({ ok: r.ok, j: ((await r.json().catch(() => ({}))) ?? {}) as { error?: string; invite?: boolean } }))
      .catch(() => ({ ok: false, j: { error: P.reseau } as { error?: string; invite?: boolean } }));

  async function rejoindre(s: SeanceFil) {
    const r = await poster({ action: "rejoindre", chez: s.cle });
    if (!r.ok) return setNote(r.j.error || "Ça n’a pas marché. Réessaie.");
    if (r.j.invite) return void window.location.assign(chez(s.cle));
    setV((x) => (x ? { ...x, seances: x.seances.map((y) => (y.cle === s.cle ? { ...y, demande: true } : y)) } : x));
  }

  /** 📣 un geste sur une proposition : la carte se met à jour avec la réponse du serveur */
  async function surProposition(corps: Record<string, unknown>): Promise<boolean> {
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) }).catch(() => null);
    const j = ((await r?.json().catch(() => null)) ?? {}) as { proposition?: PropositionGroupe; groupe?: GroupeVue; aller?: string; error?: string };
    if (!r?.ok) {
      setNote(j.error || P.reseau);
      return false;
    }
    if (j.aller) return void window.location.assign(j.aller), true;
    const id = corps.id;
    setV((x) => {
      if (!x) return x;
      const l = x.propositions ?? [];
      // (💛 le groupe est né : il rejoint Tous mes groupes)
      const groupes = j.groupe ? [...(x.groupes ?? []).filter((g) => g.id !== j.groupe!.id), j.groupe] : x.groupes;
      return { ...x, groupes, propositions: corps.action === "retirer" || corps.action === "signaler" ? l.filter((p) => p.id !== id) : l.map((p) => (p.id === id && j.proposition ? j.proposition : p)) };
    });
    if (corps.action === "garder") setNote(j.groupe ? PG.ne(j.groupe.nom) : PG.tuGardes);
    return true;
  }

  /** 💛 Un proche m'invite dans son groupe : je le garde, ou « Non merci ». */
  async function repondreGroupe(g: GroupeVue, non: boolean) {
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: non ? "non-merci" : "garder-groupe", groupe: g.id }) }).catch(() => null);
    const j = ((await r?.json().catch(() => null)) ?? {}) as { groupe?: GroupeVue; error?: string };
    if (!r?.ok) return setNote(j.error || P.reseau);
    setV((x) => (x ? { ...x, groupes: (x.groupes ?? []).flatMap((y) => (y.id !== g.id ? [y] : j.groupe ? [j.groupe] : [])) } : x));
    if (!non) setNote(PG.ne(g.nom));
  }

  // (une invitation et la séance du même proche : une seule carte, celle de la séance, où l'on est invité)
  const seances = v?.seances ?? [];
  const invitations = (v?.invitations ?? []).filter((i) => !seances.some((s) => s.cle === i.cle));
  const demandes = v?.demandes ?? [];
  const propositions = v?.propositions ?? [];
  const groupes = v?.groupes ?? [];
  const actifs = groupes.filter((g) => !g.invite && g.ici.length > 0);
  const espace = groupes.find((g) => g.id === ouvert && !g.invite) ?? null;
  const premiere = tele?.videos[0];
  const moi = tele?.figurine?.src;

  return (
    <section className="mg" data-mes-groupes>
      <div className="mg-tete">
        <h1>{P.titre}</h1>
        <button type="button" className="mg-proposer" onClick={() => setProposer(true)} data-proposer>
          <b aria-hidden="true">＋</b>
          {P.proposer}
        </button>
      </div>

      {/* 🟢 MES GROUPES ACTIFS (lot G4) : seulement ceux où quelqu'un est dans le salon — cachée sinon */}
      {actifs.length > 0 && (
        <>
          <h2 className="mg-rubrique">{PG.actifs}</h2>
          <div className="mg-rang" data-groupes-actifs>
            {actifs.map((g) => (
              <div key={g.id} className="mg-carte" data-groupe-actif={g.id}>
                <button type="button" className="mg-pochette mg-emoji" onClick={() => setOuvert(g.id)} aria-label={g.nom}>
                  {g.e}
                </button>
                <strong className="mg-t">{g.nom}</strong>
                <span className="mg-m mg-vert">{PG.enLigne(g.ici.length)}</span>
                <span className="mg-pile">
                  {g.ici.slice(0, 5).map((p) => (
                    <span key={p.q} className="mg-tete-ronde">
                      <Figurine p={p} tete />
                    </span>
                  ))}
                </span>
                <a className="mg-bouton rose" href={salonDuGroupe(g.id)} data-entrer-groupe>
                  {PG.entrer}
                </a>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 📣 PROPOSITIONS DE GROUPES (lot G2) : « On se retrouve ? » — cachée tant qu'il n'y en a pas */}
      {propositions.length > 0 && (
        <>
          {/* (« ＋ Lancer » est parti le 26 novembre 2026 au soir : il faisait la même chose que « ＋ Proposer », juste au-dessus) */}
          <h2 className="mg-rubrique">{PP.rangee}</h2>
          <div className="mg-rang" data-propositions>
            {propositions.map((p) => (
              <CarteProposition key={p.id} p={p} onGeste={(corps) => void surProposition({ ...corps, id: p.id })} onAutre={() => setAutre(p)} onOuvrir={setOuvert} />
            ))}
          </div>
        </>
      )}

      <h2 className="mg-rubrique">{P.avecMesProches}</h2>
      <div className="mg-rang" data-avec-mes-proches>
        {/* 📺 ma télé du jour : ma séance à quatre places */}
        <div className="mg-carte" data-ma-tele>
          <a className="mg-pochette" href={SEANCE} style={premiere ? { backgroundImage: `url(${vignetteYouTube(premiere.id)})` } : undefined} aria-label={P.ouvrirSeance}>
            <i aria-hidden="true">▶</i>
          </a>
          <strong className="mg-t">📺 {P.maTele}</strong>
          <Places figurines={moi ? [{ src: moi, prenom: P.toi }] : []} />
          <a className="mg-bouton" href={SEANCE} data-ouvrir-seance>
            {P.ouvrirSeance}
          </a>
        </div>

        {/* 🛋️ les séances en cours chez mes proches */}
        {seances.map((s) => (
          <div key={`s:${s.cle}`} className="mg-carte proche" data-seance={s.cle}>
            <a className="mg-pochette" href={s.invite ? chez(s.cle) : undefined} style={s.video ? { backgroundImage: `url(${vignetteYouTube(s.video.id)})` } : s.image ? { backgroundImage: `url(${s.image})` } : undefined}>
              <i aria-hidden="true">▶</i>
              <b className="mg-direct">{P.enDirect}</b>
            </a>
            <strong className="mg-t">{titreDeSeance(s)}</strong>
            <Places figurines={s.presents.map((x) => ({ src: x.src, prenom: x.prenom }))} />
            {s.invite ? (
              <a className="mg-bouton" href={chez(s.cle)} data-asseoir-seance>
                {PF.asseoirAvecEux(s.presents.length)}
              </a>
            ) : s.demande ? (
              <span className="mg-bouton second" data-demande-envoyee>
                {PF.demandeEnvoyee}
              </span>
            ) : (
              <button type="button" className="mg-bouton" data-rejoindre onClick={() => void rejoindre(s)}>
                {PF.rejoindre(s.presents.length, s.presents[0]?.prenom ?? s.hote)}
              </button>
            )}
          </div>
        ))}

        {/* 🎬 les invitations devant la télé d'un proche */}
        {invitations.map((i) => (
          <div key={`i:${i.cle}`} className="mg-carte proche" data-invitation={i.cle}>
            <a className="mg-pochette" href={chez(i.cle)} style={i.video ? { backgroundImage: `url(${vignetteYouTube(i.video.id)})` } : undefined}>
              <i aria-hidden="true">▶</i>
            </a>
            <strong className="mg-t">{i.par ? PS.invitationPar(i.par, i.prenom) : PS.invitation(i.prenom)}</strong>
            {i.titre && <span className="mg-m">« {i.titre} »</span>}
            <a className="mg-bouton" href={chez(i.cle)} data-venir>
              {PS.venir}
            </a>
            <button
              type="button"
              className="mg-lien"
              data-pas-maintenant
              onClick={() => {
                setV((x) => (x ? { ...x, invitations: x.invitations.filter((y) => y.cle !== i.cle) } : x));
                void poster({ action: "pas-maintenant", cle: i.cle }).then(() => void charger());
              }}
            >
              {PS.pasMaintenant}
            </button>
          </div>
        ))}

        {/* 👯 les demandes de proche reçues dans un salon */}
        {demandes.map((d) => (
          <div key={`d:${d.q}`} className="mg-carte proche" data-demande={d.q}>
            <span className="mg-pochette mg-emoji" aria-hidden="true">
              👯
            </span>
            <strong className="mg-t">{PS.demandeProche(d.prenom, d.salon)}</strong>
            <button
              type="button"
              className="mg-bouton"
              data-accepter
              onClick={() =>
                void poster({ action: "repondre-proche", q: d.q, oui: true }).then((r) => {
                  setNote(r.ok ? PS.accepte(d.prenom) : r.j.error || "Ça n’a pas marché. Réessaie.");
                  void charger();
                })
              }
            >
              {PS.accepter}
            </button>
            <button type="button" className="mg-lien" data-refuser onClick={() => void poster({ action: "repondre-proche", q: d.q, oui: false }).then(() => void charger())}>
              {PS.refuser}
            </button>
          </div>
        ))}
        {/* 👥 (lot G4) un groupe avec mes proches — quand je n'en ai encore aucun (sinon : « ＋ Créer », plus bas) */}
        {v && !groupes.length && (
          <button type="button" className="mg-carte-plus" onClick={() => setCreer(true)} data-creer-groupe-ouvrir>
            ＋<small>{PG.creerTitre}</small>
          </button>
        )}
      </div>

      {v && !seances.length && !invitations.length && !demandes.length && <p className="mg-chapo">{P.vide}</p>}

      {/* 👥 TOUS MES GROUPES (lot G4) : la table de chacun ; ceux où un proche m'invite */}
      {groupes.length > 0 && (
        <>
          <div className="mg-tete-rub">
            <h2 className="mg-rubrique">{PG.tous}</h2>
            <button type="button" className="mg-plus" onClick={() => setCreer(true)} data-creer-groupe-ouvrir>
              <b aria-hidden="true">＋</b>
              {PG.creer}
            </button>
          </div>
          <div className="mg-rang" data-tous-mes-groupes>
            {groupes.map((g) =>
              g.invite ? (
                <div key={g.id} className="mg-carte mg-table" data-groupe-invite={g.id}>
                  <strong className="mg-t">
                    {g.e} {g.nom}
                  </strong>
                  <Table g={g} />
                  <span className="mg-m">{PG.invitePar(g.invite.de)}</span>
                  <button type="button" className="mg-bouton rose" onClick={() => void repondreGroupe(g, false)} data-garder-groupe>
                    {PG.garder}
                  </button>
                  <button type="button" className="mg-lien" onClick={() => void repondreGroupe(g, true)} data-non-merci>
                    {PG.nonMerci}
                  </button>
                </div>
              ) : (
                <button key={g.id} type="button" className="mg-carte mg-table" onClick={() => setOuvert(g.id)} data-groupe={g.id}>
                  <strong className="mg-t">
                    {g.e} {g.nom}
                  </strong>
                  <Table g={g} />
                  {g.ici.length > 0 ? (
                    <span className="mg-m mg-vert">{PG.enLigne(g.ici.length)}</span>
                  ) : g.passage ? (
                    <span className="mg-m">{PG.passe(g.passage.prenom, heureLisible(g.passage.le))}</span>
                  ) : null}
                  {g.prochain && (
                    <span className="mg-m" data-prochain>
                      📅 {PV.prochain(`${g.prochain.nom} · ${quandLisible(g.prochain.quand)}`)}
                    </span>
                  )}
                </button>
              ),
            )}
          </div>
          <p className="mg-seuls">{PG.seulsMembres}</p>
        </>
      )}
      {(note || erreur) && (
        <p className="mg-note" role="status" data-note-groupes>
          {note || erreur}
        </p>
      )}
      {proposer && (
        <ProposerGroupe
          tele={tele}
          moi={moi ?? null}
          adulte={Boolean(v?.adulte)}
          onFermer={() => setProposer(false)}
          onPubliee={(p) => {
            setProposer(false);
            setV((x) => (x ? { ...x, propositions: [...(x.propositions ?? []), p].sort((a, b) => a.quand - b.quand) } : x));
            setNote(PP.publiee);
          }}
        />
      )}
      {espace && (
        <EspaceGroupe
          g={espace}
          tele={tele}
          adulte={Boolean(v?.adulte)}
          onFermer={() => setOuvert(null)}
          onMaj={(g) => setV((x) => (x ? { ...x, groupes: (x.groupes ?? []).map((y) => (y.id === g.id ? g : y)) } : x))}
          onQuitte={() => {
            setOuvert(null);
            setV((x) => (x ? { ...x, groupes: (x.groupes ?? []).filter((y) => y.id !== espace.id) } : x));
          }}
        />
      )}
      {creer && (
        <CreerGroupe
          adulte={Boolean(v?.adulte)}
          passions={tele?.passions ?? []}
          onFermer={() => setCreer(false)}
          onCree={(g) => {
            setCreer(false);
            setV((x) => (x ? { ...x, groupes: [...(x.groupes ?? []), g] } : x));
            setNote(PG.cree(g.nom));
          }}
        />
      )}
      {autre && (
        <AutreHeure
          p={autre}
          onFermer={() => setAutre(null)}
          onProposer={async (quand) => {
            if (await surProposition({ action: "autre-heure", id: autre.id, quand })) {
              setAutre(null);
              if (!autre.mienne) setNote(PP.autreEnvoye);
            }
          }}
        />
      )}
      <style>{STYLES_MES_GROUPES + STYLES_FIGURINES_GROUPE}</style>
    </section>
  );
}

/**
 * 📣 (26 novembre 2026, la maquette « Propositions de groupes » validée par le propriétaire) une proposition : la vidéo en
 * grand (son ▶ la lance), l'heure et la passion posées dessus ; le mot de celui qui propose dans une bulle ; les places en
 * fauteuils, avec les têtes de ceux qui viennent ; un seul gros bouton, « 🛋️ Je viens à 20 h » ; « 20 h ne te va pas ?
 * Propose une autre heure » ; « Signaler », « Retirer » rangés dans ⋯.
 */
function CarteProposition({ p, onGeste, onAutre, onOuvrir }: { p: PropositionGroupe; onGeste: (corps: Record<string, unknown>) => void; onAutre: () => void; onOuvrir: (id: string) => void }) {
  const [menu, setMenu] = useState(false);
  const [voir, setVoir] = useState(false);
  // (la vidéo en grand : les aperçus se taisent)
  useSuspendreApercus(voir);
  if (p.garder) return <CarteGarder p={p} onGeste={onGeste} onOuvrir={onOuvrir} />;
  const n = p.confirmes.length;
  const complet = n >= p.places && !p.jY;
  const entrer = p.ouverte && (p.jY || p.mienne || p.pour === "tous");
  const theme = THEMES_DECOUVRIR.find((t) => t.id === p.theme);
  const auteur = p.confirmes[0];
  const geste = (corps: Record<string, unknown>) => {
    setMenu(false);
    onGeste(corps);
  };
  return (
    <div className="mg-carte mg-large mg-prop" data-proposition={p.id} data-pour={p.pour}>
      <div className={`mg-ecran${p.video ? "" : " sans"}`} style={p.video ? { backgroundImage: `url(${vignetteYouTube(p.video.id)})` } : undefined}>
        {/* ▶ (26 novembre 2026) à l'écran, elle se lance toute seule, avec le son dès qu'on a touché la page ; on glisse
            de côté : la suivante démarre, celle-ci s'arrête */}
        {p.video && <ApercuVideo id={p.video.id} />}
        <span className="mg-ecran-ombre" aria-hidden="true" />
        {p.video ? (
          <button type="button" className="mg-ecran-lire" onClick={() => setVoir(true)} aria-label={PP.voirVideo} data-voir-video>
            <i aria-hidden="true" />
            <small>{PP.voirVideo}</small>
          </button>
        ) : (
          <span className="mg-ecran-e" aria-hidden="true">
            {p.e}
          </span>
        )}
        {p.ouverte ? (
          <span className="mg-ecran-direct" data-direct>
            <i aria-hidden="true" />
            {PP.enDirect}
          </span>
        ) : (
          <span className="mg-ecran-quand">🕘 {quandLisible(p.quand)}</span>
        )}
        {theme && (
          <span className="mg-ecran-theme">
            {theme.e} {theme.court.charAt(0).toUpperCase() + theme.court.slice(1)}
          </span>
        )}
        <button type="button" className="mg-ecran-plus" onClick={() => setMenu((x) => !x)} aria-label={PP.plus} aria-expanded={menu} data-menu>
          ⋯
        </button>
        {menu && (
          <span className="mg-menu" role="menu">
            {p.mienne ? (
              <button type="button" role="menuitem" onClick={() => geste({ action: "retirer" })} data-retirer>
                {PP.retirer}
              </button>
            ) : (
              <button type="button" role="menuitem" onClick={() => geste({ action: "signaler" })} data-signaler>
                🚩 {PP.signaler}
              </button>
            )}
          </span>
        )}
        {p.video && <span className="mg-ecran-titre">{p.video.titre}</span>}
      </div>

      <div className="mg-prop-corps">
        <strong className="mg-prop-nom">{p.nom}</strong>
        {p.pour === "proches" && <span className="mg-m">{PP.pourProches}</span>}
        {p.mot ? (
          <div className="mg-qui">
            {auteur && (
              <span className="mg-tete-ronde">
                <Figurine p={auteur} tete />
              </span>
            )}
            <p className="mg-bulle">
              <small>{p.mienne ? PP.taProposition : PP.propose(p.de)}</small>« {p.mot} »
            </p>
          </div>
        ) : (
          <span className="mg-m">{p.mienne ? PP.taProposition : PP.propose(p.de)}</span>
        )}

        <div className="mg-salon-places">
          <span className="mg-salon-titre">
            <span>{PP.leSalon}</span>
            <b data-confirmes>{PP.viennent(n, p.places)}</b>
          </span>
          <span className="mg-sieges" style={{ gridTemplateColumns: `repeat(${p.places},minmax(0,1fr))` }}>
            {Array.from({ length: p.places }, (_, k) => {
              const c = p.confirmes[k];
              const attend = !c && k === n && !p.jY && !p.mienne && !complet && !p.ouverte;
              return (
                <span key={k} className={`mg-siege${attend ? " attend" : ""}`} title={c?.prenom}>
                  <i className="dos" aria-hidden="true" />
                  <i className="assise" aria-hidden="true" />
                  {c && (
                    <span className="mg-siege-tete">
                      <Figurine p={c} tete />
                    </span>
                  )}
                </span>
              );
            })}
          </span>
        </div>

        {entrer ? (
          <button type="button" className="mg-bouton rose mg-gros" onClick={() => onGeste({ action: "entrer" })} data-entrer>
            {PP.entrerSalon}
          </button>
        ) : p.mienne || p.jY ? (
          <span className="mg-gardee" data-ma-place>
            <b aria-hidden="true">✓</b>
            <span>
              {PP.placeGardee}
              <small>{PP.salonOuvre(heureLisible(p.quand - OUVERT_AVANT_MS))}</small>
            </span>
          </span>
        ) : (
          <button type="button" className="mg-bouton rose mg-gros" disabled={complet} onClick={() => onGeste({ action: "confirmer" })} data-confirmer>
            {complet ? PP.complet : PP.jeViens(quandLisible(p.quand))}
          </button>
        )}

        {p.autre && (
          <p className="mg-autre" data-autre-heure>
            {PP.autre(p.autre.prenom, quandLisible(p.autre.quand))}
            {p.mienne && (
              <button type="button" className="mg-lien" onClick={() => onGeste({ action: "autre-heure", quand: p.autre!.quand })} data-prendre-heure>
                {PP.prendreHeure}
              </button>
            )}
          </p>
        )}
        {!p.ouverte && (
          <button type="button" className="mg-lien mg-centre" onClick={onAutre} data-autre>
            {p.mienne ? PP.changerHeure : PP.autreLien(heureLisible(p.quand))}
          </button>
        )}
        {p.jY && !p.mienne && (
          <button type="button" className="mg-lien mg-centre" onClick={() => onGeste({ action: "laisser" })} data-laisser>
            {PP.jeNePeuxPlus}
          </button>
        )}
      </div>

      {voir && p.video && (
        <>
          <button type="button" className="mg-voile" aria-label="Fermer" onClick={() => setVoir(false)} />
          <div className="mg-feuille mg-feuille-video" role="dialog" aria-label={p.video.titre} data-feuille-video>
            <span className="mg-lecteur">
              <iframe src={`https://www.youtube-nocookie.com/embed/${p.video.id}?autoplay=1&playsinline=1&rel=0&iv_load_policy=3`} title={p.video.titre} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
            </span>
            <p className="mg-feuille-titre">{p.video.titre}</p>
            {!entrer && !p.mienne && !p.jY && !complet && (
              <button
                type="button"
                className="mg-bouton rose mg-gros"
                onClick={() => {
                  setVoir(false);
                  onGeste({ action: "confirmer" });
                }}
              >
                {PP.jeViens(quandLisible(p.quand))}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** 💛 (lot G4) La séance est finie : « On garde ce groupe ? » — les coches de chacun ; ceux qui gardent forment le groupe. */
function CarteGarder({ p, onGeste, onOuvrir }: { p: PropositionGroupe; onGeste: (corps: Record<string, unknown>) => void; onOuvrir: (id: string) => void }) {
  const g = p.garder!;
  return (
    <div className="mg-carte mg-large mg-fin" data-garder={p.id}>
      <span className="mg-m mg-fin-sur">{PG.finie(p.e, p.nom)}</span>
      <strong className="mg-fin-q">{PG.garderQuestion}</strong>
      <div className="mg-gardiens">
        {p.confirmes.map((c) => {
          const garde = g.gardes.includes(c.q);
          return (
            <span key={c.q} className={`mg-gardien${garde ? " garde" : ""}`} data-gardien={c.q} data-garde={garde ? "oui" : "non"}>
              <span className="mg-tete-ronde">
                <Figurine p={c} tete />
                {garde && <i className="mg-coche">✓</i>}
              </span>
              <b>{c.prenom}</b>
            </span>
          );
        })}
      </div>
      {g.moi && g.groupe ? (
        <button type="button" className="mg-bouton rose" onClick={() => onOuvrir(g.groupe!)} data-entrer-dans-le-groupe>
          {PG.garde}
        </button>
      ) : g.moi ? (
        <span className="mg-bouton second" data-garde-attend>
          {PG.gardeSeul}
        </span>
      ) : (
        <button type="button" className="mg-bouton rose" onClick={() => onGeste({ action: "garder" })} data-garder-bouton>
          {PG.garder}
        </button>
      )}
      <p className="mg-sous">{g.moi && !g.groupe ? PG.attendre : PG.personne}</p>
    </div>
  );
}

/** 👥 La table d'un groupe : ses membres autour (leurs figurines). */
function Table({ g }: { g: GroupeVue }) {
  const autour = g.membres.slice(0, 5);
  const lefts = autour.length === 1 ? ["50%"] : autour.map((_, k) => `${10 + (k * 80) / (autour.length - 1)}%`);
  return (
    <span className="mg-scene" aria-hidden="true">
      <svg viewBox="0 0 180 90" className="mg-table-svg">
        <ellipse cx="90" cy="70" rx="70" ry="16" fill="#5a3a2a" />
        <ellipse cx="90" cy="66" rx="70" ry="16" fill="#7a4e36" />
        <rect x="84" y="74" width="12" height="16" fill="#3a2418" />
      </svg>
      {autour.map((p, k) => (
        <span key={p.q} className="mg-autour" style={{ left: lefts[k] }}>
          <Figurine p={p} />
        </span>
      ))}
    </span>
  );
}

/** 🕘 Un autre horaire : demain ou un des jours suivants, à une heure du soir. */
function AutreHeure({ p, onFermer, onProposer }: { p: PropositionGroupe; onFermer: () => void; onProposer: (quand: number) => void }) {
  const [jours, setJours] = useState(1);
  const [h, setH] = useState(21);
  const [maintenant] = useState(() => Date.now());
  const choix = [0, 1, 2, 3, 4, 5, 6].filter((j) => aParis(j, 22) > maintenant);
  const quand = aParis(jours, h);
  const nomJour = (j: number) => (j === 0 ? "Aujourd’hui" : j === 1 ? "Demain" : quandLisible(aParis(j, 12)).replace(/ \d.*$/, ""));
  return (
    <>
      <button type="button" className="mg-voile" aria-label="Fermer" onClick={onFermer} />
      <div className="mg-feuille" role="dialog" aria-label={PP.autreTitre} data-feuille-autre>
        <p className="mg-feuille-titre">{PP.autreTitre}</p>
        <p className="mg-m">
          {p.e} {p.nom} · {quandLisible(p.quand)}
        </p>
        <p className="mg-feuille-explique">{p.mienne ? PP.autreExpliqueMienne : PP.autreExplique(p.de)}</p>
        <div className="mg-rang mg-puces">
          {choix.map((j) => (
            <button key={j} type="button" className={`mg-puce${jours === j ? " pris" : ""}`} aria-pressed={jours === j} onClick={() => setJours(j)}>
              {nomJour(j)}
            </button>
          ))}
        </div>
        <div className="mg-rang mg-puces">
          {[18, 19, 20, 21, 22].map((x) => (
            <button key={x} type="button" className={`mg-puce${h === x ? " pris" : ""}`} aria-pressed={h === x} disabled={aParis(jours, x) < maintenant} onClick={() => setH(x)}>
              {heureLisible(aParis(jours, x))}
            </button>
          ))}
        </div>
        <button type="button" className="mg-bouton rose" disabled={quand < maintenant} onClick={() => onProposer(quand)} data-proposer-heure>
          {PP.proposerHeure} · {quandLisible(quand)}
        </button>
      </div>
    </>
  );
}

/** Les quatre places d'une séance : ceux qui y sont (leur figurine), puis les places libres. */
function Places({ figurines }: { figurines: { src: string; prenom: string }[] }) {
  const pris = figurines.slice(0, PLACES_SEANCE);
  return (
    <span className="mg-places">
      {pris.map((f, k) => (
        <span key={k} className="mg-tete-ronde" title={f.prenom}>
          {f.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.src} alt={f.prenom} draggable={false} />
          ) : (
            <span aria-hidden="true">🙂</span>
          )}
        </span>
      ))}
      {Array.from({ length: PLACES_SEANCE - pris.length }, (_, k) => (
        <span key={`l${k}`} className="mg-tete-ronde libre" aria-label={P.placeLibre}>
          ＋
        </span>
      ))}
    </span>
  );
}

export const STYLES_MES_GROUPES = `
.mg{display:flex;flex-direction:column;gap:10px;margin:0 -16px;padding:2px 0 8px}
.mg-tete{display:flex;align-items:center;gap:10px;padding:0 16px}
.mg-tete h1{flex:1;margin:0;font-size:26px;font-weight:900;letter-spacing:-.03em}
.mg-proposer{display:inline-flex;align-items:center;gap:6px;min-height:48px;padding:0 18px 0 12px;border-radius:999px;background:linear-gradient(135deg,#ff4fb0,#ff2e9a);color:#fff;font-weight:800;font-size:16px;text-decoration:none;box-shadow:0 8px 22px rgba(255,46,154,.45);-webkit-tap-highlight-color:transparent}
.mg-proposer b{font-size:26px;line-height:1;font-weight:600}
.mg-rubrique{margin:6px 0 0;padding:0 16px;font-size:19px;font-weight:800;letter-spacing:-.02em;color:#F2C46B}
.mg-rang{display:flex;gap:10px;overflow-x:auto;padding:2px 16px 6px;scrollbar-width:none;scroll-snap-type:x mandatory;scroll-padding:0 16px}
.mg-rang::-webkit-scrollbar{display:none}
.mg-carte{flex:none;scroll-snap-align:start;width:174px;box-sizing:border-box;padding:10px;display:flex;flex-direction:column;gap:8px;border:1px solid rgba(255,196,140,.28);border-radius:18px;background:rgba(28,14,18,.85);color:#FFF4E6}
.mg-carte.proche{border-color:rgba(245,162,58,.45)}
.mg-pochette{position:relative;display:flex;align-items:center;justify-content:center;height:84px;border-radius:12px;overflow:hidden;background:linear-gradient(135deg,#5a2440,#2a1020) center/cover no-repeat;text-decoration:none}
.mg-pochette i{display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.9);color:#222;font-style:normal;font-size:12px}
.mg-emoji{font-size:40px}
.mg-direct{position:absolute;left:6px;top:6px;padding:2px 7px;border-radius:999px;background:#120c09;color:#3ddc97;font-size:10.5px;font-weight:800}
.mg-t{display:block;font-weight:800;font-size:14.5px;line-height:1.2}
.mg-m{display:block;margin-top:-4px;color:#cdb8a4;font-size:12.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mg-places{display:flex;gap:6px}
.mg-tete-ronde{position:relative;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;overflow:hidden;background:#3a2430;box-shadow:0 0 0 2px #1c0e12;flex:none}
.mg-tete-ronde img{width:100%;height:100%;object-fit:cover;object-position:50% 14%}
.mg-tete-ronde.libre{background:transparent;box-shadow:0 0 0 2px rgba(255,244,230,.3) inset;color:rgba(255,244,230,.55);font-size:15px}
.mg-bouton{display:flex;align-items:center;justify-content:center;min-height:44px;margin-top:auto;padding:0 10px;border:0;border-radius:999px;background:#f5a23a;color:#2a1500;font:inherit;font-weight:800;font-size:14px;text-align:center;text-decoration:none;cursor:pointer;-webkit-tap-highlight-color:transparent}
.mg-bouton.second{background:#2a1d14;color:#F2C46B;box-shadow:0 0 0 1px rgba(246,201,139,.5) inset;font-size:13px}
.mg-lien{min-height:32px;margin-top:-4px;border:0;background:none;color:#cdb8a4;font:inherit;font-size:13px;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.mg-proposer{border:0;font:inherit;font-weight:800;font-size:16px;cursor:pointer}
.mg-tete-rub{display:flex;align-items:center;justify-content:space-between;gap:8px;padding-right:16px}
.mg-plus{display:inline-flex;align-items:center;gap:4px;min-height:36px;padding:0 12px;border:1px solid rgba(255,196,140,.35);border-radius:999px;background:none;color:#F2C46B;font:inherit;font-size:13.5px;font-weight:800;cursor:pointer}
.mg-plus b{font-size:18px;line-height:1}
.mg-large{width:min(358px,calc(100vw - 32px));gap:10px}
.mg-pile{display:flex;padding-left:6px}
.mg-pile .mg-tete-ronde{margin-left:-6px}
.mg-autre{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;margin:0;color:#F2C46B;font-size:13.5px;font-weight:700}
.mg-autre .mg-lien{margin:0;min-height:28px}
.mg-bouton.rose{background:#d6247f;color:#fff}
.mg-bouton:disabled{opacity:.5;cursor:default}
.mg-voile{position:fixed;inset:0;z-index:58;border:0;background:rgba(0,0,0,.55)}
.mg-feuille{position:fixed;left:0;right:0;bottom:0;z-index:59;display:flex;flex-direction:column;gap:10px;max-width:560px;margin:0 auto;padding:18px 0 calc(22px + env(safe-area-inset-bottom));border-radius:24px 24px 0 0;background:#1c1411;box-shadow:0 -10px 40px rgba(0,0,0,.6)}
.mg-feuille>p,.mg-feuille>.mg-bouton{margin-left:16px;margin-right:16px}
.mg-feuille-titre{margin:0;font-size:20px;font-weight:800}
.mg-feuille-explique{margin:0 16px;color:#cdb8a4;font-size:14px;line-height:1.4}
/* 📣 (26 novembre 2026) la carte d'une proposition : la vidéo en grand, les fauteuils, un seul gros bouton */
.mg-prop{width:min(340px,calc(100vw - 56px));padding:0;gap:0;overflow:hidden;border-radius:22px}
.mg-ecran{position:relative;aspect-ratio:16/9;max-width:100%;background:#24131f center/cover no-repeat}
.mg-ecran.sans{display:flex;align-items:center;justify-content:center;background:radial-gradient(circle,rgba(255,46,154,.3),#20111b 70%)}
.mg-ecran-e{font-size:58px}
.mg-ecran .av-son{top:auto;bottom:52px}
.mg-ecran[data-apercu-joue] .mg-ecran-lire i{opacity:0;transform:scale(.6);transition:opacity .3s ease,transform .3s ease}
.mg-ecran-ombre{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.5) 0%,transparent 34%,transparent 50%,rgba(0,0,0,.85) 100%);pointer-events:none}
.mg-ecran-lire{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:6px;padding:0;border:0;background:none;color:#fff;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.mg-ecran-lire i{display:grid;place-items:center;width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.92);box-shadow:0 10px 26px rgba(0,0,0,.45)}
.mg-ecran-lire i::before{content:"";margin-left:5px;border-left:18px solid #1A0D14;border-top:11px solid transparent;border-bottom:11px solid transparent}
.mg-ecran-lire small{padding:2px 9px;border-radius:999px;background:rgba(11,4,9,.7);font-size:11.5px;font-weight:800}
.mg-ecran-quand,.mg-ecran-direct,.mg-ecran-theme{position:absolute;top:9px;display:inline-flex;align-items:center;gap:6px;max-width:46%;padding:5px 10px;border-radius:999px;font-size:12.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mg-ecran-quand{left:9px;background:#fff4e6;color:#2a1a10}
.mg-ecran-direct{left:9px;background:#FF4D6D;color:#fff;letter-spacing:.03em}
.mg-ecran-direct i{width:8px;height:8px;border-radius:50%;background:#fff;animation:mg-bat 1.2s ease-in-out infinite}
.mg-ecran-theme{right:44px;max-width:34%;background:rgba(11,4,9,.72);color:#fff}
.mg-ecran-plus{position:absolute;top:7px;right:7px;width:32px;height:32px;border:0;border-radius:50%;background:rgba(11,4,9,.72);color:#fff;font:inherit;font-size:17px;font-weight:900;line-height:1;cursor:pointer}
.mg-menu{position:absolute;top:44px;right:8px;z-index:2;display:flex;flex-direction:column;min-width:150px;padding:6px;border-radius:14px;background:#1c1411;box-shadow:0 12px 30px rgba(0,0,0,.6),inset 0 0 0 1px rgba(255,196,140,.25)}
.mg-menu button{min-height:42px;padding:0 12px;border:0;border-radius:10px;background:none;color:#FFF4E6;font:inherit;font-size:14.5px;font-weight:700;text-align:left;cursor:pointer}
.mg-ecran-titre{position:absolute;left:12px;right:12px;bottom:9px;font-size:14px;font-weight:800;line-height:1.25;color:#fff;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;pointer-events:none}
.mg-prop-corps{display:flex;flex-direction:column;gap:10px;padding:12px 13px 14px}
.mg-prop-nom{font-size:17px;font-weight:900;line-height:1.2;overflow-wrap:anywhere}
.mg-prop-corps .mg-m{margin:-4px 0 0;white-space:normal}
.mg-qui{display:flex;align-items:flex-end;gap:9px}
.mg-qui .mg-tete-ronde{width:38px;height:38px;box-shadow:0 0 0 2px #fff4e6}
.mg-bulle{margin:0;min-width:0;padding:6px 11px 7px;border-radius:15px 15px 15px 4px;background:#fff4e6;color:#2a1a10;font-family:Caveat,cursive;font-weight:700;font-size:20px;line-height:1.05;overflow-wrap:anywhere}
.mg-bulle small{display:block;margin-bottom:2px;font-family:inherit;font-family:system-ui,sans-serif;font-size:11px;font-weight:700;color:#7A5A68}
.mg-salon-places{display:flex;flex-direction:column;gap:7px}
.mg-salon-titre{display:flex;justify-content:space-between;gap:8px;font-size:12.5px;font-weight:700;color:#cdb8a4}
.mg-salon-titre b{color:#FFF4E6;font-weight:800;text-align:right}
.mg-sieges{display:grid;gap:5px;padding-top:6px}
.mg-siege{position:relative;aspect-ratio:1/1.05;max-width:56px;width:100%;justify-self:center}
.mg-siege .dos{position:absolute;left:12%;right:12%;top:0;height:64%;border-radius:10px 10px 5px 5px;background:linear-gradient(180deg,#7d3654,#5a2239)}
.mg-siege .assise{position:absolute;left:4%;right:4%;bottom:0;height:42%;border-radius:7px;background:linear-gradient(180deg,#8e4062,#612641)}
.mg-siege-tete{position:absolute;left:50%;top:-8%;z-index:1;transform:translateX(-50%);width:78%;aspect-ratio:1;border-radius:50%;overflow:hidden;background:#3a2430;box-shadow:0 0 0 2px #fff4e6}
.mg-siege-tete img{width:100%;height:100%;object-fit:cover;object-position:50% 14%}
.mg-siege-tete .ge-tete{width:100%;height:100%}
.mg-siege.attend::after{content:"";position:absolute;left:-20%;right:-20%;bottom:-18%;height:70%;border-radius:50%;background:radial-gradient(closest-side,rgba(255,46,154,.55),transparent);animation:mg-bat 2s ease-in-out infinite}
.mg-bouton.mg-gros{min-height:50px;margin-top:2px;font-size:16px;box-shadow:0 10px 22px -8px rgba(255,46,154,.9)}
.mg-gardee{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;background:rgba(255,46,154,.14);box-shadow:inset 0 0 0 1px rgba(255,46,154,.4);font-size:14px;font-weight:800}
.mg-gardee small{display:block;font-size:12px;font-weight:600;color:#cdb8a4}
.mg-lien.mg-centre{align-self:center;margin:-2px 0 0;text-align:center}
.mg-feuille-video .mg-lecteur{display:block;aspect-ratio:16/9;max-width:100%;margin:0 16px;border-radius:14px;overflow:hidden;background:#000}
.mg-feuille-video iframe{width:100%;height:100%;border:0;display:block}
.mg-feuille-video .mg-feuille-titre{margin:0 16px;font-size:16px}
.mg-feuille-video .mg-bouton{margin:0 16px}
@keyframes mg-bat{50%{opacity:.3}}
@media (prefers-reduced-motion:reduce){.mg-ecran-direct i,.mg-siege.attend::after{animation:none}}
.mg-puces{padding-bottom:2px}
.mg-puce{flex:none;min-height:40px;padding:0 14px;border:1px solid rgba(255,196,140,.28);border-radius:999px;background:#120c09;color:#FFF4E6;font:inherit;font-size:14px;font-weight:700;white-space:nowrap;cursor:pointer}
.mg-puce.pris{border-color:#ff2e9a;background:rgba(255,46,154,.2)}
.mg-puce:disabled{opacity:.35}
.mg-chapo{margin:0;padding:0 16px;color:#cdb8a4;font-size:14px}
.mg-vert{color:#3ddc97}
button.mg-pochette{border:0;color:inherit;font:inherit;font-size:40px;cursor:pointer}
.mg-gardien .mg-tete-ronde .ge-tete{width:48px;height:48px}
.mg-carte-plus{flex:none;width:110px;align-self:stretch;border:1px dashed rgba(255,196,140,.35);border-radius:18px;background:rgba(28,14,18,.6);color:#cdb8a4;font:inherit;font-size:40px;font-weight:300;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;cursor:pointer}
.mg-carte-plus small{font-weight:600;font-size:12px;line-height:1.2;text-align:center;padding:0 8px}
.mg-table{height:auto;min-height:182px;font:inherit;text-align:left;cursor:pointer}
.mg-scene{position:relative;display:block;height:96px}
.mg-table-svg{position:absolute;left:0;right:0;bottom:0;width:100%}
.mg-autour{position:absolute;bottom:28px;width:38px;height:62px;transform:translateX(-50%)}
.mg-autour .ge-fig{width:38px;height:62px}
.mg-seuls{margin:-2px 16px 0;text-align:center;color:#a8927e;font-size:12px}
.mg-tete-ronde .ge-tete{width:100%;height:100%}
.mg-fin{align-items:center;text-align:center}
.mg-fin-sur{margin:0}
.mg-fin-q{font-size:22px;font-weight:900;letter-spacing:-.02em}
.mg-gardiens{display:flex;flex-wrap:wrap;justify-content:center;gap:10px}
.mg-gardien{display:flex;flex-direction:column;align-items:center;gap:4px;width:56px}
.mg-gardien .mg-tete-ronde{width:48px;height:48px;overflow:visible;opacity:.75}
.mg-gardien .mg-tete-ronde .ge-tete{border-radius:50%}
.mg-gardien.garde .mg-tete-ronde{opacity:1;box-shadow:0 0 0 3px #3ddc97}
.mg-gardien b{font-size:12.5px;font-weight:700;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mg-coche{position:absolute;right:-2px;bottom:-2px;width:20px;height:20px;border-radius:50%;background:#3ddc97;color:#06301a;font-style:normal;font-size:12px;font-weight:900;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px #1c0e12}
.mg-fin .mg-bouton{align-self:stretch;margin-top:4px}
.mg-sous{margin:0;color:#cdb8a4;font-size:13px}
.mg-note{margin:0 16px;padding:10px 14px;border-radius:14px;background:rgba(255,255,255,.06);font-size:14px}
`;
