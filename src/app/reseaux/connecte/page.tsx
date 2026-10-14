// 📣 LE RETOUR APRÈS AVOIR CONNECTÉ UN RÉSEAU — l'intermédiaire le ramène ici.
//
// Une page neutre, sans son jeton : l'adresse passe chez l'intermédiaire. Son
// comptoir est resté ouvert dans l'onglet d'avant, et relit ses comptes dès
// qu'il y revient (voir `assistante/reseaux-comptoir.tsx`).
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "C’est connecté",
  robots: { index: false, follow: false },
};

export default function ReseauConnecte() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "24px 16px",
        background: "#1c1410",
        color: "#f6ecdf",
        fontFamily: "system-ui, -apple-system, sans-serif",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 360 }}>
        <p style={{ fontSize: 56, margin: 0 }} aria-hidden="true">
          ✅
        </p>
        <h1 style={{ fontSize: 24, margin: "12px 0 8px" }}>C’est connecté !</h1>
        <p style={{ opacity: 0.85, lineHeight: 1.5, margin: 0 }}>
          Tu peux fermer cet onglet et revenir à ton comptoir : tes prochaines annonces partiront aussi sur ce réseau.
        </p>
      </div>
    </main>
  );
}
