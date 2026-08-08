import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { formatPrix } from "../utils/format";

export default function CartFloatingButton() {
  const navigate = useNavigate();
  const { cartCount, cartTotal } = useApp();

  if (cartCount === 0) return null;

  return (
    <button
      onClick={() => navigate("/panier")}
      className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto flex items-center bg-[var(--color-orange-500)] text-white rounded-2xl pl-2 pr-5 py-2 shadow-xl safe-bottom"
    >
      <span className="h-9 w-9 rounded-full bg-white/25 flex items-center justify-center font-bold text-sm shrink-0">{cartCount}</span>
      <span className="flex-1 text-center font-bold">Commander</span>
      <span className="font-bold shrink-0">{formatPrix(cartTotal)}</span>
    </button>
  );
}
