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
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">משרות</h1>
          <p className="text-muted-foreground">
            נהל את כל המשרות הפתוחות בארגון
          </p>
        </div>
        <Link href="/dashboard/positions/new">
          <Button>
            <Plus className="ml-2 h-4 w-4" />
            הוסף משרה
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">משרות פעילות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePositions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">טיוטות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftPositions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">סה"כ מועמדויות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {positions.reduce((sum, p) => sum + p._count.applications, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חפש לפי תפקיד, מיקום או מעסיק..."
                className="pr-10"
              />
            </div>
            <Button variant="outline">סנן</Button>
          </div>
        </CardContent>
      </Card>

      {/* Positions List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">משרות פעילות</h2>
        {activePositions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">אין משרות פעילות כרגע</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {activePositions.map((position) => (
              <Card key={position.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{position.title}</h3>
                        <Badge variant="default" className="bg-green-600">פעיל</Badge>
                        {position.priority > 0 && (
                          <Badge variant="destructive">דחוף</Badge>
                        )}
                      </div>
                      
                      <div className="grid gap-2 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span>{position.employer.name}</span>
                        </div>
                        {position.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{position.location}</span>
                          </div>
                        )}
                        {position.employmentType && (
                          <p className="font-medium">{position.employmentType}</p>
                        )}
                      </div>

                      {position.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {position.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 mr-4 items-end">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{position._count.applications}</span>
                        <Users className="h-4 w-4" />
                      </div>
                      <Link href={`/dashboard/positions/${position.id}`}>
                        <Button variant="outline" size="sm">
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
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">טיוטות</h2>
          <div className="grid gap-4">
            {draftPositions.map((position) => (
              <Card key={position.id} className="opacity-75 hover:opacity-100 transition-opacity">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{position.title}</h3>
                        <Badge variant="secondary">טיוטה</Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span>{position.employer.name}</span>
                        </div>
                      </div>
                    </div>

                    <Link href={`/dashboard/positions/${position.id}`}>
                      <Button variant="outline" size="sm">
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
