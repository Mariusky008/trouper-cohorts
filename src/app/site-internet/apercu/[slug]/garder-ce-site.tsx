// 📝 « GARDER CE SITE » — le seul meuble de démarchage qui reste sur la page.
//
// ═══ CE QU'ON A RETIRÉ, ET POURQUOI ═══════════════════════════════════════
//
// « Garder le formulaire seul. »
//
// La page du commerçant portait quatre objets de démarchage superposés : la
// barre « Suivre ce commerce », le bandeau du collectif, la bande de l'offre
// partenaire, et ce formulaire. Trois d'entre eux parlaient au COMMERÇANT par
// -dessus une page qui, maintenant, s'adresse à ses CLIENTS — et ils le
// faisaient au milieu de sa boutique, entre ses photos et sa carte.
//
// UNE SEULE DEMANDE, ET TOUT À LA FIN. Elle arrive quand la démonstration
// s'est tue et quand la page a été vue jusqu'au bout : à ce moment-là, il sait
// exactement ce qu'on lui propose, et la question « vous le gardez ? » est la
// suite naturelle de ce qu'il vient de regarder. Posée plus haut, elle
// l'interrompait pour lui vendre ce qu'il n'avait pas encore vu.
//
// ═══ IL NE SE DESSINE QUE POUR LUI ════════════════════════════════════════
//
// Jamais pour un client venu du Direct, d'un lien WhatsApp ou du QR de la
// vitrine : eux verraient le commerçant en train de se vendre son propre site,
// ce qui est à la fois incompréhensible et humiliant. La décision est prise
// par l'appelant (`modeDemo`), qui seul sait d'où vient le visiteur.
import { LeadForm } from "../../[slug]/lead-form";

export function GarderCeSite({
  slug,
  phoneDisplay,
}: {
  slug: string;
  phoneDisplay?: string;
}) {
  return (
    <section className="gcs" id="garder">
      <Styles />
      <div className="gcs-c">
        <div className="gcs-k">Votre page</div>
        {/* ═══ LE TITRE NE PORTE PAS SON NOM, ET C'EST UNE LEÇON ═══════════
            Premier jet : « Voilà ce que {nom} donnerait dans ClikMe. » Le nom
            d'un commerce ne s'accorde pas — « Voilà ce que Un salon du centre
            donnerait », « Voilà ce que L'Ardoise Landaise donnerait ». Il
            faudrait deviner l'article de chaque enseigne de France pour écrire
            une phrase correcte, et on se tromperait sur la moitié. Son nom est
            déjà dix fois sur la page au-dessus : la dernière chose qu'il lise
            n'a pas besoin de le répéter, elle a besoin de lui dire quoi faire. */}
        <h2 className="gcs-t">Elle est à vous, si vous la voulez.</h2>
        <p className="gcs-p">
          Elle vous plaît ? Réservez-la gratuitement aujourd’hui. On vérifie ensemble vos
          informations, puis on la met en ligne sous 72 h.
          <br />
          Sinon, ça s’arrête là — sans frais, sans relance.
          {phoneDisplay ? (
            <>
              <br />
              <b>Marius · {phoneDisplay}</b>
            </>
          ) : null}
        </p>
        <div className="gcs-f">
          <LeadForm
            slug={slug}
            intro="Laissez votre numéro : on réserve votre page et on vous rappelle pour la personnaliser."
            submitLabel="✨ Garder cette page gratuitement"
          />
        </div>
      </div>
    </section>
  );
}

/**
 * LA FEUILLE EST ICI, ET ELLE EST COURTE EXPRÈS.
 *
 * Le bloc vit sous la boutique, donc sur son fond de nuit : il reprend sa
 * couleur de page et son encre, et rien d'autre. Le formulaire lui-même garde
 * ses classes Tailwind claires — il est posé sur une carte blanche, ce qui en
 * fait le seul objet lumineux du bas de page, et c'est exactement l'effet
 * voulu pour la seule chose qu'on lui demande de faire.
 */
function Styles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.gcs{ background:rgb(5,9,12); padding:0 16px calc(48px + env(safe-area-inset-bottom)); }
.gcs-c{ max-width:560px; margin:0 auto; padding:34px 0 0;
  border-top:1px solid rgba(255,255,255,.10); }
.gcs-k{ font-size:11px; letter-spacing:.14em; text-transform:uppercase;
  color:rgba(255,255,255,.44); font-weight:700; }
.gcs-t{ margin:10px 0 0; font-size:26px; line-height:1.18; font-weight:800;
  color:#F6F2EC; letter-spacing:-.01em; }
.gcs-p{ margin:12px 0 0; font-size:14px; line-height:1.55; color:rgba(246,242,236,.72); }
.gcs-p b{ color:#F6F2EC; }
.gcs-f{ margin-top:20px; background:#fff; border-radius:20px; padding:18px 16px;
  box-shadow:0 18px 40px rgba(0,0,0,.42); }
@media (min-width:640px){ .gcs-t{ font-size:30px; } }
`,
      }}
    />
  );
}
