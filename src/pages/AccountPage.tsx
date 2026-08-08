import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, ClipboardList, User as UserIcon, Flag } from "lucide-react";
import BackButton from "../components/BackButton";
import OrderCard from "../components/OrderCard";
import { CardSkeleton } from "../components/Loading";
import EmptyState from "../components/EmptyState";
import Button from "../components/Button";
import ReclamationModal from "../components/ReclamationModal";
import { useApp } from "../context/AppContext";
import { getCommandesAcheteur } from "../api";
import type { Commande } from "../types";

export default function AccountPage() {
  const navigate = useNavigate();
  const { client, setClient } = useApp();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [reclamationOuverte, setReclamationOuverte] = useState(false);

  useEffect(() => {
    if (!client) {
      navigate("/client");
      return;
    }
    let annule = false;
    getCommandesAcheteur(client.id)
      .then((data) => {
        if (!annule) setCommandes((data || []).sort((a, b) => b.id - a.id));
      })
      .catch(() => {})
      .finally(() => {
        if (!annule) setLoading(false);
      });
    return () => {
      annule = true;
    };
  }, [client, navigate]);

  if (!client) return null;

  function handleLogout() {
    setClient(null);
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-[var(--color-ink-50)] pb-10">
      <div className="max-w-md mx-auto px-4 pt-5">
        <div className="flex items-center gap-3">
          <BackButton to="/client/accueil" />
          <h1 className="font-display font-bold text-xl text-[var(--color-ink-900)]">Mon compte</h1>
        </div>

        <div className="flex items-center gap-3 bg-white rounded-2xl border border-[var(--color-ink-100)] p-4 mt-5">
          <span className="h-12 w-12 rounded-full bg-[var(--color-navy-900)] text-white flex items-center justify-center">
            <UserIcon size={20} />
          </span>
          <div>
            <p className="font-bold text-[var(--color-ink-900)]">{client.nom}</p>
            <p className="text-sm text-[var(--color-ink-500)]">{client.telephone}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-6 mb-3">
          <ClipboardList size={16} className="text-[var(--color-ink-500)]" />
          <p className="font-semibold text-[var(--color-ink-900)]">Historique des commandes</p>
        </div>

        <div className="flex flex-col gap-2.5">
          {loading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : commandes.length === 0 ? (
            <EmptyState title="Aucune commande pour le moment" description="Vos commandes apparaîtront ici." />
          ) : (
            commandes.map((c) => (
              <OrderCard key={c.id} commande={c} subtitle={c.fournisseur_nom} onClick={() => navigate(`/commande/${c.id}`)} />
            ))
          )}
        </div>

        <Button variant="outline" fullWidth className="mt-3" icon={<Flag size={16} />} onClick={() => setReclamationOuverte(true)}>
          Signaler un problème
        </Button>

        <Button variant="outline" fullWidth className="mt-3" icon={<LogOut size={16} />} onClick={handleLogout}>
          Se déconnecter
        </Button>
      </div>

      <ReclamationModal
        open={reclamationOuverte}
        onClose={() => setReclamationOuverte(false)}
        auteurType="client"
        auteurId={client.id}
        auteurNom={client.nom}
        auteurTelephone={client.telephone}
      />
    </div>
  );
}
