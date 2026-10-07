"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Lock, User, LogIn, UserPlus, AlertTriangle } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
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
    const name = formData.get("name") as string

    try {
      if (isRegister) {
        // Register new user
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        })

        if (!response.ok) {
          const data = await response.json()
          setIsLoading(false)
          setError(data.error || "Registration failed")
          return
        }

        // Auto login after registration
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          setIsLoading(false)
          setError(result.error)
          return
        }
        
        router.push("/dashboard")
        router.refresh()
      } else {
        // Login existing user
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          setIsLoading(false)
          
          // 🔒 בדיקת נעילת חשבון
          if (result.error === "ACCOUNT_LOCKED") {
            setIsLocked(true)
            setError("החשבון ננעל! נשלח מייל לאדמין עם קישור שחרור.")
            return
          }

          // ⛔ בדיקת חשבון לא פעיל
          if (result.error === "ACCOUNT_INACTIVE") {
            setError("החשבון שלך לא פעיל. פנה לאדמין להפעלה.")
            return
          }
          
          // בדיקת ניסיונות נותרים
          const failedMatch = result.error.match(/FAILED_ATTEMPT_(\d+)/)
          if (failedMatch) {
            const remaining = parseInt(failedMatch[1])
            setRemainingAttempts(remaining)
            setError(`סיסמה שגויה! נותרו ${remaining} ניסיונות לפני נעילה.`)
            return
          }
          
          setError("אימייל או סיסמה שגויים")
          return
        }
        
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error: any) {
      setIsLoading(false)
      setError(error.message || "משהו השתבש")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* לוגו */}
        <div className="text-center mb-8">
          <div className="relative mx-auto mb-4 flex justify-center">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-white border border-slate-200 flex items-center justify-center p-3">
              <Image 
                src="/logo-22jobs-clean.png" 
                alt="22JOBS Logo" 
                width={176}
                height={176}
                className="object-contain w-full h-full"
                priority
              />
            </div>
          </div>
          <p className="text-sm text-slate-500">מערכת CRM מתקדמת</p>
        </div>
        
        {/* כרטיס התחברות */}
        <Card className="w-full shadow-sm border border-slate-200 bg-white rounded-3xl overflow-hidden">
          <CardHeader className="space-y-2 pb-6 border-b border-slate-100">
            <CardTitle className="text-2xl font-semibold tracking-tight text-center text-slate-900 flex items-center justify-center gap-2">
              {isRegister ? (
                <>
                  <UserPlus className="text-slate-500" size={24} />
                  הרשמה למערכת
                </>
              ) : (
                <>
                  <LogIn className="text-slate-500" size={24} />
                  התחברות למערכת
                </>
              )}
            </CardTitle>
            <CardDescription className="text-center text-slate-500">
              {isRegister 
                ? "צור חשבון חדש כדי להתחיל לגייס" 
                : "הזן את פרטי ההתחברות שלך"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {isRegister && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700 font-medium flex items-center gap-2">
                    <User size={16} className="text-slate-400" />
                    שם מלא
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="ישראל ישראלי"
                    required={isRegister}
                    disabled={isLoading}
                    className="h-12 rounded-xl border border-slate-300 focus:border-[#0891B2] focus:ring-4 focus:ring-[#0891B2]/15 transition-colors"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium flex items-center gap-2">
                  <Mail size={16} className="text-slate-400" />
                  אימייל
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email@example.com"
                  required
                  disabled={isLoading}
                  className="h-12 rounded-xl border border-slate-300 focus:border-[#0891B2] focus:ring-4 focus:ring-[#0891B2]/15 transition-colors"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium flex items-center gap-2">
                  <Lock size={16} className="text-slate-400" />
                  סיסמה
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="h-12 rounded-xl border border-slate-300 focus:border-[#0891B2] focus:ring-4 focus:ring-[#0891B2]/15 transition-colors"
                />
              </div>
              
              {error && (
                <div role="alert" className={`${isLocked || (remainingAttempts !== null && remainingAttempts <= 1) ? 'bg-red-50 border-red-500 text-red-700' : 'bg-amber-50 border-amber-500 text-amber-800'} border-e-4 px-4 py-3 rounded-xl animate-shake`}>
                  <div className="flex items-center gap-2">
                    {isLocked ? <Lock size={18} className="shrink-0" /> : <AlertTriangle size={18} className="shrink-0" />}
                    <span className="font-medium">{error}</span>
                  </div>
                  {isLocked && (
                    <p className="text-sm text-red-600 mt-2">נשלח מייל לאדמין הראשי (office@hr22group.com) עם קישור שחרור</p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 rounded-xl font-semibold text-base text-white transition-colors bg-[#0891B2] hover:bg-[#0E7490]"
                disabled={isLoading || isLocked}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>{isRegister ? "נרשם..." : "מתחבר..."}</span>
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {isRegister ? (
                      <>
                        <UserPlus size={20} />
                        הרשמה
                      </>
                    ) : (
                      <>
                        <LogIn size={20} />
                        התחברות
                      </>
                    )}
                  </span>
                )}
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister)
                    setError("")
                  }}
                  className="text-[#0E7490] hover:text-[#155E75] font-medium transition-colors hover:underline"
                  disabled={isLoading}
                >
                  {isRegister 
                    ? "יש לך כבר חשבון? התחבר כאן" 
                    : "אין לך חשבון? הירשם כאן"}
                </button>
              </div>

              {/* שכחת סיסמה */}
              {!isRegister && (
                <div className="text-center pt-1">
                  <p className="text-sm text-slate-400">
                    שכחת סיסמה? פנה לאדמין: <a href="mailto:office@hr22group.com" className="text-[#0E7490] hover:underline font-medium">office@hr22group.com</a>
                  </p>
                  {isLocked && (
                    <p className="text-sm text-red-500 mt-1 font-medium">
                      החשבון ננעל - נשלח מייל אוטומטי לאדמין לשחרור
                    </p>
                  )}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
        
        {/* פוטר */}
        <div className="text-center mt-6 text-slate-500 text-sm">
          <p>© 2026 Twenty22Jobs CRM - כל הזכויות שמורות</p>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
