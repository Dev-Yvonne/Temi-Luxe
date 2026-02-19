// Minimal interactivity: nav toggle + newsletter demo
document.addEventListener('DOMContentLoaded', function(){
  const navToggle = document.querySelector('.nav-toggle');
  const navList = document.getElementById('primary-navigation');
  navToggle && navToggle.addEventListener('click', ()=>{
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    navList.classList.toggle('show');
  });

  const form = document.getElementById('newsletter');
  const msg = document.getElementById('newsletter-msg');
  form && form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const email = form.email.value.trim();
    if(!email || !email.includes('@')){
      msg.textContent = 'Please enter a valid email.';
      msg.style.color = '#b03';
      return;
    }
    msg.style.color = '';
    msg.textContent = 'Thanks — you\'re subscribed! (demo)';
    form.reset();
  });

  /* --- Cart: lightweight, DOM-driven, persists to localStorage --- */
  const CART_KEY = 'tl_cart_v1';
  const cartToggles = document.querySelectorAll('.cart-toggle, .cart-fab');
  const cartCountEls = document.querySelectorAll('.cart-count, .cart-fab-count');
  const cartCountEl = document.querySelector('.cart-count');
  const cartStatus = document.getElementById('cart-status');
  const cartPanel = document.getElementById('site-cart');
  const cartItemsEl = document.getElementById('cart-items');
  const cartTotalEl = document.getElementById('cart-total');
  const cartToast = document.getElementById('cart-toast');
  // product catalog cache (populated from data/products.json)
  let productsById = {};
  const getProduct = id => productsById[id] || null;
  const getStockFor = id => { const p = getProduct(id); return p ? Number(p.stock || 0) : Infinity; };
  const formatStock = id => { const s = getStockFor(id); return isFinite(s) ? s : '—'; };
  const NOTIFY_KEY = 'tl_notify_v1';
  const readNotifies = ()=> JSON.parse(localStorage.getItem(NOTIFY_KEY) || '[]');
  const writeNotifies = v => localStorage.setItem(NOTIFY_KEY, JSON.stringify(v));
  function saveNotifyRequest(productId, email){
    const list = readNotifies();
    list.push({productId, email: email.toLowerCase(), ts: Date.now()});
    writeNotifies(list);
  }


  const money = v => 'KES ' + Number(v).toLocaleString('en-KE', {minimumFractionDigits: 0, maximumFractionDigits: 0});
  const readCart = ()=> JSON.parse(localStorage.getItem(CART_KEY) || '{"items":[]}');
  const writeCart = c => localStorage.setItem(CART_KEY, JSON.stringify(c));

  function updateCartSummary(cart){
    const totalQty = cart.items.reduce((s,i)=>s+i.qty,0);
    const subtotal = cart.items.reduce((s,i)=>s + (i.price * i.qty),0);
    cartCountEls.forEach(el => el.textContent = totalQty);
    cartStatus.textContent = `${totalQty} item${totalQty!==1? 's':''} in cart`;

    const subtotalEl = document.getElementById('cart-subtotal');
    if(subtotalEl) subtotalEl.textContent = money(subtotal);
    if(cartTotalEl) cartTotalEl.textContent = money(subtotal);

    const checkoutBtn = document.getElementById('checkout-btn');
    if(checkoutBtn) checkoutBtn.disabled = cart.items.length === 0;
  }

  // wire checkout button once
  const _checkoutBtn = document.getElementById('checkout-btn');
  if(_checkoutBtn){
    _checkoutBtn.addEventListener('click', ()=>{
      if(document.getElementById('site-cart')) showCart(false);
      window.location.href = 'checkout.html';
    });
  }

  function getProductImage(id){
    const p = getProduct(id);
    if(p && p.images && p.images[0]) return p.images[0];
    return 'assets/logo.png';
  }

  function renderCart(){
    const cart = readCart();
    cartItemsEl.innerHTML = '';
    if(cart.items.length === 0){
      cartItemsEl.innerHTML = '<p class="muted small">Your cart is empty.</p>';
      updateCartSummary(cart);
      return;
    }

    cart.items.forEach(item=>{
      const stock = getStockFor(item.id);
      const el = document.createElement('div'); el.className = 'cart-item';
      el.innerHTML = `
        <div class="media"><img src="${getProductImage(item.id)}" alt="${item.name}"></div>
        <div>
          <h4>${item.name}</h4>
          <div class="meta">${item.color}${isFinite(stock) ? ' · ' + stock + ' in stock' : ''}</div>
          <div class="cart-qty-controls">
            <button class="qty-decr" data-id="${item.id}" aria-label="Decrease">−</button>
            <input class="cart-qty-input" data-id="${item.id}" type="number" min="1" value="${item.qty}" aria-label="Qty">
            <button class="qty-incr" data-id="${item.id}" aria-label="Increase">+</button>
          </div>
          ${isFinite(stock) && item.qty >= stock ? '<div class="muted small" style="margin-top:.3rem;font-size:.78rem">Max stock reached</div>' : ''}
          <button class="remove" data-id="${item.id}">✕ Remove</button>
        </div>
        <div class="cart-item-price">${money(item.price * item.qty)}</div>
      `;
      cartItemsEl.appendChild(el);
    });

    updateCartSummary(cart);
  }

  const cartOverlay = document.getElementById('cart-overlay');

  function showCart(open = true){
    cartPanel.setAttribute('aria-hidden', String(!open));
    cartToggles.forEach(t => t.setAttribute('aria-expanded', String(open)));
    if(cartOverlay) cartOverlay.classList.toggle('visible', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if(open) renderCart();
  }

  cartOverlay && cartOverlay.addEventListener('click', ()=> showCart(false));

  // ensure cart does not exceed stock on load (clamps quantities)
  function validateCartAgainstStock(){
    const cart = readCart();
    let changed = false;
    cart.items.forEach(item => {
      const stock = getStockFor(item.id);
      if(isFinite(stock) && item.qty > stock){ item.qty = stock; changed = true; }
      if(isFinite(stock) && stock === 0){ item.qty = 0; changed = true; }
    });
    // remove zero-qty items
    cart.items = cart.items.filter(i=>i.qty > 0);
    if(changed) writeCart(cart);
    if(changed && cart.items.length === 0) toast('Cart adjusted to available stock');
  }

  function toast(msg){
    cartToast.textContent = msg; cartToast.classList.add('show');
    setTimeout(()=>cartToast.classList.remove('show'),1400);
  }

  // wire header/cart controls
  cartToggles.forEach(t => t.addEventListener('click', ()=> showCart(cartPanel.getAttribute('aria-hidden') === 'true')));
  document.querySelectorAll('.cart-close').forEach(b=>b.addEventListener('click', ()=> showCart(false)));

  // add-to-cart handlers
  document.querySelectorAll('.product-card').forEach(card=>{
    const id = card.dataset.id;
    const name = card.dataset.name;
    const price = Number(card.dataset.price || 0);
    const addBtn = card.querySelector('.add-to-cart');
    addBtn && addBtn.addEventListener('click', ()=>{
      const colorInput = card.querySelector('.color-choices input:checked');
      const color = colorInput ? colorInput.value : (card.dataset.colors || '').split(',')[0];
      const qtyInput = card.querySelector('.qty');
      const qty = Math.max(1, Number(qtyInput && qtyInput.value) || 1);

        // enforce stock limits (if available)
      const stock = getStockFor(id);
      const cart = readCart();
      const existing = cart.items.find(i=>i.id === id && i.color === color);
      const existingQty = existing ? existing.qty : 0;
      const available = isFinite(stock) ? Math.max(0, stock - existingQty) : Infinity;
      if(available === 0){
        toast(`${name} — no more stock available`);
        return;
      }
      const qtyToAdd = Math.min(qty, available);
      if(existing) existing.qty = Math.min(stock || existing.qty + qtyToAdd, existing.qty + qtyToAdd); else cart.items.push({id, name, price, color, qty: qtyToAdd});
      writeCart(cart);
      updateCartSummary(cart);
      toast(`${name} — added (${qtyToAdd})${qtyToAdd < qty ? ' (max in stock)' : ''}`);
    });
  });

  // cart item interactions (event delegation): remove, qty incr/decr, notify-me click
  cartItemsEl && cartItemsEl.addEventListener('click', (e)=>{
    const target = e.target;
    // notify button inside product-card or elsewhere
    if(target.matches('.notify-btn')){
      const pid = target.dataset.productId || (target.closest('.product-card') && target.closest('.product-card').dataset.id) || null;
      if(!pid) return;
      // create a small inline email input next to the button
      if(target.closest('.product-card')){
        const card = target.closest('.product-card');
        if(card.querySelector('#notify-inline')) return; // already present
        const nf = document.createElement('div'); nf.id = 'notify-inline'; nf.className = 'notify-form';
        nf.innerHTML = `<input id="notify-email" type="email" placeholder="Email to notify" aria-label="Email to be notified"><button id="notify-submit" class="btn">Notify me</button><div id="notify-msg" class="notify-msg" aria-live="polite"></div>`;
        target.parentElement.appendChild(nf);
      } else {
        // for other placements (not used currently) — open prompt
        const email = prompt('Email to notify when available');
        if(email && email.includes('@')){ saveNotifyRequest(pid, email); toast('You will be notified — demo'); }
      }
      return;
    }

    // remove item
    if(target.matches('.remove')){
      const id = target.dataset.id;
      if(!id) return;
      const cart = readCart();
      cart.items = cart.items.filter(i=>i.id !== id);
      writeCart(cart);
      renderCart();
      return;
    }

    // increment / decrement buttons (respect stock)
    if(target.matches('.qty-incr') || target.matches('.qty-decr')){
      const id = target.dataset.id;
      if(!id) return;
      const cart = readCart();
      const item = cart.items.find(i=>i.id === id);
      if(!item) return;
      const stock = getStockFor(id);
      if(target.matches('.qty-incr')){
        if(isFinite(stock) && item.qty >= stock){
          toast(`Only ${stock} in stock`);
        } else {
          item.qty = Number(item.qty) + 1;
        }
      }
      if(target.matches('.qty-decr')) item.qty = Math.max(1, Number(item.qty) - 1);
      // enforce cap
      if(isFinite(stock) && item.qty > stock) item.qty = stock;
      writeCart(cart);
      renderCart();
      return;
    }
  });

  // handle manual quantity input changes (respect stock)
  cartItemsEl && cartItemsEl.addEventListener('input', (e)=>{
    const target = e.target;
    if(target.matches('.cart-qty-input')){
      const id = target.dataset.id;
      const raw = parseInt(target.value || 1, 10) || 1;
      const stock = getStockFor(id);
      let val = Math.max(1, raw);
      if(isFinite(stock) && val > stock){ val = stock; toast(`Only ${stock} in stock`); }
      target.value = val;

      const cart = readCart();
      const item = cart.items.find(i=>i.id === id);
      if(!item) return;
      item.qty = val;
      writeCart(cart);
      // update line total and summary without re-rendering entire list for snappiness
      const lineTotalEl = target.closest('.cart-item') && target.closest('.cart-item').querySelector('.line-total');
      if(lineTotalEl) lineTotalEl.textContent = money(item.price * item.qty);
      updateCartSummary(cart);
      return;
    }

    // notify inline submit (email)
    if(target.id === 'notify-email') return; // handled by click on button
  });

  // notify submit (delegated click)
  document.addEventListener('click', (e)=>{
    const t = e.target;
    if(t && t.id === 'notify-submit'){
      const wrapper = t.closest('.notify-form');
      const emailInput = wrapper && wrapper.querySelector('#notify-email');
      const msgEl = wrapper && wrapper.querySelector('#notify-msg');
      if(!emailInput || !msgEl) return;
      const email = (emailInput.value || '').trim();
      if(!email || !email.includes('@')){ msgEl.textContent = 'Please enter a valid email'; msgEl.className = 'notify-msg notify-error'; return; }
      // find product id: prefer product-detail, else from nearest product-card
      const pd = document.getElementById('product-detail');
      const pid = (pd && pd.dataset.id) || (t.closest('.product-card') && t.closest('.product-card').dataset.id) || null;
      if(!pid){ msgEl.textContent = 'Unable to determine product'; msgEl.className = 'notify-msg notify-error'; return; }
      saveNotifyRequest(pid, email);
      msgEl.textContent = 'Thanks — we will notify you (demo)'; msgEl.className = 'notify-msg notify-success';
      emailInput.value = '';
    }
  });

  /* product detail page: gallery, zoom modal, stock-aware add-to-cart */
  function initProductDetail(){
    const pd = document.getElementById('product-detail');
    if(!pd) return;
    const stock = Number(pd.dataset.stock || 0);
    const price = Number(pd.dataset.price || 0);
    const id = pd.dataset.id;
    const name = pd.dataset.name;

    const stockEl = document.getElementById('pd-stock');
    const qtyEl = document.getElementById('pd-qty');
    const addBtn = document.getElementById('pd-add');
    const galleryCurrent = document.getElementById('gallery-current');
    const thumbs = Array.from(document.querySelectorAll('.gallery-thumbs .thumb'));
    const zoomModal = document.getElementById('zoom-modal');
    const zoomStageImg = zoomModal && zoomModal.querySelector('.zoom-stage img');

    function refreshStockUI(){
      if(stock <= 0){ 
        stockEl.textContent = 'Out of stock';
        // replace Add button with notify control on product page
        if(addBtn){
          addBtn.disabled = true; addBtn.classList.add('disabled');
          if(!document.getElementById('notify-inline')){
            const nf = document.createElement('div'); nf.id = 'notify-inline'; nf.className = 'notify-form';
            nf.innerHTML = `<input id="notify-email" type="email" placeholder="Email to notify" aria-label="Email to be notified"><button id="notify-submit" class="btn">Notify me</button><div id="notify-msg" class="notify-msg" aria-live="polite"></div>`;
            addBtn.parentElement.appendChild(nf);
          }
        }
      } else if(stock <= 3){ stockEl.textContent = `Only ${stock} left`; }
      else { stockEl.textContent = 'In stock'; }
      qtyEl.max = String(Math.max(1, stock));
    }

    // thumbnail clicks
    thumbs.forEach(t=> t.addEventListener('click', ()=>{
      const src = t.dataset.src || t.querySelector('img').src;
      const high = t.dataset.highres || src;
      galleryCurrent.src = src;
      galleryCurrent.dataset.highres = high;
      thumbs.forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
    }));

    // open zoom modal
    function openZoom(srcHigh){
      if(!zoomModal) return;
      zoomStageImg.src = srcHigh || galleryCurrent.dataset.highres || galleryCurrent.src;
      zoomModal.setAttribute('aria-hidden','false');
      zoomModal.querySelector('.zoom-close').focus();
    }
    galleryCurrent && galleryCurrent.addEventListener('click', ()=> openZoom(galleryCurrent.dataset.highres));

    // modal controls
    if(zoomModal){
      zoomModal.querySelector('.zoom-close').addEventListener('click', ()=> zoomModal.setAttribute('aria-hidden','true'));
      zoomModal.addEventListener('keydown', (ev)=>{ if(ev.key === 'Escape') zoomModal.setAttribute('aria-hidden','true'); });
      const prev = zoomModal.querySelector('.zoom-prev');
      const next = zoomModal.querySelector('.zoom-next');
      let idx = 0;
      function showIndex(i){ idx = (i + thumbs.length) % thumbs.length; const t = thumbs[idx]; galleryCurrent.src = t.dataset.src || galleryCurrent.src; galleryCurrent.dataset.highres = t.dataset.highres || galleryCurrent.dataset.highres; if(zoomStageImg) zoomStageImg.src = galleryCurrent.dataset.highres || galleryCurrent.src; thumbs.forEach(x=>x.classList.toggle('active', x === t)); }
      prev && prev.addEventListener('click', ()=> showIndex(idx-1));
      next && next.addEventListener('click', ()=> showIndex(idx+1));
      // keyboard navigation inside modal
      zoomModal.addEventListener('keydown', (ev)=>{
        if(ev.key === 'ArrowRight') showIndex(idx+1);
        if(ev.key === 'ArrowLeft') showIndex(idx-1);
      });
    }

    // add-to-cart with stock validation
    addBtn && addBtn.addEventListener('click', ()=>{
      const color = (document.querySelector('input[name="pd-color"]:checked') || {}).value || '';
      const qty = Math.max(1, Math.min(Number(qtyEl.value || 1), stock));
      if(stock <= 0){ alert('Sorry — this item is out of stock.'); return; }
      const cart = readCart();
      const existing = cart.items.find(i=>i.id === id && i.color === color);
      if(existing) existing.qty = Math.min(stock, existing.qty + qty); else cart.items.push({id, name, price, color, qty});
      writeCart(cart);
      updateCartSummary(cart);
      toast(`${name} — added (${qty})`);
    });

    refreshStockUI();
  }

  // initialise
  initProductDetail();

  /*
    Product images loader — if `data/products.json` is present this will:
    - populate product-card images on the homepage
    - populate gallery images on product detail pages
    - attach high-res srcset (2x) for zooming
    - fall back to `assets/product-placeholder.svg` when images are missing
  */
  async function initProductImages(){
    try{
      const res = await fetch('data/products.json', {cache: 'no-cache'});
      if(!res.ok) return; // no data file — nothing to do
      const products = await res.json();
      const byId = Object.fromEntries(products.map(p=>[p.id,p]));
      // expose for cart/stock logic
      productsById = byId;

      const makePicture = (sources = [], fallbackSrc = '', fallbackAlt = '') => {
        const pic = document.createElement('picture');
        // prefer explicit webp source entries (products.json may include webp variants)
        sources.forEach(s => {
          if(!s.type) return;
          const srcset = Array.isArray(s.src) ? s.src.join(', ') : s.src;
          const source = document.createElement('source');
          source.setAttribute('type', s.type);
          source.setAttribute('srcset', srcset);
          if(s.media) source.setAttribute('media', s.media);
          pic.appendChild(source);
        });
        const img = document.createElement('img');
        img.src = fallbackSrc || 'assets/product-placeholder.svg';
        if(fallbackSrc) img.alt = fallbackAlt || '';
        img.loading = 'lazy';
        img.decoding = 'async';
        pic.appendChild(img);
        return pic;
      };

      // populate homepage/product-cards — update img src from products.json
      document.querySelectorAll('.product-card').forEach(card=>{
        const id = card.dataset.id;
        const imgWrapper = card.querySelector('.product-media');
        const imgEl = imgWrapper && imgWrapper.querySelector('img');
        const prod = byId[id];
        if(!prod || !imgEl) return;

        const src = prod.images && prod.images[0] ? prod.images[0] : null;
        if(src){
          imgEl.src = src;
          imgEl.alt = imgEl.alt || prod.name || '';
          imgEl.loading = 'lazy';
          imgEl.decoding = 'async';
        }

        // disable add-to-cart on homepage if stock is zero (and show notify option)
        const addBtn = card.querySelector('.add-to-cart');
        if(addBtn){
          if(Number(prod.stock || 0) <= 0){
            addBtn.disabled = true;
            addBtn.textContent = 'Out of stock';
            addBtn.classList.add('disabled');
            if(!card.querySelector('.notify-btn')){
              const nb = document.createElement('button');
              nb.className = 'notify-btn';
              nb.textContent = 'Notify me';
              nb.dataset.productId = prod.id;
              card.querySelector('.actions-row').appendChild(nb);
            }
          } else {
            addBtn.disabled = false;
            addBtn.textContent = 'Add to cart';
            addBtn.classList.remove('disabled');
            const nb = card.querySelector('.notify-btn'); nb && nb.remove();
          }
        }
      });

      // populate product-detail gallery (if present)
      const pd = document.getElementById('product-detail');
      if(pd){
        const id = pd.dataset.id;
        const prod = byId[id];
        const galleryCurrent = document.getElementById('gallery-current');
        const thumbsWrap = document.querySelector('.gallery-thumbs');
        if(prod && galleryCurrent){
          const firstSrc = prod.images && prod.images[0] ? prod.images[0] : null;
          if(firstSrc){
            galleryCurrent.src = firstSrc;
            galleryCurrent.alt = prod.name || '';
            galleryCurrent.dataset.highres = firstSrc;
          }

          if(thumbsWrap && prod.images && prod.images.length){
            thumbsWrap.innerHTML = prod.images.map((src, i)=>{
              return `<button class="thumb" data-src="${src}" data-highres="${src}" aria-label="View image ${i+1}">
                        <img src="${src}" alt="" loading="lazy">
                      </button>`;
            }).join('');
          }
        }
      }

    }catch(err){
      // leave placeholders intact on any error
    }
  }

  initProductImages().finally(()=>{ validateCartAgainstStock(); updateCartSummary(readCart()); });

})();