import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t py-12 bg-muted/20">
      <div className="container mx-auto px-4 text-center space-y-6">
        <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <Link href="/legal/terms" className="hover:underline">CGU / CGV</Link>
          <Link href="/legal/privacy" className="hover:underline">Confidentialité</Link>
          <Link href="/legal/mentions" className="hover:underline">Mentions Légales</Link>
          <Link href="/contact" className="hover:underline">Contact</Link>
        </div>
        <div className="text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} Popey Academy. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
