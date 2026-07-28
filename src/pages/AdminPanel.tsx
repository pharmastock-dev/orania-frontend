import { useState, useEffect, useCallback } from 'react'
import { adminApi, type FournisseurAdmin, type Reclamation } from '../lib/api'
import { Spinner, getCat } from '../lib/shared'

const MOT_DE_PASSE_ADMIN = 'admin2026'

export function AdminPanel({ onExit }: { onExit: () => void }) {
  const [authed, setAuthed] = useState(false)
  return authed ? <AdminDashboard onExit={onExit} /> : <AdminLogin onOk={() => setAuthed(true)} onExit={onExit} />
}

function AdminLogin({ onOk, onExit }: { onOk: () => void; onExit: () => void }) {
  const [mdp, setMdp] = useState(''); const [error, setError] = useState('')
  const submit = () => { if (mdp === MOT_DE_PASSE_ADMIN) onOk(); else setError('Mot de passe incorrect') }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F8FA] px-5">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-lg border border-stone-100">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3"><span className="text-3xl">⚙️</span></div>
          <h1 className="text-xl font-bold text-stone-800">Administration</h1>
          <p className="text-stone-500 text-sm mt-1">Accès réservé</p>
        </div>
        <input type="password" value={mdp} onChange={(e) => setMdp(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Mot de passe admin" className="w-full px-4 py-3 rounded-2xl bg-stone-50 text-stone-800 placeholder:text-stone-400 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white mb-3" />
        {error && <p className="text-red-400 text-sm mb-3 text-center">{error}</p>}
        <button onClick={submit} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-2xl transition-all">Entrer</button>
        <button onClick={onExit} className="w-full text-stone-400 hover:text-stone-700 text-sm py-3 mt-1 transition-colors">← Retour</button>
      </div>
    </div>
  )
}

