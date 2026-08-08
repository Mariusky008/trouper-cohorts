// /admin/humain/site-internet/lettres/[ville]
// Impression EN LOT : toutes les lettres d'une ville empilées, une par page A4.
// Cmd/Ctrl+P → Enregistrer en PDF → une pile prête à distribuer.
// Réutilise composeLetterHtml → rendu identique à la lettre unique.
//
// Les deux règles d'exclusion (déontologie, données insuffisantes) s'appliquent
// ici aussi : les prospects concernés ne sont pas imprimés, ils sont listés à
// l'écran (hors impression) avec le motif.
//
// Pour les professions réglementées, « exclu » ne veut PAS dire « rien à leur
// envoyer » : ils ont leur propre lettre — un site à 690 €, sans catalogue de
// ville — qui s'imprime depuis leur fiche. Son gabarit n'a rien de commun avec
// celui-ci, d'où l'impression une par une plutôt qu'une pile mixte. Le rapport de fin de campagne est
// également exposé dans `window.__CLIKME_RAPPORT__` pour le script de génération
// PDF par prospect (scripts/lettres-pdf.mjs).
//
// ?filet=1 → variante --no-solid-header sur toute la pile.
import { createAdminClient } from "@/lib/supabase/admin";
import {
  composeLetterHtml,
  readLetterStyles,
  rapportVide,
  ajouterAuRapport,
} from "@/lib/site-internet/letter-html";
import { FitLetter } from "../../lettre/[slug]/fit-letter";
import { PrintButton } from "../../lettre/[slug]/print-button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const str = (v: unknown) => (v == null ? "" : String(v));
const norm = (v: unknown) =>
  str(v).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
const cap = (s: string) => s.replace(/\b\p{L}/gu, (c) => c.toUpperCase());

const CORE = "id,slug,business_name,city,activite,address,google_rating,google_reviews,diagnostic,letter_status";
// `published` est dans la partie OPTIONNELLE, pas dans le socle : si la colonne
// manquait, la mettre dans CORE ferait échouer les deux requêtes et la page
// entière. Ici, le repli se contente de ne plus filtrer les clients — c'est
// exactement le comportement d'avant, donc une dégradation et non une panne.
const OPT = ",letter_overrides,published";

// On n'imprime pas les lettres écartées (décision déjà prise par l'opérateur).
const SKIP_STATUS = new Set(["skipped", "excluded"]);

/**
 * Ni celles des commerçants DÉJÀ CLIENTS : leur envoyer une lettre qui propose
 * de refaire leur site alors qu'ils viennent de le payer est le courrier le plus
 * embarrassant qu'on puisse produire.
 *
 * C'est ce que `letter_status = "client"` cherchait à obtenir. La conversion est
 * lue là où elle est réellement écrite — `published` — plutôt qu'en détournant
 * le statut de la lettre.
 */
const dejaClient = (r: Record<string, unknown>) => r.published === true;

