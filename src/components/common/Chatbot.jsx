import React, { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../../utils/api';
import { I, ic } from './Icons';

const Chatbot = () => {
    const [open, setOpen] = useState(false);
    const [msgs, setMsgs] = useState([{ role: "bot", text: "Hi! 👋 I'm BeeBot. Ask me anything about our honey, orders, or delivery!" }]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const endRef = useRef();

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

    const send = async () => {
        if (!input.trim()) return;
        const msg = input.trim();
        setInput("");
        setMsgs((p) => [...p, { role: "user", text: msg }]);
        setLoading(true);
        try {
            const data = await apiFetch("/api/chatbot/message", { method: "POST", body: JSON.stringify({ message: msg }) });
            setMsgs((p) => [...p, { role: "bot", text: data.data?.reply || data.reply || "Let me connect you with our team." }]);
        } catch {
            setMsgs((p) => [...p, { role: "bot", text: "Sorry, I'm having trouble right now. Try again soon!" }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9990]">
            {open && (
                <div className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden" style={{ animation: "popIn .25s ease" }}>
                    <div className="bg-stone-900 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-amber-400 rounded-full flex items-center justify-center text-lg">🐝</div>
                            <div>
                                <div className="text-white font-semibold text-sm">BeeBot</div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                    <span className="text-emerald-400 text-xs">Online</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setOpen(false)} className="text-stone-400 hover:text-white btn-bounce">
                            <I d={ic.x} size={16} />
                        </button>
                    </div>

                    <div className="h-64 overflow-y-auto p-4 bg-stone-50 space-y-3">
                        {msgs.map((m, i) => (
                            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === "user"
                                        ? "bg-amber-500 text-stone-900 font-medium rounded-br-sm"
                                        : "bg-white text-stone-700 border border-stone-100 rounded-bl-sm shadow-sm"
                                    }`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-stone-100 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-stone-300 rounded-full" style={{ animation: "fadeIn .5s infinite alternate" }} />
                                        <span className="w-1.5 h-1.5 bg-stone-300 rounded-full" style={{ animation: "fadeIn .5s .15s infinite alternate" }} />
                                        <span className="w-1.5 h-1.5 bg-stone-300 rounded-full" style={{ animation: "fadeIn .5s .3s infinite alternate" }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={endRef} />
                    </div>

                    <div className="p-3 bg-white border-t border-stone-100 flex gap-2">
                        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
                            placeholder="Type a message…" className="flex-1 px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm" />
                        <button onClick={send} disabled={loading}
                            className="bg-amber-500 hover:bg-amber-400 text-stone-900 p-2.5 rounded-xl btn-bounce transition-colors disabled:opacity-60">
                            <I d={ic.chev_r} size={16} stroke="#1a1a1a" />
                        </button>
                    </div>
                </div>
            )}
            <button onClick={() => setOpen(!open)}
                className="w-14 h-14 rounded-full bg-amber-400 hover:bg-amber-500 shadow-xl shadow-amber-300/50 btn-bounce transition-all flex items-center justify-center text-2xl"
                style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .3s ease" }}>
                {open ? <I d={ic.x} size={20} stroke="#1a1a1a" /> : "🐝"}
            </button>
        </div>
    );
};

export default Chatbot;