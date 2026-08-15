"use client";

// « QU'EST-CE QUI SE PASSE CHEZ VOUS AUJOURD'HUI ? »
//
// Un champ, un bouton, en haut de son espace. C'est le geste le plus court de
// toute l'application, et ça n'est pas un hasard : le commerçant en fait à
// peine un par jour. Trois questions pour raconter qu'on a sorti les
// croissants, et il ne le raconte jamais.
//
// CE N'EST PAS UNE ANNONCE, et l'écran ne doit pas le laisser croire. Une
// annonce propose quelque chose à saisir, elle a une échéance, elle peut porter
// des façons d'en profiter. Une histoire ne propose rien : elle donne envie de
// passer. On le dit sous le champ, sinon il écrira ici ce qu'il devrait
// publier là-bas.
//
// UNE SEULE PAR JOUR. Réécrire corrige, ça n'empile pas — et l'écran le dit
// avant qu'il se demande où est passée la précédente.
import { useCallback, useEffect, useState } from "react";
import { MAX_HISTOIRE, MIN_HISTOIRE, type Histoire } from "@/lib/direct/histoire";

const EXEMPLES = [
  "6 h 12. Le premier croissant est sorti du four. Et oui… on en a goûté un.",
  "Première cliente de la journée : 32 cm de cheveux en moins.",
  "Le chef a changé la garniture ce matin. Les premiers à goûter ont validé.",
  "Une cliente est entrée pour trois roses. Elle est repartie avec un bouquet de 27 fleurs. Ça arrive.",
];

