"""
Ajoute un jeu de couleurs sombres dedie a l'espace client, SANS toucher
aux couleurs "ink-*" existantes (utilisees partout ailleurs -- commercant,
livreur, admin -- qui doivent rester en theme clair, inchanges).
A lancer UNE SEULE FOIS depuis le dossier orania-frontend.

Usage :
    python ajouter_theme_sombre.py
"""

NOUVELLES_COULEURS = '''
  /* Theme sombre -- espace client uniquement. Prefixe "dark-" pour ne
     jamais entrer en collision avec les tokens "ink-*" existants, utilises
     dans le reste de l'app (commercant/livreur/admin) qui restent en
     theme clair, inchanges par cet ajout. */
  --color-dark-bg: #0b1220;
  --color-dark-surface: #131c30;
  --color-dark-card: #16203a;
  --color-dark-border: #253150;
  --color-dark-text: #f5f7fb;
  --color-dark-text-muted: #8b95ad;
'''

def main():
    print("Traitement de src/index.css...")
    with open("src/index.css", "r", encoding="utf-8") as f:
        contenu = f.read()

    if "--color-dark-bg" in contenu:
        print("  [DEJA FAIT] Couleurs sombres deja presentes.")
        return

    ancien = '  --font-display: "Sora", "Inter", system-ui, sans-serif;'
    if ancien not in contenu:
        print("  [ECHEC] Point d'ancrage introuvable -- a coller a la main.")
        return

    contenu = contenu.replace(ancien, NOUVELLES_COULEURS.strip("\n") + "\n\n" + ancien, 1)
    with open("src/index.css", "w", encoding="utf-8") as f:
        f.write(contenu)
    print("  [OK] Couleurs sombres ajoutees.")
    print("\nVerifie avec : npm run build")


if __name__ == "__main__":
    main()
