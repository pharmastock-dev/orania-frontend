import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, SearchX, Search as SearchIcon, LocateFixed, MapPin, Settings, Sparkles, ChevronRight } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { NativeSettings, AndroidSettings } from "capacitor-native-settings";
import ClientHeader from "../components/ClientHeader";
import ActiverNotifsWeb from "../components/ActiverNotifsWeb";
import FilterBar, { type Tri, type FiltreMulti } from "../components/FilterBar";
import CategoryBar from "../components/CategoryBar";
import TypePlatBar from "../components/TypePlatBar";
import StoreCard from "../components/StoreCard";
import DiscoveryRow from "../components/DiscoveryRow";
import DiscoveryRowCompact from "../components/DiscoveryRowCompact";
import ProductSearchCard from "../components/ProductSearchCard";
import BottomNav from "../components/BottomNav";
import HeroBanner from "../components/HeroBanner";
import CartFloatingButton from "../components/CartFloatingButton";
import Button from "../components/Button";
import { CardSkeleton } from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { useApp } from "../context/AppContext";
import { getFournisseurs, enregistrerTokenAcheteur, rechercherProduits } from "../api";
import { ApiError } from "../api/client";
import { estOuvertMaintenant } from "../utils/format";
import { getPositionActuelle, distanceMetres } from "../utils/geo";
import type { Fournisseur, ProduitRecherche } from "../types";

