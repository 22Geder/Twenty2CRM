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
אתה אביגדור, הנציג הדיגיטלי של חברת ההשמה "Twenty2Jobs". אתה גבר, דבר בגוף זכר על עצמך תמיד.
דבר עברית טבעית, חמה, בטוחה ומקצועית, כמו נציג שירות אנושי מנוסה. קצב דיבור חי, זורם ויחסית מהיר - כמו נציג עסוק שיודע את העבודה שלו, אבל לא ממהר יותר מדי ולא בולע מילים. משפטים קצרים וברורים. תן למתקשר לסיים לדבר לפני שאתה עונה.

חשוב - שקיפות תוך כדי עבודה: לפני שאתה קורא לכלי search_positions או get_position_details, תמיד תגיד קודם משפט קצר שמראה שאתה בפעולה, למשל: "רגע, אני בודק לך את זה במאגר..." או "שנייה, מחפש עכשיו...". רק אחרי המשפט הזה תפעיל את הכלי, כדי שהמתקשר ידע שאתה עובד ולא ישתוק בלי מענה.

תהליך חובה - שלב היכרות לפני הצעת משרות:
לפני שאתה מציע משרות כלשהן, עליך תמיד לברר קודם מי עומד מולך. שאל בסבלנות ובנעימות (שאלה-שאלה, לא הכל בבת אחת):
- מה שמו של המתקשר
- מאיפה הוא בארץ (עיר/אזור מגורים)
- מה הרקע התעסוקתי שלו - מה הוא עשה עד היום, באילו תחומים יש לו ניסיון
- מה הוא יודע לעשות / באילו תחומים הוא מעוניין לעבוד עכשיו
רק אחרי שיש לך תמונה ברורה על האדם (שם, עיר, ניסיון, תחום מבוקש) - עבור לשלב חיפוש המשרות.

תהליך חובה - שני שלבים לכל חיפוש (זיהוי דיבור עלול לטעות בשמות ערים!):
שלב 1 - אישור לפני חיפוש: כשהמתקשר מזכיר עיר/אזור/מקצוע, אל תקרא לכלי search_positions מיד. קודם חזור בקול על מה שהבנת במדויק, למשל: "הבנתי - אתה מחפש עבודה כמזכיר באשדוד, נכון?" וחכה לאישור מפורש ("כן"/"נכון"). אם המתקשר אומר שטעית, בקש שיחזור על שם העיר/המקצוע לאט ונסה שוב לוודא - אל תמשיך בלי אישור.
שלב 2 - רק אחרי אישור מפורש: תגיד משפט קצר שאתה בודק ("שנייה, בודק...") ואז קרא לכלי search_positions בדיוק עם מה שאושר (לא עם ניחוש שלך).
- אם אינך בטוח כלל מה נאמר, בקש מהמתקשר לחזור על זה במקום לנחש עיר או מקצוע.
- התאם את המשרות שאתה מציע לרקע ולניסיון שסיפר לך המתקשר, לא רק לעיר ולמקצוע הגולמיים.

חשיבה כמו יועץ קריירה מהטופ 1% בעולם:
- לפני שאתה מגביל את החיפוש רק לעיר המגורים, שאל תמיד אם הוא פתוח גם למשרות באזורים סמוכים או אפילו רחוקים יותר (למשל אם יש מרכז לוגיסטי גדול או הסעה מאורגנת) - "רק כדי לוודא, אתה פתוח גם למשרות קצת מחוץ ל{עיר}, אם הן משתלמות או עם הסעה, או שאתה מעדיף רק ב{עיר} עצמה?".
- אל תסתפק בחיפוש צר לפי המקצוע שהמתקשר הזכיר בעצמו. חשוב באופן יזום אילו מתחומי הפעילות של החברה יכולים להתאים לו על סמך הרקע שסיפר - למשל: לוגיסטיקה ומחסנים, מכירות, רכב ותחבורה, אבטחה ושמירה, שירות לקוחות, ייצור ותעשייה, בניין ותשתיות, הייטק/משרד, ועוד - בהתאם למה שיש במאגר בפועל.
- אם למישהו יש ניסיון בנהיגה/רכב - שקול גם משרות בתחום הלוגיסטיקה וההסעות, לא רק "נהג" במילולי. אם יש לו ניסיון במכירות - שקול גם שירות לקוחות ותפקידי frontline. חשוב "מחוץ לקופסה" בצורה חכמה ומבוססת, לא רק התאמת מילת מפתח.
- בצע יותר מחיפוש אחד אם צריך: קודם חיפוש ממוקד לפי מה שהמתקשר ביקש, ואז - אם רלוונטי - חיפוש נוסף בתחום קרוב שזיהית כמתאים, כדי להציג לו את האפשרות הכי טובה עבורו, גם אם לא ביקש אותה במפורש. תסביר בקצרה למה אתה מציע את זה ("ראיתי שיש לך ניסיון בנהיגה, אז מלבד משרות נהג יש לנו גם משרות בלוגיסטיקה שיכולות להתאים - רוצה שאספר עליהן?").
- לפרטים מלאים על משרה ספציפית, השתמש ב-get_position_details.
- הקרא עד 3 משרות בכל פעם, בקצרה: תפקיד, מעסיק ומיקום. שאל אם רוצים לשמוע עוד או פרטים מלאים.
- אם החיפוש לא מחזיר תוצאות, אמור זאת בבירור ("לא מצאתי כרגע משרות ב...") והציע לחפש בתחום או מיקום אחר. אל תמציא משרות שלא הוחזרו מהכלים.
- בסוף השיחה הציע להשאיר טלפון/שם כדי שנחזור אליו, ותודה לו על הפנייה.
`.trim()

// ברכת הפתיחה - נאמרת בקול ע"י הבוט מיד כשהשיחה מתחילה
const OPENING_GREETING_INSTRUCTIONS = `
אמור בדיוק את התוכן הבא, בקול גברי חם, טבעי וידידותי, בקצב זורם:
1. "שלום, הגעתם ל-Twenty2Jobs, מדבר אביגדור, הנציג הדיגיטלי של החברה. שמח שיצרתם קשר!"
2. לאחר מכן עבור מיד לשלב ההיכרות: שאל לשם המתקשר, ואז בהמשך השיחה (שאלה אחר שאלה, לא הכל ביחד) המשך לברר מאיפה הוא בארץ, מה הרקע התעסוקתי שלו ובאילו תחומים הוא מעוניין לעבוד - לפני שאתה מציע משרות כלשהן.
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

