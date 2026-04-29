import React, { useMemo, useState } from 'react';
import { I, ic } from '../components/common/Icons';
import { ProductCard } from '../components/common/ProductCard';
import { Sk } from '../components/common/Skeleton';
import { useNav } from '../components/providers/NavProvider';
import { useAPI } from '../hooks/useAPI';

const ShopPage = () => {
    const { setPage, searchQuery, setSearchQuery } = useNav();
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
                    <button onClick={() => setSidebarOpen(!sidebarOpen)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium btn-bounce transition-all ${sidebarOpen ? "bg-amber-50 border-amber-200 text-amber-700" : "border-stone-200 text-stone-600"
                            }`}>
                        <I d={ic.filter} size={15} /> Filters
                    </button>
                    <select value={filters.sort} onChange={(e) => setF("sort", e.target.value)}
                        className="border border-stone-200 rounded-xl px-3 py-2 text-sm font-medium bg-white text-stone-700">
                        <option value="-createdAt">Newest First</option>
                        <option value="price">Price: Low → High</option>
                        <option value="-price">Price: High → Low</option>
                        <option value="-avgRating">Best Rated</option>
                        <option value="-salesCount">Most Popular</option>
                    </select>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <I d={ic.search} size={17} className="text-stone-400" />
                </div>
                <input value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setFilters((f) => ({ ...f, page: 1 })); }}
                    placeholder="Search products…"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm transition-all" />
                {searchQuery && (
                    <button onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700">
                        <I d={ic.x} size={15} />
                    </button>
                )}
            </div>

            <div className="flex gap-6 items-start">
                {/* Sidebar Filters */}
                {sidebarOpen && (
                    <div className="hidden sm:block w-56 flex-shrink-0 bg-white rounded-2xl border border-stone-100 p-5 sticky top-20" style={{ animation: "slideUp .2s ease" }}>
                        <h3 className="font-semibold text-stone-800 text-sm mb-4">Categories</h3>
                        {[{ _id: "", name: "All Categories" }, ...cats].map((cat) => (
                            <button key={cat._id} onClick={() => setF("category", cat._id)}
                                className={`block w-full text-left px-3 py-2 rounded-xl text-sm mb-1 transition-all btn-bounce ${filters.category === cat._id ? "bg-amber-50 text-amber-700 font-semibold" : "text-stone-600 hover:bg-stone-50"
                                    }`}>
                                {cat.name}
                            </button>
                        ))}

                        <div className="border-t border-stone-100 mt-4 pt-4">
                            <h3 className="font-semibold text-stone-800 text-sm mb-3">Price Range (৳)</h3>
                            <div className="flex gap-2">
                                <input type="number" value={filters.minPrice} onChange={(e) => setF("minPrice", e.target.value)}
                                    placeholder="Min" className="w-1/2 px-2 py-2 rounded-lg border border-stone-200 text-sm" />
                                <input type="number" value={filters.maxPrice} onChange={(e) => setF("maxPrice", e.target.value)}
                                    placeholder="Max" className="w-1/2 px-2 py-2 rounded-lg border border-stone-200 text-sm" />
                            </div>
                        </div>

                        {(filters.category || filters.minPrice || filters.maxPrice || searchQuery) && (
                            <button onClick={() => { setFilters({ category: "", sort: "-createdAt", minPrice: "", maxPrice: "", page: 1 }); setSearchQuery(""); }}
                                className="mt-4 w-full flex items-center justify-center gap-1.5 text-red-500 text-xs font-semibold border border-red-100 rounded-xl py-2 hover:bg-red-50 btn-bounce">
                                <I d={ic.x} size={13} stroke="#ef4444" /> Clear Filters
                            </button>
                        )}
                    </div>
                )}

                {/* Products Grid */}
                <div className="flex-1 min-w-0">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {Array.from({ length: 9 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                                    <Sk className="h-48 rounded-none" />
                                    <div className="p-4 space-y-2">
                                        <Sk className="h-3 w-1/3" />
                                        <Sk className="h-4" />
                                        <Sk className="h-3 w-1/2" />
                                    </div>
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
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {products.map((p) => (
                                <ProductCard key={p._id} product={p} onView={() => setPage(`product:${p._id}`)} />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pages > 1 && (
                        <div className="flex justify-center gap-2 mt-10">
                            <button disabled={filters.page === 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                                className="p-2 rounded-xl border border-stone-200 disabled:opacity-40 hover:bg-stone-50 btn-bounce">
                                <I d={ic.chev_l} size={16} />
                            </button>
                            {Array.from({ length: Math.min(7, pages) }, (_, i) => i + 1).map((p) => (
                                <button key={p} onClick={() => setFilters((f) => ({ ...f, page: p }))}
                                    className={`w-9 h-9 rounded-xl text-sm font-medium btn-bounce border transition-all ${filters.page === p ? "bg-amber-500 text-white border-amber-500 shadow-md" : "border-stone-200 hover:border-amber-300 text-stone-600"
                                        }`}>
                                    {p}
                                </button>
                            ))}
                            <button disabled={filters.page === pages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                                className="p-2 rounded-xl border border-stone-200 disabled:opacity-40 hover:bg-stone-50 btn-bounce">
                                <I d={ic.chev_r} size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShopPage;