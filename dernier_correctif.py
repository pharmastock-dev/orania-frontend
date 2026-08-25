"""
DERNIER correctif de tout le chantier securite - supprimerLivreur.
A lancer UNE SEULE FOIS depuis le dossier orania-frontend.

Usage :
    python dernier_correctif.py
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


def main():
    print("Traitement de src/api/index.ts...")
    tout_ok = patch(
        "src/api/index.ts",
        [
            (
                'export const supprimerLivreur = (livreurId: number) => http.del<{ succes: boolean; message?: string }>(`/livreurs/${livreurId}`);',
                'export const supprimerLivreur = (livreurId: number) => http.del<{ succes: boolean; message?: string }>(`/livreurs/${livreurId}`, "fournisseur");',
                "supprimerLivreur",
            ),
        ],
        "api/index.ts",
    )

    print("\n" + ("TOUT LE CHANTIER SECURITE EST TERMINE !" if tout_ok else "Echec — voir [ECHEC] ci-dessus."))
    print("Verifie maintenant avec : npm run build")


if __name__ == "__main__":
    main()
