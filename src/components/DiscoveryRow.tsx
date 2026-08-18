import type { ReactNode } from "react";
import type { Fournisseur, Coordonnees } from "../types";
import StoreCard from "./StoreCard";

interface DiscoveryRowProps {
  titre: string;
  icone: ReactNode;
  fournisseurs: Fournisseur[];
  positionClient?: Coordonnees | null;
}

// Section de découverte horizontale (ex: "Restos en promo", "Populaire près
// de vous") — volontairement indépendante des filtres actifs (catégorie,
// type de plat, tri) pour rester une mise en avant éditoriale constante,
// pas un sous-ensemble filtré de la liste principale en dessous.
export default function DiscoveryRow({ titre, icone, fournisseurs, positionClient }: DiscoveryRowProps) {
  if (fournisseurs.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5">
      <h2 className="flex items-center gap-2 font-display font-bold text-[15px] text-[var(--color-ink-900)] px-1">
        {icone} {titre}
      </h2>
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
