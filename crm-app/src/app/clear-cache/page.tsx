"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, RefreshCw, CheckCircle, Smartphone, AlertTriangle } from "lucide-react"
import Link from 'next/link'

export default function ClearCachePage() {
  const [isClearing, setIsClearing] = useState(false)
  const [cleared, setCleared] = useState(false)
  const [swVersion, setSwVersion] = useState<string | null>(null)
  const [deviceInfo, setDeviceInfo] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // זיהוי מכשיר
    const ua = navigator.userAgent
    let device = 'Unknown'
    if (/iPhone|iPad|iPod/.test(ua)) {
      device = 'iPhone/iPad (iOS)'
    } else if (/Samsung|Galaxy/.test(ua)) {
      device = 'Samsung Galaxy'
    } else if (/Android/.test(ua)) {
      device = 'Android'
    } else if (/Windows/.test(ua)) {
      device = 'Windows'
    } else if (/Mac/.test(ua)) {
      device = 'Mac'
    }
    setDeviceInfo(device)

    // בדיקת גרסת Service Worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel()
      messageChannel.port1.onmessage = (event) => {
        if (event.data?.version) {
          setSwVersion(event.data.version)
        }
      }
      navigator.serviceWorker.controller.postMessage('GET_VERSION', [messageChannel.port2])
    }
  }, [])

  const clearAllCaches = async () => {
    setIsClearing(true)
    setError(null)
    
    try {
      // 1. נקה Cache API
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        console.log('Found caches:', cacheNames)
        for (const name of cacheNames) {
          await caches.delete(name)
          console.log('Deleted cache:', name)
        }
      }

      // 2. שלח הודעה ל-Service Worker לנקות
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel()
        messageChannel.port1.onmessage = (event) => {
          console.log('SW response:', event.data)
        }
        navigator.serviceWorker.controller.postMessage('CLEAR_CACHE', [messageChannel.port2])
      }

      // 3. בטל רישום Service Workers ישנים
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        for (const registration of registrations) {
          await registration.unregister()
          console.log('Unregistered SW:', registration.scope)
        }
      }

      // 4. נקה localStorage
      localStorage.clear()
      
      // 5. נקה sessionStorage
      sessionStorage.clear()

      setCleared(true)
      
      // רענן אחרי 2 שניות
      setTimeout(() => {
        window.location.href = '/dashboard/candidates'
      }, 2000)

    } catch (err: any) {
      console.error('Error clearing cache:', err)
      setError(err.message || 'שגיאה בניקוי')
    } finally {
      setIsClearing(false)
    }
  }

  const forceRefresh = () => {
    // רענון קשיח - מתעלם מכל cache
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4" dir="rtl">
      <Card className="max-w-md w-full bg-white/95 backdrop-blur shadow-2xl border-0">
        <CardHeader className="text-center border-b bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            <Smartphone className="h-6 w-6" />
            🔄 עדכון האפליקציה
          </CardTitle>
          <p className="text-white/80 text-sm mt-2">
            ניקוי Cache ורענון הנתונים
          </p>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Device Info */}
          <div className="bg-slate-100 rounded-lg p-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">מכשיר:</span>
              <span className="font-medium">{deviceInfo}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-slate-600">גרסת SW:</span>
              <span className="font-mono text-xs">{swVersion || 'לא נמצא'}</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">לפני הניקוי:</p>
                <ul className="list-disc list-inside mt-1 text-xs">
                  <li>יש לוודא חיבור לאינטרנט יציב</li>
                  <li>הנתונים לא יימחקו - רק ה-Cache</li>
                  <li>תצטרך להתחבר מחדש לאפליקציה</li>
                </ul>
              </div>
            </div>
          </div>

          {cleared ? (
            <div className="text-center py-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-bold text-green-700">הניקוי הושלם בהצלחה!</p>
              <p className="text-sm text-slate-600 mt-2">מעביר לדף המועמדים...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                onClick={clearAllCaches}
                disabled={isClearing}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white h-14 text-lg"
              >
                {isClearing ? (
                  <>
                    <RefreshCw className="h-5 w-5 ml-2 animate-spin" />
                    מנקה...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5 ml-2" />
                    נקה Cache ורענן
                  </>
                )}
              </Button>

              <Button
                onClick={forceRefresh}
                variant="outline"
                className="w-full h-12"
              >
                <RefreshCw className="h-4 w-4 ml-2" />
                רענון רגיל
              </Button>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-4">
            <Link href="/dashboard/candidates">
              <Button variant="ghost" className="w-full">
                ← חזור לדף מועמדים
              </Button>
            </Link>
          </div>

          {/* iOS Instructions */}
          {deviceInfo.includes('iPhone') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs">
              <p className="font-medium text-blue-800 mb-2">📱 הוראות נוספות ל-iPhone:</p>
              <ol className="list-decimal list-inside text-blue-700 space-y-1">
                <li>לכו ל-Settings → Safari</li>
                <li>גלול למטה → Clear History and Website Data</li>
                <li>חזרו לאפליקציה ורענו</li>
              </ol>
            </div>
          )}

          {/* Samsung Instructions */}
          {deviceInfo.includes('Samsung') && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-xs">
              <p className="font-medium text-purple-800 mb-2">📱 הוראות נוספות ל-Samsung:</p>
              <ol className="list-decimal list-inside text-purple-700 space-y-1">
                <li>לכו ל-Settings → Apps → Samsung Internet</li>
                <li>Storage → Clear Cache</li>
                <li>או: פתחו בדפדפן Chrome במקום</li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
