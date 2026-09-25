"use client";

// 🖼️ LA CARTE, RÉORGANISÉE AUTOUR DE LA PHOTO — proposition, pas le produit.
//
// ═══ POURQUOI CETTE PAGE EXISTE ════════════════════════════════════════════
//
// « J'aurais aimé qu'on puisse voir davantage le cœur de la photo, c'est-à-dire
// ce qu'on va vouloir essayer. Peut-être qu'il a mis la photo entière mais
// seulement sur trois quarts de l'écran ? »
//
// SON HYPOTHÈSE EST LA BONNE. La carte pose la photo en fond de TOUT l'écran,
// puis empile le titre, le prix, les vignettes, la colonne de boutons, le nom,
// la note et le bouton d'essai PAR-DESSUS. La photo n'a donc aucune zone à
// elle : quoi qu'elle montre, quelque chose la recouvre — et sur un portrait,
// ce quelque chose tombe sur le visage.
//
// ═══ ET LA PREMIÈRE PROPOSITION AVAIT AMPUTÉ LA CARTE ══════════════════════
//
// « Attention, il manque toutes nos fonctionnalités : les boutons du bas, ceux
// du côté droit… Ne supprime pas nos fonctionnalités, réorganise juste la
// partie photo. »
//
// JUSTE, ET C'EST LA FAUTE CLASSIQUE D'UNE MAQUETTE : on redessine ce qu'on
// regarde et on oublie ce qu'on ne regarde pas. La barre du bas, la colonne de
// droite, le rond des tarifs, la flèche de carte suivante, la bulle des
// essayages, la note Google — tout cela EXISTE et sert. Rien ne disparaît
// ici : les éléments changent de place, pas de nombre.
//
// UNE SEULE CHOSE EST RETIRÉE, ET C'EST LUI QUI LE DEMANDE : la ligne
// « tondeuse · 20 min · à 220 m » que j'avais ajoutée en bas. Elle répétait
// mot pour mot ce que le titre dit déjà trois lignes plus haut.
//
// ═══ CE QUI CHANGE, EN UNE PHRASE ══════════════════════════════════════════
//
// LA PHOTO PREND LE HAUT DE L'ÉCRAN ET RIEN NE PASSE EN SON MILIEU. Les textes
// descendent sous elle ; la colonne de droite descend avec eux ; les vignettes
// des coupes se rangent en dessous. Le reste est à sa place.
//
// ELLE NE TOUCHE PAS AU PRODUIT. C'est une page à part, à son adresse.
import { useMemo, useState } from "react";
import { toutesLesCartes } from "@/lib/direct/apercu-habitant";
import { MURS } from "@/lib/direct/fantomes";

