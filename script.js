/* =============================================
   FOOD EXPRESS — script.js  (Firebase Edition)
   ============================================= */

/* ─── Firebase Imports ─── */
import {
  registerUser, loginUser, logoutUser, watchAuthState, getCurrentUser,
  saveCartToFirestore, loadCartFromFirestore, clearCartInFirestore,
  placeOrder, getUserOrders,
  submitContactForm
} from "./firebase.js";

/* ─── Menu Data ─── */
const menuItems = [
  { id: 1,  name: "Margherita Supreme",      desc: "Fresh mozzarella, basil, San Marzano tomatoes",       price: 349, category: "pizza",   badge: "Popular",    rating: "4.8", img: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80" },
  { id: 2,  name: "Pepperoni Feast",          desc: "Double pepperoni, cheddar, jalapeños",                price: 429, category: "pizza",   badge: "Bestseller", rating: "4.9", img: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80" },
  { id: 3,  name: "Smash Burger",             desc: "Double smash patties, special sauce, pickles",        price: 299, category: "burger",  badge: "New",        rating: "4.7", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80" },
  { id: 4,  name: "Truffle Mushroom Burger",  desc: "Portobello, truffle mayo, caramelized onions",        price: 349, category: "burger",  badge: "Chef's Pick",rating: "4.8", img: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&q=80" },
  { id: 5,  name: "Rainbow Dragon Roll",      desc: "Tuna, salmon, avocado, cucumber",                     price: 499, category: "sushi",   badge: "Premium",    rating: "4.9", img: "https://images.unsplash.com/photo-1562802378-063ec186a863?w=400&q=80" },
  { id: 6,  name: "Salmon Nigiri Set",        desc: "6-piece fresh Atlantic salmon nigiri",                price: 399, category: "sushi",   badge: "Fresh",      rating: "4.7", img: "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=400&q=80" },
  { id: 7,  name: "Cacio e Pepe",             desc: "Spaghetti, Pecorino Romano, black pepper",            price: 329, category: "pasta",   badge: "Classic",    rating: "4.8", img: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&q=80" },
  { id: 8,  name: "Pesto Tagliatelle",        desc: "Homemade basil pesto, cherry tomatoes, pine nuts",    price: 359, category: "pasta",   badge: "Veg",        rating: "4.6", img: "https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=400&q=80" },
  { id: 9,  name: "Mango Cheesecake",         desc: "Creamy NY-style cheesecake with mango coulis",        price: 249, category: "dessert", badge: "Sweet",      rating: "4.9", img: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80" },
  { id: 10, name: "Belgian Waffle Stack",     desc: "Fluffy waffles, whipped cream, mixed berries",        price: 229, category: "dessert", badge: "Loved",      rating: "4.8", img: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400&q=80" },
  { id: 11, name: "BBQ Chicken Pizza",        desc: "Smoked chicken, BBQ sauce, red onion, cilantro",      price: 389, category: "pizza",   badge: "Smoky",      rating: "4.7", img: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&q=80" },
  { id: 12, name: "Crispy Veg Burger",        desc: "Crunchy veggie patty, coleslaw, sriracha mayo",       price: 259, category: "burger",  badge: "Veg",        rating: "4.5", img: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400&q=80" },
];

/* ─── App State ─── */
let cart          = [];
let currentUser   = null;
let currentFilter = "all";

/* ─── Init ─── */
document.addEventListener("DOMContentLoaded", async () => {
  renderMenu(menuItems);
  initNavbar();
  initHamburger();
  initFilterTabs();

  // Watch Firebase auth state
  watchAuthState(async (user) => {
    currentUser = user;
    updateNavForAuth(user);

    if (user) {
      // Load cart from Firestore when logged in
      const result = await loadCartFromFirestore(user.uid);
      if (result.success) {
        cart = result.items || [];
        updateCartBadge();
        showToast(`👋 Welcome back, ${user.displayName || user.email}!`);
      }
    } else {
      // Fall back to localStorage when logged out
      cart = JSON.parse(localStorage.getItem("feCart") || "[]");
      updateCartBadge();
    }
  });
});

/* =============================================
   PAGE ROUTER
   ============================================= */
function showPage(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const target = document.getElementById("page-" + page);
  if (target) { target.classList.add("active"); window.scrollTo({ top: 0, behavior: "smooth" }); }
  if (page === "cart")   renderCart();
  if (page === "orders") renderOrders();
  closeMenu();
}
window.showPage = showPage;

/* ─── Scroll Helpers ─── */
function scrollToMenu()    { showPage("home"); setTimeout(() => document.getElementById("menu-section")?.scrollIntoView({ behavior: "smooth" }), 100); }
function scrollToAbout()   { showPage("home"); setTimeout(() => document.getElementById("about-section")?.scrollIntoView({ behavior: "smooth" }), 100); }
function scrollToContact() { showPage("home"); setTimeout(() => document.getElementById("contact-section")?.scrollIntoView({ behavior: "smooth" }), 100); }
window.scrollToMenu    = scrollToMenu;
window.scrollToAbout   = scrollToAbout;
window.scrollToContact = scrollToContact;

/* ─── Navbar Scroll ─── */
function initNavbar() {
  const nav = document.getElementById("navbar");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 30);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ─── Hamburger ─── */
function initHamburger() {
  document.getElementById("hamburger").addEventListener("click", () => {
    document.getElementById("navLinks").classList.toggle("open");
  });
}
function closeMenu() { document.getElementById("navLinks").classList.remove("open"); }

/* ─── Update Nav based on Auth ─── */
function updateNavForAuth(user) {
  const authLink    = document.getElementById("navAuthLink");
  const userLabel   = document.getElementById("navUserLabel");
  const ordersLink  = document.getElementById("navOrdersLink");
  if (!authLink) return;

  if (user) {
    authLink.textContent = "Logout";
    authLink.onclick = handleLogout;
    if (userLabel)  { userLabel.textContent = user.displayName?.split(" ")[0] || "Account"; userLabel.style.display = "inline"; }
    if (ordersLink) ordersLink.style.display = "inline";
  } else {
    authLink.textContent = "Login";
    authLink.onclick = () => showPage("login");
    if (userLabel)  userLabel.style.display = "none";
    if (ordersLink) ordersLink.style.display = "none";
  }
}

/* =============================================
   MENU
   ============================================= */
function initFilterTabs() {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const f = tab.dataset.filter;
      currentFilter = f;
      renderMenu(f === "all" ? menuItems : menuItems.filter(i => i.category === f));
    });
  });
}

function filterMenu(cat) {
  currentFilter = cat;
  renderMenu(menuItems.filter(i => i.category === cat));
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.filter === cat));
  setTimeout(() => document.getElementById("menu-section")?.scrollIntoView({ behavior: "smooth" }), 100);
}
window.filterMenu = filterMenu;

function renderMenu(items) {
  const grid = document.getElementById("foodGrid");
  if (!grid) return;
  if (!items.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--muted)"><div style="font-size:3rem;margin-bottom:12px">🍽️</div><p>No items found.</p></div>`;
    return;
  }
  grid.innerHTML = items.map((item, i) => `
    <div class="food-card" style="animation-delay:${i * 0.06}s">
      <div class="food-card-img">
        <img src="${item.img}" alt="${item.name}" loading="lazy" />
        ${item.badge ? `<span class="food-badge">${item.badge}</span>` : ""}
      </div>
      <div class="food-card-body">
        <p class="food-name">${item.name}</p>
        <p class="food-desc">${item.desc}</p>
        <div class="food-footer">
          <div>
            <p class="food-price">₹${item.price}</p>
            <p class="food-rating">⭐ ${item.rating}</p>
          </div>
          <button class="add-btn" onclick="addToCart(${item.id})">
            <i class="fa fa-plus"></i> Add
          </button>
        </div>
      </div>
    </div>
  `).join("");
}

/* =============================================
   CART
   ============================================= */
async function addToCart(id) {
  const item = menuItems.find(m => m.id === id);
  if (!item) return;
  const existing = cart.find(c => c.id === id);
  existing ? existing.qty++ : cart.push({ ...item, qty: 1 });
  await persistCart();
  updateCartBadge();
  showToast(`🛒 "${item.name}" added to cart!`);
}
window.addToCart = addToCart;

async function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  await persistCart();
  updateCartBadge();
  renderCart();
}
window.removeFromCart = removeFromCart;

async function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { await removeFromCart(id); return; }
  await persistCart();
  renderCart();
}
window.changeQty = changeQty;

