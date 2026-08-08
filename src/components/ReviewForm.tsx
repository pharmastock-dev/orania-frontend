import { useEffect, useState } from "react";
import RatingStars from "./RatingStars";
import Button from "./Button";
import { useToast } from "../context/ToastContext";
import { getMonAvis, postAvis } from "../api";
import { ApiError } from "../api/client";

export default function ReviewForm({ fournisseurId, acheteurId, onEnvoye }: { fournisseurId: number; acheteurId: number; onEnvoye?: () => void }) {
  const { showToast } = useToast();
  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [dejaDonne, setDejaDonne] = useState(false);
  const [loading, setLoading] = useState(true);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    let annule = false;
    getMonAvis(fournisseurId, acheteurId)
      .then((avis) => {
        if (annule || !avis || avis.note === 0) return;
        setNote(avis.note);
        setCommentaire(avis.commentaire || "");
        setDejaDonne(true);
      })
      .catch(() => {})
      .finally(() => {
        if (!annule) setLoading(false);
      });
    return () => {
      annule = true;
    };
  }, [fournisseurId, acheteurId]);

  async function handleSubmit() {
    if (note === 0) {
      showToast("Choisissez une note avant d'envoyer.", "error");
      return;
    }
    setEnvoi(true);
    try {
      await postAvis({ acheteur_id: acheteurId, fournisseur_id: fournisseurId, note, commentaire });
      showToast(dejaDonne ? "Avis modifié" : "Merci pour votre avis !", "success");
      setDejaDonne(true);
      onEnvoye?.();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Impossible d'envoyer votre avis.", "error");
    } finally {
      setEnvoi(false);
    }
  }

  if (loading) return null;

  return (
    <div className="flex flex-col gap-3">
      <RatingStars note={note} size={26} interactive onChange={setNote} />
      <textarea
        value={commentaire}
        onChange={(e) => setCommentaire(e.target.value)}
        placeholder="Un commentaire à partager ? (facultatif)"
        rows={3}
        className="w-full bg-[var(--color-ink-50)] border border-[var(--color-ink-100)] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[var(--color-orange-500)] resize-none"
      />
      <Button size="sm" loading={envoi} onClick={handleSubmit} fullWidth>
        {dejaDonne ? "Modifier mon avis" : "Envoyer mon avis"}
      </Button>
    </div>
  );
}
