"""
Vague 2 (frontend, groupe fournisseur) - ajoute le jeton sur 4 appels.
Note : getFournisseurInfos (GET) reste volontairement PUBLIC, pas touche ici.
A lancer UNE SEULE FOIS depuis le dossier orania-frontend.

Usage :
    python vague2_frontend_fournisseur.py
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
                'return http.put<{ succes: boolean; message?: string }>(`/fournisseurs/${fournisseurId}/infos`, payload);',
                'return http.put<{ succes: boolean; message?: string }>(`/fournisseurs/${fournisseurId}/infos`, payload, "fournisseur");',
                "PUT infos (modifierInfosFournisseur)",
            ),
            (
                'return http.postForm<{ succes: boolean; image_url?: string; message?: string }>(`/fournisseurs/${fournisseurId}/image`, formData);',
                'return http.postForm<{ succes: boolean; image_url?: string; message?: string }>(`/fournisseurs/${fournisseurId}/image`, formData, "fournisseur");',
                "POST image",
            ),
            (
                'http.get<Statistiques>(`/fournisseurs/${fournisseurId}/statistiques?periode=${periode}`);',
                'http.get<Statistiques>(`/fournisseurs/${fournisseurId}/statistiques?periode=${periode}`, "fournisseur");',
                "GET statistiques",
            ),
            (
                'http.post<{ succes: boolean }>(`/fournisseurs/${fournisseurId}/device-token`, { device_token: deviceToken });',
                'http.post<{ succes: boolean }>(`/fournisseurs/${fournisseurId}/device-token`, { device_token: deviceToken }, "fournisseur");',
                "POST device-token",
            ),
        ],
        "api/index.ts",
    )

    print("\n" + ("Groupe fournisseur applique avec succes !" if tout_ok else "Termine avec au moins un echec — voir [ECHEC] ci-dessus."))
    print("Verifie maintenant avec : npm run build")


if __name__ == "__main__":
    main()
