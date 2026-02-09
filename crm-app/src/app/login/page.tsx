"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Lock, User, LogIn, UserPlus, Globe, Sparkles } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState("")

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
          throw new Error(data.error || "Registration failed")
        }

        // Auto login after registration
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          setError(result.error)
        } else {
          router.push("/dashboard")
          router.refresh()
        }
      } else {
        // Login existing user
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          setError("אימייל או סיסמה שגויים")
        } else {
          router.push("/dashboard")
          router.refresh()
        }
      }
    } catch (error: any) {
      setError(error.message || "משהו השתבש")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 relative overflow-hidden" dir="rtl">
      {/* רקע רשת דינמי */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Network Grid Animation */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="2" fill="#7CB342" opacity="0.5"/>
                <line x1="30" y1="0" x2="30" y2="60" stroke="#7CB342" strokeWidth="0.5" opacity="0.3"/>
                <line x1="0" y1="30" x2="60" y2="30" stroke="#7CB342" strokeWidth="0.5" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)"/>
          </svg>
        </div>
        
        {/* Floating Orbs */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-[#00A8A8]/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-[#FF8C00]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-[#7CB342]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* לוגו פרימיום */}
        <div className="text-center mb-10 animate-fade-in">
          {/* לוגו SVG */}
          <div className="relative mx-auto w-32 h-32 mb-6">
            {/* Network Globe */}
            <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-2xl">
              {/* Network Lines */}
              <g stroke="#7CB342" strokeWidth="1.5" fill="none" opacity="0.7">
                <circle cx="60" cy="60" r="50"/>
                <circle cx="60" cy="60" r="38"/>
                <circle cx="60" cy="60" r="26"/>
                <ellipse cx="60" cy="60" rx="50" ry="20"/>
                <ellipse cx="60" cy="60" rx="20" ry="50"/>
              </g>
              
              {/* Network Dots */}
              <g fill="#7CB342">
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                  <circle 
                    key={i}
                    cx={60 + 50 * Math.cos(angle * Math.PI / 180)} 
                    cy={60 + 50 * Math.sin(angle * Math.PI / 180)}
                    r="4"
                    className="animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </g>
              
              {/* Numbers 22 */}
              <text x="28" y="72" fill="url(#tealGrad)" fontSize="38" fontWeight="bold" fontFamily="Arial, sans-serif">2</text>
              <text x="58" y="72" fill="url(#orangeGrad)" fontSize="38" fontWeight="bold" fontFamily="Arial, sans-serif">2</text>
              
              {/* Gradients */}
              <defs>
                <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00D4D4"/>
                  <stop offset="100%" stopColor="#00A8A8"/>
                </linearGradient>
                <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFB347"/>
                  <stop offset="100%" stopColor="#FF8C00"/>
                </linearGradient>
              </defs>
            </svg>
            
            {/* Orange Arc */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-24 h-2 bg-gradient-to-r from-transparent via-[#FF8C00] to-transparent rounded-full"></div>
          </div>
          
          {/* שם המותג */}
          <h1 className="text-5xl font-black mb-2 tracking-tight">
            <span className="text-[#00D4D4]">Twenty</span>
            <span className="bg-gradient-to-r from-[#00D4D4] to-[#00A8A8] bg-clip-text text-transparent">2</span>
            <span className="bg-gradient-to-r from-[#FF8C00] to-[#E65100] bg-clip-text text-transparent">2</span>
            <span className="text-[#FF8C00]">Jobs</span>
          </h1>
          <p className="text-slate-400 text-lg font-medium">-המרכז לעובדים ולמעסיקים בישראל-</p>
          
          {/* תג CRM */}
          <div className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-[#00A8A8]/20 to-[#FF8C00]/20 px-4 py-2 rounded-full border border-[#00A8A8]/30">
            <Sparkles size={16} className="text-[#FF8C00]" />
            <span className="text-sm font-bold text-white">מערכת CRM מתקדמת</span>
          </div>
        </div>
        
        {/* כרטיס התחברות */}
        <Card className="w-full shadow-2xl border-0 bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardHeader className="space-y-2 pb-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
            <CardTitle className="text-2xl font-bold text-center text-slate-800 flex items-center justify-center gap-2">
              {isRegister ? (
                <>
                  <UserPlus className="text-[#7CB342]" size={28} />
                  הרשמה למערכת
                </>
              ) : (
                <>
                  <LogIn className="text-[#00A8A8]" size={28} />
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
                    <User size={16} className="text-[#7CB342]" />
                    שם מלא
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="ישראל ישראלי"
                    required={isRegister}
                    disabled={isLoading}
                    className="h-12 rounded-xl border-2 border-slate-200 focus:border-[#7CB342] focus:ring-4 focus:ring-[#7CB342]/20 transition-all"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium flex items-center gap-2">
                  <Mail size={16} className="text-[#00A8A8]" />
                  אימייל
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email@example.com"
                  required
                  disabled={isLoading}
                  className="h-12 rounded-xl border-2 border-slate-200 focus:border-[#00A8A8] focus:ring-4 focus:ring-[#00A8A8]/20 transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium flex items-center gap-2">
                  <Lock size={16} className="text-[#FF8C00]" />
                  סיסמה
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="h-12 rounded-xl border-2 border-slate-200 focus:border-[#FF8C00] focus:ring-4 focus:ring-[#FF8C00]/20 transition-all"
                />
              </div>
              
              {error && (
                <div className="bg-gradient-to-r from-red-50 to-red-100 border-r-4 border-red-500 text-red-700 px-4 py-3 rounded-xl shadow-sm animate-shake">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚠️</span>
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className={`w-full h-14 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg ${
                  isRegister 
                    ? 'bg-gradient-to-r from-[#7CB342] to-[#8BC34A] hover:shadow-green-500/30' 
                    : 'bg-gradient-to-r from-[#00A8A8] to-[#00D4D4] hover:shadow-teal-500/30'
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent"></div>
                    <span>{isRegister ? "נרשם..." : "מתחבר..."}</span>
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {isRegister ? (
                      <>
                        <UserPlus size={22} />
                        הרשמה
                      </>
                    ) : (
                      <>
                        <LogIn size={22} />
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
                  className="text-[#00A8A8] hover:text-[#008080] font-medium transition-all duration-200 hover:underline"
                  disabled={isLoading}
                >
                  {isRegister 
                    ? "יש לך כבר חשבון? התחבר כאן 👈" 
                    : "אין לך חשבון? הירשם כאן 👈"}
                </button>
              </div>
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
