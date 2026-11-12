// 💬 LA CONVERSATION AVEC PABLITO — chantier « Univers », lot 3 (`lib/direct/conversation-univers.ts`). L'ADRESSE
// D'ESSAI, RÉSERVÉE AU PROPRIÉTAIRE (une session d'administrateur), après sa nouvelle figurine (`/univers/figurine`).
import { redirect } from "next/navigation";
import { universPermis } from "@/lib/direct/univers-pour-tous";
import { Conversation } from "./conversation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = { title: "Ton univers — ClikMe" };

export default async function PageConversation() {
  if (!(await universPermis())) redirect("/admin");
  return <Conversation />;
}
