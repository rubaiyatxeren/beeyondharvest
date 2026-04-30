import React, { useMemo, useState } from 'react';
import { Sk } from '../components/common/Skeleton';
import { useAPI } from '../hooks/useAPI';
import { CDN } from '../utils/helpers';
import BlogDetail from './BlogDetail';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const fmt = (d) =>
    new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const stripHtml = (html = '') => html.replace(/<[^>]*>/g, '');

const getExcerpt = (blog) =>
    blog.excerpt || stripHtml(blog.body || '').slice(0, 120) + '…';

/* ─── Sub-components ──────────────────────────────────────────────────────── */

const CatBadge = ({ label, variant = 'default' }) => {
    if (!label) return null;
    const styles = {
        default: 'bg-amber-100 text-amber-700 border border-amber-200',
        featured: 'bg-amber-500 text-white border border-amber-500',
        pinned: 'bg-stone-900 text-amber-300 border border-stone-900',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${styles[variant]}`}>
            {variant === 'featured' && '★ '}{variant === 'pinned' && '📌 '}{label}
        </span>
    );
};

const TagChip = ({ tag }) => (
    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 text-stone-500 border border-stone-200">
        #{tag}
    </span>
);

const AuthorRow = ({ author }) => {
    if (!author?.name) return null;
    return (
        <div className="flex items-center gap-2">
            {author.avatar ? (
                <img src={author.avatar} alt={author.name} className="w-6 h-6 rounded-full object-cover border-2 border-amber-100" />
            ) : (
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-600 border-2 border-amber-200">
                    {author.name[0].toUpperCase()}
                </div>
            )}
            <span className="text-[11px] text-stone-500 font-medium">{author.name}</span>
        </div>
    );
};

const StatsRow = ({ blog }) => (
    <div className="flex items-center gap-3 text-[11px] text-stone-400">
        {blog.readingTime && <span>⏱ {blog.readingTime} min</span>}
        <span>👁 {(blog.views || 0).toLocaleString()}</span>
        <span>❤️ {blog.likes || 0}</span>
        {(blog.comments?.filter(c => c.isApproved).length > 0) && (
            <span>💬 {blog.comments.filter(c => c.isApproved).length}</span>
        )}
    </div>
);

const Cover = ({ blog, className }) => (
    <div className={`bg-amber-50 overflow-hidden ${className}`}>
        {blog.coverImage?.url ? (
            <img
                src={CDN(blog.coverImage.url)}
                alt={blog.coverImage.alt || blog.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
        ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl select-none">🍯</div>
        )}
    </div>
);

/* ─── Hero Card ─────────────────────────────────────────────────────────── */
const HeroCard = ({ blog, onClick }) => (
    <div
        onClick={onClick}
        className="group relative rounded-2xl overflow-hidden cursor-pointer h-[420px] bg-stone-900 shadow-2xl transition-transform duration-300 hover:-translate-y-1"
    >
        {blog.coverImage?.url ? (
            <img
                src={CDN(blog.coverImage.url)}
                alt={blog.title}
                className="absolute inset-0 w-full h-full object-cover opacity-60 transition-all duration-700 group-hover:opacity-45 group-hover:scale-105"
            />
        ) : (
            <div className="absolute inset-0 flex items-center justify-center text-8xl bg-amber-900/30">🍯</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
                <CatBadge label={blog.category} variant={blog.isPinned ? 'pinned' : 'featured'} />
                {blog.tags?.slice(0, 2).map(t => (
                    <span key={t} className="text-[10px] font-mono text-amber-300/70">#{t}</span>
                ))}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black leading-tight mb-3 line-clamp-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                {blog.title}
            </h2>
            <p className="text-stone-300 text-sm line-clamp-2 mb-5 max-w-xl leading-relaxed">
                {getExcerpt(blog)}
            </p>
            <div className="flex items-center justify-between flex-wrap gap-3">
                <AuthorRow author={blog.author} />
                <div className="flex items-center gap-3 text-[11px] text-stone-400">
                    <span>{fmt(blog.publishedAt || blog.createdAt)}</span>
                    {blog.readingTime && <span>⏱ {blog.readingTime} min read</span>}
                    <span>👁 {(blog.views || 0).toLocaleString()}</span>
                </div>
            </div>
        </div>
        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">Read →</span>
        </div>
    </div>
);

/* ─── Grid Card ─────────────────────────────────────────────────────────── */
const GridCard = ({ blog, onClick }) => (
    <div
        onClick={onClick}
        className="group flex flex-col bg-white rounded-2xl border border-stone-100 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(200,132,26,0.14)] hover:border-amber-200"
    >
        <Cover blog={blog} className="h-48 flex-shrink-0" />
        <div className="flex flex-col flex-1 p-5 gap-3">
            <div className="flex items-center gap-2 flex-wrap">
                <CatBadge label={blog.category} variant={blog.isFeatured ? 'featured' : 'default'} />
                {blog.isPinned && <CatBadge label="Pinned" variant="pinned" />}
            </div>
            <h3
                className="font-bold text-stone-900 text-base leading-snug line-clamp-2 group-hover:text-amber-700 transition-colors duration-200"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
                {blog.title}
            </h3>
            <p className="text-stone-500 text-sm line-clamp-2 leading-relaxed flex-1">{getExcerpt(blog)}</p>
            {blog.tags?.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                    {blog.tags.slice(0, 3).map(t => <TagChip key={t} tag={t} />)}
                </div>
            )}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                <AuthorRow author={blog.author} />
                <span className="text-[10px] text-stone-400 tabular-nums">{fmt(blog.publishedAt || blog.createdAt)}</span>
            </div>
            <StatsRow blog={blog} />
        </div>
    </div>
);

/* ─── List Card ─────────────────────────────────────────────────────────── */
const ListCard = ({ blog, onClick }) => (
    <div
        onClick={onClick}
        className="group flex bg-white rounded-2xl border border-stone-100 overflow-hidden cursor-pointer transition-all duration-300 hover:translate-x-1 hover:shadow-[0_8px_32px_rgba(200,132,26,0.12)] hover:border-amber-200"
    >
        <Cover blog={blog} className="w-40 sm:w-48 flex-shrink-0" />
        <div className="flex flex-col justify-center flex-1 px-5 py-4 gap-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
                <CatBadge label={blog.category} variant={blog.isFeatured ? 'featured' : 'default'} />
                {blog.isPinned && <CatBadge label="Pinned" variant="pinned" />}
            </div>
            <h3
                className="font-bold text-stone-900 text-sm leading-snug line-clamp-2 group-hover:text-amber-700 transition-colors"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
                {blog.title}
            </h3>
            <p className="text-stone-500 text-xs line-clamp-2 leading-relaxed hidden sm:block">{getExcerpt(blog)}</p>
            <div className="flex items-center justify-between gap-3 mt-1 flex-wrap">
                <AuthorRow author={blog.author} />
                <div className="flex items-center gap-3 text-[10px] text-stone-400">
                    <span>{fmt(blog.publishedAt || blog.createdAt)}</span>
                    <span>👁 {blog.views || 0}</span>
                    <span>❤️ {blog.likes || 0}</span>
                    {blog.readingTime && <span>⏱ {blog.readingTime}m</span>}
                </div>
            </div>
            {blog.tags?.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-0.5">
                    {blog.tags.slice(0, 4).map(t => <TagChip key={t} tag={t} />)}
                </div>
            )}
        </div>
    </div>
);

/* ─── Skeletons ─────────────────────────────────────────────────────────── */
const GridSkeleton = () => (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        <Sk className="h-48 rounded-none" />
        <div className="p-5 space-y-3">
            <Sk className="h-3 w-20" /><Sk className="h-5 w-4/5" /><Sk className="h-3 w-full" /><Sk className="h-3 w-2/3" />
        </div>
    </div>
);

const ListSkeleton = () => (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden flex h-36">
        <Sk className="w-44 rounded-none flex-shrink-0" />
        <div className="flex-1 p-4 space-y-2.5"><Sk className="h-3 w-16" /><Sk className="h-4 w-4/5" /><Sk className="h-3 w-full" /></div>
    </div>
);

/* ─── Main Component ────────────────────────────────────────────────────── */
const BlogPage = () => {
    const [selected, setSelected] = useState(null);
    const [view, setView] = useState('grid');
    const [activeCategory, setActiveCategory] = useState('All');
    const [search, setSearch] = useState('');

    const { data: raw, loading } = useAPI('/api/blogs?status=published&limit=24');
    const allBlogs = raw?.blogs || raw || [];

    const categories = useMemo(() => {
        return ['All', ...new Set(allBlogs.map(b => b.category).filter(Boolean))];
    }, [allBlogs]);

    const heroPost = useMemo(
        () => allBlogs.find(b => b.isPinned || b.isFeatured) || allBlogs[0],
        [allBlogs]
    );

    const filtered = useMemo(() => {
        let list = allBlogs.filter(b => b._id !== heroPost?._id);
        if (activeCategory !== 'All') list = list.filter(b => b.category === activeCategory);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(b =>
                b.title?.toLowerCase().includes(q) ||
                b.excerpt?.toLowerCase().includes(q) ||
                b.tags?.some(t => t.includes(q)) ||
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
                    <p className="text-[10px] font-mono tracking-[0.22em] text-amber-600 uppercase mb-3">
                        Beeyond Harvest · Journal
                    </p>
                    <h1
                        className="text-5xl sm:text-6xl font-black text-stone-900 leading-none tracking-tight mb-4"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
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
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search posts, tags, authors…"
                            className="w-full sm:w-80 pl-10 pr-4 py-2.5 rounded-full border border-stone-200 bg-white text-sm text-stone-800 placeholder-stone-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl p-1">
                        <button
                            onClick={() => setView('grid')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === 'grid' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-800'}`}
                        >
                            ⊞ Grid
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === 'list' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-800'}`}
                        >
                            ☰ List
                        </button>
                    </div>
                </div>

                {/* Category filters */}
                <div className="flex items-center gap-2 flex-wrap mb-10 pb-6 border-b border-stone-200">
                    {(loading ? ['All', 'Recipes', 'Beekeeping', 'Health'] : categories).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all duration-200 ${activeCategory === cat
                                    ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200'
                                    : 'bg-white border-stone-200 text-stone-600 hover:border-amber-300 hover:text-amber-700'
                                }`}
                        >
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
                        <h3 className="text-xl font-bold text-stone-700 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                            The hive is quiet…
                        </h3>
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

                        {/* Posts */}
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
                                        {filtered.map(blog => (
                                            <GridCard key={blog._id} blog={blog} onClick={() => setSelected(blog)} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {filtered.map(blog => (
                                            <ListCard key={blog._id} blog={blog} onClick={() => setSelected(blog)} />
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}

                        {/* No results */}
                        {filtered.length === 0 && (activeCategory !== 'All' || search) && (
                            <div className="text-center py-20">
                                <p className="text-4xl mb-4">🔍</p>
                                <p className="text-stone-500 font-medium">No posts match your search.</p>
                                <button
                                    onClick={() => { setSearch(''); setActiveCategory('All'); }}
                                    className="mt-4 text-amber-600 text-sm underline underline-offset-2 hover:text-amber-800 transition-colors"
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer rule */}
                {!loading && allBlogs.length > 0 && (
                    <div className="text-center mt-16 pt-10 border-t border-stone-200">
                        <p className="text-[11px] font-mono text-stone-400 tracking-widest uppercase">
                            Beeyond Harvest · Pure, Natural, Honest
                        </p>
                    </div>
                )}
            </div>

            <style>{`@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }`}</style>
        </div>
    );
};

export default BlogPage;