/* Save cart: Firestore if logged in, else localStorage */
async function persistCart() {
  if (currentUser) {
    await saveCartToFirestore(currentUser.uid, cart);
  } else {
    localStorage.setItem("feCart", JSON.stringify(cart));
  }
}

function updateCartBadge() {
  const badge = document.getElementById("cartBadge");
  if (!badge) return;
  const total = cart.reduce((s, c) => s + c.qty, 0);
  badge.textContent = total;
  badge.style.display = total > 0 ? "flex" : "none";
}

function renderCart() {
  const itemsEl   = document.getElementById("cartItems");
  const summaryEl = document.getElementById("cartSummary");
  if (!itemsEl || !summaryEl) return;

  if (!cart.length) {
    itemsEl.innerHTML = `
      <div class="empty-cart">
        <div class="empty-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Looks like you haven't added anything yet.</p>
        <button class="btn-primary" onclick="showPage('home')">Browse Menu</button>
      </div>`;
    summaryEl.innerHTML = "";
    return;
  }

  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img class="cart-item-img" src="${item.img}" alt="${item.name}" />
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <p>${item.desc}</p>
        <div class="qty-controls">
          <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
          <span class="qty-value">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:12px">
        <p class="cart-item-price">₹${(item.price * item.qty).toLocaleString("en-IN")}</p>
        <button class="remove-btn" onclick="removeFromCart(${item.id})"><i class="fa fa-trash"></i> Remove</button>
      </div>
    </div>
  `).join("");

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const delivery = subtotal > 499 ? 0 : 49;
  const tax      = Math.round(subtotal * 0.05);
  const total    = subtotal + delivery + tax;

  summaryEl.innerHTML = `
    <h3>Order Summary</h3>
    <div class="summary-row"><span>Subtotal (${cart.reduce((s,c)=>s+c.qty,0)} items)</span><span>₹${subtotal.toLocaleString("en-IN")}</span></div>
    <div class="summary-row"><span>Delivery Fee</span><span>${delivery === 0 ? '<span style="color:#4ade80">Free</span>' : "₹" + delivery}</span></div>
    <div class="summary-row"><span>GST (5%)</span><span>₹${tax}</span></div>
    <div class="summary-total"><span>Total</span><span>₹${total.toLocaleString("en-IN")}</span></div>
    ${subtotal < 499
      ? `<p style="font-size:0.78rem;color:var(--muted);margin-bottom:16px">Add ₹${499 - subtotal} more for free delivery!</p>`
      : `<p style="font-size:0.78rem;color:#4ade80;margin-bottom:16px">🎉 You've unlocked free delivery!</p>`
    }
    <button class="checkout-btn" onclick="handleCheckout(${subtotal},${delivery},${tax},${total})">
      <i class="fa fa-lock"></i> Proceed to Checkout
    </button>
    <button onclick="clearCart()" style="width:100%;margin-top:12px;padding:10px;border-radius:10px;background:transparent;border:1px solid var(--border);color:var(--muted);font-size:0.85rem;cursor:pointer;transition:all 0.3s" onmouseover="this.style.color='#f87171';this.style.borderColor='#f87171'" onmouseout="this.style.color='var(--muted)';this.style.borderColor='var(--border)'">
      <i class="fa fa-trash"></i> Clear Cart
    </button>
  `;
}

async function clearCart() {
  if (!confirm("Remove all items from cart?")) return;
  cart = [];
  if (currentUser) await clearCartInFirestore(currentUser.uid);
  else localStorage.removeItem("feCart");
  updateCartBadge();
  renderCart();
}
window.clearCart = clearCart;

/* ─── Checkout → saves order to Firestore ─── */
async function handleCheckout(subtotal, delivery, tax, total) {
  if (!currentUser) {
    showToast("🔐 Please login to place an order.");
    setTimeout(() => showPage("login"), 1200);
    return;
  }

  showToast("⏳ Placing your order…");

  const result = await placeOrder({
    userId:    currentUser.uid,
    userEmail: currentUser.email,
    userName:  currentUser.displayName || currentUser.email,
    items:     cart.map(c => ({ id: c.id, name: c.name, price: c.price, qty: c.qty })),
    subtotal, delivery, tax, total
  });

  if (result.success) {
    showToast(`✅ Order #${result.orderId.slice(-6).toUpperCase()} placed! Arriving in ~30 min.`);
    cart = [];
    await clearCartInFirestore(currentUser.uid);
    updateCartBadge();
    renderCart();
  } else {
    showToast("❌ Order failed: " + result.error);
  }
}
window.handleCheckout = handleCheckout;

