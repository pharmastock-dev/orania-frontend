"""
Ajoute la fonction API supprimerCompteFournisseur dans src/api/index.ts.
A lancer UNE SEULE FOIS depuis le dossier orania-frontend.

Usage :
    python ajouter_api_suppression_fournisseur.py
"""

def main():
    print("Traitement de src/api/index.ts...")

    with open("src/api/index.ts", "r", encoding="utf-8") as f:
        contenu = f.read()

    if "supprimerCompteFournisseur" in contenu:
        print("  [DEJA FAIT] supprimerCompteFournisseur deja present.")
        return

    ancre = 'export const enregistrerTokenFournisseur ='
    if ancre not in contenu:
        print("  [ECHEC] Point d'ancrage introuvable -- a coller a la main.")
        print("  Ajoute ceci manuellement dans src/api/index.ts :")
        print('  export const supprimerCompteFournisseur = (fournisseurId: number) =>')
        print('    http.del<{ succes: boolean; message: string }>(`/fournisseurs/${fournisseurId}/compte`, "fournisseur");')
        return

    nouvelle_fonction = '''export const supprimerCompteFournisseur = (fournisseurId: number) =>
  http.del<{ succes: boolean; message: string }>(`/fournisseurs/${fournisseurId}/compte`, "fournisseur");

''' + ancre

    contenu = contenu.replace(ancre, nouvelle_fonction, 1)
    with open("src/api/index.ts", "w", encoding="utf-8") as f:
        f.write(contenu)
    print("  [OK] supprimerCompteFournisseur ajoutee.")
    print("\nVerifie avec : npm run build")


if __name__ == "__main__":
    main()
