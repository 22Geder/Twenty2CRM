'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Copy, Check } from 'lucide-react'

export default function GmailSetupPage() {
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [refreshToken, setRefreshToken] = useState('')
  const [copied, setCopied] = useState(false)
  const [redirectUri, setRedirectUri] = useState('http://localhost:3000/api/gmail-callback')

  // הגדרת redirectUri רק פעם אחת בטעינה
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const uri = `${window.location.origin}/api/gmail-callback`
      setRedirectUri(uri)
    }
  }, []) // רק בטעינה ראשונית - [] ריק!

  const handleGetAuthCode = () => {
    if (!clientId) {
      alert('נא להזין Client ID')
      return
    }

    const scope = 'https://www.googleapis.com/auth/gmail.readonly'
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline&` +
      `prompt=consent`

    window.open(authUrl, '_blank')
  }

  const handleGetRefreshToken = async () => {
    if (!clientId || !clientSecret || !authCode) {
      alert('נא למלא את כל השדות')
      return
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code: authCode,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      })

      const data = await response.json()

      if (data.refresh_token) {
        setRefreshToken(data.refresh_token)
        alert('✅ Refresh Token נוצר בהצלחה!')
      } else {
        alert('❌ שגיאה: ' + (data.error_description || 'לא ניתן ליצור Refresh Token'))
      }
    } catch (error) {
      alert('❌ שגיאה בחיבור לשרת Google')
      console.error(error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="text-3xl">🔧 הגדרת Gmail API</CardTitle>
            <CardDescription className="text-lg">
              עקוב אחרי השלבים כדי לחבר את המייל למערכת
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Step 1 */}
        <Card>
          <CardHeader>
            <CardTitle>שלב 1: קישורים חשובים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <p className="font-semibold">🔗 צור פרויקט:</p>
              <a 
                href="https://console.cloud.google.com/projectcreate" 
                target="_blank" 
                className="text-blue-600 hover:underline"
              >
                https://console.cloud.google.com/projectcreate
              </a>
            </div>

            <div className="bg-green-50 p-4 rounded-lg space-y-2">
              <p className="font-semibold">📧 הפעל Gmail API:</p>
              <a 
                href="https://console.cloud.google.com/apis/library/gmail.googleapis.com" 
                target="_blank" 
                className="text-blue-600 hover:underline"
              >
                https://console.cloud.google.com/apis/library/gmail.googleapis.com
              </a>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg space-y-2">
              <p className="font-semibold">🔑 צור Credentials:</p>
              <a 
                href="https://console.cloud.google.com/apis/credentials" 
                target="_blank" 
                className="text-blue-600 hover:underline"
              >
                https://console.cloud.google.com/apis/credentials
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Step 2 */}
        <Card>
          <CardHeader>
            <CardTitle>שלב 2: הזן את ה-Client ID ו-Client Secret</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Client ID</label>
              <Input
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="הדבק את ה-Client ID מ-Google Cloud Console"
                className="font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Client Secret</label>
              <Input
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="הדבק את ה-Client Secret מ-Google Cloud Console"
                type="password"
                className="font-mono"
              />
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm font-semibold mb-2">⚠️ חשוב! הוסף Redirect URI:</p>
              <code className="bg-white p-2 rounded block text-sm">
                {redirectUri}
              </code>
              <p className="text-xs text-gray-600 mt-2">
                הוסף את ה-URI הזה ב-"Authorized redirect URIs" ב-Google Cloud Console
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Step 3 */}
        <Card>
          <CardHeader>
            <CardTitle>שלב 3: קבל Authorization Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleGetAuthCode}
              className="w-full"
              disabled={!clientId}
            >
              🔐 פתח חלון אישור Google
            </Button>

            <div className="bg-blue-50 p-4 rounded-lg text-sm">
              <p className="font-semibold mb-2">מה יקרה:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>ייפתח חלון חדש עם Google</li>
                <li>תתבקש להתחבר עם 22geder@gmail.com</li>
                <li>תאשר גישה למערכת</li>
                <li>תועבר לדף עם קוד - העתק אותו!</li>
              </ol>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Authorization Code</label>
              <Input
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                placeholder="הדבק את הקוד שקיבלת מ-Google"
                className="font-mono"
              />
            </div>
          </CardContent>
        </Card>

        {/* Step 4 */}
        <Card>
          <CardHeader>
            <CardTitle>שלב 4: צור Refresh Token</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleGetRefreshToken}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={!clientId || !clientSecret || !authCode}
            >
              ✨ צור Refresh Token
            </Button>

            {refreshToken && (
              <div className="bg-green-50 p-4 rounded-lg space-y-2">
                <p className="font-semibold text-green-800">✅ הצלחה! Refresh Token:</p>
                <div className="flex gap-2">
                  <Input
                    value={refreshToken}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(refreshToken)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 5 */}
        <Card className="border-2 border-green-200">
          <CardHeader>
            <CardTitle>שלב 5: הוסף ל-.env</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
              <pre>
{`# Gmail API Configuration
GMAIL_CLIENT_ID="${clientId || 'your_client_id_here'}"
GMAIL_CLIENT_SECRET="${clientSecret || 'your_client_secret_here'}"
GMAIL_REFRESH_TOKEN="${refreshToken || 'your_refresh_token_here'}"
GMAIL_EMAIL="22geder@gmail.com"`}
              </pre>
            </div>

            {clientId && clientSecret && refreshToken && (
              <Button
                onClick={() => {
                  const envContent = `\n# Gmail API Configuration\nGMAIL_CLIENT_ID="${clientId}"\nGMAIL_CLIENT_SECRET="${clientSecret}"\nGMAIL_REFRESH_TOKEN="${refreshToken}"\nGMAIL_EMAIL="22geder@gmail.com"`
                  copyToClipboard(envContent)
                  alert('✅ הועתק! הדבק את זה בקובץ .env')
                }}
                className="w-full"
              >
                📋 העתק הכל ל-.env
              </Button>
            )}

            <div className="bg-blue-50 p-4 rounded-lg text-sm">
              <p className="font-semibold mb-2">אחרי שהוספת ל-.env:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>שמור את הקובץ .env</li>
                <li>אתחל את השרת (Ctrl+C ואז npm run dev)</li>
                <li>המערכת תתחיל לסרוק מיילים אוטומטית!</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
