/**
 * 📈 COMPTER UN GESTE, DEPUIS LE NAVIGATEUR — une écoute, une demande, un
 * partage, sur la page d'un commerçant. Voir `api/site-internet/compter`.
 *
 * `sendBeacon` d'abord : il part même quand la page se ferme juste après (un
 * partage ouvre souvent une autre application). Sans lui, un `fetch` qui
 * survit à la page. Jamais d'erreur : un compteur ne gêne personne.
 *
 * FICHIER NAVIGATEUR.
 */
export function compter(slug: string, quoi: "ecoutes" | "demandes" | "partages"): void {
  if (typeof window === "undefined" || !/^[a-z0-9-]{2,120}$/i.test(slug)) return;
  const corps = JSON.stringify({ slug, quoi });
  try {
    if (navigator.sendBeacon?.("/api/site-internet/compter", new Blob([corps], { type: "application/json" }))) return;
  } catch {
    /* on tente autrement */
  }
  void fetch("/api/site-internet/compter", { method: "POST", headers: { "content-type": "application/json" }, body: corps, keepalive: true }).catch(
    () => {},
  );
}
