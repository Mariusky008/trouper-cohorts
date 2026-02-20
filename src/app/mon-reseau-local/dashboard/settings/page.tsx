import { getNetworkSettings } from "@/lib/actions/network-settings";
import { SettingsForm } from "@/components/dashboard/settings/settings-form";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await getNetworkSettings();

  return (
    <div className="space-y-8 pb-24 max-w-2xl">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Paramètres</h1>
        <p className="text-slate-500 font-medium">Gérez vos préférences.</p>
      </div>

      <SettingsForm initialSettings={settings} />
    </div>
  );
}
