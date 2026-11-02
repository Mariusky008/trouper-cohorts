// 🗣️ LES FIGURINES DES CLIENTS, CÔTÉ ADMIN (`/admin/humain/figurines-clients`).
//
// POST { action: "poser", habitant, neutre: data:image…, parle: data:image… } : ses deux images → sa figurine est prête.
// POST { action: "refuser", habitant, raison } : sa photo ne peut pas servir ; il en renverra une autre.
// POST { action: "moderer", id, geste: "remettre" | "retirer" } : un message signalé.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { modererMessage, poserImagesFigurine, refuserPhoto } from "@/lib/direct/ma-figurine-serveur";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = createAdminClient();
  const habitant = String(p?.habitant ?? "");
  const r =
    p?.action === "poser" && UUID.test(habitant)
      ? await poserImagesFigurine(supabase, habitant, p.neutre, p.parle)
      : p?.action === "refuser" && UUID.test(habitant)
        ? await refuserPhoto(supabase, habitant, p.raison)
        : p?.action === "moderer"
          ? await modererMessage(supabase, String(p.id ?? ""), p.geste)
          : { error: "Demande incomplète." };
  return NextResponse.json(r.error ? { error: r.error } : { ok: true }, { status: r.error ? 400 : 200 });
}
