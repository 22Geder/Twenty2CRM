"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  Upload, Plus, Image, Save, X, Facebook, 
  MapPin, DollarSign, Clock, Users, CheckCircle
} from "lucide-react"

export default function FacebookJobImportPage() {
  const [jobs, setJobs] = useState([{
    id: 1,
    title: "",
    description: "",
    location: "",
    salary: "",
    employmentType: "",
    company: "",
    imageUrl: "",
    requirements: "",
    contactInfo: ""
  }])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const addJob = () => {
    setJobs([...jobs, {
      id: jobs.length + 1,
      title: "",
      description: "",
      location: "",
      salary: "",
      employmentType: "",
      company: "",
      imageUrl: "",
      requirements: "",
      contactInfo: ""
    }])
  }

  const removeJob = (id: number) => {
    setJobs(jobs.filter(job => job.id !== id))
  }

  const updateJob = (id: number, field: string, value: string) => {
    setJobs(jobs.map(job => 
      job.id === id ? { ...job, [field]: value } : job
    ))
  }

  const handleImageUpload = (id: number, file: File) => {
    // בפרויקט אמיתי - העלאה לשרת או קלאוד
    const imageUrl = URL.createObjectURL(file)
    updateJob(id, 'imageUrl', imageUrl)
  }

  const saveAllJobs = async () => {
    setLoading(true)
    
    try {
      for (const job of jobs) {
        if (job.title && job.description) {
          const response = await fetch('/api/positions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: job.title,
              description: job.description,
              location: job.location,
              salaryRange: job.salary,
              employmentType: job.employmentType,
              requirements: job.requirements,
              imageUrl: job.imageUrl,
              active: true,
              // נשתמש בחברה הראשונה כמעסיק זמני
              employerId: "temp" // צריך לעדכן לאחר יצירת מעסיק
            })
          })
        }
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('שגיאה בשמירת משרות:', error)
      alert('שגיאה בשמירת המשרות')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 min-h-screen">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Facebook className="h-10 w-10 text-blue-600" />
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            📋 העלאת משרות מפייסבוק
          </h1>
        </div>
        <p className="text-gray-600 text-xl">
          העתק את המשרות שפרסמת בפייסבוק והעלה אותן לCRM
        </p>
      </div>

      {success && (
        <Card className="mb-6 bg-green-50 border-green-200 p-4">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">המשרות נשמרו בהצלחה!</span>
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="mb-8 p-6 bg-blue-50 border-blue-200">
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          הוראות שימוש
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">1. בפייסבוק שלك:</p>
            <p>• העתק כותרת המשרה</p>
            <p>• העתק את תיאור המשרה</p>
            <p>• שמור תמונה (אם יש)</p>
          </div>
          <div>
            <p className="font-medium">2. כאן:</p>
            <p>• הדבק את הפרטים בטפסים</p>
            <p>• העלה תמונה</p>
            <p>• לחץ "שמור הכל"</p>
          </div>
        </div>
      </Card>

      {/* Jobs Forms */}
      <div className="space-y-6">
        {jobs.map((job, index) => (
          <Card key={job.id} className="p-6 hover:shadow-lg transition-shadow border-r-4 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                📄 משרה #{index + 1}
              </h3>
              {jobs.length > 1 && (
                <Button
                  onClick={() => removeJob(job.id)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* עמודה שמאל */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">🏷️ כותרת המשרה</Label>
                  <Input
                    value={job.title}
                    onChange={(e) => updateJob(job.id, 'title', e.target.value)}
                    placeholder="מפתח Full Stack, מנהל מכירות..."
                    className="mt-2 h-12 text-lg"
                  />
                </div>

                <div>
                  <Label className="text-base font-semibold">🏢 חברה</Label>
                  <Input
                    value={job.company}
                    onChange={(e) => updateJob(job.id, 'company', e.target.value)}
                    placeholder="שם החברה"
                    className="mt-2 h-12 text-lg"
                  />
                </div>

                <div>
                  <Label className="text-base font-semibold">📍 מיקום</Label>
                  <Input
                    value={job.location}
                    onChange={(e) => updateJob(job.id, 'location', e.target.value)}
                    placeholder="תל אביב, אשדוד, עבודה מהבית..."
                    className="mt-2 h-12 text-lg"
                  />
                </div>

                <div>
                  <Label className="text-base font-semibold">💰 שכר</Label>
                  <Input
                    value={job.salary}
                    onChange={(e) => updateJob(job.id, 'salary', e.target.value)}
                    placeholder="₪15,000-20,000, ₪25K+"
                    className="mt-2 h-12 text-lg"
                  />
                </div>

                <div>
                  <Label className="text-base font-semibold">⏰ סוג משרה</Label>
                  <Input
                    value={job.employmentType}
                    onChange={(e) => updateJob(job.id, 'employmentType', e.target.value)}
                    placeholder="משרה מלאה, חלקית, פרויקט..."
                    className="mt-2 h-12 text-lg"
                  />
                </div>
              </div>

              {/* עמודה ימין */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">📝 תיאור המשרה</Label>
                  <Textarea
                    value={job.description}
                    onChange={(e) => updateJob(job.id, 'description', e.target.value)}
                    placeholder="תיאור מלא של המשרה..."
                    rows={6}
                    className="mt-2 text-lg resize-none"
                  />
                </div>

                <div>
                  <Label className="text-base font-semibold">📋 דרישות</Label>
                  <Textarea
                    value={job.requirements}
                    onChange={(e) => updateJob(job.id, 'requirements', e.target.value)}
                    placeholder="דרישות המשרה: ניסיון, כישורים..."
                    rows={3}
                    className="mt-2 text-lg resize-none"
                  />
                </div>

                <div>
                  <Label className="text-base font-semibold">🖼️ תמונה</Label>
                  <div className="mt-2 space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(job.id, file)
                      }}
                      className="text-lg"
                    />
                    {job.imageUrl && (
                      <div className="border rounded-lg p-2">
                        <img 
                          src={job.imageUrl} 
                          alt="תמונת משרה" 
                          className="w-full h-32 object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center mt-8">
        <Button
          onClick={addJob}
          variant="outline"
          className="h-14 px-8 text-lg hover:bg-blue-50"
        >
          <Plus className="ml-2 h-5 w-5" />
          הוסף משרה נוספת
        </Button>
        
        <Button
          onClick={saveAllJobs}
          disabled={loading}
          className="h-14 px-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              שומר...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              שמור את כל המשרות ({jobs.length})
            </div>
          )}
        </Button>
      </div>
    </div>
  )
}