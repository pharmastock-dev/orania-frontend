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
export interface CategorieClientDef {
  key: string;
  label: string;
  emoji: string;
}

export const CATEGORIES_CLIENT: CategorieClientDef[] = [
  { key: "tous", label: "Tous", emoji: "🍽️" },
  { key: "restaurant", label: "Resto", emoji: "🍴" },
  { key: "Burger", label: "Burger", emoji: "🍔" },
  { key: "Pizza", label: "Pizza", emoji: "🍕" },
  { key: "Sandwich", label: "Sandwich", emoji: "🥪" },
  { key: "Sushi", label: "Sushi", emoji: "🍣" },
  { key: "Crispy", label: "Crispy", emoji: "🍗" },
  { key: "Grillades", label: "Grillades", emoji: "🍖" },
  { key: "Tacos", label: "Tacos", emoji: "🌮" },
  { key: "Kebab", label: "Kebab", emoji: "🥙" },
  { key: "Plats", label: "Plats", emoji: "🍲" },
  { key: "Boissons", label: "Boissons", emoji: "🥤" },
  { key: "Desserts", label: "Desserts", emoji: "🍰" },
  { key: "epicerie", label: "Épiceries", emoji: "🛒" },
  { key: "parfumerie", label: "Parfumerie", emoji: "🌸" },
  { key: "cosmetiques", label: "Cosmétiques", emoji: "💄" },
  { key: "viennoiserie", label: "Viennoiserie", emoji: "🥐" },
  { key: "patisserie", label: "Pâtisserie", emoji: "🧁" },
];
