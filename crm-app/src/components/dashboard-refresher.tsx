'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

export function DashboardRefresher() {
  const router = useRouter()
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    // רענון אוטומטי כל 60 שניות
    const interval = setInterval(() => {
      router.refresh()
      setLastRefresh(new Date())
    }, 60 * 1000)
    return () => clearInterval(interval)
  }, [router])

  const handleManualRefresh = () => {
    setRefreshing(true)
    router.refresh()
    setLastRefresh(new Date())
    setTimeout(() => setRefreshing(false), 1200)
  }

  return (
    <button
      onClick={handleManualRefresh}
      className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 text-xs px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200"
      title="רענן נתונים"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
      <span className="hidden sm:inline">עדכן נתונים</span>
      <span className="text-slate-300 hidden sm:inline">|</span>
      <span className="hidden sm:inline">
        {lastRefresh.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </button>
  )
}
