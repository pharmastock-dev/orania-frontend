"""
Incremente a nouveau la version Android (4eme republication) avant de
generer un nouveau .aab.
A lancer UNE SEULE FOIS depuis le dossier orania-frontend.

Usage :
    python incrementer_version_v4.py
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
    print("Traitement de android/app/build.gradle...")
    tout_ok = patch(
        "android/app/build.gradle",
        [
            (
                "versionCode 4",
                "versionCode 5",
                "versionCode : 4 -> 5",
            ),
            (
                'versionName "1.3"',
                'versionName "1.4"',
                "versionName : 1.3 -> 1.4",
            ),
        ],
        "build.gradle",
    )

    print("\n" + ("Version incrementee avec succes !" if tout_ok else "Termine avec au moins un echec -- si le numero actuel est different, envoie-moi : Select-String -Path android\\app\\build.gradle -Pattern 'versionCode|versionName'"))


if __name__ == "__main__":
    main()
