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
  },
  {
    icon: StoreIcon,
    title: "Je suis un commerçant",
    subtitle: "Gérer mon commerce et mes commandes",
    to: "/commercant",
    accent: "bg-[var(--color-navy-900)]",
  },
  {
    icon: Bike,
    title: "Je suis un livreur",
    subtitle: "Accepter des commandes à livrer",
    to: "/livreur",
    accent: "bg-[var(--color-green-500)]",
  },
  {
    icon: Headset,
    title: "Contact",
    subtitle: "Nous contacter / assistance",
    to: "/contact",
    accent: "bg-[var(--color-ink-700,#374151)]",
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--color-navy-900)] relative overflow-hidden">
      {/* vrai fond fourni (motifs food/shopping/localisation) */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/background.png)" }}
      />

      <div className="relative max-w-md mx-auto px-6 pt-16 pb-10 flex flex-col items-center text-center">
        <Logo size={72} />
        <h1 className="font-display text-3xl font-extrabold text-white mt-5">QREEB</h1>
        <p className="text-white/70 mt-1.5 text-[15px]">Tout près, tout simplement.</p>

        <div className="w-full flex flex-col gap-3 mt-10">
          {CHOICES.map((c) => (
            <button
              key={c.to}
              onClick={() => navigate(c.to)}
              className="flex items-center gap-4 bg-white rounded-2xl p-4 text-left hover:-translate-y-0.5 transition-transform"
            >
              <span className={`h-11 w-11 rounded-xl flex items-center justify-center text-white shrink-0 ${c.accent}`}>
                <c.icon size={20} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-bold text-[var(--color-ink-900)]">{c.title}</span>
                <span className="block text-sm text-[var(--color-ink-500)]">{c.subtitle}</span>
              </span>
              <ChevronRight size={18} className="text-[var(--color-ink-300)] shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
