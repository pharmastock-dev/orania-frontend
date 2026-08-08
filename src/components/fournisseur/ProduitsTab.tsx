import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Camera, PackageX, AlertTriangle } from "lucide-react";
import Button from "../Button";
import Modal from "../Modal";
import { CardSkeleton } from "../Loading";
import EmptyState from "../EmptyState";
import { useToast } from "../../context/ToastContext";
import { useApp } from "../../context/AppContext";
import { getProduits, createProduit, updateProduit, deleteProduit, uploadProduitImage, resolveImageUrl, updateFournisseur } from "../../api";
import { ApiError } from "../../api/client";
import { formatPrix } from "../../utils/format";
import { SUGGESTIONS_PRODUITS, getEmojiCategorieProduit } from "../../utils/categories";
import type { Produit } from "../../types";

export default function ProduitsTab({ fournisseurId }: { fournisseurId: number }) {
  const { showToast } = useToast();
  const { fournisseurConnecte, setFournisseurConnecte } = useApp();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  // Le commerce passe automatiquement "en promotion" dès qu'un produit a un prix promo,
  // et en sort quand plus aucun produit n'en a — pas besoin d'y penser manuellement.
  async function synchroniserPromotion(liste: Produit[]) {
    if (!fournisseurConnecte) return;
    const aUnePromo = liste.some((p) => p.prix_promo != null);
    if (aUnePromo === !!fournisseurConnecte.a_promo) return;
    try {
      await updateFournisseur(fournisseurId, { a_promo: aUnePromo });
      setFournisseurConnecte({ ...fournisseurConnecte, a_promo: aUnePromo });
    } catch {
      // silencieux : la synchro promo n'est pas bloquante pour l'utilisateur
    }
  }

  const [nom, setNom] = useState("");
  const [prix, setPrix] = useState("");
  const [prixPromo, setPrixPromo] = useState("");
  const [categorie, setCategorie] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [ajoutEnCours, setAjoutEnCours] = useState(false);

  const [editionProduit, setEditionProduit] = useState<Produit | null>(null);
  const [suppressionProduit, setSuppressionProduit] = useState<Produit | null>(null);
  const [categorieActive, setCategorieActive] = useState<string>("tous");
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  function charger() {
    setLoading(true);
    setErreur(null);
    getProduits(fournisseurId)
      .then((data) => setProduits(data || []))
      .catch((err) => setErreur(err instanceof ApiError ? err.message : "Impossible de charger les données du commerce. Vérifiez la connexion au serveur."))
      .finally(() => setLoading(false));
  }

  useEffect(charger, [fournisseurId]);

  const categoriesDisponibles = useMemo(
    () => Array.from(new Set(produits.map((p) => p.categorie).filter(Boolean))),
    [produits]
  );
  const produitsAffiches = useMemo(
    () => (categorieActive === "tous" ? produits : produits.filter((p) => p.categorie === categorieActive)),
    [produits, categorieActive]
  );

  async function handleAjouter(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim() || !prix || !categorie.trim()) {
      showToast("Nom, prix et catégorie sont obligatoires.", "error");
      return;
    }
    setAjoutEnCours(true);
    try {
      const nouveau = await createProduit(fournisseurId, {
        nom: nom.trim(),
        prix: Number(prix),
        prix_promo: prixPromo ? Number(prixPromo) : null,
        categorie: categorie.trim(),
        ingredients: ingredients.trim() || undefined,
      });
      setProduits((prev) => {
        const maj = [nouveau, ...prev];
        synchroniserPromotion(maj);
        return maj;
      });
      setNom("");
      setPrix("");
      setPrixPromo("");
      setCategorie("");
      setIngredients("");
      showToast("Produit ajouté", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible d'ajouter le produit.", "error");
    } finally {
      setAjoutEnCours(false);
    }
  }

  async function toggleDisponible(p: Produit) {
    const maj = { ...p, disponible: !p.disponible };
    setProduits((prev) => prev.map((x) => (x.id === p.id ? maj : x)));
    try {
      await updateProduit(p.id, { disponible: maj.disponible });
    } catch (err) {
      setProduits((prev) => prev.map((x) => (x.id === p.id ? p : x)));
      showToast(err instanceof ApiError ? err.message : "Impossible de mettre à jour le produit.", "error");
    }
  }

  async function handleEnregistrerEdition() {
    if (!editionProduit) return;
    try {
      await updateProduit(editionProduit.id, editionProduit);
      setProduits((prev) => {
        const majListe = prev.map((x) => (x.id === editionProduit.id ? editionProduit : x));
        synchroniserPromotion(majListe);
        return majListe;
      });
      showToast("Produit modifié", "success");
      setEditionProduit(null);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible de modifier le produit.", "error");
    }
  }

  async function handleSupprimer() {
    if (!suppressionProduit) return;
    try {
      await deleteProduit(suppressionProduit.id);
      setProduits((prev) => {
        const majListe = prev.filter((x) => x.id !== suppressionProduit.id);
        synchroniserPromotion(majListe);
        return majListe;
      });
      showToast("Produit supprimé", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible de supprimer le produit.", "error");
    } finally {
      setSuppressionProduit(null);
    }
  }

  async function handlePhoto(p: Produit, file: File) {
    try {
      const res = await uploadProduitImage(p.id, file);
      if (res.succes === false) {
        showToast(res.message || "Impossible d'envoyer la photo.", "error");
        return;
      }
      setProduits((prev) => prev.map((x) => (x.id === p.id ? { ...x, photo: res.image_url } : x)));
      showToast("Photo mise à jour", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible d'envoyer la photo.", "error");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {erreur && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-3.5 py-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{erreur}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border-2 border-[var(--color-orange-100)] p-4">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="h-9 w-9 rounded-xl bg-[var(--color-orange-100)] text-[var(--color-orange-600)] flex items-center justify-center shrink-0">
            <Plus size={17} />
          </span>
          <p className="font-bold text-[var(--color-ink-900)]">Ajouter un produit</p>
        </div>
        <p className="text-sm text-[var(--color-ink-500)] mb-3 ml-11">Ajoutez rapidement un article à votre catalogue.</p>
        <form onSubmit={handleAjouter} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom du produit" className="bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none focus:border-[var(--color-orange-500)]" />
          <input value={prix} onChange={(e) => setPrix(e.target.value)} type="number" min="0" placeholder="Prix (DA)" className="bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none focus:border-[var(--color-orange-500)]" />
          <input value={prixPromo} onChange={(e) => setPrixPromo(e.target.value)} type="number" min="0" placeholder="Prix promo (facultatif)" className="bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none focus:border-[var(--color-orange-500)]" />
          <input
            value={categorie}
            onChange={(e) => setCategorie(e.target.value)}
            placeholder="Catégorie (ex: Pizza, Sushi...)"
            list="suggestions-categories-produits"
            className="bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none focus:border-[var(--color-orange-500)]"
          />
          <datalist id="suggestions-categories-produits">
            {SUGGESTIONS_PRODUITS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <input
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="Ingrédients / description (ex: thé, menthe...)"
            className="bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none focus:border-[var(--color-orange-500)] sm:col-span-2"
          />
          <Button type="submit" loading={ajoutEnCours} icon={<Plus size={16} />} className="sm:col-span-2">
            Ajouter le produit
          </Button>
        </form>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-[var(--color-ink-900)]">Mes produits</p>
          <p className="text-sm text-[var(--color-ink-500)]">{produitsAffiches.length} produit{produitsAffiches.length > 1 ? "s" : ""}</p>
        </div>

        {categoriesDisponibles.length > 1 && (
          <div className="flex gap-2 overflow-x-auto scroll-row mb-3 pb-1">
            <button
              onClick={() => setCategorieActive("tous")}
              className={`shrink-0 px-3.5 py-2 rounded-full text-sm font-semibold ${
                categorieActive === "tous" ? "bg-[var(--color-orange-500)] text-white" : "bg-white border border-[var(--color-ink-100)] text-[var(--color-ink-700)]"
              }`}
            >
              Tous
            </button>
            {categoriesDisponibles.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategorieActive(cat)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
                  categorieActive === cat ? "bg-[var(--color-orange-500)] text-white" : "bg-white border border-[var(--color-ink-100)] text-[var(--color-ink-700)]"
                }`}
              >
                <span>{getEmojiCategorieProduit(cat)}</span> {cat}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {loading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : produitsAffiches.length === 0 ? (
            <EmptyState icon={<PackageX size={32} />} title={produits.length === 0 ? "Aucun produit pour l'instant" : "Aucun produit dans cette catégorie"} description={produits.length === 0 ? "Ajoutez votre premier produit ci-dessus." : undefined} />
          ) : (
            produitsAffiches.map((p) => {
              const image = resolveImageUrl(p.photo);
              return (
                <div key={p.id} className="flex items-center gap-3 bg-white rounded-2xl border border-[var(--color-ink-100)] p-3">
                  <button
                    onClick={() => fileInputs.current[p.id]?.click()}
                    className="relative h-14 w-14 rounded-xl bg-[var(--color-ink-100)] overflow-hidden shrink-0"
                  >
                    {image ? <img src={image} alt={p.nom} className="h-full w-full object-cover" /> : (
                      <span className="h-full w-full flex items-center justify-center text-[var(--color-ink-300)]">
                        <Camera size={16} />
                      </span>
                    )}
                    <input
                      ref={(el) => { fileInputs.current[p.id] = el; }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handlePhoto(p, e.target.files[0])}
                    />
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--color-ink-900)] truncate">{p.nom}</p>
                    <div className="flex items-center gap-2 text-sm">
                      {p.prix_promo != null ? (
                        <>
                          <span className="font-bold text-[var(--color-pink-600)]">{formatPrix(p.prix_promo)}</span>
                          <span className="line-through text-[var(--color-ink-300)]">{formatPrix(p.prix)}</span>
                        </>
                      ) : (
                        <span className="font-bold text-[var(--color-ink-900)]">{formatPrix(p.prix)}</span>
                      )}
                    </div>
                    {p.categorie && (
                      <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-navy-900)]/5 text-[var(--color-navy-700)]">
                        {p.categorie}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => toggleDisponible(p)}
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${p.disponible ? "bg-[var(--color-green-100)] text-[var(--color-green-600)]" : "bg-[var(--color-ink-100)] text-[var(--color-ink-500)]"}`}
                    >
                      {p.disponible ? "🟢 Disponible" : "⚪ Indisponible"}
                    </button>
                    <div className="flex gap-1.5">
                      <button onClick={() => setEditionProduit(p)} className="h-7 w-7 rounded-full bg-[var(--color-ink-50)] flex items-center justify-center text-[var(--color-ink-700)]">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setSuppressionProduit(p)} className="h-7 w-7 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Modal open={!!editionProduit} onClose={() => setEditionProduit(null)} title="Modifier le produit">
        {editionProduit && (
          <div className="flex flex-col gap-3">
            <input
              value={editionProduit.nom}
              onChange={(e) => setEditionProduit({ ...editionProduit, nom: e.target.value })}
              placeholder="Nom"
              className="bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none"
            />
            <input
              value={editionProduit.prix}
              onChange={(e) => setEditionProduit({ ...editionProduit, prix: Number(e.target.value) })}
              type="number"
              placeholder="Prix"
              className="bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none"
            />
            <input
              value={editionProduit.prix_promo ?? ""}
              onChange={(e) => setEditionProduit({ ...editionProduit, prix_promo: e.target.value ? Number(e.target.value) : null })}
              type="number"
              placeholder="Prix promo"
              className="bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none"
            />
            <input
              value={editionProduit.categorie}
              onChange={(e) => setEditionProduit({ ...editionProduit, categorie: e.target.value })}
              placeholder="Catégorie (ex: Pizza, Sushi...)"
              list="suggestions-categories-produits"
              className="bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none"
            />
            <input
              value={editionProduit.ingredients || ""}
              onChange={(e) => setEditionProduit({ ...editionProduit, ingredients: e.target.value })}
              placeholder="Ingrédients / description"
              className="bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none"
            />
            <Button onClick={handleEnregistrerEdition}>Enregistrer</Button>
          </div>
        )}
      </Modal>

      <Modal open={!!suppressionProduit} onClose={() => setSuppressionProduit(null)} title="Supprimer le produit">
        <p className="text-sm text-[var(--color-ink-700)] mb-4">Supprimer « {suppressionProduit?.nom} » ? Cette action est définitive.</p>
        <div className="flex gap-2">
          <Button variant="outline" fullWidth onClick={() => setSuppressionProduit(null)}>Annuler</Button>
          <Button variant="danger" fullWidth onClick={handleSupprimer}>Supprimer</Button>
        </div>
      </Modal>
    </div>
  );
}
