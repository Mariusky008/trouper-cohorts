import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getMyHumanProfile, updateMyHumanProfileAction } from "@/lib/actions/human-permissions";

export default async function PopeyHumanProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{
    edit?: string;
    profileStatus?: string;
    profileMessage?: string;
  }>;
}) {
  const params = (await searchParams) || {};
  const edit = params.edit === "1";
  const profileStatus = typeof params.profileStatus === "string" ? params.profileStatus : "";
  const profileMessage = typeof params.profileMessage === "string" ? params.profileMessage : "";
  const data = await getMyHumanProfile();

  return (
    <section className="space-y-5 max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-300/85">Popey Human</p>
          <h1 className="text-3xl font-black">Mon profil</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/popey-human/app">Retour cockpit</Link>
        </Button>
      </div>

      {data.error && <p className="rounded border border-red-300/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">{data.error}</p>}
      {profileStatus === "success" && (
        <p className="rounded border border-emerald-300/35 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {profileMessage || "Profil mis à jour."}{" "}
          <Link className="underline" href="/popey-human/app/profile">
            Effacer
          </Link>
        </p>
      )}
      {profileStatus === "error" && (
        <p className="rounded border border-red-300/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {profileMessage || "Action impossible."}{" "}
          <Link className="underline" href="/popey-human/app/profile">
            Effacer
          </Link>
        </p>
      )}

      {!data.error && data.profile && (
        <div className="rounded-2xl border border-white/15 bg-black/25 p-5">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-white/65">Identité Radar</p>
          <h2 className="mt-1 text-2xl font-black">
            {[data.profile.first_name, data.profile.last_name].filter(Boolean).join(" ").trim() || "Membre Popey"}
          </h2>
          <div className="mt-3 space-y-2 text-sm">
            <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2">
              <span className="font-black">Métier:</span> {data.profile.metier || "Non renseigné"}
            </p>
            <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2">
              <span className="font-black">Ville:</span> {data.profile.ville || "Non renseignée"}
            </p>
            <p className="rounded-lg border border-white/15 bg-black/25 px-3 py-2">
              <span className="font-black">Téléphone:</span> {data.profile.phone || "Non renseigné"}
            </p>
          </div>
          <Link
            href="/popey-human/app/profile?edit=1"
            className="mt-4 h-11 rounded-xl bg-emerald-400 text-black text-sm font-black uppercase tracking-wide inline-flex items-center justify-center px-4"
          >
            Modifier mon profil
          </Link>
        </div>
      )}

      {!data.error && data.profile && edit && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] p-4 flex items-center justify-center">
          <div className="w-full max-w-2xl rounded-2xl border border-white/25 bg-[#1B2227] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase font-black tracking-[0.12em] text-emerald-300/80">Édition profil</p>
                <h3 className="mt-1 text-2xl font-black">Mettre à jour mes infos</h3>
              </div>
              <Link href="/popey-human/app/profile" className="text-xs font-black uppercase tracking-wide text-white/70">
                Fermer
              </Link>
            </div>

            <form action={updateMyHumanProfileAction} className="mt-4 space-y-4">
              <input type="hidden" name="current_url" value="/popey-human/app/profile?edit=1" />
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="first_name" className="text-xs font-bold uppercase tracking-wide text-white/65">
                    Prénom
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    defaultValue={data.profile.first_name || ""}
                    className="mt-1 w-full rounded border border-white/20 bg-black/30 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="last_name" className="text-xs font-bold uppercase tracking-wide text-white/65">
                    Nom
                  </label>
                  <input
                    id="last_name"
                    name="last_name"
                    defaultValue={data.profile.last_name || ""}
                    className="mt-1 w-full rounded border border-white/20 bg-black/30 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="metier" className="text-xs font-bold uppercase tracking-wide text-white/65">
                  Métier
                </label>
                <input
                  id="metier"
                  name="metier"
                  defaultValue={data.profile.metier || ""}
                  className="mt-1 w-full rounded border border-white/20 bg-black/30 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="ville" className="text-xs font-bold uppercase tracking-wide text-white/65">
                    Ville
                  </label>
                  <input
                    id="ville"
                    name="ville"
                    defaultValue={data.profile.ville || ""}
                    className="mt-1 w-full rounded border border-white/20 bg-black/30 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wide text-white/65">
                    Téléphone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    defaultValue={data.profile.phone || ""}
                    className="mt-1 w-full rounded border border-white/20 bg-black/30 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <button className="h-11 rounded-xl bg-emerald-400 px-4 text-sm font-black uppercase tracking-wide text-black">
                Enregistrer le profil
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
