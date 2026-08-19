// ÉCRAN 3 — MES COMMERCES.
//
// Deux onglets internes : ce que j'ai gardé, et les commerces que je suis.
//
// Les gardées sont triées par ÉCHÉANCE, pas par date d'ajout : ce qui expire
// aujourd'hui doit être en tête, sinon la liste devient une archive et l'offre
// se périme sans avoir servi. C'est le seul tri qui rend cet écran utile.
import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { configVille } from "@/lib/direct/ville";
import { habitantCourant, suivis, barreCoeurs, coeurs, PALIER_AVANTAGE } from "@/lib/direct/habitant";
import { estVivante, type Publication } from "@/lib/direct/publications";
import { lirePrix } from "@/lib/direct/prix";
import { echeanceCourte } from "@/lib/site-internet/echeance";
import { presse } from "@/lib/direct/fil";
import QRCode from "qrcode";
import { mesClics } from "@/lib/direct/engagements";
import { MesClics } from "./mes-clics";
import { GardeeLigne } from "./gardee-ligne";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const str = (v: unknown) => (v == null ? "" : String(v));

export async function generateMetadata({ params }: { params: Promise<{ ville: string }> }): Promise<Metadata> {
  const { ville } = await params;
  const cfg = await configVille(createAdminClient(), ville);
  return { title: `Mes Clics — ${cfg.nom}`, robots: { index: false } };
}

/**
 * Les gardées encore vivantes, triées par échéance.
 *
 * Hors du composant : c'est une lecture de base avec une horloge, et la faire
 * pendant le rendu rendrait le résultat dépendant du moment où React se relance.
 */
async function chargerGardees(
  supabase: ReturnType<typeof createAdminClient>,
  habitantId: string
): Promise<Publication[]> {
  const BASE =
    "id, famille, texte, photo, video, lien, auteur_nom, auteur_metier, auteur_slug, site_id, publie_le, expire_le, retire_le";
  const lire = (champs: string) =>
    supabase.from("human_gardees").select(`publication_id, human_publications!inner(${champs})`).eq("habitant_id", habitantId);
  try {
    // Les deux colonnes récentes en premier, puis sans elles : PostgREST refuse
    // TOUTE la requête quand une seule colonne demandée n'existe pas, et une
    // migration non appliquée ne doit pas vider les gardées de quelqu'un.
    const premier = await lire(`${BASE}, reste, ardoise, prix`);
    const { data } = premier.error ? await lire(BASE) : premier;
    const maintenant = Date.now();
    // `as unknown` d'abord : la sélection est construite à l'exécution (deux
    // listes de colonnes possibles), le typage statique de PostgREST ne peut
    // donc pas la déduire.
    return ((Array.isArray(data) ? data : []) as unknown as Array<Record<string, unknown>>)
      .map((r) => r.human_publications as Record<string, unknown> | null)
      .filter((p): p is Record<string, unknown> => Boolean(p) && !str(p!.retire_le))
      .map((p) => ({
        id: str(p.id),
        famille: (str(p.famille) || "offre") as Publication["famille"],
        texte: str(p.texte),
        photo: str(p.photo) || null,
        video: str(p.video) || null,
        lien: str(p.lien) || null,
        auteurNom: str(p.auteur_nom) || "Un commerce",
        auteurMetier: str(p.auteur_metier),
        auteurSlug: str(p.auteur_slug),
        siteId: str(p.site_id) || null,
        publieLe: str(p.publie_le),
        expireLe: str(p.expire_le) || null,
        lat: null,
        lng: null,
        quartier: "",
        reste: str(p.reste).trim().slice(0, 40),
        ardoise: /^https?:\/\//i.test(str(p.ardoise)) ? str(p.ardoise) : null,
        prix: lirePrix(p.prix),
      }))
      // Une gardée expirée n'est pas une gardée : elle ne peut plus servir, et
      // la laisser donnerait l'impression d'une offre qu'on a laissée filer.
      .filter((p) => estVivante(p, maintenant))
      // TRI PAR ÉCHÉANCE. Sans échéance = à la fin : rien ne presse. C'est le
      // seul tri qui rend cet écran utile — par date d'ajout, il devient une
      // archive et l'offre se périme sans avoir servi.
      .sort((a, b) => {
        const ea = a.expireLe ? Date.parse(a.expireLe) : Number.MAX_SAFE_INTEGER;
        const eb = b.expireLe ? Date.parse(b.expireLe) : Number.MAX_SAFE_INTEGER;
        return ea - eb;
      });
  } catch {
    return [];
  }
}

