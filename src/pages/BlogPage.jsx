/**
 * BlogPage.jsx  (refactored)
 * ─────────────────────────────────────────────────────────────
 * Widgets consumed:
 *   HeroCard, GridCard, ListCard  ← widgets/BlogCard
 *   GridSkeleton, ListSkeleton    ← widgets/BlogCard
 * ─────────────────────────────────────────────────────────────
 */

import React, { useMemo, useState } from 'react';
import { Sk } from '../components/common/Skeleton';
import { useAPI } from '../hooks/useAPI';
import { GridCard, GridSkeleton, HeroCard, ListCard } from '../widgets/BlogCard';
import BlogDetail from './BlogDetail';

const BlogPage = () => {
    const [selected, setSelected] = useState(null);
    const [view, setView] = useState('grid');
    const [activeCategory, setActiveCategory] = useState('All');
    const [search, setSearch] = useState('');

    const { data: raw, loading } = useAPI('/api/blogs?status=published&limit=24');
    const allBlogs = raw?.blogs || raw || [];

    const categories = useMemo(
        () => ['All', ...new Set(allBlogs.map((b) => b.category).filter(Boolean))],
        [allBlogs]
    );

    const heroPost = useMemo(
        () => allBlogs.find((b) => b.isPinned || b.isFeatured) || allBlogs[0],
        [allBlogs]
    );

    const filtered = useMemo(() => {
        let list = allBlogs.filter((b) => b._id !== heroPost?._id);
        if (activeCategory !== 'All') list = list.filter((b) => b.category === activeCategory);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter((b) =>
                b.title?.toLowerCase().includes(q) ||
                b.excerpt?.toLowerCase().includes(q) ||
                b.tags?.some((t) => t.includes(q)) ||
                b.author?.name?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [allBlogs, heroPost, activeCategory, search]);

    if (selected) return <BlogDetail blog={selected} onBack={() => setSelected(null)} />;

    return (
        <div className="min-h-screen bg-[#faf6ef]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">

                {/* Masthead */}
                <div className="text-center mb-12">
                    <p className="text-[10px] font-mono tracking-[0.22em] text-amber-600 uppercase mb-3">Beeyond Harvest · Journal</p>
                    <h1 className="text-5xl sm:text-6xl font-black text-stone-900 leading-none tracking-tight mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                        The Honey Blog
                    </h1>
                    <div className="flex items-center justify-center gap-3 my-4">
                        <div className="h-px w-16 bg-amber-300" />
                        <span className="text-xl">🍯</span>
                        <div className="h-px w-16 bg-amber-300" />
                    </div>
                    <p className="text-stone-500 text-base max-w-md mx-auto leading-relaxed">
                        Recipes, beekeeping wisdom & natural living stories — straight from the hive.
                    </p>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <div className="relative w-full sm:w-auto">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                        </svg>
                        <input
                            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search posts, tags, authors…"
                            className="w-full sm:w-80 pl-10 pr-4 py-2.5 rounded-full border border-stone-200 bg-white text-sm text-stone-800 placeholder-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl p-1">
                        {['grid', 'list'].map((v) => (
                            <button key={v} onClick={() => setView(v)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === v ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-800'}`}>
                                {v === 'grid' ? '⊞ Grid' : '☰ List'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Category filters */}
                <div className="flex items-center gap-2 flex-wrap mb-10 pb-6 border-b border-stone-200">
                    {(loading ? ['All', 'Recipes', 'Beekeeping', 'Health'] : categories).map((cat) => (
                        <button key={cat} onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all duration-200 ${activeCategory === cat
                                ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200'
                                : 'bg-white border-stone-200 text-stone-600 hover:border-amber-300 hover:text-amber-700'
                                }`}>
                            {cat}
                        </button>
                    ))}
                    {!loading && (
                        <span className="ml-auto text-xs text-stone-400 font-mono tabular-nums">
                            {filtered.length + (heroPost && activeCategory === 'All' && !search ? 1 : 0)} posts
                        </span>
                    )}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="space-y-10">
                        <Sk className="h-[420px] rounded-2xl" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Array.from({ length: 6 }).map((_, i) => <GridSkeleton key={i} />)}
                        </div>
                    </div>
                ) : allBlogs.length === 0 ? (
                    <div className="text-center py-24">
                        <div className="text-7xl mb-6" style={{ animation: 'float 3s ease-in-out infinite' }}>🐝</div>
                        <h3 className="text-xl font-bold text-stone-700 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>The hive is quiet…</h3>
                        <p className="text-stone-400 text-sm">No posts yet. Our bees are still working on it!</p>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {/* Hero */}
                        {heroPost && activeCategory === 'All' && !search && (
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-xs font-mono text-amber-600 tracking-widest uppercase">Featured</span>
                                    <div className="h-px flex-1 bg-stone-200" />
                                </div>
                                <HeroCard blog={heroPost} onClick={() => setSelected(heroPost)} />
                            </section>
                        )}

                        {/* Post grid/list */}
                        {filtered.length > 0 && (
                            <section>
                                {activeCategory === 'All' && !search && (
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="text-xs font-mono text-stone-400 tracking-widest uppercase">Latest Posts</span>
                                        <div className="h-px flex-1 bg-stone-200" />
                                    </div>
                                )}
                                {view === 'grid' ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filtered.map((blog) => <GridCard key={blog._id} blog={blog} onClick={() => setSelected(blog)} />)}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {filtered.map((blog) => <ListCard key={blog._id} blog={blog} onClick={() => setSelected(blog)} />)}
                                    </div>
                                )}
                            </section>
                        )}

                        {filtered.length === 0 && (activeCategory !== 'All' || search) && (
                            <div className="text-center py-20">
                                <p className="text-4xl mb-4">🔍</p>
                                <p className="text-stone-500 font-medium">No posts match your search.</p>
                                <button onClick={() => { setSearch(''); setActiveCategory('All'); }}
                                    className="mt-4 text-amber-600 text-sm underline underline-offset-2 hover:text-amber-800 transition-colors">
                                    Clear filters
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {!loading && allBlogs.length > 0 && (
                    <div className="text-center mt-16 pt-10 border-t border-stone-200">
                        <p className="text-[11px] font-mono text-stone-400 tracking-widest uppercase">Beeyond Harvest · Pure, Natural, Honest</p>
                    </div>
                )}
            </div>

            <style>{`@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }`}</style>
        </div>
    );
};

export default BlogPage;