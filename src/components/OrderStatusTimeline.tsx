import { Check } from "lucide-react";
import type { StatutCommande } from "../types";

// Suivi client aligné sur les VRAIS statuts du backend : en_attente/non_recupere
// (départ selon livraison ou retrait) → en_route (livraison seulement, posé
// automatiquement à l'assignation d'un livreur) → livre/recupere (fin).
const ETAPES_LIVRAISON: { key: StatutCommande; label: string }[] = [
  { key: "en_attente", label: "Commande reçue" },
  { key: "en_route", label: "En route" },
  { key: "livre", label: "Livrée" },
];

const ETAPES_RETRAIT: { key: StatutCommande; label: string }[] = [
  { key: "non_recupere", label: "En préparation" },
  { key: "recupere", label: "Récupérée" },
];

export default function OrderStatusTimeline({ statut, avecLivraison }: { statut: StatutCommande; avecLivraison: boolean }) {
  if (statut === "annulee") {
    return (
      <div className="bg-red-50 text-red-700 text-sm font-medium rounded-xl px-4 py-3 text-center">
        Cette commande a été refusée par le commerce.
      </div>
    );
  }

  const etapes = avecLivraison ? ETAPES_LIVRAISON : ETAPES_RETRAIT;
  const effectiveIndex = Math.max(0, etapes.findIndex((e) => e.key === statut));

  return (
    <div className="flex flex-col gap-0">
      {etapes.map((etape, i) => {
        const atteinte = i <= effectiveIndex;
        const active = i === effectiveIndex;
        return (
          <div key={etape.key} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                  atteinte ? "bg-[var(--color-green-500)] text-white" : "bg-[var(--color-ink-100)] text-[var(--color-ink-300)]"
                } ${active ? "ring-4 ring-[var(--color-green-100)]" : ""}`}
              >
                {atteinte ? <Check size={13} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
              </span>
              {i < etapes.length - 1 && <span className={`w-0.5 flex-1 min-h-6 ${atteinte ? "bg-[var(--color-green-500)]" : "bg-[var(--color-ink-100)]"}`} />}
            </div>
            <p className={`pb-6 pt-0.5 text-sm ${atteinte ? "font-semibold text-[var(--color-ink-900)]" : "text-[var(--color-ink-500)]"}`}>{etape.label}</p>
          </div>
        );
      })}
    </div>
  );
}
