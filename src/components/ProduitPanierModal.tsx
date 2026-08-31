import { useState } from "react";
import { X } from "lucide-react";
import { resolveImageUrl } from "../api";
import { formatPrix } from "../utils/format";
import type { Produit } from "../types";

interface ProduitPanierModalProps {
  produit: Produit;
  quantite: number;
  noteActuelle?: string;
  onClose: () => void;
  onEnregistrer: (note: string) => void;
}

// Modal ouverte en cliquant sur un article du panier — montre la photo et
// les ingredients (informatif), et permet d'ajouter/modifier une demande
// particuliere pour ce produit precis (ex: "sans oignons", "bien cuit"),
// deja prevue par la structure de donnees (note par article) mais jamais
// exposee dans l'interface jusqu'ici.
export default function ProduitPanierModal({ produit, quantite, noteActuelle, onClose, onEnregistrer }: ProduitPanierModalProps) {
  const [note, setNote] = useState(noteActuelle || "");
  const image = resolveImageUrl(produit.photo);

  function handleEnregistrer() {
    onEnregistrer(note.trim());
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-48 bg-[var(--color-ink-100)]">
          {image ? (
            <img src={image} alt={produit.nom} className="h-full w-full object-cover sm:rounded-t-3xl" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-[var(--color-ink-300)] text-3xl">🍽️</div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 flex items-center justify-center text-[var(--color-ink-900)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display font-bold text-lg text-[var(--color-ink-900)] leading-tight">{produit.nom}</h2>
              <span className="shrink-0 h-6 min-w-6 px-1.5 rounded-full bg-[var(--color-orange-100)] text-[var(--color-orange-600)] text-xs font-bold flex items-center justify-center">
                x{quantite}
              </span>
            </div>
            <p className="text-[var(--color-orange-600)] font-bold mt-1">{formatPrix(produit.prix_promo ?? produit.prix)}</p>
          </div>

          {produit.ingredients && (
            <div>
              <p className="text-xs font-bold text-[var(--color-ink-500)] uppercase tracking-wide mb-1.5">Ingrédients</p>
              <p className="text-sm text-[var(--color-ink-700)] leading-relaxed">{produit.ingredients}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-[var(--color-ink-500)] uppercase tracking-wide mb-1.5">
              Une demande particulière ?
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex : sans oignons, bien cuit, sauce à part..."
              rows={3}
              className="w-full bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] rounded-xl px-3.5 py-3 text-sm outline-none focus:border-[var(--color-orange-400)] resize-none"
            />
            <p className="text-[11px] text-[var(--color-ink-500)] mt-1.5">Le commerçant verra cette demande sur votre commande.</p>
          </div>

          <button
            onClick={handleEnregistrer}
            className="bg-[var(--color-orange-500)] text-white font-bold rounded-xl py-3 mt-1"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
