"""
Incremente a nouveau la version Android (2eme republication) avant de
generer un nouveau .aab.
A lancer UNE SEULE FOIS depuis le dossier orania-frontend.

Usage :
    python incrementer_version_v2.py
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
                "versionCode 2",
                "versionCode 3",
                "versionCode : 2 -> 3",
            ),
            (
                'versionName "1.1"',
                'versionName "1.2"',
                "versionName : 1.1 -> 1.2",
            ),
        ],
        "build.gradle",
    )

    print("\n" + ("Version incrementee avec succes !" if tout_ok else "Termine avec au moins un echec -- si le numero actuel est different, dis-le moi."))


if __name__ == "__main__":
    main()