function AdminDashboard({ onExit }: { onExit: () => void }) {
  const [fournisseurs, setFournisseurs] = useState<FournisseurAdmin[]>([])
  const [reclamations, setReclamations] = useState<Reclamation[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<number | null>(null)

  const charger = useCallback(async () => {
    setLoading(true)
    try {
      const [f, r] = await Promise.all([adminApi.fournisseurs(), adminApi.reclamations().catch(() => [])])
      setFournisseurs(Array.isArray(f) ? f : [])
      setReclamations(Array.isArray(r) ? r : [])
    } finally { setLoading(false) }
  }, [])
  useEffect(() => { charger() }, [charger])

  const act = async (fid: number, fn: () => Promise<any>) => { setBusy(fid); try { await fn() } finally { setBusy(null); charger() } }
  const resetMdp = async (fid: number, nom: string) => {
    const nouveau = window.prompt(`Nouveau mot de passe pour "${nom}" :`, '')
    if (nouveau && nouveau.trim()) await act(fid, () => adminApi.resetMotDePasse(fid, nouveau.trim()))
  }

  const enAttente = fournisseurs.filter((f) => !f.valide)
  const valides = fournisseurs.filter((f) => f.valide)

  return (
    <div className="min-h-screen bg-stone-100">
      <div className="bg-stone-900 text-white sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={onExit} title="Retour à l'accueil"
            className="shrink-0 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center text-white text-lg font-bold">←</button>
          <div className="flex items-center gap-2 flex-1"><span className="text-xl">⚙️</span><h1 className="font-bold">Administration</h1></div>
          <button onClick={onExit} className="shrink-0 text-xs text-stone-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-white/10">Quitter</button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5">
        {loading ? <Spinner label="Chargement…" /> : (
          <div className="space-y-6">
            {/* Réclamations */}
            <div>
              <h2 className="text-sm font-bold text-stone-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                📨 Réclamations
                {reclamations.filter((r) => !r.traitee).length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{reclamations.filter((r) => !r.traitee).length}</span>}
              </h2>
              {reclamations.length === 0 ? (
                <p className="text-sm text-stone-400 bg-white rounded-2xl border border-stone-100 p-4">Aucune réclamation</p>
              ) : (
                <div className="space-y-3">
                  {reclamations.map((r) => (
                    <div key={r.id} className={`bg-white rounded-2xl border shadow-sm p-4 ${r.traitee ? 'border-stone-100 opacity-70' : 'border-amber-200'}`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.type_auteur === 'client' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                            {r.type_auteur === 'client' ? '👤 Client' : '🏪 Commerçant'}
                          </span>
                          <p className="font-bold text-stone-800 text-sm mt-1">{r.auteur_nom || 'Anonyme'}</p>
                          {r.auteur_telephone && <a href={`tel:${r.auteur_telephone}`} className="text-xs text-blue-600 hover:underline">📞 {r.auteur_telephone}</a>}
                        </div>
                        <span className="text-[10px] text-stone-400 whitespace-nowrap">{r.date_creation.slice(0, 16).replace('T', ' ')}</span>
                      </div>
                      <p className="text-sm text-stone-600 bg-stone-50 rounded-xl p-3 mb-3 whitespace-pre-line">{r.message}</p>
                      <div className="flex gap-2">
                        {!r.traitee && <button onClick={() => act(r.id, () => adminApi.marquerTraitee(r.id))} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold py-2 rounded-xl transition-all">✓ Marquer traitée</button>}
                        <button onClick={() => act(r.id, () => adminApi.supprimerReclamation(r.id))} className="bg-red-50 hover:bg-red-100 text-red-500 text-xs font-semibold px-3 py-2 rounded-xl transition-all">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Demandes en attente */}
            <div>
              <h2 className="text-sm font-bold text-stone-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                🔔 Nouvelles demandes
                {enAttente.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{enAttente.length}</span>}
              </h2>
              {enAttente.length === 0 ? (
                <p className="text-sm text-stone-400 bg-white rounded-2xl border border-stone-100 p-4">Aucune demande en attente</p>
              ) : (
                <div className="space-y-3">
                  {enAttente.map((f) => (
                    <div key={f.id} className="bg-white rounded-2xl border-2 border-amber-200 shadow-sm p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-bold text-stone-800">{f.nom}</p>
                          <p className="text-xs text-stone-500 mt-0.5">📞 {f.telephone}</p>
                          {f.adresse && <p className="text-xs text-stone-500">📍 {f.adresse}</p>}
                          {f.categorie && <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mt-1 ${getCat(f.categorie).bg} ${getCat(f.categorie).text}`}>{f.categorie}</span>}
                        </div>
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full whitespace-nowrap">EN ATTENTE</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button disabled={busy === f.id} onClick={() => act(f.id, () => adminApi.valider(f.id))}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-3 py-2.5 rounded-xl transition-all disabled:opacity-50">✅ Valider & activer (1 an)</button>
                        <button disabled={busy === f.id} onClick={() => resetMdp(f.id, f.nom)}
                          className="bg-stone-200 hover:bg-stone-300 text-stone-700 text-sm font-semibold px-3 py-2.5 rounded-xl transition-all disabled:opacity-50">🔑</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Fournisseurs validés */}
            <div>
              <h2 className="text-sm font-bold text-stone-700 uppercase tracking-wide mb-3">🏪 Commerces ({valides.length})</h2>
              {valides.length === 0 ? (
                <p className="text-sm text-stone-400 bg-white rounded-2xl border border-stone-100 p-4">Aucun commerce validé</p>
              ) : (
                <div className="space-y-3">
                  {valides.map((f) => {
                    const colors = getCat(f.categorie || 'Autre')
                    return (
                      <div key={f.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <p className="font-bold text-stone-800">{f.nom}</p>
                            <p className="text-xs text-stone-500 mt-0.5">📞 {f.telephone}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {f.categorie && <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>{f.categorie}</span>}
                              {f.actif
                                ? <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">● Actif → {f.abonnement_fin}</span>
                                : <span className="text-[11px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">● Expiré</span>}
                            </div>
                          </div>
                          <span className="text-xs text-stone-400">#{f.id}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button disabled={busy === f.id} onClick={() => act(f.id, () => adminApi.activerAbonnement(f.id))}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-all disabled:opacity-50">➕ +1 an</button>
                          <button disabled={busy === f.id} onClick={() => act(f.id, () => adminApi.desactiver(f.id))}
                            className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-all disabled:opacity-50">⛔ Arrêter</button>
                          <button disabled={busy === f.id} onClick={() => resetMdp(f.id, f.nom)}
                            className="bg-stone-200 hover:bg-stone-300 text-stone-700 text-sm font-semibold px-3 py-2 rounded-xl transition-all disabled:opacity-50">🔑 Mot de passe</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
