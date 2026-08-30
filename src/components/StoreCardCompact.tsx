import { useNavigate } from "react-router-dom";
import { Star, MapPin } from "lucide-react";
import type { Fournisseur, Coordonnees } from "../types";
import { resolveImageUrl } from "../api";
import { distanceMetres } from "../utils/geo";

// Carte compacte pour les rangees de decouverte (Promos, A proximite, Tous
// nos partenaires) -- tout le contenu (photo + nom + note + distance) est
// desormais a l'interieur d'UN SEUL cadre, avec un fond gris plus fonce que
// le fond de la page (ink-50), pour que ca ressemble vraiment a une carte
// complete plutot qu'une photo avec du texte flottant a cote.
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
      className="w-[156px] shrink-0 text-left bg-[#e4e7ee] rounded-2xl p-2 border border-[var(--color-ink-100)]"
    >
      <div className="relative h-28 w-full rounded-xl overflow-hidden bg-[var(--color-ink-100)]">
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
      <p className="font-bold text-[13px] text-[var(--color-ink-900)] mt-2 truncate px-0.5">{fournisseur.nom}</p>
      <div className="flex items-center gap-2 mt-0.5 mb-0.5 px-0.5 text-[11px] text-[var(--color-ink-700)]">
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
