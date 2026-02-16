"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Settings, User, Bell, Shield, Database, Mail,
  Palette, Globe, Key, Save, Check, RefreshCw,
  Zap, MessageSquare, Upload, Brain, Clock, Sparkles
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
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <span className="font-medium">{label}</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
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
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            הגדרות מערכת
          </h1>
          <p className="text-muted-foreground mt-1">
            ניהול הגדרות המערכת - כל האפשרויות מופעלות ✅
          </p>
        </div>
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-blue-600 to-indigo-600"
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

      {/* סטטוס כל התכונות */}
      <Card className="p-6 mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
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
                className="flex items-center gap-2 p-3 bg-white rounded-lg border border-green-200"
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
              className="p-6 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Icon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">{section.title}</h3>
              <p className="text-sm text-muted-foreground">
                {section.description}
              </p>
            </Card>
          )
        })}
      </div>

      {/* הגדרות סינכרון מיילים */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
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
          
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">תדירות סנכרון</span>
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
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
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
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center">
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
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
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
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
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
              <Button variant="outline" size="sm">
                ערוך
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
