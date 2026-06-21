import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Plus } from "lucide-react"
import Link from "next/link"
import { PositionsClient } from "@/components/positions-client"

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
    },
    // Adding keywords to the select
  })
}

export default async function PositionsPage() {
  const positions = await getPositions()
  const totalApplications = positions.reduce((sum, p) => sum + p._count.applications, 0)
  const activeCount = positions.filter(p => p.active).length
  const draftCount = positions.filter(p => !p.active).length

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gradient-to-br from-slate-50 via-[#ECFDF5]/30 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f0b2e] via-[#1a1444] to-[#0f0b2e] rounded-2xl shadow-2xl p-6 md:p-8 border border-white/5">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="posGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#10B981" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#posGrid)" />
          </svg>
        </div>
        <div className="absolute top-4 left-4 w-32 h-32 bg-gradient-to-br from-[#10B981]/30 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute bottom-4 right-4 w-24 h-24 bg-gradient-to-br from-[#06B6D4]/30 to-transparent rounded-full blur-2xl"></div>
        <div className="relative flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#10B981] via-[#34D399] to-[#06B6D4] bg-clip-text text-transparent">
              💼 משרות
            </h1>
            <p className="text-slate-300 mt-2 text-lg">נהל את כל המשרות הפתוחות בארגון</p>
          </div>
          <Link href="/dashboard/positions/new">
            <Button className="bg-gradient-to-r from-[#10B981] to-[#34D399] hover:from-[#6BA32A] hover:to-[#10B981] shadow-lg shadow-[#10B981]/30 text-white border-0">
              <Plus className="ml-2 h-4 w-4" />
              הוסף משרה
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-0 bg-gradient-to-br from-[#10B981] to-[#34D399] text-white shadow-xl shadow-[#10B981]/30 overflow-hidden relative">
          <div className="absolute top-2 right-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          <CardHeader className="pb-3 relative">
            <CardTitle className="text-sm font-medium">משרות פעילות</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-[#F97316] to-[#C2410C] text-white shadow-xl shadow-[#F97316]/30 overflow-hidden relative">
          <div className="absolute top-2 right-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          <CardHeader className="pb-3 relative">
            <CardTitle className="text-sm font-medium">טיוטות</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold">{draftCount}</div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-[#06B6D4] to-[#22D3EE] text-white shadow-xl shadow-[#06B6D4]/30 overflow-hidden relative">
          <div className="absolute top-2 right-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          <CardHeader className="pb-3 relative">
            <CardTitle className="text-sm font-medium">סה&quot;כ מועמדויות</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold">{totalApplications}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search + List (Client Component) */}
      <PositionsClient positions={positions} />
    </div>
  )
}
