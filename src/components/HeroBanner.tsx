import { ChevronRight } from "lucide-react";

// Bannière héro — remplace la photo réelle (droits d'auteur incertains) par
// une illustration ORIGINALE en SVG (silhouette de ville stylisée), dans le
// même esprit visuel que la maquette de référence, sans risque de droits.
// Le fond peut être remplacé plus tard par une vraie photo (à toi, ou sous
// licence) en changeant simplement le contenu du <div className="absolute inset-0">.
export default function HeroBanner({ onDecouvrir }: { onDecouvrir?: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-3xl h-64">
      {/* Fond dégradé + lueur, remplaçable par une vraie photo plus tard */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-navy-900)] via-[#101a33] to-[#1a1030]" />
      <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-[var(--color-orange-500)]/20 blur-3xl" />

      {/* Silhouette de ville — illustration SVG originale, pas une photo */}
      <svg
        className="absolute bottom-0 right-0 w-2/3 h-2/3 opacity-40"
        viewBox="0 0 400 300"
        fill="none"
        preserveAspectRatio="xMaxYMax meet"
      >
        <rect x="0" y="220" width="400" height="80" fill="var(--color-orange-500)" opacity="0.15" />
        <rect x="30" y="160" width="26" height="140" fill="#1e2740" />
        <rect x="70" y="190" width="20" height="110" fill="#1e2740" />
        <rect x="100" y="140" width="30" height="160" fill="#243055" />
        {/* Tour / minaret central, évoquant la Grande Mosquée sans la copier */}
        <rect x="150" y="90" width="14" height="210" fill="#2b3966" />
        <circle cx="157" cy="82" r="9" fill="#2b3966" />
        <rect x="180" y="170" width="24" height="130" fill="#1e2740" />
        <rect x="215" y="130" width="28" height="170" fill="#243055" />
        <rect x="255" y="185" width="18" height="115" fill="#1e2740" />
        <rect x="285" y="150" width="26" height="150" fill="#2b3966" />
        <rect x="325" y="200" width="20" height="100" fill="#1e2740" />
        <rect x="355" y="165" width="24" height="135" fill="#243055" />
      </svg>

      {/* Texte + CTA */}
      <div className="relative z-10 h-full flex flex-col justify-center px-6 max-w-[70%]">
        <h2 className="font-display font-extrabold text-3xl leading-tight text-white">
          Tout Oran,<br />
          <span className="text-[var(--color-orange-400)]">en un clic</span>
        </h2>
        <p className="text-white/70 text-sm mt-2">Vos restaurants préférés livrés chez vous</p>
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
