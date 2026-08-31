import { useNavigate } from "react-router-dom";
import { ShoppingBag, Store as StoreIcon, Headset, ChevronRight, Bike } from "lucide-react";
import Logo from "../components/Logo";

// L'espace Administration n'est volontairement PAS listé ici — réservé au
// propriétaire de l'app, accessible uniquement en connaissant l'URL /admin
// directement (jamais affichée ni liée nulle part dans l'interface publique).
const CHOICES = [
  {
    icon: ShoppingBag,
    title: "Je suis un client",
    subtitle: "Commander auprès des commerces",
    to: "/client",
    accent: "bg-[var(--color-orange-500)]",
    glow: "shadow-[0_8px_20px_-6px_rgba(245,121,12,0.45)]",
  },
  {
    icon: StoreIcon,
    title: "Je suis un commerçant",
    subtitle: "Gérer mon commerce et mes commandes",
    to: "/commercant",
    accent: "bg-[var(--color-navy-900)]",
    glow: "shadow-[0_8px_20px_-6px_rgba(16,31,61,0.45)]",
  },
  {
    icon: Bike,
    title: "Je suis un livreur",
    subtitle: "Accepter des commandes à livrer",
    to: "/livreur",
    accent: "bg-[var(--color-green-500)]",
    glow: "shadow-[0_8px_20px_-6px_rgba(22,163,74,0.4)]",
  },
  {
    icon: Headset,
    title: "Contact",
    subtitle: "Nous contacter / assistance",
    to: "/contact",
    accent: "bg-[#5b6b85]",
    glow: "shadow-[0_8px_20px_-6px_rgba(91,107,133,0.4)]",
  },
];

// Motifs décoratifs très discrets (livraison, gastronomie, localisation) —
// tracés en SVG plutôt qu'une image externe, pour un contrôle total de
// l'opacité et garantir qu'ils ne gênent jamais la lisibilité. Chacun est
// positionné et légèrement fait pivoter pour un rendu organique, pas une
// grille répétitive.
function MotifsDecoratifs() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 w-full h-full"
      viewBox="0 0 400 900"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      {/* Ligne de route pointillée, reliant deux points de localisation */}
      <path
        d="M 20 140 Q 120 200 90 320 T 180 480"
        stroke="white"
        strokeWidth="2"
        strokeDasharray="1 14"
        strokeLinecap="round"
        opacity="0.12"
      />
      <circle cx="20" cy="140" r="5" stroke="white" strokeWidth="1.5" opacity="0.14" />
      <circle cx="180" cy="480" r="5" stroke="white" strokeWidth="1.5" opacity="0.14" />

      {/* Pin de localisation, haut droite */}
      <g opacity="0.09" transform="translate(330,60) rotate(8)">
        <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0Z" fill="white" />
      </g>

      {/* Scooter de livraison, stylisé, bas gauche */}
      <g opacity="0.08" transform="translate(10,700) scale(1.1)">
        <circle cx="14" cy="46" r="9" stroke="white" strokeWidth="2.5" />
        <circle cx="62" cy="46" r="9" stroke="white" strokeWidth="2.5" />
        <path d="M14 46 L34 46 L44 20 L62 20 M44 20 L50 46 L62 46" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Sac shopping, milieu droite */}
      <g opacity="0.08" transform="translate(345,380) rotate(-6)">
        <rect x="0" y="14" width="34" height="30" rx="3" stroke="white" strokeWidth="2.5" />
        <path d="M8 14 V8 a9 9 0 0 1 18 0 v6" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* Tasse de café, bas droite */}
      <g opacity="0.08" transform="translate(300,760) rotate(5)">
        <path d="M0 6 h30 l-3 24 a4 4 0 0 1-4 4 H7 a4 4 0 0 1-4-4Z" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M30 12 h6 a6 6 0 0 1 0 12 h-4" stroke="white" strokeWidth="2.5" />
      </g>

      {/* Part de pizza, haut gauche */}
      <g opacity="0.07" transform="translate(60,40) rotate(-15)">
        <path d="M0 0 L36 6 L4 34 Z" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="12" cy="10" r="1.6" fill="white" />
        <circle cx="20" cy="16" r="1.6" fill="white" />
      </g>

      {/* Burger, milieu gauche */}
      <g opacity="0.07" transform="translate(-10,560) rotate(4)">
        <path d="M2 10 a20 10 0 0 1 40 0 Z" stroke="white" strokeWidth="2.5" />
        <line x1="0" y1="16" x2="44" y2="16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M0 22 h44" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M2 28 a20 8 0 0 0 40 0 Z" stroke="white" strokeWidth="2.5" />
      </g>
    </svg>
  );
}

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f22] via-[var(--color-navy-900)] to-[#0d1428] relative overflow-hidden">
      {/* Lueur douce, centrée derrière le logo — la "touche distinctive" */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-[var(--color-orange-500)]/15 blur-[70px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-72 h-72 rounded-full bg-[var(--color-navy-600)]/25 blur-[80px]" />

      <MotifsDecoratifs />

      <div className="relative max-w-md mx-auto min-h-screen px-6 pt-14 pb-10 flex flex-col items-center text-center">
        <div className="relative">
          <div className="pointer-events-none absolute inset-0 rounded-full bg-[var(--color-orange-400)]/25 blur-2xl scale-150" />
          <Logo size={80} />
        </div>

        <h1 className="font-display text-[34px] leading-none font-extrabold text-white mt-6 tracking-tight">
          QREEB
        </h1>
        <p className="text-white/60 mt-2.5 text-[15px] font-medium">Tout près, tout simplement.</p>

        <div className="w-full flex flex-col gap-3.5 mt-12">
          {CHOICES.map((c) => (
            <button
              key={c.to}
              onClick={() => navigate(c.to)}
              className={`group flex items-center gap-4 bg-[#fdfcfb] rounded-[22px] px-5 py-4.5 text-left transition-all duration-200 active:scale-[0.98] hover:-translate-y-0.5 ${c.glow}`}
            >
              <span className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white shrink-0 ${c.accent}`}>
                <c.icon size={21} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-bold text-[16px] text-[var(--color-ink-900)] leading-tight">{c.title}</span>
                <span className="block text-[13px] text-[var(--color-ink-500)] mt-0.5 leading-snug">{c.subtitle}</span>
              </span>
              <ChevronRight
                size={19}
                className="text-[var(--color-ink-300)] shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-active:translate-x-1"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
