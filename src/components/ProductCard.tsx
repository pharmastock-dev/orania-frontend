import { Plus, Minus, ChevronRight } from "lucide-react";
import type { Produit } from "../types";
import { formatPrix } from "../utils/format";
import { resolveImageUrl } from "../api";

interface ProductCardProps {
  produit: Produit;
  quantite?: number;
  onAdd: (produit: Produit) => void;
  onIncrement?: (produit: Produit) => void;
  onDecrement?: (produit: Produit) => void;
  onOpenDetail?: (produit: Produit) => void; // ouvre la fiche produit détaillée
  lectureSeule?: boolean; // masque totalement les contrôles de commande (mode cafétéria)
}

export default function ProductCard({ produit, quantite = 0, onAdd, onIncrement, onDecrement, onOpenDetail, lectureSeule = false }: ProductCardProps) {
  const image = resolveImageUrl(produit.photo);
  const enPromo = produit.prix_promo != null && produit.prix_promo < produit.prix;

  return (
    <div className="flex items-stretch gap-3.5 bg-white rounded-2xl border border-[var(--color-ink-100)] p-3">
      <button
        onClick={() => onOpenDetail?.(produit)}
        className="h-24 w-24 rounded-xl bg-[var(--color-ink-100)] overflow-hidden shrink-0 relative"
        aria-label={`Voir ${produit.nom}`}
      >
        {image ? (
          <img src={image} alt={produit.nom} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-[var(--color-ink-300)] text-2xl">🍽️</div>
        )}
        {!produit.disponible && (
          <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">Indisponible</span>
          </div>
        )}
        {enPromo && produit.disponible && (
          <span className="absolute top-1.5 left-1.5 bg-[var(--color-orange-500)] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            PROMO
          </span>
        )}
      </button>

      <button onClick={() => onOpenDetail?.(produit)} className="flex-1 min-w-0 text-left flex flex-col justify-center">
        <div className="flex items-center gap-1">
          <p className="font-bold text-[15px] text-[var(--color-ink-900)] truncate">{produit.nom}</p>
          <ChevronRight size={14} className="text-[var(--color-ink-300)] shrink-0" />
        </div>
        {produit.ingredients && (
          <p className="text-xs text-[var(--color-ink-500)] mt-0.5 line-clamp-2 leading-snug">{produit.ingredients}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          {enPromo ? (
            <>
              <span className="text-[var(--color-pink-600)] font-extrabold">{formatPrix(produit.prix_promo!)}</span>
              <span className="text-[var(--color-ink-300)] line-through text-sm">{formatPrix(produit.prix)}</span>
            </>
          ) : (
            <span className="text-[var(--color-ink-900)] font-extrabold">{formatPrix(produit.prix)}</span>
          )}
        </div>
      </button>

      {lectureSeule ? null : (
        <div className="flex items-center shrink-0 self-end">
          {quantite > 0 ? (
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); onDecrement?.(produit); }}
                className="h-9 w-9 rounded-full flex items-center justify-center bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] text-[var(--color-ink-700)]"
                aria-label="Retirer une unité"
              >
                <Minus size={16} />
              </button>
              <span className="w-5 text-center font-bold text-[var(--color-ink-900)]">{quantite}</span>
              <button
                disabled={!produit.disponible}
                onClick={(e) => { e.stopPropagation(); onIncrement?.(produit); }}
                className="h-9 w-9 rounded-full flex items-center justify-center bg-[var(--color-orange-500)] text-white disabled:bg-[var(--color-ink-100)] disabled:text-[var(--color-ink-300)]"
                aria-label="Ajouter une unité"
              >
                <Plus size={16} />
              </button>
            </div>
          ) : (
            <button
              disabled={!produit.disponible}
              onClick={(e) => { e.stopPropagation(); onAdd(produit); }}
              className="h-9 w-9 rounded-full flex items-center justify-center bg-[var(--color-orange-500)] text-white disabled:bg-[var(--color-ink-100)] disabled:text-[var(--color-ink-300)]"
              aria-label="Ajouter au panier"
            >
              <Plus size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
