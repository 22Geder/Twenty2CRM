// בדיקת כל סוגי המיקומים במערכת

const positionLocations = [
  // מזרחי - מספר ערים
  'תל אביב, רמת גן, בת ים',
  'חולון, גבעתיים, בני ברק, פתח תקווה, קרית אונו, ראש העין',
  // מזרחי - עיר + אזור
  'תל אביב - רמת החייל',
  'רמת גן - הבורסה',
  'חולון - פארק עסקים',
  // סלע - עיר + רחוב
  'אשדוד - המדע 2',
  'בית שמש - אזור תעשייה הר טוב',
  'אשדוד המדע 2 / בית שמש הר טוב',
  // אופרייט - עיר בודדת
  'גלילות',
  'חדרה'
];

const candidateCities = ['תל אביב', 'רמת גן', 'בת ים', 'חולון', 'אשדוד', 'בית שמש', 'גלילות', 'חדרה', 'באר שבע'];

console.log('בדיקת התאמת מיקומים:');
console.log('='.repeat(80));

for (const posLoc of positionLocations) {
  console.log('\nמשרה: ' + posLoc);
  const matches = [];
  for (const city of candidateCities) {
    const posLower = posLoc.toLowerCase();
    const cityLower = city.toLowerCase();
    if (posLower.includes(cityLower) || cityLower.includes(posLower)) {
      matches.push(city);
    }
  }
  console.log('  מתאים למועמדים מ: ' + (matches.length > 0 ? matches.join(', ') : 'אף אחד'));
}
