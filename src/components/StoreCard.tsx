import { useNavigate } from "react-router-dom";
import { Star, Clock, Wallet, Bike, MapPin } from "lucide-react";
import type { Fournisseur, Coordonnees } from "../types";
import { formatHoraires, estOuvertMaintenant } from "../utils/format";
import { getCategorieLabel } from "../utils/categories";
import { resolveImageUrl } from "../api";
import { distanceMetres, estimerTempsLivraison } from "../utils/geo";
import StatusPill from "./StatusPill";

export default function StoreCard({ fournisseur, positionClient }: { fournisseur: Fournisseur; positionClient?: Coordonnees | null }) {
  const navigate = useNavigate();
  const ouvert = estOuvertMaintenant(fournisseur.heure_ouverture, fournisseur.heure_fermeture);
  const image = resolveImageUrl(fournisseur.photo);

  const distanceM =
    positionClient && fournisseur.latitude != null && fournisseur.longitude != null
      ? distanceMetres(positionClient, { latitude: fournisseur.latitude, longitude: fournisseur.longitude })
      : null;
  const temps = distanceM != null ? estimerTempsLivraison(distanceM) : null;
  const distanceLabel = distanceM != null ? (distanceM < 1000 ? `${Math.round(distanceM)} m` : `${(distanceM / 1000).toFixed(1)} km`) : null;

  return (
    <button
      onClick={() => navigate(`/commerce/${fournisseur.id}`)}
      className="text-left bg-white rounded-2xl overflow-hidden border border-[var(--color-ink-100)] hover:border-[var(--color-orange-400)] transition-colors w-full"
    >
      {/* Hauteur augmentee (144px -> 176px) + object-contain (au lieu de
          object-cover) -- garantit que la photo ENTIERE est toujours visible,
          quel que soit son format d'origine. Le fond gris comble les bandes
          vides ("letterboxing") si le format ne correspond pas exactement,
          plutot que de rogner l'image comme avant. */}
      <div className="relative h-44 bg-[var(--color-ink-100)] flex items-center justify-center">
        {image ? (
          <img
            src={image}
            alt={fournisseur.nom}
            className={`h-full w-full object-contain ${!ouvert ? "grayscale-[60%] opacity-60" : ""}`}
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-[var(--color-ink-300)] text-xs">{fournisseur.nom}</div>
        )}

        {!ouvert && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-black/70 text-white text-sm font-bold px-4 py-1.5 rounded-xl border border-white/20">
              Fermé
            </span>
          </div>
        )}

        <div className="absolute top-2 left-2 flex gap-1.5">
          {fournisseur.a_promo && (
            <span className="bg-[var(--color-pink-500)] text-white text-xs font-semibold px-2 py-1 rounded-full">Promo</span>
          )}
        </div>
        <div className="absolute top-2 right-2">
          <StatusPill ouvert={ouvert} />
        </div>
        {fournisseur.categorie && (
          <span className="absolute bottom-2 left-2 bg-[var(--color-orange-100)] text-[var(--color-orange-700,#a35009)] text-xs font-semibold px-2.5 py-1 rounded-full">
            {getCategorieLabel(fournisseur.categorie)}
          </span>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-bold text-[var(--color-ink-900)] leading-tight">{fournisseur.nom}</h3>

        {fournisseur.adresse && (
          <p className="flex items-start gap-1 mt-1 text-xs text-[var(--color-ink-500)] leading-snug line-clamp-1">
            <MapPin size={11} className="mt-0.5 shrink-0" /> {fournisseur.adresse}
          </p>
        )}

        <div className="flex items-center gap-1.5 mt-1.5 text-sm">
          <Star size={14} className="fill-[var(--color-orange-500)] text-[var(--color-orange-500)]" />
          <span className="font-semibold">{(fournisseur.note_moyenne ?? 0).toFixed(1)}</span>
          <span className="text-[var(--color-ink-500)]">· {fournisseur.avis_count ?? 0} avis</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-[var(--color-ink-500)]">
          {fournisseur.heure_ouverture && (
            <span className="flex items-center gap-1">
              <Clock size={12} /> {formatHoraires(fournisseur.heure_ouverture, fournisseur.heure_fermeture)}
            </span>
          )}
          {distanceLabel && (
            <span className="flex items-center gap-1 text-[var(--color-orange-600)] font-medium">
              <MapPin size={12} /> {distanceLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2">
          {temps && (
            <span className="flex items-center gap-1 text-xs bg-[var(--color-ink-100)] text-[var(--color-ink-700)] px-2 py-1 rounded-full font-medium">
              <Bike size={12} /> {temps.min}–{temps.max} min
            </span>
          )}
        </div>

        {fournisseur.livraison_gratuite ? (
          <div className="flex items-center gap-1 mt-2 text-xs font-bold text-[var(--color-green-600,#16a34a)]">
            <Wallet size={12} /> Livraison gratuite
          </div>
        ) : fournisseur.frais_min != null ? (
          <div className="flex items-center gap-1 mt-2 text-xs font-medium text-[var(--color-navy-700)]">
            <Wallet size={12} /> Livraison {fournisseur.frais_min}–{fournisseur.frais_max ?? fournisseur.frais_min} DA
          </div>
        ) : null}
      </div>
    </button>
  );
}
