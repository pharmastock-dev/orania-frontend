"""
QREEB Assistant - ajoute la banniere d'acces sur l'accueil client, juste
sous la barre de filtres.
A lancer UNE SEULE FOIS depuis le dossier orania-frontend.

Usage :
    python ajouter_banniere_assistant.py
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
            print(f"  [ECHEC] {description} — texte attendu introuvable, a coller a la main.")
            continue
        contenu = contenu.replace(ancien, nouveau, 1)
        print(f"  [OK] {description}")
        total_ok += 1
    with open(chemin, "w", encoding="utf-8") as f:
        f.write(contenu)
    return total_ok == len(remplacements)


def main():
    print("Traitement de src/pages/ClientHomePage.tsx...")

    with open("src/pages/ClientHomePage.tsx", "r", encoding="utf-8") as f:
        contenu_verif = f.read()
    navigate_deja_present = "useNavigate" in contenu_verif

    remplacements = []
    if navigate_deja_present:
        print("  [INFO] useNavigate deja present dans ce fichier — pas de doublon ajoute.")
    else:
        remplacements += [
            (
                'import { useEffect, useMemo, useState } from "react";',
                'import { useEffect, useMemo, useState } from "react";\nimport { useNavigate } from "react-router-dom";',
                "Import de useNavigate",
            ),
            (
                'export default function ClientHomePage() {',
                'export default function ClientHomePage() {\n  const navigate = useNavigate();',
                "Ajout de navigate dans le composant",
            ),
        ]

    remplacements += [
        (
            'import { AlertTriangle, SearchX, Search as SearchIcon, LocateFixed, MapPin, Settings, Flame, TrendingUp } from "lucide-react";',
            'import { AlertTriangle, SearchX, Search as SearchIcon, LocateFixed, MapPin, Settings, Flame, TrendingUp, Sparkles, ChevronRight } from "lucide-react";',
            "Import des icônes Sparkles et ChevronRight",
        ),
        (
            '          <FilterBar tri={tri} onTriChange={setTri} filtresActifs={filtresActifs} onToggleFiltre={toggleFiltre} />\n        </div>',
            '''          <FilterBar tri={tri} onTriChange={setTri} filtresActifs={filtresActifs} onToggleFiltre={toggleFiltre} />
        </div>

        {/* QREEB Assistant — bannière d'accès, juste sous les filtres pour
            capter l'attention avant que le client ne commence à parcourir
            manuellement. */}
        <button
          onClick={() => navigate("/client/assistant")}
          className="flex items-center gap-3 bg-gradient-to-r from-[var(--color-navy-900)] to-[#1e2740] rounded-2xl px-4 py-3.5 text-left"
        >
          <span className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <Sparkles size={18} className="text-[var(--color-orange-400)]" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-[15px]">Pas d'idée ? Laissez-moi choisir pour vous</p>
            <p className="text-white/60 text-xs">Budget, envie, distance — 5 questions, 3 suggestions</p>
          </div>
          <ChevronRight size={18} className="text-white/60 shrink-0" />
        </button>''',
            "Ajout de la bannière QREEB Assistant",
        ),
    ]

    tout_ok = patch("src/pages/ClientHomePage.tsx", remplacements, "ClientHomePage.tsx")

    print("\n" + ("Banniere QREEB Assistant ajoutee avec succes !" if tout_ok else "Termine avec au moins un echec — voir [ECHEC] ci-dessus."))
    if navigate_deja_present:
        print("ATTENTION : verifie que la variable s'appelle bien 'navigate' dans ton fichier — si elle a un autre nom, le bouton ne fonctionnera pas et il faudra l'ajuster a la main.")
    print("Verifie maintenant avec : npm run build")


if __name__ == "__main__":
    main()
