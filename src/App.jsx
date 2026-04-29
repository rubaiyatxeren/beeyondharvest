import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

// ─── Tailwind + Fonts ────────────────────────────────────────────────────────
const TailwindLoader = () => {
  useEffect(() => {
    if (!document.getElementById("tw-cdn")) {
      const s = document.createElement("script"); s.id = "tw-cdn"; s.src = "https://cdn.tailwindcss.com"; document.head.appendChild(s);
    }
    if (!document.getElementById("gf-cdn")) {
      const l = document.createElement("link"); l.id = "gf-cdn"; l.rel = "stylesheet";
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
  if (typeof image === "object" && image.url) { const u = image.url; if (!u?.trim()) return null; return u.startsWith("http") ? u : `${API}${u}`; }
  if (typeof image === "string") { if (!image.trim()) return null; return image.startsWith("http") ? image : `${API}${image}`; }
  return null;
};

// ─── CONTEXTS ────────────────────────────────────────────────────────────────
const CartCtx = createContext(null);
const ToastCtx = createContext(null);
const NavCtx = createContext(null);

// ─── UTILS ───────────────────────────────────────────────────────────────────
const fmt = (n) => "৳" + Number(n || 0).toLocaleString("en-BD");

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, { ...opts, headers: { "Content-Type": "application/json", ...opts.headers } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

const apiCache = new Map();
let activeRequests = new Map();

function useAPI(path, deps = [], skip = false) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (skip || !path) { setLoading(false); return; }
    const cacheKey = path;
    if (apiCache.has(cacheKey)) { setData(apiCache.get(cacheKey)); setLoading(false); return; }
    if (activeRequests.has(cacheKey)) { activeRequests.get(cacheKey).then(setData).catch(setError).finally(() => setLoading(false)); return; }
    setLoading(true);
    const request = apiFetch(path).then((d) => { const result = d.data ?? d; apiCache.set(cacheKey, result); setData(result); setLoading(false); return result; })
      .catch((e) => { setError(e.message); setLoading(false); throw e; })
      .finally(() => activeRequests.delete(cacheKey));
    activeRequests.set(cacheKey, request);
  }, [path, skip, ...deps]);
  return { data, loading, error, setData };
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "success") => {
    const id = Date.now(); setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={add}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} style={{ animation: "slideUp .3s ease" }}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold shadow-2xl border pointer-events-auto ${t.type === "error" ? "bg-red-50 text-red-700 border-red-200" : t.type === "warn" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
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
  const [items, setItems] = useState(() => { try { return JSON.parse(localStorage.getItem("bh_cart2") || "[]"); } catch { return []; } });
  const [coupon, setCoupon] = useState(null);
  const [delivery, setDelivery] = useState(null);
  useEffect(() => { localStorage.setItem("bh_cart2", JSON.stringify(items)); }, [items]);
  const add = (product, qty = 1) => setItems((p) => { const ex = p.find((i) => i._id === product._id); if (ex) return p.map((i) => i._id === product._id ? { ...i, qty: i.qty + qty } : i); return [...p, { ...product, qty }]; });
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
    @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
    @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    @keyframes spin    { to{transform:rotate(360deg)} }
    @keyframes popIn   { 0%{transform:scale(.85);opacity:0} 80%{transform:scale(1.04)} 100%{transform:scale(1);opacity:1} }
    * { font-family:'DM Sans',system-ui,sans-serif; box-sizing:border-box; }
    h1,h2,h3,.font-display { font-family:'Playfair Display',Georgia,serif; }
    .shimmer { background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; }
    .card-hover { transition:transform .22s ease,box-shadow .22s ease; }
    .card-hover:hover { transform:translateY(-5px); box-shadow:0 20px 48px rgba(0,0,0,.11); }
    .btn-bounce:active { transform:scale(.96); }
    ::-webkit-scrollbar { width:5px; height:5px; }
    ::-webkit-scrollbar-track { background:#f5f5f5; }
    ::-webkit-scrollbar-thumb { background:#d4d4d4; border-radius:4px; }
    input:focus,select:focus,textarea:focus { outline:none; border-color:#d97706!important; box-shadow:0 0 0 3px rgba(217,119,106,.12); }
    .line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
    .line-clamp-3 { display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
    .prose p { margin-bottom:1rem; line-height:1.6; }
    .prose img { max-width:100%; border-radius:1rem; margin:1rem 0; }
    .prose h2 { font-size:1.5rem; font-family:'Playfair Display',serif; margin:1.5rem 0 .5rem; }
    .prose h3 { font-size:1.25rem; font-family:'Playfair Display',serif; margin:1.5rem 0 .5rem; }
    .prose ul,.prose ol { margin:.5rem 0 1rem 1.5rem; }
  `}</style>
);

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
const Sk = ({ className = "" }) => <div className={`shimmer rounded-xl ${className}`} />;
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
const Spinner = () => <svg style={{ animation: "spin .7s linear infinite" }} className="inline-block" width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx={12} cy={12} r={10} strokeOpacity={.25} /><path d="M12 2a10 10 0 0 1 10 10" /></svg>;
const I = ({ d, size = 18, className = "", fill = "none", stroke = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className={className}><path d={d} /></svg>
);
const ic = {
  cart: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0",
  search: "m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
  menu: "M4 6h16M4 12h16M4 18h16",
  x: "M18 6 6 18M6 6l12 12",
  heart: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  plus: "M12 5v14M5 12h14", minus: "M5 12h14", check: "M20 6 9 17l-5-5",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01",
  truck: "M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM18.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  box: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
  home: "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  chev_r: "m9 18 6-6-6-6", chev_l: "m15 18-6-6 6-6", chev_d: "m6 9 6 6 6-6",
  blog: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  map: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  headset: "M3 18v-6a9 9 0 0 1 18 0v6M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z",
  ticket: "M15 5v2M15 11v2M15 17v2M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  send: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  upload: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
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
    { id: "complaint", label: "Support", icon: ic.headset },
    { id: "transfer", label: "BeeTransfer", icon: ic.send },
    // { id: "contact", label: "Contact", icon: ic.phone },
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
            <button key={l.id} onClick={() => setPage(l.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all btn-bounce ${page === l.id || page.startsWith(l.id + ":") ? "bg-amber-50 text-amber-700 font-semibold" : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"}`}>
              {l.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {searchOpen ? (
            <div className="flex items-center gap-2">
              <input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { setPage("shop"); setSearchOpen(false); } }}
                placeholder="Search honey…" className="w-40 sm:w-52 px-3 py-1.5 rounded-lg border border-amber-200 text-sm bg-amber-50 focus:bg-white transition-all" />
              <button onClick={() => setSearchOpen(false)} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 btn-bounce"><I d={ic.x} size={16} /></button>
            </div>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 btn-bounce"><I d={ic.search} size={19} /></button>
          )}
          <button onClick={() => setPage("cart")} className="relative p-2 rounded-lg text-stone-500 hover:bg-amber-50 btn-bounce">
            <I d={ic.cart} size={20} />
            {cart.count > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold rounded-full min-w-[18px] px-1 flex items-center justify-center">{cart.count > 99 ? "99+" : cart.count}</span>
            )}
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg text-stone-500 hover:bg-stone-100 btn-bounce"><I d={menuOpen ? ic.x : ic.menu} size={20} /></button>
        </div>
      </div>
      {menuOpen && (
        <div className="md:hidden border-t border-amber-50 bg-white px-4 py-2 pb-4" style={{ animation: "fadeIn .18s ease" }}>
          {links.map((l) => (
            <button key={l.id} onClick={() => { setPage(l.id); setMenuOpen(false); }}
              className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium mb-1 transition-all ${page === l.id ? "bg-amber-50 text-amber-700 font-semibold" : "text-stone-600"}`}>
              <I d={l.icon} size={17} />{l.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
function ProductCard({ product, onView }) {
  const [wished, setWished] = useState(false);
  const cart = useCart();
  const toast = useToast();
  const imgSrc = (() => { if (!product.images?.length) return null; const img = product.images[0]; return typeof img === "string" ? CDN(img) : CDN(img?.url); })();
  const disc = product.comparePrice > product.price ? Math.round((1 - product.price / product.comparePrice) * 100) : 0;
  return (
    <div onClick={() => onView(product)} className="card-hover bg-white rounded-2xl border border-stone-100 overflow-hidden cursor-pointer group">
      <div className="relative bg-amber-50 overflow-hidden" style={{ paddingBottom: "72%" }}>
        {imgSrc ? <img src={imgSrc} alt={product.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="absolute inset-0 flex items-center justify-center text-6xl">🍯</div>}
        {disc > 0 && <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">-{disc}%</span>}
        {product.stock === 0 && <div className="absolute inset-0 bg-white/70 flex items-center justify-center"><span className="bg-stone-100 text-stone-500 text-xs font-semibold px-3 py-1.5 rounded-full">Out of Stock</span></div>}
        <button onClick={(e) => { e.stopPropagation(); setWished(!wished); toast(wished ? "Removed from wishlist" : "Added to wishlist 💛", wished ? "warn" : "success"); }}
          className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity btn-bounce">
          <I d={ic.heart} size={14} stroke={wished ? "#ef4444" : "#aaa"} fill={wished ? "#ef4444" : "none"} />
        </button>
      </div>
      <div className="p-4">
        <p className="text-xs text-amber-600 font-semibold mb-1">{product.category?.name || "Honey"}</p>
        <h3 className="font-display font-semibold text-stone-800 text-[15px] line-clamp-2 mb-2 leading-snug">{product.name}</h3>
        <div className="flex items-center gap-2 mb-3">
          <Stars rating={product.ratings?.average || product.avgRating || 0} />
          {(product.ratings?.count > 0 || product.reviewCount > 0) && <span className="text-xs text-stone-400">({product.ratings?.count || product.reviewCount})</span>}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-stone-900">{fmt(product.price)}</span>
            {disc > 0 && <span className="text-xs text-stone-400 line-through ml-1.5">{fmt(product.comparePrice)}</span>}
          </div>
          {product.stock > 0 && (
            <button onClick={(e) => { e.stopPropagation(); cart.add(product); toast(`${product.name} added! 🍯`); }}
              className="w-9 h-9 bg-amber-500 hover:bg-amber-600 text-white rounded-xl flex items-center justify-center btn-bounce shadow-md shadow-amber-200 transition-colors">
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
  const { setPage } = useContext(NavCtx);
  const { data: rawFeatured, loading: featLoading } = useAPI("/api/products?featured=true&limit=8");
  const { data: rawCategories } = useAPI("/api/categories");
  const featured = rawFeatured?.products || rawFeatured || [];
  const cats = rawCategories?.categories || rawCategories || [];
  return (
    <div>
      <div className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 min-h-[540px] flex items-center">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #f59e0b 0%, transparent 60%), radial-gradient(circle at 80% 20%, #d97706 0%, transparent 50%)" }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full py-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div style={{ animation: "slideUp .6s ease" }}>
            <span className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-full mb-5 border border-amber-500/30">🍯 Pure · Raw · Organic</span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5">Nature's Finest<br /><span className="text-amber-400">Golden Honey</span></h1>
            <p className="text-stone-300 text-base sm:text-lg leading-relaxed mb-8 max-w-md">Direct from Bangladeshi beekeepers to your table. No additives, no shortcuts — just pure, lab-tested honey at its best.</p>
            <div className="flex gap-3 flex-wrap">
              <button onClick={() => setPage("shop")} className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-6 py-3 rounded-xl flex items-center gap-2 btn-bounce shadow-xl shadow-amber-900/40 transition-colors text-sm"><I d={ic.grid} size={17} stroke="#1a1a1a" /> Shop Now</button>
              <button onClick={() => setPage("track")} className="border border-stone-600 text-stone-200 hover:bg-stone-700/50 font-semibold px-6 py-3 rounded-xl flex items-center gap-2 btn-bounce transition-colors text-sm"><I d={ic.truck} size={17} stroke="#e5e7eb" /> Track Order</button>
            </div>
          </div>
          <div className="flex justify-center items-center" style={{ animation: "popIn .8s ease" }}>
            <div className="relative"><div className="absolute inset-0 bg-amber-400 opacity-20 rounded-full blur-3xl scale-150" /><span className="text-[140px] sm:text-[180px] drop-shadow-2xl relative z-10">🍯</span></div>
          </div>
        </div>
      </div>
      <div className="bg-amber-500">
        <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[["🍯", "100% Pure", "No Additives"], ["🌿", "Organic", "Lab Tested"], ["🚚", "24–48h", "Fast Delivery"], ["⭐", "50K+", "Happy Customers"]].map(([icon, val, label]) => (
            <div key={label} className="text-center py-2"><div className="text-2xl">{icon}</div><div className="font-bold text-stone-900 font-display">{val}</div><div className="text-xs text-amber-800 font-medium">{label}</div></div>
          ))}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10"><h2 className="font-display text-3xl font-bold text-stone-900 mb-2">Shop by Category</h2><p className="text-stone-500">Explore our curated honey collection</p></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {cats.length > 0 ? cats.slice(0, 6).map((cat) => (
            <div key={cat._id} onClick={() => setPage("shop")} className="card-hover bg-white rounded-2xl border border-stone-100 p-5 text-center cursor-pointer">
              <div className="w-14 h-14 mx-auto mb-3 rounded-xl overflow-hidden bg-amber-50 flex items-center justify-center">
                {CDN(cat.image) ? <img src={CDN(cat.image)} alt={cat.name} className="w-full h-full object-cover" /> : <span className="text-3xl">🍯</span>}
              </div>
              <div className="font-semibold text-stone-800 text-sm">{cat.name}</div>
              {cat.productCount > 0 && <div className="text-xs text-stone-400 mt-0.5">{cat.productCount} items</div>}
            </div>
          )) : Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-stone-100 p-5"><Sk className="w-14 h-14 mx-auto mb-3" /><Sk className="h-3 w-3/4 mx-auto" /></div>)}
        </div>
      </div>
      <div className="bg-stone-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-10">
            <div><h2 className="font-display text-3xl font-bold text-stone-900 mb-1">Featured Products</h2><p className="text-stone-500">Handpicked bestsellers</p></div>
            <button onClick={() => setPage("shop")} className="text-amber-600 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all btn-bounce">View All <I d={ic.chev_r} size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featLoading ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-stone-100 overflow-hidden"><Sk className="h-48 rounded-none" /><div className="p-4 space-y-2"><Sk className="h-3 w-1/3" /><Sk className="h-4" /><Sk className="h-3 w-1/2" /></div></div>)
              : featured.slice(0, 8).map((p) => <ProductCard key={p._id} product={p} onView={() => setPage(`product:${p._id}`)} />)}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="font-display text-3xl font-bold text-stone-900 text-center mb-10">Why BeeHarvest?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[["🌿", "100% Organic", "No artificial additives, preservatives, or flavoring — ever."], ["🔬", "Lab Tested", "Every batch independently tested for purity & quality."], ["🚚", "Fast Delivery", "Nationwide delivery within 24–48 hours."], ["💰", "Best Price", "Direct from beekeepers — no middlemen markup."]].map(([icon, title, desc]) => (
            <div key={title} className="bg-white rounded-2xl border border-stone-100 p-6 text-center card-hover"><div className="text-4xl mb-4">{icon}</div><h3 className="font-display font-semibold text-stone-800 text-base mb-2">{title}</h3><p className="text-stone-500 text-sm leading-relaxed">{desc}</p></div>
          ))}
        </div>
      </div>
      <div className="bg-gradient-to-r from-amber-400 to-amber-500 py-16 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-5xl mb-4">🎁</div>
          <h2 className="font-display text-3xl font-bold text-stone-900 mb-3">First Order? Save 10%!</h2>
          <p className="text-amber-900/80 mb-6">Use code <strong className="bg-white/40 px-2 py-0.5 rounded-lg">WELCOME10</strong> at checkout</p>
          <button onClick={() => setPage("shop")} className="bg-stone-900 text-white font-bold px-8 py-3.5 rounded-xl btn-bounce hover:bg-stone-800 transition-colors shadow-xl text-sm">Start Shopping →</button>
        </div>
      </div>
      <footer className="bg-stone-900 text-stone-300 py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div><div className="font-display text-xl font-bold text-white mb-3">🍯 BeeHarvest</div><p className="text-sm leading-relaxed text-stone-400">Pure honey, straight from the hive. Trusted by 50,000+ customers across Bangladesh.</p></div>
          {[{ title: "Quick Links", links: ["Home", "Shop", "Blog", "Track Order", "Contact"] }, { title: "Policies", links: ["Returns", "Shipping", "Privacy Policy", "Terms of Service"] }, { title: "Contact", links: ["📧 info@beeharvest.com", "📞 01XXXXXXXXX", "📍 Dhaka, Bangladesh"] }].map((col) => (
            <div key={col.title}><div className="font-semibold text-white mb-3 text-sm">{col.title}</div>{col.links.map((l) => <div key={l} className="text-stone-400 text-sm mb-2 cursor-pointer hover:text-amber-400 transition-colors">{l}</div>)}</div>
          ))}
        </div>
        <div className="border-t border-stone-800 pt-6 text-center text-stone-500 text-xs">© 2024 BeeHarvest. All rights reserved. Made with 🍯 in Bangladesh.</div>
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
    p.set("page", filters.page); p.set("limit", 12);
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
        <div><h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">All Products</h1><p className="text-stone-500 text-sm mt-0.5">{total} products found</p></div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium btn-bounce transition-all ${sidebarOpen ? "bg-amber-50 border-amber-200 text-amber-700" : "border-stone-200 text-stone-600"}`}><I d={ic.filter} size={15} /> Filters</button>
          <select value={filters.sort} onChange={(e) => setF("sort", e.target.value)} className="border border-stone-200 rounded-xl px-3 py-2 text-sm font-medium bg-white text-stone-700">
            <option value="-createdAt">Newest First</option><option value="price">Price: Low → High</option><option value="-price">Price: High → Low</option><option value="-avgRating">Best Rated</option><option value="-salesCount">Most Popular</option>
          </select>
        </div>
      </div>
      <div className="relative mb-6">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"><I d={ic.search} size={17} className="text-stone-400" /></div>
        <input value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setFilters((f) => ({ ...f, page: 1 })); }} placeholder="Search products…" className="w-full pl-10 pr-10 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm transition-all" />
        {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"><I d={ic.x} size={15} /></button>}
      </div>
      <div className="flex gap-6 items-start">
        {sidebarOpen && (
          <div className="hidden sm:block w-56 flex-shrink-0 bg-white rounded-2xl border border-stone-100 p-5 sticky top-20" style={{ animation: "slideUp .2s ease" }}>
            <h3 className="font-semibold text-stone-800 text-sm mb-4">Categories</h3>
            {[{ _id: "", name: "All Categories" }, ...cats].map((cat) => (
              <button key={cat._id} onClick={() => setF("category", cat._id)}
                className={`block w-full text-left px-3 py-2 rounded-xl text-sm mb-1 transition-all btn-bounce ${filters.category === cat._id ? "bg-amber-50 text-amber-700 font-semibold" : "text-stone-600 hover:bg-stone-50"}`}>{cat.name}</button>
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
          {loading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{Array.from({ length: 9 }).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-stone-100 overflow-hidden"><Sk className="h-48 rounded-none" /><div className="p-4 space-y-2"><Sk className="h-3 w-1/3" /><Sk className="h-4" /><Sk className="h-3 w-1/2" /></div></div>)}</div>
            : products.length === 0 ? <div className="text-center py-20"><div className="text-6xl mb-4">🔍</div><h3 className="font-display text-xl font-semibold text-stone-700 mb-2">No products found</h3><p className="text-stone-400 text-sm">Try different search terms or clear filters</p></div>
              : <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-5">{products.map((p) => <ProductCard key={p._id} product={p} onView={() => setPage(`product:${p._id}`)} />)}</div>}
          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              <button disabled={filters.page === 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))} className="p-2 rounded-xl border border-stone-200 disabled:opacity-40 hover:bg-stone-50 btn-bounce"><I d={ic.chev_l} size={16} /></button>
              {Array.from({ length: Math.min(7, pages) }, (_, i) => i + 1).map((p) => <button key={p} onClick={() => setFilters((f) => ({ ...f, page: p }))} className={`w-9 h-9 rounded-xl text-sm font-medium btn-bounce border transition-all ${filters.page === p ? "bg-amber-500 text-white border-amber-500 shadow-md" : "border-stone-200 hover:border-amber-300 text-stone-600"}`}>{p}</button>)}
              <button disabled={filters.page === pages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))} className="p-2 rounded-xl border border-stone-200 disabled:opacity-40 hover:bg-stone-50 btn-bounce"><I d={ic.chev_r} size={16} /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCT DETAIL ───────────────────────────────────────────────────────────
function ProductPage({ productId }) {
  const { setPage } = useContext(NavCtx);
  const { data: raw, loading } = useAPI(`/api/products/${productId}`);
  const { data: rawReviews } = useAPI(`/api/reviews/product/${productId}`);
  const cart = useCart(); const toast = useToast();
  const [qty, setQty] = useState(1); const [activeImg, setActiveImg] = useState(0); const [tab, setTab] = useState("description");
  const p = raw?.product || raw;
  const reviews = rawReviews?.reviews || rawReviews || [];
  if (loading) return <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10"><div className="grid grid-cols-1 md:grid-cols-2 gap-10"><Sk className="h-96" /><div className="space-y-4"><Sk className="h-8 w-3/4" /><Sk className="h-5 w-1/2" /><Sk className="h-24" /><Sk className="h-12" /></div></div></div>;
  if (!p) return <div className="text-center py-20 text-stone-500">Product not found.</div>;
  const images = p.images || [];
  const disc = p.originalPrice > p.price ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ animation: "fadeIn .3s ease" }}>
      <div className="flex items-center gap-1.5 text-xs text-stone-400 mb-8 flex-wrap">
        <button onClick={() => setPage("home")} className="hover:text-amber-600 transition-colors font-medium">Home</button>
        <I d={ic.chev_r} size={12} /><button onClick={() => setPage("shop")} className="hover:text-amber-600 transition-colors font-medium">Shop</button>
        <I d={ic.chev_r} size={12} /><span className="text-stone-600 font-medium line-clamp-1">{p.name}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
        <div>
          <div className="bg-amber-50 rounded-2xl overflow-hidden aspect-square flex items-center justify-center mb-3">
            {images[activeImg] ? <img src={CDN(images[activeImg])} alt={p.name} className="w-full h-full object-cover" /> : <span className="text-9xl">🍯</span>}
          </div>
          {images.length > 1 && <div className="flex gap-2 flex-wrap">{images.map((img, i) => <button key={i} onClick={() => setActiveImg(i)} className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all btn-bounce ${activeImg === i ? "border-amber-500" : "border-transparent"}`}><img src={CDN(img)} alt="" className="w-full h-full object-cover" /></button>)}</div>}
        </div>
        <div>
          <span className="inline-block bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">{p.category?.name || "Honey"}</span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mb-3 leading-tight">{p.name}</h1>
          <div className="flex items-center gap-3 mb-4"><Stars rating={p.avgRating || 0} size={18} /><span className="text-stone-400 text-sm">({reviews.length} reviews)</span></div>
          <div className="flex items-baseline gap-3 mb-5">
            <span className="text-3xl font-bold text-stone-900">{fmt(p.price)}</span>
            {disc > 0 && <><span className="text-stone-400 line-through text-lg">{fmt(p.originalPrice)}</span><span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">Save {disc}%</span></>}
          </div>
          <p className="text-stone-600 leading-relaxed mb-5 text-sm">{p.description || "Premium quality honey, pure and natural."}</p>
          <div className="mb-5">
            <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full ${p.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              <span>{p.stock > 0 ? "✓" : "✗"}</span>{p.stock > 0 ? `In Stock (${p.stock} available)` : "Out of Stock"}
            </span>
            {p.sku && <span className="ml-3 text-xs text-stone-400">SKU: {p.sku}</span>}
          </div>
          {p.stock > 0 && (
            <div className="flex gap-3 mb-6 flex-wrap">
              <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-11 h-11 flex items-center justify-center bg-stone-50 hover:bg-stone-100 btn-bounce text-stone-600"><I d={ic.minus} size={15} /></button>
                <span className="w-12 text-center font-bold text-stone-900">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(p.stock, q + 1))} className="w-11 h-11 flex items-center justify-center bg-stone-50 hover:bg-stone-100 btn-bounce text-stone-600"><I d={ic.plus} size={15} /></button>
              </div>
              <button onClick={() => { cart.add(p, qty); toast(`${qty}× ${p.name} added! 🍯`); }} className="flex-1 min-w-[160px] bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold rounded-xl flex items-center justify-center gap-2 btn-bounce shadow-lg shadow-amber-200 transition-colors text-sm py-3">
                <I d={ic.cart} size={17} stroke="#1a1a1a" /> Add to Cart — {fmt(p.price * qty)}
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {[["🚚", "Free delivery over ৳500"], ["🔄", "7-day easy returns"], ["🔒", "Secure checkout"], ["✅", "Quality guaranteed"]].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-2 bg-stone-50 rounded-xl px-3 py-2.5 text-xs text-stone-600 font-medium"><span>{icon}</span>{text}</div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        <div className="flex border-b border-stone-100">
          {["description", "reviews", "faq"].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-5 sm:px-8 py-4 text-sm font-medium capitalize transition-all border-b-2 ${tab === t ? "border-amber-500 text-amber-700 font-semibold" : "border-transparent text-stone-500 hover:text-stone-700"}`}>{t} {t === "reviews" && `(${reviews.length})`}</button>
          ))}
        </div>
        <div className="p-6 sm:p-8">
          {tab === "description" && <p className="text-stone-600 leading-relaxed">{p.description || "Pure, natural honey with no additives. Sourced from trusted beekeepers across Bangladesh."}</p>}
          {tab === "reviews" && (
            reviews.length === 0 ? <div className="text-center py-10"><div className="text-5xl mb-3">⭐</div><p className="text-stone-400 text-sm">No reviews yet. Be the first!</p></div>
              : reviews.map((r) => (
                <div key={r._id} className="border-b border-stone-50 last:border-0 pb-5 mb-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-sm">{(r.reviewer?.name || r.name || "A")[0].toUpperCase()}</div>
                      <div><div className="font-semibold text-stone-800 text-sm">{r.reviewer?.name || r.name || "Anonymous"}</div><Stars rating={r.rating} size={13} /></div>
                    </div>
                    <span className="text-stone-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.title && <div className="font-semibold text-stone-700 mt-3 mb-1 text-sm">{r.title}</div>}
                  <p className="text-stone-500 text-sm leading-relaxed mt-2">{r.body || r.review}</p>
                </div>
              ))
          )}
          {tab === "faq" && (
            <div className="space-y-3">
              {[["Is the honey raw?", "Yes — all our honey is raw and unprocessed."], ["How to store?", "Store in a cool, dry place away from sunlight."], ["Does honey expire?", "Honey never truly expires. Crystallization is normal."], ["Bulk orders?", "Contact us for bulk orders with special pricing."]].map(([q, a]) => (
                <div key={q} className="bg-stone-50 rounded-xl p-5"><div className="font-semibold text-stone-800 mb-2 text-sm">Q: {q}</div><div className="text-stone-500 text-sm leading-relaxed">A: {a}</div></div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CART PAGE ────────────────────────────────────────────────────────────────
// ─── CART PAGE WITH REQUIRED DELIVERY LOCATION ────────────────────────────────
function CartPage() {
  const { setPage } = useContext(NavCtx);
  const cart = useCart(); const toast = useToast();
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState(cart.delivery?.city || "");
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState("");

  const cities = [
    "Dhaka", "Chittagong", "Rajshahi", "Sylhet", "Khulna",
    "Barishal", "Rangpur", "Mymensingh", "Comilla", "Narayanganj",
    "Gazipur", "Cox's Bazar", "Jessore", "Bogra", "Dinajpur"
  ];

  useEffect(() => {
    if (!selectedCity) {
      cart.setDelivery(null);
      return;
    }

    setDeliveryLoading(true);
    setDeliveryError("");
    const params = new URLSearchParams({ city: selectedCity, subtotal: cart.subtotal });

    fetch(`${API}/api/delivery-charges/active?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          cart.setDelivery({ ...d.data, city: selectedCity });
        } else {
          setDeliveryError("Delivery not available for this location");
          cart.setDelivery(null);
        }
      })
      .catch(() => {
        setDeliveryError("Error calculating delivery");
        cart.setDelivery(null);
      })
      .finally(() => setDeliveryLoading(false));
  }, [selectedCity, cart.subtotal]);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const data = await apiFetch("/api/coupons/validate", { method: "POST", body: JSON.stringify({ code: couponCode, subtotal: cart.subtotal }) });
      const disc = data.data?.discountAmount || data.data?.value || 0;
      cart.setCoupon({ code: couponCode, type: data.data?.type || "flat", value: disc });
      toast(`Coupon applied! You save ${fmt(disc)} 🎉`);
    } catch (e) { toast(e.message || "Invalid coupon code", "error"); } finally { setCouponLoading(false); }
  };

  const proceedToCheckout = () => {
    if (!selectedCity) {
      toast("Please select a delivery location", "error");
      return;
    }
    if (!cart.delivery) {
      toast("Please wait for delivery calculation", "error");
      return;
    }

    // Save checkout info for autofill in checkout page
    localStorage.setItem("bh_checkout_info", JSON.stringify({
      checkoutCity: selectedCity,
      checkoutDelivery: cart.delivery
    }));
    setPage("checkout");
  };

  if (cart.items.length === 0) return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="text-7xl mb-5">🛒</div>
      <h2 className="font-display text-2xl font-bold text-stone-800 mb-2">Your cart is empty</h2>
      <p className="text-stone-400 text-sm mb-7">Add some delicious honey to get started!</p>
      <button onClick={() => setPage("shop")} className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-7 py-3 rounded-xl btn-bounce transition-colors shadow-lg shadow-amber-200">Browse Products</button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mb-8">Shopping Cart <span className="text-stone-400 font-normal text-xl">({cart.count})</span></h1>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
        <div className="space-y-4">
          {cart.items.map((item) => {
            const imgSrc = (() => { if (!item.images?.length) return null; const i = item.images[0]; return typeof i === "string" ? CDN(i) : CDN(i?.url); })();
            return (
              <div key={item._id} className="bg-white rounded-2xl border border-stone-100 p-4 flex gap-4 items-center" style={{ animation: "fadeIn .2s ease" }}>
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-amber-50 flex-shrink-0 flex items-center justify-center">{imgSrc ? <img src={imgSrc} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-3xl">🍯</span>}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-stone-800 text-sm mb-0.5 line-clamp-2">{item.name}</h3>
                  <p className="text-amber-600 text-xs font-medium mb-3">{fmt(item.price)} each</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden">
                      <button onClick={() => cart.update(item._id, item.qty - 1)} className="w-8 h-8 bg-stone-50 flex items-center justify-center hover:bg-stone-100 btn-bounce text-stone-600"><I d={ic.minus} size={13} /></button>
                      <span className="w-9 text-center text-sm font-bold text-stone-900">{item.qty}</span>
                      <button onClick={() => cart.update(item._id, item.qty + 1)} className="w-8 h-8 bg-stone-50 flex items-center justify-center hover:bg-stone-100 btn-bounce text-stone-600"><I d={ic.plus} size={13} /></button>
                    </div>
                    <button onClick={() => { cart.remove(item._id); toast(`${item.name} removed`, "warn"); }} className="p-1.5 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 btn-bounce"><I d={ic.trash} size={14} stroke="#ef4444" /></button>
                  </div>
                </div>
                <div className="font-bold text-stone-900 text-base flex-shrink-0">{fmt(item.price * item.qty)}</div>
              </div>
            );
          })}
        </div>
        <div className="lg:sticky lg:top-20 space-y-4">
          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <h3 className="font-semibold text-stone-800 mb-3 text-sm flex items-center gap-2"><I d={ic.map} size={16} className="text-amber-600" /> Delivery Location *</h3>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm bg-stone-50"
              required
            >
              <option value="">Select your city</option>
              {cities.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
            {deliveryLoading && <div className="mt-2 text-xs text-stone-400 flex items-center gap-1"><Spinner /> Calculating delivery...</div>}
            {deliveryError && <div className="mt-2 text-xs text-red-500">{deliveryError}</div>}
            {cart.delivery && !deliveryLoading && !deliveryError && (
              <div className={`mt-3 text-xs flex items-center gap-1.5 ${cart.delivery.amount === 0 ? "text-emerald-600" : "text-amber-600"}`}>
                <I d={ic.truck} size={12} />{cart.delivery.amount === 0 ? "Free Delivery" : `Delivery Fee: ${fmt(cart.delivery.amount)}`}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <h3 className="font-semibold text-stone-800 mb-3 text-sm flex items-center gap-2"><I d={ic.tag} size={16} className="text-amber-600" /> Coupon Code</h3>
            {cart.coupon ? (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
                <span className="text-emerald-600">✓</span><span className="flex-1 text-emerald-700 font-semibold text-sm">{cart.coupon.code} — Save {fmt(cart.discount)}</span>
                <button onClick={() => cart.setCoupon(null)} className="text-emerald-400 hover:text-emerald-600 btn-bounce"><I d={ic.x} size={14} /></button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && applyCoupon()} placeholder="Enter code…" className="flex-1 px-3 py-2.5 rounded-xl border border-stone-200 text-sm bg-stone-50" />
                <button onClick={applyCoupon} disabled={couponLoading} className="bg-stone-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold btn-bounce hover:bg-stone-700 transition-colors disabled:opacity-60 flex items-center gap-1.5">{couponLoading ? <Spinner /> : "Apply"}</button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <h3 className="font-semibold text-stone-800 mb-4">Order Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-stone-600"><span>Subtotal</span><span className="font-semibold text-stone-900">{fmt(cart.subtotal)}</span></div>
              {cart.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span className="font-semibold">-{fmt(cart.discount)}</span></div>}
              <div className="flex justify-between text-stone-600"><span>Delivery</span><span className={`font-semibold ${cart.deliveryCharge === 0 ? "text-emerald-600" : "text-stone-900"}`}>{cart.deliveryCharge === 0 ? "Free" : fmt(cart.deliveryCharge)}</span></div>
              <div className="border-t border-stone-100 pt-3 flex justify-between font-bold text-stone-900 text-base"><span>Total</span><span>{fmt(cart.total)}</span></div>
            </div>
            <button
              onClick={proceedToCheckout}
              disabled={!selectedCity || !cart.delivery || deliveryLoading}
              className="mt-5 w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-900 font-bold py-3.5 rounded-xl btn-bounce shadow-lg shadow-amber-200 transition-colors flex items-center justify-center gap-2"
            >
              <I d={ic.check} size={18} stroke="#1a1a1a" /> Proceed to Checkout
            </button>
            <button onClick={() => setPage("shop")} className="mt-2 w-full py-2.5 rounded-xl text-stone-500 text-sm hover:bg-stone-50 btn-bounce transition-colors">Continue Shopping</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CHECKOUT PAGE ────────────────────────────────────────────────────────────
function CheckoutPage() {
  const { setPage } = useContext(NavCtx);
  const cart = useCart(); const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    street: "", city: "", zipCode: "",
    paymentMethod: "cash_on_delivery", notes: ""
  });
  const [errors, setErrors] = useState({});

  // NEW: Load checkout info from localStorage for autofill including city
  useEffect(() => {
    // Load checkout info from localStorage for autofill
    try {
      const saved = JSON.parse(localStorage.getItem("bh_checkout_info") || "{}");
      setForm(fd => ({
        ...fd,
        name: fd.name || saved.checkoutName || "",
        email: fd.email || saved.checkoutEmail || "",
        phone: fd.phone || saved.checkoutPhone || "",
        city: fd.city || saved.checkoutCity || cart.delivery?.city || ""
      }));
    } catch { }
  }, [cart.delivery?.city]);

  // UPDATED: Use form.city instead of cart.delivery?.city for delivery calculation
  useEffect(() => {
    if (!form.city) return;
    setDeliveryLoading(true);
    const params = new URLSearchParams({ city: form.city, subtotal: cart.subtotal });
    fetch(`${API}/api/delivery-charges/active?${params}`).then(r => r.json()).then(d => {
      if (d.success && d.data) cart.setDelivery(d.data);
    }).catch(() => { }).finally(() => setDeliveryLoading(false));
  }, [form.city, cart.subtotal]);

  const upd = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setErrors((p) => ({ ...p, [k]: "" })); };
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name required";
    if (!form.phone.match(/^01[3-9]\d{8}$/)) e.phone = "Enter valid BD phone (01XXXXXXXXX)";
    if (form.email && !form.email.includes("@")) e.email = "Invalid email";
    if (!form.street.trim()) e.street = "Street address required";
    if (!form.city.trim()) e.city = "City required";
    if (!form.zipCode.trim()) e.zipCode = "Zip code required";
    setErrors(e); return !Object.keys(e).length;
  };

  const placeOrder = async () => {
    if (!validate()) { toast("Please fix the errors", "error"); return; }
    setLoading(true);
    try {
      const payload = {
        customer: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: {
            street: form.street,
            city: form.city,
            zipCode: form.zipCode
          }
        },
        items: cart.items.map((i) => ({ product: i._id, name: i.name, sku: i.sku || "", quantity: i.qty, price: i.price, total: i.price * i.qty })),
        subtotal: cart.subtotal, deliveryCharge: cart.deliveryCharge, discount: cart.discount, total: cart.total,
        paymentMethod: form.paymentMethod, notes: form.notes, couponCode: cart.coupon?.code,
      };
      const data = await apiFetch("/api/orders", { method: "POST", body: JSON.stringify(payload) });
      setSuccess(data.data || data); cart.clear();
    } catch (e) { toast(e.message || "Failed to place order. Try again.", "error"); } finally { setLoading(false); }
  };

  const cities = [
    "Dhaka", "Chittagong", "Rajshahi", "Sylhet", "Khulna",
    "Barishal", "Rangpur", "Mymensingh", "Comilla", "Narayanganj",
    "Gazipur", "Cox's Bazar", "Jessore", "Bogra", "Dinajpur"
  ];

  // ── Order Slip Download ──────────────────────────────────────────────────
  const downloadSlip = (orderData) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 800;
    canvas.height = 950;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header
    ctx.fillStyle = "#0D1B3E";
    ctx.fillRect(0, 0, canvas.width, 110);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText("🍯 BeeHarvest", 40, 50);
    ctx.font = "13px sans-serif";
    ctx.fillText("Bangladesh's Trusted Honey Shop", 40, 78);

    let y = 145;
    ctx.fillStyle = "#F5A623";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(`Order: ${orderData.orderNumber || "—"}`, 40, y);
    y += 35;

    ctx.fillStyle = "#666";
    ctx.font = "13px sans-serif";
    ctx.fillText(`Date: ${new Date().toLocaleDateString("en-BD", { year: "numeric", month: "long", day: "numeric" })}`, 40, y);
    y += 30;

    // Divider
    ctx.strokeStyle = "#eee";
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(760, y);
    ctx.stroke();
    y += 25;

    // Customer Info
    ctx.fillStyle = "#0D1B3E";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("Customer Info", 40, y);
    y += 25;
    ctx.fillStyle = "#333";
    ctx.font = "14px sans-serif";
    ctx.fillText(`Name: ${orderData.customer?.name || "—"}`, 40, y);
    y += 22;
    ctx.fillText(`Phone: ${orderData.customer?.phone || "—"}`, 40, y);
    y += 22;
    ctx.fillText(`Address: ${orderData.customer?.address?.street || ""}, ${orderData.customer?.address?.city || ""}`, 40, y);
    y += 30;

    // Divider
    ctx.strokeStyle = "#eee";
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(760, y);
    ctx.stroke();
    y += 25;

    // Items Header
    ctx.fillStyle = "#0D1B3E";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("Items", 40, y);
    y += 25;

    // Column Headers
    ctx.fillStyle = "#1A2E5A";
    ctx.fillRect(40, y, 720, 34);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("Product", 55, y + 22);
    ctx.fillText("Qty", 460, y + 22);
    ctx.fillText("Price", 540, y + 22);
    ctx.fillText("Total", 650, y + 22);
    y += 44;

    // ============ FIX: Use orderData.items instead of cart.items ============
    const itemsToShow = orderData.items || orderData.orderItems || [];

    ctx.font = "13px sans-serif";
    itemsToShow.forEach((item, idx) => {
      if (idx % 2 === 0) {
        ctx.fillStyle = "#f9f9f9";
        ctx.fillRect(40, y - 8, 720, 34);
      }
      ctx.fillStyle = "#333";
      let name = item.name || "Product";
      if (name.length > 40) name = name.slice(0, 37) + "...";
      ctx.fillText(name, 55, y + 14);
      ctx.fillText(`x${item.quantity || item.qty || 1}`, 460, y + 14);
      ctx.fillText(`${(item.price || 0).toLocaleString()} BDT`, 540, y + 14);
      ctx.fillText(`${((item.price || 0) * (item.quantity || item.qty || 1)).toLocaleString()} BDT`, 640, y + 14);
      y += 34;
    });

    y += 20;
    ctx.strokeStyle = "#eee";
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(760, y);
    ctx.stroke();
    y += 25;

    // Totals
    ctx.fillStyle = "#333";
    ctx.font = "14px sans-serif";
    ctx.fillText("Subtotal:", 100, y);
    ctx.fillText(`${(orderData.subtotal || 0).toLocaleString()} BDT`, 640, y);
    y += 22;

    if (orderData.discount > 0) {
      ctx.fillText("Discount:", 100, y);
      ctx.fillText(`-${(orderData.discount || 0).toLocaleString()} BDT`, 640, y);
      y += 22;
    }

    ctx.fillText("Delivery:", 100, y);
    ctx.fillText(`${(orderData.deliveryCharge || 0).toLocaleString()} BDT`, 640, y);
    y += 22;

    ctx.fillStyle = "#0D1B3E";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("Total:", 100, y);
    ctx.fillText(`${(orderData.total || 0).toLocaleString()} BDT`, 640, y);
    y += 50;

    // Footer
    ctx.fillStyle = "#666";
    ctx.font = "13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Thank you for shopping with BeeHarvest!", 400, y);
    y += 22;
    ctx.fillText("Support: 01700-000000 | info@beeharvest.com", 400, y);

    // Download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `beeharvest_order_${orderData.orderNumber || "slip"}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };


  if (success) return (
    <div className="max-w-xl mx-auto text-center px-4 py-20" style={{ animation: "popIn .5s ease" }}>
      <div className="text-7xl mb-5">{success.fraudVerdict === "review" ? "🛡️" : "🎉"}</div>
      <h2 className="font-display text-2xl font-bold text-stone-900 mb-2">{success.fraudVerdict === "review" ? "Order Received!" : "Order Placed!"}</h2>
      {success.fraudVerdict === "review" && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-5 text-left">
          <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm mb-1"><I d={ic.shield} size={14} stroke="#6366F1" /> Under Security Review</div>
          <p className="text-indigo-600 text-xs">Your order is under review. We'll contact you within 24 hours.</p>
        </div>
      )}
      <p className="text-stone-500 text-sm mb-5">Your order number is:</p>
      <div className="bg-amber-50 border border-amber-200 text-stone-900 text-2xl font-bold py-4 px-6 rounded-2xl mb-5 tracking-widest inline-block">{success.orderNumber || success._id}</div>
      <p className="text-stone-400 text-sm mb-8">Save this number to track your order. We'll update you via email.</p>
      <div className="flex gap-3 justify-center flex-wrap">
        <button onClick={() => setPage("track")} className="bg-stone-900 text-white px-5 py-3 rounded-xl btn-bounce text-sm font-semibold flex items-center gap-2"><I d={ic.truck} size={16} stroke="white" /> Track Order</button>
        <button onClick={() => downloadSlip({ ...success, items: cart.items })} className="border border-stone-200 px-5 py-3 rounded-xl btn-bounce text-sm font-medium text-stone-600 hover:bg-stone-50 flex items-center gap-2"><I d={ic.download} size={15} /> Download Slip</button>
        <button onClick={() => setPage("shop")} className="border border-stone-200 px-5 py-3 rounded-xl btn-bounce text-sm font-medium text-stone-600 hover:bg-stone-50">Continue Shopping</button>
      </div>
    </div>
  );

  const Field = ({ label, k, type = "text", placeholder, options, required = false, half = false }) => (
    <div className={half ? "w-full sm:w-[calc(50%-8px)]" : "w-full"}>
      <label className="block text-xs font-semibold text-stone-500 mb-1.5">{label}{required && " *"}</label>
      {options ? (
        <select value={form[k]} onChange={(e) => upd(k, e.target.value)} className={`w-full px-3 py-3 rounded-xl border text-sm bg-white transition-all ${errors[k] ? "border-red-300" : "border-stone-200"}`}>
          <option value="">Select {label}</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={form[k]} onChange={(e) => upd(k, e.target.value)} placeholder={placeholder} className={`w-full px-3 py-3 rounded-xl border text-sm transition-all ${errors[k] ? "border-red-300 bg-red-50" : "border-stone-200 bg-stone-50"}`} />
      )}
      {errors[k] && <span className="text-red-500 text-xs mt-1 block">{errors[k]}</span>}
    </div>
  );

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
              <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">2</span> Delivery Address
              {deliveryLoading && <span className="ml-auto text-xs text-stone-400"><Spinner /> Calculating...</span>}
              {cart.delivery && !deliveryLoading && (
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${cart.deliveryCharge === 0 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                  Delivery: {cart.deliveryCharge === 0 ? "Free" : fmt(cart.deliveryCharge)}
                </span>
              )}
            </h3>
            <div className="flex flex-wrap gap-4">
              <Field label="Street Address" k="street" placeholder="House #, Road #, Area" required />
              <Field label="City/District" k="city" placeholder="Select your city" required options={cities} />
              <Field label="Zip Code" k="zipCode" placeholder="e.g. 1200" required />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-stone-100 p-6">
            <h3 className="font-semibold text-stone-800 mb-5 flex items-center gap-2"><span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">3</span> Payment Method</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[{ v: "cash_on_delivery", l: "Cash on Delivery", i: "💵" }, { v: "bkash", l: "bKash", i: "🔴" }, { v: "nagad", l: "Nagad", i: "🟠" }, { v: "rocket", l: "Rocket", i: "🟣" }].map((m) => (
                <label key={m.v} className={`flex flex-col items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all btn-bounce ${form.paymentMethod === m.v ? "border-amber-400 bg-amber-50" : "border-stone-200 hover:border-amber-200"}`}>
                  <input type="radio" name="pay" value={m.v} checked={form.paymentMethod === m.v} onChange={(e) => upd("paymentMethod", e.target.value)} className="sr-only" />
                  <span className="text-2xl">{m.i}</span><span className="text-xs font-semibold text-stone-700 text-center">{m.l}</span>
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
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden">{imgSrc ? <img src={imgSrc} alt="" className="w-full h-full object-cover" /> : <span>🍯</span>}</div>
                  <div className="flex-1 min-w-0"><div className="text-xs font-semibold text-stone-800 line-clamp-2">{item.name}</div><div className="text-xs text-stone-400">×{item.qty}</div></div>
                  <div className="text-xs font-bold text-stone-900">{fmt(item.price * item.qty)}</div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-stone-100 pt-4 space-y-2.5 text-sm">
            <div className="flex justify-between text-stone-500"><span>Subtotal</span><span className="font-medium text-stone-800">{fmt(cart.subtotal)}</span></div>
            {cart.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{fmt(cart.discount)}</span></div>}
            <div className="flex justify-between text-stone-500"><span>Delivery <span className="text-xs text-amber-600">({form.city || "—"})</span></span><span className={`font-medium ${cart.deliveryCharge === 0 ? "text-emerald-600" : "text-stone-800"}`}>{cart.deliveryCharge === 0 ? "Free" : fmt(cart.deliveryCharge)}</span></div>
            <div className="border-t border-stone-100 pt-3 flex justify-between font-bold text-stone-900 text-base"><span>Total</span><span>{fmt(cart.total)}</span></div>
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

// ─── TRACK PAGE ENHANCEMENT ───────────────────────────────────────────────────
function TrackPage() {
  const [input, setInput] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [mobileOrders, setMobileOrders] = useState([]);
  const [mobileLoading, setMobileLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("order");
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [autoTrackedOrder, setAutoTrackedOrder] = useState(null);

  // Auto-refresh order status every 30 seconds when order is not delivered/cancelled
  useEffect(() => {
    if (order && !["delivered", "cancelled"].includes(order.orderStatus)) {
      const interval = setInterval(() => {
        track(); // Refresh the current order
      }, 30000);
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    }
    return () => clearInterval(refreshInterval);
  }, [order]);

  const track = async (orderNumber = null) => {
    const num = orderNumber || input.trim().toUpperCase();
    if (!num) { setErr("Please enter your order number"); return; }
    setLoading(true); setErr("");
    try {
      const data = await apiFetch(`/api/orders/track/${encodeURIComponent(num)}`);
      setOrder(data.data || data);
    } catch (e) { setErr(e.message || "Order not found."); }
    finally { setLoading(false); }
  };

  const trackByPhone = async () => {
    if (!/^01[3-9]\d{8}$/.test(phoneInput)) { return; }
    setMobileLoading(true);
    try {
      const res = await fetch(`${API}/api/orders/phone/${encodeURIComponent(phoneInput)}`);
      const data = await res.json();
      setMobileOrders(data.data || []);
    } catch (e) { setMobileOrders([]); } finally { setMobileLoading(false); }
  };

  // NEW: Auto-track order when user selects from mobile orders list
  const handleOrderSelect = (orderData) => {
    setAutoTrackedOrder(orderData.orderNumber);
    setInput(orderData.orderNumber);
    setActiveTab("order");
    // Give a small delay for the tab switch to complete, then track
    setTimeout(() => {
      track(orderData.orderNumber);
    }, 100);
  };

  const steps = ["pending", "confirmed", "processing", "shipped", "delivered"];
  const statusLabels = {
    pending: "Order Received",
    confirmed: "Order Confirmed",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled"
  };

  const statusDetails = {
    pending: "We've received your order and are preparing it for processing.",
    confirmed: "Your order has been confirmed and is being processed.",
    processing: "Your items are being packed and prepared for shipment.",
    shipped: "Your order is on the way! Track your delivery below.",
    delivered: "Your order has been successfully delivered.",
    cancelled: "This order has been cancelled."
  };

  const statusColor = {
    pending: "amber", confirmed: "blue", processing: "violet",
    shipped: "cyan", delivered: "emerald", cancelled: "red"
  };

  const statusBg = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-blue-100 text-blue-700",
    processing: "bg-violet-100 text-violet-700",
    shipped: "bg-cyan-100 text-cyan-700",
    delivered: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-red-100 text-red-700"
  };

  const formatAddress = (address) => {
    if (!address) return "No address provided";
    return `${address.street || ''}${address.area ? `, ${address.area}` : ''}${address.city ? `, ${address.city}` : ''}${address.district ? `, ${address.district}` : ''}${address.division ? `, ${address.division}` : ''}${address.postalCode ? ` - ${address.postalCode}` : ''}`.replace(/^,\s*/, '');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">📦</div>
        <h1 className="font-display text-3xl font-bold text-stone-900 mb-2">Track Your Order</h1>
        <p className="text-stone-500">Real-time order status and tracking</p>
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-xl border border-stone-200 overflow-hidden mb-6 bg-white">
        <button onClick={() => setActiveTab("order")} className={`flex-1 py-2.5 text-sm font-semibold transition-all ${activeTab === "order" ? "bg-amber-500 text-stone-900" : "text-stone-500 hover:bg-stone-50"}`}>By Order Number</button>
        <button onClick={() => setActiveTab("mobile")} className={`flex-1 py-2.5 text-sm font-semibold transition-all ${activeTab === "mobile" ? "bg-amber-500 text-stone-900" : "text-stone-500 hover:bg-stone-50"}`}>By Mobile Number</button>
      </div>

      {activeTab === "order" && (
        <>
          <div className="bg-white rounded-2xl border border-stone-100 p-6 mb-6 shadow-sm">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && track()}
                  placeholder="e.g. ORD-202501-00001"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-stone-200 bg-stone-50 text-sm font-medium"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2"><I d={ic.box} size={17} className="text-stone-400" /></div>
              </div>
              <button onClick={() => track()} disabled={loading} className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-5 rounded-xl btn-bounce shadow-md shadow-amber-200 transition-colors flex items-center gap-2 text-sm disabled:opacity-60">
                {loading ? <Spinner /> : <I d={ic.search} size={16} stroke="#1a1a1a" />}{loading ? "…" : "Track"}
              </button>
            </div>
            {err && <p className="text-red-500 text-sm mt-3">{err}</p>}
          </div>

          {order && (
            <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm" style={{ animation: "fadeIn .3s ease" }}>
              {/* Real-time status indicator */}
              {!["delivered", "cancelled"].includes(order.orderStatus) && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-center gap-3">
                  <I d={ic.refresh} size={16} className="text-blue-600 animate-spin" />
                  <div className="text-blue-700 text-xs">
                    <span className="font-semibold">Live Tracking:</span> This page updates automatically every 30 seconds
                  </div>
                </div>
              )}

              {/* Fraud banner */}
              {order.fraudVerdict === "review" && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 mb-4 flex items-center gap-3">
                  <I d={ic.shield} size={16} stroke="#6366F1" />
                  <div><div className="text-indigo-700 font-semibold text-xs">Under Security Review</div><div className="text-indigo-600 text-xs">We'll confirm your order within 24 hours.</div></div>
                </div>
              )}

              {order.fraudVerdict === "blocked" && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-3">
                  <I d={ic.shield} size={16} stroke="#ef4444" />
                  <div><div className="text-red-700 font-semibold text-xs">Order Cancelled — Security Check Failed</div><div className="text-red-600 text-xs">Contact support: 01700-000000</div></div>
                </div>
              )}

              <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
                <div>
                  <p className="text-xs text-stone-400 mb-0.5">Order Number</p>
                  <p className="font-bold text-lg text-stone-900">{order.orderNumber}</p>
                  <p className="text-xs text-stone-400 mt-1">
                    Placed on {new Date(order.createdAt).toLocaleDateString("en-BD", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize ${statusBg[order.orderStatus] || "bg-stone-100 text-stone-700"}`}>
                    {statusLabels[order.orderStatus] || order.orderStatus}
                  </span>
                  <p className="text-xs text-stone-400 mt-1">
                    {statusDetails[order.orderStatus]}
                  </p>
                </div>
              </div>

              {/* Progress tracker */}
              {order.orderStatus !== "cancelled" && (
                <div className="mb-7">
                  <div className="flex justify-between relative">
                    <div className="absolute top-4 left-[5%] right-[5%] h-0.5 bg-stone-100 z-0" />
                    {steps.map((s, i) => {
                      const currentIdx = steps.indexOf(order.orderStatus || "pending");
                      const done = currentIdx >= i;
                      const active = currentIdx === i;
                      return (
                        <div key={s} className="flex-1 text-center relative z-10">
                          <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs font-bold transition-all ${done ? "bg-amber-500 text-white shadow-md shadow-amber-200" : active ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-400"}`}>
                            {done ? <I d={ic.check} size={14} stroke="white" /> : i + 1}
                          </div>
                          <div className={`text-[10px] mt-1.5 font-medium capitalize ${done || active ? "text-stone-700" : "text-stone-400"}`}>
                            {statusLabels[s]}
                          </div>
                          {active && order.estimatedDelivery && (
                            <div className="text-[9px] text-amber-600 mt-1">
                              Est: {new Date(order.estimatedDelivery).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Delivery tracking info */}
              {order.trackingNumber && (
                <div className="bg-stone-50 rounded-xl p-4 mb-5">
                  <div className="flex items-center gap-3 mb-2">
                    <I d={ic.truck} size={16} className="text-amber-600" />
                    <div>
                      <div className="font-semibold text-stone-800 text-sm">Tracking Number</div>
                      <div className="text-stone-600 text-sm font-mono">{order.trackingNumber}</div>
                    </div>
                  </div>
                  {order.deliveryPartner && (
                    <div className="text-xs text-stone-500">Delivery Partner: {order.deliveryPartner}</div>
                  )}
                  {order.deliveryDate && (
                    <div className="text-xs text-stone-500 mt-1">
                      Expected Delivery: {new Date(order.deliveryDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div className="bg-stone-50 rounded-xl p-4">
                  <p className="text-xs text-stone-400 mb-1">Customer</p>
                  <p className="font-semibold text-stone-800 text-sm">{order.customer?.name}</p>
                  <p className="text-stone-500 text-xs">{order.customer?.phone}</p>
                  {order.customer?.email && (
                    <p className="text-stone-500 text-xs">{order.customer.email}</p>
                  )}
                </div>

                <div className="bg-stone-50 rounded-xl p-4">
                  <p className="text-xs text-stone-400 mb-1">Delivery Address</p>
                  <p className="text-stone-600 text-xs leading-relaxed">
                    {formatAddress(order.customer?.address)}
                  </p>
                </div>
              </div>

              {/* Payment information */}
              <div className="bg-stone-50 rounded-xl p-4 mb-5">
                <p className="text-xs text-stone-400 mb-1">Payment Information</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-stone-600 capitalize">
                    {order.paymentMethod?.replace(/_/g, ' ')}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                    order.paymentStatus === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="border-t border-stone-100 pt-4">
                <p className="font-semibold text-stone-800 mb-3 text-sm">Items Ordered</p>
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm mb-3 pb-2 border-b border-stone-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                        🍯
                      </div>
                      <div>
                        <div className="font-semibold text-stone-800 text-sm">{item.name}</div>
                        <div className="text-stone-400 text-xs">Qty: {item.quantity} × {fmt(item.price)}</div>
                      </div>
                    </div>
                    <span className="font-semibold text-stone-800">{fmt(item.total)}</span>
                  </div>
                ))}

                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600 mb-2 pt-2">
                    <span>Coupon Discount</span>
                    <span>-{fmt(order.discount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm text-stone-500 mb-2">
                  <span>Subtotal</span>
                  <span>{fmt(order.subtotal)}</span>
                </div>

                <div className="flex justify-between text-sm text-stone-500 mb-2">
                  <span>Delivery Charge</span>
                  <span>{fmt(order.deliveryCharge)}</span>
                </div>

                <div className="border-t border-stone-100 mt-3 pt-3 flex justify-between font-bold text-stone-900 text-base">
                  <span>Total</span>
                  <span>{fmt(order.total)}</span>
                </div>
              </div>

              {/* Support contact */}
              <div className="mt-5 bg-amber-50 rounded-xl p-4 text-center">
                <p className="text-xs text-amber-700">
                  Need help? Contact support at <strong>01700-000000</strong> or email <strong>support@beeharvest.com</strong>
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Mobile number tracking tab */}
      {activeTab === "mobile" && (
        <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm">
          <h3 className="font-semibold text-stone-800 mb-4 text-sm">Find orders by mobile number</h3>
          <div className="flex gap-3 mb-4">
            <input value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && trackByPhone()} placeholder="01XXXXXXXXX" className="flex-1 px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm" />
            <button onClick={trackByPhone} disabled={mobileLoading} className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-5 rounded-xl btn-bounce text-sm disabled:opacity-60 flex items-center gap-2">{mobileLoading ? <Spinner /> : <I d={ic.search} size={16} stroke="#1a1a1a" />} {mobileLoading ? "…" : "Search"}</button>
          </div>

          {mobileOrders.length === 0 && !mobileLoading && (
            <p className="text-stone-400 text-sm text-center py-6">Enter your mobile number to see all orders</p>
          )}

          {mobileOrders.map((o) => (
            <div key={o._id} className="border border-stone-100 rounded-xl p-4 mb-3 cursor-pointer hover:border-amber-200 transition-colors" onClick={() => handleOrderSelect(o)}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-stone-800 text-sm font-mono">{o.orderNumber}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${statusBg[o.orderStatus] || "bg-stone-100 text-stone-700"}`}>
                  {(o.orderStatus || "").replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                <span className="font-semibold text-stone-700">{fmt(o.total)}</span>
              </div>
              {o.fraudVerdict === "review" && (
                <div className="mt-2 text-xs text-indigo-600 flex items-center gap-1">
                  <I d={ic.shield} size={11} stroke="#6366F1" /> Under review
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



// ─── COMPLAINT PAGE ───────────────────────────────────────────────────────────
const COMPLAINT_CATEGORIES = [
  { key: "wrong_product", icon: "📦", label: "Wrong Product" },
  { key: "damaged_product", icon: "💔", label: "Damaged Product" },
  { key: "missing_item", icon: "🔍", label: "Missing Item" },
  { key: "delivery_issue", icon: "🚚", label: "Delivery Issue" },
  { key: "payment_issue", icon: "💳", label: "Payment Issue" },
  { key: "refund_request", icon: "💰", label: "Refund Request" },
  { key: "quality_issue", icon: "⚠️", label: "Quality Issue" },
  { key: "late_delivery", icon: "⏰", label: "Late Delivery" },
  { key: "rude_behavior", icon: "😤", label: "Rude Behavior" },
  { key: "other", icon: "📝", label: "Other" },
];

const STATUS_LABELS = {
  open: { label: "Open", cls: "bg-blue-100 text-blue-700" },
  under_review: { label: "Under Review", cls: "bg-violet-100 text-violet-700" },
  on_hold: { label: "On Hold", cls: "bg-amber-100 text-amber-700" },
  escalated: { label: "Escalated", cls: "bg-orange-100 text-orange-700" },
  resolved: { label: "Resolved ✅", cls: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rejected", cls: "bg-stone-100 text-stone-600" },
  closed: { label: "Closed 🔒", cls: "bg-stone-100 text-stone-500" },
};

function ComplaintPage() {
  const [tab, setTab] = useState("form"); // "form" | "track"
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", orderNumber: "", subject: "", description: "" });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [ticketResult, setTicketResult] = useState(null);
  const [errors, setErrors] = useState({});

  // Track state
  const [trackTicket, setTrackTicket] = useState("");
  const [trackEmail, setTrackEmail] = useState("");
  const [tracking, setTracking] = useState(false);
  const [trackedComplaint, setTrackedComplaint] = useState(null);
  const [trackErr, setTrackErr] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [rating, setRating] = useState(0);
  const toast = useToast();

  // Load checkout info autofill
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("bh_checkout_info") || "{}");
      setFormData(fd => ({
        ...fd,
        name: fd.name || saved.checkoutName || "",
        email: fd.email || saved.checkoutEmail || "",
        phone: fd.phone || saved.checkoutPhone || "",
      }));
    } catch { }
  }, []);

  const upd = (k, v) => setFormData(fd => ({ ...fd, [k]: v }));

  const validateStep2 = () => {
    const e = {};
    if (!formData.name.trim()) e.name = "Name required";
    if (!formData.email || !formData.email.includes("@")) e.email = "Valid email required";
    if (formData.phone && !/^01[3-9]\d{8}$/.test(formData.phone)) e.phone = "Invalid BD phone";
    setErrors(e); return !Object.keys(e).length;
  };
  const validateStep3 = () => {
    const e = {};
    if (!formData.subject.trim()) e.subject = "Subject required";
    if (formData.description.length < 20) e.description = "Min 20 characters";
    setErrors(e); return !Object.keys(e).length;
  };

  const handleFileSelect = (e) => {
    const newFiles = Array.from(e.target.files).filter(f => {
      if (files.length >= 5) { toast("Max 5 files", "error"); return false; }
      if (f.size > 5 * 1024 * 1024) { toast(`${f.name} too large (max 5MB)`, "error"); return false; }
      return true;
    });
    setFiles(prev => [...prev, ...newFiles].slice(0, 5));
    e.target.value = "";
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("customer", JSON.stringify({ name: formData.name, email: formData.email, phone: formData.phone || undefined }));
      fd.append("category", category);
      fd.append("subject", formData.subject);
      fd.append("description", formData.description);
      if (formData.orderNumber) fd.append("orderNumber", formData.orderNumber);
      files.forEach(f => fd.append("attachments", f));
      const res = await fetch(`${API}/api/complaints`, { method: "POST", body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Submission failed");
      setTicketResult(data.data);
    } catch (e) { toast(e.message || "Failed to submit", "error"); } finally { setSubmitting(false); }
  };

  const trackComplaint = async () => {
    if (!trackTicket.trim() || !trackEmail.trim()) { setTrackErr("Enter ticket number and email"); return; }
    setTracking(true); setTrackErr(""); setTrackedComplaint(null);
    try {
      const res = await fetch(`${API}/api/complaints/track/${encodeURIComponent(trackTicket.toUpperCase())}?email=${encodeURIComponent(trackEmail)}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Not found");
      setTrackedComplaint(data.data);
    } catch (e) { setTrackErr(e.message || "Ticket not found"); } finally { setTracking(false); }
  };

  const sendReply = async () => {
    if (!replyText.trim() || replyText.length < 5) { toast("Message too short", "error"); return; }
    setReplySending(true);
    try {
      const res = await fetch(`${API}/api/complaints/${trackedComplaint._id}/customer-reply`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: replyText, email: trackedComplaint.customer?.email }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast("Reply sent!", "success"); setReplyText("");
      await trackComplaint();
    } catch (e) { toast(e.message || "Failed to send", "error"); } finally { setReplySending(false); }
  };

  const submitRating = async (score) => {
    if (!trackedComplaint) return;
    setRating(score);
    try {
      await fetch(`${API}/api/complaints/satisfaction`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ score, ticketNumber: trackedComplaint.ticketNumber, email: trackedComplaint.customer?.email }) });
      toast("Rating submitted! Thank you 🙏", "success");
    } catch { }
  };

  if (ticketResult) return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center" style={{ animation: "popIn .5s ease" }}>
      <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 shadow-xl shadow-amber-200">✓</div>
      <h2 className="font-display text-2xl font-bold text-stone-900 mb-2">Complaint Submitted!</h2>
      <p className="text-stone-500 mb-5">Your ticket number is:</p>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl py-4 px-6 text-2xl font-bold text-stone-900 tracking-widest inline-block mb-5">{ticketResult.ticketNumber}</div>
      <p className="text-stone-400 text-sm mb-8">Save this number. We'll respond within 24 hours.</p>
      <div className="flex gap-3 justify-center flex-wrap">
        <button onClick={() => { setTab("track"); setTrackTicket(ticketResult.ticketNumber); setTicketResult(null); }} className="bg-stone-900 text-white px-5 py-3 rounded-xl btn-bounce text-sm font-semibold flex items-center gap-2"><I d={ic.search} size={15} stroke="white" /> Track Ticket</button>
        <button onClick={() => { setTicketResult(null); setStep(1); setCategory(null); setFormData({ name: "", email: "", phone: "", orderNumber: "", subject: "", description: "" }); setFiles([]); }} className="border border-stone-200 px-5 py-3 rounded-xl btn-bounce text-sm font-medium text-stone-600 hover:bg-stone-50">New Complaint</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg shadow-amber-200">🎧</div>
        <h1 className="font-display text-3xl font-bold text-stone-900 mb-2">Support & Complaints</h1>
        <p className="text-stone-500 text-sm">We respond within 24 hours</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[["24h", "Avg Response"], ["95%", "Resolution Rate"], ["4.8★", "Customer Rating"]].map(([val, label]) => (
          <div key={label} className="bg-white rounded-2xl border border-stone-100 p-4 text-center">
            <div className="font-display text-xl font-bold text-stone-900">{val}</div>
            <div className="text-xs text-stone-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-xl border border-stone-200 overflow-hidden mb-6 bg-white">
        <button onClick={() => setTab("form")} className={`flex-1 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${tab === "form" ? "bg-amber-500 text-stone-900" : "text-stone-500 hover:bg-stone-50"}`}><I d={ic.send} size={14} /> Submit Complaint</button>
        <button onClick={() => setTab("track")} className={`flex-1 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${tab === "track" ? "bg-amber-500 text-stone-900" : "text-stone-500 hover:bg-stone-50"}`}><I d={ic.ticket} size={14} /> Track Ticket</button>
      </div>

      {/* FORM TAB */}
      {tab === "form" && (
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          {/* Step bar */}
          <div className="flex items-center gap-2 p-5 border-b border-stone-100 bg-stone-50">
            {["Category", "Your Info", "Details", "Review"].map((label, i) => {
              const s = i + 1; const done = step > s; const active = step === s;
              return (
                <div key={s} className="flex items-center flex-1">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${done ? "bg-amber-500 text-white" : active ? "bg-stone-900 text-white" : "bg-stone-200 text-stone-400"}`}>{done ? "✓" : s}</div>
                    <span className={`text-xs font-medium hidden sm:block ${active ? "text-stone-900" : "text-stone-400"}`}>{label}</span>
                  </div>
                  {i < 3 && <div className={`flex-1 h-0.5 mx-2 ${done ? "bg-amber-500" : "bg-stone-200"}`} />}
                </div>
              );
            })}
          </div>

          <div className="p-6">
            {step === 1 && (
              <>
                <p className="text-sm text-stone-500 mb-4">What type of issue are you experiencing?</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                  {COMPLAINT_CATEGORIES.map((c) => (
                    <button key={c.key} onClick={() => setCategory(c.key)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all btn-bounce ${category === c.key ? "border-amber-400 bg-amber-50" : "border-stone-200 hover:border-amber-200"}`}>
                      <span className="text-2xl">{c.icon}</span>
                      <span className="text-xs font-semibold text-stone-700 text-center leading-tight">{c.label}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => { if (!category) { toast("Please select a category", "error"); return; } setStep(2); }}
                  disabled={!category} className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-900 font-bold py-3 rounded-xl btn-bounce transition-colors">
                  Next <I d={ic.chev_r} size={16} stroke="#1a1a1a" className="inline" />
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 mb-1.5">Full Name *</label>
                    <input value={formData.name} onChange={(e) => upd("name", e.target.value)} placeholder="Your name" className={`w-full px-3 py-3 rounded-xl border text-sm ${errors.name ? "border-red-300 bg-red-50" : "border-stone-200 bg-stone-50"}`} />
                    {errors.name && <span className="text-red-500 text-xs mt-1 block">{errors.name}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 mb-1.5">Email *</label>
                    <input type="email" value={formData.email} onChange={(e) => upd("email", e.target.value)} placeholder="email@example.com" className={`w-full px-3 py-3 rounded-xl border text-sm ${errors.email ? "border-red-300 bg-red-50" : "border-stone-200 bg-stone-50"}`} />
                    {errors.email && <span className="text-red-500 text-xs mt-1 block">{errors.email}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 mb-1.5">Phone (optional)</label>
                    <input value={formData.phone} onChange={(e) => upd("phone", e.target.value)} placeholder="01XXXXXXXXX" className={`w-full px-3 py-3 rounded-xl border text-sm ${errors.phone ? "border-red-300 bg-red-50" : "border-stone-200 bg-stone-50"}`} />
                    {errors.phone && <span className="text-red-500 text-xs mt-1 block">{errors.phone}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 mb-1.5">Order Number (optional)</label>
                    <input value={formData.orderNumber} onChange={(e) => upd("orderNumber", e.target.value.toUpperCase())} placeholder="ORD-2025XX-XXXXX" className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="px-5 py-3 rounded-xl border border-stone-200 text-stone-600 text-sm btn-bounce hover:bg-stone-50"><I d={ic.chev_l} size={15} className="inline" /> Back</button>
                  <button onClick={() => { if (validateStep2()) setStep(3); }} className="flex-1 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold py-3 rounded-xl btn-bounce transition-colors">Next <I d={ic.chev_r} size={16} stroke="#1a1a1a" className="inline" /></button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-stone-500 mb-1.5">Subject *</label>
                  <input value={formData.subject} onChange={(e) => upd("subject", e.target.value)} maxLength={200} placeholder="Brief description of the issue" className={`w-full px-3 py-3 rounded-xl border text-sm ${errors.subject ? "border-red-300 bg-red-50" : "border-stone-200 bg-stone-50"}`} />
                  {errors.subject && <span className="text-red-500 text-xs mt-1 block">{errors.subject}</span>}
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-stone-500 mb-1.5">Description * <span className="text-stone-400 font-normal">(min 20 chars)</span></label>
                  <textarea value={formData.description} onChange={(e) => upd("description", e.target.value)} maxLength={3000} rows={5} placeholder="Describe the issue in detail..." className={`w-full px-3 py-3 rounded-xl border text-sm resize-none ${errors.description ? "border-red-300 bg-red-50" : "border-stone-200 bg-stone-50"}`} />
                  <div className="flex justify-between text-xs text-stone-400 mt-1"><span>{errors.description && <span className="text-red-500">{errors.description}</span>}</span><span>{formData.description.length}/3000</span></div>
                </div>
                {/* File upload */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-stone-500 mb-2">Attachments (optional, max 5)</label>
                  <label className="flex flex-col items-center gap-2 py-6 border-2 border-dashed border-stone-200 rounded-xl cursor-pointer hover:border-amber-300 hover:bg-amber-50/50 transition-all">
                    <I d={ic.upload} size={24} className="text-stone-400" />
                    <span className="text-xs text-stone-500">Click to upload photos or PDF</span>
                    <span className="text-xs text-stone-400">JPG, PNG, PDF — max 5MB each</span>
                    <input type="file" multiple accept="image/jpeg,image/png,image/jpg,image/gif,application/pdf" className="hidden" onChange={handleFileSelect} />
                  </label>
                  {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {files.map((f, i) => (
                        <div key={i} className="flex items-center gap-3 bg-stone-50 rounded-xl px-3 py-2">
                          <span className="text-lg">{f.type.startsWith("image") ? "🖼️" : "📄"}</span>
                          <div className="flex-1 min-w-0"><div className="text-xs font-semibold text-stone-700 truncate">{f.name}</div><div className="text-xs text-stone-400">{(f.size / 1024).toFixed(0)} KB</div></div>
                          <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 btn-bounce"><I d={ic.x} size={14} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="px-5 py-3 rounded-xl border border-stone-200 text-stone-600 text-sm btn-bounce hover:bg-stone-50"><I d={ic.chev_l} size={15} className="inline" /> Back</button>
                  <button onClick={() => { if (validateStep3()) setStep(4); }} className="flex-1 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold py-3 rounded-xl btn-bounce transition-colors">Review →</button>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div className="bg-amber-50 rounded-xl p-4 mb-4 text-xs text-amber-700 flex items-center gap-2"><I d={ic.check} size={13} stroke="#d97706" /> Please review before submitting</div>
                <div className="space-y-3 mb-5">
                  {[["Category", COMPLAINT_CATEGORIES.find(c => c.key === category)?.label || category],
                  ["Name", formData.name], ["Email", formData.email],
                  formData.phone ? ["Phone", formData.phone] : null,
                  formData.orderNumber ? ["Order #", formData.orderNumber] : null,
                  ["Subject", formData.subject]].filter(Boolean).map(([k, v]) => (
                    <div key={k} className="flex gap-3 bg-stone-50 rounded-xl px-4 py-3">
                      <span className="text-xs text-stone-400 w-20 flex-shrink-0 pt-0.5">{k}</span>
                      <span className="text-sm font-medium text-stone-800">{v}</span>
                    </div>
                  ))}
                  <div className="bg-stone-50 rounded-xl px-4 py-3">
                    <div className="text-xs text-stone-400 mb-1">Description</div>
                    <p className="text-sm text-stone-700 leading-relaxed line-clamp-3">{formData.description}</p>
                  </div>
                  {files.length > 0 && <div className="bg-stone-50 rounded-xl px-4 py-3"><span className="text-xs text-stone-400">{files.length} attachment(s)</span></div>}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(3)} className="px-5 py-3 rounded-xl border border-stone-200 text-stone-600 text-sm btn-bounce hover:bg-stone-50"><I d={ic.chev_l} size={15} className="inline" /> Back</button>
                  <button onClick={submit} disabled={submitting} className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-900 font-bold py-3 rounded-xl btn-bounce transition-colors flex items-center justify-center gap-2">
                    {submitting ? <><Spinner /> Submitting…</> : <><I d={ic.send} size={15} stroke="#1a1a1a" /> Submit Complaint</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TRACK TAB */}
      {tab === "track" && (
        <div>
          <div className="bg-white rounded-2xl border border-stone-100 p-6 mb-6">
            <h3 className="font-semibold text-stone-800 mb-4">Track Your Ticket</h3>
            <div className="space-y-3">
              <input value={trackTicket} onChange={(e) => setTrackTicket(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && trackComplaint()} placeholder="Ticket number (TKT-202506-XXXXX)" className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm" />
              <input type="email" value={trackEmail} onChange={(e) => setTrackEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && trackComplaint()} placeholder="Your email address" className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm" />
              <button onClick={trackComplaint} disabled={tracking} className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-900 font-bold py-3 rounded-xl btn-bounce transition-colors flex items-center justify-center gap-2">
                {tracking ? <><Spinner /> Searching…</> : <><I d={ic.search} size={15} stroke="#1a1a1a" /> Track Ticket</>}
              </button>
            </div>
            {trackErr && <p className="text-red-500 text-sm mt-3">{trackErr}</p>}
          </div>

          {trackedComplaint && (
            <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden" style={{ animation: "fadeIn .3s ease" }}>
              <div className="p-5 border-b border-stone-100 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-xs text-stone-400 mb-0.5">Ticket</div>
                  <div className="font-bold text-stone-900 font-mono">{trackedComplaint.ticketNumber}</div>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${STATUS_LABELS[trackedComplaint.status]?.cls || "bg-stone-100 text-stone-600"}`}>{STATUS_LABELS[trackedComplaint.status]?.label || trackedComplaint.status}</span>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div className="bg-stone-50 rounded-xl p-3"><div className="text-xs text-stone-400 mb-1">Category</div><div className="font-semibold text-stone-800 text-xs">{COMPLAINT_CATEGORIES.find(c => c.key === trackedComplaint.category)?.label || trackedComplaint.category}</div></div>
                  <div className="bg-stone-50 rounded-xl p-3"><div className="text-xs text-stone-400 mb-1">Priority</div><div className="font-semibold text-stone-800 text-xs capitalize">{trackedComplaint.priority || "normal"}</div></div>
                </div>
                <div className="bg-stone-50 rounded-xl p-4 mb-5">
                  <div className="text-xs text-stone-400 mb-1">Subject</div>
                  <div className="font-semibold text-stone-800 text-sm">{trackedComplaint.subject}</div>
                </div>

                {/* Replies timeline */}
                {trackedComplaint.replies && trackedComplaint.replies.length > 0 && (
                  <div className="mb-5">
                    <div className="text-xs font-semibold text-stone-500 mb-3 uppercase tracking-wide">Message Thread</div>
                    <div className="space-y-3">
                      {trackedComplaint.replies.map((r, i) => {
                        const isAdmin = r.authorType === "admin";
                        return (
                          <div key={i} className={`flex gap-3 ${isAdmin ? "" : "flex-row-reverse"}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isAdmin ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-600"}`}>{isAdmin ? "🎧" : "👤"}</div>
                            <div className={`flex-1 ${isAdmin ? "" : "items-end flex flex-col"}`}>
                              <div className={`inline-block rounded-2xl px-4 py-3 text-sm max-w-[85%] ${isAdmin ? "bg-amber-50 border border-amber-100 text-stone-700" : "bg-stone-900 text-white"}`}>{r.message}</div>
                              <div className="text-xs text-stone-400 mt-1 px-1">{isAdmin ? `Support — ` : ""}{new Date(r.createdAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Resolution */}
                {trackedComplaint.status === "resolved" && trackedComplaint.resolution && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                    <div className="font-semibold text-emerald-700 text-sm mb-2">✅ Resolution</div>
                    {trackedComplaint.resolution.details && <p className="text-emerald-600 text-sm">{trackedComplaint.resolution.details}</p>}
                    {trackedComplaint.resolution.refundAmount > 0 && <p className="text-emerald-700 font-semibold text-sm mt-1">Refund: {fmt(trackedComplaint.resolution.refundAmount)}</p>}
                    {trackedComplaint.resolution.couponCode && <div className="mt-2 inline-block bg-emerald-100 text-emerald-700 font-mono text-sm px-3 py-1 rounded-lg">{trackedComplaint.resolution.couponCode}</div>}
                  </div>
                )}

                {/* Reply box — not for resolved/closed */}
                {!["resolved", "rejected", "closed"].includes(trackedComplaint.status) && (
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wide">Send Reply</div>
                    <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={3} placeholder="Type your message…" maxLength={2000} className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm resize-none mb-2" />
                    <button onClick={sendReply} disabled={replySending} className="bg-stone-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold btn-bounce hover:bg-stone-700 transition-colors disabled:opacity-60 flex items-center gap-2">
                      {replySending ? <><Spinner /> Sending…</> : <><I d={ic.send} size={14} stroke="white" /> Send</>}
                    </button>
                  </div>
                )}

                {/* Satisfaction rating */}
                {trackedComplaint.status === "resolved" && !trackedComplaint.satisfactionRating?.score && (
                  <div className="bg-amber-50 rounded-xl p-4">
                    <div className="text-sm font-semibold text-stone-800 mb-3">How was your experience?</div>
                    <div className="flex gap-3 justify-center">
                      {["😡", "😞", "😐", "😊", "🤩"].map((emoji, i) => (
                        <button key={i} onClick={() => submitRating(i + 1)} className={`text-2xl btn-bounce transition-transform hover:scale-125 ${rating === i + 1 ? "scale-125" : ""}`}>{emoji}</button>
                      ))}
                    </div>
                  </div>
                )}
                {(trackedComplaint.satisfactionRating?.score || rating > 0) && (
                  <div className="bg-emerald-50 rounded-xl p-4 text-center"><span className="text-2xl">{"😡😞😐😊🤩".split("").filter((_, i) => i % 2 === 0)[(trackedComplaint.satisfactionRating?.score || rating) - 1]}</span><div className="text-emerald-600 font-semibold text-sm mt-1">Thank you for your feedback!</div></div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FAQ */}
      <div className="mt-8 bg-white rounded-2xl border border-stone-100 p-6">
        <h3 className="font-display font-semibold text-stone-800 mb-4">Common Questions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[["⏱️ Response time?", "We respond within 24–48 hours on business days."], ["💰 Refund process?", "Approved refunds are processed in 3–5 business days."], ["📷 Can I attach photos?", "Yes, upload up to 5 photos or PDF files as evidence."], ["📞 Talk directly?", "Call 01700-000000 or WhatsApp for immediate help."]].map(([q, a]) => (
            <div key={q} className="bg-stone-50 rounded-xl p-4"><div className="font-semibold text-stone-800 text-sm mb-1">{q}</div><div className="text-stone-500 text-xs leading-relaxed">{a}</div></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── REVIEW MODAL ─────────────────────────────────────────────────────────────
function ReviewModal({ token, onClose }) {
  const [panel, setPanel] = useState("loading"); // loading | error | form | success
  const [errorInfo, setErrorInfo] = useState({ title: "", msg: "" });
  const [productInfo, setProductInfo] = useState(null);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const LABELS = ["Very Bad 😞", "Bad 😕", "OK 😐", "Good 😊", "Amazing! 🤩"];

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/reviews/validate-token?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(data => {
        if (!data.success) {
          const map = { TOKEN_INVALID: ["Link Expired", "This review link has expired."], TOKEN_USED: ["Already Reviewed", "You've already submitted a review with this link."], NOT_DELIVERED: ["Not Delivered Yet", "You can review after your order is delivered."] };
          const [t, m] = map[data.code] || ["Error", data.message || "Invalid link."];
          setErrorInfo({ title: t, msg: m }); setPanel("error");
        } else {
          setProductInfo(data.data); setPanel("form");
        }
      })
      .catch(() => { setErrorInfo({ title: "Connection Error", msg: "Cannot connect to server." }); setPanel("error"); });
  }, [token]);

  const submit = async () => {
    if (!rating) { toast("Please select a rating", "error"); return; }
    if (body.length < 10) { toast("Write at least 10 characters", "error"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/reviews`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, rating, title, body }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setPanel("success");
    } catch (e) { toast(e.message || "Failed to submit", "error"); } finally { setSubmitting(false); }
  };

  const star = hovered || rating;

  return (
    <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-black/50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" style={{ animation: "popIn .3s ease" }}>
        <div className="bg-gradient-to-r from-stone-900 to-stone-800 p-5 flex items-center justify-between">
          <div className="flex items-center gap-2"><span className="text-xl">⭐</span><span className="text-white font-semibold">Write a Review</span></div>
          <button onClick={onClose} className="text-stone-400 hover:text-white btn-bounce"><I d={ic.x} size={18} /></button>
        </div>
        <div className="p-6">
          {panel === "loading" && <div className="text-center py-8"><Spinner /><p className="text-stone-400 text-sm mt-3">Validating…</p></div>}
          {panel === "error" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">❌</div>
              <h3 className="font-display font-bold text-stone-900 mb-2">{errorInfo.title}</h3>
              <p className="text-stone-500 text-sm">{errorInfo.msg}</p>
              <button onClick={onClose} className="mt-5 bg-stone-900 text-white px-5 py-2.5 rounded-xl btn-bounce text-sm font-semibold">Close</button>
            </div>
          )}
          {panel === "form" && productInfo && (
            <>
              <div className="flex items-center gap-3 bg-amber-50 rounded-xl p-3 mb-5">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">{productInfo.product?.image ? <img src={productInfo.product.image} alt="" className="w-full h-full object-cover rounded-xl" /> : "🍯"}</div>
                <div><div className="font-semibold text-stone-800 text-sm">{productInfo.product?.name || "Product"}</div><div className="text-xs text-stone-400">Order #{productInfo.orderNumber}</div></div>
              </div>
              <div className="text-center mb-5">
                <div className="flex gap-2 justify-center mb-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <button key={i} onClick={() => setRating(i)} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(0)}
                      className={`text-3xl transition-transform btn-bounce ${i <= star ? "scale-110" : ""}`}>
                      <svg width={32} height={32} viewBox="0 0 24 24" fill={i <= star ? "#f59e0b" : "#e5e7eb"} stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    </button>
                  ))}
                </div>
                <div className={`text-sm font-semibold transition-all ${rating > 0 ? "text-amber-600" : "text-stone-400"}`}>{rating > 0 ? LABELS[rating - 1] : "Select a rating"}</div>
              </div>
              <div className="space-y-3 mb-5">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 mb-1.5">Title (optional)</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Summarize your experience" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 mb-1.5">Review * <span className="text-stone-400 font-normal">(min 10 chars)</span></label>
                  <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} rows={4} placeholder="Share your experience with this product…" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm resize-none" />
                </div>
              </div>
              <button onClick={submit} disabled={submitting || !rating || body.length < 10}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-900 font-bold py-3 rounded-xl btn-bounce transition-colors flex items-center justify-center gap-2 text-sm">
                {submitting ? <><Spinner /> Submitting…</> : <><I d={ic.star} size={15} fill="#1a1a1a" stroke="none" /> Submit Review</>}
              </button>
            </>
          )}
          {panel === "success" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">🌟</div>
              <h3 className="font-display font-bold text-stone-900 mb-2">Review Submitted!</h3>
              <p className="text-stone-500 text-sm mb-5">Thank you for sharing your experience. Your review helps other customers.</p>
              <button onClick={onClose} className="bg-amber-500 text-stone-900 font-bold px-5 py-2.5 rounded-xl btn-bounce text-sm">Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── DELIVERY CHARGES MODAL ───────────────────────────────────────────────────
function DeliveryChargesModal({ onClose }) {
  const { data: raw } = useAPI("/api/delivery-charges");
  const charges = raw?.data || raw || [];
  const activeCharges = Array.isArray(charges) ? charges.filter(c => c.isActive) : [];

  const zoneInfo = {
    inside_dhaka: { label: "Inside Dhaka", icon: "🏙️", color: "bg-blue-50 border-blue-200", textColor: "text-blue-700" },
    outside_dhaka: { label: "Outside Dhaka", icon: "🌿", color: "bg-violet-50 border-violet-200", textColor: "text-violet-700" },
    default: { label: "Special Offer", icon: "🎁", color: "bg-amber-50 border-amber-200", textColor: "text-amber-700" },
  };

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden" style={{ animation: "popIn .3s ease" }}>
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-5 flex items-center justify-between">
          <div className="flex items-center gap-2"><I d={ic.truck} size={20} stroke="white" /><span className="text-white font-semibold">Delivery Charges</span></div>
          <button onClick={onClose} className="text-white/70 hover:text-white btn-bounce"><I d={ic.x} size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          {activeCharges.length === 0 ? (
            <div className="text-center py-6"><Spinner /><p className="text-stone-400 text-sm mt-2">Loading…</p></div>
          ) : (
            activeCharges.map((c, i) => {
              const info = zoneInfo[c.name] || { label: c.name, icon: "🚚", color: "bg-stone-50 border-stone-200", textColor: "text-stone-700" };
              return (
                <div key={i} className={`border rounded-xl p-4 flex items-center justify-between ${info.color}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{info.icon}</span>
                    <div>
                      <div className={`font-semibold text-sm ${info.textColor}`}>{info.label}</div>
                      {c.minOrderAmount > 0 && <div className="text-xs text-stone-400">Min order: {fmt(c.minOrderAmount)}</div>}
                    </div>
                  </div>
                  <div className={`text-xl font-bold ${info.textColor}`}>{fmt(c.amount)}</div>
                </div>
              );
            })
          )}
          <div className="bg-stone-50 rounded-xl p-3 text-xs text-stone-500 leading-relaxed">
            💡 Delivery charge is automatically calculated based on your location at checkout.
          </div>
          <button onClick={onClose} className="w-full bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold py-3 rounded-xl btn-bounce transition-colors text-sm">Got it!</button>
        </div>
      </div>
    </div>
  );
}

// ─── BLOG PAGE ────────────────────────────────────────────────────────────────
function BlogPage() {
  const [selected, setSelected] = useState(null);
  const { data: raw, loading } = useAPI("/api/blogs?status=published&limit=12");
  const blogs = raw?.blogs || raw || [];
  if (selected) return <BlogDetail blog={selected} onBack={() => setSelected(null)} />;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-10"><h1 className="font-display text-3xl font-bold text-stone-900 mb-2">Honey Blog</h1><p className="text-stone-500">Tips, recipes, and insights from our beekeepers</p></div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-stone-100 overflow-hidden"><Sk className="h-44 rounded-none" /><div className="p-5 space-y-2"><Sk className="h-3 w-1/3" /><Sk className="h-5" /><Sk className="h-3" /></div></div>)}</div>
      ) : blogs.length === 0 ? <div className="text-center py-16"><div className="text-5xl mb-4">📝</div><p className="text-stone-400">No posts yet. Check back soon!</p></div>
        : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <div key={blog._id} onClick={() => setSelected(blog)} className="card-hover bg-white rounded-2xl border border-stone-100 overflow-hidden cursor-pointer">
                <div className="relative h-44 bg-amber-50 overflow-hidden">
                  {blog.coverImage?.url && CDN(blog.coverImage.url) ? <img src={CDN(blog.coverImage.url)} alt={blog.title} className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-5xl">🍯</div>}
                </div>
                <div className="p-5">
                  {blog.category && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mb-2 inline-block">{blog.category}</span>}
                  <h3 className="font-display font-semibold text-stone-800 text-base line-clamp-2 mb-2 leading-snug">{blog.title}</h3>
                  <p className="text-stone-400 text-sm line-clamp-2 mb-4">{blog.excerpt || (blog.body || "").replace(/<[^>]*>/g, "").slice(0, 100)}…</p>
                  <div className="flex justify-between text-xs text-stone-400"><span>{new Date(blog.publishedAt || blog.createdAt).toLocaleDateString()}</span><span>{blog.likes || 0} ❤️ · {blog.views || 0} 👁</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
// ─── BLOG DETAILS PAGE ENHANCEMENT ────────────────────────────────────────────
// ─── BLOG DETAILS PAGE ENHANCEMENT ────────────────────────────────────────────
function BlogDetail({ blog, onBack }) {
  const { data: fullBlog, loading } = useAPI(blog._id ? `/api/blogs/${blog._id}` : null, [], !blog._id);
  const blogData = fullBlog?.data || fullBlog || blog;
  const [commentForm, setCommentForm] = useState({ author: "", email: "", body: "" });
  const [commenting, setCommenting] = useState(false);
  const toast = useToast();

  // Increment views when blog is loaded
  useEffect(() => {
    if (blogData._id && blogData.status === "published") {
      fetch(`${API}/api/blogs/${blogData._id}/views`, { method: "PUT" }).catch(() => { });
    }
  }, [blogData._id]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentForm.author || !commentForm.email || !commentForm.body) {
      toast("Please fill all required fields", "error");
      return;
    }

    setCommenting(true);
    try {
      const res = await fetch(`${API}/api/blogs/${blogData._id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commentForm)
      });
      const data = await res.json();
      if (data.success) {
        toast("Comment submitted for review! We'll approve it shortly. ✅", "success");
        setCommentForm({ author: "", email: "", body: "" });

        // Show success message instead of reloading
        setCommentSuccess(true);
        setTimeout(() => setCommentSuccess(false), 5000);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast(error.message || "Failed to submit comment", "error");
    } finally {
      setCommenting(false);
    }
  };

  // Add this state near the other useState declarations
  const [commentSuccess, setCommentSuccess] = useState(false);

  // Update the comment form section to show success message
  {
    commentSuccess ? (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center mb-6">
        <div className="text-emerald-600 text-lg mb-2">✅</div>
        <h4 className="font-semibold text-emerald-700 mb-2">Comment Submitted!</h4>
        <p className="text-emerald-600 text-sm">Your comment is under review. We'll approve it shortly.</p>
      </div>
    ) : (
      <form onSubmit={handleCommentSubmit} className="bg-stone-50 rounded-2xl p-5 mb-6">
        <h4 className="font-semibold text-stone-700 mb-3">Leave a Comment</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Name *</label>
            <input
              type="text"
              value={commentForm.author}
              onChange={(e) => setCommentForm({ ...commentForm, author: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Email *</label>
            <input
              type="email"
              value={commentForm.email}
              onChange={(e) => setCommentForm({ ...commentForm, email: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm"
              required
            />
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-xs font-semibold text-stone-500 mb-1.5">Comment *</label>
          <textarea
            value={commentForm.body}
            onChange={(e) => setCommentForm({ ...commentForm, body: e.target.value })}
            rows={4}
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm resize-none"
            required
          />
        </div>
        <button
          type="submit"
          disabled={commenting}
          className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-5 py-2.5 rounded-xl btn-bounce transition-colors text-sm disabled:opacity-60"
        >
          {commenting ? <Spinner /> : "Post Comment"}
        </button>
      </form>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8" style={{ animation: "fadeIn .3s ease" }}>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-amber-600 mb-6 btn-bounce transition-colors font-medium">
        <I d={ic.chev_l} size={16} /> Back to Blog
      </button>

      {loading ? (
        <div className="space-y-4">
          <Sk className="h-64 rounded-2xl" />
          <Sk className="h-8 w-3/4" />
          <Sk className="h-32" />
        </div>
      ) : (
        <>
          {blogData.coverImage?.url && CDN(blogData.coverImage.url) && (
            <img
              src={CDN(blogData.coverImage.url)}
              alt={blogData.coverImage.alt || blogData.title}
              className="w-full h-64 sm:h-96 object-cover rounded-2xl mb-7 shadow-lg"
            />
          )}

          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {blogData.category && (
              <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
                {blogData.category}
              </span>
            )}
            {blogData.tags && blogData.tags.slice(0, 3).map(tag => (
              <span key={tag} className="bg-stone-100 text-stone-600 text-xs px-2 py-1 rounded-full">
                #{tag}
              </span>
            ))}
            <span className="text-stone-400 text-xs">
              {new Date(blogData.publishedAt || blogData.createdAt).toLocaleDateString("en-BD", {
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </span>
            <span className="text-stone-400 text-xs flex items-center gap-1">
              <I d={ic.eye} size={12} /> {blogData.views || 0} views
            </span>
            {blogData.readingTime && (
              <span className="text-stone-400 text-xs flex items-center gap-1">
                <I d={ic.clock} size={12} /> {blogData.readingTime} min read
              </span>
            )}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold text-stone-900 mb-4 leading-tight">
            {blogData.title}
          </h1>

          {blogData.author && (
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-semibold text-sm">
                {blogData.author.name?.charAt(0) || "A"}
              </div>
              <div>
                <div className="font-semibold text-stone-800 text-sm">
                  {blogData.author.name || "Admin"}
                </div>
                {blogData.author.bio && (
                  <div className="text-stone-500 text-xs">
                    {blogData.author.bio}
                  </div>
                )}
              </div>
            </div>
          )}

          {blogData.excerpt && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 italic text-stone-700">
              {blogData.excerpt}
            </div>
          )}

          <div className="prose max-w-none text-stone-600 leading-relaxed text-base sm:text-lg mb-8">
            <div dangerouslySetInnerHTML={{
              __html: (blogData.body || blogData.content || "")
                .replace(/\n/g, "<br>")
                .replace(/<h2/g, '<h2 class="text-2xl font-display font-bold text-stone-900 mt-8 mb-4"')
                .replace(/<h3/g, '<h3 class="text-xl font-display font-bold text-stone-900 mt-6 mb-3"')
                .replace(/<p/g, '<p class="mb-4"')
                .replace(/<ul/g, '<ul class="list-disc list-inside mb-4"')
                .replace(/<ol/g, '<ol class="list-decimal list-inside mb-4"')
                .replace(/<li/g, '<li class="mb-1"')
                .replace(/<blockquote/g, '<blockquote class="border-l-4 border-amber-400 pl-4 italic bg-amber-50 py-2 my-4"')
            }} />
          </div>

          {/* Gallery Images */}
          {blogData.gallery && blogData.gallery.length > 0 && (
            <div className="mb-8">
              <h3 className="font-display font-semibold text-stone-800 mb-4">Gallery</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {blogData.gallery.map((image, index) => (
                  <img
                    key={index}
                    src={CDN(image.url)}
                    alt={image.alt || `Gallery image ${index + 1}`}
                    className="w-full h-48 object-cover rounded-xl shadow-md"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          {blogData.allowComments && (
            <div className="border-t border-stone-100 pt-8 mb-8">
              <h3 className="font-display font-semibold text-stone-800 mb-4">
                Comments ({blogData.comments ? blogData.comments.filter(c => c.isApproved).length : 0})
              </h3>

              {/* Comment Form */}
              <form onSubmit={handleCommentSubmit} className="bg-stone-50 rounded-2xl p-5 mb-6">
                <h4 className="font-semibold text-stone-700 mb-3">Leave a Comment</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 mb-1.5">Name *</label>
                    <input
                      type="text"
                      value={commentForm.author}
                      onChange={(e) => setCommentForm({ ...commentForm, author: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 mb-1.5">Email *</label>
                    <input
                      type="email"
                      value={commentForm.email}
                      onChange={(e) => setCommentForm({ ...commentForm, email: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm"
                      required
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-stone-500 mb-1.5">Comment *</label>
                  <textarea
                    value={commentForm.body}
                    onChange={(e) => setCommentForm({ ...commentForm, body: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm resize-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={commenting}
                  className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-5 py-2.5 rounded-xl btn-bounce transition-colors text-sm disabled:opacity-60"
                >
                  {commenting ? <Spinner /> : "Post Comment"}
                </button>
              </form>

              {/* Approved Comments */}
              {blogData.comments && blogData.comments.filter(c => c.isApproved).length > 0 ? (
                <div className="space-y-4">
                  {blogData.comments.filter(c => c.isApproved).map((comment) => (
                    <div key={comment._id} className="bg-white rounded-xl p-4 border border-stone-100">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 text-xs font-bold">
                          {comment.author.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-stone-800 text-sm">{comment.author}</div>
                          <div className="text-stone-400 text-xs">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <p className="text-stone-600 text-sm">{comment.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-stone-400 text-sm text-center py-4">No comments yet. Be the first to comment!</p>
              )}
            </div>
          )}

          {/* Social Sharing */}
          <div className="border-t border-stone-100 pt-6 mb-8">
            <div className="flex items-center gap-3">
              <span className="text-stone-500 text-sm">Share this post:</span>
              {["facebook", "twitter", "linkedin", "whatsapp"].map(platform => (
                <button
                  key={platform}
                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors flex items-center justify-center text-stone-600"
                  onClick={() => {
                    const url = encodeURIComponent(window.location.href);
                    const title = encodeURIComponent(blogData.title);
                    const shareUrls = {
                      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
                      twitter: `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
                      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
                      whatsapp: `https://wa.me/?text=${title} ${url}`
                    };
                    window.open(shareUrls[platform], '_blank');
                  }}
                >
                  <span className="text-sm">
                    {platform === 'facebook' ? '📘' :
                      platform === 'twitter' ? '🐦' :
                        platform === 'linkedin' ? '💼' : '💚'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Related Posts */}
          {blogData.relatedPosts && blogData.relatedPosts.length > 0 && (
            <div className="bg-stone-50 rounded-2xl p-6 mb-8">
              <h3 className="font-display font-semibold text-stone-800 mb-4">You might also like</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {blogData.relatedPosts.slice(0, 2).map(post => (
                  <div key={post._id} className="bg-white rounded-xl p-4 border border-stone-100">
                    <h4 className="font-semibold text-stone-800 text-sm mb-2 line-clamp-2">{post.title}</h4>
                    <div className="text-xs text-stone-400">
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── CONTACT PAGE ─────────────────────────────────────────────────────────────
// function ContactPage() {
//   const { setPage } = useContext(NavCtx);
//   const [form, setForm] = useState({ name: "", email: "", phone: "", orderNumber: "", message: "", category: "general" });
//   const [loading, setLoading] = useState(false);
//   const [success, setSuccess] = useState(false);
//   const toast = useToast();
//   const categoryMap = { general: "other", product_quality: "quality_issue", delivery: "delivery_issue", refund: "refund_request", other: "other" };
//   const submit = async () => {
//     if (!form.name || !form.message) { toast("Name and message are required", "error"); return; }
//     setLoading(true);
//     try {
//       await apiFetch("/api/complaints", { method: "POST", body: JSON.stringify({ customer: { name: form.name, email: form.email || "guest@example.com", phone: form.phone || "01700000000" }, orderNumber: form.orderNumber || null, category: categoryMap[form.category] || "other", subject: form.category.replace(/_/g, " "), description: form.message }) });
//       setSuccess(true); toast("Message sent successfully!");
//     } catch (error) { toast(error.message || "Failed to submit", "error"); } finally { setLoading(false); }
//   };
//   if (success) return (
//     <div className="text-center py-20 px-4" style={{ animation: "popIn .5s ease" }}>
//       <div className="text-6xl mb-5">✅</div><h2 className="font-display text-2xl font-bold text-stone-900 mb-2">Message Received!</h2>
//       <p className="text-stone-400 text-sm mb-7">We'll get back to you within 24 hours.</p>
//       <div className="flex gap-3 justify-center flex-wrap">
//         <button onClick={() => setSuccess(false)} className="bg-amber-500 text-stone-900 font-bold px-6 py-3 rounded-xl btn-bounce">Send Another</button>
//         <button onClick={() => setPage("complaint")} className="border border-stone-200 px-6 py-3 rounded-xl btn-bounce text-stone-600 hover:bg-stone-50 text-sm">Track Ticket</button>
//       </div>
//     </div>
//   );
//   return (
//     <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
//       <h1 className="font-display text-3xl font-bold text-stone-900 mb-2">Contact & Support</h1>
//       <p className="text-stone-500 mb-8 text-sm">Got a question? We're here 6 days a week.</p>
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
//         {[["📧", "Email Us", "info@beeharvest.com", "Response within 24h"], ["📞", "Call Us", "01XXXXXXXXX", "Sat–Thu, 9am–8pm"], ["💬", "WhatsApp", "Chat Now", "Usually instant"], ["📍", "Location", "Dhaka, Bangladesh", "By appointment"]].map(([icon, title, info, sub]) => (
//           <div key={title} className="flex items-center gap-4 bg-white rounded-2xl border border-stone-100 p-4"><span className="text-3xl">{icon}</span><div><div className="font-semibold text-stone-800 text-sm">{title}</div><div className="text-amber-600 font-medium text-sm">{info}</div><div className="text-stone-400 text-xs">{sub}</div></div></div>
//         ))}
//       </div>
//       <div className="bg-white rounded-2xl border border-stone-100 p-6">
//         <h3 className="font-semibold text-stone-800 mb-5">Submit a Complaint or Inquiry</h3>
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
//           {[["name", "Full Name", true, "text"], ["email", "Email", false, "email"], ["phone", "Phone", false, "tel"], ["orderNumber", "Order Number (optional)", false, "text"]].map(([k, l, req, t]) => (
//             <div key={k}><label className="block text-xs font-semibold text-stone-500 mb-1.5">{l}{req && " *"}</label><input type={t} value={form[k]} onChange={(e) => setForm(p => ({ ...p, [k]: e.target.value }))} placeholder={l} className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm" /></div>
//           ))}
//         </div>
//         <div className="mb-4">
//           <label className="block text-xs font-semibold text-stone-500 mb-2">Issue Type</label>
//           <div className="flex flex-wrap gap-2">
//             {[{ value: "general", label: "General Inquiry" }, { value: "product_quality", label: "Product Quality" }, { value: "delivery", label: "Delivery Issue" }, { value: "refund", label: "Refund Request" }, { value: "other", label: "Other" }].map((opt) => (
//               <button key={opt.value} onClick={() => setForm(p => ({ ...p, category: opt.value }))} className={`px-3 py-1.5 rounded-lg border text-xs font-medium btn-bounce capitalize transition-all ${form.category === opt.value ? "bg-amber-500 border-amber-500 text-stone-900" : "border-stone-200 text-stone-500 hover:border-amber-300"}`}>{opt.label}</button>
//             ))}
//           </div>
//         </div>
//         <div className="mb-5"><label className="block text-xs font-semibold text-stone-500 mb-1.5">Message *</label><textarea value={form.message} onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))} rows={4} placeholder="Describe your issue…" className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm resize-none" /></div>
//         <button onClick={submit} disabled={loading} className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-6 py-3 rounded-xl btn-bounce shadow-md shadow-amber-200 transition-colors flex items-center gap-2 text-sm disabled:opacity-60">
//           {loading ? <><Spinner /> Submitting…</> : "Submit Message"}
//         </button>
//       </div>
//     </div>
//   );
// }

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
    const msg = input.trim(); setInput("");
    setMsgs((p) => [...p, { role: "user", text: msg }]); setLoading(true);
    try {
      const data = await apiFetch("/api/chatbot/message", { method: "POST", body: JSON.stringify({ message: msg }) });
      setMsgs((p) => [...p, { role: "bot", text: data.data?.reply || data.reply || "Let me connect you with our team." }]);
    } catch { setMsgs((p) => [...p, { role: "bot", text: "Sorry, I'm having trouble right now. Try again soon!" }]); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed bottom-6 right-6 z-[9990]">
      {open && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden" style={{ animation: "popIn .25s ease" }}>
          <div className="bg-stone-900 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-400 rounded-full flex items-center justify-center text-lg">🐝</div>
              <div><div className="text-white font-semibold text-sm">BeeBot</div><div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /><span className="text-emerald-400 text-xs">Online</span></div></div>
            </div>
            <button onClick={() => setOpen(false)} className="text-stone-400 hover:text-white btn-bounce"><I d={ic.x} size={16} /></button>
          </div>
          <div className="h-64 overflow-y-auto p-4 bg-stone-50 space-y-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === "user" ? "bg-amber-500 text-stone-900 font-medium rounded-br-sm" : "bg-white text-stone-700 border border-stone-100 rounded-bl-sm shadow-sm"}`}>{m.text}</div>
              </div>
            ))}
            {loading && <div className="flex justify-start"><div className="bg-white border border-stone-100 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm"><div className="flex gap-1"><span className="w-1.5 h-1.5 bg-stone-300 rounded-full" style={{ animation: "fadeIn .5s infinite alternate" }} /><span className="w-1.5 h-1.5 bg-stone-300 rounded-full" style={{ animation: "fadeIn .5s .15s infinite alternate" }} /><span className="w-1.5 h-1.5 bg-stone-300 rounded-full" style={{ animation: "fadeIn .5s .3s infinite alternate" }} /></div></div></div>}
            <div ref={endRef} />
          </div>
          <div className="p-3 bg-white border-t border-stone-100 flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a message…" className="flex-1 px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm" />
            <button onClick={send} disabled={loading} className="bg-amber-500 hover:bg-amber-400 text-stone-900 p-2.5 rounded-xl btn-bounce transition-colors disabled:opacity-60"><I d={ic.chev_r} size={16} stroke="#1a1a1a" /></button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(!open)} className="w-14 h-14 rounded-full bg-amber-400 hover:bg-amber-500 shadow-xl shadow-amber-300/50 btn-bounce transition-all flex items-center justify-center text-2xl"
        style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .3s ease" }}>
        {open ? <I d={ic.x} size={20} stroke="#1a1a1a" /> : "🐝"}
      </button>
    </div>
  );
}

// ─── BEE TRANSFER PAGE (UPDATED) ────────────────────────────────────────────────────────
function BeeTransferPage() {
  const [activeTab, setActiveTab] = useState("send"); // "send" | "receive"
  const [step, setStep] = useState(1);

  // Send state
  const [sendForm, setSendForm] = useState({
    senderEmail: "",
    senderName: "",
    receiverEmail: "",
    receiverName: "",
    message: "",
    files: []
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sending, setSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [transferId, setTransferId] = useState(null);
  const [otp, setOtp] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);
  const [sendSuccess, setSendSuccess] = useState(null);

  // Receive state
  const [receiveTransferId, setReceiveTransferId] = useState("");
  const [receiveLoading, setReceiveLoading] = useState(false);
  const [transferData, setTransferData] = useState(null);
  const [transferError, setTransferError] = useState("");
  const [downloadingFile, setDownloadingFile] = useState(null);

  const toast = useToast();
  const fileInputRef = useRef();

  // Helper: Generate file preview URL
  const getFilePreviewUrl = (file) => {
    if (file.type?.startsWith("image/")) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  // Helper: Get file icon based on type
  const getFileIcon = (file) => {
    const type = file.type;
    if (type?.startsWith("image/")) return "🖼️";
    if (type?.startsWith("video/")) return "🎬";
    if (type?.startsWith("audio/")) return "🎵";
    if (type === "application/pdf") return "📕";
    if (type?.includes("word")) return "📘";
    if (type?.includes("excel") || type?.includes("spreadsheet")) return "📗";
    if (type?.includes("powerpoint") || type?.includes("presentation")) return "📙";
    if (type?.startsWith("text/")) return "📝";
    return "📄";
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const updateSendForm = (k, v) => setSendForm(prev => ({ ...prev, [k]: v }));

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const maxFiles = 10;
    const maxSizeMB = 15;

    if (selectedFiles.length > maxFiles) {
      toast(`Maximum ${maxFiles} files allowed`, "error");
      return;
    }

    const oversized = selectedFiles.filter(f => f.size > maxSizeMB * 1024 * 1024);
    if (oversized.length) {
      toast(`${oversized.length} file(s) exceed ${maxSizeMB}MB limit`, "error");
      return;
    }

    setSendForm(prev => ({ ...prev, files: [...prev.files, ...selectedFiles] }));
  };

  const removeFile = (index) => {
    setSendForm(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  // Clear all form data
  const clearFormData = () => {
    setSendForm({
      senderEmail: "",
      senderName: "",
      receiverEmail: "",
      receiverName: "",
      message: "",
      files: []
    });
    setOtp("");
    setOtpError("");
    setUploadProgress(0);
  };

  // Reset entire send flow
  const resetSendFlow = () => {
    setStep(1);
    setOtpSent(false);
    setTransferId(null);
    setSendSuccess(null);
    clearFormData();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const initiateTransfer = async () => {
    if (!sendForm.senderEmail || !sendForm.receiverEmail) {
      toast("Sender and receiver emails are required", "error");
      return;
    }

    if (sendForm.files.length === 0) {
      toast("Please select at least one file", "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sendForm.senderEmail) || !emailRegex.test(sendForm.receiverEmail)) {
      toast("Invalid email format", "error");
      return;
    }

    setSending(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("senderEmail", sendForm.senderEmail);
    formData.append("senderName", sendForm.senderName);
    formData.append("receiverEmail", sendForm.receiverEmail);
    formData.append("receiverName", sendForm.receiverName);
    if (sendForm.message) formData.append("message", sendForm.message);
    sendForm.files.forEach(f => formData.append("files", f));

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 300);

      const res = await fetch(`${API}/api/transfers/initiate`, {
        method: "POST",
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setTransferId(data.data.transferId);
      setOtpSent(true);
      toast(`OTP sent to ${sendForm.senderEmail}!`, "success");
      setStep(2);

    } catch (err) {
      toast(err.message || "Failed to initiate transfer", "error");
    } finally {
      setSending(false);
      setUploadProgress(0);
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setOtpError("Please enter the 6-digit OTP");
      return;
    }

    setOtpVerifying(true);
    setOtpError("");

    try {
      const res = await fetch(`${API}/api/transfers/${transferId}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setSendSuccess(data.data);
      toast("Transfer verified! Files have been sent.", "success");
      setStep(3);

    } catch (err) {
      setOtpError(err.message);
      toast(err.message, "error");
    } finally {
      setOtpVerifying(false);
    }
  };

  const resendOtp = async () => {
    if (otpResendCooldown > 0) return;

    try {
      const res = await fetch(`${API}/api/transfers/${transferId}/resend-otp`, {
        method: "POST"
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      toast("OTP resent successfully!", "success");
      setOtpResendCooldown(60);

      const timer = setInterval(() => {
        setOtpResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      toast(err.message, "error");
    }
  };

  const fetchTransfer = async () => {
    if (!receiveTransferId.trim()) {
      setTransferError("Please enter a Transfer ID");
      return;
    }

    setReceiveLoading(true);
    setTransferError("");
    setTransferData(null);

    try {
      const res = await fetch(`${API}/api/transfers/${receiveTransferId.toUpperCase()}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setTransferData(data.data);

    } catch (err) {
      setTransferError(err.message || "Transfer not found or expired");
    } finally {
      setReceiveLoading(false);
    }
  };

  const downloadFile = async (file) => {
    setDownloadingFile(file._id);
    try {
      const res = await fetch(`${API}/api/transfers/${receiveTransferId}/files/${file._id}/download`, {
        method: "POST"
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      window.open(data.data.downloadUrl, "_blank");
      toast(`Downloading ${file.originalName}...`, "success");

      setTimeout(() => fetchTransfer(), 1000);

    } catch (err) {
      toast(err.message || "Failed to download file", "error");
    } finally {
      setDownloadingFile(null);
    }
  };

  // ── Render Send Tab ────────────────────────────────────────────────────────
  const renderSendTab = () => {
    if (step === 1) {
      return (
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Your Email *</label>
              <input
                type="email"
                value={sendForm.senderEmail}
                onChange={(e) => updateSendForm("senderEmail", e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Your Name (optional)</label>
              <input
                type="text"
                value={sendForm.senderName}
                onChange={(e) => updateSendForm("senderName", e.target.value)}
                placeholder="John Doe"
                className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Recipient Email *</label>
              <input
                type="email"
                value={sendForm.receiverEmail}
                onChange={(e) => updateSendForm("receiverEmail", e.target.value)}
                placeholder="friend@example.com"
                className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Recipient Name (optional)</label>
              <input
                type="text"
                value={sendForm.receiverName}
                onChange={(e) => updateSendForm("receiverName", e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm"
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Message (optional)</label>
            <textarea
              value={sendForm.message}
              onChange={(e) => updateSendForm("message", e.target.value)}
              rows={2}
              placeholder="Add a note for the recipient..."
              maxLength={500}
              className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm resize-none"
            />
            <div className="text-right text-xs text-stone-400 mt-1">{sendForm.message.length}/500</div>
          </div>

          {/* File Upload with Gallery Preview */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Files * (max 10 files, 15MB each)</label>

            {/* Gallery preview of selected files */}
            {sendForm.files.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                {sendForm.files.map((file, idx) => {
                  const previewUrl = getFilePreviewUrl(file);
                  const fileIcon = getFileIcon(file);

                  return (
                    <div key={idx} className="relative group">
                      <div className="bg-stone-50 rounded-xl overflow-hidden border border-stone-100 aspect-square flex items-center justify-center">
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt={file.name}
                            className="w-full h-full object-cover"
                            onLoad={() => URL.revokeObjectURL(previewUrl)}
                          />
                        ) : (
                          <div className="text-center p-3">
                            <div className="text-4xl mb-1">{fileIcon}</div>
                            <div className="text-xs text-stone-600 truncate px-1">{file.name.split('.').pop()?.toUpperCase() || 'FILE'}</div>
                          </div>
                        )}
                      </div>
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => removeFile(idx)}
                          className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                        >
                          <I d={ic.x} size={12} stroke="white" strokeWidth={2.5} />
                        </button>
                      </div>
                      <div className="mt-1.5">
                        <div className="text-xs font-medium text-stone-700 truncate">{file.name}</div>
                        <div className="text-[10px] text-stone-400">{formatBytes(file.size)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Upload button */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-stone-200 rounded-xl p-6 text-center cursor-pointer hover:border-amber-300 hover:bg-amber-50/30 transition-all"
            >
              <I d={ic.upload} size={32} className="mx-auto text-stone-400 mb-2" />
              <p className="text-sm text-stone-500">Click to select files</p>
              <p className="text-xs text-stone-400 mt-1">or drag and drop</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={initiateTransfer}
            disabled={sending || sendForm.files.length === 0}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-900 font-bold py-3.5 rounded-xl btn-bounce transition-colors flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                Uploading {uploadProgress > 0 && `(${uploadProgress}%)`}...
              </>
            ) : (
              <>
                <I d={ic.send} size={16} stroke="#1a1a1a" />
                Send Files
              </>
            )}
          </button>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <div className="text-3xl mb-2">🔐</div>
            <p className="text-sm text-stone-700">
              An OTP has been sent to <strong>{sendForm.senderEmail}</strong>
            </p>
            <p className="text-xs text-stone-500 mt-1">Please check your inbox (and spam folder)</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Enter OTP Code</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-center text-2xl font-mono tracking-widest"
            />
            {otpError && <p className="text-red-500 text-xs mt-1">{otpError}</p>}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setStep(1); setOtp(""); setOtpError(""); }}
              className="flex-1 border border-stone-200 text-stone-600 font-semibold py-3 rounded-xl btn-bounce hover:bg-stone-50"
            >
              Back
            </button>
            <button
              onClick={verifyOtp}
              disabled={otpVerifying || otp.length !== 6}
              className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-900 font-bold py-3 rounded-xl btn-bounce transition-colors flex items-center justify-center gap-2"
            >
              {otpVerifying ? (
                <><div className="w-4 h-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" /> Verifying...</>
              ) : (
                "Verify & Send"
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={resendOtp}
              disabled={otpResendCooldown > 0}
              className="text-sm text-amber-600 hover:text-amber-700 disabled:opacity-50"
            >
              Resend OTP {otpResendCooldown > 0 && `(${otpResendCooldown}s)`}
            </button>
          </div>
        </div>
      );
    }

    if (step === 3 && sendSuccess) {
      return (
        <div className="text-center space-y-5" style={{ animation: "popIn .3s ease" }}>
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-3xl mx-auto">✅</div>
          <h3 className="font-display text-xl font-bold text-stone-900">Files Sent Successfully!</h3>
          <div className="bg-stone-50 rounded-xl p-4">
            <p className="text-xs text-stone-500">Transfer ID</p>
            <p className="font-mono font-bold text-amber-600 text-sm">{sendSuccess.transferId}</p>
          </div>
          <p className="text-stone-500 text-sm">
            An email with download instructions has been sent to <strong>{sendForm.receiverEmail}</strong>
          </p>
          <button
            onClick={() => {
              resetSendFlow();
              // Also switch to receive tab optionally? No, stay on send but cleared
            }}
            className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-6 py-2.5 rounded-xl btn-bounce"
          >
            Send More Files
          </button>
        </div>
      );
    }

    return null;
  };

  // ── Render Receive Tab ──────────────────────────────────────────────────────
  const renderReceiveTab = () => {
    if (!transferData) {
      return (
        <div className="space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-stone-700 text-center">
              Enter the Transfer ID you received via email to download files.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Transfer ID</label>
            <input
              type="text"
              value={receiveTransferId}
              onChange={(e) => setReceiveTransferId(e.target.value.toUpperCase())}
              placeholder="e.g. BT-20250421-A3F7K"
              className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm font-mono"
            />
          </div>

          <button
            onClick={fetchTransfer}
            disabled={receiveLoading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-900 font-bold py-3 rounded-xl btn-bounce transition-colors flex items-center justify-center gap-2"
          >
            {receiveLoading ? (
              <><div className="w-4 h-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" /> Loading...</>
            ) : (
              <><I d={ic.search} size={16} stroke="#1a1a1a" /> Fetch Files</>
            )}
          </button>

          {transferError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-red-600 text-sm">{transferError}</p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-5" style={{ animation: "fadeIn .3s ease" }}>
        <div className="bg-gradient-to-r from-stone-800 to-stone-900 rounded-xl p-4 text-white">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <p className="text-xs opacity-60">Transfer ID</p>
              <p className="font-mono font-bold text-sm">{transferData.transferId}</p>
            </div>
            <div>
              <p className="text-xs opacity-60">From</p>
              <p className="text-sm font-semibold">{transferData.sender?.name || transferData.sender?.email}</p>
            </div>
            <div>
              <p className="text-xs opacity-60">Expires</p>
              <p className="text-sm">{new Date(transferData.expiresAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {transferData.message && (
          <div className="bg-amber-50 rounded-xl p-4">
            <p className="text-xs text-amber-600 font-semibold mb-1">📝 Message from sender</p>
            <p className="text-stone-700 text-sm italic">"{transferData.message}"</p>
          </div>
        )}

        <div>
          <h4 className="font-semibold text-stone-800 mb-3 text-sm">
            Files ({transferData.files.length}) • Total: {transferData.totalSizeFormatted}
          </h4>
          <div className="space-y-2">
            {transferData.files.map((file) => (
              <div key={file._id} className="flex items-center gap-3 bg-stone-50 rounded-xl p-3">
                <span className="text-2xl">{file.mimetype?.startsWith("image/") ? "🖼️" : "📄"}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-stone-800 text-sm truncate">{file.originalName}</div>
                  <div className="text-xs text-stone-400 flex gap-3 mt-0.5">
                    <span>{file.sizeFormatted}</span>
                    <span>⬇️ {file.downloadCount} downloads</span>
                  </div>
                </div>
                <button
                  onClick={() => downloadFile(file)}
                  disabled={downloadingFile === file._id}
                  className="bg-amber-500 hover:bg-amber-400 text-stone-900 px-4 py-2 rounded-xl text-sm font-semibold btn-bounce transition-colors disabled:opacity-60 flex items-center gap-1"
                >
                  {downloadingFile === file._id ? (
                    <div className="w-4 h-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><I d={ic.download} size={14} stroke="#1a1a1a" /> Download</>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {new Date(transferData.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <p className="text-xs text-amber-700">
              ⏰ These files will expire on {new Date(transferData.expiresAt).toLocaleDateString()}
            </p>
          </div>
        )}

        <button
          onClick={() => { setTransferData(null); setReceiveTransferId(""); setTransferError(""); }}
          className="w-full border border-stone-200 text-stone-600 font-semibold py-2.5 rounded-xl btn-bounce hover:bg-stone-50 text-sm"
        >
          Check Another Transfer
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg shadow-amber-200">
          🐝
        </div>
        <h1 className="font-display text-3xl font-bold text-stone-900 mb-2">BeeTransfer</h1>
        <p className="text-stone-500 text-sm">Secure file transfer with OTP protection</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {[["🔒", "End-to-End", "Encrypted"], ["⚡", "Up to 150MB", "Total limit"], ["📧", "Email Delivery", "With OTP"]].map(([icon, label, sub]) => (
          <div key={label} className="bg-white rounded-2xl border border-stone-100 p-3 text-center">
            <div className="text-xl">{icon}</div>
            <div className="text-xs font-semibold text-stone-800 mt-0.5">{label}</div>
            <div className="text-[10px] text-stone-400">{sub}</div>
          </div>
        ))}
      </div>

      <div className="flex rounded-xl border border-stone-200 overflow-hidden mb-6 bg-white">
        <button
          onClick={() => { setActiveTab("send"); resetSendFlow(); }}
          className={`flex-1 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === "send" ? "bg-amber-500 text-stone-900" : "text-stone-500 hover:bg-stone-50"}`}
        >
          <I d={ic.send} size={14} /> Send Files
        </button>
        <button
          onClick={() => { setActiveTab("receive"); setTransferData(null); setReceiveTransferId(""); }}
          className={`flex-1 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === "receive" ? "bg-amber-500 text-stone-900" : "text-stone-500 hover:bg-stone-50"}`}
        >
          <I d={ic.download} size={14} /> Receive Files
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm">
        {activeTab === "send" ? renderSendTab() : renderReceiveTab()}
      </div>

      <div className="mt-8 bg-white rounded-2xl border border-stone-100 p-6">
        <h3 className="font-display font-semibold text-stone-800 mb-4 text-center">How It Works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: "1", title: "Upload & Add Recipient", desc: "Select files (max 10, 15MB each), add recipient email", icon: "📤" },
            { step: "2", title: "Verify with OTP", desc: "Enter the OTP sent to your email to confirm the transfer", icon: "🔐" },
            { step: "3", title: "Receiver Gets Link", desc: "Your recipient receives a secure download link", icon: "📧" }
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-xl mx-auto mb-3">{item.icon}</div>
              <div className="font-semibold text-stone-800 text-sm">{item.title}</div>
              <p className="text-stone-400 text-xs mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPageRaw] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewToken, setReviewToken] = useState(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);

  // URL/routing init
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("page"); const id = params.get("id");
    const review = params.get("review") || params.get("token");
    const ticket = params.get("ticket");
    if (review) { setReviewToken(review); const url = new URL(window.location.href); url.searchParams.delete("review"); url.searchParams.delete("token"); window.history.replaceState({}, "", url.toString()); }
    if (p === "product" && id) setPageRaw(`product:${id}`);
    else if (p === "complaint" && ticket) { setPageRaw("complaint"); }
    else if (p) setPageRaw(p);
    // Show delivery info modal after 2s on first visit
    const shown = sessionStorage.getItem("delivery_modal_shown");
    if (!shown) { setTimeout(() => { setShowDeliveryModal(true); sessionStorage.setItem("delivery_modal_shown", "1"); }, 2500); }
  }, []);

  const setPage = useCallback((p) => {
    setPageRaw(p); window.scrollTo({ top: 0, behavior: "smooth" });
    const params = new URLSearchParams();
    if (p.startsWith("product:")) { params.set("page", "product"); params.set("id", p.split(":")[1]); }
    else if (p !== "home") params.set("page", p);
    window.history.pushState({}, "", params.toString() ? `?${params}` : window.location.pathname);
  }, []);

  useEffect(() => {
    const handler = () => {
      const params = new URLSearchParams(window.location.search);
      const p = params.get("page"); const id = params.get("id");
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
      case "complaint": return <ComplaintPage />;
      case "transfer": return <BeeTransferPage />;
      // case "contact": return <ContactPage />;
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
            {reviewToken && <ReviewModal token={reviewToken} onClose={() => setReviewToken(null)} />}
            {showDeliveryModal && <DeliveryChargesModal onClose={() => setShowDeliveryModal(false)} />}
          </div>
        </CartProvider>
      </ToastProvider>
    </NavCtx.Provider>
  );
}
