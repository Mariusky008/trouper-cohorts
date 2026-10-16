// 🎙️ LES VOIX DE SECOURS DU REPORTER — une par réplique, toutes la même voix.
//
// Quand le serveur ne peut pas fabriquer la voix de Liam (ElevenLabs), TOUTES
// les répliques passent sur les fichiers de `public/direct/interview/voix/` —
// jamais un reporter qui change de voix entre deux questions. Ils sont faits
// avec espeak-ng (français, 150 mots/minute), puis encodés comme les premiers
// (MP3 mono, 44,1 kHz, 96 kb/s).
//
// Ce script fabrique ceux qui manquent, d'après `REPLIQUES` et `repliqueDite`
// (« ClikMe » se dit « Clic Mi »). `--tout` les refait tous.
//
//   node scripts/fabriquer-voix-secours-interview.mjs [--tout]
//
// Il faut `espeak-ng` et `ffmpeg` sur la machine.
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const exige = createRequire(import.meta.url);
const ts = exige("typescript");
const js = ts.transpileModule(readFileSync("src/lib/direct/interview-fantome.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const boite = { exports: {} };
new Function("exports", "module", js)(boite.exports, boite);
const { IDS_REPLIQUES, repliqueDite } = boite.exports;

const DOSSIER = "public/direct/interview/voix";
const tout = process.argv.includes("--tout");
const tmp = mkdtempSync(join(tmpdir(), "voix-"));
let faits = 0;
for (const id of IDS_REPLIQUES) {
  const mp3 = join(DOSSIER, `${id}.mp3`);
  if (!tout && existsSync(mp3)) continue;
  const wav = join(tmp, `${id}.wav`);
  execFileSync("espeak-ng", ["-v", "fr", "-s", "150", "-w", wav, repliqueDite(id)]);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", wav, "-ar", "44100", "-ac", "1", "-b:a", "96k", mp3]);
  console.log(`  ${id}.mp3 — « ${repliqueDite(id)} »`);
  faits++;
}
rmSync(tmp, { recursive: true, force: true });
console.log(faits ? `${faits} voix fabriquée(s).` : "Rien à fabriquer : toutes les répliques ont leur voix de secours.");
