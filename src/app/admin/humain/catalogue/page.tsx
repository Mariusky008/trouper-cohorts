import Link from "next/link";
import { getAdminMarketplaceSnapshot } from "@/lib/actions/human-marketplace";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SnapPlace = {
  id: string;
  city?: string | null;
  sphere_label?: string | null;
  metier?: string | null;
  status?: string | null;
  owner_member_id?: string | null;
  company_name?: string | null;
  privilege_badge?: string | null;
  partner_whatsapp?: string | null;
  category_key?: string | null;
  external_ref?: string | null;
  offer_photo_url?: string | null;
  offer_website_url?: string | null;
  offer_description?: string | null;
  owner_display_name?: string | null;
  owner_profile_photo_url?: string | null;
  offer_expires_at?: string | null;
  direct_contact?: string | null;
  partner_offer_value_eur?: number | string | null;
};
type ExtraFields = Record<string, unknown>;

type CataloguePageProps = {
  searchParams?: Promise<{
    city?: string;
    marketStatus?: string;
    marketMessage?: string;
    showAll?: string;
  }>;
};

const NEW_COLS =
  "id,promo_code,offer_address,total_spots,offer_video_url,coup_de_coeur_text,is_mystery_offer,mystery_deal_label,pro_slug";

// Récupère les nouveaux champs (résilient : si migration pas appliquée → map vide,
// le formulaire affiche vide et la sauvegarde reste possible côté write path).
async function fetchExtraFields(placeIds: string[]): Promise<Record<string, ExtraFields>> {
  if (!placeIds.length) return {};
  try {
    const admin = createAdminClient();
    const res = await admin.from("human_marketplace_places").select(NEW_COLS).in("id", placeIds).limit(2000);
    if (res.error || !res.data) return {};
    const map: Record<string, ExtraFields> = {};
    (res.data as ExtraFields[]).forEach((row) => {
      const id = String((row as { id?: string }).id || "");
      if (id) map[id] = row;
    });
    return map;
  } catch {
    return {};
  }
}

type Stats = { view: number; favorite: number; reserve: number; card_open: number; mystery_reveal: number };

// Agrège les events d'engagement du mois courant par place (résilient).
async function fetchEngagementStats(placeIds: string[]): Promise<Record<string, Stats>> {
  const empty: Record<string, Stats> = {};
  if (!placeIds.length) return empty;
  try {
    const admin = createAdminClient();
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const res = await admin
      .from("human_marketplace_events")
      .select("place_id,event_type")
      .in("place_id", placeIds)
      .like("event_type", "priv_%")
      .gte("created_at", monthStart)
      .limit(20000);
    if (res.error || !res.data) return empty;
    const map: Record<string, Stats> = {};
    (res.data as Array<{ place_id: string | null; event_type: string | null }>).forEach((r) => {
      const id = String(r.place_id || "");
      if (!id) return;
      const ev = String(r.event_type || "").replace("priv_", "");
      if (!map[id]) map[id] = { view: 0, favorite: 0, reserve: 0, card_open: 0, mystery_reveal: 0 };
      if (ev === "view" || ev === "favorite" || ev === "reserve" || ev === "card_open" || ev === "mystery_reveal") {
        map[id][ev] += 1;
      }
    });
    return map;
  } catch {
    return empty;
  }
}

function StatBar({ st }: { st?: Stats }) {
  const v = st || { view: 0, favorite: 0, reserve: 0, card_open: 0, mystery_reveal: 0 };
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 bg-slate-50 px-4 py-2 text-[11px] text-slate-600">
      <span className="font-bold uppercase tracking-wide text-slate-400">📊 Ce mois</span>
      <span>👁 <strong className="text-slate-800">{v.view}</strong> vues</span>
      <span>❤️ <strong className="text-slate-800">{v.favorite}</strong> favoris</span>
      <span>💬 <strong className="text-slate-800">{v.reserve}</strong> réserv.</span>
      <span>🎟️ <strong className="text-slate-800">{v.card_open}</strong> cartes</span>
    </div>
  );
}

