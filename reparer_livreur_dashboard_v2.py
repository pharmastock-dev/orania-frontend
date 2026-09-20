"""
Reparation complete -- corrige les DEUX endroits casses par la v2 :
1. Le double </div> juste avant le bouton
2. Le </div> superflu tout a la fin, apres la Modal
A lancer UNE SEULE FOIS depuis le dossier orania-frontend.

Usage :
    python reparer_livreur_dashboard_v2.py
"""

def main():
    print("Traitement de src/pages/LivreurDashboard.tsx...")
    with open("src/pages/LivreurDashboard.tsx", "r", encoding="utf-8") as f:
        contenu = f.read()

    corrections = 0

    # Correction 1 : double </div> avant le bouton
    casse1 = '''      </div>
    </div>

        <button
          onClick={() => setSuppressionOuverte(true)}'''
    corrige1 = '''      </div>

        <button
          onClick={() => setSuppressionOuverte(true)}'''
    if casse1 in contenu:
        contenu = contenu.replace(casse1, corrige1, 1)
        print("  [OK] Double </div> avant le bouton corrige.")
        corrections += 1
    elif corrige1 in contenu:
        print("  [DEJA FAIT] Correction 1 deja appliquee.")
        corrections += 1
    else:
        print("  [ECHEC] Correction 1 : motif introuvable.")

    # Correction 2 : </div> superflu tout a la fin, apres la Modal
    casse2 = '''      </Modal>
    </div>
  );
}'''
    corrige2 = '''      </Modal>
  );
}'''
    if casse2 in contenu:
        contenu = contenu.replace(casse2, corrige2, 1)
        print("  [OK] </div> superflu en fin de fichier retire.")
        corrections += 1
    elif corrige2 in contenu:
        print("  [DEJA FAIT] Correction 2 deja appliquee.")
        corrections += 1
    else:
        print("  [ECHEC] Correction 2 : motif introuvable.")

    with open("src/pages/LivreurDashboard.tsx", "w", encoding="utf-8") as f:
        f.write(contenu)

    print("\n" + ("Reparation complete reussie !" if corrections == 2 else "Termine avec au moins un echec -- voir [ECHEC] ci-dessus."))
    print("Verifie avec : npm run build")


if __name__ == "__main__":
    main()
