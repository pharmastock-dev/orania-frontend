import { Plus, Minus, FileText } from "lucide-react";
import type { Produit } from "../types";
import { formatPrix } from "../utils/format";
import { resolveImageUrl } from "../api";

interface ProductCardProps {
  produit: Produit;
  quantite?: number;
  onAdd: (produit: Produit) => void;
  onIncrement?: (produit: Produit) => void;
  onDecrement?: (produit: Produit) => void;
}

export default function ProductCard({ produit, quantite = 0, onAdd, onIncrement, onDecrement }: ProductCardProps) {
  const image = resolveImageUrl(produit.photo);
  const enPromo = produit.prix_promo != null && produit.prix_promo < produit.prix;

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl border border-[var(--color-ink-100)] p-2.5">
      <div className="h-16 w-16 rounded-xl bg-[var(--color-ink-100)] overflow-hidden shrink-0">
        {image ? (
          <img src={image} alt={produit.nom} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-[var(--color-ink-300)] text-[10px] text-center px-1">
            {produit.nom}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-[var(--color-ink-900)] truncate">{produit.nom}</p>
          {enPromo && <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-pink-100)] text-[var(--color-pink-600)]">PROMO</span>}
        </div>
        {produit.ingredients && (
          <p className="flex items-center gap-1 text-xs text-[var(--color-ink-500)] mt-0.5 truncate">
            <FileText size={11} className="shrink-0" /> {produit.ingredients}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {enPromo ? (
            <>
              <span className="text-[var(--color-pink-600)] font-bold">{formatPrix(produit.prix_promo!)}</span>
              <span className="text-[var(--color-ink-300)] line-through text-sm">{formatPrix(produit.prix)}</span>
            </>
          ) : (
            <span className="text-[var(--color-orange-600)] font-bold">{formatPrix(produit.prix)}</span>
          )}
        </div>
        {!produit.disponible && <span className="inline-block mt-1 text-[11px] font-semibold text-[var(--color-ink-500)]">Indisponible</span>}
      </div>

      {quantite > 0 ? (
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onDecrement?.(produit)}
            className="h-9 w-9 rounded-full flex items-center justify-center bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] text-[var(--color-ink-700)]"
            aria-label="Retirer une unité"
          >
            <Minus size={16} />
          </button>
          <span className="w-5 text-center font-bold text-[var(--color-ink-900)]">{quantite}</span>
          <button
            disabled={!produit.disponible}
            onClick={() => onIncrement?.(produit)}
            className="h-9 w-9 rounded-full flex items-center justify-center bg-[var(--color-orange-500)] text-white disabled:bg-[var(--color-ink-100)] disabled:text-[var(--color-ink-300)]"
            aria-label="Ajouter une unité"
          >
            <Plus size={16} />
          </button>
        </div>
      ) : (
        <button
          disabled={!produit.disponible}
          onClick={() => onAdd(produit)}
          className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center bg-[var(--color-orange-500)] text-white disabled:bg-[var(--color-ink-100)] disabled:text-[var(--color-ink-300)]"
          aria-label="Ajouter au panier"
        >
          <Plus size={18} />
        </button>
      )}
    </div>
  );
}
