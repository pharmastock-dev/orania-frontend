"""
Corrige le nom de l'app dans capacitor.config.json (appName) --
actuellement encore "Orania", cause l'affichage de l'ancien nom dans
les popups systeme iOS (notifications, etc.) et sous l'icone.
A lancer UNE SEULE FOIS depuis le dossier orania-frontend.

Usage :
    python corriger_nom_app.py
"""
import json
import re

def main():
    print("Traitement de capacitor.config.json...")
    try:
        with open("capacitor.config.json", "r", encoding="utf-8") as f:
            contenu_brut = f.read()
    except FileNotFoundError:
        print("  [ECHEC] capacitor.config.json introuvable dans ce dossier.")
        return

    if '"appName": "QREEB"' in contenu_brut or "'appName': 'QREEB'" in contenu_brut:
        print("  [DEJA FAIT] appName est deja QREEB.")
        return

    config = json.loads(contenu_brut)
    ancien = config.get("appName", "(absent)")
    config["appName"] = "QREEB"

    with open("capacitor.config.json", "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"  [OK] appName : '{ancien}' -> 'QREEB'")
    print("\nVerifie avec : cat capacitor.config.json")


if __name__ == "__main__":
    main()
