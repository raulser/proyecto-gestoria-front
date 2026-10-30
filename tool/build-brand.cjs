// Run with `node tool/build-brand.cjs`. SVG files are the editable sources.
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require(process.env.SAVIA_SHARP_MODULE || 'sharp');

async function main() {
  const root = path.resolve(__dirname, '..');
  const brand = path.join(root, 'assets', 'brand');
  const theme = path.join(root, 'keycloak-theme', 'savia', 'login', 'resources', 'img');
  const web = path.join(root, 'web');
  const logo = await fs.readFile(path.join(brand, 'savia-logo.svg'));
  const symbol = await fs.readFile(path.join(brand, 'savia-symbol.svg'));
  await fs.mkdir(theme, { recursive: true });
  await fs.copyFile(path.join(brand, 'savia-logo.svg'), path.join(theme, 'savia-logo-v1.svg'));
  await fs.copyFile(path.join(brand, 'savia-symbol.svg'), path.join(theme, 'savia-symbol-v1.svg'));
  await fs.copyFile(path.join(brand, 'savia-symbol.svg'), path.join(web, 'savia-symbol-v1.svg'));
  await sharp(logo).resize(784, 224).png().toFile(path.join(brand, 'savia-logo.png'));
  await sharp(Buffer.from(logo.toString().replace('stroke="#36304D"', 'stroke="#FFFFFF"')))
    .resize(784, 224).png().toFile(path.join(brand, 'savia-logo-light.png'));
  for (const size of [180, 192, 512]) {
    const markSize = Math.round(size * 0.72);
    const mark = await sharp(symbol).resize(markSize, markSize).png().toBuffer();
    await sharp({ create: { width: size, height: size, channels: 4, background: '#ffffff' } })
      .composite([{ input: mark, gravity: 'center' }])
      .png().toFile(path.join(web, `savia-icon-${size}-v1.png`));
  }
  console.log('Savia: logo assets updated.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
