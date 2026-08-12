"use client"

import React, { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Send, X, Loader2 } from "lucide-react"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

// 🦁 פאנל ה-AI הפנימי "אביגדور" - צד שמאל של המסך.
// אותה אישיות כמו הבוט הטלפוני של החברה, כאן לשימוש הצוות הפנימי בתוך ה-CRM
// לחיפוש מהיר של משרות פנויות או מועמדים מתאימים בשפה חופשית.
export function AvigdorAiPanel() {
  const [open, setOpen] = useState(false)
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
  }, [messages, open])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return
    setInput("")
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }]
    setMessages(nextMessages)
    setLoading(true)
    try {
      const res = await fetch("/api/avigdor-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: nextMessages.slice(-8),
        }),
      })
      const data = await res.json()
      const reply = res.ok ? data.reply : "מצטער, הייתה תקלה. נסה שוב בעוד רגע."
      setMessages((prev) => [...prev, { role: "assistant", content: reply }])
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "מצטער, לא הצלחתי להתחבר כרגע. נסה שוב." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* כפתור צף לפתיחת הפאנל - מוצג רק כשהפאנל סגור */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 left-6 z-50 w-16 h-16 rounded-full shadow-2xl border-4 border-white
            flex items-center justify-center overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600
            hover:scale-105 transition-transform"
          title="דבר עם אביגדור"
        >
          <Image src="/avigdor-lion.png" alt="אביגדור" width={64} height={64} className="object-cover w-full h-full" />
          <span className="absolute -top-1 -left-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
        </button>
      )}

      {/* פאנל הצ'אט */}
      {open && (
        <div
          dir="rtl"
          className="fixed bottom-6 left-6 z-50 w-[340px] max-h-[520px] flex flex-col rounded-2xl overflow-hidden
            shadow-2xl border border-white/10"
          style={{ background: "linear-gradient(180deg, #0F172A 0%, #1a2540 100%)" }}
        >
          {/* רקע דמות האריה, דהוי ברקע הפאנל */}
          <div
            className="absolute inset-0 opacity-[0.08] pointer-events-none bg-center bg-cover"
            style={{ backgroundImage: "url(/avigdor-lion.png)" }}
          />

          {/* כותרת */}
          <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-orange-400 flex-shrink-0">
                <Image src="/avigdor-lion.png" alt="אביגדור" width={36} height={36} className="object-cover w-full h-full" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">אביגדור</div>
                <div className="text-[10px] text-emerald-400">● זמין - עוזר AI פנימי</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* הודעות */}
          <div ref={scrollRef} className="relative flex-1 overflow-y-auto px-3 py-3 space-y-2.5 min-h-[260px]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap
                    ${m.role === "user"
                      ? "bg-white/10 text-slate-100 rounded-bl-sm"
                      : "bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-br-sm"
                    }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-end">
                <div className="bg-orange-600/80 text-white rounded-2xl rounded-br-sm px-3 py-2 flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span className="text-[12px]">אביגדור בודק במאגר...</span>
                </div>
              </div>
            )}
          </div>

          {/* קלט */}
          <div className="relative flex items-center gap-2 p-3 border-t border-white/10 flex-shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="למשל: משרת נהג באשדוד..."
              className="flex-1 bg-white/5 text-white placeholder:text-slate-500 text-[13px] rounded-xl px-3 py-2.5
                border border-white/10 focus:outline-none focus:border-orange-400/50"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:hover:bg-orange-500
                flex items-center justify-center flex-shrink-0 transition-colors"
            >
              <Send className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
