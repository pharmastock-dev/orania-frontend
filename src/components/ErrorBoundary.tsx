import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

// Empêche l'écran blanc : capture toute erreur de rendu et affiche un message.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Erreur inconnue' }
  }

  componentDidCatch(error: Error) {
    console.error('Erreur capturée :', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 px-6 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-5"><span className="text-4xl">⚠️</span></div>
          <h1 className="text-xl font-bold text-stone-800 mb-2">Une erreur est survenue</h1>
          <p className="text-stone-500 text-sm mb-1">La page n'a pas pu s'afficher.</p>
          <p className="text-stone-400 text-xs mb-6 max-w-sm break-words font-mono bg-stone-100 rounded-lg px-3 py-2">{this.state.message}</p>
          <button onClick={() => { try { sessionStorage.removeItem('fournisseur'); sessionStorage.removeItem('acheteur') } catch {}; location.href = location.pathname }}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-2xl transition-all">Recharger</button>
        </div>
      )
    }
    return this.props.children
  }
}
