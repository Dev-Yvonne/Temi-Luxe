Image checklist — Temi Luxe

Place high-quality images in the `assets/` folder using the filenames below. Filenames in `data/products.json` are recommended and the site will automatically use them when present.

Recommended images (filenames shown in the project):

- product-clutch
  - `assets/clutch-1.jpg`       — main (800–1400px wide, web-optimized)
  - `assets/clutch-1@2x.jpg`    — high-res for zoom (1600–2800px wide)
  - `assets/clutch-1.webp`      — WebP variant (browser-preferred)
  - `assets/clutch-1@2x.webp`   — WebP high-res for zoom
  - `assets/clutch-2.jpg`       — alternate view
  - `assets/clutch-3.jpg`       — alternate view

- product-belt
  - `assets/belt-1.jpg`
  - `assets/belt-1@2x.jpg`
  - `assets/belt-1.webp`
  - `assets/belt-1@2x.webp`
  - `assets/belt-2.jpg`

- product-tote
  - `assets/tote-1.jpg`
  - `assets/tote-1@2x.jpg`
  - `assets/tote-1.webp`
  - `assets/tote-1@2x.webp`
  - `assets/tote-2.jpg`

- product-wallet
  - `assets/wallet-1.jpg`
  - `assets/wallet-1@2x.jpg`
  - `assets/wallet-1.webp`
  - `assets/wallet-1@2x.webp`
  - `assets/wallet-2.jpg`

General recommendations
- Provide WebP variants alongside JPEGs for significantly smaller file-sizes and faster loads. The site will serve WebP automatically via `<picture>` when supported.
- Main (hero / zoom) images: 1600–2400px width for high quality; keep them under ~500–800KB if possible.
- Thumbnails: 600–900px width; under ~150KB.
- File names: use the names above (the code/data references these exact paths). If WebP files are present the frontend will prefer them.
- Alt text: keep descriptive alt text for accessibility when you add real images.

Quick verification & conversion
- Run: `npm run verify:images` — reports missing images.
- Generate WebP variants locally: `npm run images:generate` (requires `npm install` to install the image tool). The script will create WebP copies of your JPEGs in `assets/` for development convenience.

If you want, I can add an automatic `<picture>` build step (server-side) or configure an image CDN for on-the-fly conversion. Let me know which you prefer.