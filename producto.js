const catalog = await fetch('productos.json').then(r => {
  if (!r.ok) throw new Error('productos.json');
  return r.json();
});

const PRODUCTS = Object.fromEntries(
  catalog
    .filter(p => p.documents?.length || p.demo?.url)
    .map(p => [p.id, {
      id: p.id,
      code: p.code,
      acronym: p.acronym || '',
      area: p.area || '',
      title: p.name,
      name: p.name,
      description: p.docsDescription || p.description,
      chips: p.chips || [],
      documents: p.documents || [],
      demo: p.demo || null
    }])
);

const params = new URLSearchParams(location.search);
const requested = params.get('producto');
const key = PRODUCTS[requested] ? requested : (Object.keys(PRODUCTS)[0] || 'logistica');
const product = PRODUCTS[key];
const hasDocs = product.documents.length > 0;
const hasDemo = Boolean(product.demo?.url);
const canRequestDemo = !hasDemo;
const demoMode = product.demo?.mode === 'external' ? 'external' : 'embed';

const $ = id => document.getElementById(id);

$('productCode').textContent = product.code;
$('productTitle').textContent = product.title;
$('productDescription').textContent = product.description;
$('productChips').innerHTML = product.chips.map(x => `<span>${x}</span>`).join('');
$('documentCount').textContent = String(Math.max(product.documents.length, 0)).padStart(2, '0');
document.title = `XIAREX | ${product.title}`;

const synth = {
  audioCtx: null,
  init() {
    if (!this.audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) this.audioCtx = new Ctx();
    }
    if (this.audioCtx?.state === 'suspended') this.audioCtx.resume();
  },
  playClick() {
    try {
      this.init();
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.audioCtx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.05);
    } catch (e) {}
  },
  playSuccess() {
    try {
      this.init();
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  }
};

let pdfjsLib, pdf, currentPage = 1, scale = 1, activeIndex = 0, rendering = false, pendingPage = null, fitMode = true, demoLoaded = false;
const canvas = $('pdfCanvas');
const ctx = canvas.getContext('2d');
const stage = $('viewerStage');

function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 2200);
}

function shortUrl(url) {
  try {
    const u = new URL(url);
    return u.host + (u.pathname.length > 28 ? u.pathname.slice(0, 28) + '…' : u.pathname);
  } catch {
    return url;
  }
}

function setView(view) {
  const showDemo = view === 'demo';
  const showRequest = view === 'request';
  $('workspaceDocs').hidden = showDemo || showRequest;
  $('workspaceDemo').hidden = !showDemo;
  $('workspaceRequest').hidden = !showRequest;
  $('tabDocs')?.classList.toggle('active', view === 'docs');
  $('tabDemo')?.classList.toggle('active', showDemo);
  $('tabRequest')?.classList.toggle('active', showRequest);
  $('topbarMode').textContent = showDemo
    ? 'LIVE DEMO CORE'
    : (showRequest ? 'DEMO REQUEST CORE' : 'DOCUMENTATION CORE');
  $('heroLabel').textContent = showDemo
    ? 'EXPERIENCIA DEMO'
    : (showRequest ? 'SOLICITUD DE DEMO' : 'DOCUMENTACIÓN INTERACTIVA');
}

function setupTabs() {
  const tabs = $('viewTabs');
  const modes = [hasDocs && 'docs', hasDemo && 'demo', canRequestDemo && 'request'].filter(Boolean);
  if (!modes.length) return;

  tabs.hidden = modes.length < 2;
  $('tabDocs').hidden = !hasDocs;
  $('tabDemo').hidden = !hasDemo;
  $('tabRequest').hidden = !canRequestDemo;

  if (hasDocs) $('tabDocs').addEventListener('click', () => { synth.playClick(); setView('docs'); });
  if (hasDemo) $('tabDemo').addEventListener('click', () => { synth.playClick(); setView('demo'); });
  if (canRequestDemo) $('tabRequest').addEventListener('click', () => { synth.playClick(); setView('request'); });

  const initial = params.get('vista') === 'demo' && hasDemo
    ? 'demo'
    : (params.get('vista') === 'request' && canRequestDemo
      ? 'request'
      : (hasDocs ? 'docs' : (hasDemo ? 'demo' : 'request')));
  setView(initial);
}

