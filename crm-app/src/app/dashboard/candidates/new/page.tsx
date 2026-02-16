"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Save, X, Loader2, Sparkles, CheckCircle, Zap } from "lucide-react"
import Link from "next/link"

export default function NewCandidatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extracted, setExtracted] = useState(false)
  const [error, setError] = useState("")
  const [extractedTags, setExtractedTags] = useState<string[]>([])
  const extractionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
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
    resumeText: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  // פונקציה לחילוץ נתונים מקורות חיים
  const extractFromResume = useCallback(async (text: string) => {
    if (text.length < 20) return;
    
    setExtracting(true);
    setExtracted(false);
    
    try {
      const response = await fetch('/api/extract-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (response.ok) {
        const { data } = await response.json();
        
        // מילוי אוטומטי של כל השדות
        setFormData(prev => ({
          ...prev,
          name: data.name || prev.name,
          email: data.email || prev.email,
          phone: data.phone || prev.phone,
          alternatePhone: data.alternatePhone || prev.alternatePhone,
          city: data.city || prev.city,
          address: data.address || prev.address,
          country: data.country || prev.country,
          currentTitle: data.currentTitle || prev.currentTitle,
          currentCompany: data.currentCompany || prev.currentCompany,
          skills: data.skills || prev.skills,
          yearsOfExperience: data.yearsOfExperience || prev.yearsOfExperience,
          expectedSalary: data.expectedSalary || prev.expectedSalary,
        }));
        
        // שמירת תגיות
        if (data.tags && data.tags.length > 0) {
          setExtractedTags(data.tags);
        }
        
        setExtracted(true);
      }
    } catch (error) {
      console.error('Extraction error:', error);
    } finally {
      setExtracting(false);
    }
  }, []);

  // טיפול בהדבקת/שינוי קורות חיים - עם debounce מתוקן + פסטה מיידית
  const handleResumeTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setFormData(prev => ({ ...prev, resumeText: newText }));
    
    // בטל timeout קודם
    if (extractionTimeoutRef.current) {
      clearTimeout(extractionTimeoutRef.current);
    }
    
    // חילוץ אוטומטי אם הטקסט ארוך מספיק
    if (newText.length >= 50) {
      // Debounce מתוקן - המתנה קצרה של 300ms
      extractionTimeoutRef.current = setTimeout(() => {
        extractFromResume(newText);
      }, 300);
    } else {
      setExtracted(false);
      setExtractedTags([]);
    }
  };

  // טיפול בפיסטה מיידית - חילוץ ישר ללא המתנה
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText && pastedText.length >= 50) {
      // ביטול timeout קודם
      if (extractionTimeoutRef.current) {
        clearTimeout(extractionTimeoutRef.current);
      }
      // חילוץ מיידי בפיסטה!
      setTimeout(() => {
        const fullText = formData.resumeText + pastedText;
        extractFromResume(fullText);
      }, 50);
    }
  }, [formData.resumeText, extractFromResume]);

  // ניקוי timeout בעת יציאה מהקומפוננטה
  useEffect(() => {
    return () => {
      if (extractionTimeoutRef.current) {
        clearTimeout(extractionTimeoutRef.current);
      }
    };
  }, []);

  // האם יש קורות חיים (מבטל חובת שדות)
  const hasResume = formData.resumeText.trim().length >= 50;

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
        body: JSON.stringify({
          ...formData,
          resume: formData.resumeText,  // שליחת הטקסט לשמירה כ-resume
          extractedTags: extractedTags   // 🆕 שליחת תגיות שחולצו
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create candidate")
      }

      const candidate = await response.json()

      // 🆕 עדכון רשימת מועמדים - שליחת אירוע לכל המערכת
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('candidates-updated'))
        // 🆕 שמירה ב-localStorage לסנכרון בין טאבים
        localStorage.setItem('lastCandidateAdded', JSON.stringify({
          id: candidate.id,
          name: candidate.name,
          timestamp: Date.now()
        }))
      }

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

      // 🆕 הודעת הצלחה 
      alert(`✅ המועמד "${candidate.name}" נוסף בהצלחה!`)
      
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
                <Label htmlFor="name">
                  שם מלא {!hasResume && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required={!hasResume}
                  placeholder="שם פרטי ושם משפחה"
                  className={formData.name && extracted ? "border-green-400 bg-green-50" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  אימייל
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  className={formData.email && extracted ? "border-green-400 bg-green-50" : ""}
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
                  className={formData.phone && extracted ? "border-green-400 bg-green-50" : ""}
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
                  className={formData.city && extracted ? "border-green-400 bg-green-50" : ""}
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
                  className={formData.currentTitle && extracted ? "border-green-400 bg-green-50" : ""}
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
                  className={formData.yearsOfExperience && extracted ? "border-green-400 bg-green-50" : ""}
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
              <Label htmlFor="resumeText" className="text-lg font-bold flex items-center gap-2">
                📄 טקסט קורות חיים (מומלץ!)
                {extracting && (
                  <span className="flex items-center gap-1 text-blue-600 text-sm font-normal">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    מחלץ נתונים...
                  </span>
                )}
                {extracted && !extracting && (
                  <span className="flex items-center gap-1 text-green-600 text-sm font-normal">
                    <CheckCircle className="h-4 w-4" />
                    נתונים חולצו!
                  </span>
                )}
              </Label>
              <Textarea
                id="resumeText"
                name="resumeText"
                value={formData.resumeText}
                onChange={handleResumeTextChange}
                onPaste={handlePaste}
                placeholder={`העתק והדבק את תוכן קורות החיים כאן...

לדוגמה:
יונתן כהן
054-1234567
yonatan@email.com
תל אביב
מפתח Full Stack עם 5 שנות ניסיון
מומחה ב: React, Node.js, Python, AWS
ניסיון בפיתוח אפליקציות web ומובייל
עבד בחברות: גוגל ישראל, מיקרוסופט`}
                rows={10}
                className={`resize-none ${hasResume ? 'border-green-400 bg-green-50' : ''}`}
              />
              
              {/* תגיות שחולצו */}
              {extractedTags.length > 0 && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-700 font-bold mb-2 flex items-center gap-1">
                    <Sparkles className="h-4 w-4" />
                    תגיות שזוהו אוטומטית:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {extractedTags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {hasResume ? (
                <div className="p-3 bg-green-100 border border-green-300 rounded-lg">
                  <p className="text-sm text-green-700 font-bold">
                    ✅ מעולה! הנתונים חולצו אוטומטית - אין צורך למלא שדות חובה!
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    השדות שמולאו מסומנים בירוק. לחץ "שמור מועמד" להמשך.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-blue-600 font-medium">
                  🤖 הדבק קורות חיים והמערכת תזהה הכל אוטומטית ותבטל שדות חובה!
                </p>
              )}
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
                className={formData.skills && extracted ? "border-green-400 bg-green-50" : ""}
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
          <Button type="submit" disabled={loading} className="min-w-[200px]">
            {loading ? (
              formData.resumeText.trim() ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">🤖</span>
                  מנתח קורות חיים...
                </span>
              ) : (
                "שומר..."
              )
            ) : (
              <>
                <Save className="ml-2 h-4 w-4" />
                {formData.resumeText.trim() ? "🚀 נתח ושמור" : "שמור מועמד"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
