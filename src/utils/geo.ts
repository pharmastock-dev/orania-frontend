import { Geolocation } from "@capacitor/geolocation";
import type { Coordonnees } from "../types";

// Formule de Haversine — distance en mètres entre deux points
export function distanceMetres(a: Coordonnees, b: Coordonnees): number {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Utilise le plugin natif Capacitor (pas l'API navigateur brute) — sur
// Android, ça permet au système de proposer nativement "Activer la
// localisation ?" si le GPS est éteint, au lieu d'échouer silencieusement
// en demandant à l'utilisateur d'aller l'activer manuellement dans les
// réglages. Sur le web, le même plugin retombe automatiquement sur l'API
// navigateur standard — comportement inchangé de ce côté.
export async function getPositionActuelle(): Promise<Coordonnees> {
  // 1. Permission — géré séparément pour donner un message clair et distinct
  // d'un échec de récupération GPS (deux causes très différentes).
  try {
    let permission = await Geolocation.checkPermissions();
    console.log("[GEO] Permission actuelle:", JSON.stringify(permission));
    if (permission.location !== "granted" && permission.coarseLocation !== "granted") {
      permission = await Geolocation.requestPermissions();
      console.log("[GEO] Permission après demande:", JSON.stringify(permission));
    }
    if (permission.location !== "granted" && permission.coarseLocation !== "granted") {
      throw new Error("Localisation refusée. Autorisez l'accès à la position dans les réglages de l'application (Paramètres → Applications → QREEB → Autorisations).");
    }
  } catch (err: any) {
    console.error("[GEO] Échec permission:", err?.message || err);
    throw new Error(err?.message || "Impossible de vérifier la permission de localisation.");
  }

  // 2. Récupération GPS — erreur distincte, avec le code technique réel
  // affiché temporairement pour diagnostiquer précisément la cause.
  try {
    const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  } catch (err: any) {
    const code = err?.code ?? "?";
    const messageBrut = err?.message || String(err);
    console.error("[GEO] Échec getCurrentPosition:", code, messageBrut);
    throw new Error(`Position indisponible (${messageBrut}). Vérifiez que le GPS est activé sur votre téléphone, puis réessayez.`);
  }
}

// Estimation du temps de livraison selon la distance : 1,3 min/km (minimum) à
// 2 min/km (maximum). Ex : 1 km → 1–2 min, 3 km → 4–6 min.
export function estimerTempsLivraison(distanceMetres: number): { min: number; max: number } {
  const km = distanceMetres / 1000;
  const min = Math.max(1, Math.round(km * 1.3));
  const max = Math.max(min + 1, Math.round(km * 2));
  return { min, max };
}
