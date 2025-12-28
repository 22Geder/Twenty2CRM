"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Brain, Upload, Zap, Target, Users, Briefcase, 
  CheckCircle, ArrowRight, Star, TrendingUp, FileText,
  Sparkles, Bot, Clock
} from "lucide-react"

export default function SmartMatchingPage() {
  const [candidateId, setCandidateId] = useState("")
  const [resumeText, setResumeText] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSmartMatch = async () => {
    if (!candidateId && !resumeText) {
      alert("נא להזין מזהה מועמד או טקסט קורות חיים")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/smart-matching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, resumeText })
      })

      if (response.ok) {
        const data = await response.json()
        setResult(data)
      } else {
        alert("שגיאה בביצוע התאמה חכמה")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("שגיאה בחיבור לשרת")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-lg">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            🧠 התאמה חכמה
          </h1>
        </div>
        <p className="text-gray-600 text-xl">
          מערכת AI מתקדמת לזיהוי כישורים והתאמה אוטומטית למשרות
        </p>
      </div>

      {/* Features Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 text-center hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <Sparkles className="h-10 w-10 mx-auto mb-3" />
          <h3 className="font-bold text-lg">זיהוי כישורים</h3>
          <p className="text-sm mt-2 opacity-90">AI מזהה כישורים מקורות חיים</p>
        </Card>

        <Card className="p-6 text-center hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <Target className="h-10 w-10 mx-auto mb-3" />
          <h3 className="font-bold text-lg">התאמה מדויקת</h3>
          <p className="text-sm mt-2 opacity-90">מתאים למשרות פתוחות</p>
        </Card>

        <Card className="p-6 text-center hover:shadow-lg transition-shadow bg-gradient-to-br from-green-500 to-green-600 text-white">
          <Bot className="h-10 w-10 mx-auto mb-3" />
          <h3 className="font-bold text-lg">מועמדות אוטומטית</h3>
          <p className="text-sm mt-2 opacity-90">יוצר מועמדויות אוטומטית</p>
        </Card>

        <Card className="p-6 text-center hover:shadow-lg transition-shadow bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <Clock className="h-10 w-10 mx-auto mb-3" />
          <h3 className="font-bold text-lg">מהיר ויעיל</h3>
          <p className="text-sm mt-2 opacity-90">חוסך זמן וטעויות</p>
        </Card>
      </div>

      {!result ? (
        // Input Form
        <Card className="p-8 shadow-2xl border-2 border-purple-200">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">📋 העלה קורות חיים לניתוח</h2>
            <p className="text-gray-600">המערכת תזהה כישורים ותמצא משרות מתאימות אוטומטית</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                🆔 מזהה מועמד (אופציונלי)
              </label>
              <Input
                value={candidateId}
                onChange={(e) => setCandidateId(e.target.value)}
                placeholder="לדוגמה: abc123-def456-ghi789"
                className="h-12 text-lg"
              />
              <p className="text-sm text-gray-500 mt-2">אם יש מועמד קיים במערכת</p>
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                📄 טקסט קורות חיים
              </label>
              <Textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder={`לדוגמה:

יונתן כהן
מפתח Full Stack עם 5 שנות ניסיון
מומחה ב: React, Node.js, Python, AWS
ניסיון בפיתוח אפליקציות web ומובייל
עבד בחברות היי-טק מובילות
בעל תואר במדעי המחשב`}
                rows={12}
                className="text-lg resize-none"
              />
              <p className="text-sm text-gray-500 mt-2">העתק והדבק את תוכן קורות החיים כאן</p>
            </div>

            <Button
              onClick={handleSmartMatch}
              disabled={loading || (!candidateId && !resumeText)}
              className="w-full h-16 text-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  מנתח קורות חיים...
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Zap className="h-6 w-6" />
                  בצע התאמה חכמה
                  <ArrowRight className="h-6 w-6" />
                </div>
              )}
            </Button>
          </div>
        </Card>
      ) : (
        // Results
        <div className="space-y-8">
          {/* Success Header */}
          <Card className="p-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-4xl font-bold mb-2">🎉 התאמה הושלמה בהצלחה!</h2>
            <p className="text-xl opacity-90">
              זוהו {result.detectedSkills?.length || 0} כישורים • נמצאו {result.matchingPositions} משרות מתאימות
            </p>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <div className="flex items-center gap-4">
                <Sparkles className="h-12 w-12 opacity-80" />
                <div>
                  <p className="text-3xl font-bold">{result.detectedSkills?.length || 0}</p>
                  <p className="opacity-90">כישורים זוהו</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="flex items-center gap-4">
                <Briefcase className="h-12 w-12 opacity-80" />
                <div>
                  <p className="text-3xl font-bold">{result.matchingPositions}</p>
                  <p className="opacity-90">משרות נמצאו</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
              <div className="flex items-center gap-4">
                <CheckCircle className="h-12 w-12 opacity-80" />
                <div>
                  <p className="text-3xl font-bold">{result.autoApplications}</p>
                  <p className="opacity-90">מועמדויות נוצרו</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Detected Skills */}
          {result.detectedSkills && result.detectedSkills.length > 0 && (
            <Card className="p-6">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Star className="h-6 w-6 text-yellow-500" />
                כישורים שזוהו
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.detectedSkills.map((skill: string, index: number) => (
                  <Badge key={index} className="text-lg py-2 px-4 bg-purple-100 text-purple-800">
                    {skill}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Top Matches */}
          {result.topMatches && result.topMatches.length > 0 && (
            <Card className="p-6">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-green-500" />
                המשרות המתאימות ביותר
              </h3>
              <div className="space-y-4">
                {result.topMatches.map((match: any, index: number) => (
                  <Card key={index} className="p-4 hover:shadow-lg transition-shadow border-r-4 border-blue-500">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-lg">{match.position}</h4>
                      <Badge className="text-lg py-1 px-3">
                        {match.score}% התאמה
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-3">{match.employer}</p>
                    <div className="flex flex-wrap gap-1">
                      {match.matchedSkills?.map((skill: string, skillIndex: number) => (
                        <Badge key={skillIndex} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          )}

          {/* Created Applications */}
          {result.applications && result.applications.length > 0 && (
            <Card className="p-6">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-500" />
                מועמדויות שנוצרו אוטומטית
              </h3>
              <div className="space-y-3">
                {result.applications.map((app: any, index: number) => (
                  <Card key={index} className="p-4 bg-green-50 border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold">{app.position.title}</h4>
                        <p className="text-green-600">{app.position.employer?.name}</p>
                      </div>
                      <Badge className="bg-green-500 text-white">
                        {app.matchScore}% התאמה
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => setResult(null)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-14 px-8 text-lg"
            >
              <Upload className="ml-2 h-5 w-5" />
              התאמה חדשה
            </Button>
            <Button
              onClick={() => window.location.href = '/dashboard/candidates'}
              variant="outline"
              className="h-14 px-8 text-lg"
            >
              <Users className="ml-2 h-5 w-5" />
              לדף המועמדים
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}