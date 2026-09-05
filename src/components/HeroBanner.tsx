import { ChevronRight } from "lucide-react";

// Vraie photo d'Oran (fournie par l'utilisateur, placee dans public/) --
// remplace l'illustration SVG generique. Un degrade sombre par-dessus
// garantit que le texte blanc reste lisible, peu importe la luminosite
// de la zone de la photo derriere.
export default function HeroBanner({ onDecouvrir }: { onDecouvrir?: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-3xl h-48">
      <img
        src="/oran-hero.jpg"
        alt="Vue d'Oran au coucher du soleil"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Degrade sombre -- assure la lisibilite du texte blanc sur n'importe
          quelle zone de la photo, du plus clair (ciel) au plus sombre (ville) */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

      <div className="relative z-10 h-full flex flex-col justify-center px-6">
        <h2 className="font-display font-extrabold text-3xl leading-tight text-white drop-shadow-md">
          Tout Oran,<br />
          <span className="text-[var(--color-orange-400)]">en un clic</span>
        </h2>
        <p className="text-white/90 text-sm mt-2 drop-shadow-sm">Vos commerces préférés livrés chez vous</p>
        <button
          onClick={onDecouvrir}
          className="mt-4 self-start flex items-center gap-1.5 bg-[var(--color-orange-500)] text-white font-bold text-sm px-5 py-2.5 rounded-full"
        >
          Découvrir <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
