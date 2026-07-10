// Filtre de sécurité DÉTERMINISTE de l'accueil intelligent.
// S'exécute EN AMONT du modèle : si le message exprime une détresse/urgence ou
// une question de santé, on renvoie une réponse FIXE et on n'appelle JAMAIS le
// LLM. Le safety-critical ne dépend pas du modèle (défense en profondeur : le
// system prompt rappelle aussi ces règles, mais ce filtre est la garde primaire).

export type SafetyKind = "urgence" | "medical" | "ok";

const strip = (s: string) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // sans accents
    .replace(/[’']/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// ── Détresse / danger imminent / idées suicidaires / auto-agression ──────────
const URGENCE_PATTERNS: RegExp[] = [
  /\bsuicid/,
  /\ben finir\b/,
  /idees noires/,
  /\bmettre fin a mes jours\b/,
  /\bplus la force\b/,
  /\bje veux disparaitre\b/,
  /(plus|pas) envie de vivre/,
  /envie de mourir/,
  /\bje veux mourir\b/,
  /\bje vais mourir\b/,
  /\bveux plus vivre\b/,
  /me (faire du mal|mutiler|scarifier|tuer)/,
  /\bme suicider\b/,
  /\bautomutil/,
  /\bscarifi/,
  /passer a l acte/,
  /\bje vais me (tuer|faire du mal|jeter)\b/,
  /faire une betise/,
  /\ben danger\b/,
  /\bau secours\b/,
  /\bme (frappe|frappent|bat|battent|tape|tapent|violente|violentent|maltraite)\b/,
  /\bviolence(s)?\b/,
  /\bje suis battu/,
];

// ── Question de santé (symptômes, traitement, gravité, motif médical) ────────
// On y inclut les motifs de consultation psy (angoisse, depression, insomnie…) :
// l'accueil ne les TRAITE pas, il oriente chaleureusement vers un rendez-vous.
const MEDICAL_PATTERNS: RegExp[] = [
  /\bj ai mal\b/,
  /\bmal (a|au|aux|a la|a l)\b/,
  /\bdouleur/,
  /\bsouffre de\b/,
  /\bsymptom/,
  /\bfievre\b/,
  /\bvertige/,
  /\bnausee/,
  /\bje saigne\b/,
  /\bblessure\b/,
  /\bentorse\b/,
  /\bfracture\b/,
  /\bmigraine/,
  /\binsomnie/,
  /\bangoiss/,
  /\banxiet/,
  /\bdepress/,
  /\bdeprim/,
  /crise d angoisse/,
  /\bpanique\b/,
  /\bburn ?out\b/,
  /\btraitement\b/,
  /\bmedicament/,
  /\bposologie\b/,
  /\bordonnance\b/,
  /\bdiagnostic\b/,
  /est ce (grave|normal|dangereux)/,
  /c est grave/,
  /\bpathologie\b/,
  /\bmaladie\b/,
  /\bguerir\b/,
  /\bme soigner\b/,
  /\bdois je prendre\b/,
  /effets secondaires/,
  /combien de seances (pour|faut il pour) (guerir|aller mieux|me soigner)/,
];

export function classifyMessage(text: string): SafetyKind {
  const t = strip(text);
  if (!t) return "ok";
  if (URGENCE_PATTERNS.some((r) => r.test(t))) return "urgence";
  if (MEDICAL_PATTERNS.some((r) => r.test(t))) return "medical";
  return "ok";
}

// Réponses FIXES (jamais générées par le modèle).
export const URGENCE_REPLY =
  "Si vous êtes en danger ou en grande souffrance, contactez sans attendre le 15 (Samu), le 3114 (prévention du suicide, 24 h/24, gratuit) ou le 112. Vous pouvez aussi vous rendre aux urgences. Je ne suis qu'un accueil automatique et je ne peux pas vous aider moi-même — mais ces lignes sont là pour vous, tout de suite.";

export function medicalReply(praticien: string): string {
  const who = praticien && praticien.trim() ? praticien.trim() : "le praticien";
  return `Je suis l'accueil automatique du cabinet et je ne peux pas répondre à une question de santé — le mieux est d'en parler directement avec ${who} ou votre médecin. Souhaitez-vous que je vous propose un rendez-vous ?`;
}
