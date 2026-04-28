import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

// ─── Tailwind via CDN injected in head ───────────────────────────────────────
const TailwindLoader = () => {
  useEffect(() => {
    if (!document.getElementById("tw-cdn")) {
      const s = document.createElement("script");
      s.id = "tw-cdn";
      s.src = "https://cdn.tailwindcss.com";
      document.head.appendChild(s);
    }
    if (!document.getElementById("gf-cdn")) {
      const l = document.createElement("link");
      l.id = "gf-cdn";
      l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap";
      document.head.appendChild(l);
    }
  }, []);
  return null;
};

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API = "https://beeyond-harvest-admin.onrender.com";

const CDN = (image) => {
  if (!image) return null;
  if (typeof image === "object" && image.url) {
    const u = image.url;
    if (!u || !u.trim()) return null;
    return u.startsWith("http") ? u : `${API}${u}`;
  }
  if (typeof image === "string") {
    if (!image.trim()) return null;
    return image.startsWith("http") ? image : `${API}${image}`;
  }
  return null;
};

// ─── CONTEXTS ────────────────────────────────────────────────────────────────
const CartCtx = createContext(null);
const ToastCtx = createContext(null);
const NavCtx = createContext(null);

// ─── UTILS ───────────────────────────────────────────────────────────────────
const fmt = (n) => "৳" + Number(n || 0).toLocaleString("en-BD");

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

// Cache for API requests to reduce duplicate calls
const apiCache = new Map();
let activeRequests = new Map();

function useAPI(path, deps = [], skip = false) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (skip || !path) return;

    const cacheKey = `${path}`;

    // Check cache first
    if (apiCache.has(cacheKey)) {
      setData(apiCache.get(cacheKey));
      setLoading(false);
      return;
    }

    // Check for active request to avoid duplicates
    if (activeRequests.has(cacheKey)) {
      activeRequests.get(cacheKey).then(setData).catch(setError).finally(() => setLoading(false));
      return;
    }

    setLoading(true);
    const request = apiFetch(path)
      .then((d) => {
        const result = d.data ?? d;
        apiCache.set(cacheKey, result);
        setData(result);
        setLoading(false);
        return result;
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
        throw e;
      })
      .finally(() => {
        activeRequests.delete(cacheKey);
      });

    activeRequests.set(cacheKey, request);
  }, [path, ...deps]);

  return { data, loading, error, setData };
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={add}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{ animation: "slideUp .3s ease" }}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold shadow-2xl border pointer-events-auto ${t.type === "error"
              ? "bg-red-50 text-red-700 border-red-200"
              : t.type === "warn"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
          >
            <span className="text-base">{t.type === "error" ? "✕" : t.type === "warn" ? "⚠" : "✓"}</span>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
const useToast = () => useContext(ToastCtx);

// ─── CART ────────────────────────────────────────────────────────────────────
function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem("bh_cart2") || "[]"); } catch { return []; }
  });
  const [coupon, setCoupon] = useState(null);
  const [delivery, setDelivery] = useState(null);

  useEffect(() => { localStorage.setItem("bh_cart2", JSON.stringify(items)); }, [items]);

  const add = (product, qty = 1) =>
    setItems((p) => {
      const ex = p.find((i) => i._id === product._id);
      if (ex) return p.map((i) => i._id === product._id ? { ...i, qty: i.qty + qty } : i);
      return [...p, { ...product, qty }];
    });
  const remove = (id) => setItems((p) => p.filter((i) => i._id !== id));
  const update = (id, qty) => { if (qty < 1) return remove(id); setItems((p) => p.map((i) => i._id === id ? { ...i, qty } : i)); };
  const clear = () => { setItems([]); setCoupon(null); setDelivery(null); };

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items]);
  const discount = coupon ? (coupon.type === "percent" ? Math.round(subtotal * coupon.value / 100) : coupon.value) : 0;
  const deliveryCharge = delivery?.amount ?? delivery?.charge ?? 0;
  const total = subtotal - discount + deliveryCharge;
  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartCtx.Provider value={{ items, add, remove, update, clear, coupon, setCoupon, delivery, setDelivery, subtotal, discount, deliveryCharge, total, count }}>
      {children}
    </CartCtx.Provider>
  );
}
const useCart = () => useContext(CartCtx);

