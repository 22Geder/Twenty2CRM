import { describe, expect, it } from 'vitest'
import { createMatchingTextIndex, extractMatchingConcepts, findTermEvidence, getMatchingRoleFamilies, matchingTermsEquivalent, normalizeMatchingText } from '../matching-text'

describe('מונחים מקצועיים וגבולות מילים', () => {
  it.each([
    ['מחסנאית', 'warehouse worker'], ['מלקט', 'order picker'], ['פריוריטי', 'Priority'],
    ['אקסל', 'Excel'], ['יועץ שירות מוסך', 'service advisor'], ['מנהל/ת חשבונות', 'bookkeeper'],
    ['חשבת שכר', 'payroll specialist'], ['מכירות שטח', 'outside sales'], ['נציגת שירות', 'customer service'],
    ['ג׳ירפה', 'reach truck'], ['רישיון C1', 'c1 license'], ['מְחַסְנָאִי', 'מחסנאי'],
  ])('מזהה שקילות מפורשת: %s / %s', (left, right) => {
    expect(matchingTermsEquivalent(left, right)).toBe(true)
    expect(findTermEvidence(`ניסיון: ${left}`, right)?.assertion).toBe('positive')
  })

  it.each([
    ['JavaScript', 'Java'], ['NoSQL', 'SQL'], ['מנהג', 'נהג'], ['C++', 'C#'], ['C', 'C#'],
    ['רישיון C', 'רישיון C1'], ['רישיון B', 'רישיון C'], ['מלגזן', 'רישיון מלגזה'],
    ['היגש', 'רישיון מלגזה'], ['הנדסאי חשמל', 'מהנדס חשמל'], ['מוסמך', 'תואר שני'],
    ['מנהל חשבונות', 'רואה חשבון'], ['בנקאי', 'טלר'], ['מאבטח', 'ממונה בטיחות'],
    ['מנהל', 'מחסנאי'], ['מנהל מכירות', 'מכירות שטח'], ['מזכירה', 'נהג'],
  ])('לא ממציא שקילות: %s / %s', (left, right) => {
    expect(matchingTermsEquivalent(left, right)).toBe(false)
    expect(findTermEvidence(left, right)).toBeNull()
  })

  it('שומר סימנים טכניים', () => {
    expect(normalizeMatchingText('C# C++ .NET Node.js JavaScript')).toBe('c# c++ .net node.js javascript')
    expect(findTermEvidence('פיתוח ב-C# וב-Node.js', 'C#')?.quote).toBe('C#')
  })

  it('תפקיד ספציפי גובר על ביטוי גנרי הכלול בו', () => {
    expect(extractMatchingConcepts('מכירות שטח')).toHaveLength(1)
    expect(getMatchingRoleFamilies('מנהל חשבונות')).toEqual(['finance'])
    expect(getMatchingRoleFamilies('אין ניסיון במכירות')).toEqual([])
  })
})

