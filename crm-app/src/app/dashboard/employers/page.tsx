"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus, Search, Building2, Phone, Mail, Globe, Briefcase,
  X, Save, Tag
} from "lucide-react"

interface Employer {
  id: string
  name: string
  email: string
  phone?: string
  website?: string
  logo?: string
  description?: string
  createdAt: string
  _count?: {
    positions: number
  }
}

export default function EmployersModernPage() {
  const [employers, setEmployers] = useState<Employer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    description: ""
  })

  useEffect(() => {
    fetchEmployers()
  }, [])

  const fetchEmployers = async () => {
    try {
      const response = await fetch("/api/employers")
      if (response.ok) {
        const data = await response.json()
        setEmployers(data)
      }
    } catch (error) {
      console.error("Error fetching employers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/employers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowModal(false)
        setFormData({ name: "", email: "", phone: "", website: "", description: "" })
        fetchEmployers()
      }
    } catch (error) {
      console.error("Error creating employer:", error)
    }
  }

  const filteredEmployers = employers.filter(emp =>
    emp.name.toLowerCase().includes(search.toLowerCase()) ||
    emp.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען לקוחות...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            🏢 לקוחות ומעסיקים
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            ניהול {employers.length} לקוחות • כל לקוח עם המשרות שלו
          </p>
        </div>
        <Button 
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
          size="lg"
        >
          <Plus className="ml-2 h-5 w-5" />
          הוסף לקוח חדש
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-6 border-r-4 border-blue-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">סה״כ לקוחות</p>
              <p className="text-4xl font-bold text-blue-600 mt-1">{employers.length}</p>
            </div>
            <Building2 className="h-10 w-10 text-blue-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6 border-r-4 border-green-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">משרות פעילות</p>
              <p className="text-4xl font-bold text-green-600 mt-1">
                {employers.reduce((sum, emp) => sum + (emp._count?.positions || 0), 0)}
              </p>
            </div>
            <Briefcase className="h-10 w-10 text-green-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6 border-r-4 border-purple-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">ממוצע משרות ללקוח</p>
              <p className="text-4xl font-bold text-purple-600 mt-1">
                {employers.length > 0 
                  ? Math.round(employers.reduce((sum, emp) => sum + (emp._count?.positions || 0), 0) / employers.length)
                  : 0}
              </p>
            </div>
            <Tag className="h-10 w-10 text-purple-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6 border-r-4 border-orange-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">לקוחות חדשים</p>
              <p className="text-4xl font-bold text-orange-600 mt-1">
                {employers.filter(emp => {
                  const created = new Date(emp.createdAt)
                  const weekAgo = new Date()
                  weekAgo.setDate(weekAgo.getDate() - 7)
                  return created > weekAgo
                }).length}
              </p>
            </div>
            <Plus className="h-10 w-10 text-orange-600 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6 p-4 shadow-md">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 חפש לפי שם לקוח או אימייל..."
            className="pr-12 h-14 text-lg"
          />
        </div>
      </Card>

      {/* Employers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployers.map((employer) => (
          <Card key={employer.id} className="p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 hover:border-blue-400">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-800">{employer.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    נוצר {new Date(employer.createdAt).toLocaleDateString('he-IL')}
                  </p>
                </div>
              </div>
            </div>

            {employer.description && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {employer.description}
              </p>
            )}

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-blue-600" />
                <span className="text-gray-700">{employer.email}</span>
              </div>
              {employer.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-green-600" />
                  <span className="text-gray-700">{employer.phone}</span>
                </div>
              )}
              {employer.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-purple-600" />
                  <a 
                    href={employer.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {employer.website}
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-base px-3 py-1">
                  {employer._count?.positions || 0} משרות
                </Badge>
              </div>
              <Link href={`/dashboard/positions?employer=${employer.id}`}>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-400"
                >
                  צפה במשרות
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {filteredEmployers.length === 0 && (
        <Card className="p-16">
          <div className="text-center">
            <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">אין לקוחות עדיין</h3>
            <p className="text-muted-foreground text-lg">
              התחל בהוספת לקוח ראשון כדי לנהל משרות
            </p>
            <Button 
              onClick={() => setShowModal(true)}
              className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600"
              size="lg"
            >
              <Plus className="ml-2 h-5 w-5" />
              הוסף לקוח ראשון
            </Button>
          </div>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="p-8 max-w-2xl w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                הוסף לקוח חדש
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowModal(false)}
                className="hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-lg font-semibold">שם החברה *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="לדוגמה: גוגל ישראל"
                  required
                  className="mt-2 h-12 text-lg"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-lg font-semibold">אימייל *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@example.com"
                  required
                  className="mt-2 h-12 text-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone" className="text-lg font-semibold">טלפון</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="050-1234567"
                    className="mt-2 h-12 text-lg"
                  />
                </div>

                <div>
                  <Label htmlFor="website" className="text-lg font-semibold">אתר אינטרנט</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://example.com"
                    className="mt-2 h-12 text-lg"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-lg font-semibold">תיאור</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="תיאור קצר על החברה..."
                  rows={4}
                  className="mt-2 text-lg"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-14 text-lg"
                >
                  <Save className="ml-2 h-5 w-5" />
                  שמור לקוח
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-14 text-lg hover:bg-gray-100"
                >
                  ביטול
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