// Détecte si les colonnes des migrations existent (sinon les nouveaux champs
// sont silencieusement abandonnés à la sauvegarde → on prévient l'admin).
async function catalogueColumnsReady(): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const r = await admin
      .from("human_marketplace_places")
      .select("promo_code,offer_video_url,total_spots,is_mystery_offer,pro_slug")
      .limit(1);
    return !r.error;
  } catch {
    return false;
  }
}

function isConfigured(place: SnapPlace): boolean {
  return Boolean(String(place.company_name || "").trim() || String(place.privilege_badge || "").trim());
}

function s(value: unknown): string {
  return value == null ? "" : String(value);
}

function CatalogueOfferForm({
  place,
  extra,
  members,
  cityParam,
}: {
  place: SnapPlace;
  extra: ExtraFields | undefined;
  members: Array<{ id: string; label: string }>;
  cityParam: string;
}) {
  const currentUrl = `/admin/humain/catalogue?city=${encodeURIComponent(cityParam)}`;
  const expires = s(place.offer_expires_at).slice(0, 10);
  const isMystery = Boolean(extra?.is_mystery_offer);
  return (
    <form
      action="/api/admin/humain/marketplace/places/update"
      method="post"
      encType="multipart/form-data"
      className="grid gap-3 border-t border-slate-200 p-4 md:grid-cols-2"
    >
      <input type="hidden" name="current_url" value={currentUrl} />
      <input type="hidden" name="place_id" value={place.id} />
      <input type="hidden" name="next_status" value={place.status || "reserved"} />
      {/* Préserve la référence externe (le write path la nullifie si absente) */}
      <input type="hidden" name="external_ref" value={s(place.external_ref)} />

      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Owner membre</span>
        <select name="owner_member_id" defaultValue={s(place.owner_member_id)} className="h-10 w-full rounded border bg-background px-2 text-sm">
          <option value="">Aucun</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Nom commerce affiché</span>
        <input name="company_name" defaultValue={s(place.company_name)} placeholder="Ex: Atelier Landes" className="h-10 w-full rounded border bg-background px-3 text-sm" />
      </label>

      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Nom personne (carte)</span>
        <input name="owner_display_name" defaultValue={s(place.owner_display_name)} placeholder="Ex: Antonin Lemaire" className="h-10 w-full rounded border bg-background px-3 text-sm" />
      </label>

      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-amber-700">🎟️ Code promo (visible sur l&apos;offre)</span>
        <input name="promo_code" defaultValue={s(extra?.promo_code)} placeholder="Ex: POPEY-SPORT-25" className="h-10 w-full rounded border border-amber-300 bg-amber-50 px-3 text-sm font-bold uppercase tracking-wide" />
      </label>

      <label className="space-y-1 md:col-span-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Offre privilège (titre visible sur la carte)</span>
        <input name="privilege_badge" defaultValue={s(place.privilege_badge)} placeholder="Ex: 1er mois offert / -500€ honoraires" className="h-10 w-full rounded border bg-background px-3 text-sm" />
      </label>

      <label className="space-y-1 md:col-span-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Descriptif de l&apos;offre</span>
        <textarea name="offer_description" defaultValue={s(place.offer_description)} placeholder="Bénéfice client, conditions, durée…" className="min-h-20 w-full rounded border bg-background px-3 py-2 text-sm" />
      </label>

      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Valeur / prix (€)</span>
        <input name="partner_offer_value_eur" type="number" min="0" step="0.01" defaultValue={place.partner_offer_value_eur ? String(place.partner_offer_value_eur) : ""} placeholder="Ex: 240" className="h-10 w-full rounded border bg-background px-3 text-sm" />
      </label>

      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Nombre de places total</span>
        <input name="total_spots" type="number" min="0" step="1" defaultValue={s(extra?.total_spots)} placeholder="Ex: 6" className="h-10 w-full rounded border bg-background px-3 text-sm" />
      </label>

      <label className="space-y-1 md:col-span-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Adresse (+ infos)</span>
        <input name="offer_address" defaultValue={s(extra?.offer_address)} placeholder="12 Rue des Sports, 40100 Dax" className="h-10 w-full rounded border bg-background px-3 text-sm" />
      </label>

      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Site web</span>
        <input name="offer_website_url" defaultValue={s(place.offer_website_url)} placeholder="https://..." className="h-10 w-full rounded border bg-background px-3 text-sm" />
      </label>

      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">WhatsApp partenaire</span>
        <input name="partner_whatsapp" defaultValue={s(place.partner_whatsapp)} placeholder="+336..." className="h-10 w-full rounded border bg-background px-3 text-sm" />
      </label>

      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Téléphone / contact direct</span>
        <input name="direct_contact" defaultValue={s(place.direct_contact)} placeholder="+33..., email…" className="h-10 w-full rounded border bg-background px-3 text-sm" />
      </label>

      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Date de péremption (chrono)</span>
        <input name="offer_expires_at" type="date" defaultValue={expires} className="h-10 w-full rounded border bg-background px-3 text-sm" />
      </label>

      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Catégorie</span>
        <select name="category_key" defaultValue={s(place.category_key)} className="h-10 w-full rounded border bg-background px-2 text-sm">
          <option value="">Auto</option>
          <option value="maison">maison</option>
          <option value="evenements-locaux">evenements-locaux</option>
          <option value="sante">sante</option>
          <option value="travaux">travaux</option>
          <option value="bien-etre">bien-etre</option>
          <option value="services">services</option>
        </select>
      </label>

      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Photo (URL)</span>
        <input name="offer_photo_url" defaultValue={s(place.offer_photo_url)} placeholder="https://.../photo.jpg" className="h-10 w-full rounded border bg-background px-3 text-sm" />
      </label>

      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Photo (upload)</span>
        <input name="offer_photo_file" type="file" accept="image/*" className="h-10 w-full rounded border bg-background px-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-amber-100 file:px-3 file:py-1 file:text-xs file:font-bold file:text-amber-900" />
      </label>

      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Photo profil (URL)</span>
        <input name="owner_profile_photo_url" defaultValue={s(place.owner_profile_photo_url)} placeholder="https://.../profil.jpg" className="h-10 w-full rounded border bg-background px-3 text-sm" />
      </label>

      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-sky-700">🎬 Vidéo verticale (URL .mp4)</span>
        <input name="offer_video_url" defaultValue={s(extra?.offer_video_url)} placeholder="https://.../video.mp4" className="h-10 w-full rounded border border-sky-300 bg-sky-50 px-3 text-sm" />
      </label>

      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-sky-700">🎬 Vidéo (upload direct .mp4/.webm)</span>
        <input name="offer_video_file" type="file" accept="video/*" className="h-10 w-full rounded border bg-background px-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-sky-100 file:px-3 file:py-1 file:text-xs file:font-bold file:text-sky-900" />
      </label>

      <label className="space-y-1 md:col-span-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-pink-700">💖 Coup de cœur du membre (note)</span>
        <textarea name="coup_de_coeur_text" defaultValue={s(extra?.coup_de_coeur_text)} placeholder="Ex: J'ai testé Antonin moi-même, résultats bluffants en 1 mois." className="min-h-16 w-full rounded border border-pink-200 bg-pink-50 px-3 py-2 text-sm" />
      </label>

      <div className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 md:col-span-2">
        <input type="checkbox" id={`mystery-${place.id}`} name="is_mystery_offer" value="on" defaultChecked={isMystery} className="h-4 w-4" />
        <label htmlFor={`mystery-${place.id}`} className="text-[12px] font-bold text-violet-800">
          🎁 Offre mystère (resto/spa — révélée tous les 4 swipes)
        </label>
        <input name="mystery_deal_label" defaultValue={s(extra?.mystery_deal_label)} placeholder="Deal mystère (ex: -50%, Gratuit)" className="ml-auto h-9 w-44 rounded border border-violet-300 bg-white px-2 text-sm" />
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1 md:col-span-2">
        <button type="submit" className="inline-flex h-10 items-center rounded border border-emerald-300 bg-emerald-50 px-4 text-xs font-black uppercase tracking-wide text-emerald-800">
          💾 Enregistrer cette offre
        </button>
        <button
          type="submit"
          name="intent"
          value="clear_privilege"
          className="inline-flex h-10 items-center rounded border border-red-200 bg-red-50 px-4 text-xs font-black uppercase tracking-wide text-red-700"
        >
          Retirer du catalogue
        </button>
      </div>
    </form>
  );
}