export default function ClientHomePage() {
  const navigate = useNavigate();
  const { position, setPosition, client } = useApp();
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState("tous");
  const [typePlat, setTypePlat] = useState("tous");
  const [tri, setTri] = useState<Tri>(null);
  const [filtresActifs, setFiltresActifs] = useState<FiltreMulti[]>([]);
  const [procheLoading, setProcheLoading] = useState(false);

  const [resultatsProduits, setResultatsProduits] = useState<ProduitRecherche[]>([]);
  const [chargementProduits, setChargementProduits] = useState(false);
  const rechercheActive = recherche.trim().length >= 2;

  useEffect(() => {
    if (!rechercheActive) {
      setResultatsProduits([]);
      return;
    }
    let annule = false;
    setChargementProduits(true);
    const minuteur = setTimeout(() => {
      rechercherProduits(recherche.trim())
        .then((data) => {
          if (!annule) setResultatsProduits(data);
        })
        .catch(() => {
          if (!annule) setResultatsProduits([]);
        })
        .finally(() => {
          if (!annule) setChargementProduits(false);
        });
    }, 300);
    return () => {
      annule = true;
      clearTimeout(minuteur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recherche, rechercheActive]);

  const [demandePositionEnCours, setDemandePositionEnCours] = useState(false);
  const [erreurPosition, setErreurPosition] = useState<string | null>(null);
  const [verificationEnCours, setVerificationEnCours] = useState(true);

  useEffect(() => {
    let annule = false;
    setVerificationEnCours(false);

    async function verifier() {
      if (position) {
        try {
          const fraiche = await getPositionActuelle();
          if (!annule) setPosition(fraiche);
        } catch {
          if (!annule) setPosition(null);
        }
      }
    }

    verifier();

    let listenerNatif: { remove: () => void } | undefined;
    if (Capacitor.isNativePlatform()) {
      import("@capacitor/app").then(({ App }) => {
        App.addListener("resume", verifier).then((h) => {
          listenerNatif = h;
        });
      });
    }

    function surVisibilite() {
      if (document.visibilityState === "visible") verifier();
    }
    document.addEventListener("visibilitychange", surVisibilite);

    return () => {
      annule = true;
      listenerNatif?.remove();
      document.removeEventListener("visibilitychange", surVisibilite);
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

  async function ouvrirReglagesLocalisation() {
    if (Capacitor.getPlatform() === "android") {
      await NativeSettings.openAndroid({ option: AndroidSettings.Location });
    }
  }

  const gpsEteint = erreurPosition?.toLowerCase().includes("gps") || erreurPosition?.toLowerCase().includes("location services");

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

  // Bouton retour materiel Android : sur l'accueil client, ne doit jamais
  // faire quitter vers l'ecran de selection des espaces. Si "Voir tout"
  // est actif (tri/filtre), revient d'abord a la vue decouverte ; sinon,
  // minimise l'app (comportement standard d'un ecran "accueil").
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let listenerRetour: { remove: () => void } | undefined;
    import("@capacitor/app").then(({ App }) => {
      App.addListener("backButton", () => {
        if (tri !== null || filtresActifs.length > 0) {
          setTri(null);
          setFiltresActifs([]);
        } else {
          App.exitApp();
        }
      }).then((h) => {
        listenerRetour = h;
      });
    });
    return () => listenerRetour?.remove();
  }, [tri, filtresActifs]);

  useEffect(() => {
    if (!position) return;
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
  }, [fournisseurs, categorie, typePlat, filtresActifs, tri, position]);

  const commercesCategorie = useMemo(() => {
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
    return liste;
  }, [fournisseurs, categorie, typePlat]);

  const decouverteActive = !tri && filtresActifs.length === 0;

  const discoveryPromos = useMemo(
    () => commercesCategorie.filter((f) => f.a_promo).slice(0, 10),
    [commercesCategorie]
  );
  const discoveryProximite = useMemo(() => {
    if (!position) return [];
    return [...commercesCategorie]
      .filter((f) => f.latitude != null && f.longitude != null)
      .sort((a, b) => {
        const da = distanceMetres(position, { latitude: a.latitude!, longitude: a.longitude! });
        const db = distanceMetres(position, { latitude: b.latitude!, longitude: b.longitude! });
        return da - db;
      })
      .slice(0, 10);
  }, [commercesCategorie, position]);
  const discoveryTousPartenaires = useMemo(
    () => [...commercesCategorie].sort((a, b) => (b.note_moyenne ?? 0) - (a.note_moyenne ?? 0)).slice(0, 10),
    [commercesCategorie]
  );

  const resultatsProduitsFiltres = useMemo(() => {
    const idsAutorises = new Set(resultats.map((f) => f.id));
    return resultatsProduits.filter((p) => idsAutorises.has(p.fournisseur_id));
  }, [resultatsProduits, resultats]);

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
                <span>{erreurPosition}</span>
              </div>
            )}

            {gpsEteint && Capacitor.getPlatform() === "android" && (
              <Button fullWidth variant="outline" className="mt-3" icon={<Settings size={16} />} onClick={ouvrirReglagesLocalisation}>
                Ouvrir les réglages de localisation
              </Button>
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
    <div className="min-h-screen bg-[var(--color-ink-50)] pb-24">
      <div className="max-w-6xl mx-auto px-4 pt-5 flex flex-col gap-4">
        <div className="max-w-2xl w-full mx-auto lg:mx-0 flex flex-col gap-4">
          <ClientHeader showBack />

          {client && <ActiverNotifsWeb onToken={(token) => enregistrerTokenAcheteur(client.id, token).catch(() => {})} />}

          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white border border-[var(--color-ink-100)] rounded-xl px-3.5 py-3">
              <SearchIcon size={18} className="text-[var(--color-ink-500)] shrink-0" />
              <input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Envie de quoi aujourd'hui ?"
                className="flex-1 min-w-0 bg-transparent outline-none text-[15px] placeholder:text-[var(--color-ink-500)]"
              />
            </div>
            <button
              onClick={handleProche}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-3 rounded-xl border font-semibold text-sm transition-colors ${
                tri === "proches" ? "bg-[var(--color-navy-900)] text-white border-[var(--color-navy-900)]" : "bg-white text-[var(--color-navy-900)] border-[var(--color-ink-100)]"
              }`}
            >
              <LocateFixed size={16} className={procheLoading ? "animate-spin" : ""} />
              Proche
            </button>
          </div>

          <FilterBar tri={tri} onTriChange={setTri} filtresActifs={filtresActifs} onToggleFiltre={toggleFiltre} />
        </div>

        <HeroBanner onDecouvrir={() => document.getElementById("resultats-section")?.scrollIntoView({ behavior: "smooth" })} />

        <button
          onClick={() => navigate("/client/assistant")}
          className="flex items-center gap-3 bg-gradient-to-r from-[var(--color-navy-900)] to-[#1e2740] rounded-2xl px-4 py-3.5 text-left"
        >
          <span className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <Sparkles size={18} className="text-[var(--color-orange-400)]" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-[15px]">Pas d'idée ? Laissez-moi choisir pour vous</p>
            <p className="text-white/60 text-xs">Budget, envie, distance — 5 questions, 3 suggestions</p>
          </div>
          <ChevronRight size={18} className="text-white/60 shrink-0" />
        </button>

        <CategoryBar
          actif={categorie}
          onChange={(c) => {
            setCategorie(c);
            setTypePlat("tous");
          }}
        />
        {categorie === "restaurant" && <TypePlatBar actif={typePlat} onChange={setTypePlat} />}

        {erreur && (
          <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-3.5 py-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{erreur}</span>
          </div>
        )}

        {rechercheActive ? (
          chargementProduits ? (
            <div className="flex flex-col gap-3">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : resultatsProduitsFiltres.length === 0 ? (
            <EmptyState
              icon={<SearchX size={36} />}
              title="Aucun produit trouvé"
              description={
                resultatsProduits.length > 0
                  ? "Aucun produit ne correspond à ce mot-clé avec les filtres actifs — essayez de les retirer."
                  : "Essayez un autre mot-clé — un plat, un ingrédient, un produit."
              }
            />
          ) : (
            <>
              <p className="text-sm text-[var(--color-ink-500)]">
                {resultatsProduitsFiltres.length} produit{resultatsProduitsFiltres.length > 1 ? "s" : ""} trouvé{resultatsProduitsFiltres.length > 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resultatsProduitsFiltres.map((p) => (
                  <ProductSearchCard key={p.id} produit={p} />
                ))}
              </div>
            </>
          )
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <>
            {decouverteActive ? (
              <>
                <DiscoveryRowCompact titre="Promos" fournisseurs={discoveryPromos} positionClient={position} onVoirTout={() => toggleFiltre("promos")} />
                <DiscoveryRowCompact titre="À proximité" fournisseurs={discoveryProximite} positionClient={position} onVoirTout={handleProche} />
                <DiscoveryRowCompact titre="Tous nos partenaires" fournisseurs={discoveryTousPartenaires} positionClient={position} onVoirTout={() => setTri("notes")} />
              </>
            ) : (
              <div id="resultats-section">
                {resultats.length === 0 ? (
                  <EmptyState
                    icon={<SearchX size={36} />}
                    title="Aucun commerce trouvé"
                    description="Essayez une autre catégorie ou filtre."
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
            )}
          </>
        )}
      </div>

      <CartFloatingButton avecBarreNavigation />
      <BottomNav />
    </div>
  );
}
