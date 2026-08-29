import { useCallback, useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { LocateFixed, Search, X, MapPinned } from "lucide-react";
import type { Coordonnees } from "../types";
import { getPositionActuelle } from "../utils/geo";

const pinIcon = L.divIcon({
  className: "",
  html: `<svg width="34" height="42" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 0C7.6 0 0 7.6 0 17c0 12.7 17 25 17 25s17-12.3 17-25C34 7.6 26.4 0 17 0Z" fill="#f5790c"/>
    <circle cx="17" cy="17" r="6.5" fill="white"/>
  </svg>`,
  iconSize: [34, 42],
  iconAnchor: [17, 42],
});

const ORAN_CENTER: Coordonnees = { latitude: 35.6969, longitude: -0.6331 };

function ClicSurCarte({ onPick }: { onPick: (pos: Coordonnees) => void }) {
  useMapEvents({
    click(e) {
      onPick({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    },
  });
  return null;
}

function RecentreCarte({ position }: { position: Coordonnees }) {
  const map = useMap();
  map.setView([position.latitude, position.longitude], map.getZoom());
  return null;
}

interface ResultatRecherche {
  display_name: string;
  lat: string;
  lon: string;
}

interface DeliveryMapProps {
  position: Coordonnees | null;
  onChange: (pos: Coordonnees) => void;
}

function extraireCoordonnees(texte: string): Coordonnees | null {
  const match = texte.match(/(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)/);
  if (!match) return null;
  const latitude = parseFloat(match[1]);
  const longitude = parseFloat(match[2]);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

export default function DeliveryMap({ position, onChange }: DeliveryMapProps) {
  const [locLoading, setLocLoading] = useState(false);
  const centre = position || ORAN_CENTER;

  const [recherche, setRecherche] = useState("");
  const [resultats, setResultats] = useState<ResultatRecherche[]>([]);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const [afficherResultats, setAfficherResultats] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    const terme = recherche.trim();
    if (terme.length < 3) {
      setResultats([]);
      return;
    }
    timerRef.current = window.setTimeout(async () => {
      setRechercheEnCours(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=dz&viewbox=-0.85,35.85,-0.45,35.55&bounded=0&q=${encodeURIComponent(terme)}`;
        const res = await fetch(url, { headers: { "Accept-Language": "fr" } });
        const data = (await res.json()) as ResultatRecherche[];
        setResultats(data);
        setAfficherResultats(true);
      } catch {
        setResultats([]);
      } finally {
        setRechercheEnCours(false);
      }
    }, 500);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [recherche]);

  function choisirResultat(r: ResultatRecherche) {
    onChange({ latitude: parseFloat(r.lat), longitude: parseFloat(r.lon) });
    setRecherche(r.display_name);
    setAfficherResultats(false);
  }

  function effacerRecherche() {
    setRecherche("");
    setResultats([]);
    setAfficherResultats(false);
  }

  const [coordonneesTexte, setCoordonneesTexte] = useState("");
  const [erreurCoordonnees, setErreurCoordonnees] = useState<string | null>(null);

  function validerCoordonnees() {
    const pos = extraireCoordonnees(coordonneesTexte);
    if (!pos) {
      setErreurCoordonnees("Coordonnées non reconnues — collez le format « latitude, longitude ».");
      return;
    }
    onChange(pos);
    setErreurCoordonnees(null);
    setCoordonneesTexte("");
  }

  const handleMaPosition = useCallback(async () => {
    setLocLoading(true);
    try {
      const pos = await getPositionActuelle();
      onChange(pos);
    } catch {
      // silencieux — le marqueur reste déplaçable manuellement
    } finally {
      setLocLoading(false);
    }
  }, [onChange]);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <div className="flex items-center gap-2 bg-white border border-[var(--color-ink-100)] rounded-xl px-3.5 py-2.5">
          <Search size={16} className="text-[var(--color-ink-500)] shrink-0" />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            onFocus={() => resultats.length > 0 && setAfficherResultats(true)}
            placeholder="Chercher une adresse, une rue, un quartier..."
            className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-[var(--color-ink-500)]"
          />
          {rechercheEnCours && <span className="h-3.5 w-3.5 border-2 border-[var(--color-orange-500)] border-t-transparent rounded-full animate-spin shrink-0" />}
          {recherche && !rechercheEnCours && (
            <button onClick={effacerRecherche} className="shrink-0 text-[var(--color-ink-400)]">
              <X size={16} />
            </button>
          )}
        </div>

        {afficherResultats && resultats.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[var(--color-ink-100)] rounded-xl shadow-lg z-[1100] overflow-hidden max-h-64 overflow-y-auto">
            {resultats.map((r, i) => (
              <button
                key={i}
                onClick={() => choisirResultat(r)}
                className="w-full text-left px-3.5 py-3 text-sm text-[var(--color-ink-900)] hover:bg-[var(--color-ink-50)] border-b border-[var(--color-ink-100)] last:border-0"
              >
                {r.display_name}
              </button>
            ))}
          </div>
        )}

        {afficherResultats && !rechercheEnCours && recherche.trim().length >= 3 && resultats.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[var(--color-ink-100)] rounded-xl shadow-lg z-[1100] px-3.5 py-3 text-sm text-[var(--color-ink-500)]">
            Aucune adresse trouvée — essayez un terme différent, ou collez des coordonnées GPS ci-dessous.
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 bg-white border border-[var(--color-ink-100)] rounded-xl px-3.5 py-2.5">
          <MapPinned size={16} className="text-[var(--color-ink-500)] shrink-0" />
          <input
            value={coordonneesTexte}
            onChange={(e) => { setCoordonneesTexte(e.target.value); setErreurCoordonnees(null); }}
            placeholder="Ou collez des coordonnées GPS (ex: 35.6969, -0.6331)"
            className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-[var(--color-ink-500)]"
          />
          <button
            onClick={validerCoordonnees}
            disabled={!coordonneesTexte.trim()}
            className="shrink-0 text-xs font-bold text-[var(--color-orange-600)] disabled:text-[var(--color-ink-300)] px-2"
          >
            Valider
          </button>
        </div>
        {erreurCoordonnees && <p className="text-xs text-red-600 px-1">{erreurCoordonnees}</p>}
        <p className="text-[11px] text-[var(--color-ink-500)] px-1">
          Astuce précision maximale : sur l'app Google Maps (gratuite), appuyez longuement sur votre emplacement exact — les coordonnées apparaissent en bas, appuyez dessus pour les copier, puis collez-les ici.
        </p>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-[var(--color-ink-100)]" style={{ height: 260 }}>
        <MapContainer center={[centre.latitude, centre.longitude]} zoom={14} style={{ height: "100%", width: "100%" }} zoomControl>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClicSurCarte onPick={onChange} />
          {position && (
            <>
              <Marker
                position={[position.latitude, position.longitude]}
                icon={pinIcon}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const m = e.target as L.Marker;
                    const p = m.getLatLng();
                    onChange({ latitude: p.lat, longitude: p.lng });
                  },
                }}
              />
              <RecentreCarte position={position} />
            </>
          )}
        </MapContainer>
        <button
          onClick={handleMaPosition}
          className="absolute bottom-3 right-3 z-[1000] flex items-center gap-1.5 bg-[var(--color-orange-500)] text-white text-xs font-semibold px-3 py-2 rounded-full shadow-lg"
        >
          <LocateFixed size={13} className={locLoading ? "animate-spin" : ""} />
          Ma position
        </button>
      </div>
    </div>
  );
}
