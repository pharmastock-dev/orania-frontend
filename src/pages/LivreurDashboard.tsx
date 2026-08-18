import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bike, Power, MapPin, Phone, Store, Wallet, RefreshCw, LogOut, Navigation, CheckCircle2, History, PackageCheck, PackageX } from "lucide-react";
import DashboardHeader from "../components/DashboardHeader";
import Button from "../components/Button";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import {
  majStatutLivreur,
  majPositionLivreur,
  getCommandesDisponibles,
  getCommandeActiveLivreur,
  accepterCommandeMarketplace,
  refuserCommandeMarketplace,
  marquerCommandeLivree,
  marquerCommandeNonLivree,
  getHistoriqueLivreur,
} from "../api";
import { getPositionActuelle } from "../utils/geo";
import { formatPrix } from "../utils/format";
import type { CommandeDisponible, Coordonnees, HistoriqueLivreurItem } from "../types";

const INTERVALLE_MS = 15000;

type Onglet = "actif" | "historique";

function PastilleDistance({ label, km }: { label: string; km: number | null | undefined }) {
  if (km == null) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-orange-600)] bg-[var(--color-orange-100)] px-2.5 py-1 rounded-full">
      <Navigation size={12} /> {label} : {km} km
    </div>
  );
}

export default function LivreurDashboard() {
  const navigate = useNavigate();
  const { livreurConnecte, setLivreurConnecte } = useApp();
  const { showToast } = useToast();

  const [onglet, setOnglet] = useState<Onglet>("actif");
  const [enLigne, setEnLigne] = useState(false);
  const [bascule, setBascule] = useState(false);
  const [, setPosition] = useState<Coordonnees | null>(null);
  const [erreurPosition, setErreurPosition] = useState<string | null>(null);
  const [commandes, setCommandes] = useState<CommandeDisponible[]>([]);
  const [commandeActive, setCommandeActive] = useState<CommandeDisponible | null>(null);
  const [chargement, setChargement] = useState(false);
  const [actionEnCours, setActionEnCours] = useState<number | null>(null);
  const [historique, setHistorique] = useState<HistoriqueLivreurItem[]>([]);
  const [chargementHistorique, setChargementHistorique] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!livreurConnecte) navigate("/livreur");
  }, [livreurConnecte, navigate]);

  useEffect(() => {
    if (!livreurConnecte) return;
    getCommandeActiveLivreur(livreurConnecte.id).then((c) => setCommandeActive(c)).catch(() => {});
  }, [livreurConnecte]);

  const rafraichir = useCallback(async () => {
    if (!livreurConnecte) return;
    try {
      const pos = await getPositionActuelle();
      setPosition(pos);
      setErreurPosition(null);
      await majPositionLivreur(livreurConnecte.id, pos.latitude, pos.longitude);
      if (!commandeActive) {
        const liste = await getCommandesDisponibles(livreurConnecte.id, pos.latitude, pos.longitude);
        setCommandes(liste);
      } else {
        const active = await getCommandeActiveLivreur(livreurConnecte.id);
        if (active) setCommandeActive(active);
      }
    } catch (err) {
      setErreurPosition(err instanceof Error ? err.message : "Position indisponible.");
    }
  }, [livreurConnecte, commandeActive]);

  async function handleBascule() {
    if (!livreurConnecte) return;
    setBascule(true);
    try {
      const nouveauStatut = !enLigne;
      await majStatutLivreur(livreurConnecte.id, nouveauStatut);
      setEnLigne(nouveauStatut);
      if (nouveauStatut) {
        setChargement(true);
        await rafraichir();
        setChargement(false);
      } else {
        setCommandes([]);
      }
    } catch {
      showToast("Impossible de changer de statut pour le moment.", "error");
    } finally {
      setBascule(false);
    }
  }

  useEffect(() => {
    if (!enLigne) {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = window.setInterval(rafraichir, INTERVALLE_MS);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [enLigne, rafraichir]);

  useEffect(() => {
    if (onglet !== "historique" || !livreurConnecte) return;
    setChargementHistorique(true);
    getHistoriqueLivreur(livreurConnecte.id)
      .then(setHistorique)
      .catch(() => showToast("Impossible de charger l'historique.", "error"))
      .finally(() => setChargementHistorique(false));
  }, [onglet, livreurConnecte, showToast]);

  async function handleAccepter(commande: CommandeDisponible) {
    if (!livreurConnecte) return;
    setActionEnCours(commande.id);
    try {
      const res = await accepterCommandeMarketplace(commande.id, livreurConnecte.id);
      if (!res.succes) {
        showToast(res.message, "error");
        rafraichir();
        return;
      }
      setCommandeActive(commande);
      setCommandes([]);
      showToast("Commande acceptée !", "success");
    } catch {
      showToast("Impossible d'accepter cette commande.", "error");
    } finally {
      setActionEnCours(null);
    }
  }

  async function handleRefuserActive() {
    if (!commandeActive) return;
    setActionEnCours(commandeActive.id);
    try {
      await refuserCommandeMarketplace(commandeActive.id);
      setCommandeActive(null);
      showToast("Commande remise à disposition des autres livreurs.", "info");
      rafraichir();
    } catch {
      showToast("Impossible de refuser cette commande.", "error");
    } finally {
      setActionEnCours(null);
    }
  }

  async function handleMarquerLivree() {
    if (!commandeActive) return;
    setActionEnCours(commandeActive.id);
    try {
      await marquerCommandeLivree(commandeActive.id);
      setCommandeActive(null);
      showToast("Commande marquée comme livrée. Bravo !", "success");
      rafraichir();
    } catch {
      showToast("Impossible de marquer cette commande comme livrée.", "error");
    } finally {
      setActionEnCours(null);
    }
  }

  async function handleMarquerNonLivree() {
    if (!commandeActive) return;
    setActionEnCours(commandeActive.id);
    try {
      await marquerCommandeNonLivree(commandeActive.id);
      setCommandeActive(null);
      showToast("Commande remise à disposition des autres livreurs.", "info");
      rafraichir();
    } catch {
      showToast("Impossible de mettre à jour cette commande.", "error");
    } finally {
      setActionEnCours(null);
    }
  }

  function handleLogout() {
    if (enLigne && livreurConnecte) majStatutLivreur(livreurConnecte.id, false).catch(() => {});
    setLivreurConnecte(null);
    navigate("/");
  }

  if (!livreurConnecte) return null;

  return (
    <div className="min-h-screen bg-[var(--color-ink-50)] pb-10">
      <div className="max-w-2xl mx-auto px-4 pt-5 flex flex-col gap-4">
        <DashboardHeader
          title={livreurConnecte.nom}
          subtitle="Espace livreur"
          actions={
            <button onClick={handleLogout} className="h-9 w-9 rounded-full bg-white border border-[var(--color-ink-100)] flex items-center justify-center text-[var(--color-ink-500)]">
              <LogOut size={16} />
            </button>
          }
        />

        <div className="flex gap-2 bg-white rounded-xl p-1 border border-[var(--color-ink-100)]">
          <button
            onClick={() => setOnglet("actif")}
            className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold py-2 rounded-lg ${onglet === "actif" ? "bg-[var(--color-navy-900)] text-white" : "text-[var(--color-ink-500)]"}`}
          >
            <Bike size={14} /> En cours
          </button>
          <button
            onClick={() => setOnglet("historique")}
            className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold py-2 rounded-lg ${onglet === "historique" ? "bg-[var(--color-navy-900)] text-white" : "text-[var(--color-ink-500)]"}`}
          >
            <History size={14} /> Historique
          </button>
        </div>

        {onglet === "historique" ? (
          chargementHistorique ? (
            <div className="text-center text-sm text-[var(--color-ink-500)] py-10">Chargement...</div>
          ) : historique.length === 0 ? (
            <div className="text-center py-14">
              <span className="h-14 w-14 rounded-2xl bg-[var(--color-ink-100)] text-[var(--color-ink-500)] flex items-center justify-center mx-auto">
                <History size={24} />
              </span>
              <p className="text-[var(--color-ink-500)] mt-3 text-sm">Aucune livraison effectuée pour l'instant.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {historique.map((h) => (
                <div key={h.id} className="bg-white rounded-xl border border-[var(--color-ink-100)] p-3.5 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-[var(--color-ink-900)] truncate">{h.commercant_nom} → {h.client_nom}</p>
                    <p className="text-xs text-[var(--color-ink-500)]">{h.date_commande}</p>
                  </div>
                  <span className="font-bold text-sm text-[var(--color-ink-900)] shrink-0">{formatPrix(h.prix_total)}</span>
                </div>
              ))}
            </div>
          )
        ) : (
          <>
            <button
              onClick={handleBascule}
              disabled={bascule}
              className={`flex items-center justify-between rounded-2xl p-4 border transition-colors ${
                enLigne ? "bg-[var(--color-green-500)] border-[var(--color-green-500)] text-white" : "bg-white border-[var(--color-ink-100)] text-[var(--color-ink-700)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`h-10 w-10 rounded-full flex items-center justify-center ${enLigne ? "bg-white/20" : "bg-[var(--color-ink-100)]"}`}>
                  <Power size={18} />
                </span>
                <div className="text-left">
                  <p className="font-bold">{enLigne ? "En ligne" : "Hors ligne"}</p>
                  <p className={`text-xs ${enLigne ? "text-white/80" : "text-[var(--color-ink-500)]"}`}>
                    {enLigne ? "Vous recevez les commandes à proximité" : "Activez pour voir les commandes disponibles"}
                  </p>
                </div>
              </div>
            </button>

            {erreurPosition && enLigne && (
              <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-3.5 py-3">
                <MapPin size={16} className="mt-0.5 shrink-0" />
                <span>{erreurPosition}</span>
              </div>
            )}

            {commandeActive && (
              <div className="bg-white rounded-2xl border-2 border-[var(--color-orange-500)] p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-[var(--color-orange-500)]" />
                    <p className="font-bold text-[var(--color-ink-900)]">Commande en cours</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <PastilleDistance label="Commerce" km={commandeActive.distance_commerce_km} />
                  <PastilleDistance label="Client" km={commandeActive.distance_client_km} />
                </div>

                <div className="flex items-start gap-2 text-sm">
                  <Store size={15} className="mt-0.5 shrink-0 text-[var(--color-ink-500)]" />
                  <div>
                    <p className="font-semibold text-[var(--color-ink-900)]">{commandeActive.commercant_nom}</p>
                    <p className="text-[var(--color-ink-500)]">{commandeActive.commercant_adresse}</p>
                    <a href={`tel:${commandeActive.commercant_telephone}`} className="text-blue-600 font-medium">{commandeActive.commercant_telephone}</a>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-sm border-t border-[var(--color-ink-100)] pt-3">
                  <Phone size={15} className="mt-0.5 shrink-0 text-[var(--color-ink-500)]" />
                  <div>
                    <p className="font-semibold text-[var(--color-ink-900)]">{commandeActive.client_nom}</p>
                    <a href={`tel:${commandeActive.client_telephone}`} className="text-blue-600 font-medium">{commandeActive.client_telephone}</a>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-ink-900)]">
                  <Wallet size={15} /> {formatPrix(commandeActive.prix_total)}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Button
                    fullWidth
                    loading={actionEnCours === commandeActive.id}
                    onClick={handleMarquerLivree}
                    icon={<PackageCheck size={15} />}
                  >
                    Livrée
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    loading={actionEnCours === commandeActive.id}
                    onClick={handleMarquerNonLivree}
                    icon={<PackageX size={15} />}
                  >
                    Non livrée
                  </Button>
                </div>

                <button
                  onClick={handleRefuserActive}
                  disabled={actionEnCours === commandeActive.id}
                  className="text-center text-xs text-[var(--color-ink-500)] underline"
                >
                  Je ne peux pas prendre cette commande (avant de partir)
                </button>
              </div>
            )}

            {enLigne && !commandeActive && (
              <>
                <div className="flex items-center justify-between">
                  <p className="font-display font-bold text-[15px] text-[var(--color-ink-900)]">Commandes à proximité</p>
                  <button onClick={rafraichir} className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-orange-600)]">
                    <RefreshCw size={13} className={chargement ? "animate-spin" : ""} /> Actualiser
                  </button>
                </div>

                {chargement ? (
                  <div className="text-center text-sm text-[var(--color-ink-500)] py-10">Recherche des commandes proches...</div>
                ) : commandes.length === 0 ? (
                  <div className="text-center text-sm text-[var(--color-ink-500)] py-10">
                    Aucune commande disponible près de vous pour l'instant.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {commandes.map((c) => (
                      <div key={c.id} className="bg-white rounded-2xl border border-[var(--color-ink-100)] p-4 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1.5">
                            <PastilleDistance label="Commerce" km={c.distance_commerce_km ?? c.distance_km} />
                            <PastilleDistance label="Client" km={c.distance_client_km} />
                          </div>
                          <span className="flex items-center gap-1 text-sm font-bold text-[var(--color-ink-900)] shrink-0">
                            <Wallet size={14} /> {formatPrix(c.prix_total)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Store size={14} className="text-[var(--color-ink-500)] shrink-0" />
                          <span className="font-semibold text-[var(--color-ink-900)] truncate">{c.commercant_nom}</span>
                        </div>
                        <p className="text-xs text-[var(--color-ink-500)] truncate">{c.commercant_adresse}</p>
                        <Button fullWidth loading={actionEnCours === c.id} onClick={() => handleAccepter(c)}>
                          Accepter
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {!enLigne && !commandeActive && (
              <div className="text-center py-14">
                <span className="h-14 w-14 rounded-2xl bg-[var(--color-ink-100)] text-[var(--color-ink-500)] flex items-center justify-center mx-auto">
                  <Bike size={24} />
                </span>
                <p className="text-[var(--color-ink-500)] mt-3 text-sm">Passez en ligne pour commencer à recevoir des commandes.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
