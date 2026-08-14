// LE CODE À PRÉSENTER AU COMMERÇANT.
//
// Dérivé de la campagne et de la personne, donc STABLE : la même personne qui
// rouvre l'écran retrouve le même code, et deux personnes sur la même offre en
// ont deux différents. Pas de table, pas de séquence à réserver, et surtout
// rien à synchroniser entre l'écran et la base.
//
// CE N'EST PAS UN SECRET. Il sert à ce que le commerçant retrouve la ligne, pas
// à prouver une identité — quatre chiffres suffisent pour un commerce qui en
// voit dix par jour. Le jour où il faudra qu'il soit infalsifiable, ce sera un
// autre objet, avec sa table et son expiration.
//
// PARTAGÉ ENTRE LA ROUTE ET L'ÉCRAN : deux calculs du même code finiraient par
// diverger, et le commerçant verrait deux codes pour une seule réservation.
export function codeDe(campagneId: string, habitantId: string): string {
  let h = 0;
  const t = `${campagneId}:${habitantId}`;
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0;
  // Ni « I » ni « O » : confondus avec 1 et 0 quand on les lit à voix haute.
  const lettres = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  // `>>>` et non `>>` : au-delà de 2³¹, le décalage SIGNÉ rend un nombre
  // négatif, dont le modulo l'est aussi — et `lettres[-3]` vaut `undefined`.
  // Le code s'affichait « Lundefined-2506 » une fois sur deux.
  return `${lettres[h % 24]}${lettres[(h >>> 5) % 24]}-${String(h % 10000).padStart(4, "0")}`;
}
