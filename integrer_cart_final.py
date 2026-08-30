"""
Vague 10 (finale) - ajoute <CartFloatingButton avecBarreNavigation /> sur
ClientHomePage.tsx si absent, pour qu'il flotte correctement au-dessus de
la barre de navigation du bas.
A lancer UNE SEULE FOIS depuis le dossier orania-frontend.

Usage :
    python integrer_cart_final.py
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
    print("Traitement de src/pages/ClientHomePage.tsx...")

    with open("src/pages/ClientHomePage.tsx", "r", encoding="utf-8") as f:
        contenu = f.read()

    tout_ok = True

    if "CartFloatingButton" not in contenu:
        tout_ok &= patch(
            "src/pages/ClientHomePage.tsx",
            [
                (
                    'import BottomNav from "../components/BottomNav";',
                    'import BottomNav from "../components/BottomNav";\nimport CartFloatingButton from "../components/CartFloatingButton";',
                    "Import de CartFloatingButton",
                ),
                (
                    "      <BottomNav />\n    </div>",
                    "      <CartFloatingButton avecBarreNavigation />\n      <BottomNav />\n    </div>",
                    "Ajout de <CartFloatingButton avecBarreNavigation />",
                ),
            ],
            "ClientHomePage.tsx",
        )
    else:
        print("  [DEJA FAIT] CartFloatingButton deja present sur cette page.")
        print("  [INFO] Verifie manuellement qu'il a bien la prop avecBarreNavigation.")

    print("\n" + ("Vague 10 appliquee avec succes !" if tout_ok else "Termine avec au moins un echec -- voir [ECHEC] ci-dessus."))
    print("Verifie avec : npm run build")


if __name__ == "__main__":
    main()
