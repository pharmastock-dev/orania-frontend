import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ClipboardX, Printer, Calendar, Wallet2, Bike, Trash2, Store as StoreIcon, RotateCcw, ChevronDown, UserPlus, MapPin } from "lucide-react";
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
  annulee: "Annulée",
};

function estTerminee(c: Commande) {
  return c.statut === "livre" || c.statut === "recupere";
}

function estAnnulee(c: Commande) {
  return c.statut === "annulee";
}

function peutEtreRefusee(c: Commande) {
  return c.statut === "en_attente" || c.statut === "non_recupere";
}

// Palette dédiée par statut — l'orange n'est réservé qu'à "en route" (l'état
// actif), le reste utilise des couleurs distinctes pour éviter la confusion
// que provoquait un seul orange générique partout.
function classesStatut(c: Commande, afficherCorbeille: boolean): string {
  if (afficherCorbeille || estAnnulee(c)) return "bg-red-50 text-red-600";
  if (estTerminee(c)) return "bg-[var(--color-green-100)] text-[var(--color-green-600)]";
  if (c.statut === "en_route") return "bg-[var(--color-orange-500)] text-white";
  return "bg-amber-100 text-amber-700"; // en_attente / non_recupere — en attente, discret
}

// Étapes possibles selon le mode — sert au sélecteur de statut librement
// cliquable dans les deux sens.
function etapesPourCommande(c: Commande): StatutCommande[] {
  return c.avec_livraison ? ["en_attente", "en_route", "livre"] : ["non_recupere", "recupere"];
}

type FiltreType = "tous" | "avec_livraison" | "a_recuperer";
type FiltreStatut = "tous" | "non_terminee" | "terminee" | "annulee";

