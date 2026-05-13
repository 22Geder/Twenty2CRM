/**
 * עדכון מיקומי משרות של קבוצת מאיר במסד הנתונים המקומי (SQLite) -
 * החלפת "מרכז שירות X" בשם העיר בלבד.
 *
 * מיפוי:
 *   מרכז שירות צפון      -> חיפה
 *   מרכז שירות עמק חפר   -> נתניה / חדרה   (שניהם יסונכרנו במנוע ההתאמה)
 *   מרכז שירות דרום      -> באר שבע
 *   מרכז שירות אשדוד     -> אשדוד
 *   מרכז שירות רמלה      -> רמלה
 *   מרכז שירות ראשל"צ    -> ראשון לציון
 *   מרכז שירות רעננה     -> רעננה
 *   מרלו"ג                -> נשאר ללא שינוי
 *
 * שימוש:
 *   node prisma/update-meir-locations.js          # עדכון
 *   node prisma/update-meir-locations.js --dry    # רק תצוגה מקדימה
 */

const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DRY_RUN = process.argv.includes('--dry');

const url = process.env.DATABASE_URL || '';
const dbPath = url.replace(/^file:/, '');
if (!dbPath) {
  console.error('❌ לא נמצא DATABASE_URL בתצורת file:...');
  process.exit(1);
}

console.log(`📂 DB: ${dbPath}`);
if (DRY_RUN) console.log('🧪 מצב DRY RUN - לא משנה כלום\n');

const MAP = [
  { re: /מרכז\s*שירות\s*עמק\s*חפר/, city: 'נתניה / חדרה' },
  { re: /מרכז\s*שירות\s*ראשל["']?צ/, city: 'ראשון לציון' },
  { re: /מרכז\s*שירות\s*ראשון\s*לציון/, city: 'ראשון לציון' },
  { re: /מרכז\s*שירות\s*רעננה/, city: 'רעננה' },
  { re: /מרכז\s*שירות\s*רמלה/, city: 'רמלה' },
  { re: /מרכז\s*שירות\s*אשדוד/, city: 'אשדוד' },
  { re: /מרכז\s*שירות\s*צפון/, city: 'חיפה' },
  { re: /מרכז\s*שירות\s*דרום/, city: 'באר שבע' },
];

function mapLocation(loc) {
  if (!loc) return null;
  for (const { re, city } of MAP) {
    if (re.test(loc)) return city;
  }
  return null;
}

const db = new Database(dbPath);

try {
  console.log('🔍 מאתר את קבוצת מאיר...');
  const employer = db
    .prepare(
      `SELECT id, name FROM Employer
       WHERE email = 'hr@meirgroup.co.il' OR name LIKE '%מאיר%'
       LIMIT 1`
    )
    .get();

  if (!employer) {
    console.error('❌ לא נמצא מעסיק "קבוצת מאיר"');
    process.exit(1);
  }
  console.log(`✅ מעסיק: ${employer.name} (${employer.id})`);

  const positions = db
    .prepare('SELECT id, title, location FROM Position WHERE employerId = ?')
    .all(employer.id);

  console.log(`📋 נמצאו ${positions.length} משרות\n`);

  const updateStmt = db.prepare('UPDATE Position SET location = ? WHERE id = ?');

  let updated = 0;
  let unchanged = 0;
  const skippedList = [];

  const tx = db.transaction(() => {
    for (const p of positions) {
      const newLoc = mapLocation(p.location);

      if (!newLoc) {
        unchanged++;
        skippedList.push(`   • ${p.title} — "${p.location || '(ריק)'}"`);
        continue;
      }

      if (newLoc === p.location) {
        unchanged++;
        continue;
      }

      console.log(`✏️  ${p.title}: "${p.location}" -> "${newLoc}"`);
      if (!DRY_RUN) {
        updateStmt.run(newLoc, p.id);
      }
      updated++;
    }
  });

  tx();

  console.log(
    `\n🎉 סיום: ${updated} ${DRY_RUN ? 'ישתנו' : 'עודכנו'}, ${unchanged} ללא שינוי`
  );
  if (skippedList.length) {
    console.log('\nמשרות שלא במיפוי (לא שונו - בדוק ידנית):');
    skippedList.forEach((l) => console.log(l));
  }
} finally {
  db.close();
}
