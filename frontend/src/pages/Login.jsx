import { useState } from 'react'
import { LogIn, Lock } from 'lucide-react'
import { login } from '../api'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await login(username, password)
      onLogin(res.user, res.token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm neu-card p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" 
            style={{ background: 'var(--bg)', boxShadow: '8px 8px 16px var(--shadow-dark), -8px -8px 16px var(--shadow-light)' }}>
            <Lock size={28} style={{ color: 'var(--accent)' }} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>Moneycall CRM</h1>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Sistema Proactivo</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl text-xs text-center font-bold" 
            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Usuario</label>
            <input 
              type="text" required
              className="neu-input w-full" 
              placeholder="Ej. carlos.ventas"
              value={username} onChange={e => setUsername(e.target.value)} 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>Contraseña</label>
            <input 
              type="password" required
              className="neu-input w-full" 
              placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="neu-btn-accent w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold mt-2"
          >
            {loading ? 'Iniciando...' : <><LogIn size={18} /> Entrar</>}
          </button>
        </form>
      </div>
    </div>
  )
}