export function ProHistoire({ slug, token }: { slug: string; token: string }) {
  const [histoire, setHistoire] = useState<Histoire | null>(null);
  const [texte, setTexte] = useState("");
  const [ouvert, setOuvert] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [err, setErr] = useState("");
  const [charge, setCharge] = useState(false);
  // L'exemple est DÉRIVÉ DU SLUG, pas tiré au hasard. Un tirage aléatoire rend
  // le rendu impur — deux rendus du même état donneraient deux suggestions, et
  // l'exemple changerait sous ses yeux pendant qu'il écrit. Dérivé, il est
  // stable pour ce commerce, et différent d'un commerce à l'autre.
  const exemple = EXEMPLES[[...slug].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7) % EXEMPLES.length];

  const appeler = useCallback(
    async (corps: Record<string, unknown>) => {
      const r = await fetch("/api/site-internet/pro/histoire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, token, ...corps }),
      });
      const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
      if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "Enregistrement impossible.");
      return j;
    },
    [slug, token]
  );

  // Ce qu'il a déjà écrit aujourd'hui. Sans cette lecture, il retrouverait un
  // champ vide et croirait avoir perdu son histoire.
  useEffect(() => {
    let vivant = true;
    appeler({ action: "get" })
      .then((j) => {
        if (!vivant) return;
        const h = (j.histoire as Histoire | null) ?? null;
        setHistoire(h);
        if (h) setTexte(h.texte);
      })
      .catch(() => {
        /* indisponible : le bloc reste utilisable, l'envoi dira pourquoi */
      })
      .finally(() => vivant && setCharge(true));
    return () => {
      vivant = false;
    };
  }, [appeler]);

  const enregistrer = async () => {
    const t = texte.trim();
    if (t.length < MIN_HISTOIRE || envoi) return;
    setEnvoi(true);
    setErr("");
    try {
      const j = await appeler({ action: "set", texte: t });
      setHistoire((j.histoire as Histoire | null) ?? null);
      setOuvert(false);
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e));
    } finally {
      setEnvoi(false);
    }
  };

  const retirer = async () => {
    if (envoi) return;
    setEnvoi(true);
    setErr("");
    try {
      await appeler({ action: "clear" });
      setHistoire(null);
      setTexte("");
      setOuvert(false);
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e));
    } finally {
      setEnvoi(false);
    }
  };

  // Tant que la lecture n'a pas répondu, on n'affiche NI « rien aujourd'hui »
  // NI un champ vide : les deux mentiraient à celui qui a déjà écrit ce matin.
  if (!charge) return null;

  const reste = MAX_HISTOIRE - texte.trim().length;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .phi{margin-top:16px;border:1px solid var(--hair);border-radius:18px;background:var(--paper);
            padding:15px 16px;box-shadow:0 12px 32px -24px rgba(18,20,26,.3);}
          .pro .phi .k{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);font-weight:800;}
          .pro .phi .q{font-family:var(--fd),Georgia,serif;font-size:17px;font-weight:700;line-height:1.25;margin-top:6px;}
          .pro .phi .s{font-size:12.5px;color:var(--soft);line-height:1.45;margin-top:5px;}
          /* L'histoire déjà publiée : citée, comme les habitants la verront. */
          .pro .phi .vue{display:flex;gap:11px;align-items:flex-start;margin-top:12px;background:#F7F5EF;
            border-radius:13px;padding:12px 13px;}
          .pro .phi .vue .e{font-size:19px;line-height:1.3;flex:none;}
          .pro .phi .vue .t{font-size:14px;line-height:1.5;color:var(--ink);font-style:italic;}
          .pro .phi textarea{width:100%;margin-top:11px;border:1px solid var(--hair);border-radius:12px;
            padding:12px 14px;font-size:14px;font-family:inherit;background:#fff;resize:vertical;line-height:1.5;}
          .pro .phi .cnt{font-size:11px;color:var(--faint);margin-top:5px;text-align:right;}
          .pro .phi .cnt.max{color:#B4472B;font-weight:700;}
          .pro .phi .ex{font-size:12px;color:var(--faint);line-height:1.5;margin-top:8px;font-style:italic;}
          .pro .phi .row{display:flex;gap:9px;margin-top:11px;flex-wrap:wrap;}
          .pro .phi button{border-radius:11px;padding:11px 16px;font-size:13.5px;font-weight:800;
            font-family:inherit;cursor:pointer;border:1px solid var(--hair);background:#fff;color:var(--ink);}
          .pro .phi button.go{background:linear-gradient(135deg,#00C896,#00926E);border-color:transparent;color:#fff;}
          .pro .phi button:disabled{opacity:.55;cursor:default;}
          .pro .phi .err{margin-top:10px;font-size:12.5px;line-height:1.45;color:#8A3D26;background:#FDECE6;
            border:1px solid #F3CDBF;border-radius:11px;padding:10px 12px;}
          `,
        }}
      />
      <div className="phi">
        <div className="k">La petite histoire du jour</div>
        <div className="q">Qu&apos;est-ce qui se passe chez vous aujourd&apos;hui&nbsp;?</div>
        <div className="s">
          Une phrase, pas une annonce&nbsp;: elle ne propose rien à réserver, elle donne envie de passer.
          Elle s&apos;affiche sous vos annonces dans Le Direct, et disparaît ce soir.
        </div>

        {histoire && !ouvert && (
          <>
            <div className="vue">
              <span className="e" aria-hidden="true">{histoire.emoji}</span>
              <span className="t">«&nbsp;{histoire.texte}&nbsp;»</span>
            </div>
            <div className="row">
              <button type="button" onClick={() => setOuvert(true)}>Modifier</button>
              <button type="button" onClick={retirer} disabled={envoi}>Retirer</button>
            </div>
          </>
        )}

        {!histoire && !ouvert && (
          <div className="row">
            <button type="button" className="go" onClick={() => setOuvert(true)}>Raconter</button>
          </div>
        )}

        {ouvert && (
          <>
            <textarea
              value={texte}
              onChange={(e) => setTexte(e.target.value.slice(0, MAX_HISTOIRE))}
              rows={3}
              autoFocus
              placeholder="Ce qui vient de se passer, en une phrase…"
            />
            <div className={`cnt${reste <= 20 ? " max" : ""}`}>{reste} caractères restants</div>
            <div className="ex">Par exemple&nbsp;: «&nbsp;{exemple}&nbsp;»</div>
            {err && <div className="err">{err}</div>}
            <div className="row">
              <button type="button" className="go" onClick={enregistrer} disabled={envoi || texte.trim().length < MIN_HISTOIRE}>
                {envoi ? "Un instant…" : histoire ? "Remplacer" : "Publier"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOuvert(false);
                  setTexte(histoire?.texte ?? "");
                  setErr("");
                }}
              >
                Annuler
              </button>
            </div>
            {histoire && (
              <div className="ex">
                Vous en avez déjà une aujourd&apos;hui&nbsp;: celle-ci la remplacera. Une seule par jour.
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
