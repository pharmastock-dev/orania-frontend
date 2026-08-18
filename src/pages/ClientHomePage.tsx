import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, SearchX, Search as SearchIcon, LocateFixed, MapPin, Settings, Flame, TrendingUp } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { NativeSettings, AndroidSettings } from "capacitor-native-settings";
import ClientHeader from "../components/ClientHeader";
import ActiverNotifsWeb from "../components/ActiverNotifsWeb";
import FilterBar, { type Tri, type FiltreMulti } from "../components/FilterBar";
import CategoryBar from "../components/CategoryBar";
import TypePlatBar from "../components/TypePlatBar";
import StoreCard from "../components/StoreCard";
import DiscoveryRow from "../components/DiscoveryRow";
import ProductSearchCard from "../components/ProductSearchCard";
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

  // Recherche produits — quand le client tape "sushi", "poisson", etc., on
  // veut lui montrer directement les PRODUITS correspondants (avec le
  // commerce qui les vend), pas juste filtrer la liste des commerces par
  // leur nom. Anti-rebond (300ms) pour ne pas spammer le serveur à chaque
  // frappe.
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

  // La position est OBLIGATOIRE pour voir les commerces (distance, tri "proches",
  // temps de livraison estimé partout dans l'app en dépendent). Tant qu'elle
  // n'est pas activée, on affiche un écran de blocage au lieu de la liste.
  const [demandePositionEnCours, setDemandePositionEnCours] = useState(false);
  const [erreurPosition, setErreurPosition] = useState<string | null>(null);
  const [verificationEnCours, setVerificationEnCours] = useState(true);

  // On a peut-être déjà une position enregistrée d'une session précédente —
  // mais rien ne garantit que la localisation est toujours active côté système
  // (l'utilisateur a pu la désactiver depuis). On revérifie donc à chaque
  // ouverture ET à chaque retour sur l'app (pas juste au premier montage) —
  // sinon désactiver la position pendant que l'app est en arrière-plan (ou
  // sans jamais démonter cet écran) laisse une position obsolète utilisée
  // indéfiniment sans jamais redemander l'autorisation. Même logique pour
  // les notifications : un refus après coup doit aussi être détecté au retour.
  //
  // IMPORTANT : sur Android natif, navigator.permissions.query("geolocation")
  // ne reflète PAS toujours fidèlement la vraie permission native accordée
  // via le plugin Capacitor — ça provoquait un bug où l'écran d'activation
  // réapparaissait à chaque retour sur cette page (ex: après une commande),
  // même quand la position était bel et bien déjà autorisée. On utilise donc
  // la vraie API native du plugin sur Android, et l'API web uniquement sur
  // navigateur (où c'est fiable, et où le plugin natif n'est de toute façon
  // pas implémenté).
  useEffect(() => {
    let annule = false;

    async function verifier() {
      if (position) {
        try {
          if (Capacitor.isNativePlatform()) {
            const statut = await Geolocation.checkPermissions();
            const accorde = statut.location === "granted" || statut.coarseLocation === "granted";
            if (!annule && !accorde) setPosition(null);
          } else if (navigator.permissions?.query) {
            const statut = await navigator.permissions.query({ name: "geolocation" as PermissionName });
            if (!annule && statut.state !== "granted") setPosition(null);
          }
        } catch {
          // Échec de la vérification (API indisponible, etc.) — on garde la
          // valeur existante plutôt que de forcer une réactivation à tort.
        }
      }
      if (!annule) setVerificationEnCours(false);
    }

    verifier();

    // Retour sur l'app (native) : l'utilisateur a pu changer un réglage
    // système (position, notifications) pendant que l'app était en arrière-plan.
    let listenerNatif: { remove: () => void } | undefined;
    if (Capacitor.isNativePlatform()) {
      import("@capacitor/app").then(({ App }) => {
        App.addListener("resume", verifier).then((h) => {
          listenerNatif = h;
        });
      });
    }

    // Équivalent web : l'onglet redevient visible après avoir été en arrière-plan.
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

  // Le GPS est éteint (pas juste la permission refusée) — Android ne propose
  // pas de popup native pour ça via ce plugin, on offre donc un raccourci
  // direct vers l'écran de réglage plutôt que de laisser l'utilisateur
  // chercher lui-même dans les paramètres.
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

    // La recherche texte redirige désormais vers une recherche produits
    // (voir resultatsProduits) — plus de filtrage par nom de commerce ici.

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

  // Sections de découverte — volontairement calculées à partir de la liste
  // COMPLÈTE (pas "resultats"), donc jamais affectées par la catégorie, le
  // type de plat ou les filtres actifs. Une mise en avant éditoriale
  // constante, affichée sous la barre de filtres, "hors filtres".
  const commercesValides = useMemo(
    () => fournisseurs.filter((f) => f.valide !== false && f.actif !== false),
    [fournisseurs]
  );
  const discoveryPromos = useMemo(
    () => commercesValides.filter((f) => f.a_promo).slice(0, 10),
    [commercesValides]
  );
  const discoveryPopulaires = useMemo(
    () =>
      [...commercesValides]
        .filter((f) => (f.note_moyenne ?? 0) > 0)
        .sort((a, b) => (b.note_moyenne ?? 0) - (a.note_moyenne ?? 0))
        .slice(0, 10),
    [commercesValides]
  );

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
    <div className="min-h-screen bg-[var(--color-ink-50)] pb-6">
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
        {categorie === "restaurant" && <TypePlatBar actif={typePlat} onChange={setTypePlat} />}

        {erreur && (
          <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-3.5 py-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{erreur}</span>
          </div>
        )}

        {rechercheActive ? (
          // ---- Mode recherche : on affiche des PRODUITS, pas des commerces ----
          chargementProduits ? (
            <div className="flex flex-col gap-3">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : resultatsProduits.length === 0 ? (
            <EmptyState
              icon={<SearchX size={36} />}
              title="Aucun produit trouvé"
              description="Essayez un autre mot-clé — un plat, un ingrédient, un produit."
            />
          ) : (
            <>
              <p className="text-sm text-[var(--color-ink-500)]">
                {resultatsProduits.length} produit{resultatsProduits.length > 1 ? "s" : ""} trouvé{resultatsProduits.length > 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resultatsProduits.map((p) => (
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
            {/* Sections de découverte — toujours visibles, indépendantes des filtres */}
            <DiscoveryRow titre="Restos et promos" icone={<Flame size={17} className="text-[var(--color-orange-500)]" />} fournisseurs={discoveryPromos} positionClient={position} />
            <DiscoveryRow titre="Populaire près de vous" icone={<TrendingUp size={17} className="text-[var(--color-orange-500)]" />} fournisseurs={discoveryPopulaires} positionClient={position} />

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
          </>
        )}
      </div>
    </div>
  );
}
