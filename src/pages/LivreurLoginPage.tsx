import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bike, ArrowRight, Clock } from "lucide-react";
import Button from "../components/Button";
import { connexionLivreurMarketplace, inscriptionLivreurMarketplace } from "../api";
import { ApiError } from "../api/client";
import { stockerToken } from "../api/client";
import { useApp } from "../context/AppContext";
import { nettoyerTelephone } from "../utils/format";

type Mode = "connexion" | "inscription";

export default function LivreurLoginPage() {
  const navigate = useNavigate();
  const { livreurConnecte, setLivreurConnecte } = useApp();
  const [mode, setMode] = useState<Mode>("connexion");

  const [telephone, setTelephone] = useState("");
  const [motDePasse, setMotDePasse] = useState("");

  const [nom, setNom] = useState("");
  const [telInscription, setTelInscription] = useState("");
  const [motDePasseInscription, setMotDePasseInscription] = useState("");

  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enAttente, setEnAttente] = useState(false);

  useEffect(() => {
    if (livreurConnecte) navigate("/livreur/dashboard", { replace: true });
  }, [livreurConnecte, navigate]);

  if (livreurConnecte) return null;

  async function handleConnexion(e: React.FormEvent) {
    e.preventDefault();
    if (!telephone.trim() || !motDePasse) {
      setErreur("Merci de renseigner votre téléphone et votre mot de passe.");
      return;
    }
    setLoading(true);
    setErreur(null);
    try {
      const res = await connexionLivreurMarketplace(telephone.trim(), motDePasse);
      if (!res.succes || !res.id) {
        // Compte existant mais pas encore validé par l'admin — distinct
        // d'un simple mot de passe incorrect.
        if (res.en_attente) {
          setEnAttente(true);
        } else {
          setErreur(res.message || "Numéro de téléphone ou mot de passe incorrect.");
        }
        return;
      }
      if (res.token) stockerToken("livreur", res.token);
      setLivreurConnecte({ id: res.id, nom: res.nom!, telephone: res.telephone! });
      navigate("/livreur/dashboard");
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  async function handleInscription(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim() || !telInscription.trim() || !motDePasseInscription) {
      setErreur("Merci de remplir tous les champs, mot de passe compris.");
      return;
    }
    setLoading(true);
    setErreur(null);
    try {
      const res = await inscriptionLivreurMarketplace(nom.trim(), telInscription.trim(), motDePasseInscription);
      if (!res.succes) {
        setErreur(res.message || "Ce numéro est déjà inscrit.");
        return;
      }
      // Le compte est créé mais doit être validé par l'admin avant la
      // première connexion — même principe que pour un nouveau commerce.
      setEnAttente(true);
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  if (enAttente) {
    return (
      <div className="min-h-screen bg-[var(--color-navy-900)] flex items-center justify-center px-6">
        <div className="max-w-sm w-full bg-white rounded-2xl p-6 text-center">
          <Clock size={44} className="text-[var(--color-orange-500)] mx-auto" />
          <h1 className="font-display font-bold text-lg mt-3 text-[var(--color-ink-900)]">En attente de validation</h1>
          <p className="text-[var(--color-ink-500)] mt-2">
            Votre compte livreur doit être validé par l'administration avant de pouvoir commencer à livrer. Réessayez de vous connecter un peu plus tard.
          </p>
          <Button fullWidth className="mt-5" onClick={() => navigate("/")}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-navy-900)] px-5 py-6">
      <div className="max-w-md mx-auto">
        <button onClick={() => navigate("/")} className="h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center">
          ←
        </button>

        <div className="flex flex-col items-center text-center mt-8">
          <span className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center">
            <Bike size={28} className="text-[var(--color-navy-900)]" />
          </span>
          <h1 className="font-display text-2xl font-bold text-white mt-4">Espace livreur</h1>
          <p className="text-white/60 mt-1">{mode === "connexion" ? "Connectez-vous pour livrer" : "Créez votre compte livreur"}</p>
        </div>

        {mode === "connexion" ? (
          <form onSubmit={handleConnexion} className="mt-8 flex flex-col gap-3">
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1.5">Téléphone</label>
              <input
                value={telephone}
                onChange={(e) => setTelephone(nettoyerTelephone(e.target.value))}
                placeholder="05XX XXX XXX"
                inputMode="tel"
                maxLength={14}
                className="w-full bg-white rounded-xl px-4 py-3 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1.5">Mot de passe</label>
              <input
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                type="password"
                placeholder="••••••••"
                className="w-full bg-white rounded-xl px-4 py-3 outline-none"
              />
            </div>

            {erreur && <p className="text-sm text-red-200 bg-red-500/20 rounded-xl px-3 py-2">{erreur}</p>}

            <Button type="submit" loading={loading} fullWidth icon={<ArrowRight size={15} />} className="mt-2">
              Se connecter
            </Button>

            <button
              type="button"
              onClick={() => { setMode("inscription"); setErreur(null); }}
              className="text-center text-sm text-white/70 hover:text-white mt-3"
            >
              Pas encore de compte ? <span className="font-semibold underline">Inscrivez-vous</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleInscription} className="mt-8 flex flex-col gap-3">
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1.5">Nom complet</label>
              <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Votre nom" className="w-full bg-white rounded-xl px-4 py-3 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1.5">Téléphone</label>
              <input
                value={telInscription}
                onChange={(e) => setTelInscription(nettoyerTelephone(e.target.value))}
                placeholder="05XX XXX XXX"
                inputMode="tel"
                maxLength={14}
                className="w-full bg-white rounded-xl px-4 py-3 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1.5">Mot de passe</label>
              <input
                value={motDePasseInscription}
                onChange={(e) => setMotDePasseInscription(e.target.value)}
                type="password"
                placeholder="Choisissez un mot de passe"
                className="w-full bg-white rounded-xl px-4 py-3 outline-none"
              />
            </div>

            {erreur && <p className="text-sm text-red-200 bg-red-500/20 rounded-xl px-3 py-2">{erreur}</p>}

            <Button type="submit" loading={loading} fullWidth icon={<ArrowRight size={15} />} className="mt-2">
              Créer mon compte
            </Button>

            <button
              type="button"
              onClick={() => { setMode("connexion"); setErreur(null); }}
              className="text-center text-sm text-white/70 hover:text-white mt-3"
            >
              Déjà inscrit ? <span className="font-semibold underline">Se connecter</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
