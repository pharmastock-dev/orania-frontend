import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Truck, PersonStanding, CheckCircle2, AlertTriangle, Wallet } from "lucide-react";
import BackButton from "../components/BackButton";
import Button from "../components/Button";
import DeliveryMap from "../components/DeliveryMap";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { createCommande, getFournisseurInfos } from "../api";
import { ApiError } from "../api/client";
import { formatPrix } from "../utils/format";
import type { ModeReception, Coordonnees } from "../types";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { client, cart, cartTotal, clearCart, position, setPosition } = useApp();
  const { showToast } = useToast();

  const [mode, setMode] = useState<ModeReception>("livraison");
  const [telephoneCommerce, setTelephoneCommerce] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ commande_id: number; code_confirmation: string } | null>(null);

  useEffect(() => {
    if (!cart.fournisseurId) return;
    getFournisseurInfos(cart.fournisseurId)
      .then((f) => setTelephoneCommerce(f.telephone))
      .catch(() => {});
  }, [cart.fournisseurId]);

  function handleMapChange(pos: Coordonnees) {
    setPosition(pos);
  }

  async function handleCommander() {
    if (!client || !cart.fournisseurId) return;
    if (mode === "livraison" && !position) {
      setErreur("Indiquez votre position de livraison sur la carte.");
      return;
    }
    setErreur(null);
    setEnvoi(true);
    try {
      const res = await createCommande({
        acheteur_id: client.id,
        fournisseur_id: cart.fournisseurId,
        avec_livraison: mode === "livraison",
        latitude: mode === "livraison" ? position?.latitude : undefined,
        longitude: mode === "livraison" ? position?.longitude : undefined,
        produits: cart.items.map((i) => ({ produit_id: i.produit.id, quantite: i.quantite })),
      });
      if (res.succes === false || !res.id) {
        setErreur(res.message || "Impossible de créer la commande.");
        showToast(res.message || "Impossible de créer la commande.", "error");
        return;
      }
      setConfirmation({ commande_id: res.id, code_confirmation: res.code_confirmation });
      clearCart();
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Impossible de créer la commande.");
      showToast("Impossible de créer la commande.", "error");
    } finally {
      setEnvoi(false);
    }
  }

  if (confirmation) {
    return (
      <div className="min-h-screen bg-[var(--color-ink-50)] flex items-center justify-center px-6">
        <div className="max-w-sm w-full bg-white rounded-2xl p-6 text-center">
          <CheckCircle2 size={48} className="text-[var(--color-green-500)] mx-auto" />
          <h1 className="font-display font-bold text-xl mt-3 text-[var(--color-ink-900)]">Commande envoyée !</h1>
          <p className="text-[var(--color-ink-500)] mt-3">Votre code de confirmation</p>
          <p className="font-bold text-3xl tracking-[0.3em] text-[var(--color-orange-600)] mt-1">{confirmation.code_confirmation}</p>
          {telephoneCommerce && (
            <p className="text-sm text-[var(--color-ink-500)] mt-4">
              Le commerce <strong className="text-[var(--color-ink-900)]">{cart.fournisseurNom}</strong> vous contactera au<br />
              <span className="font-semibold text-[var(--color-ink-900)]">{telephoneCommerce}</span>
            </p>
          )}
          <Button fullWidth className="mt-6" onClick={() => navigate("/client/accueil")}>
            Retour aux commerces
          </Button>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    navigate("/client/accueil");
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--color-ink-50)] pb-32">
      <div className="max-w-md mx-auto px-4 pt-5">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="font-display font-bold text-xl text-[var(--color-ink-900)]">Récapitulatif</h1>
        </div>

        <div className="mt-5 bg-white rounded-2xl border border-[var(--color-ink-100)] p-4">
          {cart.items.map((i) => (
            <div key={i.produit.id} className="flex justify-between text-sm py-1 text-[var(--color-ink-700)]">
              <span className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-[var(--color-orange-100)] text-[var(--color-orange-600)] text-xs font-bold flex items-center justify-center">
                  {i.quantite}
                </span>
                {i.produit.nom}
              </span>
              <span>{formatPrix((i.produit.prix_promo ?? i.produit.prix) * i.quantite)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-[var(--color-ink-900)] border-t border-[var(--color-ink-100)] mt-2 pt-2">
            <span>Total produits</span>
            <span>{formatPrix(cartTotal)}</span>
          </div>
        </div>

        <div className="flex items-start gap-2 mt-4 bg-[var(--color-orange-100)] text-[var(--color-orange-700,#a35009)] text-sm rounded-xl px-3.5 py-3">
          <Wallet size={16} className="mt-0.5 shrink-0" />
          <span>
            Paiement en <strong>espèces</strong>. Le prix de livraison sera convenu avec le commerce
            {telephoneCommerce ? <> au <strong>{telephoneCommerce}</strong></> : ""}.
          </span>
        </div>

        <p className="text-sm font-semibold text-[var(--color-ink-700)] mt-6 mb-2">Mode de réception</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode("livraison")}
            className={`flex flex-col items-center gap-2 rounded-2xl border p-4 ${
              mode === "livraison" ? "border-[var(--color-orange-500)] bg-[var(--color-orange-100)]" : "border-[var(--color-ink-100)] bg-white"
            }`}
          >
            <Truck size={22} className={mode === "livraison" ? "text-[var(--color-orange-600)]" : "text-[var(--color-ink-500)]"} />
            <span className="font-semibold text-sm">Avec livraison</span>
          </button>
          <button
            onClick={() => setMode("retrait")}
            className={`flex flex-col items-center gap-2 rounded-2xl border p-4 ${
              mode === "retrait" ? "border-[var(--color-orange-500)] bg-[var(--color-orange-100)]" : "border-[var(--color-ink-100)] bg-white"
            }`}
          >
            <PersonStanding size={22} className={mode === "retrait" ? "text-[var(--color-orange-600)]" : "text-[var(--color-ink-500)]"} />
            <span className="font-semibold text-sm">À emporter</span>
          </button>
        </div>

        {mode === "livraison" && (
          <div className="mt-5">
            <p className="text-sm font-semibold text-[var(--color-ink-700)] mb-2">📍 Votre position de livraison</p>
            <p className="text-xs text-[var(--color-ink-500)] mb-2">Déplacez le marqueur ou cliquez sur la carte pour indiquer où livrer.</p>
            <DeliveryMap position={position} onChange={handleMapChange} />
          </div>
        )}

        {erreur && (
          <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-3.5 py-3 mt-4">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{erreur}</span>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--color-ink-100)] p-4 safe-bottom">
        <div className="max-w-md mx-auto">
          <Button fullWidth loading={envoi} onClick={handleCommander}>
            Confirmer la commande
          </Button>
        </div>
      </div>
    </div>
  );
}
