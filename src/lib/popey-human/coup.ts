import { createAdminClient } from "@/lib/supabase/admin";

// Popey v3 — « Coup de feu » : helpers de l'envoi PAR VAGUES de niveau décroissant.
// Les fidèles (niveau élevé) sont prévenus en premier ; on n'élargit aux niveaux inférieurs que si
// les places ne se remplissent pas. Priorité réelle + anti-spam + maîtrise du coût (chaque message facturé).

export type CoupWaveDef = { idx: number; label: string; test: (lvl: number) => boolean };

// Vagues, de la plus prioritaire à la plus large.
export const COUP_WAVES: CoupWaveDef[] = [
  { idx: 0, label: "🥇 Fidèles · niveau 5", test: (l) => l >= 5 },
  { idx: 1, label: "Niveau 4", test: (l) => l === 4 },
  { idx: 2, label: "Niveau 3", test: (l) => l === 3 },
  { idx: 3, label: "Niveau 1-2 · tous les fans", test: (l) => l <= 2 },
];

export type WaveBucket = { idx: number; label: string; phones: string[] };

// Répartit les fans opt-in CONFIRMÉS d'un commerçant par vague (selon leur niveau de relation).
// Résilient : tables absentes → vagues vides (ne casse jamais l'appelant).
export async function loadWaveBuckets(placeId: string): Promise<WaveBucket[]> {
  const supabase = createAdminClient();

  let phones: string[] = [];
  try {
    const { data: subs } = await supabase
      .from("human_privilege_alert_subscribers")
      .select("phone")
      .eq("place_id", placeId)
      .eq("status", "confirmed")
      .limit(5000);
    phones = Array.from(
      new Set(((subs as Array<{ phone: string | null }> | null) || []).map((s) => String(s.phone || "").trim()).filter(Boolean)),
    );
  } catch {
    /* résilient */
  }

  const levelByPhone = new Map<string, number>();
  if (phones.length) {
    try {
      const { data: rels } = await supabase
        .from("human_privilege_relationships")
        .select("member_phone,level")
        .eq("place_id", placeId)
        .in("member_phone", phones);
      ((rels as Array<{ member_phone: string; level: number }> | null) || []).forEach((r) =>
        levelByPhone.set(r.member_phone, Number(r.level) || 0),
      );
    } catch {
      /* résilient → niveau 0 par défaut */
    }
  }

  return COUP_WAVES.map((w) => ({
    idx: w.idx,
    label: w.label,
    phones: phones.filter((ph) => w.test(levelByPhone.get(ph) || 0)),
  }));
}

export type WaveSnapshot = { idx: number; label: string; fans: number; sent: number; sent_at: string | null };

// Snapshot initial des vagues (compteurs de fans figés à la création de la campagne, rien d'envoyé).
export function snapshotFromBuckets(buckets: WaveBucket[]): WaveSnapshot[] {
  return buckets.map((b) => ({ idx: b.idx, label: b.label, fans: b.phones.length, sent: 0, sent_at: null }));
}
