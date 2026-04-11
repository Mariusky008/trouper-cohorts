import Link from "next/link";
import { getVisibleHumanDirectory } from "@/lib/actions/human-permissions";
import { Button } from "@/components/ui/button";

function fullName(member: { first_name: string | null; last_name: string | null }) {
  return [member.first_name, member.last_name].filter(Boolean).join(" ").trim() || "Membre Popey";
}

export default async function PopeyHumanAnnuairePage({
  searchParams,
}: {
  searchParams?: Promise<{
    member?: string;
  }>;
}) {
  const params = (await searchParams) || {};
  const selectedMemberId = typeof params.member === "string" ? params.member : "";
  const directory = await getVisibleHumanDirectory();
  const selectedMember = !directory.error ? directory.members.find((member) => member.id === selectedMemberId) || null : null;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-300/85">Popey Human</p>
          <h1 className="text-3xl font-black">Annuaire</h1>
          <p className="text-sm text-white/75">
            Mode actif: <span className="font-bold">{directory.mode ?? "Indisponible"}</span>
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/popey-human/app">Retour cockpit</Link>
        </Button>
      </div>

      {directory.error && (
        <p className="rounded border border-red-300/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">{directory.error}</p>
      )}

      {!directory.error && directory.members.length === 0 && (
        <p className="rounded border border-white/15 bg-black/25 px-3 py-3 text-sm text-white/70">
          Votre mode d&apos;accès ne retourne actuellement aucun profil (binôme ou sélection).
        </p>
      )}

      {!directory.error && directory.members.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {directory.members.map((member) => (
            <Link
              key={member.id}
              href={`/popey-human/app/annuaire?member=${member.id}`}
              className="rounded-xl border border-white/15 bg-black/25 p-4 hover:border-emerald-300/45 transition-colors"
            >
              <p className="text-lg font-black">{fullName(member)}</p>
              <p className="mt-1 text-sm text-white/75">{member.metier || "Métier non renseigné"}</p>
              <p className="text-sm text-white/75">{member.ville || "Ville non renseignée"}</p>
              <p className="mt-2 text-xs text-emerald-300/85 font-black uppercase tracking-[0.12em]">Ouvrir fiche</p>
            </Link>
          ))}
        </div>
      )}

      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] p-4 flex items-center justify-center">
          <div className="w-full max-w-lg rounded-2xl border border-white/25 bg-[#1B2227] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase font-black tracking-[0.12em] text-emerald-300/80">Fiche membre</p>
                <h2 className="mt-1 text-2xl font-black">{fullName(selectedMember)}</h2>
              </div>
              <Link href="/popey-human/app/annuaire" className="text-xs font-black uppercase tracking-wide text-white/70">
                Fermer
              </Link>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2">
                <span className="font-black">Métier:</span> {selectedMember.metier || "Non renseigné"}
              </p>
              <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2">
                <span className="font-black">Ville:</span> {selectedMember.ville || "Non renseignée"}
              </p>
              <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2">
                <span className="font-black">Téléphone:</span> {selectedMember.phone || "Non renseigné"}
              </p>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <a
                href={selectedMember.phone ? `tel:${selectedMember.phone.replaceAll(" ", "")}` : undefined}
                className={`h-11 rounded-xl inline-flex items-center justify-center text-sm font-black uppercase tracking-wide ${
                  selectedMember.phone ? "bg-emerald-400 text-black" : "border border-white/20 text-white/45 pointer-events-none"
                }`}
              >
                Appeler
              </a>
              <Link
                href={`/popey-human/app/signal?target_member_id=${selectedMember.id}`}
                className="h-11 rounded-xl border border-white/20 inline-flex items-center justify-center text-sm font-black uppercase tracking-wide"
              >
                Envoyer un signal
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
