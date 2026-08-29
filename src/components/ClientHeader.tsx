import { MapPin, ChevronDown, Bell } from "lucide-react";
import BackButton from "./BackButton";
import { useToast } from "../context/ToastContext";

// En-tête redessiné pour coller à la maquette de référence : sélecteur de
// ville à gauche, cloche de notifications à droite. Remplace l'ancien
// bouton "Compte" — l'accès au compte se fait désormais via l'onglet
// "Profil" de la barre de navigation du bas (BottomNav).
//
// NOTE HONNÊTE : la cloche est pour l'instant purement visuelle — QREEB
// n'a pas encore de vraie liste de notifications en app (juste des push
// natives). Le clic affiche un message temporaire en attendant cette
// fonctionnalité. Le sélecteur de ville est statique (QREEB ne couvre
// qu'Oran pour l'instant) — cliquer informe simplement l'utilisateur.
export default function ClientHeader({ showBack = false }: { showBack?: boolean }) {
  const { showToast } = useToast();

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        {showBack && <BackButton to="/" />}
        <button
          onClick={() => showToast("QREEB est disponible à Oran pour l'instant.", "info")}
          className="flex items-center gap-1.5 min-w-0 text-[var(--color-orange-400)]"
        >
          <MapPin size={18} className="shrink-0" />
          <span className="font-bold text-[15px] text-[var(--color-dark-text)] truncate">Oran, Algérie</span>
          <ChevronDown size={16} className="shrink-0 text-[var(--color-dark-text-muted)]" />
        </button>
      </div>

      <button
        onClick={() => showToast("Aucune nouvelle notification pour l'instant.", "info")}
        className="relative h-10 w-10 rounded-full border border-[var(--color-dark-border)] flex items-center justify-center shrink-0 text-[var(--color-dark-text)]"
      >
        <Bell size={18} />
        <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-[var(--color-orange-400)]" />
      </button>
    </div>
  );
}
