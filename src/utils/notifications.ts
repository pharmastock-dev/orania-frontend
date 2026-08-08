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
}

/**
 * Demande la permission de notifications, enregistre l'appareil auprès de
 * Firebase, et branche les écouteurs. À appeler une fois que l'utilisateur
 * (client ou commerçant) est connecté et qu'on connaît son id.
 */
export async function initPushNotifications({ onToken, onNotificationTap }: InitPushOptions) {
  if (!Capacitor.isNativePlatform()) return; // pas de notifications natives sur le web

  try {
    let permission = await PushNotifications.checkPermissions();
    if (permission.receive !== "granted") {
      permission = await PushNotifications.requestPermissions();
    }
    if (permission.receive !== "granted") return; // l'utilisateur a refusé

    await nettoyerEcouteurs();

    const l1 = await PushNotifications.addListener("registration", (token) => {
      onToken(token.value);
    });
    const l2 = await PushNotifications.addListener("registrationError", (err) => {
      console.error("Erreur enregistrement notifications push:", err);
    });
    const l3 = await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      onNotificationTap?.((action.notification.data || {}) as Record<string, string>);
    });
    ecouteursActifs = [l1, l2, l3];

    await PushNotifications.register();
  } catch (err) {
    console.error("initPushNotifications a échoué:", err);
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
