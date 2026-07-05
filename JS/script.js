/* ---------------- DATA ---------------- */
const GAMES = [
  {id:'g1', title:'Nebula Drift', desc:'A zero-gravity racer through collapsing star systems. Draft your rivals or blast a shortcut through an asteroid belt.', category:'Racing', price:39.99, discount:0.25, featured:true, art:{grad:['#ff8a3d','#e2432a'], shape:'orbit'}},
  {id:'g2', title:'Fable of Ash', desc:'A hand-painted RPG about a village rebuilding after the embers cool. Every choice regrows the map differently.', category:'RPG', price:49.99, discount:0.15, featured:true, art:{grad:['#7c5cff','#2fb8b8'], shape:'leaf'}},
  {id:'g3', title:'Cardinal Protocol', desc:'A stealth-strategy hybrid where you route power through a city grid to stay one step ahead of the blackout.', category:'Strategy', price:29.99, discount:0.4, featured:true, art:{grad:['#12595a','#0fd6d6'], shape:'grid'}},
  {id:'g4', title:'Pocket Orchard', desc:'A cozy puzzle game about growing a tiny, tangled garden inside a matchbox.', category:'Puzzle', price:14.99, discount:0.3, art:{grad:['#3ef23e','#1c7d7e'], shape:'seed'}},
  {id:'g5', title:'Rustline Rally', desc:'Off-road racing across an abandoned rail network. Physics-driven wrecks, no respawns.', category:'Racing', price:24.99, discount:0.1, art:{grad:['#e2432a','#f2b83e'], shape:'road'}},
  {id:'g6', title:'Undertow Society', desc:'A narrative deep-sea exploration game told through recovered logs and drifting wreckage.', category:'Indie', price:19.99, discount:0.5, art:{grad:['#0b3d3d','#2fb8b8'], shape:'wave'}},
  {id:'g7', title:'Ledger of Kings', desc:'A turn-based strategy game about running the economy behind a fading empire.', category:'Strategy', price:34.99, discount:0, art:{grad:['#7d5a3d','#e2432a'], shape:'crown'}},
  {id:'g8', title:'Static Choir', desc:'A rhythm-horror game where every wrong beat draws something closer in the dark.', category:'Indie', price:17.99, discount:0.2, art:{grad:['#3d1c59','#e2432a'], shape:'spike'}},
  {id:'g9', title:'Featherweight', desc:'A gravity-flipping platformer starring a paper crane trying to reach the top of a storm.', category:'Puzzle', price:12.99, discount:0.35, art:{grad:['#2fb8b8','#f2f2f2'], shape:'feather'}},
  {id:'g10', title:'Fault Line FC', desc:'Arcade football with earthquake-warped pitches that reshape mid-match.', category:'Sports', price:27.99, discount:0.05, art:{grad:['#1fbf1f','#0b3d3d'], shape:'ball'}},
];
const CATEGORIES = [...new Set(GAMES.map(g=>g.category))];

/* ---------------- STATE ---------------- */
let cart = []; // {id, qty}
let previewIndex = 0;
const featured = GAMES.filter(g=>g.featured);
let surveyAnswers = {found:null, recommend:null};

/* ---------------- ART RENDERING ---------------- */
function shapeSVG(shape, colorA, colorB){
  const grad = `linear-gradient(135deg, ${colorA}, ${colorB})`;
  const glyphs = {
    orbit: '◑', leaf:'❧', grid:'▦', seed:'✦', road:'≋',
    wave:'〰', crown:'♛', spike:'✷', feather:'❄', ball:'●'
  };
  return `<div class="art" style="background:${grad};">
    <span style="font-size:64px;color:rgba(255,255,255,.85);">${glyphs[shape]||'★'}</span>
  </div>`;
}

/* ---------------- NAV ---------------- */
function showPage(id){
  document.querySelectorAll('main.page').forEach(p=>p.classList.remove('visible'));
  document.getElementById('page-'+id).classList.add('visible');
  document.getElementById('nav-sale').classList.toggle('active', id==='sale');
  if(id==='sale') renderSaleList();
  if(id==='cart') renderCart();
  if(id==='payment') { document.getElementById('pay-item-count').textContent = cartTotalQty(); validateCard(); }
  window.scrollTo(0,0);
}
function goHome(){ showPage('home'); }

/* ---------------- HOME / CAROUSEL ---------------- */
function renderPreview(){
  const g = featured[previewIndex];
  document.getElementById('preview-art-wrap').innerHTML = shapeSVG(g.art.shape, g.art.grad[0], g.art.grad[1]);
  document.getElementById('preview-title').textContent = g.title;
  document.getElementById('preview-desc').textContent = g.desc;
  const fp = finalPrice(g).toFixed(2);
  document.getElementById('preview-price').innerHTML = g.discount>0
    ? `<span class="price-strike">$${g.price.toFixed(2)}</span>$${fp} <span style="color:var(--red-accent);font-weight:700;">(${Math.round(g.discount*100)}% off)</span>`
    : `$${fp}`;
  document.getElementById('preview-add-btn').onclick = ()=>addToCart(g.id);
}
function cyclePreview(dir){
  previewIndex = (previewIndex + dir + featured.length) % featured.length;
  renderPreview();
}
function renderCategoryGrid(){
  const grid = document.getElementById('cat-grid');
  grid.innerHTML = '';
  CATEGORIES.forEach((cat,i)=>{
    const box = document.createElement('button');
    box.className = 'cat-box';
    box.textContent = cat;
    box.onclick = ()=>{
      document.getElementById('filter-category').value = cat;
      showPage('sale');
    };
    grid.appendChild(box);
  });
}

