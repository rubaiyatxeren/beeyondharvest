import React, { useEffect, useState } from 'react';
import { I, ic } from '../components/common/Icons';
import { Spinner } from '../components/common/Spinner';
import { useToast } from '../components/providers/ToastProvider';
import { API, COMPLAINT_CATEGORIES, STATUS_LABELS } from '../utils/constants';
import { fmt } from '../utils/helpers';

const ComplaintPage = () => {
    const [tab, setTab] = useState("form");
    const [step, setStep] = useState(1);
    const [category, setCategory] = useState(null);
    const [formData, setFormData] = useState({ name: "", email: "", phone: "", orderNumber: "", subject: "", description: "" });
    const [files, setFiles] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [ticketResult, setTicketResult] = useState(null);
    const [errors, setErrors] = useState({});
    const [trackTicket, setTrackTicket] = useState("");
    const [trackEmail, setTrackEmail] = useState("");
    const [tracking, setTracking] = useState(false);
    const [trackedComplaint, setTrackedComplaint] = useState(null);
    const [trackErr, setTrackErr] = useState("");
    const [replyText, setReplyText] = useState("");
    const [replySending, setReplySending] = useState(false);
    const [rating, setRating] = useState(0);
    const toast = useToast();

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
            const res = await fetch(`${API}/api/complaints/${trackedComplaint._id}/customer-reply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: replyText, email: trackedComplaint.customer?.email })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            toast("Reply sent!", "success");
            setReplyText("");
            await trackComplaint();
        } catch (e) { toast(e.message || "Failed to send", "error"); } finally { setReplySending(false); }
    };

    const submitRating = async (score) => {
        if (!trackedComplaint) return;
        setRating(score);
        try {
            await fetch(`${API}/api/complaints/satisfaction`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ score, ticketNumber: trackedComplaint.ticketNumber, email: trackedComplaint.customer?.email })
            });
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
                <button onClick={() => { setTab("track"); setTrackTicket(ticketResult.ticketNumber); setTicketResult(null); }}
                    className="bg-stone-900 text-white px-5 py-3 rounded-xl btn-bounce text-sm font-semibold flex items-center gap-2">
                    <I d={ic.search} size={15} stroke="white" /> Track Ticket
                </button>
                <button onClick={() => { setTicketResult(null); setStep(1); setCategory(null); setFormData({ name: "", email: "", phone: "", orderNumber: "", subject: "", description: "" }); setFiles([]); }}
                    className="border border-stone-200 px-5 py-3 rounded-xl btn-bounce text-sm font-medium text-stone-600 hover:bg-stone-50">
                    New Complaint
                </button>
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

            <div className="grid grid-cols-3 gap-3 mb-8">
                {[["24h", "Avg Response"], ["95%", "Resolution Rate"], ["4.8★", "Customer Rating"]].map(([val, label]) => (
                    <div key={label} className="bg-white rounded-2xl border border-stone-100 p-4 text-center">
                        <div className="font-display text-xl font-bold text-stone-900">{val}</div>
                        <div className="text-xs text-stone-400 mt-0.5">{label}</div>
                    </div>
                ))}
            </div>

            <div className="flex rounded-xl border border-stone-200 overflow-hidden mb-6 bg-white">
                <button onClick={() => setTab("form")}
                    className={`flex-1 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${tab === "form" ? "bg-amber-500 text-stone-900" : "text-stone-500 hover:bg-stone-50"}`}>
                    <I d={ic.send} size={14} /> Submit Complaint
                </button>
                <button onClick={() => setTab("track")}
                    className={`flex-1 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${tab === "track" ? "bg-amber-500 text-stone-900" : "text-stone-500 hover:bg-stone-50"}`}>
                    <I d={ic.ticket} size={14} /> Track Ticket
                </button>
            </div>

            {tab === "form" && (
                <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                    <div className="flex items-center gap-2 p-5 border-b border-stone-100 bg-stone-50">
                        {["Category", "Your Info", "Details", "Review"].map((label, i) => {
                            const s = i + 1; const done = step > s; const active = step === s;
                            return (
                                <div key={s} className="flex items-center flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${done ? "bg-amber-500 text-white" : active ? "bg-stone-900 text-white" : "bg-stone-200 text-stone-400"}`}>
                                            {done ? "✓" : s}
                                        </div>
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
                                        <input value={formData.name} onChange={(e) => upd("name", e.target.value)} placeholder="Your name"
                                            className={`w-full px-3 py-3 rounded-xl border text-sm ${errors.name ? "border-red-300 bg-red-50" : "border-stone-200 bg-stone-50"}`} />
                                        {errors.name && <span className="text-red-500 text-xs mt-1 block">{errors.name}</span>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-stone-500 mb-1.5">Email *</label>
                                        <input type="email" value={formData.email} onChange={(e) => upd("email", e.target.value)} placeholder="email@example.com"
                                            className={`w-full px-3 py-3 rounded-xl border text-sm ${errors.email ? "border-red-300 bg-red-50" : "border-stone-200 bg-stone-50"}`} />
                                        {errors.email && <span className="text-red-500 text-xs mt-1 block">{errors.email}</span>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-stone-500 mb-1.5">Phone (optional)</label>
                                        <input value={formData.phone} onChange={(e) => upd("phone", e.target.value)} placeholder="01XXXXXXXXX"
                                            className={`w-full px-3 py-3 rounded-xl border text-sm ${errors.phone ? "border-red-300 bg-red-50" : "border-stone-200 bg-stone-50"}`} />
                                        {errors.phone && <span className="text-red-500 text-xs mt-1 block">{errors.phone}</span>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-stone-500 mb-1.5">Order Number (optional)</label>
                                        <input value={formData.orderNumber} onChange={(e) => upd("orderNumber", e.target.value.toUpperCase())}
                                            placeholder="ORD-2025XX-XXXXX" className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm" />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setStep(1)} className="px-5 py-3 rounded-xl border border-stone-200 text-stone-600 text-sm btn-bounce hover:bg-stone-50">
                                        <I d={ic.chev_l} size={15} className="inline" /> Back
                                    </button>
                                    <button onClick={() => { if (validateStep2()) setStep(3); }}
                                        className="flex-1 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold py-3 rounded-xl btn-bounce transition-colors">
                                        Next <I d={ic.chev_r} size={16} stroke="#1a1a1a" className="inline" />
                                    </button>
                                </div>
                            </>
                        )}

                        {step === 3 && (
                            <>
                                <div className="mb-4">
                                    <label className="block text-xs font-semibold text-stone-500 mb-1.5">Subject *</label>
                                    <input value={formData.subject} onChange={(e) => upd("subject", e.target.value)} maxLength={200}
                                        placeholder="Brief description of the issue"
                                        className={`w-full px-3 py-3 rounded-xl border text-sm ${errors.subject ? "border-red-300 bg-red-50" : "border-stone-200 bg-stone-50"}`} />
                                    {errors.subject && <span className="text-red-500 text-xs mt-1 block">{errors.subject}</span>}
                                </div>
                                <div className="mb-4">
                                    <label className="block text-xs font-semibold text-stone-500 mb-1.5">Description * <span className="text-stone-400 font-normal">(min 20 chars)</span></label>
                                    <textarea value={formData.description} onChange={(e) => upd("description", e.target.value)} maxLength={3000} rows={5}
                                        placeholder="Describe the issue in detail..."
                                        className={`w-full px-3 py-3 rounded-xl border text-sm resize-none ${errors.description ? "border-red-300 bg-red-50" : "border-stone-200 bg-stone-50"}`} />
                                    <div className="flex justify-between text-xs text-stone-400 mt-1">
                                        <span>{errors.description && <span className="text-red-500">{errors.description}</span>}</span>
                                        <span>{formData.description.length}/3000</span>
                                    </div>
                                </div>
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
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs font-semibold text-stone-700 truncate">{f.name}</div>
                                                        <div className="text-xs text-stone-400">{(f.size / 1024).toFixed(0)} KB</div>
                                                    </div>
                                                    <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 btn-bounce">
                                                        <I d={ic.x} size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setStep(2)} className="px-5 py-3 rounded-xl border border-stone-200 text-stone-600 text-sm btn-bounce hover:bg-stone-50">
                                        <I d={ic.chev_l} size={15} className="inline" /> Back
                                    </button>
                                    <button onClick={() => { if (validateStep3()) setStep(4); }}
                                        className="flex-1 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold py-3 rounded-xl btn-bounce transition-colors">
                                        Review →
                                    </button>
                                </div>
                            </>
                        )}

                        {step === 4 && (
                            <>
                                <div className="bg-amber-50 rounded-xl p-4 mb-4 text-xs text-amber-700 flex items-center gap-2">
                                    <I d={ic.check} size={13} stroke="#d97706" /> Please review before submitting
                                </div>
                                <div className="space-y-3 mb-5">
                                    {[["Category", COMPLAINT_CATEGORIES.find(c => c.key === category)?.label || category],
                                    ["Name", formData.name], ["Email", formData.email],
                                    formData.phone ? ["Phone", formData.phone] : null,
                                    formData.orderNumber ? ["Order #", formData.orderNumber] : null,
                                    ["Subject", formData.subject]
                                    ].filter(Boolean).map(([k, v]) => (
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
                                    <button onClick={() => setStep(3)} className="px-5 py-3 rounded-xl border border-stone-200 text-stone-600 text-sm btn-bounce hover:bg-stone-50">
                                        <I d={ic.chev_l} size={15} className="inline" /> Back
                                    </button>
                                    <button onClick={submit} disabled={submitting}
                                        className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-900 font-bold py-3 rounded-xl btn-bounce transition-colors flex items-center justify-center gap-2">
                                        {submitting ? <><Spinner /> Submitting…</> : <><I d={ic.send} size={15} stroke="#1a1a1a" /> Submit Complaint</>}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {tab === "track" && (
                <div>
                    <div className="bg-white rounded-2xl border border-stone-100 p-6 mb-6">
                        <h3 className="font-semibold text-stone-800 mb-4">Track Your Ticket</h3>
                        <div className="space-y-3">
                            <input value={trackTicket} onChange={(e) => setTrackTicket(e.target.value.toUpperCase())}
                                onKeyDown={(e) => e.key === "Enter" && trackComplaint()}
                                placeholder="Ticket number (TKT-202506-XXXXX)"
                                className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm" />
                            <input type="email" value={trackEmail} onChange={(e) => setTrackEmail(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && trackComplaint()}
                                placeholder="Your email address"
                                className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm" />
                            <button onClick={trackComplaint} disabled={tracking}
                                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-900 font-bold py-3 rounded-xl btn-bounce transition-colors flex items-center justify-center gap-2">
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
                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${STATUS_LABELS[trackedComplaint.status]?.cls || "bg-stone-100 text-stone-600"}`}>
                                    {STATUS_LABELS[trackedComplaint.status]?.label || trackedComplaint.status}
                                </span>
                            </div>
                            <div className="p-5">
                                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                                    <div className="bg-stone-50 rounded-xl p-3">
                                        <div className="text-xs text-stone-400 mb-1">Category</div>
                                        <div className="font-semibold text-stone-800 text-xs">
                                            {COMPLAINT_CATEGORIES.find(c => c.key === trackedComplaint.category)?.label || trackedComplaint.category}
                                        </div>
                                    </div>
                                    <div className="bg-stone-50 rounded-xl p-3">
                                        <div className="text-xs text-stone-400 mb-1">Priority</div>
                                        <div className="font-semibold text-stone-800 text-xs capitalize">{trackedComplaint.priority || "normal"}</div>
                                    </div>
                                </div>
                                <div className="bg-stone-50 rounded-xl p-4 mb-5">
                                    <div className="text-xs text-stone-400 mb-1">Subject</div>
                                    <div className="font-semibold text-stone-800 text-sm">{trackedComplaint.subject}</div>
                                </div>

                                {trackedComplaint.replies && trackedComplaint.replies.length > 0 && (
                                    <div className="mb-5">
                                        <div className="text-xs font-semibold text-stone-500 mb-3 uppercase tracking-wide">Message Thread</div>
                                        <div className="space-y-3">
                                            {trackedComplaint.replies.map((r, i) => {
                                                const isAdmin = r.authorType === "admin";
                                                return (
                                                    <div key={i} className={`flex gap-3 ${isAdmin ? "" : "flex-row-reverse"}`}>
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isAdmin ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-600"}`}>
                                                            {isAdmin ? "🎧" : "👤"}
                                                        </div>
                                                        <div className={`flex-1 ${isAdmin ? "" : "items-end flex flex-col"}`}>
                                                            <div className={`inline-block rounded-2xl px-4 py-3 text-sm max-w-[85%] ${isAdmin ? "bg-amber-50 border border-amber-100 text-stone-700" : "bg-stone-900 text-white"}`}>
                                                                {r.message}
                                                            </div>
                                                            <div className="text-xs text-stone-400 mt-1 px-1">
                                                                {isAdmin ? `Support — ` : ""}{new Date(r.createdAt).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {trackedComplaint.status === "resolved" && trackedComplaint.resolution && (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                                        <div className="font-semibold text-emerald-700 text-sm mb-2">✅ Resolution</div>
                                        {trackedComplaint.resolution.details && <p className="text-emerald-600 text-sm">{trackedComplaint.resolution.details}</p>}
                                        {trackedComplaint.resolution.refundAmount > 0 && <p className="text-emerald-700 font-semibold text-sm mt-1">Refund: {fmt(trackedComplaint.resolution.refundAmount)}</p>}
                                        {trackedComplaint.resolution.couponCode && <div className="mt-2 inline-block bg-emerald-100 text-emerald-700 font-mono text-sm px-3 py-1 rounded-lg">{trackedComplaint.resolution.couponCode}</div>}
                                    </div>
                                )}

                                {!["resolved", "rejected", "closed"].includes(trackedComplaint.status) && (
                                    <div className="mb-4">
                                        <div className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wide">Send Reply</div>
                                        <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={3}
                                            placeholder="Type your message…" maxLength={2000}
                                            className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm resize-none mb-2" />
                                        <button onClick={sendReply} disabled={replySending}
                                            className="bg-stone-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold btn-bounce hover:bg-stone-700 transition-colors disabled:opacity-60 flex items-center gap-2">
                                            {replySending ? <><Spinner /> Sending…</> : <><I d={ic.send} size={14} stroke="white" /> Send</>}
                                        </button>
                                    </div>
                                )}

                                {trackedComplaint.status === "resolved" && !trackedComplaint.satisfactionRating?.score && (
                                    <div className="bg-amber-50 rounded-xl p-4">
                                        <div className="text-sm font-semibold text-stone-800 mb-3">How was your experience?</div>
                                        <div className="flex gap-3 justify-center">
                                            {["😡", "😞", "😐", "😊", "🤩"].map((emoji, i) => (
                                                <button key={i} onClick={() => submitRating(i + 1)}
                                                    className={`text-2xl btn-bounce transition-transform hover:scale-125 ${rating === i + 1 ? "scale-125" : ""}`}>
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {/* Satisfaction rating - Fixed version */}
                                {(trackedComplaint.satisfactionRating?.score > 0 || rating > 0) && (
                                    <div className="bg-emerald-50 rounded-xl p-4 text-center">
                                        <span className="text-2xl">
                                            {(() => {
                                                const emojis = ["😡", "😞", "😐", "😊", "🤩"];
                                                const score = trackedComplaint.satisfactionRating?.score || rating;
                                                // Ensure score is between 1 and 5
                                                const index = Math.min(Math.max(score, 1), 5) - 1;
                                                return emojis[index] || "😐";
                                            })()}
                                        </span>
                                        <div className="text-emerald-600 font-semibold text-sm mt-1">Thank you for your feedback!</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-8 bg-white rounded-2xl border border-stone-100 p-6">
                <h3 className="font-display font-semibold text-stone-800 mb-4">Common Questions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[["⏱️ Response time?", "We respond within 24–48 hours on business days."],
                    ["💰 Refund process?", "Approved refunds are processed in 3–5 business days."],
                    ["📷 Can I attach photos?", "Yes, upload up to 5 photos or PDF files as evidence."],
                    ["📞 Talk directly?", "Call 01700-000000 or WhatsApp for immediate help."]
                    ].map(([q, a]) => (
                        <div key={q} className="bg-stone-50 rounded-xl p-4">
                            <div className="font-semibold text-stone-800 text-sm mb-1">{q}</div>
                            <div className="text-stone-500 text-xs leading-relaxed">{a}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ComplaintPage;