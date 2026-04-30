import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAdminSignalDispatchSnapshot } from "@/lib/actions/human-signals";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminHumainPage() {
  const signalSnapshot = await getAdminSignalDispatchSnapshot();
  const supabaseAdmin = createAdminClient();
  const { count: commandoPendingCount } = await supabaseAdmin
    .from("commando_applications")
    .select("*", { count: "exact", head: true })
    .eq("qualification_status", "pending_review");
  const signalsCount = signalSnapshot.error ? null : signalSnapshot.signals.length;
  const recordingsCount = signalSnapshot.error
    ? null
    : signalSnapshot.signals.filter((signal) => Boolean(signal.audio_url && String(signal.audio_url).trim())).length;
  const withoutAudioCount =
    signalSnapshot.error || recordingsCount === null || signalsCount === null
      ? null
      : Math.max(0, signalsCount - recordingsCount);
  const newVocalsCount = signalSnapshot.error
    ? null
    : signalSnapshot.signals.filter(
        (signal) => Boolean(signal.audio_url) && signal.status !== "closed" && signal.dispatchTargets.length === 0
      ).length;

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">100% Humain</p>
        <h1 className="text-3xl font-black">Admin Popey Human</h1>
      </div>
      <p className="max-w-2xl text-sm text-muted-foreground">
        Espace dédié au pilotage Popey Human: permissions réseau, binômes, sphère, éclaireurs et notifications.
      </p>
      <div className="rounded-xl border border-cyan-300/40 bg-cyan-500/10 p-5">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-900">Enregistrements vocaux reçus</p>
        <p className="mt-1 text-sm text-cyan-900">
          {signalSnapshot.error
            ? "Impossible de charger le compteur vocal pour le moment."
            : `${recordingsCount} enregistrement(s) audio sur ${signalsCount} signal(aux) total.`}
        </p>
        {!signalSnapshot.error && (
          <p className="mt-1 text-xs text-cyan-900/85">
            Sans audio exploitable: {withoutAudioCount} (upload manquant ou signal texte).
          </p>
        )}
        <div className="mt-3">
          <Button asChild>
            <Link href="/admin/humain/sphere" className="inline-flex items-center gap-2">
              Ouvrir la timeline des vocaux
              {newVocalsCount && newVocalsCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                  {newVocalsCount}
                </span>
              ) : null}
            </Link>
          </Button>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-5 text-sm">
        Sprint 1 livré: routage indépendant et redirection post-login vers cet espace pour les admins.
      </div>
      <div className="rounded-xl border border-amber-300/40 bg-amber-500/10 p-5">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-900">
          Candidatures Programme 100% Humain
        </p>
        <p className="mt-1 text-sm text-amber-900">
          Les formulaires d&apos;inscription de `popey-human` arrivent dans `commando_applications` via `/api/commando/apply`, visibles sur `/admin/commando`.
        </p>
        <div className="mt-3">
          <Button asChild variant="outline">
            <Link href="/admin/commando" className="inline-flex items-center gap-2">
              Ouvrir les candidatures
              {commandoPendingCount && commandoPendingCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                  {commandoPendingCount}
                </span>
              ) : null}
            </Link>
          </Button>
        </div>
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
          <Link href="/admin/humain/sphere" className="inline-flex items-center gap-2">
            Ouvrir la vue sphère
            {newVocalsCount && newVocalsCount > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                {newVocalsCount}
              </span>
            ) : null}
          </Link>
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
        <Button asChild variant="outline">
          <Link href="/admin/humain/marketplace">Ouvrir le marketplace</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/humain/chat">Ouvrir le chat WhatsApp</Link>
        </Button>
      </div>
    </section>
  );
}
