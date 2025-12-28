import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, FileText, Plus, Search } from "lucide-react"
import Link from "next/link"

async function getCandidates() {
  return await prisma.candidate.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      applications: {
        include: {
          position: true
        }
      },
      _count: {
        select: {
          applications: true,
          interviews: true
        }
      }
    }
  })
}

export default async function CandidatesPage() {
  const candidates = await getCandidates()

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">מועמדים</h1>
          <p className="text-muted-foreground">
            נהל את כל המועמדים במערכת
          </p>
        </div>
        <Link href="/dashboard/candidates/new">
          <Button>
            <Plus className="ml-2 h-4 w-4" />
            הוסף מועמד
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חפש לפי שם, אימייל או טלפון..."
                className="pr-10"
              />
            </div>
            <Button variant="outline">סנן</Button>
          </div>
        </CardContent>
      </Card>

      {/* Candidates List */}
      <div className="grid gap-4">
        {candidates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">אין מועמדים במערכת עדיין</p>
              <Link href="/dashboard/candidates/new">
                <Button className="mt-4">
                  <Plus className="ml-2 h-4 w-4" />
                  הוסף מועמד ראשון
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          candidates.map((candidate) => (
            <Card key={candidate.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{candidate.name}</h3>
                      {candidate.rating && (
                        <Badge variant="secondary">
                          ⭐ {candidate.rating}/5
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid gap-2 text-sm text-muted-foreground">
                      {candidate.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{candidate.email}</span>
                        </div>
                      )}
                      {candidate.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{candidate.phone}</span>
                        </div>
                      )}
                      {candidate.currentTitle && (
                        <p className="font-medium text-gray-700">{candidate.currentTitle}</p>
                      )}
                    </div>

                    {candidate.applications.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-muted-foreground mb-1">מועמדויות:</p>
                        <div className="flex flex-wrap gap-2">
                          {candidate.applications.slice(0, 3).map((app) => (
                            <Badge key={app.id} variant="outline">
                              {app.position.title}
                            </Badge>
                          ))}
                          {candidate.applications.length > 3 && (
                            <Badge variant="outline">
                              +{candidate.applications.length - 3} נוספות
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 mr-4">
                    <div className="text-sm text-muted-foreground text-left">
                      <p>{candidate._count.applications} מועמדויות</p>
                      <p>{candidate._count.interviews} ראיונות</p>
                    </div>
                    <Link href={`/dashboard/candidates/${candidate.id}`}>
                      <Button variant="outline" size="sm">
                        צפה בפרטים
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
