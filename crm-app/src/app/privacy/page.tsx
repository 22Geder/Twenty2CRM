import Link from "next/link"

export const metadata = {
  title: "מדיניות פרטיות | Twenty2CRM",
  description: "מדיניות הפרטיות של מערכת Twenty2CRM",
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-800" dir="rtl">
      <article className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <div className="mb-8 border-b border-slate-200 pb-6">
          <Link href="/" className="text-sm font-semibold text-blue-700 hover:underline">
            Twenty2CRM
          </Link>
          <h1 className="mt-3 text-3xl font-bold">מדיניות פרטיות</h1>
          <p className="mt-2 text-sm text-slate-500">עודכן לאחרונה: 14 בספטמבר 2026</p>
        </div>

        <div className="space-y-7 leading-7">
          <section>
            <h2 className="mb-2 text-xl font-bold">המידע שנאסף</h2>
            <p>
              Twenty2CRM היא מערכת לניהול גיוס. המערכת שומרת מידע שמוזן על ידי משתמשיה,
              לרבות פרטי מועמדים, משרות, מעסיקים, ראיונות ופעילות גיוס.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold">שימוש ב-Google Calendar</h2>
            <p>
              לאחר אישור מפורש של המשתמש, המערכת משתמשת בהרשאת Google Calendar לצורך
              יצירה, עדכון, הצגה וביטול של אירועי גיוס ביומן המחובר. המערכת אינה מבקשת
              את סיסמת Google ואינה מוכרת מידע שמתקבל מ-Google לצדדים שלישיים.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold">שמירה ואבטחה</h2>
            <p>
              הגישה למידע מוגבלת למשתמשים מורשים. אסימוני גישה נשמרים בצד השרת ואינם
              מוצגים בדפדפן. אנו נוקטים אמצעים סבירים להגנה מפני גישה או שימוש בלתי מורשים.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold">שליטה ומחיקה</h2>
            <p>
              ניתן לנתק את Google Calendar בכל עת ממסך הגדרות היומן במערכת. ניתוק היומן
              מפסיק שימוש עתידי בהרשאה. ניתן גם לבטל את הרשאת האפליקציה דרך חשבון Google.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold">יצירת קשר</h2>
            <p>
              לשאלות בנושא פרטיות ניתן לפנות אל
              {" "}<a href="mailto:office@hr22group.com" className="font-semibold text-blue-700 hover:underline">office@hr22group.com</a>.
            </p>
          </section>
        </div>
      </article>
    </main>
  )
}