/* ---------------- SUMMER SALE ---------------- */
function initFilters(){
  const catSelect = document.getElementById('filter-category');
  CATEGORIES.forEach(cat=>{
    const opt = document.createElement('option');
    opt.value = cat; opt.textContent = cat;
    catSelect.appendChild(opt);
  });
}
function renderSaleList(){
  const cat = document.getElementById('filter-category').value;
  const priceSort = document.getElementById('filter-price').value;
  const discSort = document.getElementById('filter-discount').value;

  let list = [...GAMES];
  if(cat) list = list.filter(g=>g.category===cat);
  if(discSort==='only-discounted') list = list.filter(g=>g.discount>0);

  if(priceSort==='low-high') list.sort((a,b)=>finalPrice(a)-finalPrice(b));
  else if(priceSort==='high-low') list.sort((a,b)=>finalPrice(b)-finalPrice(a));

  if(discSort==='high-low') list.sort((a,b)=>b.discount-a.discount);

  const container = document.getElementById('sale-list');
  container.innerHTML = '';
  if(list.length===0){
    container.innerHTML = '<div class="empty-note">No games match those filters.</div>';
    return;
  }
  list.forEach(g=>{
    const row = document.createElement('div');
    row.className = 'sale-item';
    const fp = finalPrice(g).toFixed(2);
    row.innerHTML = `
      <div class="sale-item-art">${shapeSVG(g.art.shape, g.art.grad[0], g.art.grad[1])}</div>
      <div class="sale-item-info">
        <h4>${g.title}</h4>
        <p>${g.desc}</p>
        <div class="sale-item-price">${g.discount>0 ? `<span class="price-strike">$${g.price.toFixed(2)}</span>$${fp} <span style="color:#ffd9d9;font-weight:700;">(${Math.round(g.discount*100)}% off)</span>` : `$${fp}`}</div>
        <button class="add-cart-corner" onclick="addToCart('${g.id}')">Add to Cart</button>
      </div>`;
    container.appendChild(row);
  });
}
function finalPrice(g){ return g.price * (1 - g.discount); }

/* ---------------- CART ---------------- */
function addToCart(id){
  const existing = cart.find(c=>c.id===id);
  if(existing) existing.qty += 1;
  else cart.push({id, qty:1});
  updateCartBadge();
}
function removeFromCart(id){
  cart = cart.filter(c=>c.id!==id);
  updateCartBadge();
  renderCart();
}
function cartTotalQty(){ return cart.reduce((sum,c)=>sum+c.qty,0); }
function updateCartBadge(){
  const label = document.getElementById('cart-count-label');
  const n = cartTotalQty();
  label.textContent = n>0 ? ` (${n})` : '';
  const advBtn = document.getElementById('advance-payment-btn');
  if(advBtn) advBtn.disabled = n===0;
}
function renderCart(){
  const box = document.getElementById('cart-box');
  box.innerHTML = '';
  if(cart.length===0){
    box.innerHTML = '<div class="empty-note" style="color:#fff;">Your cart is empty.</div>';
  } else {
    cart.forEach(c=>{
      const g = GAMES.find(x=>x.id===c.id);
      const row = document.createElement('div');
      row.className = 'cart-row';
      row.innerHTML = `
        <div class="cart-row-art">${shapeSVG(g.art.shape, g.art.grad[0], g.art.grad[1])}</div>
        <div class="cart-row-info">
          <h4>${g.title}</h4>
          <div class="qty-line">Qty: ${c.qty} &nbsp;·&nbsp; $${finalPrice(g).toFixed(2)} each</div>
          <button class="remove-btn" onclick="removeFromCart('${g.id}')">Remove</button>
        </div>`;
      box.appendChild(row);
    });
  }
  const advBtn = document.getElementById('advance-payment-btn');
  advBtn.disabled = cart.length===0;
}

/* ---------------- PAYMENT ---------------- */
function validateCard(){
  const input = document.getElementById('card-number');
  input.value = input.value.replace(/\D/g,'').slice(0,12);
  const ok = input.value.length===12;
  document.getElementById('confirm-payment-btn').disabled = !ok;
}
function confirmPayment(){
  cart = [];
  updateCartBadge();
  document.getElementById('card-number').value = '';
  showPage('survey');
}

/* ---------------- SURVEY ---------------- */
function updateSliderVal(){
  document.getElementById('survey-slider-val').textContent = document.getElementById('survey-slider').value;
}
function setYN(q, v){
  surveyAnswers[q] = v;
  document.querySelectorAll(`.yn-btn[data-q="${q}"]`).forEach(btn=>{
    btn.classList.toggle('selected', btn.dataset.v===v);
  });
}
function confirmSurvey(){
  document.getElementById('survey-slider').value = 5;
  updateSliderVal();
  surveyAnswers = {found:null, recommend:null};
  document.querySelectorAll('.yn-btn').forEach(btn=>btn.classList.remove('selected'));
  goHome();
}

/* ---------------- INIT ---------------- */
function init(){
  renderPreview();
  renderCategoryGrid();
  initFilters();
  renderSaleList();
  updateCartBadge();
  showPage('home');
}
init();