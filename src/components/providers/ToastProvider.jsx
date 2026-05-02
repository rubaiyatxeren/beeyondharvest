import React, {
    createContext,
    useCallback,
    useContext,
    useRef,
    useState
} from "react";

export const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timers = useRef(new Map());

    const add = useCallback((msg, type = "success", duration = 3500) => {
        const id = Date.now() + Math.random();

        setToasts(prev => [...prev, { id, msg, type }]);

        const timer = setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
            timers.current.delete(id);
        }, duration);

        timers.current.set(id, timer);
    }, []);

    const remove = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));

        if (timers.current.has(id)) {
            clearTimeout(timers.current.get(id));
            timers.current.delete(id);
        }
    }, []);

    return (
        <ToastCtx.Provider value={add}>
            {children}

            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg pointer-events-auto
                        ${t.type === "error"
                                ? "bg-red-50 text-red-700"
                                : t.type === "warn"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-emerald-50 text-emerald-700"
                            }`}
                    >
                        <span>
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
    const ctx = useContext(ToastCtx);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
};
