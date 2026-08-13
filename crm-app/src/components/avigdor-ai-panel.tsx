"use client"

import React, { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Send, Loader2, Sparkles, Paperclip, FileText } from "lucide-react"
import { StarryBg } from "@/components/starry-bg"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
  time?: string
}

const nowTime = () =>
  new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })

// 🦁 פאנל ה-AI הפנימי "אביגדור" - עמודה קבועה בצד שמאל של המסך, תמיד פתוחה וזמינה לשיחה.
// אותה אישיות/מוח כמו הבוט הטלפוני של החברה, כאן לשימוש הצוות הפנימי בתוך ה-CRM:
// חיפוש משרות/מועמדים בשפה חופשית + העלאת קורות חיים לניתוח אוטומטי והמלצת משרות.
export function AvigdorAiPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "היי, אני אביגדור 🦁 תגיד לי איזו משרה אתה צריך (ובאיזה איזור), תבקש ממני למצוא מועמד מתאים, או פשוט תעלה לי קובץ קורות חיים 📎 ואני אנתח אותו, אשמור אותו במערכת ואמליץ לך על המשרות הכי מתאימות.",
      time: nowTime(),
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, loading])

  const pushAssistant = (content: string) =>
    setMessages(prev => [...prev, { role: "assistant", content, time: nowTime() }])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text, time: nowTime() }]
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
    setMessages(prev => [...prev, { role: "user", content: `📎 העליתי קובץ: ${file.name}`, time: nowTime() }])
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

      // 🆕 זיהוי כפילות זהה למערכת ההעלאה ההמונית:
      // createdCandidate=false → המועמד כבר קיים ועודכן הכרטיס הקיים (בלי ליצור כפילות)
      const isExisting = data.createdCandidate === false
      const details = [title, city].filter(Boolean).join(", ")

      let reply: string
      if (isExisting) {
        reply = `סיימתי לנתח את קורות החיים ✅\n${name} כבר קיים/ת אצלנו במערכת — עדכנתי את הכרטיס הקיים בקובץ החדש (לא נוצרה כפילות)`
      } else {
        reply = `סיימתי לנתח את קורות החיים ✅\nהוספתי את ${name} כמועמד/ת חדש/ה במערכת`
      }
      if (details) {
        reply += ` (${details})`
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

  // 🖐️ תמיכה בגרירת קובץ קורות חיים ישירות לפאנל (drag & drop)
  const isFileDrag = (e: React.DragEvent) =>
    Array.from(e.dataTransfer?.types || []).includes("Files")

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isFileDrag(e) || loading) return
    dragCounter.current += 1
    setDragActive(true)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isFileDrag(e) && !loading) e.dataTransfer.dropEffect = "copy"
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current -= 1
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    setDragActive(false)
    if (loading) return
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <aside
      dir="rtl"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="hidden xl:flex flex-col w-[min(325px,22vw)] h-full flex-shrink-0 relative overflow-hidden ml-[min(2cm,3.5vw)]
        border-r border-white/[0.06] shadow-[4px_0_24px_rgba(0,0,0,0.25)]"
      style={{ background: 'linear-gradient(180deg, #0F172A 0%, #111c34 45%, #0d1526 100%)' }}
    >
      {/* 🖐️ שכבת גרירה - מופיעה כשגוררים קובץ מעל הפאנל */}
      {dragActive && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3
          bg-[#0F172A]/85 backdrop-blur-sm border-2 border-dashed border-[#F97316] rounded-lg m-2 pointer-events-none">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center animate-bounce"
            style={{ background: 'linear-gradient(135deg, #F97316 0%, #ea6a0e 100%)' }}>
            <FileText className="h-8 w-8 text-white" />
          </div>
          <div className="text-slate-100 text-[15px] font-semibold text-center px-4">
            שחרר כאן ואביגדור ינתח 🦁
          </div>
          <div className="text-slate-400 text-[12px] text-center px-4">
            PDF, Word או תמונה של קורות חיים
          </div>
        </div>
      )}

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

      {/* Messages - סגנון וואטסאפ: בועות עם "זנב", חותמת זמן וקיבוץ לפי שולח */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 scrollbar-none relative z-10">
        {messages.map((m, i) => {
          const isUser = m.role === "user"
          const prev = messages[i - 1]
          const sameSender = prev && prev.role === m.role
          return (
            <div
              key={i}
              className={`flex ${isUser ? "justify-start" : "justify-end"} ${sameSender ? "mt-1.5" : "mt-4"}`}
            >
              <div
                className={`flex flex-col max-w-[80%] overflow-hidden px-3.5 py-2.5 shadow-md ${
                  isUser
                    ? "bg-white/[0.07] border border-white/[0.08] rounded-2xl rounded-tr-md"
                    : "shadow-orange-900/20 rounded-2xl rounded-tl-md"
                }`}
                style={!isUser ? { background: 'linear-gradient(135deg, #F97316 0%, #ea6a0e 100%)' } : undefined}
              >
                <span
                  className={`text-[13.5px] leading-[1.65] whitespace-pre-wrap break-words text-right ${
                    isUser ? "text-slate-100" : "text-white"
                  }`}
                >
                  {m.content}
                </span>
                {m.time && (
                  <span className={`self-start text-[10px] mt-1 leading-none ${isUser ? "text-slate-400" : "text-orange-50/80"}`}>
                    {m.time}
                  </span>
                )}
              </div>
            </div>
          )
        })}
        {loading && (
          <div className="flex justify-end mt-4">
            <div className="rounded-2xl rounded-tl-md px-3.5 py-2.5 text-white flex items-center gap-2 shadow-md shadow-orange-900/20" style={{ background: 'linear-gradient(135deg, #F97316 0%, #ea6a0e 100%)' }}>
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
          גרור או העלה קורות חיים להמלצת משרות אוטומטית
        </button>
      </div>
    </aside>
  )
}
