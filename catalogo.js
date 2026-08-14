const ACCENTS = {
  cyan: { hover: 'hover:border-cyberCyan', badge: 'text-cyberCyan' },
  amber: { hover: 'hover:border-cyberAmber', badge: 'text-cyberAmber' },
  purple: { hover: 'hover:border-cyberPurple', badge: 'text-cyberPurple' },
  rose: { hover: 'hover:border-cyberRose', badge: 'text-cyberRose' },
  emerald: { hover: 'hover:border-cyberEmerald', badge: 'text-cyberEmerald' }
};

const CODE_TONES = {
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function hasLiveDemo(product) {
  return Boolean(product.demo?.url);
}

function isRequestableDemo(product) {
  return !hasLiveDemo(product);
}

function renderProductCard(product) {
  const accent = ACCENTS[product.accent] || ACCENTS.cyan;
  const codeTone = CODE_TONES[product.codeTone] || CODE_TONES.cyan;
  const hasDocs = Array.isArray(product.documents) && product.documents.length > 0;
  const liveDemo = hasLiveDemo(product);
  const requestable = isRequestableDemo(product);
  const inCart = window.DemoCart?.has(product.id);

  const detailLink = (hasDocs || liveDemo)
    ? `<a href="producto.html?producto=${encodeURIComponent(product.id)}${liveDemo && !hasDocs ? '&vista=demo' : ''}" onclick="synth.playClick()" class="text-slate-400 hover:text-white underline">Ver más</a>`
    : '';

  const requestBtn = requestable
    ? `<button type="button" data-demo-request="${escapeHtml(product.id)}" class="demo-request-btn text-[10px] tracking-wide ${inCart ? 'text-cyberEmerald' : 'text-cyberCyan hover:text-white'} underline">${inCart ? 'En solicitud' : 'Solicitar demo'}</button>`
    : '';

  const actions = [detailLink, requestBtn].filter(Boolean).join('<span class="text-slate-700">·</span>')
    || `<button onclick="openConstructionModal('${escapeHtml(product.name)}')" class="text-slate-400 hover:text-white underline">Ver más</button>`;

  const badges = [];
  if (liveDemo) {
    badges.push('<span class="inline-flex items-center gap-1 text-[9px] font-mono tracking-wider text-cyberCyan border border-cyberCyan/30 bg-cyberCyan/10 px-2 py-0.5 rounded-full">DEMO LIVE</span>');
  } else if (requestable) {
    badges.push('<span class="inline-flex items-center gap-1 text-[9px] font-mono tracking-wider text-cyberAmber border border-cyberAmber/30 bg-cyberAmber/10 px-2 py-0.5 rounded-full">DEMO A SOLICITAR</span>');
  }

  const logo = product.logo
    ? `<img src="${escapeHtml(product.logo)}" alt="${escapeHtml(product.acronym)} ${escapeHtml(product.name)}" class="max-h-28 w-full object-contain">`
    : `<span class="text-2xl font-black text-blue-900 tracking-tight">${escapeHtml(product.acronym)}</span>`;

  return `
    <div class="product-card group bg-darkCard border border-slate-800 rounded-2xl p-6 ${accent.hover} transition-all duration-300 relative overflow-hidden" data-category="${escapeHtml(product.category)}" data-title="${escapeHtml(product.search)}" data-product-id="${escapeHtml(product.id)}" data-requestable="${requestable ? '1' : '0'}">
      <div class="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
        <span class="text-[10px] font-mono ${codeTone} px-2 py-1 rounded border">${escapeHtml(product.code)}</span>
        <span class="text-[10px] font-mono text-slate-500">${escapeHtml(product.area)}</span>
      </div>
      <div class="bg-white rounded-xl p-5 mb-5 min-h-[140px] flex items-center justify-center shadow-inner">
        ${logo}
      </div>
      <h3 class="text-xl font-bold text-white mb-2 text-center">${escapeHtml(product.name)}</h3>
      <p class="text-xs text-slate-400 leading-relaxed mb-4 text-center">${escapeHtml(product.description)}</p>
      <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between font-mono text-xs gap-2">
        <span class="${accent.badge} flex items-center gap-2 flex-wrap">${escapeHtml(product.badge)}${badges.join('')}</span>
        <div class="flex items-center gap-2 shrink-0">${actions}</div>
      </div>
    </div>
  `;
}

let catalogProducts = [];

function refreshRequestButtons() {
  document.querySelectorAll('[data-demo-request]').forEach(btn => {
    const id = btn.getAttribute('data-demo-request');
    const inCart = window.DemoCart?.has(id);
    btn.textContent = inCart ? 'En solicitud' : 'Solicitar demo';
    btn.classList.toggle('text-cyberEmerald', Boolean(inCart));
    btn.classList.toggle('text-cyberCyan', !inCart);
  });
}

function bindRequestButtons() {
  document.querySelectorAll('[data-demo-request]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-demo-request');
      const product = catalogProducts.find(p => p.id === id);
      if (!product || !window.requestDemoAccess) return;
      window.requestDemoAccess(product);
    });
  });
}

async function loadCatalog() {
  const grid = document.getElementById('products-grid');
  const count = document.getElementById('prod-count');
  if (!grid) return;

  try {
    const response = await fetch('productos.json');
    if (!response.ok) throw new Error('No se pudo cargar productos.json');
    catalogProducts = await response.json();
    window.catalogProducts = catalogProducts;
    if (count) count.textContent = catalogProducts.length;
    grid.innerHTML = catalogProducts.map(renderProductCard).join('');
    bindRequestButtons();
    refreshRequestButtons();
  } catch (error) {
    grid.innerHTML = `<p class="text-slate-400 text-sm col-span-full">No se pudieron cargar los productos. Abre el portafolio desde un servidor local.</p>`;
    console.error(error);
  }
}

window.addEventListener('demo-cart:change', refreshRequestButtons);
document.addEventListener('DOMContentLoaded', loadCatalog);
