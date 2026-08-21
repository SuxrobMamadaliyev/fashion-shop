function renderAdminShell(activePage, title) {
  document.body.insertAdjacentHTML('afterbegin', `
    <div class="admin-shell">
      <aside class="admin-sidebar">
        <div class="admin-logo">AURA Admin</div>
        <a class="admin-nav-item ${activePage==='dashboard'?'active':''}" href="index.html">${icon('grid',19)}<span>Dashboard</span></a>
        <a class="admin-nav-item ${activePage==='products'?'active':''}" href="products.html">${icon('package',19)}<span>Mahsulotlar</span></a>
        <a class="admin-nav-item ${activePage==='categories'?'active':''}" href="categories.html">${icon('box',19)}<span>Kategoriyalar</span></a>
        <a class="admin-nav-item ${activePage==='orders'?'active':''}" href="orders.html">${icon('bag',19)}<span>Buyurtmalar</span></a>
        <a class="admin-nav-item ${activePage==='users'?'active':''}" href="users.html">${icon('user',19)}<span>Foydalanuvchilar</span></a>
        <a class="admin-nav-item ${activePage==='settings'?'active':''}" href="settings.html">${icon('settings',19)}<span>Sozlamalar</span></a>
        <a class="admin-nav-item" href="#" id="logout-link" style="margin-top:20px;color:#ff3b30">${icon('x',19)}<span>Chiqish</span></a>
      </aside>
      <main class="admin-main" id="admin-main-content">
        <div class="admin-header">
          <span class="admin-title">${title}</span>
        </div>
        <div id="admin-page-body"></div>
      </main>
    </div>
  `);

  document.getElementById('logout-link').addEventListener('click', (e) => {
    e.preventDefault();
    adminApi.clearToken();
    location.href = 'login.html';
  });

  if (!adminApi.getToken()) {
    location.href = 'login.html';
  }
}

function statusBadgeHtml(status) {
  const labels = { NEW: 'Yangi', CONFIRMED: 'Tasdiqlangan', PROCESSING: 'Jarayonda', SHIPPING: 'Yetkazilmoqda', DELIVERED: 'Yetkazildi', CANCELLED: 'Bekor qilindi' };
  return `<span class="badge status-${status}">${labels[status] || status}</span>`;
}

function fmtPriceAdmin(n) {
  return Number(n || 0).toLocaleString('ru-RU').replace(/,/g, ' ') + " so'm";
}
