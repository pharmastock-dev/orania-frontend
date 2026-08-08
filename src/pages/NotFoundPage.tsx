import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[var(--color-ink-50)] px-6 text-center">
      <p className="font-display font-extrabold text-5xl text-[var(--color-navy-900)]">404</p>
      <p className="text-[var(--color-ink-500)]">Cette page n'existe pas.</p>
      <Button onClick={() => navigate("/")}>Retour à l'accueil</Button>
    </div>
  );
}
