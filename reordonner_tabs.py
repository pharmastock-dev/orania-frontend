"""
Reordonne les onglets du tableau de bord commercant :
Commandes - Produits - Livreurs - Mon analyse - Stats - Mon commerce.
A lancer UNE SEULE FOIS depuis le dossier orania-frontend.

Usage :
    python reordonner_tabs.py
"""

ANCIEN = '''const TABS: { key: Onglet; label: string; icon: typeof Package; couleur: string; fond: string }[] = [
  { key: "produits", label: "Produits", icon: Package, couleur: "text-[var(--color-orange-600)]", fond: "bg-[var(--color-orange-100)]" },
  { key: "analyse", label: "Mon analyse", icon: Package, couleur: "text-[var(--color-navy-700)]", fond: "bg-[var(--color-ink-100)]" },
  { key: "commandes", label: "Commandes", icon: ClipboardList, couleur: "text-[var(--color-green-600)]", fond: "bg-[var(--color-green-100)]" },
  { key: "livreurs", label: "Livreurs", icon: Bike, couleur: "text-[var(--color-pink-600)]", fond: "bg-[var(--color-pink-100)]" },
  { key: "stats", label: "Stats", icon: BarChart3, couleur: "text-[var(--color-navy-700)]", fond: "bg-[var(--color-ink-100)]" },
  { key: "commerce", label: "Mon commerce", icon: Store, couleur: "text-[var(--color-orange-600)]", fond: "bg-[var(--color-orange-100)]" },
];'''

NOUVEAU = '''const TABS: { key: Onglet; label: string; icon: typeof Package; couleur: string; fond: string }[] = [
  { key: "commandes", label: "Commandes", icon: ClipboardList, couleur: "text-[var(--color-green-600)]", fond: "bg-[var(--color-green-100)]" },
  { key: "produits", label: "Produits", icon: Package, couleur: "text-[var(--color-orange-600)]", fond: "bg-[var(--color-orange-100)]" },
  { key: "livreurs", label: "Livreurs", icon: Bike, couleur: "text-[var(--color-pink-600)]", fond: "bg-[var(--color-pink-100)]" },
  { key: "analyse", label: "Mon analyse", icon: Package, couleur: "text-[var(--color-navy-700)]", fond: "bg-[var(--color-ink-100)]" },
  { key: "stats", label: "Stats", icon: BarChart3, couleur: "text-[var(--color-navy-700)]", fond: "bg-[var(--color-ink-100)]" },
  { key: "commerce", label: "Mon commerce", icon: Store, couleur: "text-[var(--color-orange-600)]", fond: "bg-[var(--color-orange-100)]" },
];'''


def main():
    print("Traitement de src/pages/FournisseurDashboard.tsx...")
    with open("src/pages/FournisseurDashboard.tsx", "r", encoding="utf-8") as f:
        contenu = f.read()

    if NOUVEAU in contenu:
        print("  [DEJA FAIT] Ordre deja applique.")
        return
    if ANCIEN not in contenu:
        print("  [ECHEC] Bloc TABS exact introuvable -- a corriger a la main.")
        return

    contenu = contenu.replace(ANCIEN, NOUVEAU, 1)
    with open("src/pages/FournisseurDashboard.tsx", "w", encoding="utf-8") as f:
        f.write(contenu)
    print("  [OK] Ordre des onglets corrige : Commandes, Produits, Livreurs, Mon analyse, Stats, Mon commerce")
    print("\nVerifie avec : npm run build")


if __name__ == "__main__":
    main()
