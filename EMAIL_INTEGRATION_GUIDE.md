# 📧 הגדרת אינטגרציה עם אימייל - Email to CRM

מדריך זה מסביר כיצד להגדיר את מערכת ה-CRM לקבל קורות חיים אוטומטית מאימייל.

## 🎯 מה המערכת עושה?

כאשר מישהו שולח קורות חיים למייל שלך:
1. **קבלה אוטומטית** - המערכת מזהה את המייל והקבצים המצורפים
2. **ניתוח חכם** - בוט AI מנתח את קורות החיים ומחלץ מידע
3. **יצירת מועמד** - מוסיף אוטומטית את המועמד למערכת
4. **שיוך למשרות** - מוצא ומשייך אוטומטית למשרות מתאימות
5. **התראה** - מודיע לך על מועמדים חדשים

## 🔧 אפשרויות הגדרה

### אפשרות 1: Gmail (מומלץ)

#### שלב 1: הפעל Gmail API
1. עבור ל-[Google Cloud Console](https://console.cloud.google.com)
2. צור פרויקט חדש
3. הפעל את Gmail API
4. צור OAuth 2.0 credentials
5. הורד את קובץ ה-credentials

#### שלב 2: התקן ספריה
\`\`\`bash
npm install @google-cloud/local-auth googleapis
\`\`\`

#### שלב 3: צור סקריפט להאזנה
צור קובץ: `scripts/gmail-watcher.js`

\`\`\`javascript
const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_PATH = path.join(__dirname, 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');

async function authorize() {
  const credentials = JSON.parse(
    await fs.readFile(CREDENTIALS_PATH)
  );
  
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]
  );

  try {
    const token = JSON.parse(await fs.readFile(TOKEN_PATH));
    oAuth2Client.setCredentials(token);
  } catch (err) {
    return getNewToken(oAuth2Client);
  }
  return oAuth2Client;
}

async function watchForNewEmails() {
  const auth = await authorize();
  const gmail = google.gmail({version: 'v1', auth});

  // חפש מיילים עם קבצים מצורפים
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: 'has:attachment newer_than:1h', // מיילים עם קבצים מצורפים מהשעה האחרונה
  });

  const messages = res.data.messages || [];
  
  for (const message of messages) {
    await processEmail(gmail, message.id);
  }
}

async function processEmail(gmail, messageId) {
  const message = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
  });

  const headers = message.data.payload.headers;
  const from = headers.find(h => h.name === 'From')?.value;
  const subject = headers.find(h => h.name === 'Subject')?.value;
  
  // חלץ את גוף המייל והקבצים המצורפים
  const body = extractBody(message.data.payload);
  const attachments = await extractAttachments(gmail, message.data);

  // שלח ל-API של ה-CRM
  await fetch('http://localhost:3000/api/email-webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      subject,
      text: body,
      attachments,
    }),
  });
  
  console.log(\`✅ Processed email from \${from}\`);
}

// הרץ כל 5 דקות
setInterval(watchForNewEmails, 5 * 60 * 1000);
watchForNewEmails(); // הרצה ראשונית
\`\`\`

#### שלב 4: הרץ את ה-watcher
\`\`\`bash
node scripts/gmail-watcher.js
\`\`\`

---

### אפשרות 2: Outlook/Office 365

#### שלב 1: הרשם ל-Microsoft Graph API
1. עבור ל-[Azure Portal](https://portal.azure.com)
2. צור App Registration
3. הוסף הרשאות: Mail.Read
4. צור Client Secret

#### שלב 2: התקן ספריה
\`\`\`bash
npm install @microsoft/microsoft-graph-client @azure/identity
\`\`\`

#### שלב 3: צור סקריפט
צור קובץ: `scripts/outlook-watcher.js`

\`\`\`javascript
const { Client } = require('@microsoft/microsoft-graph-client');
const { ClientSecretCredential } = require('@azure/identity');

const credential = new ClientSecretCredential(
  'YOUR_TENANT_ID',
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET'
);

const client = Client.initWithMiddleware({
  authProvider: {
    getAccessToken: async () => {
      const token = await credential.getToken('https://graph.microsoft.com/.default');
      return token.token;
    }
  }
});

async function watchEmails() {
  const messages = await client
    .api('/me/messages')
    .filter(\`hasAttachments eq true and receivedDateTime gt \${new Date(Date.now() - 3600000).toISOString()}\`)
    .select('from,subject,body,hasAttachments')
    .get();

  for (const message of messages.value) {
    const attachments = await client
      .api(\`/me/messages/\${message.id}/attachments\`)
      .get();

    await fetch('http://localhost:3000/api/email-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: message.from.emailAddress.address,
        subject: message.subject,
        text: message.body.content,
        attachments: attachments.value.map(a => ({
          filename: a.name,
          content: a.contentBytes,
          contentType: a.contentType
        })),
      }),
    });
  }
}

setInterval(watchEmails, 5 * 60 * 1000);
watchEmails();
\`\`\`

---

### אפשרות 3: Zapier/Make (הכי קל!)

#### שלב 1: צור Zap חדש
1. עבור ל-[Zapier](https://zapier.com)
2. צור Zap חדש
3. **Trigger**: Gmail - New Email Matching Search
4. הגדר חיפוש: `has:attachment`

#### שלב 2: הגדר Webhook
1. **Action**: Webhooks by Zapier - POST
2. **URL**: `https://your-domain.com/api/email-webhook`
3. **Method**: POST
4. **Data**: 
   - from: {{From Email}}
   - subject: {{Subject}}
   - text: {{Body Plain}}
   - attachments: {{Attachments}}

#### שלב 3: בדיקה
שלח מייל לעצמך עם קובץ CV ובדוק שהוא מגיע למערכת!

---

## 🤖 איך הבוט AI עובד?

הבוט מנתח אוטומטית:
- ✅ **שם** - מזהה שם מלא מקורות חיים
- ✅ **טלפון** - מוצא מספר טלפון
- ✅ **כישורים** - מזהה טכנולוגיות וכישורים (React, Python, וכו')
- ✅ **ניסיון** - כמה שנות ניסיון
- ✅ **תפקיד נוכחי** - מה התפקיד האחרון
- ✅ **התאמה למשרות** - משייך אוטומטית למשרות רלוונטיות

## 📊 ציון התאמה (Match Score)

המערכת מחשבת ציון התאמה (0-100) לפי:
- **כישורים תואמים** (+20 לכל כישור)
- **ניסיון רלוונטי** (+15-25)
- **תפקיד דומה** (+30)

משרות עם ציון מעל 30 נשמרות אוטומטית.

## 🎨 התאמה אישית

ערוך את `src/app/api/email-webhook/route.ts`:

\`\`\`typescript
// שנה את סף ההתאמה
return scoredPositions
  .filter(p => p.matchScore >= 50) // במקום 30
  .slice(0, 3) // רק 3 משרות הכי טובות
\`\`\`

## 🔐 אבטחה

הוסף authentication ל-webhook:

\`\`\`typescript
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (authHeader !== \`Bearer \${WEBHOOK_SECRET}\`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // המשך הקוד...
}
\`\`\`

## 📞 תמיכה

בעיות? עיין במסך הלוגים:
\`\`\`bash
# צפה בלוגים
npm run dev
# בטרמינל נפרד
tail -f .next/server.log
\`\`\`

---

**🎉 זהו! עכשיו המערכת שלך תקבל ותעבד קורות חיים אוטומטית!**
