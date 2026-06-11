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

// ── Profils Tinder commerçants ──
async function fetchTinderProfiles(): Promise<TinderProfile[]> {
  try {
    const admin = createAdminClient();
    const r = await admin
      .from("human_privilege_tinder_profiles")
      .select("id,city,pro_name,age,pro_title,bio,tags,compat,match_gift,coupon_code,photo_url,address,phone,website,wa_phone,consent,status,sort_order")
      .order("city", { ascending: true })
      .order("sort_order", { ascending: true })
      .limit(500);
    if (r.error || !r.data) return [];
    return r.data as unknown as TinderProfile[];
  } catch {
    return [];
  }
}

async function fetchTinderFrequency(): Promise<number> {
  try {
    const admin = createAdminClient();
    const r = await admin.from("human_privilege_catalogue_settings").select("value").eq("key", "tinder_frequency").maybeSingle();
    const n = parseInt(String((r.data as { value?: string } | null)?.value || ""), 10);
    return Number.isFinite(n) && n >= 1 ? n : 3;
  } catch {
    return 3;
  }
}

async function fetchTinderStats(): Promise<Record<string, TinderStat>> {
  const map: Record<string, TinderStat> = {};
  try {
    const admin = createAdminClient();
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const r = await admin
      .from("human_marketplace_events")
      .select("event_type,payload")
      .like("event_type", "priv_tinder_%")
      .gte("created_at", monthStart)
      .limit(20000);
    if (r.error || !r.data) return map;
    (r.data as Array<{ event_type: string | null; payload: Record<string, unknown> | null }>).forEach((row) => {
      const pid = String((row.payload || {}).profile_id || "");
      if (!pid) return;
      if (!map[pid]) map[pid] = { shown: 0, match: 0, wa: 0 };
      const ev = String(row.event_type || "");
      if (ev === "priv_tinder_shown") map[pid].shown += 1;
      else if (ev === "priv_tinder_match") map[pid].match += 1;
      else if (ev === "priv_tinder_wa") map[pid].wa += 1;
    });
    return map;
  } catch {
    return map;
  }
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
  isNew = false,
}: {
  place: SnapPlace;
  extra: ExtraFields | undefined;
  members: Array<{ id: string; label: string }>;
  cityParam: string;
  isNew?: boolean;
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
      {isNew ? (
        <>
          <input type="hidden" name="intent" value="create_place" />
          <input type="hidden" name="city" value={cityParam} />
          <label className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-amber-700">Métier (libre)</span>
            <input name="new_metier" placeholder="Ex: Praticien shiatsu" required className="h-10 w-full rounded border border-amber-300 bg-amber-50 px-3 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-amber-700">Sphère</span>
            <select name="sphere_key" defaultValue="digital" className="h-10 w-full rounded border border-amber-300 bg-amber-50 px-2 text-sm">
              <option value="sante">Santé · Bien-être</option>
              <option value="habitat">Habitat · Patrimoine</option>
              <option value="digital">Digital · Business</option>
              <option value="mariage">Mariage · Évènementiel</option>
              <option value="finance">Finance · Juridique</option>
              <option value="evenements-locaux">Évènements locaux</option>
            </select>
          </label>
        </>
      ) : (
        <>
          <input type="hidden" name="place_id" value={place.id} />
          <input type="hidden" name="next_status" value={place.status || "reserved"} />
          {/* Préserve la référence externe (le write path la nullifie si absente) */}
          <input type="hidden" name="external_ref" value={s(place.external_ref)} />
        </>
      )}

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
        {s(place.offer_photo_url) ? (
          <span className="mt-1 flex items-center gap-2 text-[11px] text-emerald-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s(place.offer_photo_url)} alt="" className="h-12 w-12 rounded object-cover border" />
            ✓ Photo enregistrée (le champ fichier reste vide, c&apos;est normal — la photo ci-contre est bien sauvegardée).
          </span>
        ) : null}
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
          {isNew ? "➕ Créer ce commerçant" : "💾 Enregistrer cette offre"}
        </button>
        {!isNew ? (
          <button
            type="submit"
            name="intent"
            value="clear_privilege"
            className="inline-flex h-10 items-center rounded border border-red-200 bg-red-50 px-4 text-xs font-black uppercase tracking-wide text-red-700"
          >
            Retirer du catalogue
          </button>
        ) : null}
      </div>
    </form>
  );
}

