const fs = require('fs');
const path = require('path');

// יצירת אייקון SVG פשוט בגדלים שונים
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const generateSVGIcon = (size) => {
  const padding = Math.round(size * 0.15);
  const fontSize22 = Math.round(size * 0.3);
  const fontSizeText = Math.round(size * 0.12);
  const fontSizeJobs = Math.round(size * 0.1);
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00A8A8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#008080;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.16)}" fill="url(#grad)"/>
  <text x="${size/2}" y="${size * 0.42}" font-family="Arial, sans-serif" font-size="${fontSize22}" font-weight="bold" fill="white" text-anchor="middle">22</text>
  ${size >= 128 ? `<text x="${size/2}" y="${size * 0.65}" font-family="Arial, sans-serif" font-size="${fontSizeText}" fill="white" text-anchor="middle">Twenty2</text>` : ''}
  ${size >= 192 ? `<text x="${size/2}" y="${size * 0.8}" font-family="Arial, sans-serif" font-size="${fontSizeJobs}" fill="rgba(255,255,255,0.9)" text-anchor="middle">JOBS</text>` : ''}
</svg>`;
};

// Apple touch icon
const generateAppleIcon = () => {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00A8A8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#008080;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="180" height="180" rx="36" fill="url(#grad)"/>
  <text x="90" y="75" font-family="Arial, sans-serif" font-size="54" font-weight="bold" fill="white" text-anchor="middle">22</text>
  <text x="90" y="115" font-family="Arial, sans-serif" font-size="22" fill="white" text-anchor="middle">Twenty2</text>
  <text x="90" y="145" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.9)" text-anchor="middle">JOBS</text>
</svg>`;
};

// יצירת התיקייה אם לא קיימת
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// יצירת כל האייקונים
sizes.forEach(size => {
  const svg = generateSVGIcon(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.svg`), svg);
  console.log(`✅ Created icon-${size}x${size}.svg`);
});

// Apple touch icon
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.svg'), generateAppleIcon());
console.log('✅ Created apple-touch-icon.svg');

console.log('\n🎉 All icons generated successfully!');
console.log('\n📝 Note: For PNG icons, open generate-png-icons.html in a browser');
