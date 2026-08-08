import { useEffect, useMemo, useState } from "react";
import { Wallet, ClipboardCheck, ShoppingBasket, Star, AlertTriangle, Truck, PackageCheck, PackageX, Calendar } from "lucide-react";
import { Loading } from "../Loading";
import { getStatistiques, getCommandesFournisseur } from "../../api";
import { ApiError } from "../../api/client";
import { formatPrix } from "../../utils/format";
import type { Statistiques, Commande } from "../../types";

type Periode = "jour" | "semaine" | "mois" | "tout";

const PERIODES: { key: Periode; label: string }[] = [
  { key: "jour", label: "Jour" },
  { key: "semaine", label: "Semaine" },
  { key: "mois", label: "Mois" },
  { key: "tout", label: "Tout" },
];

export default function StatsTab({ fournisseurId }: { fournisseurId: number }) {
  const [periode, setPeriode] = useState<Periode>("tout");
  const [jour, setJour] = useState("");
  const [stats, setStats] = useState<Statistiques | null>(null);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setErreur(null);
    Promise.allSettled([getStatistiques(fournisseurId, periode), getCommandesFournisseur(fournisseurId)]).then(([s, a]) => {
      if (s.status === "fulfilled") setStats(s.value);
      else setErreur(s.reason instanceof ApiError ? s.reason.message : "Impossible de charger les statistiques.");
      setCommandes(a.status === "fulfilled" ? a.value || [] : []);
      setLoading(false);
    });
  }, [fournisseurId, periode]);

  const commandesFiltrees = useMemo(() => {
    if (!jour) return commandes;
    return commandes.filter((c) => c.created_at && c.created_at.slice(0, 10) === jour);
  }, [commandes, jour]);

  const ventilation = useMemo(() => {
    let livrees = 0, recuperees = 0, nonLivrees = 0, nonRecuperees = 0, annulees = 0;
    for (const c of commandesFiltrees) {
      if (c.statut === "annulee") {
        annulees++;
        continue;
      }
      if (c.avec_livraison) {
        if (c.statut === "livre") livrees++;
        else nonLivrees++;
      } else {
        if (c.statut === "recupere") recuperees++;
        else nonRecuperees++;
      }
    }
    return { livrees, recuperees, nonLivrees, nonRecuperees, annulees };
  }, [commandesFiltrees]);

  const cartes = [
    { icon: Wallet, label: "Chiffre d'affaires", value: stats ? formatPrix(stats.chiffre_affaires) : "—", color: "text-[var(--color-orange-600)] bg-[var(--color-orange-100)]" },
    { icon: ClipboardCheck, label: "Commandes terminées", value: stats ? String(stats.nb_terminees) : "—", color: "text-[var(--color-green-600)] bg-[var(--color-green-100)]" },
    { icon: ShoppingBasket, label: "Panier moyen", value: stats ? formatPrix(stats.panier_moyen) : "—", color: "text-[var(--color-navy-700)] bg-[var(--color-ink-100)]" },
    { icon: Star, label: "Note moyenne", value: stats && stats.note_moyenne != null ? stats.note_moyenne.toFixed(1) : "—", color: "text-[var(--color-pink-600)] bg-[var(--color-pink-100)]" },
  ];

  const ventilationCartes = [
    { icon: Truck, label: "Commandes livrées", value: ventilation.livrees, color: "text-[var(--color-green-600)] bg-[var(--color-green-100)]" },
    { icon: PackageCheck, label: "Commandes récupérées", value: ventilation.recuperees, color: "text-[var(--color-green-600)] bg-[var(--color-green-100)]" },
    { icon: PackageX, label: "Cmd non livrée", value: ventilation.nonLivrees, color: "text-[var(--color-orange-600)] bg-[var(--color-orange-100)]" },
    { icon: PackageX, label: "Cmd non récupérée", value: ventilation.nonRecuperees, color: "text-[var(--color-orange-600)] bg-[var(--color-orange-100)]" },
    { icon: PackageX, label: "Cmd annulées", value: ventilation.annulees, color: "text-red-600 bg-red-50" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 flex-wrap items-center">
        {PERIODES.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriode(p.key)}
            className={`px-3.5 py-2 rounded-full text-sm font-semibold border ${
              periode === p.key ? "bg-[var(--color-orange-500)] text-white border-[var(--color-orange-500)]" : "bg-white text-[var(--color-ink-700)] border-[var(--color-ink-100)]"
            }`}
          >
            {p.label}
          </button>
        ))}
        <div className="flex items-center gap-1.5 bg-white border border-[var(--color-ink-100)] rounded-full pl-3 pr-1 py-1.5">
          <Calendar size={14} className="text-[var(--color-ink-500)]" />
          <input type="date" value={jour} onChange={(e) => setJour(e.target.value)} className="text-sm outline-none bg-transparent" />
          {jour && <button onClick={() => setJour("")} className="text-xs text-[var(--color-ink-500)] px-1">✕</button>}
        </div>
      </div>

      {erreur && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-3.5 py-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{erreur}</span>
        </div>
      )}

      {loading ? (
        <Loading label="Calcul des statistiques..." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {cartes.map((c) => (
              <div key={c.label} className="bg-white rounded-2xl border border-[var(--color-ink-100)] p-4">
                <span className={`h-9 w-9 rounded-xl flex items-center justify-center ${c.color}`}>
                  <c.icon size={17} />
                </span>
                <p className="font-bold text-xl text-[var(--color-ink-900)] mt-3">{c.value}</p>
                <p className="text-xs text-[var(--color-ink-500)] mt-0.5">{c.label}</p>
              </div>
            ))}
          </div>

          <p className="text-sm font-semibold text-[var(--color-ink-700)] mt-1">Détail des commandes{jour ? ` — ${new Date(jour).toLocaleDateString("fr-FR")}` : ""}</p>
          <div className="grid grid-cols-2 gap-3">
            {ventilationCartes.map((c) => (
              <div key={c.label} className="bg-white rounded-2xl border border-[var(--color-ink-100)] p-4">
                <span className={`h-9 w-9 rounded-xl flex items-center justify-center ${c.color}`}>
                  <c.icon size={17} />
                </span>
                <p className="font-bold text-xl text-[var(--color-ink-900)] mt-3">{c.value}</p>
                <p className="text-xs text-[var(--color-ink-500)] mt-0.5">{c.label}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
