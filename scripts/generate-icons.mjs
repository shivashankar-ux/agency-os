import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputSvg = path.join(__dirname, '../public/icons/icon.svg');
const outputDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const svgBuffer = fs.readFileSync(inputSvg);
  
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Generated ${outputPath}`);
  }
  
  // Also generate a maskable version for 192 and 512
  for (const size of [192, 512]) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}-maskable.png`);
    await sharp(svgBuffer)
      .resize(size, size, { fit: 'contain', background: '#1e293b' })
      .png()
      .toFile(outputPath);
    console.log(`Generated maskable ${outputPath}`);
  }
}

generateIcons().catch(console.error);