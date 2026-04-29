import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const CartCtx = createContext(null);

export function CartProvider({ children }) {
    const [items, setItems] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("bh_cart2") || "[]");
        } catch {
            return [];
        }
    });
    const [coupon, setCoupon] = useState(null);
    const [delivery, setDelivery] = useState(null);

    useEffect(() => {
        localStorage.setItem("bh_cart2", JSON.stringify(items));
    }, [items]);

    const add = (product, qty = 1) => setItems((p) => {
        const ex = p.find((i) => i._id === product._id);
        if (ex) return p.map((i) => i._id === product._id ? { ...i, qty: i.qty + qty } : i);
        return [...p, { ...product, qty }];
    });

    const remove = (id) => setItems((p) => p.filter((i) => i._id !== id));

    const update = (id, qty) => {
        if (qty < 1) return remove(id);
        setItems((p) => p.map((i) => i._id === id ? { ...i, qty } : i));
    };

    const clear = () => {
        setItems([]);
        setCoupon(null);
        setDelivery(null);
    };

    const subtotal = useMemo(() => {
        const total = items.reduce((s, i) => s + i.price * i.qty, 0);
        return Math.round(total * 100) / 100;
    }, [items]);

    const discount = useMemo(() => {
        if (!coupon) return 0;
        let disc = coupon.type === "percent" ? (subtotal * coupon.value / 100) : coupon.value;
        disc = Math.min(disc, subtotal);
        return Math.round(disc * 100) / 100;
    }, [coupon, subtotal]);

    const deliveryCharge = useMemo(() => {
        const charge = delivery?.amount ?? delivery?.charge ?? 0;
        return Math.round(charge * 100) / 100;
    }, [delivery]);

    const total = useMemo(() => {
        const rawTotal = subtotal - discount + deliveryCharge;
        return Math.round(rawTotal * 100) / 100;
    }, [subtotal, discount, deliveryCharge]);

    const count = items.reduce((s, i) => s + i.qty, 0);

    return (
        <CartCtx.Provider value={{
            items, add, remove, update, clear,
            coupon, setCoupon, delivery, setDelivery,
            subtotal, discount, deliveryCharge, total, count
        }}>
            {children}
        </CartCtx.Provider>
    );
}

export const useCart = () => {
    const context = useContext(CartCtx);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