function setupRequestDemo() {
  if (!canRequestDemo) {
    $('workspaceRequest').hidden = true;
    return;
  }

  const refreshStatus = () => {
    const inCart = DemoCart.has(product.id);
    $('requestStatus').textContent = inCart
      ? `En solicitud · ${String(DemoCart.count()).padStart(2, '0')} producto(s)`
      : 'Listo para agregar';
    $('requestAddCart').textContent = inCart ? 'YA ESTÁ EN SOLICITUD' : 'AGREGAR A SOLICITUD';
  };

  $('requestAddCart').addEventListener('click', () => {
    synth.playClick();
    const result = DemoCart.add(product);
    if (result.ok) synth.playSuccess();
    refreshStatus();
    toast(result.ok
      ? 'Agregado. ¿Quieres ver más productos o enviar la solicitud?'
      : 'Este producto ya está en tu solicitud');
  });

  $('requestMore').addEventListener('click', () => {
    synth.playClick();
    if (!DemoCart.has(product.id)) DemoCart.add(product);
    location.href = 'index.html#productos-ia';
  });

  $('requestSend').addEventListener('click', () => {
    synth.playClick();
    if (!DemoCart.has(product.id)) DemoCart.add(product);
    location.href = 'index.html?solicitar=1#contacto';
  });

  refreshStatus();
  window.addEventListener('demo-cart:change', refreshStatus);
}

function setupDemo() {
  if (!hasDemo) {
    $('workspaceDemo').hidden = true;
    return;
  }

  const demo = product.demo;
  $('demoLabel').textContent = demo.label || 'Experiencia interactiva';
  $('demoModeBadge').textContent = demoMode === 'external' ? 'MODO EXTERNO' : 'MODO EMBEBIDO';
  $('demoUrlLabel').textContent = shortUrl(demo.url);
  $('demoExternal').href = demo.url;
  $('demoHint').textContent = demoMode === 'external'
    ? 'Este demo está configurado para abrirse en una ventana externa'
    : 'Pulsa INICIAR DEMO para cargar la experiencia embebida';

  $('demoExternalPanel').hidden = demoMode !== 'external';
  $('demoPlaceholder').hidden = demoMode === 'external';
  $('demoReload').hidden = demoMode !== 'embed';
  $('demoLaunch').textContent = demoMode === 'external' ? 'LANZAR DEMO' : 'INICIAR DEMO';

  const openExternal = () => {
    synth.playSuccess();
    window.open(demo.url, '_blank', 'noopener');
    toast('Demo abierto en nueva ventana');
  };

  const loadEmbed = () => {
    synth.playSuccess();
    const frame = $('demoFrame');
    $('demoPlaceholder').hidden = true;
    $('demoExternalPanel').hidden = true;
    frame.hidden = false;
    frame.src = demo.url;
    demoLoaded = true;
    $('demoUrlLabel').textContent = shortUrl(demo.url);
    toast('Demo embebido activo');
  };

  $('demoLaunch').addEventListener('click', () => {
    if (demoMode === 'external') openExternal();
    else loadEmbed();
  });
  $('demoOpenExternal')?.addEventListener('click', openExternal);
  $('demoExternal').addEventListener('click', () => synth.playClick());
  $('demoReload').addEventListener('click', () => {
    if (demoMode !== 'embed') return;
    synth.playClick();
    const frame = $('demoFrame');
    frame.src = demo.url;
    toast('Frame recargado');
  });
  $('demoFullscreen').addEventListener('click', async () => {
    synth.playClick();
    if (!document.fullscreenElement) {
      await $('workspaceDemo').requestFullscreen();
      toast('Modo inmersivo activado');
    } else {
      await document.exitFullscreen();
    }
  });
}

function buildDocuments() {
  if (!hasDocs) {
    $('documentList').innerHTML = '<p class="empty-docs">Sin documentos PDF para este producto.</p>';
    return;
  }
  $('documentList').innerHTML = product.documents.map((doc, i) =>
    `<button class="doc-button ${i === 0 ? 'active' : ''}" data-index="${i}"><span class="doc-icon">PDF</span><span><small>DOCUMENTO ${String(i + 1).padStart(2, '0')}</small><strong>${doc.name}</strong></span></button>`
  ).join('');
  document.querySelectorAll('.doc-button').forEach(btn => {
    btn.addEventListener('click', () => {
      synth.playClick();
      loadDocument(Number(btn.dataset.index));
    });
  });
}

