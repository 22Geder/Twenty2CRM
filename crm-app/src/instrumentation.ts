// Cron scheduler for reminders
// This runs automatically when the server starts

import cron from 'node-cron';

let cronJobsInitialized = false;

export async function register() {
  // Only run on server side and in production
  if (process.env.NEXT_RUNTIME === 'nodejs' && !cronJobsInitialized) {
    cronJobsInitialized = true;
    
    console.log('🕐 Starting cron scheduler for reminders...');
    
    const baseUrl = process.env.NEXTAUTH_URL || 'https://twenty2crm-production-7997.up.railway.app';
    
    // 📅 ראיונות - כל יום ב-7:00 בבוקר (שעון ישראל זה 5:00 UTC)
    cron.schedule('0 5 * * *', async () => {
      console.log('🔔 Running morning interview reminders...');
      try {
        const response = await fetch(`${baseUrl}/api/interview-reminders?type=interviews`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const result = await response.json();
        console.log('✅ Interview reminders sent:', result.message);
      } catch (error) {
        console.error('❌ Failed to send interview reminders:', error);
      }
    }, {
      timezone: 'Asia/Jerusalem'
    });

    // 🔄 מועמדים בתהליך - כל 4 שעות (8:00, 12:00, 16:00, 20:00)
    cron.schedule('0 6,10,14,18 * * *', async () => {
      console.log('🔄 Running in-process candidates update...');
      try {
        const response = await fetch(`${baseUrl}/api/interview-reminders?type=in-process`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const result = await response.json();
        console.log('✅ In-process update sent:', result.message);
      } catch (error) {
        console.error('❌ Failed to send in-process update:', error);
      }
    }, {
      timezone: 'Asia/Jerusalem'
    });

    console.log('✅ Cron jobs scheduled:');
    console.log('   📅 Interview reminders: Every day at 7:00 AM (Israel time)');
    console.log('   🔄 In-process updates: Every 4 hours (8:00, 12:00, 16:00, 20:00)');
  }
}
