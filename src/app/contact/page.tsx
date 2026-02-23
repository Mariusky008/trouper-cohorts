import { Mail, MessageCircle, MapPin, ArrowRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-slate-900 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-6">Contactez-nous</h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Une question sur la plateforme ? Un problème technique ? Ou simplement envie de dire bonjour ? L'équipe Popey Academy est à votre écoute.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-12 pb-20">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
            
            {/* Contact Card */}
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="h-12 w-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                    <Mail className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Support Email</h2>
                <p className="text-slate-500 mb-8">
                    C'est le moyen le plus rapide pour nous joindre. Nous répondons généralement sous 24h ouvrées.
                </p>
                
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-colors">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</span>
                        <a href="mailto:contact@popey.academy" className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">
                            contact@popey.academy
                        </a>
                    </div>
                    <Button size="icon" variant="ghost" className="text-slate-400 group-hover:text-blue-600" asChild>
                        <a href="mailto:contact@popey.academy">
                            <ArrowRight className="h-5 w-5" />
                        </a>
                    </Button>
                </div>
            </div>

            {/* Info / FAQ Card */}
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="h-12 w-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                    <HelpCircle className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Aide & FAQ</h2>
                <p className="text-slate-500 mb-8">
                    Vous avez une question sur le fonctionnement des cohortes ou des matchs ?
                </p>
                
                <div className="space-y-4">
                    <Link href="/legal/terms" className="block p-4 rounded-xl border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all">
                        <div className="font-bold text-slate-900 mb-1">Comment fonctionne l'abonnement ?</div>
                        <div className="text-sm text-slate-500">Tout est expliqué dans nos CGV.</div>
                    </Link>
                    <Link href="/legal/privacy" className="block p-4 rounded-xl border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all">
                        <div className="font-bold text-slate-900 mb-1">Mes données sont-elles sécurisées ?</div>
                        <div className="text-sm text-slate-500">Consultez notre politique de confidentialité.</div>
                    </Link>
                </div>
            </div>

        </div>

        {/* Address Section */}
        <div className="max-w-4xl mx-auto mt-8 text-center">
            <div className="inline-flex items-center gap-2 text-slate-400 text-sm font-medium bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                <MapPin className="h-4 w-4" />
                <span>23 rue paul lahragou, 40100 Dax, France</span>
            </div>
        </div>
      </div>
    </div>
  );
}
