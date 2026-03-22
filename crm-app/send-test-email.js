// סקריפט בדיקה - שליחת מייל עם משרת סוכן מכירות רכב
const { Resend } = require('resend');

const resend = new Resend('re_MXSxkeaz_NLES33hrg1TBtp4QUA7YXHaH');

const candidateName = 'דוד כהן';
const positionTitle = 'סוכן מכירות רכב';
const employerName = 'אוטו דיל בע"מ';
const location = 'תל אביב';

const matchingPoints = [
  `${candidateName} מביא ניסיון של 4 שנים במכירות רכב חדש ומשומש, כולל עמידה ביעדים גבוהים`,
  `4 שנות ניסיון מעשי במכירות B2C מאפשרות לדוד להתחיל לתרום מיד`,
  `כיום סוכן מכירות באולם תצוגה מוביל, הניסיון הרלוונטי מתאים במדויק לדרישות התפקיד`,
  `מיקום גיאוגרפי אידיאלי - דוד ממוקם בתל אביב, קרוב לאולם התצוגה`,
  `יכולות תקשורת בינאישית מצוינות, כושר שכנוע גבוה וניסיון בסגירת עסקאות`
];

const emailHTML = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.8; color: #2c3e50; background-color: #f8f9fa; margin: 0; padding: 20px; }
    .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 28px; font-weight: 600; }
    .header p { margin: 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: 600; color: #2c3e50; margin-bottom: 20px; }
    .intro { font-size: 16px; color: #555; margin-bottom: 30px; line-height: 1.8; }
    .candidate-card { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 10px; padding: 25px; margin-bottom: 30px; border-right: 5px solid #667eea; }
    .candidate-name { font-size: 24px; font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
    .candidate-title { font-size: 16px; color: #555; margin-bottom: 15px; }
    .candidate-details { display: grid; gap: 8px; font-size: 14px; color: #666; }
    .detail-row { display: flex; align-items: center; gap: 8px; }
    .detail-icon { color: #667eea; font-weight: bold; }
    .matching-section { margin: 30px 0; }
    .section-title { font-size: 20px; font-weight: 600; color: #2c3e50; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 3px solid #667eea; }
    .matching-points { list-style: none; padding: 0; margin: 0; }
    .matching-point { background: #f8f9ff; padding: 18px; margin-bottom: 12px; border-radius: 8px; border-right: 4px solid #667eea; position: relative; padding-right: 50px; }
    .point-number { position: absolute; right: 15px; top: 50%; transform: translateY(-50%); background: #667eea; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; }
    .point-text { font-size: 15px; line-height: 1.6; color: #2c3e50; }
    .tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 15px; }
    .tag { background: #667eea; color: white; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 500; }
    .cta-section { text-align: center; margin: 35px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 30px; font-size: 17px; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); }
    .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #7f8c8d; font-size: 13px; border-top: 1px solid #dee2e6; }
    .footer-logo { font-size: 20px; font-weight: bold; color: #667eea; margin-bottom: 10px; }
    .contact-info { margin-top: 15px; padding-top: 15px; border-top: 1px solid #dee2e6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 מועמד/ת מצוין/ת למשרה שלך</h1>
      <p>${positionTitle}</p>
    </div>
    
    <div class="content">
      <div class="greeting">שלום ${employerName},</div>
      
      <div class="intro">
        מצאנו מועמד/ת מצוין/ת שעונה על כל הדרישות של המשרה <strong>${positionTitle}</strong>.
        להלן פרטי הפרופיל המקצועי ונקודות ההתאמה העיקריות:
      </div>
      
      <div class="candidate-card">
        <div class="candidate-name">👤 ${candidateName}</div>
        <div class="candidate-title">סוכן מכירות רכב | אולם תצוגה מוביל</div>
        <div class="candidate-details">
          <div class="detail-row"><span class="detail-icon">📍</span> מיקום: ${location}</div>
          <div class="detail-row"><span class="detail-icon">💼</span> ניסיון: 4 שנים</div>
          <div class="detail-row"><span class="detail-icon">📞</span> טלפון: 050-1234567</div>
          <div class="detail-row"><span class="detail-icon">📧</span> מייל: david.c@example.com</div>
        </div>
        <div class="tags">
          <span class="tag">מכירות רכב</span>
          <span class="tag">סגירת עסקאות</span>
          <span class="tag">שירות לקוחות</span>
          <span class="tag">B2C</span>
          <span class="tag">יעדי מכירות</span>
        </div>
      </div>
      
      <div class="matching-section">
        <div class="section-title">🤖 למה ${candidateName} מתאים למשרה?</div>
        <ul class="matching-points">
          ${matchingPoints.map((point, i) => `
            <li class="matching-point">
              <div class="point-number">${i + 1}</div>
              <div class="point-text">${point}</div>
            </li>
          `).join('')}
        </ul>
      </div>
      
      <div class="cta-section">
        <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
          מעוניינים לקבוע ראיון עם ${candidateName}? צרו איתנו קשר ונשמח לתאם.
        </p>
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-logo">Twenty2 CRM</div>
      <p>מערכת גיוס חכמה | HR 22 Group</p>
      <div class="contact-info">
        <p>📧 office@hr22group.com | 📞 טלפון: 050-0000000</p>
        <p style="margin-top: 10px; font-size: 11px; color: #adb5bd;">
          מייל זה נשלח באופן אוטומטי ממערכת Twenty2 CRM
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

async function sendTestEmail() {
  try {
    console.log('📧 שולח מייל בדיקה ל-22geder@gmail.com...');
    console.log(`📋 משרה: ${positionTitle} - ${employerName}`);
    console.log(`👤 מועמד: ${candidateName}`);
    
    const result = await resend.emails.send({
      from: 'Twenty2 CRM <office@hr22group.com>',
      to: '22geder@gmail.com',
      subject: `מועמד/ת מתאים/ה למשרה: ${positionTitle} - ${candidateName}`,
      html: emailHTML,
    });
    
    console.log('\n✅ מייל נשלח בהצלחה!');
    console.log('📨 ID:', result.data?.id || result);
    console.log('\n🔎 תבדוק את תיבת המייל של 22geder@gmail.com');
  } catch (error) {
    console.error('❌ שגיאה:', error);
  }
}

sendTestEmail();
