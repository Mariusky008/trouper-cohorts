import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/app/login/login-form";

export default async function PopeyHumanLoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const defaultEmail = typeof params?.email === "string" ? params.email : "";

  return (
    <div className="min-h-screen bg-[#F7F7F7] px-4 py-8 md:py-12">
      <div className="mx-auto w-full max-w-md space-y-5">
        <Button variant="ghost" asChild className="px-0">
          <Link href="/popey-human">← Retour Popey Human</Link>
        </Button>

        <Card className="border-black/15 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-black">Connexion Popey Human</CardTitle>
            <p className="text-sm text-black/70">
              Connectez-vous à votre espace privé Popey Human.
            </p>
          </CardHeader>
          <CardContent>
            <LoginForm
              defaultEmail={defaultEmail}
              isNetworkLogin
              postLoginPath="/popey-human/app"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
