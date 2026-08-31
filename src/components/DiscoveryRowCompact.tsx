import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import type { Fournisseur, Coordonnees } from "../types";
import StoreCard from "./StoreCard";

interface DiscoveryRowCompactProps {
  titre: string;
  icone?: ReactNode;
  fournisseurs: Fournisseur[];
  positionClient?: Coordonnees | null;
  onVoirTout?: () => void;
}

// Meme structure qu'avant (titre + "Voir tout" + defilement horizontal),
// mais utilise desormais la carte COMPLETE (StoreCard), pas la version
// compacte -- retour a "l'ancienne version" en taille et niveau de detail,
// tout en gardant les 3 sections nommees et le glissement horizontal.
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
          <div key={f.id} className="w-64 shrink-0">
            <StoreCard fournisseur={f} positionClient={positionClient} />
          </div>
        ))}
      </div>
    </div>
  );
}
