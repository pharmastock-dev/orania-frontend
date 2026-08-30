"""
Remplace les 2 anciennes rangees de decouverte + la grille complete
toujours visible, par 3 rangees compactes (Promos, A proximite, Tous nos
partenaires) avec "Voir tout" qui reutilise les filtres/tri existants.
A lancer UNE SEULE FOIS depuis le dossier orania-frontend, APRES avoir
copie StoreCardCompact.tsx et DiscoveryRowCompact.tsx dans src/components/.

Usage :
    python integrer_sections_compactes.py
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


ANCIEN_BLOC_JSX = '''            {decouverteActive && (
              <>
                <DiscoveryRow titre="Promo" icone={<Flame size={17} className="text-[var(--color-orange-500)]" />} fournisseurs={discoveryPromos} positionClient={position} />
                <DiscoveryRow titre="Populaire pr\u00e8s de vous" icone={<TrendingUp size={17} className="text-[var(--color-orange-500)]" />} fournisseurs={discoveryPopulaires} positionClient={position} />
              </>
            )}

            <div id="resultats-section">
              {resultats.length === 0 ? (
                <EmptyState
                  icon={<SearchX size={36} />}
                  title="Aucun commerce trouv\u00e9"
                  description="Essayez une autre cat\u00e9gorie ou filtre."
                />
              ) : (
                <>
                  <p className="text-sm text-[var(--color-ink-500)]">{resultats.length} r\u00e9sultat{resultats.length > 1 ? "s" : ""}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {resultats.map((f) => (
                      <StoreCard key={f.id} fournisseur={f} positionClient={position} />
                    ))}
                  </div>
                </>
              )}
            </div>'''

NOUVEAU_BLOC_JSX = '''            {decouverteActive ? (
              <>
                <DiscoveryRowCompact titre="Promos" fournisseurs={discoveryPromos} positionClient={position} onVoirTout={() => toggleFiltre("promos")} />
                <DiscoveryRowCompact titre="\u00c0 proximit\u00e9" fournisseurs={discoveryProximite} positionClient={position} onVoirTout={handleProche} />
                <DiscoveryRowCompact titre="Tous nos partenaires" fournisseurs={discoveryTousPartenaires} positionClient={position} onVoirTout={() => setTri("notes")} />
              </>
            ) : (
              <div id="resultats-section">
                {resultats.length === 0 ? (
                  <EmptyState
                    icon={<SearchX size={36} />}
                    title="Aucun commerce trouv\u00e9"
                    description="Essayez une autre cat\u00e9gorie ou filtre."
                  />
                ) : (
                  <>
                    <p className="text-sm text-[var(--color-ink-500)]">{resultats.length} r\u00e9sultat{resultats.length > 1 ? "s" : ""}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {resultats.map((f) => (
                        <StoreCard key={f.id} fournisseur={f} positionClient={position} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}'''

ANCIEN_CALCUL = '''  const discoveryPromos = useMemo(
    () => commercesCategorie.filter((f) => f.a_promo).slice(0, 10),
    [commercesCategorie]
  );
  const discoveryPopulaires = useMemo(
    () =>
      [...commercesCategorie]
        .filter((f) => (f.note_moyenne ?? 0) > 0)
        .sort((a, b) => (b.note_moyenne ?? 0) - (a.note_moyenne ?? 0))
        .slice(0, 10),
    [commercesCategorie]
  );'''

NOUVEAU_CALCUL = '''  const discoveryPromos = useMemo(
    () => commercesCategorie.filter((f) => f.a_promo).slice(0, 10),
    [commercesCategorie]
  );
  const discoveryProximite = useMemo(() => {
    if (!position) return [];
    return [...commercesCategorie]
      .filter((f) => f.latitude != null && f.longitude != null)
      .sort((a, b) => {
        const da = distanceMetres(position, { latitude: a.latitude!, longitude: a.longitude! });
        const db = distanceMetres(position, { latitude: b.latitude!, longitude: b.longitude! });
        return da - db;
      })
      .slice(0, 10);
  }, [commercesCategorie, position]);
  const discoveryTousPartenaires = useMemo(
    () => [...commercesCategorie].sort((a, b) => (b.note_moyenne ?? 0) - (a.note_moyenne ?? 0)).slice(0, 10),
    [commercesCategorie]
  );'''


def main():
    print("Traitement de src/pages/ClientHomePage.tsx...")
    tout_ok = patch(
        "src/pages/ClientHomePage.tsx",
        [
            (
                'import DiscoveryRow from "../components/DiscoveryRow";',
                'import DiscoveryRow from "../components/DiscoveryRow";\nimport DiscoveryRowCompact from "../components/DiscoveryRowCompact";',
                "Import de DiscoveryRowCompact",
            ),
            (ANCIEN_CALCUL, NOUVEAU_CALCUL, "Nouveaux calculs (proximite, tous partenaires)"),
            (ANCIEN_BLOC_JSX, NOUVEAU_BLOC_JSX, "Remplacement des 3 sections de decouverte"),
            (
                'AlertTriangle, SearchX, Search as SearchIcon, LocateFixed, MapPin, Settings, Flame, TrendingUp, Sparkles, ChevronRight',
                'AlertTriangle, SearchX, Search as SearchIcon, LocateFixed, MapPin, Settings, Sparkles, ChevronRight',
                "Retire les imports Flame/TrendingUp devenus inutilises",
            ),
        ],
        "ClientHomePage.tsx",
    )

    print("\n" + ("Sections compactes integrees avec succes !" if tout_ok else "Termine avec au moins un echec -- voir [ECHEC] ci-dessus, a coller a la main."))
    print("Verifie avec : npm run build")


if __name__ == "__main__":
    main()
