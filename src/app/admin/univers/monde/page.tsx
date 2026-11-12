// (son univers est à `/univers/monde`, pas sous l'admin)
import { redirect } from "next/navigation";

export default function VersSonUnivers() {
  redirect("/univers/monde");
}
