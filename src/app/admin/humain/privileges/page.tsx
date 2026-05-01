import Link from "next/link";
import {
  adminUpdatePrivilegeActivationStatusAction,
  getAdminMarketplaceSnapshot,
} from "@/lib/actions/human-marketplace";

type PrivilegesPageProps = {
  searchParams?: Promise<{
    marketStatus?: string;
    marketMessage?: string;
    status?: string;
    city?: string;
    q?: string;
  }>;
};

function slugify(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readWorkflowStatus(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "new";
  const value = String((metadata as Record<string, unknown>).workflow_status || "new")
    .trim()
    .toLowerCase();
  if (!["new", "contacted", "rdv", "signed", "closed"].includes(value)) return "new";
  return value;
}

function readWorkflowNote(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "";
  return String((metadata as Record<string, unknown>).workflow_note || "").trim();
}

function statusLabel(status: string) {
  if (status === "contacted") return "Contacte";
  if (status === "rdv") return "RDV pris";
  if (status === "signed") return "Signe";
  if (status === "closed") return "Cloture";
  return "Nouveau";
}

function statusBadgeClass(status: string) {
  if (status === "signed") return "border-emerald-400/40 bg-emerald-500/15 text-emerald-200";
  if (status === "rdv") return "border-amber-400/40 bg-amber-500/15 text-amber-200";
  if (status === "contacted") return "border-cyan-400/40 bg-cyan-500/15 text-cyan-200";
  if (status === "closed") return "border-slate-500/40 bg-slate-700/40 text-slate-200";
  return "border-red-400/40 bg-red-500/15 text-red-200";
}

export default async function AdminHumainPrivilegesPage({ searchParams }: PrivilegesPageProps) {
  const params = (await searchParams) || {};
  const marketStatus = typeof params.marketStatus === "string" ? params.marketStatus : "";
  const marketMessage = typeof params.marketMessage === "string" ? params.marketMessage : "";
  const selectedStatus = typeof params.status === "string" ? params.status : "all";
  const selectedCity = typeof params.city === "string" ? params.city : "all";
  const queryText = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const appBase = String(process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");

  const snapshot = await getAdminMarketplaceSnapshot({ placeCity: "all" });
  const activationsRaw = snapshot.recentActivations || [];
  const activations = activationsRaw.filter((item) => {
    const status = readWorkflowStatus(item.metadata);
    if (selectedStatus !== "all" && status !== selectedStatus) return false;
    if (selectedCity !== "all" && String(item.city || "").toLowerCase() !== selectedCity.toLowerCase()) return false;
    if (!queryText) return true;
    const haystack = `${item.client_name} ${item.referrer_name} ${item.partner_name || ""} ${item.place?.metier || ""}`
      .toLowerCase()
      .trim();
    return haystack.includes(queryText);
  });

  const now = Date.now();
  const todayCount = activationsRaw.filter((item) => {
    const created = Date.parse(String(item.created_at || ""));
    if (!Number.isFinite(created)) return false;
    return created >= now - 24 * 60 * 60 * 1000;
  }).length;
  const signedCount = activationsRaw.filter((item) => readWorkflowStatus(item.metadata) === "signed").length;
  const conversion = activationsRaw.length > 0 ? Math.round((signedCount / activationsRaw.length) * 100) : 0;
  const cityOptions = Array.from(new Set(activationsRaw.map((item) => String(item.city || "").trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "fr"),
  );

  const placesMissingSetup = snapshot.places.filter(
    (place) => !place.owner_member_id || !String(place.privilege_badge || "").trim() || !String(place.partner_whatsapp || "").trim(),
  );
  const membersById = new Map(snapshot.members.map((member) => [member.id, member.label]));
  const personalLinks = snapshot.places
    .filter((place) => Boolean(place.owner_member_id))
    .map((place) => {
      const ownerId = String(place.owner_member_id || "").trim();
      const label = membersById.get(ownerId) || "Membre Popey";
      const citySlug = slugify(place.city || "dax") || "dax";
      const relativeUrl = `/privilege/${citySlug}?ref_id=${encodeURIComponent(ownerId)}&ref_name=${encodeURIComponent(label)}`;
      return {
        placeId: place.id,
        ownerLabel: label,
        metier: place.metier,
        city: place.city,
        url: appBase ? `${appBase}${relativeUrl}` : relativeUrl,
      };
    });

  return (
    <section className="space-y-5 rounded-2xl border border-slate-800 bg-[#0A0D14] p-4 text-slate-100 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200/80">Popey Privileges</p>
          <h1 className="text-3xl font-black text-white">Tour de controle Privileges</h1>
          <p className="text-sm text-slate-300">Vision live des activations, suivi pipeline et complétude des offres.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/humain" className="rounded border border-slate-600 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-200">
            Retour admin
          </Link>
          <Link href="/admin/humain/marketplace" className="rounded border border-cyan-500/50 bg-cyan-500/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-cyan-100">
            Ouvrir marketplace
          </Link>
        </div>
      </div>

      {marketStatus === "success" ? (
        <p className="rounded border border-emerald-400/40 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-100">{marketMessage || "Action effectuee."}</p>
      ) : null}
      {marketStatus === "error" ? (
        <p className="rounded border border-red-400/40 bg-red-500/15 px-3 py-2 text-sm text-red-100">{marketMessage || "Action impossible."}</p>
      ) : null}
      {snapshot.error ? (
        <p className="rounded border border-red-400/40 bg-red-500/15 px-3 py-2 text-sm text-red-100">{snapshot.error}</p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-4">
        <article className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Activations totales</p>
          <p className="mt-1 text-3xl font-black text-white">{activationsRaw.length}</p>
        </article>
        <article className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Activations 24h</p>
          <p className="mt-1 text-3xl font-black text-cyan-200">{todayCount}</p>
        </article>
        <article className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Signes</p>
          <p className="mt-1 text-3xl font-black text-emerald-200">{signedCount}</p>
        </article>
        <article className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Conversion</p>
          <p className="mt-1 text-3xl font-black text-amber-200">{conversion}%</p>
        </article>
      </div>

      <form method="get" className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
        <div className="grid gap-2 md:grid-cols-4">
          <select name="status" defaultValue={selectedStatus} className="h-10 rounded border border-slate-600 bg-[#0A0D14] px-2 text-sm">
            <option value="all">Tous statuts</option>
            <option value="new">Nouveau</option>
            <option value="contacted">Contacte</option>
            <option value="rdv">RDV pris</option>
            <option value="signed">Signe</option>
            <option value="closed">Cloture</option>
          </select>
          <select name="city" defaultValue={selectedCity} className="h-10 rounded border border-slate-600 bg-[#0A0D14] px-2 text-sm">
            <option value="all">Toutes villes</option>
            {cityOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <input
            name="q"
            defaultValue={queryText}
            placeholder="Recherche client / referent / metier"
            className="h-10 rounded border border-slate-600 bg-[#0A0D14] px-3 text-sm"
          />
          <button className="h-10 rounded border border-cyan-500/50 bg-cyan-500/15 px-3 text-xs font-black uppercase tracking-wide text-cyan-100">
            Filtrer
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
        <h2 className="text-lg font-black text-white">Live feed activations</h2>
        <p className="text-xs text-slate-400">Chaque clic “Activer mon privilege” remonte ici avec tracking.</p>
        <div className="mt-3 space-y-3">
          {activations.map((activation) => {
            const workflowStatus = readWorkflowStatus(activation.metadata);
            const workflowNote = readWorkflowNote(activation.metadata);
            return (
              <article key={activation.id} className="rounded-lg border border-slate-700 bg-[#0B111C] p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-100">
                    {activation.client_name} ← de la part de {activation.referrer_name} → {activation.partner_name || activation.place?.metier || "Partenaire"}
                  </p>
                  <span className={`rounded-full border px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${statusBadgeClass(workflowStatus)}`}>
                    {statusLabel(workflowStatus)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {activation.city} · {activation.category_key} · {new Date(activation.created_at).toLocaleString("fr-FR")} · tracking: {activation.id}
                </p>
                <form action={adminUpdatePrivilegeActivationStatusAction} className="mt-3 grid gap-2 md:grid-cols-4">
                  <input type="hidden" name="current_url" value={`/admin/humain/privileges?status=${encodeURIComponent(selectedStatus)}&city=${encodeURIComponent(selectedCity)}&q=${encodeURIComponent(queryText)}`} />
                  <input type="hidden" name="activation_id" value={activation.id} />
                  <select name="next_status" defaultValue={workflowStatus} className="h-9 rounded border border-slate-600 bg-[#0A0D14] px-2 text-xs">
                    <option value="new">Nouveau</option>
                    <option value="contacted">Contacte</option>
                    <option value="rdv">RDV pris</option>
                    <option value="signed">Signe</option>
                    <option value="closed">Cloture</option>
                  </select>
                  <input name="note" defaultValue={workflowNote} placeholder="Note admin (optionnel)" className="h-9 rounded border border-slate-600 bg-[#0A0D14] px-2 text-xs md:col-span-2" />
                  <button className="h-9 rounded border border-slate-500 bg-slate-700/40 px-3 text-[11px] font-black uppercase tracking-wide">
                    MAJ pipeline
                  </button>
                </form>
              </article>
            );
          })}
          {activations.length === 0 ? <p className="text-sm text-slate-400">Aucune activation sur ce filtre.</p> : null}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
          <h2 className="text-lg font-black text-white">Alertes de complétude</h2>
          <p className="text-xs text-slate-400">Places qui ne peuvent pas convertir proprement (owner, privilège ou WhatsApp manquant).</p>
          <div className="mt-3 space-y-2">
            {placesMissingSetup.slice(0, 60).map((place) => (
              <article key={place.id} className="rounded border border-amber-400/30 bg-amber-500/10 p-2 text-xs text-amber-100">
                {place.metier} · {place.city} ·
                {!place.owner_member_id ? " owner manquant" : ""}
                {!String(place.privilege_badge || "").trim() ? " privilege manquant" : ""}
                {!String(place.partner_whatsapp || "").trim() ? " whatsapp manquant" : ""}
              </article>
            ))}
            {placesMissingSetup.length === 0 ? <p className="text-sm text-emerald-200">Tout est complet, rien a corriger.</p> : null}
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
          <h2 className="text-lg font-black text-white">Liens personnels stables</h2>
          <p className="text-xs text-slate-400">Lien unique par pro à copier-coller pour ses clients.</p>
          <div className="mt-3 space-y-2">
            {personalLinks.slice(0, 80).map((item) => (
              <article key={`${item.placeId}-${item.ownerLabel}`} className="rounded border border-slate-700 bg-[#0A0D14] p-2 text-xs">
                <p className="font-semibold text-slate-200">
                  {item.ownerLabel} · {item.metier} · {item.city}
                </p>
                <a href={item.url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-cyan-300 underline">
                  {item.url}
                </a>
              </article>
            ))}
            {personalLinks.length === 0 ? <p className="text-sm text-slate-400">Aucun lien stable pour le moment.</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
