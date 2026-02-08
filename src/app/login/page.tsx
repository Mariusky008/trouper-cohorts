import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = typeof params?.error === "string" ? params.error : null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle>Connexion</CardTitle>
          <CardDescription>Reçois un lien par email pour accéder à la cohorte.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
              Erreur : {error}
            </div>
          )}
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
