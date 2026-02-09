import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MapPin, Building2, Plus, Search, Users } from "lucide-react"
import Link from "next/link"

async function getPositions() {
  return await prisma.position.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      employer: true,
      department: true,
      _count: {
        select: {
          applications: true
        }
      }
    }
  })
}

export default async function PositionsPage() {
  const positions = await getPositions()
  const activePositions = positions.filter(p => p.active)
  const draftPositions = positions.filter(p => !p.active)

  return (
    <div className="p-8 space-y-6 bg-gradient-to-br from-slate-50 via-white to-slate-100 min-h-screen">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-700">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="posGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#7CB342" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#posGrid)" />
          </svg>
        </div>
        
        {/* Floating Orbs */}
        <div className="absolute top-4 left-4 w-32 h-32 bg-gradient-to-br from-[#7CB342]/30 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute bottom-4 right-4 w-24 h-24 bg-gradient-to-br from-[#00A8A8]/30 to-transparent rounded-full blur-2xl"></div>
        
        <div className="relative flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#7CB342] via-[#8BC34A] to-[#00A8A8] bg-clip-text text-transparent">
              💼 משרות
            </h1>
            <p className="text-slate-300 mt-2 text-lg">
              נהל את כל המשרות הפתוחות בארגון
            </p>
          </div>
          <Link href="/dashboard/positions/new">
            <Button className="bg-gradient-to-r from-[#7CB342] to-[#8BC34A] hover:from-[#6BA32A] hover:to-[#7CB342] shadow-lg shadow-[#7CB342]/30 text-white border-0">
              <Plus className="ml-2 h-4 w-4" />
              הוסף משרה
            </Button>
          </Link>
        </div>
      </div>

      {/* Premium Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-0 bg-gradient-to-br from-[#7CB342] to-[#8BC34A] text-white shadow-xl shadow-[#7CB342]/30 overflow-hidden relative">
          <div className="absolute top-2 right-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          <CardHeader className="pb-3 relative">
            <CardTitle className="text-sm font-medium">משרות פעילות</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold">{activePositions.length}</div>
          </CardContent>
        </Card>
        
        <Card className="border-0 bg-gradient-to-br from-[#FF8C00] to-[#E65100] text-white shadow-xl shadow-[#FF8C00]/30 overflow-hidden relative">
          <div className="absolute top-2 right-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          <CardHeader className="pb-3 relative">
            <CardTitle className="text-sm font-medium">טיוטות</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold">{draftPositions.length}</div>
          </CardContent>
        </Card>
        
        <Card className="border-0 bg-gradient-to-br from-[#00A8A8] to-[#00D4D4] text-white shadow-xl shadow-[#00A8A8]/30 overflow-hidden relative">
          <div className="absolute top-2 right-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          <CardHeader className="pb-3 relative">
            <CardTitle className="text-sm font-medium">סה"כ מועמדויות</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold">
              {positions.reduce((sum, p) => sum + p._count.applications, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premium Search */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#7CB342] to-[#8BC34A]"></div>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#7CB342]" />
              <Input
                placeholder="חפש לפי תפקיד, מיקום או מעסיק..."
                className="pr-12 h-14 text-lg border-2 border-slate-200 focus:border-[#7CB342] rounded-xl bg-slate-50/50"
              />
            </div>
            <Button variant="outline" className="h-14 border-[#7CB342]/50 text-[#7CB342] hover:bg-[#7CB342]/10 hover:border-[#7CB342]">
              סנן
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Premium Positions List */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">משרות פעילות</h2>
        {activePositions.length === 0 ? (
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardContent className="text-center py-12">
              <div className="p-6 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 inline-block mb-4">
                <Building2 className="h-12 w-12 text-slate-400" />
              </div>
              <p className="text-slate-600">אין משרות פעילות כרגע</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {activePositions.map((position) => (
              <Card key={position.id} className="group hover:shadow-2xl hover:shadow-[#7CB342]/20 transition-all duration-500 hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#7CB342]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#7CB342] to-[#8BC34A] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardContent className="pt-6 relative">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold group-hover:text-[#7CB342] transition-colors">{position.title}</h3>
                        <Badge className="bg-gradient-to-r from-[#7CB342] to-[#8BC34A] text-white border-0">פעיל</Badge>
                        {position.priority > 0 && (
                          <Badge className="bg-gradient-to-r from-[#FF8C00] to-[#E65100] text-white border-0">דחוף</Badge>
                        )}
                      </div>
                      
                      <div className="grid gap-2 text-sm text-slate-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-[#00A8A8]" />
                          <span>{position.employer.name}</span>
                        </div>
                        {position.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-[#FF8C00]" />
                            <span>{position.location}</span>
                          </div>
                        )}
                        {position.employmentType && (
                          <p className="font-medium text-[#7CB342]">{position.employmentType}</p>
                        )}
                      </div>

                      {position.description && (
                        <p className="text-sm text-slate-500 line-clamp-2">
                          {position.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 mr-4 items-end">
                      <div className="flex items-center gap-2 text-sm bg-[#00A8A8]/10 text-[#00A8A8] px-3 py-1 rounded-full">
                        <span className="font-semibold">{position._count.applications}</span>
                        <Users className="h-4 w-4" />
                      </div>
                      <Link href={`/dashboard/positions/${position.id}`}>
                        <Button variant="outline" size="sm" className="border-[#7CB342]/50 text-[#7CB342] hover:bg-[#7CB342]/10 hover:border-[#7CB342]">
                          צפה בפרטים
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {draftPositions.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">טיוטות</h2>
          <div className="grid gap-4">
            {draftPositions.map((position) => (
              <Card key={position.id} className="group opacity-75 hover:opacity-100 hover:shadow-xl transition-all duration-300 border-0 bg-white/60 backdrop-blur-sm overflow-hidden relative">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF8C00] to-[#E65100] opacity-50"></div>
                <CardContent className="pt-6 relative">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-700">{position.title}</h3>
                        <Badge className="bg-slate-200 text-slate-600 border-0">טיוטה</Badge>
                      </div>
                      
                      <div className="text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          <span>{position.employer.name}</span>
                        </div>
                      </div>
                    </div>

                    <Link href={`/dashboard/positions/${position.id}`}>
                      <Button variant="outline" size="sm" className="border-[#FF8C00]/50 text-[#FF8C00] hover:bg-[#FF8C00]/10 hover:border-[#FF8C00]">
                        ערוך
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
