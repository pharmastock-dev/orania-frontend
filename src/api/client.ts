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

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  isFormData?: boolean;
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
  const { method = "GET", body, isFormData = false } = options;

  let response: Response;
  try {
    response = await fetchAvecReessai(`${BASE_URL}${path}`, {
      method,
      headers: isFormData ? undefined : { "Content-Type": "application/json" },
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
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  postForm: <T>(path: string, formData: FormData) => request<T>(path, { method: "POST", body: formData, isFormData: true }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export { BASE_URL };
