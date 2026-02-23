import Link from "next/link";
import { ArrowLeft, Scale, FileText, Shield, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const legalLinks = [
  { href: "/legal/mentions", label: "Mentions Légales", icon: Scale },
  { href: "/legal/privacy", label: "Politique de Confidentialité", icon: Shield },
  { href: "/legal/terms", label: "CGU / CGV", icon: FileText },
];

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-slate-900">
            <Info className="h-6 w-6 text-blue-600" />
            <span>Centre Légal</span>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-slate-600 hover:text-blue-600">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour à l'accueil
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-[280px_1fr] gap-8 items-start">
          
          {/* Sidebar Navigation */}
          <nav className="hidden lg:block sticky top-24 space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-3">
              Documents
            </div>
            {legalLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all group"
              >
                <link.icon className="h-4 w-4 text-slate-400 group-hover:text-blue-500" />
                {link.label}
              </Link>
            ))}
            
            <div className="pt-8 mt-8 border-t border-slate-200">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <h4 className="font-bold text-blue-900 text-sm mb-1">Une question ?</h4>
                    <p className="text-xs text-blue-700 mb-3">
                        Notre équipe est là pour vous aider si vous avez des doutes.
                    </p>
                    <Button variant="outline" size="sm" className="w-full bg-white border-blue-200 text-blue-700 hover:bg-blue-100" asChild>
                        <Link href="/contact">Nous contacter</Link>
                    </Button>
                </div>
            </div>
          </nav>

          {/* Mobile Navigation (Horizontal) */}
          <nav className="lg:hidden flex overflow-x-auto pb-4 gap-2 -mx-4 px-4 scrollbar-hide">
            {legalLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-600 whitespace-nowrap"
              >
                <link.icon className="h-3 w-3" />
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Content */}
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200 min-h-[60vh]">
            {children}
          </div>

        </div>
      </main>
    </div>
  );
}
