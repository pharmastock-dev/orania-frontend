import { useState } from "react";
import { Flag } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";
import { useToast } from "../context/ToastContext";
import { creerReclamation } from "../api";
import { ApiError } from "../api/client";
import type { AuteurReclamation } from "../types";

interface ReclamationModalProps {
  open: boolean;
  onClose: () => void;
  auteurType: AuteurReclamation;
  auteurId: number;
  auteurNom?: string;
  auteurTelephone?: string;
}

export default function ReclamationModal({ open, onClose, auteurType, auteurId, auteurNom, auteurTelephone }: ReclamationModalProps) {
  const { showToast } = useToast();
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  async function handleEnvoyer() {
    if (!sujet.trim() || !message.trim()) {
      showToast("Merci de préciser le sujet et le message.", "error");
      return;
    }
    setEnvoi(true);
    try {
      // Le vrai backend n'a pas de champ "sujet" séparé — on le préfixe au message.
      await creerReclamation({
        type_auteur: auteurType,
        auteur_id: auteurId,
        auteur_nom: auteurNom,
        auteur_telephone: auteurTelephone,
        message: `[${sujet.trim()}] ${message.trim()}`,
      });
      setEnvoye(true);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible d'envoyer la réclamation.", "error");
    } finally {
      setEnvoi(false);
    }
  }

  function handleClose() {
    onClose();
    setTimeout(() => {
      setSujet("");
      setMessage("");
      setEnvoye(false);
    }, 200);
  }

  return (
    <Modal open={open} onClose={handleClose} title="Signaler un problème">
      {envoye ? (
        <div className="text-center py-2">
          <p className="font-semibold text-[var(--color-ink-900)]">Réclamation envoyée</p>
          <p className="text-sm text-[var(--color-ink-500)] mt-1">L'administration va l'examiner et vous recontactera si besoin.</p>
          <Button fullWidth className="mt-4" onClick={handleClose}>Fermer</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <input
            value={sujet}
            onChange={(e) => setSujet(e.target.value)}
            placeholder="Sujet (ex : Commande non livrée)"
            className="bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none focus:border-[var(--color-orange-500)]"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Décrivez le problème en détail..."
            rows={4}
            className="bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] rounded-xl px-4 py-3 outline-none focus:border-[var(--color-orange-500)] resize-none"
          />
          <Button fullWidth loading={envoi} icon={<Flag size={15} />} onClick={handleEnvoyer}>
            Envoyer la réclamation
          </Button>
        </div>
      )}
    </Modal>
  );
}
