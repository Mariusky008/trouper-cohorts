import Link from "next/link";
import { Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-300 py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          
          {/* Column 1: Brand */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="inline-block text-2xl font-black text-white tracking-tighter hover:opacity-90 transition-opacity">
              popey<span className="text-blue-500">.</span>academy
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              La première plateforme de réseautage local garanti pour les entrepreneurs et les chercheurs d'emploi.
            </p>
          </div>

          {/* Column 2: Programmes (Renamed from Plateforme) */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Programmes</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/emploi" className="hover:text-blue-400 transition-colors">Créer un réseau amical</Link></li>
              <li><Link href="/entrepreneur" className="hover:text-blue-400 transition-colors">Lancer son activité</Link></li>
              <li><Link href="/login" className="hover:text-blue-400 transition-colors">Se connecter</Link></li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Légal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/legal/terms" className="hover:text-blue-400 transition-colors">CGU / CGV</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-blue-400 transition-colors">Confidentialité</Link></li>
              <li><Link href="/legal/mentions" className="hover:text-blue-400 transition-colors">Mentions Légales</Link></li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <div className="h-8 w-8 bg-slate-800 rounded-lg flex items-center justify-center text-blue-500 flex-shrink-0">
                   <Mail className="h-4 w-4" />
                </div>
                <a href="mailto:contact@popey.academy" className="hover:text-white transition-colors">
                  contact@popey.academy
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-8 w-8 bg-slate-800 rounded-lg flex items-center justify-center text-blue-500 flex-shrink-0">
                   <MapPin className="h-4 w-4" />
                </div>
                <span>Dax, France</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Popey Academy. Tous droits réservés.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
