import { CATEGORIES_CLIENT } from "../utils/categories";

interface CategoryBarProps {
  actif: string;
  onChange: (key: string) => void;
}

export default function CategoryBar({ actif, onChange }: CategoryBarProps) {
  return (
    <div className="flex gap-2.5 overflow-x-auto scroll-row -mx-4 px-4 sm:mx-0 sm:px-0">
      {CATEGORIES_CLIENT.map((cat) => {
        const isActive = actif === cat.key;
        return (
          <button
            key={cat.key}
            onClick={() => onChange(cat.key)}
            className={`shrink-0 flex flex-col items-center gap-1.5 px-1 w-16 ${isActive ? "text-[var(--color-orange-600)]" : "text-[var(--color-ink-700)]"}`}
          >
            <span
              className={`flex items-center justify-center h-12 w-12 rounded-2xl border text-2xl ${
                isActive ? "bg-[var(--color-orange-100)] border-[var(--color-orange-400)]" : "bg-white border-[var(--color-ink-100)]"
              }`}
            >
              {cat.emoji}
            </span>
            <span className="text-[11px] font-medium text-center leading-tight">{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
