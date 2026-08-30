import { useNavigate } from "react-router-dom";
import { Star, MapPin } from "lucide-react";
import type { Fournisseur, Coordonnees } from "../types";
import { resolveImageUrl } from "../api";
import { distanceMetres } from "../utils/geo";

// Carte compacte pour les rangées de découverte (Promos, À proximité, Tous
// nos partenaires) — volontairement minimale : juste photo, nom, note,
// distance. Le clic amène toujours vers la fiche complète du commerce
// (StorePage), où toutes les vraies infos (adresse, horaires, menu) sont
// affichées — cette carte n'est qu'un aperçu pour parcourir rapidement.
interface StoreCardCompactProps {
  fournisseur: Fournisseur;
  positionClient?: Coordonnees | null;
}

export default function StoreCardCompact({ fournisseur, positionClient }: StoreCardCompactProps) {
  const navigate = useNavigate();
  const image = resolveImageUrl(fournisseur.photo);

  const distanceM =
    positionClient && fournisseur.latitude != null && fournisseur.longitude != null
      ? distanceMetres(positionClient, { latitude: fournisseur.latitude, longitude: fournisseur.longitude })
      : null;
  const distanceLabel = distanceM != null ? (distanceM < 1000 ? `${Math.round(distanceM)} m` : `${(distanceM / 1000).toFixed(1)} km`) : null;

  return (
    <button
      onClick={() => navigate(`/commerce/${fournisseur.id}`)}
      className="w-[132px] shrink-0 text-left"
    >
      <div className="relative h-24 w-full rounded-2xl overflow-hidden bg-[var(--color-ink-100)]">
        {fournisseur.a_promo && (
          <span className="absolute top-1.5 left-1.5 z-10 bg-[var(--color-pink-500)] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            Promo
          </span>
        )}
        {image ? (
          <img src={image} alt={fournisseur.nom} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-[var(--color-ink-300)] text-[10px] text-center px-1">{fournisseur.nom}</div>
        )}
      </div>
      <p className="font-bold text-[13px] text-[var(--color-ink-900)] mt-1.5 truncate">{fournisseur.nom}</p>
      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[var(--color-ink-500)]">
        <span className="flex items-center gap-0.5">
          <Star size={10} className="fill-[var(--color-orange-500)] text-[var(--color-orange-500)]" />
          {(fournisseur.note_moyenne ?? 0).toFixed(1)}
        </span>
        {distanceLabel && (
          <span className="flex items-center gap-0.5">
            <MapPin size={10} /> {distanceLabel}
          </span>
        )}
      </div>
    </button>
  );
}