/* =============================================
   ORDERS PAGE
   ============================================= */
async function renderOrders() {
  const el = document.getElementById("ordersList");
  if (!el) return;

  if (!currentUser) {
    el.innerHTML = `<div class="empty-cart"><div class="empty-icon">🔐</div><h3>Login to view orders</h3><button class="btn-primary" onclick="showPage('login')">Login</button></div>`;
    return;
  }

  el.innerHTML = `<p style="color:var(--muted);text-align:center;padding:40px">Loading orders…</p>`;
  const { success, orders, error } = await getUserOrders(currentUser.uid);

  if (!success) { el.innerHTML = `<p style="color:#f87171;text-align:center">${error}</p>`; return; }
  if (!orders.length) {
    el.innerHTML = `<div class="empty-cart"><div class="empty-icon">📦</div><h3>No orders yet</h3><p>Start ordering delicious food!</p><button class="btn-primary" onclick="showPage('home')">Browse Menu</button></div>`;
    return;
  }

  el.innerHTML = orders.map(order => {
    const date = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "Just now";
    return `
    <div class="order-card">
      <div class="order-header">
        <div>
          <span class="order-id">Order #${order.id.slice(-6).toUpperCase()}</span>
          <span class="order-date">${date}</span>
        </div>
        <span class="order-status status-${order.status}">${order.status}</span>
      </div>
      <div class="order-items-list">
        ${order.items.map(i => `<span>${i.name} × ${i.qty}</span>`).join(" · ")}
      </div>
      <div class="order-footer">
        <span>Total: <strong>₹${order.pricing.total.toLocaleString("en-IN")}</strong></span>
        <span style="color:var(--muted);font-size:0.82rem">🚴 ${order.estimatedDelivery}</span>
      </div>
    </div>`;
  }).join("");
}

