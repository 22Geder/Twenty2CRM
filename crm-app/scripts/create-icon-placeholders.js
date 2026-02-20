/**
 * 🖼️ Icon Generator for Twenty2Jobs PWA
 * Run: node scripts/create-icon-placeholders.js
 */

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create SVG that looks like a PNG (will work as fallback)
const createIconSVG = (size) => {
  const fontSize = Math.round(size * 0.35);
  const smallFont = Math.round(size * 0.12);
  const radius = Math.round(size * 0.16);
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="grad${size}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00A8A8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#006666;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#grad${size})"/>
  <text x="${size/2}" y="${size * 0.45}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">22</text>
  ${size >= 144 ? `<text x="${size/2}" y="${size * 0.72}" font-family="Arial, Helvetica, sans-serif" font-size="${smallFont}" fill="rgba(255,255,255,0.9)" text-anchor="middle">JOBS</text>` : ''}
</svg>`;
};

// Generate all icon sizes
console.log('🖼️ Generating PWA icons...\n');

sizes.forEach(size => {
  const svg = createIconSVG(size);
  const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(svgPath, svg);
  console.log(`✅ Created icon-${size}x${size}.svg`);
});

// Create apple-touch-icon
const appleIcon = createIconSVG(180);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.svg'), appleIcon);
console.log('✅ Created apple-touch-icon.svg');

// Create badge icon (smaller, for notifications)
const badgeIcon = createIconSVG(72);
fs.writeFileSync(path.join(iconsDir, 'badge-72x72.svg'), badgeIcon);
console.log('✅ Created badge-72x72.svg');

console.log('\n🎉 All icons created successfully!');
console.log('\n📝 To convert to PNG, open /generate-icons.html in your browser');
console.log('   or use an online SVG to PNG converter.\n');
