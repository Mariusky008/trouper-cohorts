import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getMyHumanProfile, updateMyHumanProfileAction } from "@/lib/actions/human-permissions";

export default async function PopeyHumanProfilePage() {
  const data = await getMyHumanProfile();

  return (
    <main className="min-h-screen bg-[#F7F7F7] px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-black/60">Popey Human</p>
            <h1 className="text-3xl font-black">Mon profil</h1>
          </div>
          <Button asChild variant="outline">
            <Link href="/popey-human/app">Retour cockpit</Link>
          </Button>
        </div>

        {data.error && (
          <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{data.error}</p>
        )}

        {!data.error && (
          <form action={updateMyHumanProfileAction} className="space-y-4 rounded-xl border bg-white p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="first_name" className="text-xs font-bold uppercase tracking-wide text-black/60">
                  Prénom
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  defaultValue={data.profile?.first_name || ""}
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="last_name" className="text-xs font-bold uppercase tracking-wide text-black/60">
                  Nom
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  defaultValue={data.profile?.last_name || ""}
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="metier" className="text-xs font-bold uppercase tracking-wide text-black/60">
                Métier
              </label>
              <input
                id="metier"
                name="metier"
                defaultValue={data.profile?.metier || ""}
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="ville" className="text-xs font-bold uppercase tracking-wide text-black/60">
                  Ville
                </label>
                <input
                  id="ville"
                  name="ville"
                  defaultValue={data.profile?.ville || ""}
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wide text-black/60">
                  Téléphone
                </label>
                <input
                  id="phone"
                  name="phone"
                  defaultValue={data.profile?.phone || ""}
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                />
              </div>
            </div>

            <button className="rounded bg-black px-4 py-2 text-sm font-bold text-white">Enregistrer le profil</button>
          </form>
        )}
      </div>
    </main>
  );
}
