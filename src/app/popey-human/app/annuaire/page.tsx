import Link from "next/link";
import { getVisibleHumanDirectory } from "@/lib/actions/human-permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function fullName(member: { first_name: string | null; last_name: string | null }) {
  return [member.first_name, member.last_name].filter(Boolean).join(" ").trim() || "Membre Popey";
}

export default async function PopeyHumanAnnuairePage() {
  const directory = await getVisibleHumanDirectory();

  return (
    <main className="min-h-screen bg-[#F7F7F7] px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-black/60">Popey Human</p>
            <h1 className="text-3xl font-black">Annuaire</h1>
            <p className="text-sm text-black/70">
              Mode actif: <span className="font-bold">{directory.mode ?? "Indisponible"}</span>
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/popey-human/app">Retour cockpit</Link>
          </Button>
        </div>

        {directory.error && (
          <Card className="border-red-200">
            <CardContent className="pt-6 text-sm text-red-600">{directory.error}</CardContent>
          </Card>
        )}

        {!directory.error && directory.members.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aucun membre visible</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-black/70">
              Votre mode d&apos;accès ne retourne actuellement aucun profil (binôme ou sélection).
            </CardContent>
          </Card>
        )}

        {!directory.error && directory.members.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {directory.members.map((member) => (
              <Card key={member.id} className="border-black/10">
                <CardHeader>
                  <CardTitle className="text-xl font-black">{fullName(member)}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-black/75">
                  <p>Métier: {member.metier || "Non renseigné"}</p>
                  <p>Ville: {member.ville || "Non renseignée"}</p>
                  <p>Téléphone: {member.phone || "Non renseigné"}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
