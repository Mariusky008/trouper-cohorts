"use client";

/**
 * 🔥 LE MÈME DU JOUR (le lot 2, 7 novembre 2026) — voir `lib/direct/theme-du-jour.ts`. Sa carte était dans l'ancien
 * « Découvrir » (`#jour`, là où mène la notification de 11 h 30) ; depuis le 19 novembre 2026 (l'ancienne page est
 * partie), `#jour` ouvre « Créer » sur ce thème (`ma-collection.tsx`) : ses trois idées, et la notification de demain.
 * Ici, ses styles.
 */
export const STYLES_THEME_DU_JOUR = `
.tj{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:16px;border-radius:24px;background:radial-gradient(100% 90% at 0% 0%,rgba(255,122,89,.32),transparent 60%),radial-gradient(90% 80% at 100% 100%,rgba(255,46,154,.28),transparent 60%),rgba(255,255,255,.05);border:1.5px solid rgba(255,122,89,.55)}
.tj-label{font-size:11.5px;font-weight:900;letter-spacing:.14em;color:#FFB08F}
.tj-titre{font-size:21px;line-height:1.2;font-weight:900}
.tj-chiffres{font-size:13px;color:#E8D3DC}
.tj-go{margin-top:6px;width:100%;padding:14px 16px;border:0;border-radius:999px;background:linear-gradient(135deg,#FF7A59,#FF2E9A);color:#fff;font:inherit;font-size:16px;font-weight:900;cursor:pointer;box-shadow:0 12px 26px -12px rgba(255,46,154,.95)}
.tj-voir{margin-top:4px;font-size:14px;font-weight:900;color:#7FF0C4;text-decoration:none}
.tf-theme{display:flex;flex-direction:column;gap:8px;padding:12px 14px;border-radius:18px;background:rgba(255,122,89,.12);border:1.5px solid rgba(255,122,89,.55)}
.tf-theme-tete{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
.tf-theme-tete b{font-size:15px;font-weight:900;line-height:1.25}
.tf-theme-tete button{flex:none;width:28px;height:28px;border-radius:50%;border:0;background:rgba(0,0,0,.25);color:#FFF4E6;font:inherit;cursor:pointer}
.tf-theme-idees{display:flex;flex-direction:column;gap:6px}
.tf-theme-idees button{padding:9px 12px;border-radius:14px;border:1.5px solid rgba(255,255,255,.14);background:rgba(0,0,0,.18);color:#FFF4E6;font:inherit;font-size:13.5px;font-weight:700;text-align:left;cursor:pointer}
.tf-theme-idees button.pris{border-color:#FF7A59;background:rgba(255,122,89,.2)}
`;
