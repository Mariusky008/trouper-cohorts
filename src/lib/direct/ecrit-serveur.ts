/**
 * ✍️ ÉCRIRE, PARTAGER, CÔTÉ SERVEUR — lot M1 « l'écrit et les liens » (`ecrit.ts` pour les règles ; le cahier :
 * `docs/univers/messages-ecrits.md`).
 *
 * LE SEAU, à côté des vocaux (`talkie-serveur.ts`), pour qu'un seul fil les range tous dans l'ordre :
 *   · `fils/<paire>/m/<instant>-<qui>-<id>.json` = { id, de, le, genre: "ecrit", texte, tete, lien?: { url, site,
 *     titre?, image?, sorte? } } ;
 *   · `fils/<paire>/a/<id>.webp` = l'image de l'aperçu d'un lien, recopiée et réduite (600 pixels) : le téléphone de
 *     l'autre ne va jamais la chercher chez le site, qui ne sait donc pas qui a reçu le lien ;
 *   · `<habitant>/ecrits-jour.json` = { jour, n } : ses messages écrits du jour (trois cents au plus).
 *
 * L'APERÇU D'UN LIEN se prépare APRÈS LA RÉPONSE (`after()`), une fois : la page (5 secondes, 1 Mo), ses balises de
 * partage, son image. LE SERVEUR NE VA JAMAIS LIRE LE RÉSEAU INTERNE : pas d'adresse IP nue, pas de nom interne
 * (`urlLisible`), et le nom traduit en adresse est vérifié au moment même de la connexion (`adresseInterne`, dans la
 * recherche d'adresse de la connexion : rien ne peut changer entre la vérification et la connexion) ; chaque
 * redirection est revérifiée. Les essais : `CLIKME_APERCU_ESSAI_BASE` (la CI seulement) sert les noms en
 * `.essai.invalid` depuis le faux Supabase.
 *
 * LE FREIN : `CLIKME_ECRIT=0` chez l'hébergeur — on ne peut plus écrire ; ce qui a été écrit reste lisible, et chacun
 * peut toujours effacer son message (dans les 24 heures).
 *
 * FICHIER SERVEUR.
 */
import { randomUUID } from "node:crypto";
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import zlib from "node:zlib";
import type { Readable } from "node:stream";
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import { jourParis } from "@/lib/jour-paris";
import type { Habitant } from "./habitant";
import { prevenirDUneParole } from "./appli-collection-serveur";
import { sentimentValide, type Sentiment } from "./ma-figurine";
import { SEAU_FIGURINES, deposer, ecrireJson, lireJson, lireLigne } from "./ma-figurine-serveur";
import { motInterdit } from "./mots-interdits";
import { TETES_DE_DEPART, proposerParRegles, type MessageFil } from "./talkie";
import { dossierMessages, hDeCle, nomMessage, nomsDuFil, noter, noterStatsMessages, pairDe, poserProfil, qui8, seParlent, sesTetesJouables, vueDeLEcrit, type FicheMessage } from "./talkie-serveur";
import { APERCU, ECRIT, PHRASES_ECRIT, adresseInterne, apercuDuHtml, lienDuTexte, notifEcrit, signes, sorteDuSite, texteEcrit, urlLisible } from "./ecrit";

type Supabase = ReturnType<typeof createAdminClient>;
type Resultat<T> = T & { error?: string; statut?: number };
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

/** 🛑 Le frein : `CLIKME_ECRIT=0` (on ne peut plus écrire ; ce qui a été écrit reste lisible). */
export const ecritOuvert = () => s(process.env.CLIKME_ECRIT) !== "0";

const cheminApercu = (pair: string, id: string) => `fils/${pair}/a/${id}.webp`;
const cheminCompteur = (h: string) => `${h}/ecrits-jour.json`;

/** Ce qu'il faut pour prévenir l'autre, et préparer l'aperçu du lien (après la réponse). */
export type ApresEcrit = { pour: string; prenom: string; url: string; cle: string; pair: string; nom: string; id: string; lien: boolean };

/**
 * 📨 IL ÉCRIT À UN PROCHE : le texte (1 000 signes, aucun mot interdit), la tête (celle qu'il a choisie parmi les siennes,
 * sinon la première des règles des vocaux, `proposerParRegles`), le lien qu'il contient (son aperçu se prépare ensuite).
 * Trois cents messages écrits par jour.
 */
