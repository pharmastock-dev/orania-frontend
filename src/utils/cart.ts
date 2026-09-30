// ============================================================
// QREEB — Utilitaires panier (suppléments)
// Partagés par AppContext, StorePage, CartPage et CheckoutPage pour que la
// "clé" d'une ligne de panier (produit + combinaison de suppléments) soit
// calculée exactement de la même façon partout.
// ============================================================

import type { Supplement } from "../types";

// Clé unique d'une ligne de panier : un même produit avec des suppléments
// différents doit donner une clé différente (donc une ligne séparée), mais
// le même produit avec exactement les mêmes suppléments (dans un ordre
// quelconque) doit toujours redonner la même clé (pour fusionner les
// quantités au lieu de dupliquer la ligne).
export function cleCartItem(produitId: number, supplements?: Supplement[]): string {
  const suffixe = (supplements || [])
    .map((s) => s.id)
    .sort((a, b) => a - b)
    .join(",");
  return `${produitId}|${suffixe}`;
}

// Somme des prix des suppléments sélectionnés (0 si aucun).
export function prixSupplements(supplements?: Supplement[]): number {
  return (supplements || []).reduce((somme, s) => somme + s.prix, 0);
}
