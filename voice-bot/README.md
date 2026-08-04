# 📞 Twenty2 Voice Bot – בוט קולי של OpenAI לטלפון

בוט קולי שמתקשרים אליו בטלפון (דרך Twilio), מבוסס על **OpenAI Realtime API**,
עם גישה בזמן אמת למאגר המשרות של TWENTY2CRM.

```
📞 מתקשר → Twilio (מספר טלפון) → voice-bot (שרת גשר) → OpenAI Realtime API
                                        ↕
                          CRM: /api/voice/positions (מוגן API key)
```

## מה נבנה
1. **`crm-app/src/app/api/voice/positions/route.ts`** – endpoint מאובטח (ב-`VOICE_API_KEY`)
   שמחזיר משרות פעילות. לא דורש התחברות, לא חושף PII.
2. **`voice-bot/server.js`** – שרת הגשר: מקבל שיחות מ-Twilio, מגשר לאודיו של OpenAI,
   ומריץ את הכלים `search_positions` ו-`get_position_details` מול ה-CRM.

---

## שלב 1 – הגדרת ה-CRM

הוסף משתנה סביבה ל-CRM (Railway → Variables), מחרוזת אקראית ארוכה:

```
VOICE_API_KEY=<מחרוזת אקראית ארוכה, למשל 40 תווים>
```

בדיקה שהendpoint עובד (החלף את הכתובת והמפתח):

```bash
curl -H "x-api-key: <VOICE_API_KEY>" \
  "https://your-crm.up.railway.app/api/voice/positions?search=נהג"
```

אמור להחזיר JSON עם רשימת משרות.

---

## שלב 2 – הרצת שרת הגשר

```bash
cd voice-bot
npm install
cp .env.example .env   # ומלא את הערכים
npm start
```

### פיתוח מקומי (חשיפת השרת לאינטרנט עבור Twilio)
Twilio צריך גישה ל-WebSocket שלך. השתמש ב-ngrok:

```bash
ngrok http 5050
```

קח את הדומיין (למשל `abc123.ngrok-free.app`) ושים אותו ב-`PUBLIC_HOST` שב-`.env`.

---

## שלב 3 – הגדרת Twilio

1. פתח חשבון ב-[twilio.com](https://www.twilio.com) וקנה מספר טלפון (Voice).
2. ב-Console → Phone Numbers → המספר שלך → **A CALL COMES IN**:
   - הגדר ל-**Webhook**, שיטה `HTTP POST`, כתובת:
     ```
     https://<PUBLIC_HOST>/incoming-call
     ```
3. שמור. עכשיו כשמתקשרים למספר – הבוט עונה. 🎉

---

## שלב 4 – פריסה לפרודקשן (Railway)

מומלץ לפרוס את `voice-bot/` כ-**שירות נפרד** ב-Railway (לא יחד עם ה-CRM):

1. New Service → מאותו repo → Root Directory = `voice-bot`.
2. הגדר Variables: `OPENAI_API_KEY`, `CRM_BASE_URL`, `VOICE_API_KEY`,
   `PUBLIC_HOST` (הדומיין של השירות הזה), `OPENAI_REALTIME_MODEL`.
3. Start command: `npm start` (Railway מזריק `PORT`).
4. עדכן את ה-Webhook ב-Twilio לכתובת הפרודקשן.

---

## עלויות משוערות
| רכיב | עלות |
|------|------|
| OpenAI Realtime (audio) | ~$0.06/דק' קלט, ~$0.24/דק' פלט |
| Twilio מספר | ~$1–15/חודש |
| Twilio דקות שיחה | ~$0.01/דק' |

---

## אבטחה 🔒
- ה-endpoint ב-CRM מוגן ב-`VOICE_API_KEY` – שמור אותו סודי, אל תעשה לו commit.
- `VOICE_API_KEY` חייב להיות **זהה** ב-CRM וב-voice-bot.
- ה-`.env` כבר ב-`.gitignore`. אל תוסיף אותו ל-git.
- הבוט קורא רק משרות **פעילות** (`active: true`) ולא חושף מיילים/פרטי מגייסים.

## התאמה אישית
- **קול הבוט**: שנה `voice: "alloy"` ב-`server.js` (alloy / echo / shimmer ועוד).
- **אישיות/שפה**: ערוך את `SYSTEM_INSTRUCTIONS` ב-`server.js`.
- **כלים נוספים**: הוסף פונקציות ל-`TOOLS` ול-`handleToolCall`.
