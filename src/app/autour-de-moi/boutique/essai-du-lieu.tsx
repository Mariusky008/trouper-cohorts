"use client";

// ✨ L'ESSAYAGE DU LIEU — la vitrine, puis l'atelier.
//
// « Pour les essayages "Visualiser…" ou "Découvrir ce plat", on garde le même
// processus que nous avons développé sur /autour-de-moi, et qui se retrouvera
// dans l'onglet "Expérience". »
//
// CE N'EST PAS UNE SECONDE VERSION, C'EST LA MÊME. La vitrine (`BlocFantome` :
// le fantôme avec l'outil du métier, la question, le grand bouton, la bande de
// styles) puis l'atelier (`MurContenu` : la prise de vue, l'essai, le rendu,
// le salon) sont exactement ceux du fil et de la page longue — mêmes
// composants, même ordre de vérité (essai, soirée, avant-goût, mur), mêmes
// choix qui traversent de la vitrine à l'atelier. Seul l'habillage change :
// l'atelier prend la nuit brune de la page à onglets.
//
// Le câblage est celui de la section « À essayer » de `boutique.tsx`, sorti
// tel quel pour que la page à onglets de chaque métier le monte à son tour.
import { useEffect, useMemo, useState } from "react";
import { BlocFantome } from "@/components/direct/bloc-fantome";
import { MurContenu } from "@/components/direct/mur-contenu";
import { HEURE_MAX, HEURE_MIN, momentEnCours, type CarteAutour } from "@/lib/direct/apercu-habitant";
import { murDeLaCarte } from "@/lib/direct/fantomes";
import { parcoursPromis } from "@/lib/direct/parcours-promis";

/** Ce que l'atelier remet quand on veut montrer son rendu aux amis. */
export type RenduEssai = Parameters<NonNullable<Parameters<typeof MurContenu>[0]["onSalon"]>>[0];

export function EssaiDuLieu({
  c,
  saPage,
  onReserver,
  onSalon,
}: {
  c: CarteAutour;
  /** On montre au commerçant SA page : la vitrine « bientôt » lui parle à lui. */
  saPage: boolean;
  onReserver: () => void;
  onSalon: (o: RenduEssai) => void;
}) {
  /* L'HEURE APRÈS LE PREMIER RENDU, sinon serveur et navigateur calculent
     deux heures différentes et React refuse l'hydratation. */
  const [heure, setHeure] = useState(12);
  useEffect(() => {
    const d = new Date();
    const h = d.getHours() + d.getMinutes() / 60;
    setHeure(h >= HEURE_MIN && h <= HEURE_MAX ? h : 12);
  }, []);
  const [essaiOuvert, setEssaiOuvert] = useState(false);
  const [styleChoisi, setStyleChoisi] = useState<string | undefined>(undefined);
  const [rayonChoisi, setRayonChoisi] = useState("");

  const murDuLieu = useMemo(
    () =>
      murDeLaCarte({
        id: c.id,
        nom: c.nom,
        metier: c.metier,
        branche: c.branche,
        ville: c.ville,
        distance: c.distance,
        photo: c.photo,
        google: c.google,
        telephone: c.telephone,
        catalogue: c.catalogue,
        moment: momentEnCours(c, heure),
      }),
    [c, heure],
  );
  const onEssaie = murDuLieu.depot === "essai";
  const promis = useMemo(
    () =>
      !onEssaie && !murDuLieu.gout && !murDuLieu.soiree ? parcoursPromis({ branche: c.branche, metier: c.metier }) : undefined,
    [onEssaie, murDuLieu.gout, murDuLieu.soiree, c.branche, c.metier],
  );

  return (
    <div className={`mu bt-mu${essaiOuvert ? " atelier" : " vitrine"}`}>
      <StylesEssai />
      {promis ? (
        <BlocFantome mur={murDuLieu} quoi="bientot" promis={promis} pourLui={saPage} onPhoto={() => {}} onStyle={() => {}} />
      ) : !essaiOuvert ? (
        <BlocFantome
          mur={murDuLieu}
          quoi={onEssaie ? "essai" : murDuLieu.soiree ? "soiree" : murDuLieu.gout ? "gout" : "mur"}
          onPhoto={() => setEssaiOuvert(true)}
          onCollection={(rayon) => {
            setRayonChoisi(rayon ?? "");
            setEssaiOuvert(true);
          }}
          onStyle={(id) => {
            setStyleChoisi(id);
            setEssaiOuvert(true);
          }}
          styleChoisi={styleChoisi}
        />
      ) : (
        <MurContenu
          key={c.id}
          mur={murDuLieu}
          ouvrirSur={onEssaie ? "depot" : undefined}
          piecePrechoisie={styleChoisi}
          rayonPrechoisi={rayonChoisi || undefined}
          onReserver={onReserver}
          onSalon={onSalon}
        />
      )}
    </div>
  );
}

/* L'HABILLAGE, ET LUI SEUL. Les deux classes (.mu.bt-mu) passent devant la
   feuille du mur, rendue après — même raison que `.mu.bq-mu` dans la page
   longue. L'atelier garde une nuit, mais la nôtre : brune. */
function StylesEssai() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        .mu.bt-mu{max-width:none;min-height:0;margin:8px 0 0;background:transparent;}
        .mu.bt-mu.atelier{margin:10px 0 0;padding:16px 12px 20px;border-radius:24px;overflow:hidden;
          background:linear-gradient(178deg,#1C1411 0%,#120C09 58%);
          box-shadow:0 22px 50px -34px rgba(0,0,0,.8);}
        .bt-mu .mu-chez,.bt-mu .mu-haut:not(.essai)>h2,.bt-mu .mu-haut-r h2,
        .bt-mu .mu-haut:not(.essai)>p,.bt-mu .mu-e-tete{display:none;}
        .bt-mu .mu-haut{padding-top:0;}
        .bt-mu .mu-haut-r{justify-content:flex-start;}
        /* LA SUITE DE LA VITRINE EST ÉCRITE POUR UNE PAGE CLAIRE : sur notre
           nuit, « Vous pourriez aussi aimer » tombait sombre sur sombre. */
        .bt-mu .bf-aussi{color:#FFF4E6;}
        `,
      }}
    />
  );
}
