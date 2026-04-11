import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminHumainPage() {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">100% Humain</p>
        <h1 className="text-3xl font-black">Admin Popey Human</h1>
      </div>
      <p className="max-w-2xl text-sm text-muted-foreground">
        Espace dédié au pilotage Popey Human: permissions réseau, binômes, sphère, éclaireurs et notifications.
      </p>
      <div className="rounded-xl border bg-card p-5 text-sm">
        Sprint 1 livré: routage indépendant et redirection post-login vers cet espace pour les admins.
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/admin/humain/cockpit">Ouvrir le cockpit KPI</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/humain/clients">Ouvrir les leads clients</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/humain/membres">Ouvrir la gestion des membres</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/humain/sphere">Ouvrir la vue sphère</Link>
        </Button>
        <Button asChild>
          <Link href="/admin/humain/permissions">Ouvrir la gestion des permissions</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/humain/notifications">Ouvrir les notifications</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/humain/commissions">Ouvrir les commissions</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/humain/eclaireurs">Ouvrir les éclaireurs</Link>
        </Button>
      </div>
    </section>
  );
}
