import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import BackButton from "../components/BackButton";
import Button from "../components/Button";
import { inscrireClient, connecterClient, demanderReinitialisationClient, reinitialiserMotDePasseClient } from "../api";
import { ApiError } from "../api/client";
import { stockerToken } from "../api/client";
import { useApp } from "../context/AppContext";
import { nettoyerTelephone } from "../utils/format";

type Mode = "connexion" | "inscription" | "mdp-oublie-email" | "mdp-oublie-code";

export default function ClientLoginPage() {
  const navigate = useNavigate();
  const { client, setClient } = useApp();
  const [mode, setMode] = useState<Mode>("connexion");

  // Connexion / inscription
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");

  // Mot de passe oublié
  const [emailOubli, setEmailOubli] = useState("");
  const [code, setCode] = useState("");
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");

  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Déjà connecté (jeton en mémoire) → on ne redemande rien, direct sur l'accueil.
  // Seule une vraie déconnexion (bouton "Se déconnecter" dans Mon compte) doit
  // ramener ici avec un formulaire vide.
  useEffect(() => {
    if (client) navigate("/client/accueil", { replace: true });
  }, [client, navigate]);

  function changerMode(m: Mode) {
    setMode(m);
    setErreur(null);
    setMessage(null);
  }

  async function handleConnexion(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !motDePasse) {
      setErreur("Merci de renseigner votre email et votre mot de passe.");
      return;
    }
    setLoading(true);
    setErreur(null);
    try {
      const res = await connecterClient(email.trim(), motDePasse);
      if (!res.succes || !res.id) {
        setErreur(res.message || "Email ou mot de passe incorrect.");
        return;
      }
      if (res.token) stockerToken("client", res.token);
      setClient({ id: res.id, nom: res.nom || "", telephone: res.telephone || "", email: res.email });
      navigate("/client/accueil");
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  async function handleInscription(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim() || !telephone.trim() || !email.trim() || !motDePasse) {
      setErreur("Merci de remplir tous les champs.");
      return;
    }
    if (motDePasse.length < 6) {
      setErreur("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setLoading(true);
    setErreur(null);
    try {
      const res = await inscrireClient({ nom: nom.trim(), telephone: telephone.trim(), email: email.trim(), mot_de_passe: motDePasse });
      if (!res.succes || !res.id) {
        setErreur(res.message || "Impossible de créer le compte.");
        return;
      }
      if (res.token) stockerToken("client", res.token);
      setClient({ id: res.id, nom: res.nom || nom.trim(), telephone: res.telephone || telephone.trim(), email: res.email || email.trim() });
      navigate("/client/accueil");
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemandeCode(e: React.FormEvent) {
    e.preventDefault();
    if (!emailOubli.trim()) {
      setErreur("Merci de renseigner votre email.");
      return;
    }
    setLoading(true);
    setErreur(null);
    try {
      const res = await demanderReinitialisationClient(emailOubli.trim());
      if (!res.succes) {
        setErreur(res.message || "Impossible d'envoyer le code.");
        return;
      }
      setMessage("Un code à 6 chiffres a été envoyé à votre adresse email.");
      setMode("mdp-oublie-code");
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReinitialiser(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !nouveauMotDePasse) {
      setErreur("Merci de renseigner le code reçu et votre nouveau mot de passe.");
      return;
    }
    if (nouveauMotDePasse.length < 6) {
      setErreur("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setLoading(true);
    setErreur(null);
    try {
      const res = await reinitialiserMotDePasseClient(emailOubli.trim(), code.trim(), nouveauMotDePasse);
      if (!res.succes) {
        setErreur(res.message || "Code invalide ou expiré.");
        return;
      }
      setEmail(emailOubli.trim());
      setMotDePasse("");
      setCode("");
      setNouveauMotDePasse("");
      setMessage("Mot de passe réinitialisé. Vous pouvez vous connecter.");
      setMode("connexion");
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

        {(mode === "connexion" || mode === "inscription") && (
          <div className="flex bg-white rounded-xl border border-[var(--color-ink-100)] p-1 mt-8">
            <button
              onClick={() => changerMode("connexion")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold ${
                mode === "connexion" ? "bg-[var(--color-orange-500)] text-white" : "text-[var(--color-ink-700)]"
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => changerMode("inscription")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold ${
                mode === "inscription" ? "bg-[var(--color-orange-500)] text-white" : "text-[var(--color-ink-700)]"
              }`}
            >
              Créer un compte
            </button>
          </div>
        )}

        {message && <p className="text-sm text-[var(--color-green-600)] bg-[var(--color-green-100)] rounded-xl px-3 py-2 mt-4">{message}</p>}

        {mode === "connexion" && (
          <form onSubmit={handleConnexion} className="mt-6 flex flex-col gap-3">
            <div>
              <label className="block text-sm font-semibold text-[var(--color-ink-700)] mb-1.5">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="vous@exemple.com"
                autoComplete="email"
                className="w-full bg-white border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none focus:border-[var(--color-orange-500)]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--color-ink-700)] mb-1.5">Mot de passe</label>
              <input
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-white border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none focus:border-[var(--color-orange-500)]"
              />
            </div>

            {erreur && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{erreur}</p>}

            <Button type="submit" loading={loading} fullWidth className="mt-2">
              Se connecter
            </Button>
            <button
              type="button"
              onClick={() => {
                setEmailOubli(email);
                changerMode("mdp-oublie-email");
              }}
              className="text-sm font-semibold text-[var(--color-navy-700)] text-center mt-1"
            >
              Mot de passe oublié ?
            </button>
          </form>
        )}

        {mode === "inscription" && (
          <form onSubmit={handleInscription} className="mt-6 flex flex-col gap-3">
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
            <div>
              <label className="block text-sm font-semibold text-[var(--color-ink-700)] mb-1.5">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="vous@exemple.com"
                autoComplete="email"
                className="w-full bg-white border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none focus:border-[var(--color-orange-500)]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--color-ink-700)] mb-1.5">Mot de passe</label>
              <input
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                type="password"
                placeholder="6 caractères minimum"
                autoComplete="new-password"
                className="w-full bg-white border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none focus:border-[var(--color-orange-500)]"
              />
            </div>

            {erreur && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{erreur}</p>}

            <Button type="submit" loading={loading} fullWidth className="mt-2">
              Créer mon compte
            </Button>
          </form>
        )}

        {mode === "mdp-oublie-email" && (
          <form onSubmit={handleDemandeCode} className="mt-6 flex flex-col gap-3">
            <p className="text-sm text-[var(--color-ink-500)]">Entrez votre email, un code à 6 chiffres vous sera envoyé.</p>
            <div>
              <label className="block text-sm font-semibold text-[var(--color-ink-700)] mb-1.5">Email</label>
              <input
                value={emailOubli}
                onChange={(e) => setEmailOubli(e.target.value)}
                type="email"
                placeholder="vous@exemple.com"
                autoComplete="email"
                autoFocus
                className="w-full bg-white border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none focus:border-[var(--color-orange-500)]"
              />
            </div>

            {erreur && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{erreur}</p>}

            <Button type="submit" loading={loading} fullWidth className="mt-2">
              Envoyer le code
            </Button>
            <button type="button" onClick={() => changerMode("connexion")} className="text-sm font-semibold text-[var(--color-navy-700)] text-center mt-1">
              Retour à la connexion
            </button>
          </form>
        )}

        {mode === "mdp-oublie-code" && (
          <form onSubmit={handleReinitialiser} className="mt-6 flex flex-col gap-3">
            <p className="text-sm text-[var(--color-ink-500)]">
              Code envoyé à <strong className="text-[var(--color-ink-900)]">{emailOubli}</strong>.
            </p>
            <div>
              <label className="block text-sm font-semibold text-[var(--color-ink-700)] mb-1.5">Code reçu par email</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                placeholder="123456"
                maxLength={6}
                autoFocus
                className="w-full bg-white border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none focus:border-[var(--color-orange-500)] tracking-[0.3em] text-center font-bold"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--color-ink-700)] mb-1.5">Nouveau mot de passe</label>
              <input
                value={nouveauMotDePasse}
                onChange={(e) => setNouveauMotDePasse(e.target.value)}
                type="password"
                placeholder="6 caractères minimum"
                autoComplete="new-password"
                className="w-full bg-white border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none focus:border-[var(--color-orange-500)]"
              />
            </div>

            {erreur && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{erreur}</p>}

            <Button type="submit" loading={loading} fullWidth className="mt-2">
              Réinitialiser le mot de passe
            </Button>
            <button type="button" onClick={() => changerMode("mdp-oublie-email")} className="text-sm font-semibold text-[var(--color-navy-700)] text-center mt-1">
              Renvoyer un code
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
