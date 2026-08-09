export function formatPrix(prix: number): string {
  return `${Math.round(prix).toLocaleString("fr-FR")} DA`;
}

export function formatDistance(metres?: number): string {
  if (metres == null) return "";
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1).replace(".0", "")} km`;
}

// Certaines heures arrivent au format "08:00:00" (avec secondes) — jamais
// utile à afficher, on les retire systématiquement pour rester "08:00".
function sansSecondes(heure: string): string {
  const parties = heure.split(":");
  return parties.length >= 2 ? `${parties[0]}:${parties[1]}` : heure;
}

export function formatHoraires(ouverture?: string | null, fermeture?: string | null): string {
  if (!ouverture || !fermeture) return "";
  return `${sansSecondes(ouverture)} – ${sansSecondes(fermeture)}`;
}

export function estOuvertMaintenant(ouverture?: string | null, fermeture?: string | null): boolean {
  if (!ouverture || !fermeture) return true;
  const now = new Date();
  const [oh, om] = ouverture.split(":").map(Number);
  const [fh, fm] = fermeture.split(":").map(Number);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const openMin = oh * 60 + om;
  const closeMin = fh * 60 + fm;
  if (closeMin <= openMin) {
    // horaire traversant minuit
    return nowMin >= openMin || nowMin < closeMin;
  }
  return nowMin >= openMin && nowMin < closeMin;
}

// N'autorise que les chiffres (et un + optionnel en tête) dans les champs téléphone
export function nettoyerTelephone(valeur: string): string {
  const garderPlus = valeur.startsWith("+");
  const chiffres = valeur.replace(/[^\d]/g, "");
  return garderPlus ? `+${chiffres}` : chiffres;
}
