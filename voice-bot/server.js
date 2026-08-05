import "dotenv/config"
import express from "express"
import { WebSocketServer, WebSocket } from "ws"
import { createServer } from "http"

// ────────────────────────────────────────────────────────────────
// TWENTY2CRM – OpenAI Realtime Voice Bot bridged to Twilio
//
//  📞 Caller → Twilio (phone number) → this bridge (WebSocket)
//            → OpenAI Realtime API  ↔  CRM positions endpoint
// ────────────────────────────────────────────────────────────────

const {
  PORT = 5050,
  OPENAI_API_KEY,
  CRM_BASE_URL,
  VOICE_API_KEY,
  OPENAI_REALTIME_MODEL = "gpt-realtime",
  PUBLIC_HOST = "localhost:5050", // default fallback
} = process.env

if (!OPENAI_API_KEY) {
  console.error("❌ Missing OPENAI_API_KEY")
  process.exit(1)
}
if (!CRM_BASE_URL || !VOICE_API_KEY) {
  console.error("❌ Missing CRM_BASE_URL or VOICE_API_KEY")
  process.exit(1)
}
console.log(`🔗 CRM_BASE_URL = ${CRM_BASE_URL}`)

// הוראות המערכת לבוט (עברית) – התאם לפי הצורך
const SYSTEM_INSTRUCTIONS = `
את נציגת שירות קולית של חברת ההשמה "Twenty2Jobs". את אישה, דברי בגוף נקבה על עצמך תמיד.
דברי עברית טבעית, חמה, בטוחה ומקצועית, כמו נציגת שירות אנושית מנוסה. קצב דיבור חי, זורם ויחסית מהיר - כמו נציגה עסוקה שיודעת את העבודה שלה, אבל לא ממהרת יותר מדי ולא בולעת מילים. משפטים קצרים וברורים. תני למתקשר לסיים לדבר לפני שאת עונה.

חשוב - שקיפות תוך כדי עבודה: לפני שאת קוראת לכלי search_positions או get_position_details, תמיד תגידי קודם משפט קצר שמראה שאת בפעולה, למשל: "רגע, אני בודקת לך את זה במאגר..." או "שנייה, מחפשת עכשיו...". רק אחרי המשפט הזה תפעילי את הכלי, כדי שהמתקשר ידע שאת עובדת ולא ישתוק בלי מענה.

תהליך חובה - שני שלבים לכל חיפוש (זיהוי דיבור עלול לטעות בשמות ערים!):
שלב 1 - אישור לפני חיפוש: כשהמתקשר מזכיר עיר/אזור/מקצוע, אל תקראי לכלי search_positions מיד. קודם חזרי בקול על מה שהבנת במדויק, למשל: "הבנתי - אתה מחפש עבודה כמזכירה באשדוד, נכון?" וחכי לאישור מפורש ("כן"/"נכון"). אם המתקשר אומר שטעית, בקשי שיחזור על שם העיר/המקצוע לאט ונסי שוב לוודא - אל תמשיכי בלי אישור.
שלב 2 - רק אחרי אישור מפורש: תגידי משפט קצר שאת בודקת ("שנייה, בודקת...") ואז קראי לכלי search_positions בדיוק עם מה שאושר (לא עם ניחוש שלך).
- אם אינך בטוחה כלל מה נאמר, בקשי מהמתקשר לחזור על זה במקום לנחש עיר או מקצוע.
- לפרטים מלאים על משרה ספציפית, השתמשי ב-get_position_details.
- הקריאי עד 3 משרות בכל פעם, בקצרה: תפקיד, מעסיק ומיקום. שאלי אם רוצים לשמוע עוד או פרטים מלאים.
- אם החיפוש לא מחזיר תוצאות, אמרי זאת בבירור ("לא מצאתי כרגע משרות ב...") והציעי לחפש בתחום או מיקום אחר. אל תמציאי משרות שלא הוחזרו מהכלים.
- בסוף השיחה הציעי להשאיר טלפון/שם כדי שנחזור אליו, ותודי לו על הפנייה.
`.trim()

