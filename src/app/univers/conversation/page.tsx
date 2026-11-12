// 💬 LA CONVERSATION AVEC PABLITO — chantier « Univers », lot 3 (`lib/direct/conversation-univers.ts`). L'ADRESSE
// D'ESSAI, RÉSERVÉE AU PROPRIÉTAIRE (une session d'administrateur), après sa nouvelle figurine (`/univers/figurine`).
import { redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { Conversation } from "./conversation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Ton univers — ClikMe" };

export default async function PageConversation() {
  if (!(await isCurrentUserAdmin())) redirect("/admin");
  return <Conversation />;
}