type LocalEvent = {
  id: string;
  city: string;
  title: string;
  day_label: string;
  place_label: string;
  emoji?: string | null;
  badge?: string | null;
  sponsor_names?: string | null;
  image_url?: string | null;
  details?: string | null;
  sort_order?: number | null;
  status?: string | null;
  event_date?: string | null;
  event_type?: string | null;
};

const EVENT_TYPES: { value: string; label: string }[] = [
  { value: "", label: "— Type (auto) —" },
  { value: "concert", label: "🎵 Concert" },
  { value: "spectacle", label: "🎭 Spectacle" },
  { value: "marche", label: "🧺 Marché" },
  { value: "expo", label: "🖼️ Expo / Musée" },
  { value: "sport", label: "🏅 Sport" },
  { value: "atelier", label: "🛠️ Atelier" },
  { value: "fete", label: "🎉 Fête / Soirée" },
  { value: "food", label: "🍽️ Food / Dégustation" },
];

function EventForm({ event, cityParam, isNew = false }: { event?: LocalEvent; cityParam: string; isNew?: boolean }) {
  const e = event || ({} as LocalEvent);
  const currentUrl = `/admin/humain/catalogue?city=${encodeURIComponent(cityParam)}`;
  const inp = "h-9 w-full rounded border bg-background px-2 text-sm";
  const lbl = "text-[11px] font-bold uppercase tracking-wide text-muted-foreground";
  return (
    <form action="/api/admin/humain/marketplace/local-events" method="post" encType="multipart/form-data" className="grid gap-2 border-t border-slate-200 p-4 md:grid-cols-2">
      <input type="hidden" name="current_url" value={currentUrl} />
      <input type="hidden" name="city" value={cityParam} />
      {!isNew ? <input type="hidden" name="event_id" value={e.id} /> : null}
      <label className="space-y-1">
        <span className={lbl}>Titre</span>
        <input name="title" defaultValue={s(e.title)} placeholder="Ex: Concert sunset" required={isNew} className={inp} />
      </label>
      <label className="space-y-1">
        <span className={lbl}>Jour / heure (texte affiché)</span>
        <input name="day_label" defaultValue={s(e.day_label)} placeholder="Ex: Vendredi · 19h" required={isNew} className={inp} />
      </label>
      <label className="space-y-1">
        <span className={lbl}>Date &amp; heure exacte (compte à rebours)</span>
        <input name="event_date" type="datetime-local" defaultValue={s(e.event_date).slice(0, 16)} className={inp} />
        <span className="text-[10px] text-muted-foreground">Optionnel — affiche un compte à rebours « J-3 · 3j 4h » sur la carte.</span>
      </label>
      <label className="space-y-1">
        <span className={lbl}>Lieu</span>
        <input name="place_label" defaultValue={s(e.place_label)} placeholder="Ex: Bordeaux centre" required={isNew} className={inp} />
      </label>
      <label className="space-y-1">
        <span className={lbl}>Badge</span>
        <input name="badge" defaultValue={s(e.badge)} placeholder="Ex: Gratuit / Entrée libre" className={inp} />
      </label>
      <label className="space-y-1">
        <span className={lbl}>Type d&apos;événement (couleur/icône)</span>
        <select name="event_type" defaultValue={s(e.event_type)} className={inp}>
          {EVENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </label>
      <label className="space-y-1">
        <span className={lbl}>Emoji (optionnel, sinon auto)</span>
        <input name="emoji" defaultValue={s(e.emoji)} placeholder="🎵" className={inp} />
      </label>
      <label className="space-y-1">
        <span className={lbl}>Position dans le catalogue</span>
        <input name="sort_order" type="number" min="0" step="1" defaultValue={isNew ? "100" : String(e.sort_order ?? 100)} placeholder="ex: 3" className={inp} />
      </label>
      <label className="space-y-1 md:col-span-2">
        <span className={lbl}>Sponsors</span>
        <input name="sponsor_names" defaultValue={s(e.sponsor_names)} placeholder="Ex: Pedro · Popey · Antonin" className={inp} />
      </label>
      <label className="space-y-1 md:col-span-2">
        <span className={lbl}>Détails</span>
        <input name="details" defaultValue={s(e.details)} placeholder="Ex: Village food trucks + DJ set sunset" className={inp} />
      </label>
      <label className="space-y-1 md:col-span-2">
        <span className={lbl}>Image (URL)</span>
        <input name="image_url" defaultValue={s(e.image_url)} placeholder="https://.../affiche.jpg" className={inp} />
      </label>
      <label className="space-y-1 md:col-span-2">
        <span className={lbl}>Image (upload)</span>
        <input name="image_file" type="file" accept="image/*" className="h-9 w-full rounded border bg-background px-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-fuchsia-100 file:px-3 file:py-1 file:text-xs file:font-bold file:text-fuchsia-900" />
      </label>
      <div className="flex flex-wrap items-center gap-2 pt-1 md:col-span-2">
        <button type="submit" name="intent" value={isNew ? "create" : "update"} className="inline-flex h-10 items-center rounded border border-fuchsia-300 bg-fuchsia-50 px-4 text-xs font-black uppercase tracking-wide text-fuchsia-800">
          {isNew ? "➕ Ajouter l'événement" : "💾 Enregistrer"}
        </button>
        {!isNew ? (
          <>
            <input type="hidden" name="next_status" value={e.status === "active" ? "inactive" : "active"} />
            <button type="submit" name="intent" value="toggle" className="inline-flex h-10 items-center rounded border border-amber-300 bg-amber-50 px-4 text-xs font-black uppercase tracking-wide text-amber-800">
              {e.status === "active" ? "Désactiver" : "Activer"}
            </button>
            <button type="submit" name="intent" value="delete" className="inline-flex h-10 items-center rounded border border-red-200 bg-red-50 px-4 text-xs font-black uppercase tracking-wide text-red-700">
              Supprimer
            </button>
          </>
        ) : null}
      </div>
    </form>
  );
}

type TinderProfile = {
  id: string;
  city: string;
  pro_name: string;
  age?: string | null;
  pro_title: string;
  bio?: string | null;
  tags?: string | null;
  compat?: number | null;
  match_gift?: string | null;
  coupon_code?: string | null;
  photo_url?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  wa_phone?: string | null;
  consent?: boolean | null;
  status?: string | null;
  sort_order?: number | null;
};

type TinderStat = { shown: number; match: number; wa: number };

// Petit formulaire pour régler la fréquence globale (tous les N swipes).
function TinderFreqForm({ cityParam, frequency }: { cityParam: string; frequency: number }) {
  const currentUrl = `/admin/humain/catalogue?city=${encodeURIComponent(cityParam)}`;
  return (
    <form action="/api/admin/humain/marketplace/tinder-profiles" method="post" className="flex flex-wrap items-end gap-2 rounded-xl border border-pink-200 bg-pink-50/50 p-3">
      <input type="hidden" name="current_url" value={currentUrl} />
      <input type="hidden" name="city" value={cityParam} />
      <label className="space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Afficher un profil tous les… (swipes)</span>
        <input name="frequency" type="number" min="1" max="20" step="1" defaultValue={String(frequency || 3)} className="h-9 w-40 rounded border bg-background px-2 text-sm" />
      </label>
      <button type="submit" name="intent" value="set_frequency" className="inline-flex h-9 items-center rounded border border-pink-300 bg-pink-100 px-4 text-xs font-black uppercase tracking-wide text-pink-800">
        💾 Régler la fréquence
      </button>
      <span className="text-[11px] text-muted-foreground">Global à toutes les villes. Coexiste avec la carte mystère (tous les 4 swipes).</span>
    </form>
  );
}

function TinderForm({ profile, cityParam, stat, isNew = false }: { profile?: TinderProfile; cityParam: string; stat?: TinderStat; isNew?: boolean }) {
  const p = profile || ({} as TinderProfile);
  const currentUrl = `/admin/humain/catalogue?city=${encodeURIComponent(cityParam)}`;
  const inp = "h-9 w-full rounded border bg-background px-2 text-sm";
  const lbl = "text-[11px] font-bold uppercase tracking-wide text-muted-foreground";
  const live = p.status === "active" && !!p.consent;
  return (
    <form action="/api/admin/humain/marketplace/tinder-profiles" method="post" encType="multipart/form-data" className="grid gap-2 border-t border-slate-200 p-4 md:grid-cols-2">
      <input type="hidden" name="current_url" value={currentUrl} />
      <input type="hidden" name="city" value={cityParam} />
      {!isNew ? <input type="hidden" name="profile_id" value={p.id} /> : null}
      {!isNew ? (
        <div className="md:col-span-2 flex flex-wrap items-center gap-3 text-[11px]">
          <span className={live ? "rounded-full bg-emerald-100 px-2 py-0.5 font-black uppercase text-emerald-700" : "rounded-full bg-slate-100 px-2 py-0.5 font-black uppercase text-slate-500"}>
            {live ? "● En ligne" : "○ Hors ligne"}
          </span>
          {stat ? (
            <span className="text-slate-500">👀 <strong className="text-slate-800">{stat.shown}</strong> vus · 💘 <strong className="text-slate-800">{stat.match}</strong> matchs · 💬 <strong className="text-slate-800">{stat.wa}</strong> WhatsApp <span className="text-slate-400">(ce mois)</span></span>
          ) : null}
        </div>
      ) : null}
      <label className="space-y-1">
        <span className={lbl}>Nom / prénom</span>
        <input name="pro_name" defaultValue={s(p.pro_name)} placeholder="Ex: Jean-Pierre" required={isNew} className={inp} />
      </label>
      <label className="space-y-1">
        <span className={lbl}>Âge (texte)</span>
        <input name="age" defaultValue={s(p.age)} placeholder="Ex: 52 ans" className={inp} />
      </label>
      <label className="space-y-1">
        <span className={lbl}>Métier · Ville</span>
        <input name="pro_title" defaultValue={s(p.pro_title)} placeholder="Ex: Boucher · Bordeaux" required={isNew} className={inp} />
      </label>
      <label className="space-y-1">
        <span className={lbl}>% Compatibilité (fun)</span>
        <input name="compat" type="number" min="50" max="100" step="1" defaultValue={isNew ? "97" : String(p.compat ?? 97)} className={inp} />
      </label>
      <label className="space-y-1 md:col-span-2">
        <span className={lbl}>Bio décalée &amp; drôle (max 220)</span>
        <textarea name="bio" defaultValue={s(p.bio)} maxLength={220} rows={2} placeholder="Ex: Aime les belles pièces de bœuf, déteste les barbecues ratés…" className="w-full rounded border bg-background px-2 py-1.5 text-sm" />
      </label>
      <label className="space-y-1 md:col-span-2">
        <span className={lbl}>Tags fun (séparés par ·)</span>
        <input name="tags" defaultValue={s(p.tags)} placeholder="🔥 Maturation 40j · 🏆 Meilleur ouvrier · ❤️ Conseils cuisson" className={inp} />
      </label>
      <label className="space-y-1 md:col-span-2">
        <span className={lbl}>Cadeau de match</span>
        <input name="match_gift" defaultValue={s(p.match_gift)} placeholder="Ex: un saucisson artisanal offert pour toute commande > 25€" className={inp} />
      </label>
      <label className="space-y-1">
        <span className={lbl}>Code promo match</span>
        <input name="coupon_code" defaultValue={s(p.coupon_code)} placeholder="POPEY-MATCH-JP" className={inp} />
      </label>
      <label className="space-y-1">
        <span className={lbl}>Position (ordre rotation)</span>
        <input name="sort_order" type="number" min="0" step="1" defaultValue={isNew ? "100" : String(p.sort_order ?? 100)} className={inp} />
      </label>
      <label className="space-y-1">
        <span className={lbl}>WhatsApp (chiffres)</span>
        <input name="wa_phone" defaultValue={s(p.wa_phone)} placeholder="33768233347" className={inp} />
      </label>
      <label className="space-y-1">
        <span className={lbl}>Téléphone</span>
        <input name="phone" defaultValue={s(p.phone)} placeholder="+33 6 …" className={inp} />
      </label>
      <label className="space-y-1 md:col-span-2">
        <span className={lbl}>Adresse</span>
        <input name="address" defaultValue={s(p.address)} placeholder="14 Rue de la Halle, Bordeaux" className={inp} />
      </label>
      <label className="space-y-1 md:col-span-2">
        <span className={lbl}>Site web</span>
        <input name="website" defaultValue={s(p.website)} placeholder="boucherie-jp.fr" className={inp} />
      </label>
      <label className="space-y-1 md:col-span-2">
        <span className={lbl}>Photo (URL)</span>
        <input name="photo_url" defaultValue={s(p.photo_url)} placeholder="https://.../photo-fun.jpg" className={inp} />
      </label>
      <label className="space-y-1 md:col-span-2">
        <span className={lbl}>Photo (upload)</span>
        <input name="photo_file" type="file" accept="image/*" className="h-9 w-full rounded border bg-background px-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-pink-100 file:px-3 file:py-1 file:text-xs file:font-bold file:text-pink-900" />
      </label>
      <label className="md:col-span-2 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3">
        <input name="consent" type="checkbox" defaultChecked={!!p.consent} className="mt-0.5 h-4 w-4" />
        <span className="text-[12px] text-amber-900">
          <strong>Consentement commerçant.</strong> Le commerçant a validé sa photo, sa bio et le ton humoristique « profil Tinder ».
          <span className="block text-[11px] text-amber-700">⚠️ Obligatoire : un profil ne peut pas être mis en ligne sans cette case cochée.</span>
        </span>
      </label>
      <div className="flex flex-wrap items-center gap-2 pt-1 md:col-span-2">
        <button type="submit" name="intent" value={isNew ? "create" : "update"} className="inline-flex h-10 items-center rounded border border-pink-300 bg-pink-50 px-4 text-xs font-black uppercase tracking-wide text-pink-800">
          {isNew ? "➕ Ajouter le profil" : "💾 Enregistrer"}
        </button>
        {!isNew ? (
          <>
            <input type="hidden" name="next_status" value={p.status === "active" ? "inactive" : "active"} />
            <button type="submit" name="intent" value="toggle" className="inline-flex h-10 items-center rounded border border-amber-300 bg-amber-50 px-4 text-xs font-black uppercase tracking-wide text-amber-800">
              {p.status === "active" ? "Mettre hors ligne" : "Mettre en ligne"}
            </button>
            <button type="submit" name="intent" value="delete" className="inline-flex h-10 items-center rounded border border-red-200 bg-red-50 px-4 text-xs font-black uppercase tracking-wide text-red-700">
              Supprimer
            </button>
          </>
        ) : null}
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
  const cityEvents = ((snapshot.localEvents || []) as unknown as LocalEvent[])
    .filter((e) => String(e.city || "") === selectedCity)
    .sort((a, b) => (a.sort_order ?? 100) - (b.sort_order ?? 100));
  const [allTinder, tinderFrequency, tinderStats] = await Promise.all([
    fetchTinderProfiles(),
    fetchTinderFrequency(),
    fetchTinderStats(),
  ]);
  const cityTinder = allTinder
    .filter((t) => String(t.city || "") === selectedCity)
    .sort((a, b) => (a.sort_order ?? 100) - (b.sort_order ?? 100));
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
  const shareLinks: Record<string, string> = {};
  configured.forEach((p) => {
    const slug = String((extra[p.id] as { pro_slug?: string } | undefined)?.pro_slug || p.id);
    merchantLinks[p.id] = (appBase || "") + "/privilege/pro?p=" + encodeURIComponent(slug);
    // Lien COURT à partager par le commerçant (/c/<slug> → catalogue avec son ref)
    shareLinks[p.id] = (appBase || "") + "/c/" + encodeURIComponent(slug);
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
                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-emerald-50/50 px-4 py-2 text-[11px]">
                  <span className="shrink-0 font-bold uppercase tracking-wide text-emerald-700">🔗 Lien à PARTAGER (catalogue)</span>
                  <input
                    readOnly
                    value={shareLinks[p.id]}
                    className="min-w-0 flex-1 rounded border border-emerald-200 bg-white px-2 py-1 font-mono text-[10px] text-slate-700"
                  />
                </div>
                {merchantLinks[p.id] ? (
                  <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-white px-4 py-2 text-[11px]">
                    <span className="shrink-0 font-bold uppercase tracking-wide text-slate-400">📊 Lien espace commerçant (stats)</span>
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
        <details className="overflow-hidden rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/40">
          <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-3 text-sm">
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-black uppercase text-amber-900">+ Autre</span>
            <strong>Métier non listé</strong>
            <span className="text-muted-foreground">· saisir un métier libre (hors des 150)</span>
            <span className="ml-auto text-[11px] text-amber-700">configurer ▾</span>
          </summary>
          <CatalogueOfferForm place={{ id: "" } as SnapPlace} extra={undefined} members={members} cityParam={selectedCity} isNew />
        </details>
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

      {/* Événements & animations (cartes informatives dans le catalogue) */}
      <div className="space-y-2 border-t pt-5">
        <h2 className="text-lg font-black">📅 Événements &amp; animations — {selectedCity || "—"}</h2>
        <p className="text-xs text-muted-foreground">
          Concerts, spectacles, marchés… affichés comme une belle carte dans le catalogue. La <strong>position</strong> détermine
          où la carte apparaît parmi les offres (1 = en tête).
        </p>

        <details className="overflow-hidden rounded-xl border-2 border-dashed border-fuchsia-300 bg-fuchsia-50/40">
          <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-3 text-sm">
            <span className="rounded-full bg-fuchsia-200 px-2 py-0.5 text-[10px] font-black uppercase text-fuchsia-900">+ Événement</span>
            <strong>Ajouter un événement / une animation</strong>
            <span className="ml-auto text-[11px] text-fuchsia-700">créer ▾</span>
          </summary>
          <EventForm cityParam={selectedCity} isNew />
        </details>

        {cityEvents.map((ev) => (
          <details key={ev.id} className="overflow-hidden rounded-xl border bg-white">
            <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-3 text-sm">
              <span className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-[10px] font-black uppercase text-fuchsia-700">{ev.status === "active" ? "actif" : "inactif"}</span>
              <span>{s(ev.emoji) || "📅"}</span>
              <strong className="min-w-0 truncate">{s(ev.title)}</strong>
              <span className="text-muted-foreground">· {s(ev.day_label)}</span>
              <span className="ml-auto text-[11px] text-slate-400">pos. {ev.sort_order ?? 100} · modifier ▾</span>
            </summary>
            <EventForm event={ev} cityParam={selectedCity} />
          </details>
        ))}
        {cityEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun événement pour cette ville. Ajoute-en un ci-dessus.</p>
        ) : null}
      </div>

      {/* Profils Tinder commerçants (cartes humour intercalées) */}
      <div className="space-y-2 border-t pt-5">
        <h2 className="text-lg font-black">💘 Profils Tinder commerçants — {selectedCity || "—"}</h2>
        <p className="text-xs text-muted-foreground">
          Carte « profil de rencontre » qui humanise le commerçant avec humour — gros différenciateur pour le démarchage. S&apos;intercale
          dans le deck <strong>tous les {tinderFrequency} swipes</strong>. <strong className="text-amber-700">Ne jamais publier sans le consentement du commerçant.</strong>
        </p>

        <TinderFreqForm cityParam={selectedCity} frequency={tinderFrequency} />

        <details className="overflow-hidden rounded-xl border-2 border-dashed border-pink-300 bg-pink-50/40">
          <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-3 text-sm">
            <span className="rounded-full bg-pink-200 px-2 py-0.5 text-[10px] font-black uppercase text-pink-900">+ Profil</span>
            <strong>Ajouter un profil Tinder commerçant</strong>
            <span className="ml-auto text-[11px] text-pink-700">créer ▾</span>
          </summary>
          <TinderForm cityParam={selectedCity} isNew />
        </details>

        {cityTinder.map((tp) => {
          const live = tp.status === "active" && !!tp.consent;
          return (
            <details key={tp.id} className="overflow-hidden rounded-xl border bg-white">
              <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-3 text-sm">
                <span className={live ? "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-700" : "rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-500"}>
                  {live ? "en ligne" : "hors ligne"}
                </span>
                <span>💘</span>
                <strong className="min-w-0 truncate">{s(tp.pro_name)}</strong>
                <span className="text-muted-foreground">· {s(tp.pro_title)}</span>
                {!tp.consent ? <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">consentement manquant</span> : null}
                <span className="ml-auto text-[11px] text-slate-400">modifier ▾</span>
              </summary>
              <TinderForm profile={tp} cityParam={selectedCity} stat={tinderStats[tp.id]} />
            </details>
          );
        })}
        {cityTinder.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun profil Tinder pour cette ville. Ajoute-en un ci-dessus.</p>
        ) : null}
      </div>
    </section>
  );
}
