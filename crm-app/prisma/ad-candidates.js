const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ניקוד למשרה - כמה כדאי לפרסם אותה בפרסום ממומן (פייסבוק/אינסטגרם)
function scorePosition(p) {
  let score = 0;
  const reasons = [];

  // 1. משרה פתוחה עם הרבה משרות פנויות (openings) - צריך יותר מועמדים
  if (p.openings >= 5) { score += 25; reasons.push(`${p.openings} משרות פנויות`); }
  else if (p.openings >= 3) { score += 15; reasons.push(`${p.openings} משרות פנויות`); }
  else if (p.openings >= 2) { score += 8; }

  // 2. פריוריטי גבוה שהוגדר ידנית ע"י המערכת
  if (p.priority >= 3) { score += 20; reasons.push('עדיפות גבוהה'); }
  else if (p.priority >= 1) { score += 10; }

  // 3. יחס מועמדים למשרה - כמה מועמדויות יש כבר (פחות = צריך יותר פרסום)
  const applicantsPerOpening = p.applications.length / Math.max(p.openings, 1);
  if (applicantsPerOpening < 1) { score += 25; reasons.push('מעט מאוד מועמדים ביחס למשרות פתוחות'); }
  else if (applicantsPerOpening < 3) { score += 15; reasons.push('יחס מועמדים/משרות נמוך'); }
  else if (applicantsPerOpening < 6) { score += 5; }

  // 4. משרה עדיין פתוחה זמן ארוך (ותיקה) - סימן שקשה לאייש, זקוקה לדחיפה
  const ageDays = (Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays > 60) { score += 15; reasons.push('פתוחה מעל חודשיים - קשה לאיוש'); }
  else if (ageDays > 30) { score += 10; reasons.push('פתוחה מעל חודש'); }
  else if (ageDays < 7) { score += 5; reasons.push('משרה חדשה'); }

  // 5. יש שכר מפורט - אטרקטיבי יותר למודעה
  if (p.salaryRange && p.salaryRange.trim().length > 0) { score += 10; reasons.push('טווח שכר מוגדר'); }

  // 6. יש תיאור ודרישות מפורטים - מודעה איכותית יותר
  if (p.description && p.description.length > 100) { score += 5; }

  // 7. יש מגייס משויך - מישהו שיוכל לטפל בפניות
  if (p.recruiterId) { score += 5; } else { reasons.push('⚠️ אין מגייס משויך'); }

  return { score, reasons, applicantsPerOpening: applicantsPerOpening.toFixed(1), ageDays: Math.round(ageDays) };
}

async function main() {
  const positions = await prisma.position.findMany({
    where: { active: true },
    include: {
      employer: { select: { name: true } },
      recruiter: { select: { name: true } },
      applications: { select: { id: true } },
    },
  });

  console.log(`נבדקו ${positions.length} משרות פעילות\n`);

  const ranked = positions
    .map(p => ({ p, ...scorePosition(p) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  console.log('=== TOP 20 משרות מומלצות לפרסום ממומן (פייסבוק/אינסטגרם) ===\n');
  ranked.forEach((r, i) => {
    console.log(`${i + 1}. ${r.p.title} | ${r.p.employer.name} | ${r.p.location || 'ללא מיקום'}`);
    console.log(`   ניקוד: ${r.score} | משרות פנויות: ${r.p.openings} | מועמדים: ${r.p.applications.length} (יחס: ${r.applicantsPerOpening}) | גיל: ${r.ageDays} ימים | מגייס: ${r.p.recruiter?.name || 'אין'}`);
    console.log(`   סיבות: ${r.reasons.join(', ')}`);
    console.log('');
  });
}

main().finally(() => prisma.$disconnect());
