import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/nav/bottom-nav";
import { TopNav } from "@/components/nav/top-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-muted/10 pb-20 md:pb-0">
      <TopNav>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            Se déconnecter
          </Button>
        </form>
      </TopNav>
      
      {/* Mobile Header simple */}
      <header className="md:hidden border-b bg-background/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
         <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-sm font-black uppercase tracking-widest">Trouper</span>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-6 md:py-8">{children}</main>
      
      <BottomNav />
    </div>
  );
}
