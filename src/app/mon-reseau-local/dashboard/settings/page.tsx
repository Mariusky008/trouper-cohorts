import { getNetworkSettings } from "@/lib/actions/network-settings";
import { SettingsForm } from "@/components/dashboard/settings/settings-form";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await getNetworkSettings();

  return (
    <div className="space-y-8 pb-24 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-[#2E130C] tracking-tight">Paramètres</h1>
        <p className="text-stone-500 font-medium">Gérez vos préférences.</p>
      </div>

      <SettingsForm initialSettings={settings} />
    </div>
  );
}
