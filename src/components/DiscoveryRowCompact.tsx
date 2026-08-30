import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import type { Fournisseur, Coordonnees } from "../types";
import StoreCardCompact from "./StoreCardCompact";

interface DiscoveryRowCompactProps {
  titre: string;
  icone?: ReactNode;
  fournisseurs: Fournisseur[];
  positionClient?: Coordonnees | null;
  onVoirTout?: () => void;
}

// Rangée horizontale de cartes compactes, avec "Voir tout" — cliquer dessus
// applique le tri/filtre correspondant (géré par ClientHomePage) plutôt que
// de construire une page séparée : réutilise exactement la même liste
// filtrée déjà existante, juste affichée en grille complète à la place des
// rangées de découverte.
export default function DiscoveryRowCompact({ titre, icone, fournisseurs, positionClient, onVoirTout }: DiscoveryRowCompactProps) {
  if (fournisseurs.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between px-1">
        <h2 className="flex items-center gap-2 font-display font-bold text-[15px] text-[var(--color-ink-900)]">
          {icone} {titre}
        </h2>
        {onVoirTout && (
          <button onClick={onVoirTout} className="flex items-center gap-0.5 text-xs font-semibold text-[var(--color-orange-600)]">
            Voir tout <ChevronRight size={14} />
          </button>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto scroll-row pb-1 -mx-1 px-1">
        {fournisseurs.map((f) => (
          <StoreCardCompact key={f.id} fournisseur={f} positionClient={positionClient} />
        ))}
      </div>
    </div>
  );
}
