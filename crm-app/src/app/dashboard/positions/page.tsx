import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Plus, Briefcase } from "lucide-react"
import Link from "next/link"
import { PositionsClient } from "@/components/positions-client"

async function getPositions() {
  return await prisma.position.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      active: true,
      priority: true,
      location: true,
      employmentType: true,
      description: true,
      keywords: true,
      createdAt: true,
      employer: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      _count: { select: { applications: true } },
    },
  })
}

export default async function PositionsPage() {
  const positions = await getPositions()
  const totalApplications = positions.reduce((sum, p) => sum + p._count.applications, 0)
  const activeCount = positions.filter(p => p.active).length
  const draftCount = positions.filter(p => !p.active).length

  return (
    <div className="p-4 md:p-8 space-y-6 min-h-screen" style={{ background: 'var(--app-bg)' }}>
      {/* Clean modern header */}
      <div className="t22-card-soft p-6 md:p-7">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-teal-50)' }}>
              <Briefcase className="h-7 w-7" style={{ color: 'var(--brand-teal)' }} />
            </div>
            <div>
              <h1 className="t22-h1">משרות</h1>
              <p className="t22-sub mt-1">נהל את כל המשרות הפתוחות בארגון</p>
            </div>
          </div>
          <Link href="/dashboard/positions/new">
            <Button className="t22-btn-primary gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">הוסף משרה</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Clean Stats */}
      <div className="grid gap-4 md:gap-5 md:grid-cols-3">
        <div className="t22-card-soft p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.10)' }}>
            <Briefcase className="h-6 w-6" style={{ color: '#059669' }} />
          </div>
          <div>
            <div className="t22-num text-3xl font-bold text-slate-900">{activeCount}</div>
            <div className="text-sm text-slate-500 font-medium">משרות פעילות</div>
          </div>
        </div>
        <div className="t22-card-soft p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.12)' }}>
            <Plus className="h-6 w-6" style={{ color: '#D97706' }} />
          </div>
          <div>
            <div className="t22-num text-3xl font-bold text-slate-900">{draftCount}</div>
            <div className="text-sm text-slate-500 font-medium">טיוטות</div>
          </div>
        </div>
        <div className="t22-card-soft p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-primary-50)' }}>
            <Briefcase className="h-6 w-6" style={{ color: 'var(--brand-primary)' }} />
          </div>
          <div>
            <div className="t22-num text-3xl font-bold text-slate-900">{totalApplications}</div>
            <div className="text-sm text-slate-500 font-medium">סה&quot;כ מועמדויות</div>
          </div>
        </div>
      </div>

      {/* Search + List (Client Component) */}
      <PositionsClient positions={positions} />
    </div>
  )
}
