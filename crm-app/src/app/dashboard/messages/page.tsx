"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Mail, Send, Inbox, Archive, Trash2, Star,
  User, Calendar, Paperclip
} from "lucide-react"

export default function MessagesPage() {
  const messages = [
    {
      id: "1",
      from: "דוד לוי",
      subject: "תשובה לגבי המשרה",
      preview: "שלום, אשמח לקבל מידע נוסף לגבי המשרה...",
      date: "היום 14:30",
      unread: true,
      starred: false,
      hasAttachment: true,
    },
    {
      id: "2",
      from: "שרה כהן",
      subject: "זמינות לראיון",
      preview: "תודה על ההזמנה לראיון. אני זמינה ביום...",
      date: "היום 11:20",
      unread: true,
      starred: true,
      hasAttachment: false,
    },
    {
      id: "3",
      from: "מיכל אברהם",
      subject: "קורות חיים מעודכנים",
      preview: "מצורף קורות החיים המעודכנים שלי...",
      date: "אתמול",
      unread: false,
      starred: false,
      hasAttachment: true,
    },
    {
      id: "4",
      from: "יוסי גולן",
      subject: "תודה על הראיון",
      preview: "רציתי להודות על הראיון המעניין...",
      date: "לפני יומיים",
      unread: false,
      starred: false,
      hasAttachment: false,
    },
  ]

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            הודעות
          </h1>
          <p className="text-muted-foreground mt-1">
            {messages.filter(m => m.unread).length} הודעות חדשות
          </p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
          <Send className="ml-2 h-4 w-4" />
          הודעה חדשה
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4 border-r-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">נכנס</p>
              <p className="text-3xl font-bold text-blue-600">{messages.length}</p>
            </div>
            <Inbox className="h-8 w-8 text-blue-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 border-r-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">לא נקראו</p>
              <p className="text-3xl font-bold text-yellow-600">
                {messages.filter(m => m.unread).length}
              </p>
            </div>
            <Mail className="h-8 w-8 text-yellow-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 border-r-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">מסומנים בכוכב</p>
              <p className="text-3xl font-bold text-purple-600">
                {messages.filter(m => m.starred).length}
              </p>
            </div>
            <Star className="h-8 w-8 text-purple-600 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 border-r-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">נשלחו היום</p>
              <p className="text-3xl font-bold text-green-600">8</p>
            </div>
            <Send className="h-8 w-8 text-green-600 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Messages List */}
      <Card>
        <div className="p-6 border-b flex items-center gap-4">
          <h2 className="text-xl font-semibold flex-1">תיבת הדואר</h2>
          <Button variant="outline" size="sm">
            <Archive className="ml-2 h-4 w-4" />
            ארכיון
          </Button>
          <Button variant="outline" size="sm">
            <Trash2 className="ml-2 h-4 w-4" />
            מחק
          </Button>
        </div>
        
        <div className="divide-y">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                message.unread ? "bg-blue-50" : ""
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-blue-600" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-semibold ${message.unread ? "text-blue-600" : ""}`}>
                      {message.from}
                    </span>
                    {message.unread && (
                      <Badge className="bg-blue-600 text-white">חדש</Badge>
                    )}
                    {message.starred && (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    )}
                    {message.hasAttachment && (
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  
                  <h3 className={`font-medium mb-1 ${message.unread ? "font-semibold" : ""}`}>
                    {message.subject}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground truncate">
                    {message.preview}
                  </p>
                </div>

                {/* Date */}
                <div className="text-sm text-muted-foreground flex-shrink-0">
                  {message.date}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
