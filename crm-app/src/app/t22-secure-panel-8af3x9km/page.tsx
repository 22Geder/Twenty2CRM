"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Lock, LogIn, Shield, AlertTriangle } from "lucide-react"
import Image from "next/image"

// 🔒 דף כניסת אדמין סודי
// הנתיב: /t22-secure-panel-8af3x9km
// אל תשתף את הקישור הזה עם אף אחד!

export default function SecureAdminLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isLocked, setIsLocked] = useState(false)
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setIsLoading(false)
        
        if (result.error === "ACCOUNT_LOCKED") {
          setIsLocked(true)
          setError("🔒 החשבון ננעל! נשלח מייל לאדמין הראשי עם קישור שחרור.")
          return
        }
        
        // בדוק אם יש מידע על ניסיונות נותרים
        const failedMatch = result.error.match(/FAILED_ATTEMPT_(\d+)/)
        if (failedMatch) {
          const remaining = parseInt(failedMatch[1])
          setRemainingAttempts(remaining)
          setError(`⚠️ סיסמה שגויה! נותרו ${remaining} ניסיונות לפני נעילת חשבון.`)
          return
        }
        
        setError("אימייל או סיסמה שגויים")
        return
      }
      
      router.push("/dashboard")
      router.refresh()
    } catch (error: any) {
      setIsLoading(false)
      setError(error.message || "משהו השתבש")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 p-4 relative overflow-hidden" dir="rtl">
      {/* רקע מאובטח */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="secure-grid" width="80" height="80" patternUnits="userSpaceOnUse">
                <circle cx="40" cy="40" r="1.5" fill="#ef4444" opacity="0.5"/>
                <line x1="40" y1="0" x2="40" y2="80" stroke="#ef4444" strokeWidth="0.3" opacity="0.2"/>
                <line x1="0" y1="40" x2="80" y2="40" stroke="#ef4444" strokeWidth="0.3" opacity="0.2"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#secure-grid)"/>
          </svg>
        </div>
        <div className="absolute top-20 left-20 w-64 h-64 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* לוגו */}
        <div className="text-center mb-8">
          <div className="relative mx-auto mb-4 flex justify-center">
            <Image 
              src="/logo.jpeg" 
              alt="Twenty2Jobs" 
              width={200}
              height={80}
              className="drop-shadow-2xl opacity-80"
              priority
            />
          </div>
          
          <div className="inline-flex items-center gap-2 bg-red-500/20 px-4 py-2 rounded-full border border-red-500/30">
            <Shield size={16} className="text-red-400" />
            <span className="text-sm font-bold text-red-300">כניסה מאובטחת - אדמין</span>
          </div>
        </div>
        
        {/* כרטיס התחברות */}
        <Card className="w-full shadow-2xl border-0 bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardHeader className="space-y-2 pb-4 bg-gradient-to-r from-red-50 to-amber-50 border-b border-red-100">
            <CardTitle className="text-2xl font-bold text-center text-slate-800 flex items-center justify-center gap-2">
              <Shield className="text-red-500" size={28} />
              פאנל ניהול מאובטח
            </CardTitle>
            <CardDescription className="text-center text-slate-500">
              גישה מורשית בלבד - כל הפעולות מתועדות
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            {isLocked ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <Lock size={40} className="text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-red-600 mb-2">החשבון ננעל</h3>
                <p className="text-slate-600 mb-4">
                  נשלח מייל עם קישור שחרור ל-<br/>
                  <strong>office@hr22group.com</strong>
                </p>
                <p className="text-sm text-slate-400">
                  רק מנהל המערכת הראשי יכול לשחרר את הנעילה
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-medium flex items-center gap-2">
                    <Mail size={16} className="text-red-500" />
                    אימייל אדמין
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@example.com"
                    required
                    disabled={isLoading}
                    className="h-12 rounded-xl border-2 border-slate-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 font-medium flex items-center gap-2">
                    <Lock size={16} className="text-amber-600" />
                    סיסמה
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    className="h-12 rounded-xl border-2 border-slate-200 focus:border-amber-600 focus:ring-4 focus:ring-amber-600/20 transition-all"
                  />
                </div>
                
                {error && (
                  <div className={`${remainingAttempts !== null && remainingAttempts <= 1 ? 'bg-red-50 border-red-500' : 'bg-amber-50 border-amber-500'} border-r-4 px-4 py-3 rounded-xl shadow-sm`}>
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={18} className={remainingAttempts !== null && remainingAttempts <= 1 ? 'text-red-500' : 'text-amber-500'} />
                      <span className="font-medium text-slate-700">{error}</span>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-14 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg bg-gradient-to-r from-red-600 to-red-700 hover:shadow-red-500/30"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent"></div>
                      <span>מאמת...</span>
                    </div>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <LogIn size={22} />
                      כניסה מאובטחת
                    </span>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* הודעת אבטחה */}
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-500/60">
            🔒 כל ניסיון כניסה מתועד | IP ומיקום נשמרים
          </p>
        </div>
      </div>
    </div>
  )
}
