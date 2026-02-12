#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const PROD = path.resolve(__dirname, '..', 'data', 'products.json');

function exists(p){ return fs.existsSync(path.resolve(__dirname, '..', p)); }
function ensureDir(p){ const d = path.dirname(p); if(!fs.existsSync(d)) fs.mkdirSync(d, {recursive:true}); }

if(!fs.existsSync(PROD)){
  console.error('No data/products.json found — nothing to verify.');
  process.exit(1);
}

const products = JSON.parse(fs.readFileSync(PROD,'utf8'));
let missing = [];
products.forEach(p=>{
  (p.images || []).forEach((img, i)=>{
    if(!exists(img)) missing.push({product: p.id, file: img});
    // expect a WebP sibling for best performance
    const webp = img.replace(/\.(jpe?g|png)$/i, '.webp');
    if(!exists(webp)) missing.push({product: p.id, file: webp, hint: 'webp-suggested'});
  });
  (p.imagesHigh || []).forEach((img, i)=>{
    if(!exists(img)) missing.push({product: p.id, file: img});
    const webp = img.replace(/\.(jpe?g|png)$/i, '.webp');
    if(!exists(webp)) missing.push({product: p.id, file: webp, hint: 'webp-suggested'});
  });
});

if(missing.length === 0){
  console.log('All product images present ✅');
  process.exit(0);
}

console.log('Missing images:');
missing.forEach(m=> console.log(` - ${m.product}: ${m.file}${m.hint? ' ('+m.hint+')':''}`));

const needPlaceholders = missing.filter(x=> !x.hint);
if(needPlaceholders.length && process.argv.includes('--create-placeholders')){
  console.log('\nCreating simple SVG placeholders for missing images...');
  needPlaceholders.forEach(m=>{
    const dest = path.resolve(__dirname, '..', m.file);
    ensureDir(dest);
    const svg = `<?xml version="1.0" encoding="utf-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">\n  <rect width="100%" height="100%" fill="#f6f2ed"/>\n  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#c9a582" font-family="Inter,Arial,Helvetica" font-size="36">${path.basename(m.file)}\n(placeholder)</text>\n</svg>`;
    fs.writeFileSync(dest, svg, 'utf8');
    console.log('  created', m.file);
  });
  console.log('\nPlace real optimized images over these placeholders before publishing.');
}

console.log('\nTip: run `npm run images:generate` to create WebP variants for existing JPEGs (requires additional dev dependency).');
process.exit(1);