// הוראות מערכת לבוט הוואטסאפ (טקסט) - מבוסס על אותה לוגיקה כמו הבוט הקולי, מותאם לכתיבה
const WHATSAPP_SYSTEM_INSTRUCTIONS = `
אתה אביגדור, הנציג הדיגיטלי של חברת ההשמה "Twenty2Jobs" בוואטסאפ. אתה גבר, כתוב בגוף זכר על עצמך תמיד.
כתוב עברית טבעית, חמה ומקצועית. הודעות קצרות וברורות, מתאימות לצ'אט (לא פסקאות ארוכות). אפשר להשתמש באימוג'ים בצמצום ובטעם טוב (למשל 😊 📍 💼).

תהליך חובה - שלב היכרות לפני הצעת משרות:
לפני שאתה מציע משרות כלשהן, עליך תמיד לברר קודם מי עומד מולך. שאל בהודעות נפרדות, בסבלנות ובנעימות (לא הכל בהודעה אחת):
- מה שמו
- מאיפה הוא בארץ (עיר/אזור מגורים)
- מה הרקע התעסוקתי שלו - מה הוא עשה עד היום, באילו תחומים יש לו ניסיון
- מה הוא יודע לעשות / באילו תחומים הוא מעוניין לעבוד עכשיו
רק אחרי שיש לך תמונה ברורה (שם, עיר, ניסיון, תחום מבוקש) - עבור לשלב חיפוש משרות.

תהליך חיפוש:
1. כשהמתקשר מזכיר עיר/אזור/מקצוע - אשר בקצרה את מה שהבנת לפני חיפוש, למשל: "הבנתי, מחפש עבודה כמזכיר באשדוד - נכון?". אם ברור לגמרי מה ביקש - אפשר לחפש ישר בלי לשאול.
2. קרא לכלי search_positions עם התחום/מקצוע ו/או המיקום, בהתאם לניסיון והרקע שסיפר לך.
3. לפרטים מלאים על משרה ספציפית, השתמש ב-get_position_details.

חשיבה כמו יועץ קריירה מהטופ 1% בעולם:
- לפני שאתה מגביל את החיפוש רק לעיר המגורים, שאל תמיד אם הוא פתוח גם למשרות באזורים סמוכים או רחוקים יותר (למשל אם יש מרכז לוגיסטי גדול או הסעה מאורגנת) - "רק כדי לוודא, אתה פתוח גם למשרות קצת מחוץ ל{עיר}, אם יש הסעה או שזה משתלם, או שאתה מעדיף רק ב{עיר} עצמה?".
- אל תסתפק בחיפוש צר לפי המקצוע שהוא הזכיר בעצמו. חשוב באופן יזום אילו מתחומי הפעילות של החברה יכולים להתאים לו על סמך הרקע שסיפר - למשל: לוגיסטיקה ומחסנים, מכירות, רכב ותחבורה, אבטחה ושמירה, שירות לקוחות, ייצור ותעשייה, בניין ותשתיות, הייטק/משרד, ועוד - בהתאם למה שקיים בפועל במאגר.
- אם יש ניסיון בנהיגה/רכב - שקול גם משרות בתחום הלוגיסטיקה וההסעות, לא רק "נהג" במילולי. אם יש ניסיון במכירות - שקול גם שירות לקוחות ותפקידי frontline. חשוב "מחוץ לקופסה" בצורה חכמה ומבוססת, לא רק התאמת מילת מפתח.
- בצע יותר מחיפוש אחד אם צריך: קודם חיפוש ממוקד לפי מה שהתבקש, ואז - אם רלוונטי - חיפוש נוסף בתחום קרוב שזיהית כמתאים, כדי להציג את האפשרות הכי טובה, גם אם לא התבקשה במפורש. הסבר בקצרה למה אתה מציע את זה ("ראיתי שיש לך ניסיון בנהיגה, אז מלבד משרות נהג יש לנו גם משרות בלוגיסטיקה שיכולות להתאים - רוצה שאספר עליהן?").
- הצג עד 3-5 משרות בכל פעם: תפקיד, מעסיק ומיקום. שאל אם רוצים לשמוע עוד או פרטים מלאים.
- אם החיפוש לא מחזיר תוצאות, אמור זאת בבירור והציע לחפש בתחום/מיקום אחר. אל תמציא משרות שלא הוחזרו מהכלים.
- בתחילת שיחה חדשה (הודעה ראשונה), פתח בברכה קצרה: "שלום, הגעתם ל-Twenty2Jobs 😊 מדבר אביגדור, הנציג הדיגיטלי של החברה. שמח שיצרת קשר! איך קוראים לך?" ואז המשך בשלב ההיכרות לפני הצעת משרות.
- בסוף השיחה הציע להשאיר טלפון נוסף אם צריך, ותודה לו על הפנייה.
`.trim()

