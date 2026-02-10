import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  let error = typeof params?.error === "string" ? params.error : null;

  // Traduction des erreurs techniques pour l'utilisateur
  if (error?.includes("PKCE code verifier not found")) {
      error = "Sécurité : Veuillez ouvrir le lien magique dans CE navigateur (ou copiez-collez le lien ici).";
  } else if (error?.includes("Signups not allowed")) {
      error = "Les inscriptions sont fermées pour le moment.";
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-muted/30">
      <div className="absolute top-4 left-4 md:top-8 md:left-8">
        <Button variant="ghost" asChild>
          <Link href="/">← Retour</Link>
        </Button>
      </div>
      
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-2">
          <div className="h-10 w-10 mx-auto bg-primary text-primary-foreground rounded flex items-center justify-center font-black text-sm">
            PA
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Bienvenue sur Popey Academy</h1>
          <p className="text-sm text-muted-foreground">
            Entrez votre email pour recevoir votre lien de connexion magique.
          </p>
        </div>

        <Card className="border-muted-foreground/20 shadow-lg">
          <CardContent className="pt-6">
            {error && (
              <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
                Erreur : {error}
              </div>
            )}
            <LoginForm defaultEmail={typeof params?.email === "string" ? params.email : ""} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
