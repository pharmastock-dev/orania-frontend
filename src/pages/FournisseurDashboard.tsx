import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { Package, Bike, BarChart3, Store, RefreshCw, LogOut, ClipboardList, Flag, BellOff, X } from "lucide-react";
import DashboardHeader from "../components/DashboardHeader";
import ReclamationModal from "../components/ReclamationModal";
import ActiverNotifsWeb from "../components/ActiverNotifsWeb";
import { useApp } from "../context/AppContext";
import { verifierEtatNotifications } from "../utils/notifications";
import { enregistrerTokenFournisseur } from "../api";
import ProduitsTab from "../components/fournisseur/ProduitsTab";
import CommandesTab from "../components/fournisseur/CommandesTab";
import StatsTab from "../components/fournisseur/StatsTab";
import MonCommerceTab from "../components/fournisseur/MonCommerceTab";
import LivreursTab from "../components/fournisseur/LivreursTab";

type Onglet = "produits" | "commandes" | "livreurs" | "stats" | "commerce";

const TABS: { key: Onglet; label: string; icon: typeof Package; couleur: string; fond: string }[] = [
  { key: "produits", label: "Produits", icon: Package, couleur: "text-[var(--color-orange-600)]", fond: "bg-[var(--color-orange-100)]" },
  { key: "commandes", label: "Commandes", icon: ClipboardList, couleur: "text-[var(--color-green-600)]", fond: "bg-[var(--color-green-100)]" },
  { key: "livreurs", label: "Livreurs", icon: Bike, couleur: "text-[var(--color-pink-600)]", fond: "bg-[var(--color-pink-100)]" },
  { key: "stats", label: "Stats", icon: BarChart3, couleur: "text-[var(--color-navy-700)]", fond: "bg-[var(--color-ink-100)]" },
  { key: "commerce", label: "Mon commerce", icon: Store, couleur: "text-[var(--color-orange-600)]", fond: "bg-[var(--color-orange-100)]" },
];

export default function FournisseurDashboard() {
  const navigate = useNavigate();
  const { fournisseurConnecte, setFournisseurConnecte } = useApp();
  const [onglet, setOnglet] = useState<Onglet>("produits");
  const [refreshKey, setRefreshKey] = useState(0);
  const [reclamationOuverte, setReclamationOuverte] = useState(false);
  const [notifsProblematiques, setNotifsProblematiques] = useState(false);
  const [avertissementFerme, setAvertissementFerme] = useState(false);

  useEffect(() => {
    if (!fournisseurConnecte) navigate("/commercant");
  }, [fournisseurConnecte, navigate]);

  // Revérifié aussi à chaque retour sur l'app (pas juste au premier montage) —
  // sinon désactiver les notifications pendant que l'app est en arrière-plan
  // laisse l'avertissement obsolète (absent ou présent à tort) indéfiniment.
  // Même principe que la vérification de position dans ClientHomePage.tsx.
  useEffect(() => {
    let annule = false;

    function verifier() {
      verifierEtatNotifications().then((etat) => {
        if (!annule) setNotifsProblematiques(etat === "denied");
      });
    }

    verifier();

    let listenerNatif: { remove: () => void } | undefined;
    if (Capacitor.isNativePlatform()) {
      import("@capacitor/app").then(({ App }) => {
        App.addListener("resume", verifier).then((h) => {
          listenerNatif = h;
        });
      });
    }

    function surVisibilite() {
      if (document.visibilityState === "visible") verifier();
    }
    document.addEventListener("visibilitychange", surVisibilite);

    return () => {
      annule = true;
      listenerNatif?.remove();
      document.removeEventListener("visibilitychange", surVisibilite);
    };
  }, []);

  if (!fournisseurConnecte) return null;

  function handleLogout() {
    setFournisseurConnecte(null);
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-[var(--color-ink-50)] pb-10">
      <div className="max-w-3xl mx-auto px-4 pt-5">
        <DashboardHeader
          title={fournisseurConnecte.nom}
          subtitle="Espace commerçant"
          actions={
            <>
              <button
                onClick={() => setReclamationOuverte(true)}
                className="flex items-center justify-center h-10 w-10 text-[var(--color-ink-700)] bg-white border border-[var(--color-ink-100)] rounded-xl"
                title="Signaler un problème"
              >
                <Flag size={16} />
              </button>
              <button
                onClick={() => setRefreshKey((k) => k + 1)}
                className="flex items-center justify-center h-10 w-10 text-[var(--color-navy-900)] bg-white border border-[var(--color-ink-100)] rounded-xl"
                title="Actualiser"
              >
                <RefreshCw size={16} />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center h-10 w-10 text-red-500 bg-white border border-[var(--color-ink-100)] rounded-xl"
                title="Se déconnecter"
              >
                <LogOut size={16} />
              </button>
            </>
          }
        />

        {fournisseurConnecte && (
          <ActiverNotifsWeb onToken={(token) => enregistrerTokenFournisseur(fournisseurConnecte.id, token).catch(() => {})} />
        )}

        {notifsProblematiques && !avertissementFerme && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-2xl p-4 relative">
            <button
              onClick={() => setAvertissementFerme(true)}
              className="absolute top-3 right-3 text-red-400 hover:text-red-600"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>
            <div className="flex items-start gap-2.5 pr-6">
              <BellOff size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-700 text-sm">Notifications désactivées sur ce téléphone</p>
                <p className="text-red-700 text-sm mt-1">
                  Vous ne recevrez pas d'alerte pour les nouvelles commandes. Pour réactiver :
                </p>
                <ol className="text-red-700 text-sm mt-2 list-decimal list-inside space-y-0.5">
                  <li>Paramètres du téléphone → Applications → QREEB</li>
                  <li>Notifications → activez l'autorisation</li>
                  <li>Vérifiez aussi Batterie → "Non restreint" (surtout sur Samsung)</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2.5 overflow-x-auto scroll-row mt-5 pb-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const actif = onglet === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setOnglet(t.key)}
                className={`shrink-0 flex items-center gap-2 pl-2 pr-4 py-2 rounded-2xl text-sm font-semibold border transition-colors ${
                  actif ? "bg-[var(--color-navy-900)] border-[var(--color-navy-900)] text-white" : "bg-white border-[var(--color-ink-100)] text-[var(--color-ink-700)]"
                }`}
              >
                <span className={`h-7 w-7 rounded-full flex items-center justify-center ${actif ? "bg-white/15" : `${t.fond} ${t.couleur}`}`}>
                  <Icon size={14} className={actif ? "text-white" : ""} />
                </span>
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          {onglet === "produits" && <ProduitsTab key={`p-${refreshKey}`} fournisseurId={fournisseurConnecte.id} />}
          {onglet === "commandes" && <CommandesTab key={`c-${refreshKey}`} fournisseurId={fournisseurConnecte.id} onGererLivreurs={() => setOnglet("livreurs")} />}
          {onglet === "livreurs" && <LivreursTab key={`l-${refreshKey}`} fournisseurId={fournisseurConnecte.id} />}
          {onglet === "stats" && <StatsTab key={`s-${refreshKey}`} fournisseurId={fournisseurConnecte.id} />}
          {onglet === "commerce" && <MonCommerceTab key={`m-${refreshKey}`} />}
        </div>
      </div>

      <ReclamationModal
        open={reclamationOuverte}
        onClose={() => setReclamationOuverte(false)}
        auteurType="fournisseur"
        auteurId={fournisseurConnecte.id}
        auteurNom={fournisseurConnecte.nom}
        auteurTelephone={fournisseurConnecte.telephone}
      />
    </div>
  );
}
