// (une adresse tapée de travers, le 12 novembre 2026 : la nouvelle figurine est à `/univers/figurine`, pas sous l'admin)
import { redirect } from "next/navigation";

export default function VersLaNouvelleFigurine() {
  redirect("/univers/figurine");
}
