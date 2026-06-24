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

// skipped = vague traversée automatiquement car 0 fan à ce niveau (le pro n'a rien à faire).
export type WaveSnapshot = { idx: number; label: string; fans: number; sent: number; sent_at: string | null; skipped?: boolean };

// Index de la 1ʳᵉ vague qui a des fans, à partir de `from` (incl.). -1 si plus aucune vague non vide.
export function firstNonEmptyWave(buckets: WaveBucket[], from = 0): number {
  for (let i = Math.max(0, from); i < buckets.length; i += 1) {
    if ((buckets[i]?.phones.length || 0) > 0) return i;
  }
  return -1;
}

// Snapshot initial des vagues (compteurs de fans figés à la création de la campagne, rien d'envoyé).
export function snapshotFromBuckets(buckets: WaveBucket[]): WaveSnapshot[] {
  return buckets.map((b) => ({ idx: b.idx, label: b.label, fans: b.phones.length, sent: 0, sent_at: null }));
}

// Quota mensuel de messages Coup de feu inclus dans l'abonnement (maîtrise du coût WhatsApp).
export const COUP_MONTHLY_QUOTA = 300;

// Quota mensuel de posts « canal gratuit ». Le canal ne coûte rien à Popey, MAIS un coup de feu doit
// rester rare/spécial (sinon spam du canal de la ville → les fans se désabonnent). On le plafonne.
export const COUP_CHANNEL_MONTHLY_QUOTA = 8;

// Nombre de posts canal déjà publiés ce mois pour un commerçant. Un coup de feu en mode canal ne pousse
// AUCUNE vague payante → il reste à current_wave = -1 (le mode vagues passe immédiatement à >= 0).
export async function monthlyChannelPostsUsed(placeId: string): Promise<number> {
  const supabase = createAdminClient();
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  try {
    const { count } = await supabase
      .from("human_privilege_coup_campaigns")
      .select("id", { count: "exact", head: true })
      .eq("place_id", placeId)
      .eq("current_wave", -1)
      .gte("created_at", monthStart);
    return Number(count || 0);
  } catch {
    return 0; // table absente → résilient
  }
}

// Nombre de messages Coup de feu déjà envoyés ce mois pour un commerçant (somme des vagues envoyées).
export async function monthlyMessagesUsed(placeId: string): Promise<number> {
  const supabase = createAdminClient();
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  let used = 0;
  try {
    const { data: camps } = await supabase
      .from("human_privilege_coup_campaigns")
      .select("waves,created_at")
      .eq("place_id", placeId)
      .gte("created_at", monthStart)
      .limit(200);
    for (const c of (camps as Array<{ waves: Array<{ sent?: number }> }> | null) || []) {
      for (const w of Array.isArray(c.waves) ? c.waves : []) used += Number(w.sent) || 0;
    }
  } catch {
    /* résilient */
  }
  return used;
}
