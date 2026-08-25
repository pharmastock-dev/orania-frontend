import { useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { AppProvider, useApp } from "./context/AppContext";
import { ToastProvider, useToast } from "./context/ToastContext";
import RequireClient from "./components/RequireClient";
import { initPushNotifications } from "./utils/notifications";
import { initWebPushNotifications } from "./utils/webPush";
import { getPositionActuelle } from "./utils/geo";
import { enregistrerTokenAcheteur, enregistrerTokenFournisseur, enregistrerTokenLivreur } from "./api";

import HomePage from "./pages/HomePage";
import ContactPage from "./pages/ContactPage";

import ClientLoginPage from "./pages/ClientLoginPage";
import ClientHomePage from "./pages/ClientHomePage";
import StorePage from "./pages/StorePage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderPage from "./pages/OrderPage";
import AccountPage from "./pages/AccountPage";

import FournisseurLoginPage from "./pages/FournisseurLoginPage";
import FournisseurDashboard from "./pages/FournisseurDashboard";

import LivreurLoginPage from "./pages/LivreurLoginPage";
import AssistantPage from "./pages/AssistantPage";
import LivreurDashboard from "./pages/LivreurDashboard";

import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboard from "./pages/AdminDashboard";

import NotFoundPage from "./pages/NotFoundPage";

// Demande les autorisations (notifications + localisation) dès l'ouverture
// de l'app, sur le tout premier écran — pas d'attente d'une connexion
// client/commerçant. La notification ne peut pas encore être rattachée à un
// utilisateur précis à ce stade (on ne sait pas encore qui c'est) : le
// callback onToken ne fait donc rien ici, le vrai enregistrement se refait
// silencieusement à la connexion (voir NotificationsPush ci-dessous) — la
// permission, elle, aura déjà été accordée entre-temps et ne sera pas
// redemandée. Idem pour la position : récupérée tout de suite et gardée en
// mémoire, pour que l'écran d'accueil client n'ait quasiment jamais besoin
// de la redemander lui-même.
function PermissionsAuLancement() {
  const { setPosition } = useApp();
  const dejaLance = useRef(false);

  useEffect(() => {
    if (dejaLance.current) return;
    dejaLance.current = true;

    // IMPORTANT : sur le web, la demande de notification ne peut PAS être
    // automatique (voir ActiverNotifsWeb) — seule la localisation l'est ici.
    async function demanderToutesLesPermissions() {
      if (Capacitor.isNativePlatform()) {
        await initPushNotifications({ onToken: () => {} });
      }
      try {
        const pos = await getPositionActuelle();
        setPosition(pos);
      } catch {
        // pas grave si refusé ici — l'écran client redemandera au besoin
      }
    }
    demanderToutesLesPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

// Câble les notifications push dès qu'un client ou un commerçant est connecté,
// et navigue vers le bon écran quand on tape sur une notification reçue.
// Bascule automatiquement entre le plugin natif Capacitor (app Android/iOS)
// et Firebase Web direct (navigateur/PC) — les deux enregistrent le token
// sur les mêmes routes backend, le serveur ne fait aucune distinction.
function NotificationsPush() {
  const { client, fournisseurConnecte, livreurConnecte } = useApp();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const clientInitialise = useRef<number | null>(null);
  const fournisseurInitialise = useRef<number | null>(null);

  useEffect(() => {
    if (!client) {
      clientInitialise.current = null; // se déconnecter doit permettre une reconnexion propre
      return;
    }
    if (clientInitialise.current === client.id) return;
    clientInitialise.current = client.id;

    const onToken = (token: string) => {
      enregistrerTokenAcheteur(client.id, token).catch(() => {});
    };

    if (Capacitor.isNativePlatform()) {
      initPushNotifications({
        onToken,
        onNotificationTap: (data) => {
          if (data.type === "statut_commande" && data.commande_id) {
            navigate(`/commande/${data.commande_id}`);
          }
        },
      });
    } else {
      initWebPushNotifications({
        onToken,
        onNotificationRecue: (titre, corps) => showToast(`${titre} — ${corps}`, "info"),
      });
    }
  }, [client, navigate, showToast]);

  useEffect(() => {
    if (!fournisseurConnecte) {
      fournisseurInitialise.current = null; // idem côté commerçant
      return;
    }
    if (fournisseurInitialise.current === fournisseurConnecte.id) return;
    fournisseurInitialise.current = fournisseurConnecte.id;

    const onToken = (token: string) => {
      enregistrerTokenFournisseur(fournisseurConnecte.id, token).catch(() => {});
    };

    if (Capacitor.isNativePlatform()) {
      initPushNotifications({
        onToken,
        onNotificationTap: (data) => {
          if (data.type === "nouvelle_commande") {
            navigate("/commercant/dashboard");
          }
        },
      });
    } else {
      initWebPushNotifications({
        onToken,
        onNotificationRecue: (titre, corps) => showToast(`${titre} — ${corps}`, "info"),
      });
    }
  }, [fournisseurConnecte, navigate, showToast]);

  const livreurInitialise = useRef<number | null>(null);

  useEffect(() => {
    if (!livreurConnecte) {
      livreurInitialise.current = null;
      return;
    }
    if (livreurInitialise.current === livreurConnecte.id) return;
    livreurInitialise.current = livreurConnecte.id;

    const onToken = (token: string) => {
      enregistrerTokenLivreur(livreurConnecte.id, token).catch(() => {});
    };

    if (Capacitor.isNativePlatform()) {
      initPushNotifications({
        onToken,
        onNotificationTap: (data) => {
          if (data.type === "commande_disponible") {
            navigate("/livreur/dashboard");
          }
        },
      });
    } else {
      initWebPushNotifications({
        onToken,
        onNotificationRecue: (titre, corps) => showToast(`${titre} — ${corps}`, "info"),
      });
    }
  }, [livreurConnecte, navigate, showToast]);

  return null;
}

function AppRoutes() {
  return (
    <>
      <PermissionsAuLancement />
      <NotificationsPush />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/contact" element={<ContactPage />} />

        <Route path="/client" element={<ClientLoginPage />} />
        <Route path="/client/accueil" element={<RequireClient><ClientHomePage /></RequireClient>} />
        <Route path="/commerce/:id" element={<StorePage />} />
        <Route path="/panier" element={<RequireClient><CartPage /></RequireClient>} />
        <Route path="/commander" element={<RequireClient><CheckoutPage /></RequireClient>} />
        <Route path="/commande/:id" element={<RequireClient><OrderPage /></RequireClient>} />
        <Route path="/compte" element={<RequireClient><AccountPage /></RequireClient>} />

        <Route path="/commercant" element={<FournisseurLoginPage />} />
        <Route path="/commercant/dashboard" element={<FournisseurDashboard />} />

        <Route path="/client/assistant" element={<AssistantPage />} />
        <Route path="/livreur" element={<LivreurLoginPage />} />
        <Route path="/livreur/dashboard" element={<LivreurDashboard />} />

        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AppProvider>
  );
}
