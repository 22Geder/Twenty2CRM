"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Brain,
  Building2,
  MapPin,
  Loader2,
  CheckCircle2,
  XCircle,
  Target,
  Send,
  RefreshCw,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Zap,
  Eye,
  Search,
  Navigation,
  MessageCircle
} from "lucide-react"

// 🔧 Safe encoder that handles malformed characters
const safeEncodeURIComponent = (str: string): string => {
  try {
    // First sanitize the string to remove any problematic characters
    const sanitized = String(str || '')
      .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '') // Remove lone high surrogates
      .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '') // Remove lone low surrogates
    return encodeURIComponent(sanitized)
  } catch (e) {
    console.error('Error encoding:', e)
    // Fallback: remove all non-BMP characters
    return encodeURIComponent(String(str || '').replace(/[^\x00-\uFFFF]/g, ''))
  }
}

interface SmartAIMatchingProps {
  candidateId: string
  candidateName?: string
  candidatePhone?: string
  onSendToEmployer?: (positionId: string) => void
}

interface Position {
  id: string
  title: string
  location: string | null
  employer: {
    id: string
    name: string
  } | null
}

interface MatchResult {
  positionId: string
  positionTitle: string
  employerName: string
  location: string
  description?: string
  requirements?: string
  salaryRange?: string
  employmentType?: string
  workHours?: string      // 🆕 שעות עבודה
  benefits?: string       // 🆕 תנאים נלווים
  transportation?: string // 🆕 אופן הגעה
  keywords?: string       // 🆕 מילות מפתח
  openings?: number       // 🆕 מספר משרות פתוחות
  contactName?: string    // 🆕 שם איש קשר
  score: number
  locationMatch?: boolean
  strengths: string[]
  weaknesses: string[]
  recommendation: string
  shouldProceed: boolean
}

