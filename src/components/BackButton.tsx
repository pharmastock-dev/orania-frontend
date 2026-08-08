import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function BackButton({ to, label }: { to?: string; label?: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => (to ? navigate(to) : navigate(-1))}
      className="flex items-center justify-center h-10 w-10 rounded-full bg-white border border-[var(--color-ink-100)] text-[var(--color-navy-900)] hover:border-[var(--color-orange-500)] shrink-0"
      aria-label={label || "Retour"}
    >
      <ArrowLeft size={18} />
    </button>
  );
}
