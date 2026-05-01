import Link from "next/link";
import {
  adminSetMarketplacePlaceStatusAction,
  getAdminMarketplaceSnapshot,
} from "@/lib/actions/human-marketplace";

type OfferConfigPageProps = {
  params: Promise<{ offerId: string }>;
};

export default async function AdminMarketplaceOfferConfigPage({ params }: OfferConfigPageProps) {
  const { offerId } = await params;
  const snapshot = await getAdminMarketplaceSnapshot({
    offerStatus: "all",
    offerActionType: "all",
    placeCity: "all",
  });

  if (snapshot.error) {
    return (
      <section className="space-y-4">
        <Link href="/admin/humain/marketplace" className="inline-flex rounded border px-3 py-2 text-xs font-black uppercase tracking-wide">
          ← Retour marketplace
        </Link>
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{snapshot.error}</p>
      </section>
    );
  }

  const offer = snapshot.offers.find((item) => item.id === offerId);
  if (!offer) {
    return (
      <section className="space-y-4">
        <Link href="/admin/humain/marketplace" className="inline-flex rounded border px-3 py-2 text-xs font-black uppercase tracking-wide">
          ← Retour marketplace
        </Link>
        <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Demande introuvable. Reviens sur le marketplace pour sélectionner une demande active.
        </p>
      </section>
    );
  }

  if (!offer.place) {
    return (
      <section className="space-y-4">
        <Link href="/admin/humain/marketplace" className="inline-flex rounded border px-3 py-2 text-xs font-black uppercase tracking-wide">
          ← Retour marketplace
        </Link>
        <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Cette demande n&apos;est pas reliée à une place marketplace. Attribue/relie la place d&apos;abord depuis la page principale.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Marketplace</p>
          <h1 className="text-3xl font-black">Configurer cette offre privilège</h1>
          <p className="text-sm text-muted-foreground">
            Pro: {offer.full_name} · Métier: {offer.metier || "N/A"} · Ville: {offer.city || "N/A"}
          </p>
        </div>
        <Link href="/admin/humain/marketplace" className="inline-flex rounded border px-3 py-2 text-xs font-black uppercase tracking-wide">
          ← Retour marketplace
        </Link>
      </div>

      <article className="rounded-2xl border bg-white p-4 sm:p-6">
        <p className="mb-4 text-xs font-black uppercase tracking-wide text-amber-800">Éditeur offre privilège (plein format)</p>
        <form action={adminSetMarketplacePlaceStatusAction} method="post" className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="current_url" value="/admin/humain/marketplace" />
          <input type="hidden" name="place_id" value={offer.place.id} />
          <input type="hidden" name="next_status" value={offer.place.status || "reserved"} />

          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Owner membre</span>
            <select name="owner_member_id" defaultValue={offer.assigned_member_id || offer.place.owner_member_id || ""} className="h-10 w-full rounded border bg-background px-2 text-sm">
              <option value="">Owner membre (optionnel)</option>
              {snapshot.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Nom affiché professionnel</span>
            <input name="company_name" defaultValue={offer.place.company_name || offer.full_name || ""} placeholder="Ex: Atelier Landes" className="h-10 w-full rounded border bg-background px-3 text-sm" />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Offre privilège (texte visible sur la carte)</span>
            <input
              name="privilege_badge"
              defaultValue={offer.place.privilege_badge || ""}
              placeholder="Ex: Diagnostic offert / -500€ sur honoraires"
              className="h-10 w-full rounded border bg-background px-3 text-sm"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">WhatsApp partenaire cible</span>
            <input name="partner_whatsapp" defaultValue={offer.place.partner_whatsapp || offer.whatsapp || ""} placeholder="+336..." className="h-10 w-full rounded border bg-background px-3 text-sm" />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Catégorie</span>
            <select name="category_key" defaultValue={offer.place.category_key || ""} className="h-10 w-full rounded border bg-background px-2 text-sm">
              <option value="">Catégorie auto</option>
              <option value="maison">maison</option>
              <option value="sante">sante</option>
              <option value="travaux">travaux</option>
              <option value="bien-etre">bien-etre</option>
              <option value="services">services</option>
            </select>
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Référence externe (optionnel)</span>
            <input
              name="external_ref"
              defaultValue={offer.place.external_ref || String(offer.metadata?.referral_code || "")}
              placeholder="Ex: pierre-bayonne-64-1f050a7b"
              className="h-10 w-full rounded border bg-background px-3 text-sm"
            />
          </label>

          <div className="md:col-span-2 flex flex-wrap items-center gap-2 pt-2">
            <button type="submit" className="inline-flex h-10 items-center rounded border border-amber-300 bg-amber-50 px-4 text-xs font-black uppercase tracking-wide text-amber-900">
              Enregistrer offre privilège
            </button>
            <Link href="/admin/humain/marketplace" className="inline-flex h-10 items-center rounded border px-4 text-xs font-black uppercase tracking-wide">
              Annuler
            </Link>
          </div>
        </form>
      </article>
    </section>
  );
}

