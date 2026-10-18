/** מילון מושגים מפורש, לא התאמת תת־מחרוזת או מרחק עריכה של רישיונות. */
export const MATCHING_TEXT_VERSION = 'evidence-he-en-v1'

export type MatchingEvidence = {
  term: string
  concept: string
  quote: string
  start: number
  end: number
  negated: boolean
  assertion: 'positive' | 'negated' | 'aspiration' | 'in_progress' | 'uncertain'
}

export type MatchingConcept = {
  id: string
  label: string
  kind: 'role' | 'skill' | 'credential' | 'language'
  family?: string
  aliases: readonly string[]
}

// משפחה משותפת מעידה על קרבה בלבד. היא אינה הופכת תפקיד, תואר או רישיון לנרדף.
export const MATCHING_CONCEPTS: readonly MatchingConcept[] = [
  { id: 'warehouse', label: 'מחסנאות', kind: 'role', family: 'logistics', aliases: ['מחסנאי', 'מחסנאית', 'מחסנאים', 'מחסנאות', 'עובד מחסן', 'עובדת מחסן', 'עוזר מחסנאי', 'עוזרת מחסנאי', 'עובד דלפק', 'עובדת דלפק', 'עובד חצר', 'עובדת חצר', 'מחסנאי חלפים', 'מחסנאית חלפים', 'warehouse worker', 'warehouse operative', 'storekeeper'] },
  { id: 'picking', label: 'ליקוט', kind: 'role', family: 'logistics', aliases: ['מלקט', 'מלקטת', 'מלקטים', 'ליקוט', 'לקט', 'לקטת', 'מלקט גובה', 'order picker', 'picking orders', 'order picking'] },
  { id: 'online_orders', label: 'הזמנות אונליין', kind: 'role', family: 'retail', aliases: ['עובד אינטרנט', 'עובדת אינטרנט', 'נציג און ליין', 'נציגת און ליין', 'נציג אונליין', 'נציגת אונליין', 'אחראי און ליין', 'אחראית און ליין', 'הזמנות אונליין', 'הזמנות און ליין', 'online orders'] },
  { id: 'goods_receiving', label: 'קליטת סחורה', kind: 'role', family: 'logistics', aliases: ['קולט סחורה', 'קולטת סחורה', 'קליטת סחורה', 'קבלת סחורה', 'קבלת ספקים', 'goods receiving', 'receiving clerk'] },
  { id: 'inventory_controller', label: 'בקרת מלאי וסחורה', kind: 'role', family: 'logistics', aliases: ['בקר', 'בקרית', 'בקרים', 'בקר מלאי', 'בקרית מלאי', 'בקר סחורה', 'בקרית סחורה', 'stock controller', 'inventory controller'] },
  { id: 'dispatcher', label: 'סדרנות הפצה', kind: 'role', family: 'logistics', aliases: ['סדרן', 'סדרנית', 'סדרנים', 'סדרן הפצה', 'סדרנית הפצה', 'סדרן עבודה', 'סדרנית עבודה', 'dispatcher'] },
  { id: 'logistics_coordinator', label: 'ריכוז לוגיסטיקה והזמנות', kind: 'role', family: 'logistics', aliases: ['רכז הזמנות', 'רכזת הזמנות', 'רכז לוגיסטיקה', 'רכזת לוגיסטיקה', 'רכז מלאי', 'רכזת מלאי', 'רפרנט שטח', 'רפרנטית שטח', 'רפרנט לקוח', 'רפרנטית לקוח', 'רפרנט תפעול', 'רפרנטית תפעול', 'logistics coordinator'] },
  { id: 'warehouse_manager', label: 'ניהול מחסן', kind: 'role', family: 'logistics', aliases: ['מנהל מחסן', 'מנהלת מחסן', 'ניהול מחסן', 'אחראי מחסן', 'אחראית מחסן', 'warehouse manager'] },
  { id: 'forklift_operation', label: 'הפעלת מלגזה', kind: 'role', family: 'logistics', aliases: ['מלגזן', 'מלגזנית', 'מלגזנים', 'הפעלת מלגזה', 'forklift operator'] },
  { id: 'wms_operator', label: 'הפעלת מערכת WMS', kind: 'role', family: 'logistics', aliases: ['מפעיל מערכת wms', 'מפעילת מערכת wms', 'מפעיל wms', 'מפעילת wms', 'wms operator'] },
  { id: 'port_work', label: 'עבודת נמל', kind: 'role', family: 'port', aliases: ['סוור', 'סוורת', 'סוורים', 'לאשינג', 'לשינג', 'אתת', 'עובד עגינה', 'עובדת עגינה', 'טלימן', 'טלימאן', 'עבודה בנמל', 'stevedore', 'lashing', 'tallyman'] },
  { id: 'reach_truck', label: 'מלגזת היגש', kind: 'skill', aliases: ['היגש', 'מלגזת היגש', 'ג׳ירפה', 'reach truck', 'reach-truck'] },
  { id: 'turret_truck', label: 'מלגזת צריח', kind: 'skill', aliases: ['צריח', 'מלגזת צריח', 'מלגזן צריח', 'turret truck', 'vna'] },
  { id: 'clamp_truck', label: 'מלגזת חבק', kind: 'skill', aliases: ['חבק', 'מלגזת חבק', 'מלגזן חבק', 'clamp truck'] },
  { id: 'rf_scanner', label: 'מסופון', kind: 'skill', aliases: ['מסופון', 'מסופונים', 'rf scanner', 'handheld scanner'] },
  { id: 'pallet_jack', label: 'ג׳ק חשמלי', kind: 'skill', aliases: ['ג׳ק חשמלי', 'גק חשמלי', 'ג׳ק אדם רוכב', 'גק אדם רוכב', 'pallet jack'] },
  { id: 'inventory', label: 'בקרת מלאי', kind: 'skill', aliases: ['בקרת מלאי', 'ניהול מלאי', 'ספירות מלאי', 'inventory control', 'inventory management'] },
  { id: 'wms', label: 'WMS', kind: 'skill', aliases: ['wms', 'מערכת ניהול מחסן'] },
  { id: 'priority', label: 'Priority', kind: 'skill', aliases: ['priority', 'פריוריטי', 'פריורתי'] },
  { id: 'sap', label: 'SAP', kind: 'skill', aliases: ['sap', 'סאפ'] },
  { id: 'excel', label: 'Excel', kind: 'skill', aliases: ['excel', 'אקסל', 'microsoft excel'] },
  { id: 'office', label: 'Microsoft Office', kind: 'skill', aliases: ['microsoft office', 'ms office', 'אופיס', 'יישומי אופיס'] },
  { id: 'crm', label: 'CRM', kind: 'skill', aliases: ['crm', 'מערכת ניהול לקוחות'] },
  { id: 'customer_service', label: 'שירות לקוחות', kind: 'role', family: 'customer_service', aliases: ['שירות לקוחות', 'שרות לקוחות', 'נציג שירות', 'נציגת שירות', 'נציג שירות לקוחות', 'נציגת שירות לקוחות', 'מוקדן', 'מוקדנית', 'מוקדנים', 'נציג מוקד', 'נציגת מוקד', 'מוקד שירות', 'שירות טלפוני', 'נציג פניות הציבור', 'נציגת פניות הציבור', 'פניות הציבור', 'נציג שירות דיגיטלי', 'נציגת שירות דיגיטלי', 'customer service', 'customer support', 'customer service representative', 'call center'] },
  { id: 'rental_agent', label: 'שירות והשכרה', kind: 'role', family: 'customer_service', aliases: ['נציג שירות והשכרה', 'נציגת שירות והשכרה', 'נציג שירות השכרה', 'נציג השכרה', 'נציגת השכרה', 'דייל השכרה', 'דיילת השכרה', 'דיילי השכרה', 'השכרת רכב', 'rental agent', 'car rental'] },
  { id: 'technical_support', label: 'תמיכה טכנית', kind: 'role', family: 'customer_service', aliases: ['נציג תמיכה טכנית', 'נציגת תמיכה טכנית', 'תמיכה טכנית', 'מוקד טכני', 'technical support'] },
  { id: 'service_coordinator', label: 'תיאום שירות', kind: 'role', family: 'customer_service', aliases: ['מתאם שירות', 'מתאמת שירות', 'מתאם מסירות', 'מתאמת מסירות', 'service coordinator'] },
  { id: 'auto_service_advisor', label: 'ייעוץ שירות במוסך', kind: 'role', family: 'automotive_service', aliases: ['יועץ שירות במוסך', 'יועצת שירות במוסך', 'יועץ שירות מוסך', 'יועצת שירות מוסך', 'יועץ שירות לרכב', 'יועצת שירות לרכב', 'יועץ שירות', 'יועצת שירות', 'יועץ מוסך', 'יועצת מוסך', 'automotive service advisor', 'service advisor'] },
  { id: 'auto_diagnostics', label: 'אבחון רכב', kind: 'role', family: 'automotive_service', aliases: ['מאבחן רכב', 'מאבחנת רכב', 'דיאגנוסטיקה', 'דיאגנוסטיקת רכב', 'דיאגנוזה', 'איש דיאגנוזה', 'אשת דיאגנוזה', 'בוחן רכב', 'בוחנת רכב', 'vehicle diagnostics', 'vehicle inspector'] },
  { id: 'auto_electrician', label: 'חשמלאות רכב', kind: 'role', family: 'automotive_service', aliases: ['חשמלאי רכב', 'חשמלאית רכב', 'חשמלאות רכב', 'auto electrician'] },
  { id: 'tire_technician', label: 'צמיגאות', kind: 'role', family: 'automotive_service', aliases: ['צמיגאי', 'צמיגאית', 'עוזר צמיגאי', 'עוזרת צמיגאי', 'פנצ׳רייה', 'פנצרייה', 'tire technician'] },
  { id: 'auto_installer', label: 'התקנת אביזרים', kind: 'role', aliases: ['מתקין', 'מתקינה', 'מתקינים', 'טכנאי התקנות', 'טכנאית התקנות', 'installer'] },
  { id: 'body_shop', label: 'פחחות רכב', kind: 'role', family: 'automotive_service', aliases: ['פחח', 'פחחית', 'פחחות', 'פחח רכב', 'auto body', 'panel beater'] },
  { id: 'vehicle_delivery', label: 'מסירת רכבים', kind: 'role', family: 'sales', aliases: ['נציג מסירות', 'נציגת מסירות', 'איש מסירות', 'אשת מסירות', 'מוסר רכבים', 'מוסרת רכבים', 'מסירת רכבים', 'מסירות רכב', 'vehicle delivery'] },
  { id: 'product_specialist', label: 'מומחיות מוצר', kind: 'role', family: 'sales', aliases: ['מומחה מוצר', 'מומחית מוצר', 'מומחה עסקה', 'מומחית עסקה', 'product specialist'] },
  { id: 'showroom_host', label: 'דיילות אולם תצוגה', kind: 'role', family: 'sales', aliases: ['דייל', 'דיילת', 'דיילים', 'דיילות', 'דייל אולם תצוגה', 'דיילת אולם תצוגה', 'showroom host'] },
  { id: 'sales', label: 'מכירות', kind: 'role', family: 'sales', aliases: ['מכירות', 'נציג מכירות', 'נציגת מכירות', 'איש מכירות', 'אשת מכירות', 'אנשי מכירות', 'תומך מכירה', 'תומכת מכירה', 'תומכי מכירה', 'אולם תצוגה', 'sales representative', 'sales associate', 'salesperson', 'sales support'] },
  { id: 'sales_clerk', label: 'מכירה בחנות', kind: 'role', family: 'retail', aliases: ['מוכרן', 'מוכרנית', 'מוכרנים', 'מוכר בחנות', 'מוכרת בחנות', 'קמעונאות', 'sales clerk', 'shop assistant', 'retail sales'] },
  { id: 'store_manager', label: 'ניהול סניף', kind: 'role', family: 'retail', aliases: ['מנהל סניף', 'מנהלת סניף', 'ניהול סניף', 'מנהל חנות', 'מנהלת חנות', 'store manager', 'branch manager'] },
  { id: 'deputy_store_manager', label: 'סגנות ניהול סניף', kind: 'role', family: 'retail', aliases: ['סגן מנהל', 'סגנית מנהל', 'סגן מנהלת', 'סגנית מנהלת', 'סגן מנהל סניף', 'סגנית מנהל סניף', 'סגן מנהל חנות', 'סגנית מנהל חנות', 'assistant store manager', 'deputy manager'] },
  { id: 'cashier_supervisor', label: 'אחריות קו קופות', kind: 'role', family: 'retail', aliases: ['אחראי קו קופות', 'אחראית קו קופות', 'אחראי קופות', 'אחראית קופות', 'head cashier'] },
  { id: 'team_leader', label: 'ראשות צוות ומשמרת', kind: 'role', family: 'management', aliases: ['ראש צוות', 'ראשת צוות', 'ראשי צוותים', 'אחמש', 'אחמשית', 'אחראי משמרת', 'אחראית משמרת', 'מנהל משמרת', 'מנהלת משמרת', 'team leader', 'team lead', 'shift manager'] },
  { id: 'account_manager', label: 'ניהול תיקי לקוחות', kind: 'role', family: 'sales', aliases: ['אחראי תיק לקוח', 'אחראית תיק לקוח', 'מנהל תיק לקוח', 'מנהלת תיק לקוח', 'מנהל תיקי לקוחות', 'מנהלת תיקי לקוחות', 'מנהל לקוחות', 'מנהלת לקוחות', 'account manager'] },
  { id: 'trade_coordinator', label: 'תיאום סחר ומכירות', kind: 'role', family: 'administration', aliases: ['מתאם סחר', 'מתאמת סחר', 'רכז סחר', 'רכזת סחר', 'רכזות סחר', 'מתאם לקוחות', 'מתאמת לקוחות', 'מתאם מכירות', 'מתאמת מכירות', 'sales coordinator', 'trade coordinator'] },
  { id: 'back_office', label: 'בק אופיס', kind: 'role', family: 'administration', aliases: ['בק אופיס', 'נציג בק אופיס', 'נציגת בק אופיס', 'רכז בק אופיס', 'רכזת בק אופיס', 'back office'] },
  { id: 'operations', label: 'תפקידי תפעול', kind: 'role', family: 'operations', aliases: ['איש תפעול', 'אשת תפעול', 'עובד תפעול', 'עובדת תפעול', 'רכז תפעול', 'רכזת תפעול', 'נציג תפעול', 'נציגת תפעול', 'מנהל תפעול', 'מנהלת תפעול', 'מנהל מתחם', 'מנהלת מתחם', 'תפעול ושירות', 'operations'] },
  { id: 'procurement', label: 'רכש וקניינות', kind: 'role', family: 'procurement', aliases: ['פקיד רכש', 'פקידת רכש', 'עובד רכש', 'עובדת רכש', 'מנהל רכש', 'מנהלת רכש', 'קניין', 'קניינית', 'תפעול ורכש', 'procurement', 'purchasing', 'buyer'] },
  { id: 'insurance_agent', label: 'סוכנות ביטוח', kind: 'role', family: 'insurance', aliases: ['סוכן ביטוח', 'סוכנת ביטוח', 'סוכן ביטוח פנסיוני', 'סוכנת ביטוח פנסיונית', 'יועץ פנסיוני', 'יועצת פנסיונית', 'מכירות ביטוח', 'insurance agent'] },
  { id: 'insurance_claims', label: 'תביעות ביטוח', kind: 'role', family: 'insurance', aliases: ['מיישב תביעות', 'מיישבת תביעות', 'רכז תביעות', 'רכזת תביעות', 'תביעות ביטוח', 'מתחקר תאונות', 'מתחקרת תאונות', 'claims adjuster', 'claims handler'] },
  { id: 'field_sales', label: 'מכירות שטח', kind: 'role', family: 'sales', aliases: ['מכירות שטח', 'סוכן שטח', 'סוכנת שטח', 'field sales', 'outside sales'] },
  { id: 'telesales', label: 'מכירות טלפוניות', kind: 'role', family: 'sales', aliases: ['מכירות טלפוניות', 'טלסיילס', 'טלמרקטינג', 'telesales', 'telemarketing', 'inside sales'] },
  { id: 'auto_sales', label: 'מכירת רכב', kind: 'role', family: 'sales', aliases: ['מכירת רכב', 'מכירות רכב', 'מכירות רכבים', 'מכירת רכבים', 'איש מכירות רכבים', 'אשת מכירות רכבים', 'יועץ מכירות רכב', 'יועצת מכירות רכב', 'נציג מגרש', 'נציגת מגרש', 'מנהל מגרש', 'מנהלת מגרש', 'מגרש מכירות', 'car sales', 'automotive sales'] },
  { id: 'sales_manager', label: 'ניהול מכירות', kind: 'role', family: 'sales', aliases: ['מנהל מכירות', 'מנהלת מכירות', 'ניהול מכירות', 'sales manager'] },
  { id: 'banker', label: 'בנקאות', kind: 'role', family: 'banking', aliases: ['בנקאי', 'בנקאית', 'בנקאות', 'banker', 'personal banker'] },
  { id: 'teller', label: 'טלר', kind: 'role', family: 'banking', aliases: ['טלר', 'טלרית', 'טלרים', 'teller', 'bank teller', 'קופאי בנק', 'קופאית בנק'] },
  { id: 'mortgages', label: 'משכנתאות', kind: 'skill', aliases: ['משכנתאות', 'משכנתא', 'mortgage', 'mortgages'] },
  { id: 'cashier', label: 'קופאות', kind: 'role', family: 'retail', aliases: ['קופאי', 'קופאית', 'קופאים', 'קופאות', 'cashier'] },
  { id: 'bookkeeper', label: 'הנהלת חשבונות', kind: 'role', family: 'finance', aliases: ['מנהל חשבונות', 'מנהלת חשבונות', 'הנהלת חשבונות', 'הנהח', 'bookkeeper', 'bookkeeping'] },
  { id: 'accountant', label: 'ראיית חשבון', kind: 'role', family: 'finance', aliases: ['רואה חשבון', 'רואת חשבון', 'ראיית חשבון', 'רו״ח', 'accountant'] },
  { id: 'payroll', label: 'חשבות שכר', kind: 'role', family: 'finance', aliases: ['חשב שכר', 'חשבת שכר', 'חשבות שכר', 'payroll specialist', 'payroll accountant'] },
  { id: 'administration', label: 'אדמיניסטרציה', kind: 'role', family: 'administration', aliases: ['אדמיניסטרציה', 'אדמיניסטרטור', 'אדמיניסטרטורית', 'מזכיר', 'מזכירה', 'פקיד', 'פקידה', 'פקידים', 'פקיד משרד', 'פקידת משרד', 'מנהל משרד', 'מנהלת משרד', 'office administrator', 'administrative assistant', 'secretary', 'office manager'] },
  { id: 'reception', label: 'קבלה', kind: 'role', family: 'administration', aliases: ['פקיד קבלה', 'פקידת קבלה', 'נציג קבלה', 'נציגת קבלה', 'receptionist', 'front desk'] },
  { id: 'recruiter', label: 'גיוס עובדים', kind: 'role', family: 'human_resources', aliases: ['רכז גיוס', 'רכזת גיוס', 'גיוס עובדים', 'גיוס מועמדים', 'איש גיוס', 'אשת גיוס', 'מגייס', 'מגייסת', 'recruiter', 'talent acquisition'] },
  { id: 'hr', label: 'משאבי אנוש', kind: 'role', family: 'human_resources', aliases: ['משאבי אנוש', 'human resources', 'hr specialist'] },
  { id: 'software_developer', label: 'פיתוח תוכנה', kind: 'role', family: 'software', aliases: ['מפתח תוכנה', 'מפתחת תוכנה', 'מתכנת', 'מתכנתת', 'פיתוח תוכנה', 'software developer', 'software engineer', 'programmer', 'developer'] },
  { id: 'frontend', label: 'פיתוח Frontend', kind: 'role', family: 'software', aliases: ['frontend developer', 'front end developer', 'מפתח פרונטאנד', 'מפתחת פרונטאנד', 'frontend', 'front-end'] },
  { id: 'backend', label: 'פיתוח Backend', kind: 'role', family: 'software', aliases: ['backend developer', 'back end developer', 'מפתח בקאנד', 'מפתחת בקאנד', 'backend', 'back-end'] },
  { id: 'fullstack', label: 'פיתוח Full Stack', kind: 'role', family: 'software', aliases: ['full stack developer', 'fullstack', 'full stack', 'full-stack', 'פולסטאק', 'פול סטאק'] },
  { id: 'qa', label: 'בדיקות תוכנה', kind: 'role', family: 'software', aliases: ['בודק תוכנה', 'בודקת תוכנה', 'בדיקות תוכנה', 'qa engineer', 'software tester', 'qa'] },
  { id: 'devops', label: 'DevOps', kind: 'role', family: 'infrastructure', aliases: ['devops', 'דבאופס'] },
  { id: 'it_support', label: 'תמיכה טכנית במחשוב', kind: 'role', family: 'infrastructure', aliases: ['תמיכה טכנית במחשוב', 'טכנאי מחשבים', 'טכנאית מחשבים', 'help desk', 'helpdesk', 'הלפ דסק', 'it support', 'desktop support'] },
  { id: 'system_admin', label: 'ניהול מערכות מחשוב', kind: 'role', family: 'infrastructure', aliases: ['system administrator', 'sysadmin', 'איש סיסטם', 'אשת סיסטם', 'מנהל רשת', 'מנהלת רשת'] },
  ...[
    ['java', 'Java'], ['javascript', 'JavaScript'], ['typescript', 'TypeScript'], ['python', 'Python'],
    ['sql', 'SQL'], ['nosql', 'NoSQL'], ['c#', 'C#'], ['c++', 'C++'], ['.net', '.NET'],
    ['node.js', 'Node.js'], ['react', 'React'], ['angular', 'Angular'], ['linux', 'Linux'],
    ['docker', 'Docker'], ['kubernetes', 'Kubernetes'], ['aws', 'AWS'], ['azure', 'Azure'],
    ['autocad', 'AutoCAD'], ['solidworks', 'SolidWorks'], ['cnc', 'CNC'],
  ].map(([id, label]): MatchingConcept => ({ id, label, kind: 'skill', aliases: id === 'node.js' ? [id, 'nodejs'] : [id] })),
  { id: 'maintenance', label: 'אחזקה', kind: 'role', family: 'maintenance', aliases: ['איש אחזקה', 'אשת אחזקה', 'טכנאי אחזקה', 'טכנאית אחזקה', 'אחזקה', 'תחזוקה', 'איש טכני', 'אשת טכנית', 'טכנאי אחזקת חשמל', 'טכנאי בקרים', 'מנהל אחזקה', 'מנהלת אחזקה', 'מנהל אחזקת מכונות', 'maintenance technician', 'maintenance manager'] },
  { id: 'electrician', label: 'חשמלאות', kind: 'role', family: 'electrical', aliases: ['חשמלאי', 'חשמלאית', 'חשמלאות', 'electrician'] },
  { id: 'electrical_engineer', label: 'הנדסת חשמל', kind: 'role', family: 'electrical', aliases: ['מהנדס חשמל', 'מהנדסת חשמל', 'electrical engineer'] },
  { id: 'practical_electrical', label: 'הנדסאות חשמל', kind: 'role', family: 'electrical', aliases: ['הנדסאי חשמל', 'הנדסאית חשמל', 'practical electrical engineer'] },
  { id: 'mechanic', label: 'מכונאות רכב', kind: 'role', family: 'automotive_service', aliases: ['מכונאי רכב', 'מכונאית רכב', 'מכונאות רכב', 'מכונאי', 'מכונאית', 'מכונאים', 'מכונאי צמ״ה', 'מכונאי ניידת', 'מכונאי משאיות', 'auto mechanic', 'automotive mechanic', 'mechanic', 'heavy equipment mechanic'] },
  { id: 'metalwork', label: 'מסגרות וריתוך', kind: 'role', family: 'metalwork', aliases: ['מסגר', 'מסגרים', 'רתך', 'רתכת', 'רתכים', 'עבודות מסגרות', 'welder', 'metalworker'] },
  { id: 'production', label: 'עבודת ייצור', kind: 'role', family: 'production', aliases: ['עובד ייצור', 'עובדת ייצור', 'עובד יצור', 'עובדת יצור', 'עובדי ייצור', 'עובד הכנה לצבע', 'עובדת הכנה לצבע', 'עובד הדבקה', 'עובדת הדבקה', 'למינציה', 'עובד כללי', 'עובדת כללית', 'production worker', 'manufacturing operator', 'general worker'] },
  { id: 'assembler', label: 'הרכבה מכנית', kind: 'role', family: 'production', aliases: ['עובד הרכבה', 'עובדת הרכבה', 'מרכיב', 'מרכיבה', 'מרכיב מכני', 'מרכיבה מכנית', 'assembler', 'assembly worker'] },
  { id: 'packer', label: 'אריזת מוצרים', kind: 'role', family: 'production', aliases: ['עובד אריזה', 'עובדת אריזה', 'אורזת', 'אורזים', 'packer'] },
  { id: 'lab_worker', label: 'עבודת מעבדה', kind: 'role', family: 'production', aliases: ['עובד מעבדה', 'עובדת מעבדה', 'לבורנט', 'לבורנטית', 'lab technician', 'laboratory technician'] },
  { id: 'quality_control', label: 'בקרת איכות', kind: 'role', family: 'production', aliases: ['מבקר איכות', 'מבקרת איכות', 'בקר איכות', 'בקרת איכות', 'בקרית איכות', 'quality control', 'quality inspector', 'qc inspector'] },
  { id: 'practical_engineer_role', label: 'הנדסאות', kind: 'role', family: 'engineering', aliases: ['הנדסאי', 'הנדסאית', 'הנדסאים', 'הנדסאי מכונות', 'הנדסאית מכונות', 'הנדסאי ציוד', 'הנדסאי תעשייה וניהול', 'practical engineer'] },
  { id: 'machine_operator', label: 'הפעלת מכונות', kind: 'role', family: 'production', aliases: ['מפעיל מכונה', 'מפעילת מכונה', 'מפעיל מכונות', 'מפעילת מכונות', 'מפעיל מתקן', 'מפעילת מתקן', 'מפעיל מתקן כימי', 'מפעיל חדר בקרה', 'מפעילת חדר בקרה', 'חדר בקרה', 'machine operator', 'plant operator', 'control room operator'] },
  { id: 'cnc_operator', label: 'הפעלת CNC', kind: 'role', family: 'production', aliases: ['מפעיל מכונות cnc', 'מפעילת מכונות cnc', 'מפעיל cnc', 'מפעילת cnc', 'cnc operator', 'cnc machinist'] },
  { id: 'driver', label: 'נהיגה מקצועית', kind: 'role', family: 'transport', aliases: ['נהג', 'נהגת', 'נהגים', 'נהיגת משאית', 'נהג חלוקה', 'נהגת חלוקה', 'נהג משאית', 'נהגת משאית', 'נהג סמיטריילר', 'נהג שינוע', 'נהגת שינוע', 'נהג תפעולי', 'נהגת תפעולית', 'נהג צמוד', 'נהג מכולות', 'עוזר נהג', 'עוזרת נהג', 'truck driver', 'delivery driver', 'professional driver'] },
  { id: 'security', label: 'אבטחה', kind: 'role', family: 'security', aliases: ['מאבטח', 'מאבטחת', 'מאבטחים', 'שומר', 'שומרת', 'security guard'] },
  { id: 'occupational_safety', label: 'בטיחות בעבודה', kind: 'role', family: 'occupational_safety', aliases: ['ממונה בטיחות', 'ממונת בטיחות', 'בטיחות בעבודה', 'safety officer', 'occupational safety'] },
  { id: 'cleaning', label: 'ניקיון', kind: 'role', family: 'cleaning', aliases: ['עובד ניקיון', 'עובדת ניקיון', 'ניקיון', 'cleaner', 'cleaning worker'] },
  { id: 'cook', label: 'טבחות', kind: 'role', family: 'hospitality', aliases: ['טבח', 'טבחית', 'טבחים', 'טבחות', 'cook', 'chef'] },
  { id: 'waiter', label: 'מלצרות', kind: 'role', family: 'hospitality', aliases: ['מלצר', 'מלצרית', 'מלצרות', 'waiter', 'waitress'] },
  { id: 'import_export', label: 'יבוא ויצוא', kind: 'role', family: 'logistics', aliases: ['מתאם יבוא', 'מתאמת יבוא', 'מתאם ייבוא', 'מתאמת ייבוא', 'מתאם יצוא', 'מתאמת יצוא', 'מתאם ייצוא', 'מתאמת ייצוא', 'יבוא ויצוא', 'ייבוא וייצוא', 'שילוח בינלאומי', 'import coordinator', 'export coordinator', 'freight forwarding'] },
  { id: 'erp_implementer', label: 'יישום ERP', kind: 'role', family: 'software', aliases: ['מיישם', 'מיישמת', 'מיישם פריוריטי', 'מיישמת פריוריטי', 'מיישם erp', 'מיישמת erp', 'erp implementer', 'priority implementer'] },
  { id: 'forklift_license', label: 'רישיון מלגזה', kind: 'credential', aliases: ['רישיון מלגזה', 'רשיון מלגזה', 'רישיון למלגזה', 'רשיון למלגזה', 'היתר מלגזה', 'היתר נהיגת מלגזה', 'forklift license', 'forklift licence', 'forklift certification'] },
  { id: 'license_b', label: 'רישיון B', kind: 'credential', aliases: ['רישיון b', 'רשיון b', 'רישיון נהיגה b', 'רישיון נהיגה מסוג b', 'b license', 'b licence'] },
  { id: 'license_c1', label: 'רישיון C1', kind: 'credential', aliases: ['רישיון c1', 'רשיון c1', 'רישיון נהיגה c1', 'רישיון נהיגה מסוג c1', 'c1 license', 'c1 licence'] },
  { id: 'license_c', label: 'רישיון C', kind: 'credential', aliases: ['רישיון c', 'רשיון c', 'רישיון נהיגה c', 'רישיון נהיגה מסוג c', 'c license', 'c licence'] },
  { id: 'licensed_electrician', label: 'רישיון חשמלאי מוסמך', kind: 'credential', aliases: ['רישיון חשמלאי מוסמך', 'רשיון חשמלאי מוסמך', 'רישיון חשמלאי', 'licensed electrician'] },
  { id: 'bachelor', label: 'תואר ראשון', kind: 'credential', aliases: ['תואר ראשון', 'bachelor degree', 'bachelor of science', 'bachelor of arts', 'b.sc', 'bsc', 'b.a'] },
  { id: 'master', label: 'תואר שני', kind: 'credential', aliases: ['תואר שני', 'master degree', 'master of science', 'master of arts', 'm.sc', 'msc', 'm.a', 'mba'] },
  { id: 'degree', label: 'תואר אקדמי', kind: 'credential', aliases: ['תואר אקדמי', 'תואר אקדמאי', 'academic degree', 'university degree'] },
  { id: 'practical_engineer', label: 'תעודת הנדסאי', kind: 'credential', aliases: ['תעודת הנדסאי', 'תעודת הנדסאית', 'הנדסאי מוסמך', 'practical engineer diploma'] },
  { id: 'engineer_degree', label: 'תואר בהנדסה', kind: 'credential', aliases: ['תואר בהנדסה', 'תואר ראשון בהנדסה', 'engineering degree'] },
  { id: 'english', label: 'אנגלית', kind: 'language', aliases: ['אנגלית', 'english'] },
  { id: 'hebrew', label: 'עברית', kind: 'language', aliases: ['עברית', 'hebrew'] },
]

