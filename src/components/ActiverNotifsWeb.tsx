import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { initWebPushNotifications } from "../utils/webPush";
import Button from "./Button";

interface ActiverNotifsWebProps {
  onToken: (token: string) => void;
}

/**
 * Bannière visible UNIQUEMENT sur le web (PC/navigateur) — les navigateurs
 * modernes bloquent silencieusement la popup de permission notification si
 * elle n'est pas déclenchée par un vrai clic utilisateur (contrairement à
 * la localisation, plus permissive sur ce point). D'où ce bouton explicite,
 * qu'on ne peut pas remplacer par une demande automatique au chargement.
 */
export default function ActiverNotifsWeb({ onToken }: ActiverNotifsWebProps) {
  const [visible, setVisible] = useState(false);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return; // uniquement pour le web
    if (!("Notification" in window)) return;
    setVisible(Notification.permission === "default");
  }, []);

  if (!visible) return null;

  async function activer() {
    setChargement(true);
    await initWebPushNotifications({ onToken });
    setVisible(false);
    setChargement(false);
  }

  return (
    <div className="flex items-center gap-3 bg-[var(--color-navy-900)] text-white rounded-2xl px-4 py-3 mb-4">
      <span className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
        <Bell size={16} />
      </span>
      <p className="flex-1 text-sm">Activez les notifications pour suivre vos commandes en temps réel.</p>
      <Button size="sm" loading={chargement} onClick={activer}>
        Activer
      </Button>
      <button onClick={() => setVisible(false)} className="text-white/50 hover:text-white shrink-0" aria-label="Fermer">
        <X size={16} />
      </button>
    </div>
  );
}
