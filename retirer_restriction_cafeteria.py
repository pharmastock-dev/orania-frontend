"""
Retire la restriction "cafeteria = consultation seule, pas de commande" --
desormais toutes les categories (y compris cafeteria, boutique,
alimentation) peuvent recevoir des commandes normalement.
A lancer UNE SEULE FOIS depuis le dossier orania-frontend.

Usage :
    python retirer_restriction_cafeteria.py
"""

BLOC_BANDEAU = '''        {estCafeteria && (
          <div className="flex items-center gap-2 bg-[var(--color-ink-100)] text-[var(--color-ink-700)] text-xs font-medium rounded-xl px-3.5 py-2.5">
            <Coffee size={14} className="shrink-0" /> Ce commerce propose uniquement la consultation du menu — aucune commande possible.
          </div>
        )}

'''

LIGNE_CONST_ANCIENNE = '''  // Les cafétérias sont en consultation de menu uniquement — aucune commande
  // possible (ni livraison, ni retrait), quel que soit ce que le commerce a
  // par ailleurs configuré. La règle s'applique dès que la catégorie du
  // commerce est "cafeteria", sans exception.
  const estCafeteria = fournisseur?.categorie === "cafeteria";'''

LIGNE_CONST_NOUVELLE = '''  // Toutes les categories (y compris cafeteria, boutique, alimentation)
  // peuvent desormais recevoir des commandes normalement -- restriction
  // retiree.
  const estCafeteria = false;'''


def main():
    print("Traitement de src/pages/StorePage.tsx...")
    with open("src/pages/StorePage.tsx", "r", encoding="utf-8") as f:
        contenu = f.read()

    ok1 = False
    if LIGNE_CONST_NOUVELLE in contenu:
        print("  [DEJA FAIT] Retire la restriction cafeteria")
        ok1 = True
    elif LIGNE_CONST_ANCIENNE in contenu:
        contenu = contenu.replace(LIGNE_CONST_ANCIENNE, LIGNE_CONST_NOUVELLE, 1)
        print("  [OK] Retire la restriction cafeteria (toujours false desormais)")
        ok1 = True
    else:
        print("  [ECHEC] Ligne const estCafeteria introuvable -- a corriger a la main.")

    ok2 = False
    if BLOC_BANDEAU not in contenu:
        print("  [DEJA FAIT] Bandeau d'avertissement cafeteria deja absent")
        ok2 = True
    else:
        contenu = contenu.replace(BLOC_BANDEAU, "", 1)
        print("  [OK] Retire le bandeau d'avertissement cafeteria")
        ok2 = True

    with open("src/pages/StorePage.tsx", "w", encoding="utf-8") as f:
        f.write(contenu)

    print("\n" + ("Restriction cafeteria retiree avec succes !" if (ok1 and ok2) else "Termine avec au moins un echec -- voir [ECHEC] ci-dessus."))
    print("Verifie avec : npm run build")


if __name__ == "__main__":
    main()
