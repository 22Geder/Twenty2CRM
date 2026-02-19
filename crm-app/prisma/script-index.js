/**
 * 📁 אינדקס סקריפטים - מארגן את כל הסקריפטים לפי קטגוריה
 * 
 * שימוש:
 * node prisma/script-index.js [category] [script]
 * node prisma/script-index.js seeds seed-yes-positions
 * node prisma/script-index.js list
 */

const { execSync } = require('child_process')
const path = require('path')

// 🗂️ קטגוריות סקריפטים
const SCRIPT_CATEGORIES = {
  seeds: {
    description: '🌱 סקריפטים להוספת נתונים',
    scripts: [
      'seed.js',
      'seed-full.js',
      'seed-hebrew.js',
      'seed-production.js',
      'seed-all-jobs.js',
      'seed-positions.js',
      'seed-new-positions.js',
      'seed-new-employers.js',
      'seed-automotive-positions.js',
      'seed-boutik-hapita.js',
      'seed-logistics-positions.js',
      'seed-mizrahi-positions.js',
      'seed-mizrahi-positions-full.js',
      'seed-union-cars.js',
      'seed-union-positions.js',
      'seed-yes-positions.js',
      'add-gac-positions.js',
      'add-job-codes-mizrahi.js',
      'add-upright-positions.js',
    ]
  },
  
  updates: {
    description: '🔄 סקריפטים לעדכון נתונים',
    scripts: [
      'update-banking-positions.js',
      'update-customer-service-keywords.js',
      'update-dana-email.js',
      'update-employer-email.js',
      'update-lashing-haifa.js',
      'update-logistikar-positions.js',
      'update-mizrahi-benefits.js',
      'update-mizrahi-positions-feb2026.js',
      'update-position-tags.js',
      'update-sela-positions.js',
      'update-yes-contacts.js',
      'update-yes-contacts-direct.js',
      'update-yes-for-young.js',
      'upgrade-all-keywords.js',
    ]
  },
  
  checks: {
    description: '🔍 סקריפטים לבדיקה וקריאה',
    scripts: [
      'check-eliran.js',
      'check-latest.js',
      'check-union-positions.js',
      'check-yes-position.js',
      'find-sales-candidates.js',
      'read-local-db.js',
      'verify-positions.js',
    ]
  },
  
  fixes: {
    description: '🔧 סקריפטים לתיקון ומחיקה',
    scripts: [
      'fix-all-car-positions.js',
      'fix-yes-location.js',
      'fix-yes-position.js',
      'delete-all-positions.js',
      'delete-old-positions.js',
      'reset-for-production.js',
      'restore-all-data.js',
    ]
  }
}

/**
 * הצגת רשימת כל הסקריפטים
 */
function listScripts() {
  console.log('\n📁 אינדקס סקריפטים - Prisma\n')
  console.log('=' .repeat(50))
  
  for (const [category, data] of Object.entries(SCRIPT_CATEGORIES)) {
    console.log(`\n${data.description}`)
    console.log('-'.repeat(40))
    data.scripts.forEach(script => {
      const name = script.replace('.js', '')
      console.log(`  • ${category}/${name}`)
    })
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('\n📝 שימוש:')
  console.log('  node prisma/script-index.js [category] [script]')
  console.log('  node prisma/script-index.js seeds seed-yes-positions')
  console.log('  node prisma/script-index.js checks check-latest')
  console.log('')
}

/**
 * הרצת סקריפט
 */
function runScript(category, scriptName) {
  const categoryData = SCRIPT_CATEGORIES[category]
  
  if (!categoryData) {
    console.error(`❌ קטגוריה לא קיימת: ${category}`)
    console.log('קטגוריות זמינות:', Object.keys(SCRIPT_CATEGORIES).join(', '))
    process.exit(1)
  }
  
  // הוסף .js אם חסר
  const fullScriptName = scriptName.endsWith('.js') ? scriptName : `${scriptName}.js`
  
  if (!categoryData.scripts.includes(fullScriptName)) {
    console.error(`❌ סקריפט לא קיים בקטגוריה ${category}: ${scriptName}`)
    console.log('סקריפטים זמינים:')
    categoryData.scripts.forEach(s => console.log(`  • ${s}`))
    process.exit(1)
  }
  
  const scriptPath = path.join(__dirname, fullScriptName)
  
  console.log(`\n🚀 מריץ: ${fullScriptName}`)
  console.log('-'.repeat(40))
  
  try {
    execSync(`node "${scriptPath}"`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    })
    console.log('\n✅ הסקריפט הסתיים בהצלחה')
  } catch (error) {
    console.error('\n❌ שגיאה בהרצת הסקריפט')
    process.exit(1)
  }
}

/**
 * מציאת סקריפט בכל הקטגוריות
 */
function findScript(scriptName) {
  const fullScriptName = scriptName.endsWith('.js') ? scriptName : `${scriptName}.js`
  
  for (const [category, data] of Object.entries(SCRIPT_CATEGORIES)) {
    if (data.scripts.includes(fullScriptName)) {
      return { category, script: fullScriptName }
    }
  }
  
  return null
}

// CLI
const args = process.argv.slice(2)

if (args.length === 0 || args[0] === 'list') {
  listScripts()
} else if (args.length === 1) {
  // חפש סקריפט בכל הקטגוריות
  const result = findScript(args[0])
  if (result) {
    runScript(result.category, result.script)
  } else {
    console.error(`❌ סקריפט לא נמצא: ${args[0]}`)
    listScripts()
  }
} else if (args.length >= 2) {
  runScript(args[0], args[1])
} else {
  listScripts()
}
