"""
QREEB Assistant - integration frontend complete : types, fonction API,
route, et bouton d'acces sur l'accueil client.
A lancer UNE SEULE FOIS depuis le dossier orania-frontend, APRES avoir
copie AssistantPage.tsx dans src/pages/.

Usage :
    python integrer_assistant.py
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
            print(f"  [ECHEC] {description} — texte attendu introuvable, a coller a la main.")
            continue
        contenu = contenu.replace(ancien, nouveau, 1)
        print(f"  [OK] {description}")
        total_ok += 1
    with open(chemin, "w", encoding="utf-8") as f:
        f.write(contenu)
    return total_ok == len(remplacements)


TYPES_A_AJOUTER = '''
// Résultat renvoyé par QREEB Assistant (/assistant/recherche) — un produit
// avec son score de mérite et sa phrase d'explication générée par gabarit
// (pas par IA — voir main.py pour le détail du calcul).
export interface AssistantResultat {
  id: number;
  fournisseur_id: number;
  nom: string;
  prix: number;
  prix_promo?: number | null;
  image_url?: string | null;
  categorie?: string;
  ingredients?: string | null;
  fournisseur_nom: string;
  fournisseur_categorie?: string;
  fournisseur_adresse?: string | null;
  prix_groupe: number;
  distance_km?: number | null;
  note_moyenne?: number | null;
  score: number;
  phrase: string;
}

export interface CriteresAssistant {
  envie: string;
  budget_max?: number | null;
  personnes: number;
  latitude?: number | null;
  longitude?: number | null;
  mode: "livraison" | "retrait";
}
'''


def main():
    tout_ok = True

    # ---- 1. Types ----
    print("Traitement de src/types/index.ts...")
    with open("src/types/index.ts", "r", encoding="utf-8") as f:
        contenu = f.read()
    if "AssistantResultat" in contenu:
        print("  [DEJA FAIT] Types AssistantResultat / CriteresAssistant")
    else:
        contenu = contenu.rstrip() + "\n" + TYPES_A_AJOUTER
        with open("src/types/index.ts", "w", encoding="utf-8") as f:
            f.write(contenu)
        print("  [OK] Types ajoutes a la fin du fichier")

    # ---- 2. Fonction API ----
    print("\nTraitement de src/api/index.ts...")
    tout_ok &= patch(
        "src/api/index.ts",
        [
            (
                'export const rechercherProduits = async (q: string): Promise<ProduitRecherche[]> => {',
                'export const rechercherAssistant = (criteres: CriteresAssistant) =>\n  http.post<AssistantResultat[]>("/assistant/recherche", criteres);\n\nexport const rechercherProduits = async (q: string): Promise<ProduitRecherche[]> => {',
                "Ajout de rechercherAssistant",
            ),
            (
                'import type { Fournisseur, Produit, ProduitRecherche, Commande, Avis, Livreur, Statistiques, StatutCommande, Reclamation, LigneCommande, CommandeDisponible, StatutPublicationCommande, HistoriqueLivreurItem, LivreurMarketplaceAdmin } from "../types";',
                'import type { Fournisseur, Produit, ProduitRecherche, Commande, Avis, Livreur, Statistiques, StatutCommande, Reclamation, LigneCommande, CommandeDisponible, StatutPublicationCommande, HistoriqueLivreurItem, LivreurMarketplaceAdmin, AssistantResultat, CriteresAssistant } from "../types";',
                "Import des nouveaux types dans api/index.ts",
            ),
        ],
        "api/index.ts",
    )

    # ---- 3. Route dans App.tsx ----
    print("\nTraitement de src/App.tsx...")
    tout_ok &= patch(
        "src/App.tsx",
        [
            (
                'import LivreurLoginPage from "./pages/LivreurLoginPage";',
                'import LivreurLoginPage from "./pages/LivreurLoginPage";\nimport AssistantPage from "./pages/AssistantPage";',
                "Import de AssistantPage",
            ),
            (
                '<Route path="/livreur" element={<LivreurLoginPage />} />',
                '<Route path="/client/assistant" element={<AssistantPage />} />\n        <Route path="/livreur" element={<LivreurLoginPage />} />',
                "Route /client/assistant",
            ),
        ],
        "App.tsx",
    )

    print("\n" + ("QREEB Assistant integre avec succes !" if tout_ok else "Termine avec au moins un echec — voir [ECHEC] ci-dessus, a coller a la main."))
    print("\nRappel : il reste a ajouter un BOUTON vers /client/assistant sur ClientHomePage.tsx")
    print("(pas automatise ici, design a choisir ensemble).")
    print("\nVerifie avec : npm run build")


if __name__ == "__main__":
    main()