type Token = { key: string; start: number; end: number }
type Alias = { keys: string[]; concept: MatchingConcept }
const CONCEPTS_BY_ID = new Map(MATCHING_CONCEPTS.map(concept => [concept.id, concept]))
const ALIASES = new Map<string, Alias[]>()
const EXACT_ALIASES = new Map<string, string>()
const FINALS: Record<string, string> = { ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' }

function tokenKey(text: string): string {
  const key = text.normalize('NFKC').toLowerCase()
    .replace(/[\u0591-\u05bd\u05bf-\u05c7\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '')
    .replace(/["'״׳’`]/g, '').replace(/[ךםןףץ]/g, char => FINALS[char])
  // "נציג.ת", "נציגי.ות": סיומת מגדר אינה מילה נפרדת ואינה משנה את המקצוע.
  const gendered = key.match(/^([א-ת]{2,})\.(ת|ית|ות|יות|ימ)$/)
  if (!gendered) return key
  return gendered[2] === 'ות' && gendered[1].endsWith('י') ? gendered[1].slice(0, -1) : gendered[1]
}

function tokenize(text: string): Token[] {
  const tokens: Token[] = []
  // מנקים סימנים בלי לשנות אופסטים של הטקסט המקורי (כולל ניקוד ו-RTL).
  const cleaned = maskMatchingContacts(text).replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, ' ')
  for (const match of cleaned.matchAll(/\.?[\p{L}\p{N}][\p{L}\p{N}\p{M}]*(?:[."'׳״’`][\p{L}\p{N}][\p{L}\p{N}\p{M}]*)*(?:\+\+|#)?/gu)) {
    const start = match.index!
    const end = start + match[0].length
    const key = tokenKey(match[0])
    const previous = tokens[tokens.length - 1]
    if (previous && ['ת', 'ית', 'ימ', 'ות', 'יות'].includes(key) && text.slice(previous.end, start) === '/') {
      previous.end = end
      if (key === 'ות' && previous.key.endsWith('י') && previous.key.length > 3) previous.key = previous.key.slice(0, -1)
    } else tokens.push({ key, start, end })
  }
  return tokens
}

export function normalizeMatchingText(text: string): string {
  return tokenize(text).map(token => token.key).join(' ')
}

/** מעבר ליניארי על מילים: regex לא מעוגן של email על שורה ארוכה עלול להיות ריבועי. */
export function maskMatchingContacts(text: string): string {
  return text.replace(/\S+/g, token => token.includes('@') || /^[([<]?(?:https?:\/\/|www\.)/i.test(token) ? ' '.repeat(token.length) : token)
}

for (const concept of MATCHING_CONCEPTS) {
  for (const alias of [...concept.aliases, concept.label]) {
    const keys = tokenize(alias).map(token => token.key)
    const key = keys.join(' ')
    if (!keys.length || EXACT_ALIASES.has(key)) continue
    EXACT_ALIASES.set(key, concept.id)
    const entries = ALIASES.get(keys[0]) ?? []
    entries.push({ keys, concept })
    ALIASES.set(keys[0], entries)
  }
}
for (const entries of ALIASES.values()) entries.sort((a, b) => b.keys.length - a.keys.length)

function variants(key: string): string[] {
  if (!/^[א-ת]{4,}$/.test(key)) return [key]
  // אין הסרת מ׳: מנהג אינו נהג. אין stemming שרירותי של ארבע אותיות.
  return [key, ...['וב', 'ול', 'וכ', 'וה', 'ב', 'ל', 'כ', 'ו', 'ה']
    .filter(prefix => key.startsWith(prefix) && key.length - prefix.length >= 3)
    .map(prefix => key.slice(prefix.length))]
}

function keysMatch(tokens: Token[], at: number, keys: string[], text: string): boolean {
  return keys.every((key, index) => {
    const token = tokens[at + index]
    if (!token || !variants(token.key).includes(key)) return false
    return index === 0 || /^[ \t\-־–/]*$/.test(text.slice(tokens[at + index - 1].end, token.start))
  })
}

export function matchingEvidenceContext(text: string, evidence: Pick<MatchingEvidence, 'start' | 'end'>): string {
  const start = Math.max(text.lastIndexOf('\n', evidence.start - 1), text.lastIndexOf(';', evidence.start - 1)) + 1
  const endings = [text.indexOf('\n', evidence.end), text.indexOf(';', evidence.end)].filter(index => index >= 0)
  return text.slice(start, endings.length ? Math.min(...endings) : text.length)
}

function assertion(text: string, start: number, end: number): MatchingEvidence['assertion'] {
  const before = normalizeMatchingText(text.slice(Math.max(0, start - 180), start).split(/[\n;.!?]|\bbut\b|אבל|אולמ/).pop() ?? '')
  const after = normalizeMatchingText(text.slice(end, end + 100).split(/[\n;.!?]/)[0])
  const negative = /(?:^| )(?:אינ|ללא|לא|אינו|אינה|without|no|not|never|dont|doesnt)(?: (?:לי|בעל|בעלת|יש|כל|ניסיונ|קודמ|ב|רישיונ|רשיונ|ידע|ידיעה|יודע|יודעת|שולט|שולטת|הסמכה|תואר|experience|with|in|a|any|knowledge|of|have|hold|holds|has|license|licence|certified|know|knows)){0,7} ?$/
  if (negative.test(before) || /^(?:אינ|אינו|אינה|לא|not|expired|פג תוקפ)(?: |$)/.test(after) || /^(?:is |was )?(?:expired|not held)/.test(after)) return 'negated'
  // "אין ניסיון ב-Java, SQL ו-Python": השלילה ממשיכה ברשימת כישורים,
  // אך נעצרת כשמופיע ביטוי ניסיון חיובי חדש.
  const negativeList = before.match(/(?:^| )(?:אינ ניסיונ|ללא ניסיונ|no experience|no knowledge)(?: ב| in| with| of)? (.*)$/)
  if (negativeList && !/(?:^| )(?:ניסיונ|ידע|שליטה|יודע|עבדתי|experience|knowledge|worked)(?: |$)/.test(negativeList[1])) return 'negated'
  if (/(?:מעוניינ|מעוניינת|מחפש|מחפשת|רוצה|שואפ|שואפת)(?: (?:לעבוד|עבודה|תפקיד|להיות|להשתלב|ב|כ)){0,4} ?$|(?:seeking|aspiring|interested in|looking for)(?: (?:a|work|as|job|role|to be)){0,4} ?$/.test(before)) return 'aspiration'
  if (/(?:סטודנט|סטודנטית|לומד|לומדת|לימודי|לקראת|בתהליכ|student|studying|pursuing)(?: (?:ל|ב|תואר|השלמת|a|an|for|towards)){0,3} ?$/.test(before) || /^(?:טרמ הושלמ|טרמ הסתיימ|בתהליכ|in progress|incomplete|expected graduation)/.test(after) || /סיום צפוי|סיימ צפוי|expected (?:completion|graduation)/.test(after)) return 'in_progress'
  if (/(?:אולי|כנראה|לבירור|לא ידוע|maybe|possibly|unknown)(?: (?:יש|לי|has|have)){0,2} ?$/.test(before)) return 'uncertain'
  return 'positive'
}

function evidence(text: string, tokens: Token[], at: number, length: number, concept: string, term: string): MatchingEvidence {
  const start = tokens[at].start
  const end = tokens[at + length - 1].end
  const state = assertion(text, start, end)
  return { concept, term, start, end, quote: text.slice(start, end), negated: state === 'negated', assertion: state }
}

export type MatchingTextIndex = {
  text: string
  tokens: readonly Token[]
  evidence: readonly MatchingEvidence[]
  byConcept: ReadonlyMap<string, readonly MatchingEvidence[]>
}

export function createMatchingTextIndex(text: string): MatchingTextIndex {
  const tokens = tokenize(text)
  const found: MatchingEvidence[] = []
  const byConcept = new Map<string, MatchingEvidence[]>()
  for (let at = 0; at < tokens.length; at++) {
    let best: Alias | undefined
    for (const key of variants(tokens[at].key)) {
      for (const alias of ALIASES.get(key) ?? []) {
        if ((!best || alias.keys.length > best.keys.length) && keysMatch(tokens, at, alias.keys, text)) best = alias
      }
    }
    if (!best) continue
    const item = evidence(text, tokens, at, best.keys.length, best.concept.id, best.concept.label)
    found.push(item)
    const instances = byConcept.get(item.concept) ?? []
    instances.push(item)
    byConcept.set(item.concept, instances)
    at += best.keys.length - 1
  }
  return { text, tokens, evidence: found, byConcept }
}

export function getMatchingConcept(termOrId: string): MatchingConcept | undefined {
  return CONCEPTS_BY_ID.get(termOrId) ?? CONCEPTS_BY_ID.get(EXACT_ALIASES.get(normalizeMatchingText(termOrId)) ?? '')
}

export function findIndexedTermEvidence(index: MatchingTextIndex, term: string): MatchingEvidence[] {
  const concept = getMatchingConcept(term)
  if (concept) return [...(index.byConcept.get(concept.id) ?? [])]
  const keys = tokenize(term).map(token => token.key)
  if (!keys.length) return []
  const result: MatchingEvidence[] = []
  for (let at = 0; at < index.tokens.length; at++) {
    if (keysMatch(index.tokens as Token[], at, keys, index.text)) result.push(evidence(index.text, index.tokens as Token[], at, keys.length, keys.join(' '), term))
  }
  return result
}

export function findTermEvidence(text: string, term: string): MatchingEvidence | null {
  const found = findIndexedTermEvidence(createMatchingTextIndex(text), term)
  return found.find(item => item.assertion === 'positive') ?? found[0] ?? null
}

export function extractMatchingConcepts(text: string): MatchingEvidence[] {
  return [...createMatchingTextIndex(text).byConcept.values()].map(items => items.find(item => item.assertion === 'positive') ?? items[0])
}

export function matchingTermsEquivalent(left: string, right: string): boolean {
  const l = normalizeMatchingText(left)
  const r = normalizeMatchingText(right)
  if (!l || !r) return false
  return l === r || (!!EXACT_ALIASES.get(l) && EXACT_ALIASES.get(l) === EXACT_ALIASES.get(r))
}

export function getMatchingRoleFamilies(text: string): string[] {
  return [...new Set(extractMatchingConcepts(text).flatMap(item => {
    const concept = CONCEPTS_BY_ID.get(item.concept)
    return item.assertion === 'positive' && concept?.kind === 'role' && concept.family ? [concept.family] : []
  }))]
}