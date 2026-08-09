// ============================================================
// Notifications push pour la VERSION WEB (navigateur/PC) — utilise Firebase
// directement (SDK web), contrairement à l'app mobile qui passe par
// Capacitor. Les deux enregistrent leur token sur les MÊMES routes backend
// (device-token), le backend n'a besoin d'aucune distinction entre les deux.
//
// ⚠️ À COMPLÉTER avant utilisation : remplace FIREBASE_CONFIG et VAPID_KEY
// ci-dessous par tes vraies valeurs récupérées dans la console Firebase
// (Paramètres du projet → Général pour la config, → Cloud Messaging pour la
// clé VAPID). Le même FIREBASE_CONFIG doit aussi être collé dans
// public/firebase-messaging-sw.js (le service worker ne peut pas importer
// ce fichier directement).
// ============================================================
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging";

const FIREBASE_CONFIG = {
  apiKey: "À_COMPLÉTER",
  authDomain: "orania-30cd2.firebaseapp.com",
  projectId: "orania-30cd2",
  storageBucket: "À_COMPLÉTER",
  messagingSenderId: "À_COMPLÉTER",
  appId: "À_COMPLÉTER",
};

const VAPID_KEY = "À_COMPLÉTER";

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

function estConfigure() {
  return FIREBASE_CONFIG.apiKey !== "À_COMPLÉTER" && VAPID_KEY !== "À_COMPLÉTER";
}

interface InitWebPushOptions {
  onToken: (token: string) => void;
  onNotificationRecue?: (titre: string, corps: string) => void;
}

/**
 * Demande la permission de notifications navigateur, récupère le token FCM
 * web, et écoute les messages reçus quand l'onglet est actif (premier plan).
 * Ne fait rien si Firebase Web n'est pas encore configuré (valeurs par
 * défaut "À_COMPLÉTER" toujours en place) — évite un plantage silencieux
 * tant que la configuration n'a pas été renseignée.
 */
export async function initWebPushNotifications({ onToken, onNotificationRecue }: InitWebPushOptions) {
  if (!estConfigure()) {
    console.warn("[WEB-PUSH] Firebase Web non configuré — voir src/utils/webPush.ts");
    return;
  }
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    console.warn("[WEB-PUSH] Notifications non supportées par ce navigateur.");
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    console.log("[WEB-PUSH] Permission:", permission);
    if (permission !== "granted") return;

    if (!app) app = initializeApp(FIREBASE_CONFIG);
    if (!messaging) messaging = getMessaging(app);

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });

    if (token) {
      console.log("[WEB-PUSH] Token reçu (" + token.length + " caractères)");
      onToken(token);
    }

    onMessage(messaging, (payload) => {
      const titre = payload.notification?.title || "Orania";
      const corps = payload.notification?.body || "";
      onNotificationRecue?.(titre, corps);
    });
  } catch (err) {
    console.error("[WEB-PUSH] Échec initialisation:", err);
  }
}

export function estWebPushConfigure() {
  return estConfigure();
}