export async function ecrireMessage(supabase: Supabase, moi: Habitant, cle: unknown, texte: unknown, tete: unknown): Promise<Resultat<{ message?: MessageFil; apres?: ApresEcrit }>> {
  if (!ecritOuvert()) return { error: PHRASES_ECRIT.ferme, statut: 404 };
  const h = await hDeCle(supabase, cle);
  if (!h) return { error: "Ce proche n’existe pas.", statut: 404 };
  if (!(await seParlent(supabase, moi.id, h))) return { error: "Vous pourrez vous parler quand vous vous serez ajoutés tous les deux.", statut: 403 };
  const t = texteEcrit(texte);
  if (!t) return { error: typeof texte === "string" && signes(texte.trim()) > ECRIT.max ? PHRASES_ECRIT.long : PHRASES_ECRIT.vide, statut: 400 };
  if (motInterdit(t)) return { error: PHRASES_ECRIT.motInterdit, statut: 422 };
  const jour = jourParis();
  const c = await lireJson<{ jour?: string; n?: number }>(supabase, cheminCompteur(moi.id));
  const n = c.jour === jour ? Number(c.n) || 0 : 0;
  if (n >= ECRIT.parJour) return { error: PHRASES_ECRIT.assez, statut: 429 };
  // (la tête : la sienne, si elle est jouable ; sinon les règles, sans modèle)
  const dispo = (await sesTetesJouables(supabase, moi.id)) ?? [...TETES_DE_DEPART];
  const voulue = sentimentValide(tete);
  const laTete: Sentiment | null = voulue && dispo.includes(voulue) ? voulue : (proposerParRegles(t, dispo)[0] ?? null);
  const lien = lienDuTexte(t);
  const sorte = lien ? sorteDuSite(lien.site) : null;
  const pair = pairDe(moi.id, h);
  const id = randomUUID().replace(/-/g, "").slice(0, 12);
  const ts = Date.now();
  const fiche: FicheMessage = {
    id,
    de: moi.id,
    le: new Date(ts).toISOString(),
    genre: "ecrit",
    texte: t,
    tete: laTete,
    ...(lien ? { lien: { url: lien.url, site: lien.site, ...(sorte ? { sorte } : {}) } } : {}),
  };
  const avant = await nomsDuFil(supabase, pair);
  const nom = nomMessage(ts, moi.id, id);
  if (!(await ecrireJson(supabase, `${dossierMessages(pair)}/${nom}`, fiche))) return { error: "Ton message n’est pas parti. Réessaie dans un instant.", statut: 502 };
  await ecrireJson(supabase, cheminCompteur(moi.id), { jour, n: n + 1 });
  // 📈 la mesure du talkie (un message ; une réponse s'il répond au dernier de l'autre), et celle des messages
  const dernier = avant[avant.length - 1];
  await noter(supabase, pair, moi.id, "cree");
  if (dernier && dernier.de8 !== qui8(moi.id)) await noter(supabase, pair, moi.id, "reponse");
  await noterStatsMessages(supabase, { ecrits: 1, ...(lien ? { liens: 1 } : {}), ...(n === 0 ? { ecrivains: 1 } : {}) });
  const [{ ligne }, maCle, message] = await Promise.all([lireLigne(supabase, moi.id), poserProfil(supabase, moi.id), vueDeLEcrit(supabase, fiche, moi.id)]);
  if (!message) return { error: "Ton message n’est pas parti. Réessaie dans un instant.", statut: 502 };
  return { message, apres: { pour: h, prenom: s(ligne?.prenom), url: `/collection?parler=${maCle}#proches`, cle: maCle, pair, nom, id, lien: Boolean(lien) } };
}

/**
 * 🔔 APRÈS LA RÉPONSE : l'aperçu du lien d'abord (pour que la notification en dise le titre), puis « ✍️ Léa t'a écrit »
 * (ou « 🔗 Léa t'a envoyé un lien »). Jamais bloquant.
 */
export async function apresEcrit(supabase: Supabase, moi: Habitant, a: ApresEcrit): Promise<void> {
  if (a.lien) await preparerApercu(supabase, a.pair, a.nom).catch(() => undefined);
  const f = await lireJson<FicheMessage>(supabase, `${dossierMessages(a.pair)}/${a.nom}`);
  if (!f.id) return;
  await prevenirDUneParole(supabase, a.pour, moi.id, a.prenom, { url: a.url, cle: a.cle, ecrit: notifEcrit(a.prenom, { texte: f.texte, lien: f.lien }) }).catch(() => undefined);
}

