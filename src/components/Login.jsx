import { useState } from 'react'
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [show,     setShow]     = useState(false)
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [shake,    setShake]    = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError(null)
    const { error: authErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (authErr) {
      setError('Correo o contraseña incorrectos')
      setShake(true)
      setPassword('')
      setTimeout(() => setShake(false), 500)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-brand-soft flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-pink/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-brand-red/10 rounded-full blur-3xl" />
      </div>

      <div className={`relative bg-white rounded-3xl shadow-modal w-full max-w-sm p-8 ${shake ? 'animate-shake' : ''}`}>
        <div className="flex flex-col items-center mb-8">
          <img src="/logo2.jpg" alt="ExpoBelleza" className="h-24 w-auto object-contain mb-4" />
          <p className="text-[10px] font-bold tracking-[0.25em] text-gray-300 uppercase">
            Sistema de Inventario
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
              Correo electrónico
            </label>
            <div className={`flex items-center gap-2 border-2 rounded-xl px-3.5 py-3 transition-all ${
              error ? 'border-red-300 bg-red-50' : 'border-gray-200 focus-within:border-brand-red/50 focus-within:bg-brand-soft'
            }`}>
              <Mail size={15} className={error ? 'text-red-400' : 'text-gray-400'} />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(null) }}
                placeholder="usuario@grupomsm.co"
                autoFocus
                className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none placeholder:text-gray-300"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
              Contraseña
            </label>
            <div className={`flex items-center gap-2 border-2 rounded-xl px-3.5 py-3 transition-all ${
              error ? 'border-red-300 bg-red-50' : 'border-gray-200 focus-within:border-brand-red/50 focus-within:bg-brand-soft'
            }`}>
              <Lock size={15} className={error ? 'text-red-400' : 'text-gray-400'} />
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(null) }}
                placeholder="••••••••"
                className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none placeholder:text-gray-300"
              />
              <button type="button" onClick={() => setShow(v => !v)}
                className="text-gray-400 hover:text-gray-600 transition flex-shrink-0">
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-1.5">
              <AlertCircle size={12} className="text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-500 font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!email || !password || loading}
            className="w-full py-3.5 bg-brand-red text-white rounded-xl font-bold text-sm hover:bg-brand-red/90 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2 mt-1"
          >
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Ingresando...</>
              : 'Ingresar'
            }
          </button>
        </form>

        <p className="text-center text-[10px] text-gray-300 mt-6">ExpoBelleza · 2026</p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-5px); }
          80%       { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.45s ease-in-out; }
      `}</style>
    </div>
  )
}
