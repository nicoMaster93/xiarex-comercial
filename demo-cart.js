/**
 * Carrito de solicitud de demos (productos sin demo local).
 * Persistencia: localStorage key `xiarex-demo-cart`
 */
const DemoCart = (() => {
  const STORAGE_KEY = 'xiarex-demo-cart';

  function read() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function write(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('demo-cart:change', { detail: { items } }));
  }

  function getItems() {
    return read();
  }

  function count() {
    return read().length;
  }

  function has(id) {
    return read().some(item => item.id === id);
  }

  function add(product) {
    if (!product?.id) return { ok: false, reason: 'invalid' };
    const items = read();
    if (items.some(item => item.id === product.id)) {
      return { ok: false, reason: 'duplicate', items };
    }
    items.push({
      id: product.id,
      code: product.code || '',
      name: product.name || product.title || product.id,
      acronym: product.acronym || '',
      area: product.area || ''
    });
    write(items);
    return { ok: true, items };
  }

  function remove(id) {
    const items = read().filter(item => item.id !== id);
    write(items);
    return items;
  }

  function clear() {
    write([]);
  }

  function summaryText(items = read()) {
    if (!items.length) return '';
    return items.map((item, i) => `${i + 1}. ${item.code || item.acronym} — ${item.name}`).join('\n');
  }

  return { getItems, count, has, add, remove, clear, summaryText };
})();

window.DemoCart = DemoCart;
