"""
Ajoute le bouton "Supprimer mon compte" + modal de confirmation dans
LivreurDashboard.tsx, en bas de la zone de contenu principale.
A lancer UNE SEULE FOIS depuis le dossier orania-frontend.

Usage :
    python ajouter_bouton_suppression_livreur.py
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
    print("Traitement de src/pages/LivreurDashboard.tsx...")
    tout_ok = patch(
        "src/pages/LivreurDashboard.tsx",
        [
            (
                'import { Bike, Power, MapPin, Phone, Store, Wallet, RefreshCw, LogOut, Navigation, CheckCircle2, History, PackageCheck, PackageX } from "lucide-react";',
                'import { Bike, Power, MapPin, Phone, Store, Wallet, RefreshCw, LogOut, Navigation, CheckCircle2, History, PackageCheck, PackageX, Trash2, AlertTriangle } from "lucide-react";\nimport Modal from "../components/Modal";',
                "Import des icones et Modal",
            ),
            (
                '  getHistoriqueLivreur,\n} from "../api";',
                '  getHistoriqueLivreur,\n  supprimerCompteLivreur,\n} from "../api";',
                "Import de supprimerCompteLivreur",
            ),
            (
                '  const [chargementHistorique, setChargementHistorique] = useState(false);',
                '  const [chargementHistorique, setChargementHistorique] = useState(false);\n  const [suppressionOuverte, setSuppressionOuverte] = useState(false);\n  const [suppressionEnCours, setSuppressionEnCours] = useState(false);',
                "Etats pour la suppression",
            ),
            (
                '  async function handleAccepter(commande: CommandeDisponible) {',
                '''  async function handleSupprimerCompte() {
    if (!livreurConnecte) return;
    setSuppressionEnCours(true);
    try {
      await supprimerCompteLivreur(livreurConnecte.id);
      showToast("Votre compte a ete supprime.", "success");
      setLivreurConnecte(null);
      navigate("/");
    } catch (err) {
      showToast("Impossible de supprimer le compte.", "error");
      setSuppressionEnCours(false);
      setSuppressionOuverte(false);
    }
  }

  async function handleAccepter(commande: CommandeDisponible) {''',
                "Fonction de suppression",
            ),
            (
                '''            {!enLigne && !commandeActive && (
              <div className="text-center py-14">
                <span className="h-14 w-14 rounded-2xl bg-[var(--color-ink-100)] text-[var(--color-ink-500)] flex items-center justify-center mx-auto">
                  <Bike size={24} />
                </span>
                <p className="text-[var(--color-ink-500)] mt-3 text-sm">Passez en lignepour commencer Ã  recevoir des commandes.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}''',
                '''            {!enLigne && !commandeActive && (
              <div className="text-center py-14">
                <span className="h-14 w-14 rounded-2xl bg-[var(--color-ink-100)] text-[var(--color-ink-500)] flex items-center justify-center mx-auto">
                  <Bike size={24} />
                </span>
                <p className="text-[var(--color-ink-500)] mt-3 text-sm">Passez en ligne pour commencer a recevoir des commandes.</p>
              </div>
            )}
          </>
        )}

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
}''',
                "Bouton + modal de suppression",
            ),
        ],
        "LivreurDashboard.tsx",
    )

    print("\n" + ("Bouton de suppression ajoute avec succes !" if tout_ok else "Termine avec au moins un echec -- voir [ECHEC] ci-dessus."))
    print("Verifie avec : npm run build")


if __name__ == "__main__":
    main()
