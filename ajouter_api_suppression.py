"""
Ajoute la fonction API supprimerCompteClient dans src/api/index.ts.
A lancer UNE SEULE FOIS depuis le dossier orania-frontend.

Usage :
    python ajouter_api_suppression.py
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

    with open("src/api/index.ts", "r", encoding="utf-8") as f:
        contenu = f.read()

    if "supprimerCompteClient" in contenu:
        print("  [DEJA FAIT] supprimerCompteClient deja present.")
        return

    ancre = 'export const enregistrerTokenAcheteur ='
    if ancre not in contenu:
        print("  [ECHEC] Point d'ancrage introuvable -- a coller a la main.")
        print("  Ajoute ceci manuellement dans src/api/index.ts :")
        print('  export const supprimerCompteClient = (acheteurId: number) =>')
        print('    http.del<{ succes: boolean; message: string }>(`/acheteurs/${acheteurId}/compte`, "client");')
        return

    nouvelle_fonction = '''export const supprimerCompteClient = (acheteurId: number) =>
  http.del<{ succes: boolean; message: string }>(`/acheteurs/${acheteurId}/compte`, "client");

''' + ancre

    contenu = contenu.replace(ancre, nouvelle_fonction, 1)
    with open("src/api/index.ts", "w", encoding="utf-8") as f:
        f.write(contenu)
    print("  [OK] supprimerCompteClient ajoutee.")
    print("\nVerifie avec : npm run build")


if __name__ == "__main__":
    main()
