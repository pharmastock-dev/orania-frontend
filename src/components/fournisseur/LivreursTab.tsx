import { useEffect, useState } from "react";
import { Bike, Phone, Plus, Trash2, AlertTriangle } from "lucide-react";
import Button from "../Button";
import { CardSkeleton } from "../Loading";
import EmptyState from "../EmptyState";
import { useToast } from "../../context/ToastContext";
import { getLivreurs, creerLivreur, supprimerLivreur } from "../../api";
import { ApiError } from "../../api/client";
import { nettoyerTelephone } from "../../utils/format";
import type { Livreur } from "../../types";

export default function LivreursTab({ fournisseurId }: { fournisseurId: number }) {
  const { showToast } = useToast();
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [ajoutEnCours, setAjoutEnCours] = useState(false);

  useEffect(() => {
    getLivreurs(fournisseurId)
      .then(setLivreurs)
      .catch((err) => setErreur(err instanceof ApiError ? err.message : "Impossible de charger les livreurs."))
      .finally(() => setLoading(false));
  }, [fournisseurId]);

  async function handleAjouter(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim() || !telephone.trim()) {
      showToast("Nom et téléphone sont obligatoires.", "error");
      return;
    }
    setAjoutEnCours(true);
    try {
      const nouveau = await creerLivreur(fournisseurId, { nom: nom.trim(), telephone: telephone.trim() });
      setLivreurs((prev) => [...prev, nouveau]);
      setNom("");
      setTelephone("");
      showToast("Livreur ajouté", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible d'ajouter le livreur.", "error");
    } finally {
      setAjoutEnCours(false);
    }
  }

  async function handleSupprimer(l: Livreur) {
    try {
      await supprimerLivreur(l.id);
      setLivreurs((prev) => prev.filter((x) => x.id !== l.id));
      showToast("Livreur supprimé", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible de supprimer le livreur.", "error");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {erreur && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-3.5 py-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{erreur}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border-2 border-[var(--color-pink-100)] p-4">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="h-9 w-9 rounded-xl bg-[var(--color-pink-100)] text-[var(--color-pink-600)] flex items-center justify-center shrink-0">
            <Bike size={17} />
          </span>
          <p className="font-bold text-[var(--color-ink-900)]">Ajouter un livreur</p>
        </div>
        <form onSubmit={handleAjouter} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom du livreur" className="bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none focus:border-[var(--color-pink-500)]" />
          <input
            value={telephone}
            onChange={(e) => setTelephone(nettoyerTelephone(e.target.value))}
            placeholder="Téléphone"
            inputMode="tel"
            maxLength={14}
            className="bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none focus:border-[var(--color-pink-500)]"
          />
          <Button type="submit" loading={ajoutEnCours} icon={<Plus size={16} />} className="sm:col-span-2">
            Ajouter le livreur
          </Button>
        </form>
      </div>

      <div>
        <div className="flex items-center gap-2.5 mb-3">
          <span className="h-9 w-9 rounded-xl bg-[var(--color-pink-100)] text-[var(--color-pink-600)] flex items-center justify-center shrink-0">
            <Bike size={16} />
          </span>
          <p className="font-bold text-[var(--color-ink-900)]">Mes livreurs</p>
        </div>
        {loading ? (
          <div className="flex flex-col gap-2.5"><CardSkeleton /></div>
        ) : livreurs.length === 0 ? (
          <EmptyState icon={<Bike size={32} />} title="Aucun livreur pour l'instant" description="Ajoutez votre premier livreur ci-dessus pour l'assigner aux commandes." />
        ) : (
          <div className="flex flex-col gap-2">
            {livreurs.map((l) => (
              <div key={l.id} className="flex items-center gap-3 bg-white rounded-xl border border-[var(--color-ink-100)] p-3">
                <span className="h-10 w-10 rounded-full bg-[var(--color-orange-100)] flex items-center justify-center text-[var(--color-orange-600)] text-sm font-bold shrink-0">
                  {l.nom.charAt(0).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[var(--color-ink-900)]">{l.nom}</p>
                  <p className="text-xs text-[var(--color-ink-500)] flex items-center gap-1"><Phone size={11} /> {l.telephone}</p>
                </div>
                <button onClick={() => handleSupprimer(l)} className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
