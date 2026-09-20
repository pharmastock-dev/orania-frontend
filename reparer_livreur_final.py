"""
Corrige l'erreur introduite par la "correction 2" precedente -- il
fallait garder un </div> final pour bien fermer la div englobante
(bouton + Modal). Le retire n'aurait jamais du etre fait.
A lancer UNE SEULE FOIS depuis le dossier orania-frontend.

Usage :
    python reparer_livreur_final.py
"""

def main():
    print("Traitement de src/pages/LivreurDashboard.tsx...")
    with open("src/pages/LivreurDashboard.tsx", "r", encoding="utf-8") as f:
        contenu = f.read()

    casse = '''      </Modal>
  );
}'''
    corrige = '''      </Modal>
    </div>
  );
}'''

    if corrige in contenu:
        print("  [DEJA FAIT] Deja correct.")
        return
    if casse not in contenu:
        print("  [ECHEC] Motif introuvable -- structure differente.")
        return

    contenu = contenu.replace(casse, corrige, 1)
    with open("src/pages/LivreurDashboard.tsx", "w", encoding="utf-8") as f:
        f.write(contenu)
    print("  [OK] </div> final restaure.")
    print("\nVerifie avec : npm run build")


if __name__ == "__main__":
    main()