export function SmartAIMatching({ candidateId, candidateName, candidatePhone, onSendToEmployer }: SmartAIMatchingProps) {
  const [positions, setPositions] = useState<Position[]>([])
  const [selectedPositionId, setSelectedPositionId] = useState<string>("")
  const [loading, setLoading] = useState(true) // 🆕 Start with loading true
  const [loadingPositions, setLoadingPositions] = useState(true)
  const [result, setResult] = useState<MatchResult | null>(null)
  const [allResults, setAllResults] = useState<MatchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'browse' | 'single' | 'scan'>('scan') // 🆕 Start in scan mode
  const [expandedResult, setExpandedResult] = useState<string | null>(null)
  const [scanStatus, setScanStatus] = useState<string>("⏳ טוען נתונים...")
  const [candidateCity, setCandidateCity] = useState<string>("")
  const [autoScanned, setAutoScanned] = useState(false)

  // 📱 WhatsApp Helpers - 🆕 תומך בכל הפורמטים
  const normalizePhoneForWhatsApp = (phone: string): string => {
    if (!phone) return '';
    
    // הסרת תווים מיוחדים (unicode LTR/RTL markers) וכל מה שאינו ספרה
    let cleaned = phone.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069\s\-\(\)\.\+]/g, '');
    
    // הסרת כל התווים שאינם ספרות
    cleaned = cleaned.replace(/\D/g, '');
    
    // אם מתחיל ב-972, זה כבר בפורמט הנכון
    if (cleaned.startsWith('972')) {
      return cleaned;
    }
    
    // אם מתחיל ב-0, החלף ל-972
    if (cleaned.startsWith('0')) {
      return '972' + cleaned.slice(1);
    }
    
    // אחרת - הוסף 972 בהתחלה
    return '972' + cleaned;
  }

  const generateWhatsAppMessage = (match: MatchResult): string => {
    const lines: string[] = []
    
    // פתיחה אישית עם שם המועמד
    lines.push(`היי ${candidateName || ''}! 👋`)
    lines.push('')
    lines.push(`יש לי הצעת עבודה שיכולה להתאים לך מצוין:`)
    lines.push('')
    lines.push(`━━━━━━━━━━━━━━━━━━━━`)
    
    // כותרת המשרה
    lines.push(`🎯 *${match.positionTitle}*`)
    lines.push(`🏢 *${match.employerName}*`)
    lines.push(`━━━━━━━━━━━━━━━━━━━━`)
    lines.push('')
    
    // פרטים בסיסיים
    lines.push(`📌 *פרטי המשרה:*`)
    if (match.location) {
      lines.push(`📍 מיקום: ${match.location}`)
    }
    if (match.employmentType) {
      lines.push(`📝 היקף: ${match.employmentType}`)
    }
    if (match.workHours) {
      lines.push(`🕐 שעות עבודה: ${match.workHours}`)
    }
    if (match.salaryRange) {
      lines.push(`💰 שכר: ${match.salaryRange}`)
    }
    if (match.openings && match.openings > 1) {
      lines.push(`👥 משרות פתוחות: ${match.openings}`)
    }
    if (match.contactName) {
      lines.push(`👤 איש קשר: ${match.contactName}`)
    }
    lines.push('')
    
    // תיאור המשרה - מלא!
    if (match.description) {
      lines.push(`📋 *תיאור התפקיד:*`)
      lines.push(match.description)
      lines.push('')
    }
    
    // דרישות המשרה - מלא!
    if (match.requirements) {
      lines.push(`✅ *דרישות התפקיד:*`)
      lines.push(match.requirements)
      lines.push('')
    }
    
    // תנאים והטבות
    const hasConditions = match.benefits || match.transportation
    if (hasConditions) {
      lines.push(`🎁 *תנאים והטבות:*`)
      if (match.benefits) {
        lines.push(`• ${match.benefits}`)
      }
      if (match.transportation) {
        lines.push(`🚗 הגעה: ${match.transportation}`)
      }
      lines.push('')
    }
    
    // מילות מפתח (אם יש)
    if (match.keywords) {
      try {
        const keywordsArr = JSON.parse(match.keywords)
        if (Array.isArray(keywordsArr) && keywordsArr.length > 0) {
          lines.push(`🔑 *מילות מפתח:* ${keywordsArr.slice(0, 10).join(' | ')}`)
          lines.push('')
        }
      } catch (e) {
        if (match.keywords.length > 0) {
          lines.push(`🔑 *מילות מפתח:* ${match.keywords}`)
          lines.push('')
        }
      }
    }
    
    lines.push(`━━━━━━━━━━━━━━━━━━━━`)
    lines.push('')
    lines.push(`💬 *מעניין אותך?*`)
    lines.push(`אשמח לשמוע ממך ולתאם ראיון!`)
    lines.push('')
    lines.push(`בהצלחה! 🍀`)
    lines.push(`*טוונטי טו ג'ובס* 🚀`)
    
    return lines.join('\n')
  }

  const getWhatsAppLink = (phone: string, message: string): string => {
    const normalizedPhone = normalizePhoneForWhatsApp(phone)
    const encodedMessage = safeEncodeURIComponent(message)
    return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`
  }

  // טוען משרות - מצב מהיר!
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        console.log('📦 Loading positions...')
        // 🚀 מצב מהיר - רק שדות הכרחיים!
        const res = await fetch('/api/positions?active=true&fast=true')
        if (res.ok) {
          const data = await res.json()
          const positionsList = data.positions || data || []
          console.log('✅ Loaded', positionsList.length, 'positions')
          setPositions(positionsList)
        } else {
          console.error('❌ Failed to load positions:', res.status)
        }
      } catch (e) {
        console.error('Error loading positions:', e)
      } finally {
        setLoadingPositions(false)
      }
    }
    fetchPositions()
  }, [])

  // סריקה מלאה של כל המשרות
  const runFullScan = useCallback(async () => {
    if (!candidateId) return
    
    setLoading(true)
    setError(null)
    setAllResults([])
    setScanStatus("⚡ שלב 1: סינון מהיר בלי AI...")
    setMode('scan')

    try {
      const startTime = Date.now()
      
      const res = await fetch('/api/ai-match-v3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'שגיאה בסריקה')
      }

      const data = await res.json()
      setAllResults(data.matches || [])
      setCandidateCity(data.candidateCity || '')
      
      const timeStr = data.scanTimeMs ? `${(data.scanTimeMs / 1000).toFixed(1)}` : ((Date.now() - startTime) / 1000).toFixed(1)
      setScanStatus(`✅ נסרקו ${data.totalScanned} משרות | ${data.aiAnalyzed || 0} עם AI | ${timeStr} שניות`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה')
      setScanStatus("")
    } finally {
      setLoading(false)
    }
  }, [candidateId])

  // סריקה אוטומטית כשנטען
  useEffect(() => {
    // If positions loaded but no candidateId yet, stop loading state
    if (!loadingPositions && !candidateId) {
      setLoading(false)
      setScanStatus("ממתין לטעינת מועמד...")
      return
    }
    
    if (!loadingPositions && positions.length > 0 && candidateId && candidateId.length > 0 && !autoScanned) {
      console.log('🚀 Auto-scan triggered for candidate:', candidateId)
      setAutoScanned(true)
      setScanStatus("⚡ מתחיל סריקה...")
      // Use timeout to ensure state is updated
      setTimeout(() => {
        runFullScan()
      }, 100)
    } else if (!loadingPositions && positions.length === 0) {
      setLoading(false)
      setScanStatus("אין משרות פעילות")
    }
  }, [loadingPositions, positions.length, candidateId, autoScanned, runFullScan])

  // ניתוח משרה ספציפית
  const analyzePosition = async (positionId: string) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/ai-match-v3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, positionId })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'שגיאה בניתוח')
      }

      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-500'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    if (score >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const renderMatchResult = (match: MatchResult, compact: boolean = false) => (
    <Card key={match.positionId} className={`overflow-hidden ${match.locationMatch ? 'ring-2 ring-blue-400' : ''}`}>
      <div 
        className={`p-4 cursor-pointer ${match.shouldProceed ? 'bg-green-50' : 'bg-gray-50'}`}
        onClick={() => setExpandedResult(expandedResult === match.positionId ? null : match.positionId)}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg ${getScoreBg(match.score)}`}>
              {match.score}%
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-base">{match.positionTitle}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                <Building2 className="h-4 w-4 flex-shrink-0" />
                <span>{match.employerName}</span>
                {match.location && (
                  <>
                    <span>•</span>
                    <MapPin className={`h-4 w-4 flex-shrink-0 ${match.locationMatch ? 'text-blue-600' : ''}`} />
                    <span className={match.locationMatch ? 'text-blue-600 font-medium' : ''}>{match.location}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* כפתור וואטסאפ ישירות בכרטיס - תמיד גלוי! */}
            {candidatePhone ? (
              <a
                href={getWhatsAppLink(candidatePhone, generateWhatsAppMessage(match))}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  <MessageCircle className="h-4 w-4 ml-1" />
                  וואטסאפ
                </Button>
              </a>
            ) : (
              <Badge variant="outline" className="text-gray-400 text-xs">
                אין טלפון
              </Badge>
            )}
            {match.locationMatch && (
              <Badge className="bg-blue-100 text-blue-700">
                <Navigation className="h-3 w-3 mr-1" />
                קרוב
              </Badge>
            )}
            {match.shouldProceed ? (
              <Badge className="bg-green-100 text-green-700">
                <ThumbsUp className="h-3 w-3 mr-1" />
                מומלץ
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-700">
                <ThumbsDown className="h-3 w-3 mr-1" />
                פחות מתאים
              </Badge>
            )}
            {expandedResult === match.positionId ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </div>
      </div>

      {expandedResult === match.positionId && (
        <CardContent className="p-4 border-t">
          {match.strengths.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                יתרונות
              </h4>
              <div className="flex flex-wrap gap-2">
                {match.strengths.map((s, i) => (
                  <Badge key={i} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {match.weaknesses.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                חסרונות
              </h4>
              <div className="flex flex-wrap gap-2">
                {match.weaknesses.map((w, i) => (
                  <Badge key={i} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    {w}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <h4 className="font-semibold mb-1">המלצה:</h4>
            <p className="text-sm text-gray-700">{match.recommendation}</p>
          </div>

          <div className="flex gap-2">
            {/* WhatsApp Button */}
            {candidatePhone && (
              <a
                href={getWhatsAppLink(candidatePhone, generateWhatsAppMessage(match))}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  וואטסאפ למועמד
                </Button>
              </a>
            )}
            
            {/* Send to Employer Button */}
            {match.shouldProceed && onSendToEmployer && (
              <Button 
                onClick={() => onSendToEmployer(match.positionId)}
                className="flex-1 bg-teal-600 hover:bg-teal-700"
              >
                <Send className="h-4 w-4 mr-2" />
                שלח למעסיק
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )

  const recommendedMatches = allResults.filter(r => r.shouldProceed)
  const locationMatches = allResults.filter(r => r.locationMatch)
  const otherMatches = allResults.filter(r => !r.shouldProceed)
  // ✅ הצג את כל המשרות מעל 50% + מינימום 15 משרות
  const allSorted = [...allResults].sort((a, b) => b.score - a.score)
  const above50Results = allSorted.filter(r => r.score >= 50)
  const below50Results = allSorted.filter(r => r.score < 50)
  const sortedMatches = above50Results.length >= 15
    ? above50Results
    : [...above50Results, ...below50Results.slice(0, 15 - above50Results.length)]

  // Show loading state when component first loads
  if (loadingPositions) {
    return (
      <Card dir="rtl">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6" />
            סריקה חכמה V3 TURBO ⚡
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600 mb-4" />
          <p className="text-gray-600">טוען משרות...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card dir="rtl">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6" />
            סריקה חכמה V3 TURBO ⚡
          </div>
          {candidateCity && (
            <Badge className="bg-white/20 text-white">
              <MapPin className="h-3 w-3 mr-1" />
              {candidateCity}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {/* כפתורי מצב */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={mode === 'browse' ? 'default' : 'outline'}
            onClick={() => setMode('browse')}
            className={mode === 'browse' ? 'bg-purple-600' : ''}
            size="sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            צפייה במשרות ({positions.length})
          </Button>
          <Button
            variant={mode === 'single' ? 'default' : 'outline'}
            onClick={() => setMode('single')}
            className={mode === 'single' ? 'bg-purple-600' : ''}
            size="sm"
          >
            <Target className="h-4 w-4 mr-2" />
            בדיקת משרה בודדת
          </Button>
          <Button
            variant={mode === 'scan' ? 'default' : 'outline'}
            onClick={() => { setMode('scan'); if (allResults.length === 0) runFullScan(); }}
            className={mode === 'scan' ? 'bg-purple-600' : ''}
            size="sm"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            סריקה מלאה
          </Button>
        </div>

        {/* מצב צפייה - כל המשרות */}
        {mode === 'browse' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">כל המשרות הפעילות ({positions.length})</h3>
              <Button size="sm" variant="outline" onClick={runFullScan} disabled={loading}>
                <Search className="h-4 w-4 mr-1" />
                סרוק והתאם
              </Button>
            </div>
            
            {loadingPositions ? (
              <div className="flex items-center gap-2 text-gray-500 py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                טוען משרות...
              </div>
            ) : (
              <div className="grid gap-2 max-h-96 overflow-y-auto">
                {positions.map((pos) => (
                  <div 
                    key={pos.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                    onClick={() => { setSelectedPositionId(pos.id); setMode('single'); analyzePosition(pos.id); }}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{pos.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building2 className="h-3 w-3" />
                        <span>{pos.employer?.name || 'ללא מעסיק'}</span>
                        {pos.location && (
                          <>
                            <span>•</span>
                            <MapPin className="h-3 w-3" />
                            <span>{pos.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Zap className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* מצב בדיקה בודדת */}
        {mode === 'single' && (
          <>
            <div className="space-y-2">
              <label className="font-medium">בחר משרה:</label>
              <select
                title="בחירת משרה"
                aria-label="בחירת משרה"
                className="w-full p-3 border rounded-lg bg-white"
                value={selectedPositionId}
                onChange={(e) => setSelectedPositionId(e.target.value)}
              >
                <option value="">-- בחר משרה --</option>
                {positions.map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {pos.title} - {pos.employer?.name || 'ללא מעסיק'} {pos.location ? `(${pos.location})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={() => analyzePosition(selectedPositionId)}
              disabled={!selectedPositionId || loading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  מנתח...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  נתח התאמה
                </>
              )}
            </Button>

            {result && renderMatchResult(result)}
          </>
        )}

        {/* מצב סריקה מלאה */}
        {mode === 'scan' && (
          <>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-purple-600 mb-4" />
                <p className="font-medium text-lg">{scanStatus}</p>
                <p className="text-sm text-gray-500">סורק כל משרה כמו מגייס אנושי...</p>
              </div>
            ) : (
              <>
                {allResults.length > 0 && (
                  <div className="space-y-4">
                    {/* סיכום */}
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-lg">
                            ✅ נמצאו {sortedMatches.length} משרות מתאימות (ממוינות לפי %)
                          </h3>
                          {locationMatches.length > 0 && (
                            <p className="text-sm text-blue-600">
                              <Navigation className="h-4 w-4 inline mr-1" />
                              {locationMatches.length} משרות קרובות ל{candidateCity}
                            </p>
                          )}
                        </div>
                        <Button variant="outline" size="sm" onClick={runFullScan}>
                          <RefreshCw className="h-4 w-4 mr-1" />
                          סרוק שוב
                        </Button>
                      </div>
                    </div>

                    {/* 🆕 הצגת כל המשרות ממוינות לפי ציון - עד 20 */}
                    {sortedMatches.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-purple-700 font-bold flex items-center gap-2">
                          <Target className="h-5 w-5" />
                          משרות מתאימות - לפי אחוזי התאמה ({sortedMatches.length}):
                        </h4>
                        <div className="space-y-2">
                          {sortedMatches.map(match => renderMatchResult(match))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {allResults.length === 0 && !loading && (
                  <Button
                    onClick={runFullScan}
                    className="w-full bg-purple-600 hover:bg-purple-700 py-6"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    סרוק את כל {positions.length} המשרות
                  </Button>
                )}
              </>
            )}
          </>
        )}

        {/* שגיאה */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <XCircle className="h-6 w-6 text-red-500" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-700">שגיאה</h4>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setError(null); runFullScan(); }}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
