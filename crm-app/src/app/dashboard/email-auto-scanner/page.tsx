'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Play, Pause, RefreshCw, Mail, CheckCircle, XCircle, Clock, Zap } from 'lucide-react'

export default function EmailAutoScannerPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [scanHistory, setScanHistory] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalScans: 0,
    emailsChecked: 0,
    candidatesCreated: 0,
    lastScan: null as Date | null
  })
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [nextScanTime, setNextScanTime] = useState<Date | null>(null)

  // טעינת מצב מ-localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('emailAutoScanner')
    if (savedState) {
      const parsed = JSON.parse(savedState)
      setIsRunning(parsed.isRunning)
      setStats(parsed.stats)
      setScanHistory(parsed.history || [])
    }
  }, [])

  // שמירת מצב ב-localStorage (רק כשיש שינוי אמיתי)
  useEffect(() => {
    localStorage.setItem('emailAutoScanner', JSON.stringify({
      isRunning,
      stats,
      history: scanHistory.slice(0, 50) // שמירת 50 סריקות אחרונות
    }))
  }, [isRunning, stats.totalScans, stats.candidatesCreated]) // עדכון רק בשינוי משמעותי

  // סריקה אוטומטית כל 10 דקות
  useEffect(() => {
    if (isRunning) {
      // סריקה מיידית בהפעלה
      performScan()
      
      // הגדרת זמן הסריקה הבאה
      const next = new Date(Date.now() + 10 * 60 * 1000)
      setNextScanTime(next)
      
      // סריקה כל 10 דקות
      intervalRef.current = setInterval(() => {
        performScan()
        // עדכון זמן הסריקה הבאה
        const nextTime = new Date(Date.now() + 10 * 60 * 1000)
        setNextScanTime(nextTime)
      }, 10 * 60 * 1000) // 10 דקות
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      setNextScanTime(null)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])

  const performScan = async () => {
    console.log('🔍 Starting automatic email scan...')
    
    try {
      const response = await fetch('/api/gmail-poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      const result = await response.json()
      
      const scanRecord = {
        timestamp: new Date(),
        success: response.ok,
        emailsChecked: result.emailsChecked || 0,
        candidatesCreated: result.candidatesCreated || 0,
        error: result.error || null
      }

      setScanHistory(prev => [scanRecord, ...prev.slice(0, 49)])
      
      setStats(prev => ({
        totalScans: prev.totalScans + 1,
        emailsChecked: prev.emailsChecked + (result.emailsChecked || 0),
        candidatesCreated: prev.candidatesCreated + (result.candidatesCreated || 0),
        lastScan: new Date()
      }))

      console.log('✅ Scan completed:', result)
    } catch (error) {
      console.error('❌ Scan failed:', error)
      
      const scanRecord = {
        timestamp: new Date(),
        success: false,
        emailsChecked: 0,
        candidatesCreated: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      
      setScanHistory(prev => [scanRecord, ...prev.slice(0, 49)])
    }
  }

  const handleScanHistory = async () => {
    if (confirm('האם לסרוק את כל המיילים ההיסטוריים? (עד 500 מיילים מ-90 הימים האחרונים)')) {
      try {
        const response = await fetch('/api/gmail-scan-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            maxEmails: 500,
            daysBack: 90
          })
        })

        const result = await response.json()
        alert(result.success ? 
          `נסרקו ${result.candidatesCreated || 0} מועמדים מההיסטוריה` :
          `שגיאה: ${result.error}`
        )
      } catch (error) {
        alert('שגיאה בסריקת היסטוריה')
      }
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('he-IL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">סורק מיילים אוטומטי 📧</h1>
          <p className="text-muted-foreground mt-1">
            סריקה אוטומטית של מיילים חדשים כל 10 דקות
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => setIsRunning(!isRunning)}
            variant={isRunning ? "destructive" : "default"}
            size="lg"
          >
            {isRunning ? (
              <>
                <Pause className="ml-2 h-5 w-5" />
                עצור סריקה
              </>
            ) : (
              <>
                <Play className="ml-2 h-5 w-5" />
                התחל סריקה
              </>
            )}
          </Button>
          
          <Button
            onClick={performScan}
            variant="outline"
            size="lg"
            disabled={isRunning}
          >
            <RefreshCw className="ml-2 h-5 w-5" />
            סרוק עכשיו
          </Button>
        </div>
      </div>

      {/* סטטוס */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">סטטוס</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isRunning ? (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="font-bold text-green-600">פעיל</span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-gray-400 rounded-full" />
                  <span className="font-bold text-gray-600">לא פעיל</span>
                </>
              )}
            </div>
            {isRunning && nextScanTime && (
              <div className="mt-2 text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                סריקה הבאה ב-{formatTime(nextScanTime)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">סה"כ סריקות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalScans}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">מיילים נבדקו</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.emailsChecked}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">מועמדים חדשים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.candidatesCreated}</div>
          </CardContent>
        </Card>
      </div>

      {/* כפתור סריקת היסטוריה */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            סריקה חד-פעמית של מיילים ישנים
          </CardTitle>
          <CardDescription>
            סרוק את כל המיילים מ-90 הימים האחרונים (עד 500 מיילים) והעלה אוטומטית את כל המועמדים
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleScanHistory} variant="outline" className="border-purple-300">
            <Mail className="ml-2 h-5 w-5" />
            סרוק היסטוריה
          </Button>
        </CardContent>
      </Card>

      {/* היסטוריית סריקות */}
      <Card>
        <CardHeader>
          <CardTitle>היסטוריית סריקות אחרונות</CardTitle>
          <CardDescription>
            {stats.lastScan && `סריקה אחרונה: ${new Date(stats.lastScan).toLocaleString('he-IL')}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {scanHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                עדיין לא בוצעו סריקות
              </p>
            ) : (
              scanHistory.map((scan, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {scan.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <div className="font-medium">
                        {new Date(scan.timestamp).toLocaleString('he-IL')}
                      </div>
                      {scan.error && (
                        <div className="text-sm text-red-600">{scan.error}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-4 text-sm">
                    <Badge variant="outline">
                      <Mail className="ml-1 h-3 w-3" />
                      {scan.emailsChecked} מיילים
                    </Badge>
                    {scan.candidatesCreated > 0 && (
                      <Badge className="bg-green-100 text-green-800">
                        ✨ {scan.candidatesCreated} מועמדים
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* מידע על 100 מילות הקוד */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <CardHeader>
          <CardTitle>🎯 מערכת זיהוי חכמה עם 100+ מילות קוד</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="font-semibold text-blue-700">עברית</div>
              <div className="text-muted-foreground">קורות חיים, מועמד, משרה, ניסיון</div>
            </div>
            <div>
              <div className="font-semibold text-blue-700">אנגלית</div>
              <div className="text-muted-foreground">CV, resume, candidate, apply</div>
            </div>
            <div>
              <div className="font-semibold text-blue-700">מצורפים</div>
              <div className="text-muted-foreground">PDF, DOC, attached, enclosed</div>
            </div>
            <div>
              <div className="font-semibold text-blue-700">מיומנויות</div>
              <div className="text-muted-foreground">skills, experience, education</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            המערכת סורקת כל מייל עם למעלה מ-100 מילות מפתח בעברית ואנגלית, ומזהה אוטומטית קורות חיים, 
            חולצת מידע (שם, טלפון, אימייל, עיר), ומעלה את המועמד למערכת + התאמה חכמה אוטומטית למשרות!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
