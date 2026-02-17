"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Save, X, Plus, Tag as TagIcon } from "lucide-react"
import Link from "next/link"

interface PositionEditProps {
  params: Promise<{
    id: string
  }>
}

export default function EditPositionPage({ params }: PositionEditProps) {
  const router = useRouter()
  const [positionId, setPositionId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [employers, setEmployers] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [allTags, setAllTags] = useState<any[]>([])
  const [selectedTags, setSelectedTags] = useState<any[]>([])
  const [newTagName, setNewTagName] = useState("")
  const [showTagInput, setShowTagInput] = useState(false)
  
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
    keywords: "",
    contactEmail: "",
    contactName: "",
    workHours: "",
    benefits: "",
    transportation: "",
  })

  useEffect(() => {
    params.then(p => {
      setPositionId(p.id)
    })
  }, [params])

  useEffect(() => {
    if (positionId) {
      fetchPosition()
      fetchEmployers()
      fetchDepartments()
      fetchTags()
    }
  }, [positionId])

  const fetchPosition = async () => {
    try {
      const response = await fetch(`/api/positions/${positionId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch position")
      }
      const data = await response.json()
      setFormData({
        title: data.title || "",
        description: data.description || "",
        requirements: data.requirements || "",
        location: data.location || "",
        salaryRange: data.salaryRange || "",
        employmentType: data.employmentType || "Full-time",
        departmentId: data.departmentId || "",
        employerId: data.employerId || "",
        recruiterId: data.recruiterId || "",
        imageUrl: data.imageUrl || "",
        active: data.active || false,
        ruTitle: data.ruTitle || "",
        ruDescription: data.ruDescription || "",
        openings: String(data.openings || 1),
        priority: String(data.priority || 0),
        keywords: data.keywords || "",
        contactEmail: data.contactEmail || "",
        contactName: data.contactName || "",
        workHours: data.workHours || "",
        benefits: data.benefits || "",
        transportation: data.transportation || "",
      })
      setSelectedTags(data.tags || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployers = async () => {
    try {
      const response = await fetch("/api/employers")
      if (response.ok) {
        const data = await response.json()
        const employersList = Array.isArray(data) ? data : (data.employers || [])
        setEmployers(employersList)
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
        const departmentsList = Array.isArray(data) ? data : (data.departments || [])
        setDepartments(departmentsList)
      }
    } catch (err) {
      console.error("Failed to fetch departments:", err)
    }
  }

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/tags")
      if (response.ok) {
        const data = await response.json()
        setAllTags(data)
      }
    } catch (err) {
      console.error("Failed to fetch tags:", err)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value,
    })
  }

  const handleAddTag = (tag: any) => {
    if (!selectedTags.find(t => t.id === tag.id)) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleRemoveTag = (tagId: string) => {
    setSelectedTags(selectedTags.filter(t => t.id !== tagId))
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim(), color: "#3B82F6" }),
      })

      if (response.ok) {
        const newTag = await response.json()
        setAllTags([...allTags, newTag])
        setSelectedTags([...selectedTags, newTag])
        setNewTagName("")
        setShowTagInput(false)
      } else {
        const error = await response.json()
        if (error.error === "Tag already exists") {
          // Find and add the existing tag
          const existingTag = allTags.find(t => t.name.toLowerCase() === newTagName.trim().toLowerCase())
          if (existingTag) {
            handleAddTag(existingTag)
          }
        }
        setNewTagName("")
        setShowTagInput(false)
      }
    } catch (err) {
      console.error("Failed to create tag:", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const response = await fetch(`/api/positions/${positionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          tagIds: selectedTags.map(t => t.id),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update position")
      }

      router.push(`/dashboard/positions/${positionId}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  // Filter available tags (not already selected)
  const availableTags = allTags.filter(tag => !selectedTags.find(t => t.id === tag.id))

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">עריכת משרה</h1>
          <p className="text-muted-foreground">{formData.title}</p>
        </div>
        <Link href={`/dashboard/positions/${positionId}`}>
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
                  <option value="תקן קבוע">תקן קבוע</option>
                  <option value="החלפת חל״ד">החלפת חל"ד</option>
                  <option value="תקן זמני">תקן זמני</option>
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

        {/* Tags Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TagIcon className="h-5 w-5" />
              תגיות
            </CardTitle>
            <CardDescription>הוסף תגיות לזיהוי מהיר של המשרה</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected Tags */}
            <div>
              <Label className="mb-2 block">תגיות נבחרות:</Label>
              <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border rounded-md bg-muted/50">
                {selectedTags.length === 0 ? (
                  <span className="text-muted-foreground text-sm">אין תגיות נבחרות</span>
                ) : (
                  selectedTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="default"
                      className="cursor-pointer hover:bg-destructive"
                      style={{ backgroundColor: tag.color || "#3B82F6" }}
                      onClick={() => handleRemoveTag(tag.id)}
                    >
                      {tag.name}
                      <X className="h-3 w-3 mr-1" />
                    </Badge>
                  ))
                )}
              </div>
            </div>

            {/* Available Tags */}
            <div>
              <Label className="mb-2 block">תגיות זמינות (לחץ להוספה):</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-md max-h-[200px] overflow-y-auto">
                {availableTags.length === 0 ? (
                  <span className="text-muted-foreground text-sm">כל התגיות נבחרו</span>
                ) : (
                  availableTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => handleAddTag(tag)}
                    >
                      <Plus className="h-3 w-3 ml-1" />
                      {tag.name}
                    </Badge>
                  ))
                )}
              </div>
            </div>

            {/* Create New Tag */}
            <div>
              {showTagInput ? (
                <div className="flex gap-2">
                  <Input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="שם תגית חדשה"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleCreateTag())}
                  />
                  <Button type="button" onClick={handleCreateTag} size="sm">
                    הוסף
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowTagInput(false)}>
                    ביטול
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={() => setShowTagInput(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  צור תגית חדשה
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>פרטי איש קשר</CardTitle>
            <CardDescription>מידע על איש הקשר לשליחת מועמדים</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">שם איש קשר</Label>
                <Input
                  id="contactName"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  placeholder="שם המגייס/ת"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">מייל לשליחת מועמדים</Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="recruiter@company.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
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
                rows={10}
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

        {/* Keywords */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>מילות מפתח</CardTitle>
            <CardDescription>מילות מפתח לחיפוש והתאמת מועמדים (מופרדות בפסיקים)</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              id="keywords"
              name="keywords"
              value={formData.keywords}
              onChange={handleChange}
              placeholder="טלר, בנקאות, שירות לקוחות, מכירות..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Work Conditions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>תנאי עבודה</CardTitle>
            <CardDescription>שעות עבודה, הטבות והגעה</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workHours">שעות עבודה</Label>
              <Input
                id="workHours"
                name="workHours"
                value={formData.workHours}
                onChange={handleChange}
                placeholder="8:00-17:00, א'-ה'"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="benefits">הטבות</Label>
              <Textarea
                id="benefits"
                name="benefits"
                value={formData.benefits}
                onChange={handleChange}
                placeholder="ארוחות, חדר כושר, קרן השתלמות..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transportation">הגעה/הסעות</Label>
              <Input
                id="transportation"
                name="transportation"
                value={formData.transportation}
                onChange={handleChange}
                placeholder="הסעות מת״א / הגעה עצמאית"
              />
            </div>
          </CardContent>
        </Card>

        {/* Russian Content */}
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
          <Link href={`/dashboard/positions/${positionId}`}>
            <Button type="button" variant="outline">
              ביטול
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              "שומר..."
            ) : (
              <>
                <Save className="ml-2 h-4 w-4" />
                שמור שינויים
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
