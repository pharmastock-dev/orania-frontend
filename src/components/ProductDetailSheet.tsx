import { useState } from "react";
import { X, Minus, Plus, MessageSquarePlus } from "lucide-react";
import { resolveImageUrl } from "../api";
import { formatPrix } from "../utils/format";
import type { Produit } from "../types";

interface ProductDetailSheetProps {
  produit: Produit | null;
  onClose: () => void;
  onAdd: (produit: Produit, quantite: number, note: string) => void;
  lectureSeule?: boolean; // mode cafétéria — consultation du menu uniquement
}

export default function ProductDetailSheet({ produit, onClose, onAdd, lectureSeule = false }: ProductDetailSheetProps) {
  const [quantite, setQuantite] = useState(1);
  const [note, setNote] = useState("");
  const [noteOuverte, setNoteOuverte] = useState(false);

  if (!produit) return null;

  const prixUnitaire = produit.prix_promo ?? produit.prix;
  const enPromo = produit.prix_promo != null && produit.prix_promo < produit.prix;
  const image = resolveImageUrl(produit.photo);

  function fermer() {
    setQuantite(1);
    setNote("");
    setNoteOuverte(false);
    onClose();
  }

  function ajouter() {
    onAdd(produit!, quantite, note.trim());
    fermer();
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={fermer} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto animate-[slideUp_0.2s_ease]">
        {/* Photo pleine largeur, sans marge */}
        <div className="relative w-full aspect-[4/3] bg-[var(--color-ink-100)]">
          {image ? (
            <img src={image} alt={produit.nom} className="w-full h-full object-cover sm:rounded-t-3xl" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
          )}
          <button
            onClick={fermer}
            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-black/40 backdrop-blur text-white flex items-center justify-center"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
          {!produit.disponible && (
            <span className="absolute bottom-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              Indisponible
            </span>
          )}
          {enPromo && produit.disponible && (
            <span className="absolute bottom-4 left-4 bg-[var(--color-orange-500)] text-white text-xs font-bold px-3 py-1.5 rounded-full">
              Promo
            </span>
          )}
        </div>

        <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <h2 className="font-display text-xl font-bold text-[var(--color-ink-900)]">{produit.nom}</h2>

          <div className="flex items-center gap-2 mt-1.5">
            <span className="font-extrabold text-lg text-[var(--color-ink-900)]">{formatPrix(prixUnitaire)}</span>
            {enPromo && <span className="text-sm text-[var(--color-ink-500)] line-through">{formatPrix(produit.prix)}</span>}
          </div>

          {produit.ingredients && (
            <div className="mt-4">
              <p className="text-xs font-bold text-[var(--color-ink-500)] uppercase tracking-wide mb-1">Ingrédients</p>
              <p className="text-sm text-[var(--color-ink-700)] leading-relaxed">{produit.ingredients}</p>
            </div>
          )}

          {/* Demande particulière — pas de commande possible en mode cafétéria */}
          {!lectureSeule && (
            <div className="mt-5">
              {!noteOuverte ? (
                <button
                  onClick={() => setNoteOuverte(true)}
                  className="flex items-center gap-2 text-sm font-semibold text-[var(--color-navy-700)]"
                >
                  <MessageSquarePlus size={16} /> Ajouter une demande particulière
                </button>
              ) : (
                <div>
                  <p className="text-xs font-bold text-[var(--color-ink-500)] uppercase tracking-wide mb-1.5">
                    Demande particulière (facultatif)
                  </p>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ex : sans oignons, sauce à part..."
                    rows={2}
                    maxLength={200}
                    autoFocus
                    className="w-full bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[var(--color-orange-500)] resize-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* Quantité */}
          {!lectureSeule && (
            <div className="flex items-center justify-between mt-5">
              <span className="text-sm font-semibold text-[var(--color-ink-700)]">Quantité</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantite((q) => Math.max(1, q - 1))}
                  className="h-9 w-9 rounded-full bg-[var(--color-ink-100)] flex items-center justify-center text-[var(--color-ink-700)]"
                  aria-label="Diminuer"
                >
                  <Minus size={15} />
                </button>
                <span className="w-6 text-center font-bold text-[var(--color-ink-900)]">{quantite}</span>
                <button
                  onClick={() => setQuantite((q) => q + 1)}
                  className="h-9 w-9 rounded-full bg-[var(--color-orange-100)] flex items-center justify-center text-[var(--color-orange-600)]"
                  aria-label="Augmenter"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>
          )}

          {!lectureSeule && (
            <button
              onClick={ajouter}
              disabled={!produit.disponible}
              className="w-full flex items-center justify-between bg-[var(--color-orange-500)] disabled:bg-[var(--color-ink-300)] text-white font-bold rounded-2xl px-5 py-3.5 mt-6"
            >
              <span>{produit.disponible ? "Ajouter au panier" : "Indisponible"}</span>
              {produit.disponible && <span>{formatPrix(prixUnitaire * quantite)}</span>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
