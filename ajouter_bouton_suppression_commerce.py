"""
Ajoute le bouton "Supprimer mon compte" + modal de confirmation dans
MonCommerceTab.tsx, juste apres le bouton "Enregistrer".
A lancer UNE SEULE FOIS depuis le dossier orania-frontend.

Usage :
    python ajouter_bouton_suppression_commerce.py
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
    print("Traitement de src/components/fournisseur/MonCommerceTab.tsx...")
    tout_ok = patch(
        "src/components/fournisseur/MonCommerceTab.tsx",
        [
            (
                'import { Info, Clock, MessageSquareText, MapPinned, Camera } from "lucide-react";',
                'import { Info, Clock, MessageSquareText, MapPinned, Camera, Trash2, AlertTriangle } from "lucide-react";\nimport { useNavigate } from "react-router-dom";\nimport Modal from "../Modal";',
                "Import des icones, useNavigate, Modal",
            ),
            (
                'import { updateFournisseur, uploadFournisseurImage, resolveImageUrl } from "../../api";',
                'import { updateFournisseur, uploadFournisseurImage, resolveImageUrl, supprimerCompteFournisseur } from "../../api";',
                "Import de supprimerCompteFournisseur",
            ),
            (
                '  const { fournisseurConnecte, setFournisseurConnecte } = useApp();\n  const { showToast } = useToast();',
                '  const { fournisseurConnecte, setFournisseurConnecte } = useApp();\n  const { showToast } = useToast();\n  const navigate = useNavigate();\n  const [suppressionOuverte, setSuppressionOuverte] = useState(false);\n  const [suppressionEnCours, setSuppressionEnCours] = useState(false);',
                "Etats pour la suppression",
            ),
            (
                '  const position = form.latitude != null',
                '''  async function handleSupprimerCompte() {
    if (!fournisseurConnecte) return;
    setSuppressionEnCours(true);
    try {
      await supprimerCompteFournisseur(fournisseurConnecte.id);
      showToast("Votre compte a ete supprime.", "success");
      setFournisseurConnecte(null);
      navigate("/");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible de supprimer le compte.", "error");
      setSuppressionEnCours(false);
      setSuppressionOuverte(false);
    }
  }

  const position = form.latitude != null''',
                "Fonction de suppression",
            ),
            (
                '      <Button onClick={enregistrer} loading={enregistrement}>Enregistrer les modifications</Button>\n    </div>\n  );\n}',
                '''      <Button onClick={enregistrer} loading={enregistrement}>Enregistrer les modifications</Button>

      <button
        onClick={() => setSuppressionOuverte(true)}
        className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-red-600 mt-2 py-2"
      >
        <Trash2 size={15} /> Supprimer mon compte commercant
      </button>

      <Modal open={suppressionOuverte} onClose={() => !suppressionEnCours && setSuppressionOuverte(false)} title="Supprimer mon compte">
        <div className="flex items-start gap-2.5 bg-red-50 text-red-700 text-sm rounded-xl px-3.5 py-3 mb-4">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            Cette action est <strong>definitive et irreversible</strong>. Votre commerce disparaitra immediatement
            de la liste cote client. Votre historique de commandes reste conserve (obligations comptables), mais
            ne sera plus associe a vos informations personnelles.
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
}''',
                "Bouton + modal de suppression",
            ),
        ],
        "MonCommerceTab.tsx",
    )

    print("\n" + ("Bouton de suppression ajoute avec succes !" if tout_ok else "Termine avec au moins un echec -- voir [ECHEC] ci-dessus."))
    print("Verifie avec : npm run build")


if __name__ == "__main__":
    main()
