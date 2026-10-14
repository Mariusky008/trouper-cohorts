"use client";

// 🗓️ MON PLANNING — l'endroit du comptoir où il voit ses prochains jours.
//
// « Est-ce que sur l'admin des commerçants on pourrait imaginer un planning
// des annonces : préparer un jour du mois toute la semaine ou tout le mois à
// l'avance, pour ne pas avoir à le faire tous les jours. Avec une annonce qui
// tourne plusieurs jours d'affilée s'il le souhaite. »
//
// CE N'EST PAS UN FORMULAIRE. Préparer une annonce, c'est la même mission que
// « Publier » — son fantôme lui pose les mêmes questions (le plat, l'assiette,
// sa voix) — avec une question de plus : quel jour. Cet écran ne fait que
// MONTRER : ses deux prochaines semaines, ce qui est déjà prévu, et ce qu'il
// peut retirer. Toucher un jour libre lance la mission pour ce jour-là.
//
// Les règles sont dans `lib/direct/planning-annonces.ts` (sept jours au plus,
// un mois à l'avance, trois par jour) ; l'envoi dans `comptoir-planning.ts`.
import { useMemo, useState } from "react";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import type { Mission } from "@/lib/direct/missions-commercant";
import type { Programmee } from "@/lib/direct/comptoir-planning";
import { ajouterJours, DUREE_MAX_JOURS, joursCouverts, joursDeLaFin, MAX_PAR_JOUR } from "@/lib/direct/planning-annonces";
import { jourParis } from "@/lib/jour-paris";

