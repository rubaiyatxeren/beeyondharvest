/**
 * CommentSection.jsx
 * ─────────────────────────────────────────────────────────────
 * Full comment UI: form with live char counter + approved
 * comment list. Submits to /api/blogs/:id/comments.
 *
 * Used in: BlogDetail
 *
 * Props:
 *   blogId           {string}   MongoDB _id of the blog post
 *   approvedComments {Array}    pre-filtered approved comments
 *   apiBase          {string}   base API URL (from constants.API)
 *   toast            {function} toast(message, level?)
 * ─────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import { Spinner } from '../components/common/Spinner';

const MAX_CHARS = 1000;

/* ── helpers ── */
const fmt = (d) =>
    new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const inputCls =
    'w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder-stone-300 outline-none focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100/60 transition-all duration-200';

/* ── Field wrapper ── */
const Field = ({ label, req, children }) => (
    <div className="space-y-1.5">
        <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400">
            {label}{req && <span className="text-amber-400 ml-0.5">*</span>}
        </label>
        {children}
    </div>
);

/* ── Single comment ── */
const CommentItem = ({ comment, index }) => (
    <div className="flex gap-4 py-6 border-b border-stone-100 last:border-0">
        <div
            className="w-9 h-9 rounded-full bg-gradient-to-br from-stone-100 to-amber-100 flex items-center justify-center text-amber-700 text-sm font-bold flex-shrink-0 border border-amber-100 mt-0.5"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
            {comment.author[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-2.5 flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-800 text-sm">{comment.author}</span>
                    {comment.likes > 0 && (
                        <span className="text-[10px] text-rose-400 font-medium bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-100">
                            ❤️ {comment.likes}
                        </span>
                    )}
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

/* ── Main export ── */
export const CommentSection = ({ blogId, approvedComments = [], apiBase, toast }) => {
    const [form, setForm] = useState({ author: '', email: '', body: '' });
    const [commenting, setCommenting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [charCount, setCharCount] = useState(0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.author || !form.email || !form.body) {
            toast?.('Please fill all fields', 'error');
            return;
        }
        setCommenting(true);
        try {
            const res = await fetch(`${apiBase}/api/blogs/${blogId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (data.success) {
                toast?.('Comment submitted for review ✅', 'success');
                setForm({ author: '', email: '', body: '' });
                setCharCount(0);
                setSuccess(true);
                setTimeout(() => setSuccess(false), 6000);
            } else throw new Error(data.message);
        } catch (err) {
            toast?.(err.message || 'Failed to submit', 'error');
        } finally {
            setCommenting(false);
        }
    };

    return (
        <section className="mb-12">
            {/* ── Section header ── */}
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

            {/* ── Comment form or success state ── */}
            {success ? (
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

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Name" req>
                                <input
                                    type="text"
                                    value={form.author}
                                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                                    placeholder="Your name"
                                    maxLength={80}
                                    className={inputCls}
                                    required
                                />
                            </Field>
                            <Field label="Email" req>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder="your@email.com"
                                    className={inputCls}
                                    required
                                />
                            </Field>
                        </div>

                        <Field label="Comment" req>
                            <div className="relative">
                                <textarea
                                    value={form.body}
                                    onChange={(e) => {
                                        const v = e.target.value.slice(0, MAX_CHARS);
                                        setForm({ ...form, body: v });
                                        setCharCount(v.length);
                                    }}
                                    placeholder="What did you think about this post?"
                                    rows={4}
                                    maxLength={MAX_CHARS}
                                    className={`${inputCls} resize-none pr-4 pb-8`}
                                    required
                                />
                                {/* Live char counter */}
                                <div className="absolute bottom-2.5 right-3 flex items-center gap-1.5">
                                    <div className="w-16 h-1 rounded-full bg-stone-100 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-200 ${charCount > MAX_CHARS * 0.9 ? 'bg-rose-400'
                                                : charCount > MAX_CHARS * 0.7 ? 'bg-amber-400'
                                                    : 'bg-emerald-400'}`}
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
                                    : <><span>Post Comment</span><span className="text-amber-400">→</span></>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Approved comments list ── */}
            {approvedComments.length > 0 ? (
                <div className="bg-white border border-stone-100 rounded-3xl overflow-hidden shadow-sm">
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
    );
};