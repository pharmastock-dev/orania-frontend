"""
Intercepte le bouton retour materiel Android sur ClientHomePage :
- Si "Voir tout" est actif (tri ou filtre applique) -> revient a la vue
  decouverte normale, au lieu de quitter la page.
- Sinon (deja sur la vue par defaut) -> minimise l'app, au lieu de
  naviguer vers l'ecran de selection des espaces.
A lancer UNE SEULE FOIS depuis le dossier orania-frontend.

Usage :
    python corriger_bouton_retour.py
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


NOUVEL_EFFECT = '''
  // Bouton retour materiel Android : sur l'accueil client, ne doit jamais
  // faire quitter vers l'ecran de selection des espaces. Si "Voir tout"
  // est actif (tri/filtre), revient d'abord a la vue decouverte ; sinon,
  // minimise l'app (comportement standard d'un ecran "accueil").
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let listenerRetour: { remove: () => void } | undefined;
    import("@capacitor/app").then(({ App }) => {
      App.addListener("backButton", () => {
        if (tri !== null || filtresActifs.length > 0) {
          setTri(null);
          setFiltresActifs([]);
        } else {
          App.exitApp();
        }
      }).then((h) => {
        listenerRetour = h;
      });
    });
    return () => listenerRetour?.remove();
  }, [tri, filtresActifs]);
'''


def main():
    print("Traitement de src/pages/ClientHomePage.tsx...")
    with open("src/pages/ClientHomePage.tsx", "r", encoding="utf-8") as f:
        contenu = f.read()

    if "backButton" in contenu:
        print("  [DEJA FAIT] Gestionnaire du bouton retour deja present.")
        return

    ancre = "  useEffect(() => {\n    if (!position) return;"
    if ancre not in contenu:
        print("  [ECHEC] Point d'ancrage introuvable -- a coller a la main.")
        return

    contenu = contenu.replace(ancre, NOUVEL_EFFECT.strip("\n") + "\n\n" + ancre, 1)
    with open("src/pages/ClientHomePage.tsx", "w", encoding="utf-8") as f:
        f.write(contenu)
    print("  [OK] Gestionnaire du bouton retour ajoute.")
    print("\nVerifie avec : npm run build")


if __name__ == "__main__":
    main()
