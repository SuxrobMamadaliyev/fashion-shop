// Core app bootstrap: Telegram WebApp init, theme sync, toast system, cart badge, nav highlighting.

const AppState = {
  user: null,
  cartCount: 0,
  settings: null,
};

function initTelegram() {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (!tg) return null;
  tg.ready();
  tg.expand();
  try { tg.setHeaderColor && tg.setHeaderColor('secondary_bg_color'); } catch (e) {}
  applyTelegramTheme(tg);
  tg.onEvent && tg.onEvent('themeChanged', () => applyTelegramTheme(tg));
  return tg;
}

function applyTelegramTheme(tg) {
  const stored = localStorage.getItem('theme_override');
  if (stored) {
    document.documentElement.setAttribute('data-theme', stored);
    return;
  }
  const scheme = tg && tg.colorScheme;
  document.documentElement.setAttribute('data-theme', scheme === 'dark' ? 'dark' : 'light');
}

function setThemeOverride(theme) {
  // theme: 'light' | 'dark' | null (null = follow Telegram)
  if (theme) {
    localStorage.setItem('theme_override', theme);
    document.documentElement.setAttribute('data-theme', theme);
  } else {
    localStorage.removeItem('theme_override');
    const tg = window.Telegram && window.Telegram.WebApp;
    applyTelegramTheme(tg);
  }
}

function showToast(message) {
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  wrap.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 260);
  }, 2200);
}

function formatPrice(n) {
  const settings = AppState.settings;
  const currency = (settings && settings.currency) || 'UZS';
  const formatted = Number(n || 0).toLocaleString('ru-RU').replace(/,/g, ' ');
  return `${formatted} ${currency === 'UZS' ? "so'm" : currency}`;
}

async function bootstrapAuth() {
  try {
    const res = await api.authTelegram();
    AppState.user = res.user;
    return res.user;
  } catch (e) {
    console.error('Auth failed:', e.message);
    showToast('Autentifikatsiya xatosi. Iltimos, botni qayta oching.');
    return null;
  }
}

async function refreshCartBadge() {
  try {
    const res = await api.getCart();
    const count = res.cart.items.reduce((sum, i) => sum + i.quantity, 0);
    AppState.cartCount = count;
    const badge = document.querySelector('.nav-badge[data-badge="cart"]');
    if (badge) {
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch (e) {
    // silent — badge just won't update
  }
}

function renderNavbar(activePage) {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  const items = [
    { key: 'home', label: 'Home', href: 'index.html', icon: 'home' },
    { key: 'catalog', label: 'Catalog', href: 'catalog.html', icon: 'grid' },
    { key: 'favorites', label: 'Favorites', href: 'favorites.html', icon: 'heart' },
    { key: 'cart', label: 'Cart', href: 'cart.html', icon: 'cart' },
    { key: 'profile', label: 'Profile', href: 'profile.html', icon: 'user' },
  ];

  nav.innerHTML = items
    .map((item) => {
      const active = item.key === activePage;
      const badge =
        item.key === 'cart'
          ? `<span class="nav-badge" data-badge="cart" style="display:none">0</span>`
          : '';
      return `
        <a class="nav-item ${active ? 'active' : ''}" href="${item.href}">
          ${badge}
          ${icon(item.icon, 24)}
          <span class="nav-label">${item.label}</span>
        </a>
      `;
    })
    .join('');
}

async function loadPublicSettings() {
  try {
    const { settings } = await api.getPublicSettings();
    AppState.settings = settings;
    if (settings.accentColor) {
      document.documentElement.style.setProperty('--accent', settings.accentColor);
      const rgb = hexToRgb(settings.accentColor);
      if (rgb) document.documentElement.style.setProperty('--accent-rgb', rgb);
    }
    document.querySelectorAll('[id="brand-title"]').forEach((el) => {
      el.textContent = settings.brandName || 'AURA';
    });
    document.title = document.title.replace('AURA', settings.brandName || 'AURA');
  } catch (e) {
    // fall back to defaults already in CSS
  }
}

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}` : null;
}

// Runs on every page: init telegram, auth, render nav, refresh cart badge.
async function initPage(activePage) {
  initTelegram();
  renderNavbar(activePage);
  await Promise.all([bootstrapAuth(), loadPublicSettings()]);
  await refreshCartBadge();
}

// Bottom sheet helper
function openSheet(sheetId) {
  const sheet = document.getElementById(sheetId);
  const backdrop = document.getElementById(sheetId + '-backdrop');
  if (!sheet) return;
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => {
    sheet.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
  });
}
function closeSheet(sheetId) {
  const sheet = document.getElementById(sheetId);
  const backdrop = document.getElementById(sheetId + '-backdrop');
  if (!sheet) return;
  sheet.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');
  document.body.style.overflow = '';
}

// Simple drag-to-dismiss for bottom sheets
function enableSheetDrag(sheetId) {
  const sheet = document.getElementById(sheetId);
  const handle = sheet && sheet.querySelector('.sheet-handle');
  if (!handle) return;

  let startY = 0, currentY = 0, dragging = false;

  const onStart = (e) => {
    dragging = true;
    startY = (e.touches ? e.touches[0].clientY : e.clientY);
    sheet.style.transition = 'none';
  };
  const onMove = (e) => {
    if (!dragging) return;
    currentY = (e.touches ? e.touches[0].clientY : e.clientY) - startY;
    if (currentY > 0) sheet.style.transform = `translateY(${currentY}px)`;
  };
  const onEnd = () => {
    if (!dragging) return;
    dragging = false;
    sheet.style.transition = '';
    if (currentY > 100) {
      closeSheet(sheetId);
    }
    sheet.style.transform = '';
    currentY = 0;
  };

  handle.addEventListener('touchstart', onStart, { passive: true });
  handle.addEventListener('touchmove', onMove, { passive: true });
  handle.addEventListener('touchend', onEnd);
  handle.addEventListener('mousedown', onStart);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);
}

