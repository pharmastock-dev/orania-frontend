"""
Ajoute la fonction API supprimerCompteLivreur dans src/api/index.ts.
A lancer UNE SEULE FOIS depuis le dossier orania-frontend.

Usage :
    python ajouter_api_suppression_livreur.py
"""

def main():
    print("Traitement de src/api/index.ts...")

    with open("src/api/index.ts", "r", encoding="utf-8") as f:
        contenu = f.read()

    if "supprimerCompteLivreur" in contenu:
        print("  [DEJA FAIT] supprimerCompteLivreur deja present.")
        return

    ancre = "export const majStatutLivreur ="
    if ancre not in contenu:
        print("  [ECHEC] Point d'ancrage introuvable -- a coller a la main.")
        print("  Ajoute ceci manuellement dans src/api/index.ts :")
        print('  export const supprimerCompteLivreur = (livreurId: number) =>')
        print('    http.del<{ succes: boolean; message: string }>(`/livreurs_marketplace/${livreurId}/compte`, "livreur");')
        return

    nouvelle_fonction = '''export const supprimerCompteLivreur = (livreurId: number) =>
  http.del<{ succes: boolean; message: string }>(`/livreurs_marketplace/${livreurId}/compte`, "livreur");

''' + ancre

    contenu = contenu.replace(ancre, nouvelle_fonction, 1)
    with open("src/api/index.ts", "w", encoding="utf-8") as f:
        f.write(contenu)
    print("  [OK] supprimerCompteLivreur ajoutee.")
    print("\nVerifie avec : npm run build")


if __name__ == "__main__":
    main()
