"""
Integre HeroBanner dans ClientHomePage.tsx -- automatise, pour eviter
toute confusion avec du code colle directement dans le terminal.
A lancer UNE SEULE FOIS depuis le dossier orania-frontend.

Usage :
    python integrer_hero.py
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
    tout_ok = patch(
        "src/pages/ClientHomePage.tsx",
        [
            (
                'import CategoryBar from "../components/CategoryBar";',
                'import CategoryBar from "../components/CategoryBar";\nimport HeroBanner from "../components/HeroBanner";',
                "Import de HeroBanner",
            ),
            (
                '        <CategoryBar\n          actif={categorie}',
                '''        <HeroBanner onDecouvrir={() => document.getElementById("resultats-section")?.scrollIntoView({ behavior: "smooth" })} />

        <CategoryBar
          actif={categorie}''',
                "Insertion de <HeroBanner /> juste avant CategoryBar",
            ),
        ],
        "ClientHomePage.tsx",
    )

    print("\n" + ("HeroBanner integre avec succes !" if tout_ok else "Termine avec au moins un echec -- voir [ECHEC] ci-dessus."))
    print("Verifie avec : npm run build")


if __name__ == "__main__":
    main()
