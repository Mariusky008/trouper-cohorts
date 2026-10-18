// Ce que partagent les essais navigateur de l'échange (`scripts/navigateur/echanges-*.mjs`) :
// l'adresse de l'app, celle du faux Supabase, le dossier des captures, et le navigateur.
//
// Ils tournent contre `scripts/faux-supabase.mjs`, jamais la vraie base, et contre une app lancée
// avec ECHANGES_SEUIL_VILLE=3. Chacun veut un faux Supabase neuf (il sème ses commerçants).
// Sur le poste, Playwright n'est pas forcément dans node_modules : PLAYWRIGHT_MODULE dit où le
// prendre, PW_CHROMIUM quel Chromium lancer. Sur GitHub : `.github/workflows/clikme-verifications.yml`.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const BASE = process.env.ESSAI_BASE ?? "http://localhost:3821";
export const F = process.env.ESSAI_SUPABASE ?? "http://127.0.0.1:54321/rest/v1";
export const D = process.env.ESSAI_CAPTURES ?? path.join(os.tmpdir(), "clikme-captures");
fs.mkdirSync(D, { recursive: true });

const pw = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
const { chromium } = pw.default ?? pw;
export const lancer = () => chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
