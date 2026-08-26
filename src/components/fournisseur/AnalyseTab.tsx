import { useEffect, useState } from "react";
import { TrendingUp, Star, PackageSearch, MessageSquareText, Clock3, Sparkles } from "lucide-react";
import { getAnalyseHebdomadaire } from "../../api";
import { ApiError } from "../../api/client";

interface AnalyseTabProps {
  fournisseurId: number;
}

interface ReponseAnalyse {
  disponible: boolean;
  message: string;
}

interface AnalyseHebdomadaire {
  comparaison_semaine: ReponseAnalyse;
  meilleur_produit: ReponseAnalyse;
  produit_stagnant: ReponseAnalyse;
  avis_recents: ReponseAnalyse;
  pic_activite: ReponseAnalyse;
}

const QUESTIONS: { cle: keyof AnalyseHebdomadaire; titre: string; icon: typeof TrendingUp }[] = [
  { cle: "comparaison_semaine", titre: "Comment s'est passée ma semaine ?", icon: TrendingUp },
  { cle: "meilleur_produit", titre: "Mon produit qui marche le mieux", icon: Star },
  { cle: "produit_stagnant", titre: "Un produit qui ne se vend pas ?", icon: PackageSearch },
  { cle: "avis_recents", titre: "Ce que disent mes clients", icon: MessageSquareText },
  { cle: "pic_activite", titre: "Mon moment le plus chargé", icon: Clock3 },
];

// Une seule carte de question — même gabarit visuel pour les 5, qu'il y ait
// un vrai résultat ou juste "pas encore assez de données" (jamais un écran
// vide ou une erreur, toujours une réponse honnête).
function CarteQuestion({ titre, icon: Icon, reponse }: { titre: string; icon: typeof TrendingUp; reponse: ReponseAnalyse }) {
  return (
    <div className="bg-white rounded-2xl border border-[var(--color-ink-100)] p-4 flex gap-3">
      <span className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${reponse.disponible ? "bg-[var(--color-orange-100)]" : "bg-[var(--color-ink-100)]"}`}>
        <Icon size={18} className={reponse.disponible ? "text-[var(--color-orange-600)]" : "text-[var(--color-ink-400)]"} />
      </span>
      <div className="min-w-0">
        <p className="font-bold text-sm text-[var(--color-ink-900)]">{titre}</p>
        <p className={`text-sm mt-1 leading-relaxed ${reponse.disponible ? "text-[var(--color-ink-700)]" : "text-[var(--color-ink-500)] italic"}`}>
          {reponse.message}
        </p>
      </div>
    </div>
  );
}

export default function AnalyseTab({ fournisseurId }: AnalyseTabProps) {
  const [analyse, setAnalyse] = useState<AnalyseHebdomadaire | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;
    setChargement(true);
    getAnalyseHebdomadaire(fournisseurId)
      .then((data) => {
        if (!annule) setAnalyse(data as AnalyseHebdomadaire);
      })
      .catch((err) => {
        if (!annule) setErreur(err instanceof ApiError ? err.message : "Impossible de charger votre analyse pour l'instant.");
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });
    return () => {
      annule = true;
    };
  }, [fournisseurId]);

  if (chargement) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-[var(--color-ink-100)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (erreur) {
    return <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3.5 py-3">{erreur}</p>;
  }

  if (!analyse) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-[var(--color-orange-500)]" />
        <p className="text-xs text-[var(--color-ink-500)]">Mise à jour automatique, basée sur vos 7 derniers jours</p>
      </div>
      <div className="flex flex-col gap-2.5">
        {QUESTIONS.map((q) => (
          <CarteQuestion key={q.cle} titre={q.titre} icon={q.icon} reponse={analyse[q.cle]} />
        ))}
      </div>
    </div>
  );
}
