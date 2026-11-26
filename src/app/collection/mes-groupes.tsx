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
import { PHRASES_SALONS as PS, PLACES_SEANCE, type DemandeProche, type InvitationTele } from "@/lib/direct/salons-ouverts";
import { PHRASES_FIL as PF, titreDeSeance, type SeanceFil } from "@/lib/direct/fil-decouvrir";
import type { TeleDuJour } from "@/lib/direct/tele-du-jour";

const ROUTE = "/api/direct/mes-groupes";
const SALONS = "/api/direct/salons-ouverts";
const SEANCE = "/univers/salons?chez=moi";
/** (ce qui est en direct ne le reste pas : la mémoire ne vaut que dix minutes) */
const MEMOIRE_MS = 10 * 60_000;
const chez = (cle: string) => `/univers/salons?chez=${encodeURIComponent(cle)}`;

export type MesGroupesVue = { invitations: InvitationTele[]; demandes: DemandeProche[]; seances: SeanceFil[] };
/** Ce qui attend un geste de moi (la pastille de l'onglet) : les invitations et les demandes de proche. */
export const enAttenteDe = (v: MesGroupesVue | null) => (v ? v.invitations.length + v.demandes.length : 0);

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

  const charger = useCallback(async () => {
    const r = await fetch(ROUTE, { cache: "no-store" }).catch(() => null);
    const j = (r?.ok ? await r.json().catch(() => null) : null) as Partial<MesGroupesVue> | null;
    if (!j) return setErreur(P.reseau);
    const n: MesGroupesVue = { invitations: j.invitations ?? [], demandes: j.demandes ?? [], seances: j.seances ?? [] };
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

  // (une invitation et la séance du même proche : une seule carte, celle de la séance, où l'on est invité)
  const seances = v?.seances ?? [];
  const invitations = (v?.invitations ?? []).filter((i) => !seances.some((s) => s.cle === i.cle));
  const demandes = v?.demandes ?? [];
  const premiere = tele?.videos[0];
  const moi = tele?.figurine?.src;

  return (
    <section className="mg" data-mes-groupes>
      <div className="mg-tete">
        <h1>{P.titre}</h1>
        <a className="mg-proposer" href={SEANCE} data-proposer>
          <b aria-hidden="true">＋</b>
          {P.proposer}
        </a>
      </div>

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
      </div>

      {v && !seances.length && !invitations.length && !demandes.length && <p className="mg-chapo">{P.vide}</p>}
      {(note || erreur) && (
        <p className="mg-note" role="status" data-note-groupes>
          {note || erreur}
        </p>
      )}
      <style>{STYLES_MES_GROUPES}</style>
    </section>
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
.mg-chapo{margin:0;padding:0 16px;color:#cdb8a4;font-size:14px}
.mg-note{margin:0 16px;padding:10px 14px;border-radius:14px;background:rgba(255,255,255,.06);font-size:14px}
`;
