// 📣 SES RÉSEAUX SOCIAUX — les connecter une fois, et chaque annonce y part.
// Voir `lib/reseaux/reseaux-donnees.ts` (le pourquoi) et `intermediaire.ts`.
//
// POST, même jeton que le reste de l'Espace Pro (`slug` + `token`) :
//   · `etat`       → { configure, plateformes: [{ id, nom, compte? }], auto, derniere? }
//   · `connecter`  → { plateforme } → { url } : la page de connexion du réseau,
//                    chez l'intermédiaire. Son profil y est créé au premier appel.
//   · `rafraichir` → relit ses comptes connectés ; le premier connecté allume l'envoi.
//   · `auto`       → { on: boolean } : « chaque publication part aussi sur mes réseaux ».
//   · `fantome`    → { on: boolean } : 👻 « je réponds moi-même aux commentaires FANTÔME » (voir
//                    `Reseaux.fantome`) — même sans réseau connecté : il peut poster son Reel lui-même.
//
// PAS DE RÉPONSES AUTOMATIQUES : rien ici ne lit ni ne répond aux commentaires. Avec `fantome`, c'est lui qui
// répond, avec le message tout prêt du comptoir.
import { NextResponse } from "next/server";
import { ligneDuCommercant } from "@/lib/site-internet/experience-scenes";
import { SITE_URL } from "@/lib/site-url";
import { nomDuReseau, reseauxDuDiagnostic, type Reseaux } from "@/lib/reseaux/reseaux-donnees";
import {
  changerReseaux,
  comptesConnectes,
  creerProfil,
  lienDeConnexion,
  plateformesProposees,
  reseauxConfigures,
} from "@/lib/reseaux/intermediaire";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const s = (v: unknown) => String(v ?? "").trim();

function etat(r: Reseaux) {
  const proposees = plateformesProposees();
  // UN COMPTE CONNECTÉ SUR UN RÉSEAU QU'ON NE PROPOSE PAS (ajouté chez
  // l'intermédiaire directement) reste montré : il en reçoit les annonces.
  const toutes = [...proposees, ...r.comptes.map((c) => c.plateforme).filter((p) => !proposees.includes(p))];
  return {
    ok: true,
    configure: reseauxConfigures(),
    plateformes: toutes.map((id) => {
      const compte = r.comptes.find((c) => c.plateforme === id);
      return { id, nom: nomDuReseau(id), ...(compte ? { compte: compte.nom || nomDuReseau(id) } : {}) };
    }),
    auto: r.auto,
    fantome: r.fantome,
    ...(r.derniere ? { derniere: r.derniere } : {}),
  };
}

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = s(p?.slug);
  const ligne = await ligneDuCommercant(slug, s(p?.token)).catch(() => null);
  if (!ligne) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const action = s(p?.action) || "etat";
  const reseaux = reseauxDuDiagnostic(ligne.diag);

  if (action === "etat") return NextResponse.json(etat(reseaux));

  if (action === "fantome") {
    try {
      const on = p?.on === true;
      return NextResponse.json(etat(await changerReseaux(ligne.id, (r) => ({ ...r, fantome: on }))));
    } catch (e) {
      return NextResponse.json({ error: `Enregistrement impossible : ${String((e as Error)?.message ?? e)}` }, { status: 500 });
    }
  }

  if (!reseauxConfigures()) {
    return NextResponse.json({ error: "La publication sur les réseaux n'est pas encore branchée sur ClikMe." }, { status: 503 });
  }

  try {
    if (action === "connecter") {
      const plateforme = s(p?.plateforme).toLowerCase();
      if (!plateformesProposees().includes(plateforme)) return NextResponse.json({ error: "Réseau inconnu." }, { status: 400 });
      let profil = reseaux.profil;
      if (!profil) {
        const c = await creerProfil(ligne.nom || slug);
        if (!c.profil) return NextResponse.json({ error: `Connexion impossible : ${c.erreur ?? "profil introuvable"}` }, { status: 502 });
        profil = c.profil;
        await changerReseaux(ligne.id, (r) => ({ ...r, profil }));
      }
      // LE RETOUR NE PORTE PAS SON JETON : l'adresse part chez l'intermédiaire.
      // Une page neutre lui dit de revenir à son comptoir, resté ouvert.
      const l = await lienDeConnexion(plateforme, profil, `${SITE_URL}/reseaux/connecte`);
      if (!l.url) return NextResponse.json({ error: `Connexion impossible : ${l.erreur ?? "lien introuvable"}` }, { status: 502 });
      return NextResponse.json({ ok: true, url: l.url });
    }

    if (action === "rafraichir") {
      if (!reseaux.profil) return NextResponse.json(etat(reseaux));
      const c = await comptesConnectes(reseaux.profil);
      if (!c.comptes) return NextResponse.json({ error: `Lecture impossible : ${c.erreur ?? "réponse vide"}` }, { status: 502 });
      const comptes = c.comptes;
      const suite = await changerReseaux(ligne.id, (r) => ({
        ...r,
        comptes,
        // LE PREMIER COMPTE CONNECTÉ ALLUME L'ENVOI : c'est pour ça qu'il l'a connecté.
        auto: r.comptes.length === 0 && comptes.length > 0 ? true : r.auto,
      }));
      return NextResponse.json(etat(suite));
    }

    if (action === "auto") {
      const on = p?.on === true;
      const suite = await changerReseaux(ligne.id, (r) => ({ ...r, auto: on }));
      return NextResponse.json(etat(suite));
    }
  } catch (e) {
    return NextResponse.json({ error: `Enregistrement impossible : ${String((e as Error)?.message ?? e)}` }, { status: 500 });
  }

  return NextResponse.json({ error: "action inconnue" }, { status: 400 });
}
