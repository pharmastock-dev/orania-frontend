// Catégories de produits proposées (le fournisseur peut aussi en saisir une libre)
export const CATEGORIES_PRODUITS = [
  'Pizza', 'Sandwich', 'Tacos', 'Burger', 'Plats', 'Pâtes',
  'Boissons', 'Desserts', 'Viennoiserie', 'Salades', 'Autre',
]

// Emoji par catégorie (pour l'affichage côté client)
export const CAT_EMOJI: Record<string, string> = {
  Pizza: '🍕', Sandwich: '🥪', Tacos: '🌮', Burger: '🍔', Plats: '🍽️',
  Pâtes: '🍝', Boissons: '🥤', Desserts: '🍰', Viennoiserie: '🥐',
  Salades: '🥗', Autre: '📦', Produits: '📦',
}
export const catEmoji = (c: string) => CAT_EMOJI[c] ?? '📦'
