import { redirect } from "next/navigation";

export default function PrivilegeIndexPage() {
  redirect("/privilege/app?ville=dax");
}
