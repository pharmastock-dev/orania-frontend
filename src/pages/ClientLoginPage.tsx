import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import BackButton from "../components/BackButton";
import Button from "../components/Button";
import { loginClient } from "../api";
import { ApiError } from "../api/client";
import { stockerToken } from "../api/client";
import { useApp } from "../context/AppContext";
import { nettoyerTelephone } from "../utils/format";

export default function ClientLoginPage() {
  const navigate = useNavigate();
  const { client, setClient } = useApp();
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Déjà connecté (nom/tél en mémoire) → on ne redemande rien, direct sur l'accueil.
  // Seule une vraie déconnexion (bouton "Se déconnecter" dans Mon compte) doit
  // ramener ici avec un formulaire vide.
  useEffect(() => {
    if (client) navigate("/client/accueil", { replace: true });
  }, [client, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim() || !telephone.trim()) {
      setErreur("Merci de renseigner votre nom et votre numéro de téléphone.");
      return;
    }
    setLoading(true);
    setErreur(null);
    try {
      const res = await loginClient(nom.trim(), telephone.trim());
      if (res.token) stockerToken("client", res.token);
      setClient({ id: res.id, nom: res.nom, telephone: res.telephone });
      navigate("/client/accueil");
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  if (client) return null;

  return (
    <div className="min-h-screen bg-[var(--color-ink-50)] px-5 py-6">
      <div className="max-w-md mx-auto">
        <BackButton to="/" />

        <div className="flex flex-col items-center text-center mt-10">
          <Logo size={64} />
          <h1 className="font-display text-2xl font-bold text-[var(--color-navy-900)] mt-4">Bienvenue sur QREEB</h1>
          <p className="text-[var(--color-ink-500)] mt-1">Connectez-vous pour commander</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-ink-700)] mb-1.5">Nom</label>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Votre nom"
              className="w-full bg-white border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none focus:border-[var(--color-orange-500)]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--color-ink-700)] mb-1.5">Numéro de téléphone</label>
            <input
              value={telephone}
              onChange={(e) => setTelephone(nettoyerTelephone(e.target.value))}
              placeholder="05XX XXX XXX"
              inputMode="tel"
              maxLength={14}
              className="w-full bg-white border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none focus:border-[var(--color-orange-500)]"
            />
          </div>

          {erreur && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{erreur}</p>}

          <Button type="submit" loading={loading} fullWidth className="mt-3">
            Continuer
          </Button>
        </form>
      </div>
    </div>
  );
}