describe('ראיות, שלילה ושאיפות', () => {
  it.each([
    ['אין ניסיון באקסל', 'Excel', 'negated'], ['ללא רישיון מלגזה', 'forklift license', 'negated'],
    ['לא יודע Java', 'Java', 'negated'], ['no experience with SQL', 'SQL', 'negated'],
    ['I do not have a forklift license', 'רישיון מלגזה', 'negated'],
    ['מעוניין להיות מחסנאי', 'warehouse worker', 'aspiration'], ['מחפשת עבודה כמנהלת חשבונות', 'bookkeeper', 'aspiration'],
    ['seeking a job as a developer', 'developer', 'aspiration'],
    ['סטודנט לתואר ראשון', 'תואר ראשון', 'in_progress'], ['pursuing a bachelor degree', 'תואר ראשון', 'in_progress'],
  ])('מסווג %s בלי להעניק ניסיון לא מוכח', (text, term, assertion) => {
    expect(findTermEvidence(text, term)?.assertion).toBe(assertion)
  })

  it('שלילה במשפט אחד לא מוחקת ניסיון במשפט אחר', () => {
    expect(findTermEvidence('אין ניסיון ב-SQL. ניסיון ב-Java', 'Java')?.assertion).toBe('positive')
    expect(findTermEvidence('אין ניסיון באקסל. לאחר מכן עברתי הכשרה באקסל', 'Excel')?.assertion).toBe('positive')
  })

  it('שומר גם ראיות סותרות לבדיקת הדרישות', () => {
    const index = createMatchingTextIndex('רישיון מלגזה\nללא רישיון מלגזה')
    expect(index.byConcept.get('forklift_license')?.map(item => item.assertion)).toEqual(['positive', 'negated'])
  })

  it('קורא עד סוף הטקסט ושומר אופסטים מדויקים בטקסט המקורי', () => {
    const text = 'טקסט רקע\n'.repeat(1600) + 'ניסיון ב-\u200fפְּרִיוֹרִיטִי ובאקסל'
    const found = findTermEvidence(text, 'Priority')!
    expect(found.start).toBeGreaterThan(10000)
    expect(text.slice(found.start, found.end)).toBe(found.quote)
    expect(found.assertion).toBe('positive')
    expect(extractMatchingConcepts(`${text}\nPriority Priority`).filter(item => item.concept === 'priority')).toHaveLength(1)
  })

  it('אין התאמה בין שורות נפרדות או מתוך כתובת דואר', () => {
    expect(findTermEvidence('רישיון\nמלגזה', 'רישיון מלגזה')).toBeNull()
    expect(findTermEvidence('java@example.invalid', 'Java')).toBeNull()
    expect(matchingTermsEquivalent('', '')).toBe(false)
  })

  it('לא מעניק כישורים מרשימה שלילית', () => {
    expect(findTermEvidence('אין ניסיון ב-Java, SQL ו-Python', 'SQL')?.assertion).toBe('negated')
    expect(findTermEvidence('אין ניסיון ב-Java, ניסיון ב-SQL', 'SQL')?.assertion).toBe('positive')
  })
})

