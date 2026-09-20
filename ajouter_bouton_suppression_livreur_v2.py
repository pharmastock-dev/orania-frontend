"""
Version 2 -- patch minimal, cible uniquement la toute fin du fichier
(moins fragile face aux espaces/encodages invisibles).
A lancer UNE SEULE FOIS depuis le dossier orania-frontend.

Usage :
    python ajouter_bouton_suppression_livreur_v2.py
"""

def main():
    print("Traitement de src/pages/LivreurDashboard.tsx...")
    with open("src/pages/LivreurDashboard.tsx", "r", encoding="utf-8") as f:
        contenu = f.read()

    if "Supprimer mon compte livreur" in contenu:
        print("  [DEJA FAIT] Bouton deja present.")
        return

    # Cible uniquement les toutes dernieres lignes du fichier, en
    # ignorant les espaces exacts -- on retire la fin puis on la
    # reconstruit avec notre ajout.
    lignes = contenu.rstrip().split("\n")
    if lignes[-1].strip() != "}" or lignes[-2].strip() != ");":
        print("  [ECHEC] Structure de fin de fichier inattendue -- copie manuelle necessaire.")
        print("  Dernieres lignes actuelles :")
        for l in lignes[-6:]:
            print("   ", repr(l))
        return

    # Retire les 5 dernieres lignes exactes ( </div> </div> ); } et la
    # ligne vide potentielle avant), pour les remplacer par notre bloc.
    # On cherche precisement l'indice du dernier "</div>\n    </div>\n  );\n}"
    fin_reconstruite = '''

        <button
          onClick={() => setSuppressionOuverte(true)}
          className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-red-600 mt-6 py-2"
        >
          <Trash2 size={15} /> Supprimer mon compte livreur
        </button>
      </div>

      <Modal open={suppressionOuverte} onClose={() => !suppressionEnCours && setSuppressionOuverte(false)} title="Supprimer mon compte">
        <div className="flex items-start gap-2.5 bg-red-50 text-red-700 text-sm rounded-xl px-3.5 py-3 mb-4">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            Cette action est <strong>definitive et irreversible</strong>. Votre historique de livraisons reste
            conserve (obligations comptables), mais ne sera plus associe a vos informations personnelles.
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" fullWidth onClick={() => setSuppressionOuverte(false)} disabled={suppressionEnCours}>
            Annuler
          </Button>
          <Button fullWidth loading={suppressionEnCours} onClick={handleSupprimerCompte} className="!bg-red-600 hover:!bg-red-700">
            Supprimer definitivement
          </Button>
        </div>
      </Modal>
    </div>
  );
}
'''

    # Retire les 2 dernieres lignes reelles ("  );" et "}") de la fin du
    # fichier original, puis ajoute notre bloc reconstruit a la place.
    contenu_sans_fin = "\n".join(lignes[:-2])
    nouveau_contenu = contenu_sans_fin + fin_reconstruite

    with open("src/pages/LivreurDashboard.tsx", "w", encoding="utf-8") as f:
        f.write(nouveau_contenu)

    print("  [OK] Bouton + modal de suppression ajoutes (methode robuste).")
    print("\nVerifie avec : npm run build")


if __name__ == "__main__":
    main()
