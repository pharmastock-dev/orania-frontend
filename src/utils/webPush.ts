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
  apiKey: "AIzaSyBqP9lSaex8S5N6DPaao3D7Sgp6towFEyk",
  authDomain: "orania-30cd2.firebaseapp.com",
  projectId: "orania-30cd2",
  storageBucket: "orania-30cd2.firebasestorage.app",
  messagingSenderId: "334946245403",
  appId: "1:334946245403:web:d67e4abe35bbd12386d1be",
};

const VAPID_KEY = "BKAcBwdEG1sSjO0bLVEyAJozc1Kgk37TKODaRe5hE3QUDEz210K2JOGVGqDPOVI9bW0MJP_kFNCOVYSbnoryDmA";

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

interface InitWebPushOptions {
  onToken: (token: string) => void;
  onNotificationRecue?: (titre: string, corps: string) => void;
}

/**
 * Demande la permission de notifications navigateur, récupère le token FCM
 * web, et écoute les messages reçus quand l'onglet est actif (premier plan).
 */
export async function initWebPushNotifications({ onToken, onNotificationRecue }: InitWebPushOptions) {
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

      // Sans ça, un message reçu onglet actif ne déclenchait qu'un petit
      // toast interne — jamais une vraie notification système, donc jamais
      // de son, peu importe les réglages Windows/Chrome de l'utilisateur.
      // On déclenche donc ici une vraie Notification navigateur nous-mêmes,
      // pour un comportement identique que l'onglet soit actif ou non. Le
      // toast interne ne sert plus alors que de repli si ça échoue.
      if (Notification.permission === "granted") {
        try {
          new Notification(titre, { body: corps, icon: "/logo-orania.png" });
          return;
        } catch (err) {
          console.error("[WEB-PUSH] Échec affichage notification premier plan:", err);
        }
      }
      onNotificationRecue?.(titre, corps);
    });
  } catch (err) {
    console.error("[WEB-PUSH] Échec initialisation:", err);
  }
}
