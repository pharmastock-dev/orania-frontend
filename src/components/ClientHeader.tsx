import { useState } from "react";
import { User } from "lucide-react";
import Logo from "./Logo";
import BackButton from "./BackButton";
import AccountModal from "./AccountModal";
import { useApp } from "../context/AppContext";

export default function ClientHeader({ showBack = false }: { showBack?: boolean }) {
  const { client } = useApp();
  const [compteOuvert, setCompteOuvert] = useState(false);

  return (
    <div className="flex items-center gap-3">
      {showBack && <BackButton to="/" />}
      <Logo size={40} />
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-[var(--color-navy-900)] leading-none text-lg">QREEB</p>
        {client && <p className="text-sm text-[var(--color-ink-500)] mt-1">Bonjour, {client.nom} 👋</p>}
      </div>
      <button
        onClick={() => setCompteOuvert(true)}
        className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-navy-900)] bg-white border border-[var(--color-ink-100)] px-3 py-2 rounded-xl shrink-0"
      >
        <User size={16} />
        Compte
      </button>

      <AccountModal open={compteOuvert} onClose={() => setCompteOuvert(false)} />
    </div>
  );
}
