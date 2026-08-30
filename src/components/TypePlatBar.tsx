import { TYPES_PLATS_CLIENT } from "../utils/categories";

interface TypePlatBarProps {
  actif: string;
  onChange: (key: string) => void;
}

export default function TypePlatBar({ actif, onChange }: TypePlatBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scroll-row -mx-4 px-4 sm:mx-0 sm:px-0">
      {TYPES_PLATS_CLIENT.map((t) => {
        const isActive = actif === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
              isActive ? "bg-[var(--color-orange-500)] text-white" : "bg-white border border-[var(--color-ink-100)] text-[var(--color-ink-900)]"
            }`}
          >
            <span>{t.emoji}</span> {t.label}
          </button>
        );
      })}
    </div>
  );
}