export default function CommandesTab({ fournisseurId, onGererLivreurs }: { fournisseurId: number; onGererLivreurs?: () => void }) {
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

  // Change le statut vers N'IMPORTE QUELLE étape directement, y compris
  // revenir en arrière (ex: repasser "Livrée" → "En route" en cas de clic
  // par erreur) — pas juste avancer d'un cran comme avant.
  async function changerStatutDirect(c: Commande, nouveauStatut: StatutCommande) {
    if (nouveauStatut === c.statut) return;
    setMajEnCours(c.id);
    try {
      await updateCommandeStatut(c.id, nouveauStatut);
      setCommandes((prev) => prev.map((x) => (x.id === c.id ? { ...x, statut: nouveauStatut } : x)));
      showToast(`Commande #${c.id} → ${LABELS[nouveauStatut]}`, "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible de mettre à jour le statut.", "error");
    } finally {
      setMajEnCours(null);
    }
  }

  async function refuser(c: Commande) {
    if (!window.confirm(`Refuser la commande #${c.id} ? Le client verra qu'elle a été annulée.`)) return;
    setMajEnCours(c.id);
    try {
      await updateCommandeStatut(c.id, "annulee");
      setCommandes((prev) => prev.map((x) => (x.id === c.id ? { ...x, statut: "annulee" } : x)));
      showToast(`Commande #${c.id} refusée`, "info");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible de refuser la commande.", "error");
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

    // Largeur d'imprimante ticket — les deux standards du marché sont 58mm et
    // 80mm. On ne demande qu'une fois, puis on retient le choix.
    let largeur = localStorage.getItem("qreeb_largeur_imprimante");
    if (!largeur) {
      const choix = window.prompt("Largeur de votre imprimante ticket : tapez 58 ou 80 (en mm)", "80");
      largeur = choix === "58" ? "58" : "80";
      localStorage.setItem("qreeb_largeur_imprimante", largeur);
    }
    const mm = largeur === "58" ? 58 : 80;
    const tailleBase = mm === 58 ? 11 : 13;

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
    const date = c.created_at ? new Date(c.created_at) : null;
    const dateTexte = date ? date.toLocaleDateString("fr-FR") : "";
    const heureTexte = date ? date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";

    const lignesProduits = (Array.isArray(lignes) ? lignes : [])
      .map(
        (p) => `
        <div class="item">
          <div class="item-top">
            <span class="item-qty">${p.quantite}×</span>
            <span class="item-nom">${p.nom}</span>
            <span class="item-prix">${formatPrix((p.prix_unitaire || 0) * p.quantite)}</span>
          </div>
        </div>`
      )
      .join("");

    win.document.write(`
      <html><head><title>Commande #${c.id} — ${c.commerce_nom || "QREEB"}</title>
      <meta charset="utf-8" />
      <style>
        @page { size: ${mm}mm auto; margin: 3mm; }
        * { box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', -apple-system, sans-serif;
          padding: 0; margin: 0;
          color: #131a2b;
          width: ${mm}mm;
          font-size: ${tailleBase}px;
        }
        .receipt { padding: 3mm; }
        .logo { display: block; margin: 0 auto 4px; height: ${mm === 58 ? 30 : 38}px; object-fit: contain; }
        .header { text-align: center; margin-bottom: 8px; }
        .header .commerce-nom {
          margin: 0; font-size: ${tailleBase + 6}px; font-weight: 800;
          letter-spacing: 0.3px; color: #131a2b; line-height: 1.15;
        }
        .header .via { margin: 2px 0 0; font-size: ${tailleBase - 2}px; color: #8a93a6; }
        .commerce-infos { text-align: center; font-size: ${tailleBase - 2}px; color: #4b5563; margin-top: 4px; line-height: 1.5; }
        .divider { border: none; border-top: 1.5px dashed #c7cdd8; margin: 10px 0; }
        .divider-solid { border: none; border-top: 2px solid #131a2b; margin: 8px 0; }
        .meta-row { display: flex; justify-content: space-between; font-size: ${tailleBase - 1}px; margin: 3px 0; }
        .meta-label { color: #8a93a6; }
        .meta-value { font-weight: 600; text-align: right; }
        .badge-mode {
          display: inline-block; margin-top: 6px;
          padding: 4px 12px; border-radius: 20px;
          font-size: ${tailleBase - 2}px; font-weight: 700; letter-spacing: 0.3px;
          background: #fff2e8; color: #d9611a;
        }
        .code-box {
          margin-top: 10px; padding: 8px 10px;
          background: #f4f6f9; border-radius: 8px;
          text-align: center;
        }
        .code-box .label { font-size: ${tailleBase - 3}px; color: #8a93a6; text-transform: uppercase; letter-spacing: 0.5px; }
        .code-box .code { font-size: ${tailleBase + 5}px; font-weight: 800; letter-spacing: 4px; color: #131a2b; margin-top: 2px; }
        .section-title { font-size: ${tailleBase - 3}px; font-weight: 700; color: #8a93a6; text-transform: uppercase; letter-spacing: 0.5px; margin: 12px 0 6px; }
        .item { padding: 4px 0; }
        .item-top { display: flex; align-items: baseline; gap: 6px; }
        .item-qty { font-weight: 700; color: #d9611a; flex-shrink: 0; min-width: 20px; }
        .item-nom { flex: 1; }
        .item-prix { font-weight: 600; white-space: nowrap; }
        .sous-total-row { display: flex; justify-content: space-between; font-size: ${tailleBase - 1}px; padding: 3px 0; color: #4b5563; }
        .total-row { display: flex; justify-content: space-between; align-items: baseline; margin-top: 4px; }
        .total-row .label { font-size: ${tailleBase}px; font-weight: 700; }
        .total-row .value { font-size: ${tailleBase + 9}px; font-weight: 800; color: #131a2b; }
        .footer { text-align: center; margin-top: 14px; font-size: ${tailleBase - 2}px; color: #8a93a6; }
        .footer .merci { font-size: ${tailleBase + 1}px; font-weight: 700; color: #131a2b; margin-bottom: 2px; }
        .footer p { margin: 2px 0; }
      </style>
      </head><body>
        <div class="receipt">
          <div class="header">
            <img class="logo" src="/logo-orania.png" alt="" onerror="this.style.display='none'" />
            <p class="commerce-nom">${c.commerce_nom || "Commerce"}</p>
            <p class="via">via QREEB</p>
            <div class="commerce-infos">
              ${c.commerce_adresse ? `<div>${c.commerce_adresse}</div>` : ""}
              ${c.commerce_tel ? `<div>${c.commerce_tel}</div>` : ""}
            </div>
          </div>

          <hr class="divider" />

          <div class="meta-row"><span class="meta-label">Commande</span><span class="meta-value">#${c.id}</span></div>
          <div class="meta-row"><span class="meta-label">Date</span><span class="meta-value">${dateTexte}</span></div>
          <div class="meta-row"><span class="meta-label">Heure</span><span class="meta-value">${heureTexte}</span></div>
          <div class="meta-row"><span class="meta-label">Client</span><span class="meta-value">${c.acheteur_nom || ""}</span></div>
          <div class="meta-row"><span class="meta-label">Téléphone</span><span class="meta-value">${c.acheteur_telephone || ""}</span></div>

          <div style="text-align:center;">
            <span class="badge-mode">${c.avec_livraison ? "🚲 LIVRAISON" : "🏪 À RÉCUPÉRER"}</span>
          </div>

          ${c.code_confirmation ? `
          <div class="code-box">
            <div class="label">Code de confirmation</div>
            <div class="code">${c.code_confirmation}</div>
          </div>` : ""}

          <hr class="divider" />

          <div class="section-title">Détail de la commande</div>
          ${lignesProduits || '<p style="color:#8a93a6; font-size:12px;">Détail des produits indisponible.</p>'}

          <hr class="divider" />

          <div class="sous-total-row"><span>Sous-total produits</span><span>${formatPrix(c.prix_total)}</span></div>
          ${c.avec_livraison ? `<div class="sous-total-row"><span>Frais de livraison</span><span>${fraisNum} DA</span></div>` : ""}

          <hr class="divider-solid" />

          <div class="total-row">
            <span class="label">TOTAL</span>
            <span class="value">${c.avec_livraison ? formatPrix(totalAvecLivraison) : formatPrix(c.prix_total)}</span>
          </div>

          <div class="footer">
            <p class="merci">Merci pour votre commande !</p>
            <p>via QREEB</p>
          </div>
        </div>
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
    if (filtreStatut === "non_terminee") liste = liste.filter((c) => !estTerminee(c) && !estAnnulee(c));
    if (filtreStatut === "annulee") liste = liste.filter(estAnnulee);
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
            { key: "a_recuperer", label: "🏪 À récupérer" },
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
            { key: "annulee", label: "Annulées" },
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
        <div className="flex flex-col gap-3">
          {listeAffichee.map((c) => {
            const details = detailsOuverts[c.id];
            return (
              <div key={c.id} className={`bg-white rounded-2xl border overflow-hidden ${afficherCorbeille ? "border-[var(--color-ink-100)] opacity-70" : "border-[var(--color-ink-100)]"}`}>
                <div className="p-5">
                  {/* En-tête : numéro + statut */}
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-lg text-[var(--color-ink-900)]">Commande #{c.id}</p>
                    <span className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full ${classesStatut(c, afficherCorbeille)}`}>
                      {LABELS[c.statut] || c.statut}
                    </span>
                  </div>

                  {/* Mode : à livrer / à récupérer */}
                  <span className={`inline-flex items-center gap-1.5 mt-3 text-xs font-bold px-3 py-1.5 rounded-full border-2 ${c.avec_livraison ? "border-[var(--color-navy-900)] text-[var(--color-navy-900)] bg-[var(--color-navy-900)]/5" : "border-[var(--color-pink-500)] text-[var(--color-pink-600)] bg-[var(--color-pink-100)]"}`}>
                    {c.avec_livraison ? <Bike size={15} /> : <StoreIcon size={15} />}
                    {c.avec_livraison ? "À LIVRER" : "À RÉCUPÉRER"}
                  </span>

                  {/* Client */}
                  <p className="text-sm text-[var(--color-ink-700)] mt-3.5">{c.acheteur_nom} · {c.acheteur_telephone}</p>

                  {/* Code de confirmation — mis en valeur, important à la remise */}
                  {c.code_confirmation && (
                    <div className="inline-flex items-center gap-2 mt-2.5 bg-[var(--color-orange-100)] rounded-xl px-3.5 py-2">
                      <span className="text-[11px] font-semibold text-[var(--color-orange-700,#a35009)] uppercase tracking-wide">Code</span>
                      <span className="font-extrabold tracking-[0.2em] text-[var(--color-ink-900)]">{c.code_confirmation}</span>
                    </div>
                  )}

                  {/* Détail produits */}
                  <button onClick={() => toggleDetails(c)} className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-navy-700)] mt-4">
                    Détail des produits <ChevronDown size={14} className={`transition-transform ${details ? "rotate-180" : ""}`} />
                  </button>
                  {details === "chargement" ? (
                    <p className="text-xs text-[var(--color-ink-500)] mt-1.5">Chargement...</p>
                  ) : Array.isArray(details) ? (
                    <div className="mt-2 bg-[var(--color-ink-50)] rounded-xl p-3 flex flex-col gap-1.5">
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

                  {/* Date + Montant */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--color-ink-100)]">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-ink-700)]">
                      <Calendar size={14} className="text-[var(--color-ink-500)]" />
                      {c.created_at ? new Date(c.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                    <span className="font-extrabold text-lg text-[var(--color-ink-900)]">{formatPrix(c.prix_total)}</span>
                  </div>

                  {c.avec_livraison && c.livreur_nom && (
                    <p className="flex items-center gap-1.5 mt-2.5 text-xs font-semibold text-[var(--color-pink-600)]">
                      <Bike size={13} /> Livreur assigné : {c.livreur_nom}
                    </p>
                  )}
                </div>

                {/* Zone d'actions — visuellement séparée du contenu */}
                {afficherCorbeille ? (
                  <div className="px-5 pb-5">
                    <Button size="sm" fullWidth icon={<RotateCcw size={14} />} onClick={() => handleRestaurer(c)} loading={majEnCours === c.id}>
                      Restaurer
                    </Button>
                  </div>
                ) : (
                  <div className="bg-[var(--color-ink-50)]/60 border-t border-[var(--color-ink-100)] px-5 py-4 flex flex-col gap-2.5">
                    {/* Secondaire : voir la position — style discret, pas la même intensité que l'action principale */}
                    {c.avec_livraison && (
                      <button
                        onClick={() => setPositionOuverte(c)}
                        className="w-full flex items-center justify-center gap-2 bg-white border-2 border-[var(--color-navy-900)] text-[var(--color-navy-900)] font-semibold text-sm py-2.5 rounded-xl"
                      >
                        <MapPin size={16} /> Voir la position du client
                      </button>
                    )}

                    {/* Ligne d'actions secondaires : imprimer, livreur, supprimer — vraiment groupées ensemble */}
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        onClick={() => imprimer(c)}
                        className="h-11 w-11 shrink-0 rounded-xl bg-white border border-[var(--color-ink-100)] flex items-center justify-center text-[var(--color-ink-700)]"
                        title="Imprimer"
                        aria-label="Imprimer le bon"
                      >
                        <Printer size={18} />
                      </button>

                      {c.avec_livraison && (
                        livreurs.length === 0 ? (
                          <button
                            onClick={() => onGererLivreurs?.()}
                            className="flex-1 min-w-0 text-left bg-white border border-[var(--color-ink-100)] rounded-xl px-3.5 py-2 hover:border-[var(--color-orange-400)]"
                          >
                            <p className="text-xs text-[var(--color-ink-500)] truncate">Aucun livreur assigné</p>
                            <p className="text-xs font-bold text-[var(--color-orange-600)] flex items-center gap-1 mt-0.5">
                              <UserPlus size={12} /> Ajouter un livreur
                            </p>
                          </button>
                        ) : (
                          <select
                            value={c.livreur_id ?? ""}
                            onChange={(e) => e.target.value && assigner(c, Number(e.target.value))}
                            className="flex-1 min-w-0 text-sm font-medium bg-white border border-[var(--color-ink-100)] rounded-xl px-3 py-2.5 outline-none"
                          >
                            <option value="" disabled>🚴 Assigner un livreur</option>
                            {livreurs.map((l) => (
                              <option key={l.id} value={l.id}>{l.nom}</option>
                            ))}
                          </select>
                        )
                      )}

                      <button
                        onClick={() => setSuppressionCommande(c)}
                        className="h-11 w-11 shrink-0 rounded-xl bg-red-50 flex items-center justify-center text-red-500"
                        title="Supprimer la commande"
                        aria-label="Supprimer la commande"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Refuser — reste secondaire, jamais aussi visible que l'action principale */}
                    {peutEtreRefusee(c) && (
                      <button
                        onClick={() => refuser(c)}
                        disabled={majEnCours === c.id}
                        className="self-start text-xs font-semibold text-red-500 px-1 py-1 disabled:opacity-50"
                      >
                        Refuser la commande
                      </button>
                    )}

                    {/* PRIMAIRE : statut de la commande — chaque étape est cliquable
                        directement, dans les deux sens (pas seulement "suivant") */}
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-ink-500)] mb-1.5">Statut de la commande</p>
                      <div className="flex items-center gap-1.5">
                        {etapesPourCommande(c).map((etape) => {
                          const indexActuel = etapesPourCommande(c).indexOf(c.statut);
                          const indexEtape = etapesPourCommande(c).indexOf(etape);
                          const estActuelle = c.statut === etape;
                          const estPassee = indexEtape < indexActuel;
                          return (
                            <button
                              key={etape}
                              onClick={() => changerStatutDirect(c, etape)}
                              disabled={majEnCours === c.id}
                              className={`flex-1 text-xs font-bold py-2.5 rounded-lg text-center disabled:opacity-50 ${
                                estActuelle
                                  ? "bg-[var(--color-orange-500)] text-white"
                                  : estPassee
                                  ? "bg-[var(--color-green-100)] text-[var(--color-green-700)]"
                                  : "bg-[var(--color-ink-100)] text-[var(--color-ink-500)]"
                              }`}
                            >
                              {LABELS[etape]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
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
