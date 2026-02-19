# 📁 מבנה סקריפטים - Prisma

## 🌱 seeds/
סקריפטים להוספת נתונים חדשים:
- `seed.js` - סיד ראשי
- `seed-full.js` - סיד מלא
- `seed-hebrew.js` - סיד עם אותיות עבריות
- `seed-production.js` - סיד לייצור
- `seed-all-jobs.js` - כל המשרות
- `seed-*-positions.js` - משרות לפי מעסיק ספציפי

## 🔄 updates/
סקריפטים לעדכון נתונים קיימים:
- `update-*-positions.js` - עדכון משרות
- `update-*-email.js` - עדכון אימיילים
- `update-*-contacts.js` - עדכון אנשי קשר
- `upgrade-all-keywords.js` - עדכון מילות מפתח

## 🔍 checks/
סקריפטים לבדיקה וקריאת נתונים:
- `check-*.js` - בדיקות שונות
- `read-local-db.js` - קריאת DB מקומי
- `find-sales-candidates.js` - חיפוש מועמדים
- `verify-positions.js` - אימות משרות

## 🔧 fixes/
סקריפטים לתיקון בעיות:
- `fix-*.js` - תיקונים שונים
- `delete-*.js` - מחיקות
- `reset-for-production.js` - איפוס לייצור

## 📊 data/
קבצי נתונים:
- `exported-data.json` - נתונים מיוצאים

---

## 📝 הפעלה

```bash
# הפעלת סקריפט
node prisma/seeds/seed.js

# או דרך npm
npm run db:seed
```

## ⚠️ אזהרות

- **delete-all-positions.js** - מוחק את כל המשרות! השתמש בזהירות
- **reset-for-production.js** - מאפס את ה-DB! להשתמש רק בהכנה לייצור
- תמיד עשה גיבוי לפני הרצת סקריפטים שמשנים נתונים
