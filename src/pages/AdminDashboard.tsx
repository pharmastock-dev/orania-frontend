import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, AlertTriangle, Store, Bell, Ban, Play, Plus, Flag, Check, KeyRound, Search, Trash2, Bike } from "lucide-react";
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
  adminSupprimerLivreurMarketplace,
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
      await adminValiderLivreurMarketplace(l.id);
      setLivreursMarketplace((prev) => prev.map((x) => (x.id === l.id ? { ...x, valide: true } : x)));
      showToast(`${l.nom} validé — peut maintenant se connecter.`, "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible de valider ce livreur.", "error");
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

  const demandes = fournisseurs
    .filter((f) => f.valide === false)
    .sort((a, b) => (a.date_creation || "").localeCompare(b.date_creation || ""));
  const commercesValides = fournisseurs
    .filter((f) => f.valide !== false)
    .filter((f) => {
      if (!rechercheCommerce.trim()) return true;
      const q = rechercheCommerce.trim().toLowerCase();
      return f.nom.toLowerCase().includes(q) || f.telephone.toLowerCase().includes(q) || (f.adresse || "").toLowerCase().includes(q);
    })
    .sort((a, b) => {
      // Ordre chronologique par fin d'abonnement — les plus récemment activés
      // (donc les plus loin dans le futur) en premier.
      if (!a.abonnement_fin && !b.abonnement_fin) return b.id - a.id;
      if (!a.abonnement_fin) return 1;
      if (!b.abonnement_fin) return -1;
      return new Date(b.abonnement_fin).getTime() - new Date(a.abonnement_fin).getTime();
    });

  function estExpire(f: Fournisseur) {
    return f.abonnement_fin ? new Date(f.abonnement_fin) < new Date() : true;
  }

  async function handleValider(f: Fournisseur) {
    setActionEnCours(f.id);
    try {
      const res = await validerFournisseur(f.id);
      setFournisseurs((prev) => prev.map((x) => (x.id === f.id ? { ...x, valide: true, actif: true, abonnement_fin: res.abonnement_fin } : x)));
      showToast(`${f.nom} validé et activé pour 1 an`, "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible de valider ce commerce.", "error");
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

        <div className="flex items-center gap-2 mt-6 mb-3">
          <Flag size={16} className="text-[var(--color-ink-500)]" />
          <p className="font-bold text-[var(--color-ink-900)]">Réclamations</p>
          {reclamations.filter((r) => !r.traitee).length > 0 && (
            <span className="h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
              {reclamations.filter((r) => !r.traitee).length}
            </span>
          )}
        </div>
        {loading ? (
          <CardSkeleton />
        ) : reclamations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[var(--color-ink-100)] p-4 text-sm text-[var(--color-ink-500)]">Aucune réclamation</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {reclamations.map((r) => (
              <div key={r.id} className={`bg-white rounded-2xl border p-4 ${r.traitee ? "border-[var(--color-ink-100)] opacity-70" : "border-2 border-red-200"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-ink-500)]">
                      {r.type_auteur === "client" ? "👤 Client" : "🏪 Commerçant"} · {r.auteur_nom || `#${r.auteur_id}`}
                    </p>
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

        <div className="flex items-center gap-2 mt-7 mb-3">
          <Bell size={16} className="text-[var(--color-ink-500)]" />
          <p className="font-bold text-[var(--color-ink-900)]">Nouvelles demandes</p>
          {demandes.length > 0 && (
            <span className="h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">{demandes.length}</span>
          )}
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
                <button
                  onClick={() => handleValider(d)}
                  disabled={actionEnCours === d.id}
                  className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-[var(--color-green-500)] hover:bg-[var(--color-green-600)] rounded-xl px-3 py-2.5 disabled:opacity-60 mt-3"
                >
                  ✓ Valider & activer (1 an)
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-7 mb-3">
          <Store size={16} className="text-[var(--color-ink-500)]" />
          <p className="font-bold text-[var(--color-ink-900)]">Commerces ({commercesValides.length})</p>
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

                  <div className="grid grid-cols-4 gap-2 mt-3">
                    <button
                      onClick={() => handleProlonger(f)}
                      disabled={actionEnCours === f.id}
                      className="flex items-center justify-center gap-1 text-xs font-semibold px-2 py-2 rounded-lg bg-[var(--color-green-100)] text-[var(--color-green-600)] disabled:opacity-60"
                    >
                      <Plus size={13} /> 1 an
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
      </div>

      {/* Livreurs marché ouvert — validation et suppression */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Bike size={18} className="text-[var(--color-navy-900)]" />
          <p className="font-display font-bold text-[15px] text-[var(--color-ink-900)]">Livreurs (marché ouvert)</p>
          {livreursMarketplace.filter((l) => !l.valide).length > 0 && (
            <span className="text-xs font-bold bg-[var(--color-orange-100)] text-[var(--color-orange-600)] px-2 py-0.5 rounded-full">
              {livreursMarketplace.filter((l) => !l.valide).length} en attente
            </span>
          )}
        </div>

        {livreursMarketplace.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-500)]">Aucun livreur inscrit pour l'instant.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {livreursMarketplace.map((l) => (
              <div key={l.id} className="bg-white rounded-xl border border-[var(--color-ink-100)] p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-[var(--color-ink-900)] truncate">{l.nom}</p>
                    {l.valide ? (
                      l.en_ligne ? (
                        <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">En ligne</span>
                      ) : (
                        <span className="text-[10px] font-bold text-[var(--color-ink-500)] bg-[var(--color-ink-100)] px-1.5 py-0.5 rounded-full">Hors ligne</span>
                      )
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">En attente</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-ink-500)]">{l.telephone}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!l.valide && (
                    <button
                      onClick={() => handleValiderLivreur(l)}
                      disabled={actionEnCours === l.id}
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-2 rounded-lg bg-green-50 text-green-700 disabled:opacity-60"
                    >
                      <Check size={13} /> Valider
                    </button>
                  )}
                  <button
                    onClick={() => setSuppressionLivreur(l)}
                    disabled={actionEnCours === l.id}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-2 rounded-lg bg-red-50 text-red-600 disabled:opacity-60"
                  >
                    <Trash2 size={13} /> Suppr.
                  </button>
                </div>
              </div>
            ))}
          </div>
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
