// Mobile Navigation
const hamburgerMenu = document.getElementById('hamburger-menu');
const sideDrawer = document.getElementById('side-drawer');
const userBtn = document.getElementById('user-btn');
const cartBtnMobile = document.getElementById('cart-btn-mobile');
const cartBadge = document.getElementById('cart-badge');

if (hamburgerMenu) {
  hamburgerMenu.addEventListener('click', () => {
    sideDrawer.classList.toggle('active');
  });
}

// Close drawer when clicking outside
document.addEventListener('click', (e) => {
  if (!sideDrawer.contains(e.target) && !hamburgerMenu.contains(e.target)) {
    sideDrawer.classList.remove('active');
  }
});

// Navigation dropdown
const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
dropdownToggles.forEach(toggle => {
  toggle.addEventListener('click', (e) => {
    const menu = e.target.closest('.nav-dropdown').querySelector('.dropdown-menu');
    menu.classList.toggle('active');
  });
});

// User button navigation
if (userBtn) {
  userBtn.addEventListener('click', () => {
    fetch('/api/session').then(r => r.json()).then(data => {
      if (data.loggedIn) {
        window.location.href = '/account';
      } else {
        window.location.href = '/login';
      }
    });
  });
}

// Mobile Cart Button
if (cartBtnMobile) {
  cartBtnMobile.addEventListener('click', () => {
    cartModal.classList.remove('hidden');
    renderCart();
  });
}

// Update cart badge
function updateCartBadge() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  cartBadge.textContent = count;
}

const productsEl = document.getElementById('products');
const cartBtn = document.getElementById('cart-btn');
const cartCount = document.getElementById('cart-count');
const cartModal = document.getElementById('cart-modal');
const closeCart = document.getElementById('close-cart');
const cartItemsEl = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const checkoutForm = document.getElementById('checkout-form');
const orderResult = document.getElementById('order-result');

const productModal = document.getElementById('product-modal');
const closeProduct = document.getElementById('close-product');
const modalImage = document.getElementById('modal-image');
const modalTitle = document.getElementById('modal-title');
const modalPrice = document.getElementById('modal-price');
const modalDesc = document.getElementById('modal-desc');
const modalVariants = document.getElementById('modal-variants');
const modalAdd = document.getElementById('modal-add');

let PRODUCTS = [];
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let activeProduct = null;
let STORE_SETTINGS = {};
let CATEGORY_FILTER = null;

// Video management
let VIDEOS = JSON.parse(localStorage.getItem('videos') || '[]');

function saveCart(){ 
  localStorage.setItem('cart', JSON.stringify(cart)); 
  renderCartCount(); 
  updateCartBadge();
}
function renderCartCount(){ cartCount.textContent = cart.reduce((s,i)=>s+i.qty,0); }

function getCategoryFromPath() {
  const path = window.location.pathname.toLowerCase();
  if (path.startsWith('/category/')) {
    return path.replace('/category/', '').replace(/\/+$/, '');
  }
  return null;
}

