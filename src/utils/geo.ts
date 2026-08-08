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

export function getPositionActuelle(): Promise<Coordonnees> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("La géolocalisation n'est pas disponible sur cet appareil."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => reject(new Error("Localisation refusée ou indisponible.")),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

// Estimation du temps de livraison selon la distance : 1,3 min/km (minimum) à
// 2 min/km (maximum). Ex : 1 km → 1–2 min, 3 km → 4–6 min.
export function estimerTempsLivraison(distanceMetres: number): { min: number; max: number } {
  const km = distanceMetres / 1000;
  const min = Math.max(1, Math.round(km * 1.3));
  const max = Math.max(min + 1, Math.round(km * 2));
  return { min, max };
}
