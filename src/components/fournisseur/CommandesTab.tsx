import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ClipboardX, Navigation, Printer, Calendar, Wallet2, Bike, Trash2, Store as StoreIcon, RotateCcw, ChevronDown } from "lucide-react";
import Button from "../Button";
import Modal from "../Modal";
import PositionClientModal from "../PositionClientModal";
import { CardSkeleton } from "../Loading";
import EmptyState from "../EmptyState";
import { useToast } from "../../context/ToastContext";
import {
  getCommandesFournisseur,
  getCommandesFournisseurCorbeille,
  getProduitsCommande,
  updateCommandeStatut,
  supprimerCommande,
  restaurerCommande,
  getLivreurs,
  assignerLivreur,
} from "../../api";
import { ApiError } from "../../api/client";
import { formatPrix } from "../../utils/format";
import type { Commande, StatutCommande, Livreur, LigneCommande } from "../../types";

// Libellés alignés sur les VRAIS statuts backend — chacun n'existe que pour
// un seul mode (livraison OU retrait), pas besoin de double libellé.
const LABELS: Record<StatutCommande, string> = {
  en_attente: "Non livrée",
  en_route: "En route",
  livre: "Livrée",
  non_recupere: "Non récupérée",
  recupere: "Récupérée",
};

function estTerminee(c: Commande) {
  return c.statut === "livre" || c.statut === "recupere";
}

function prochainStatut(c: Commande): StatutCommande | null {
  if (!c.avec_livraison) {
    return c.statut === "non_recupere" ? "recupere" : null;
  }
  if (c.statut === "en_attente") return "en_route";
  if (c.statut === "en_route") return "livre";
  return null;
}

type FiltreType = "tous" | "avec_livraison" | "a_recuperer";
type FiltreStatut = "tous" | "non_terminee" | "terminee";

