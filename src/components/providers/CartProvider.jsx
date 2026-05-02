import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState
} from "react";

export const CartCtx = createContext(null);

const STORAGE_KEY = "bh_cart2";

export function CartProvider({ children }) {
    const [items, setItems] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    });

    const [coupon, setCoupon] = useState(null);
    const [delivery, setDelivery] = useState(null);

    // ✅ persist (safe + non-blocking)
    useEffect(() => {
        const t = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        }, 150);
        return () => clearTimeout(t);
    }, [items]);

    const add = useCallback((product, qty = 1) => {
        setItems(prev => {
            const idx = prev.findIndex(i => i._id === product._id);

            if (idx !== -1) {
                const copy = [...prev];
                copy[idx] = { ...copy[idx], qty: copy[idx].qty + qty };
                return copy;
            }

            return [...prev, { ...product, qty }];
        });
    }, []);

    const remove = useCallback((id) => {
        setItems(prev => prev.filter(i => i._id !== id));
    }, []);

    const update = useCallback((id, qty) => {
        setItems(prev => {
            if (qty < 1) return prev.filter(i => i._id !== id);
            return prev.map(i => i._id === id ? { ...i, qty } : i);
        });
    }, []);

    const clear = useCallback(() => {
        setItems([]);
        setCoupon(null);
        setDelivery(null);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    const subtotal = useMemo(
        () => items.reduce((s, i) => s + i.price * i.qty, 0),
        [items]
    );

    const discount = useMemo(() => {
        if (!coupon) return 0;

        const d = coupon.type === "percent"
            ? subtotal * coupon.value / 100
            : coupon.value;

        return Math.min(d, subtotal);
    }, [coupon, subtotal]);

    const deliveryCharge = useMemo(
        () => delivery?.amount ?? delivery?.charge ?? 0,
        [delivery]
    );

    const total = useMemo(
        () => subtotal - discount + deliveryCharge,
        [subtotal, discount, deliveryCharge]
    );

    const count = useMemo(
        () => items.reduce((s, i) => s + i.qty, 0),
        [items]
    );

    const value = useMemo(() => ({
        items,
        add,
        remove,
        update,
        clear,
        coupon,
        setCoupon,
        delivery,
        setDelivery,
        subtotal,
        discount,
        deliveryCharge,
        total,
        count
    }), [
        items,
        add,
        remove,
        update,
        clear,
        coupon,
        delivery,
        subtotal,
        discount,
        deliveryCharge,
        total,
        count
    ]);

    return (
        <CartCtx.Provider value={value}>
            {children}
        </CartCtx.Provider>
    );
}

export const useCart = () => {
    const ctx = useContext(CartCtx);
    if (!ctx) throw new Error("useCart must be used within CartProvider");
    return ctx;
};
