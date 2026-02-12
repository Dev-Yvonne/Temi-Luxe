#!/usr/bin/env node
/*
  generate-webp.js
  - Reads `data/products.json` and generates WebP siblings for listed JPEG/PNG images.
  - Uses `sharp` for conversion. Install with `npm install` first (sharp is in devDependencies).
  - Usage: `npm run images:generate`
*/

const fs = require('fs');
const path = require('path');

let sharp; try{ sharp = require('sharp'); }catch(e){
  console.error('Missing dependency: sharp. Run `npm install` to add it.');
  process.exit(1);
}

const PROD = path.resolve(__dirname, '..', 'data', 'products.json');
if(!fs.existsSync(PROD)){ console.error('data/products.json not found.'); process.exit(1); }

const products = JSON.parse(fs.readFileSync(PROD,'utf8'));

function ensureDir(p){ const d = path.dirname(p); if(!fs.existsSync(d)) fs.mkdirSync(d, {recursive:true}); }

(async function(){
  const ops = [];
  products.forEach(p=>{
    (p.images || []).forEach(img => {
      const src = path.resolve(__dirname, '..', img);
      const out = src.replace(/\.(jpe?g|png)$/i, '.webp');
      ops.push({src,out});
    });
    (p.imagesHigh || []).forEach(img => {
      const src = path.resolve(__dirname, '..', img);
      const out = src.replace(/\.(jpe?g|png)$/i, '.webp');
      ops.push({src,out});
    });
  });

  if(ops.length === 0){ console.log('No images declared in data/products.json — nothing to do.'); return; }

  for(const o of ops){
    try{
      if(!fs.existsSync(o.src)){
        console.warn('source missing, skipping:', path.relative(process.cwd(), o.src));
        continue;
      }
      ensureDir(o.out);
      await sharp(o.src)
        .webp({quality: 78})
        .toFile(o.out);
      console.log('created', path.relative(process.cwd(), o.out));
    }catch(err){
      console.error('failed to convert', o.src, err.message);
    }
  }

  console.log('\nDone. Review the generated WebP files in `assets/` and commit them with your site assets.');
})();