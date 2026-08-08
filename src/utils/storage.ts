// Petites aides de persistance locale (client, fournisseur, panier)
export function readStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // stockage indisponible (mode privé, quota...) — on ignore silencieusement
  }
}

export function clearStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export const STORAGE_KEYS = {
  client: "qreeb_client",
  fournisseur: "qreeb_fournisseur",
  cart: "qreeb_cart",
  position: "qreeb_position",
} as const;
