import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, SearchX, Search as SearchIcon, LocateFixed, MapPin } from "lucide-react";
import ClientHeader from "../components/ClientHeader";
import FilterBar, { type Tri, type FiltreMulti } from "../components/FilterBar";
import CategoryBar from "../components/CategoryBar";
import TypePlatBar from "../components/TypePlatBar";
import StoreCard from "../components/StoreCard";
import Button from "../components/Button";
import { CardSkeleton } from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { useApp } from "../context/AppContext";
import { getFournisseurs } from "../api";
import { ApiError } from "../api/client";
import { estOuvertMaintenant } from "../utils/format";
import { getPositionActuelle, distanceMetres } from "../utils/geo";
import type { Fournisseur } from "../types";

export default function ClientHomePage() {
  const { position, setPosition } = useApp();
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState("tous");
  const [typePlat, setTypePlat] = useState("tous");
  const [tri, setTri] = useState<Tri>(null);
  const [filtresActifs, setFiltresActifs] = useState<FiltreMulti[]>([]);
  const [procheLoading, setProcheLoading] = useState(false);

  // La position est OBLIGATOIRE pour voir les commerces (distance, tri "proches",
  // temps de livraison estimé partout dans l'app en dépendent). Tant qu'elle
  // n'est pas activée, on affiche un écran de blocage au lieu de la liste.
  const [demandePositionEnCours, setDemandePositionEnCours] = useState(false);
  const [erreurPosition, setErreurPosition] = useState<string | null>(null);
  const [verificationEnCours, setVerificationEnCours] = useState(true);

  // On a peut-être déjà une position enregistrée d'une session précédente —
  // mais rien ne garantit que la localisation est toujours active côté système
  // (l'utilisateur a pu la désactiver depuis). On revérifie donc à chaque
  // ouverture, sinon une position désactivée après coup resterait utilisée
  // indéfiniment sans jamais redemander l'autorisation.
  useEffect(() => {
    let annule = false;
    async function verifier() {
      if (position && navigator.permissions?.query) {
        try {
          const statut = await navigator.permissions.query({ name: "geolocation" as PermissionName });
          if (!annule && statut.state !== "granted") {
            setPosition(null); // force le retour à l'écran d'activation
          }
        } catch {
          // API non disponible sur cet appareil/navigateur — on garde la valeur existante.
        }
      }
      if (!annule) setVerificationEnCours(false);
    }
    verifier();
    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function demanderPosition() {
    setDemandePositionEnCours(true);
    setErreurPosition(null);
    try {
      const pos = await getPositionActuelle();
      setPosition(pos);
    } catch (err) {
      setErreurPosition(err instanceof Error ? err.message : "Localisation indisponible.");
    } finally {
      setDemandePositionEnCours(false);
    }
  }

  function toggleFiltre(f: FiltreMulti) {
    setFiltresActifs((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  }

  async function handleProche() {
    setProcheLoading(true);
    try {
      const pos = await getPositionActuelle();
      setPosition(pos);
      setTri("proches");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Localisation indisponible.");
    } finally {
      setProcheLoading(false);
    }
  }

  useEffect(() => {
    if (!position) return; // pas la peine de charger les commerces avant d'avoir la position
    let annule = false;
    setLoading(true);
    setErreur(null);
    getFournisseurs()
      .then((data) => {
        if (!annule) setFournisseurs(data || []);
      })
      .catch((err) => {
        if (!annule) setErreur(err instanceof ApiError ? err.message : "Impossible de contacter le serveur.");
      })
      .finally(() => {
        if (!annule) setLoading(false);
      });
    return () => {
      annule = true;
    };
  }, [position]);

  const resultats = useMemo(() => {
    // Un commerce pas encore validé par l'admin (ou suspendu) ne doit jamais
    // apparaître côté client, même si le backend le renvoie dans la liste brute.
    let liste = fournisseurs.filter((f) => f.valide !== false && f.actif !== false);

    if (categorie !== "tous") {
      const q = categorie.toLowerCase();
      liste = liste.filter(
        (f) =>
          (f.categorie || "").toLowerCase() === q ||
          (f.produits_categories || []).some((c) => c.toLowerCase() === q)
      );
    }

    if (typePlat !== "tous") {
      const q = typePlat.toLowerCase();
      liste = liste.filter((f) => (f.produits_categories || []).some((c) => c.toLowerCase() === q));
    }

    if (recherche.trim()) {
      const q = recherche.trim().toLowerCase();
      liste = liste.filter(
        (f) =>
          f.nom.toLowerCase().includes(q) ||
          (f.categorie || "").toLowerCase().includes(q) ||
          (f.produits_categories || []).some((c) => c.toLowerCase().includes(q)) ||
          (f.produits_noms || []).some((n) => n.toLowerCase().includes(q))
      );
    }

    if (filtresActifs.includes("promos")) liste = liste.filter((f) => f.a_promo);
    if (filtresActifs.includes("ouverts")) liste = liste.filter((f) => estOuvertMaintenant(f.heure_ouverture, f.heure_fermeture));
    if (filtresActifs.includes("gratuite")) liste = liste.filter((f) => f.livraison_gratuite);

    if (tri === "notes") liste = [...liste].sort((a, b) => (b.note_moyenne ?? 0) - (a.note_moyenne ?? 0));
    if (tri === "proches" && position) {
      liste = [...liste].sort((a, b) => {
        const da = a.latitude != null && a.longitude != null ? distanceMetres(position, { latitude: a.latitude, longitude: a.longitude }) : Infinity;
        const db = b.latitude != null && b.longitude != null ? distanceMetres(position, { latitude: b.latitude, longitude: b.longitude }) : Infinity;
        return da - db;
      });
    }

    return liste;
  }, [fournisseurs, categorie, typePlat, recherche, filtresActifs, tri, position]);

  // ---- Écran de blocage tant que la position n'est pas activée ----
  if (verificationEnCours) {
    return <div className="min-h-screen bg-[var(--color-ink-50)]" />;
  }
  if (!position) {
    return (
      <div className="min-h-screen bg-[var(--color-ink-50)] flex flex-col">
        <div className="max-w-2xl w-full mx-auto px-4 pt-5">
          <ClientHeader showBack />
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-sm w-full text-center flex flex-col items-center">
            <span className="h-16 w-16 rounded-2xl bg-[var(--color-orange-100)] text-[var(--color-orange-600)] flex items-center justify-center">
              <MapPin size={28} />
            </span>
            <h1 className="font-display font-bold text-lg text-[var(--color-ink-900)] mt-4">Activez votre position</h1>
            <p className="text-[var(--color-ink-500)] mt-2">
              QREEB a besoin de votre position pour vous montrer les commerces proches de chez vous, avec la distance et le temps de livraison estimé.
            </p>

            {erreurPosition && (
              <div className="w-full flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-3.5 py-3 mt-4 text-left">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>{erreurPosition} Vérifiez que la localisation est autorisée pour ce site dans les réglages de votre navigateur ou de votre téléphone, puis réessayez.</span>
              </div>
            )}

            <Button fullWidth className="mt-5" icon={<LocateFixed size={16} />} loading={demandePositionEnCours} onClick={demanderPosition}>
              Activer ma position
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-ink-50)] pb-6">
      <div className="max-w-6xl mx-auto px-4 pt-5 flex flex-col gap-4">
        <div className="max-w-2xl w-full mx-auto lg:mx-0 flex flex-col gap-4">
          <ClientHeader showBack />

          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white border border-[var(--color-ink-100)] rounded-xl px-3.5 py-3">
              <SearchIcon size={18} className="text-[var(--color-ink-500)] shrink-0" />
              <input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Chercher : tacos, pizza, sushi..."
                className="flex-1 min-w-0 bg-transparent outline-none text-[15px] placeholder:text-[var(--color-ink-500)]"
              />
            </div>
            <button
              onClick={handleProche}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-3 rounded-xl border font-semibold text-sm ${
                tri === "proches" ? "bg-[var(--color-navy-900)] text-white border-[var(--color-navy-900)]" : "bg-white text-[var(--color-navy-900)] border-[var(--color-ink-100)]"
              }`}
            >
              <LocateFixed size={16} className={procheLoading ? "animate-spin" : ""} />
              Proche
            </button>
          </div>

          <FilterBar tri={tri} onTriChange={setTri} filtresActifs={filtresActifs} onToggleFiltre={toggleFiltre} />
        </div>

        <CategoryBar
          actif={categorie}
          onChange={(c) => {
            setCategorie(c);
            setTypePlat("tous"); // évite une combinaison impossible (ex: "Parfumerie" + "Pizza")
          }}
        />
        <TypePlatBar actif={typePlat} onChange={setTypePlat} />

        {erreur && (
          <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-3.5 py-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{erreur}</span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : resultats.length === 0 ? (
          <EmptyState
            icon={<SearchX size={36} />}
            title="Aucun commerce trouvé"
            description="Essayez une autre recherche, catégorie ou filtre."
          />
        ) : (
          <>
            <p className="text-sm text-[var(--color-ink-500)]">{resultats.length} résultat{resultats.length > 1 ? "s" : ""}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {resultats.map((f) => (
                <StoreCard key={f.id} fournisseur={f} positionClient={position} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
