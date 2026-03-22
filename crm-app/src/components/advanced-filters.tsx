'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Filter, X, Star, Clock, Target, Award, TrendingUp, MapPin, Search } from 'lucide-react'

interface Tag {
  id: string
  name: string
  type: string
  color: string
}

interface AdvancedFiltersProps {
  onFilterChange: (filters: any) => void
}

export function AdvancedCandidateFilters({ onFilterChange }: AdvancedFiltersProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagSearch, setTagSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [minExperience, setMinExperience] = useState<number>(0)
  const [minRating, setMinRating] = useState<number>(0)
  const [source, setSource] = useState<string>('')
  const [availability, setAvailability] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchTags()
  }, [])

  useEffect(() => {
    // עדכן פילטרים כשמשתנה משהו
    onFilterChange({
      tags: selectedTags,
      city: cityFilter,
      minExperience,
      minRating,
      source,
      availability
    })
  }, [selectedTags, cityFilter, minExperience, minRating, source, availability])

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags')
      if (response.ok) {
        const data = await response.json()
        setTags(data.tags || [])
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  const toggleTag = (tagName: string) => {
    setSelectedTags(prev =>
      prev.includes(tagName)
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    )
  }

  const clearFilters = () => {
    setSelectedTags([])
    setTagSearch('')
    setCityFilter('')
    setMinExperience(0)
    setMinRating(0)
    setSource('')
    setAvailability('')
  }

  const activeFilterCount = 
    selectedTags.length +
    (cityFilter ? 1 : 0) +
    (minExperience > 0 ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (source ? 1 : 0) +
    (availability ? 1 : 0)

  return (
    <Card className="border-2 border-blue-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            סינון מתקדם
            {activeFilterCount > 0 && (
              <Badge variant="default" className="bg-blue-600">
                {activeFilterCount} פילטרים פעילים
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'הסתר' : 'הצג'}
          </Button>
        </div>
      </CardHeader>

      {showFilters && (
        <CardContent className="space-y-6">
          {/* 🏙️ סינון לפי עיר */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-red-500" />
              <h3 className="font-semibold">עיר / מיקום</h3>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="הקלד שם עיר... (למשל: אשדוד, תל אביב)"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="flex-1"
              />
              {cityFilter && (
                <Button variant="ghost" size="sm" onClick={() => setCityFilter('')}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {['תל אביב', 'ירושלים', 'חיפה', 'באר שבע', 'אשדוד', 'רמת גן', 'פתח תקווה', 'חולון', 'נתניה', 'ראשון לציון'].map((city) => (
                <Badge
                  key={city}
                  variant={cityFilter === city ? 'default' : 'outline'}
                  className={`cursor-pointer transition-all hover:scale-105 ${
                    cityFilter === city
                      ? 'bg-red-500'
                      : 'hover:bg-red-50'
                  }`}
                  onClick={() => setCityFilter(cityFilter === city ? '' : city)}
                >
                  📍 {city}
                </Badge>
              ))}
            </div>
          </div>

          {/* טכניקת סינון #1: תגיות כישורים */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold">כישורים / תגיות</h3>
            </div>
            {/* חיפוש תגיות */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="חפש תגית... (למשל: מכירות, שירות, הנדסה)"
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            {/* תגיות שנבחרו */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 bg-blue-50 rounded-lg">
                <span className="text-xs text-blue-600 font-medium">נבחרו:</span>
                {selectedTags.map((tagName) => (
                  <Badge
                    key={tagName}
                    variant="default"
                    className="bg-blue-600 cursor-pointer hover:bg-blue-700"
                    onClick={() => toggleTag(tagName)}
                  >
                    {tagName} <X className="h-3 w-3 mr-1" />
                  </Badge>
                ))}
              </div>
            )}
            {/* רשימת תגיות */}
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {tags
                .filter(t => !tagSearch || t.name.toLowerCase().includes(tagSearch.toLowerCase()))
                .map((tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTags.includes(tag.name) ? 'default' : 'outline'}
                  className={`cursor-pointer transition-all hover:scale-105 ${
                    selectedTags.includes(tag.name)
                      ? 'bg-blue-600'
                      : 'hover:bg-blue-50'
                  }`}
                  onClick={() => toggleTag(tag.name)}
                >
                  {tag.name}
                  {selectedTags.includes(tag.name) && (
                    <X className="h-3 w-3 mr-1" />
                  )}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              בחר תגיות לסינון מועמדים ({tags.length} תגיות זמינות)
            </p>
          </div>

          {/* טכניקת סינון #2: שנות ניסיון */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold">ניסיון מינימלי</h3>
            </div>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                min="0"
                max="20"
                value={minExperience}
                onChange={(e) => setMinExperience(parseInt(e.target.value) || 0)}
                className="w-24"
              />
              <span className="text-sm text-gray-600">שנות ניסיון לפחות</span>
            </div>
            <div className="flex gap-2">
              {[0, 1, 3, 5, 10].map((years) => (
                <Button
                  key={years}
                  variant={minExperience === years ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMinExperience(years)}
                >
                  {years === 0 ? 'הכל' : `${years}+ שנים`}
                </Button>
              ))}
            </div>
          </div>

          {/* טכניקת סינון #3: דירוג */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <h3 className="font-semibold">דירוג מינימלי</h3>
            </div>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5].map((rating) => (
                <Button
                  key={rating}
                  variant={minRating === rating ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMinRating(rating)}
                  className="flex items-center gap-1"
                >
                  {rating === 0 ? 'הכל' : (
                    <>
                      {rating}
                      <Star className="h-3 w-3" />
                    </>
                  )}
                </Button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              סנן מועמדים לפי הדירוג שניתן להם
            </p>
          </div>

          {/* טכניקת סינון #4: מקור המועמד */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-600" />
              <h3 className="font-semibold">מקור המועמד</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {['LinkedIn', 'Indeed', 'המלצה', 'אתר החברה', 'רשתות חברתיות', 'אימייל'].map((src) => (
                <Button
                  key={src}
                  variant={source === src ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSource(source === src ? '' : src)}
                >
                  {src}
                </Button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              מצא מועמדים ממקור ספציפי
            </p>
          </div>

          {/* טכניקת סינון #5: זמינות */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <h3 className="font-semibold">זמינות להתחלה</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {['מיידי', 'שבועיים', 'חודש', 'חודשיים', '3 חודשים'].map((avail) => (
                <Button
                  key={avail}
                  variant={availability === avail ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAvailability(availability === avail ? '' : avail)}
                >
                  {avail}
                </Button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              סנן לפי תקופת הודעה מוקדמת
            </p>
          </div>

          {/* כפתור ניקוי */}
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50"
              onClick={clearFilters}
            >
              <X className="h-4 w-4 ml-2" />
              נקה את כל הפילטרים
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  )
}
