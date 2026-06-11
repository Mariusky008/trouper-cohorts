// Garde d'authentification partagée pour les routes cron.
// Même contrat que les crons existants (voice-queue, etc.) : on accepte
// l'en-tête `Authorization: Bearer ${CRON_SECRET}` (utilisé par Vercel Cron)
// OU le paramètre `?secret=...` pour les déclenchements manuels.
//
// NOTE : si CRON_SECRET n'est pas défini, on laisse passer (fail-open) pour
// rester cohérent avec les crons déjà en place et ne pas casser la prod si la
// variable manque. ⚠️ En production, CRON_SECRET DOIT être défini pour que
// cette garde ait un effet — sinon toutes les routes cron restent ouvertes.
export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  try {
    const { searchParams } = new URL(request.url);
    return searchParams.get("secret") === secret;
  } catch {
    return false;
  }
}
