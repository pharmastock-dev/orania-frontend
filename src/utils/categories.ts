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
  { key: "cafeteria", label: "Cafétéria", emoji: "☕" },
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

// Catégories CÔTÉ CLIENT — reflète exactement les catégories que les commerçants
// choisissent à l'inscription (pas de types de plats mélangés). Chaque catégorie
// a sa propre couleur d'accent, pour que le filtre actif se distingue clairement
// d'une catégorie à l'autre plutôt qu'un seul orange générique partout.
export interface CategorieClientDef {
  key: string;
  label: string;
  emoji: string;
  couleur: string; // couleur d'accent (fond clair + texte/bordure une fois actif)
}

export const CATEGORIES_CLIENT: CategorieClientDef[] = [
  { key: "tous", label: "Tous", emoji: "🍽️", couleur: "#131a2b" },
  { key: "restaurant", label: "Resto", emoji: "🍴", couleur: "#f5790c" },
  { key: "cafeteria", label: "Cafétéria", emoji: "☕", couleur: "#92400e" },
  { key: "epicerie", label: "Épiceries", emoji: "🛒", couleur: "#16a34a" },
  { key: "parfumerie", label: "Parfumerie", emoji: "🌸", couleur: "#db2777" },
  { key: "cosmetiques", label: "Cosmétiques", emoji: "💄", couleur: "#9333ea" },
  { key: "viennoiserie", label: "Viennoiserie", emoji: "🥐", couleur: "#ca8a04" },
  { key: "patisserie", label: "Pâtisserie", emoji: "🧁", couleur: "#e11d48" },
];
