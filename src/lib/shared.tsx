import { useState } from 'react'
import { API } from './api'

// ─── Résolution des URLs d'images ────────────────────────────────────────────
// Le backend renvoie "/images/xxx.jpg" → on préfixe avec l'URL de l'API.
export function imgUrl(path?: string | null): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  // cache-buster léger pour voir les mises à jour d'image
  return `${API}${path}`
}

// ─── Couleurs par catégorie ──────────────────────────────────────────────────
export const CAT_COLORS: Record<string, { bg: string; text: string; pill: string }> = {
  Food: { bg: 'bg-orange-100', text: 'text-orange-700', pill: 'bg-orange-500' },
  Restauration: { bg: 'bg-orange-100', text: 'text-orange-700', pill: 'bg-orange-500' },
  Viennoiserie: { bg: 'bg-yellow-100', text: 'text-yellow-700', pill: 'bg-yellow-500' },
  Boulangerie: { bg: 'bg-yellow-100', text: 'text-yellow-700', pill: 'bg-yellow-500' },
  Parfum: { bg: 'bg-purple-100', text: 'text-purple-700', pill: 'bg-purple-500' },
  Parfumerie: { bg: 'bg-purple-100', text: 'text-purple-700', pill: 'bg-purple-500' },
  Cosmétique: { bg: 'bg-pink-100', text: 'text-pink-700', pill: 'bg-pink-500' },
  Épicerie: { bg: 'bg-emerald-100', text: 'text-emerald-700', pill: 'bg-emerald-500' },
  Autre: { bg: 'bg-stone-100', text: 'text-stone-600', pill: 'bg-stone-400' },
}
export const getCat = (cat: string) =>
  CAT_COLORS[cat] ?? { bg: 'bg-stone-100', text: 'text-stone-600', pill: 'bg-stone-400' }

// ─── Étoiles ─────────────────────────────────────────────────────────────────
export function StarRating({
  note, size = 'sm', onRate,
}: { note: number; size?: 'sm' | 'lg'; onRate?: (n: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <span className={`inline-flex gap-0.5 ${size === 'lg' ? 'text-2xl' : 'text-sm'}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`transition-colors select-none ${onRate ? 'cursor-pointer' : 'cursor-default'} ${
            i <= (hover || note) ? 'text-amber-400' : 'text-stone-200'
          }`}
          onMouseEnter={() => onRate && setHover(i)}
          onMouseLeave={() => onRate && setHover(0)}
          onClick={() => onRate?.(i)}
        >★</span>
      ))}
    </span>
  )
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
      {label && <p className="text-stone-400 text-sm">{label}</p>}
    </div>
  )
}

// ─── Format prix DA ──────────────────────────────────────────────────────────
export const fmtDA = (n: number | string) => `${(Number(n) || 0).toLocaleString('fr-DZ')} DA`

// ─── Format date + heure ─────────────────────────────────────────────────────
export function fmtDateHeure(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const date = d.toLocaleDateString('fr-DZ', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const heure = d.toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit' })
  return `${date} · ${heure}`
}

// ─── Libellés de statut ──────────────────────────────────────────────────────
export const STATUTS: Record<string, { label: string; bg: string; text: string }> = {
  en_attente: { label: 'En attente', bg: 'bg-stone-100', text: 'text-stone-600' },
  en_route: { label: 'En route', bg: 'bg-blue-100', text: 'text-blue-700' },
  livre: { label: 'Livrée', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  non_recupere: { label: 'À récupérer', bg: 'bg-amber-100', text: 'text-amber-700' },
  recupere: { label: 'Récupérée', bg: 'bg-emerald-100', text: 'text-emerald-700' },
}

// une commande est "terminée" (comptée dans le total) si livrée ou récupérée
export const estTerminee = (statut: string) => statut === 'livre' || statut === 'recupere'

// heure sans les secondes : "08:30:00" -> "08:30"
export const hhmm = (t?: string | null) => (t ? t.slice(0, 5) : '')

// magasin ouvert selon l'heure réelle ?
export function magasinOuvert(ouv?: string | null, fer?: string | null): boolean | null {
  if (!ouv || !fer) return null
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
  const now = new Date(); const nowMin = now.getHours() * 60 + now.getMinutes()
  const o = toMin(ouv), f = toMin(fer)
  // gère les horaires qui passent minuit (ex 18:00 -> 02:00)
  if (f < o) return nowMin >= o || nowMin <= f
  return nowMin >= o && nowMin <= f
}
export const statutInfo = (s: string) =>
  STATUTS[s] ?? { label: s, bg: 'bg-stone-100', text: 'text-stone-600' }

// ─── Temps de livraison estimé (moto : 1 km ≈ 2 min + préparation) ──────────
// distanceKm : distance client<->magasin. Retourne une fourchette lisible, ex "20–26 min".
export function tempsLivraison(distanceKm?: number | null): string | null {
  if (distanceKm == null || isNaN(distanceKm)) return null
  const preparation = 5 // préparation moyenne (min)
  const trajet = distanceKm * 2 // 1 km = 2 min (moto)
  const total = preparation + trajet
  const min = Math.max(5, Math.round(total))
  const max = Math.round(total) + 4
  return `${min}–${max} min`
}
