import React, { createContext, useCallback, useContext, useState } from 'react';

export const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const add = useCallback((msg, type = "success") => {
        const id = Date.now();
        setToasts((p) => [...p, { id, msg, type }]);
        setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
    }, []);

    return (
        <ToastCtx.Provider value={add}>
            {children}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map((t) => (
                    <div key={t.id} style={{ animation: "slideUp .3s ease" }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold shadow-2xl border pointer-events-auto ${t.type === "error" ? "bg-red-50 text-red-700 border-red-200" :
                                t.type === "warn" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                    "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}>
                        <span className="text-base">
                            {t.type === "error" ? "✕" : t.type === "warn" ? "⚠" : "✓"}
                        </span>
                        {t.msg}
                    </div>
                ))}
            </div>
        </ToastCtx.Provider>
    );
}

export const useToast = () => {
    const context = useContext(ToastCtx);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};