import { useEffect, useRef, useState } from "react";
import { Info, Clock, MessageSquareText, MapPinned, Camera } from "lucide-react";
import Button from "../Button";
import DeliveryMap from "../DeliveryMap";
import { CATEGORIES } from "../../utils/categories";
import { useApp } from "../../context/AppContext";
import { useToast } from "../../context/ToastContext";
import { updateFournisseur, uploadFournisseurImage, resolveImageUrl } from "../../api";
import { ApiError } from "../../api/client";
import { nettoyerTelephone } from "../../utils/format";
import type { Fournisseur, Coordonnees } from "../../types";

export default function MonCommerceTab() {
  const { fournisseurConnecte, setFournisseurConnecte } = useApp();
  const { showToast } = useToast();
  const [form, setForm] = useState<Fournisseur | null>(fournisseurConnecte);
  const [enregistrement, setEnregistrement] = useState(false);
  const [photoEnCours, setPhotoEnCours] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(fournisseurConnecte);
  }, [fournisseurConnecte]);

  if (!form) return null;

  function champ<K extends keyof Fournisseur>(key: K, value: Fournisseur[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function handlePosition(pos: Coordonnees) {
    champ("latitude", pos.latitude);
    champ("longitude", pos.longitude);
  }

  async function handlePhoto(file: File) {
    if (!fournisseurConnecte) return;
    setPhotoEnCours(true);
    try {
      const res = await uploadFournisseurImage(fournisseurConnecte.id, file);
      if (res.succes === false) {
        showToast(res.message || "Impossible d'envoyer la photo.", "error");
        return;
      }
      champ("photo", res.image_url);
      setFournisseurConnecte({ ...fournisseurConnecte, photo: res.image_url });
      showToast("Photo de la boutique mise à jour", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible d'envoyer la photo.", "error");
    } finally {
      setPhotoEnCours(false);
    }
  }

  async function enregistrer() {
    if (!form || !fournisseurConnecte) return;
    setEnregistrement(true);
    try {
      // On n'envoie que les champs réellement modifiables ici — jamais valide/actif/
      // abonnement_fin (gérés par l'admin) ni les champs calculés côté serveur, pour
      // éviter de corrompre une colonne avec un type inattendu.
      await updateFournisseur(fournisseurConnecte.id, {
        nom: form.nom,
        telephone: form.telephone,
        categorie: form.categorie,
        adresse: form.adresse,
        heure_ouverture: form.heure_ouverture,
        heure_fermeture: form.heure_fermeture,
        frais_min: form.frais_min,
        frais_max: form.frais_max,
        livraison_gratuite: form.livraison_gratuite,
        description: form.description,
        latitude: form.latitude,
        longitude: form.longitude,
      });
      setFournisseurConnecte(form);
      showToast("Commerce mis à jour", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible d'enregistrer les modifications.", "error");
    } finally {
      setEnregistrement(false);
    }
  }

  const position = form.latitude != null && form.longitude != null ? { latitude: form.latitude, longitude: form.longitude } : null;
  const image = resolveImageUrl(form.photo);

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-white rounded-2xl border border-[var(--color-ink-100)] p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <span className="h-9 w-9 rounded-xl bg-[var(--color-navy-900)]/8 text-[var(--color-navy-700)] flex items-center justify-center shrink-0">
            <Info size={16} />
          </span>
          <p className="font-bold text-[var(--color-ink-900)]">Informations générales</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={form.nom} onChange={(e) => champ("nom", e.target.value)} placeholder="Nom du commerce" className="bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none" />
          <input
            value={form.telephone}
            onChange={(e) => champ("telephone", nettoyerTelephone(e.target.value))}
            placeholder="Téléphone"
            inputMode="tel"
            maxLength={14}
            className="bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none"
          />
          <select value={form.categorie || ""} onChange={(e) => champ("categorie", e.target.value)} className="bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none">
            {CATEGORIES.filter((c) => c.key !== "tous").map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
          <input value={form.adresse || ""} onChange={(e) => champ("adresse", e.target.value)} placeholder="Adresse" className="bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none" />
        </div>

        <div>
          <p className="text-xs font-semibold text-[var(--color-ink-500)] uppercase tracking-wide mb-1.5">Photo de la boutique</p>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={photoEnCours}
            className="relative h-36 w-full rounded-xl bg-[var(--color-ink-100)] overflow-hidden flex items-center justify-center disabled:opacity-60"
          >
            {image ? (
              <img src={image} alt={form.nom} className="h-full w-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-1.5 text-[var(--color-ink-500)]">
                <Camera size={22} />
                <span className="text-xs font-medium">{photoEnCours ? "Envoi..." : "Ajouter une photo"}</span>
              </span>
            )}
            {image && (
              <span className="absolute bottom-2 right-2 bg-white/90 text-xs font-semibold px-2.5 py-1 rounded-full text-[var(--color-ink-700)]">
                {photoEnCours ? "Envoi..." : "Changer"}
              </span>
            )}
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])}
            />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-[var(--color-orange-100)] p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <span className="h-9 w-9 rounded-xl bg-[var(--color-orange-100)] text-[var(--color-orange-600)] flex items-center justify-center shrink-0">
            <MessageSquareText size={16} />
          </span>
          <p className="font-bold text-[var(--color-ink-900)]">Pourquoi nous choisir ?</p>
        </div>
        <p className="text-sm text-[var(--color-ink-500)] -mt-1">Ce texte s'affiche aux clients sur la page de votre commerce.</p>
        <textarea
          value={form.description || ""}
          onChange={(e) => champ("description", e.target.value)}
          placeholder="Ex : Ingrédients frais, livraison rapide, recettes maison depuis 2015..."
          rows={4}
          className="bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none resize-none"
        />
      </div>

      <div className="bg-white rounded-2xl border border-[var(--color-ink-100)] p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <span className="h-9 w-9 rounded-xl bg-[var(--color-pink-100)] text-[var(--color-pink-600)] flex items-center justify-center shrink-0">
            <MapPinned size={16} />
          </span>
          <p className="font-bold text-[var(--color-ink-900)]">Position du commerce</p>
        </div>
        <p className="text-sm text-[var(--color-ink-500)] -mt-1">Permet aux clients de voir la distance et le temps de livraison estimé.</p>
        <DeliveryMap position={position} onChange={handlePosition} />
      </div>

      <div className="bg-white rounded-2xl border border-[var(--color-ink-100)] p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <span className="h-9 w-9 rounded-xl bg-[var(--color-green-100)] text-[var(--color-green-600)] flex items-center justify-center shrink-0">
            <Clock size={16} />
          </span>
          <p className="font-bold text-[var(--color-ink-900)]">Horaires & livraison</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-[var(--color-ink-500)] uppercase tracking-wide mb-1.5">Horaires d'ouverture</p>
          <div className="grid grid-cols-2 gap-3">
            <input type="time" value={form.heure_ouverture || ""} onChange={(e) => champ("heure_ouverture", e.target.value)} className="bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none" />
            <input type="time" value={form.heure_fermeture || ""} onChange={(e) => champ("heure_fermeture", e.target.value)} className="bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none" />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-[var(--color-ink-500)] uppercase tracking-wide mb-1.5">Prix de livraison — min / max (DA)</p>
          <div className="grid grid-cols-2 gap-3">
            <input disabled={!!form.livraison_gratuite} value={form.frais_min ?? ""} onChange={(e) => champ("frais_min", Number(e.target.value))} type="number" placeholder="Min (DA)" className="bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none disabled:opacity-50" />
            <input disabled={!!form.livraison_gratuite} value={form.frais_max ?? ""} onChange={(e) => champ("frais_max", Number(e.target.value))} type="number" placeholder="Max (DA)" className="bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none disabled:opacity-50" />
          </div>
        </div>
        <p className="text-xs text-[var(--color-ink-500)] -mt-1">⏱️ Le temps de livraison est estimé automatiquement selon la distance avec chaque client — rien à régler ici.</p>

        <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-ink-700)] mt-1">
          <input type="checkbox" checked={!!form.livraison_gratuite} onChange={(e) => champ("livraison_gratuite", e.target.checked)} className="h-4 w-4 accent-[var(--color-orange-500)]" />
          Livraison gratuite
        </label>
        <p className="text-xs text-[var(--color-ink-500)]">🔥 La mise en promotion du commerce est automatique dès qu'un produit a un prix promo — rien à cocher.</p>
      </div>

      <Button onClick={enregistrer} loading={enregistrement}>Enregistrer les modifications</Button>
    </div>
  );
}
