// ============================================================
// QREEB — Client HTTP centralisé
// Toutes les requêtes vers le backend FastAPI passent par ici.
// Objectif : ne jamais faire planter l'app si l'API est down.
// ============================================================

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// auth accepte :
//   - false / undefined  → aucun jeton envoyé
//   - true                → jeton ADMIN (comportement historique, inchangé,
//                            aucun appel existant à modifier)
//   - "fournisseur" / "client" / "livreur" → jeton du type correspondant
type TypeAuth = boolean | "fournisseur" | "client" | "livreur";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  isFormData?: boolean;
  auth?: TypeAuth;
}

const CLE_TOKEN_ADMIN = "orania_admin_token";
const CLE_TOKEN_FOURNISSEUR = "qreeb_token_fournisseur";
const CLE_TOKEN_CLIENT = "qreeb_token_client";
const CLE_TOKEN_LIVREUR = "qreeb_token_livreur";

function cleTokenPour(auth: TypeAuth): string | null {
  if (auth === true) return CLE_TOKEN_ADMIN;
  if (auth === "fournisseur") return CLE_TOKEN_FOURNISSEUR;
  if (auth === "client") return CLE_TOKEN_CLIENT;
  if (auth === "livreur") return CLE_TOKEN_LIVREUR;
  return null;
}

// L'admin utilise une session courte (12h, sessionStorage — effacée à la
// fermeture de l'onglet/app). Client/fournisseur/livreur doivent au
// contraire rester connectés durablement d'une ouverture d'app à l'autre
// (30 jours, comme configuré côté backend) — d'où localStorage pour ces
// trois-là, jamais sessionStorage qui les déconnecterait à chaque relance.
function stockagePour(auth: TypeAuth): Storage {
  return auth === true ? sessionStorage : localStorage;
}

// Le backend gratuit (Render) peut mettre jusqu'à 30-60s à se réveiller s'il
// était inactif. Plutôt que d'afficher une erreur au premier échec, on
// réessaie automatiquement avec un délai croissant avant d'abandonner.
const TENTATIVES = [
  { timeout: 10000, attente: 0 },
  { timeout: 20000, attente: 2000 },
  { timeout: 30000, attente: 3000 },
];

function attendre(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAvecReessai(url: string, init: RequestInit): Promise<Response> {
  let derniereErreur: unknown;
  for (let i = 0; i < TENTATIVES.length; i++) {
    const { timeout, attente } = TENTATIVES[i];
    if (attente) await attendre(attente);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);
      return response;
    } catch (err) {
      clearTimeout(timer);
      derniereErreur = err;
      // On ne réessaie que sur un échec réseau/timeout, pas indéfiniment.
    }
  }
  throw derniereErreur;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, isFormData = false, auth = false } = options;

  const headers: Record<string, string> = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (auth) {
    const cle = cleTokenPour(auth);
    const token = cle ? stockagePour(auth).getItem(cle) : null;
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetchAvecReessai(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new ApiError("Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.", 0);
  }

  if (!response.ok) {
    let message = "Une erreur est survenue.";
    try {
      const data = await response.json();
      if (Array.isArray(data?.detail)) {
        // Format standard des erreurs de validation FastAPI (422) :
        // { detail: [{ loc: ["body", "prix"], msg: "...", type: "..." }, ...] }
        message = data.detail
          .map((e: { loc?: (string | number)[]; msg?: string }) => {
            const champ = Array.isArray(e?.loc) ? e.loc[e.loc.length - 1] : null;
            return champ ? `${champ} : ${e.msg}` : e?.msg;
          })
          .filter(Boolean)
          .join(" — ") || message;
      } else if (typeof data?.detail === "string") {
        message = data.detail;
      } else if (typeof data?.message === "string") {
        message = data.message;
      }
    } catch {
      // pas de corps JSON exploitable
    }
    throw new ApiError(message, response.status);
  }

  // Certaines routes (ex: DELETE) peuvent ne rien renvoyer
  const text = await response.text();
  if (!text) return undefined as unknown as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined as unknown as T;
  }
}

export const http = {
  get: <T>(path: string, auth: TypeAuth = false) => request<T>(path, { method: "GET", auth }),
  post: <T>(path: string, body?: unknown, auth: TypeAuth = false) => request<T>(path, { method: "POST", body, auth }),
  postForm: <T>(path: string, formData: FormData, auth: TypeAuth = false) => request<T>(path, { method: "POST", body: formData, isFormData: true, auth }),
  put: <T>(path: string, body?: unknown, auth: TypeAuth = false) => request<T>(path, { method: "PUT", body, auth }),
  del: <T>(path: string, auth: TypeAuth = false) => request<T>(path, { method: "DELETE", auth }),
};

// Petites aides pour stocker/effacer le jeton de chaque type de compte —
// utilisées dans les pages de connexion et de déconnexion respectives.
// localStorage (pas sessionStorage) pour rester connecté d'une ouverture
// d'app à l'autre, cohérent avec le reste de l'app (Client/Fournisseur/
// LivreurMarketplace déjà persistés en localStorage via AppContext).
export function stockerToken(type: "fournisseur" | "client" | "livreur", token: string) {
  const cle = type === "fournisseur" ? CLE_TOKEN_FOURNISSEUR : type === "client" ? CLE_TOKEN_CLIENT : CLE_TOKEN_LIVREUR;
  localStorage.setItem(cle, token);
}
export function effacerToken(type: "fournisseur" | "client" | "livreur") {
  const cle = type === "fournisseur" ? CLE_TOKEN_FOURNISSEUR : type === "client" ? CLE_TOKEN_CLIENT : CLE_TOKEN_LIVREUR;
  localStorage.removeItem(cle);
}

export { BASE_URL, CLE_TOKEN_ADMIN, CLE_TOKEN_FOURNISSEUR, CLE_TOKEN_CLIENT, CLE_TOKEN_LIVREUR };
