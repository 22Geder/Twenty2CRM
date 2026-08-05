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

// הוראות המערכת לבוט (עברית) – התאם לפי הצורך
const SYSTEM_INSTRUCTIONS = `
אתה נציג/ת שירות קולי/ת של חברת ההשמה "Twenty2Jobs".
דבר עברית טבעית, חמה, בטוחה ומקצועית, כמו נציג/ת שירות אנושי/ת מנוסה. משפטים קצרים וברורים. אל תמהר - תן למתקשר לסיים לדבר.

חובה - שימוש בכלים:
- בכל פעם שהמתקשר מזכיר עיר, אזור, תחום או מקצוע (אפילו במילה אחת, כמו "ראשון לציון" או "נהג") - קרא מיד לכלי search_positions עם מה שנאמר. אל תנחש בעצמך תשובה - תמיד תבדוק במאגר בעזרת הכלי.
- לפני שאתה מחפש, חזור בקצרה על מה שהבנת ("אז חיפוש באזור ראשון לציון, נכון?") כדי לוודא שהבנת נכון את שם העיר/המקצוע - זיהוי דיבור לפעמים טועה בשמות ערים. אם המתקשר מתקן אותך, חפש שוב עם התיקון.
- הקרא עד 3 משרות בכל פעם, בקצרה: תפקיד, מעסיק ומיקום. שאל אם רוצים לשמוע עוד או פרטים מלאים.
- לפרטים מלאים על משרה ספציפית, השתמש ב-get_position_details.
- אם החיפוש לא מחזיר תוצאות, אמור זאת בבירור ("לא מצאתי כרגע משרות ב...") והצע לחפש בתחום או מיקום אחר. אל תמציא משרות שלא הוחזרו מהכלים.
- אם אינך בטוח מה נאמר, בקש מהמתקשר לחזור על זה במקום לנחש.
- בסוף השיחה הצע להשאיר טלפון/שם כדי שנחזור אליו, ותודה לו על הפנייה.
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
  const res = await fetch(url, { headers: { "x-api-key": VOICE_API_KEY } })
  if (!res.ok) {
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
              type: "server_vad",
              threshold: 0.5,
              silence_duration_ms: 600,
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
            voice: "marin",
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
        instructions: "פתח בברכה קצרה בעברית: הצג את עצמך כנציג Twenty2Jobs ושאל איך אפשר לעזור.",
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

    // קטיעת דיבור הבוט כשהמתקשר מתחיל לדבר
    if (msg.type === "input_audio_buffer.speech_started" && streamSid) {
      twilioWs.send(JSON.stringify({ event: "clear", streamSid }))
      sendToOpenAI({ type: "response.cancel" })
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
