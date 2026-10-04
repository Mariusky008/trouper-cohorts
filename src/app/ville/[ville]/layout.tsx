// LA COQUE DU DIRECT.
//
// Elle portait les quatre onglets ; elle garde les styles des anciennes pages et
// leur porte vers la ville. Elle n'est jamais démontée :
// c'est ce qui fait que passer d'un onglet à l'autre ne recharge rien, que le
// bouton « retour » fonctionne, et que revenir au fil retrouve sa position de
// défilement. Une barre d'onglets recopiée dans chaque page donnerait quatre
// pages qui clignotent, pas une application.
import type { ReactNode } from "react";
import { StylesDirect } from "./_ui/styles";
import { RetourVille } from "./_ui/retour-ville";

export default async function DirectLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ ville: string }>;
}) {
  const { ville } = await params;
  return (
    <div className="dir">
      <StylesDirect />
      <div className="vue">{children}</div>
      {/* LES QUATRE ONGLETS SONT PARTIS — voir `RetourVille`. */}
      <RetourVille ville={ville} />
    </div>
  );
}
