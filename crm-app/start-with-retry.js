const { execSync, spawn } = require('child_process');
const fs = require('fs');

const MAX_RETRIES = 30;
const WAIT_SECONDS = 5;

// Write .env.local so Next.js loads RESEND vars at startup
function writeEnvLocal() {
  const keysToPass = ['RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'GEMINI_API_KEY'];
  const lines = [];
  for (const key of keysToPass) {
    if (process.env[key]) {
      lines.push(`${key}=${process.env[key]}`);
    }
  }
  if (lines.length > 0) {
    fs.writeFileSync('.env.local', lines.join('\n') + '\n');
    console.log(`📝 Wrote .env.local with ${lines.length} vars`);
  }
  
  // Also write runtime-env.json as backup
  const config = {};
  for (const key of keysToPass) {
    if (process.env[key]) config[key] = process.env[key];
  }
  const filePath = require('path').join(__dirname, 'runtime-env.json');
  fs.writeFileSync(filePath, JSON.stringify(config));
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
  // Write env vars for Next.js
  writeEnvLocal();

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

  // Step 4: Start the app
  console.log('🚀 Starting Next.js app...');
  const port = process.env.PORT || '3000';
  
  const child = spawn('npx', ['next', 'start', '-H', '0.0.0.0', '-p', port], {
    stdio: 'inherit',
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
