import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join } from 'path';

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f59e0b"/>
      <stop offset="100%" style="stop-color:#d97706"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <text x="256" y="340" font-size="280" text-anchor="middle" fill="white">🍯</text>
</svg>`;

const sizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
];

async function main() {
  const iconsDir = join(process.cwd(), 'android-icons');
  mkdirSync(iconsDir, { recursive: true });

  const iosDir = join(process.cwd(), 'ios-icons');
  mkdirSync(iosDir, { recursive: true });

  for (const { size, name } of sizes) {
    await sharp(Buffer.from(SVG))
      .resize(size, size)
      .png()
      .toFile(join(iconsDir, name));
    console.log(`✅ ${name}`);
  }

  // iOS needs specific sizes
  const iosSizes = [
    { size: 20, name: 'AppIcon-20.png' },
    { size: 29, name: 'AppIcon-29.png' },
    { size: 40, name: 'AppIcon-40.png' },
    { size: 58, name: 'AppIcon-58.png' },
    { size: 60, name: 'AppIcon-60.png' },
    { size: 76, name: 'AppIcon-76.png' },
    { size: 80, name: 'AppIcon-80.png' },
    { size: 87, name: 'AppIcon-87.png' },
    { size: 120, name: 'AppIcon-120.png' },
    { size: 152, name: 'AppIcon-152.png' },
    { size: 167, name: 'AppIcon-167.png' },
    { size: 180, name: 'AppIcon-180.png' },
    { size: 1024, name: 'AppIcon-1024.png' },
  ];

  for (const { size, name } of iosSizes) {
    await sharp(Buffer.from(SVG))
      .resize(size, size)
      .png()
      .toFile(join(iosDir, name));
    console.log(`✅ iOS ${name}`);
  }

  console.log('\n🎉 All icons generated!');
}

main().catch(console.error);