function formatCategoryLabel(slug) {
  if (!slug) return 'Featured Products';
  if (slug === 'essentials') return 'Essentials';
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function renderCategoryMenu(categories) {
  const categoryDropdown = document.getElementById('category-dropdown');
  if (!categoryDropdown || !Array.isArray(categories)) return;

  categoryDropdown.innerHTML = '';
  const uniqueCategories = [...new Set(categories.map(cat => cat.toLowerCase()))];

  uniqueCategories.forEach(cat => {
    const slug = cat.toLowerCase().replace(/\s+/g, '-');
    const link = document.createElement('a');
    link.href = `/category/${slug}`;
    link.textContent = formatCategoryLabel(slug);
    link.className = 'dropdown-item';
    categoryDropdown.appendChild(link);
  });
}

function fmt(n){ return '$' + n.toFixed(2); }

// Video functions
function renderVideos() {
  const videoGrid = document.querySelector('.video-grid');
  if (!videoGrid) return;

  videoGrid.innerHTML = '';

  // Default videos if none are stored
  const defaultVideos = [
    {
      id: 'style-showcase',
      title: 'Style Showcase',
      description: 'Discover our latest fashion trends',
      poster: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80',
      src: ''
    },
    {
      id: 'behind-scenes',
      title: 'Behind the Scenes',
      description: 'See how we curate our collection',
      poster: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80',
      src: ''
    },
    {
      id: 'customer-stories',
      title: 'Customer Stories',
      description: 'Hear from our satisfied customers',
      poster: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&q=80',
      src: ''
    }
  ];

  const videosToShow = VIDEOS.length > 0 ? VIDEOS : defaultVideos;

  videosToShow.forEach(video => {
    const videoItem = document.createElement('div');
    videoItem.className = 'video-item';
    videoItem.innerHTML = `
      <video controls poster="${video.poster || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80'}">
        <source src="${video.src || ''}" type="video/mp4">
        Your browser does not support the video tag.
      </video>
      <div class="video-info">
        <h4>${video.title}</h4>
        <p>${video.description}</p>
      </div>
    `;
    videoGrid.appendChild(videoItem);
  });
}

// Function to add/update videos (for admin use)
function updateVideo(index, videoData) {
  VIDEOS[index] = { ...VIDEOS[index], ...videoData };
  localStorage.setItem('videos', JSON.stringify(VIDEOS));
  renderVideos();
}

// Just Arrived Products Management
let WISHLIST = JSON.parse(localStorage.getItem('wishlist') || '[]');

function renderJustArrivedProducts() {
  const justArrivedGrid = document.querySelector('.just-arrived-grid');
  if (!justArrivedGrid) return;

  justArrivedGrid.innerHTML = '';

  // Use the first 4 products for "Just Arrived" section
  const arrivedProducts = PRODUCTS.slice(0, 4);

  arrivedProducts.forEach((product, index) => {
    const isInWishlist = WISHLIST.includes(product.id);
    const isHot = index === 1 || index === 3; // Add HOT badge to 2nd and 4th items

    const card = document.createElement('div');
    card.className = 'arrived-product-card';

    const symbol = product.currency === 'GHS' ? '₵' : '$';
    let priceHtml = `<span class="arrived-product-price">${symbol}${product.price.toFixed(2)}</span>`;
    if (product.discount && product.discount > 0) {
      const discountedPrice = (product.price * (1 - product.discount / 100)).toFixed(2);
      priceHtml = `<span class="arrived-product-price">${symbol}${discountedPrice}</span>`;
    }

    card.innerHTML = `
      <div class="arrived-product-image">
        <img src="${product.image}" alt="${product.name}" />
        ${isHot ? '<div class="hot-badge">HOT</div>' : ''}
        <div class="arrived-product-overlay" data-id="${product.id}">
          <div class="overlay-icon">
            <i class="fas fa-eye"></i>
          </div>
        </div>
      </div>
      <div class="arrived-product-info">
        <div class="arrived-product-category">Fashion</div>
        <div class="arrived-product-header">
          <h3 class="arrived-product-name">${product.name}</h3>
          <button class="wishlist-btn ${isInWishlist ? 'active' : ''}" data-id="${product.id}">
            <i class="fas fa-heart"></i>
          </button>
        </div>
        <div class="star-rating">
          <span class="star">★</span>
          <span class="star">★</span>
          <span class="star">★</span>
          <span class="star">★</span>
          <span class="star">☆</span>
          <span class="rating-text">(4.2)</span>
        </div>
        ${priceHtml}
      </div>
    `;

    justArrivedGrid.appendChild(card);
  });

  // Add event listeners
  document.querySelectorAll('.arrived-product-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      const productId = e.currentTarget.dataset.id;
      openProduct(productId);
    });
  });

  document.querySelectorAll('.wishlist-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const productId = e.currentTarget.dataset.id;
      toggleWishlist(productId, e.currentTarget);
    });
  });
}

function toggleWishlist(productId, button) {
  const index = WISHLIST.indexOf(productId);
  if (index > -1) {
    WISHLIST.splice(index, 1);
    button.classList.remove('active');
  } else {
    WISHLIST.push(productId);
    button.classList.add('active');
  }
  localStorage.setItem('wishlist', JSON.stringify(WISHLIST));
}

