"use client"

import React, { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Send, Loader2, Sparkles } from "lucide-react"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

// 🦁 פאנל ה-AI הפנימי "אביגדור" - עמודה קבועה בצד שמאל של המסך, תמיד פתוחה וזמינה לשיחה.
// אותה אישיות/מוח כמו הבוט הטלפוני של החברה, כאן לשימוש הצוות הפנימי בתוך ה-CRM
// לחיפוש מהיר של משרות פנויות או מועמדים מתאימים בשפה חופשית.
export function AvigdorAiPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "היי, אני אביגדור 🦁 תגיד לי איזו משרה אתה צריך (ובאיזה איזור), או תבקש ממני למצוא מועמד מתאים - ואני אחפש לך במאגר.",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

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
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "מצטער, לא הצלחתי לענות כרגע." }])
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "הייתה בעיה בתקשורת עם השרת, נסה שוב בבקשה." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <aside
      dir="rtl"
      className="hidden xl:flex flex-col w-[300px] h-full flex-shrink-0 relative overflow-hidden
        border-l border-white/[0.06] shadow-[-4px_0_24px_rgba(0,0,0,0.25)]"
      style={{ background: 'linear-gradient(180deg, #0F172A 0%, #111c34 45%, #0d1526 100%)' }}
    >
      {/* Decorative glow */}
      <div className="absolute top-0 left-0 w-full h-40 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top left, rgba(249,115,22,0.14) 0%, transparent 70%)' }} />

      {/* Header */}
      <div className="flex items-center gap-3 h-28 px-4 border-b border-white/[0.06] flex-shrink-0 relative">
        <div className="relative w-14 h-14 flex-shrink-0">
          <Image src="/logo-22jobs-clean.png" alt="אביגדור" width={56} height={56} className="object-contain w-full h-full drop-shadow-lg" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[15px] font-bold text-slate-100">
            אביגדור
            <Sparkles className="h-3.5 w-3.5 text-[#F97316]" />
          </div>
          <div className="text-[10px] text-[#10B981] font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block" />
            זמין לשיחה
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3 scrollbar-none">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-white/[0.06] text-slate-200 border border-white/[0.06]"
                  : "text-white"
              }`}
              style={m.role === "assistant" ? { background: 'linear-gradient(135deg, #F97316 0%, #ea6a0e 100%)' } : undefined}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-end">
            <div className="rounded-2xl px-3.5 py-2.5 text-white flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #F97316 0%, #ea6a0e 100%)' }}>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span className="text-[12px]">אביגדור חושב...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-xl px-2 py-1.5 focus-within:border-[#F97316]/40 transition-colors">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") sendMessage() }}
            placeholder="שאל את אביגדור..."
            className="flex-1 bg-transparent text-[12.5px] text-slate-100 placeholder:text-slate-500 outline-none px-1 py-1"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white disabled:opacity-40 transition-opacity"
            style={{ background: '#F97316' }}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
