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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#06B6D4] mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען לקוחות...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen" style={{ background: 'var(--app-bg)' }}>
      {/* Clean modern header */}
      <div className="t22-card-soft p-6 md:p-7 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-primary-50)' }}>
            <Building2 className="h-7 w-7" style={{ color: 'var(--brand-primary)' }} />
          </div>
          <div>
            <h1 className="t22-h1">לקוחות ומעסיקים</h1>
            <p className="t22-sub mt-1">
              ניהול <span className="font-semibold" style={{ color: 'var(--brand-primary)' }}>{employers.length}</span> לקוחות • כל לקוח עם המשרות שלו
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="t22-btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold"
        >
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">הוסף לקוח חדש</span>
        </button>
      </div>

      {/* Modern Clean Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8">
        {/* Total clients */}
        <div className="t22-card-soft p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-primary-50)' }}>
            <Building2 className="h-6 w-6" style={{ color: 'var(--brand-primary)' }} />
          </div>
          <div>
            <p className="t22-num text-3xl font-bold text-slate-900">{employers.length}</p>
            <p className="text-sm text-slate-500 font-medium">סה״כ לקוחות</p>
          </div>
        </div>

        {/* Active positions */}
        <div className="t22-card-soft p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-teal-50)' }}>
            <Briefcase className="h-6 w-6" style={{ color: 'var(--brand-teal)' }} />
          </div>
          <div>
            <p className="t22-num text-3xl font-bold text-slate-900">
              {employers.reduce((sum, emp) => sum + (emp._count?.positions || 0), 0)}
            </p>
            <p className="text-sm text-slate-500 font-medium">משרות פעילות</p>
          </div>
        </div>

        {/* Avg positions */}
        <div className="t22-card-soft p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-lavender-50)' }}>
            <Tag className="h-6 w-6" style={{ color: 'var(--brand-lavender)' }} />
          </div>
          <div>
            <p className="t22-num text-3xl font-bold text-slate-900">
              {employers.length > 0 
                ? Math.round(employers.reduce((sum, emp) => sum + (emp._count?.positions || 0), 0) / employers.length)
                : 0}
            </p>
            <p className="text-sm text-slate-500 font-medium">ממוצע משרות ללקוח</p>
          </div>
        </div>

        {/* New clients */}
        <div className="t22-card-soft p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.10)' }}>
            <Plus className="h-6 w-6" style={{ color: '#059669' }} />
          </div>
          <div>
            <p className="t22-num text-3xl font-bold text-slate-900">
              {employers.filter(emp => {
                const created = new Date(emp.createdAt)
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return created > weekAgo
              }).length}
            </p>
            <p className="text-sm text-slate-500 font-medium">לקוחות חדשים</p>
          </div>
        </div>
      </div>

      {/* Sticky search */}
      <div className="t22-card-soft mb-8 p-3 relative overflow-hidden">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'var(--text-faint)' }} />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חפש לפי שם לקוח או אימייל..."
            className="pr-12 h-12 text-base border border-slate-200 rounded-xl bg-slate-50/50"
          />
        </div>
      </div>

      {/* Clean Employers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEmployers.map((employer) => (
          <Link key={employer.id} href={`/dashboard/employers/${employer.id}`}>
            <Card className="t22-card-soft group p-6 cursor-pointer relative">
              <div className="relative flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-primary-50)' }}>
                    <Building2 className="h-6 w-6" style={{ color: 'var(--brand-primary)' }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 transition-colors" style={{ }}>{employer.name}</h3>
                    <p className="text-xs text-slate-400">
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
                <Mail className="h-4 w-4" style={{ color: 'var(--brand-primary)' }} />
                <span className="text-slate-600">{employer.email}</span>
              </div>
              {employer.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4" style={{ color: 'var(--brand-teal)' }} />
                  <span className="text-slate-600 t22-num">{employer.phone}</span>
                </div>
              )}
              {employer.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4" style={{ color: 'var(--brand-lavender)' }} />
                  <a 
                    href={employer.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline"
                    style={{ color: 'var(--brand-primary)' }}
                  >
                    {employer.website}
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 relative">
              <div className="flex items-center gap-2">
                <span className="t22-pill t22-pill--primary">
                  {employer._count?.positions || 0} משרות
                </span>
              </div>
              <span className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--brand-primary)' }}>
                לפרטים
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