async function loadEngine() {
  try {
    pdfjsLib = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
    return true;
  } catch (e) {
    return false;
  }
}

async function loadDocument(index) {
  if (!hasDocs) return;
  activeIndex = index;
  currentPage = 1;
  fitMode = true;
  document.querySelectorAll('.doc-button').forEach((b, i) => b.classList.toggle('active', i === index));
  const doc = product.documents[index];
  $('activeDocumentName').textContent = doc.name;
  $('openPdf').href = doc.path;
  $('loading').classList.remove('hidden');
  canvas.hidden = false;
  $('pdfFallback').hidden = true;
  try {
    if (!pdfjsLib && !await loadEngine()) throw new Error('engine');
    pdf = await pdfjsLib.getDocument(doc.path).promise;
    $('pageCount').textContent = pdf.numPages;
    $('pageInput').max = pdf.numPages;
    await renderPage(1);
  } catch (error) {
    canvas.hidden = true;
    $('pdfFallback').hidden = false;
    $('pdfFallback').src = `${doc.path}#toolbar=1&navpanes=0&view=FitH`;
    $('pageCount').textContent = 'PDF';
    $('loading').classList.add('hidden');
    toast('Se activó el visor PDF del navegador');
  }
}

async function renderPage(number) {
  if (!pdf) return;
  if (rendering) {
    pendingPage = number;
    return;
  }
  rendering = true;
  $('loading').classList.remove('hidden');
  const page = await pdf.getPage(number);
  if (fitMode) {
    const base = page.getViewport({ scale: 1 });
    scale = Math.max(0.45, (stage.clientWidth - 58) / base.width);
  }
  const viewport = page.getViewport({ scale });
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(viewport.width * ratio);
  canvas.height = Math.floor(viewport.height * ratio);
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;
  await page.render({
    canvasContext: ctx,
    viewport,
    transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : null
  }).promise;
  currentPage = number;
  $('pageInput').value = number;
  $('zoomValue').textContent = `${Math.round(scale * 100)}%`;
  $('readingProgress').style.width = `${number / pdf.numPages * 100}%`;
  $('previousPage').disabled = number <= 1;
  $('nextPage').disabled = number >= pdf.numPages;
  $('loading').classList.add('hidden');
  rendering = false;
  if (pendingPage) {
    const next = pendingPage;
    pendingPage = null;
    renderPage(next);
  }
}

function changePage(delta) {
  if (!pdf || $('workspaceDocs').hidden) return;
  const target = Math.min(pdf.numPages, Math.max(1, currentPage + delta));
  if (target !== currentPage) {
    synth.playClick();
    renderPage(target);
  }
}

function zoom(delta) {
  if (!pdf) return;
  fitMode = false;
  scale = Math.min(3, Math.max(0.4, scale + delta));
  renderPage(currentPage);
}

if (hasDocs) {
  $('previousPage').addEventListener('click', () => changePage(-1));
  $('nextPage').addEventListener('click', () => changePage(1));
  $('zoomOut').addEventListener('click', () => { synth.playClick(); zoom(-0.15); });
  $('zoomIn').addEventListener('click', () => { synth.playClick(); zoom(0.15); });
  $('fitWidth').addEventListener('click', () => { synth.playClick(); fitMode = true; renderPage(currentPage); });
  $('pageInput').addEventListener('change', e => {
    if (pdf) renderPage(Math.min(pdf.numPages, Math.max(1, Number(e.target.value) || 1)));
  });
  $('fullscreen').addEventListener('click', async () => {
    synth.playClick();
    if (!document.fullscreenElement) {
      await $('workspaceDocs').requestFullscreen();
      toast('Modo inmersivo activado');
    } else {
      await document.exitFullscreen();
    }
  });
  document.addEventListener('keydown', e => {
    if ($('workspaceDocs').hidden) return;
    if (e.key === 'ArrowLeft') changePage(-1);
    if (e.key === 'ArrowRight') changePage(1);
    if (e.key === 'Escape' && document.fullscreenElement) document.exitFullscreen();
  });
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (pdf && fitMode && !$('workspaceDocs').hidden) renderPage(currentPage);
    }, 180);
  });
}

setupTabs();
setupDemo();
setupRequestDemo();
buildDocuments();
if (hasDocs) loadDocument(0);
else if (hasDemo) setView('demo');
else setView('request');
