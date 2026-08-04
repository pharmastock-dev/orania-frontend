// src/lib/categories.ts

export const CATEGORIES_CLIENT = [
  'Gourmet',
  'Burger',
  'Pizza',
  'Sandwich',
  'Sushi',
  'Crispy',
  'Patisserie',
  'Grillades',
  'Tacos',
  'Kebab',
  'Plats',
  'Restaurant',
  'Parfumerie',
  'Épiceries',
  'Cosmétiques',
  'Viennoiserie',
]

export const CATEGORIES_PRODUITS = [
  'Gourmet',
  'Burger',
  'Pizza',
  'Sandwich',
  'Sushi',
  'Crispy',
  'Patisserie',
  'Grillades',
  'Tacos',
  'Kebab',
  'Plats',
  'Poutine',
  'Boissons',
  'Suppléments',
]

export const catEmoji = (cat: string): string => {
  const emojis: Record<string, string> = {
    gourmet: '🍽️',
    burger: '🍔',
    pizza: '🍕',
    sandwich: '🥪',
    sushi: '🍣',
    crispy: '🍟',
    patisserie: '🧁',
    grillades: '🍖',
    tacos: '🌮',
    kebab: '🌯',
    plats: '🍲',
    poutine: '🍟',
    boissons: '🥤',
    suppléments: '✨',
    restaurant: '🍽️',
    parfumerie: '💄',
    épiceries: '🛒',
    cosmétiques: '💅',
    viennoiserie: '🥐',
    promo: '🔥',
  }
  return emojis[cat.toLowerCase()] || '📌'
}

export const normalizeCategory = (cat: string): string => {
  return cat.trim().toLowerCase().charAt(0).toUpperCase() + cat.trim().toLowerCase().slice(1)
}