// ברכת הפתיחה - נאמרת בקול ע"י הבוט מיד כשהשיחה מתחילה
const OPENING_GREETING_INSTRUCTIONS = `
אמרי בדיוק את התוכן הבא, בקול נשי חם, טבעי וידידותי, בקצב זורם:
1. "שלום, הגעתם ל-Twenty2Jobs! אנחנו שמחים שיצרתם קשר, איך נוכל לעזור?"
2. אחרי זה, בלי לעצור יותר מדי, הוסיפי בקצרה ובסגנון נעים: "לפני שמתחילים, רק תזכורת קטנה - במסגרת 'חבר מביא חבר', כל מי שממליץ לנו על חבר שמתקבל לעבודה דרכנו מקבל 500 שקל במתנה. שווה לזכור את זה!"
3. לבסוף שאלי: "אז איך אפשר לעזור לך היום?"
`.trim()

const TOOLS = [
  {
    type: "function",
    name: "search_positions",
    description:
      "מחפש משרות פעילות במאגר החברה לפי תחום/מקצוע (search) ו/או מיקום (location). מחזיר רשימה תמציתית.",
    parameters: {
      type: "object",
      properties: {
        search: {
          type: "string",
          description: "מילת חיפוש: תחום, מקצוע או תפקיד. לדוגמה: נהג, מכירות, אבטחה.",
        },
        location: {
          type: "string",
          description: "עיר או אזור. לדוגמה: אשדוד, תל אביב, הצפון.",
        },
      },
    },
  },
  {
    type: "function",
    name: "get_position_details",
    description: "מחזיר פרטים מלאים על משרה בודדת לפי מזהה (id) שהתקבל מ-search_positions.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "מזהה המשרה (id)." },
      },
      required: ["id"],
    },
  },
]

// ── קריאות ל-CRM ────────────────────────────────────────────────
async function crmFetch(params) {
  const url = new URL("/api/voice/positions", CRM_BASE_URL)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v))
  }
  console.log(`🌐 CRM fetch: ${url.toString()}`)
  const res = await fetch(url, { headers: { "x-api-key": VOICE_API_KEY } })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    console.error(`🌐 CRM fetch failed: ${res.status} ${res.statusText} - ${body.slice(0, 300)}`)
    return { error: `CRM request failed (${res.status})` }
  }
  return res.json()
}

async function handleToolCall(name, args) {
  try {
    if (name === "search_positions") {
      return await crmFetch({ search: args.search, location: args.location, limit: 5 })
    }
    if (name === "get_position_details") {
      return await crmFetch({ id: args.id })
    }
    return { error: "Unknown tool" }
  } catch (err) {
    console.error("[tool] error:", err)
    return { error: "Tool execution failed" }
  }
}

// ── Express: TwiML לשיחה נכנסת ──────────────────────────────────
const app = express()
app.use(express.urlencoded({ extended: false }))

app.get("/", (_req, res) => res.send("Twenty2 Voice Bot is running ✅"))

function twiml(host) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://${host}/media-stream" />
  </Connect>
