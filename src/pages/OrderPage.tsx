import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import BackButton from "../components/BackButton";
import OrderStatusTimeline from "../components/OrderStatusTimeline";
import { Loading } from "../components/Loading";
import EmptyState from "../components/EmptyState";
import Button from "../components/Button";
import ReviewForm from "../components/ReviewForm";
import { useApp } from "../context/AppContext";
import { getCommandesAcheteur } from "../api";
import { ApiError } from "../api/client";
import { formatPrix } from "../utils/format";
import type { Commande } from "../types";

export default function OrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { client } = useApp();

  const [commande, setCommande] = useState<Commande | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!client) {
      navigate("/client");
      return;
    }
    let annule = false;
    setLoading(true);
    getCommandesAcheteur(client.id)
      .then((commandes) => {
        if (annule) return;
        const trouvee = (commandes || []).find((c) => String(c.id) === id) || null;
        setCommande(trouvee);
        if (!trouvee) setErreur("Commande introuvable.");
      })
      .catch((err) => {
        if (!annule) setErreur(err instanceof ApiError ? err.message : "Impossible de contacter le serveur.");
      })
      .finally(() => {
        if (!annule) setLoading(false);
      });
    return () => {
      annule = true;
    };
  }, [id, client, navigate]);

  if (loading) return <Loading label="Chargement de la commande..." />;

  if (!commande) {
    return (
      <div className="max-w-md mx-auto px-4 pt-5">
        <BackButton to="/compte" />
        <EmptyState icon={<AlertTriangle size={36} />} title="Commande introuvable" description={erreur || undefined} />
      </div>
    );
  }

  const terminee = commande.statut === "livre" || commande.statut === "recupere";

  return (
    <div className="min-h-screen bg-[var(--color-ink-50)] pb-10">
      <div className="max-w-md mx-auto px-4 pt-5">
        <div className="flex items-center gap-3">
          <BackButton to="/compte" />
          <h1 className="font-display font-bold text-xl text-[var(--color-ink-900)]">Commande #{commande.id}</h1>
        </div>

        <div className="bg-white rounded-2xl border border-[var(--color-ink-100)] p-4 mt-5">
          <OrderStatusTimeline statut={commande.statut} avecLivraison={commande.avec_livraison} />
        </div>

        <div className="bg-white rounded-2xl border border-[var(--color-ink-100)] p-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-[var(--color-ink-900)]">{commande.fournisseur_nom || "Commerce"}</p>
            <p className="font-bold text-[var(--color-ink-900)]">{formatPrix(commande.prix_total)}</p>
          </div>
          <p className="text-xs text-[var(--color-ink-500)] mt-1">{commande.avec_livraison ? "Livraison" : "À récupérer"}</p>
          {commande.code_confirmation && (
            <p className="text-xs text-[var(--color-ink-500)] mt-2">Code de confirmation : <span className="font-semibold text-[var(--color-ink-900)]">{commande.code_confirmation}</span></p>
          )}
        </div>

        {terminee && client && (
          <div className="bg-white rounded-2xl border border-[var(--color-ink-100)] p-4 mt-4">
            <p className="font-semibold text-[var(--color-ink-900)] mb-3">Votre avis</p>
            <ReviewForm fournisseurId={commande.fournisseur_id} acheteurId={client.id} />
          </div>
        )}

        <Button variant="outline" fullWidth className="mt-5" onClick={() => navigate("/client/accueil")}>
          Retour aux commerces
        </Button>
      </div>
    </div>
  );
}
