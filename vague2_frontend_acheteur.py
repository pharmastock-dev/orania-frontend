"""
Vague 2 (frontend, groupe acheteur - dernier groupe) - ajoute le jeton
sur les 3 derniers appels.
A lancer UNE SEULE FOIS depuis le dossier orania-frontend.

Usage :
    python vague2_frontend_acheteur.py
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
    print("Traitement de src/api/index.ts...")
    tout_ok = patch(
        "src/api/index.ts",
        [
            (
                'const r = await http.get<{ existe: boolean; id?: number; note?: number; commentaire?: string }>(`/fournisseurs/${fournisseurId}/mon-avis/${acheteurId}`);',
                'const r = await http.get<{ existe: boolean; id?: number; note?: number; commentaire?: string }>(`/fournisseurs/${fournisseurId}/mon-avis/${acheteurId}`, "client");',
                "GET mon-avis (getMonAvis)",
            ),
            (
                'const liste = await http.get<any[]>(`/acheteurs/${acheteurId}/evaluations`);',
                'const liste = await http.get<any[]>(`/acheteurs/${acheteurId}/evaluations`, "client");',
                "GET evaluations (getAvisAcheteur)",
            ),
            (
                'http.post<{ succes: boolean }>(`/acheteurs/${acheteurId}/device-token`, { device_token: deviceToken });',
                'http.post<{ succes: boolean }>(`/acheteurs/${acheteurId}/device-token`, { device_token: deviceToken }, "client");',
                "POST device-token (enregistrerTokenAcheteur)",
            ),
        ],
        "api/index.ts",
    )

    print("\n" + ("Groupe acheteur applique avec succes ! VAGUE 2 TERMINEE." if tout_ok else "Termine avec au moins un echec — voir [ECHEC] ci-dessus."))
    print("Verifie maintenant avec : npm run build")


if __name__ == "__main__":
    main()