</Response>`
}

app.all("/incoming-call", (req, res) => {
  const host = PUBLIC_HOST || req.headers.host
  res.type("text/xml").send(twiml(host))
})

// ── WebSocket bridge: Twilio ↔ OpenAI Realtime ─────────────────
const server = createServer(app)
const wss = new WebSocketServer({ server, path: "/media-stream" })

wss.on("connection", (twilioWs) => {
  console.log("📞 Twilio media stream connected")

  let streamSid = null
  const openaiWs = new WebSocket(
    `wss://api.openai.com/v1/realtime?model=${OPENAI_REALTIME_MODEL}`,
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    }
  )

  const sendToOpenAI = (obj) => {
    if (openaiWs.readyState === WebSocket.OPEN) openaiWs.send(JSON.stringify(obj))
  }

  openaiWs.on("open", () => {
    console.log("🤖 Connected to OpenAI Realtime")
    sendToOpenAI({
      type: "session.update",
      session: {
        type: "realtime",
        output_modalities: ["audio"],
        audio: {
          input: {
            format: { type: "audio/pcmu" },
            turn_detection: {
              type: "semantic_vad",
              eagerness: "medium",
            },
            transcription: {
              model: "gpt-4o-transcribe",
              language: "he",
              prompt:
                "שיחת טלפון בעברית על חיפוש עבודה. שמות ערים נפוצים: ראשון לציון, תל אביב, אשדוד, ירושלים, חיפה, פתח תקווה, נתניה, באר שבע, רחובות, הרצליה, רמת גן, בת ים, אשקלון, חולון.",
            },
          },
          output: {
            format: { type: "audio/pcmu" },
            voice: "coral",
          },
        },
        instructions: SYSTEM_INSTRUCTIONS,
        tools: TOOLS,
        tool_choice: "auto",
      },
    })
    // ברכת פתיחה
    sendToOpenAI({
      type: "response.create",
      response: {
        instructions: OPENING_GREETING_INSTRUCTIONS,
      },
    })
  })

  // OpenAI → Twilio (+ ביצוע כלים)
  openaiWs.on("message", async (raw) => {
    let msg
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      return
    }

    if (msg.type === "response.output_audio.delta" && msg.delta && streamSid) {
      twilioWs.send(
        JSON.stringify({
          event: "media",
          streamSid,
          media: { payload: msg.delta },
        })
      )
    }

    // כשהמתקשר מתחיל לדבר - השרת של OpenAI כבר מבטל אוטומטית כל תשובה פעילה בעצמו
    // (ראה תיעוד: "the server will automatically cancel any in-progress model response").
    // לכן לא שולחים response.cancel ידני - זה רק גורם לשגיאת race condition (response_cancel_not_active).
    // כאן רק מנקים את בופר האודיו הממתין ב-Twilio כדי שלא ישמע חפיפה/שאריות.
    if (msg.type === "input_audio_buffer.speech_started" && streamSid) {
      twilioWs.send(JSON.stringify({ event: "clear", streamSid }))
    }

    // לוג של מה שהבוט עצמו אמר בקול - עוזר לאבחן מה קרה בפועל בשיחה
    if (msg.type === "response.output_audio_transcript.done") {
      console.log(`🗣️  bot said: "${msg.transcript}"`)
    }

    // לוג של מה שהמערכת "שמעה" - עוזר לאבחן טעויות זיהוי דיבור
    if (msg.type === "conversation.item.input_audio_transcription.completed") {
      console.log(`🎙️  heard: "${msg.transcript}"`)
    }

    // קריאת פונקציה שהמודל ביקש
    if (msg.type === "response.function_call_arguments.done") {
      let args = {}
      try {
        args = JSON.parse(msg.arguments || "{}")
      } catch {
        args = {}
      }
      console.log(`🔧 tool: ${msg.name}`, args)
      const result = await handleToolCall(msg.name, args)
      sendToOpenAI({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: msg.call_id,
          output: JSON.stringify(result),
        },
      })
      sendToOpenAI({ type: "response.create" })
    }

    if (msg.type === "error") {
      console.error("[openai] error:", msg.error)
    }
  })

  openaiWs.on("close", () => console.log("🤖 OpenAI connection closed"))
  openaiWs.on("error", (e) => console.error("[openai] ws error:", e.message))

  // Twilio → OpenAI
  twilioWs.on("message", (raw) => {
    let data
    try {
      data = JSON.parse(raw.toString())
    } catch {
      return
    }

    switch (data.event) {
      case "start":
        streamSid = data.start.streamSid
        console.log("▶️  stream started:", streamSid)
        break
      case "media":
        sendToOpenAI({
          type: "input_audio_buffer.append",
          audio: data.media.payload,
        })
        break
      case "stop":
        console.log("⏹️  stream stopped")
        break
    }
  })

  twilioWs.on("close", () => {
    console.log("📞 Twilio disconnected")
    if (openaiWs.readyState === WebSocket.OPEN) openaiWs.close()
  })
})

server.listen(PORT, () => {
  console.log(`🚀 Voice bot listening on port ${PORT}`)
})
