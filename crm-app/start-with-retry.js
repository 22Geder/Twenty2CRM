const { execSync } = require('child_process');

const MAX_RETRIES = 30;
const WAIT_SECONDS = 5;

async function waitForDB() {
  for (let i = 1; i <= MAX_RETRIES; i++) {
    try {
      console.log(`🔄 Checking database connection... (attempt ${i}/${MAX_RETRIES})`);
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
      console.log('✅ Database is ready!');
      return true;
    } catch (err) {
      console.log(`⏳ Database not ready. Waiting ${WAIT_SECONDS}s...`);
      await new Promise(resolve => setTimeout(resolve, WAIT_SECONDS * 1000));
    }
  }
  console.error(`❌ Database not available after ${MAX_RETRIES} attempts`);
  process.exit(1);
}

async function main() {
  // Debug: check env vars at startup
  const resendVars = Object.keys(process.env).filter(k => k.includes('RESEND'));
  console.log('🔍 ENV DEBUG - RESEND vars:', resendVars);
  console.log('🔍 ENV DEBUG - RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
  console.log('🔍 ENV DEBUG - RESEND_API_KEY prefix:', process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.substring(0, 6) : 'NOT SET');
  console.log('🔍 ENV DEBUG - Total env vars:', Object.keys(process.env).length);
  
  // Step 1: Wait for database
  await waitForDB();

  // Step 2: Run seed/update script (non-critical - don't crash if it fails)
  try {
    console.log('📦 Running update-sela-positions...');
    execSync('node prisma/update-sela-positions.js', { stdio: 'inherit' });
    console.log('✅ Update complete');
  } catch (err) {
    console.warn('⚠️ update-sela-positions failed (non-critical):', err.message);
  }

  // Step 3: Start the app
  console.log('🚀 Starting Next.js app...');
  execSync('npm start', { stdio: 'inherit' });
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
