import { CATEGORIES_CLIENT } from "../utils/categories";

interface CategoryBarProps {
  actif: string;
  onChange: (key: string) => void;
}

// Convertit une couleur hex en rgba avec transparence, pour un fond clair
// dérivé automatiquement de la couleur d'accent de chaque catégorie.
function hexVersRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
            className="shrink-0 flex flex-col items-center gap-1.5 px-1 w-16"
            style={{ color: isActive ? cat.couleur : "var(--color-dark-text-muted)" }}
          >
            <span
              className="flex items-center justify-center h-12 w-12 rounded-2xl border text-2xl transition-colors"
              style={
                isActive
                  ? { backgroundColor: hexVersRgba(cat.couleur, 0.18), borderColor: cat.couleur }
                  : { backgroundColor: "var(--color-dark-card)", borderColor: "var(--color-dark-border)" }
              }
            >
              {cat.emoji}
            </span>
            <span className="text-[11px] font-medium text-center leading-tight" style={{ color: isActive ? cat.couleur : "var(--color-dark-text-muted)" }}>
              {cat.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
