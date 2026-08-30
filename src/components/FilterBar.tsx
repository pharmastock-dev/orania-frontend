export type Tri = "proches" | "notes" | null;
export type FiltreMulti = "promos" | "ouverts" | "gratuite";

const TRI_OPTIONS: { key: Exclude<Tri, null>; label: string; emoji: string }[] = [
  { key: "proches", label: "Plus proches", emoji: "📍" },
  { key: "notes", label: "Mieux notés", emoji: "⭐" },
];

const FILTRE_OPTIONS: { key: FiltreMulti; label: string; emoji: string }[] = [
  { key: "promos", label: "Promos", emoji: "🔥" },
  { key: "ouverts", label: "Ouverts", emoji: "🟢" },
  { key: "gratuite", label: "Livraison gratuite", emoji: "🚲" },
];

// Style "doré brillant" demandé pour tous les filtres actifs — un dégradé
// or avec un léger éclat, plutôt qu'une couleur plate par filtre.
const CLASSE_ACTIVE =
  "bg-gradient-to-r from-[#f2c94c] to-[#f5a623] text-[var(--color-navy-900)] border-[#f2c94c] shadow-[0_2px_10px_-2px_rgba(242,201,76,0.6)]";

interface FilterBarProps {
  tri: Tri;
  onTriChange: (tri: Tri) => void;
  filtresActifs: FiltreMulti[];
  onToggleFiltre: (filtre: FiltreMulti) => void;
}

export default function FilterBar({ tri, onTriChange, filtresActifs, onToggleFiltre }: FilterBarProps) {
  return (
    <div className="flex flex-col gap-2.5 bg-white border border-[var(--color-ink-100)] rounded-2xl p-3">
      <div className="flex gap-2 overflow-x-auto scroll-row">
        {TRI_OPTIONS.map((t) => {
          const isActive = tri === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onTriChange(isActive ? null : t.key)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-sm font-bold border whitespace-nowrap transition-all ${
                isActive ? CLASSE_ACTIVE : "bg-white text-[var(--color-ink-700)] border-[var(--color-ink-100)]"
              }`}
            >
              <span>{t.emoji}</span>
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 overflow-x-auto scroll-row">
        {FILTRE_OPTIONS.map((f) => {
          const isActive = filtresActifs.includes(f.key);
          return (
            <button
              key={f.key}
              onClick={() => onToggleFiltre(f.key)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-sm font-bold border whitespace-nowrap transition-all ${
                isActive ? CLASSE_ACTIVE : "bg-white text-[var(--color-ink-700)] border-[var(--color-ink-100)]"
              }`}
            >
              <span>{f.emoji}</span>
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
