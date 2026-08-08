import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import Modal from "./Modal";
import { Navigation } from "lucide-react";
import Button from "./Button";

const pinIcon = L.divIcon({
  className: "",
  html: `<svg width="30" height="38" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 0C7.6 0 0 7.6 0 17c0 12.7 17 25 17 25s17-12.3 17-25C34 7.6 26.4 0 17 0Z" fill="#f5790c"/>
    <circle cx="17" cy="17" r="6.5" fill="white"/>
  </svg>`,
  iconSize: [30, 38],
  iconAnchor: [15, 38],
});

interface PositionClientModalProps {
  open: boolean;
  onClose: () => void;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  clientNom?: string;
}

export default function PositionClientModal({ open, onClose, latitude, longitude, clientNom }: PositionClientModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={`Position de livraison${clientNom ? ` — ${clientNom}` : ""}`}>
      {latitude != null && longitude != null ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl overflow-hidden border border-[var(--color-ink-100)]" style={{ height: 280 }}>
            <MapContainer center={[latitude, longitude]} zoom={16} style={{ height: "100%", width: "100%" }}>
              <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[latitude, longitude]} icon={pinIcon} />
            </MapContainer>
          </div>
          <Button
            fullWidth
            icon={<Navigation size={16} />}
            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`, "_blank")}
          >
            Ouvrir l'itinéraire dans Google Maps
          </Button>
        </div>
      ) : (
        <p className="text-sm text-[var(--color-ink-500)] text-center py-6">Pas de position enregistrée pour cette commande.</p>
      )}
    </Modal>
  );
}
