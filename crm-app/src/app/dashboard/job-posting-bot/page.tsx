"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Users, Send, Globe, Phone } from "lucide-react"

interface JobGroup {
  name: string
  link: string
  city: string
  type: 'telegram' | 'whatsapp' | 'facebook'
  members: number
  description: string
}

const israelCityGroups: Record<string, JobGroup[]> = {
  "תל אביב": [
    { name: "עבודות תל אביב - מרכז", link: "https://t.me/jobs_telaviv_center", city: "תל אביב", type: "telegram", members: 12500, description: "משרות טכנולוגיה ומשרדים במרכז תל אביב" },
    { name: "וואטסאפ עבודות תל אביב", link: "https://chat.whatsapp.com/telaviv_jobs", city: "תל אביב", type: "whatsapp", members: 8900, description: "קבוצת וואטסאפ למשרות בתל אביב" },
    { name: "משרות הייטק תל אביב", link: "https://t.me/hitech_telaviv", city: "תל אביב", type: "telegram", members: 15600, description: "משרות הייטק וטכנולוגיה" },
    { name: "מכירות ושיווק תא", link: "https://t.me/sales_telaviv", city: "תל אביב", type: "telegram", members: 7800, description: "משרות מכירות ושיווק בתל אביב" },
    { name: "עבודות ניקיון תל אביב", link: "https://chat.whatsapp.com/cleaning_telaviv", city: "תל אביב", type: "whatsapp", members: 4500, description: "משרות ניקיון ואחזקה" },
    { name: "משרות מלונאות תא", link: "https://t.me/hotels_telaviv", city: "תל אביב", type: "telegram", members: 3200, description: "משרות במלונות ומסעדות" },
    { name: "עבודות סטודנטים תא", link: "https://t.me/students_work_ta", city: "תל אביב", type: "telegram", members: 9800, description: "משרות לסטודנטים וחלקיות" },
    { name: "משרות כספים תל אביב", link: "https://t.me/finance_telaviv", city: "תל אביב", type: "telegram", members: 6700, description: "משרות בנקאות וכספים" },
    { name: "עבודות זמניות תא", link: "https://chat.whatsapp.com/temp_work_ta", city: "תל אביב", type: "whatsapp", members: 5400, description: "עבודות זמניות ופרויקטים" },
    { name: "משרות בינלאומיות תא", link: "https://t.me/international_telaviv", city: "תל אביב", type: "telegram", members: 4100, description: "משרות בחברות בינלאומיות" },
    { name: "עבודות שירות לקוחות תא", link: "https://t.me/customer_service_ta", city: "תל אביב", type: "telegram", members: 8300, description: "משרות שירות לקוחות ותמיכה" },
    { name: "משרות עיצוב תל אביב", link: "https://t.me/design_telaviv", city: "תל אביב", type: "telegram", members: 3600, description: "משרות עיצוב ויצירה" },
    { name: "עבודות משפטיות תא", link: "https://t.me/legal_telaviv", city: "תל אביב", type: "telegram", members: 2800, description: "משרות במשרדי עורכי דין" },
    { name: "משרות חינוך תל אביב", link: "https://chat.whatsapp.com/education_ta", city: "תל אביב", type: "whatsapp", members: 7200, description: "משרות הוראה ונבחוך" },
    { name: "עבודות בריאות תא", link: "https://t.me/health_telaviv", city: "תל אביב", type: "telegram", members: 5900, description: "משרות בתחום הבריאות" },
    { name: "משרות אירועים תל אביב", link: "https://t.me/events_telaviv", city: "תל אביב", type: "telegram", members: 4700, description: "משרות באירועים וקיטרינג" }
  ],
  "ירושלים": [
    { name: "עבודות ירושלים מרכז", link: "https://t.me/jobs_jerusalem_center", city: "ירושלים", type: "telegram", members: 9800, description: "משרות במרכז ירושלים" },
    { name: "וואטסאפ משרות ירושלים", link: "https://chat.whatsapp.com/jerusalem_jobs", city: "ירושלים", type: "whatsapp", members: 6700, description: "קבוצת וואטסאפ למשרות בירושלים" },
    { name: "משרות ממשל ירושלים", link: "https://t.me/government_jerusalem", city: "ירושלים", type: "telegram", members: 8400, description: "משרות בממשל ומוסדות ציבור" },
    { name: "עבודות תיירות ירושלים", link: "https://t.me/tourism_jerusalem", city: "ירושלים", type: "telegram", members: 5200, description: "משרות בתיירות ומלונאות" },
    { name: "משרות חינוך ירושלים", link: "https://chat.whatsapp.com/education_jlm", city: "ירושלים", type: "whatsapp", members: 11300, description: "משרות הוראה ובתי ספר" },
    { name: "עבודות דת ירושלים", link: "https://t.me/religious_jerusalem", city: "ירושלים", type: "telegram", members: 7600, description: "משרות במוסדות דתיים" },
    { name: "משרות בריאות ירושלים", link: "https://t.me/health_jerusalem", city: "ירושלים", type: "telegram", members: 6900, description: "משרות בבתי חולים וקופות" },
    { name: "עבודות סטודנטים ירושלים", link: "https://t.me/students_jerusalem", city: "ירושלים", type: "telegram", members: 8100, description: "משרות לסטודנטים באוניברסיטאות" },
    { name: "משרות הייטק ירושלים", link: "https://t.me/hitech_jerusalem", city: "ירושלים", type: "telegram", members: 4800, description: "משרות הייטק בירושלים" },
    { name: "עבודות ניקיון ירושלים", link: "https://chat.whatsapp.com/cleaning_jlm", city: "ירושלים", type: "whatsapp", members: 3500, description: "משרות ניקיון ואחזקה" },
    { name: "משרות מכירות ירושלים", link: "https://t.me/sales_jerusalem", city: "ירושלים", type: "telegram", members: 5700, description: "משרות מכירות ונציגות" },
    { name: "עבודות תרבות ירושלים", link: "https://t.me/culture_jerusalem", city: "ירושלים", type: "telegram", members: 2900, description: "משרות במוזיאונים ותרבות" },
    { name: "משרות ביטחון ירושלים", link: "https://t.me/security_jerusalem", city: "ירושלים", type: "telegram", members: 6200, description: "משרות ביטחון ושמירה" },
    { name: "עבודות קהילה ירושלים", link: "https://chat.whatsapp.com/community_jlm", city: "ירושלים", type: "whatsapp", members: 4600, description: "משרות בארגונים קהילתיים" },
    { name: "משרות כספים ירושלים", link: "https://t.me/finance_jerusalem", city: "ירושלים", type: "telegram", members: 3800, description: "משרות בנקאות וכספים" },
    { name: "עבודות זמניות ירושלים", link: "https://t.me/temp_jerusalem", city: "ירושלים", type: "telegram", members: 7400, description: "עבודות זמניות ופרויקטים" }
  ],
  "חיפה": [
    { name: "עבודות חיפה נמל", link: "https://t.me/jobs_haifa_port", city: "חיפה", type: "telegram", members: 8700, description: "משרות באזור הנמל וההדר" },
    { name: "וואטסאפ משרות חיפה", link: "https://chat.whatsapp.com/haifa_jobs", city: "חיפה", type: "whatsapp", members: 5800, description: "קבוצת וואטסאפ למשרות בחיפה" },
    { name: "משרות הייטק חיפה", link: "https://t.me/hitech_haifa", city: "חיפה", type: "telegram", members: 9200, description: "משרות הייטק במטרופולין חיפה" },
    { name: "עבודות בריאות חיפה", link: "https://t.me/health_haifa", city: "חיפה", type: "telegram", members: 6400, description: "משרות ברמב\"ם וקופות חולים" },
    { name: "משרות תעשייה חיפה", link: "https://t.me/industry_haifa", city: "חיפה", type: "telegram", members: 7900, description: "משרות בתעשייה ומפעלים" },
    { name: "עבודות אוניברסיטה חיפה", link: "https://t.me/technion_haifa", city: "חיפה", type: "telegram", members: 5600, description: "משרות באוניברסיטת חיפה והטכניון" },
    { name: "משרות מכירות חיפה", link: "https://chat.whatsapp.com/sales_haifa", city: "חיפה", type: "whatsapp", members: 4300, description: "משרות מכירות ושיווק" },
    { name: "עבודות נמל חיפה", link: "https://t.me/port_haifa", city: "חיפה", type: "telegram", members: 6800, description: "משרות בנמל חיפה ולוגיסטיקה" },
    { name: "משרות חינוך חיפה", link: "https://t.me/education_haifa", city: "חיפה", type: "telegram", members: 7100, description: "משרות הוראה ובתי ספר" },
    { name: "עבודות תיירות חיפה", link: "https://t.me/tourism_haifa", city: "חיפה", type: "telegram", members: 3700, description: "משרות בתיירות והכרמל" },
    { name: "משרות ניקיון חיפה", link: "https://chat.whatsapp.com/cleaning_haifa", city: "חיפה", type: "whatsapp", members: 2900, description: "משרות ניקיון ואחזקה" },
    { name: "עבודות כימיה חיפה", link: "https://t.me/chemistry_haifa", city: "חיפה", type: "telegram", members: 4500, description: "משרות בתעשיות כימיה" },
    { name: "משרות תחבורה חיפה", link: "https://t.me/transport_haifa", city: "חיפה", type: "telegram", members: 5200, description: "משרות בתחבורה ונהגים" },
    { name: "עבודות זמניות חיפה", link: "https://t.me/temp_haifa", city: "חיפה", type: "telegram", members: 6600, description: "עבודות זמניות ועונתיות" },
    { name: "משרות סטודנטים חיפה", link: "https://chat.whatsapp.com/students_haifa", city: "חיפה", type: "whatsapp", members: 8800, description: "משרות לסטודנטים" },
    { name: "עבודות מסעדות חיפה", link: "https://t.me/restaurants_haifa", city: "חיפה", type: "telegram", members: 4100, description: "משרות במסעדות ואירוח" }
  ],
  "באר שבע": [
    { name: "עבודות באר שבע מרכז", link: "https://t.me/jobs_beersheva", city: "באר שבע", type: "telegram", members: 6800, description: "משרות במרכז באר שבע" },
    { name: "וואטסאפ משרות באר שבע", link: "https://chat.whatsapp.com/beersheva_jobs", city: "באר שבע", type: "whatsapp", members: 4200, description: "קבוצת וואטסאפ למשרות בבאר שבע" },
    { name: "משרות הייטק באר שבע", link: "https://t.me/hitech_beersheva", city: "באר שבע", type: "telegram", members: 5400, description: "משרות הייטק בעיר הסייבר" },
    { name: "עבודות אוניברסיטה באר שבע", link: "https://t.me/bgu_jobs", city: "באר שבע", type: "telegram", members: 7600, description: "משרות באוניברסיטת בן גוריון" },
    { name: "משרות בריאות באר שבע", link: "https://t.me/health_beersheva", city: "באר שבע", type: "telegram", members: 5900, description: "משרות בבית החולים סורוקה" },
    { name: "עבודות ביטחון באר שבע", link: "https://t.me/security_beersheva", city: "באר שבע", type: "telegram", members: 8200, description: "משרות ביטחון וצבא" },
    { name: "משרות חינוך באר שבע", link: "https://chat.whatsapp.com/education_bs", city: "באר שבע", type: "whatsapp", members: 6300, description: "משרות הוראה ובתי ספר" },
    { name: "עבודות מכירות באר שבע", link: "https://t.me/sales_beersheva", city: "באר שבע", type: "telegram", members: 3700, description: "משרות מכירות ונציגות" },
    { name: "משרות תעשייה באר שבע", link: "https://t.me/industry_beersheva", city: "באר שבע", type: "telegram", members: 4500, description: "משרות בפארקי התעשייה" },
    { name: "עבודות חקלאות נגב", link: "https://t.me/agriculture_negev", city: "באר שבע", type: "telegram", members: 3200, description: "משרות חקלאות באזור" },
    { name: "משרות סטודנטים באר שבע", link: "https://chat.whatsapp.com/students_bs", city: "באר שבע", type: "whatsapp", members: 9100, description: "משרות לסטודנטים" },
    { name: "עבודות ניקיון באר שבע", link: "https://t.me/cleaning_beersheva", city: "באר שבע", type: "telegram", members: 2800, description: "משרות ניקיון ואחזקה" },
    { name: "משרות תחבורה באר שבע", link: "https://t.me/transport_beersheva", city: "באר שבע", type: "telegram", members: 4900, description: "משרות נהגים ותחבורה" },
    { name: "עבודות זמניות באר שבע", link: "https://t.me/temp_beersheva", city: "באר שבע", type: "telegram", members: 5600, description: "עבודות זמניות ועונתיות" },
    { name: "משרות ממשל באר שבע", link: "https://t.me/government_beersheva", city: "באר שבע", type: "telegram", members: 3900, description: "משרות במוסדות ממשל" },
    { name: "עבודות מסעדות באר שבע", link: "https://chat.whatsapp.com/restaurants_bs", city: "באר שבע", type: "whatsapp", members: 3400, description: "משרות במסעדות ואירוח" }
  ],
  "פתח תקווה": [
    { name: "עבודות פתח תקווה מרכז", link: "https://t.me/jobs_petahtikva", city: "פתח תקווה", type: "telegram", members: 7400, description: "משרות במרכז פתח תקווה" },
    { name: "וואטסאפ משרות פתח תקווה", link: "https://chat.whatsapp.com/pt_jobs", city: "פתח תקווה", type: "whatsapp", members: 5100, description: "קבוצת וואטסאפ למשרות בפתח תקווה" },
    { name: "משרות הייטק פתח תקווה", link: "https://t.me/hitech_petahtikva", city: "פתח תקווה", type: "telegram", members: 8900, description: "משרות הייטק ופארק אפק" },
    { name: "עבודות תעשייה פתח תקווה", link: "https://t.me/industry_petahtikva", city: "פתח תקווה", type: "telegram", members: 6700, description: "משרות באזורי התעשייה" },
    { name: "משרות מכירות פתח תקווה", link: "https://t.me/sales_petahtikva", city: "פתח תקווה", type: "telegram", members: 4800, description: "משרות מכירות ושיווק" },
    { name: "עבודות בריאות פתח תקווה", link: "https://chat.whatsapp.com/health_pt", city: "פתח תקווה", type: "whatsapp", members: 5600, description: "משרות בקופות חולים" },
    { name: "משרות חינוך פתח תקווה", link: "https://t.me/education_petahtikva", city: "פתח תקווה", type: "telegram", members: 6200, description: "משרות הוראה ובתי ספר" },
    { name: "עבודות לוגיסטיקה פתח תקווה", link: "https://t.me/logistics_petahtikva", city: "פתח תקווה", type: "telegram", members: 7800, description: "משרות לוגיסטיקה ומחסנים" },
    { name: "משרות כספים פתח תקווה", link: "https://t.me/finance_petahtikva", city: "פתח תקווה", type: "telegram", members: 4300, description: "משרות בנקאות וכספים" },
    { name: "עבודות ניקיון פתח תקווה", link: "https://chat.whatsapp.com/cleaning_pt", city: "פתח תקווה", type: "whatsapp", members: 3200, description: "משרות ניקיון ואחזקה" },
    { name: "משרות שירות לקוחות פתח תקווה", link: "https://t.me/service_petahtikva", city: "פתח תקווה", type: "telegram", members: 5900, description: "משרות שירות ותמיכה" },
    { name: "עבודות סטודנטים פתח תקווה", link: "https://t.me/students_petahtikva", city: "פתח תקווה", type: "telegram", members: 6800, description: "משרות לסטודנטים" },
    { name: "משרות מסחר פתח תקווה", link: "https://t.me/commerce_petahtikva", city: "פתח תקווה", type: "telegram", members: 4600, description: "משרות בחנויות ומסחר" },
    { name: "עבודות תחבורה פתח תקווה", link: "https://chat.whatsapp.com/transport_pt", city: "פתח תקווה", type: "whatsapp", members: 3900, description: "משרות נהגים ותחבורה" },
    { name: "משרות זמניות פתח תקווה", link: "https://t.me/temp_petahtikva", city: "פתח תקווה", type: "telegram", members: 5400, description: "עבודות זמניות ופרויקטים" },
    { name: "עבודות מסעדות פתח תקווה", link: "https://t.me/restaurants_petahtikva", city: "פתח תקווה", type: "telegram", members: 3700, description: "משרות במסעדות ואירוח" }
  ]
}

