import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, Phone, Clock, MapPin, Map as MapIcon, ChevronDown, AlertTriangle, PackageX, Flag } from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import BackButton from "../components/BackButton";
import StatusPill from "../components/StatusPill";
import ProductCard from "../components/ProductCard";
import { Loading } from "../components/Loading";
import EmptyState from "../components/EmptyState";
import CartFloatingButton from "../components/CartFloatingButton";
import Modal from "../components/Modal";
import Button from "../components/Button";
import RatingStars from "../components/RatingStars";
import ReviewForm from "../components/ReviewForm";
import ReclamationModal from "../components/ReclamationModal";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { getFournisseurs, getProduits, getAvisFournisseur, resolveImageUrl } from "../api";
import { ApiError } from "../api/client";
import { formatHoraires, estOuvertMaintenant } from "../utils/format";
import { getCategorieLabel, getEmojiCategorieProduit } from "../utils/categories";
import { distanceMetres, estimerTempsLivraison } from "../utils/geo";
import type { Fournisseur, Produit, Avis } from "../types";

const pinIcon = L.divIcon({
  className: "",
  html: `<svg width="30" height="38" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 0C7.6 0 0 7.6 0 17c0 12.7 17 25 17 25s17-12.3 17-25C34 7.6 26.4 0 17 0Z" fill="#f5790c"/>
    <circle cx="17" cy="17" r="6.5" fill="white"/>
  </svg>`,
  iconSize: [30, 38],
  iconAnchor: [15, 38],
});

type FiltreCategorie = "tous" | "promotions" | string;

