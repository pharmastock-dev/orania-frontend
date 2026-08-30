import { useEffect, useState } from "react";
import { Search as SearchIcon, SearchX } from "lucide-react";
import BackButton from "../components/BackButton";
import ProductSearchCard from "../components/ProductSearchCard";
import { CardSkeleton } from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { rechercherProduits } from "../api";
import type { ProduitRecherche } from "../types";

export default function SearchPage() {
  const [recherche, setRecherche] = useState("");
  const [resultats, setResultats] = useState<ProduitRecherche[]>([]);
  const [chargement, setChargement] = useState(false);
  const rechercheActive = recherche.trim().length >= 2;

  useEffect(() => {
    if (!rechercheActive) {
      setResultats([]);
      return;
    }
    let annule = false;
    setChargement(true);
    const minuteur = setTimeout(() => {
      rechercherProduits(recherche.trim())
        .then((data) => {
          if (!annule) setResultats(data);
        })
        .catch(() => {
          if (!annule) setResultats([]);
        })
        .finally(() => {
          if (!annule) setChargement(false);
        });
    }, 300);
    return () => {
      annule = true;
      clearTimeout(minuteur);
    };
  }, [recherche, rechercheActive]);

  return (
    <div className="min-h-screen bg-[var(--color-ink-50)] pb-24">
      <div className="max-w-md mx-auto px-4 pt-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <BackButton to="/client/accueil" />
          <h1 className="font-display font-bold text-lg text-[var(--color-ink-900)]">Recherche</h1>
        </div>

        <div className="flex items-center gap-2 bg-white border border-[var(--color-ink-100)] rounded-xl px-3.5 py-3">
          <SearchIcon size={18} className="text-[var(--color-ink-500)] shrink-0" />
          <input
            autoFocus
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un restaurant, un plat..."
            className="flex-1 min-w-0 bg-transparent outline-none text-[15px] placeholder:text-[var(--color-ink-500)]"
          />
        </div>

        {!rechercheActive ? (
          <p className="text-sm text-[var(--color-ink-500)] text-center py-10">
            Tapez au moins 2 lettres pour lancer la recherche.
          </p>
        ) : chargement ? (
          <div className="flex flex-col gap-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : resultats.length === 0 ? (
          <EmptyState
            icon={<SearchX size={36} />}
            title="Aucun produit trouvé"
            description="Essayez un autre mot-clé — un plat, un ingrédient, un produit."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {resultats.map((p) => (
              <ProductSearchCard key={p.id} produit={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
