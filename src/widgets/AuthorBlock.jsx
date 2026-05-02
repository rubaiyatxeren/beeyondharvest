/**
 * AuthorBlock.jsx
 * ─────────────────────────────────────────────────────────────
 * Author card displayed inside a blog article, between the
 * excerpt pull-quote and the body.
 *
 * Used in: BlogDetail
 *
 * Props:
 *   author  { name, avatar?, bio? }
 * ─────────────────────────────────────────────────────────────
 */

import React from 'react';

export const AuthorBlock = ({ author }) => {
    if (!author?.name) return null;

    return (
        <div className="flex items-start gap-5 py-7 border-t border-b border-stone-100 my-10">
            {/* Avatar */}
            <div className="flex-shrink-0">
                {author.avatar ? (
                    <img
                        src={author.avatar}
                        alt={author.name}
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-amber-100 ring-offset-2"
                    />
                ) : (
                    <div
                        className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-amber-600 font-bold text-2xl ring-2 ring-amber-100 ring-offset-2"
                        style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                        {author.name[0].toUpperCase()}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="min-w-0 pt-0.5">
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-amber-500 mb-1">
                    Written by
                </p>
                <p
                    className="font-semibold text-stone-900 text-lg leading-none mb-2"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                    {author.name}
                </p>
                {author.bio && (
                    <p className="text-stone-500 text-sm leading-relaxed">{author.bio}</p>
                )}
            </div>
        </div>
    );
};

/* ── Compact AuthorRow (used in blog cards / HeroCard) ──────── */
/**
 * Inline avatar + name row for blog listing cards.
 * @param {{ name, avatar? }} author
 */
export const AuthorRow = ({ author }) => {
    if (!author?.name) return null;
    return (
        <div className="flex items-center gap-2">
            {author.avatar ? (
                <img
                    src={author.avatar}
                    alt={author.name}
                    className="w-6 h-6 rounded-full object-cover border-2 border-amber-100"
                />
            ) : (
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-600 border-2 border-amber-200">
                    {author.name[0].toUpperCase()}
                </div>
            )}
            <span className="text-[11px] text-stone-500 font-medium">{author.name}</span>
        </div>
    );
};