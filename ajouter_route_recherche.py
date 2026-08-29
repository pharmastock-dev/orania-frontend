"""
Ajoute la route /client/recherche (nouvelle page dediee) dans App.tsx.
A lancer UNE SEULE FOIS depuis le dossier orania-frontend, APRES avoir
copie SearchPage.tsx dans src/pages/.

Usage :
    python ajouter_route_recherche.py
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
    print("Traitement de src/App.tsx...")
    tout_ok = patch(
        "src/App.tsx",
        [
            (
                'import ClientHomePage from "./pages/ClientHomePage";',
                'import ClientHomePage from "./pages/ClientHomePage";\nimport SearchPage from "./pages/SearchPage";',
                "Import de SearchPage",
            ),
            (
                '<Route path="/client/accueil" element={<RequireClient><ClientHomePage /></RequireClient>} />',
                '<Route path="/client/accueil" element={<RequireClient><ClientHomePage /></RequireClient>} />\n        <Route path="/client/recherche" element={<RequireClient><SearchPage /></RequireClient>} />',
                "Route /client/recherche",
            ),
        ],
        "App.tsx",
    )

    print("\n" + ("Route ajoutee avec succes !" if tout_ok else "Termine avec au moins un echec -- voir [ECHEC] ci-dessus."))
    print("Verifie avec : npm run build")


if __name__ == "__main__":
    main()
