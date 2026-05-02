import React, { useRef, useState } from 'react';
import { I, ic } from '../components/common/Icons';
import { useToast } from '../components/providers/ToastProvider';
import { API } from '../utils/constants';

const BeeTransferPage = () => {
    const [activeTab, setActiveTab] = useState("send");
    const [step, setStep] = useState(1);
    const [sendForm, setSendForm] = useState({
        senderEmail: "", senderName: "", receiverEmail: "", receiverName: "", message: "", files: []
    });
    const [uploadProgress, setUploadProgress] = useState(0);
    const [sending, setSending] = useState(false);
    const [transferId, setTransferId] = useState(null);
    const [otp, setOtp] = useState("");
    const [otpVerifying, setOtpVerifying] = useState(false);
    const [otpError, setOtpError] = useState("");
    const [otpResendCooldown, setOtpResendCooldown] = useState(0);
    const [sendSuccess, setSendSuccess] = useState(null);
    const [receiveTransferId, setReceiveTransferId] = useState("");
    const [receiveLoading, setReceiveLoading] = useState(false);
    const [transferData, setTransferData] = useState(null);
    const [transferError, setTransferError] = useState("");
    const [downloadingFile, setDownloadingFile] = useState(null);
    const toast = useToast();
    const fileInputRef = useRef();

    const getFilePreviewUrl = (file) => {
        if (file.type?.startsWith("image/")) return URL.createObjectURL(file);
        return null;
    };

    const getFileIcon = (file) => {
        const type = file.type;
        if (type?.startsWith("image/")) return "🖼️";
        if (type === "application/pdf") return "📕";
        if (type?.includes("word")) return "📘";
        if (type?.includes("excel")) return "📗";
        if (type?.startsWith("text/")) return "📝";
        return "📄";
    };

    const formatBytes = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const updateSendForm = (k, v) => setSendForm(prev => ({ ...prev, [k]: v }));

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        const maxFiles = 10;
        const maxSizeMB = 15;
        if (selectedFiles.length > maxFiles) { toast(`Maximum ${maxFiles} files allowed`, "error"); return; }
        const oversized = selectedFiles.filter(f => f.size > maxSizeMB * 1024 * 1024);
        if (oversized.length) { toast(`${oversized.length} file(s) exceed ${maxSizeMB}MB limit`, "error"); return; }
        setSendForm(prev => ({ ...prev, files: [...prev.files, ...selectedFiles] }));
    };

    const removeFile = (index) => {
        setSendForm(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== index) }));
    };

    const resetSendFlow = () => {
        setStep(1);
        setTransferId(null);
        setSendSuccess(null);
        setSendForm({ senderEmail: "", senderName: "", receiverEmail: "", receiverName: "", message: "", files: [] });
        setOtp("");
        setOtpError("");
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const initiateTransfer = async () => {
        if (!sendForm.senderEmail || !sendForm.receiverEmail) { toast("Sender and receiver emails are required", "error"); return; }
        if (sendForm.files.length === 0) { toast("Please select at least one file", "error"); return; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(sendForm.senderEmail) || !emailRegex.test(sendForm.receiverEmail)) { toast("Invalid email format", "error"); return; }

        setSending(true);
        setUploadProgress(0);
        const formData = new FormData();
        formData.append("senderEmail", sendForm.senderEmail);
        formData.append("senderName", sendForm.senderName);
        formData.append("receiverEmail", sendForm.receiverEmail);
        formData.append("receiverName", sendForm.receiverName);
        if (sendForm.message) formData.append("message", sendForm.message);
        sendForm.files.forEach(f => formData.append("files", f));

        try {
            const progressInterval = setInterval(() => { setUploadProgress(prev => Math.min(prev + 10, 90)); }, 300);
            const res = await fetch(`${API}/api/transfers/initiate`, { method: "POST", body: formData });
            clearInterval(progressInterval);
            setUploadProgress(100);
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            setTransferId(data.data.transferId);
            toast(`OTP sent to ${sendForm.senderEmail}!`, "success");
            setStep(2);
        } catch (err) { toast(err.message || "Failed to initiate transfer", "error"); }
        finally { setSending(false); setUploadProgress(0); }
    };

    const verifyOtp = async () => {
        if (!otp || otp.length !== 6) { setOtpError("Please enter the 6-digit OTP"); return; }
        setOtpVerifying(true);
        setOtpError("");
        try {
            const res = await fetch(`${API}/api/transfers/${transferId}/verify-otp`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ otp })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            setSendSuccess(data.data);
            toast("Transfer verified! Files have been sent.", "success");
            setStep(3);
        } catch (err) { setOtpError(err.message); toast(err.message, "error"); }
        finally { setOtpVerifying(false); }
    };

    const resendOtp = async () => {
        if (otpResendCooldown > 0) return;
        try {
            const res = await fetch(`${API}/api/transfers/${transferId}/resend-otp`, { method: "POST" });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            toast("OTP resent successfully!", "success");
            setOtpResendCooldown(60);
            const timer = setInterval(() => {
                setOtpResendCooldown(prev => { if (prev <= 1) { clearInterval(timer); return 0; } return prev - 1; });
            }, 1000);
        } catch (err) { toast(err.message, "error"); }
    };

    const fetchTransfer = async () => {
        if (!receiveTransferId.trim()) { setTransferError("Please enter a Transfer ID"); return; }
        setReceiveLoading(true);
        setTransferError("");
        setTransferData(null);
        try {
            const res = await fetch(`${API}/api/transfers/${receiveTransferId.toUpperCase()}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            setTransferData(data.data);
        } catch (err) { setTransferError(err.message || "Transfer not found or expired"); }
        finally { setReceiveLoading(false); }
    };

    const downloadFile = async (file) => {
        setDownloadingFile(file._id);
        try {
            const res = await fetch(`${API}/api/transfers/${receiveTransferId}/files/${file._id}/download`, { method: "POST" });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);

            const fileRes = await fetch(data.data.downloadUrl);
            const blob = await fileRes.blob();

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = file.originalName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast(`Downloading ${file.originalName}...`, "success");

            // Optimistically increment download count locally
            setTransferData(prev => ({
                ...prev,
                files: prev.files.map(f =>
                    f._id === file._id ? { ...f, downloadCount: f.downloadCount + 1 } : f
                )
            }));
        } catch (err) { toast(err.message || "Failed to download file", "error"); }
        finally { setDownloadingFile(null); }
    };

    const renderSendTab = () => {
        if (step === 1) {
            return (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-xs font-semibold text-stone-500 mb-1.5">Your Email *</label>
                            <input type="email" value={sendForm.senderEmail} onChange={(e) => updateSendForm("senderEmail", e.target.value)}
                                placeholder="you@example.com" className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm" />
                        </div>
                        <div><label className="block text-xs font-semibold text-stone-500 mb-1.5">Your Name (optional)</label>
                            <input type="text" value={sendForm.senderName} onChange={(e) => updateSendForm("senderName", e.target.value)}
                                placeholder="John Doe" className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm" />
                        </div>
                        <div><label className="block text-xs font-semibold text-stone-500 mb-1.5">Recipient Email *</label>
                            <input type="email" value={sendForm.receiverEmail} onChange={(e) => updateSendForm("receiverEmail", e.target.value)}
                                placeholder="friend@example.com" className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm" />
                        </div>
                        <div><label className="block text-xs font-semibold text-stone-500 mb-1.5">Recipient Name (optional)</label>
                            <input type="text" value={sendForm.receiverName} onChange={(e) => updateSendForm("receiverName", e.target.value)}
                                placeholder="Jane Doe" className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm" />
                        </div>
                    </div>
                    <div><label className="block text-xs font-semibold text-stone-500 mb-1.5">Message (optional)</label>
                        <textarea value={sendForm.message} onChange={(e) => updateSendForm("message", e.target.value)} rows={2}
                            placeholder="Add a note for the recipient..." maxLength={500}
                            className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm resize-none" />
                        <div className="text-right text-xs text-stone-400 mt-1">{sendForm.message.length}/500</div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-stone-500 mb-1.5">Files * (max 10 files, 15MB each)</label>
                        {sendForm.files.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                                {sendForm.files.map((file, idx) => {
                                    const previewUrl = getFilePreviewUrl(file);
                                    const fileIcon = getFileIcon(file);
                                    return (
                                        <div key={idx} className="relative group">
                                            <div className="bg-stone-50 rounded-xl overflow-hidden border border-stone-100 aspect-square flex items-center justify-center">
                                                {previewUrl ? <img src={previewUrl} alt={file.name} className="w-full h-full object-cover" onLoad={() => URL.revokeObjectURL(previewUrl)} />
                                                    : <div className="text-center p-3"><div className="text-4xl mb-1">{fileIcon}</div><div className="text-xs text-stone-600 truncate px-1">{file.name.split('.').pop()?.toUpperCase() || 'FILE'}</div></div>}
                                            </div>
                                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => removeFile(idx)} className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors">
                                                    <I d={ic.x} size={12} stroke="white" strokeWidth={2.5} />
                                                </button>
                                            </div>
                                            <div className="mt-1.5"><div className="text-xs font-medium text-stone-700 truncate">{file.name}</div><div className="text-[10px] text-stone-400">{formatBytes(file.size)}</div></div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-stone-200 rounded-xl p-6 text-center cursor-pointer hover:border-amber-300 hover:bg-amber-50/30 transition-all">
                            <I d={ic.upload} size={32} className="mx-auto text-stone-400 mb-2" />
                            <p className="text-sm text-stone-500">Click to select files</p>
                            <p className="text-xs text-stone-400 mt-1">or drag and drop</p>
                            <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden"
                                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" />
                        </div>
                    </div>
                    <button onClick={initiateTransfer} disabled={sending || sendForm.files.length === 0}
                        className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-900 font-bold py-3.5 rounded-xl btn-bounce transition-colors flex items-center justify-center gap-2">
                        {sending ? <><div className="w-4 h-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" /> Uploading {uploadProgress > 0 && `(${uploadProgress}%)`}...</>
                            : <><I d={ic.send} size={16} stroke="#1a1a1a" /> Send Files</>}
                    </button>
                </div>
            );
        }
        if (step === 2) {
            return (
                <div className="space-y-6">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                        <div className="text-3xl mb-2">🔐</div>
                        <p className="text-sm text-stone-700">An OTP has been sent to <strong>{sendForm.senderEmail}</strong></p>
                        <p className="text-xs text-stone-500 mt-1">Please check your inbox (and spam folder)</p>
                    </div>
                    <div><label className="block text-xs font-semibold text-stone-500 mb-1.5">Enter OTP Code</label>
                        <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="000000" maxLength={6}
                            className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-center text-2xl font-mono tracking-widest" />
                        {otpError && <p className="text-red-500 text-xs mt-1">{otpError}</p>}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => { setStep(1); setOtp(""); setOtpError(""); }}
                            className="flex-1 border border-stone-200 text-stone-600 font-semibold py-3 rounded-xl btn-bounce hover:bg-stone-50">Back</button>
                        <button onClick={verifyOtp} disabled={otpVerifying || otp.length !== 6}
                            className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-900 font-bold py-3 rounded-xl btn-bounce transition-colors flex items-center justify-center gap-2">
                            {otpVerifying ? <><div className="w-4 h-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" /> Verifying...</> : "Verify & Send"}
                        </button>
                    </div>
                    <div className="text-center">
                        <button onClick={resendOtp} disabled={otpResendCooldown > 0}
                            className="text-sm text-amber-600 hover:text-amber-700 disabled:opacity-50">
                            Resend OTP {otpResendCooldown > 0 && `(${otpResendCooldown}s)`}
                        </button>
                    </div>
                </div>
            );
        }
        if (step === 3 && sendSuccess) {
            return (
                <div className="text-center space-y-5" style={{ animation: "popIn .3s ease" }}>
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-3xl mx-auto">✅</div>
                    <h3 className="font-display text-xl font-bold text-stone-900">Files Sent Successfully!</h3>
                    <div className="bg-stone-50 rounded-xl p-4"><p className="text-xs text-stone-500">Transfer ID</p><p className="font-mono font-bold text-amber-600 text-sm">{sendSuccess.transferId}</p></div>
                    <p className="text-stone-500 text-sm">An email with download instructions has been sent to <strong>{sendForm.receiverEmail}</strong></p>
                    <button onClick={resetSendFlow} className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-6 py-2.5 rounded-xl btn-bounce">Send More Files</button>
                </div>
            );
        }
        return null;
    };

    const renderReceiveTab = () => {
        if (!transferData) {
            return (
                <div className="space-y-5">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4"><p className="text-sm text-stone-700 text-center">Enter the Transfer ID you received via email to download files.</p></div>
                    <div><label className="block text-xs font-semibold text-stone-500 mb-1.5">Transfer ID</label>
                        <input type="text" value={receiveTransferId} onChange={(e) => setReceiveTransferId(e.target.value.toUpperCase())}
                            placeholder="e.g. BT-20250421-A3F7K" className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm font-mono" />
                    </div>
                    <button onClick={fetchTransfer} disabled={receiveLoading}
                        className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-900 font-bold py-3 rounded-xl btn-bounce transition-colors flex items-center justify-center gap-2">
                        {receiveLoading ? <><div className="w-4 h-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" /> Loading...</>
                            : <><I d={ic.search} size={16} stroke="#1a1a1a" /> Fetch Files</>}
                    </button>
                    {transferError && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center"><p className="text-red-600 text-sm">{transferError}</p></div>}
                </div>
            );
        }
        return (
            <div className="space-y-5" style={{ animation: "fadeIn .3s ease" }}>
                <div className="bg-gradient-to-r from-stone-800 to-stone-900 rounded-xl p-4 text-white">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                        <div><p className="text-xs opacity-60">Transfer ID</p><p className="font-mono font-bold text-sm">{transferData.transferId}</p></div>
                        <div><p className="text-xs opacity-60">From</p><p className="text-sm font-semibold">{transferData.sender?.name || transferData.sender?.email}</p></div>
                        <div><p className="text-xs opacity-60">Expires</p><p className="text-sm">{new Date(transferData.expiresAt).toLocaleDateString()}</p></div>
                    </div>
                </div>
                {transferData.message && (<div className="bg-amber-50 rounded-xl p-4"><p className="text-xs text-amber-600 font-semibold mb-1">📝 Message from sender</p><p className="text-stone-700 text-sm italic">"{transferData.message}"</p></div>)}
                <div><h4 className="font-semibold text-stone-800 mb-3 text-sm">Files ({transferData.files.length}) • Total: {transferData.totalSizeFormatted}</h4>
                    <div className="space-y-2">{transferData.files.map((file) => (
                        <div key={file._id} className="flex items-center gap-3 bg-stone-50 rounded-xl p-3">
                            <span className="text-2xl">{file.mimetype?.startsWith("image/") ? "🖼️" : "📄"}</span>
                            <div className="flex-1 min-w-0"><div className="font-semibold text-stone-800 text-sm truncate">{file.originalName}</div>
                                <div className="text-xs text-stone-400 flex gap-3 mt-0.5"><span>{file.sizeFormatted}</span><span>⬇️ {file.downloadCount} downloads</span></div>
                            </div>
                            <button onClick={() => downloadFile(file)} disabled={downloadingFile === file._id}
                                className="bg-amber-500 hover:bg-amber-400 text-stone-900 px-4 py-2 rounded-xl text-sm font-semibold btn-bounce transition-colors disabled:opacity-60 flex items-center gap-1">
                                {downloadingFile === file._id ? <div className="w-4 h-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                                    : <><I d={ic.download} size={14} stroke="#1a1a1a" /> Download</>}
                            </button>
                        </div>
                    ))}</div>
                </div>
                <button onClick={() => { setTransferData(null); setReceiveTransferId(""); setTransferError(""); }}
                    className="w-full border border-stone-200 text-stone-600 font-semibold py-2.5 rounded-xl btn-bounce hover:bg-stone-50 text-sm">Check Another Transfer</button>
            </div>
        );
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
            <div className="text-center mb-8"><div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg shadow-amber-200">🐝</div>
                <h1 className="font-display text-3xl font-bold text-stone-900 mb-2">BeeTransfer</h1><p className="text-stone-500 text-sm">Secure file transfer with OTP protection</p>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-8">
                {[["🔒", "End-to-End", "Encrypted"], ["⚡", "Up to 150MB", "Total limit"], ["📧", "Email Delivery", "With OTP"]].map(([icon, label, sub]) => (
                    <div key={label} className="bg-white rounded-2xl border border-stone-100 p-3 text-center">
                        <div className="text-xl">{icon}</div><div className="text-xs font-semibold text-stone-800 mt-0.5">{label}</div><div className="text-[10px] text-stone-400">{sub}</div>
                    </div>
                ))}
            </div>
            <div className="flex rounded-xl border border-stone-200 overflow-hidden mb-6 bg-white">
                <button onClick={() => { setActiveTab("send"); resetSendFlow(); }}
                    className={`flex-1 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === "send" ? "bg-amber-500 text-stone-900" : "text-stone-500 hover:bg-stone-50"}`}>
                    <I d={ic.send} size={14} /> Send Files
                </button>
                <button onClick={() => { setActiveTab("receive"); setTransferData(null); setReceiveTransferId(""); }}
                    className={`flex-1 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === "receive" ? "bg-amber-500 text-stone-900" : "text-stone-500 hover:bg-stone-50"}`}>
                    <I d={ic.download} size={14} /> Receive Files
                </button>
            </div>
            <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm">{activeTab === "send" ? renderSendTab() : renderReceiveTab()}</div>
            <div className="mt-8 bg-white rounded-2xl border border-stone-100 p-6">
                <h3 className="font-display font-semibold text-stone-800 mb-4 text-center">How It Works</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[{ step: "1", title: "Upload & Add Recipient", desc: "Select files (max 10, 15MB each), add recipient email", icon: "📤" },
                    { step: "2", title: "Verify with OTP", desc: "Enter the OTP sent to your email to confirm the transfer", icon: "🔐" },
                    { step: "3", title: "Receiver Gets Link", desc: "Your recipient receives a secure download link", icon: "📧" }
                    ].map((item) => (
                        <div key={item.step} className="text-center"><div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-xl mx-auto mb-3">{item.icon}</div>
                            <div className="font-semibold text-stone-800 text-sm">{item.title}</div><p className="text-stone-400 text-xs mt-1">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BeeTransferPage;