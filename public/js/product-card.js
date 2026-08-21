// Renders a single product card (used on home, catalog, favorites) and wires up
// the favorite toggle + quick-add-to-cart buttons within a given container.

const favoritesCache = new Set();
let favoritesCacheLoaded = false;

async function ensureFavoritesCache() {
  if (favoritesCacheLoaded) return;
  try {
    const { favorites } = await api.getFavorites();
    favorites.forEach((f) => favoritesCache.add(String(f.product._id || f.product)));
  } catch (e) {}
  favoritesCacheLoaded = true;
}

function renderProductCard(p) {
  const isFav = favoritesCache.has(String(p._id));
  const img = (p.images && p.images[0]) || '/images/placeholder.png';
  let badge = '';
  if (p.isSale && p.discount > 0) badge = `<span class="product-badge sale">-${p.discount}%</span>`;
  else if (p.isNew) badge = `<span class="product-badge">Yangi</span>`;
  else if (p.isBestSeller) badge = `<span class="product-badge">Bestseller</span>`;

  return `
    <div class="product-card" data-id="${p._id}">
      <div class="product-image-wrap">
        <a href="product.html?id=${p._id}">
          <img src="${img}" alt="${p.name}" loading="lazy">
        </a>
        ${badge}
        <button class="fav-btn ${isFav ? 'active' : ''}" data-fav-id="${p._id}" aria-label="Sevimli">${icon('heart', 18)}</button>
        <button class="quick-add" data-quickadd-id="${p._id}" aria-label="Savatga qo'shish">${icon('plus', 18)}</button>
      </div>
      <a href="product.html?id=${p._id}" class="product-info" style="display:block">
        <div class="product-name">${p.name}</div>
        <div class="product-price-row">
          <span class="product-price">${formatPrice(p.price)}</span>
          ${p.oldPrice ? `<span class="product-old-price">${formatPrice(p.oldPrice)}</span>` : ''}
        </div>
      </a>
    </div>
  `;
}

async function bindProductCardEvents(container) {
  await ensureFavoritesCache();
  // Re-sync active class now that cache is loaded
  container.querySelectorAll('.fav-btn').forEach((btn) => {
    const id = btn.getAttribute('data-fav-id');
    btn.classList.toggle('active', favoritesCache.has(id));
  });

  container.querySelectorAll('.fav-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute('data-fav-id');
      const isActive = btn.classList.contains('active');
      btn.classList.toggle('active');
      try {
        if (isActive) {
          await api.removeFavorite(id);
          favoritesCache.delete(id);
          showToast('Sevimlilardan olib tashlandi');
        } else {
          await api.addFavorite(id);
          favoritesCache.add(id);
          showToast('Sevimlilarga qo\'shildi');
        }
      } catch (err) {
        btn.classList.toggle('active'); // revert
        showToast(err.message);
      }
    });
  });

  container.querySelectorAll('.quick-add').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute('data-quickadd-id');
      try {
        await api.addToCart(id, 1, '', '');
        showToast('Savatga qo\'shildi');
        refreshCartBadge();
      } catch (err) {
        showToast(err.message);
      }
    });
  });
}

