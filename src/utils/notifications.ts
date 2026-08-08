// ============================================================
// Notifications push (Firebase Cloud Messaging via Capacitor).
// Ne fonctionne QUE dans l'app native (Android/iOS) — ignoré
// silencieusement sur le web, où il n'y a pas d'équivalent Capacitor.
// ============================================================
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import type { PluginListenerHandle } from "@capacitor/core";

let ecouteursActifs: PluginListenerHandle[] = [];

interface InitPushOptions {
  onToken: (token: string) => void;
  onNotificationTap?: (data: Record<string, string>) => void;
  onDebug?: (message: string) => void;
}

/**
 * Demande la permission de notifications, enregistre l'appareil auprès de
 * Firebase, et branche les écouteurs. À appeler une fois que l'utilisateur
 * (client ou commerçant) est connecté et qu'on connaît son id.
 */
export async function initPushNotifications({ onToken, onNotificationTap, onDebug }: InitPushOptions) {
  const log = (msg: string) => {
    console.log("[NOTIF] " + msg);
    onDebug?.(msg);
  };

  if (!Capacitor.isNativePlatform()) {
    log("Plateforme web — notifications natives désactivées.");
    return;
  }

  try {
    let permission = await PushNotifications.checkPermissions();
    log("Permission actuelle : " + permission.receive);
    if (permission.receive !== "granted") {
      permission = await PushNotifications.requestPermissions();
      log("Permission après demande : " + permission.receive);
    }
    if (permission.receive !== "granted") {
      log("Permission refusée — arrêt.");
      return;
    }

    // Sur Android 8+, chaque notification doit appartenir à un "canal" qui
    // définit son comportement (son, vibration, importance). Sans ça, la
    // notification arrive silencieuse même si le serveur demande un son.
    if (Capacitor.getPlatform() === "android") {
      try {
        await PushNotifications.createChannel({
          id: "orania_commandes",
          name: "Commandes",
          description: "Nouvelles commandes et changements de statut",
          importance: 5, // IMPORTANCE_HIGH — nécessaire pour le son + l'affichage prioritaire
          visibility: 1,
          vibration: true,
        });
        log("Canal 'orania_commandes' créé ✓");
      } catch (err) {
        log("Échec création du canal : " + String(err));
      }
    }

    await nettoyerEcouteurs();

    const l1 = await PushNotifications.addListener("registration", (token) => {
      log("Token FCM reçu (" + token.value.length + " caractères)");
      onToken(token.value);
    });
    const l2 = await PushNotifications.addListener("registrationError", (err) => {
      log("Erreur enregistrement : " + JSON.stringify(err));
    });
    const l3 = await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      onNotificationTap?.((action.notification.data || {}) as Record<string, string>);
    });
    ecouteursActifs = [l1, l2, l3];

    log("Appel de register()...");
    await PushNotifications.register();
    log("register() terminé, en attente du token...");
  } catch (err) {
    log("ÉCHEC GLOBAL : " + String(err));
  }
}

async function nettoyerEcouteurs() {
  for (const l of ecouteursActifs) {
    try {
      await l.remove();
    } catch {
      // rien à faire
    }
  }
  ecouteursActifs = [];
}

export function estAppNative() {
  return Capacitor.isNativePlatform();
}

/**
 * Vérifie l'état actuel de la permission notifications, sans en redemander
 * une. Utile pour afficher un avertissement dans l'interface si elle a été
 * coupée après coup par l'utilisateur ou par le système (Android "Supprimer
 * les autorisations si l'app est inutilisée" — plus agressif sur Samsung).
 */
export async function verifierEtatNotifications(): Promise<"native-absent" | "granted" | "denied" | "prompt"> {
  if (!Capacitor.isNativePlatform()) return "native-absent";
  try {
    const permission = await PushNotifications.checkPermissions();
    return permission.receive as "granted" | "denied" | "prompt";
  } catch {
    return "denied";
  }
}
