'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Plus, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Building,
  Filter,
  X
} from 'lucide-react'

interface Position {
  id: string
  title: string
  description: string
  location: string
  salaryRange: string
  employmentType: string
  active: boolean
  department: {
    name: string
  }
  employer: {
    name: string
  }
  _count: {
    applications: number
  }
}

interface Department {
  id: string
  name: string
}

export default function PositionsPageImproved() {
  const [positions, setPositions] = useState<Position[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<string>('')
  const [activeOnly, setActiveOnly] = useState(true)

  useEffect(() => {
    fetchDepartments()
    fetchPositions()
  }, [])

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments')
      if (response.ok) {
        const data = await response.json()
        setDepartments(data.departments || [])
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const fetchPositions = async () => {
    try {
      const response = await fetch('/api/positions')
      if (response.ok) {
        const data = await response.json()
        setPositions(data || [])
      }
    } catch (error) {
      console.error('Error fetching positions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPositions = positions.filter(position => {
    const matchesSearch = 
      position.title.toLowerCase().includes(search.toLowerCase()) ||
      position.description?.toLowerCase().includes(search.toLowerCase()) ||
      position.employer?.name.toLowerCase().includes(search.toLowerCase())
    
    const matchesDepartment = !selectedDepartment || position.department?.name === selectedDepartment
    const matchesEmploymentType = !employmentTypeFilter || position.employmentType === employmentTypeFilter
    const matchesActive = !activeOnly || position.active

    return matchesSearch && matchesDepartment && matchesEmploymentType && matchesActive
  })

  const employmentTypes = Array.from(new Set(positions.map(p => p.employmentType).filter(Boolean)))

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">משרות</h1>
          <p className="text-gray-600 mt-1">
            {filteredPositions.length} מתוך {positions.length} משרות
          </p>
        </div>
        <Link href="/dashboard/positions/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            הוסף משרה חדשה
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="חיפוש משרה..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* Department Filter */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">כל הקטגוריות</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>

            {/* Employment Type Filter */}
            <select
              value={employmentTypeFilter}
              onChange={(e) => setEmploymentTypeFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">כל סוגי המשרות</option>
              {employmentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            {/* Active Filter */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">משרות פעילות בלבד</span>
              </label>
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedDepartment || employmentTypeFilter || search) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {search && (
                <Badge variant="secondary" className="gap-2">
                  חיפוש: {search}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setSearch('')}
                  />
                </Badge>
              )}
              {selectedDepartment && (
                <Badge variant="secondary" className="gap-2">
                  קטגוריה: {selectedDepartment}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setSelectedDepartment('')}
                  />
                </Badge>
              )}
              {employmentTypeFilter && (
                <Badge variant="secondary" className="gap-2">
                  סוג: {employmentTypeFilter}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setEmploymentTypeFilter('')}
                  />
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setSelectedDepartment('')
                  setEmploymentTypeFilter('')
                }}
              >
                נקה הכל
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Positions Grid */}
      {filteredPositions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">לא נמצאו משרות התואמות לקריטריונים</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPositions.map((position) => (
            <Link key={position.id} href={`/dashboard/positions/${position.id}`}>
              <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{position.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building className="h-4 w-4" />
                        {position.employer?.name}
                      </div>
                    </div>
                    {position.active ? (
                      <Badge className="bg-green-500">פעיל</Badge>
                    ) : (
                      <Badge variant="secondary">לא פעיל</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Filter className="h-4 w-4" />
                    {position.department?.name}
                  </div>
                  
                  {position.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {position.location}
                    </div>
                  )}
                  
                  {position.salaryRange && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      {position.salaryRange}
                    </div>
                  )}
                  
                  {position.employmentType && (
                    <Badge variant="outline">{position.employmentType}</Badge>
                  )}
                  
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-500">
                      {position._count?.applications || 0} מועמדים
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
