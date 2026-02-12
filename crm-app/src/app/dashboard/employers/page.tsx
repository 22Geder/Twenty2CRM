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
  X, Save, Tag, ChevronRight
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
      <div className="p-8 flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A8A8] mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען לקוחות...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto bg-gradient-to-br from-slate-50 via-white to-slate-100 min-h-screen">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-700 mb-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="empGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#FF8C00" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#empGrid)" />
          </svg>
        </div>
        
        {/* Floating Orbs */}
        <div className="absolute top-4 left-4 w-32 h-32 bg-gradient-to-br from-[#FF8C00]/30 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute bottom-4 right-4 w-24 h-24 bg-gradient-to-br from-[#00A8A8]/30 to-transparent rounded-full blur-2xl"></div>
        
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#FF8C00] via-[#E65100] to-[#00A8A8] bg-clip-text text-transparent">
              🏢 לקוחות ומעסיקים
            </h1>
            <p className="text-slate-300 mt-2 text-lg">
              ניהול <span className="font-semibold text-[#FF8C00]">{employers.length}</span> לקוחות • כל לקוח עם המשרות שלו
            </p>
          </div>
          <Button 
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-[#FF8C00] to-[#E65100] hover:from-[#E67A00] hover:to-[#D44E00] shadow-lg shadow-[#FF8C00]/30 text-white border-0"
            size="lg"
          >
            <Plus className="ml-2 h-5 w-5" />
            הוסף לקוח חדש
          </Button>
        </div>
      </div>

      {/* Premium Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card className="p-6 border-0 bg-gradient-to-br from-[#00A8A8] to-[#00D4D4] text-white shadow-xl shadow-[#00A8A8]/30 overflow-hidden relative">
          <div className="absolute top-2 right-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">סה״כ לקוחות</p>
              <p className="text-4xl font-bold mt-1">{employers.length}</p>
            </div>
            <Building2 className="h-10 w-10 opacity-30" />
          </div>
        </Card>

        <Card className="p-6 border-0 bg-gradient-to-br from-[#7CB342] to-[#8BC34A] text-white shadow-xl shadow-[#7CB342]/30 overflow-hidden relative">
          <div className="absolute top-2 right-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">משרות פעילות</p>
              <p className="text-4xl font-bold mt-1">
                {employers.reduce((sum, emp) => sum + (emp._count?.positions || 0), 0)}
              </p>
            </div>
            <Briefcase className="h-10 w-10 opacity-30" />
          </div>
        </Card>

        <Card className="p-6 border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl shadow-purple-500/30 overflow-hidden relative">
          <div className="absolute top-2 right-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">ממוצע משרות ללקוח</p>
              <p className="text-4xl font-bold mt-1">
                {employers.length > 0 
                  ? Math.round(employers.reduce((sum, emp) => sum + (emp._count?.positions || 0), 0) / employers.length)
                  : 0}
              </p>
            </div>
            <Tag className="h-10 w-10 opacity-30" />
          </div>
        </Card>

        <Card className="p-6 border-0 bg-gradient-to-br from-[#FF8C00] to-[#E65100] text-white shadow-xl shadow-[#FF8C00]/30 overflow-hidden relative">
          <div className="absolute top-2 right-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">לקוחות חדשים</p>
              <p className="text-4xl font-bold mt-1">
                {employers.filter(emp => {
                  const created = new Date(emp.createdAt)
                  const weekAgo = new Date()
                  weekAgo.setDate(weekAgo.getDate() - 7)
                  return created > weekAgo
                }).length}
              </p>
            </div>
            <Plus className="h-10 w-10 opacity-30" />
          </div>
        </Card>
      </div>

      {/* Premium Search */}
      <Card className="mb-8 p-4 shadow-xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF8C00] to-[#E65100]"></div>
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[#FF8C00] h-5 w-5" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 חפש לפי שם לקוח או אימייל..."
            className="pr-12 h-14 text-lg border-2 border-slate-200 focus:border-[#FF8C00] rounded-xl bg-slate-50/50"
          />
        </div>
      </Card>

      {/* Premium Employers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployers.map((employer) => (
          <Link key={employer.id} href={`/dashboard/employers/${employer.id}`}>
            <Card className="group p-6 hover:shadow-2xl hover:shadow-[#FF8C00]/20 transition-all duration-500 hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm overflow-hidden relative cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF8C00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF8C00] to-[#E65100] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="relative flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#FF8C00] to-[#E65100] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF8C00]/30">
                    <Building2 className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-800 group-hover:text-[#FF8C00] transition-colors">{employer.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      נוצר {new Date(employer.createdAt).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                </div>
              </div>

            {employer.description && (
              <p className="text-sm text-slate-500 mb-4 line-clamp-2 relative">
                {employer.description}
              </p>
            )}

            <div className="space-y-2 mb-4 relative">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-[#00A8A8]" />
                <span className="text-slate-700">{employer.email}</span>
              </div>
              {employer.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-[#7CB342]" />
                  <span className="text-slate-700">{employer.phone}</span>
                </div>
              )}
              {employer.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-purple-500" />
                  <a 
                    href={employer.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#00A8A8] hover:underline"
                  >
                    {employer.website}
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t-2 border-slate-100 relative">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-[#FF8C00]" />
                <Badge className="bg-gradient-to-r from-[#FF8C00] to-[#E65100] text-white text-base px-3 py-1 border-0">
                  {employer._count?.positions || 0} משרות
                </Badge>
              </div>
              <span className="text-[#00A8A8] text-sm font-medium flex items-center gap-1">
                לחץ לצפייה בפרטים
                <ChevronRight className="h-4 w-4" />
              </span>
            </div>
          </Card>
          </Link>
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
