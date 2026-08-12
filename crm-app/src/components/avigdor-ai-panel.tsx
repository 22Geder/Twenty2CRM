"use client"

import React, { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Send, Loader2, Sparkles, Paperclip, FileText } from "lucide-react"
import { StarryBg } from "@/components/starry-bg"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

// 🦁 פאנל ה-AI הפנימי "אביגדור" - עמודה קבועה בצד שמאל של המסך, תמיד פתוחה וזמינה לשיחה.
// אותה אישיות/מוח כמו הבוט הטלפוני של החברה, כאן לשימוש הצוות הפנימי בתוך ה-CRM:
// חיפוש משרות/מועמדים בשפה חופשית + העלאת קורות חיים לניתוח אוטומטי והמלצת משרות.
export function AvigdorAiPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "היי, אני אביגדור 🦁 תגיד לי איזו משרה אתה צריך (ובאיזה איזור), תבקש ממני למצוא מועמד מתאים, או פשוט תעלה לי קובץ קורות חיים 📎 ואני אנתח אותו, אשמור אותו במערכת ואמליץ לך על המשרות הכי מתאימות.",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, loading])

  const pushAssistant = (content: string) =>
    setMessages(prev => [...prev, { role: "assistant", content }])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }]
    setMessages(nextMessages)
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/avigdor-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: nextMessages }),
      })
      const data = await res.json()
      pushAssistant(data.reply || "מצטער, לא הצלחתי לענות כרגע.")
    } catch {
      pushAssistant("הייתה בעיה בתקשורת עם השרת, נסה שוב בבקשה.")
    } finally {
      setLoading(false)
    }
  }

  // 📎 העלאת קורות חיים → ניתוח, שמירה במערכת והמלצת משרות (דרך /api/upload)
  const handleFile = async (file: File) => {
    if (!file || loading) return
    setMessages(prev => [...prev, { role: "user", content: `📎 העליתי קובץ: ${file.name}` }])
    setLoading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("forceUpdate", "true") // עדכן מועמד קיים במקום לחסום על כפילות

      const res = await fetch("/api/upload", { method: "POST", body: form })
      const data = await res.json()

      if (!res.ok || data?.success === false) {
        pushAssistant(data?.error || data?.message || "לא הצלחתי לעבד את הקובץ. נסה קובץ PDF או תמונה ברורה.")
        return
      }

      const cand = data.candidate || {}
      const name = cand.name && cand.name !== "לא זוהה" ? cand.name : "המועמד"
      const title = cand.currentTitle && cand.currentTitle !== "לא זוהה" ? cand.currentTitle : null
      const city = cand.city && cand.city !== "לא זוהה" ? cand.city : null
      const matches: Array<{ title: string; employer?: string; location?: string }> = data.matchingPositions || []

      let reply = `סיימתי לנתח את קורות החיים ✅\nשמרתי את ${name} במערכת`
      if (title || city) {
        reply += ` (${[title, city].filter(Boolean).join(", ")})`
      }
      reply += ".\n\n"

      if (matches.length > 0) {
        reply += `מצאתי ${matches.length} משרות שיכולות להתאים לו:\n`
        reply += matches
          .slice(0, 5)
          .map((m, i) => `${i + 1}. ${m.title}${m.employer ? " – " + m.employer : ""}${m.location ? " (" + m.location + ")" : ""}`)
          .join("\n")
        reply += "\n\nרוצה שאמצא עוד? תגיד לי תחום או עיר ואחפש."
      } else {
        reply += "לא מצאתי כרגע משרות פעילות שתואמות מספיק. תגיד לי תחום/עיר ואחפש ידנית."
      }

      pushAssistant(reply)
    } catch {
      pushAssistant("הייתה בעיה בהעלאת הקובץ, נסה שוב בבקשה.")
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <aside
      dir="rtl"
      className="hidden xl:flex flex-col w-[250px] h-full flex-shrink-0 relative overflow-hidden ml-[2cm]
        border-r border-white/[0.06] shadow-[4px_0_24px_rgba(0,0,0,0.25)]"
      style={{ background: 'linear-gradient(180deg, #0F172A 0%, #111c34 45%, #0d1526 100%)' }}
    >
      {/* Decorative glow */}
      <div className="absolute top-0 left-0 w-full h-40 pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse at top left, rgba(249,115,22,0.14) 0%, transparent 70%)' }} />

      {/* ✨ נקודות תכלת מרחפות ברקע */}
      <StarryBg />

      {/* Header */}
      <div className="flex items-center gap-2.5 h-28 px-3.5 border-b border-white/[0.06] flex-shrink-0 relative z-10">
        <div className="relative w-[72px] h-[72px] flex-shrink-0">
          <Image src="/logo-22jobs-clean.png" alt="אביגדור" width={72} height={72} className="object-contain w-full h-full drop-shadow-lg" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[18px] font-bold text-slate-100 leading-tight">
            אביגדור
            <Sparkles className="h-4 w-4 text-[#F97316]" />
          </div>
          <div className="text-[12px] text-[#10B981] font-medium flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block animate-pulse" />
            זמין לשיחה
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-5 space-y-4 scrollbar-none relative z-10">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-[1.6] whitespace-pre-wrap break-words ${
                m.role === "user"
                  ? "bg-white/[0.07] text-slate-100 border border-white/[0.08]"
                  : "text-white shadow-lg shadow-orange-900/20"
              }`}
              style={m.role === "assistant" ? { background: 'linear-gradient(135deg, #F97316 0%, #ea6a0e 100%)' } : undefined}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-end">
            <div className="rounded-2xl px-3.5 py-2.5 text-white flex items-center gap-2 shadow-lg shadow-orange-900/20" style={{ background: 'linear-gradient(135deg, #F97316 0%, #ea6a0e 100%)' }}>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-[13px]">אביגדור עובד על זה...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/[0.06] flex-shrink-0 relative z-10">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.rtf,.txt,.odt,image/*"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        <div className="flex items-center gap-1.5 bg-white/[0.06] border border-white/[0.1] rounded-xl px-2 py-1.5 focus-within:border-[#F97316]/50 transition-colors">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            title="העלה קורות חיים"
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-40 transition-colors"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") sendMessage() }}
            placeholder="שאל את אביגדור..."
            className="flex-1 min-w-0 bg-transparent text-[13.5px] text-slate-100 placeholder:text-slate-500 outline-none px-1 py-1.5"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-white disabled:opacity-40 transition-opacity"
            style={{ background: '#F97316' }}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="mt-2 w-full flex items-center justify-center gap-1.5 text-[11.5px] text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-colors text-center leading-tight"
        >
          <FileText className="h-3.5 w-3.5 flex-shrink-0" />
          העלה קורות חיים להמלצת משרות אוטומטית
        </button>
      </div>
    </aside>
  )
}
