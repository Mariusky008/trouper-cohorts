// 🎬 DES VIDÉOS D'ESSAI, FABRIQUÉES OCTET PAR OCTET (lot M3) — le serveur ne décode jamais une vidéo : il lit sa durée
// dans son en-tête (MP4 et MOV : la boîte `moov/mvhd` ; WebM : `Segment/Info/Duration`). Ces fichiers n'ont que ce qu'il
// lit, et de quoi peser leur poids (des octets vides) : ils ne se lisent pas dans un lecteur.
//
//   mp4Essai(12.3)                    → un MP4 de 12,3 s (mvhd version 0, `moov` avant les données)
//   mp4Essai(45, { aLaFin: true })    → 45 s, `moov` après les données (comme beaucoup de téléphones)
//   mp4Essai(20, { version: 1 })      → mvhd version 1 (dates et durée sur 64 bits)
//   webmEssai(18)                     → un WebM qui dit sa durée ; webmEssai(null) : qui ne la dit pas (le navigateur)
//   (`poids` : la taille voulue, en octets, remplie de zéros)

const boite = (type, contenu) => {
  const b = Buffer.alloc(8 + contenu.length);
  b.writeUInt32BE(8 + contenu.length, 0);
  b.write(type, 4, "latin1");
  contenu.copy(b, 8);
  return b;
};

export function mp4Essai(secondes, { aLaFin = false, version = 0, poids = 2000 } = {}) {
  const echelle = 600;
  const duree = Math.round(secondes * echelle);
  let mvhd;
  if (version === 1) {
    mvhd = Buffer.alloc(112);
    mvhd[0] = 1;
    mvhd.writeUInt32BE(echelle, 20);
    mvhd.writeUInt32BE(Math.floor(duree / 2 ** 32), 24);
    mvhd.writeUInt32BE(duree >>> 0, 28);
  } else {
    mvhd = Buffer.alloc(100);
    mvhd.writeUInt32BE(echelle, 12);
    mvhd.writeUInt32BE(duree, 16);
  }
  const ftyp = boite("ftyp", Buffer.from("isom\0\0\x02\0isomiso2mp41", "latin1"));
  const moov = boite("moov", boite("mvhd", mvhd));
  const mdat = boite("mdat", Buffer.alloc(Math.max(0, poids - ftyp.length - moov.length - 8)));
  return aLaFin ? Buffer.concat([ftyp, mdat, moov]) : Buffer.concat([ftyp, moov, mdat]);
}

/** (un élément EBML : son identifiant, sa taille sur un octet ou « inconnue », son contenu) */
const element = (id, contenu, inconnue = false) => Buffer.concat([Buffer.from(id), inconnue ? Buffer.from([0x01, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]) : Buffer.from([0x80 | contenu.length]), contenu]);

export function webmEssai(secondes, { poids = 2000 } = {}) {
  const entete = element([0x1a, 0x45, 0xdf, 0xa3], element([0x42, 0x82], Buffer.from("webm")));
  const echelle = element([0x2a, 0xd7, 0xb1], Buffer.from([0x0f, 0x42, 0x40])); // 1 000 000 ns : la milliseconde
  const parties = [echelle];
  if (secondes !== null) {
    const f = Buffer.alloc(8);
    f.writeDoubleBE(secondes * 1000);
    parties.push(element([0x44, 0x89], f));
  }
  const info = element([0x15, 0x49, 0xa9, 0x66], Buffer.concat(parties));
  const vide = Buffer.alloc(Math.max(0, poids - entete.length - info.length - 20));
  // (le Segment de taille « inconnue », comme un enregistrement en direct ; puis un « Void » qui fait le poids)
  return Buffer.concat([entete, element([0x18, 0x53, 0x80, 0x67], Buffer.concat([info]), true), Buffer.from([0xec, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]), vide]);
}