async function loadProducts(categorySlug) {
  const query = categorySlug ? `?category=${encodeURIComponent(categorySlug)}` : '';
  const res = await fetch(`/api/products${query}`);
  PRODUCTS = await res.json();

  const sectionTitle = document.getElementById('productSectionTitle');
  if (sectionTitle) {
    sectionTitle.textContent = categorySlug ? formatCategoryLabel(categorySlug) : 'Featured Products';
  }

  if (categorySlug && Array.isArray(PRODUCTS) && PRODUCTS.length === 0) {
    const slideshowEl = document.getElementById('product-slideshow');
    const otherProductsEl = document.getElementById('other-products');
    slideshowEl.innerHTML = `<div class="empty-state"><h3>New Items Coming Soon</h3><p>We are adding products for ${formatCategoryLabel(categorySlug)}. Check back soon!</p></div>`;
    otherProductsEl.innerHTML = '';
    renderJustArrivedProducts();
    return;
  }

  renderProducts();
  renderJustArrivedProducts();
}

function renderProducts(){
  const slideshowEl = document.getElementById('product-slideshow');
  const otherProductsEl = document.getElementById('other-products');
  slideshowEl.innerHTML = '';
  otherProductsEl.innerHTML = '';

  // If no products, return
  if (PRODUCTS.length === 0) return;

  // Initialize carousel with all products
  initCarousel();

  // Show all products in the other products section as a grid
  PRODUCTS.forEach(p => {
    const el = document.createElement('div');
    el.className = 'card';
    const symbol = p.currency === 'GHS' ? '₵' : '$';
    let priceHtml = `<div class="price">${symbol}${p.price.toFixed(2)}</div>`;
    if (p.discount && p.discount > 0) {
      const discountedPrice = (p.price * (1 - p.discount / 100)).toFixed(2);
      priceHtml = `
        <div class="price-promo">
          <span class="original-price">${symbol}${p.price.toFixed(2)}</span>
          <span class="sale-price">${symbol}${discountedPrice}</span>
          <span class="discount-badge">-${p.discount}%</span>
        </div>
      `;
    }
    el.innerHTML = `
      <img src="${p.image}" alt="${p.name}" />
      <h3>${p.name}</h3>
      <p>${p.description}</p>
      <div class="meta">
        ${priceHtml}
        <div>
          <button data-id="${p.id}" class="btn btn-primary view">View</button>
        </div>
      </div>
    `;
    otherProductsEl.appendChild(el);
  });

  // Add event listeners
  document.querySelectorAll('.view').forEach(b => b.addEventListener('click', e => {
    const id = e.currentTarget.dataset.id;
    openProduct(id);
  }));
}

let currentSlide = 0;
let totalSlides = 0;

function initCarousel() {
  const slideshowEl = document.getElementById('product-slideshow');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');

  // Clear existing slides and add all products to carousel
  slideshowEl.innerHTML = '';

  PRODUCTS.forEach(p => {
    const el = document.createElement('div');
    el.className = 'card';
    const symbol = p.currency === 'GHS' ? '₵' : '$';
    let priceHtml = `<div class="price">${symbol}${p.price.toFixed(2)}</div>`;
    if (p.discount && p.discount > 0) {
      const discountedPrice = (p.price * (1 - p.discount / 100)).toFixed(2);
      priceHtml = `
        <div class="price-promo">
          <span class="original-price">${symbol}${p.price.toFixed(2)}</span>
          <span class="sale-price">${symbol}${discountedPrice}</span>
          <span class="discount-badge">-${p.discount}%</span>
        </div>
      `;
    }
    el.innerHTML = `
      <img src="${p.image}" alt="${p.name}" />
      <h3>${p.name}</h3>
      <p>${p.description}</p>
      <div class="meta">
        ${priceHtml}
        <div>
          <button data-id="${p.id}" class="btn btn-primary view">View</button>
        </div>
      </div>
    `;
    slideshowEl.appendChild(el);
  });

  totalSlides = PRODUCTS.length;
  currentSlide = 0;
  updateSlidePosition();

  // Add navigation event listeners
  prevBtn.addEventListener('click', () => {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateSlidePosition();
  });

  nextBtn.addEventListener('click', () => {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateSlidePosition();
  });

  // Auto-play functionality
  setInterval(() => {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateSlidePosition();
  }, 5000); // Change slide every 5 seconds
}

function updateSlidePosition() {
  const slideshowEl = document.getElementById('product-slideshow');
  const translateX = -currentSlide * 100;
  slideshowEl.style.transform = `translateX(${translateX}%)`;
}

