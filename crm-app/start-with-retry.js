const { execSync, spawn } = require('child_process');
const fs = require('fs');

const MAX_RETRIES = 30;
const WAIT_SECONDS = 5;

// Write runtime env vars to JSON file so Next.js API routes can read them
function writeRuntimeEnv() {
  const keysToPass = [
    'RESEND_API_KEY',
    'RESEND_FROM_EMAIL',
    'GEMINI_API_KEY',
  ];
  const config = {};
  for (const key of keysToPass) {
    const val = process.env[key];
    console.log(`📝 ENV CHECK: ${key} = ${val ? val.substring(0, 8) + '...' : 'NOT SET'} (type: ${typeof val})`);
    if (val) {
      config[key] = val;
    }
  }
  // Also log ALL env keys that contain RESEND
  const allResendKeys = Object.keys(process.env).filter(k => k.toUpperCase().includes('RESEND'));
  console.log(`📝 All RESEND-related env keys: ${JSON.stringify(allResendKeys)}`);
  
  const filePath = require('path').join(__dirname, 'runtime-env.json');
  fs.writeFileSync(filePath, JSON.stringify(config));
  console.log(`📝 Created runtime-env.json at ${filePath} with ${Object.keys(config).length} vars: ${Object.keys(config).join(', ')}`);
}

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
  
  // Write env vars to runtime-env.json for Next.js
  writeRuntimeEnv();

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

  // Step 3: Start the app using spawn with explicit env passing
  console.log('🚀 Starting Next.js app...');
  const port = process.env.PORT || '3000';
  console.log(`🔍 Passing ${Object.keys(process.env).length} env vars to Next.js, port: ${port}`);
  console.log(`🔍 RESEND_API_KEY in env: ${!!process.env.RESEND_API_KEY}`);
  
  const child = spawn('npx', ['next', 'start', '-H', '0.0.0.0', '-p', port], {
    stdio: 'inherit',
    env: { ...process.env },
  });
  
  child.on('exit', (code) => {
    console.log(`Next.js exited with code ${code}`);
    process.exit(code || 0);
  });
  
  child.on('error', (err) => {
    console.error('Failed to start Next.js:', err);
    process.exit(1);
  });
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
