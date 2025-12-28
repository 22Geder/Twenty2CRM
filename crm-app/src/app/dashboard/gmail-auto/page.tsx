"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Mail, RefreshCw, CheckCircle, AlertCircle, 
  User, Clock, Settings as SettingsIcon, Play, Pause 
} from "lucide-react"

export default function GmailAutoImportPage() {
  const [isPolling, setIsPolling] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [stats, setStats] = useState({
    totalChecked: 0,
    candidatesCreated: 0,
    lastResults: [] as any[]
  })
  const [settings, setSettings] = useState({
    emailAddress: '22geder@gmail.com',
    pollInterval: 5, // דקות
    autoStart: false
  })

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isPolling) {
      // בדיקה מיידית
      checkEmails()
      
      // הגדרת interval
      interval = setInterval(() => {
        checkEmails()
      }, settings.pollInterval * 60 * 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPolling, settings.pollInterval])

  const checkEmails = async () => {
    try {
      const response = await fetch('/api/gmail-poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailAddress: settings.emailAddress
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setStats(prev => ({
          totalChecked: prev.totalChecked + data.emailsChecked,
          candidatesCreated: prev.candidatesCreated + data.candidatesCreated,
          lastResults: data.results || []
        }))
        setLastCheck(new Date())

        // עדכן רשימת מועמדים
        window.dispatchEvent(new Event('candidates-updated'))
      }
    } catch (error) {
      console.error('Error checking emails:', error)
    }
  }

  const togglePolling = () => {
    setIsPolling(!isPolling)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📧 קליטת מיילים אוטומטית
          </h1>
          <p className="text-gray-600">
            המערכת בודקת את המייל {settings.emailAddress} ויוצרת מועמדים אוטומטית
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={togglePolling}
            variant={isPolling ? "destructive" : "default"}
            className="gap-2"
          >
            {isPolling ? (
              <>
                <Pause className="w-4 h-4" />
                עצור סריקה
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                התחל סריקה
              </>
            )}
          </Button>
          <Button
            onClick={checkEmails}
            variant="outline"
            disabled={isPolling}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            בדוק עכשיו
          </Button>
        </div>
      </div>

      {/* סטטוס */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={isPolling ? "border-green-300 bg-green-50" : "border-gray-200"}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">סטטוס</p>
                <p className="text-2xl font-bold">
                  {isPolling ? (
                    <span className="text-green-600">פעיל</span>
                  ) : (
                    <span className="text-gray-400">כבוי</span>
                  )}
                </p>
              </div>
              {isPolling && (
                <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">מיילים נבדקו</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalChecked}</p>
              </div>
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">מועמדים נוצרו</p>
                <p className="text-2xl font-bold text-green-600">{stats.candidatesCreated}</p>
              </div>
              <User className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">בדיקה אחרונה</p>
                <p className="text-sm font-bold text-gray-700">
                  {lastCheck ? lastCheck.toLocaleTimeString('he-IL') : 'אף פעם'}
                </p>
              </div>
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* הגדרות */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            הגדרות סריקה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">כתובת מייל לבדיקה</Label>
              <Input
                id="email"
                value={settings.emailAddress}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  emailAddress: e.target.value
                }))}
                disabled={isPolling}
              />
            </div>
            <div>
              <Label htmlFor="interval">תדירות בדיקה (דקות)</Label>
              <Input
                id="interval"
                type="number"
                min="1"
                max="60"
                value={settings.pollInterval}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  pollInterval: parseInt(e.target.value) || 5
                }))}
                disabled={isPolling}
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">מילות מפתח לזיהוי:</h3>
            <div className="flex flex-wrap gap-2">
              {['קורות חיים', 'קוח', 'קו"ח', 'CV', 'resume', 'מועמדות', 'משרה'].map(keyword => (
                <Badge key={keyword} variant="secondary">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* תוצאות אחרונות */}
      {stats.lastResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>תוצאות אחרונות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.lastResults.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">{result.candidateName}</p>
                      <p className="text-sm text-gray-600">{result.candidateEmail}</p>
                    </div>
                  </div>
                  {result.success && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/dashboard/candidates/${result.candidateId}`, '_blank')}
                    >
                      צפה במועמד
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* הוראות התקנה */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-900">⚠️ נדרש הגדרה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="font-semibold">כדי שהמערכת תעבוד באמת, צריך:</p>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>להתחבר ל-Gmail API (Google Cloud Console)</li>
            <li>ליצור OAuth 2.0 credentials</li>
            <li>להגדיר את המשתנים ב-.env:
              <code className="block mt-1 bg-white p-2 rounded border">
                GMAIL_CLIENT_ID=xxx<br/>
                GMAIL_CLIENT_SECRET=xxx<br/>
                GMAIL_REFRESH_TOKEN=xxx
              </code>
            </li>
            <li>להפעיל את Gmail API במסוף</li>
          </ol>
          <p className="text-orange-700 font-medium mt-4">
            💡 לעת עתה זה עובד במצב הדגמה. אחרי ההגדרה זה יעבוד באמת!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}