"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Settings, User, Bell, Shield, Database, Mail,
  Palette, Globe, Key, Save, Check, RefreshCw,
  Zap, MessageSquare, Upload, Brain, Clock, Sparkles,
  Lock, Eye, EyeOff
} from "lucide-react"

// הגדרות ברירת מחדל
const DEFAULT_SETTINGS = {
  // התראות
  notifyNewCandidate: true,
  notifyInterviewReminder: true,
  notifyTaskAssigned: true,
  notifyNewMessage: true,
  notifyWeeklyReport: true,
  notifyCandidateUpdates: true,
  
  // אוטומציה
  autoEmailScanner: true,
  emailScanInterval: 3, // שעות
  autoAnalyzeCV: true,
  autoMatchPositions: true,
  autoSendConfirmation: false,
  
  // AI
  aiEnabled: true,
  aiMatchingEnabled: true,
  aiCVAnalysis: true,
  aiSuggestPositions: true,
  
  // כללי
  language: 'he',
  timezone: 'Asia/Jerusalem',
  darkMode: false,
  compactView: false,
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // סטייט לשינוי סיסמה
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordChanging, setPasswordChanging] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState("")
  const [passwordError, setPasswordError] = useState("")

  // טעינת הגדרות מ-localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('crm_settings')
    if (savedSettings) {
      setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) })
    }
  }, [])

  // שמירת הגדרות
  const handleSave = () => {
    setSaving(true)
    localStorage.setItem('crm_settings', JSON.stringify(settings))
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }, 500)
  }

  // עדכון הגדרה בודדת
  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  // 🔑 שינוי סיסמה
  const handlePasswordChange = async () => {
    setPasswordMessage("")
    setPasswordError("")

    if (!currentPassword || !newPassword) {
      setPasswordError("יש למלא סיסמה נוכחית וסיסמה חדשה")
      return
    }
    if (newPassword.length < 6) {
      setPasswordError("הסיסמה החדשה חייבת להכיל לפחות 6 תווים")
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("הסיסמאות החדשות לא תואמות")
      return
    }

    setPasswordChanging(true)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      
      if (res.ok) {
        setPasswordMessage(data.message || "הסיסמה שונתה בהצלחה! ✅")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        setPasswordError(data.error || "שגיאה בשינוי הסיסמה")
      }
    } catch {
      setPasswordError("שגיאת חיבור לשרת")
    } finally {
      setPasswordChanging(false)
    }
  }

  // Toggle component
  const Toggle = ({ 
    checked, 
    onChange, 
    label 
  }: { 
    checked: boolean, 
    onChange: (val: boolean) => void
    label: string 
  }) => (
    <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50/80 transition-all duration-200">
      <span className="font-medium text-slate-700">{label}</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-teal-500 peer-checked:to-[#06B6D4]"></div>
      </label>
    </div>
  )

  const settingsSections = [
    {
      icon: Mail,
      title: "סריקת מיילים",
      description: "סריקה אוטומטית של קורות חיים",
      badge: "פעיל",
      badgeColor: "bg-green-500"
    },
    {
      icon: Brain,
      title: "ניתוח AI",
      description: "ניתוח קורות חיים עם Gemini AI",
      badge: "פעיל",
      badgeColor: "bg-green-500"
    },
    {
      icon: Zap,
      title: "התאמה חכמה",
      description: "התאמת מועמדים למשרות",
      badge: "פעיל",
      badgeColor: "bg-green-500"
    },
    {
      icon: MessageSquare,
      title: "SMS/WhatsApp",
      description: "שליחת הודעות למועמדים",
      badge: "פעיל",
      badgeColor: "bg-green-500"
    },
    {
      icon: Upload,
      title: "העלאה המונית",
      description: "העלאת קורות חיים מרובים",
      badge: "פעיל",
      badgeColor: "bg-green-500"
    },
    {
      icon: Clock,
      title: "סנכרון אוטומטי",
      description: "סנכרון כל 3 שעות",
      badge: "פעיל",
      badgeColor: "bg-green-500"
    },
    {
      icon: Database,
      title: "גיבוי נתונים",
      description: "גיבוי אוטומטי יומי",
      badge: "פעיל",
      badgeColor: "bg-green-500"
    },
    {
      icon: Sparkles,
      title: "הכנסת מועמד AI",
      description: "הכנסה חכמה עם זיהוי אוטומטי",
      badge: "פעיל",
      badgeColor: "bg-green-500"
    },
  ]

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-gradient-to-l from-[#0f0b2e] via-[#1a1444] to-[#0f0b2e] rounded-2xl p-6 md:p-8 shadow-xl border border-white/5 mb-8">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="settingsGrid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(96,165,250,0.3)" strokeWidth="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#settingsGrid)"/></svg>
        </div>
        <div className="absolute top-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
              הגדרות מערכת
            </h1>
            <p className="text-slate-400 mt-1">
              ניהול הגדרות המערכת - כל האפשרויות מופעלות ✅
            </p>
          </div>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20 rounded-xl"
          >
            {saving ? (
              <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="ml-2 h-4 w-4" />
            ) : (
              <Save className="ml-2 h-4 w-4" />
            )}
            {saving ? 'שומר...' : saved ? 'נשמר!' : 'שמור הגדרות'}
          </Button>
        </div>
      </div>

      {/* 🔑 שינוי סיסמה */}
      <Card className="p-6 mb-6 bg-white/90 backdrop-blur-md border-slate-100 rounded-2xl shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl flex items-center justify-center shadow-md shadow-red-500/20">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">שינוי סיסמה</h2>
            <p className="text-sm text-muted-foreground">
              שנה את סיסמת ההתחברות שלך
            </p>
          </div>
        </div>

        <div className="space-y-4 max-w-md">
          {/* סיסמה נוכחית */}
          <div>
            <Label className="text-slate-700 font-medium">סיסמה נוכחית</Label>
            <div className="relative mt-1">
              <Input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="הזן סיסמה נוכחית"
                className="pl-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* סיסמה חדשה */}
          <div>
            <Label className="text-slate-700 font-medium">סיסמה חדשה</Label>
            <div className="relative mt-1">
              <Input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="הזן סיסמה חדשה (לפחות 6 תווים)"
                className="pl-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* אימות סיסמה חדשה */}
          <div>
            <Label className="text-slate-700 font-medium">אימות סיסמה חדשה</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="הזן שוב את הסיסמה החדשה"
              className="mt-1"
            />
          </div>

          {/* הודעות */}
          {passwordError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              ❌ {passwordError}
            </div>
          )}
          {passwordMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
              {passwordMessage}
            </div>
          )}

          <Button
            onClick={handlePasswordChange}
            disabled={passwordChanging}
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 shadow-lg shadow-red-500/20 rounded-xl"
          >
            {passwordChanging ? (
              <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Key className="ml-2 h-4 w-4" />
            )}
            {passwordChanging ? 'משנה...' : 'שנה סיסמה'}
          </Button>
        </div>
      </Card>

      {/* סטטוס כל התכונות */}
      <Card className="p-6 mb-6 bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-md border-green-200/60 rounded-2xl shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-green-500/20">
            <Check className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-green-800">כל התכונות מופעלות!</h2>
            <p className="text-sm text-green-600">
              המערכת פועלת במלוא העוצמה
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {settingsSections.map((section) => {
            const Icon = section.icon
            return (
              <div
                key={section.title}
                className="flex items-center gap-2 p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-green-200/60 hover:shadow-sm transition-all duration-200"
              >
                <Icon className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{section.title}</div>
                </div>
                <Badge className={`${section.badgeColor} text-white text-xs`}>
                  {section.badge}
                </Badge>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: User, title: "פרופיל אישי", description: "עדכון פרטים אישיים ותמונת פרופיל" },
          { icon: Bell, title: "התראות", description: "הגדרות התראות ועדכונים" },
          { icon: Shield, title: "הרשאות", description: "ניהול הרשאות משתמשים" },
          { icon: Database, title: "גיבוי נתונים", description: "ייצוא וייבוא נתונים" },
          { icon: Mail, title: "תבניות אימייל", description: "ניהול תבניות אימייל אוטומטיות" },
          { icon: Palette, title: "מראה וצבעים", description: "התאמה אישית של הממשק" },
          { icon: Globe, title: "שפה ואזור", description: "הגדרות שפה ואזור זמן" },
          { icon: Key, title: "API ואינטגרציות", description: "חיבורים למערכות חיצוניות" },
        ].map((section) => {
          const Icon = section.icon
          return (
            <Card
              key={section.title}
              className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group bg-white/90 backdrop-blur-md border-slate-100 rounded-2xl shadow-md relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ring-1 ring-blue-200/50">
                <Icon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2 text-slate-800">{section.title}</h3>
              <p className="text-sm text-muted-foreground">
                {section.description}
              </p>
            </Card>
          )
        })}
      </div>

      {/* הגדרות סינכרון מיילים */}
      <Card className="p-6 mb-6 bg-white/90 backdrop-blur-md border-slate-100 rounded-2xl shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-md shadow-purple-500/20">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">סנכרון קורות חיים מהמייל</h2>
            <p className="text-sm text-muted-foreground">
              סנכרון אוטומטי כל 3 שעות - קורות חיים מועלים אוטומטית למערכת
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Toggle 
            checked={settings.autoEmailScanner}
            onChange={(val) => updateSetting('autoEmailScanner', val)}
            label="הפעל סריקת מיילים אוטומטית"
          />
          <Toggle 
            checked={settings.autoAnalyzeCV}
            onChange={(val) => updateSetting('autoAnalyzeCV', val)}
            label="נתח קורות חיים אוטומטית עם AI"
          />
          <Toggle 
            checked={settings.autoMatchPositions}
            onChange={(val) => updateSetting('autoMatchPositions', val)}
            label="התאם אוטומטית למשרות מתאימות"
          />
          
          <div className="p-4 border border-slate-100 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700">תדירות סנכרון</span>
              <div className="flex items-center gap-2">
                <Input 
                  type="number"
                  value={settings.emailScanInterval}
                  onChange={(e) => updateSetting('emailScanInterval', parseInt(e.target.value))}
                  className="w-20"
                  min={1}
                  max={24}
                />
                <span className="text-muted-foreground">שעות</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* הגדרות התראות */}
      <Card className="p-6 mb-6 bg-white/90 backdrop-blur-md border-slate-100 rounded-2xl shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md shadow-amber-500/20">
            <Bell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">הגדרות התראות</h2>
            <p className="text-sm text-muted-foreground">
              בחר אילו התראות תרצה לקבל
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Toggle 
            checked={settings.notifyNewCandidate}
            onChange={(val) => updateSetting('notifyNewCandidate', val)}
            label="מועמד חדש נרשם"
          />
          <Toggle 
            checked={settings.notifyInterviewReminder}
            onChange={(val) => updateSetting('notifyInterviewReminder', val)}
            label="ראיון מתקרב (24 שעות לפני)"
          />
          <Toggle 
            checked={settings.notifyTaskAssigned}
            onChange={(val) => updateSetting('notifyTaskAssigned', val)}
            label="משימה חדשה הוקצתה לי"
          />
          <Toggle 
            checked={settings.notifyNewMessage}
            onChange={(val) => updateSetting('notifyNewMessage', val)}
            label="הודעה חדשה התקבלה"
          />
          <Toggle 
            checked={settings.notifyWeeklyReport}
            onChange={(val) => updateSetting('notifyWeeklyReport', val)}
            label="דוח שבועי"
          />
          <Toggle 
            checked={settings.notifyCandidateUpdates}
            onChange={(val) => updateSetting('notifyCandidateUpdates', val)}
            label="עדכונים על מועמדים שעוקב אחריהם"
          />
        </div>
      </Card>

      {/* הגדרות AI */}
      <Card className="p-6 mb-6 bg-white/90 backdrop-blur-md border-slate-100 rounded-2xl shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-violet-500/20">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">הגדרות AI (בינה מלאכותית)</h2>
            <p className="text-sm text-muted-foreground">
              הפעלת יכולות AI מתקדמות
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Toggle 
            checked={settings.aiEnabled}
            onChange={(val) => updateSetting('aiEnabled', val)}
            label="הפעל AI במערכת"
          />
          <Toggle 
            checked={settings.aiMatchingEnabled}
            onChange={(val) => updateSetting('aiMatchingEnabled', val)}
            label="התאמה חכמה עם AI"
          />
          <Toggle 
            checked={settings.aiCVAnalysis}
            onChange={(val) => updateSetting('aiCVAnalysis', val)}
            label="ניתוח קורות חיים עם Gemini"
          />
          <Toggle 
            checked={settings.aiSuggestPositions}
            onChange={(val) => updateSetting('aiSuggestPositions', val)}
            label="הצעות משרות אוטומטיות"
          />
        </div>
      </Card>

      {/* תבניות אימייל */}
      <Card className="p-6 bg-white/90 backdrop-blur-md border-slate-100 rounded-2xl shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-green-500/20">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">תבניות אימייל</h2>
            <p className="text-sm text-muted-foreground">
              נהל תבניות אימייל אוטומטיות
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { name: "אימייל ברוכים הבאים למועמדים", status: "פעיל" },
            { name: "הזמנה לראיון", status: "פעיל" },
            { name: "דחייה מנומסת", status: "פעיל" },
            { name: "הצעת עבודה", status: "פעיל" },
            { name: "תזכורת לראיון", status: "פעיל" },
            { name: "אישור קליטה", status: "פעיל" },
          ].map((template, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50/80 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{template.name}</p>
                  <p className="text-sm text-muted-foreground">
                    סטטוס: <span className="text-green-600">{template.status}</span>
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl border-slate-200 hover:border-blue-300 hover:bg-blue-50/50">
                ערוך
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
