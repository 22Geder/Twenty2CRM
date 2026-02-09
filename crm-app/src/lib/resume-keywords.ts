export const resumeKeywords = [
  // עברית - מונחים בסיסיים
  'קורות חיים', 'קו"ח', 'קוח', 'קורות', 'חיים',
  'מועמד', 'מועמדת', 'מועמדות', 'מועמדים',
  'משרה', 'עבודה', 'תעסוקה', 'העסקה',
  
  // עברית - פעולות וכוונות
  'מחפש עבודה', 'מחפשת עבודה', 'מחפשים עבודה',
  'מעוניין במשרה', 'מעוניינת במשרה', 'מעוניינים במשרה',
  'מגיש מועמדות', 'מגישה מועמדות', 'מגישים מועמדות',
  'שליחת קורות', 'הגשת מועמדות', 'הגשת קורות',
  'קבלו קורות', 'קבלו את קורות החיים', 'מצורף קורות חיים',
  'בקשה למשרה', 'מועמדות למשרה', 'פנייה למשרה',
  
  // עברית - מילות מצב
  'דרושים', 'דרושה', 'דרוש', 'גיוס', 'גייסתם', 'מגייסים',
  'התפקיד', 'המשרה', 'עמדה', 'פנוי', 'פנויה', 'זמין', 'זמינה',
  'מיידי', 'זמינות מיידית', 'התחלה מיידית',
  
  // עברית - ניסיון ומיומנויות
  'ניסיון', 'ניסיון בתחום', 'ניסיון מקצועי', 'ותק',
  'מיומנויות', 'כישורים', 'יכולות', 'התמחות',
  'השכלה', 'תואר', 'לימודים', 'קורסים',
  'שפות', 'עברית', 'אנגלית', 'רוסית', 'ערבית',
  
  // עברית - מונחי עבודה
  'שכר', 'משכורת', 'תנאים', 'היקף משרה',
  'משרה מלאה', 'חלקית', 'שעות גמישות',
  'מתאים', 'מתאימה', 'התאמה', 'מתאים לי',
  
  // אנגלית - בסיסי
  'cv', 'resume', 'curriculum vitae', 'cover letter',
  'candidate', 'applicant', 'application',
  'job application', 'job seeker', 'employment',
  'apply', 'applying', 'applied',
  
  // אנגלית - מצורף
  'attached', 'cv attached', 'resume attached',
  'please find attached', 'attached herewith',
  'enclosed', 'attached my cv', 'my resume is attached',
  
  // אנגלית - כוונות
  'interested in', 'looking for', 'seeking',
  'available for', 'position', 'opportunity',
  'hire', 'hiring', 'recruitment', 'recruit',
  
  // אנגלית - ניסיון
  'experience', 'skills', 'qualifications',
  'education', 'background', 'expertise',
  'professional', 'work history', 'career',
  
  // מונחי קבצים
  'pdf', 'doc', 'docx', '.pdf', '.doc', '.docx',
  'portfolio', 'תיק עבודות',
  
  // מונחים משולבים
  'קורות חיים מצ"ב', 'קו"ח מצורף', 'cv מצורף',
  'שלום רב', 'לכבוד', 'למנהל גיוס', 'למחלקת משאבי אנוש',
  'hr', 'human resources', 'משאבי אנוש'
]

export function hasResumeKeywords(...texts: Array<string | null | undefined>) {
  const combined = texts.filter(Boolean).join(' ').toLowerCase()
  return resumeKeywords.some((keyword) => combined.includes(keyword.toLowerCase()))
}