export default function StorePage() {
  const { id } = useParams();
  const { addToCart, replaceCartAvecProduit, updateQuantite, cart, position, client } = useApp();
  const { showToast } = useToast();

  const [fournisseur, setFournisseur] = useState<Fournisseur | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [avis, setAvis] = useState<Avis[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [categorieActive, setCategorieActive] = useState<FiltreCategorie>("tous");
  const [conflit, setConflit] = useState<Produit | null>(null);
  const [carteOuverte, setCarteOuverte] = useState(false);
  const [pourquoiOuvert, setPourquoiOuvert] = useState(false);
  const [avisOuvert, setAvisOuvert] = useState(false);
  const [reclamationOuverte, setReclamationOuverte] = useState(false);

  useEffect(() => {
    if (!id) return;
    let annule = false;
    setLoading(true);
    setErreur(null);
    Promise.all([getFournisseurs(), getProduits(Number(id))])
      .then(([liste, p]) => {
        if (annule) return;
        const trouve = (liste || []).find((f) => f.id === Number(id));
        if (!trouve) setErreur("Commerce introuvable.");
        else if (trouve.valide === false) setErreur("Ce commerce est en attente de validation par l'administration.");
        else if (trouve.actif === false) setErreur("Ce commerce n'est plus disponible actuellement.");
        else setFournisseur(trouve);
        setProduits(p || []);
      })
      .catch((err) => {
        if (!annule) setErreur(err instanceof ApiError ? err.message : "Impossible de contacter le serveur.");
      })
      .finally(() => {
        if (!annule) setLoading(false);
      });
    getAvisFournisseur(Number(id))
      .then((data) => !annule && setAvis(data || []))
      .catch(() => {});
    return () => {
      annule = true;
    };
  }, [id]);

  const categoriesProduits = useMemo(() => Array.from(new Set(produits.map((p) => p.categorie))), [produits]);

  const produitsAffiches = useMemo(() => {
    if (categorieActive === "tous") return produits;
    if (categorieActive === "promotions") return produits.filter((p) => p.prix_promo != null);
    return produits.filter((p) => p.categorie === categorieActive);
  }, [produits, categorieActive]);

  const produitsParCategorie = useMemo(() => {
    const groupes = new Map<string, Produit[]>();
    produitsAffiches.forEach((p) => {
      const liste = groupes.get(p.categorie) || [];
      liste.push(p);
      groupes.set(p.categorie, liste);
    });
    return Array.from(groupes.entries());
  }, [produitsAffiches]);

  const ouvert = fournisseur ? estOuvertMaintenant(fournisseur.heure_ouverture, fournisseur.heure_fermeture) : false;

  const distance =
    fournisseur && position && fournisseur.latitude != null && fournisseur.longitude != null
      ? distanceMetres(position, { latitude: fournisseur.latitude, longitude: fournisseur.longitude })
      : null;
  const temps = distance != null ? estimerTempsLivraison(distance) : null;

  function handleAdd(produit: Produit) {
    if (!fournisseur) return;
    const res = addToCart(produit, fournisseur.nom);
    if (res === "conflit") setConflit(produit);
    else showToast(`${produit.nom} ajouté au panier`, "success");
  }

  function handleIncrement(produit: Produit) {
    const item = cart.items.find((i) => i.produit.id === produit.id);
    updateQuantite(produit.id, (item?.quantite || 0) + 1);
  }

  function handleDecrement(produit: Produit) {
    const item = cart.items.find((i) => i.produit.id === produit.id);
    updateQuantite(produit.id, (item?.quantite || 0) - 1);
  }

  function confirmerRemplacement() {
    if (conflit && fournisseur) {
      replaceCartAvecProduit(conflit, fournisseur.nom);
      showToast("Panier remplacé", "success");
    }
    setConflit(null);
  }

  if (loading) return <Loading label="Chargement du commerce..." />;

  if (erreur && !fournisseur) {
    return (
      <div className="max-w-md mx-auto px-4 pt-5">
        <BackButton />
        <EmptyState icon={<AlertTriangle size={36} />} title="Commerce introuvable" description={erreur} />
      </div>
    );
  }

  if (!fournisseur) return null;
  const image = resolveImageUrl(fournisseur.photo);
  const noteMoyenne = fournisseur.note_moyenne ?? 0;

  return (
    <div className="min-h-screen bg-[var(--color-ink-50)] pb-28">
      <div className="max-w-2xl mx-auto bg-white sm:mt-0">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <BackButton />
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-lg text-[var(--color-ink-900)] truncate">{fournisseur.nom}</h1>
            <div className="flex items-center gap-1.5 text-sm mt-0.5">
              <Star size={13} className="fill-[var(--color-orange-500)] text-[var(--color-orange-500)]" />
              <span className="font-semibold">{noteMoyenne.toFixed(1)}</span>
              <span className="text-[var(--color-ink-500)]">· {fournisseur.avis_count ?? 0} avis</span>
            </div>
          </div>
          {fournisseur.categorie && (
            <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--color-orange-100)] text-[var(--color-orange-600)]">
              {getCategorieLabel(fournisseur.categorie)}
            </span>
          )}
        </div>

        <div className="relative h-52 bg-[var(--color-ink-100)]">
          {image && <img src={image} alt={fournisseur.nom} className="h-full w-full object-cover" />}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-px relative flex flex-col gap-3 pt-3">
        <div className="grid grid-cols-3 bg-white rounded-2xl border border-[var(--color-ink-100)] divide-x divide-[var(--color-ink-100)] overflow-hidden">
          <div className="flex flex-col items-center justify-center py-3 px-1">
            <p className="text-[10px] font-semibold text-[var(--color-ink-500)] uppercase tracking-wide">Livraison</p>
            <p className="font-bold text-sm text-[var(--color-ink-900)] mt-0.5 text-center">
              {fournisseur.livraison_gratuite ? "Gratuite" : fournisseur.frais_min != null ? `${fournisseur.frais_min}–${fournisseur.frais_max} DA` : "—"}
            </p>
          </div>
          <div className="flex flex-col items-center justify-center py-3 px-1">
            <p className="text-[10px] font-semibold text-[var(--color-ink-500)] uppercase tracking-wide">Temps</p>
            <p className="font-bold text-sm text-[var(--color-ink-900)] mt-0.5">
              {temps ? `${temps.min}–${temps.max} min` : "—"}
            </p>
          </div>
          <div className="flex flex-col items-center justify-center py-3 px-1">
            <p className="text-[10px] font-semibold text-[var(--color-ink-500)] uppercase tracking-wide">Note</p>
            <p className="font-bold text-sm text-[var(--color-ink-900)] mt-0.5 flex items-center gap-1">
              <Star size={12} className="fill-[var(--color-orange-500)] text-[var(--color-orange-500)]" /> {noteMoyenne.toFixed(1)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 bg-white rounded-2xl border border-[var(--color-ink-100)] px-4 py-3 text-sm">
          {fournisseur.adresse && (
            <span className="flex items-center gap-1.5 text-[var(--color-ink-700)]">
              <MapPin size={14} className="text-[var(--color-ink-500)]" /> {fournisseur.adresse}
            </span>
          )}
          {fournisseur.telephone && (
            <a href={`tel:${fournisseur.telephone}`} className="flex items-center gap-1.5 text-blue-600 font-medium">
              <Phone size={14} /> {fournisseur.telephone}
            </a>
          )}
          {fournisseur.heure_ouverture && (
            <span className="flex items-center gap-1.5 text-[var(--color-ink-700)]">
              <Clock size={14} className="text-[var(--color-ink-500)]" /> {formatHoraires(fournisseur.heure_ouverture, fournisseur.heure_fermeture)}
            </span>
          )}
          <StatusPill ouvert={ouvert} />
        </div>

        <button
          onClick={() => (client ? setReclamationOuverte(true) : showToast("Connectez-vous pour signaler un problème.", "error"))}
          className="self-start flex items-center gap-1.5 text-xs font-semibold text-[var(--color-ink-500)] hover:text-red-500 px-1"
        >
          <Flag size={12} /> Signaler un problème avec ce commerce
        </button>

        {!ouvert && (
          <div className="bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] text-[var(--color-ink-700)] text-sm font-medium rounded-xl px-3 py-2.5 text-center">
            Fermé actuellement
          </div>
        )}

        <div>
          <button
            onClick={() => setCarteOuverte((v) => !v)}
            className="w-full flex items-center justify-between bg-white rounded-2xl border border-[var(--color-ink-100)] px-4 py-3.5 font-semibold text-[var(--color-ink-900)]"
          >
            <span className="flex items-center gap-2"><MapIcon size={16} className="text-[var(--color-ink-500)]" /> Où se trouve ce commerce ?</span>
            <ChevronDown size={16} className={`text-[var(--color-ink-500)] transition-transform ${carteOuverte ? "rotate-180" : ""}`} />
          </button>
          {carteOuverte && (
            fournisseur.latitude != null && fournisseur.longitude != null ? (
              <div className="mt-2 rounded-2xl overflow-hidden border border-[var(--color-ink-100)]" style={{ height: 220 }}>
                <MapContainer center={[fournisseur.latitude, fournisseur.longitude]} zoom={15} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                  <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[fournisseur.latitude, fournisseur.longitude]} icon={pinIcon} />
                </MapContainer>
              </div>
            ) : (
              <div className="mt-2 bg-white rounded-2xl border border-[var(--color-ink-100)] px-4 py-3.5 text-sm text-[var(--color-ink-500)]">
                Ce commerce n'a pas encore renseigné sa position sur la carte.
              </div>
            )
          )}
        </div>

        <div>
          <button
            onClick={() => setPourquoiOuvert((v) => !v)}
            className="w-full flex items-center justify-between bg-[var(--color-orange-500)] rounded-2xl px-4 py-3.5 font-bold text-white"
          >
            <span>Pourquoi nous choisir ?</span>
            <ChevronDown size={16} className={`transition-transform ${pourquoiOuvert ? "rotate-180" : ""}`} />
          </button>
          {pourquoiOuvert && (
            <div className="mt-2 bg-white rounded-2xl border border-[var(--color-ink-100)] px-4 py-3.5 text-sm text-[var(--color-ink-700)] whitespace-pre-line">
              {fournisseur.description || "Ce commerce n'a pas encore ajouté de description."}
            </div>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto scroll-row pt-1">
          <button
            onClick={() => setCategorieActive("promotions")}
            className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold ${
              categorieActive === "promotions" ? "bg-[var(--color-pink-500)] text-white" : "bg-[var(--color-pink-100)] text-[var(--color-pink-600)]"
            }`}
          >
            🔥 Promotions
          </button>
          <button
            onClick={() => setCategorieActive("tous")}
            className={`shrink-0 px-3.5 py-2 rounded-full text-sm font-semibold ${
              categorieActive === "tous" ? "bg-[var(--color-orange-500)] text-white" : "bg-white border border-[var(--color-ink-100)] text-[var(--color-ink-700)]"
            }`}
          >
            Tous
          </button>
          {categoriesProduits.map((c) => (
            <button
              key={c}
              onClick={() => setCategorieActive(c)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
                categorieActive === c ? "bg-[var(--color-orange-500)] text-white" : "bg-white border border-[var(--color-ink-100)] text-[var(--color-ink-700)]"
              }`}
            >
              <span>{getEmojiCategorieProduit(c)}</span> {c}
            </button>
          ))}
        </div>

        {produitsAffiches.length === 0 ? (
          <EmptyState icon={<PackageX size={32} />} title="Aucun produit dans cette catégorie" />
        ) : (
          <div className="flex flex-col gap-5 mt-1">
            {produitsParCategorie.map(([cat, liste]) => (
              <div key={cat} className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-[var(--color-ink-100)]" />
                  <p className="text-xs font-bold text-[var(--color-ink-500)] uppercase tracking-wider whitespace-nowrap">{getEmojiCategorieProduit(cat)} {cat}</p>
                  <div className="h-px flex-1 bg-[var(--color-ink-100)]" />
                </div>
                {liste.map((p) => (
                  <ProductCard
                    key={p.id}
                    produit={{ ...p, disponible: p.disponible && ouvert }}
                    quantite={cart.items.find((i) => i.produit.id === p.id)?.quantite || 0}
                    onAdd={handleAdd}
                    onIncrement={handleIncrement}
                    onDecrement={handleDecrement}
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        {!ouvert && produitsAffiches.length > 0 && (
          <p className="text-xs text-center text-[var(--color-ink-500)]">Ce commerce est actuellement fermé. La commande sera possible dès sa réouverture.</p>
        )}

        <button
          onClick={() => setAvisOuvert((v) => !v)}
          className="w-full flex items-center justify-between bg-white rounded-2xl border border-[var(--color-ink-100)] px-4 py-3.5 font-bold text-[var(--color-ink-900)] mt-2"
        >
          <span className="flex items-center gap-2">
            <Star size={16} className="fill-[var(--color-orange-500)] text-[var(--color-orange-500)]" /> Avis clients
            <span className="text-xs font-semibold bg-[var(--color-ink-100)] text-[var(--color-ink-700)] px-2 py-0.5 rounded-full">{avis.length}</span>
          </span>
          <ChevronDown size={16} className={`text-[var(--color-ink-500)] transition-transform ${avisOuvert ? "rotate-180" : ""}`} />
        </button>
        {avisOuvert && (
          <div className="flex flex-col gap-2">
            <div className="bg-[var(--color-orange-100)] rounded-2xl p-4">
              <p className="font-bold text-[var(--color-ink-900)] mb-3">Donner votre avis</p>
              {client ? (
                <ReviewForm fournisseurId={fournisseur.id} acheteurId={client.id} onEnvoye={() => getAvisFournisseur(fournisseur.id).then(setAvis)} />
              ) : (
                <p className="text-sm text-[var(--color-ink-700)]">
                  <Link to="/client" className="font-semibold text-[var(--color-navy-900)] underline">Connectez-vous</Link> pour laisser un avis sur ce commerce.
                </p>
              )}
            </div>

            {avis.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-500)] text-center py-2">Aucun avis pour le moment.</p>
            ) : (
              avis.map((a, i) => (
                <div key={a.id ?? i} className="bg-white rounded-2xl border border-[var(--color-ink-100)] p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-[var(--color-ink-900)]">{a.acheteur_nom || "Client"}</p>
                    <RatingStars note={a.note} size={13} />
                  </div>
                  {a.commentaire && <p className="text-sm text-[var(--color-ink-700)] mt-1.5">{a.commentaire}</p>}
                  {a.created_at && <p className="text-xs text-[var(--color-ink-500)] mt-1">{new Date(a.created_at).toLocaleDateString("fr-FR")}</p>}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <CartFloatingButton />

      <Modal open={!!conflit} onClose={() => setConflit(null)} title="Panier différent">
        <p className="text-sm text-[var(--color-ink-700)] mb-4">
          Votre panier contient déjà des produits de <strong>{cart.fournisseurNom}</strong>. Voulez-vous remplacer le panier ?
        </p>
        <div className="flex gap-2">
          <Button variant="outline" fullWidth onClick={() => setConflit(null)}>Annuler</Button>
          <Button variant="primary" fullWidth onClick={confirmerRemplacement}>Remplacer</Button>
        </div>
      </Modal>

      {client && (
        <ReclamationModal
          open={reclamationOuverte}
          onClose={() => setReclamationOuverte(false)}
          auteurType="client"
          auteurId={client.id}
          auteurNom={client.nom}
          auteurTelephone={client.telephone}
        />
      )}
    </div>
  );
}
