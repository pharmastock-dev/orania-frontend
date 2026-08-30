import { Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ProduitRecherche } from "../types";
import { formatPrix } from "../utils/format";
import { resolveImageUrl } from "../api";

interface ProductSearchCardProps {
  produit: ProduitRecherche;
}

// Résultat de recherche produit — cliquer amène directement sur la fiche du
// commerce qui le vend (son menu complet), pas juste sur le produit isolé.
export default function ProductSearchCard({ produit }: ProductSearchCardProps) {
  const navigate = useNavigate();
  const image = resolveImageUrl(produit.photo);
  const enPromo = produit.prix_promo != null && produit.prix_promo < produit.prix;

  return (
    <button
      onClick={() => navigate(`/commerce/${produit.fournisseur_id}`)}
      className="flex items-center gap-3.5 bg-[var(--color-dark-card)] rounded-2xl border border-[var(--color-dark-border)] p-3 text-left w-full"
    >
      <div className="h-20 w-20 rounded-xl bg-[var(--color-dark-surface)] overflow-hidden shrink-0 relative">
        {image ? (
          <img src={image} alt={produit.nom} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-[var(--color-dark-text-muted)] text-2xl">🍽️</div>
        )}
        {enPromo && (
          <span className="absolute top-1.5 left-1.5 bg-[var(--color-orange-500)] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            PROMO
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-[15px] text-[var(--color-dark-text)] truncate">{produit.nom}</p>
        <p className="flex items-center gap-1 text-xs text-[var(--color-dark-text-muted)] mt-0.5 truncate">
          <Store size={12} className="shrink-0" /> {produit.fournisseur_nom}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          {enPromo ? (
            <>
              <span className="text-[var(--color-pink-500)] font-extrabold">{formatPrix(produit.prix_promo!)}</span>
              <span className="text-[var(--color-dark-text-muted)] line-through text-sm">{formatPrix(produit.prix)}</span>
            </>
          ) : (
            <span className="text-[var(--color-dark-text)] font-extrabold">{formatPrix(produit.prix)}</span>
          )}
        </div>
      </div>
    </button>
  );
}
