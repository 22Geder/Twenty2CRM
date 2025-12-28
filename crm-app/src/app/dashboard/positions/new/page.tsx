"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save, X } from "lucide-react"
import Link from "next/link"

export default function NewPositionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [employers, setEmployers] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    location: "",
    salaryRange: "",
    employmentType: "Full-time",
    departmentId: "",
    employerId: "",
    recruiterId: "",
    imageUrl: "",
    active: false,
    ruTitle: "",
    ruDescription: "",
    openings: "1",
    priority: "0",
  })

  useEffect(() => {
    fetchEmployers()
    fetchDepartments()
  }, [])

  const fetchEmployers = async () => {
    try {
      const response = await fetch("/api/employers")
      if (response.ok) {
        const data = await response.json()
        setEmployers(data.employers || [])
      }
    } catch (err) {
      console.error("Failed to fetch employers:", err)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/departments")
      if (response.ok) {
        const data = await response.json()
        setDepartments(data.departments || [])
      }
    } catch (err) {
      console.error("Failed to fetch departments:", err)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/positions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create position")
      }

      const position = await response.json()
      router.push(`/dashboard/positions/${position.id}`)
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
          <h1 className="text-3xl font-bold tracking-tight">משרה חדשה</h1>
          <p className="text-muted-foreground">הוסף משרה פתוחה חדשה</p>
        </div>
        <Link href="/dashboard/positions">
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
            <CardTitle>פרטים בסיסיים</CardTitle>
            <CardDescription>מידע כללי על המשרה</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">כותרת המשרה *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="מהנדס תוכנה בכיר"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employerId">מעסיק *</Label>
                <select
                  id="employerId"
                  name="employerId"
                  value={formData.employerId}
                  onChange={handleChange}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">בחר מעסיק</option>
                  {employers.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="departmentId">מחלקה</Label>
                <select
                  id="departmentId"
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">ללא מחלקה</option>
                  {departments.map((dep) => (
                    <option key={dep.id} value={dep.id}>
                      {dep.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">מיקום</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="תל אביב"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employmentType">סוג תעסוקה</Label>
                <select
                  id="employmentType"
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="Full-time">משרה מלאה</option>
                  <option value="Part-time">משרה חלקית</option>
                  <option value="Contract">קבלן</option>
                  <option value="Freelance">עצמאי</option>
                  <option value="Internship">התמחות</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="openings">מספר פתיחות</Label>
                <Input
                  id="openings"
                  name="openings"
                  type="number"
                  min="1"
                  value={formData.openings}
                  onChange={handleChange}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salaryRange">טווח שכר</Label>
                <Input
                  id="salaryRange"
                  name="salaryRange"
                  value={formData.salaryRange}
                  onChange={handleChange}
                  placeholder="₪15,000-25,000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">עדיפות (0-10)</Label>
                <Input
                  id="priority"
                  name="priority"
                  type="number"
                  min="0"
                  max="10"
                  value={formData.priority}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">כתובת תמונה</Label>
              <Input
                id="imageUrl"
                name="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <input
                type="checkbox"
                id="active"
                name="active"
                checked={formData.active}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="active" className="cursor-pointer">
                משרה פעילה (מוצגת למועמדים)
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>תיאור המשרה</CardTitle>
            <CardDescription>פרטים מלאים על המשרה והדרישות</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">תיאור (עברית)</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="תאר את המשרה, התפקיד והאחריות..."
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">דרישות</Label>
              <Textarea
                id="requirements"
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                placeholder="רשום את הדרישות למשרה..."
                rows={6}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>תוכן רוסי (אופציונלי)</CardTitle>
            <CardDescription>תרגום לרוסית למועמדים דוברי רוסית</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ruTitle">כותרת (רוסית)</Label>
              <Input
                id="ruTitle"
                name="ruTitle"
                value={formData.ruTitle}
                onChange={handleChange}
                placeholder="Старший инженер-программист"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ruDescription">תיאור (רוסית)</Label>
              <Textarea
                id="ruDescription"
                name="ruDescription"
                value={formData.ruDescription}
                onChange={handleChange}
                placeholder="Описание должности на русском языке..."
                rows={6}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Link href="/dashboard/positions">
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
                שמור משרה
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
