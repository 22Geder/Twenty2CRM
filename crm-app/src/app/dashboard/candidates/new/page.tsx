"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowRight, Save, X } from "lucide-react"
import Link from "next/link"

export default function NewCandidatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    alternatePhone: "",
    resumeUrl: "",
    linkedinUrl: "",
    portfolioUrl: "",
    currentCompany: "",
    currentTitle: "",
    yearsOfExperience: "",
    expectedSalary: "",
    noticePeriod: "",
    address: "",
    city: "",
    country: "",
    skills: "",
    notes: "",
    rating: "",
    source: "",
    resumeText: "", // הוסף שדה טקסט קורות חיים
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/candidates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create candidate")
      }

      const candidate = await response.json()

      // אם יש טקסט קורות חיים, בצע התאמה חכמה אוטומטית
      if (formData.resumeText.trim()) {
        try {
          await fetch("/api/smart-matching", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              candidateId: candidate.id,
              resumeText: formData.resumeText
            })
          })
        } catch (error) {
          console.log("Smart matching failed, but candidate was created successfully")
        }
      }

      router.push(`/dashboard/candidates/${candidate.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            👤 מועמד חדש
          </h1>
          <p className="text-muted-foreground text-lg mt-2">
            הוסף מועמד חדש עם התאמה אוטומטית למשרות 🤖
          </p>
        </div>
        <Link href="/dashboard/candidates">
          <Button variant="outline">
            <X className="ml-2 h-4 w-4" />
            ביטול
          </Button>
        </Link>
      </div>

      {error && (
        <Card className="mb-6 border-red-500">
          <CardContent className="pt-6 text-red-600">
            {error}
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>פרטים אישיים</CardTitle>
            <CardDescription>מידע בסיסי על המועמד</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">שם מלא *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="שם פרטי ושם משפחה"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">אימייל *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">טלפון</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="050-1234567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alternatePhone">טלפון נוסף</Label>
                <Input
                  id="alternatePhone"
                  name="alternatePhone"
                  value={formData.alternatePhone}
                  onChange={handleChange}
                  placeholder="03-1234567"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">עיר</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="תל אביב"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">מדינה</Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="ישראל"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">מקור</Label>
                <Input
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  placeholder="LinkedIn, אתר דרושים, המלצה..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">כתובת מלאה</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="רחוב, מספר בית, קומה, דירה"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>פרטי תעסוקה</CardTitle>
            <CardDescription>ניסיון תעסוקתי ומקצועי</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentCompany">חברה נוכחית</Label>
                <Input
                  id="currentCompany"
                  name="currentCompany"
                  value={formData.currentCompany}
                  onChange={handleChange}
                  placeholder="שם החברה"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentTitle">תפקיד נוכחי</Label>
                <Input
                  id="currentTitle"
                  name="currentTitle"
                  value={formData.currentTitle}
                  onChange={handleChange}
                  placeholder="כותרת התפקיד"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="yearsOfExperience">שנות ניסיון</Label>
                <Input
                  id="yearsOfExperience"
                  name="yearsOfExperience"
                  type="number"
                  value={formData.yearsOfExperience}
                  onChange={handleChange}
                  placeholder="5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedSalary">שכר צפוי</Label>
                <Input
                  id="expectedSalary"
                  name="expectedSalary"
                  value={formData.expectedSalary}
                  onChange={handleChange}
                  placeholder="₪15,000-20,000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="noticePeriod">תקופת הודעה מוקדמת</Label>
                <Input
                  id="noticePeriod"
                  name="noticePeriod"
                  value={formData.noticePeriod}
                  onChange={handleChange}
                  placeholder="חודש, שבועיים..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resumeText">📄 טקסט קורות חיים (להתאמה אוטומטית)</Label>
              <Textarea
                id="resumeText"
                name="resumeText"
                value={formData.resumeText}
                onChange={handleChange}
                placeholder={`העתק והדבק את תוכן קורות החיים כאן...

לדוגמה:
יונתן כהן
מפתח Full Stack עם 5 שנות ניסיון
מומחה ב: React, Node.js, Python, AWS
ניסיון בפיתוח אפליקציות web ומובייל
עבד בחברות היי-טק מובילות`}
                rows={8}
                className="resize-none"
              />
              <p className="text-sm text-blue-600 font-medium">
                🤖 המערכת תזהה כישורים אוטומטית ותמצא משרות מתאימות
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">מיומנויות</Label>
              <Textarea
                id="skills"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="רשום מיומנויות מופרדות בפסיקים: React, Node.js, Python..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>קישורים ומסמכים</CardTitle>
            <CardDescription>קורות חיים ופרופילים מקצועיים - הקבצים נשמרים לצמיתות ב-CRM</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resumeUrl">קישור לקורות חיים</Label>
              <Input
                id="resumeUrl"
                name="resumeUrl"
                type="url"
                value={formData.resumeUrl}
                onChange={handleChange}
                placeholder="https://example.com/resume.pdf או Google Drive קישור"
              />
              <p className="text-xs text-muted-foreground">💾 הקישור נשמר לצמיתות במערכת ולא יימחק</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="linkedinUrl">פרופיל LinkedIn</Label>
                <Input
                  id="linkedinUrl"
                  name="linkedinUrl"
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portfolioUrl">תיק עבודות</Label>
                <Input
                  id="portfolioUrl"
                  name="portfolioUrl"
                  type="url"
                  value={formData.portfolioUrl}
                  onChange={handleChange}
                  placeholder="https://portfolio.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>הערות ודירוג</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rating">דירוג (1-5)</Label>
              <Input
                id="rating"
                name="rating"
                type="number"
                min="1"
                max="5"
                value={formData.rating}
                onChange={handleChange}
                placeholder="3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">הערות</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="הערות פנימיות על המועמד..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Link href="/dashboard/candidates">
            <Button type="button" variant="outline">
              ביטול
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              "שומר..."
            ) : (
              <>
                <Save className="ml-2 h-4 w-4" />
                שמור מועמד
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
