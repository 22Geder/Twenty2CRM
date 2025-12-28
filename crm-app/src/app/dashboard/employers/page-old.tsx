"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Plus, Search, Building2, Phone, Mail, MapPin, Briefcase,
  Users, TrendingUp, Eye, Edit
} from "lucide-react"

interface Employer {
  id: string
  name: string
  industry: string
  website: string
  contactEmail: string
  contactPhone: string
  address: string
  createdAt: string
  _count?: {
    positions: number
  }
}

export default function EmployersPage() {
  const [employers, setEmployers] = useState<Employer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

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

  const filteredEmployers = employers.filter(emp =>
    emp.name.toLowerCase().includes(search.toLowerCase()) ||
    emp.industry?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען מעסיקים...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            מעסיקים
          </h1>
          <p className="text-muted-foreground mt-1">
            ניהול {employers.length} חברות וארגונים
          </p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
          <Plus className="ml-2 h-4 w-4" />
          מעסיק חדש
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4 border-r-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">סה״כ מעסיקים</p>
              <p className="text-3xl font-bold text-blue-600">{employers.length}</p>
            </div>
            <Building2 className="h-8 w-8 text-blue-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 border-r-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">משרות פעילות</p>
              <p className="text-3xl font-bold text-green-600">
                {employers.reduce((sum, emp) => sum + (emp._count?.positions || 0), 0)}
              </p>
            </div>
            <Briefcase className="h-8 w-8 text-green-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 border-r-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">מעסיקים פעילים החודש</p>
              <p className="text-3xl font-bold text-purple-600">12</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 border-r-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">מעסיקים חדשים</p>
              <p className="text-3xl font-bold text-orange-600">3</p>
            </div>
            <Users className="h-8 w-8 text-orange-600 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6 p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חפש לפי שם חברה או תעשייה..."
            className="pr-11 h-12"
          />
        </div>
      </Card>

      {/* Employers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployers.map((employer) => (
          <Card key={employer.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{employer.name}</h3>
                  {employer.industry && (
                    <Badge variant="secondary" className="mt-1">
                      {employer.industry}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {employer.contactEmail && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {employer.contactEmail}
                </div>
              )}
              {employer.contactPhone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {employer.contactPhone}
                </div>
              )}
              {employer.address && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {employer.address}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{employer._count?.positions || 0} משרות</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredEmployers.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground text-lg">לא נמצאו מעסיקים</p>
            <p className="text-sm text-muted-foreground mt-2">
              נסה לשנות את החיפוש או הוסף מעסיק חדש
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