function openProduct(id){
  const p = PRODUCTS.find(x=>x.id===id);
  if(!p) return;
  activeProduct = p;
  modalImage.src = p.image;
  modalTitle.textContent = p.name;
  // Show discounted price if available
  if (p.discount && p.discount > 0) {
    const discountedPrice = (p.price * (1 - p.discount / 100)).toFixed(2);
    modalPrice.innerHTML = `<span style="text-decoration: line-through; color: #999; font-size: 0.9rem;">${fmt(p.price)}</span> <strong style="color: #e91e8c;">${fmt(discountedPrice)} (-${p.discount}%)</strong>`;
  } else {
    modalPrice.textContent = fmt(p.price);
  }
  modalDesc.textContent = p.description;
  modalVariants.innerHTML = '';
  if(p.sizes && p.sizes.length){
    const sizeRow = document.createElement('div');
    sizeRow.innerHTML = '<strong>Size</strong>';
    p.sizes.forEach(s=>{
      const btn = document.createElement('button'); btn.textContent = s; btn.className='btn-variant';
      btn.dataset.size = s; btn.addEventListener('click', ()=>selectVariant('size', s, btn));
      sizeRow.appendChild(btn);
    });
    modalVariants.appendChild(sizeRow);
  }
  if(p.colors && p.colors.length){
    const colorRow = document.createElement('div');
    colorRow.innerHTML = '<strong>Color</strong>';
    p.colors.forEach(c=>{
      const btn = document.createElement('button'); btn.textContent = c; btn.className='btn-variant';
      btn.dataset.color = c; btn.addEventListener('click', ()=>selectVariant('color', c, btn));
      colorRow.appendChild(btn);
    });
    modalVariants.appendChild(colorRow);
  }
  productModal.classList.remove('hidden');
}

function selectVariant(type, val, btn){
  // simple visual toggle
  btn.parentElement.querySelectorAll('.btn-variant').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
}

modalAdd.addEventListener('click', ()=>{
  if(!activeProduct) return;
  const id = activeProduct.id;
  const item = cart.find(i=>i.id===id);
  if(item) item.qty++;
  else cart.push({ id, qty:1 });
  saveCart();
  productModal.classList.add('hidden');
});

closeProduct.addEventListener('click', ()=> productModal.classList.add('hidden'));

function renderCart(){
  cartItemsEl.innerHTML='';
  if(cart.length===0){ cartItemsEl.innerHTML='<p>Your cart is empty.</p>'; cartTotalEl.textContent=''; return; }
  let total=0;
  cart.forEach(ci=>{
    const p = PRODUCTS.find(x=>x.id===ci.id) || {name:ci.id,price:0,image:''};
    const row = document.createElement('div');
    row.innerHTML = `
      <img src="${p.image}" alt="${p.name}" />
      <div style="flex:1">
        <div>${p.name}</div>
        <div>${fmt(p.price)} × ${ci.qty}</div>
      </div>
      <div>
        <button class="dec" data-id="${ci.id}">-</button>
        <button class="inc" data-id="${ci.id}">+</button>
      </div>
    `;
    cartItemsEl.appendChild(row);
    total += (p.price || 0) * ci.qty;
  });
  cartTotalEl.textContent = 'Total: ' + fmt(total);
  document.querySelectorAll('.dec').forEach(b=>b.addEventListener('click',e=>{
    const id = e.currentTarget.dataset.id; changeQty(id,-1);
  }));
  document.querySelectorAll('.inc').forEach(b=>b.addEventListener('click',e=>{
    const id = e.currentTarget.dataset.id; changeQty(id,1);
  }));
}

function changeQty(id, delta){
  const item = cart.find(i=>i.id===id);
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0) cart = cart.filter(i=>i.id!==id);
  saveCart(); renderCart();
}

cartBtn.addEventListener('click', ()=>{ cartModal.classList.remove('hidden'); renderCart(); });
closeCart.addEventListener('click', ()=> cartModal.classList.add('hidden'));

