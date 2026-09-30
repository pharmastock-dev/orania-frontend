import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, AlertTriangle, Store, Bell, Ban, Play, Plus, Flag, Check, KeyRound, Search, Trash2, Bike, RefreshCw } from "lucide-react";
import DashboardHeader from "../components/DashboardHeader";
import { CardSkeleton } from "../components/Loading";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { useToast } from "../context/ToastContext";
import {
  getFournisseursAdmin,
  validerFournisseur,
  prolongerAbonnement,
  desactiverFournisseur,
  reactiverFournisseur,
  reinitialiserMotDePasse,
  supprimerFournisseurAdmin,
  effacerTokenAdmin,
  estConnecteAdmin,
  getReclamations,
  traiterReclamation,
  supprimerReclamation,
  adminListeLivreursMarketplace,
  adminValiderLivreurMarketplace,
  adminProlongerAbonnementLivreur,
  adminSupprimerLivreurMarketplace,
  adminReinitialiserMotDePasseLivreur,
} from "../api";
import { ApiError } from "../api/client";
import { getCategorieLabel } from "../utils/categories";
import type { Fournisseur, Reclamation, LivreurMarketplaceAdmin } from "../types";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [livreursMarketplace, setLivreursMarketplace] = useState<LivreurMarketplaceAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [actionEnCours, setActionEnCours] = useState<number | null>(null);
  const [suppressionCommerce, setSuppressionCommerce] = useState<Fournisseur | null>(null);
  const [suppressionLivreur, setSuppressionLivreur] = useState<LivreurMarketplaceAdmin | null>(null);
  const [rechercheCommerce, setRechercheCommerce] = useState("");
  const [rechercheDemandeCommerce, setRechercheDemandeCommerce] = useState("");
  const [rechercheDemandeLivreur, setRechercheDemandeLivreur] = useState("");
  const [rechercheLivreur, setRechercheLivreur] = useState("");
  // Tri des listes "actifs" : par date de début (date_creation) ou de fin
  // d'abonnement (abonnement_fin), toujours du plus récent au plus ancien.
  const [triCommerce, setTriCommerce] = useState<"debut" | "fin">("fin");
  const [triLivreur, setTriLivreur] = useState<"debut" | "fin">("fin");
  // 4 sections regroupées en onglets (une seule affichée à la fois) au lieu
  // d'une longue page qui scrolle.
  type Onglet = "demandesCommerces" | "commerces" | "demandesLivreurs" | "livreurs";
  const [onglet, setOnglet] = useState<Onglet>("demandesCommerces");

  function charger() {
    setLoading(true);
    Promise.allSettled([getFournisseursAdmin(), getReclamations(), adminListeLivreursMarketplace()]).then(([f, r, l]) => {
      if (f.status === "fulfilled") setFournisseurs(f.value);
      else setErreur(f.reason instanceof ApiError ? f.reason.message : "Impossible de charger les commerces.");
      if (r.status === "fulfilled") setReclamations(r.value);
      if (l.status === "fulfilled") setLivreursMarketplace(l.value);
      setLoading(false);
    });
  }

  async function handleValiderLivreur(l: LivreurMarketplaceAdmin) {
    setActionEnCours(l.id);
    try {
      const res = await adminValiderLivreurMarketplace(l.id);
      setLivreursMarketplace((prev) => prev.map((x) => (x.id === l.id ? { ...x, valide: true, abonnement_fin: res.abonnement_fin ?? x.abonnement_fin } : x)));
      showToast(`${l.nom} activé pour 1 an — en haut de la liste des livreurs actifs.`, "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible de valider ce livreur.", "error");
    } finally {
      setActionEnCours(null);
    }
  }

  async function handleProlongerLivreur(l: LivreurMarketplaceAdmin) {
    setActionEnCours(l.id);
    try {
      const res = await adminProlongerAbonnementLivreur(l.id);
      setLivreursMarketplace((prev) => prev.map((x) => (x.id === l.id ? { ...x, valide: true, abonnement_fin: res.abonnement_fin ?? x.abonnement_fin } : x)));
      showToast(`Abonnement de ${l.nom} prolongé d'1 an.`, "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible de prolonger cet abonnement.", "error");
    } finally {
      setActionEnCours(null);
    }
  }

  // Rejeter une demande d'inscription livreur (pas encore validée) — plus
  // léger qu'une suppression définitive, pas besoin de la modale de confirmation.
  async function handleRejeterDemandeLivreur(l: LivreurMarketplaceAdmin) {
    if (!window.confirm(`Rejeter la demande d'inscription de "${l.nom}" ?`)) return;
    setActionEnCours(l.id);
    try {
      await adminSupprimerLivreurMarketplace(l.id);
      setLivreursMarketplace((prev) => prev.filter((x) => x.id !== l.id));
      showToast(`Demande de ${l.nom} rejetée.`, "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible de rejeter cette demande.", "error");
    } finally {
      setActionEnCours(null);
    }
  }

  async function handleSupprimerLivreur() {
    if (!suppressionLivreur) return;
    setActionEnCours(suppressionLivreur.id);
    try {
      await adminSupprimerLivreurMarketplace(suppressionLivreur.id);
      setLivreursMarketplace((prev) => prev.filter((x) => x.id !== suppressionLivreur.id));
      showToast("Livreur supprimé.", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible de supprimer ce livreur.", "error");
    } finally {
      setActionEnCours(null);
      setSuppressionLivreur(null);
    }
  }

  // Le vrai backend exige que l'admin choisisse lui-même le nouveau mot de
  // passe (pas de génération automatique côté serveur) — même logique que
  // handleReinitialiserMdp pour les commerces.
  async function handleReinitialiserMdpLivreur(l: LivreurMarketplaceAdmin) {
    const nouveau = window.prompt(`Nouveau mot de passe pour "${l.nom}" :`, "");
    if (!nouveau || !nouveau.trim()) return;
    setActionEnCours(l.id);
    try {
      await adminReinitialiserMotDePasseLivreur(l.id, nouveau.trim());
      showToast(`Mot de passe de ${l.nom} réinitialisé — communique-le lui : ${nouveau.trim()}`, "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible de réinitialiser le mot de passe.", "error");
    } finally {
      setActionEnCours(null);
    }
  }


  async function handleTraiter(r: Reclamation) {
    if (!r.id) return;
    try {
      await traiterReclamation(r.id);
      setReclamations((prev) => prev.map((x) => (x.id === r.id ? { ...x, traitee: true } : x)));
      showToast("Réclamation marquée comme traitée", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible de mettre à jour la réclamation.", "error");
    }
  }

  async function handleSupprimerReclamation(r: Reclamation) {
    if (!r.id) return;
    try {
      await supprimerReclamation(r.id);
      setReclamations((prev) => prev.filter((x) => x.id !== r.id));
      showToast("Réclamation supprimée", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible de supprimer la réclamation.", "error");
    }
  }

  useEffect(() => {
    if (!estConnecteAdmin()) {
      navigate("/admin");
      return;
    }
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  function handleLogout() {
    effacerTokenAdmin();
    navigate("/");
  }

  // Réclamations : toujours la plus récente en premier (seule date dispo : date_creation).
  function parDateRecente<T extends { date_creation?: string | null }>(a: T, b: T) {
    return (b.date_creation || "").localeCompare(a.date_creation || "");
  }
  const reclamationsCommercants = reclamations.filter((r) => r.type_auteur !== "client").sort(parDateRecente);
  const reclamationsClients = reclamations.filter((r) => r.type_auteur === "client").sort(parDateRecente);

  // Recherche par nom (+ téléphone/adresse quand dispo) — appliquée après le
  // tri chronologique, indépendamment dans chacune des 4 sections/onglets.
  function correspond(recherche: string, ...valeurs: (string | null | undefined)[]) {
    if (!recherche.trim()) return true;
    const q = recherche.trim().toLowerCase();
    return valeurs.some((v) => (v || "").toLowerCase().includes(q));
  }

  const livreursEnAttenteToutes = livreursMarketplace.filter((l) => !l.valide).sort(parDateRecente);
  const livreursEnAttente = livreursEnAttenteToutes.filter((l) => correspond(rechercheDemandeLivreur, l.nom, l.telephone));

  const livreursValidesToutes = livreursMarketplace
    .filter((l) => l.valide)
    .sort((a, b) => {
      const champ = triLivreur === "debut" ? "date_creation" : "abonnement_fin";
      return ((b as any)[champ] || "").localeCompare((a as any)[champ] || "");
    });
  const livreursValides = livreursValidesToutes.filter((l) => correspond(rechercheLivreur, l.nom, l.telephone));

  const demandesToutes = fournisseurs.filter((f) => f.valide === false).sort(parDateRecente);
  const demandes = demandesToutes.filter((d) => correspond(rechercheDemandeCommerce, d.nom, d.telephone, d.adresse));

  const commercesValidesToutes = fournisseurs
    .filter((f) => f.valide !== false)
    .sort((a, b) => {
      // Tri configurable : date de début (date_creation) ou de fin (abonnement_fin)
      // d'abonnement, toujours du plus récent au plus ancien.
      const champ = triCommerce === "debut" ? "date_creation" : "abonnement_fin";
      const va = (a as any)[champ] as string | null | undefined;
      const vb = (b as any)[champ] as string | null | undefined;
      if (!va && !vb) return b.id - a.id;
      if (!va) return 1;
      if (!vb) return -1;
      return new Date(vb).getTime() - new Date(va).getTime();
    });
  const commercesValides = commercesValidesToutes.filter((f) => correspond(rechercheCommerce, f.nom, f.telephone, f.adresse));

  function estExpire(f: Fournisseur) {
    return f.abonnement_fin ? new Date(f.abonnement_fin) < new Date() : true;
  }

  async function handleValider(f: Fournisseur) {
    setActionEnCours(f.id);
    try {
      const res = await validerFournisseur(f.id);
      setFournisseurs((prev) => prev.map((x) => (x.id === f.id ? { ...x, valide: true, actif: true, abonnement_fin: res.abonnement_fin } : x)));
      showToast(`${f.nom} activé pour 1 an — en haut de la liste des commerces.`, "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible de valider ce commerce.", "error");
    } finally {
      setActionEnCours(null);
    }
  }

  // Rejeter une demande d'inscription commerce (pas encore validée) — plus
  // léger qu'une suppression définitive, pas besoin de la modale de confirmation.
  async function handleRejeterDemandeCommerce(f: Fournisseur) {
    if (!window.confirm(`Rejeter la demande d'inscription de "${f.nom}" ?`)) return;
    setActionEnCours(f.id);
    try {
      await supprimerFournisseurAdmin(f.id);
      setFournisseurs((prev) => prev.filter((x) => x.id !== f.id));
      showToast(`Demande de ${f.nom} rejetée.`, "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible de rejeter cette demande.", "error");
    } finally {
      setActionEnCours(null);
    }
  }

  async function handleProlonger(f: Fournisseur) {
    setActionEnCours(f.id);
    try {
      const res = await prolongerAbonnement(f.id);
      setFournisseurs((prev) => prev.map((x) => (x.id === f.id ? { ...x, abonnement_fin: res.abonnement_fin, actif: true } : x)));
      showToast(`Abonnement de ${f.nom} prolongé d'un an`, "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible de prolonger l'abonnement.", "error");
    } finally {
      setActionEnCours(null);
    }
  }

  async function handleToggleActif(f: Fournisseur) {
    setActionEnCours(f.id);
    try {
      if (f.actif === false) {
        const res = await reactiverFournisseur(f.id);
        setFournisseurs((prev) => prev.map((x) => (x.id === f.id ? { ...x, actif: true, abonnement_fin: res.abonnement_fin } : x)));
        showToast(`${f.nom} réactivé`, "success");
      } else {
        await desactiverFournisseur(f.id);
        setFournisseurs((prev) => prev.map((x) => (x.id === f.id ? { ...x, actif: false, abonnement_fin: null } : x)));
        showToast(`${f.nom} désactivé`, "success");
      }
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible de mettre à jour le commerce.", "error");
    } finally {
      setActionEnCours(null);
    }
  }

  // Le vrai backend exige que l'admin choisisse lui-même le nouveau mot de
  // passe (pas de génération automatique côté serveur).
  async function handleReinitialiserMdp(f: Fournisseur) {
    const nouveau = window.prompt(`Nouveau mot de passe pour "${f.nom}" :`, "");
    if (!nouveau || !nouveau.trim()) return;
    setActionEnCours(f.id);
    try {
      await reinitialiserMotDePasse(f.id, nouveau.trim());
      showToast(`Mot de passe de ${f.nom} réinitialisé — communique-le lui : ${nouveau.trim()}`, "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible de réinitialiser le mot de passe.", "error");
    } finally {
      setActionEnCours(null);
    }
  }

  async function handleSupprimer() {
    if (!suppressionCommerce) return;
    setActionEnCours(suppressionCommerce.id);
    try {
      await supprimerFournisseurAdmin(suppressionCommerce.id);
      setFournisseurs((prev) => prev.filter((x) => x.id !== suppressionCommerce.id));
      showToast(`${suppressionCommerce.nom} supprimé définitivement`, "success");
      setSuppressionCommerce(null);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible de supprimer ce commerce.", "error");
    } finally {
      setActionEnCours(null);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-ink-50)] pb-10">
      <div className="h-2 bg-[var(--color-navy-900)]" />
      <div className="max-w-3xl mx-auto px-4 pt-5">
        <DashboardHeader
          title="Administration"
          subtitle="Gestion des commerces"
          actions={
            <button
              onClick={handleLogout}
              className="flex items-center justify-center h-10 w-10 text-red-500 bg-white border border-[var(--color-ink-100)] rounded-xl"
              title="Se déconnecter"
            >
              <LogOut size={16} />
            </button>
          }
        />

        {erreur && (
          <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-3.5 py-3 mt-4">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{erreur}</span>
          </div>
        )}

        {/* ---------- Réclamations commerçants ---------- */}
        <div className="flex items-center gap-2 mt-6 mb-3">
          <Flag size={16} className="text-[var(--color-ink-500)]" />
          <p className="font-bold text-[var(--color-ink-900)]">Réclamations commerçants</p>
          {reclamationsCommercants.filter((r) => !r.traitee).length > 0 && (
            <span className="h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
              {reclamationsCommercants.filter((r) => !r.traitee).length}
            </span>
          )}
        </div>
        {loading ? (
          <CardSkeleton />
        ) : reclamationsCommercants.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[var(--color-ink-100)] p-4 text-sm text-[var(--color-ink-500)]">Aucune réclamation commerçant</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {reclamationsCommercants.map((r) => (
              <div key={r.id} className={`bg-white rounded-2xl border p-4 ${r.traitee ? "border-[var(--color-ink-100)] opacity-70" : "border-2 border-red-200"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-ink-500)]">🏪 {r.auteur_nom || `#${r.auteur_id}`}</p>
                    {r.auteur_telephone && (
                      <a href={`tel:${r.auteur_telephone}`} className="text-xs text-blue-600 hover:underline">📞 {r.auteur_telephone}</a>
                    )}
                  </div>
                  <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${r.traitee ? "bg-[var(--color-green-100)] text-[var(--color-green-600)]" : "bg-[var(--color-orange-100)] text-[var(--color-orange-600)]"}`}>
                    {r.traitee ? "Traitée" : "En attente"}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-ink-700)] mt-2 whitespace-pre-line">{r.message}</p>
                {r.date_creation && <p className="text-xs text-[var(--color-ink-500)] mt-1">{new Date(r.date_creation).toLocaleString("fr-FR")}</p>}
                <div className="flex gap-2 mt-3">
                  {!r.traitee && (
                    <button onClick={() => handleTraiter(r)} className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-green-600)]">
                      <Check size={13} /> Marquer comme traitée
                    </button>
                  )}
                  <button onClick={() => handleSupprimerReclamation(r)} className="flex items-center gap-1.5 text-xs font-semibold text-red-500 ml-auto">
                    <Trash2 size={13} /> Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ---------- Réclamations clients ---------- */}
        <div className="flex items-center gap-2 mt-7 mb-3">
          <Flag size={16} className="text-[var(--color-ink-500)]" />
          <p className="font-bold text-[var(--color-ink-900)]">Réclamations clients</p>
          {reclamationsClients.filter((r) => !r.traitee).length > 0 && (
            <span className="h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
              {reclamationsClients.filter((r) => !r.traitee).length}
            </span>
          )}
        </div>
        {loading ? (
          <CardSkeleton />
        ) : reclamationsClients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[var(--color-ink-100)] p-4 text-sm text-[var(--color-ink-500)]">Aucune réclamation client</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {reclamationsClients.map((r) => (
              <div key={r.id} className={`bg-white rounded-2xl border p-4 ${r.traitee ? "border-[var(--color-ink-100)] opacity-70" : "border-2 border-red-200"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-ink-500)]">👤 {r.auteur_nom || `#${r.auteur_id}`}</p>
                    {r.auteur_telephone && (
                      <a href={`tel:${r.auteur_telephone}`} className="text-xs text-blue-600 hover:underline">📞 {r.auteur_telephone}</a>
                    )}
                  </div>
                  <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${r.traitee ? "bg-[var(--color-green-100)] text-[var(--color-green-600)]" : "bg-[var(--color-orange-100)] text-[var(--color-orange-600)]"}`}>
                    {r.traitee ? "Traitée" : "En attente"}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-ink-700)] mt-2 whitespace-pre-line">{r.message}</p>
                {r.date_creation && <p className="text-xs text-[var(--color-ink-500)] mt-1">{new Date(r.date_creation).toLocaleString("fr-FR")}</p>}
                <div className="flex gap-2 mt-3">
                  {!r.traitee && (
                    <button onClick={() => handleTraiter(r)} className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-green-600)]">
                      <Check size={13} /> Marquer comme traitée
                    </button>
                  )}
                  <button onClick={() => handleSupprimerReclamation(r)} className="flex items-center gap-1.5 text-xs font-semibold text-red-500 ml-auto">
                    <Trash2 size={13} /> Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ---------- Onglets : Inscriptions commerces / Commerces / Inscriptions livreurs / Livreurs actifs ---------- */}
        <div className="flex flex-wrap gap-2 mt-7 mb-5">
          {([
            { id: "demandesCommerces", label: "Inscriptions commerces", count: demandesToutes.length },
            { id: "commerces", label: "Commerces", count: commercesValidesToutes.length },
            { id: "demandesLivreurs", label: "Inscriptions livreurs", count: livreursEnAttenteToutes.length },
            { id: "livreurs", label: "Livreurs actifs", count: livreursValidesToutes.length },
          ] as { id: Onglet; label: string; count: number }[]).map((o) => (
            <button
              key={o.id}
              onClick={() => setOnglet(o.id)}
              className={`flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-xl ${onglet === o.id ? "bg-[var(--color-navy-900)] text-white" : "bg-white border border-[var(--color-ink-100)] text-[var(--color-ink-700)]"}`}
            >
              {o.label}
              {o.count > 0 && (
                <span className={`h-5 min-w-5 px-1 rounded-full text-xs font-bold flex items-center justify-center ${onglet === o.id ? "bg-white/20 text-white" : "bg-red-500 text-white"}`}>
                  {o.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ---------- Inscriptions commerces (en attente) ---------- */}
        {onglet === "demandesCommerces" && (
        <>
        <div className="flex items-center gap-2 mt-1 mb-3">
          <Bell size={16} className="text-[var(--color-ink-500)]" />
          <p className="font-bold text-[var(--color-ink-900)]">Inscriptions commerces</p>
          {demandes.length > 0 && (
            <span className="h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">{demandes.length}</span>
          )}
        </div>

        <div className="flex items-center gap-2 bg-white border border-[var(--color-ink-100)] rounded-xl px-3.5 py-2.5 mb-3">
          <Search size={16} className="text-[var(--color-ink-500)] shrink-0" />
          <input
            value={rechercheDemandeCommerce}
            onChange={(e) => setRechercheDemandeCommerce(e.target.value)}
            placeholder="Chercher une demande (nom, téléphone, adresse)..."
            className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-[var(--color-ink-500)]"
          />
        </div>

        {loading ? (
          <CardSkeleton />
        ) : demandes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[var(--color-ink-100)] p-4 text-sm text-[var(--color-ink-500)]">Aucune demande en attente</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {demandes.map((d) => (
              <div key={d.id} className="bg-white rounded-2xl border-2 border-[var(--color-orange-400)] p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-[var(--color-ink-900)]">{d.nom}</p>
                    <p className="text-sm text-[var(--color-ink-500)]">{d.telephone} · {d.adresse}</p>
                    {d.date_creation && (
                      <p className="text-xs text-[var(--color-ink-500)] mt-0.5">
                        Reçue le {new Date(d.date_creation).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[var(--color-orange-100)] text-[var(--color-orange-600)]">En attente</span>
                </div>
                {d.categorie && <span className="inline-block mt-2 text-xs font-medium px-2 py-1 rounded-full bg-[var(--color-ink-100)] text-[var(--color-ink-700)]">{getCategorieLabel(d.categorie)}</span>}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => handleValider(d)}
                    disabled={actionEnCours === d.id}
                    className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-[var(--color-green-500)] hover:bg-[var(--color-green-600)] rounded-xl px-3 py-2.5 disabled:opacity-60"
                    title="Le commerce devient membre inscrit sur QREEB, visible par les clients, qui peuvent commander dans son menu"
                  >
                    <Check size={14} /> Valider
                  </button>
                  <button
                    onClick={() => handleRejeterDemandeCommerce(d)}
                    disabled={actionEnCours === d.id}
                    className="flex items-center justify-center gap-1 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl px-3 py-2.5 disabled:opacity-60 border border-red-200"
                  >
                    <Trash2 size={14} /> Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </>
        )}

        {/* ---------- Commerces actifs (gestion) ---------- */}
        {onglet === "commerces" && (
        <>
        <div className="flex items-center gap-2 mt-1 mb-3">
          <Store size={16} className="text-[var(--color-ink-500)]" />
          <p className="font-bold text-[var(--color-ink-900)]">Commerces ({commercesValides.length})</p>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-[var(--color-ink-500)]">Trier par :</span>
          <button
            onClick={() => setTriCommerce("debut")}
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${triCommerce === "debut" ? "bg-[var(--color-navy-900)] text-white" : "bg-[var(--color-ink-100)] text-[var(--color-ink-700)]"}`}
          >
            Début d'abonnement
          </button>
          <button
            onClick={() => setTriCommerce("fin")}
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${triCommerce === "fin" ? "bg-[var(--color-navy-900)] text-white" : "bg-[var(--color-ink-100)] text-[var(--color-ink-700)]"}`}
          >
            Fin d'abonnement
          </button>
        </div>

        <div className="flex items-center gap-2 bg-white border border-[var(--color-ink-100)] rounded-xl px-3.5 py-2.5 mb-3">
          <Search size={16} className="text-[var(--color-ink-500)] shrink-0" />
          <input
            value={rechercheCommerce}
            onChange={(e) => setRechercheCommerce(e.target.value)}
            placeholder="Chercher un commerce (nom, téléphone, adresse)..."
            className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-[var(--color-ink-500)]"
          />
        </div>

        <div className="flex flex-col gap-2.5">
          {loading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : commercesValides.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[var(--color-ink-100)] p-4 text-sm text-[var(--color-ink-500)]">Aucun commerce</div>
          ) : (
            commercesValides.map((f) => {
              const expire = estExpire(f);
              return (
                <div key={f.id} className="bg-white rounded-2xl border border-[var(--color-ink-100)] p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-[var(--color-ink-900)]">{f.nom} <span className="text-[var(--color-ink-300)] font-normal">#{f.id}</span></p>
                      <p className="text-sm text-[var(--color-ink-500)]">{f.telephone}</p>
                      {f.adresse && <p className="text-xs text-[var(--color-ink-500)] mt-0.5">{f.adresse}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {f.categorie && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-ink-100)] text-[var(--color-ink-700)]">{getCategorieLabel(f.categorie)}</span>}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${expire ? "bg-red-50 text-red-600" : "bg-[var(--color-green-100)] text-[var(--color-green-600)]"}`}>
                        {expire ? "🔴 Expiré / inactif" : `🟢 Actif → ${f.abonnement_fin ? new Date(f.abonnement_fin).toLocaleDateString("fr-FR") : ""}`}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <button
                      onClick={() => handleProlonger(f)}
                      disabled={actionEnCours === f.id}
                      className="flex items-center justify-center gap-1 text-xs font-semibold px-2 py-2 rounded-lg bg-[var(--color-green-100)] text-[var(--color-green-600)] disabled:opacity-60"
                    >
                      <Plus size={13} /> 1 an
                    </button>
                    <button
                      onClick={() => handleValider(f)}
                      disabled={actionEnCours === f.id}
                      className="flex items-center justify-center gap-1 text-xs font-semibold px-2 py-2 rounded-lg bg-blue-50 text-blue-700 disabled:opacity-60"
                      title="Repart à zéro : abonnement fixé à aujourd'hui + 1 an, même s'il est actif depuis longtemps"
                    >
                      <RefreshCw size={13} /> Réinit.
                    </button>
                    <button
                      onClick={() => handleToggleActif(f)}
                      disabled={actionEnCours === f.id}
                      className={`flex items-center justify-center gap-1 text-xs font-semibold px-2 py-2 rounded-lg disabled:opacity-60 ${f.actif === false ? "bg-[var(--color-green-100)] text-[var(--color-green-600)]" : "bg-red-50 text-red-600"}`}
                    >
                      {f.actif === false ? <><Play size={13} /> Activer</> : <><Ban size={13} /> Stop</>}
                    </button>
                    <button
                      onClick={() => handleReinitialiserMdp(f)}
                      disabled={actionEnCours === f.id}
                      className="flex items-center justify-center gap-1 text-xs font-semibold px-2 py-2 rounded-lg bg-[var(--color-ink-100)] text-[var(--color-ink-700)] disabled:opacity-60"
                    >
                      <KeyRound size={13} /> Mdp
                    </button>
                    <button
                      onClick={() => setSuppressionCommerce(f)}
                      disabled={actionEnCours === f.id}
                      className="flex items-center justify-center gap-1 text-xs font-semibold px-2 py-2 rounded-lg bg-red-50 text-red-600 disabled:opacity-60"
                    >
                      <Trash2 size={13} /> Suppr.
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        </>
        )}
      </div>

      {/* ---------- Inscriptions livreurs (en attente) ---------- */}
      <div className="max-w-3xl mx-auto px-4">
        {onglet === "demandesLivreurs" && (
        <>
        <div className="flex items-center gap-2 mt-1 mb-3">
          <Bike size={16} className="text-[var(--color-ink-500)]" />
          <p className="font-bold text-[var(--color-ink-900)]">Inscriptions livreurs</p>
          {livreursEnAttente.length > 0 && (
            <span className="h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
              {livreursEnAttente.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 bg-white border border-[var(--color-ink-100)] rounded-xl px-3.5 py-2.5 mb-3">
          <Search size={16} className="text-[var(--color-ink-500)] shrink-0" />
          <input
            value={rechercheDemandeLivreur}
            onChange={(e) => setRechercheDemandeLivreur(e.target.value)}
            placeholder="Chercher une demande (nom, téléphone)..."
            className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-[var(--color-ink-500)]"
          />
        </div>

        {livreursEnAttente.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[var(--color-ink-100)] p-4 text-sm text-[var(--color-ink-500)]">Aucune inscription livreur en attente</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {livreursEnAttente.map((l) => (
              <div key={l.id} className="bg-white rounded-2xl border-2 border-[var(--color-orange-400)] p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-[var(--color-ink-900)]">{l.nom}</p>
                    <p className="text-sm text-[var(--color-ink-500)]">{l.telephone}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[var(--color-orange-100)] text-[var(--color-orange-600)]">En attente</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleValiderLivreur(l)}
                    disabled={actionEnCours === l.id}
                    className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-[var(--color-green-500)] hover:bg-[var(--color-green-600)] rounded-xl px-3 py-2.5 disabled:opacity-60"
                    title="Le livreur devient membre inscrit sur QREEB, visible par les clients"
                  >
                    <Check size={14} /> Valider
                  </button>
                  <button
                    onClick={() => handleRejeterDemandeLivreur(l)}
                    disabled={actionEnCours === l.id}
                    className="flex items-center justify-center gap-1 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl px-3 py-2.5 disabled:opacity-60 border border-red-200"
                  >
                    <Trash2 size={14} /> Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </>
        )}

        {/* ---------- Livreurs actifs (gestion) ---------- */}
        {onglet === "livreurs" && (
        <>
        <div className="flex items-center gap-2 mt-1 mb-3">
          <Bike size={16} className="text-[var(--color-ink-500)]" />
          <p className="font-bold text-[var(--color-ink-900)]">Livreurs actifs ({livreursValides.length})</p>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-[var(--color-ink-500)]">Trier par :</span>
          <button
            onClick={() => setTriLivreur("debut")}
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${triLivreur === "debut" ? "bg-[var(--color-navy-900)] text-white" : "bg-[var(--color-ink-100)] text-[var(--color-ink-700)]"}`}
          >
            Début d'abonnement
          </button>
          <button
            onClick={() => setTriLivreur("fin")}
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${triLivreur === "fin" ? "bg-[var(--color-navy-900)] text-white" : "bg-[var(--color-ink-100)] text-[var(--color-ink-700)]"}`}
          >
            Fin d'abonnement
          </button>
        </div>

        <div className="flex items-center gap-2 bg-white border border-[var(--color-ink-100)] rounded-xl px-3.5 py-2.5 mb-3">
          <Search size={16} className="text-[var(--color-ink-500)] shrink-0" />
          <input
            value={rechercheLivreur}
            onChange={(e) => setRechercheLivreur(e.target.value)}
            placeholder="Chercher un livreur (nom, téléphone)..."
            className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-[var(--color-ink-500)]"
          />
        </div>

        {livreursValides.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-500)]">Aucun livreur actif pour l'instant.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {livreursValides.map((l) => (
              <div key={l.id} className="bg-white rounded-xl border border-[var(--color-ink-100)] p-3.5">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-[var(--color-ink-900)] truncate">{l.nom}</p>
                  {l.en_ligne ? (
                    <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">En ligne</span>
                  ) : (
                    <span className="text-[10px] font-bold text-[var(--color-ink-500)] bg-[var(--color-ink-100)] px-1.5 py-0.5 rounded-full">Hors ligne</span>
                  )}
                </div>
                <p className="text-xs text-[var(--color-ink-500)]">{l.telephone}</p>
                {l.abonnement_fin && (
                  <p className="text-[11px] text-[var(--color-ink-500)] mt-0.5">
                    Abonnement jusqu'au {new Date(l.abonnement_fin).toLocaleDateString("fr-FR")}
                  </p>
                )}
                <div className="grid grid-cols-4 gap-2 mt-3">
                  <button
                    onClick={() => handleProlongerLivreur(l)}
                    disabled={actionEnCours === l.id}
                    className="flex items-center justify-center gap-1 text-xs font-semibold px-2 py-2 rounded-lg bg-blue-50 text-blue-700 disabled:opacity-60"
                    title="Prolonger l'abonnement d'1 an"
                  >
                    <Plus size={13} /> +1 an
                  </button>
                  <button
                    onClick={() => handleValiderLivreur(l)}
                    disabled={actionEnCours === l.id}
                    className="flex items-center justify-center gap-1 text-xs font-semibold px-2 py-2 rounded-lg bg-[var(--color-green-100)] text-[var(--color-green-600)] disabled:opacity-60"
                    title="Repart à zéro : abonnement fixé à aujourd'hui + 1 an, même s'il est actif depuis longtemps"
                  >
                    <RefreshCw size={13} /> Réinit.
                  </button>
                  <button
                    onClick={() => handleReinitialiserMdpLivreur(l)}
                    disabled={actionEnCours === l.id}
                    className="flex items-center justify-center gap-1 text-xs font-semibold px-2 py-2 rounded-lg bg-[var(--color-ink-100)] text-[var(--color-ink-700)] disabled:opacity-60"
                  >
                    <KeyRound size={13} /> Mdp
                  </button>
                  <button
                    onClick={() => setSuppressionLivreur(l)}
                    disabled={actionEnCours === l.id}
                    className="flex items-center justify-center gap-1 text-xs font-semibold px-2 py-2 rounded-lg bg-red-50 text-red-600 disabled:opacity-60"
                  >
                    <Trash2 size={13} /> Suppr.
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </>
        )}
      </div>

      <Modal open={!!suppressionCommerce} onClose={() => setSuppressionCommerce(null)} title="Supprimer ce commerce ?">
        {suppressionCommerce && (
          <div>
            <p className="text-sm text-[var(--color-ink-700)] mb-4">
              <strong>{suppressionCommerce.nom}</strong> et tous ses produits/livreurs seront supprimés définitivement. Les commandes et avis passés restent conservés pour l'historique. Cette action est irréversible.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={() => setSuppressionCommerce(null)}>Annuler</Button>
              <Button variant="danger" fullWidth loading={actionEnCours === suppressionCommerce.id} onClick={handleSupprimer}>Supprimer</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!suppressionLivreur} onClose={() => setSuppressionLivreur(null)} title="Supprimer ce livreur ?">
        {suppressionLivreur && (
          <div>
            <p className="text-sm text-[var(--color-ink-700)] mb-4">
              <strong>{suppressionLivreur.nom}</strong> ne pourra plus se connecter ni accepter de commandes. Son historique de livraisons déjà effectuées reste conservé. Cette action est irréversible.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={() => setSuppressionLivreur(null)}>Annuler</Button>
              <Button variant="danger" fullWidth loading={actionEnCours === suppressionLivreur.id} onClick={handleSupprimerLivreur}>Supprimer</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