export default async function LettresVillePage({
  params,
  searchParams,
}: {
  params: Promise<{ ville: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { ville: villeParam } = await params;
  const sp = await searchParams;
  const sansAplat = str(Array.isArray(sp.filet) ? sp.filet[0] : sp.filet) === "1";
  const ville = decodeURIComponent(villeParam || "");
  const supabase = createAdminClient();

  // Sélection tolérante : si la colonne optionnelle n'est pas migrée, on retombe
  // sur les colonnes de base sans casser.
  let rows: Array<Record<string, unknown>> = [];
  let err: string | null = null;
  {
    const full = await supabase
      .from("human_vitrine_sites")
      .select(CORE + OPT)
      .eq("channel", "letter")
      .order("activite", { ascending: true })
      .limit(1000);
    if (!full.error && Array.isArray(full.data)) {
      rows = full.data as unknown as Array<Record<string, unknown>>;
    } else {
      const base = await supabase
        .from("human_vitrine_sites")
        .select(CORE)
        .eq("channel", "letter")
        .order("activite", { ascending: true })
        .limit(1000);
      if (!base.error && Array.isArray(base.data)) rows = base.data as unknown as Array<Record<string, unknown>>;
      else err = base.error?.message || full.error?.message || "Erreur Supabase";
    }
  }

  const nv = norm(ville);
  const selected = rows
    .filter((r) => {
      const rc = norm(r.city);
      return rc === nv || rc.includes(nv) || nv.includes(rc);
    })
    .filter((r) => !SKIP_STATUS.has(str(r.letter_status)) && !dejaClient(r as Record<string, unknown>))
    .sort((a, b) => {
      const av = norm(a.activite).localeCompare(norm(b.activite), "fr");
      return av !== 0 ? av : norm(a.business_name).localeCompare(norm(b.business_name), "fr");
    });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.clikme.fr";
  const villeAff = cap(ville);

  if (err) {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif" }}>
        <h1 style={{ color: "#b91c1c" }}>Erreur</h1>
        <p><code>{err}</code></p>
        <p><a href="/admin/humain/site-internet/decouverte">← Découverte</a></p>
      </div>
    );
  }

  if (selected.length === 0) {
    return (
      <div style={{ padding: 40, fontFamily: "sans-serif" }}>
        <h1>Aucune lettre à imprimer pour « {villeAff} »</h1>
        <p>Aucun prospect (hors écartés) pour cette ville.</p>
        <p><a href="/admin/humain/site-internet/decouverte">← Découverte</a></p>
      </div>
    );
  }

  const styles = readLetterStyles();
  const composed = await Promise.all(
    selected.map(async (place) => {
      const o = place.letter_overrides;
      const overrides = o && typeof o === "object" ? (o as Record<string, string>) : {};
      const slug = str(place.slug);
      const { html, exclusion } = await composeLetterHtml({ place, overrides, slug, appUrl, sansAplat });
      return { slug, nom: str(place.business_name), html, exclusion };
    })
  );

  const rapport = composed.reduce((acc, c) => ajouterAuRapport(acc, c), rapportVide());
  const bodies = composed.filter((c) => !c.exclusion).map((c) => c.html);

  return (
    <>
      <div
        className="no-print"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
          background: "#14140F", color: "#fff", padding: "10px 20px",
          display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
          fontFamily: "sans-serif", fontSize: 14,
        }}
      >
        <span>
          <strong>{villeAff}</strong> · {rapport.genere} lettre{rapport.genere > 1 ? "s" : ""}
          {rapport.exclu_deontologie > 0 && (
            // Ces prospects ne sont pas SANS lettre : ils en ont une autre, qui
            // vend un site sans catalogue de ville. Elle s'imprime une par une
            // depuis leur fiche — son gabarit diffère de bout en bout, l'empiler
            // ici produirait une pile aux styles mélangés.
            <span style={{ marginLeft: 8, color: "#FF9A8B" }}>
              · {rapport.exclu_deontologie} en lettre « site seul » (à imprimer une par une)
            </span>
          )}
          {rapport.exclu_donnees > 0 && (
            <span style={{ marginLeft: 8, color: "#F5C86B" }}>· {rapport.exclu_donnees} exclue(s) données</span>
          )}
        </span>
        <PrintButton />
        <a
          href={sansAplat
            ? `/admin/humain/site-internet/lettres/${encodeURIComponent(ville)}`
            : `/admin/humain/site-internet/lettres/${encodeURIComponent(ville)}?filet=1`}
          style={{ color: "#00E0A0", textDecoration: "none" }}
        >
          {sansAplat ? "Bandeau plein" : "Bandeau au filet"}
        </a>
        <a href="/admin/humain/site-internet/decouverte" style={{ color: "#00E0A0", textDecoration: "none" }}>← Découverte</a>
        <span style={{ marginLeft: "auto", opacity: 0.6 }}>Cmd/Ctrl+P → Enregistrer en PDF</span>
      </div>

      {rapport.details.length > 0 && (
        <div
          className="no-print"
          style={{
            margin: "56px auto 20px", maxWidth: 900, background: "#FFF8E7",
            border: "1px solid #E6D9AE", borderRadius: 10, padding: "14px 18px",
            fontFamily: "sans-serif", fontSize: 13, lineHeight: 1.6, color: "#4A3B12",
          }}
        >
          <strong>Non imprimés ({rapport.details.length})</strong>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
            {rapport.details.map((d) => (
              <li key={d.slug}>
                <b>{d.nom || d.slug}</b> — {d.detail}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Le script de génération PDF par prospect lit ce rapport plutôt que de
          recompter à sa façon : une seule vérité sur qui a été exclu, et pourquoi. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__CLIKME_RAPPORT__=${JSON.stringify(rapport).replace(/</g, "\\u003c")};`,
        }}
      />

      <div id="letter-root" className="si-root" style={{ paddingTop: 8 }} dangerouslySetInnerHTML={{ __html: styles + bodies.join("") }} />
      <FitLetter />
    </>
  );
}
