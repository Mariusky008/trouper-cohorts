"use client";

// 🖼️ LA CARTE, REFAITE AUTOUR DE LA PHOTO — proposition, pas encore le produit.
//
// ═══ POURQUOI CETTE PAGE EXISTE ════════════════════════════════════════════
//
// « J'aurais aimé, comme sur cette proposition de mon designer, qu'on puisse
// voir davantage le cœur de la photo, c'est-à-dire ce qu'on va vouloir
// essayer. Notre annonce cache beaucoup le cœur de la proposition : on ne voit
// pas bien la coupe, et c'est pareil pour les vêtements, les ongles, les
// bijoux. Peut-être qu'il a mis la photo entière mais seulement sur trois
// quarts de l'écran pour que ça produise cet effet ? »
//
// SON HYPOTHÈSE EST LA BONNE, ET C'EST TOUT LE SUJET. Notre carte pose la
// photo en fond de TOUT l'écran, puis empile le titre, le prix, les
// vignettes, la colonne de boutons, le nom, la note et le bouton d'essai
// PAR-DESSUS. La photo n'a donc aucune zone à elle : quoi qu'elle montre,
// quelque chose la recouvre — et sur un portrait, ce quelque chose tombe
// toujours sur le visage.
//
// LA PROPOSITION DONNE À LA PHOTO UNE BANDE QUI EST LA SIENNE. Elle occupe le
// haut de l'écran, sans rien au milieu ; les textes descendent dans son bas,
// là où il y a une épaule et pas un œil ; tout le reste vit SOUS elle, sur le
// panneau sombre. Rien n'est supprimé : la colonne de trois boutons devient
// une rangée, « Essayer » et « Prendre rendez-vous » deviennent deux étapes
// numérotées, et la ligne d'infos du bas reprend ce que le titre disait deux
// fois.
//
// ELLE NE TOUCHE PAS AU PRODUIT. C'est une page à part, à son adresse, pour
// qu'il la regarde sur son téléphone avant qu'on décide. La vraie carte est
// inchangée.
import { useMemo, useState } from "react";
import { toutesLesCartes } from "@/lib/direct/apercu-habitant";
import { MURS } from "@/lib/direct/fantomes";

