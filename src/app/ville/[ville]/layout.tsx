// LA COQUE DU DIRECT.
//
// Elle porte les quatre onglets et les styles, et elle n'est jamais démontée :
// c'est ce qui fait que passer d'un onglet à l'autre ne recharge rien, que le
// bouton « retour » fonctionne, et que revenir au fil retrouve sa position de
// défilement. Une barre d'onglets recopiée dans chaque page donnerait quatre
// pages qui clignotent, pas une application.
import type { ReactNode } from "react";
import { StylesDirect } from "./_ui/styles";
import { Onglets } from "./_ui/onglets";

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
      <Onglets ville={ville} />
    </div>
  );
}
