"""
Ajoute l'entree "Mon analyse" dans le tableau TABS, sans avoir besoin de
voir tout le fichier -- insere juste apres l'entree "produits" (deja
confirmee), et reutilise l'icone Package (deja importee) pour eviter tout
risque d'import manquant.
A lancer UNE SEULE FOIS depuis le dossier orania-frontend.

Usage :
    python ajouter_onglet_analyse.py
"""

def patch(chemin, remplacements, nom_fichier):
    with open(chemin, "r", encoding="utf-8") as f:
        contenu = f.read()
    total_ok = 0
    for ancien, nouveau, description in remplacements:
        if nouveau in contenu:
            print(f"  [DEJA FAIT] {description}")
            total_ok += 1
            continue
        if ancien not in contenu:
            print(f"  [ECHEC] {description} -- texte attendu introuvable, a coller a la main.")
            continue
        contenu = contenu.replace(ancien, nouveau, 1)
        print(f"  [OK] {description}")
        total_ok += 1
    with open(chemin, "w", encoding="utf-8") as f:
        f.write(contenu)
    return total_ok == len(remplacements)


def main():
    print("Traitement de src/pages/FournisseurDashboard.tsx...")
    tout_ok = patch(
        "src/pages/FournisseurDashboard.tsx",
        [
            (
                '{ key: "produits", label: "Produits", icon: Package, couleur: "text-[var(--color-orange-600)]", fond: "bg-[var(--color-orange-100)]" },',
                '{ key: "produits", label: "Produits", icon: Package, couleur: "text-[var(--color-orange-600)]", fond: "bg-[var(--color-orange-100)]" },\n  { key: "analyse", label: "Mon analyse", icon: Package, couleur: "text-[var(--color-navy-700)]", fond: "bg-[var(--color-ink-100)]" },',
                "Ajout de l'entree 'Mon analyse' dans TABS (juste apres 'produits')",
            ),
        ],
        "FournisseurDashboard.tsx",
    )

    print("\n" + ("Onglet ajoute avec succes !" if tout_ok else "Echec -- voir [ECHEC] ci-dessus."))
    print("Verifie maintenant avec : npm run build")


if __name__ == "__main__":
    main()