export default async function AdminCataloguePage({ searchParams }: CataloguePageProps) {
  const qp = (await searchParams) || {};
  const marketStatus = typeof qp.marketStatus === "string" ? qp.marketStatus : "";
  const marketMessage = typeof qp.marketMessage === "string" ? qp.marketMessage : "";
  const showAll = qp.showAll === "1";

  const snapshot = await getAdminMarketplaceSnapshot({ placeCity: "all" });

  if (snapshot.error) {
    return (
      <section className="space-y-4 p-4">
        <h1 className="text-2xl font-black">Catalogue Privilège</h1>
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{snapshot.error}</p>
      </section>
    );
  }

  const places = ((snapshot.places || []) as unknown) as SnapPlace[];
  const members = ((snapshot.members || []) as unknown) as Array<{ id: string; label: string }>;
  const cities = Array.from(new Set(places.map((p) => String(p.city || "").trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "fr"),
  );
  const selectedCity = (typeof qp.city === "string" && qp.city) || cities[0] || "";
  const cityPlaces = places.filter((p) => String(p.city || "").trim() === selectedCity);
  const configured = cityPlaces.filter(isConfigured);
  const available = cityPlaces.filter((p) => !isConfigured(p));

  const extra = await fetchExtraFields(cityPlaces.map((p) => p.id));
  const stats = await fetchEngagementStats(configured.map((p) => p.id));
  const colsReady = await catalogueColumnsReady();
  const cityTotals = configured.reduce(
    (acc, p) => {
      const st = stats[p.id];
      if (st) {
        acc.view += st.view;
        acc.favorite += st.favorite;
        acc.reserve += st.reserve;
      }
      return acc;
    },
    { view: 0, favorite: 0, reserve: 0 },
  );

  // Lien "espace commerçant" court & lisible : /privilege/pro?p=<slug> (fallback id).
  const appBase = String(process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");
  const merchantLinks: Record<string, string> = {};
  configured.forEach((p) => {
    const slug = String((extra[p.id] as { pro_slug?: string } | undefined)?.pro_slug || p.id);
    merchantLinks[p.id] = (appBase || "") + "/privilege/pro?p=" + encodeURIComponent(slug);
  });

  const bySphere = configured.reduce<Record<string, SnapPlace[]>>((acc, p) => {
    const k = String(p.sphere_label || "Autres");
    (acc[k] = acc[k] || []).push(p);
    return acc;
  }, {});

  return (
    <section className="mx-auto max-w-5xl space-y-5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Popey · Admin</p>
          <h1 className="text-3xl font-black">Catalogue Privilège</h1>
          <p className="text-sm text-muted-foreground">
            Tout sur une page : pour chaque commerçant, son offre, son code promo et tous les médias visibles dans le catalogue swipe.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/humain/catalogue/scores"
            className="inline-flex h-9 items-center rounded border border-amber-300 bg-amber-50 px-3 text-[11px] font-black uppercase tracking-wide text-amber-800"
          >
            📊 Tableau des scores
          </Link>
          <Link
            href="/admin/humain/marketplace"
            className="inline-flex h-9 items-center rounded border px-3 text-[11px] font-black uppercase tracking-wide text-muted-foreground"
          >
            Ancienne page marketplace
          </Link>
        </div>
      </div>

      {!colsReady ? (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          ⚠️ <strong>Migrations SQL non appliquées.</strong> Les champs <strong>code promo, vidéo, adresse, nombre de places,
          coup de cœur, offre mystère</strong> ne seront PAS enregistrés tant que les 3 migrations ne sont pas exécutées dans
          Supabase (SQL Editor) : <code>20260606120000</code>, <code>20260606130000</code>, <code>20260606140000</code>. Les
          autres champs (offre, photo, prix, site, téléphone…) fonctionnent normalement.
        </p>
      ) : null}
      {marketStatus === "success" ? (
        <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{marketMessage || "Enregistré."}</p>
      ) : null}
      {marketStatus === "error" ? (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{marketMessage || "Erreur."}</p>
      ) : null}

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-3">
        <label className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Ville</span>
          <select name="city" defaultValue={selectedCity} className="h-10 min-w-44 rounded border bg-background px-2 text-sm">
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <button className="h-10 rounded border border-sky-300 bg-sky-50 px-4 text-xs font-black uppercase tracking-wide text-sky-800">
          Afficher
        </button>
        <div className="ml-auto flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            <strong className="text-emerald-700">{configured.length}</strong> en ligne
          </span>
          <span>
            <strong>{available.length}</strong> libres
          </span>
          <span className="text-slate-400">·</span>
          <span>👁 <strong className="text-slate-800">{cityTotals.view}</strong></span>
          <span>❤️ <strong className="text-slate-800">{cityTotals.favorite}</strong></span>
          <span>💬 <strong className="text-slate-800">{cityTotals.reserve}</strong> <span className="text-slate-400">ce mois</span></span>
        </div>
      </form>

      {/* Offres configurées (en ligne dans le catalogue) */}
      <div className="space-y-4">
        <h2 className="text-lg font-black">Offres en ligne — {selectedCity || "—"}</h2>
        {configured.length === 0 ? (
          <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Aucune offre configurée pour cette ville. Configure un emplacement libre ci-dessous.
          </p>
        ) : null}
        {Object.keys(bySphere).map((sphere) => (
          <div key={sphere} className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">{sphere}</p>
            {bySphere[sphere].map((p) => (
              <details key={p.id} className="overflow-hidden rounded-xl border bg-white">
                <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-3 text-sm">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-700">en ligne</span>
                  <strong>{s(p.company_name) || s(p.metier)}</strong>
                  <span className="text-muted-foreground">· {s(p.metier)}</span>
                  {s(extra[p.id]?.promo_code) ? (
                    <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-900">
                      {s(extra[p.id]?.promo_code)}
                    </span>
                  ) : (
                    <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">code promo manquant</span>
                  )}
                  <span className="ml-auto text-[11px] text-sky-600">modifier ▾</span>
                </summary>
                <StatBar st={stats[p.id]} />
                {merchantLinks[p.id] ? (
                  <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-white px-4 py-2 text-[11px]">
                    <span className="shrink-0 font-bold uppercase tracking-wide text-slate-400">🔗 Lien commerçant (stats)</span>
                    <input
                      readOnly
                      value={merchantLinks[p.id]}
                      className="min-w-0 flex-1 rounded border bg-slate-50 px-2 py-1 font-mono text-[10px] text-slate-600"
                    />
                  </div>
                ) : null}
                <CatalogueOfferForm place={p} extra={extra[p.id]} members={members} cityParam={selectedCity} />
              </details>
            ))}
          </div>
        ))}
      </div>

      {/* Emplacements libres à configurer (inscription d'un nouveau commerçant) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">Inscrire un commerçant — emplacements libres</h2>
          {!showAll && available.length > 12 ? (
            <Link
              href={`/admin/humain/catalogue?city=${encodeURIComponent(selectedCity)}&showAll=1`}
              className="text-[11px] font-black uppercase tracking-wide text-sky-700"
            >
              Voir tous ({available.length})
            </Link>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          Choisis un métier libre, renseigne l&apos;offre + le code promo, puis enregistre : l&apos;offre apparaît aussitôt dans le catalogue.
        </p>
        {(showAll ? available : available.slice(0, 12)).map((p) => (
          <details key={p.id} className="overflow-hidden rounded-xl border border-dashed bg-white">
            <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-3 text-sm">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-500">libre</span>
              <strong>{s(p.metier)}</strong>
              <span className="text-muted-foreground">· {s(p.sphere_label)}</span>
              <span className="ml-auto text-[11px] text-sky-600">configurer ▾</span>
            </summary>
            <CatalogueOfferForm place={p} extra={extra[p.id]} members={members} cityParam={selectedCity} />
          </details>
        ))}
        {available.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tous les emplacements de cette ville sont configurés.</p>
        ) : null}
      </div>
    </section>
  );
}
