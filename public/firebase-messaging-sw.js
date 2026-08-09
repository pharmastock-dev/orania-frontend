// Service worker Firebase — gère les notifications reçues quand l'onglet
// Orania n'est PAS actif au premier plan. Doit rester à la racine du site
// (accessible sur /firebase-messaging-sw.js), Firebase l'exige ainsi.
//
// ⚠️ À COMPLÉTER : copie ici exactement le même firebaseConfig que dans
// src/utils/webPush.ts — ce fichier ne peut pas importer l'autre (contrainte
// technique des service workers), donc les deux doivent être tenus à jour
// en même temps si les valeurs changent un jour.

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "À_COMPLÉTER",
  authDomain: "orania-30cd2.firebaseapp.com",
  projectId: "orania-30cd2",
  storageBucket: "À_COMPLÉTER",
  messagingSenderId: "À_COMPLÉTER",
  appId: "À_COMPLÉTER",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const titre = payload.notification?.title || "Orania";
  const options = {
    body: payload.notification?.body || "",
    icon: "/logo-orania.png",
  };
  self.registration.showNotification(titre, options);
});
