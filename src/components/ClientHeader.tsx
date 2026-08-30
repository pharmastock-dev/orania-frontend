import { MapPin, ChevronDown, Bell } from "lucide-react";
import BackButton from "./BackButton";
import { useToast } from "../context/ToastContext";

export default function ClientHeader({ showBack = false }: { showBack?: boolean }) {
  const { showToast } = useToast();

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        {showBack && <BackButton to="/" />}
        <button
          onClick={() => showToast("QREEB est disponible à Oran pour l'instant.", "info")}
          className="flex items-center gap-1.5 min-w-0"
        >
          <MapPin size={18} className="shrink-0 text-[var(--color-orange-500)]" />
          <span className="font-bold text-[15px] text-[var(--color-ink-900)] truncate">Oran, Algérie</span>
          <ChevronDown size={16} className="shrink-0 text-[var(--color-ink-500)]" />
        </button>
      </div>

      <button
        onClick={() => showToast("Aucune nouvelle notification pour l'instant.", "info")}
        className="relative h-10 w-10 rounded-full border border-[var(--color-ink-100)] bg-white flex items-center justify-center shrink-0 text-[var(--color-ink-900)]"
      >
        <Bell size={18} />
        <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-[var(--color-orange-500)]" />
      </button>
    </div>
  );
}
