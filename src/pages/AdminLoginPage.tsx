import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import BackButton from "../components/BackButton";
import Button from "../components/Button";

// NOTE : l'authentification admin doit être branchée sur un vrai endpoint
// backend (ex: POST /admin/login) avant la mise en production. En l'absence
// de cet endpoint dans le cahier des charges, on protège l'accès par un
// code d'accès simple côté client — à remplacer, ne jamais stocker de
// vrai mot de passe admin dans le frontend.
// Code d'accès admin — configurable via VITE_ADMIN_PASSWORD dans .env, sinon
// retombe sur "qreeb-admin" par défaut. Ne stocke jamais de vrai mot de passe
// sensible en dur dans le frontend en production.
const CODE_ACCES_TEMPORAIRE = (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined) || "qreeb-admin";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim() !== CODE_ACCES_TEMPORAIRE) {
      setErreur("Code d'accès incorrect.");
      return;
    }
    sessionStorage.setItem("qreeb_admin_session", "1");
    navigate("/admin/dashboard");
  }

  return (
    <div className="min-h-screen bg-[var(--color-navy-900)] px-5 py-6">
      <div className="max-w-md mx-auto">
        <BackButton to="/" />
        <div className="flex flex-col items-center text-center mt-10">
          <span className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center">
            <ShieldCheck size={28} className="text-[var(--color-navy-900)]" />
          </span>
          <h1 className="font-display text-2xl font-bold text-white mt-4">Administration</h1>
          <p className="text-white/60 mt-1">Gestion des commerces et abonnements</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            type="password"
            placeholder="Code d'accès administrateur"
            className="w-full bg-white rounded-xl px-4 py-3 outline-none"
          />
          {erreur && <p className="text-sm text-red-200 bg-red-500/20 rounded-xl px-3 py-2">{erreur}</p>}
          <Button type="submit" fullWidth className="mt-2">Accéder au tableau de bord</Button>
        </form>
      </div>
    </div>
  );
}
