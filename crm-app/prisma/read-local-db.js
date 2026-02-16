// Script to read candidates from local SQLite and prepare for migration
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'dev.db');

try {
  const db = new Database(dbPath, { readonly: true });
  
  console.log('📊 Reading from local SQLite database...\n');
  
  // First list all tables
  const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`).all();
  console.log('📋 Tables in database:', tables.map(t => t.name).join(', '));
  console.log('');
  
  // Check row count for each table
  tables.forEach(t => {
    if (!t.name.startsWith('_') && !t.name.startsWith('sqlite')) {
      try {
        const count = db.prepare(`SELECT COUNT(*) as count FROM "${t.name}"`).get();
        console.log(`   📊 ${t.name}: ${count.count} rows`);
      } catch (e) {}
    }
  });
  console.log('');
  
  // Get all candidates
  const candidates = db.prepare('SELECT * FROM Candidate').all();
  console.log(`👥 Found ${candidates.length} candidates`);
  
  // Get all positions
  const positions = db.prepare('SELECT * FROM Position').all();
  console.log(`📋 Found ${positions.length} positions`);
  
  // Get all employers
  const employers = db.prepare('SELECT * FROM Employer').all();
  console.log(`🏭 Found ${employers.length} employers`);
  
  // Get all tags
  const tags = db.prepare('SELECT * FROM Tag').all();
  console.log(`📌 Found ${tags.length} tags`);
  
  // Get all users
  const users = db.prepare('SELECT * FROM User').all();
  console.log(`👤 Found ${users.length} users`);
  
  // Get all departments
  const departments = db.prepare('SELECT * FROM Department').all();
  console.log(`🏢 Found ${departments.length} departments`);
  
  // Get applications
  let applications = [];
  try {
    applications = db.prepare('SELECT * FROM Application').all();
    console.log(`📝 Found ${applications.length} applications`);
  } catch (e) {
    console.log('📝 No applications table or empty');
  }
  
  // Get candidate tags relationship
  let candidateTags = [];
  try {
    candidateTags = db.prepare('SELECT * FROM _CandidateToTag').all();
    console.log(`🏷️ Found ${candidateTags.length} candidate-tag relations`);
  } catch (e) {
    console.log('🏷️ No candidate tags table');
  }
  
  console.log('\n📋 Candidate Details:');
  candidates.forEach((c, i) => {
    console.log(`  ${i+1}. ${c.name} - ${c.email || 'no email'} - ${c.phone || 'no phone'}`);
  });
  
  console.log('\n🏭 Employer Details:');
  employers.forEach((e, i) => {
    console.log(`  ${i+1}. ${e.name} - ${e.email}`);
  });
  
  // Export data as JSON
  const exportData = {
    candidates,
    positions,
    employers,
    tags,
    users,
    departments,
    applications,
    candidateTags
  };
  
  // Write to file
  const fs = require('fs');
  const exportPath = path.join(__dirname, 'exported-data.json');
  fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
  console.log(`\n✅ Data exported to: ${exportPath}`);
  
  db.close();
  
} catch (error) {
  console.error('❌ Error:', error.message);
  
  // Try alternative: use Prisma with SQLite
  console.log('\n🔄 Trying alternative method with Prisma...');
}