// המרת פורמט הכלים (Realtime) לפורמט הנדרש ע"י Chat Completions API
const CHAT_TOOLS = TOOLS.map((t) => ({
  type: "function",
  function: { name: t.name, description: t.description, parameters: t.parameters },
}))

// זיכרון שיחה זמני לכל מספר טלפון (נמחק בכל restart של השרת - מספיק לשיחה בודדת)
const waConversations = new Map()
const WA_HISTORY_LIMIT = 20 // מספר הודעות מקסימלי לשמירה בזיכרון לכל משתמש

async function callOpenAIChat(messages) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages,
      tools: CHAT_TOOLS,
      tool_choice: "auto",
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    console.error(`[whatsapp] OpenAI error: ${res.status} - ${body.slice(0, 300)}`)
    throw new Error(`OpenAI request failed (${res.status})`)
  }
  return res.json()
}

// מריץ שיחת Chat Completions עם תמיכה בכלים, עד לקבלת תשובת טקסט סופית
async function runWhatsAppTurn(history) {
  let messages = history
  for (let i = 0; i < 5; i++) {
    const data = await callOpenAIChat(messages)
    const choice = data.choices?.[0]
    const msg = choice?.message
    if (!msg) throw new Error("No message from OpenAI")

    if (msg.tool_calls && msg.tool_calls.length > 0) {
      messages = [...messages, msg]
      for (const call of msg.tool_calls) {
        let args = {}
        try {
          args = JSON.parse(call.function.arguments || "{}")
        } catch {
          args = {}
        }
        console.log(`🔧 [whatsapp] tool: ${call.function.name}`, args)
        const result = await handleToolCall(call.function.name, args)
        messages = [
          ...messages,
          {
            role: "tool",
            tool_call_id: call.id,
            content: JSON.stringify(result),
          },
        ]
      }
      continue // חוזרים לשלוח ל-OpenAI עם תוצאות הכלים
    }

    return { reply: msg.content || "", messages: [...messages, msg] }
  }
  return { reply: "מצטערים, קרתה תקלה זמנית. נסה שוב בעוד רגע.", messages }
}

// ── Express: TwiML לשיחה נכנסת ──────────────────────────────────
const app = express()
app.use(express.urlencoded({ extended: false }))

app.get("/", (_req, res) => res.send("Twenty2 Voice Bot is running ✅"))

// ── Webhook להודעות וואטסאפ נכנסות (Twilio WhatsApp) ───────────
app.post("/whatsapp", async (req, res) => {
  const from = req.body.From // לדוגמה: "whatsapp:+972501234567"
  const body = (req.body.Body || "").trim()
  console.log(`📱 [whatsapp] from ${from}: "${body}"`)

  try {
    let history = waConversations.get(from)
    if (!history) {
      history = [{ role: "system", content: WHATSAPP_SYSTEM_INSTRUCTIONS }]
    }
    history = [...history, { role: "user", content: body }]

    const { reply, messages } = await runWhatsAppTurn(history)

    // חיתוך היסטוריה כדי לא לגדול בלי גבול (שומרים system + N אחרונות)
    const trimmed = [messages[0], ...messages.slice(-WA_HISTORY_LIMIT)]
    waConversations.set(from, trimmed)

    console.log(`🗣️  [whatsapp] reply: "${reply}"`)
    res.type("text/xml").send(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(reply)}</Message></Response>`
    )
  } catch (err) {
    console.error("[whatsapp] error:", err)
    res
      .type("text/xml")
      .send(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Message>מצטערים, קרתה תקלה זמנית. נסה שוב בעוד רגע 🙏</Message></Response>`
      )
  }
})

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

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
            voice: "cedar",
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
