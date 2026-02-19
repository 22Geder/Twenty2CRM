"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Building2, Mail, Phone, Globe, Briefcase, Users, ArrowRight,
  MapPin, Calendar, User, ChevronRight, CheckCircle, Clock, XCircle, Pencil, Save, Loader2, Plus
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
  positions: Position[]
}

interface Position {
  id: string
  title: string
  location?: string
  active: boolean
  createdAt: string
  applications: Application[]
}

interface Application {
  id: string
  status: string
  appliedAt: string
  matchScore?: number
  candidate: {
    id: string
    name: string
    email?: string
    phone?: string
    city?: string
    currentTitle?: string
  }
}

type PageProps = {
  params: Promise<{ id: string }>
}

export default function EmployerDetailPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const [employer, setEmployer] = useState<Employer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    description: ""
  })

  useEffect(() => {
    fetchEmployer()
  }, [resolvedParams.id])

  const fetchEmployer = async () => {
    try {
      const response = await fetch(`/api/employers/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setEmployer(data)
        // Initialize edit form with current data
        setEditForm({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          website: data.website || "",
          description: data.description || ""
        })
      } else {
        setError("לקוח לא נמצא")
      }
    } catch (err) {
      console.error("Error fetching employer:", err)
      setError("שגיאה בטעינת הלקוח")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEmployer = async () => {
    if (!employer) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/employers/${employer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      })
      
      if (response.ok) {
        const updatedEmployer = await response.json()
        setEmployer({ ...employer, ...updatedEmployer })
        setEditDialogOpen(false)
      } else {
        alert("שגיאה בשמירת הפרטים")
      }
    } catch (err) {
      console.error("Error saving employer:", err)
      alert("שגיאה בשמירת הפרטים")
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: "bg-blue-100 text-blue-700 border-blue-300",
      REVIEWING: "bg-yellow-100 text-yellow-700 border-yellow-300",
      PHONE_SCREEN: "bg-purple-100 text-purple-700 border-purple-300",
      INTERVIEW: "bg-orange-100 text-orange-700 border-orange-300",
      OFFER: "bg-teal-100 text-teal-700 border-teal-300",
      HIRED: "bg-green-100 text-green-700 border-green-300",
      REJECTED: "bg-red-100 text-red-700 border-red-300",
    }
    return colors[status] || "bg-gray-100 text-gray-700 border-gray-300"
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      NEW: "חדש",
      REVIEWING: "בבדיקה",
      PHONE_SCREEN: "שיחת טלפון",
      INTERVIEW: "ראיון",
      OFFER: "הצעה",
      HIRED: "התקבל",
      REJECTED: "נדחה",
    }
    return labels[status] || status
  }

  const getStatusIcon = (status: string) => {
    if (status === "HIRED") return <CheckCircle className="h-4 w-4" />
    if (status === "REJECTED") return <XCircle className="h-4 w-4" />
    return <Clock className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF8C00] mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען פרטי לקוח...</p>
        </div>
      </div>
    )
  }

  if (error || !employer) {
    return (
      <div className="p-8">
        <Card className="p-8 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">{error || "לקוח לא נמצא"}</h2>
          <Link href="/dashboard/employers">
            <Button className="mt-4">חזור ללקוחות</Button>
          </Link>
        </Card>
      </div>
    )
  }

  // Calculate stats
  const totalPositions = employer.positions.length
  const activePositions = employer.positions.filter(p => p.active).length
  const totalCandidates = employer.positions.reduce((sum, p) => sum + p.applications.length, 0)
  const hiredCandidates = employer.positions.reduce(
    (sum, p) => sum + p.applications.filter(a => a.status === "HIRED").length, 0
  )

  // Flatten all applications for the summary table
  const allApplications = employer.positions.flatMap(position => 
    position.applications.map(app => ({
      ...app,
      positionTitle: position.title,
      positionId: position.id
    }))
  ).sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())

  return (
    <div className="p-8 max-w-[1600px] mx-auto bg-gradient-to-br from-slate-50 via-white to-slate-100 min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-700 mb-8">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="empDetailGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#FF8C00" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#empDetailGrid)" />
          </svg>
        </div>
        
        <div className="absolute top-4 left-4 w-32 h-32 bg-gradient-to-br from-[#FF8C00]/30 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute bottom-4 right-4 w-24 h-24 bg-gradient-to-br from-[#00A8A8]/30 to-transparent rounded-full blur-2xl"></div>

        <div className="relative">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-slate-400 mb-4">
            <Link href="/dashboard/employers" className="hover:text-[#FF8C00] transition-colors">
              לקוחות
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">{employer.name}</span>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-[#FF8C00] to-[#E65100] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF8C00]/30">
                <Building2 className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">{employer.name}</h1>
                <div className="flex items-center gap-4 mt-2">
                  {employer.email && (
                    <span className="flex items-center gap-1 text-slate-300">
                      <Mail className="h-4 w-4 text-[#00A8A8]" />
                      {employer.email}
                    </span>
                  )}
                  {employer.phone && (
                    <span className="flex items-center gap-1 text-slate-300">
                      <Phone className="h-4 w-4 text-[#7CB342]" />
                      {employer.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#FF8C00] hover:bg-[#E65100] text-white">
                    <Pencil className="ml-2 h-4 w-4" />
                    עריכת פרטים
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <div dir="rtl">
                  <DialogHeader>
                    <DialogTitle className="text-right">עריכת פרטי לקוח</DialogTitle>
                    <DialogDescription className="text-right">
                      עדכן את פרטי הקשר של הלקוח
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">שם הלקוח</Label>
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="שם הלקוח"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">אימייל</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        placeholder="email@example.com"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">טלפון</Label>
                      <Input
                        id="phone"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        placeholder="050-0000000"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">אתר אינטרנט</Label>
                      <Input
                        id="website"
                        value={editForm.website}
                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                        placeholder="https://example.com"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">תיאור</Label>
                      <Textarea
                        id="description"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="תיאור הלקוח..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter className="flex justify-start gap-2">
                    <Button
                      onClick={handleSaveEmployer}
                      disabled={saving}
                      className="bg-[#FF8C00] hover:bg-[#E65100]"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          שומר...
                        </>
                      ) : (
                        <>
                          <Save className="ml-2 h-4 w-4" />
                          שמור שינויים
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                      ביטול
                    </Button>
                  </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>
              <Link href="/dashboard/employers">
                <Button variant="outline" className="border-slate-500 text-slate-300 hover:bg-slate-700">
                  <ArrowRight className="ml-2 h-4 w-4" />
                  חזור ללקוחות
                </Button>
              </Link>
            </div>
          </div>

          {employer.description && (
            <p className="text-slate-400 mt-4 max-w-2xl">{employer.description}</p>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card className="p-6 border-0 bg-gradient-to-br from-[#00A8A8] to-[#00D4D4] text-white shadow-xl overflow-hidden relative">
          <div className="absolute top-2 right-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">סה״כ משרות</p>
              <p className="text-4xl font-bold mt-1">{totalPositions}</p>
            </div>
            <Briefcase className="h-10 w-10 opacity-30" />
          </div>
        </Card>

        <Card className="p-6 border-0 bg-gradient-to-br from-[#7CB342] to-[#8BC34A] text-white shadow-xl overflow-hidden relative">
          <div className="absolute top-2 right-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">משרות פעילות</p>
              <p className="text-4xl font-bold mt-1">{activePositions}</p>
            </div>
            <CheckCircle className="h-10 w-10 opacity-30" />
          </div>
        </Card>

        <Card className="p-6 border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl overflow-hidden relative">
          <div className="absolute top-2 right-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">מועמדים שהגישו</p>
              <p className="text-4xl font-bold mt-1">{totalCandidates}</p>
            </div>
            <Users className="h-10 w-10 opacity-30" />
          </div>
        </Card>

        <Card className="p-6 border-0 bg-gradient-to-br from-[#FF8C00] to-[#E65100] text-white shadow-xl overflow-hidden relative">
          <div className="absolute top-2 right-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">התקבלו לעבודה</p>
              <p className="text-4xl font-bold mt-1">{hiredCandidates}</p>
            </div>
            <CheckCircle className="h-10 w-10 opacity-30" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Positions List */}
        <div className="col-span-1">
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#FF8C00] to-[#E65100] text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  משרות ({totalPositions})
                </CardTitle>
                <Link href={`/dashboard/positions/new?employerId=${employer.id}`}>
                  <Button size="sm" variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0">
                    <Plus className="h-4 w-4 ml-1" />
                    חדשה
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {employer.positions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>אין משרות ללקוח זה</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {employer.positions.map((position) => (
                    <Link 
                      key={position.id} 
                      href={`/dashboard/positions/${position.id}`}
                      className="block p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-800">{position.title}</h3>
                          {position.location && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {position.location}
                            </p>
                          )}
                        </div>
                        <Badge className={position.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                          {position.active ? "פעילה" : "סגורה"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {position.applications.length} מועמדים
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(position.createdAt).toLocaleDateString('he-IL')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Applications Summary Table */}
        <div className="col-span-2">
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#00A8A8] to-[#00D4D4] text-white">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                מועמדים שהגישו ({totalCandidates})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {allApplications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>אין מועמדים שהגישו למשרות</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="text-right p-4 font-semibold text-slate-600">מועמד</th>
                        <th className="text-right p-4 font-semibold text-slate-600">משרה</th>
                        <th className="text-right p-4 font-semibold text-slate-600">סטטוס</th>
                        <th className="text-right p-4 font-semibold text-slate-600">התאמה</th>
                        <th className="text-right p-4 font-semibold text-slate-600">תאריך</th>
                        <th className="text-right p-4 font-semibold text-slate-600">פעולות</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allApplications.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-slate-600" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">{app.candidate.name}</p>
                                {app.candidate.currentTitle && (
                                  <p className="text-sm text-muted-foreground">{app.candidate.currentTitle}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Link 
                              href={`/dashboard/positions/${app.positionId}`}
                              className="text-[#00A8A8] hover:underline font-medium"
                            >
                              {app.positionTitle}
                            </Link>
                          </td>
                          <td className="p-4">
                            <Badge className={`${getStatusColor(app.status)} flex items-center gap-1 w-fit`}>
                              {getStatusIcon(app.status)}
                              {getStatusLabel(app.status)}
                            </Badge>
                          </td>
                          <td className="p-4">
                            {app.matchScore !== null && app.matchScore !== undefined ? (
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-slate-200 rounded-full h-2">
                                  <div 
                                    className="bg-gradient-to-r from-[#00A8A8] to-[#00D4D4] rounded-full h-2"
                                    style={{ width: `${Math.min(app.matchScore, 100)}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-slate-600">{app.matchScore}%</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(app.appliedAt).toLocaleDateString('he-IL')}
                            </span>
                          </td>
                          <td className="p-4">
                            <Link href={`/dashboard/candidates/${app.candidate.id}`}>
                              <Button variant="outline" size="sm" className="border-[#FF8C00] text-[#FF8C00] hover:bg-[#FF8C00]/10">
                                צפה
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
