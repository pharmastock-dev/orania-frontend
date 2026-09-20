"""
Corrige l'effet "rubber-band" (rebond elastique) d'iOS -- tout l'ecran
bouge/rebondit au toucher, meme sans contenu a faire defiler. Bug
classique WebView iOS, corrige en fixant html/body et en rendant #root
seul responsable du defilement reel.
A lancer UNE SEULE FOIS depuis le dossier orania-frontend.

Usage :
    python corriger_scroll_ios.py
"""

CSS_A_AJOUTER = '''

/* Corrige l'effet "rubber-band" (rebond elastique) d'iOS -- empeche
   tout l'ecran de bouger/rebondir au toucher. html/body restent fixes,
   #root gere seul le vrai defilement avec inertie tactile native. */
html, body {
  position: fixed;
  overflow: hidden;
  width: 100%;
  height: 100%;
  overscroll-behavior: none;
}
#root {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
'''


def main():
    print("Traitement de src/index.css...")
    with open("src/index.css", "r", encoding="utf-8") as f:
        contenu = f.read()

    if "rubber-band" in contenu:
        print("  [DEJA FAIT] Correctif deja present.")
        return

    contenu += CSS_A_AJOUTER
    with open("src/index.css", "w", encoding="utf-8") as f:
        f.write(contenu)
    print("  [OK] Correctif scroll iOS ajoute a la fin de index.css.")
    print("\nVerifie avec : npm run build")


if __name__ == "__main__":
    main()
