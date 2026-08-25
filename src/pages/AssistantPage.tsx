import { useState } from "react";
import { Sparkles, ArrowLeft, MapPin, Bike, Store, Users, Wallet } from "lucide-react";
import BackButton from "../components/BackButton";
import Button from "../components/Button";
import ProductSearchCard from "../components/ProductSearchCard";
import { rechercherAssistant } from "../api";
import { getPositionActuelle } from "../utils/geo";
import { SUGGESTIONS_PRODUITS } from "../utils/categories";
import { formatPrix } from "../utils/format";
import type { AssistantResultat, CriteresAssistant } from "../types";

type Etape = "budget" | "envie" | "personnes" | "proximite" | "mode" | "chargement" | "resultats" | "erreur";

const BUDGETS = [
  { label: "< 500 DA", valeur: 500 },
  { label: "500 - 1000 DA", valeur: 1000 },
  { label: "1000 - 2000 DA", valeur: 2000 },
  { label: "Peu importe", valeur: null },
];

const PERSONNES = [1, 2, 4, 6];

// Bulle de "l'assistant" — même composant réutilisé à chaque étape pour
// garder une vraie sensation de conversation, pas un simple formulaire.
function BulleAssistant({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="h-9 w-9 rounded-full bg-[var(--color-navy-900)] flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles size={16} className="text-[var(--color-orange-400)]" />
      </span>
      <div className="bg-white border border-[var(--color-ink-100)] rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
        <p className="text-[var(--color-ink-900)] font-medium text-[15px]">{children}</p>
      </div>
    </div>
  );
}

function BulleReponse({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="bg-[var(--color-orange-500)] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%]">
        <p className="text-sm font-semibold">{children}</p>
      </div>
    </div>
  );
}

