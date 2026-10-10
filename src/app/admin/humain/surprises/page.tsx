// 🎁 LES SURPRISES DU FANTÔME — quelles raisons tiennent vraiment.
//
// « Le moteur décidera si le Fantôme paraît intelligent ou bavard. » Cette
// page compte ce que les vrais habitants font des surprises : ouvertes, ❤️,
// 👎, « Voir », « Pourquoi moi ? », « Ne plus me proposer » — par sorte de
// raison (ce que vous m'avez dit / ce que je crois / ce qui va avec) et par
// pièce. C'est elle qui dira quelle raison il faut durcir, et laquelle tient.
//
// LA DÉMONSTRATION EST À PART : ses « habitants » sont des visiteurs qui
// essaient l'application, pas des gens qui vivent avec leur Fantôme.
//
// RIEN DE PERSONNEL ICI : la table du parcours ne garde ni qui, ni quoi, ni
// chez qui — voir `lib/direct/surprises-mesure.ts`.
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { PIECES, pieceParCle, type ClePiece } from "@/lib/direct/maison";
import { SORTES_DE_RAISON, type SorteDeRaison } from "@/lib/direct/surprises";
import { agreger, AVIS_MIN, DEMO, taux, type Compte } from "@/lib/direct/surprises-mesure";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PERIODES = [7, 30, 90];
/** 1 000 lignes par lecture (la borne de PostgREST), cinquante lectures au plus. */
const PAGE = 1000;
const PAGES_MAX = 50;

const NOM_SORTE: Record<SorteDeRaison, { titre: string; exemple: string }> = {
  dit: { titre: "Ce que vous m'avez dit", exemple: "« Vous m'avez dit aimer les romans : en voici un. »" },
  crois: { titre: "Ce que je crois", exemple: "« Vous avez préféré « Lasagnes maison » 3 fois : il y en a ce midi. »" },
  "va-avec": { titre: "Ce qui va avec", exemple: "« Cette veste va avec votre chemise en denim et votre chino. »" },
};

