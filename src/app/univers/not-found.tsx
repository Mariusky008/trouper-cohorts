// 🧭 La page introuvable de l'appli (l'audit UX du 28/11, lot 5b) — voir `collection/page-introuvable.tsx`.
import type { Metadata } from "next";
import { PageIntrouvable } from "@/app/collection/page-introuvable";

export const metadata: Metadata = { title: "Page introuvable", robots: { index: false } };

export default function Introuvable() {
  return <PageIntrouvable />;
}