export default function CommandesTab({ fournisseurId }: { fournisseurId: number }) {
  const { showToast } = useToast();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [corbeille, setCorbeille] = useState<Commande[]>([]);
  const [afficherCorbeille, setAfficherCorbeille] = useState(false);
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [majEnCours, setMajEnCours] = useState<number | null>(null);
  const [positionOuverte, setPositionOuverte] = useState<Commande | null>(null);
  const [suppressionCommande, setSuppressionCommande] = useState<Commande | null>(null);
  const [detailsOuverts, setDetailsOuverts] = useState<Record<number, LigneCommande[] | "chargement">>({});

  const [filtreType, setFiltreType] = useState<FiltreType>("tous");
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>("tous");
  const [jour, setJour] = useState<string>("");

  function charger() {
    setLoading(true);
    Promise.allSettled([getCommandesFournisseur(fournisseurId), getLivreurs(fournisseurId)]).then(([c, l]) => {
      if (c.status === "fulfilled") setCommandes(c.value.sort((x, y) => y.id - x.id));
      else setErreur(c.reason instanceof ApiError ? c.reason.message : "Impossible de charger les commandes.");
      if (l.status === "fulfilled") setLivreurs(l.value || []);
      setLoading(false);
    });
  }

  useEffect(charger, [fournisseurId]);

  function chargerCorbeille() {
    getCommandesFournisseurCorbeille(fournisseurId)
      .then((liste) => setCorbeille(liste.sort((x, y) => y.id - x.id)))
      .catch(() => showToast("Impossible de charger la corbeille.", "error"));
  }

  async function toggleDetails(c: Commande) {
    if (detailsOuverts[c.id]) {
      setDetailsOuverts((prev) => {
        const { [c.id]: _, ...rest } = prev;
        return rest;
      });
      return;
    }
    setDetailsOuverts((prev) => ({ ...prev, [c.id]: "chargement" }));
    try {
      const lignes = await getProduitsCommande(c.id);
      setDetailsOuverts((prev) => ({ ...prev, [c.id]: lignes || [] }));
    } catch {
      setDetailsOuverts((prev) => ({ ...prev, [c.id]: [] }));
    }
  }

  async function avancer(c: Commande) {
    const suivant = prochainStatut(c);
    if (!suivant) return;
    setMajEnCours(c.id);
    try {
      await updateCommandeStatut(c.id, suivant);
      setCommandes((prev) => prev.map((x) => (x.id === c.id ? { ...x, statut: suivant } : x)));
      showToast(`Commande #${c.id} → ${LABELS[suivant]}`, "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible de mettre à jour le statut.", "error");
    } finally {
      setMajEnCours(null);
    }
  }

  async function handleSupprimer() {
    if (!suppressionCommande) return;
    setMajEnCours(suppressionCommande.id);
    try {
      await supprimerCommande(suppressionCommande.id);
      setCommandes((prev) => prev.filter((x) => x.id !== suppressionCommande.id));
      showToast(`Commande #${suppressionCommande.id} déplacée vers la corbeille`, "success");
      setSuppressionCommande(null);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible de supprimer la commande.", "error");
    } finally {
      setMajEnCours(null);
    }
  }

  async function handleRestaurer(c: Commande) {
    setMajEnCours(c.id);
    try {
      await restaurerCommande(c.id);
      setCorbeille((prev) => prev.filter((x) => x.id !== c.id));
      setCommandes((prev) => [c, ...prev]);
      showToast(`Commande #${c.id} restaurée`, "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible de restaurer la commande.", "error");
    } finally {
      setMajEnCours(null);
    }
  }

  async function assigner(c: Commande, livreurId: number) {
    const livreur = livreurs.find((l) => l.id === livreurId);
    try {
      await assignerLivreur(c.id, livreurId);
      // Le vrai backend passe automatiquement le statut à "en_route" à l'assignation.
      setCommandes((prev) => prev.map((x) => (x.id === c.id ? { ...x, livreur_id: livreurId, livreur_nom: livreur?.nom, statut: "en_route" } : x)));
      showToast(`${livreur?.nom || "Livreur"} assigné à la commande #${c.id}`, "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible d'assigner ce livreur.", "error");
    }
  }

  async function imprimer(c: Commande) {
    let fraisLivraison = "";
    if (c.avec_livraison) {
      const saisie = window.prompt("Prix de livraison à insérer sur le bon (DA) :", "");
      if (saisie === null) return;
      fraisLivraison = saisie;
    }
    let lignes = detailsOuverts[c.id];
    if (!lignes || lignes === "chargement") {
      try {
        lignes = (await getProduitsCommande(c.id)) || [];
      } catch {
        lignes = [];
      }
    }
    const win = window.open("", "_blank", "width=380,height=640");
    if (!win) {
      showToast("Le navigateur a bloqué la fenêtre d'impression. Autorisez les popups pour ce site puis réessayez.", "error");
      return;
    }
    const fraisNum = fraisLivraison ? Number(fraisLivraison) || 0 : 0;
    const totalAvecLivraison = c.prix_total + fraisNum;
    const lignesProduits = (Array.isArray(lignes) ? lignes : [])
      .map((p) => `<div class="ligne"><span>${p.quantite} × ${p.nom}</span><span>${formatPrix((p.prix_unitaire || 0) * p.quantite)}</span></div>`)
      .join("");
    win.document.write(`
      <html><head><title>Commande #${c.id}</title>
      <style>
        @page { margin: 8mm; }
        body { font-family: -apple-system, sans-serif; padding: 10px; font-size: 14px; color: #131a2b; }
        h2 { margin: 0 0 2px 0; font-size: 18px; }
        .slogan { color: #6b7280; font-size: 11px; margin: 0 0 14px 0; }
        p { margin: 4px 0; }
        .ligne { display: flex; justify-content: space-between; border-bottom: 1px dashed #ddd; padding: 6px 0; }
        .tot { font-weight: bold; font-size: 16px; border-top: 2px solid #131a2b; margin-top: 10px; padding-top: 10px; display: flex; justify-content: space-between; }
        .badge { display: inline-block; background: #eef0f4; padding: 2px 8px; border-radius: 10px; font-size: 12px; margin-top: 4px; }
      </style>
      </head><body>
      <h2>QREEB</h2>
      <p class="slogan">Tout près, tout simplement.</p>
      <p><strong>Commande #${c.id}</strong></p>
      <p>${c.acheteur_nom || ""} — ${c.acheteur_telephone || ""}</p>
      ${c.code_confirmation ? `<p>Code de confirmation : <strong>${c.code_confirmation}</strong></p>` : ""}
      <span class="badge">${c.avec_livraison ? "🚲 Livraison" : "🏪 À emporter"}</span>
      <p style="color:#6b7280; font-size:12px;">${c.created_at ? new Date(c.created_at).toLocaleString("fr-FR") : ""}</p>
      ${lignesProduits || '<p style="color:#6b7280;">Détail des produits indisponible.</p>'}
      ${c.avec_livraison ? `<div class="ligne"><span>Frais de livraison</span><span>${fraisNum} DA</span></div>` : ""}
      <div class="tot"><span>TOTAL</span><span>${c.avec_livraison ? formatPrix(totalAvecLivraison) : formatPrix(c.prix_total)}</span></div>
      </body></html>
    `);
    win.document.close();
    win.onload = () => win.print();
    setTimeout(() => win.print(), 300);
  }

  const resultats = useMemo(() => {
    let liste = [...commandes];
    if (filtreType === "avec_livraison") liste = liste.filter((c) => c.avec_livraison);
    if (filtreType === "a_recuperer") liste = liste.filter((c) => !c.avec_livraison);
    if (filtreStatut === "terminee") liste = liste.filter(estTerminee);
    if (filtreStatut === "non_terminee") liste = liste.filter((c) => !estTerminee(c));
    if (jour) liste = liste.filter((c) => c.created_at && c.created_at.slice(0, 10) === jour);
    return liste;
  }, [commandes, filtreType, filtreStatut, jour]);

  // Seules les commandes réellement abouties (livrées/récupérées) comptent dans le
  // total affiché — une commande en attente ou refusée ne doit pas gonfler le chiffre.
  const commandesTerminees = resultats.filter(estTerminee);
  const totalAffiche = commandesTerminees.reduce((s, c) => s + (c.prix_total || 0), 0);

  if (loading) return <div className="flex flex-col gap-2.5"><CardSkeleton /><CardSkeleton /></div>;

  if (erreur && commandes.length === 0) {
    return (
      <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-3.5 py-3">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <span>{erreur}</span>
      </div>
    );
  }

  const listeAffichee = afficherCorbeille ? corbeille : resultats;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-[var(--color-navy-900)] rounded-2xl p-4 flex items-center gap-3">
        <span className="h-10 w-10 rounded-xl bg-white/10 text-[var(--color-orange-400)] flex items-center justify-center shrink-0">
          <Wallet2 size={18} />
        </span>
        <div className="flex-1">
          <p className="text-xs text-white/60">Total livré/récupéré ({commandesTerminees.length} commande{commandesTerminees.length > 1 ? "s" : ""})</p>
          <p className="font-bold text-lg text-white">{formatPrix(totalAffiche)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2 overflow-x-auto scroll-row">
          {([
            { key: "tous", label: "Tous" },
            { key: "avec_livraison", label: "🚲 Livraison" },
            { key: "a_recuperer", label: "🏪 À emporter" },
          ] as const).map((f) => (
            <button
              key={f.key}
              onClick={() => { setFiltreType(f.key); setFiltreStatut("tous"); }}
              className={`shrink-0 px-3 py-2 rounded-full text-xs font-semibold border ${filtreType === f.key ? "bg-[var(--color-navy-900)] text-white border-[var(--color-navy-900)]" : "bg-white text-[var(--color-ink-700)] border-[var(--color-ink-100)]"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto scroll-row items-center">
          {([
            { key: "tous", label: "Tous statuts" },
            { key: "non_terminee", label: "En cours" },
            { key: "terminee", label: "Terminées" },
          ] as const).map((f) => (
            <button key={f.key} onClick={() => setFiltreStatut(f.key)} className={`shrink-0 px-3 py-2 rounded-full text-xs font-semibold border ${filtreStatut === f.key ? "bg-[var(--color-orange-500)] text-white border-[var(--color-orange-500)]" : "bg-white text-[var(--color-ink-700)] border-[var(--color-ink-100)]"}`}>
              {f.label}
            </button>
          ))}
          <div className="flex items-center gap-1.5 shrink-0 bg-white border border-[var(--color-ink-100)] rounded-full pl-3 pr-1 py-1">
            <Calendar size={13} className="text-[var(--color-ink-500)]" />
            <input type="date" value={jour} onChange={(e) => setJour(e.target.value)} className="text-xs outline-none bg-transparent" />
            {jour && <button onClick={() => setJour("")} className="text-xs text-[var(--color-ink-500)] px-1">✕</button>}
          </div>
        </div>
        <button
          onClick={() => {
            const v = !afficherCorbeille;
            setAfficherCorbeille(v);
            if (v && corbeille.length === 0) chargerCorbeille();
          }}
          className={`self-start flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${afficherCorbeille ? "bg-red-100 text-red-600" : "bg-[var(--color-ink-100)] text-[var(--color-ink-700)]"}`}
        >
          <Trash2 size={12} /> {afficherCorbeille ? "Retour aux commandes" : "Voir la corbeille"}
        </button>
      </div>

      {listeAffichee.length === 0 ? (
        <EmptyState icon={<ClipboardX size={32} />} title={afficherCorbeille ? "Corbeille vide" : "Aucune commande"} description={afficherCorbeille ? undefined : "Ajustez les filtres ou revenez plus tard."} />
      ) : (
        <div className="flex flex-col gap-2.5">
          {listeAffichee.map((c) => {
            const suivant = prochainStatut(c);
            const termine = estTerminee(c);
            const details = detailsOuverts[c.id];
            return (
              <div key={c.id} className={`bg-white rounded-2xl border p-4 ${afficherCorbeille ? "border-[var(--color-ink-100)] opacity-70" : "border-[var(--color-ink-100)]"}`}>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-[var(--color-ink-900)]">Commande #{c.id}</p>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${afficherCorbeille ? "bg-red-50 text-red-600" : termine ? "bg-[var(--color-green-100)] text-[var(--color-green-600)]" : "bg-[var(--color-orange-100)] text-[var(--color-orange-600)]"}`}>
                    {LABELS[c.statut] || c.statut}
                  </span>
                </div>

                <span className={`inline-flex items-center gap-1.5 mt-2 text-xs font-bold px-3 py-1.5 rounded-full border-2 ${c.avec_livraison ? "border-[var(--color-navy-900)] text-[var(--color-navy-900)] bg-[var(--color-navy-900)]/5" : "border-[var(--color-pink-500)] text-[var(--color-pink-600)] bg-[var(--color-pink-100)]"}`}>
                  {c.avec_livraison ? <Bike size={13} /> : <StoreIcon size={13} />}
                  {c.avec_livraison ? "À LIVRER" : "À RÉCUPÉRER"}
                </span>

                <p className="text-sm text-[var(--color-ink-700)] mt-2">{c.acheteur_nom} · {c.acheteur_telephone}</p>
                {c.code_confirmation && (
                  <p className="text-xs text-[var(--color-ink-500)] mt-1">
                    Code de confirmation : <span className="font-bold tracking-wider text-[var(--color-ink-900)]">{c.code_confirmation}</span>
                  </p>
                )}

                <button onClick={() => toggleDetails(c)} className="flex items-center gap-1 text-xs font-semibold text-[var(--color-navy-700)] mt-2">
                  Détail des produits <ChevronDown size={13} className={details ? "rotate-180" : ""} />
                </button>
                {details === "chargement" ? (
                  <p className="text-xs text-[var(--color-ink-500)] mt-1">Chargement...</p>
                ) : Array.isArray(details) ? (
                  <div className="mt-2 bg-[var(--color-ink-50)] rounded-xl p-2.5 flex flex-col gap-1">
                    {details.length === 0 ? (
                      <p className="text-xs text-[var(--color-ink-500)]">Détail indisponible.</p>
                    ) : (
                      details.map((p, i) => (
                        <div key={i} className="flex justify-between text-sm text-[var(--color-ink-700)]">
                          <span>{p.quantite} × {p.nom}</span>
                          <span className="font-medium">{formatPrix((p.prix_unitaire || 0) * p.quantite)}</span>
                        </div>
                      ))
                    )}
                  </div>
                ) : null}

                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-[var(--color-ink-500)]">{c.created_at ? new Date(c.created_at).toLocaleString("fr-FR") : ""}</span>
                  <span className="font-bold text-[var(--color-ink-900)]">{formatPrix(c.prix_total)}</span>
                </div>

                {c.avec_livraison && c.livreur_nom && (
                  <p className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-[var(--color-pink-600)]">
                    <Bike size={13} /> Livreur assigné : {c.livreur_nom}
                  </p>
                )}

                {afficherCorbeille ? (
                  <Button size="sm" fullWidth className="mt-3" icon={<RotateCcw size={14} />} onClick={() => handleRestaurer(c)} loading={majEnCours === c.id}>
                    Restaurer
                  </Button>
                ) : (
                  <>
                    {c.avec_livraison && (
                      <button
                        onClick={() => setPositionOuverte(c)}
                        className="w-full flex items-center justify-center gap-2 mt-3 bg-[var(--color-orange-500)] text-white font-semibold text-sm py-2.5 rounded-xl"
                      >
                        <Navigation size={15} /> Voir la position du client
                      </button>
                    )}

                    <div className="flex gap-2 mt-2">
                      <button onClick={() => imprimer(c)} className="h-9 w-9 rounded-lg bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] flex items-center justify-center text-[var(--color-ink-700)]" title="Imprimer">
                        <Printer size={14} />
                      </button>
                      {c.avec_livraison && (
                        <select
                          value={c.livreur_id ?? ""}
                          onChange={(e) => e.target.value && assigner(c, Number(e.target.value))}
                          disabled={livreurs.length === 0}
                          className="flex-1 text-xs bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] rounded-lg px-2 outline-none disabled:opacity-50"
                        >
                          <option value="" disabled>{livreurs.length === 0 ? "Aucun livreur — ajoutez-en un dans l'onglet Livreurs" : "🚴 Assigner un livreur"}</option>
                          {livreurs.map((l) => (
                            <option key={l.id} value={l.id}>{l.nom}</option>
                          ))}
                        </select>
                      )}
                      <button
                        onClick={() => setSuppressionCommande(c)}
                        className="h-9 w-9 shrink-0 rounded-lg bg-red-50 flex items-center justify-center text-red-500"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {suivant && (
                      <Button size="sm" fullWidth className="mt-2" onClick={() => avancer(c)} loading={majEnCours === c.id}>
                        Marquer « {LABELS[suivant]} »
                      </Button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <PositionClientModal
        open={!!positionOuverte}
        onClose={() => setPositionOuverte(null)}
        latitude={positionOuverte?.latitude}
        longitude={positionOuverte?.longitude}
        clientNom={positionOuverte?.acheteur_nom}
      />

      <Modal open={!!suppressionCommande} onClose={() => setSuppressionCommande(null)} title="Supprimer cette commande ?">
        {suppressionCommande && (
          <div>
            <p className="text-sm text-[var(--color-ink-700)] mb-4">
              La commande <strong>#{suppressionCommande.id}</strong> sera déplacée vers la corbeille — restaurable à tout moment.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={() => setSuppressionCommande(null)}>Annuler</Button>
              <Button variant="danger" fullWidth loading={majEnCours === suppressionCommande.id} onClick={handleSupprimer}>Supprimer</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
