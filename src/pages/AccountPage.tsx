import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, ClipboardList, User as UserIcon, Flag, Trash2, AlertTriangle } from "lucide-react";
import BackButton from "../components/BackButton";
import OrderCard from "../components/OrderCard";
import { CardSkeleton } from "../components/Loading";
import EmptyState from "../components/EmptyState";
import Button from "../components/Button";
import Modal from "../components/Modal";
import ReclamationModal from "../components/ReclamationModal";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { getCommandesAcheteur, supprimerCompteClient } from "../api";
import { ApiError } from "../api/client";
import type { Commande } from "../types";

export default function AccountPage() {
  const navigate = useNavigate();
  const { client, setClient } = useApp();
  const { showToast } = useToast();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [reclamationOuverte, setReclamationOuverte] = useState(false);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);

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

  // Vraie suppression de compte -- exigence Apple (pas juste une page web).
  // Confirmation obligatoire avant toute action, pour eviter une suppression
  // accidentelle. Une fois supprime, deconnexion automatique -- le compte
  // n'existe plus, impossible de continuer a l'utiliser.
  async function handleSupprimerCompte() {
    setSuppressionEnCours(true);
    try {
      await supprimerCompteClient(client.id);
      showToast("Votre compte a été supprimé.", "success");
      setClient(null);
      navigate("/");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible de supprimer le compte.", "error");
      setSuppressionEnCours(false);
      setSuppressionOuverte(false);
    }
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

        {/* Suppression de compte -- separee visuellement (rouge, en bas),
            jamais confondue avec une simple deconnexion. */}
        <button
          onClick={() => setSuppressionOuverte(true)}
          className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-red-600 mt-5 py-2"
        >
          <Trash2 size={15} /> Supprimer mon compte
        </button>
      </div>

      <ReclamationModal
        open={reclamationOuverte}
        onClose={() => setReclamationOuverte(false)}
        auteurType="client"
        auteurId={client.id}
        auteurNom={client.nom}
        auteurTelephone={client.telephone}
      />

      <Modal open={suppressionOuverte} onClose={() => !suppressionEnCours && setSuppressionOuverte(false)} title="Supprimer mon compte">
        <div className="flex items-start gap-2.5 bg-red-50 text-red-700 text-sm rounded-xl px-3.5 py-3 mb-4">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            Cette action est <strong>définitive et irréversible</strong>. Votre nom et votre numéro de téléphone
            seront supprimés. Votre historique de commandes restera visible côté commerçant (obligations comptables),
            mais ne sera plus associé à vous.
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" fullWidth onClick={() => setSuppressionOuverte(false)} disabled={suppressionEnCours}>
            Annuler
          </Button>
          <Button
            fullWidth
            loading={suppressionEnCours}
            onClick={handleSupprimerCompte}
            className="!bg-red-600 hover:!bg-red-700"
          >
            Supprimer définitivement
          </Button>
        </div>
      </Modal>
    </div>
  );
}
