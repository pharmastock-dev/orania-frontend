import { ChevronRight } from "lucide-react";

// Nouvelle version, sans illustration de ville (celle d'avant n'a pas plu) —
// un dégradé orange/navy propre avec juste le texte et le bouton, sobre.
export default function HeroBanner({ onDecouvrir }: { onDecouvrir?: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-3xl h-48 bg-gradient-to-br from-[var(--color-navy-900)] to-[var(--color-orange-600)]">
      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
      <div className="relative z-10 h-full flex flex-col justify-center px-6">
        <h2 className="font-display font-extrabold text-3xl leading-tight text-white">
          Tout Oran,<br />
          <span className="text-[var(--color-orange-100)]">en un clic</span>
        </h2>
        <p className="text-white/80 text-sm mt-2">Vos commerces préférés livrés chez vous</p>
        <button
          onClick={onDecouvrir}
          className="mt-4 self-start flex items-center gap-1.5 bg-white text-[var(--color-navy-900)] font-bold text-sm px-5 py-2.5 rounded-full"
        >
          Découvrir <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
