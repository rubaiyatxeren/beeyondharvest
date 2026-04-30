import React, { useEffect, useRef, useState } from 'react';
import { I, ic } from '../components/common/Icons';
import { Sk } from '../components/common/Skeleton';
import { Spinner } from '../components/common/Spinner';
import { useToast } from '../components/providers/ToastProvider';
import { useAPI } from '../hooks/useAPI';
import { API } from '../utils/constants';
import { CDN } from '../utils/helpers';

/* ─── Fonts ───────────────────────────────────────────────────────────────── */
const FONTS = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtLong = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/* ─── Share ───────────────────────────────────────────────────────────────── */
const SHARE = [
    {
        key: 'facebook', label: 'Facebook',
        icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>,
        build: (u) => `https://www.facebook.com/sharer/sharer.php?u=${u}`
    },
    {
        key: 'twitter', label: 'X / Twitter',
        icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
        build: (u, t) => `https://twitter.com/intent/tweet?text=${t}&url=${u}`
    },
    {
        key: 'whatsapp', label: 'WhatsApp',
        icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M11.999 2C6.477 2 2 6.484 2 12.017c0 1.99.522 3.86 1.438 5.479L2 22l4.654-1.407A9.953 9.953 0 0 0 12 22c5.523 0 10-4.484 10-10.017C22 6.477 17.523 2 12 2z" /></svg>,
        build: (u, t) => `https://wa.me/?text=${t}%20${u}`
    },
    {
        key: 'linkedin', label: 'LinkedIn',
        icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" /><circle cx="4" cy="4" r="2" /></svg>,
        build: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${u}`
    },
];

/* ─── Reading Progress ────────────────────────────────────────────────────── */
const ReadingProgress = () => {
    const [pct, setPct] = useState(0);
    useEffect(() => {
        const fn = () => {
            const el = document.documentElement;
            const total = el.scrollHeight - el.clientHeight;
            setPct(total > 0 ? Math.min(100, (el.scrollTop / total) * 100) : 0);
        };
        window.addEventListener('scroll', fn, { passive: true });
        return () => window.removeEventListener('scroll', fn);
    }, []);
    return (
        <div className="fixed top-0 left-0 right-0 z-[60] h-[2px] bg-stone-200/60">
            <div
                className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 transition-[width] duration-100 ease-linear"
                style={{ width: `${pct}%` }}
            />
        </div>
    );
};

/* ─── Section divider ─────────────────────────────────────────────────────── */
const SectionRule = ({ label, right }) => (
    <div className="flex items-center gap-4 mb-7">
        <div className="h-px flex-1 bg-stone-200" />
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-stone-400 flex-shrink-0">{label}</span>
        {right
            ? <span className="text-[10px] font-mono text-stone-400 tabular-nums flex-shrink-0">{right}</span>
            : <div className="h-px w-8 bg-stone-200" />}
    </div>
);

/* ─── Tag chip ────────────────────────────────────────────────────────────── */
const TagChip = ({ tag }) => (
    <span className="inline-block px-3 py-1 rounded-full text-[11px] font-mono bg-stone-50 text-stone-500 border border-stone-200 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-colors duration-200 cursor-default">
        #{tag}
    </span>
);

/* ─── Meta stat pill ──────────────────────────────────────────────────────── */
const MetaPill = ({ icon, children }) => (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-stone-400 font-medium">
        <span className="text-stone-300">{icon}</span>
        <span>{children}</span>
    </span>
);

/* ─── Author block ────────────────────────────────────────────────────────── */
const AuthorBlock = ({ author }) => {
    if (!author?.name) return null;
    return (
        <div className="flex items-start gap-5 py-7 border-t border-b border-stone-100 my-10">
            <div className="flex-shrink-0">
                {author.avatar
                    ? <img src={author.avatar} alt={author.name} className="w-16 h-16 rounded-full object-cover ring-2 ring-amber-100 ring-offset-2" />
                    : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-amber-600 font-bold text-2xl ring-2 ring-amber-100 ring-offset-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                            {author.name[0].toUpperCase()}
                        </div>
                    )}
            </div>
            <div className="min-w-0 pt-0.5">
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-amber-500 mb-1">Written by</p>
                <p className="font-semibold text-stone-900 text-lg leading-none mb-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    {author.name}
                </p>
                {author.bio && <p className="text-stone-500 text-sm leading-relaxed">{author.bio}</p>}
            </div>
        </div>
    );
};

/* ─── Comment item ────────────────────────────────────────────────────────── */
const CommentItem = ({ comment, index }) => (
    <div className="flex gap-4 py-6 border-b border-stone-100 last:border-0">
        {/* Avatar */}
        <div
            className="w-9 h-9 rounded-full bg-gradient-to-br from-stone-100 to-amber-100 flex items-center justify-center text-amber-700 text-sm font-bold flex-shrink-0 border border-amber-100 mt-0.5"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
            {comment.author[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-2.5 flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-800 text-sm">{comment.author}</span>
                    {comment.likes > 0 && (
                        <span className="text-[10px] text-rose-400 font-medium bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-100">
                            ❤️ {comment.likes}
                        </span>
                    )}
                    {/* Comment number badge */}
                    <span className="text-[10px] font-mono text-stone-300">#{index + 1}</span>
                </div>
                <span className="text-[11px] text-stone-400 font-mono tabular-nums flex-shrink-0">
                    {fmt(comment.createdAt)}
                </span>
            </div>
            <p className="text-stone-600 text-[14px] leading-relaxed">{comment.body}</p>
        </div>
    </div>
);

/* ─── Form field wrapper ──────────────────────────────────────────────────── */
const Field = ({ label, req, children }) => (
    <div className="space-y-1.5">
        <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400">
            {label}{req && <span className="text-amber-400 ml-0.5">*</span>}
        </label>
        {children}
    </div>
);

const inputCls = "w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder-stone-300 outline-none focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100/60 transition-all duration-200";

/* ─── Loading skeleton ────────────────────────────────────────────────────── */
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

/* ─── Main Component ──────────────────────────────────────────────────────── */
const BlogDetail = ({ blog, onBack }) => {
    const pageRef = useRef(null);

    const { data: fullBlog, loading } = useAPI(
        blog._id ? `/api/blogs/${blog._id}` : null, [], !blog._id
    );
    const blogData = fullBlog?.data || fullBlog || blog;

    const toast = useToast();
    const [commentForm, setCommentForm] = useState({ author: '', email: '', body: '' });
    const [commenting, setCommenting] = useState(false);
    const [commentSuccess, setCommentSuccess] = useState(false);
    const [liked, setLiked] = useState(false);
    const [localLikes, setLocalLikes] = useState(0);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [galleryOpen, setGalleryOpen] = useState(null);
    const [charCount, setCharCount] = useState(0);
    const MAX_CHARS = 1000; // matches schema maxlength

    /* scroll to top whenever a blog is opened */
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
        setLocalLikes(n => n + 1);
        fetch(`${API}/api/blogs/${blogData._id}/like`, { method: 'PUT' }).catch(() => { });
    };

    const handleShare = ({ build }) => {
        const url = encodeURIComponent(window.location.href);
        const t = encodeURIComponent(blogData.title);
        window.open(build(url, t), '_blank', 'noopener,noreferrer');
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentForm.author || !commentForm.email || !commentForm.body) {
            toast('Please fill all fields', 'error'); return;
        }
        setCommenting(true);
        try {
            const res = await fetch(`${API}/api/blogs/${blogData._id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(commentForm),
            });
            const data = await res.json();
            if (data.success) {
                toast('Comment submitted for review ✅', 'success');
                setCommentForm({ author: '', email: '', body: '' });
                setCharCount(0);
                setCommentSuccess(true);
                setTimeout(() => setCommentSuccess(false), 6000);
            } else throw new Error(data.message);
        } catch (err) {
            toast(err.message || 'Failed to submit', 'error');
        } finally {
            setCommenting(false);
        }
    };

    const approvedComments = blogData.comments?.filter(c => c.isApproved) || [];

    return (
        <>
            <link href={FONTS} rel="stylesheet" />
            <ReadingProgress />

            {/* ── Gallery Lightbox ── */}
            {galleryOpen !== null && blogData.gallery?.[galleryOpen] && (
                <div
                    className="fixed inset-0 z-50 bg-stone-950/92 flex items-center justify-center p-4 sm:p-8 backdrop-blur-md"
                    onClick={() => setGalleryOpen(null)}
                >
                    <div className="relative max-w-5xl w-full" onClick={e => e.stopPropagation()}>
                        <img
                            src={CDN(blogData.gallery[galleryOpen].url)}
                            alt={blogData.gallery[galleryOpen].alt || ''}
                            className="w-full max-h-[78vh] object-contain rounded-2xl shadow-2xl"
                        />
                        {/* Close */}
                        <button
                            onClick={() => setGalleryOpen(null)}
                            className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-stone-700 flex items-center justify-center font-bold shadow-xl hover:bg-stone-100 transition-colors text-lg leading-none"
                        >
                            ×
                        </button>
                        {/* Nav */}
                        <div className="flex items-center justify-between mt-4 gap-3">
                            <button
                                onClick={() => setGalleryOpen(i => Math.max(0, i - 1))}
                                disabled={galleryOpen === 0}
                                className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium disabled:opacity-25 hover:bg-white/20 transition-colors"
                            >
                                ← Prev
                            </button>
                            <span className="text-white/50 text-xs font-mono">
                                {galleryOpen + 1} / {blogData.gallery.length}
                            </span>
                            <button
                                onClick={() => setGalleryOpen(i => Math.min(blogData.gallery.length - 1, i + 1))}
                                disabled={galleryOpen === blogData.gallery.length - 1}
                                className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium disabled:opacity-25 hover:bg-white/20 transition-colors"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div ref={pageRef} className="min-h-screen bg-[#FAF8F4]" style={{ fontFamily: "'DM Sans', sans-serif" }}>

                {/* ══════════════════════════════════════════
            STICKY TOPBAR — back + title + share
        ══════════════════════════════════════════ */}
                <div className="sticky top-0 z-40 bg-[#FAF8F4]/95 backdrop-blur-md border-b border-stone-200/70 shadow-sm shadow-stone-100/60">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">

                        {/* Back button — always visible */}
                        <button
                            onClick={onBack}
                            className="group flex-shrink-0 flex items-center gap-2 text-sm text-stone-600 hover:text-amber-600 font-medium transition-colors duration-200"
                        >
                            <span className="w-8 h-8 rounded-full border border-stone-200 bg-white flex items-center justify-center group-hover:border-amber-400 group-hover:bg-amber-50 group-hover:shadow-md transition-all duration-200 shadow-sm">
                                <I d={ic.chev_l} size={14} />
                            </span>
                            <span className="hidden sm:inline text-[13px]">Back to Journal</span>
                        </button>

                        {/* Scrolled post title — middle
                        {!loading && blogData.title && (
                            <p className="flex-1 min-w-0 text-[13px] font-medium text-stone-600 truncate px-2 hidden sm:block" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                                {blogData.title}
                            </p>
                        )} */}

                        {/* Share buttons — right */}
                        {!loading && (
                            <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
                                <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest mr-1 hidden sm:inline">Share</span>
                                {SHARE.map(s => (
                                    <button
                                        key={s.key}
                                        title={s.label}
                                        onClick={() => handleShare(s)}
                                        className="w-8 h-8 rounded-lg border border-stone-200 bg-white text-stone-500 flex items-center justify-center hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200 shadow-sm"
                                    >
                                        {s.icon}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ══════════════════════════════════════════
            CONTENT
        ══════════════════════════════════════════ */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-24">
                    {loading ? <DetailSkeleton /> : (
                        <article>

                            {/* ── Hero image ── */}
                            {blogData.coverImage?.url && (
                                <div className="relative w-full h-[260px] sm:h-[330px] rounded-3xl overflow-hidden mb-10 shadow-2xl shadow-stone-300/50 bg-stone-200">
                                    <img
                                        src={CDN(blogData.coverImage.url)}
                                        alt={blogData.coverImage.alt || blogData.title}
                                        onLoad={() => setImgLoaded(true)}
                                        className={`w-full h-full object-cover transition-opacity duration-700 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/55 via-transparent to-stone-950/10 pointer-events-none" />
                                    {/* Feature / Pinned badges */}
                                    <div className="absolute top-5 left-5 flex items-center gap-2">
                                        {blogData.isFeatured && (
                                            <span className="bg-amber-500 text-white text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1.5 rounded-full shadow-lg shadow-amber-900/30 backdrop-blur-sm">
                                                ★ Featured
                                            </span>
                                        )}
                                        {blogData.isPinned && (
                                            <span className="bg-stone-900/80 text-amber-300 text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm border border-amber-400/30">
                                                📌 Pinned
                                            </span>
                                        )}
                                    </div>
                                    {blogData.coverImage.credit && (
                                        <span className="absolute bottom-4 right-4 text-[10px] text-white/50 font-mono bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
                                            © {blogData.coverImage.credit}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* ── Category + Tags + Language ── */}
                            <div className="flex items-center gap-2 flex-wrap mb-5">
                                {blogData.category && (
                                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] bg-amber-500 text-white shadow-sm shadow-amber-200">
                                        {blogData.category}
                                    </span>
                                )}
                                {blogData.tags?.slice(0, 5).map(tag => <TagChip key={tag} tag={tag} />)}
                                <span className="ml-auto flex-shrink-0">
                                    <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${blogData.contentLanguage === 'bn'
                                        ? 'bg-green-50 border-green-200 text-green-600'
                                        : 'bg-sky-50 border-sky-200 text-sky-600'
                                        }`}>
                                        {blogData.contentLanguage === 'bn' ? '🇧🇩 Bengali' : '🇬🇧 English'}
                                    </span>
                                </span>
                            </div>

                            {/* ── Title ── */}
                            <h1
                                className="text-4xl sm:text-5xl font-bold text-stone-950 leading-[1.1] tracking-tight mb-6"
                                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                            >
                                {blogData.title}
                            </h1>

                            {/* ── Meta stats bar ── */}
                            <div className="flex items-center gap-x-5 gap-y-2 flex-wrap pb-6 mb-0 border-b border-stone-200">
                                <MetaPill icon="📅">{fmtLong(blogData.publishedAt || blogData.createdAt)}</MetaPill>
                                <MetaPill icon="👁">{(blogData.views || 0).toLocaleString()} views</MetaPill>
                                {blogData.readingTime && <MetaPill icon="⏱">{blogData.readingTime} min read</MetaPill>}
                                {blogData.shares > 0 && <MetaPill icon="↗">{blogData.shares} shares</MetaPill>}
                                {approvedComments.length > 0 && (
                                    <MetaPill icon="💬">{approvedComments.length} comment{approvedComments.length > 1 ? 's' : ''}</MetaPill>
                                )}
                                {blogData.likes > 0 && <MetaPill icon="❤️">{blogData.likes} likes</MetaPill>}
                                {blogData.updatedAt && blogData.updatedAt !== blogData.createdAt && (
                                    <span className="text-[11px] font-mono text-stone-300 ml-auto">
                                        Updated {fmt(blogData.updatedAt)}
                                    </span>
                                )}
                            </div>

                            {/* ── Author ── */}
                            {blogData.author?.name && <AuthorBlock author={blogData.author} />}

                            {/* ── Excerpt pull-quote ── */}
                            {blogData.excerpt && (
                                <div className="relative my-10 px-8 py-6 bg-white border-l-[3px] border-amber-400 rounded-r-2xl shadow-sm">
                                    <span
                                        className="absolute -top-4 left-5 text-7xl text-amber-200 select-none leading-none pointer-events-none"
                                        style={{ fontFamily: 'Georgia, serif' }}
                                    >
                                        "
                                    </span>
                                    <p
                                        className="text-stone-700 text-xl leading-relaxed italic relative z-10"
                                        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                                    >
                                        {blogData.excerpt}
                                    </p>
                                </div>
                            )}

                            {/* ── Body ── */}
                            <div
                                className="text-stone-700 text-[16px] sm:text-[17px] leading-[1.9] mb-10"
                                dangerouslySetInnerHTML={{
                                    __html: (blogData.body || blogData.content || '')
                                        .replace(/\n/g, '<br>')
                                        .replace(/<h1([^>]*)>/g, `<h1$1 class="text-4xl font-bold text-stone-950 mt-12 mb-5 leading-tight" style="font-family:'Cormorant Garamond',Georgia,serif">`)
                                        .replace(/<h2([^>]*)>/g, `<h2$1 class="text-3xl font-bold text-stone-900 mt-10 mb-4 leading-snug" style="font-family:'Cormorant Garamond',Georgia,serif">`)
                                        .replace(/<h3([^>]*)>/g, `<h3$1 class="text-2xl font-semibold text-stone-800 mt-8 mb-3" style="font-family:'Cormorant Garamond',Georgia,serif">`)
                                        .replace(/<p([^>]*)>/g, '<p$1 class="mb-5">')
                                        .replace(/<ul([^>]*)>/g, '<ul$1 class="mb-5 space-y-2 pl-4">')
                                        .replace(/<ol([^>]*)>/g, '<ol$1 class="mb-5 space-y-2 pl-4 list-decimal">')
                                        .replace(/<li([^>]*)>/g, `<li$1 class="text-stone-700 leading-relaxed relative pl-2 before:content-['›'] before:absolute before:-left-2 before:text-amber-400 before:font-bold">`)
                                        .replace(/<blockquote([^>]*)>/g, `<blockquote$1 class="border-l-[3px] border-amber-400 pl-6 italic py-4 my-8 bg-amber-50 pr-5 rounded-r-2xl text-stone-700 text-lg" style="font-family:'Cormorant Garamond',Georgia,serif">`)
                                        .replace(/<a([^>]*)>/g, '<a$1 class="text-amber-600 underline underline-offset-4 decoration-amber-300 hover:text-amber-800 hover:decoration-amber-500 transition-colors">')
                                        .replace(/<strong([^>]*)>/g, '<strong$1 class="font-semibold text-stone-900">')
                                        .replace(/<em([^>]*)>/g, '<em$1 class="italic text-stone-600">')
                                        .replace(/<code([^>]*)>/g, '<code$1 class="bg-stone-100 text-amber-700 px-2 py-0.5 rounded-md text-[13px] font-mono border border-stone-200">')
                                        .replace(/<pre([^>]*)>/g, '<pre$1 class="bg-stone-950 text-stone-200 rounded-2xl p-6 overflow-x-auto text-sm font-mono my-8 shadow-xl">')
                                        .replace(/<img([^>]*)>/g, '<img$1 class="w-full rounded-2xl shadow-lg my-8 border border-stone-100">')
                                        .replace(/<hr([^>]*)>/g, '<hr$1 class="border-0 border-t border-stone-200 my-10">')
                                        .replace(/<table([^>]*)>/g, '<table$1 class="w-full text-sm border-collapse rounded-xl overflow-hidden shadow-sm mb-6">')
                                        .replace(/<th([^>]*)>/g, '<th$1 class="bg-stone-100 text-stone-700 font-semibold text-left px-4 py-2.5 border border-stone-200">')
                                        .replace(/<td([^>]*)>/g, '<td$1 class="px-4 py-2.5 border border-stone-100 text-stone-600">')
                                }}
                            />

                            {/* ── Gallery ── */}
                            {blogData.gallery?.length > 0 && (
                                <section className="mb-12">
                                    <SectionRule label="Photo Gallery" right={`${blogData.gallery.length} photo${blogData.gallery.length > 1 ? 's' : ''}`} />
                                    <div className={`grid gap-3 ${blogData.gallery.length === 1 ? 'grid-cols-1' :
                                        blogData.gallery.length === 2 ? 'grid-cols-2' :
                                            'grid-cols-2 sm:grid-cols-3'
                                        }`}>
                                        {blogData.gallery.map((img, i) => (
                                            <div
                                                key={i}
                                                onClick={() => setGalleryOpen(i)}
                                                className="group relative aspect-video rounded-2xl overflow-hidden bg-stone-100 cursor-zoom-in ring-1 ring-stone-200 hover:ring-amber-300 transition-all duration-300"
                                            >
                                                <img src={CDN(img.url)} alt={img.alt || `Photo ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                <div className="absolute inset-0 bg-stone-950/0 group-hover:bg-stone-950/25 transition-all duration-300 flex items-center justify-center">
                                                    <span className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg">⊕</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* ── Related products ── */}
                            {blogData.relatedProducts?.length > 0 && (
                                <div className="relative bg-gradient-to-br from-amber-50 to-stone-50 border border-amber-200/60 rounded-3xl p-6 mb-10 overflow-hidden">
                                    <div className="absolute top-0 right-2 text-[96px] leading-none opacity-[0.06] select-none pointer-events-none">🍯</div>
                                    <div className="relative flex items-center justify-between gap-5 flex-wrap">
                                        <div>
                                            <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-amber-500 mb-1.5">From the Store</p>
                                            <p className="font-semibold text-stone-900 text-base mb-0.5" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                                                Products mentioned in this post
                                            </p>
                                            <p className="text-stone-500 text-sm">
                                                {blogData.relatedProducts.length} related product{blogData.relatedProducts.length > 1 ? 's' : ''} — pure, natural honey.
                                            </p>
                                        </div>
                                        <button className="flex-shrink-0 bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-amber-200 hover:-translate-y-0.5">
                                            Shop Now →
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ── Like + Share row ── */}
                            <div className="flex items-center justify-between flex-wrap gap-4 py-7 border-t border-b border-stone-200 mb-12">
                                <button
                                    onClick={handleLike}
                                    disabled={liked}
                                    className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border font-semibold text-sm transition-all duration-300 ${liked
                                        ? 'bg-rose-50 border-rose-200 text-rose-500 cursor-default shadow-inner'
                                        : 'bg-white border-stone-200 text-stone-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 hover:-translate-y-0.5 shadow-sm hover:shadow-md'
                                        }`}
                                >
                                    <span className={`text-xl transition-transform duration-300 ${liked ? 'scale-125' : ''}`}>
                                        {liked ? '❤️' : '🤍'}
                                    </span>
                                    <span>{localLikes.toLocaleString()} {liked ? '· Liked!' : '· Like this post'}</span>
                                </button>

                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-mono text-stone-400 uppercase tracking-[0.14em] mr-1">Share</span>
                                    {SHARE.map(s => (
                                        <button
                                            key={s.key}
                                            title={s.label}
                                            onClick={() => handleShare(s)}
                                            className="w-9 h-9 rounded-xl border border-stone-200 bg-white text-stone-500 flex items-center justify-center hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 hover:-translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow-md"
                                        >
                                            {s.icon}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ══════════════════════════════════════════
                  COMMENTS SECTION
              ══════════════════════════════════════════ */}
                            {blogData.allowComments !== false && (
                                <section className="mb-12">

                                    {/* Section header with count badge */}
                                    <div className="flex items-center gap-4 mb-7">
                                        <div className="h-px flex-1 bg-stone-200" />
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-stone-400">Discussion</span>
                                            {approvedComments.length > 0 && (
                                                <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-amber-500 text-white text-[10px] font-bold tabular-nums shadow-sm shadow-amber-200">
                                                    {approvedComments.length}
                                                </span>
                                            )}
                                        </div>
                                        <div className="h-px w-8 bg-stone-200" />
                                    </div>

                                    {/* Comment form */}
                                    {commentSuccess ? (
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center mb-8">
                                            <div className="text-5xl mb-4">✅</div>
                                            <h4 className="font-semibold text-emerald-800 text-lg mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                                                Comment Submitted!
                                            </h4>
                                            <p className="text-emerald-600 text-sm leading-relaxed">
                                                Your comment is pending review. We'll approve it shortly — thank you for sharing!
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-white border border-stone-100 rounded-3xl p-6 sm:p-7 mb-8 shadow-sm">
                                            <h4 className="text-2xl font-semibold text-stone-900 mb-1" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                                                Leave a Comment
                                            </h4>
                                            <p className="text-[12px] text-stone-400 mb-6">All comments are reviewed before appearing publicly.</p>
                                            <form onSubmit={handleCommentSubmit} className="space-y-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <Field label="Name" req>
                                                        <input
                                                            type="text"
                                                            value={commentForm.author}
                                                            onChange={e => setCommentForm({ ...commentForm, author: e.target.value })}
                                                            placeholder="Your name"
                                                            maxLength={80}
                                                            className={inputCls}
                                                            required
                                                        />
                                                    </Field>
                                                    <Field label="Email" req>
                                                        <input
                                                            type="email"
                                                            value={commentForm.email}
                                                            onChange={e => setCommentForm({ ...commentForm, email: e.target.value })}
                                                            placeholder="your@email.com"
                                                            className={inputCls}
                                                            required
                                                        />
                                                    </Field>
                                                </div>

                                                {/* Textarea with live char counter */}
                                                <Field label="Comment" req>
                                                    <div className="relative">
                                                        <textarea
                                                            value={commentForm.body}
                                                            onChange={e => {
                                                                const v = e.target.value.slice(0, MAX_CHARS);
                                                                setCommentForm({ ...commentForm, body: v });
                                                                setCharCount(v.length);
                                                            }}
                                                            placeholder="What did you think about this post?"
                                                            rows={4}
                                                            maxLength={MAX_CHARS}
                                                            className={`${inputCls} resize-none pr-4 pb-8`}
                                                            required
                                                        />
                                                        {/* Character counter inside textarea */}
                                                        <div className="absolute bottom-2.5 right-3 flex items-center gap-1.5">
                                                            <div className="w-16 h-1 rounded-full bg-stone-100 overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-200 ${charCount > MAX_CHARS * 0.9 ? 'bg-rose-400' :
                                                                        charCount > MAX_CHARS * 0.7 ? 'bg-amber-400' : 'bg-emerald-400'
                                                                        }`}
                                                                    style={{ width: `${(charCount / MAX_CHARS) * 100}%` }}
                                                                />
                                                            </div>
                                                            <span className={`text-[10px] font-mono tabular-nums ${charCount > MAX_CHARS * 0.9 ? 'text-rose-400' : 'text-stone-300'}`}>
                                                                {charCount}/{MAX_CHARS}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </Field>

                                                <div className="flex items-center justify-end pt-1">
                                                    <button
                                                        type="submit"
                                                        disabled={commenting || charCount === 0}
                                                        className="inline-flex items-center gap-2 bg-stone-900 hover:bg-amber-500 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 text-sm disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-amber-200 hover:-translate-y-0.5"
                                                    >
                                                        {commenting
                                                            ? <><Spinner /><span>Posting…</span></>
                                                            : <><span>Post Comment</span><span className="text-amber-400">→</span></>
                                                        }
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    )}

                                    {/* Comments list */}
                                    {approvedComments.length > 0 ? (
                                        <div className="bg-white border border-stone-100 rounded-3xl overflow-hidden shadow-sm">
                                            {/* List header */}
                                            <div className="px-7 pt-5 pb-3 border-b border-stone-100 flex items-center justify-between">
                                                <h5 className="text-sm font-semibold text-stone-700">
                                                    {approvedComments.length} Comment{approvedComments.length > 1 ? 's' : ''}
                                                </h5>
                                                <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wide">Approved</span>
                                            </div>
                                            <div className="px-7">
                                                {approvedComments.map((c, i) => (
                                                    <CommentItem key={c._id || i} comment={c} index={i} />
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-14 border border-dashed border-stone-200 rounded-3xl bg-white/50">
                                            <p className="text-4xl mb-3">💬</p>
                                            <p className="font-medium text-stone-500 text-sm">No comments yet.</p>
                                            <p className="text-stone-400 text-sm mt-1">Be the first to start the discussion!</p>
                                        </div>
                                    )}
                                </section>
                            )}

                            {/* ── Article footer ── */}
                            <div className="flex items-center justify-between flex-wrap gap-3 pt-6 border-t border-stone-200">
                                <div className="text-[11px] font-mono text-stone-400">
                                    Published {fmtLong(blogData.publishedAt || blogData.createdAt)}
                                    {blogData.updatedAt && blogData.updatedAt !== blogData.createdAt && (
                                        <span className="text-stone-300 ml-2">· Updated {fmt(blogData.updatedAt)}</span>
                                    )}
                                </div>
                                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-300">
                                    Beeyond Harvest · Journal
                                </span>
                            </div>

                        </article>
                    )}
                </div>
            </div>
        </>
    );
};

export default BlogDetail;