export default function Proposition() {
  /* ON PREND LA CARTE ET L'ANNONCE DONT IL PARLE — la coupe homme du salon du
     centre — dans les VRAIES données, pas dans une maquette recopiée. Une
     proposition faite sur des chiffres inventés ne prouve rien du tout. */
  const { carte, annonce, coupes, lieu } = useMemo(() => {
    const c = toutesLesCartes().find((x) => x.id === "coif-centre");
    const a = c?.moments.find((m) => m.titre === "Coupe homme") ?? c?.moments[0];
    /* LE MUR PORTE LA CLÉ DU MÉTIER, pas celle de la carte : « coiffeur », et
       non « coif-centre ». Les deux identifiants se ressemblent assez pour
       qu'on les confonde, et la bande de vignettes sortait vide sans rien
       dire — un `find` qui ne trouve pas rend `undefined`, et `undefined` ne
       fait pas de bruit. */
    const mur = MURS.find((m) => m.cle === "coiffeur");
    return {
      carte: c,
      annonce: a,
      coupes: (mur?.essai?.pieces ?? []).filter((p) => p.photo).slice(0, 5),
      /* LE ROND DU HAUT MONTRE LE LIEU, PAS LA PRESTATION. Sur sa maquette
         c'est l'intérieur du salon ; chez nous `carte.photo` est devenue une
         coupe — et on affichait donc deux fois la même chose, la grande et le
         rond. Le mur porte la photo du lieu, c'est elle qu'on prend. */
      lieu: mur?.photoLieu ?? "",
    };
  }, []);

  /* LA VIGNETTE CHOISIE CHANGE LA GRANDE IMAGE. C'est ce que fait sa
     proposition — la première vignette est encadrée — et c'est ce qui rend la
     bande utile : cinq coupes du salon, on les regarde une par une. */
  /* ON OUVRE SUR LA PHOTO DE L'ANNONCE, pas sur la première pièce du salon.
     « Coupe homme » ouvrait sur un motif rasé vu de dos : la carte montrait
     autre chose que ce qu'elle annonçait, ce qui est exactement le défaut
     qu'on répare ailleurs. La vignette correspondante s'allume. */
  const depart = Math.max(
    0,
    coupes.findIndex((p) => p.photo === annonce?.photo),
  );
  const [choisie, setChoisie] = useState(depart);
  const grande = coupes[choisie]?.photo || annonce?.photo || carte?.photo || "";

  if (!carte || !annonce) return null;

  return (
    <div className="pr-tel">
      <div className="pr-carte">
        {/* ═══ 1 · LA BANDE DE LA PHOTO ════════════════════════════════════
            Elle fait cinquante-huit pour cent de la hauteur. Au-dessus, une
            barre fine ; au milieu, rien ; en bas, un voile et le texte. */}
        <div className="pr-photo" style={{ backgroundImage: `url("${encodeURI(grande)}")` }}>
          <header className="pr-haut">
            {lieu && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="pr-rond" src={lieu} alt="" />
            )}
            <div className="pr-qui">
              <b>{carte.nom}</b>
              <span>
                <i>★</i> {carte.google?.note} ({carte.google?.avis} avis) · à {carte.metres} m ·{" "}
                {carte.ville}
              </span>
            </div>
          </header>

          <div className="pr-voile" />
          <div className="pr-titre">
            <h1>{annonce.titre}</h1>
            <p>{annonce.lignes?.[0]}</p>
            <div className="pr-prix">
              <b>{annonce.prix}</b>
              {annonce.lignes?.[1] && <span>{annonce.lignes[1]}</span>}
            </div>
          </div>
        </div>

        {/* ═══ 2 · LES COUPES DU SALON, SOUS LA PHOTO ══════════════════════
            Elles étaient posées SUR l'image, au milieu du visage. Ici elles
            ont leur ligne, sur le panneau, et elles servent : on tape, la
            grande change. */}
        <div className="pr-vignettes">
          {coupes.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={i === choisie ? "on" : ""}
              onClick={() => setChoisie(i)}
              aria-label={p.nom}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.photo} alt="" />
            </button>
          ))}
        </div>

        {/* ═══ 3 · LES DEUX GESTES, NUMÉROTÉS ══════════════════════════════
            « Essayer sur moi » et « Prendre rendez-vous » existaient déjà :
            l'un en grand bouton, l'autre perdu dans la colonne de droite. Les
            numéroter dit l'ordre dans lequel ils se font — on essaie, puis on
            réserve — ce que la colonne ne disait pas. */
        }
        <div className="pr-gestes">
          <button type="button" className="pr-geste pr-un">
            <span className="pr-etape">Étape 1</span>
            <b>Essayez cette coupe sur vous</b>
            <span className="pr-sous">avec la caméra ou une photo</span>
            <i>→</i>
          </button>
          <button type="button" className="pr-geste pr-deux">
            <span className="pr-etape">Étape 2</span>
            <b>Réservez cette coupe</b>
            <span className="pr-sous">chez {carte.nom}</span>
            <i>→</i>
          </button>
        </div>

        {/* ═══ 4 · CE QUI ÉTAIT DANS LA COLONNE DE DROITE ══════════════════
            Trois boutons empilés sur la photo, à hauteur de visage. Ils
            deviennent une rangée sous les gestes : même fonctions, même
            nombre, mais plus rien devant l'image. */}
        <div className="pr-rang">
          <button type="button">
            <i>👥</i>
            <span>En parler</span>
          </button>
          <button type="button">
            <i>♡</i>
            <span>Favori</span>
          </button>
          <button type="button">
            <i>↓</i>
            <span>Toutes les offres</span>
          </button>
        </div>

        {/* ═══ 5 · LA LIGNE DU BAS ═════════════════════════════════════════
            Elle reprend ce que le titre disait déjà — la prestation, la
            durée, l'adresse — mais posée à plat, lisible sans avoir à lire
            par-dessus une photo. */}
        <div className="pr-pied">
          <div>
            <i>✂️</i>
            <b>{annonce.lignes?.[0]}</b>
            <span>{carte.metier}</span>
          </div>
          <div>
            <i>🕐</i>
            <b>{annonce.lignes?.[1]}</b>
            <span>Durée du rendez-vous</span>
          </div>
          <div>
            <i>📍</i>
            <b>à {carte.metres} m</b>
            <span>{carte.nom}</span>
          </div>
        </div>
      </div>

      <p className="pr-note">
        Proposition — la carte du produit n’est pas modifiée. Tapez une vignette pour changer la
        grande photo.
      </p>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .pr-tel{min-height:100dvh;background:#05060b;display:grid;justify-items:center;
          align-content:start;gap:14px;padding:18px 12px 40px;
          font:15px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;}
        .pr-carte{width:min(420px,100%);background:#0b0d16;border-radius:26px;overflow:hidden;
          box-shadow:0 30px 80px rgba(0,0,0,.6);}

        /* LA BANDE DE LA PHOTO — c'est la seule mesure qui compte ici. */
        .pr-photo{position:relative;aspect-ratio:1/1.12;background:#11131f center/cover no-repeat;
          background-image:inherit;}
        .pr-photo{background-size:cover;background-position:center 18%;}
        .pr-haut{position:relative;z-index:2;display:flex;align-items:center;gap:10px;
          padding:12px 14px;background:linear-gradient(180deg,rgba(0,0,0,.66),transparent);}
        .pr-rond{width:44px;height:44px;border-radius:50%;object-fit:cover;flex:none;
          border:2px solid rgba(255,255,255,.65);}
        .pr-qui{min-width:0;color:#fff;}
        .pr-qui b{display:block;font-size:15px;line-height:1.2;}
        .pr-qui span{display:block;font-size:11.5px;color:rgba(255,255,255,.8);margin-top:2px;}
        .pr-qui i{color:#ffcc33;font-style:normal;}
        .pr-voile{position:absolute;left:0;right:0;bottom:0;height:56%;
          background:linear-gradient(180deg,transparent,rgba(5,6,11,.2) 38%,rgba(5,6,11,.92));}
        .pr-titre{position:absolute;left:16px;right:16px;bottom:14px;z-index:2;color:#fff;}
        .pr-titre h1{margin:0;font-size:34px;line-height:.98;font-weight:800;letter-spacing:-.02em;
          text-shadow:0 2px 18px rgba(0,0,0,.5);}
        .pr-titre p{margin:6px 0 0;font-size:13.5px;color:rgba(255,255,255,.86);}
        .pr-prix{display:flex;align-items:baseline;gap:10px;margin-top:4px;}
        .pr-prix b{font-size:38px;font-weight:800;color:#ffd233;letter-spacing:-.02em;
          text-shadow:0 2px 18px rgba(0,0,0,.5);}
        .pr-prix span{font-size:13px;color:rgba(255,255,255,.86);}

        .pr-vignettes{display:flex;gap:8px;padding:12px 14px 2px;overflow-x:auto;
          scrollbar-width:none;}
        .pr-vignettes::-webkit-scrollbar{display:none;}
        .pr-vignettes button{flex:none;width:62px;height:62px;padding:0;border:2px solid transparent;
          border-radius:14px;overflow:hidden;background:#11131f;cursor:pointer;}
        .pr-vignettes button.on{border-color:#a855f7;box-shadow:0 0 0 3px rgba(168,85,247,.25);}
        .pr-vignettes img{width:100%;height:100%;object-fit:cover;display:block;}

        .pr-gestes{display:grid;gap:9px;padding:12px 14px 0;}
        .pr-geste{position:relative;display:grid;gap:1px;text-align:left;padding:13px 46px 13px 15px;
          border:0;border-radius:17px;cursor:pointer;color:#fff;}
        .pr-un{background:linear-gradient(90deg,#7b4dff,#e0389f);}
        .pr-deux{background:#161a2a;border:1px solid #262c44;}
        .pr-etape{font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;
          color:rgba(255,255,255,.72);}
        .pr-geste b{font-size:17px;font-weight:800;line-height:1.15;}
        .pr-sous{font-size:12px;color:rgba(255,255,255,.74);}
        .pr-geste i{position:absolute;right:14px;top:50%;transform:translateY(-50%);
          width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.16);
          display:grid;place-items:center;font-style:normal;font-size:17px;}

        .pr-rang{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:11px 14px 0;}
        .pr-rang button{display:grid;gap:3px;justify-items:center;padding:10px 4px;border:0;
          border-radius:14px;background:#12162400;color:#c9d0ea;cursor:pointer;font-size:11.5px;}
        .pr-rang button{background:#121624;}
        .pr-rang i{font-style:normal;font-size:17px;}

        .pr-pied{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin:14px 0 0;
          padding:13px 10px 16px;border-top:1px solid #1b2033;}
        .pr-pied>div{display:grid;justify-items:center;text-align:center;gap:2px;padding:0 4px;}
        .pr-pied i{font-style:normal;font-size:16px;}
        .pr-pied b{font-size:12.5px;color:#eef;font-weight:700;line-height:1.2;}
        .pr-pied span{font-size:10.5px;color:#7f89ab;line-height:1.2;}

        .pr-note{color:#6f7796;font-size:12.5px;text-align:center;max-width:420px;margin:0;}
      `,
        }}
      />
    </div>
  );
}
