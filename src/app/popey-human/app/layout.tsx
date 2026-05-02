import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PopeyHumanMemberShell } from "./_components/member-shell";

export default async function PopeyHumanAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/popey-human/login");
  }

  return <PopeyHumanMemberShell>{children}</PopeyHumanMemberShell>;
}
