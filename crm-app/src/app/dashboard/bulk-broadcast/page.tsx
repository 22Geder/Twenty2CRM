'use client'

import { useState, useEffect } from 'react'
import { 
  Mail, 
  MessageSquare, 
  Users, 
  Send, 
  Check, 
  X, 
  AlertCircle, 
  RefreshCw,
  Search,
  UserMinus,
  Filter,
  Sparkles,
  Heart,
  Briefcase
} from 'lucide-react'

interface Candidate {
  id: string
  name: string
  email: string | null
  phone: string | null
  city: string | null
  currentTitle: string | null
  unsubscribed: boolean
}

interface Position {
  id: string
  title: string
  employer: { name: string }
}

interface SendResults {
  sent: number
  failed: number
  skippedUnsubscribed: number
}

export default function BulkBroadcastPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState<SendResults | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [mode, setMode] = useState<'email' | 'sms'>('email')
  const [subject, setSubject] = useState('הזדמנות תעסוקה חדשה מ-2טו-גדר! 🚀')
  const [message, setMessage] = useState('')
  const [selectedPosition, setSelectedPosition] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [showUnsubscribed, setShowUnsubscribed] = useState(false)

  const MAX_RECIPIENTS = 50

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [candRes, posRes] = await Promise.all([
        fetch('/api/candidates?limit=500'),
        fetch('/api/positions?active=true')
      ])
      
      if (candRes.ok) {
        const data = await candRes.json()
        setCandidates(data.candidates || data || [])
      }
      
      if (posRes.ok) {
        const data = await posRes.json()
        setPositions(data.positions || data || [])
      }
    } catch (e) {
      console.error('Failed to fetch data:', e)
    }
    setLoading(false)
  }

  const filteredCandidates = candidates.filter(c => {
    // סינון לפי הסרה
    if (!showUnsubscribed && c.unsubscribed) return false
    
    // סינון לפי mode (מייל/טלפון)
    if (mode === 'email' && !c.email) return false
    if (mode === 'sms' && !c.phone) return false
    
    // סינון לפי חיפוש
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!c.name?.toLowerCase().includes(q) && 
          !c.email?.toLowerCase().includes(q) &&
          !c.phone?.includes(q) &&
          !c.city?.toLowerCase().includes(q) &&
          !c.currentTitle?.toLowerCase().includes(q)) {
        return false
      }
    }
    
    // סינון לפי עיר
    if (filterCity && c.city !== filterCity) return false
    
    return true
  })

  // רשימת ערים ייחודיות
  const cities = [...new Set(candidates.map(c => c.city).filter(Boolean))]

  const toggleCandidate = (id: string) => {
    const newSet = new Set(selectedCandidates)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      if (newSet.size >= MAX_RECIPIENTS) {
        setError(`מקסימום ${MAX_RECIPIENTS} נמענים בכל שליחה`)
        return
      }
      newSet.add(id)
    }
    setSelectedCandidates(newSet)
    setError(null)
  }

  const selectAll = () => {
    const available = filteredCandidates.slice(0, MAX_RECIPIENTS)
    setSelectedCandidates(new Set(available.map(c => c.id)))
  }

  const clearSelection = () => {
    setSelectedCandidates(new Set())
  }

  const handleSend = async () => {
    if (selectedCandidates.size === 0) {
      setError('בחר לפחות מועמד אחד')
      return
    }
    
    if (!message.trim()) {
      setError('יש להזין תוכן הודעה')
      return
    }

    if (mode === 'email' && !subject.trim()) {
      setError('יש להזין נושא למייל')
      return
    }

    setSending(true)
    setError(null)
    setResults(null)

    const recipients = filteredCandidates
      .filter(c => selectedCandidates.has(c.id))
      .map(c => ({
        candidateId: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone
      }))

    const positionTitle = positions.find(p => p.id === selectedPosition)?.title || ''

    try {
      const endpoint = mode === 'email' ? '/api/send-bulk-email' : '/api/send-bulk-sms'
      
      const body: any = {
        recipients,
        message,
        positionTitle,
        positionId: selectedPosition || undefined
      }
      
      if (mode === 'email') {
        body.subject = subject
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'שגיאה בשליחה')
      }

      setResults({
        sent: data.sent || data.successful || 0,
        failed: data.failed || 0,
        skippedUnsubscribed: data.skippedUnsubscribed || 0
      })

      // Clear selection after successful send
      setSelectedCandidates(new Set())
    } catch (e: any) {
      setError(e.message || 'שגיאה בשליחה')
    }

    setSending(false)
  }

  const defaultEmailMessage = `שלום {name}!

יש לנו הצעת עבודה מעולה עבורך!
${selectedPosition ? `משרה: {position}` : ''}

האם יש לך עניין לשמוע פרטים?

בברכה,
צוות 2טו-גדר 🚀`

  const defaultSmsMessage = `שלום {name}! 
יש לנו משרה חדשה שיכולה להתאים לך${selectedPosition ? ': {position}' : ''}
מעוניין/ת? השב כן!`

  useEffect(() => {
    if (!message) {
      setMessage(mode === 'email' ? defaultEmailMessage : defaultSmsMessage)
    }
  }, [mode])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">שליחה המונית</h1>
        <p className="text-gray-500">שלח מייל או SMS לעד 50 מועמדים במקביל</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setMode('email')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            mode === 'email' 
              ? 'bg-teal-500 text-white shadow-sm scale-105' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Mail className="w-5 h-5" />
          מייל
        </button>
        <button
          onClick={() => setMode('sms')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            mode === 'sms' 
              ? 'bg-orange-500 text-white shadow-sm scale-105' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          SMS
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Candidate Selection */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-teal-500" />
              בחירת נמענים
            </h2>
            <div className="flex items-center gap-2 text-sm">
              <span className={`font-bold ${selectedCandidates.size >= MAX_RECIPIENTS ? 'text-red-500' : 'text-teal-600'}`}>
                {selectedCandidates.size}
              </span>
              <span className="text-gray-400">/ {MAX_RECIPIENTS}</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="חיפוש מועמדים..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border rounded-xl"
              />
            </div>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="border rounded-xl px-4 py-2"
              title="סינון לפי עיר"
            >
              <option value="">כל הערים</option>
              {cities.map(city => (
                <option key={city} value={city!}>{city}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showUnsubscribed}
                onChange={(e) => setShowUnsubscribed(e.target.checked)}
                className="rounded"
              />
              <UserMinus className="w-4 h-4" />
              הצג מוסרים
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={selectAll}
              className="text-sm px-4 py-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100"
            >
              בחר {Math.min(filteredCandidates.length, MAX_RECIPIENTS)} ראשונים
            </button>
            <button
              onClick={clearSelection}
              className="text-sm px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
            >
              נקה בחירה
            </button>
          </div>

          {/* Candidates List */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredCandidates.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                לא נמצאו מועמדים עם {mode === 'email' ? 'מייל' : 'טלפון'}
              </div>
            ) : (
              filteredCandidates.map(candidate => (
                <div
                  key={candidate.id}
                  onClick={() => toggleCandidate(candidate.id)}
                  className={`p-3 rounded-xl cursor-pointer border-2 transition-all ${
                    selectedCandidates.has(candidate.id)
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-transparent bg-gray-50 hover:bg-gray-100'
                  } ${candidate.unsubscribed ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-800 flex items-center gap-2">
                        {candidate.name}
                        {candidate.unsubscribed && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                            מוסר
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {mode === 'email' ? candidate.email : candidate.phone}
                        {candidate.city && ` • ${candidate.city}`}
                      </div>
                    </div>
                    {selectedCandidates.has(candidate.id) && (
                      <Check className="w-6 h-6 text-teal-500" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 text-sm text-gray-400 text-center">
            מציג {filteredCandidates.length} מועמדים
          </div>
        </div>

        {/* Right: Message Composer */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">✍️ הרכבת הודעה</h2>

            {/* Position selector */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">משרה (אופציונלי)</label>
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="w-full border rounded-xl px-4 py-3"
                title="בחר משרה"
              >
                <option value="">-- ללא משרה --</option>
                {positions.map(pos => (
                  <option key={pos.id} value={pos.id}>
                    {pos.title} ({pos.employer?.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Subject (email only) */}
            {mode === 'email' && (
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">נושא</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3"
                  placeholder="נושא המייל..."
                />
              </div>
            )}

            {/* Message */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                תוכן ההודעה
                <span className="text-gray-400 font-normal mr-2">
                  (השתמש ב-{'{name}'} ו-{'{position}'} להחלפה אוטומטית)
                </span>
              </label>
              
              {/* 🌟 תבניות מוכנות */}
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setSubject('👋 עדיין מחפשים עבודה? יש לנו משרות חדשות כל יום!')
                    setMessage(`שלום {name}! 👋

אנחנו מטוונטי טו ג'ובס, ורצינו לבדוק אם את/ה עדיין מחפש/ת עבודה.

כל יום מתחדשות אצלנו משרות חדשות! 🚀

יש לנו משרות בתחומים שונים:
• בנקאות ופיננסים
• שירות לקוחות ומוקדים
• לוגיסטיקה ומחסנאות
• מכירות ורכב
• ועוד...

אם את/ה מעוניין/ת לשמוע על הצעות, פשוט השיבו למייל הזה או התקשרו אלינו ב-055-9862658.

בהצלחה! 💪
צוות טוונטי טו ג'ובס`)
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium"
                >
                  <Heart className="w-4 h-4" />
                  <span>עדיין מחפשים?</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setSubject('🎯 הזדמנות תעסוקה חדשה מ-2טו-גדר!')
                    setMessage(`שלום {name}!

יש לנו הצעת עבודה מעולה עבורך!
${selectedPosition ? `משרה: {position}` : ''}

האם יש לך עניין לשמוע פרטים?

בברכה,
צוות טוונטי טו ג'ובס 🚀`)
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors font-medium"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>הצעת עבודה</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setSubject('✨ חדשות בטוונטי טו ג\'ובס!')
                    setMessage(`שלום {name}!

רצינו לעדכן אותך שהרחבנו את מאגר המעסיקים שלנו!

עכשיו אצלנו מעסיקים חדשים בבנקאות, שירות לקוחות, מכירות, לוגיסטיקה ועוד!

אשמח להתאים לך את המשרה המושלמת 💼

השיבו למייל הזה או התקשרו אלינו.

בהצלחה!
צוות טוונטי טו ג'ובס`)
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors font-medium"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>חדשות</span>
                </button>
              </div>
              
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={mode === 'email' ? 10 : 5}
                className="w-full border rounded-xl px-4 py-3 resize-none"
                placeholder="כתוב את ההודעה כאן..."
              />
              {mode === 'sms' && (
                <div className="text-sm text-gray-400 mt-1">
                  {message.length}/160 תווים | יתווסף: "🔕 להסרה השב 1"
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="text-sm font-bold text-gray-600 mb-2">תצוגה מקדימה:</div>
              <div className="text-sm whitespace-pre-wrap">
                {message
                  .replace(/{name}/g, 'ישראל ישראלי')
                  .replace(/{position}/g, positions.find(p => p.id === selectedPosition)?.title || 'משרה')}
                {mode === 'sms' && '\n\n🔕 להסרה השב 1'}
              </div>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {results && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Check className="w-6 h-6 text-green-500" />
                <span className="font-bold text-green-700">השליחה הושלמה!</span>
              </div>
              <div className="text-sm text-green-600 space-y-1">
                <div>נשלחו בהצלחה: {results.sent}</div>
                {results.failed > 0 && <div>נכשלו: {results.failed}</div>}
                {results.skippedUnsubscribed > 0 && <div>דילוג על מוסרים: {results.skippedUnsubscribed}</div>}
              </div>
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={sending || selectedCandidates.size === 0}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
              sending || selectedCandidates.size === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : mode === 'email'
                  ? 'bg-teal-700 text-white hover:shadow-sm hover:scale-[1.02]'
                  : 'bg-amber-600 text-white hover:shadow-sm hover:scale-[1.02]'
            }`}
          >
            {sending ? (
              <>
                <RefreshCw className="w-6 h-6 animate-spin" />
                שולח...
              </>
            ) : (
              <>
                <Send className="w-6 h-6" />
                שלח {mode === 'email' ? 'מייל' : 'SMS'} ל-{selectedCandidates.size} מועמדים
              </>
            )}
          </button>

          {/* Info Box */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
            <strong>טיפים:</strong>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>מועמדים שביקשו הסרה לא יקבלו הודעות</li>
              <li>ב-SMS יתווסף אוטומטית "להסרה השב 1"</li>
              <li>במייל יתווסף לינק הסרה בתחתית</li>
              <li>השתמש ב-{'{name}'} להחלפה אוטומטית בשם</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
