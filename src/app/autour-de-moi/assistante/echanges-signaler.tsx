"use client";

/**
 * 🚩 « SIGNALER » UN BON NON HONORÉ — la feuille, au comptoir comme sur la page d'un membre.
 *
 * Celui qui a pris le bon dit ce qui s'est passé, en un geste. Ce que la feuille
 * dit d'avance, parce que c'est ce qui arrive vraiment (voir
 * `20261025120000_echanges_signalements.sql`) :
 *   · un bon encore réservé est annulé, ses crédits lui reviennent ;
 *   · son nom n'est montré qu'à ClikMe ;
 *   · deux commerces différents, et les offres de l'autre passent en pause le
 *     temps que ClikMe en parle avec lui.
 */
import { useState } from "react";
import { MOTIFS_SIGNALEMENT, chezNom, enCredits, type BonReel, type MotifSignalement } from "@/lib/echanges/echanges";
import { Feuille } from "./echanges-communs";

export function FeuilleSignaler({
  bon,
  envoi,
  onEnvoyer,
  onFermer,
}: {
  bon: BonReel;
  envoi: boolean;
  onEnvoyer: (motif: MotifSignalement, detail: string) => void;
  onFermer: () => void;
}) {
  const [motif, setMotif] = useState<MotifSignalement | null>(null);
  const [detail, setDetail] = useState("");
  return (
    <Feuille titre="Signaler un problème" onFermer={onFermer}>
      <p className="ec-gris">
        Ton bon <b>{bon.titre}</b> {chezNom(bon.autre)} : que s’est-il passé ?
      </p>
      <div className="sg-motifs" role="radiogroup" aria-label="Ce qui s’est passé">
        {MOTIFS_SIGNALEMENT.map((m) => (
          <button key={m.cle} type="button" role="radio" aria-checked={motif === m.cle} className={motif === m.cle ? "on" : ""} onClick={() => setMotif(m.cle)}>
            {m.mot}
          </button>
        ))}
      </div>
      <textarea
        className="sg-detail"
        value={detail}
        maxLength={500}
        rows={3}
        placeholder="Ce qui s’est passé, en deux mots (facultatif)"
        onChange={(e) => setDetail(e.target.value)}
      />
      <ul className="sg-suite">
        {bon.statut === "reserve" && (
          <li>
            Ton bon est annulé{bon.mode === "moitie" ? "" : ` : tes ${enCredits(bon.prix)} te reviennent tout de suite`}.
          </li>
        )}
        <li>Ton nom reste entre toi et ClikMe.</li>
        <li>Si deux commerces le signalent, ses offres sont mises en pause le temps qu’on en parle avec lui.</li>
      </ul>
      <button type="button" className="cz-go" disabled={!motif || envoi} onClick={() => motif && onEnvoyer(motif, detail.trim())}>
        {envoi ? "J’envoie…" : "Envoyer le signalement"}
      </button>
    </Feuille>
  );
}

export function StylesSignaler() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.sg-motifs{display:flex;flex-direction:column;gap:8px;}
.sg-motifs button{text-align:left;min-height:48px;padding:12px 14px;border-radius:14px;border:1.5px solid var(--trait);background:var(--nappe);color:var(--creme);font-size:15px;font-weight:700;}
.sg-motifs button.on{border-color:#FF7AB8;background:rgba(255,46,154,.1);}
.sg-detail{width:100%;min-height:76px;padding:12px 14px;border-radius:14px;border:1px solid var(--trait);background:var(--fond);color:var(--creme);font:inherit;font-size:14.5px;resize:vertical;}
.sg-suite{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px;font-size:13px;line-height:1.4;color:var(--gris);}
.ec-signaler{align-self:center;background:none;border:0;padding:6px 10px;font-size:13.5px;font-weight:600;color:#FFB4D6;text-decoration:underline;text-underline-offset:3px;}
.ec-signale{font-size:13px;color:var(--gris);text-align:center;}
.ec-pause-sig{display:flex;flex-direction:column;gap:6px;padding:12px 14px;border-radius:16px;border:1px solid rgba(255,46,154,.45);background:rgba(255,46,154,.08);color:#FFD5E8;font-size:14px;line-height:1.4;}
.ec-pause-sig b{font-family:var(--font-clikme),sans-serif;font-size:15px;color:var(--creme);}
.ec-pause-sig ul{margin:0;padding-left:18px;font-size:13px;color:#F4B9D2;}
`,
      }}
    />
  );
}
