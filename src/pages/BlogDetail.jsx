/**
 * BlogDetail.jsx  (refactored)
 * ─────────────────────────────────────────────────────────────
 * Widgets consumed:
 *   ReadingProgress  ← widgets/ReadingProgress
 *   ShareBar         ← widgets/ShareBar
 *   AuthorBlock      ← widgets/AuthorBlock
 *   CommentSection   ← widgets/CommentSection
 *   CatBadge, TagChip, MetaPill, LangBadge  ← widgets/HoneyBadge
 * ─────────────────────────────────────────────────────────────
 */

import React, { useEffect, useRef, useState } from 'react';
import { I, ic } from '../components/common/Icons';
import { Sk } from '../components/common/Skeleton';
import { useToast } from '../components/providers/ToastProvider';
import { useAPI } from '../hooks/useAPI';
import { API } from '../utils/constants';
import { CDN } from '../utils/helpers';
import { AuthorBlock } from '../widgets/AuthorBlock';
import { CommentSection } from '../widgets/CommentSection';
import { CatBadge, LangBadge, MetaPill, TagChip } from '../widgets/HoneyBadge';
import { ReadingProgress } from '../widgets/ReadingProgress';
import { ShareBar } from '../widgets/ShareBar';

const FONTS = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap';

const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtLong = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/* ── Loading skeleton ── */
const DetailSkeleton = () => (
    <div className="animate-pulse space-y-6 pt-4">
        <Sk className="h-[300px] sm:h-[460px] rounded-3xl" />
        <div className="space-y-3 max-w-lg">
            <Sk className="h-3.5 w-28 rounded-full" />
            <Sk className="h-12 w-5/6 rounded-xl" />
            <Sk className="h-4 w-1/2 rounded-lg" />
        </div>
        <div className="space-y-3 pt-4">
            {[100, 96, 92, 88, 60].map((w, i) => (
                <Sk key={i} className="h-4 rounded-lg" style={{ width: `${w}%` }} />
            ))}
        </div>
    </div>
);

/* ── Rich-text body renderer (class injector) ── */
const BODY_REPLACEMENTS = [
    [/<h1([^>]*)>/g, `<h1$1 class="text-4xl font-bold text-stone-950 mt-12 mb-5 leading-tight" style="font-family:'Cormorant Garamond',Georgia,serif">`],
    [/<h2([^>]*)>/g, `<h2$1 class="text-3xl font-bold text-stone-900 mt-10 mb-4 leading-snug" style="font-family:'Cormorant Garamond',Georgia,serif">`],
    [/<h3([^>]*)>/g, `<h3$1 class="text-2xl font-semibold text-stone-800 mt-8 mb-3" style="font-family:'Cormorant Garamond',Georgia,serif">`],
    [/<p([^>]*)>/g, '<p$1 class="mb-5">'],
    [/<ul([^>]*)>/g, '<ul$1 class="mb-5 space-y-2 pl-4">'],
    [/<ol([^>]*)>/g, '<ol$1 class="mb-5 space-y-2 pl-4 list-decimal">'],
    [/<li([^>]*)>/g, `<li$1 class="text-stone-700 leading-relaxed relative pl-2 before:content-['›'] before:absolute before:-left-2 before:text-amber-400 before:font-bold">`],
    [/<blockquote([^>]*)>/g, `<blockquote$1 class="border-l-[3px] border-amber-400 pl-6 italic py-4 my-8 bg-amber-50 pr-5 rounded-r-2xl text-stone-700 text-lg" style="font-family:'Cormorant Garamond',Georgia,serif">`],
    [/<a([^>]*)>/g, '<a$1 class="text-amber-600 underline underline-offset-4 decoration-amber-300 hover:text-amber-800 hover:decoration-amber-500 transition-colors">'],
    [/<strong([^>]*)>/g, '<strong$1 class="font-semibold text-stone-900">'],
    [/<em([^>]*)>/g, '<em$1 class="italic text-stone-600">'],
    [/<code([^>]*)>/g, '<code$1 class="bg-stone-100 text-amber-700 px-2 py-0.5 rounded-md text-[13px] font-mono border border-stone-200">'],
    [/<pre([^>]*)>/g, '<pre$1 class="bg-stone-950 text-stone-200 rounded-2xl p-6 overflow-x-auto text-sm font-mono my-8 shadow-xl">'],
    [/<img([^>]*)>/g, '<img$1 class="w-full rounded-2xl shadow-lg my-8 border border-stone-100">'],
    [/<hr([^>]*)>/g, '<hr$1 class="border-0 border-t border-stone-200 my-10">'],
    [/<table([^>]*)>/g, '<table$1 class="w-full text-sm border-collapse rounded-xl overflow-hidden shadow-sm mb-6">'],
    [/<th([^>]*)>/g, '<th$1 class="bg-stone-100 text-stone-700 font-semibold text-left px-4 py-2.5 border border-stone-200">'],
    [/<td([^>]*)>/g, '<td$1 class="px-4 py-2.5 border border-stone-100 text-stone-600">'],
];