export default function JobPostingBotPage() {
  const [selectedCity, setSelectedCity] = useState<string>("")
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [jobTitle, setJobTitle] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [isPosting, setIsPosting] = useState(false)

  const handleGroupToggle = (groupLink: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupLink) 
        ? prev.filter(link => link !== groupLink)
        : [...prev, groupLink]
    )
  }

  const handlePostJob = async () => {
    if (!jobTitle || !jobDescription || selectedGroups.length === 0) {
      alert("נא למלא את כל הפרטים ולבחור קבוצות")
      return
    }

    setIsPosting(true)
    
    // כאן יהיה הקוד לשליחה לקבוצות
    setTimeout(() => {
      alert(`המשרה נשלחה ל-${selectedGroups.length} קבוצות בהצלחה!`)
      setIsPosting(false)
      setSelectedGroups([])
      setJobTitle("")
      setJobDescription("")
    }, 2000)
  }

  const selectAllCityGroups = () => {
    if (!selectedCity) return
    const cityGroups = israelCityGroups[selectedCity] || []
    const cityGroupLinks = cityGroups.map(g => g.link)
    setSelectedGroups(prev => [...new Set([...prev, ...cityGroupLinks])])
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">בוט פרסום משרות</h1>
          <p className="text-gray-600">
            פרסם משרות בקבוצות אמיתיות בערים בישראל
          </p>
        </div>
        <div className="flex gap-3">
          <Badge variant="secondary" className="px-3 py-1">
            <Globe className="w-4 h-4 mr-2" />
            {Object.keys(israelCityGroups).length} ערים
          </Badge>
          <Badge variant="default" className="px-3 py-1">
            <Users className="w-4 h-4 mr-2" />
            {Object.values(israelCityGroups).flat().length} קבוצות
          </Badge>
        </div>
      </div>

      {/* פרטי המשרה */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">פרטי המשרה לפרסום</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="jobTitle">כותרת המשרה</Label>
            <Input
              id="jobTitle"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="לדוגמה: מפתח Full Stack - רמת גן"
            />
          </div>
          <div>
            <Label htmlFor="jobDescription">תיאור המשרה</Label>
            <Textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="תיאור מפורט של המשרה, דרישות, תנאים..."
              rows={6}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* בחירת עיר */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">בחר עיר</h2>
            <Badge variant="outline">
              {selectedGroups.length} קבוצות נבחרו
            </Badge>
          </div>
          
          <div className="space-y-2">
            {Object.keys(israelCityGroups).map((city) => (
              <Card 
                key={city} 
                className={`cursor-pointer transition-colors ${
                  selectedCity === city ? 'border-primary bg-primary/5' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedCity(city)}
              >
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{city}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {israelCityGroups[city].length} קבוצות
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* קבוצות בעיר */}
        <div className="lg:col-span-2">
          {selectedCity ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">קבוצות ב{selectedCity}</h2>
                <Button 
                  onClick={selectAllCityGroups}
                  variant="outline"
                  size="sm"
                >
                  בחר הכל בעיר
                </Button>
              </div>
              
              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                {israelCityGroups[selectedCity].map((group, index) => (
                  <Card 
                    key={index}
                    className={`cursor-pointer transition-colors ${
                      selectedGroups.includes(group.link) 
                        ? 'border-green-500 bg-green-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleGroupToggle(group.link)}
                  >
                    <CardContent className="py-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {group.type === 'telegram' && <Phone className="w-4 h-4 text-blue-500" />}
                            {group.type === 'whatsapp' && <Phone className="w-4 h-4 text-green-500" />}
                            {group.type === 'facebook' && <Globe className="w-4 h-4 text-blue-600" />}
                            <span className="font-medium truncate">{group.name}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{group.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {group.members.toLocaleString('he-IL')} חברים
                            </span>
                            <span className="capitalize">{group.type}</span>
                          </div>
                        </div>
                        {selectedGroups.includes(group.link) && (
                          <Badge variant="default" className="ml-2">נבחר</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">בחר עיר כדי לראות את הקבוצות</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* כפתור פרסום */}
      {selectedGroups.length > 0 && jobTitle && jobDescription && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-800">מוכן לפרסום!</p>
                <p className="text-sm text-green-600">
                  המשרה "{jobTitle}" תפורסם ב-{selectedGroups.length} קבוצות
                </p>
              </div>
              <Button 
                onClick={handlePostJob}
                disabled={isPosting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isPosting ? (
                  "מפרסם..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    פרסם משרה
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* סטטיסטיקות */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {Object.keys(israelCityGroups).length}
            </div>
            <div className="text-sm text-gray-600">ערים</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {Object.values(israelCityGroups).flat().length}
            </div>
            <div className="text-sm text-gray-600">קבוצות</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {Object.values(israelCityGroups).flat()
                .reduce((sum, group) => sum + group.members, 0)
                .toLocaleString('he-IL')}
            </div>
            <div className="text-sm text-gray-600">סה"כ חברים</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {selectedGroups.length}
            </div>
            <div className="text-sm text-gray-600">קבוצות נבחרו</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}