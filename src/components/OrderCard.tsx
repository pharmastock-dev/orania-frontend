import { formatPrix } from "../utils/format";
import type { Commande } from "../types";

const STATUT_STYLES: Record<string, string> = {
  en_attente: "bg-[var(--color-orange-100)] text-[var(--color-orange-600)]",
  en_cours: "bg-blue-50 text-blue-600",
  livre: "bg-[var(--color-green-100)] text-[var(--color-green-600)]",
  recupere: "bg-[var(--color-green-100)] text-[var(--color-green-600)]",
  annulee: "bg-red-50 text-red-600",
};

function libelleStatut(commande: Commande): string {
  const parLivraison: Record<string, string> = commande.avec_livraison
    ? { en_attente: "Non livrée", en_cours: "En cours", livre: "Livrée", annulee: "Annulée" }
    : { en_attente: "Non récupérée", en_cours: "En cours", recupere: "Récupérée", annulee: "Annulée" };
  return parLivraison[commande.statut] || commande.statut;
}

export default function OrderCard({ commande, onClick, subtitle }: { commande: Commande; onClick?: () => void; subtitle?: string }) {
  return (
    <button onClick={onClick} className="w-full text-left bg-white rounded-2xl border border-[var(--color-ink-100)] p-4">
      <div className="flex items-center justify-between">
        <p className="font-bold text-[var(--color-ink-900)]">Commande #{commande.id}</p>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUT_STYLES[commande.statut] || "bg-[var(--color-ink-100)]"}`}>
          {libelleStatut(commande)}
        </span>
      </div>
      {subtitle && <p className="text-sm text-[var(--color-ink-500)] mt-1">{subtitle}</p>}
      <div className="flex items-center justify-between mt-2 text-sm text-[var(--color-ink-500)]">
        <span>{commande.created_at ? new Date(commande.created_at).toLocaleDateString("fr-FR") : ""}</span>
        <span className="font-semibold text-[var(--color-ink-900)]">{formatPrix(commande.prix_total)}</span>
      </div>
    </button>
  );
}
