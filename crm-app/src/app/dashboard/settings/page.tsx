"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Settings, User, Bell, Shield, Database, Mail,
  Palette, Globe, Key, Save
} from "lucide-react"

export default function SettingsPage() {
  const settingsSections = [
    {
      icon: User,
      title: "פרופיל אישי",
      description: "עדכון פרטים אישיים ותמונת פרופיל",
    },
    {
      icon: Bell,
      title: "התראות",
      description: "הגדרות התראות ועדכונים",
    },
    {
      icon: Shield,
      title: "הרשאות",
      description: "ניהול הרשאות משתמשים",
    },
    {
      icon: Database,
      title: "גיבוי נתונים",
      description: "ייצוא וייבוא נתונים",
    },
    {
      icon: Mail,
      title: "תבניות אימייל",
      description: "ניהול תבניות אימייל אוטומטיות",
    },
    {
      icon: Palette,
      title: "מראה וצבעים",
      description: "התאמה אישית של הממשק",
    },
    {
      icon: Globe,
      title: "שפה ואזור",
      description: "הגדרות שפה ואזור זמן",
    },
    {
      icon: Key,
      title: "API ואינטגרציות",
      description: "חיבורים למערכות חיצוניות",
    },
  ]

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            הגדרות
          </h1>
          <p className="text-muted-foreground mt-1">
            ניהול הגדרות המערכת והעדפות אישיות
          </p>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {settingsSections.map((section) => {
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

      {/* Profile Settings */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">פרטים אישיים</h2>
            <p className="text-sm text-muted-foreground">
              עדכון המידע האישי שלך
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">שם מלא</Label>
            <Input id="name" defaultValue="Admin User" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">אימייל</Label>
            <Input id="email" type="email" defaultValue="admin@twenty2crm.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">טלפון</Label>
            <Input id="phone" defaultValue="050-1234567" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">תפקיד</Label>
            <Input id="role" defaultValue="מנהל מערכת" disabled />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline">ביטול</Button>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
            <Save className="ml-2 h-4 w-4" />
            שמור שינויים
          </Button>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
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
          {[
            { label: "מועמד חדש נרשם", enabled: true },
            { label: "ראיון מתקרב (24 שעות לפני)", enabled: true },
            { label: "משימה חדשה הוקצתה לי", enabled: true },
            { label: "הודעה חדשה התקבלה", enabled: false },
            { label: "דוח שבועי", enabled: true },
            { label: "עדכונים על מועמדים שעוקב אחריהם", enabled: true },
          ].map((notification, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <span className="font-medium">{notification.label}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={notification.enabled}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Email Templates */}
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
            { name: "דחייה מנומסת", status: "טיוטה" },
            { name: "הצעת עבודה", status: "פעיל" },
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
                    סטטוס: {template.status}
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