/** « jeu. 15 oct. » */
export function jourCourt(jour: string): string {
  const d = new Date(`${jour}T12:00:00Z`);
  return d.toLocaleDateString("fr-FR", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" });
}

const morceaux = (jour: string) => {
  const d = new Date(`${jour}T12:00:00Z`);
  return {
    sem: d.toLocaleDateString("fr-FR", { timeZone: "UTC", weekday: "narrow" }),
    num: d.getUTCDate(),
    weekend: d.getUTCDay() === 0 || d.getUTCDay() === 6,
  };
};

/** « 3 jours, du jeu. 15 oct. au sam. 17 oct. » */
const periode = (a: { jour: string; jours: number }) =>
  a.jours > 1 ? `${a.jours} jours, du ${jourCourt(a.jour)} au ${jourCourt(ajouterJours(a.jour, a.jours - 1))}` : `Le ${jourCourt(a.jour)}, toute la journée`;

type EnLigneJour = { id: string; photo: string | null; debut: string; fin: string | null };

export function PlanningComptoir({
  commerce,
  mission,
  dossier,
  programmees,
  enLigne,
  ennui,
  occupe,
  onProgrammer,
  onRetirer,
  onRetour,
}: {
  commerce: CommerceComptoir;
  mission: Mission;
  dossier: string;
  programmees: Programmee[];
  /** Ce qui tourne déjà : ses jours se remplissent aussi. */
  enLigne: EnLigneJour[];
  ennui: string;
  /** L'annonce en train d'être retirée. */
  occupe: string;
  /** Préparer une annonce — pour ce jour-là, ou pour demain. */
  onProgrammer: (jour?: string) => void;
  onRetirer: (id: string, toute: boolean) => void;
  onRetour: () => void;
}) {
  const [toutLeMois, setToutLeMois] = useState(false);
  const auj = jourParis();
  const quoi = mission.quoi.toLowerCase();

  /* SES JOURS : ce qui tourne (vert) et ce qui est prévu (ambre), jour par jour. */
  const jours = useMemo(() => {
    const n = toutLeMois ? 35 : 14;
    const out = Array.from({ length: n }, (_, i) => ({ jour: ajouterJours(auj, i), vues: [] as { cle: string; photo: string | null; prevue: boolean }[] }));
    const ou = new Map(out.map((x) => [x.jour, x]));
    for (const a of enLigne) joursDeLaFin(a.debut, a.fin).forEach((j) => ou.get(j)?.vues.push({ cle: `l-${a.id}`, photo: a.photo, prevue: false }));
    for (const a of programmees) joursCouverts(a).forEach((j) => ou.get(j)?.vues.push({ cle: `p-${a.id}`, photo: a.photo, prevue: true }));
    return out;
  }, [auj, enLigne, programmees, toutLeMois]);

  /* UNE SÉRIE (« chaque semaine ») TIENT SUR UNE CARTE, avec ses dates. */
  const groupes = useMemo(() => {
    const out: { cle: string; tete: Programmee; toutes: Programmee[] }[] = [];
    const parSerie = new Map<string, (typeof out)[number]>();
    for (const a of programmees) {
      const g = a.serie ? parSerie.get(a.serie) : undefined;
      if (g) {
        g.toutes.push(a);
        continue;
      }
      const n = { cle: a.serie || a.id, tete: a, toutes: [a] };
      if (a.serie) parSerie.set(a.serie, n);
      out.push(n);
    }
    return out;
  }, [programmees]);

  return (
    <div className="pl">
      <StylesPlanning />
      <div className="pl-haut">
        <button type="button" className="pl-retour" onClick={onRetour}>
          ‹ Mon comptoir
        </button>
        <span className="pl-compte">
          {programmees.length} {programmees.length > 1 ? "programmées" : "programmée"}
        </span>
      </div>

      <section className="pl-intro">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${dossier}visage.webp`} alt="" />
        <div>
          <h2>Mon planning</h2>
          <p>
            Prépare {quoi} de tes prochains jours en une fois. Le jour venu, je le publie pour toi
            {commerce.reel ? " — sur ta page et dans Le Direct —" : ""} et je le retire le soir de son dernier jour.
          </p>
        </div>
      </section>

      <div className="pl-regles" aria-label="Les règles">
        <span>{DUREE_MAX_JOURS} jours au plus</span>
        <span>Jusqu’à un mois à l’avance</span>
        <span>{MAX_PAR_JOUR} par jour</span>
      </div>

      <button type="button" className="cz-go pl-go" onClick={() => onProgrammer()}>
        ＋ Programmer {quoi}
      </button>
      {ennui && (
        <p className="pl-ennui" role="status">
          {ennui}
        </p>
      )}

      {/* ═══ SES PROCHAINS JOURS ═══ */}
      <section className="pl-cal" aria-label="Mes prochains jours">
        <h3>{toutLeMois ? "Ton mois" : "Tes deux prochaines semaines"}</h3>
        <div className="pl-grille">
          {jours.map(({ jour, vues }) => {
            const m = morceaux(jour);
            const plein = vues.length >= MAX_PAR_JOUR;
            const estAuj = jour === auj;
            return (
              <button
                type="button"
                key={jour}
                className={`pl-jour${estAuj ? " auj" : ""}${m.weekend ? " we" : ""}${vues.length ? " rempli" : ""}`}
                disabled={estAuj || plein}
                aria-label={`${jourCourt(jour)} : ${vues.length ? `${vues.length} annonce${vues.length > 1 ? "s" : ""}` : "libre"}${estAuj ? " (aujourd’hui)" : plein ? " (complet)" : " — préparer ce jour"}`}
                onClick={() => onProgrammer(jour)}
              >
                <i>{estAuj ? "auj." : m.sem}</i>
                <b>{m.num}</b>
                <span className="pl-pts">
                  {vues.slice(0, MAX_PAR_JOUR).map((v) => (
                    <span
                      key={v.cle}
                      className={v.prevue ? "p" : "l"}
                      style={v.photo ? { backgroundImage: `url(${JSON.stringify(v.photo)})` } : undefined}
                    />
                  ))}
                  {!vues.length && !estAuj && <span className="vide">＋</span>}
                </span>
              </button>
            );
          })}
        </div>
        <div className="pl-leg">
          <span className="l">En ligne</span>
          <span className="p">Programmée</span>
          <button type="button" onClick={() => setToutLeMois((v) => !v)}>
            {toutLeMois ? "Deux semaines" : "Voir tout le mois"}
          </button>
        </div>
      </section>

      {/* ═══ CE QUI ATTEND SON JOUR ═══ */}
      <section className="pl-liste" aria-label="Programmées">
        <h3>Programmées</h3>
        {groupes.length === 0 && (
          <p className="pl-vide">
            Rien de prévu pour l’instant. Touche un jour libre pour y préparer {quoi} : je te pose les mêmes questions que
            d’habitude, et c’est rangé.
          </p>
        )}
        {groupes.map(({ cle, tete: a, toutes }) => (
          <article key={cle} className="pl-carte">
            {a.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.photo} alt="" />
            ) : (
              <span className="pl-carte-vide">{mission.icone}</span>
            )}
            <div>
              <b>{a.nom}</b>
              <span>
                {[a.prix, a.voix ? "🎙️ ta voix" : ""].filter(Boolean).join(" · ")}
              </span>
              {toutes.length > 1 ? (
                <>
                  <em>
                    🔁 Chaque semaine · {a.jours > 1 ? `${a.jours} jours` : "1 jour"}
                  </em>
                  {/* SES DATES, chacune retirable seule : la semaine où il ferme, il n'en enlève qu'une. */}
                  <div className="pl-dates">
                    {toutes.map((x) => (
                      <span key={x.id}>
                        {jourCourt(x.jour)}
                        <button type="button" disabled={occupe === x.id} aria-label={`Retirer celle du ${jourCourt(x.jour)}`} onClick={() => onRetirer(x.id, false)}>
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <em>{periode(a)}</em>
              )}
              <div className="pl-actes">
                <button type="button" disabled={occupe === a.id} onClick={() => onRetirer(a.id, toutes.length > 1)}>
                  {toutes.length > 1 ? "Retirer toutes les semaines" : "Retirer"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

/* La charte du comptoir (`StylesComptoir`) : nuit brune, nappe, crème, ambre
   pour ce qui est prévu, vert pour ce qui tourne. Aucun accent grave ici. */
function StylesPlanning() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.pl{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:12px 16px calc(28px + env(safe-area-inset-bottom,0px));
  scrollbar-width:none;display:flex;flex-direction:column;gap:14px;}
.pl::-webkit-scrollbar{display:none;}
.pl-haut{display:flex;align-items:center;justify-content:space-between;}
.pl-retour{border:1px solid var(--trait);border-radius:999px;padding:9px 16px;background:var(--nappe);font-weight:700;}
.pl-compte{font-size:14px;font-weight:700;color:var(--gris);}
.pl-intro{display:grid;grid-template-columns:64px 1fr;gap:14px;align-items:center;padding:14px;border-radius:22px;
  background:var(--nappe);border:1px solid var(--trait);}
.pl-intro img{width:64px;height:64px;border-radius:50%;object-fit:cover;background:var(--nappe2);}
.pl-intro h2{margin:0;font-family:var(--font-clikme),sans-serif;font-size:19px;font-weight:800;letter-spacing:-.01em;}
.pl-intro p{margin:4px 0 0;font-size:14px;line-height:1.4;color:var(--gris);}
.pl-regles{display:flex;flex-wrap:wrap;gap:6px;}
.pl-regles span{font-size:12px;font-weight:700;color:var(--ambre);background:rgba(245,162,58,.12);
  border:1px solid rgba(245,162,58,.3);border-radius:999px;padding:5px 10px;}
.pl-go{flex:none;}
.pl-ennui{margin:0;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.4;
  background:rgba(255,46,154,.12);border:1px solid rgba(255,46,154,.4);}
.pl-cal{padding:14px 12px 12px;border-radius:22px;background:var(--nappe);border:1px solid var(--trait);}
.pl-cal h3,.pl-liste h3{margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ambre);}
.pl-grille{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px;}
.pl-jour{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:0;padding:7px 0 8px;border-radius:14px;
  background:var(--nappe2);border:1px solid transparent;}
.pl-jour i{font-style:normal;font-size:10.5px;font-weight:700;text-transform:uppercase;color:var(--gris);}
.pl-jour b{font-family:var(--font-clikme),sans-serif;font-size:17px;font-weight:800;line-height:1;}
.pl-jour.we b{color:#FFC48C;}
.pl-jour.auj{border-color:rgba(245,162,58,.55);background:rgba(245,162,58,.1);}
.pl-jour.rempli{border-color:rgba(245,162,58,.28);}
.pl-jour:disabled{cursor:default;}
.pl-jour:not(:disabled):active{transform:scale(.95);}
.pl-pts{display:flex;justify-content:center;gap:2px;min-height:14px;max-width:100%;}
.pl-pts span{width:13px;height:13px;border-radius:4px;flex:none;background:#3A2C24 center/cover no-repeat;}
.pl-pts span.p{box-shadow:0 0 0 1.5px var(--ambre);}
.pl-pts span.l{box-shadow:0 0 0 1.5px #7BD66A;}
.pl-pts span.vide{width:auto;height:auto;background:none;box-shadow:none;font-size:11px;line-height:14px;color:rgba(255,244,230,.35);}
.pl-leg{display:flex;align-items:center;gap:12px;margin-top:10px;font-size:12px;color:var(--gris);}
.pl-leg span::before{content:"";display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:5px;vertical-align:-1px;}
.pl-leg .l::before{box-shadow:0 0 0 1.5px #7BD66A;}
.pl-leg .p::before{box-shadow:0 0 0 1.5px var(--ambre);}
.pl-leg button{margin-left:auto;border:0;background:none;padding:2px 0;font-size:13px;font-weight:700;color:var(--ambre);}
.pl-liste{display:flex;flex-direction:column;gap:8px;}
.pl-liste h3{margin-bottom:2px;}
.pl-vide{margin:0;padding:14px;border-radius:18px;border:1px dashed var(--trait);font-size:14px;line-height:1.45;color:var(--gris);}
.pl-carte{display:grid;grid-template-columns:62px 1fr;gap:12px;align-items:start;padding:10px;border-radius:18px;
  background:var(--nappe);border:1px solid var(--trait);}
.pl-carte img,.pl-carte-vide{width:62px;height:62px;border-radius:13px;object-fit:cover;display:grid;place-items:center;
  background:var(--nappe2);font-size:26px;}
.pl-carte b{display:block;font-family:var(--font-clikme),sans-serif;font-weight:700;font-size:15.5px;line-height:1.2;}
.pl-carte > div > span{display:block;font-size:13.5px;color:var(--gris);margin-top:2px;}
.pl-carte > div > span:empty{display:none;}
.pl-carte em{display:block;font-style:normal;font-size:12.5px;font-weight:700;color:var(--ambre);margin-top:5px;}
.pl-dates{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px;}
.pl-dates span{display:inline-flex;align-items:center;gap:2px;font-size:12px;font-weight:700;color:#FFD9A8;
  background:rgba(245,162,58,.14);border-radius:9px;padding:2px 2px 2px 8px;}
.pl-dates button{border:0;background:none;padding:3px 6px;border-radius:7px;font-size:11px;color:var(--gris);}
.pl-actes{display:flex;gap:8px;margin-top:9px;}
.pl-actes button{background:none;border:1px solid var(--trait);border-radius:999px;padding:7px 12px;font-size:12.5px;color:var(--gris);}
.pl-actes button:disabled,.pl-dates button:disabled{opacity:.5;}
`,
      }}
    />
  );
}
