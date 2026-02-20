"use client"

import { useState, useEffect } from 'react'

export default function ResetDorPage() {
  const [status, setStatus] = useState('מאפס סיסמא...')
  const [error, setError] = useState('')

  useEffect(() => {
    const resetPassword = async () => {
      try {
        const res = await fetch('/api/reset-dor')
        const data = await res.json()
        if (data.success) {
          setStatus('✅ ' + data.message)
        } else {
          setError('❌ ' + data.error)
        }
      } catch (e: any) {
        setError('❌ שגיאה: ' + e.message)
      }
    }
    resetPassword()
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-[#00D4D4] to-[#00A8A8] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-black text-2xl">22</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-4">איפוס סיסמא</h1>
        
        {error ? (
          <div className="text-red-500 text-lg">{error}</div>
        ) : (
          <div className="text-green-600 text-lg">{status}</div>
        )}
        
        <div className="mt-6 p-4 bg-slate-100 rounded-lg text-right">
          <p className="text-slate-600 text-sm mb-2">פרטי התחברות:</p>
          <p className="font-mono text-sm">אימייל: office@hr22group.com</p>
          <p className="font-mono text-sm">סיסמא: avigdor22</p>
        </div>
        
        <a 
          href="/login" 
          className="mt-6 inline-block bg-gradient-to-r from-[#00A8A8] to-[#00D4D4] text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          לך לדף התחברות
        </a>
      </div>
    </div>
  )
}