// ─── GLOBAL STYLES ───────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
    @keyframes fadeIn  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    @keyframes spin    { to { transform:rotate(360deg); } }
    @keyframes popIn   { 0%{transform:scale(.85);opacity:0} 80%{transform:scale(1.04)} 100%{transform:scale(1);opacity:1} }
    * { font-family: 'DM Sans', system-ui, sans-serif; box-sizing: border-box; }
    h1,h2,h3,.font-display { font-family: 'Playfair Display', Georgia, serif; }
    .shimmer { background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; }
    .card-hover { transition: transform .22s ease, box-shadow .22s ease; }
    .card-hover:hover { transform: translateY(-5px); box-shadow: 0 20px 48px rgba(0,0,0,.11); }
    .btn-bounce:active { transform: scale(.96); }
    ::-webkit-scrollbar { width:5px; height:5px; }
    ::-webkit-scrollbar-track { background:#f5f5f5; }
    ::-webkit-scrollbar-thumb { background:#d4d4d4; border-radius:4px; }
    input:focus, select:focus, textarea:focus { outline:none; border-color:#d97706!important; box-shadow:0 0 0 3px rgba(217,119,106,.12); }
    .line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
    .line-clamp-3 { display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
    .prose { max-width: 100%; }
    .prose p { margin-bottom: 1rem; line-height: 1.6; }
    .prose img { max-width: 100%; border-radius: 1rem; margin: 1rem 0; }
    .prose h1, .prose h2, .prose h3 { font-family: 'Playfair Display', serif; margin: 1.5rem 0 0.5rem; }
    .prose h2 { font-size: 1.5rem; }
    .prose h3 { font-size: 1.25rem; }
    .prose ul, .prose ol { margin: 0.5rem 0 1rem 1.5rem; }
  `}</style>
);

// ─── SKELETON ────────────────────────────────────────────────────────────────
const Sk = ({ className = "" }) => <div className={`shimmer rounded-xl ${className}`} />;

// ─── STARS ───────────────────────────────────────────────────────────────────
function Stars({ rating = 0, size = 14 }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= Math.round(rating) ? "#f59e0b" : "#e5e7eb"} stroke="none">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

// ─── SPINNER ─────────────────────────────────────────────────────────────────
const Spinner = () => (
  <svg style={{ animation: "spin .7s linear infinite" }} className="inline-block" width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <circle cx={12} cy={12} r={10} strokeOpacity={.25} />
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
);

// ─── ICON ────────────────────────────────────────────────────────────────────
const I = ({ d, size = 18, className = "", fill = "none", stroke = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

const ic = {
  cart: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0",
  search: "m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
  menu: "M4 6h16M4 12h16M4 18h16",
  x: "M18 6 6 18M6 6l12 12",
  heart: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  check: "M20 6 9 17l-5-5",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
  truck: "M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM18.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  box: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
  home: "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  chev_r: "m9 18 6-6-6-6",
  chev_l: "m15 18-6-6 6-6",
  chev_d: "m6 9 6 6 6-6",
  blog: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  msg: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  map: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  share: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13",
  award: "M12 15l-3.09 6.26L3 18.27l5-4.87L6.82 6.88 12 10.27l5.18-3.39L16 13.4l5 4.87-5.91 3L12 15z",
};

// ─── NAVBAR ──────────────────────────────────────────────────────────────────
function Navbar() {
  const { page, setPage, searchQuery, setSearchQuery } = useContext(NavCtx);
  const cart = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const links = [
    { id: "home", label: "Home", icon: ic.home },
    { id: "shop", label: "Shop", icon: ic.grid },
    { id: "blog", label: "Blog", icon: ic.blog },
    { id: "track", label: "Track", icon: ic.truck },
    { id: "contact", label: "Contact", icon: ic.phone },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-amber-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-16 gap-3">
        <button onClick={() => setPage("home")} className="flex items-center gap-2.5 btn-bounce flex-shrink-0 mr-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xl shadow-md">🍯</div>
          <span className="font-display text-xl font-bold text-stone-900 hidden sm:block">BeeHarvest</span>
        </button>

        <div className="hidden md:flex items-center gap-1 flex-1">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => setPage(l.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all btn-bounce ${page === l.id || page.startsWith(l.id + ":")
                ? "bg-amber-50 text-amber-700 font-semibold"
                : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"
                }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {searchOpen ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { setPage("shop"); setSearchOpen(false); } }}
                placeholder="Search honey…"
                className="w-40 sm:w-52 px-3 py-1.5 rounded-lg border border-amber-200 text-sm bg-amber-50 focus:bg-white transition-all"
              />
              <button onClick={() => setSearchOpen(false)} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 btn-bounce">
                <I d={ic.x} size={16} />
              </button>
            </div>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 btn-bounce">
              <I d={ic.search} size={19} />
            </button>
          )}

          <button onClick={() => setPage("cart")} className="relative p-2 rounded-lg text-stone-500 hover:bg-amber-50 btn-bounce">
            <I d={ic.cart} size={20} />
            {cart.count > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center min-w-[18px] px-1">
                {cart.count > 99 ? "99+" : cart.count}
              </span>
            )}
          </button>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg text-stone-500 hover:bg-stone-100 btn-bounce">
            <I d={menuOpen ? ic.x : ic.menu} size={20} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-amber-50 bg-white px-4 py-2 pb-4" style={{ animation: "fadeIn .18s ease" }}>
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => { setPage(l.id); setMenuOpen(false); }}
              className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium mb-1 transition-all ${page === l.id ? "bg-amber-50 text-amber-700 font-semibold" : "text-stone-600"
                }`}
            >
              <I d={l.icon} size={17} />
              {l.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
function ProductCard({ product, onView, compact = false }) {
  const [wished, setWished] = useState(false);
  const cart = useCart();
  const toast = useToast();

  const imgSrc = (() => {
    if (!product.images?.length) return null;
    const img = product.images[0];
    return typeof img === "string" ? CDN(img) : CDN(img?.url);
  })();

  const disc = product.comparePrice > product.price
    ? Math.round((1 - product.price / product.comparePrice) * 100) : 0;

  return (
    <div
      onClick={() => onView(product)}
      className="card-hover bg-white rounded-2xl border border-stone-100 overflow-hidden cursor-pointer group"
    >
      <div className="relative bg-amber-50 overflow-hidden" style={{ paddingBottom: compact ? "80%" : "72%" }}>
        {imgSrc ? (
          <img src={imgSrc} alt={product.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-6xl">🍯</div>
        )}
        {disc > 0 && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">-{disc}%</span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="bg-stone-100 text-stone-500 text-xs font-semibold px-3 py-1.5 rounded-full">Out of Stock</span>
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); setWished(!wished); toast(wished ? "Removed from wishlist" : "Added to wishlist 💛", wished ? "warn" : "success"); }}
          className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity btn-bounce"
        >
          <I d={ic.heart} size={14} stroke={wished ? "#ef4444" : "#aaa"} fill={wished ? "#ef4444" : "none"} />
        </button>
      </div>

      <div className="p-4">
        <p className="text-xs text-amber-600 font-semibold mb-1">{product.category?.name || "Honey"}</p>
        <h3 className="font-display font-semibold text-stone-800 text-[15px] line-clamp-2 mb-2 leading-snug">{product.name}</h3>
        <div className="flex items-center gap-2 mb-3">
          <Stars rating={product.ratings?.average || product.avgRating || 0} />
          {(product.ratings?.count > 0 || product.reviewCount > 0) && (
            <span className="text-xs text-stone-400">({product.ratings?.count || product.reviewCount})</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-stone-900">{fmt(product.price)}</span>
            {disc > 0 && <span className="text-xs text-stone-400 line-through ml-1.5">{fmt(product.comparePrice)}</span>}
          </div>
          {product.stock > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); cart.add(product); toast(`${product.name} added! 🍯`); }}
              className="w-9 h-9 bg-amber-500 hover:bg-amber-600 text-white rounded-xl flex items-center justify-center btn-bounce shadow-md shadow-amber-200 transition-colors"
            >
              <I d={ic.plus} size={16} stroke="white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage() {
  const { setPage, setSearchQuery } = useContext(NavCtx);
  const { data: rawFeatured, loading: featLoading } = useAPI("/api/products?featured=true&limit=8");
  const { data: rawCategories } = useAPI("/api/categories");

  const featured = rawFeatured?.products || rawFeatured || [];
  const cats = rawCategories?.categories || rawCategories || [];

  return (
    <div>
      <div className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 min-h-[540px] flex items-center">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #f59e0b 0%, transparent 60%), radial-gradient(circle at 80% 20%, #d97706 0%, transparent 50%)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-5" style={{ backgroundImage: "repeating-linear-gradient(45deg, #f59e0b 0, #f59e0b 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px" }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full py-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div style={{ animation: "slideUp .6s ease" }}>
            <span className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-full mb-5 border border-amber-500/30">
              🍯 Pure · Raw · Organic
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5">
              Nature's Finest<br /><span className="text-amber-400">Golden Honey</span>
            </h1>
            <p className="text-stone-300 text-base sm:text-lg leading-relaxed mb-8 max-w-md">
              Direct from Bangladeshi beekeepers to your table. No additives, no shortcuts — just pure, lab-tested honey at its best.
            </p>
            <div className="flex gap-3 flex-wrap">
              <button onClick={() => setPage("shop")} className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-6 py-3 rounded-xl flex items-center gap-2 btn-bounce shadow-xl shadow-amber-900/40 transition-colors text-sm">
                <I d={ic.grid} size={17} stroke="#1a1a1a" /> Shop Now
              </button>
              <button onClick={() => setPage("track")} className="border border-stone-600 text-stone-200 hover:bg-stone-700/50 font-semibold px-6 py-3 rounded-xl flex items-center gap-2 btn-bounce transition-colors text-sm">
                <I d={ic.truck} size={17} stroke="#e5e7eb" /> Track Order
              </button>
            </div>
          </div>
          <div className="flex justify-center items-center" style={{ animation: "popIn .8s ease" }}>
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400 opacity-20 rounded-full blur-3xl scale-150" />
              <span className="text-[140px] sm:text-[180px] drop-shadow-2xl relative z-10">🍯</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-500">
        <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[["🍯", "100% Pure", "No Additives"], ["🌿", "Organic", "Lab Tested"], ["🚚", "24–48h", "Fast Delivery"], ["⭐", "50K+", "Happy Customers"]].map(([icon, val, label]) => (
            <div key={label} className="text-center py-2">
              <div className="text-2xl">{icon}</div>
              <div className="font-bold text-stone-900 font-display">{val}</div>
              <div className="text-xs text-amber-800 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl font-bold text-stone-900 mb-2">Shop by Category</h2>
          <p className="text-stone-500">Explore our curated honey collection</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {cats.length > 0 ? cats.slice(0, 6).map((cat) => (
            <div key={cat._id} onClick={() => setPage("shop")} className="card-hover bg-white rounded-2xl border border-stone-100 p-5 text-center cursor-pointer">
              <div className="w-14 h-14 mx-auto mb-3 rounded-xl overflow-hidden bg-amber-50 flex items-center justify-center">
                {CDN(cat.image) ? <img src={CDN(cat.image)} alt={cat.name} className="w-full h-full object-cover" /> : <span className="text-3xl">🍯</span>}
              </div>
              <div className="font-semibold text-stone-800 text-sm">{cat.name}</div>
              {cat.productCount > 0 && <div className="text-xs text-stone-400 mt-0.5">{cat.productCount} items</div>}
            </div>
          )) : Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-100 p-5">
              <Sk className="w-14 h-14 mx-auto mb-3" />
              <Sk className="h-3 w-3/4 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-stone-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-display text-3xl font-bold text-stone-900 mb-1">Featured Products</h2>
              <p className="text-stone-500">Handpicked bestsellers</p>
            </div>
            <button onClick={() => setPage("shop")} className="text-amber-600 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all btn-bounce">
              View All <I d={ic.chev_r} size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                  <Sk className="h-48 rounded-none" />
                  <div className="p-4 space-y-2"><Sk className="h-3 w-1/3" /><Sk className="h-4" /><Sk className="h-3 w-1/2" /></div>
                </div>
              ))
              : featured.slice(0, 8).map((p) => (
                <ProductCard key={p._id} product={p} onView={() => setPage(`product:${p._id}`)} />
              ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="font-display text-3xl font-bold text-stone-900 text-center mb-10">Why BeeHarvest?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[["🌿", "100% Organic", "No artificial additives, preservatives, or flavoring — ever."], ["🔬", "Lab Tested", "Every batch independently tested for purity & quality."], ["🚚", "Fast Delivery", "Nationwide delivery within 24–48 hours."], ["💰", "Best Price", "Direct from beekeepers — no middlemen markup."]].map(([icon, title, desc]) => (
            <div key={title} className="bg-white rounded-2xl border border-stone-100 p-6 text-center card-hover">
              <div className="text-4xl mb-4">{icon}</div>
              <h3 className="font-display font-semibold text-stone-800 text-base mb-2">{title}</h3>
              <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-400 to-amber-500 py-16 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-5xl mb-4">🎁</div>
          <h2 className="font-display text-3xl font-bold text-stone-900 mb-3">First Order? Save 10%!</h2>
          <p className="text-amber-900/80 mb-6">Use code <strong className="bg-white/40 px-2 py-0.5 rounded-lg">WELCOME10</strong> at checkout</p>
          <button onClick={() => setPage("shop")} className="bg-stone-900 text-white font-bold px-8 py-3.5 rounded-xl btn-bounce hover:bg-stone-800 transition-colors shadow-xl text-sm">
            Start Shopping →
          </button>
        </div>
      </div>

      <footer className="bg-stone-900 text-stone-300 py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="font-display text-xl font-bold text-white mb-3">🍯 BeeHarvest</div>
            <p className="text-sm leading-relaxed text-stone-400">Pure honey, straight from the hive. Trusted by 50,000+ customers across Bangladesh.</p>
          </div>
          {[{ title: "Quick Links", links: ["Home", "Shop", "Blog", "Track Order", "Contact"] },
          { title: "Policies", links: ["Returns", "Shipping", "Privacy Policy", "Terms of Service"] },
          { title: "Contact", links: ["📧 info@beeharvest.com", "📞 01XXXXXXXXX", "📍 Dhaka, Bangladesh"] }
          ].map((col) => (
            <div key={col.title}>
              <div className="font-semibold text-white mb-3 text-sm">{col.title}</div>
              {col.links.map((l) => <div key={l} onClick={() => setPage(l.toLowerCase().replace(/ /g, "_"))} className="text-stone-400 text-sm mb-2 cursor-pointer hover:text-amber-400 transition-colors">{l}</div>)}
            </div>
          ))}
        </div>
        <div className="border-t border-stone-800 pt-6 text-center text-stone-500 text-xs">
          © 2024 BeeHarvest. All rights reserved. Made with 🍯 in Bangladesh.
        </div>
      </footer>
    </div>
  );
}

// ─── SHOP PAGE ────────────────────────────────────────────────────────────────
function ShopPage() {
  const { setPage, searchQuery, setSearchQuery } = useContext(NavCtx);
  const [filters, setFilters] = useState({ category: "", sort: "-createdAt", minPrice: "", maxPrice: "", page: 1 });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: rawCategories } = useAPI("/api/categories");
  const cats = rawCategories?.categories || rawCategories || [];

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (searchQuery) p.set("search", searchQuery);
    if (filters.category) p.set("category", filters.category);
    if (filters.sort) p.set("sort", filters.sort);
    if (filters.minPrice) p.set("minPrice", filters.minPrice);
    if (filters.maxPrice) p.set("maxPrice", filters.maxPrice);
    p.set("page", filters.page);
    p.set("limit", 12);
    return p.toString();
  }, [filters, searchQuery]);

  const { data: raw, loading } = useAPI(`/api/products?${qs}`, [qs]);
  const products = raw?.products || raw || [];
  const total = raw?.total || products.length;
  const pages = Math.ceil(total / 12);

  const setF = (k, v) => setFilters((f) => ({ ...f, [k]: v, page: 1 }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">All Products</h1>
          <p className="text-stone-500 text-sm mt-0.5">{total} products found</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium btn-bounce transition-all ${sidebarOpen ? "bg-amber-50 border-amber-200 text-amber-700" : "border-stone-200 text-stone-600 hover:border-stone-300"}`}>
            <I d={ic.filter} size={15} /> Filters
          </button>
          <select value={filters.sort} onChange={(e) => setF("sort", e.target.value)} className="border border-stone-200 rounded-xl px-3 py-2 text-sm font-medium bg-white text-stone-700 cursor-pointer">
            <option value="-createdAt">Newest First</option>
            <option value="createdAt">Oldest First</option>
            <option value="price">Price: Low → High</option>
            <option value="-price">Price: High → Low</option>
            <option value="-avgRating">Best Rated</option>
            <option value="-salesCount">Most Popular</option>
          </select>
        </div>
      </div>

      <div className="relative mb-6">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <I d={ic.search} size={17} className="text-stone-400" />
        </div>
        <input
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setFilters((f) => ({ ...f, page: 1 })); }}
          placeholder="Search products…"
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm transition-all"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700">
            <I d={ic.x} size={15} />
          </button>
        )}
      </div>

      <div className="flex gap-6 items-start">
        {sidebarOpen && (
          <div className="hidden sm:block w-56 flex-shrink-0 bg-white rounded-2xl border border-stone-100 p-5 sticky top-20" style={{ animation: "slideUp .2s ease" }}>
            <h3 className="font-semibold text-stone-800 text-sm mb-4">Categories</h3>
            {[{ _id: "", name: "All Categories" }, ...cats].map((cat) => (
              <button
                key={cat._id}
                onClick={() => setF("category", cat._id)}
                className={`block w-full text-left px-3 py-2 rounded-xl text-sm mb-1 transition-all btn-bounce ${filters.category === cat._id ? "bg-amber-50 text-amber-700 font-semibold" : "text-stone-600 hover:bg-stone-50"}`}
              >
                {cat.name}
              </button>
            ))}
            <div className="border-t border-stone-100 mt-4 pt-4">
              <h3 className="font-semibold text-stone-800 text-sm mb-3">Price Range (৳)</h3>
              <div className="flex gap-2">
                <input type="number" value={filters.minPrice} onChange={(e) => setF("minPrice", e.target.value)} placeholder="Min" className="w-1/2 px-2 py-2 rounded-lg border border-stone-200 text-sm" />
                <input type="number" value={filters.maxPrice} onChange={(e) => setF("maxPrice", e.target.value)} placeholder="Max" className="w-1/2 px-2 py-2 rounded-lg border border-stone-200 text-sm" />
              </div>
            </div>
            {(filters.category || filters.minPrice || filters.maxPrice || searchQuery) && (
              <button onClick={() => { setFilters({ category: "", sort: "-createdAt", minPrice: "", maxPrice: "", page: 1 }); setSearchQuery(""); }} className="mt-4 w-full flex items-center justify-center gap-1.5 text-red-500 text-xs font-semibold border border-red-100 rounded-xl py-2 hover:bg-red-50 btn-bounce">
                <I d={ic.x} size={13} stroke="#ef4444" /> Clear Filters
              </button>
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                  <Sk className="h-48 rounded-none" />
                  <div className="p-4 space-y-2"><Sk className="h-3 w-1/3" /><Sk className="h-4" /><Sk className="h-3 w-1/2" /></div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="font-display text-xl font-semibold text-stone-700 mb-2">No products found</h3>
              <p className="text-stone-400 text-sm">Try different search terms or clear filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((p) => <ProductCard key={p._id} product={p} onView={() => setPage(`product:${p._id}`)} />)}
            </div>
          )}

          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              <button disabled={filters.page === 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))} className="p-2 rounded-xl border border-stone-200 disabled:opacity-40 hover:bg-stone-50 btn-bounce">
                <I d={ic.chev_l} size={16} />
              </button>
              {Array.from({ length: Math.min(7, pages) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setFilters((f) => ({ ...f, page: p }))} className={`w-9 h-9 rounded-xl text-sm font-medium btn-bounce border transition-all ${filters.page === p ? "bg-amber-500 text-white border-amber-500 shadow-md" : "border-stone-200 hover:border-amber-300 text-stone-600"}`}>{p}</button>
              ))}
              <button disabled={filters.page === pages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))} className="p-2 rounded-xl border border-stone-200 disabled:opacity-40 hover:bg-stone-50 btn-bounce">
                <I d={ic.chev_r} size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCT DETAIL PAGE ──────────────────────────────────────────────────────
function ProductPage({ productId }) {
  const { setPage } = useContext(NavCtx);
  const { data: raw, loading } = useAPI(`/api/products/${productId}`);
  const { data: rawReviews } = useAPI(`/api/reviews/product/${productId}`);
  const cart = useCart();
  const toast = useToast();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [tab, setTab] = useState("description");

  const p = raw?.product || raw;
  const reviews = rawReviews?.reviews || rawReviews || [];

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <Sk className="h-96" />
        <div className="space-y-4"><Sk className="h-8 w-3/4" /><Sk className="h-5 w-1/2" /><Sk className="h-24" /><Sk className="h-12" /></div>
      </div>
    </div>
  );
  if (!p) return <div className="text-center py-20 text-stone-500">Product not found.</div>;

  const images = p.images || [];
  const disc = p.originalPrice > p.price ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ animation: "fadeIn .3s ease" }}>
      <div className="flex items-center gap-1.5 text-xs text-stone-400 mb-8 flex-wrap">
        <button onClick={() => setPage("home")} className="hover:text-amber-600 transition-colors font-medium">Home</button>
        <I d={ic.chev_r} size={12} />
        <button onClick={() => setPage("shop")} className="hover:text-amber-600 transition-colors font-medium">Shop</button>
        <I d={ic.chev_r} size={12} />
        <span className="text-stone-600 font-medium line-clamp-1">{p.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
        <div>
          <div className="bg-amber-50 rounded-2xl overflow-hidden aspect-square flex items-center justify-center mb-3">
            {images[activeImg] ? (
              <img src={CDN(images[activeImg])} alt={p.name} className="w-full h-full object-cover" />
            ) : <span className="text-9xl">🍯</span>}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all btn-bounce ${activeImg === i ? "border-amber-500" : "border-transparent"}`}>
                  <img src={CDN(img)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="inline-block bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">{p.category?.name || "Honey"}</span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mb-3 leading-tight">{p.name}</h1>

          <div className="flex items-center gap-3 mb-4">
            <Stars rating={p.avgRating || 0} size={18} />
            <span className="text-stone-400 text-sm">({reviews.length} reviews)</span>
          </div>

          <div className="flex items-baseline gap-3 mb-5">
            <span className="text-3xl font-bold text-stone-900">{fmt(p.price)}</span>
            {disc > 0 && (
              <>
                <span className="text-stone-400 line-through text-lg">{fmt(p.originalPrice)}</span>
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">Save {disc}%</span>
              </>
            )}
          </div>

          <p className="text-stone-600 leading-relaxed mb-5 text-sm">{p.description || "Premium quality honey, pure and natural. Sourced directly from trusted beekeepers."}</p>

          <div className="mb-5">
            <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full ${p.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              <span>{p.stock > 0 ? "✓" : "✗"}</span>
              {p.stock > 0 ? `In Stock (${p.stock} available)` : "Out of Stock"}
            </span>
            {p.sku && <span className="ml-3 text-xs text-stone-400">SKU: {p.sku}</span>}
          </div>

          {p.stock > 0 && (
            <div className="flex gap-3 mb-6 flex-wrap">
              <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-11 h-11 flex items-center justify-center bg-stone-50 hover:bg-stone-100 btn-bounce text-stone-600">
                  <I d={ic.minus} size={15} />
                </button>
                <span className="w-12 text-center font-bold text-stone-900">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(p.stock, q + 1))} className="w-11 h-11 flex items-center justify-center bg-stone-50 hover:bg-stone-100 btn-bounce text-stone-600">
                  <I d={ic.plus} size={15} />
                </button>
              </div>
              <button onClick={() => { cart.add(p, qty); toast(`${qty}× ${p.name} added! 🍯`); }} className="flex-1 min-w-[160px] bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold rounded-xl flex items-center justify-center gap-2 btn-bounce shadow-lg shadow-amber-200 transition-colors text-sm py-3">
                <I d={ic.cart} size={17} stroke="#1a1a1a" />
                Add to Cart — {fmt(p.price * qty)}
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {[["🚚", "Free delivery over ৳500"], ["🔄", "7-day easy returns"], ["🔒", "Secure checkout"], ["✅", "Quality guaranteed"]].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-2 bg-stone-50 rounded-xl px-3 py-2.5 text-xs text-stone-600 font-medium">
                <span>{icon}</span>{text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        <div className="flex border-b border-stone-100">
          {["description", "reviews", "faq"].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-5 sm:px-8 py-4 text-sm font-medium capitalize transition-all border-b-2 ${tab === t ? "border-amber-500 text-amber-700 font-semibold" : "border-transparent text-stone-500 hover:text-stone-700"}`}>
              {t} {t === "reviews" && `(${reviews.length})`}
            </button>
          ))}
        </div>

        <div className="p-6 sm:p-8">
          {tab === "description" && (
            <p className="text-stone-600 leading-relaxed">{p.description || "Pure, natural honey with no additives. Sourced from trusted beekeepers across Bangladesh, every jar carries the authentic taste of nature."}</p>
          )}
          {tab === "reviews" && (
            <div>
              {reviews.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-5xl mb-3">⭐</div>
                  <p className="text-stone-400 text-sm">No reviews yet. Be the first!</p>
                </div>
              ) : reviews.map((r) => (
                <div key={r._id} className="border-b border-stone-50 last:border-0 pb-5 mb-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-sm">
                        {(r.reviewer?.name || r.name || "A")[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-stone-800 text-sm">{r.reviewer?.name || r.name || "Anonymous"}</div>
                        <Stars rating={r.rating} size={13} />
                      </div>
                    </div>
                    <span className="text-stone-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.title && <div className="font-semibold text-stone-700 mt-3 mb-1 text-sm">{r.title}</div>}
                  <p className="text-stone-500 text-sm leading-relaxed mt-2">{r.body || r.review}</p>
                </div>
              ))}
            </div>
          )}
          {tab === "faq" && (
            <div className="space-y-3">
              {[["Is the honey raw?", "Yes — all our honey is raw and unprocessed, preserving all natural enzymes and nutrients."], ["How to store?", "Store in a cool, dry place away from sunlight. Refrigeration not recommended."], ["Does honey expire?", "Honey never truly expires. Natural crystallization is normal and doesn't affect quality."], ["Bulk orders?", "Yes! Contact us for bulk orders with special pricing and dedicated support."]].map(([q, a]) => (
                <div key={q} className="bg-stone-50 rounded-xl p-5">
                  <div className="font-semibold text-stone-800 mb-2 text-sm">Q: {q}</div>
                  <div className="text-stone-500 text-sm leading-relaxed">A: {a}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CART PAGE ────────────────────────────────────────────────────────────────
function CartPage() {
  const { setPage } = useContext(NavCtx);
  const cart = useCart();
  const toast = useToast();
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState("");
  const [deliveryLoading, setDeliveryLoading] = useState(false);

  const { data: rawDelivery } = useAPI("/api/delivery-charges");
  const deliveryOptions = rawDelivery?.data || rawDelivery || [];

  const fetchDeliveryCharge = useCallback(async (city, subtotal) => {
    if (!city) return null;
    setDeliveryLoading(true);
    try {
      const url = `/api/delivery-charges/active?city=${encodeURIComponent(city)}&subtotal=${subtotal}`;
      const data = await apiFetch(url);
      return data.data;
    } catch (error) {
      console.error("Failed to fetch delivery charge:", error);
      return null;
    } finally {
      setDeliveryLoading(false);
    }
  }, []);

  useEffect(() => {
    const updateDelivery = async () => {
      if (!selectedCity) return;
      const deliveryData = await fetchDeliveryCharge(selectedCity, cart.subtotal);
      if (deliveryData) {
        cart.setDelivery(deliveryData);
      }
    };
    updateDelivery();
  }, [selectedCity, cart.subtotal, fetchDeliveryCharge]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const data = await apiFetch("/api/coupons/validate", {
        method: "POST",
        body: JSON.stringify({ code: couponCode, subtotal: cart.subtotal }),
      });
      const disc = data.data?.discountAmount || data.data?.value || 0;
      cart.setCoupon({ code: couponCode, type: data.data?.type || "flat", value: disc });
      toast(`Coupon applied! You save ${fmt(disc)} 🎉`);
    } catch (e) {
      toast(e.message || "Invalid coupon code", "error");
    } finally {
      setCouponLoading(false);
    }
  };

  if (cart.items.length === 0) return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="text-7xl mb-5">🛒</div>
      <h2 className="font-display text-2xl font-bold text-stone-800 mb-2">Your cart is empty</h2>
      <p className="text-stone-400 text-sm mb-7">Add some delicious honey to get started!</p>
      <button onClick={() => setPage("shop")} className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-7 py-3 rounded-xl btn-bounce transition-colors shadow-lg shadow-amber-200">
        Browse Products
      </button>
    </div>
  );

  const cities = ["Dhaka", "Chittagong", "Rajshahi", "Sylhet", "Khulna", "Barishal", "Rangpur", "Mymensingh", "Narayanganj", "Gazipur"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mb-8">Shopping Cart <span className="text-stone-400 font-normal text-xl">({cart.count})</span></h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
        <div className="space-y-4">
          {cart.items.map((item) => {
            const imgSrc = (() => { if (!item.images?.length) return null; const i = item.images[0]; return typeof i === "string" ? CDN(i) : CDN(i?.url); })();
            return (
              <div key={item._id} className="bg-white rounded-2xl border border-stone-100 p-4 flex gap-4 items-center" style={{ animation: "fadeIn .2s ease" }}>
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-amber-50 flex-shrink-0 flex items-center justify-center">
                  {imgSrc ? <img src={imgSrc} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-3xl">🍯</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-stone-800 text-sm mb-0.5 line-clamp-2">{item.name}</h3>
                  <p className="text-amber-600 text-xs font-medium mb-3">{fmt(item.price)} each</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden">
                      <button onClick={() => cart.update(item._id, item.qty - 1)} className="w-8 h-8 bg-stone-50 flex items-center justify-center hover:bg-stone-100 btn-bounce text-stone-600">
                        <I d={ic.minus} size={13} />
                      </button>
                      <span className="w-9 text-center text-sm font-bold text-stone-900">{item.qty}</span>
                      <button onClick={() => cart.update(item._id, item.qty + 1)} className="w-8 h-8 bg-stone-50 flex items-center justify-center hover:bg-stone-100 btn-bounce text-stone-600">
                        <I d={ic.plus} size={13} />
                      </button>
                    </div>
                    <button onClick={() => { cart.remove(item._id); toast(`${item.name} removed`, "warn"); }} className="p-1.5 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 btn-bounce">
                      <I d={ic.trash} size={14} stroke="#ef4444" />
                    </button>
                  </div>
                </div>
                <div className="font-bold text-stone-900 text-base flex-shrink-0">{fmt(item.price * item.qty)}</div>
              </div>
            );
          })}
        </div>

        <div className="lg:sticky lg:top-20 space-y-4">
          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <h3 className="font-semibold text-stone-800 mb-3 text-sm flex items-center gap-2">
              <I d={ic.map} size={16} className="text-amber-600" /> Delivery Location
            </h3>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm bg-stone-50"
            >
              <option value="">Select your city</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            {deliveryLoading && (
              <div className="mt-2 text-xs text-stone-400 flex items-center gap-1">
                <Spinner /> Calculating delivery...
              </div>
            )}
            {cart.delivery && !deliveryLoading && (
              <div className={`mt-3 text-xs flex items-center gap-1.5 ${cart.delivery.amount === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                <I d={ic.truck} size={12} />
                {cart.delivery.amount === 0 ? 'Free Delivery' : `Delivery Fee: ${fmt(cart.delivery.amount)}`}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <h3 className="font-semibold text-stone-800 mb-3 text-sm flex items-center gap-2">
              <I d={ic.tag} size={16} className="text-amber-600" /> Coupon Code
            </h3>
            {cart.coupon ? (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
                <span className="text-emerald-600">✓</span>
                <span className="flex-1 text-emerald-700 font-semibold text-sm">{cart.coupon.code} — Save {fmt(cart.discount)}</span>
                <button onClick={() => cart.setCoupon(null)} className="text-emerald-400 hover:text-emerald-600 btn-bounce">
                  <I d={ic.x} size={14} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && applyCoupon()} placeholder="Enter code…" className="flex-1 px-3 py-2.5 rounded-xl border border-stone-200 text-sm bg-stone-50" />
                <button onClick={applyCoupon} disabled={couponLoading} className="bg-stone-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold btn-bounce hover:bg-stone-700 transition-colors disabled:opacity-60 flex items-center gap-1.5">
                  {couponLoading ? <Spinner /> : "Apply"}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <h3 className="font-semibold text-stone-800 mb-4">Order Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-stone-600"><span>Subtotal</span><span className="font-semibold text-stone-900">{fmt(cart.subtotal)}</span></div>
              {cart.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span className="font-semibold">-{fmt(cart.discount)}</span></div>}
              <div className="flex justify-between text-stone-600"><span>Delivery</span><span className={`font-semibold ${cart.deliveryCharge === 0 ? "text-emerald-600" : "text-stone-900"}`}>{cart.deliveryCharge === 0 ? "Free" : fmt(cart.deliveryCharge)}</span></div>
              <div className="border-t border-stone-100 pt-3 flex justify-between font-bold text-stone-900 text-base">
                <span>Total</span><span>{fmt(cart.total)}</span>
              </div>
            </div>
            <button onClick={() => setPage("checkout")} className="mt-5 w-full bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold py-3.5 rounded-xl btn-bounce shadow-lg shadow-amber-200 transition-colors flex items-center justify-center gap-2">
              <I d={ic.check} size={18} stroke="#1a1a1a" /> Proceed to Checkout
            </button>
            <button onClick={() => setPage("shop")} className="mt-2 w-full py-2.5 rounded-xl text-stone-500 text-sm hover:bg-stone-50 btn-bounce transition-colors">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CHECKOUT PAGE ────────────────────────────────────────────────────────────
function CheckoutPage() {
  const { setPage } = useContext(NavCtx);
  const cart = useCart();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const { data: rawDelivery } = useAPI("/api/delivery-charges");
  const deliveryOptions = rawDelivery?.data || rawDelivery || [];

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    street: "", area: "", city: "", district: "", division: "",
    paymentMethod: "cash_on_delivery", notes: "",
  });
  const [errors, setErrors] = useState({});

  const fetchDeliveryCharge = useCallback(async (city, subtotal) => {
    if (!city) return null;
    setDeliveryLoading(true);
    try {
      const url = `/api/delivery-charges/active?city=${encodeURIComponent(city)}&subtotal=${subtotal}`;
      const data = await apiFetch(url);
      return data.data;
    } catch (error) {
      console.error("Failed to fetch delivery charge:", error);
      return null;
    } finally {
      setDeliveryLoading(false);
    }
  }, []);

  useEffect(() => {
    const updateDelivery = async () => {
      if (!form.city) return;
      const deliveryData = await fetchDeliveryCharge(form.city, cart.subtotal);
      if (deliveryData) {
        cart.setDelivery(deliveryData);
      }
    };
    updateDelivery();
  }, [form.city, cart.subtotal, fetchDeliveryCharge]);

  const upd = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setErrors((p) => ({ ...p, [k]: "" })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name required";
    if (!form.phone.match(/^01[3-9]\d{8}$/)) e.phone = "Enter valid BD phone (01XXXXXXXXX)";
    if (form.email && !form.email.includes("@")) e.email = "Invalid email";
    if (!form.street.trim()) e.street = "Street address required";
    if (!form.city.trim()) e.city = "City required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const placeOrder = async () => {
    if (!validate()) { toast("Please fix the errors", "error"); return; }
    setLoading(true);
    try {
      const payload = {
        customer: { name: form.name, email: form.email, phone: form.phone, address: { street: form.street, area: form.area, city: form.city, district: form.district, division: form.division } },
        items: cart.items.map((i) => ({ product: i._id, name: i.name, sku: i.sku || "", quantity: i.qty, price: i.price, total: i.price * i.qty })),
        subtotal: cart.subtotal, deliveryCharge: cart.deliveryCharge, discount: cart.discount, total: cart.total,
        paymentMethod: form.paymentMethod, notes: form.notes, couponCode: cart.coupon?.code,
      };
      const data = await apiFetch("/api/orders", { method: "POST", body: JSON.stringify(payload) });
      setSuccess(data.data || data);
      cart.clear();
    } catch (e) {
      toast(e.message || "Failed to place order. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="max-w-xl mx-auto text-center px-4 py-20" style={{ animation: "popIn .5s ease" }}>
      <div className="text-7xl mb-5">🎉</div>
      <h2 className="font-display text-2xl font-bold text-stone-900 mb-2">Order Placed!</h2>
      <p className="text-stone-500 text-sm mb-5">Your order number is:</p>
      <div className="bg-amber-50 border border-amber-200 text-stone-900 text-2xl font-bold py-4 px-6 rounded-2xl mb-5 tracking-widest inline-block">
        {success.orderNumber || success._id}
      </div>
      <p className="text-stone-400 text-sm mb-8">Save this number to track your order. We'll update you via email.</p>
      <div className="flex gap-3 justify-center flex-wrap">
        <button onClick={() => setPage("track")} className="bg-stone-900 text-white px-5 py-3 rounded-xl btn-bounce text-sm font-semibold flex items-center gap-2">
          <I d={ic.truck} size={16} stroke="white" /> Track Order
        </button>
        <button onClick={() => setPage("shop")} className="border border-stone-200 px-5 py-3 rounded-xl btn-bounce text-sm font-medium text-stone-600 hover:bg-stone-50">
          Continue Shopping
        </button>
      </div>
    </div>
  );

  const Field = ({ label, k, type = "text", placeholder, options, required = false, half = false }) => (
    <div className={half ? "w-full sm:w-[calc(50%-8px)]" : "w-full"}>
      <label className="block text-xs font-semibold text-stone-500 mb-1.5">{label}{required && " *"}</label>
      {options ? (
        <select value={form[k]} onChange={(e) => upd(k, e.target.value)} className={`w-full px-3 py-3 rounded-xl border text-sm bg-white transition-all ${errors[k] ? "border-red-300" : "border-stone-200"}`}>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={form[k]} onChange={(e) => upd(k, e.target.value)} placeholder={placeholder} className={`w-full px-3 py-3 rounded-xl border text-sm transition-all ${errors[k] ? "border-red-300 bg-red-50" : "border-stone-200 bg-stone-50"}`} />
      )}
      {errors[k] && <span className="text-red-500 text-xs mt-1 block">{errors[k]}</span>}
    </div>
  );

  const divisions = ["", "Dhaka", "Chittagong", "Rajshahi", "Sylhet", "Khulna", "Barishal", "Rangpur", "Mymensingh"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-stone-100 p-6">
            <h3 className="font-semibold text-stone-800 mb-5 flex items-center gap-2"><span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">1</span> Customer Information</h3>
            <div className="flex flex-wrap gap-4">
              <Field label="Full Name" k="name" placeholder="Rahim Hossain" required />
              <Field label="Phone Number" k="phone" placeholder="01XXXXXXXXX" required half />
              <Field label="Email Address" k="email" type="email" placeholder="email@example.com" half />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 p-6">
            <h3 className="font-semibold text-stone-800 mb-5 flex items-center gap-2">
              <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              Delivery Address
              {deliveryLoading && <span className="ml-auto text-xs text-stone-400"><Spinner /> Calculating...</span>}
              {cart.delivery && !deliveryLoading && (
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${cart.deliveryCharge === 0 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                  Delivery: {cart.deliveryCharge === 0 ? "Free" : fmt(cart.deliveryCharge)} ({cart.delivery.name?.replace(/_/g, " ")})
                </span>
              )}
            </h3>
            <div className="flex flex-wrap gap-4">
              <Field label="Street / House Address" k="street" placeholder="House #, Road #, Area" required />
              <Field label="Area / Thana" k="area" placeholder="Mirpur, Dhanmondi…" half />
              <Field label="City" k="city" placeholder="Dhaka" required half />
              <Field label="District" k="district" placeholder="Dhaka" half />
              <Field label="Division" k="division" half options={divisions.map((d) => ({ value: d, label: d || "Select Division" }))} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 p-6">
            <h3 className="font-semibold text-stone-800 mb-5 flex items-center gap-2"><span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">3</span> Payment Method</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[{ v: "cash_on_delivery", l: "Cash on Delivery", i: "💵" }, { v: "bkash", l: "bKash", i: "🔴" }, { v: "nagad", l: "Nagad", i: "🟠" }, { v: "rocket", l: "Rocket", i: "🟣" }].map((m) => (
                <label key={m.v} className={`flex flex-col items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all btn-bounce ${form.paymentMethod === m.v ? "border-amber-400 bg-amber-50" : "border-stone-200 hover:border-amber-200"}`}>
                  <input type="radio" name="pay" value={m.v} checked={form.paymentMethod === m.v} onChange={(e) => upd("paymentMethod", e.target.value)} className="sr-only" />
                  <span className="text-2xl">{m.i}</span>
                  <span className="text-xs font-semibold text-stone-700 text-center">{m.l}</span>
                </label>
              ))}
            </div>
            <div className="mt-4">
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Special Instructions (optional)</label>
              <textarea value={form.notes} onChange={(e) => upd("notes", e.target.value)} rows={3} placeholder="Any delivery instructions…" className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm resize-none" />
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-20 bg-white rounded-2xl border border-stone-100 p-5">
          <h3 className="font-semibold text-stone-800 mb-4">Order Summary</h3>
          <div className="max-h-60 overflow-y-auto space-y-3 mb-4">
            {cart.items.map((item) => {
              const imgSrc = (() => { if (!item.images?.length) return null; const i = item.images[0]; return typeof i === "string" ? CDN(i) : CDN(i?.url); })();
              return (
                <div key={item._id} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {imgSrc ? <img src={imgSrc} alt="" className="w-full h-full object-cover" /> : <span>🍯</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-stone-800 line-clamp-2">{item.name}</div>
                    <div className="text-xs text-stone-400">×{item.qty}</div>
                  </div>
                  <div className="text-xs font-bold text-stone-900">{fmt(item.price * item.qty)}</div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-stone-100 pt-4 space-y-2.5 text-sm">
            <div className="flex justify-between text-stone-500"><span>Subtotal</span><span className="font-medium text-stone-800">{fmt(cart.subtotal)}</span></div>
            {cart.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{fmt(cart.discount)}</span></div>}
            <div className="flex justify-between text-stone-500"><span>Delivery <span className="text-xs text-amber-600">({form.city || "—"})</span></span><span className={`font-medium ${cart.deliveryCharge === 0 ? "text-emerald-600" : "text-stone-800"}`}>{cart.deliveryCharge === 0 ? "Free" : fmt(cart.deliveryCharge)}</span></div>
            <div className="border-t border-stone-100 pt-3 flex justify-between font-bold text-stone-900 text-base">
              <span>Total</span><span>{fmt(cart.total)}</span>
            </div>
          </div>
          <button onClick={placeOrder} disabled={loading} className="mt-5 w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-900 font-bold py-4 rounded-xl btn-bounce shadow-lg shadow-amber-200 transition-all flex items-center justify-center gap-2 text-sm">
            {loading ? <><Spinner /> Placing Order…</> : `Place Order — ${fmt(cart.total)}`}
          </button>
          <p className="text-center text-stone-400 text-[11px] mt-2">🔒 Secure checkout — Your data is safe</p>
        </div>
      </div>
    </div>
  );
}

// ─── TRACK PAGE ───────────────────────────────────────────────────────────────
function TrackPage() {
  const [input, setInput] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const track = async () => {
    const num = input.trim().toUpperCase();
    if (!num) { setErr("Please enter your order number"); return; }
    setLoading(true); setErr(""); setOrder(null);
    try {
      const data = await apiFetch(`/api/orders/track/${encodeURIComponent(num)}`);
      setOrder(data.data || data);
    } catch (e) {
      setErr(e.message || "Order not found. Check your number and try again.");
    } finally {
      setLoading(false);
    }
  };

  const steps = ["pending", "confirmed", "processing", "shipped", "delivered"];
  const statusColor = { pending: "amber", confirmed: "blue", processing: "violet", shipped: "cyan", delivered: "emerald", cancelled: "red" };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">📦</div>
        <h1 className="font-display text-3xl font-bold text-stone-900 mb-2">Track Your Order</h1>
        <p className="text-stone-500">Enter your order number to see real-time status</p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 p-6 mb-6 shadow-sm">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input value={input} onChange={(e) => setInput(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && track()} placeholder="e.g. ORD-202501-00001" className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-stone-200 bg-stone-50 text-sm font-medium" />
            <div className="absolute left-3 top-1/2 -translate-y-1/2"><I d={ic.box} size={17} className="text-stone-400" /></div>
          </div>
          <button onClick={track} disabled={loading} className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-5 rounded-xl btn-bounce shadow-md shadow-amber-200 transition-colors flex items-center gap-2 text-sm disabled:opacity-60">
            {loading ? <Spinner /> : <I d={ic.search} size={16} stroke="#1a1a1a" />}
            {loading ? "…" : "Track"}
          </button>
        </div>
        {err && <p className="text-red-500 text-sm mt-3">{err}</p>}
      </div>

      {order && (
        <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm" style={{ animation: "fadeIn .3s ease" }}>
          <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
            <div>
              <p className="text-xs text-stone-400 mb-0.5">Order Number</p>
              <p className="font-bold text-lg text-stone-900">{order.orderNumber}</p>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize bg-${statusColor[order.orderStatus] || "stone"}-100 text-${statusColor[order.orderStatus] || "stone"}-700`}>
              {(order.orderStatus || "").replace(/_/g, " ")}
            </span>
          </div>

          {order.orderStatus !== "cancelled" && order.orderStatus !== "delivered" && (
            <div className="mb-7">
              <div className="flex justify-between relative">
                <div className="absolute top-4 left-[5%] right-[5%] h-0.5 bg-stone-100 z-0" />
                {steps.map((s, i) => {
                  const currentIdx = steps.indexOf(order.orderStatus || "pending");
                  const done = currentIdx >= i;
                  return (
                    <div key={s} className="flex-1 text-center relative z-10">
                      <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs font-bold transition-all ${done ? "bg-amber-500 text-white shadow-md shadow-amber-200" : "bg-stone-100 text-stone-400"}`}>
                        {done ? <I d={ic.check} size={14} stroke="white" /> : i + 1}
                      </div>
                      <div className={`text-[10px] mt-1.5 font-medium capitalize ${done ? "text-stone-700" : "text-stone-400"}`}>{s}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="bg-stone-50 rounded-xl p-4">
              <p className="text-xs text-stone-400 mb-1">Customer</p>
              <p className="font-semibold text-stone-800 text-sm">{order.customer?.name}</p>
              <p className="text-stone-500 text-xs">{order.customer?.phone}</p>
            </div>
            <div className="bg-stone-50 rounded-xl p-4">
              <p className="text-xs text-stone-400 mb-1">Delivery Address</p>
              <p className="text-stone-600 text-xs">{[order.customer?.address?.street, order.customer?.address?.area, order.customer?.address?.city].filter(Boolean).join(", ")}</p>
            </div>
          </div>

          <div className="border-t border-stone-100 pt-4">
            <p className="font-semibold text-stone-800 mb-3 text-sm">Items Ordered</p>
            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between text-sm mb-2 text-stone-600">
                <span>{item.name} <span className="text-stone-400">×{item.quantity}</span></span>
                <span className="font-semibold text-stone-800">{fmt(item.total)}</span>
              </div>
            ))}
            <div className="border-t border-stone-100 mt-3 pt-3 flex justify-between font-bold text-stone-900">
              <span>Total</span><span>{fmt(order.total)}</span>
            </div>
          </div>

          <div className="mt-4 bg-amber-50 rounded-xl px-4 py-3 text-xs text-amber-700 font-medium">
            📅 Ordered on {new Date(order.createdAt).toLocaleDateString("en-BD", { year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BLOG PAGE (FIXED - no hooks violation) ────────────────────────────────────
function BlogPage() {
  const { setPage } = useContext(NavCtx);
  const [selected, setSelected] = useState(null);
  const { data: raw, loading } = useAPI("/api/blogs?status=published&limit=12");
  const blogs = raw?.blogs || raw || [];

  // Separate component for blog detail to avoid hooks violation
  if (selected) {
    return <BlogDetail blog={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <h1 className="font-display text-3xl font-bold text-stone-900 mb-2">Honey Blog</h1>
        <p className="text-stone-500">Tips, recipes, and insights from our beekeepers</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
              <Sk className="h-44 rounded-none" />
              <div className="p-5 space-y-2"><Sk className="h-3 w-1/3" /><Sk className="h-5" /><Sk className="h-3" /></div>
            </div>
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📝</div>
          <p className="text-stone-400">No posts yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <div key={blog._id} onClick={() => setSelected(blog)} className="card-hover bg-white rounded-2xl border border-stone-100 overflow-hidden cursor-pointer">
              <div className="relative h-44 bg-amber-50 overflow-hidden">
                {blog.coverImage?.url && CDN(blog.coverImage.url) ? (
                  <img src={CDN(blog.coverImage.url)} alt={blog.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-5xl">🍯</div>
                )}
              </div>
              <div className="p-5">
                {blog.category && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mb-2 inline-block">{blog.category}</span>}
                <h3 className="font-display font-semibold text-stone-800 text-base line-clamp-2 mb-2 leading-snug">{blog.title}</h3>
                <p className="text-stone-400 text-sm line-clamp-2 mb-4">{blog.excerpt || (blog.body || "").replace(/<[^>]*>/g, "").slice(0, 100)}…</p>
                <div className="flex justify-between text-xs text-stone-400">
                  <span>{new Date(blog.publishedAt || blog.createdAt).toLocaleDateString()}</span>
                  <span>{blog.likes || 0} ❤️ · {blog.views || 0} 👁</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Blog Detail Component (separate component to avoid hooks violation)
function BlogDetail({ blog, onBack }) {
  // Fetch full blog content using _id
  const { data: fullBlog, loading } = useAPI(blog._id ? `/api/blogs/${blog._id}` : null, [], !blog._id);
  const blogData = fullBlog?.data || fullBlog || blog;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8" style={{ animation: "fadeIn .3s ease" }}>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-amber-600 mb-6 btn-bounce transition-colors font-medium">
        <I d={ic.chev_l} size={16} /> Back to Blog
      </button>

      {loading ? (
        <div className="space-y-4">
          <Sk className="h-64 rounded-2xl" />
          <Sk className="h-8 w-3/4" />
          <Sk className="h-4 w-1/2" />
          <Sk className="h-32" />
        </div>
      ) : (
        <>
          {blogData.coverImage?.url && CDN(blogData.coverImage.url) && (
            <img src={CDN(blogData.coverImage.url)} alt={blogData.title} className="w-full h-56 sm:h-72 object-cover rounded-2xl mb-7" />
          )}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {blogData.category && <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">{blogData.category}</span>}
            {blogData.tags && blogData.tags.slice(0, 2).map(tag => (
              <span key={tag} className="bg-stone-100 text-stone-600 text-xs px-2 py-1 rounded-full">#{tag}</span>
            ))}
            <span className="text-stone-400 text-xs">{new Date(blogData.publishedAt || blogData.createdAt).toLocaleDateString("en-BD", { year: "numeric", month: "long", day: "numeric" })}</span>
            <span className="text-stone-400 text-xs flex items-center gap-1"><I d={ic.eye} size={12} /> {blogData.views || 0} views</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mb-4">{blogData.title}</h1>
          <div className="prose max-w-none text-stone-600 leading-relaxed text-sm sm:text-base"
            dangerouslySetInnerHTML={{ __html: (blogData.body || blogData.content || "").replace(/\n/g, "<br>") }}
          />
          {blogData.author && (
            <div className="mt-8 pt-6 border-t border-stone-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold">
                {blogData.author.name?.[0] || "A"}
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-800">Written by {blogData.author.name}</p>
                {blogData.author.bio && <p className="text-xs text-stone-400">{blogData.author.bio}</p>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── CONTACT PAGE (FIXED - category enum) ─────────────────────────────────────
function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", orderNumber: "", message: "", category: "general" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const toast = useToast();

  // Map frontend categories to backend enum values
  const categoryMap = {
    general: "other",
    product_quality: "quality_issue",
    delivery: "delivery_issue",
    refund: "refund_request",
    other: "other"
  };

  const submit = async () => {
    if (!form.name || !form.message) { toast("Name and message are required", "error"); return; }
    setLoading(true);
    try {
      const payload = {
        customer: {
          name: form.name,
          email: form.email || "guest@example.com",
          phone: form.phone || "01700000000"
        },
        orderNumber: form.orderNumber || null,
        category: categoryMap[form.category] || "other",
        subject: form.category.replace(/_/g, " "),
        description: form.message,
      };
      const data = await apiFetch("/api/complaints", { method: "POST", body: JSON.stringify(payload) });
      setSuccess(true);
      toast("Message sent successfully! We'll get back to you soon.");
    } catch (error) {
      toast(error.message || "Failed to submit. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="text-center py-20 px-4" style={{ animation: "popIn .5s ease" }}>
      <div className="text-6xl mb-5">✅</div>
      <h2 className="font-display text-2xl font-bold text-stone-900 mb-2">Message Received!</h2>
      <p className="text-stone-400 text-sm mb-7">We'll get back to you within 24 hours.</p>
      <button onClick={() => setSuccess(false)} className="bg-amber-500 text-stone-900 font-bold px-6 py-3 rounded-xl btn-bounce">Send Another</button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-display text-3xl font-bold text-stone-900 mb-2">Contact & Support</h1>
      <p className="text-stone-500 mb-8 text-sm">Got a question or complaint? We're here 6 days a week.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {[["📧", "Email Us", "info@beeharvest.com", "Response within 24h"], ["📞", "Call Us", "01XXXXXXXXX", "Sat–Thu, 9am–8pm"], ["💬", "WhatsApp", "Chat Now", "Usually instant"], ["📍", "Location", "Dhaka, Bangladesh", "By appointment"]].map(([icon, title, info, sub]) => (
          <div key={title} className="flex items-center gap-4 bg-white rounded-2xl border border-stone-100 p-4">
            <span className="text-3xl">{icon}</span>
            <div>
              <div className="font-semibold text-stone-800 text-sm">{title}</div>
              <div className="text-amber-600 font-medium text-sm">{info}</div>
              <div className="text-stone-400 text-xs">{sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 p-6">
        <h3 className="font-semibold text-stone-800 mb-5">Submit a Complaint or Inquiry</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {[["name", "Full Name", true, "text"], ["email", "Email", false, "email"], ["phone", "Phone", false, "tel"], ["orderNumber", "Order Number (optional)", false, "text"]].map(([k, l, req, t]) => (
            <div key={k}>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">{l}{req && " *"}</label>
              <input type={t} value={form[k]} onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))} placeholder={l} className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm" />
            </div>
          ))}
        </div>
        <div className="mb-4">
          <label className="block text-xs font-semibold text-stone-500 mb-2">Issue Type</label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "general", label: "General Inquiry" },
              { value: "product_quality", label: "Product Quality" },
              { value: "delivery", label: "Delivery Issue" },
              { value: "refund", label: "Refund Request" },
              { value: "other", label: "Other" }
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setForm((p) => ({ ...p, category: opt.value }))}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium btn-bounce capitalize transition-all ${form.category === opt.value ? "bg-amber-500 border-amber-500 text-stone-900" : "border-stone-200 text-stone-500 hover:border-amber-300"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-5">
          <label className="block text-xs font-semibold text-stone-500 mb-1.5">Message *</label>
          <textarea value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} rows={4} placeholder="Describe your issue or question in detail…" className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm resize-none" />
        </div>
        <button onClick={submit} disabled={loading} className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-6 py-3 rounded-xl btn-bounce shadow-md shadow-amber-200 transition-colors flex items-center gap-2 text-sm disabled:opacity-60">
          {loading ? <><Spinner /> Submitting…</> : "Submit Message"}
        </button>
      </div>
    </div>
  );
}

// ─── CHATBOT ──────────────────────────────────────────────────────────────────
function Chatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ role: "bot", text: "Hi! 👋 I'm BeeBot. Ask me anything about our honey, orders, or delivery!" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    if (!input.trim()) return;
    const msg = input.trim();
    setInput("");
    setMsgs((p) => [...p, { role: "user", text: msg }]);
    setLoading(true);
    try {
      const data = await apiFetch("/api/chatbot/message", { method: "POST", body: JSON.stringify({ message: msg }) });
      setMsgs((p) => [...p, { role: "bot", text: data.data?.reply || data.reply || "Let me connect you with our team." }]);
    } catch {
      setMsgs((p) => [...p, { role: "bot", text: "Sorry, I'm having trouble right now. Try again soon!" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9990]">
      {open && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden" style={{ animation: "popIn .25s ease" }}>
          <div className="bg-stone-900 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-400 rounded-full flex items-center justify-center text-lg">🐝</div>
              <div>
                <div className="text-white font-semibold text-sm">BeeBot</div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  <span className="text-emerald-400 text-xs">Online</span>
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-stone-400 hover:text-white btn-bounce">
              <I d={ic.x} size={16} />
            </button>
          </div>
          <div className="h-64 overflow-y-auto p-4 bg-stone-50 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === "user" ? "bg-amber-500 text-stone-900 font-medium rounded-br-sm" : "bg-white text-stone-700 border border-stone-100 rounded-bl-sm shadow-sm"}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-stone-100 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-stone-300 rounded-full" style={{ animation: "fadeIn .5s infinite alternate" }} />
                    <span className="w-1.5 h-1.5 bg-stone-300 rounded-full" style={{ animation: "fadeIn .5s .15s infinite alternate" }} />
                    <span className="w-1.5 h-1.5 bg-stone-300 rounded-full" style={{ animation: "fadeIn .5s .3s infinite alternate" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="p-3 bg-white border-t border-stone-100 flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a message…" className="flex-1 px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm" />
            <button onClick={send} disabled={loading} className="bg-amber-500 hover:bg-amber-400 text-stone-900 p-2.5 rounded-xl btn-bounce transition-colors disabled:opacity-60">
              <I d={ic.chev_r} size={16} stroke="#1a1a1a" />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-amber-400 hover:bg-amber-500 shadow-xl shadow-amber-300/50 btn-bounce transition-all flex items-center justify-center text-2xl"
        style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .3s ease" }}
      >
        {open ? <I d={ic.x} size={20} stroke="#1a1a1a" /> : "🐝"}
      </button>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPageRaw] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (window.location.search && !window.location.search.includes('page=')) {
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("page");
    const id = params.get("id");
    const order = params.get("order");
    if (p === "product" && id) setPageRaw(`product:${id}`);
    else if (order) setPageRaw("track");
    else if (p) setPageRaw(p);
  }, []);

  const setPage = useCallback((p) => {
    setPageRaw(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
    const params = new URLSearchParams();
    if (p.startsWith("product:")) {
      params.set("page", "product");
      params.set("id", p.split(":")[1]);
    }
    else if (p !== "home") params.set("page", p);
    const newUrl = params.toString() ? `?${params}` : window.location.pathname;
    window.history.pushState({}, "", newUrl);
  }, []);

  useEffect(() => {
    const handler = () => {
      const params = new URLSearchParams(window.location.search);
      const p = params.get("page");
      const id = params.get("id");
      if (p === "product" && id) setPageRaw(`product:${id}`);
      else setPageRaw(p || "home");
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const productId = page.startsWith("product:") ? page.split(":")[1] : null;

  const renderPage = () => {
    if (productId) return <ProductPage productId={productId} />;
    switch (page) {
      case "home": return <HomePage />;
      case "shop": return <ShopPage />;
      case "cart": return <CartPage />;
      case "checkout": return <CheckoutPage />;
      case "track": return <TrackPage />;
      case "blog": return <BlogPage />;
      case "contact": return <ContactPage />;
      default: return <HomePage />;
    }
  };

  return (
    <NavCtx.Provider value={{ page, setPage, searchQuery, setSearchQuery }}>
      <ToastProvider>
        <CartProvider>
          <TailwindLoader />
          <GlobalStyles />
          <div className="min-h-screen bg-stone-50">
            <Navbar />
            <main>{renderPage()}</main>
            <Chatbot />
          </div>
        </CartProvider>
      </ToastProvider>
    </NavCtx.Provider>
  );
}
