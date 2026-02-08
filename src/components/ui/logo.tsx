import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={cn("h-8 w-8", className)}
    >
        {/* Fond du logo (Carré arrondi) */}
        <rect width="512" height="512" rx="128" fill="currentColor" />
        
        {/* Éclair (couleur du background pour faire "trou") */}
        <path 
            d="M277.333 234.667V149.333L170.667 298.667H234.667V384L341.333 234.667H277.333Z" 
            className="fill-background" 
            style={{ fill: 'var(--background)' }} // Force la couleur du fond si la classe ne suffit pas
        />
        {/* Ou alors on force une couleur spécifique via prop, mais 'fill-background' devrait marcher si on est dans un contexte shadcn */}
        {/* Pour être sûr que ça marche sur la landing noire : on peut utiliser une couleur "inversée" */}
    </svg>
  );
}
