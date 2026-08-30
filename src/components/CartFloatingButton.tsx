import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, ChevronRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import { formatPrix } from "../utils/format";

interface CartFloatingButtonProps {
  avecBarreNavigation?: boolean;
}

export default function CartFloatingButton({ avecBarreNavigation = false }: CartFloatingButtonProps) {
  const navigate = useNavigate();
  const { cartCount, cartTotal } = useApp();

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const [pulse, setPulse] = useState(false);
  const compteRef = useRef(cartCount);

  useEffect(() => {
    if (compteRef.current !== cartCount && cartCount > 0) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 320);
      compteRef.current = cartCount;
      return () => clearTimeout(t);
    }
    compteRef.current = cartCount;
  }, [cartCount]);

  if (cartCount === 0) return null;

  return (
    <button
      onClick={() => navigate("/panier")}
      className={`fixed left-4 right-4 z-40 max-w-md mx-auto flex items-center gap-3 bg-[var(--color-orange-500)] text-white rounded-2xl pl-3 pr-4 py-3 shadow-[0_12px_32px_-8px_rgba(245,121,12,0.55)] transition-all duration-300 ease-out ${
        avecBarreNavigation ? "" : "safe-bottom"
      } ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${pulse ? "scale-[1.035]" : "scale-100"}`}
      style={avecBarreNavigation ? { bottom: "calc(76px + env(safe-area-inset-bottom))" } : { bottom: "1rem" }}
    >
      <span className="relative h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
        <ShoppingBag size={18} />
        <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 rounded-full bg-white text-[var(--color-orange-600)] text-[11px] font-extrabold flex items-center justify-center">
          {cartCount}
        </span>
      </span>
      <span className="flex-1 text-left">
        <span className="block font-bold text-[15px] leading-tight">Voir mon panier</span>
        <span className="block text-xs text-white/80 leading-tight mt-0.5">{formatPrix(cartTotal)}</span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-white/80" />
    </button>
  );
}