/** Les couleurs, validées (contraste, daltonisme) : 👎 rouge, sans avis gris neutre, ❤️ bleu. */
const ROUGE = "#e34948";
const NEUTRE = "#e7e5e0";
const BLEU = "#2a78d6";

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)} %`);

/** Hors du composant : une lecture d'horloge pendant le rendu le rendrait impur. */
async function lireLesLignes(jours: number) {
  const depuis = new Date(Date.now() - jours * 86400_000).toISOString();
  const supabase = createAdminClient();
  const lignes: { contexte?: unknown }[] = [];
  let erreur = "";
  for (let k = 0; k < PAGES_MAX; k++) {
    const { data, error } = await supabase
      .from("apercu_parcours")
      .select("contexte")
      .eq("evenement", "surprise")
      .gte("cree_le", depuis)
      .order("cree_le", { ascending: false })
      .range(k * PAGE, k * PAGE + PAGE - 1);
    if (error) {
      erreur = error.message;
      break;
    }
    const rs = Array.isArray(data) ? data : [];
    lignes.push(...(rs as { contexte?: unknown }[]));
    if (rs.length < PAGE) break;
  }
  return { lignes, erreur, tronque: lignes.length >= PAGE * PAGES_MAX };
}

export default async function AdminSurprisesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) || {};
  const jours = PERIODES.includes(Number(params.jours)) ? Number(params.jours) : 30;
  const villeDemandee = typeof params.ville === "string" && /^[a-z0-9-]{1,40}$/.test(params.ville) ? params.ville : null;
  const { lignes, erreur, tronque } = await lireLesLignes(jours);
  const a = agreger(lignes, villeDemandee);
  const vraiesVilles = a.villes.filter((v) => v !== DEMO);
  const lien = (p: { jours?: number; ville?: string | null }) => {
    const q = new URLSearchParams();
    q.set("jours", String(p.jours ?? jours));
    const v = p.ville === undefined ? villeDemandee : p.ville;
    if (v) q.set("ville", v);
    return `/admin/humain/surprises?${q.toString()}`;
  };
  const t = a.total;
  const avis = t.aime + t.bof;
  const croises = Object.entries(a.croise)
    .map(([k, c]) => ({ piece: k.split("|")[0] as ClePiece, sorte: k.split("|")[1] as SorteDeRaison, c }))
    .filter((x) => x.c.vue > 0 || x.c.trouvee > 0)
    .sort((x, y) => y.c.vue - x.c.vue);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Ma Maison</p>
        <h1 className="mt-1 text-2xl font-black sm:text-3xl">Les surprises du Fantôme</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
          Ce que les habitants font des surprises, par sorte de raison et par pièce. La question : quelles raisons tiennent vraiment, et
          lesquelles font paraître le Fantôme bavard ? Rien de personnel n&apos;est gardé : ni qui, ni quoi, ni chez quel commerçant.
        </p>

        {/* LES FILTRES, SUR UNE LIGNE, AU-DESSUS DES CHIFFRES */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Où</span>
          <Filtre href={lien({ ville: null })} actif={villeDemandee === null}>
            Toutes les vraies villes
          </Filtre>
          {vraiesVilles.map((v) => (
            <Filtre key={v} href={lien({ ville: v })} actif={villeDemandee === v}>
              {v}
            </Filtre>
          ))}
          <Filtre href={lien({ ville: DEMO })} actif={villeDemandee === DEMO}>
            Démonstration
          </Filtre>
          <span className="ml-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Depuis</span>
          {PERIODES.map((j) => (
            <Filtre key={j} href={lien({ jours: j })} actif={jours === j}>
              {j} jours
            </Filtre>
          ))}
        </div>

        {/* LES CHIFFRES DE TÊTE */}
        <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Tuile titre="Trouvées" valeur={String(t.trouvee)} detail="par le Fantôme" />
          <Tuile titre="Ouvertes" valeur={pct(taux(t.vue, t.trouvee))} detail={`${t.vue} vues`} />
          <Tuile titre="❤️ parmi les avis" valeur={pct(taux(t.aime, avis))} detail={`${t.aime} ❤️ · ${t.bof} 👎`} />
          <Tuile titre="« Voir »" valeur={pct(taux(t.voir, t.vue))} detail="des surprises vues" />
          <Tuile titre="« Pourquoi moi ? »" valeur={pct(taux(t.pourquoi, t.vue))} detail="des surprises vues" />
          <Tuile titre="« Ne plus me proposer »" valeur={String(t.refus)} detail="genres refusés" />
        </div>
        {avis > 0 && avis < AVIS_MIN && (
          <p className="mt-3 text-sm text-amber-800">
            ⚠️ {avis} avis seulement : les chiffres sont là, mais c&apos;est trop peu pour conclure (il en faut au moins {AVIS_MIN}).
          </p>
        )}
      </div>

      {erreur && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">Lecture impossible : {erreur}</div>
      )}
      {tronque && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
          Plus de {PAGE * PAGES_MAX} gestes sur la période : seuls les plus récents sont comptés. Réduisez la période.
        </div>
      )}

      {t.trouvee + t.vue === 0 ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-muted-foreground">
          Aucune surprise mesurée {villeDemandee === DEMO ? "dans la démonstration" : villeDemandee ? `à ${villeDemandee}` : "dans les vraies villes"} sur les {jours}{" "}
          derniers jours. La mesure commence avec cette version : les chiffres arrivent avec les premières surprises ouvertes.
        </div>
      ) : (
        <>
          <Bloc titre="Par sorte de raison" sous="La question principale : quelle raison fait dire ❤️, laquelle fait dire 👎.">
            {SORTES_DE_RAISON.map((s) => (
              <Ligne key={s} nom={NOM_SORTE[s].titre} sous={NOM_SORTE[s].exemple} c={a.parSorte[s]} />
            ))}
          </Bloc>
          <Bloc titre="Par pièce">
            {PIECES.map((p) => (
              <Ligne key={p.cle} nom={`${p.icone} ${p.nom}`} c={a.parPiece[p.cle]} />
            ))}
          </Bloc>
          {croises.length > 0 && (
            <Bloc titre="Pièce × raison" sous="Les combinaisons qui ont servi, de la plus vue à la moins vue.">
              {croises.map((x) => (
                <Ligne key={`${x.piece}|${x.sorte}`} nom={`${pieceParCle(x.piece).icone} ${pieceParCle(x.piece).nom}`} sous={NOM_SORTE[x.sorte].titre} c={x.c} />
              ))}
            </Bloc>
          )}
        </>
      )}
    </section>
  );
}

function Filtre({ href, actif, children }: { href: string; actif: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      prefetch={false}
      aria-current={actif ? "page" : undefined}
      className={`rounded-full border px-3 py-1 font-semibold ${actif ? "border-slate-900 bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}
    >
      {children}
    </Link>
  );
}