export default function AssistantPage() {
  const [etape, setEtape] = useState<Etape>("budget");
  const [historique, setHistorique] = useState<{ q: string; r: string }[]>([]);

  const [budgetMax, setBudgetMax] = useState<number | null>(null);
  const [envie, setEnvie] = useState("");
  const [envieLibre, setEnvieLibre] = useState("");
  const [personnes, setPersonnes] = useState(1);
  const [positionClient, setPositionClient] = useState<{ latitude: number; longitude: number } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [resultats, setResultats] = useState<AssistantResultat[]>([]);

  function choisirBudget(label: string, valeur: number | null) {
    setBudgetMax(valeur);
    setHistorique((h) => [...h, { q: "Quel est votre budget ?", r: label }]);
    setEtape("envie");
  }

  function choisirEnvie(valeur: string) {
    setEnvie(valeur);
    setHistorique((h) => [...h, { q: "Envie de quoi aujourd'hui ?", r: valeur }]);
    setEtape("personnes");
  }

  function validerEnvieLibre(e: React.FormEvent) {
    e.preventDefault();
    if (!envieLibre.trim()) return;
    choisirEnvie(envieLibre.trim());
  }

  function choisirPersonnes(n: number) {
    setPersonnes(n);
    setHistorique((h) => [...h, { q: "Vous êtes combien ?", r: n === 1 ? "Seul(e)" : `${n} personnes` }]);
    setEtape("proximite");
  }

  async function choisirProximite(pres: boolean) {
    setHistorique((h) => [...h, { q: "Près de vous, ou n'importe où ?", r: pres ? "Près de moi" : "N'importe où" }]);
    if (!pres) {
      setEtape("mode");
      return;
    }
    setEtape("chargement");
    try {
      const pos = await getPositionActuelle();
      setPositionClient(pos);
      setEtape("mode");
    } catch {
      setErreur("Impossible d'accéder à votre position — activez la localisation puis réessayez, ou choisissez « N'importe où ».");
      setEtape("erreur");
    }
  }

  async function choisirMode(mode: "livraison" | "retrait") {
    const libelle = mode === "livraison" ? "Livraison" : "Je récupère";
    setHistorique((h) => [...h, { q: "Livraison ou vous passez chercher ?", r: libelle }]);
    setEtape("chargement");

    const criteres: CriteresAssistant = {
      envie,
      budget_max: budgetMax,
      personnes,
      mode,
      latitude: positionClient?.latitude ?? null,
      longitude: positionClient?.longitude ?? null,
    };

    try {
      const data = await rechercherAssistant(criteres);
      setResultats(data);
      setEtape("resultats");
    } catch {
      setErreur("Impossible de contacter le serveur pour l'instant. Réessayez dans un instant.");
      setEtape("erreur");
    }
  }

  function recommencer() {
    setHistorique([]);
    setBudgetMax(null);
    setEnvie("");
    setEnvieLibre("");
    setPersonnes(1);
    setPositionClient(null);
    setResultats([]);
    setErreur(null);
    setEtape("budget");
  }

  return (
    <div className="min-h-screen bg-[var(--color-ink-50)] flex flex-col">
      <div className="bg-white border-b border-[var(--color-ink-100)] px-4 py-3.5 flex items-center gap-3 sticky top-0 z-10">
        <BackButton to="/client/accueil" />
        <div className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-full bg-[var(--color-navy-900)] flex items-center justify-center">
            <Sparkles size={14} className="text-[var(--color-orange-400)]" />
          </span>
          <div>
            <p className="font-display font-bold text-[15px] text-[var(--color-ink-900)] leading-tight">QREEB Assistant</p>
            <p className="text-[11px] text-[var(--color-ink-500)]">Trouvez le lieu parfait en quelques secondes</p>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-lg w-full mx-auto px-4 py-5 flex flex-col gap-3.5">
        {historique.map((h, i) => (
          <div key={i} className="flex flex-col gap-2">
            <BulleAssistant>{h.q}</BulleAssistant>
            <BulleReponse>{h.r}</BulleReponse>
          </div>
        ))}

        {etape === "budget" && (
          <div className="flex flex-col gap-3">
            <BulleAssistant>Salut ! Je suis QREEB Assistant. Trouvons-vous le lieu parfait. Quel est votre budget ?</BulleAssistant>
            <div className="grid grid-cols-2 gap-2 pl-11">
              {BUDGETS.map((b) => (
                <button
                  key={b.label}
                  onClick={() => choisirBudget(b.label, b.valeur)}
                  className="flex items-center justify-center gap-1.5 bg-white border border-[var(--color-ink-100)] rounded-xl px-3 py-3 text-sm font-semibold text-[var(--color-ink-900)] hover:border-[var(--color-orange-500)]"
                >
                  <Wallet size={14} className="text-[var(--color-orange-500)]" /> {b.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {etape === "envie" && (
          <div className="flex flex-col gap-3">
            <BulleAssistant>Envie de quoi aujourd'hui ?</BulleAssistant>
            <div className="grid grid-cols-3 gap-2 pl-11">
              {SUGGESTIONS_PRODUITS.map((s) => (
                <button
                  key={s}
                  onClick={() => choisirEnvie(s)}
                  className="bg-white border border-[var(--color-ink-100)] rounded-xl px-2 py-2.5 text-xs font-semibold text-[var(--color-ink-900)] hover:border-[var(--color-orange-500)]"
                >
                  {s}
                </button>
              ))}
            </div>
            <form onSubmit={validerEnvieLibre} className="pl-11 flex gap-2">
              <input
                value={envieLibre}
                onChange={(e) => setEnvieLibre(e.target.value)}
                placeholder="Autre chose ? Tapez ici..."
                className="flex-1 bg-white border border-[var(--color-ink-100)] rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[var(--color-orange-500)]"
              />
              <Button type="submit">OK</Button>
            </form>
          </div>
        )}

        {etape === "personnes" && (
          <div className="flex flex-col gap-3">
            <BulleAssistant>Vous êtes combien ?</BulleAssistant>
            <div className="grid grid-cols-4 gap-2 pl-11">
              {PERSONNES.map((n) => (
                <button
                  key={n}
                  onClick={() => choisirPersonnes(n)}
                  className="flex flex-col items-center gap-1 bg-white border border-[var(--color-ink-100)] rounded-xl px-2 py-3 text-sm font-bold text-[var(--color-ink-900)] hover:border-[var(--color-orange-500)]"
                >
                  <Users size={15} className="text-[var(--color-orange-500)]" /> {n}{n === 6 ? "+" : ""}
                </button>
              ))}
            </div>
          </div>
        )}

        {etape === "proximite" && (
          <div className="flex flex-col gap-3">
            <BulleAssistant>Près de chez vous, ou peu importe la distance ?</BulleAssistant>
            <div className="grid grid-cols-2 gap-2 pl-11">
              <button onClick={() => choisirProximite(true)} className="flex flex-col items-center gap-1.5 bg-white border border-[var(--color-ink-100)] rounded-xl px-3 py-3.5 text-sm font-semibold text-[var(--color-ink-900)] hover:border-[var(--color-orange-500)]">
                <MapPin size={17} className="text-[var(--color-orange-500)]" /> Près de moi
              </button>
              <button onClick={() => choisirProximite(false)} className="flex flex-col items-center gap-1.5 bg-white border border-[var(--color-ink-100)] rounded-xl px-3 py-3.5 text-sm font-semibold text-[var(--color-ink-900)] hover:border-[var(--color-orange-500)]">
                🌍 N'importe où
              </button>
            </div>
          </div>
        )}

        {etape === "mode" && (
          <div className="flex flex-col gap-3">
            <BulleAssistant>Livraison, ou vous passez chercher ?</BulleAssistant>
            <div className="grid grid-cols-2 gap-2 pl-11">
              <button onClick={() => choisirMode("livraison")} className="flex flex-col items-center gap-1.5 bg-white border border-[var(--color-ink-100)] rounded-xl px-3 py-3.5 text-sm font-semibold text-[var(--color-ink-900)] hover:border-[var(--color-orange-500)]">
                <Bike size={17} className="text-[var(--color-orange-500)]" /> Livraison
              </button>
              <button onClick={() => choisirMode("retrait")} className="flex flex-col items-center gap-1.5 bg-white border border-[var(--color-ink-100)] rounded-xl px-3 py-3.5 text-sm font-semibold text-[var(--color-ink-900)] hover:border-[var(--color-orange-500)]">
                <Store size={17} className="text-[var(--color-orange-500)]" /> Je récupère
              </button>
            </div>
          </div>
        )}

        {etape === "chargement" && (
          <div className="flex flex-col gap-3">
            <BulleAssistant>Un instant, je cherche vos meilleures options...</BulleAssistant>
            <div className="pl-11 flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--color-orange-500)] animate-bounce [animation-delay:0ms]" />
              <span className="h-2 w-2 rounded-full bg-[var(--color-orange-500)] animate-bounce [animation-delay:150ms]" />
              <span className="h-2 w-2 rounded-full bg-[var(--color-orange-500)] animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {etape === "erreur" && (
          <div className="flex flex-col gap-3">
            <BulleAssistant>{erreur}</BulleAssistant>
            <div className="pl-11">
              <Button onClick={recommencer}>Recommencer</Button>
            </div>
          </div>
        )}

        {etape === "resultats" && (
          <div className="flex flex-col gap-3">
            {resultats.length === 0 ? (
              <BulleAssistant>Aucun résultat ne correspond exactement — essayez un budget plus large ou une autre envie !</BulleAssistant>
            ) : (
              <BulleAssistant>✨ Voici mes {resultats.length} meilleures suggestions pour vous :</BulleAssistant>
            )}
            <div className="flex flex-col gap-2.5 pl-11">
              {resultats.map((r, i) => (
                <div key={r.id} className="bg-white rounded-2xl border border-[var(--color-ink-100)] overflow-hidden">
                  <div className="px-3.5 pt-3 flex items-center gap-1.5">
                    <span className="text-lg">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "•"}</span>
                    <p className="text-xs text-[var(--color-ink-500)] italic flex-1">{r.phrase}</p>
                  </div>
                  <ProductSearchCard
                    produit={{
                      id: r.id,
                      fournisseur_id: r.fournisseur_id,
                      nom: r.nom,
                      prix: r.prix,
                      prix_promo: r.prix_promo,
                      categorie: r.categorie || "",
                      ingredients: r.ingredients,
                      disponible: true,
                      photo: r.image_url,
                      fournisseur_nom: r.fournisseur_nom,
                      fournisseur_categorie: r.fournisseur_categorie,
                    }}
                  />
                  {r.distance_km != null && (
                    <p className="px-3.5 pb-3 text-[11px] text-[var(--color-ink-500)] -mt-1">
                      📍 {r.distance_km} km · Total pour {personnes} : {formatPrix(r.prix_groupe)}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="pl-11 mt-2">
              <Button variant="outline" onClick={recommencer} icon={<ArrowLeft size={14} />}>
                Refaire une recherche
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
