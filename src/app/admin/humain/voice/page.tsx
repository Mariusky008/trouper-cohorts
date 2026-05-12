import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAdminHumanVoiceCalls } from "@/lib/actions/human-voice-admin";
import { SendVoiceInviteForm } from "@/app/admin/humain/voice/_components/send-invite-form";

function formatDate(value: unknown) {
  const date = new Date(String(value || ""));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("fr-FR");
}

function pickArtifact(call: Record<string, unknown>) {
  const nested = call.human_voice_call_artifacts;
  if (!nested) return null;
  if (Array.isArray(nested)) return (nested[0] as Record<string, unknown> | undefined) || null;
  if (typeof nested === "object") return nested as Record<string, unknown>;
  return null;
}

export default async function AdminHumainVoicePage({
  searchParams,
}: {
  searchParams?: Promise<{ limit?: string }>;
}) {
  const params = (await searchParams) || {};
  const limit = Math.max(1, Math.min(200, Number(params.limit || "50") || 50));
  const data = await getAdminHumanVoiceCalls(limit);

  return (
    <section className="space-y-4">
      <SendVoiceInviteForm />
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Voix</h1>
          <p className="text-sm text-muted-foreground">Suivi des appels IA (queue + résumés + enregistrements).</p>
        </div>
        <Button asChild>
          <Link href={`/admin/humain/voice?limit=${limit}`}>Rafraîchir</Link>
        </Button>
      </div>

      {!data.success ? <p className="text-sm text-red-600">{data.error}</p> : null}

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-3 py-2">Créé</th>
              <th className="px-3 py-2">Téléphone</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2">Résumé</th>
              <th className="px-3 py-2">Enregistrement</th>
            </tr>
          </thead>
          <tbody>
            {data.calls.map((call) => {
              const artifact = pickArtifact(call);
              const recordingUrl = String(artifact?.recording_url || "");
              const summary = String(artifact?.summary || "");
              const createdAt = formatDate(call.created_at);
              const phone = String(call.phone_e164 || "");
              const status = String(call.status || "");
              return (
                <tr key={String(call.id)} className="border-t align-top">
                  <td className="px-3 py-2 whitespace-nowrap">{createdAt}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{phone}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{status}</td>
                  <td className="px-3 py-2 max-w-[520px]">
                    <div className="line-clamp-3 whitespace-pre-wrap">{summary}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {recordingUrl ? (
                      <a className="underline" href={recordingUrl} target="_blank" rel="noreferrer">
                        Ouvrir
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              );
            })}
            {data.calls.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-muted-foreground" colSpan={5}>
                  Aucun appel pour le moment.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
