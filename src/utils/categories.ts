// Catégorie DU COMMERCE (type de business) — utilisée pour l'inscription commerçant,
// "Mon commerce", et le filtre par catégorie côté client. Emoji volontairement colorés
// (pas d'icônes ligne monochromes) pour matcher l'identité visuelle de l'app.
export interface CategorieDef {
  key: string;
  label: string;
  emoji: string;
}
export const CATEGORIES: CategorieDef[] = [
  { key: "tous", label: "Tous", emoji: "🍽️" },
  { key: "restaurant", label: "Resto", emoji: "🍴" },
  { key: "epicerie", label: "Épiceries", emoji: "🛒" },
  { key: "alimentation", label: "Alimentation", emoji: "🍅" },
  { key: "boutique", label: "Boutique", emoji: "🛍️" },
  { key: "parfumerie", label: "Parfumerie", emoji: "🌸" },
  { key: "cosmetiques", label: "Cosmétiques", emoji: "💄" },
  { key: "viennoiserie", label: "Viennoiserie", emoji: "🥐" },
  { key: "patisserie", label: "Pâtisserie", emoji: "🧁" },
];
export function getCategorieLabel(key: string): string {
  return CATEGORIES.find((c) => c.key === key)?.label || key;
}
// Suggestions DE PRODUIT (type de plat) — utilisées uniquement quand un commerçant
// ajoute un produit. Volontairement limité à des plats/articles précis (pas de
// catégories de commerce comme "Épicerie" ou "Pâtisserie" ici).
export const SUGGESTIONS_PRODUITS: string[] = [
  "Pizza", "Burger", "Sandwich", "Sushi", "Tacos", "Kebab", "Crispy", "Grillades",
  "Plats", "Gourmet", "Boissons", "Desserts",
];
// Emoji par catégorie de produit — utilisé pour les en-têtes de section du menu
// (ex: "🍕 PIZZA"), matché de façon insensible à la casse avec repli générique.
const EMOJI_PRODUIT: Record<string, string> = {
  pizza: "🍕",
  burger: "🍔",
  sandwich: "🥪",
  sushi: "🍣",
  tacos: "🌮",
  kebab: "🥙",
  crispy: "🍗",
  grillades: "🍖",
  plats: "🍲",
  gourmet: "🍽️",
  boissons: "🥤",
  desserts: "🍰",
  epicerie: "🛒",
  "épicerie": "🛒",
  alimentation: "🍅",
  boutique: "🛍️",
  viennoiserie: "🥐",
  patisserie: "🧁",
  "pâtisserie": "🧁",
};
export function getEmojiCategorieProduit(categorie: string): string {
  return EMOJI_PRODUIT[categorie.trim().toLowerCase()] || "🍴";
}
// Catégories CÔTÉ CLIENT uniquement — plus riche, mélange type de commerce et type de
// plat, pour permettre de filtrer directement sur "Pizza" ou "Sushi" par exemple.
// Le filtrage matche soit fournisseur.categorie (type de commerce), soit
// fournisseur.produits_categories (types de plats réellement vendus par ce commerce).
// "couleur" = utilisée par CategoryBar pour teinter l'icône et le fond quand active.
export interface CategorieClientDef {
  key: string;
  label: string;
  emoji: string;
  couleur: string;
}
export const CATEGORIES_CLIENT: CategorieClientDef[] = [
  { key: "tous", label: "Tous", emoji: "🍽️", couleur: "#131a2b" },
  { key: "restaurant", label: "Resto", emoji: "🍴", couleur: "#f5790c" },
  { key: "Burger", label: "Burger", emoji: "🍔", couleur: "#b45309" },
  { key: "Pizza", label: "Pizza", emoji: "🍕", couleur: "#dc2626" },
  { key: "Sandwich", label: "Sandwich", emoji: "🥪", couleur: "#ea580c" },
  { key: "Sushi", label: "Sushi", emoji: "🍣", couleur: "#e11d48" },
  { key: "Crispy", label: "Crispy", emoji: "🍗", couleur: "#d97706" },
  { key: "Grillades", label: "Grillades", emoji: "🍖", couleur: "#9a3412" },
  { key: "Tacos", label: "Tacos", emoji: "🌮", couleur: "#16a34a" },
  { key: "Kebab", label: "Kebab", emoji: "🥙", couleur: "#ea580c" },
  { key: "Plats", label: "Plats", emoji: "🍲", couleur: "#131a2b" },
  { key: "Boissons", label: "Boissons", emoji: "🥤", couleur: "#2563eb" },
  { key: "Desserts", label: "Desserts", emoji: "🍰", couleur: "#db2777" },
  { key: "epicerie", label: "Épiceries", emoji: "🛒", couleur: "#16a34a" },
  { key: "alimentation", label: "Alimentation", emoji: "🍅", couleur: "#dc2626" },
  { key: "boutique", label: "Boutique", emoji: "🛍️", couleur: "#7c3aed" },
  { key: "parfumerie", label: "Parfumerie", emoji: "🌸", couleur: "#db2777" },
  { key: "cosmetiques", label: "Cosmétiques", emoji: "💄", couleur: "#db2777" },
  { key: "viennoiserie", label: "Viennoiserie", emoji: "🥐", couleur: "#d97706" },
  { key: "patisserie", label: "Pâtisserie", emoji: "🧁", couleur: "#db2777" },
];

// Sous-types de plat, affichés uniquement quand la catégorie "Resto" est
// active (TypePlatBar) -- meme liste que les suggestions produit, avec
// emoji, pour affiner la recherche a l'interieur des restaurants.
export interface TypePlatDef {
  key: string;
  label: string;
  emoji: string;
}
export const TYPES_PLATS_CLIENT: TypePlatDef[] = [
  { key: "tous", label: "Tous", emoji: "🍽️" },
  { key: "Pizza", label: "Pizza", emoji: "🍕" },
  { key: "Burger", label: "Burger", emoji: "🍔" },
  { key: "Sandwich", label: "Sandwich", emoji: "🥪" },
  { key: "Sushi", label: "Sushi", emoji: "🍣" },
  { key: "Tacos", label: "Tacos", emoji: "🌮" },
  { key: "Kebab", label: "Kebab", emoji: "🥙" },
  { key: "Crispy", label: "Crispy", emoji: "🍗" },
  { key: "Grillades", label: "Grillades", emoji: "🍖" },
  { key: "Plats", label: "Plats", emoji: "🍲" },
  { key: "Boissons", label: "Boissons", emoji: "🥤" },
  { key: "Desserts", label: "Desserts", emoji: "🍰" },
];
