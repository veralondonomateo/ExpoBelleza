import { useState, useEffect, useCallback } from 'react'
import { Users as UsersIcon, Plus, Edit2, Trash2, X, Check, AlertCircle, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'

const ROLES = [
  { value: 'vendedora', label: 'Vendedora' },
  { value: 'admin',     label: 'Admin'     },
]

function UserModal({ user, onSave, onClose }) {
  const isNew = !user
  const [fullName, setFullName] = useState(user?.name ?? '')
  const [email,    setEmail]    = useState(user?.email    ?? '')
  const [password, setPassword] = useState('')
  const [role,     setRole]     = useState(user?.role     ?? 'vendedora')
  const [show,     setShow]     = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState(null)

  const handleSave = async () => {
    if (!fullName.trim() || !email.trim()) { setError('Nombre y correo son obligatorios.'); return }
    if (isNew && !password) { setError('La contraseña es obligatoria para nuevos usuarios.'); return }
    setSaving(true)
    setError(null)
    try {
      await onSave({ id: user?.id, fullName: fullName.trim(), email: email.trim(), password: password || undefined, role })
      onClose()
    } catch (err) {
      setError(err.message || 'Error al guardar usuario.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-[400px]">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50">
          <p className="font-semibold text-gray-800 text-sm">{isNew ? 'Nuevo usuario' : 'Editar usuario'}</p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition">
            <X size={15} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest block mb-1">Nombre completo</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="María García"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition" />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest block mb-1">Correo electrónico</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="maria@grupomsm.co"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition" />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest block mb-1">
              {isNew ? 'Contraseña' : 'Nueva contraseña (dejar vacío para no cambiar)'}
            </label>
            <div className="relative">
              <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder={isNew ? '••••••••' : 'Sin cambios'}
                className="w-full px-3 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition" />
              <button type="button" onClick={() => setShow(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest block mb-1">Rol</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(r => (
                <button key={r.value} type="button" onClick={() => setRole(r.value)}
                  className={`py-2 rounded-xl border-2 text-xs font-semibold transition ${
                    role === r.value ? 'border-brand-red bg-brand-soft text-brand-red' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle size={12} className="text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-500">{error}</p>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-brand-red text-white text-sm font-semibold hover:bg-brand-red/90 transition flex items-center justify-center gap-2 disabled:opacity-60">
            {saving
              ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Guardando...</>
              : <><Check size={14} /> Guardar</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Users() {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [modal,   setModal]   = useState(null) // null | 'new' | { user object }
  const [deleting, setDeleting] = useState(null)

  const invoke = (body) => supabase.functions.invoke('manage-users', { body })

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: fnErr } = await invoke({ action: 'list' })
    if (fnErr || data?.error) {
      setError(fnErr?.message || data?.error || 'Error al cargar usuarios')
    } else {
      setUsers(data?.profiles ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async ({ id, fullName, email, password, role }) => {
    const isUpdate = !!id
    const body = isUpdate
      ? { action: 'update', userId: id, name: fullName, role, ...(password ? { password } : {}) }
      : { action: 'create', email, password, name: fullName, role }
    const { data, error: fnErr } = await invoke(body)
    if (fnErr || data?.error) throw new Error(fnErr?.message || data?.error || 'Error al guardar')
    await load()
  }

  const handleDelete = async (userId) => {
    setDeleting(userId)
    const { data, error: fnErr } = await invoke({ action: 'delete', userId })
    if (fnErr || data?.error) {
      setError(fnErr?.message || data?.error || 'Error al eliminar')
    } else {
      setUsers(prev => prev.filter(u => u.id !== userId))
    }
    setDeleting(null)
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-start justify-between mb-5 gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Usuarios</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gestiona el acceso al sistema</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={load} title="Recargar"
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setModal('new')}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-red text-white text-sm font-semibold rounded-xl hover:bg-brand-red/90 transition">
            <Plus size={14} /> Nuevo usuario
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl mb-4">
          <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
            <p className="text-xs text-gray-400">Cargando usuarios...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <UsersIcon size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No hay usuarios registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="bg-gray-50/70">
                  {['Nombre', 'Correo', 'Rol', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center flex-shrink-0">
                          <span className="text-[11px] font-bold text-brand-red uppercase">
                            {(u.name || u.email || '?')[0]}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-700 truncate">{u.name || '—'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-500 truncate">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-brand-soft text-brand-red'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {u.role === 'admin' ? 'Admin' : 'Vendedora'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setModal(u)}
                          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:border-brand-pink hover:text-brand-red hover:bg-brand-soft transition">
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => { if (window.confirm(`¿Eliminar a ${u.name || u.email}?`)) handleDelete(u.id) }}
                          disabled={deleting === u.id}
                          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-40">
                          {deleting === u.id
                            ? <span className="w-3 h-3 border border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                            : <Trash2 size={13} />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <UserModal
          user={modal === 'new' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