export default function Proposition() {
  /* ON PREND LA CARTE ET L'ANNONCE DONT IL PARLE — la coupe homme du salon du
     centre — dans les VRAIES données. Une proposition faite sur des chiffres
     inventés ne prouve rien. */
  const { carte, annonce, coupes, lieu, promesse } = useMemo(() => {
    const c = toutesLesCartes().find((x) => x.id === "coif-centre");
    const a = c?.moments.find((m) => m.titre === "Coupe homme") ?? c?.moments[0];
    /* LE MUR PORTE LA CLÉ DU MÉTIER, pas celle de la carte : « coiffeur », et
       non « coif-centre ». Un `find` qui ne trouve pas rend `undefined`, et
       `undefined` ne fait pas de bruit — la bande de vignettes sortait vide. */
    const mur = MURS.find((m) => m.cle === "coiffeur");
    return {
      carte: c,
      annonce: a,
      coupes: (mur?.essai?.pieces ?? []).filter((p) => p.photo).slice(0, 5),
      lieu: mur?.photoLieu ?? "",
      promesse: mur?.essai?.mots?.promesse ?? "",
    };
  }, []);

  /* ON OUVRE SUR LA PHOTO DE L'ANNONCE, pas sur la première pièce du salon :
     « Coupe homme » ouvrait sur un motif rasé vu de dos. */
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
            Elle a une hauteur à elle. La barre du haut y reste — elle est
            fine, elle ne couvre rien d'utile — et tout le reste s'arrête net
            à son bord inférieur. */}
        <div className="pr-photo" style={{ backgroundImage: `url("${encodeURI(grande)}")` }}>
          <header className="pr-haut">
            <div className="pr-puce">
              {lieu && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={lieu} alt="" />
              )}
              <div>
                <b>{carte.nom}</b>
                <span>
                  {carte.metier} · {carte.metres} m
                </span>
              </div>
              <i>↗</i>
            </div>
            <span className="pr-filtre">☰ COIFFEURS</span>
            <span className="pr-coeur">♥ 2</span>
            <span className="pr-cloche">🔔</span>
          </header>

          {/* LA FLÈCHE DE LA CARTE SUIVANTE — elle existe, elle reste, et elle
              se pose au bord, pas au milieu du visage. */}
          <button type="button" className="pr-suite" aria-label="Carte suivante">
            ›
          </button>

          {/* LE ROND DES TARIFS RESTE AU COIN. Il y était déjà, et un coin
              n'est pas un visage : on ne le déplace pas pour rien. */}
          <button type="button" className="pr-tarifs">
            <span>LES TARIFS</span>
            <i>✂️</i>
            <span>VOIR ›</span>
          </button>

          {/* ═══ LE TITRE REVIENT SUR LE BAS DE LA PHOTO ══════════════════
              Et c'est le compte qui l'impose, pas le goût. Tout descendre
              sous l'image laissait à la photo quatre cent points sur huit
              cent quarante-quatre, soit moins de la moitié — l'inverse de ce
              qu'il demande. Son designer fait la même chose : le texte est
              SUR la photo, mais en bas, là où il y a une épaule.
              CE QUI COMPTE N'EST PAS « rien sur la photo », c'est « rien au
              milieu de la photo ». */}
          <div className="pr-voile" />
          <div className="pr-titre">
            <h1>{annonce.titre}</h1>
            <p>
              {annonce.lignes?.[0]}
              {annonce.lignes?.[1] ? ` · ${annonce.lignes[1]}` : ""}
            </p>
            <div className="pr-prix">
              <b>{annonce.prix}</b>
              <span>
                <i>📍</i> à {carte.metres} m · {carte.ville}
              </span>
            </div>
          </div>
        </div>

        {/* ═══ 2 · LE PANNEAU, SOUS LA PHOTO ═══════════════════════════════
            Titre, prix, distance, et le rond des tarifs qui était posé sur
            l'image. Ce qui était lisible PAR-DESSUS une photo devient lisible
            sur un fond. */}
        <div className="pr-panneau">
          <div className="pr-nom">
            <b>{carte.nom}</b>
            <span>
              <i>★</i> {carte.google?.note} ({carte.google?.avis} avis)
            </span>
          </div>

          {/* ═══ 3 · LES COUPES DU SALON ═══════════════════════════════════
              Elles étaient posées SUR l'image, au milieu du visage. Ici elles
              ont leur ligne — et elles servent : on tape, la grande change. */}
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

          {/* LA COLONNE DE DROITE, ENTIÈRE, EN RANGÉE. Elle flottait à hauteur
              de visage ; debout elle coûtait deux cent points de hauteur,
              couchée elle en coûte cinquante. Mêmes trois boutons, mêmes
              trois mots. */}
          <div className="pr-rail">
            <button type="button">
              <i>👥</i>
              <span>En parler</span>
            </button>
            <button type="button">
              <i>🗓️</i>
              <span>Rendez-vous</span>
            </button>
            <button type="button">
              <i>♡</i>
              <span>Favori</span>
            </button>
          </div>

          <button type="button" className="pr-offres">
            Voir toutes les offres + infos ↓
          </button>

          {/* LA PHRASE PASSE AU-DESSUS DU BOUTON. Sous lui, la bulle des
              essayages — qui flotte — la recouvrait entièrement : une
              promesse qu'on ne lit pas ne promet rien. */}
          <p className="pr-promesse">✨ {promesse}</p>
          <button type="button" className="pr-essai">
            <i>👻</i> Essayer sur moi <b>→</b>
          </button>

          {/* LA BULLE DES ESSAYAGES — elle existe, elle reste. */}
          <div className="pr-bulle">
            <i>👻👻</i>
            <div>
              <b>2 essayages de cette coupe</b>
              <span>Voir le résultat sur d’autres →</span>
            </div>
          </div>
        </div>

        {/* ═══ 4 · LA BARRE DU BAS, INCHANGÉE ══════════════════════════════ */}
        <nav className="pr-barre">
          <span className="on">
            <i>⚡</i>LE DIRECT
          </span>
          <span>
            <i>🏛️</i>LA VILLE
          </span>
          <span className="pr-fantome">
            <i>👻</i>
          </span>
          <span>
            <i>💬</i>PROPOSITIONS
          </span>
          <span>
            <i>🙂</i>PROFIL
          </span>
        </nav>
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
          font:15px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;}
        .pr-carte{position:relative;width:min(390px,100%);height:844px;background:#0a0c14;
          border-radius:26px;overflow:hidden;display:grid;
          grid-template-rows:auto 1fr auto;box-shadow:0 30px 80px rgba(0,0,0,.6);}

        /* ═══ LA SEULE MESURE QUI COMPTE ICI ═══
           La photo a une bande à elle, et rien ne passe en son milieu. */
        .pr-photo{position:relative;height:424px;background:#11131f;
          background-size:cover;background-position:center 22%;}
        .pr-haut{position:relative;z-index:2;display:flex;align-items:center;gap:6px;
          padding:11px 11px;background:linear-gradient(180deg,rgba(0,0,0,.62),transparent);}
        .pr-puce{display:flex;align-items:center;gap:7px;background:rgba(18,20,30,.82);
          border-radius:999px;padding:5px 9px 5px 5px;min-width:0;flex:1;}
        .pr-puce img{width:26px;height:26px;border-radius:50%;object-fit:cover;flex:none;}
        .pr-puce div{min-width:0;}
        .pr-puce b{display:block;color:#fff;font-size:12px;line-height:1.15;
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .pr-puce span{display:block;color:#9aa4c4;font-size:10px;}
        .pr-puce i{font-style:normal;color:#9aa4c4;font-size:10px;}
        .pr-filtre{background:rgba(18,20,30,.82);color:#fff;border-radius:999px;
          padding:6px 9px;font-size:10px;font-weight:700;letter-spacing:.05em;white-space:nowrap;}
        .pr-coeur{background:rgba(18,20,30,.82);color:#ff5b8a;border-radius:999px;
          padding:6px 8px;font-size:11px;font-weight:700;white-space:nowrap;}
        .pr-cloche{background:rgba(18,20,30,.82);border-radius:50%;width:28px;height:28px;
          display:grid;place-items:center;font-size:12px;flex:none;}
        .pr-suite{position:absolute;right:8px;top:50%;transform:translateY(-50%);
          width:34px;height:34px;border-radius:50%;border:0;background:rgba(18,20,30,.72);
          color:#fff;font-size:20px;line-height:1;cursor:pointer;}

        .pr-panneau{overflow-y:auto;padding:11px 13px 10px;display:grid;
          align-content:start;gap:9px;background:#0a0c14;}
        .pr-panneau *{min-width:0;}
        /* ═══ LE BAS DE LA PHOTO PORTE LE TITRE ═══
           Un voile monte du bas sur quarante-quatre pour cent de la hauteur :
           assez pour que le texte se lise, jamais assez pour atteindre les
           yeux. C'est la mesure qui decide de tout ici. */
        .pr-voile{position:absolute;left:0;right:0;bottom:0;height:44%;
          background:linear-gradient(180deg,transparent,rgba(5,6,11,.18) 34%,rgba(10,12,20,.95));}
        .pr-titre{position:absolute;left:14px;right:14px;bottom:12px;z-index:2;}
        .pr-titre h1{margin:0;font-size:31px;line-height:.95;font-weight:800;color:#fff;
          letter-spacing:-.02em;text-transform:uppercase;text-shadow:0 2px 16px rgba(0,0,0,.55);}
        .pr-titre p{margin:5px 0 0;font-size:12.5px;color:rgba(255,255,255,.88);}
        .pr-prix{display:flex;align-items:baseline;gap:9px;margin-top:3px;flex-wrap:wrap;}
        .pr-prix b{font-size:32px;font-weight:800;color:#ffd233;letter-spacing:-.02em;
          text-shadow:0 2px 16px rgba(0,0,0,.55);}
        .pr-prix span{font-size:11.5px;color:rgba(255,255,255,.88);}
        .pr-prix i{font-style:normal;}
        .pr-nom{display:flex;align-items:baseline;gap:7px;flex-wrap:wrap;}
        .pr-nom b{color:#fff;font-size:13.5px;}
        .pr-nom span{color:#9aa4c4;font-size:12px;}
        .pr-nom i{color:#ffcc33;font-style:normal;}

        /* LE ROND DES TARIFS, AU COIN DE LA PHOTO — il y était déjà. */
        .pr-tarifs{position:absolute;right:12px;top:58px;z-index:2;
          width:72px;height:72px;border-radius:50%;border:2px solid #c4a2ff;
          background:rgba(10,12,20,.78);color:#fff;display:grid;place-content:center;gap:1px;
          font-size:8px;font-weight:800;letter-spacing:.07em;cursor:pointer;}
        .pr-tarifs i{font-style:normal;font-size:15px;}

        /* LA RANGEE DE TROIS, COUCHEE. Debout elle coutait deux cents points. */
        .pr-rail{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;}
        .pr-rail button{display:grid;gap:2px;justify-items:center;border:0;
          border-radius:13px;background:#12162a;color:#c9d0ea;padding:8px 3px;
          font-size:10.5px;line-height:1.15;cursor:pointer;}
        .pr-rail i{font-style:normal;font-size:15px;}

        .pr-vignettes{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;height:54px;}
        .pr-vignettes::-webkit-scrollbar{display:none;}
        .pr-vignettes button{flex:none;width:54px;height:54px;padding:0;
          border:2px solid transparent;border-radius:13px;overflow:hidden;
          background:#11131f;cursor:pointer;}
        .pr-vignettes button.on{border-color:#a855f7;box-shadow:0 0 0 3px rgba(168,85,247,.22);}
        .pr-vignettes img{width:100%;height:100%;object-fit:cover;display:block;}

        .pr-offres{justify-self:start;background:#12162a;color:#eef;border:0;
          border-radius:999px;padding:8px 13px;font-size:12px;font-weight:600;cursor:pointer;}
        .pr-essai{display:flex;align-items:center;justify-content:center;gap:9px;
          background:linear-gradient(90deg,#7b4dff,#e0389f);color:#fff;border:0;
          border-radius:16px;padding:13px;font-size:16px;font-weight:800;cursor:pointer;}
        .pr-essai i,.pr-essai b{font-style:normal;}
        .pr-promesse{margin:0;font-size:11.5px;color:#c9a9ff;}
        /* LA BULLE RESTE DANS LE FIL, ET ELLE COUTE SOIXANTE POINTS DE PHOTO.
           Flottante, elle recouvrait ce qui se trouvait sous elle : la
           promesse d'abord, puis le bouton d'essai quand on a interverti les
           deux. Une bulle qui cache le geste principal ne vaut pas les
           soixante points qu'elle economise.
           LE COMPTE TOMBE JUSTE : photo 424, panneau 367, barre 53. Rien ne
           defile, rien ne se recouvre. */
        .pr-bulle{display:flex;align-items:center;gap:9px;background:#2a2150;
          border:1px solid #3d3270;border-radius:15px;padding:8px 11px;}
        .pr-bulle i{font-style:normal;font-size:14px;}
        .pr-bulle b{display:block;color:#fff;font-size:12.5px;}
        .pr-bulle span{display:block;color:#b9a6ee;font-size:11px;}

        .pr-barre{display:grid;grid-template-columns:repeat(5,1fr);align-items:center;
          background:#080a10;border-top:1px solid #171b2b;padding:7px 0 9px;}
        .pr-barre span{display:grid;gap:2px;justify-items:center;color:#7f89ab;
          font-size:9px;font-weight:700;letter-spacing:.03em;}
        .pr-barre span.on{color:#eef;}
        .pr-barre i{font-style:normal;font-size:15px;}
        .pr-fantome{width:50px;height:50px;border-radius:50%;
          background:radial-gradient(circle at 50% 40%,#8cf5c8,#2fd8a0);
          display:grid;place-items:center;justify-self:center;margin-top:-15px;}
        .pr-fantome i{font-size:23px;}

        .pr-note{color:#6f7796;font-size:12.5px;text-align:center;max-width:390px;margin:0;}
      `,
        }}
      />
    </div>
  );
}
