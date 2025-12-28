# TWENTY2CRM - מערכת CRM מתקדמת לניהול כוח אדם

מערכת CRM מקיפה ומתקדמת לניהול תהליכי גיוס וכוח אדם, בנויה עם Next.js 14, TypeScript, Prisma, ו-NextAuth.

## ✨ תכונות עיקריות

### 🔐 אימות ואבטחה
- מערכת התחברות והרשמה מאובטחת
- ניהול הרשאות לפי תפקידים (Admin, Recruiter, Manager, Viewer)

### 👥 ניהול מועמדים
- ממשק מקיף לניהול מועמדים
- מעקב אחר סטטוס מועמדות
- דירוג ומעקב

### 💼 ניהול משרות
- יצירה וניהול משרות פתוחות
- תמיכה ברב-לשוניות
- מעקב אחר מועמדים למשרה

### 📅 ניהול ראיונות
- תיאום ראיונות עם מועמדים
- סוגי ראיון שונים
- משוב ודירוגים

### 📊 דשבורד וסטטיסטיקות
- תצוגה מקיפה של פעילות הגיוס
- סטטיסטיקות real-time

## 🚀 התקנה והרצה

### התקן dependencies:
```bash
npm install
```

### הגדר משתני סביבה (.env):
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### הכן את מסד הנתונים:
```bash
npm run db:push
npm run db:seed
```

### הרץ את השרת:
```bash
npm run dev
```

### פרטי התחברות ראשוניים:
- **אימייל:** admin@twenty2crm.com
- **סיסמה:** admin123

⚠️ **חשוב:** שנה את הסיסמה לאחר ההתחברות הראשונה!

## 🛠️ טכנולוגיות

- Next.js 14
- TypeScript
- Prisma (SQLite)
- NextAuth.js
- Tailwind CSS
- Radix UI

## 📁 מבנה הפרויקט

```
crm-app/
├── prisma/            # סכימת DB ו-seed
├── src/
│   ├── app/          # דפים ו-API
│   ├── components/   # רכיבים
│   └── lib/          # פונקציות עזר
```

## 🔧 פקודות שימושיות

```bash
npm run dev          # הרצה במצב פיתוח
npm run build        # בניה לייצור
npm run db:push      # עדכון מסד נתונים
npm run db:seed      # מילוי נתוני דוגמה
npm run db:studio    # Prisma Studio
```

---

**נבנה עם ❤️ על ידי TWENTY2GETHER**

