import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/app/login/login-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Anchor } from "lucide-react";

export default function NetworkLoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#0f172a] text-white">
      <div className="absolute top-4 left-4 md:top-8 md:left-8">
        <Button variant="ghost" asChild className="text-slate-400 hover:text-white hover:bg-white/10">
          <Link href="/">← Retour</Link>
        </Button>
      </div>
      
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 mx-auto bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Anchor className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Mon Réseau Local</h1>
          <p className="text-slate-400">
            Connectez-vous pour accéder à vos matchs du jour.
          </p>
        </div>

        <Card className="bg-slate-900 border-slate-800 shadow-2xl">
          <CardContent className="pt-6">
            <LoginForm isNetworkLogin={true} />
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500 px-4">
          Un problème pour vous connecter ?<br/>
          Contactez le support au <span className="font-semibold text-slate-300">07 68 23 33 47</span>
        </p>
      </div>
    </div>
  );
}
