"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Clock, User, Phone, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"

interface EmailData {
  id: string
  from: string
  subject: string
  body: string
  attachments: string[]
  date: string
  processed?: boolean
  candidateId?: string
}

export default function EmailAutoPage() {
  const [emails, setEmails] = useState<EmailData[]>([])
  const [processedEmails, setProcessedEmails] = useState<any[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [settings, setSettings] = useState({
    emailAddress: '22geder@gmail.com',
    autoProcess: true,
    checkInterval: 5 // דקות
  })

  // טען מיילים בטעינה ראשונה
  useEffect(() => {
    checkForNewEmails()
  }, [])

  // בדוק מיילים חדשים
  const checkForNewEmails = async () => {
    setIsChecking(true)
    try {
      const response = await fetch('/api/email-auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check-emails' })
      })
      
      const data = await response.json()
      if (data.success) {
        setEmails(data.emails)
      }
    } catch (error) {
      console.error('Error checking emails:', error)
    } finally {
      setIsChecking(false)
    }
  }

  // עבד מייל ספציפי
  const processEmail = async (emailData: EmailData) => {
    setIsProcessing(emailData.id)
    try {
      const response = await fetch('/api/email-auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'process-email', 
          emailData 
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setProcessedEmails(prev => [...prev, {
          ...emailData,
          candidateId: result.candidateId,
          candidateName: result.candidateName,
          candidateEmail: result.candidateEmail,
          autoMatched: result.autoMatched,
          processedAt: new Date().toISOString()
        }])
        
        // הסר מרשימת מיילים ממתינים
        setEmails(prev => prev.filter(e => e.id !== emailData.id))
      } else {
        alert(`שגיאה בעיבוד המייל: ${result.reason}`)
      }
    } catch (error) {
      console.error('Error processing email:', error)
      alert('שגיאה בעיבוד המייל')
    } finally {
      setIsProcessing(null)
    }
  }

  // עבד כל המיילים אוטומטית
  const processAllEmails = async () => {
    for (const email of emails) {
      await processEmail(email)
      // חכה קצת בין עיבודים
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('he-IL')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">מיילים אוטומטיים</h1>
          <p className="text-gray-600">
            קליטה אוטומטית של קורות חיים מ-{settings.emailAddress}
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={checkForNewEmails} 
            disabled={isChecking}
            variant="outline"
          >
            {isChecking ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            בדוק מיילים
          </Button>
          {emails.length > 0 && (
            <Button onClick={processAllEmails}>
              עבד הכל ({emails.length})
            </Button>
          )}
        </div>
      </div>

      {/* הגדרות מהירות */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">הגדרות מיילים</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="email">כתובת מייל מקור</Label>
            <Input
              id="email"
              value={settings.emailAddress}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                emailAddress: e.target.value
              }))}
            />
          </div>
          <div>
            <Label htmlFor="interval">בדיקה כל (דקות)</Label>
            <Input
              id="interval"
              type="number"
              value={settings.checkInterval}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                checkInterval: parseInt(e.target.value) || 5
              }))}
            />
          </div>
          <div className="flex items-end">
            <Button variant="outline" size="sm">
              שמור הגדרות
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* מיילים ממתינים */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">מיילים ממתינים לעיבוד</h2>
            <Badge variant="secondary">
              {emails.length} מיילים
            </Badge>
          </div>
          
          <div className="space-y-3">
            {emails.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">אין מיילים חדשים</p>
                </CardContent>
              </Card>
            ) : (
              emails.map((email) => (
                <Card key={email.id} className="border-orange-200">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-orange-600" />
                        <span className="font-medium text-sm">{email.from}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDateTime(email.date)}
                      </Badge>
                    </div>
                    
                    <h3 className="font-semibold mb-2 text-gray-900">
                      {email.subject}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {email.body}
                    </p>
                    
                    {email.attachments.length > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary" className="text-xs">
                          {email.attachments.length} קבצים מצורפים
                        </Badge>
                      </div>
                    )}
                    
                    <Button 
                      size="sm" 
                      onClick={() => processEmail(email)}
                      disabled={isProcessing === email.id}
                      className="w-full"
                    >
                      {isProcessing === email.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <User className="w-4 h-4 mr-2" />
                      )}
                      צור מועמד
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* מיילים שעובדו */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">מיילים שעובדו</h2>
            <Badge variant="default">
              {processedEmails.length} מועמדים נוצרו
            </Badge>
          </div>
          
          <div className="space-y-3">
            {processedEmails.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">לא עובדו מיילים עדיין</p>
                </CardContent>
              </Card>
            ) : (
              processedEmails.map((email, index) => (
                <Card key={index} className="border-green-200 bg-green-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-sm">{email.candidateName}</span>
                      </div>
                      <Badge variant="default" className="text-xs bg-green-600">
                        נוצר
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-600">{email.candidateEmail}</span>
                      </div>
                      {email.autoMatched && (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-3 h-3 text-blue-500" />
                          <span className="text-blue-600 text-xs">הותאם אוטומטית למשרות</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs"
                        onClick={() => window.open(`/dashboard/candidates/${email.candidateId}`, '_blank')}
                      >
                        צפה במועמד
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}