describe('כותרות משרה אמיתיות: סיומות מגדר ומקצועות מהמערכת', () => {
  it.each([
    ['נציג.ת שירות והשכרה - אזור מרכז', 'rental_agent'], ['נציגי.ות מכירות אולם תצוגה', 'sales'],
    ['דיילי.ות השכרה בכל הארץ', 'rental_agent'], ['תומכ.ת מכירה', 'sales'], ['מנהל.ת חשבונות', 'bookkeeper'],
    ['איש.אשת אחזקה', 'maintenance'], ['מוקדנ.ית שירות טלפוני', 'customer_service'],
    ['סגן/ת מנהל/ת – ACE אייס כפר סבא', 'deputy_store_manager'], ['מוכרן/ית – ACE אייס בילו', 'sales_clerk'],
    ['בקר/ית - בית שמש', 'inventory_controller'], ['עוזר/ת צמיגאי – אוטודיפו', 'tire_technician'],
    ['מפעיל/ת מערכת WMS – לוד', 'wms_operator'], ['יועץ שירות', 'auto_service_advisor'], ['יועצ.ת מוסך', 'auto_service_advisor'],
    ['מנהל/ת סניף – Office Depot', 'store_manager'], ['מאבחן/ת רכב – מרכז שירות', 'auto_diagnostics'],
    ['רפרנט/ית שטח - לוגיסטים', 'logistics_coordinator'], ['סדרן/ית הפצה – בית שמש', 'dispatcher'],
    ['עובד/ת אינטרנט – מלקט/ת', 'online_orders'], ['נציג/ת און ליין – ACE', 'online_orders'],
    ['מתאמ/ת סחר ולקוחות', 'trade_coordinator'], ['מתאם/ת ייבוא', 'import_export'], ['עובד/ת אריזה', 'packer'],
    ['מיישם/ת פריוריטי – מחלקת מערכות מידע', 'erp_implementer'], ['לאשינג - דוברי/ות רוסית', 'port_work'],
    ['סוור/ת - עבודת פריקה וטעינה', 'port_work'], ['איש/אשת תפעול', 'operations'], ['פקיד/ת רכש', 'procurement'],
    ['קולט/ת סחורה - בני דרום', 'goods_receiving'], ['עובד/ת מעבדה', 'lab_worker'], ['עובד/ת הרכבה', 'assembler'],
    ['מבקר איכות - תדיראן', 'quality_control'], ['מפעיל/ת מכונות CNC', 'cnc_operator'], ['הנדסאי ציוד', 'practical_engineer_role'],
    ['נהג/ת סמיטריילר', 'driver'], ['מכונאי ניידת צמ"ה', 'mechanic'], ['חשמלאי רכב מקצועי', 'auto_electrician'],
    ['פחח', 'body_shop'], ['מסגר', 'metalwork'], ['ראש/ת צוות מוקד', 'team_leader'], ['אחמש/ית מוקד', 'team_leader'],
    ['מומחה/ית מוצר XPENG', 'product_specialist'], ['איש מסירות רכב חדש', 'vehicle_delivery'], ['נציג.ת מגרש לפארק ראם', 'auto_sales'],
    ['אחראי/ת תיק לקוח עסקי', 'account_manager'], ['סוכן/ת ביטוח פנסיוני/ת', 'insurance_agent'], ['מיישב.ת תביעות', 'insurance_claims'],
    ['נציג.ת בק אופיס למוקד הטכני', 'back_office'], ['נציג/ת תמיכה טכנית', 'technical_support'], ['איש גיוס מועמדים', 'recruiter'],
    ['פקיד/ה - אשדוד', 'administration'], ['עובד/ת כללי/ת', 'production'], ['מחסנאי/ת עובד/ת דלפק', 'warehouse'],
  ])('%s → מקצוע %s', (title, concept) => {
    const roles = extractMatchingConcepts(title).filter(item => item.assertion === 'positive')
    expect(roles.map(item => item.concept)).toContain(concept)
  })

  it('סיומת מגדר עם נקודה אינה משנה את המילה ואינה יוצרת מילה חדשה', () => {
    expect(normalizeMatchingText('נציג.ת נציגי.ות דיילי.ות תומכ.ת')).toBe('נציג נציג דייל תומכ')
    expect(normalizeMatchingText('נציג/ת נציגי/ות')).toBe('נציג נציג')
    expect(normalizeMatchingText('Node.js v18.2')).toBe('node.js v18.2')
  })

  it('כישורי מחסן חדשים מזוהים וללא ערבוב עם רישיון', () => {
    expect(extractMatchingConcepts('עבודה עם מסופון, מלגזת צריח, ג׳ק חשמלי').map(item => item.concept).sort()).toEqual(['pallet_jack', 'rf_scanner', 'turret_truck'])
    expect(matchingTermsEquivalent('מלגזן צריח', 'רישיון מלגזה')).toBe(false)
  })

  it.each([
    ['בישול אורז לבן', 'packer'], ['בוחן נהיגה', 'auto_diagnostics'], ['מאבחן דידקטי', 'auto_diagnostics'],
    ['במסגרת התפקיד', 'metalwork'], ['רכש ניסיון רב', 'procurement'], ['מרכיבי השכר', 'assembler'],
    ['אריזה של מתנות', 'packer'], ['התקנות תוכנה', 'auto_installer'], ['תפעול שוטף של המשרד', 'operations'], ['הרכבה של רהיטים בבית', 'assembler'],
  ])('%s לא הופך למקצוע %s', (text, concept) => {
    expect(extractMatchingConcepts(text).map(item => item.concept)).not.toContain(concept)
  })
})