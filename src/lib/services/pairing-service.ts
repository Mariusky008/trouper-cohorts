import { createClient } from "@/lib/supabase/server";

interface Pairing {
  day: number;
  user1_id: string;
  user2_id: string;
}

/**
 * Génère les binômes pour une durée donnée en utilisant l'algorithme Round-Robin.
 * Assure une rotation maximale sans doublons.
 */
export function generateCohortPairings(userIds: string[], numberOfDays: number = 14): Pairing[] {
  let participants = [...userIds];
  
  // Si nombre impair, on gère plus tard (pour l'algo standard Round Robin, il faut un nombre pair,
  // le "dummy" est souvent utilisé pour désigner celui qui a "bye" ou pause, 
  // mais ici on veut que tout le monde bosse.
  // Stratégie simple : Si impair, on retire le dernier pour l'algo, et on l'ajoutera manuellement à un groupe pour faire un trio).
  
  let floater: string | null = null;
  if (participants.length % 2 !== 0) {
    floater = participants.pop()!;
  }

  const n = participants.length;
  const pairings: Pairing[] = [];

  for (let day = 1; day <= numberOfDays; day++) {
    // Pour chaque jour, on génère les paires
    for (let i = 0; i < n / 2; i++) {
      const p1 = participants[i];
      const p2 = participants[n - 1 - i];

      // Si c'est la dernière paire et qu'on a un "floater" (nombre impair au départ),
      // on peut décider de l'ajouter ici pour faire un trio, ou on gère ça en logique métier.
      // Pour la structure de base de données qui attend des paires strictes, 
      // on va dire que le floater est appairé avec p1 (et p1 aura 2 lignes ou on gère un trio).
      
      // Pour rester simple dans la DB (user1, user2), on crée une paire normale.
      pairings.push({ day, user1_id: p1, user2_id: p2 });
      
      if (floater && i === 0) {
        // Le floater rejoint la première paire pour faire un trio
        // On crée une entrée spéciale ou on le note. 
        // Dans notre DB actuelle, on peut créer une paire (floater, p2) aussi.
        // Cela signifie que p2 aura deux binômes : p1 et floater.
        pairings.push({ day, user1_id: floater, user2_id: p2 });
      }
    }

    // Rotation des participants (sauf le premier qui reste fixe pour l'algo pivot)
    // [0, 1, 2, 3, 4, 5] -> [0, 5, 1, 2, 3, 4]
    if (n > 1) {
        const moving = participants.splice(1, participants.length - 1);
        const last = moving.pop()!;
        moving.unshift(last);
        participants = [participants[0], ...moving];
    }
  }

  return pairings;
}

/**
 * Sauvegarde les paires générées dans la base de données.
 */
export async function savePairingsToDB(cohortId: string, pairings: Pairing[]) {
    const supabase = await createClient();
    
    const records = pairings.map(p => ({
        cohort_id: cohortId,
        day_number: p.day,
        user1_id: p.user1_id,
        user2_id: p.user2_id
    }));

    const { error } = await supabase.from('cohort_pairs').insert(records);
    
    if (error) {
        console.error("Error saving pairings:", error);
        throw error;
    }
    
    return { success: true, count: records.length };
}
