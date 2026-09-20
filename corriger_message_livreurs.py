"""
Corrige le message d'erreur qui reste affiche indefiniment dans
LivreursTab.tsx meme apres un ajout reussi -- rien n'effacait jamais
"erreur" une fois affichee au premier chargement.
A lancer UNE SEULE FOIS depuis le dossier orania-frontend.

Usage :
    python corriger_message_livreurs.py
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
    print("Traitement de src/components/fournisseur/LivreursTab.tsx...")
    tout_ok = patch(
        "src/components/fournisseur/LivreursTab.tsx",
        [
            (
                '''    setAjoutEnCours(true);
    try {
      const nouveau = await creerLivreur(fournisseurId, { nom: nom.trim(), telephone: telephone.trim() });
      setLivreurs((prev) => [...prev, nouveau]);
      setNom("");
      setTelephone("");
      showToast("Livreur ajoutÃ©", "success");''',
                '''    setAjoutEnCours(true);
    try {
      const nouveau = await creerLivreur(fournisseurId, { nom: nom.trim(), telephone: telephone.trim() });
      setLivreurs((prev) => [...prev, nouveau]);
      setErreur(null);
      setNom("");
      setTelephone("");
      showToast("Livreur ajoutÃ©", "success");''',
                "Efface le message d'erreur apres un ajout reussi",
            ),
        ],
        "LivreursTab.tsx",
    )

    print("\n" + ("Correction appliquee avec succes !" if tout_ok else "Termine avec au moins un echec -- voir [ECHEC] ci-dessus."))
    print("Verifie avec : npm run build")


if __name__ == "__main__":
    main()