/** Combien de ces gardées expirent avant ce soir. */
function expirantAujourdhui(ps: Publication[]): number {
  const finJour = new Date();
  finJour.setHours(23, 59, 59, 999);
  return ps.filter((p) => p.expireLe && Date.parse(p.expireLe) <= finJour.getTime()).length;
}

const moisDepuis = (iso: string): string => {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const j = Math.floor((Date.now() - t) / 86400000);
  if (j < 7) return "cette semaine";
  if (j < 35) return `depuis ${Math.max(1, Math.round(j / 7))} semaine${j >= 14 ? "s" : ""}`;
  return `depuis ${Math.round(j / 30)} mois`;
};

export default async function MesCommercesPage({
  params,
  searchParams,
}: {
  params: Promise<{ ville: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { ville } = await params;
  const sp = await searchParams;
  // TROIS ONGLETS INTERNES, et « Mes Clics » en premier : c'est ce qu'on vient
  // chercher ici. Les gardées sont un pense-bête, les suivis un réglage ; le
  // code à présenter, lui, se cherche en poussant la porte d'un commerce.
  const brut = String(Array.isArray(sp.t) ? sp.t[0] : sp.t || "");
  const onglet = brut === "suivis" ? "suivis" : brut === "gardees" ? "gardees" : "clics";

  const supabase = createAdminClient();
  const habitant = await habitantCourant(supabase);

  const gardeesVives = habitant ? await chargerGardees(supabase, habitant.id) : [];

  const expirentAujourdhui = expirantAujourdhui(gardeesVives);

  // ── Les commerces suivis ──────────────────────────────────────────────────
  const mesSuivis = habitant ? await suivis(supabase, habitant.id) : [];
  const fiches = new Map<string, Record<string, unknown>>();
  if (mesSuivis.length) {
    try {
      const { data } = await supabase
        .from("human_vitrine_sites")
        .select("id, slug, business_name, activite")
        .in("id", mesSuivis.map((s) => s.siteId));
      for (const r of (Array.isArray(data) ? data : []) as Array<Record<string, unknown>>) fiches.set(str(r.id), r);
    } catch {
      /* fiche introuvable → la ligne ne s'affiche pas, plutôt qu'une ligne vide */
    }
  }

  // MES CLICS, et le QR de chaque code. Le QR est encodé ICI et pas dans le
  // navigateur : devant un comptoir, le réseau ne passe pas toujours, et une
  // image qui reste à charger au moment de payer ne sert à rien.
  const clics = habitant ? await mesClics(supabase, habitant.id) : [];
  const qr = new Map<string, string>();
  for (const c of clics) {
    try {
      qr.set(c.code, await QRCode.toDataURL(c.code, { margin: 0, width: 184, color: { dark: "#0E2A1C", light: "#FFFFFF" } }));
    } catch {
      /* sans QR, le code écrit en clair fait le travail */
    }
  }

  const racine = `/ville/${ville}/mes-commerces`;

  return (
    <>
      <header className="fhead">
        <h1>Mes Clics</h1>
        <div className="upd">
          {clics.length > 0
            ? `${clics.length} Clic${clics.length > 1 ? "s" : ""} en cours · `
            : ""}
          {gardeesVives.length} gardée{gardeesVives.length > 1 ? "s" : ""} · {mesSuivis.length} commerce
          {mesSuivis.length > 1 ? "s" : ""} suivi{mesSuivis.length > 1 ? "s" : ""}
        </div>
      </header>

      <nav className="tabs" aria-label="Mes Clics">
        <Link href={racine} className={onglet === "clics" ? "on" : undefined} scroll={false}>Mes Clics</Link>
        <Link href={`${racine}?t=gardees`} className={onglet === "gardees" ? "on" : undefined} scroll={false}>Gardées</Link>
        <Link href={`${racine}?t=suivis`} className={onglet === "suivis" ? "on" : undefined} scroll={false}>Je suis</Link>
      </nav>

      {onglet === "clics" ? (
        <>
          {clics.length > 0 && (
            <div className="sect">
              <div className="st">À présenter au commerce</div>
              <div className="ss">votre code suffit</div>
            </div>
          )}
          <MesClics clics={clics} qr={qr} ville={ville} prenom={habitant?.prenom ?? ""} />
        </>
      ) : onglet === "gardees" ? (
        gardeesVives.length > 0 ? (
          <>
            <div className="sect">
              <div className="st">À utiliser bientôt</div>
              <div className="ss">
                {expirentAujourdhui > 0
                  ? `${expirentAujourdhui} expire${expirentAujourdhui > 1 ? "nt" : ""} aujourd'hui`
                  : "les plus urgentes en tête"}
              </div>
            </div>
            {/* EN LIGNES, PAS EN CARTES DU FIL. Rendues avec le composant
                complet, les gardées donnaient l'impression de relire le fil
                dans un autre onglet — et « ce qui expire aujourd'hui », la
                seule chose qu'on vient vérifier, s'y perdait. */}
            <div className="feed">
              {gardeesVives.map((p) => (
                <GardeeLigne
                  key={p.id}
                  id={p.id}
                  ville={ville}
                  texte={p.texte}
                  photo={p.photo}
                  auteurNom={p.auteurNom}
                  auteurSlug={p.auteurSlug}
                  echeance={echeanceCourte(p.expireLe)}
                  urgent={presse(p.expireLe)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="vide">
            <h3>Rien de gardé pour l&apos;instant</h3>
            <p>
              Sur le fil, touchez le ♡ d&apos;une offre pour la retrouver ici. Rien ne vous est demandé —
              ni compte, ni adresse.
            </p>
          </div>
        )
      ) : mesSuivis.length > 0 ? (
        <>
          <div className="sect">
            <div className="st">Commerces suivis</div>
            <div className="ss">vous êtes prévenu quand ils publient</div>
          </div>
          <div className="feed">
            {mesSuivis.map((s) => {
              const f = fiches.get(s.siteId);
              if (!f) return null;
              const nom = str(f.business_name) || "Un commerce";
              const { resteAvantAvantage } = coeurs(s.visites);
              return (
                <div className="mc" key={s.siteId}>
                  <span className="av" aria-hidden="true">{nom.charAt(0).toUpperCase()}</span>
                  <div>
                    <div className="nm">{nom}</div>
                    <div className="sb">
                      Suivi {moisDepuis(s.depuis)}
                      {s.visites > 0 ? ` · ${s.visites} visite${s.visites > 1 ? "s" : ""}` : ""}
                    </div>
                    <div className="rel">
                      <span className="hearts" aria-label={`${s.visites} visites sur ${PALIER_AVANTAGE}`}>
                        {barreCoeurs(s.visites)}
                      </span>
                      {resteAvantAvantage > 0 && resteAvantAvantage <= 2 && (
                        <span className="adv">
                          Avantage habitué dans {resteAvantAvantage} visite{resteAvantAvantage > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link href={`/site-internet/apercu/${str(f.slug)}?via=direct`} className="go" aria-label={`Ouvrir ${nom}`} prefetch={false}>›</Link>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="vide">
          <h3>Vous ne suivez encore personne</h3>
          <p>
            Depuis la page d&apos;un commerce, choisissez « Suivre » pour être prévenu quand il publie
            quelque chose. C&apos;est le seul geste social du Direct — ni commentaire, ni note publique.
          </p>
        </div>
      )}
    </>
  );
}
