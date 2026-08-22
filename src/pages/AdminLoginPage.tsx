import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import BackButton from "../components/BackButton";
import Button from "../components/Button";
import { adminLogin, stockerTokenAdmin } from "../api";
import { ApiError } from "../api/client";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!motDePasse.trim()) {
      setErreur("Merci de saisir le mot de passe administrateur.");
      return;
    }
    setLoading(true);
    setErreur(null);
    try {
      const res = await adminLogin(motDePasse);
      if (!res.succes || !res.token) {
        setErreur(res.message || "Mot de passe incorrect.");
        return;
      }
      // Le vrai jeton signé HMAC, émis par le backend (admin_auth.py) —
      // plus jamais de vérification locale devinable côté client.
      stockerTokenAdmin(res.token);
      navigate("/admin/dashboard");
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
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
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            type="password"
            placeholder="Mot de passe administrateur"
            className="w-full bg-white rounded-xl px-4 py-3 outline-none"
          />
          {erreur && <p className="text-sm text-red-200 bg-red-500/20 rounded-xl px-3 py-2">{erreur}</p>}
          <Button type="submit" fullWidth loading={loading} className="mt-2">
            Accéder au tableau de bord
          </Button>
        </form>
      </div>
    </div>
  );
}
