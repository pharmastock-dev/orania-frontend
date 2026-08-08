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

// LibellÃ©s alignÃ©s sur les VRAIS statuts backend â€” chacun n'existe que pour
// un seul mode (livraison OU retrait), pas besoin de double libellÃ©.
const LABELS: Record<StatutCommande, string> = {
  en_attente: "Non livrÃ©e",
  en_route: "En route",
  livre: "LivrÃ©e",
  non_recupere: "Non rÃ©cupÃ©rÃ©e",
  recupere: "RÃ©cupÃ©rÃ©e",
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
      showToast(`Commande #${c.id} â†’ ${LABELS[suivant]}`, "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible de mettre Ã  jour le statut.", "error");
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
      showToast(`Commande #${suppressionCommande.id} dÃ©placÃ©e vers la corbeille`, "success");
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
      showToast(`Commande #${c.id} restaurÃ©e`, "success");
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
      // Le vrai backend passe automatiquement le statut Ã  "en_route" Ã  l'assignation.
      setCommandes((prev) => prev.map((x) => (x.id === c.id ? { ...x, livreur_id: livreurId, livreur_nom: livreur?.nom, statut: "en_route" } : x)));
      showToast(`${livreur?.nom || "Livreur"} assignÃ© Ã  la commande #${c.id}`, "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible d'assigner ce livreur.", "error");
    }
  }

  async function imprimer(c: Commande) {
    let fraisLivraison = "";
    if (c.avec_livraison) {
      const saisie = window.prompt("Prix de livraison Ã  insÃ©rer sur le bon (DA) :", "");
      if (saisie === null) return;
      fraisLivraison = saisie;
    }

    // Largeur d'imprimante ticket â€” les deux standards du marchÃ© sont 58mm et
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
      showToast("Le navigateur a bloquÃ© la fenÃªtre d'impression. Autorisez les popups pour ce site puis rÃ©essayez.", "error");
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
            <span class="item-qty">${p.quantite}Ã—</span>
            <span class="item-nom">${p.nom}</span>
            <span class="item-prix">${formatPrix((p.prix_unitaire || 0) * p.quantite)}</span>
          </div>
        </div>`
      )
      .join("");

    win.document.write(`
      <html><head><title>Commande #${c.id} â€” ${c.commerce_nom || "QREEB"}</title>
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
          <div class="meta-row"><span class="meta-label">TÃ©lÃ©phone</span><span class="meta-value">${c.acheteur_telephone || ""}</span></div>

          <div style="text-align:center;">
            <span class="badge-mode">${c.avec_livraison ? "ðŸš² LIVRAISON" : "ðŸª Ã€ EMPORTER"}</span>
          </div>

          ${c.code_confirmation ? `
          <div class="code-box">
            <div class="label">Code de confirmation</div>
            <div class="code">${c.code_confirmation}</div>
          </div>` : ""}

          <hr class="divider" />

          <div class="section-title">DÃ©tail de la commande</div>
          ${lignesProduits || '<p style="color:#8a93a6; font-size:12px;">DÃ©tail des produits indisponible.</p>'}

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
            <p>via QREEB â€” orania.dz</p>
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
    if (filtreStatut === "non_terminee") liste = liste.filter((c) => !estTerminee(c));
    if (jour) liste = liste.filter((c) => c.created_at && c.created_at.slice(0, 10) === jour);
    return liste;
  }, [commandes, filtreType, filtreStatut, jour]);

  // Seules les commandes rÃ©ellement abouties (livrÃ©es/rÃ©cupÃ©rÃ©es) comptent dans le
  // total affichÃ© â€” une commande en attente ou refusÃ©e ne doit pas gonfler le chiffre.
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
          <p className="text-xs text-white/60">Total livrÃ©/rÃ©cupÃ©rÃ© ({commandesTerminees.length} commande{commandesTerminees.length > 1 ? "s" : ""})</p>
          <p className="font-bold text-lg text-white">{formatPrix(totalAffiche)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2 overflow-x-auto scroll-row">
          {([
            { key: "tous", label: "Tous" },
            { key: "avec_livraison", label: "ðŸš² Livraison" },
            { key: "a_recuperer", label: "ðŸª Ã€ emporter" },
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
            { key: "terminee", label: "TerminÃ©es" },
          ] as const).map((f) => (
            <button key={f.key} onClick={() => setFiltreStatut(f.key)} className={`shrink-0 px-3 py-2 rounded-full text-xs font-semibold border ${filtreStatut === f.key ? "bg-[var(--color-orange-500)] text-white border-[var(--color-orange-500)]" : "bg-white text-[var(--color-ink-700)] border-[var(--color-ink-100)]"}`}>
              {f.label}
            </button>
          ))}
          <div className="flex items-center gap-1.5 shrink-0 bg-white border border-[var(--color-ink-100)] rounded-full pl-3 pr-1 py-1">
            <Calendar size={13} className="text-[var(--color-ink-500)]" />
            <input type="date" value={jour} onChange={(e) => setJour(e.target.value)} className="text-xs outline-none bg-transparent" />
            {jour && <button onClick={() => setJour("")} className="text-xs text-[var(--color-ink-500)] px-1">âœ•</button>}
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
                  {c.avec_livraison ? "Ã€ LIVRER" : "Ã€ RÃ‰CUPÃ‰RER"}
                </span>

                <p className="text-sm text-[var(--color-ink-700)] mt-2">{c.acheteur_nom} Â· {c.acheteur_telephone}</p>
                {c.code_confirmation && (
                  <p className="text-xs text-[var(--color-ink-500)] mt-1">
                    Code de confirmation : <span className="font-bold tracking-wider text-[var(--color-ink-900)]">{c.code_confirmation}</span>
                  </p>
                )}

                <button onClick={() => toggleDetails(c)} className="flex items-center gap-1 text-xs font-semibold text-[var(--color-navy-700)] mt-2">
                  DÃ©tail des produits <ChevronDown size={13} className={details ? "rotate-180" : ""} />
                </button>
                {details === "chargement" ? (
                  <p className="text-xs text-[var(--color-ink-500)] mt-1">Chargement...</p>
                ) : Array.isArray(details) ? (
                  <div className="mt-2 bg-[var(--color-ink-50)] rounded-xl p-2.5 flex flex-col gap-1">
                    {details.length === 0 ? (
                      <p className="text-xs text-[var(--color-ink-500)]">DÃ©tail indisponible.</p>
                    ) : (
                      details.map((p, i) => (
                        <div key={i} className="flex justify-between text-sm text-[var(--color-ink-700)]">
                          <span>{p.quantite} Ã— {p.nom}</span>
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
                    <Bike size={13} /> Livreur assignÃ© : {c.livreur_nom}
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
                          <option value="" disabled>{livreurs.length === 0 ? "Aucun livreur â€” ajoutez-en un dans l'onglet Livreurs" : "ðŸš´ Assigner un livreur"}</option>
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
                        Marquer Â« {LABELS[suivant]} Â»
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
              La commande <strong>#{suppressionCommande.id}</strong> sera dÃ©placÃ©e vers la corbeille â€” restaurable Ã  tout moment.
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