const renderBody = (raw = '') =>
    BODY_REPLACEMENTS.reduce((html, [pattern, replacement]) => html.replace(pattern, replacement), raw.replace(/\n/g, '<br>'));

/* ════════════════════════════════════════════════════════════
   BlogDetail
════════════════════════════════════════════════════════════ */
const BlogDetail = ({ blog, onBack }) => {
    const pageRef = useRef(null);
    const { data: fullBlog, loading } = useAPI(blog._id ? `/api/blogs/${blog._id}` : null, [], !blog._id);
    const blogData = fullBlog?.data || fullBlog || blog;

    const toast = useToast();
    const [liked, setLiked] = useState(false);
    const [localLikes, setLocalLikes] = useState(0);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [galleryOpen, setGalleryOpen] = useState(null);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        if (pageRef.current) pageRef.current.scrollTop = 0;
    }, [blog._id]);

    useEffect(() => {
        if (blogData._id && blogData.status === 'published') {
            fetch(`${API}/api/blogs/${blogData._id}/views`, { method: 'PUT' }).catch(() => { });
        }
        setLocalLikes(blogData.likes || 0);
    }, [blogData._id]);

    const handleLike = () => {
        if (liked) return;
        setLiked(true);
        setLocalLikes((n) => n + 1);
        fetch(`${API}/api/blogs/${blogData._id}/like`, { method: 'PUT' }).catch(() => { });
    };

    const approvedComments = blogData.comments?.filter((c) => c.isApproved) || [];

    return (
        <>
            <link href={FONTS} rel="stylesheet" />
            <ReadingProgress />

            {/* ── Gallery Lightbox ── */}
            {galleryOpen !== null && blogData.gallery?.[galleryOpen] && (
                <div className="fixed inset-0 z-50 bg-stone-950/92 flex items-center justify-center p-4 sm:p-8 backdrop-blur-md" onClick={() => setGalleryOpen(null)}>
                    <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
                        <img src={CDN(blogData.gallery[galleryOpen].url)} alt={blogData.gallery[galleryOpen].alt || ''} className="w-full max-h-[78vh] object-contain rounded-2xl shadow-2xl" />
                        <button onClick={() => setGalleryOpen(null)} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-stone-700 flex items-center justify-center font-bold shadow-xl hover:bg-stone-100 transition-colors text-lg leading-none">×</button>
                        <div className="flex items-center justify-between mt-4 gap-3">
                            <button onClick={() => setGalleryOpen((i) => Math.max(0, i - 1))} disabled={galleryOpen === 0} className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium disabled:opacity-25 hover:bg-white/20 transition-colors">← Prev</button>
                            <span className="text-white/50 text-xs font-mono">{galleryOpen + 1} / {blogData.gallery.length}</span>
                            <button onClick={() => setGalleryOpen((i) => Math.min(blogData.gallery.length - 1, i + 1))} disabled={galleryOpen === blogData.gallery.length - 1} className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium disabled:opacity-25 hover:bg-white/20 transition-colors">Next →</button>
                        </div>
                    </div>
                </div>
            )}

            <div ref={pageRef} className="min-h-screen bg-[#FAF8F4]" style={{ fontFamily: "'DM Sans', sans-serif" }}>

                {/* ── Sticky topbar ── */}
                <div className="sticky top-0 z-40 bg-[#FAF8F4]/95 backdrop-blur-md border-b border-stone-200/70 shadow-sm shadow-stone-100/60">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
                        <button onClick={onBack} className="group flex-shrink-0 flex items-center gap-2 text-sm text-stone-600 hover:text-amber-600 font-medium transition-colors duration-200">
                            <span className="w-8 h-8 rounded-full border border-stone-200 bg-white flex items-center justify-center group-hover:border-amber-400 group-hover:bg-amber-50 group-hover:shadow-md transition-all duration-200 shadow-sm">
                                <I d={ic.chev_l} size={14} />
                            </span>
                            <span className="hidden sm:inline text-[13px]">Back to Journal</span>
                        </button>
                        {!loading && (
                            <div className="ml-auto">
                                <ShareBar title={blogData.title} compact label />
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-24">
                    {loading ? <DetailSkeleton /> : (
                        <article>
                            {/* Hero image */}
                            {blogData.coverImage?.url && (
                                <div className="relative w-full h-[260px] sm:h-[330px] rounded-3xl overflow-hidden mb-10 shadow-2xl shadow-stone-300/50 bg-stone-200">
                                    <img
                                        src={CDN(blogData.coverImage.url)}
                                        alt={blogData.coverImage.alt || blogData.title}
                                        onLoad={() => setImgLoaded(true)}
                                        className={`w-full h-full object-cover transition-opacity duration-700 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/55 via-transparent to-stone-950/10 pointer-events-none" />
                                    <div className="absolute top-5 left-5 flex items-center gap-2">
                                        {blogData.isFeatured && <CatBadge label="Featured" variant="featured" />}
                                        {blogData.isPinned && <CatBadge label="Pinned" variant="pinned" />}
                                    </div>
                                    {blogData.coverImage.credit && (
                                        <span className="absolute bottom-4 right-4 text-[10px] text-white/50 font-mono bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
                                            © {blogData.coverImage.credit}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Category + Tags + Language */}
                            <div className="flex items-center gap-2 flex-wrap mb-5">
                                {blogData.category && <CatBadge label={blogData.category} variant="featured" />}
                                {blogData.tags?.slice(0, 5).map((tag) => <TagChip key={tag} tag={tag} hoverable />)}
                                <span className="ml-auto flex-shrink-0">
                                    <LangBadge lang={blogData.contentLanguage} />
                                </span>
                            </div>

                            {/* Title */}
                            <h1 className="text-4xl sm:text-5xl font-bold text-stone-950 leading-[1.1] tracking-tight mb-6" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                                {blogData.title}
                            </h1>

                            {/* Meta stats */}
                            <div className="flex items-center gap-x-5 gap-y-2 flex-wrap pb-6 mb-0 border-b border-stone-200">
                                <MetaPill icon="📅">{fmtLong(blogData.publishedAt || blogData.createdAt)}</MetaPill>
                                <MetaPill icon="👁">{(blogData.views || 0).toLocaleString()} views</MetaPill>
                                {blogData.readingTime && <MetaPill icon="⏱">{blogData.readingTime} min read</MetaPill>}
                                {blogData.shares > 0 && <MetaPill icon="↗">{blogData.shares} shares</MetaPill>}
                                {approvedComments.length > 0 && <MetaPill icon="💬">{approvedComments.length} comment{approvedComments.length > 1 ? 's' : ''}</MetaPill>}
                                {blogData.likes > 0 && <MetaPill icon="❤️">{blogData.likes} likes</MetaPill>}
                                {blogData.updatedAt && blogData.updatedAt !== blogData.createdAt && (
                                    <span className="text-[11px] font-mono text-stone-300 ml-auto">Updated {fmt(blogData.updatedAt)}</span>
                                )}
                            </div>

                            {/* Author */}
                            <AuthorBlock author={blogData.author} />

                            {/* Excerpt pull-quote */}
                            {blogData.excerpt && (
                                <div className="relative my-10 px-8 py-6 bg-white border-l-[3px] border-amber-400 rounded-r-2xl shadow-sm">
                                    <span className="absolute -top-4 left-5 text-7xl text-amber-200 select-none leading-none pointer-events-none" style={{ fontFamily: 'Georgia, serif' }}>"</span>
                                    <p className="text-stone-700 text-xl leading-relaxed italic relative z-10" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                                        {blogData.excerpt}
                                    </p>
                                </div>
                            )}

                            {/* Body */}
                            <div
                                className="text-stone-700 text-[16px] sm:text-[17px] leading-[1.9] mb-10"
                                dangerouslySetInnerHTML={{ __html: renderBody(blogData.body || blogData.content || '') }}
                            />

                            {/* Gallery */}
                            {blogData.gallery?.length > 0 && (
                                <section className="mb-12">
                                    <div className="flex items-center gap-4 mb-7">
                                        <div className="h-px flex-1 bg-stone-200" />
                                        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-stone-400 flex-shrink-0">Photo Gallery</span>
                                        <span className="text-[10px] font-mono text-stone-400 tabular-nums flex-shrink-0">{blogData.gallery.length} photo{blogData.gallery.length > 1 ? 's' : ''}</span>
                                        <div className="h-px w-8 bg-stone-200" />
                                    </div>
                                    <div className={`grid gap-3 ${blogData.gallery.length === 1 ? 'grid-cols-1' : blogData.gallery.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                                        {blogData.gallery.map((img, i) => (
                                            <div key={i} onClick={() => setGalleryOpen(i)} className="group relative aspect-video rounded-2xl overflow-hidden bg-stone-100 cursor-zoom-in ring-1 ring-stone-200 hover:ring-amber-300 transition-all duration-300">
                                                <img src={CDN(img.url)} alt={img.alt || `Photo ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                <div className="absolute inset-0 bg-stone-950/0 group-hover:bg-stone-950/25 transition-all duration-300 flex items-center justify-center">
                                                    <span className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg">⊕</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Related products */}
                            {blogData.relatedProducts?.length > 0 && (
                                <div className="relative bg-gradient-to-br from-amber-50 to-stone-50 border border-amber-200/60 rounded-3xl p-6 mb-10 overflow-hidden">
                                    <div className="absolute top-0 right-2 text-[96px] leading-none opacity-[0.06] select-none pointer-events-none">🍯</div>
                                    <div className="relative flex items-center justify-between gap-5 flex-wrap">
                                        <div>
                                            <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-amber-500 mb-1.5">From the Store</p>
                                            <p className="font-semibold text-stone-900 text-base mb-0.5" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Products mentioned in this post</p>
                                            <p className="text-stone-500 text-sm">{blogData.relatedProducts.length} related product{blogData.relatedProducts.length > 1 ? 's' : ''} — pure, natural honey.</p>
                                        </div>
                                        <button className="flex-shrink-0 bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-amber-200 hover:-translate-y-0.5">
                                            Shop Now →
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Like + Share row */}
                            <div className="flex items-center justify-between flex-wrap gap-4 py-7 border-t border-b border-stone-200 mb-12">
                                <button onClick={handleLike} disabled={liked}
                                    className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border font-semibold text-sm transition-all duration-300 ${liked
                                        ? 'bg-rose-50 border-rose-200 text-rose-500 cursor-default shadow-inner'
                                        : 'bg-white border-stone-200 text-stone-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 hover:-translate-y-0.5 shadow-sm hover:shadow-md'}`}>
                                    <span className={`text-xl transition-transform duration-300 ${liked ? 'scale-125' : ''}`}>{liked ? '❤️' : '🤍'}</span>
                                    <span>{localLikes.toLocaleString()} {liked ? '· Liked!' : '· Like this post'}</span>
                                </button>
                                <ShareBar title={blogData.title} compact={false} />
                            </div>

                            {/* Comments */}
                            {blogData.allowComments !== false && (
                                <CommentSection
                                    blogId={blogData._id}
                                    approvedComments={approvedComments}
                                    apiBase={API}
                                    toast={toast}
                                />
                            )}

                            {/* Article footer */}
                            <div className="flex items-center justify-between flex-wrap gap-3 pt-6 border-t border-stone-200">
                                <div className="text-[11px] font-mono text-stone-400">
                                    Published {fmtLong(blogData.publishedAt || blogData.createdAt)}
                                    {blogData.updatedAt && blogData.updatedAt !== blogData.createdAt && (
                                        <span className="text-stone-300 ml-2">· Updated {fmt(blogData.updatedAt)}</span>
                                    )}
                                </div>
                                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-300">Beeyond Harvest · Journal</span>
                            </div>
                        </article>
                    )}
                </div>
            </div>
        </>
    );
};

export default BlogDetail;