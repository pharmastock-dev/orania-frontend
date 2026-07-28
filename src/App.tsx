import { useState, useEffect } from 'react'
import { ClientApp } from './pages/ClientApp'
import { FournisseurAuth, type FournisseurSession } from './pages/FournisseurAuth'
import { FournisseurDashboard } from './pages/FournisseurDashboard'
import { AdminPanel } from './pages/AdminPanel'
import { CONTACT } from './lib/contact'
import { LogoOrania } from './components/Logo'

type Portail = 'accueil' | 'client' | 'fournisseur' | 'admin' | 'contact'

export default function App() {
  const [portail, setPortail] = useState<Portail>('accueil')
  const [fSession, setFSession] = useState<FournisseurSession | null>(null)

  // Restaurer une session fournisseur
  useEffect(() => {
    const saved = localStorage.getItem('fournisseur')
    if (saved) { try { setFSession(JSON.parse(saved)); setPortail('fournisseur') } catch {} }
  }, [])

  const loginFournisseur = (s: FournisseurSession) => {
    localStorage.setItem('fournisseur', JSON.stringify(s)); setFSession(s); setPortail('fournisseur')
  }
  const logoutFournisseur = () => { localStorage.removeItem('fournisseur'); setFSession(null); setPortail('accueil') }

  // ouvrir un portail en ajoutant une entrée d'historique (pour le bouton retour du téléphone)
  const ouvrirPortail = (p: Portail) => {
    window.history.pushState({ portail: p }, '')
    setPortail(p)
  }

  // bouton retour physique du téléphone : revenir à l'accueil au lieu de quitter
  useEffect(() => {
    const onPop = () => {
      setPortail((cur) => {
        // si un fournisseur est connecté, le bouton retour ne le déconnecte pas depuis l'accueil
        if (cur !== 'accueil') return 'accueil'
        return cur
      })
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  if (portail === 'client') return <ClientApp onExit={() => setPortail('accueil')} />

  if (portail === 'fournisseur') {
    return fSession
      ? <FournisseurDashboard session={fSession} onLogout={logoutFournisseur} />
      : <FournisseurAuth onLogin={loginFournisseur} />
  }

  if (portail === 'admin') return <AdminPanel onExit={() => setPortail('accueil')} />

  if (portail === 'contact') return <ContactPage onExit={() => setPortail('accueil')} />

  // ─── Accueil : choix du portail ──────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 relative"
      style={{ backgroundImage: 'url(/background.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="absolute inset-0 bg-[#12355B]/20" />
      <div className="relative z-10 w-full flex flex-col items-center">
      <div className="mb-10 text-center">
        <div className="w-28 h-28 bg-white rounded-[28px] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-stone-200 border border-stone-100"><LogoOrania size={80} /></div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Orania</h1>
        <p className="text-white/90 text-sm mt-2">Tout Oran, en un clic</p>
      </div>

      <div className="w-full max-w-md space-y-3">
        <PortailCard emoji="🛍️" titre="Je suis un client" sous="Commander auprès des commerces" accent="bg-amber-500" onClick={() => ouvrirPortail('client')} />
        <PortailCard emoji="🏪" titre="Je suis un commerçant" sous="Gérer mon commerce et mes commandes" accent="bg-stone-800" onClick={() => ouvrirPortail('fournisseur')} />
        <PortailCard emoji="⚙️" titre="Administration" sous="Gérer les abonnements" accent="bg-stone-600" onClick={() => ouvrirPortail('admin')} />
        <PortailCard emoji="📞" titre="Contact" sous="Nous contacter / assistance" accent="bg-emerald-500" onClick={() => ouvrirPortail('contact')} />
      </div>

      <p className="text-white/80 text-xs mt-10">💵 Paiement en espèces uniquement</p>
      </div>
    </div>
  )
}

function PortailCard({ emoji, titre, sous, accent, onClick }: { emoji: string; titre: string; sous: string; accent: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group w-full bg-white hover:bg-stone-50 border border-stone-100 rounded-2xl p-5 flex items-center gap-4 transition-all active:scale-[0.98] text-left shadow-sm hover:shadow-md">
      <div className={`w-14 h-14 ${accent} rounded-2xl flex items-center justify-center shrink-0 text-2xl shadow-md`}>{emoji}</div>
      <div className="flex-1">
        <p className="font-bold text-stone-800 text-base">{titre}</p>
        <p className="text-stone-500 text-sm">{sous}</p>
      </div>
      <span className="text-stone-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all text-xl">→</span>
    </button>
  )
}


function ContactPage({ onExit }: { onExit: () => void }) {
  const rows: [string, string, string][] = [
    ['📞', 'Téléphone', CONTACT.telephone],
    ['💬', 'WhatsApp', CONTACT.whatsapp],
    ['✉️', 'Email', CONTACT.email],
    ['📍', 'Adresse', CONTACT.adresse],
  ].filter((r) => r[2]) as [string, string, string][]

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-emerald-500 rounded-[24px] flex items-center justify-center mx-auto mb-4 shadow-xl"><span className="text-4xl">📞</span></div>
          <h1 className="text-2xl font-extrabold text-stone-800">Contact</h1>
          <p className="text-stone-500 text-sm mt-1">{CONTACT.nomApp} — {CONTACT.slogan}</p>
        </div>

        <div className="bg-white rounded-3xl p-4 space-y-1 shadow-sm border border-stone-100">
          {rows.map(([emoji, label, value]) => {
            const href = label === 'Téléphone' || label === 'WhatsApp' ? `tel:${value.replace(/\s/g, '')}`
              : label === 'Email' ? `mailto:${value}` : undefined
            const inner = (
              <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-stone-50 transition-colors">
                <div className="w-11 h-11 bg-stone-100 rounded-xl flex items-center justify-center text-xl shrink-0">{emoji}</div>
                <div className="min-w-0"><p className="text-[11px] text-stone-400 uppercase tracking-widest">{label}</p><p className="text-stone-800 font-semibold truncate">{value}</p></div>
              </div>
            )
            return href ? <a key={label} href={href} className="block">{inner}</a> : <div key={label}>{inner}</div>
          })}
        </div>

        {(CONTACT.facebook || CONTACT.instagram) && (
          <div className="flex gap-3 justify-center mt-4">
            {CONTACT.facebook && <a href={CONTACT.facebook} target="_blank" className="bg-white border border-stone-200 text-stone-700 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-stone-50 transition-colors">Facebook</a>}
            {CONTACT.instagram && <a href={CONTACT.instagram} target="_blank" className="bg-white border border-stone-200 text-stone-700 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-stone-50 transition-colors">Instagram</a>}
          </div>
        )}

        <button onClick={onExit} className="w-full text-stone-400 hover:text-stone-700 text-sm py-4 mt-4 transition-colors">← Retour à l'accueil</button>
      </div>
    </div>
  )
}
