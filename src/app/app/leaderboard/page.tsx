import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle>Classement</CardTitle>
        <CardDescription>
          À brancher sur une vue/RPC sécurisée (pour éviter toute fuite de PII).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-3">
        <Button asChild variant="outline">
          <Link href="/app/today">Retour</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
