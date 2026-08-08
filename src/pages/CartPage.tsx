import { useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import BackButton from "../components/BackButton";
import Button from "../components/Button";
import EmptyState from "../components/EmptyState";
import { useApp } from "../context/AppContext";
import { formatPrix } from "../utils/format";
import { resolveImageUrl } from "../api";

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, updateQuantite, removeFromCart, cartTotal, cartCount } = useApp();

  return (
    <div className="min-h-screen bg-[var(--color-ink-50)] pb-32">
      <div className="max-w-md mx-auto px-4 pt-5">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="font-display font-bold text-xl text-[var(--color-ink-900)]">Mon panier</h1>
        </div>

        {cart.items.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={36} />}
            title="Votre panier est vide"
            description="Parcourez les commerces autour de vous pour commencer."
            action={
              <Button onClick={() => navigate("/client/accueil")} variant="primary">
                Voir les commerces
              </Button>
            }
          />
        ) : (
          <>
            <p className="text-sm text-[var(--color-ink-500)] mt-4">{cart.fournisseurNom}</p>

            <div className="flex flex-col gap-2.5 mt-3">
              {cart.items.map(({ produit, quantite }) => {
                const prix = produit.prix_promo ?? produit.prix;
                const image = resolveImageUrl(produit.photo);
                return (
                  <div key={produit.id} className="flex items-center gap-3 bg-white rounded-2xl border border-[var(--color-ink-100)] p-2.5">
                    <div className="h-14 w-14 rounded-xl bg-[var(--color-ink-100)] overflow-hidden shrink-0">
                      {image && <img src={image} alt={produit.nom} className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--color-ink-900)] truncate">{produit.nom}</p>
                      <p className="text-sm text-[var(--color-ink-500)]">{formatPrix(prix)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => (quantite <= 1 ? removeFromCart(produit.id) : updateQuantite(produit.id, quantite - 1))}
                        className="h-8 w-8 rounded-full bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] flex items-center justify-center"
                      >
                        {quantite <= 1 ? <Trash2 size={14} className="text-red-500" /> : <Minus size={14} />}
                      </button>
                      <span className="w-5 text-center font-semibold">{quantite}</span>
                      <button
                        onClick={() => updateQuantite(produit.id, quantite + 1)}
                        className="h-8 w-8 rounded-full bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] flex items-center justify-center"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--color-ink-100)] p-4 safe-bottom">
              <div className="max-w-md mx-auto">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[var(--color-ink-700)]">Sous-total ({cartCount} article{cartCount > 1 ? "s" : ""})</span>
                  <span className="font-bold text-lg text-[var(--color-ink-900)]">{formatPrix(cartTotal)}</span>
                </div>
                <Button fullWidth onClick={() => navigate("/commander")}>
                  Commander
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
