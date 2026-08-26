"""
Analyse hebdomadaire - integration frontend : type, fonction API, nouvel
onglet dans le tableau de bord commercant.
A lancer UNE SEULE FOIS depuis le dossier orania-frontend, APRES avoir
copie AnalyseTab.tsx dans src/components/fournisseur/.

Usage :
    python integrer_analyse_frontend.py
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
    tout_ok = True

    # ---- 1. Fonction API ----
    print("Traitement de src/api/index.ts...")
    tout_ok &= patch(
        "src/api/index.ts",
        [
            (
                'export const rechercherAssistant = (criteres: CriteresAssistant) =>',
                'export const getAnalyseHebdomadaire = (fournisseurId: number) =>\n  http.get<any>(`/fournisseurs/${fournisseurId}/analyse-hebdomadaire`, "fournisseur");\n\nexport const rechercherAssistant = (criteres: CriteresAssistant) =>',
                "Ajout de getAnalyseHebdomadaire",
            ),
        ],
        "api/index.ts",
    )

    # ---- 2. FournisseurDashboard.tsx : type Onglet, import, TABS, rendu ----
    print("\nTraitement de src/pages/FournisseurDashboard.tsx...")

    with open("src/pages/FournisseurDashboard.tsx", "r", encoding="utf-8") as f:
        contenu_verif = f.read()
    icone_deja_utilisee = "Sparkles" in contenu_verif

    remplacements = [
        (
            'import CommandesTab from "../components/fournisseur/CommandesTab";',
            'import CommandesTab from "../components/fournisseur/CommandesTab";\nimport AnalyseTab from "../components/fournisseur/AnalyseTab";',
            "Import de AnalyseTab",
        ),
        (
            'type Onglet = "produits" | "commandes" | "livreurs" | "stats" | "commerce";',
            'type Onglet = "produits" | "commandes" | "livreurs" | "stats" | "commerce" | "analyse";',
            "Ajout de 'analyse' au type Onglet",
        ),
        (
            '          {onglet === "commerce" && <MonCommerceTab key={`m-${refreshKey}`} />}',
            '          {onglet === "commerce" && <MonCommerceTab key={`m-${refreshKey}`} />}\n          {onglet === "analyse" && <AnalyseTab key={`a-${refreshKey}`} fournisseurId={fournisseurConnecte.id} />}',
            "Rendu de AnalyseTab",
        ),
    ]

    if not icone_deja_utilisee:
        print("  [INFO] 'Sparkles' n'est pas encore importe depuis lucide-react dans ce fichier -- a ajouter a la main a l'import existant si besoin (utilise pour l'onglet).")

    tout_ok &= patch("src/pages/FournisseurDashboard.tsx", remplacements, "FournisseurDashboard.tsx")

    print("\n" + ("Integration terminee !" if tout_ok else "Termine avec au moins un echec -- voir [ECHEC] ci-dessus, a coller a la main."))
    print("\nIMPORTANT -- il reste UNE etape manuelle non automatisee ici :")
    print("Ajoute cette entree dans le tableau TABS (dans FournisseurDashboard.tsx) :")
    print('  { key: "analyse", label: "Mon analyse", icon: Sparkles, couleur: "text-[var(--color-orange-600)]", fond: "bg-[var(--color-orange-100)]" },')
    print("(pas automatise car je n'ai pas vu la fin exacte du tableau TABS)")
    print("\nVerifie avec : npm run build")


if __name__ == "__main__":
    main()
