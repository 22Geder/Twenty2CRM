// סקריפט לשליחת מועמד עם קורות חיים למייל
const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: '22geder@gmail.com',
    pass: 'fqts pmmw gmdz pywz'
  }
});

async function sendCandidateEmail() {
  try {
    // מציאת מועמד עם קורות חיים
    const candidate = await prisma.candidate.findFirst({
      where: {
        resumeUrl: { not: null }
      },
      include: { tags: true }
    });

    if (!candidate) {
      console.log('❌ לא נמצא מועמד עם קורות חיים');
      return;
    }

    console.log(`✅ נמצא מועמד: ${candidate.name}`);
    console.log(`📄 קורות חיים: ${candidate.resumeUrl}`);

    // מציאת משרה פעילה
    const position = await prisma.position.findFirst({
      where: { active: true },
      include: { employer: true }
    });

    if (!position) {
      console.log('❌ לא נמצאה משרה פעילה');
      return;
    }

    console.log(`💼 משרה: ${position.title}`);
    console.log(`🏢 מעסיק: ${position.employer?.name || 'לא ידוע'}`);

    // בדיקה אם קובץ קורות חיים קיים
    const resumePath = path.join(__dirname, 'public', candidate.resumeUrl);
    const resumeExists = fs.existsSync(resumePath);
    console.log(`📁 קובץ קיים: ${resumeExists ? 'כן' : 'לא'} - ${resumePath}`);

    // 5 נקודות התאמה
    const matchingPoints = [
      `${candidate.name} מביא/ה רקע מקצועי רלוונטי שמתאים בדיוק לדרישות המשרה`,
      `ניסיון מעשי שיאפשר השתלבות מהירה בצוות`,
      `יכולות תקשורת ושירות לקוחות מוכחות`,
      `גמישות וזמינות לעבודה במשמרות לפי הצורך`,
      `מוטיבציה גבוהה להצליח ולהתפתח בתפקיד`
    ];

    const emailHTML = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.8; color: #2c3e50; background-color: #f8f9fa; margin: 0; padding: 20px; }
          .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0 0 10px 0; font-size: 28px; }
          .content { padding: 40px 30px; }
          .candidate-card { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 10px; padding: 25px; margin-bottom: 30px; border-right: 5px solid #667eea; }
          .candidate-name { font-size: 24px; font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
          .matching-point { background: #f8f9ff; padding: 18px; margin-bottom: 12px; border-radius: 8px; border-right: 4px solid #667eea; }
          .resume-section { background: #fff9e6; border: 2px dashed #ffc107; border-radius: 10px; padding: 20px; text-align: center; margin-top: 30px; }
          .footer { background: #2c3e50; color: white; padding: 20px; text-align: center; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 מועמד/ת מתאים/ה למשרה</h1>
            <p>${position.title}</p>
          </div>
          
          <div class="content">
            <p style="font-size: 18px;">שלום,</p>
            <p>מצאנו מועמד/ת שנראה/ת מתאים/ה במיוחד למשרה שלכם.</p>
            
            <div class="candidate-card">
              <div class="candidate-name">👤 ${candidate.name}</div>
              ${candidate.phone ? `<div>📱 ${candidate.phone}</div>` : ''}
              ${candidate.email ? `<div>📧 ${candidate.email}</div>` : ''}
              ${candidate.city ? `<div>📍 ${candidate.city}</div>` : ''}
              ${candidate.currentTitle ? `<div>💼 ${candidate.currentTitle}</div>` : ''}
            </div>
            
            <h3 style="color: #2c3e50; border-bottom: 3px solid #667eea; padding-bottom: 10px;">
              ✨ למה ${candidate.name} מתאים/ה:
            </h3>
            
            ${matchingPoints.map((point, i) => `
              <div class="matching-point">
                <strong>${i + 1}.</strong> ${point}
              </div>
            `).join('')}
            
            ${resumeExists ? `
              <div class="resume-section">
                <div style="font-size: 32px;">📄</div>
                <div style="font-size: 16px; font-weight: 600; color: #2c3e50; margin-top: 10px;">
                  קורות חיים מצורפים
                </div>
                <div style="font-size: 14px; color: #666;">
                  הקובץ המלא מצורף למייל זה
                </div>
              </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <div style="font-size: 18px; margin-bottom: 10px;">TWENTY2CRM</div>
            <div>מערכת ניהול גיוס מתקדמת</div>
            <div style="margin-top: 10px; opacity: 0.8;">
              נשלח ב-${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: '"צוות הגיוס - Twenty2CRM" <22geder@gmail.com>',
      to: '22geder@gmail.com',
      subject: `🎯 מועמד/ת מתאים/ה למשרה: ${position.title} - ${candidate.name}`,
      html: emailHTML,
      text: `
מועמד/ת: ${candidate.name}
משרה: ${position.title}
טלפון: ${candidate.phone || 'לא צוין'}
אימייל: ${candidate.email || 'לא צוין'}

נקודות התאמה:
${matchingPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

קורות חיים: ${resumeExists ? 'מצורפים' : 'לא זמינים'}
      `.trim()
    };

    // הוספת קורות חיים כקובץ מצורף
    if (resumeExists) {
      const filename = path.basename(candidate.resumeUrl);
      mailOptions.attachments = [{
        filename: `${candidate.name}_CV${path.extname(filename)}`,
        path: resumePath
      }];
      console.log(`📎 מצרף קובץ: ${filename}`);
    } else {
      console.log('⚠️ קובץ קורות חיים לא נמצא - שולח בלי קובץ מצורף');
    }

    console.log('\n📤 שולח מייל...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('\n✅ המייל נשלח בהצלחה!');
    console.log(`📧 נשלח ל: 22geder@gmail.com`);
    console.log(`📝 נושא: ${mailOptions.subject}`);
    console.log(`🆔 Message ID: ${info.messageId}`);
    console.log(`📎 קורות חיים: ${resumeExists ? 'מצורפים ✓' : 'לא צורפו'}`);

  } catch (error) {
    console.error('❌ שגיאה:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

sendCandidateEmail();
