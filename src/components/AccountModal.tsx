import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User as UserIcon, Phone, LogOut, ClipboardList, Star, Trash2 } from "lucide-react";
import Modal from "./Modal";
import OrderCard from "./OrderCard";
import RatingStars from "./RatingStars";
import { CardSkeleton } from "./Loading";
import EmptyState from "./EmptyState";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { getCommandesAcheteur, getAvisAcheteur, supprimerAvis } from "../api";
import { ApiError } from "../api/client";
import type { Commande, Avis } from "../types";

type Onglet = "compte" | "commandes" | "avis";

interface AccountModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AccountModal({ open, onClose }: AccountModalProps) {
  const navigate = useNavigate();
  const { client, setClient } = useApp();
  const { showToast } = useToast();
  const [onglet, setOnglet] = useState<Onglet>("compte");
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [avis, setAvis] = useState<Avis[]>([]);
  const [loading, setLoading] = useState(false);
  const [charge, setCharge] = useState(false);

  useEffect(() => {
    if (!open || !client || charge) return;
    setLoading(true);
    Promise.allSettled([getCommandesAcheteur(client.id), getAvisAcheteur(client.id)]).then(([c, a]) => {
      if (c.status === "fulfilled") setCommandes((c.value || []).sort((x, y) => y.id - x.id));
      if (a.status === "fulfilled") setAvis(a.value || []);
      setLoading(false);
      setCharge(true);
    });
  }, [open, client, charge]);

  if (!client) return null;

  function handleLogout() {
    setClient(null);
    onClose();
    navigate("/");
  }

  async function handleSupprimerAvis(a: Avis) {
    if (!a.id) return;
    try {
      await supprimerAvis(a.id);
      setAvis((prev) => prev.filter((x) => x.id !== a.id));
      showToast("Avis supprimé", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible de supprimer cet avis.", "error");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Mon compte">
      <div className="bg-[var(--color-ink-50)] rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="h-11 w-11 rounded-full bg-[var(--color-orange-100)] text-[var(--color-orange-600)] flex items-center justify-center shrink-0">
            <UserIcon size={19} />
          </span>
          <div>
            <p className="text-xs font-semibold text-[var(--color-ink-500)] uppercase tracking-wide">Nom</p>
            <p className="font-bold text-[var(--color-ink-900)]">{client.nom}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="h-11 w-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Phone size={17} />
          </span>
          <div>
            <p className="text-xs font-semibold text-[var(--color-ink-500)] uppercase tracking-wide">Téléphone</p>
            <p className="font-bold text-[var(--color-ink-900)]">{client.telephone}</p>
          </div>
        </div>
      </div>

      <div className="flex bg-[var(--color-ink-50)] rounded-xl p-1 mt-4">
        {([
          { key: "compte", label: "Compte" },
          { key: "commandes", label: "Commandes" },
          { key: "avis", label: "Avis" },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setOnglet(t.key)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              onglet === t.key ? "bg-[var(--color-navy-900)] text-white" : "text-[var(--color-ink-700)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 max-h-[45vh] overflow-y-auto">
        {onglet === "compte" && (
          <p className="text-sm text-[var(--color-ink-500)] text-center py-4">
            Consultez vos commandes et vos avis dans les onglets ci-dessus.
          </p>
        )}

        {onglet === "commandes" && (
          <div className="flex flex-col gap-2.5">
            {loading ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : commandes.length === 0 ? (
              <EmptyState icon={<ClipboardList size={28} />} title="Aucune commande pour le moment" />
            ) : (
              commandes.map((c) => (
                <OrderCard
                  key={c.id}
                  commande={c}
                  subtitle={c.fournisseur_nom}
                  onClick={() => {
                    onClose();
                    navigate(`/commande/${c.id}`);
                  }}
                />
              ))
            )}
          </div>
        )}

        {onglet === "avis" && (
          <div className="flex flex-col gap-2.5">
            {loading ? (
              <CardSkeleton />
            ) : avis.length === 0 ? (
              <EmptyState icon={<Star size={28} />} title="Aucun avis laissé" />
            ) : (
              avis.map((a, i) => (
                <div key={a.id ?? i} className="flex items-start gap-3 bg-white rounded-2xl border border-[var(--color-ink-100)] p-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[var(--color-ink-900)]">{a.fournisseur_nom || "Commerce"}</p>
                    <RatingStars note={a.note} size={13} />
                    {a.commentaire && <p className="text-sm text-[var(--color-ink-700)] mt-1">{a.commentaire}</p>}
                  </div>
                  <button onClick={() => handleSupprimerAvis(a)} className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <button
        onClick={handleLogout}
        className="w-full mt-4 border border-red-200 text-red-500 font-semibold text-sm rounded-xl py-3 flex items-center justify-center gap-2"
      >
        <LogOut size={16} /> Se déconnecter
      </button>
    </Modal>
  );
}
