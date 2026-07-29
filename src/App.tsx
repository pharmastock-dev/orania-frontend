import { useState, useEffect } from 'react'
import { ShoppingBag, Store, Shield, Headphones, ChevronRight, Banknote, Phone, MessageCircle, Mail, MapPin, ArrowLeft } from 'lucide-react'
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
    window.history.pushState({ level: 'portail' }, '')
    setPortail(p)
  }

  // Bouton retour physique / flèche navigateur, au niveau des portails.
  // window.__oraniaBackDepth compte les sous-écrans internes ouverts (ex: menu magasin).
  // Tant qu'il en reste, on ne remonte PAS à l'accueil : le portail les ferme lui-même.
  useEffect(() => {
    ;(window as any).__oraniaBackDepth = 0
    const onPop = () => {
      const d = (window as any).__oraniaBackDepth || 0
      if (d > 0) {
        // un sous-écran est ouvert : le portail va le fermer via son propre listener
        ;(window as any).__oraniaBackDepth = d - 1
        return
      }
      setPortail((cur) => (cur !== 'accueil' ? 'accueil' : cur))
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
        <PortailCard Icon={ShoppingBag} titre="Je suis un client" sous="Commander auprès des commerces" accent="bg-amber-500" onClick={() => ouvrirPortail('client')} />
        <PortailCard Icon={Store} titre="Je suis un commerçant" sous="Gérer mon commerce et mes commandes" accent="bg-[#12355B]" onClick={() => ouvrirPortail('fournisseur')} />
        <PortailCard Icon={Shield} titre="Administration" sous="Gérer les abonnements" accent="bg-stone-600" onClick={() => ouvrirPortail('admin')} />
        <PortailCard Icon={Headphones} titre="Contact" sous="Nous contacter / assistance" accent="bg-emerald-500" onClick={() => ouvrirPortail('contact')} />
      </div>

      <p className="text-white/80 text-xs mt-10 flex items-center justify-center gap-1.5"><Banknote size={15} /> Paiement en espèces uniquement</p>
      </div>
    </div>
  )
}

function PortailCard({ Icon, titre, sous, accent, onClick }: { Icon: React.ComponentType<{ size?: number; className?: string }>; titre: string; sous: string; accent: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group w-full bg-white hover:bg-stone-50/80 border border-stone-100 rounded-xl px-5 py-4 flex items-center gap-4 transition-all active:scale-[0.99] text-left shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
      <div className={`w-12 h-12 ${accent} rounded-xl flex items-center justify-center shrink-0 text-white`}>
        <Icon size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-stone-800 text-[15px] leading-tight">{titre}</p>
        <p className="text-stone-400 text-[13px] mt-0.5">{sous}</p>
      </div>
      <ChevronRight size={20} className="text-stone-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all shrink-0" />
    </button>
  )
}


function ContactPage({ onExit }: { onExit: () => void }) {
  const rows = ([
    [Phone, 'Téléphone', CONTACT.telephone],
    [MessageCircle, 'WhatsApp', CONTACT.whatsapp],
    [Mail, 'Email', CONTACT.email],
    [MapPin, 'Adresse', CONTACT.adresse],
  ] as [React.ComponentType<{ size?: number; className?: string }>, string, string][]).filter((r) => r[2])

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg text-white"><Headphones size={34} /></div>
          <h1 className="text-2xl font-extrabold text-stone-800">Contact</h1>
          <p className="text-stone-500 text-sm mt-1">{CONTACT.nomApp} — {CONTACT.slogan}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 space-y-1 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-stone-100">
          {rows.map(([Icon, label, value]) => {
            const href = label === 'Téléphone' || label === 'WhatsApp' ? `tel:${value.replace(/\s/g, '')}`
              : label === 'Email' ? `mailto:${value}` : undefined
            const inner = (
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors">
                <div className="w-11 h-11 bg-stone-100 rounded-xl flex items-center justify-center text-stone-600 shrink-0"><Icon size={19} /></div>
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

        <button onClick={onExit} className="w-full flex items-center justify-center gap-1.5 text-stone-400 hover:text-stone-700 text-sm py-4 mt-4 transition-colors"><ArrowLeft size={16} /> Retour à l'accueil</button>
      </div>
    </div>
  )
}