// ─── l'aperçu d'un lien ────────────────────────────────────────────────────────────────────────────
/** Le nom d'un site se traduit en adresses : aucune ne doit mener au réseau interne (vérifié à la connexion même). */
function rechercheSure(hote: string, options: dns.LookupOptions, rappel: (err: NodeJS.ErrnoException | null, adresse: string | dns.LookupAddress[], famille?: number) => void): void {
  dns.lookup(hote, { all: true, verbatim: true }, (err, adresses) => {
    if (err) return rappel(err, "");
    const l = adresses as dns.LookupAddress[];
    if (!l.length || l.some((x) => adresseInterne(x.address))) return rappel(Object.assign(new Error("adresse interne refusée"), { code: "EINTERNE" }), "");
    if (options.all) return rappel(null, l);
    rappel(null, l[0].address, l[0].family);
  });
}

/** Le faux site des essais (la CI seulement) : les noms en `.essai.invalid`, servis par le faux Supabase. */
const essai = (u: URL): URL | null => {
  const base = s(process.env.CLIKME_APERCU_ESSAI_BASE);
  if (!base || !u.hostname.endsWith(".essai.invalid")) return null;
  try {
    return new URL(`${u.pathname}${u.search}`, base);
  } catch {
    return null;
  }
};

/**
 * 🌐 LIRE UNE ADRESSE DU WEB PUBLIC, PRUDEMMENT : http ou https, un nom (pas d'adresse IP), cinq secondes en tout, un
 * nombre d'octets au plus (une page trop longue est coupée ; une image trop lourde, refusée), trois redirections au
 * plus (chacune revérifiée). `null` : rien de lisible.
 */
export async function lireLeWeb(adresse: string, o: { max: number; types: RegExp; couper: boolean }): Promise<{ corps: Buffer; type: string; url: string } | null> {
  const fin = Date.now() + APERCU.delai;
  let url = adresse;
  for (let saut = 0; saut <= APERCU.redirections; saut++) {
    const u0 = (() => {
      try {
        return new URL(url);
      } catch {
        return null;
      }
    })();
    if (!u0) return null;
    const faux = essai(u0);
    const u = faux ?? urlLisible(url);
    if (!u) return null;
    const reste = fin - Date.now();
    if (reste <= 0) return null;
    const r = await new Promise<{ statut: number; type: string; lieu: string; corps: Buffer | null }>((resolu) => {
      const client = u.protocol === "https:" ? https : http;
      let fini = false;
      const finir = (x: { statut: number; type: string; lieu: string; corps: Buffer | null }) => {
        if (fini) return;
        fini = true;
        clearTimeout(minuteur);
        resolu(x);
      };
      const req = client.request(
        u,
        {
          method: "GET",
          headers: { "user-agent": "Mozilla/5.0 (compatible; ClikMe-Apercu/1.0)", accept: o.types.source.includes("html") ? "text/html,application/xhtml+xml" : "image/*", "accept-encoding": "gzip, deflate, br", "accept-language": "fr,en;q=0.8" },
          // (le faux site des essais est local : la vérification d'adresse ne vaut que pour le vrai web)
          ...(faux ? {} : { lookup: rechercheSure as unknown as typeof dns.lookup }),
        },
        (rep) => {
          const statut = rep.statusCode ?? 0;
          const type = s(rep.headers["content-type"]).toLowerCase();
          if (statut >= 300 && statut < 400) {
            rep.resume();
            return finir({ statut, type, lieu: s(rep.headers.location), corps: null });
          }
          if (statut !== 200 || !o.types.test(type)) {
            rep.resume();
            return finir({ statut, type, lieu: "", corps: null });
          }
          const codage = s(rep.headers["content-encoding"]).toLowerCase();
          const flux: Readable = codage === "gzip" ? rep.pipe(zlib.createGunzip()) : codage === "deflate" ? rep.pipe(zlib.createInflate()) : codage === "br" ? rep.pipe(zlib.createBrotliDecompress()) : rep;
          const morceaux: Buffer[] = [];
          let n = 0;
          flux.on("data", (m: Buffer) => {
            n += m.length;
            if (n > o.max) {
              if (o.couper) morceaux.push(m.subarray(0, Math.max(0, m.length - (n - o.max))));
              req.destroy();
              return finir({ statut, type, lieu: "", corps: o.couper ? Buffer.concat(morceaux) : null });
            }
            morceaux.push(m);
          });
          flux.on("end", () => finir({ statut, type, lieu: "", corps: Buffer.concat(morceaux) }));
          flux.on("error", () => finir({ statut, type, lieu: "", corps: o.couper && morceaux.length ? Buffer.concat(morceaux) : null }));
        },
      );
      const minuteur = setTimeout(() => {
        req.destroy();
        finir({ statut: 0, type: "", lieu: "", corps: null });
      }, reste);
      req.on("error", () => finir({ statut: 0, type: "", lieu: "", corps: null }));
      req.end();
    });
    if (r.statut >= 300 && r.statut < 400 && r.lieu) {
      try {
        url = new URL(r.lieu, url).toString();
      } catch {
        return null;
      }
      continue;
    }
    return r.corps && r.corps.length ? { corps: r.corps, type: r.type, url } : null;
  }
  return null;
}

