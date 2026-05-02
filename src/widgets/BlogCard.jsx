/**
 * BlogCard.jsx
 * ─────────────────────────────────────────────────────────────
 * Three blog listing card variants used in BlogPage:
 *
 *   HeroCard  — full-width cinematic card (featured / pinned post)
 *   GridCard  — 3-column grid card with cover image
 *   ListCard  — horizontal list card with thumbnail
 *
 * Skeleton variants:
 *   GridSkeleton
 *   ListSkeleton
 *
 * All cards accept:
 *   blog    {object}   blog document from /api/blogs
 *   onClick {function} navigate to BlogDetail
 * ─────────────────────────────────────────────────────────────
 */

import React from 'react';
import { Sk } from '../components/common/Skeleton';
import { CDN } from '../utils/helpers';
import { AuthorRow } from './AuthorBlock';
import { CatBadge, TagChip } from './HoneyBadge';

/* ── helpers ── */
const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const stripHtml = (html = '') => html.replace(/<[^>]*>/g, '');

const getExcerpt = (blog) =>
    blog.excerpt || stripHtml(blog.body || '').slice(0, 120) + '…';

/* ── Cover image ── */
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

/* ── Stats row (views / likes / comments / read time) ── */
const StatsRow = ({ blog }) => (
    <div className="flex items-center gap-3 text-[11px] text-stone-400">
        {blog.readingTime && <span>⏱ {blog.readingTime} min</span>}
        <span>👁 {(blog.views || 0).toLocaleString()}</span>
        <span>❤️ {blog.likes || 0}</span>
        {(blog.comments?.filter((c) => c.isApproved).length > 0) && (
            <span>💬 {blog.comments.filter((c) => c.isApproved).length}</span>
        )}
    </div>
);

/* ════════════════════════════════════════════════════════════
   HeroCard
════════════════════════════════════════════════════════════ */
export const HeroCard = ({ blog, onClick }) => (
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
                {blog.tags?.slice(0, 2).map((t) => (
                    <span key={t} className="text-[10px] font-mono text-amber-300/70">#{t}</span>
                ))}
            </div>

            <h2
                className="text-2xl sm:text-3xl font-black leading-tight mb-3 line-clamp-2"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
                {blog.title}
            </h2>

            <p className="text-stone-300 text-sm line-clamp-2 mb-5 max-w-xl leading-relaxed">
                {getExcerpt(blog)}
            </p>

            <div className="flex items-center justify-between flex-wrap gap-3">
                <AuthorRow author={blog.author} />
                <div className="flex items-center gap-3 text-[11px] text-stone-400">
                    <span>{fmtDate(blog.publishedAt || blog.createdAt)}</span>
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

/* ════════════════════════════════════════════════════════════
   GridCard
════════════════════════════════════════════════════════════ */
export const GridCard = ({ blog, onClick }) => (
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
                    {blog.tags.slice(0, 3).map((t) => <TagChip key={t} tag={t} />)}
                </div>
            )}

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                <AuthorRow author={blog.author} />
                <span className="text-[10px] text-stone-400 tabular-nums">
                    {fmtDate(blog.publishedAt || blog.createdAt)}
                </span>
            </div>

            <StatsRow blog={blog} />
        </div>
    </div>
);

/* ════════════════════════════════════════════════════════════
   ListCard
════════════════════════════════════════════════════════════ */
export const ListCard = ({ blog, onClick }) => (
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

            <p className="text-stone-500 text-xs line-clamp-2 leading-relaxed hidden sm:block">
                {getExcerpt(blog)}
            </p>

            <div className="flex items-center justify-between gap-3 mt-1 flex-wrap">
                <AuthorRow author={blog.author} />
                <div className="flex items-center gap-3 text-[10px] text-stone-400">
                    <span>{fmtDate(blog.publishedAt || blog.createdAt)}</span>
                    <span>👁 {blog.views || 0}</span>
                    <span>❤️ {blog.likes || 0}</span>
                    {blog.readingTime && <span>⏱ {blog.readingTime}m</span>}
                </div>
            </div>

            {blog.tags?.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-0.5">
                    {blog.tags.slice(0, 4).map((t) => <TagChip key={t} tag={t} />)}
                </div>
            )}
        </div>
    </div>
);

/* ════════════════════════════════════════════════════════════
   Skeleton variants
════════════════════════════════════════════════════════════ */
export const GridSkeleton = () => (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        <Sk className="h-48 rounded-none" />
        <div className="p-5 space-y-3">
            <Sk className="h-3 w-20" />
            <Sk className="h-5 w-4/5" />
            <Sk className="h-3 w-full" />
            <Sk className="h-3 w-2/3" />
        </div>
    </div>
);

export const ListSkeleton = () => (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden flex h-36">
        <Sk className="w-44 rounded-none flex-shrink-0" />
        <div className="flex-1 p-4 space-y-2.5">
            <Sk className="h-3 w-16" />
            <Sk className="h-4 w-4/5" />
            <Sk className="h-3 w-full" />
        </div>
    </div>
);