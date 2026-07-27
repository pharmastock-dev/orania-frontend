import { useState } from 'react'
import { fournisseurApi } from '../lib/api'

const CATEGORIES = ['Food', 'Viennoiserie', 'Parfum', 'Cosmétique', 'Épicerie', 'Autre']

export interface FournisseurSession {
  id: number
  nom: string
  telephone?: string
  adresse?: string
  categorie?: string
  heure_ouverture?: string | null
  heure_fermeture?: string | null
  presentation?: string | null
  latitude?: number | null
  longitude?: number | null
  abonnement_fin?: string
}

export function FournisseurAuth({ onLogin }: { onLogin: (s: FournisseurSession) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  return mode === 'login' ? (
    <LoginForm onLogin={onLogin} goRegister={() => setMode('register')} />
  ) : (
    <RegisterForm goLogin={() => setMode('login')} />
  )
}

function Shell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-white px-5 py-10">
      <div className="mb-8 text-center">
        <div className="w-20 h-20 bg-stone-800 rounded-[24px] flex items-center justify-center mx-auto mb-4 shadow-xl">
          <span className="text-4xl">🏪</span>
        </div>
        <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">Espace Commerçant</h1>
        <p className="text-stone-400 text-sm mt-1">{sub}</p>
      </div>
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl shadow-stone-200/60 p-8">
        <h2 className="text-lg font-bold text-stone-800 mb-6">{title}</h2>
        {children}
      </div>
    </div>
  )
}

const inputCls =
  'w-full px-4 py-3 rounded-2xl border border-stone-200 bg-stone-50 text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent focus:bg-white transition-all'
const labelCls = 'block text-[11px] font-semibold text-stone-400 uppercase tracking-widest mb-1.5'

function LoginForm({ onLogin, goRegister }: { onLogin: (s: FournisseurSession) => void; goRegister: () => void }) {
  const [tel, setTel] = useState('')
  const [mdp, setMdp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!tel.trim() || !mdp.trim()) { setError('Remplissez tous les champs.'); return }
    setLoading(true); setError('')
    try {
      const r = await fournisseurApi.login(tel.trim(), mdp)
      if (r.succes && r.fournisseur_id) {
        onLogin({ id: r.fournisseur_id, nom: r.nom || '', telephone: r.telephone, adresse: r.adresse,
          categorie: r.categorie, heure_ouverture: r.heure_ouverture, heure_fermeture: r.heure_fermeture,
          presentation: r.presentation, latitude: r.latitude, longitude: r.longitude, abonnement_fin: r.abonnement_fin })
      } else {
        setError(r.message || 'Échec de connexion')
      }
    } catch { setError('Serveur injoignable.') } finally { setLoading(false) }
  }

  return (
    <Shell title="Connexion" sub="Gérez votre commerce">
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Téléphone</label>
          <input className={inputCls} type="tel" inputMode="numeric" value={tel} onChange={(e) => setTel(e.target.value.replace(/[^0-9]/g, ''))} placeholder="05 XX XX XX XX" />
        </div>
        <div>
          <label className={labelCls}>Mot de passe</label>
          <input className={inputCls} type="password" value={mdp} onChange={(e) => setMdp(e.target.value)} placeholder="••••••" onKeyDown={(e) => e.key === 'Enter' && submit()} />
        </div>
        {error && <div className="bg-red-50 border border-red-100 text-red-500 text-sm rounded-2xl px-4 py-3">{error}</div>}
        <button onClick={submit} disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold py-3.5 rounded-2xl transition-all disabled:opacity-60 mt-2 shadow-lg shadow-amber-500/30">
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </div>
      <p className="text-center text-sm text-stone-400 mt-6">
        Pas encore de compte ?{' '}
        <button onClick={goRegister} className="text-amber-600 font-semibold hover:underline">Créer un compte</button>
      </p>
    </Shell>
  )
}

function RegisterForm({ goLogin }: { goLogin: () => void }) {
  const [nom, setNom] = useState('')
  const [tel, setTel] = useState('')
  const [adresse, setAdresse] = useState('')
  const [categorie, setCategorie] = useState(CATEGORIES[0])
  const [mdp, setMdp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!nom.trim() || !tel.trim() || !mdp.trim()) { setError('Nom, téléphone et mot de passe obligatoires.'); return }
    setLoading(true); setError('')
    try {
      const r = await fournisseurApi.register({ nom: nom.trim(), telephone: tel.trim(), adresse: adresse.trim(), categorie, mot_de_passe: mdp })
      if (r.succes) setDone(true)
      else setError(r.message || 'Échec de création.')
    } catch { setError('Échec de création. Le numéro existe peut-être déjà.') } finally { setLoading(false) }
  }

  if (done) return (
    <Shell title="Compte créé" sub="Bienvenue à bord">
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-3xl">✅</span></div>
        <p className="text-stone-600 mb-2 font-semibold">Votre compte est prêt</p>
        <p className="text-stone-400 text-sm mb-6">Un administrateur doit activer votre abonnement avant votre première connexion.</p>
        <button onClick={goLogin} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-amber-500/30">Aller à la connexion</button>
      </div>
    </Shell>
  )

  return (
    <Shell title="Créer un compte" sub="Rejoignez la plateforme">
      <div className="space-y-3.5">
        <div><label className={labelCls}>Nom du commerce</label><input className={inputCls} value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex : Boulangerie El Baraka" /></div>
        <div><label className={labelCls}>Téléphone</label><input className={inputCls} type="tel" inputMode="numeric" value={tel} onChange={(e) => setTel(e.target.value.replace(/[^0-9]/g, ''))} placeholder="05 XX XX XX XX" /></div>
        <div><label className={labelCls}>Adresse</label><input className={inputCls} value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="Rue, ville" /></div>
        <div>
          <label className={labelCls}>Catégorie</label>
          <select className={inputCls} value={categorie} onChange={(e) => setCategorie(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div><label className={labelCls}>Mot de passe</label><input className={inputCls} type="password" value={mdp} onChange={(e) => setMdp(e.target.value)} placeholder="••••••" /></div>
        {error && <div className="bg-red-50 border border-red-100 text-red-500 text-sm rounded-2xl px-4 py-3">{error}</div>}
        <button onClick={submit} disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold py-3.5 rounded-2xl transition-all disabled:opacity-60 mt-1 shadow-lg shadow-amber-500/30">
          {loading ? 'Création…' : 'Créer mon compte'}
        </button>
      </div>
      <p className="text-center text-sm text-stone-400 mt-5">
        Déjà inscrit ?{' '}
        <button onClick={goLogin} className="text-amber-600 font-semibold hover:underline">Se connecter</button>
      </p>
    </Shell>
  )
}