function Tuile({ titre, valeur, detail }: { titre: string; valeur: string; detail: string }) {
  return (
    <div className="rounded-2xl border bg-slate-50 p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{titre}</p>
      <p className="mt-1 text-3xl font-black text-slate-950">{valeur}</p>
      <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function Bloc({ titre, sous, children }: { titre: string; sous?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
      <h2 className="text-lg font-black">{titre}</h2>
      {sous && <p className="mt-1 text-sm text-muted-foreground">{sous}</p>}
      <Legende />
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b text-left text-[11px] font-black uppercase tracking-[0.1em] text-slate-500">
              <th className="py-2 pr-3">Raison</th>
              <th className="py-2 pr-3 text-right">Vues</th>
              <th className="w-[38%] py-2 pr-3">Réactions (sur les vues)</th>
              <th className="py-2 pr-3 text-right">❤️ / avis</th>
              <th className="py-2 pr-3 text-right">« Voir »</th>
              <th className="py-2 pr-3 text-right">Pourquoi ?</th>
              <th className="py-2 text-right">Refus</th>
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

function Legende() {
  const pastille = (couleur: string, mot: string) => (
    <span className="inline-flex items-center gap-1.5">
      <i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: couleur }} aria-hidden="true" />
      {mot}
    </span>
  );
  return (
    <p className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
      {pastille(ROUGE, "👎 Pas vraiment")}
      {pastille(NEUTRE, "Vue, sans avis")}
      {pastille(BLEU, "❤️ Ça me plaît")}
      <span className="text-slate-400">Barres centrées sur « sans avis » : à gauche ce qui déplaît, à droite ce qui plaît.</span>
    </p>
  );
}

/**
 * UNE LIGNE : les chiffres, et la barre divergente de ce que les vues sont
 * devenues — 👎 à gauche, sans avis au centre, ❤️ à droite. Centrée sur le
 * neutre : on compare d'un coup d'œil ce qui penche d'un côté ou de l'autre.
 */
function Ligne({ nom, sous, c }: { nom: string; sous?: string; c: Compte }) {
  const avis = c.aime + c.bof;
  const vues = Math.max(c.vue, avis);
  const sans = Math.max(0, vues - avis);
  const part = (n: number) => (vues ? (n / vues) * 100 : 0);
  // L'échelle va de -100 % à +100 % : la barre occupe la moitié de la largeur.
  const gauche = 50 - (part(c.bof) + part(sans) / 2) / 2;
  const peu = avis < AVIS_MIN;
  const segment = (largeur: number, couleur: string, titre: string, premier: boolean, dernier: boolean) =>
    largeur > 0 ? (
      <span
        title={titre}
        className="h-full"
        style={{
          // En % du conteneur, qui représente toutes les vues.
          width: `${largeur}%`,
          background: couleur,
          borderRadius: `${premier ? 4 : 0}px ${dernier ? 4 : 0}px ${dernier ? 4 : 0}px ${premier ? 4 : 0}px`,
          marginRight: dernier ? 0 : 2,
        }}
      />
    ) : null;
  const segs = [
    { n: c.bof, couleur: ROUGE, titre: `👎 ${c.bof} (${Math.round(part(c.bof))} % des vues)` },
    { n: sans, couleur: NEUTRE, titre: `Sans avis : ${sans} (${Math.round(part(sans))} %)` },
    { n: c.aime, couleur: BLEU, titre: `❤️ ${c.aime} (${Math.round(part(c.aime))} % des vues)` },
  ].filter((x) => x.n > 0);
  return (
    <tr className="border-b last:border-0">
      <td className="py-2.5 pr-3 align-top">
        <span className="font-semibold text-slate-900">{nom}</span>
        {sous && <span className="block text-xs text-slate-500">{sous}</span>}
      </td>
      <td className="py-2.5 pr-3 text-right align-top tabular-nums">{c.vue}</td>
      <td className="py-2.5 pr-3 align-top">
        {vues > 0 ? (
          <span className="relative block h-3.5 w-full" aria-label={`${c.bof} pas vraiment, ${sans} sans avis, ${c.aime} ça me plaît`}>
            <i className="absolute inset-y-[-3px] left-1/2 w-px bg-slate-300" aria-hidden="true" />
            <span className="absolute inset-y-0 flex" style={{ left: `${gauche}%`, width: "50%" }}>
              {segs.map((x, k) => (
                <span key={k} className="contents">
                  {segment(part(x.n), x.couleur, x.titre, k === 0, k === segs.length - 1)}
                </span>
              ))}
            </span>
          </span>
        ) : (
          <span className="text-xs text-slate-400">pas encore vue</span>
        )}
      </td>
      <td className="py-2.5 pr-3 text-right align-top tabular-nums">
        <span className="font-semibold text-slate-900">{pct(taux(c.aime, avis))}</span>
        <span className="block text-xs text-slate-500">
          {avis} avis{peu && avis > 0 ? " · trop peu" : ""}
        </span>
      </td>
      <td className="py-2.5 pr-3 text-right align-top tabular-nums">{pct(taux(c.voir, c.vue))}</td>
      <td className="py-2.5 pr-3 text-right align-top tabular-nums">{pct(taux(c.pourquoi, c.vue))}</td>
      <td className="py-2.5 text-right align-top tabular-nums">{c.refus}</td>
    </tr>
  );
}
