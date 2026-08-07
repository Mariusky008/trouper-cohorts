"use client";

// L'espace ville, côté saisie.
//
// UN SEUL CHAMP OBLIGATOIRE : le texte. Le lien et l'échéance sont facultatifs.
// Un formulaire municipal à huit champs obligatoires ne sera rempli qu'une fois,
// le jour de la formation — et l'information de la ville n'arrivera jamais dans
// le fil.
//
// L'écran montre en permanence à quoi ressemblera la carte dans le fil. Un
// service qui publie sans voir le résultat écrit pour un formulaire ; en voyant
// la carte, il écrit pour un habitant.
import { useState } from "react";

export type InfoVille = {
  id: string;
  texte: string;
  lien: string | null;
  quand: string;
  echeance: string;
  expiree: boolean;
  vues: number;
};

export function EspaceVille({
  ville,
  villeNom,
  auteur,
  token,
  infos,
}: {
  ville: string;
  villeNom: string;
  auteur: string;
  token: string;
  infos: InfoVille[];
}) {
  const [texte, setTexte] = useState("");
  const [lien, setLien] = useState("");
  const [expire, setExpire] = useState("");
  const [etat, setEtat] = useState<"" | "envoi" | "ok" | "erreur">("");
  const [msg, setMsg] = useState("");
  const [liste, setListe] = useState(infos);

  const publier = async () => {
    setEtat("envoi");
    setMsg("");
    try {
      const r = await fetch("/api/direct/ville-publier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ville,
          token,
          texte: texte.trim(),
          lien: lien.trim(),
          // `datetime-local` rend une heure locale sans fuseau ; on la convertit
          // pour que « jusqu'à 18 h » veuille dire 18 h ici, pas 18 h UTC.
          expireLe: expire ? new Date(expire).toISOString() : "",
        }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string; id?: string };
      if (!r.ok) throw new Error(j.error || "Publication impossible.");
      setListe((l) => [
        { id: j.id || "", texte: texte.trim(), lien: lien.trim() || null, quand: "à l'instant", echeance: "", expiree: false, vues: 0 },
        ...l,
      ]);
      setTexte("");
      setLien("");
      setExpire("");
      setEtat("ok");
    } catch (e) {
      setEtat("erreur");
      setMsg(e instanceof Error ? e.message : "Publication impossible.");
    }
  };

  const retirer = async (id: string) => {
    const avant = liste;
    setListe((l) => l.filter((x) => x.id !== id));
    try {
      const r = await fetch("/api/direct/ville-publier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ville, token, action: "retirer", id }),
      });
      if (!r.ok) throw new Error();
    } catch {
      setListe(avant); // le retrait a échoué : ne pas laisser croire qu'il est fait
    }
  };

  return (
    <div className="ev">
      <style
        dangerouslySetInnerHTML={{
          __html: `
.ev{--ink:#14201A;--soft:#6B7A72;--faint:#9DAAA3;--line:#E6EBE8;--line2:#D3DBD7;--g:#0F8F5F;--red:#D2634A;
  max-width:560px;margin:0 auto;padding:0 0 60px;font-family:system-ui,-apple-system,sans-serif;color:#3C4A43;}
.ev *{box-sizing:border-box;}
.ev header{background:var(--ink);color:#fff;padding:24px 20px;}
.ev header .k{font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:#3FD79A;font-weight:700;}
.ev header h1{font-size:21px;font-weight:700;margin:6px 0 0;}
.ev header p{font-size:12px;color:#8FA79A;margin:5px 0 0;line-height:1.5;}
.ev section{padding:20px;}
.ev h2{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--soft);font-weight:700;margin:0 0 12px;}
.ev label{display:block;margin-bottom:14px;}
.ev .lab{font-size:11.5px;font-weight:600;color:var(--ink);display:block;margin-bottom:5px;}
.ev .opt{font-weight:400;color:var(--faint);}
.ev textarea,.ev input{width:100%;padding:11px 13px;border:1px solid var(--line2);border-radius:11px;
  font-size:15px;font-family:inherit;color:var(--ink);background:#fff;}
.ev textarea{min-height:88px;resize:vertical;line-height:1.5;}
.ev .cpt{font-size:10px;color:var(--faint);text-align:right;margin-top:4px;}
.ev .pub{width:100%;padding:14px;border-radius:24px;border:none;background:var(--g);color:#fff;
  font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;}
.ev .pub:disabled{background:var(--line2);color:var(--faint);cursor:default;}
.ev .note{font-size:11px;color:var(--soft);line-height:1.55;margin:12px 0 0;}
.ev .ok{background:#E6F4EE;color:#0A6B48;padding:11px 13px;border-radius:11px;font-size:12px;font-weight:600;margin-bottom:14px;}
.ev .err{background:#FBE9E4;color:var(--red);padding:11px 13px;border-radius:11px;font-size:12px;font-weight:600;margin-bottom:14px;}

/* L'aperçu : la carte telle qu'elle apparaîtra dans le fil. */
.ev .apercu{border:1px dashed var(--line2);border-radius:14px;padding:12px;background:#FAFCFB;margin-bottom:18px;}
.ev .apercu .k{font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--faint);font-weight:700;margin-bottom:9px;}
.ev .carte{background:#fff;border:1px solid var(--line);border-radius:13px;overflow:hidden;}
.ev .carte .m{display:flex;gap:5px;align-items:center;padding:9px 11px 0;font-size:9.5px;font-weight:700;}
.ev .carte .m .f{color:var(--g);}
.ev .carte .m .kd{margin-left:auto;font-size:8px;letter-spacing:.05em;text-transform:uppercase;
  padding:3px 7px;border-radius:9px;background:#FBF3E3;color:#8A6A22;}
.ev .carte .a{display:flex;align-items:center;gap:9px;padding:8px 11px;}
.ev .carte .av{width:28px;height:28px;border-radius:50%;background:#3C4A43;color:#fff;display:flex;
  align-items:center;justify-content:center;font-size:12px;font-weight:700;flex:none;}
.ev .carte .nm{font-size:12px;font-weight:700;color:var(--ink);}
.ev .carte .mt{font-size:9px;color:var(--faint);}
.ev .carte .tx{padding:0 11px 11px;font-size:12.5px;color:var(--ink);line-height:1.45;margin:0;}
.ev .carte .vide{color:var(--faint);font-style:italic;}

.ev .li{border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:9px;background:#fff;}
.ev .li p{margin:0 0 7px;font-size:12.5px;color:var(--ink);line-height:1.45;}
.ev .li .meta{font-size:10px;color:var(--faint);display:flex;gap:6px;align-items:center;flex-wrap:wrap;}
.ev .li .exp{color:var(--red);font-weight:700;}
.ev .li .ret{margin-left:auto;background:none;border:none;color:var(--red);font-size:11px;
  font-weight:700;cursor:pointer;font-family:inherit;padding:0;}
.ev .rien{font-size:12px;color:var(--soft);line-height:1.6;}
`,
        }}
      />

      <header>
        <div className="k">Espace ville</div>
        <h1>{villeNom}</h1>
        <p>
          Vos informations apparaissent dans Le Direct de {villeNom}, parmi les annonces des
          commerçants. Elles sont signées <strong>{auteur}</strong>.
        </p>
      </header>

      <section>
        <h2>Publier une information</h2>

        {etat === "ok" ? <div className="ok">C&apos;est en ligne — l&apos;information est dans le fil.</div> : null}
        {etat === "erreur" ? <div className="err">{msg}</div> : null}

        <div className="apercu">
          <div className="k">Dans le fil, ça donnera ça</div>
          <div className="carte">
            <div className="m">
              <span className="f">à l&apos;instant</span>
              <span className="kd">Ma ville</span>
            </div>
            <div className="a">
              <span className="av" aria-hidden="true">{auteur.charAt(0).toUpperCase()}</span>
              <span>
                <span className="nm" style={{ display: "block" }}>{auteur}</span>
                <span className="mt">Information de la ville</span>
              </span>
            </div>
            <p className={`tx${texte.trim() ? "" : " vide"}`}>
              {texte.trim() || "Votre texte apparaîtra ici…"}
            </p>
          </div>
        </div>

        <label>
          <span className="lab">L&apos;information</span>
          <textarea
            value={texte}
            onChange={(e) => setTexte(e.target.value.slice(0, 280))}
            placeholder="Le marché du mercredi est déplacé place de la Course pendant les travaux."
            aria-label="Texte de l'information"
          />
          <div className="cpt">{texte.length} / 280</div>
        </label>

        <label>
          <span className="lab">
            Un lien pour en savoir plus <span className="opt">— facultatif</span>
          </span>
          <input
            type="url"
            inputMode="url"
            value={lien}
            onChange={(e) => setLien(e.target.value)}
            placeholder="https://…"
          />
        </label>

        <label>
          <span className="lab">
            Jusqu&apos;à quand <span className="opt">— facultatif</span>
          </span>
          <input type="datetime-local" value={expire} onChange={(e) => setExpire(e.target.value)} />
        </label>

        <button type="button" className="pub" disabled={!texte.trim() || etat === "envoi"} onClick={publier}>
          {etat === "envoi" ? "Publication…" : "Publier dans Le Direct"}
        </button>

        <p className="note">
          Sans date de fin, l&apos;information reste dans le fil trois jours puis disparaît d&apos;elle-même
          — Le Direct ne garde que ce qui est encore vrai.
        </p>
      </section>

      <section>
        <h2>Vos informations en ligne</h2>
        {liste.length ? (
          liste.map((i) => (
            <div className="li" key={i.id}>
              <p>{i.texte}</p>
              <div className="meta">
                <span>{i.quand}</span>
                {i.expiree ? (
                  <span className="exp">· terminée, retirée du fil</span>
                ) : i.echeance ? (
                  <span>· {i.echeance}</span>
                ) : null}
                {i.vues > 0 ? <span>· {i.vues} vue{i.vues > 1 ? "s" : ""}</span> : null}
                <button type="button" className="ret" onClick={() => retirer(i.id)}>Retirer</button>
              </div>
            </div>
          ))
        ) : (
          <p className="rien">
            Rien pour l&apos;instant. La première information que vous publierez apparaîtra dans le fil
            des habitants de {villeNom}.
          </p>
        )}
      </section>
    </div>
  );
}