checkoutForm.addEventListener('submit', async e=>{
  e.preventDefault();
  if(cart.length===0) return alert('Cart is empty');
  const form = new FormData(checkoutForm);
  const customer = {
    name: form.get('name'),
    email: form.get('email'),
    address: form.get('address'),
    phone: form.get('phone') || '' // Add phone if available
  };
  
  // Calculate total
  const totalAmount = cart.reduce((sum, item) => {
    const product = PRODUCTS.find(p => p.id === item.id) || { price: 0 };
    return sum + (product.price || 0) * item.qty;
  }, 0);
  
  // Prepare metadata
  const metadata = {
    customerName: customer.name,
    phone: customer.phone,
    productName: cart.map(item => {
      const product = PRODUCTS.find(p => p.id === item.id);
      return product ? product.name : item.id;
    }).join(', '),
    size: cart.map(item => item.size || 'N/A').join(', '),
    quantity: cart.reduce((sum, item) => sum + item.qty, 0),
    items: cart
  };
  
  try {
    const res = await fetch('/pay', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        email: customer.email,
        amount: totalAmount,
        metadata
      })
    });
    const data = await res.json();
    if(data.success){
      // Redirect to Paystack
      window.location.href = data.authorization_url;
    } else {
      orderResult.textContent = 'Payment failed: ' + (data.error || 'unknown');
    }
  } catch (error) {
    orderResult.textContent = 'Payment error: ' + error.message;
  }
});

async function loadStoreInfo(){
  CATEGORY_FILTER = getCategoryFromPath();
  try {
    const res = await fetch('/api/store-info');
    const info = await res.json();
    STORE_SETTINGS = info;
    if(document.getElementById('storeTagline')) document.getElementById('storeTagline').textContent = info.storeTagline;
    document.title = info.storeName;

    if(document.getElementById('contactEmail')) document.getElementById('contactEmail').textContent = info.contactEmail || '';
    if(document.getElementById('contactPhone')) document.getElementById('contactPhone').textContent = info.contactPhone || '';
    if(document.getElementById('contactAddress')) document.getElementById('contactAddress').textContent = info.contactAddress || '';
    if(document.getElementById('footerStoreName')) document.getElementById('footerStoreName').textContent = info.storeName || '';

    let socials = '';
    if(info.contactInstagram) socials += `<a href="${info.contactInstagram}" target="_blank">Instagram</a> `;
    if(info.contactFacebook) socials += `<a href="${info.contactFacebook}" target="_blank">Facebook</a>`;
    if(socials && document.getElementById('contactSocial')) {
      document.getElementById('contactSocial').innerHTML = `<strong>Follow us:</strong> ${socials}`;
    }

    renderCategoryMenu(info.categories || ['Essentials', 'Jerseys', 'T-Shirts', 'Tracksuits']);

    const heroVideo = document.getElementById('heroVideo');
    if (heroVideo && info.heroVideoUrl) {
      heroVideo.src = info.heroVideoUrl;
      heroVideo.load();
    }

    // Update status banner
    updateStoreStatus(info);
  } catch(e) { console.error('Error loading store info:', e); }
  loadProducts(CATEGORY_FILTER);
  if (window.location.pathname.toLowerCase().startsWith('/contact')) {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

function updateStoreStatus(settings) {
  const statusEl = document.getElementById('store-status');
  if(!statusEl) return;
  if(settings.temporaryClosed) {
    statusEl.textContent = 'Store is temporarily closed';
    statusEl.style.background = '#ffe6f2';
    statusEl.style.color = '#c7175f';
    return;
  }
  const now = new Date();
  const [openH, openM] = (settings.openTime || '00:00').split(':').map(Number);
  const [closeH, closeM] = (settings.closeTime || '23:59').split(':').map(Number);
  const openDate = new Date(now);
  openDate.setHours(openH, openM,0,0);
  const closeDate = new Date(now);
  closeDate.setHours(closeH, closeM,0,0);

  if(now >= openDate && now <= closeDate) {
    statusEl.textContent = `Open today (${settings.openTime} - ${settings.closeTime})`;
    statusEl.style.background = '#e6ffe6';
    statusEl.style.color = '#2c662d';
  } else {
    statusEl.textContent = `Closed (opens ${settings.openTime})`;
    statusEl.style.background = '#ffe6f2';
    statusEl.style.color = '#c7175f';
  }
}

loadProducts(); 
loadStoreInfo();
renderVideos();
renderCartCount();
updateCartBadge();