/* =============================================
   AUTH HANDLERS
   ============================================= */
async function handleLogin(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  const email    = e.target.querySelector('input[type="email"]').value;
  const password = e.target.querySelector('input[type="password"]').value;

  setLoading(btn, true);
  const result = await loginUser({ email, password });
  setLoading(btn, false);

  if (result.success) {
    showToast("✅ Welcome back! Logged in successfully.");
    setTimeout(() => showPage("home"), 800);
  } else {
    showAuthError("loginError", result.error);
  }
}
window.handleLogin = handleLogin;

async function handleRegister(e) {
  e.preventDefault();
  const btn    = e.target.querySelector("button[type=submit]");
  const inputs = e.target.querySelectorAll("input");
  const [firstName, lastName, email, phone, password] = [...inputs].map(i => i.value);

  setLoading(btn, true);
  const result = await registerUser({ firstName, lastName, email, phone, password });
  setLoading(btn, false);

  if (result.success) {
    showToast("🎉 Account created! Welcome to FoodExpress.");
    setTimeout(() => showPage("home"), 800);
  } else {
    showAuthError("registerError", result.error);
  }
}
window.handleRegister = handleRegister;

async function handleLogout() {
  await logoutUser();
  cart = [];
  updateCartBadge();
  showToast("👋 Logged out. See you soon!");
  showPage("home");
}
window.handleLogout = handleLogout;

/* ─── Auth UI Helpers ─── */
function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.innerHTML = loading
    ? '<i class="fa fa-spinner fa-spin"></i> Please wait…'
    : btn.dataset.original || btn.innerHTML;
  if (!loading && !btn.dataset.original) btn.dataset.original = btn.innerHTML;
}

function showAuthError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = "block"; setTimeout(() => el.style.display = "none", 5000); }
}

/* =============================================
   CONTACT FORM → Firestore
   ============================================= */
async function submitContact(e) {
  e.preventDefault();
  const inputs  = e.target.querySelectorAll("input, textarea");
  const [name, email, message] = [...inputs].map(i => i.value);
  const btn     = e.target.querySelector("button[type=submit]");

  setLoading(btn, true);
  const result = await submitContactForm({ name, email, message });
  setLoading(btn, false);

  const success = document.getElementById("contactSuccess");
  if (result.success) {
    success.classList.add("visible");
    e.target.reset();
    setTimeout(() => success.classList.remove("visible"), 5000);
  } else {
    showToast("❌ Failed to send. Please try again.");
  }
}
window.submitContact = submitContact;

/* =============================================
   TOAST
   ============================================= */
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 3500);
}
