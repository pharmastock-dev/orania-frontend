"""
Correction finale -- retire le </div> qui se trouve entre </button> et
<Modal>, qui fermait la structure englobante trop tot (avant que la
Modal y soit incluse).
A lancer UNE SEULE FOIS depuis le dossier orania-frontend.

Usage :
    python reparer_livreur_ultime.py
"""

def main():
    print("Traitement de src/pages/LivreurDashboard.tsx...")
    with open("src/pages/LivreurDashboard.tsx", "r", encoding="utf-8") as f:
        contenu = f.read()

    casse = '''          <Trash2 size={15} /> Supprimer mon compte livreur
        </button>
      </div>

      <Modal'''

    corrige = '''          <Trash2 size={15} /> Supprimer mon compte livreur
        </button>

      <Modal'''

    if corrige in contenu:
        print("  [DEJA FAIT] Deja correct.")
        return
    if casse not in contenu:
        print("  [ECHEC] Motif introuvable -- structure differente.")
        return

    contenu = contenu.replace(casse, corrige, 1)
    with open("src/pages/LivreurDashboard.tsx", "w", encoding="utf-8") as f:
        f.write(contenu)
    print("  [OK] </div> superflu (entre bouton et Modal) retire.")
    print("\nVerifie avec : npm run build")


if __name__ == "__main__":
    main()
