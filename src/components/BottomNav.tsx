import { NavLink } from "react-router-dom";
import { Home, Search, ShoppingCart, ClipboardList, User } from "lucide-react";
import { useApp } from "../context/AppContext";

const ONGLETS = [
  { to: "/client/accueil", label: "Accueil", icon: Home, exact: true },
  { to: "/client/recherche", label: "Recherche", icon: Search },
  { to: "/panier", label: "Panier", icon: ShoppingCart },
  { to: "/compte", label: "Commandes", icon: ClipboardList },
  { to: "/compte", label: "Profil", icon: User },
];

export default function BottomNav() {
  const { cartCount } = useApp();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[var(--color-ink-100)] safe-bottom">
      <div className="max-w-md mx-auto grid grid-cols-5">
        {ONGLETS.map((o) => (
          <NavLink
            key={o.label}
            to={o.to}
            end={o.exact}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${
                isActive ? "text-[var(--color-orange-500)]" : "text-[var(--color-ink-500)]"
              }`
            }
          >
            <span className="relative">
              <o.icon size={20} />
              {o.label === "Panier" && cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 h-4 min-w-4 px-1 rounded-full bg-[var(--color-orange-500)] text-white text-[9px] font-extrabold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </span>
            {o.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
