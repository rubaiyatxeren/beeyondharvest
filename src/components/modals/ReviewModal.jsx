import React, { useEffect, useState } from 'react';
import { I, ic } from '../common/Icons';
import { Spinner } from '../common/Spinner';
import { useToast } from '../providers/ToastProvider';

export const ReviewModal = ({ token, onClose }) => {
    const [panel, setPanel] = useState("loading");
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
                    const map = {
                        TOKEN_INVALID: ["Link Expired", "This review link has expired."],
                        TOKEN_USED: ["Already Reviewed", "You've already submitted a review with this link."],
                        NOT_DELIVERED: ["Not Delivered Yet", "You can review after your order is delivered."]
                    };
                    const [t, m] = map[data.code] || ["Error", data.message || "Invalid link."];
                    setErrorInfo({ title: t, msg: m });
                    setPanel("error");
                } else {
                    setProductInfo(data.data);
                    setPanel("form");
                }
            })
            .catch(() => {
                setErrorInfo({ title: "Connection Error", msg: "Cannot connect to server." });
                setPanel("error");
            });
    }, [token]);

    const submit = async () => {
        if (!rating) { toast("Please select a rating", "error"); return; }
        if (body.length < 10) { toast("Write at least 10 characters", "error"); return; }
        setSubmitting(true);
        try {
            const res = await fetch(`${API}/api/reviews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, rating, title, body })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            setPanel("success");
        } catch (e) { toast(e.message || "Failed to submit", "error"); }
        finally { setSubmitting(false); }
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
                    {panel === "loading" && (
                        <div className="text-center py-8"><Spinner /><p className="text-stone-400 text-sm mt-3">Validating…</p></div>
                    )}
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
                                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                                    {productInfo.product?.image ? <img src={productInfo.product.image} alt="" className="w-full h-full object-cover rounded-xl" /> : "🍯"}
                                </div>
                                <div><div className="font-semibold text-stone-800 text-sm">{productInfo.product?.name || "Product"}</div><div className="text-xs text-stone-400">Order #{productInfo.orderNumber}</div></div>
                            </div>
                            <div className="text-center mb-5">
                                <div className="flex gap-2 justify-center mb-2">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <button key={i} onClick={() => setRating(i)} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(0)}
                                            className={`text-3xl transition-transform btn-bounce ${i <= star ? "scale-110" : ""}`}>
                                            <svg width={32} height={32} viewBox="0 0 24 24" fill={i <= star ? "#f59e0b" : "#e5e7eb"} stroke="none">
                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                            </svg>
                                        </button>
                                    ))}
                                </div>
                                <div className={`text-sm font-semibold transition-all ${rating > 0 ? "text-amber-600" : "text-stone-400"}`}>
                                    {rating > 0 ? LABELS[rating - 1] : "Select a rating"}
                                </div>
                            </div>
                            <div className="space-y-3 mb-5">
                                <div><label className="block text-xs font-semibold text-stone-500 mb-1.5">Title (optional)</label>
                                    <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200}
                                        placeholder="Summarize your experience"
                                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm" />
                                </div>
                                <div><label className="block text-xs font-semibold text-stone-500 mb-1.5">Review * <span className="text-stone-400 font-normal">(min 10 chars)</span></label>
                                    <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} rows={4}
                                        placeholder="Share your experience with this product…"
                                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm resize-none" />
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
};