/**
 * 🔗 L'APERÇU D'UN LIEN, PRÉPARÉ UNE FOIS : le titre et le site de la page, son image recopiée chez nous (600 pixels, sans
 * ses métadonnées). Sans aperçu possible, le lien reste tout simple. Rend vrai s'il y a un aperçu.
 */
export async function preparerApercu(supabase: Supabase, pair: string, nom: string): Promise<boolean> {
  const chemin = `${dossierMessages(pair)}/${nom}`;
  const f = await lireJson<FicheMessage>(supabase, chemin);
  if (!f.id || f.genre !== "ecrit" || !f.lien?.url || f.lien.titre) return Boolean(f.lien?.titre);
  const page = await lireLeWeb(f.lien.url, { max: APERCU.page, types: /^(text\/html|application\/xhtml\+xml)/, couper: true }).catch(() => null);
  const a = page ? apercuDuHtml(page.corps.toString("utf8"), page.url) : null;
  if (!a?.titre) {
    await noterStatsMessages(supabase, { sansApercu: 1 });
    return false;
  }
  let image = "";
  if (a.image) {
    const img = await lireLeWeb(a.image, { max: APERCU.image, types: /^image\/(png|jpe?g|webp|gif|avif)/, couper: false }).catch(() => null);
    if (img) {
      const webp = await sharp(img.corps, { limitInputPixels: 40_000_000, animated: false })
        .rotate()
        .resize({ width: APERCU.largeur, withoutEnlargement: true })
        .webp({ quality: 72 })
        .toBuffer()
        .catch(() => null);
      if (webp && (await deposer(supabase, cheminApercu(pair, s(f.id)), webp, "image/webp"))) image = cheminApercu(pair, s(f.id));
    }
  }
  // (relire avant d'écrire : le message a pu être effacé entre-temps)
  const g = await lireJson<FicheMessage>(supabase, chemin);
  if (!g.id || !g.lien) return false;
  await ecrireJson(supabase, chemin, { ...g, lien: { ...g.lien, titre: a.titre, ...(a.site ? { site: a.site } : {}), ...(image ? { image } : {}) } });
  await noterStatsMessages(supabase, { apercus: 1 });
  return true;
}

// ─── effacer son message ───────────────────────────────────────────────────────────────────────────
/**
 * 🗑️ IL EFFACE SON MESSAGE (le sien, dans les 24 heures) : pour les deux, avec sa voix, l'image de son aperçu ou sa
 * photo. Un vocal, un écrit ou une photo (lot M2). Ce que l'étagère en avait noté s'en va aussi (la route s'en charge, comme pour un signalement).
 */
export async function effacerMessage(supabase: Supabase, moi: Habitant, cle: unknown, id: unknown): Promise<Resultat<{ ok?: true }>> {
  const h = await hDeCle(supabase, cle);
  const i = s(id);
  if (!h || !/^[a-z0-9]{12}$/.test(i)) return { error: "Ce message n’existe plus.", statut: 404 };
  const pair = pairDe(moi.id, h);
  const nom = (await nomsDuFil(supabase, pair)).find((n) => n.id === i);
  if (!nom) return { error: "Ce message n’existe plus.", statut: 404 };
  if (nom.de8 !== qui8(moi.id)) return { error: PHRASES_ECRIT.effaceAutre, statut: 403 };
  const chemin = `${dossierMessages(pair)}/${nom.nom}`;
  const f = await lireJson<FicheMessage>(supabase, chemin);
  if (f.de !== moi.id) return { error: PHRASES_ECRIT.effaceAutre, statut: 403 };
  if (Date.now() - (Date.parse(s(f.le)) || nom.ts) > ECRIT.effacer) return { error: PHRASES_ECRIT.effaceTrop, statut: 400 };
  // (📷 lot M2 : sa photo aussi)
  const fichiers = [chemin, s(f.son), s(f.lien?.image), s(f.media?.chemin)].filter(Boolean);
  const { error } = await supabase.storage.from(SEAU_FIGURINES).remove(fichiers);
  if (error) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
  await noterStatsMessages(supabase, { effaces: 1 });
  return { ok: true };
}
