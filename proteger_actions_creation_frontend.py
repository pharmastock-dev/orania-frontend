"""
DERNIER script du chantier securite - ajoute le jeton sur les 3 dernieres
actions (creer commande, accepter livraison, changer statut).
A lancer UNE SEULE FOIS depuis le dossier orania-frontend.

Usage :
    python proteger_actions_creation_frontend.py
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
    print("Traitement de src/api/index.ts...")
    tout_ok = patch(
        "src/api/index.ts",
        [
            (
                '}) => http.post<{ id?: number; commande_id?: number; code_confirmation: string; statut?: string; prix_total?: number; succes?: boolean; message?: string }>("/commandes", data);',
                '}) => http.post<{ id?: number; commande_id?: number; code_confirmation: string; statut?: string; prix_total?: number; succes?: boolean; message?: string }>("/commandes", data, "client");',
                "createCommande",
            ),
            (
                'http.post<{ succes: boolean; message: string }>(`/commandes/${commandeId}/accepter-marketplace`, { livreur_id: livreurId });',
                'http.post<{ succes: boolean; message: string }>(`/commandes/${commandeId}/accepter-marketplace`, { livreur_id: livreurId }, "livreur");',
                "accepterCommandeMarketplace",
            ),
            (
                'http.put<{ succes: boolean }>(`/commandes/${commandeId}/statut`, { statut });',
                'http.put<{ succes: boolean }>(`/commandes/${commandeId}/statut`, { statut }, "fournisseur");',
                "updateCommandeStatut",
            ),
        ],
        "api/index.ts",
    )

    print("\n" + ("CHANTIER SECURITE ENTIEREMENT TERMINE !" if tout_ok else "Termine avec au moins un echec -- voir [ECHEC] ci-dessus."))
    print("Verifie maintenant avec : npm run build")


if __name__ == "__main__":
    main()
