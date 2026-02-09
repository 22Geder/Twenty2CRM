// סקריפט בדיקת שליחת מייל
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: '22geder@gmail.com',
    pass: 'qlkd wbnh adwf itor'
  }
});

const mailOptions = {
  from: '22geder@gmail.com',
  to: '22geder@gmail.com',
  subject: '🎉 בדיקת מערכת Twenty2CRM - המייל עובד!',
  html: `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">✅ Twenty2CRM</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">מערכת הגיוס החכמה שלך</p>
      </div>
      <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
        <h2 style="color: #333; margin-top: 0;">🎉 מזל טוב! המייל עובד!</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          אם אתה רואה את ההודעה הזו, זה אומר שמערכת שליחת המיילים מוגדרת נכון ועובדת מצוין!
        </p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">📋 מה המערכת יכולה לעשות:</h3>
          <ul style="color: #666; line-height: 1.8;">
            <li>🤖 ניתוח קורות חיים עם AI (Gemini)</li>
            <li>📧 שליחת מועמדים למעסיקים במייל</li>
            <li>💼 התאמת משרות אוטומטית לפי מיקום ומקצוע</li>
            <li>📱 שליחת הודעות WhatsApp</li>
            <li>🚗 זיהוי אוטומטי של רישיונות נהיגה (B, C1, C)</li>
            <li>📊 לוח בקרה עם סטטיסטיקות</li>
          </ul>
        </div>
        <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #4caf50;">
          <strong style="color: #2e7d32;">💡 טיפ:</strong>
          <span style="color: #333;"> המערכת מנתחת קורות חיים ומציגה עד 15 משרות מתאימות!</span>
        </div>
        <p style="color: #999; font-size: 14px; margin-bottom: 0;">
          נשלח מ-Twenty2CRM • ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}
        </p>
      </div>
    </div>
  `
};

console.log('📧 שולח מייל בדיקה ל-22geder@gmail.com...');

transporter.sendMail(mailOptions)
  .then(info => {
    console.log('');
    console.log('✅ ================================');
    console.log('✅    המייל נשלח בהצלחה!');
    console.log('✅ ================================');
    console.log('');
    console.log('📬 Message ID:', info.messageId);
    console.log('📧 נשלח אל:', mailOptions.to);
    console.log('');
    console.log('🔎 בדוק את תיבת הדואר שלך (כולל ספאם)');
  })
  .catch(err => {
    console.error('');
    console.error('❌ שגיאה בשליחת המייל:');
    console.error('❌', err.message);
    console.error('');
    if (err.message.includes('Invalid login')) {
      console.error('💡 ייתכן שצריך לעדכן את ה-App Password ב-Gmail');
    }
  });
