"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Shield, Users, Plus, Key, Trash2, UserCheck, UserX,
  Lock, Unlock, ChevronDown, X, Check, AlertTriangle,
  RefreshCw, Search, Crown
} from "lucide-react"

const ADMIN_EMAIL = 'office@hr22group.com'

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'אדמין',
  MANAGER: 'מנהל',
  RECRUITER: 'רקרוטר',
  EMPLOYEE: 'עובד',
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  MANAGER: 'bg-purple-100 text-purple-700',
  RECRUITER: 'bg-blue-100 text-blue-700',
  EMPLOYEE: 'bg-gray-100 text-gray-700',
}

type User = {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  phone?: string | null
  createdAt: string
  lastLoginAt?: string | null
  failedLoginAttempts: number
  lockedAt?: string | null
}

type ModalState =
  | { type: 'resetPassword'; user: User }
  | { type: 'createUser' }
  | { type: 'changeRole'; user: User }
  | null

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<ModalState>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  // form states
  const [newPassword, setNewPassword] = useState('')
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '', role: 'RECRUITER', phone: '' })
  const [selectedRole, setSelectedRole] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error('שגיאה בטעינת משתמשים')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (e: any) {
      showToast(e.message, false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user?.email !== ADMIN_EMAIL) {
      router.replace('/dashboard')
      return
    }
    fetchUsers()
  }, [session, status, router, fetchUsers])

  const apiCall = async (method: string, body: object) => {
    const res = await fetch('/api/admin/users', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'שגיאה')
    return data
  }

  const handleResetPassword = async () => {
    if (modal?.type !== 'resetPassword') return
    setActionLoading(true)
    try {
      const data = await apiCall('PATCH', { userId: modal.user.id, action: 'resetPassword', newPassword })
      showToast(data.message)
      setModal(null)
      setNewPassword('')
    } catch (e: any) {
      showToast(e.message, false)
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleActive = async (user: User) => {
    try {
      const data = await apiCall('PATCH', { userId: user.id, action: 'toggleActive', active: !user.active })
      showToast(data.message)
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: !u.active } : u))
    } catch (e: any) {
      showToast(e.message, false)
    }
  }

  const handleUnlock = async (user: User) => {
    try {
      const data = await apiCall('PATCH', { userId: user.id, action: 'unlock' })
      showToast(data.message)
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, lockedAt: null, failedLoginAttempts: 0 } : u))
    } catch (e: any) {
      showToast(e.message, false)
    }
  }

  const handleChangeRole = async () => {
    if (modal?.type !== 'changeRole') return
    setActionLoading(true)
    try {
      const data = await apiCall('PATCH', { userId: modal.user.id, action: 'changeRole', role: selectedRole })
      showToast(data.message)
      setUsers(prev => prev.map(u => u.id === modal.user.id ? { ...u, role: selectedRole } : u))
      setModal(null)
    } catch (e: any) {
      showToast(e.message, false)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateUser = async () => {
    setActionLoading(true)
    try {
      await apiCall('POST', newUserForm)
      showToast(`✅ משתמש ${newUserForm.name} נוצר בהצלחה`)
      setModal(null)
      setNewUserForm({ name: '', email: '', password: '', role: 'RECRUITER', phone: '' })
      fetchUsers()
    } catch (e: any) {
      showToast(e.message, false)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (user: User) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את ${user.name}?\nפעולה זו בלתי הפיכה!`)) return
    try {
      const data = await apiCall('DELETE', { userId: user.id })
      showToast(data.message)
      setUsers(prev => prev.filter(u => u.id !== user.id))
    } catch (e: any) {
      showToast(e.message, false)
    }
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (ROLE_LABELS[u.role] || u.role).toLowerCase().includes(q)
    )
  })

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ניהול אדמין</h1>
            <p className="text-sm text-gray-500">{users.length} משתמשים במערכת</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            רענן
          </button>
          <button
            onClick={() => setModal({ type: 'createUser' })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            משתמש חדש
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'סה"כ משתמשים', value: users.length, color: 'bg-blue-50 text-blue-700', icon: Users },
          { label: 'פעילים', value: users.filter(u => u.active).length, color: 'bg-green-50 text-green-700', icon: UserCheck },
          { label: 'לא פעילים', value: users.filter(u => !u.active).length, color: 'bg-gray-50 text-gray-700', icon: UserX },
          { label: 'נעולים', value: users.filter(u => !!u.lockedAt).length, color: 'bg-red-50 text-red-700', icon: Lock },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className={`rounded-2xl p-4 ${color} flex items-center gap-3`}>
            <Icon className="h-5 w-5 opacity-70" />
            <div>
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs opacity-70">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם, אימייל או תפקיד..."
          className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-right px-4 py-3 font-semibold text-gray-600">משתמש</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">תפקיד</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">סטטוס</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">כניסה אחרונה</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 flex items-center gap-1.5">
                          {user.name}
                          {user.email === ADMIN_EMAIL && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                        </div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                        {user.phone && <div className="text-xs text-gray-400">{user.phone}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600'}`}>
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {user.lockedAt ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-700">
                          <Lock className="h-3 w-3" /> נעול
                        </span>
                      ) : user.active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700">
                          <Check className="h-3 w-3" /> פעיל
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600">
                          <X className="h-3 w-3" /> לא פעיל
                        </span>
                      )}
                      {user.failedLoginAttempts > 0 && !user.lockedAt && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700">
                          <AlertTriangle className="h-3 w-3" /> {user.failedLoginAttempts} כשלונות
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem', dateStyle: 'short', timeStyle: 'short' })
                      : 'טרם התחבר'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {/* Reset password */}
                      <button
                        onClick={() => { setModal({ type: 'resetPassword', user }); setNewPassword('') }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        title="שנה סיסמה"
                      >
                        <Key className="h-4 w-4" />
                      </button>

                      {/* Change role */}
                      {user.email !== ADMIN_EMAIL && (
                        <button
                          onClick={() => { setModal({ type: 'changeRole', user }); setSelectedRole(user.role) }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all"
                          title="שנה תפקיד"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      )}

                      {/* Unlock */}
                      {user.lockedAt && (
                        <button
                          onClick={() => handleUnlock(user)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all"
                          title="שחרר נעילה"
                        >
                          <Unlock className="h-4 w-4" />
                        </button>
                      )}

                      {/* Toggle active */}
                      {user.email !== ADMIN_EMAIL && (
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`p-1.5 rounded-lg transition-all ${user.active
                            ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={user.active ? 'כבה חשבון' : 'הפעל חשבון'}
                        >
                          {user.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                      )}

                      {/* Delete */}
                      {user.email !== ADMIN_EMAIL && (
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                          title="מחק משתמש"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    לא נמצאו משתמשים
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== MODALS ===== */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4" dir="rtl">
            {/* Reset Password Modal */}
            {modal.type === 'resetPassword' && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Key className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900">שינוי סיסמה</h2>
                      <p className="text-sm text-gray-500">{modal.user.name}</p>
                    </div>
                  </div>
                  <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="סיסמה חדשה (מינימום 6 תווים)"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleResetPassword}
                    disabled={actionLoading || newPassword.length < 6}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
                  >
                    {actionLoading ? 'מעדכן...' : 'שמור סיסמה'}
                  </button>
                  <button onClick={() => setModal(null)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                    ביטול
                  </button>
                </div>
              </>
            )}

            {/* Change Role Modal */}
            {modal.type === 'changeRole' && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900">שינוי תפקיד</h2>
                      <p className="text-sm text-gray-500">{modal.user.name}</p>
                    </div>
                  </div>
                  <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setSelectedRole(value)}
                      className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        selectedRole === value
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleChangeRole}
                    disabled={actionLoading || !selectedRole}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-all"
                  >
                    {actionLoading ? 'מעדכן...' : 'שמור תפקיד'}
                  </button>
                  <button onClick={() => setModal(null)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                    ביטול
                  </button>
                </div>
              </>
            )}

            {/* Create User Modal */}
            {modal.type === 'createUser' && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <Plus className="h-5 w-5 text-green-600" />
                    </div>
                    <h2 className="font-bold text-gray-900">יצירת משתמש חדש</h2>
                  </div>
                  <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <input
                    value={newUserForm.name}
                    onChange={e => setNewUserForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="שם מלא *"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    value={newUserForm.email}
                    onChange={e => setNewUserForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="אימייל *"
                    type="email"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500"
                    dir="ltr"
                  />
                  <input
                    value={newUserForm.password}
                    onChange={e => setNewUserForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="סיסמה (מינימום 6 תווים) *"
                    type="password"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    value={newUserForm.phone}
                    onChange={e => setNewUserForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="טלפון (אופציונלי)"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500"
                    dir="ltr"
                  />
                  <select
                    value={newUserForm.role}
                    onChange={e => setNewUserForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateUser}
                    disabled={actionLoading || !newUserForm.name || !newUserForm.email || newUserForm.password.length < 6}
                    className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-all"
                  >
                    {actionLoading ? 'יוצר...' : 'צור משתמש'}
                  </button>
                  <button onClick={() => setModal(null)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                    ביטול
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-medium transition-all ${
          toast.ok ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.ok ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}
