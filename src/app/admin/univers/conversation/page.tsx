// (la conversation avec Pablito est à `/univers/conversation`, pas sous l'admin)
import { redirect } from "next/navigation";

export default function VersLaConversation() {
  redirect("/univers/conversation");
}
