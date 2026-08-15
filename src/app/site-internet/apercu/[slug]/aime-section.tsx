// CE QUE LES GENS AIMENT ICI — à la place d'une note sur cinq.
//
// « 4,6 ★ » est un chiffre qu'on ne sait pas interpréter et qui ne donne envie
// de rien. « Le magret du vendredi » dit ce qu'on vient chercher. C'est la
// seule chose que Google ne sait pas produire, parce qu'elle ne se demande pas
// dans un formulaire : elle se déduit de ce que les gens ont fait.
//
// TROIS LIGNES MAXIMUM, ET RIEN EN DESSOUS DU SEUIL. Un commerce sans
// historique n'a pas encore de raisons à montrer : la section n'existe pas,
// elle ne s'affiche ni vide ni « bientôt ». C'est la règle de dégradation
// appliquée telle quelle — et la seule alternative serait d'inventer, ce que
// nos propres règles interdisent.
//
// Composant SERVEUR, sans état : il ne fait que lire et rendre.
import type { Aime } from "@/lib/direct/aime";

export function AimeSection({ lignes, ville }: { lignes: Aime[]; ville: string }) {
  if (!lignes.length) return null;
  return (
    <section
      style={{
        padding: "18px 16px 20px",
        background: "#14201A",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 800, color: "#7E9A8D" }}>
        Ce que les gens aiment ici
      </div>
      <div style={{ marginTop: 11, display: "flex", flexDirection: "column", gap: 8 }}>
        {lignes.map((l) => (
          <div
            key={l.publicationId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 14,
              padding: "11px 13px",
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 17, flex: "none" }}>{l.emoji}</span>
            <span style={{ fontSize: 14.5, fontWeight: 700, flex: 1, minWidth: 0 }}>{l.label}</span>
            {/* LE NOMBRE EST ÉCRIT, et c'est ce qui sépare cette section d'un
                avis : « 7 personnes » se vérifie, « très apprécié » ne se
                vérifie pas. */}
            <span style={{ fontSize: 12, color: "#7E9A8D", fontWeight: 700, flex: "none" }}>
              {l.compte} personne{l.compte > 1 ? "s" : ""}
            </span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, fontSize: 11, color: "#5E7A6D", lineHeight: 1.45 }}>
        Construit à partir des réactions des habitants{ville ? ` de ${ville}` : ""}, jamais d&apos;une note.
      </div>
    </section>
  );
}
