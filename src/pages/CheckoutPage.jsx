import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FormField } from '../components/common/FormField';
import { I, ic } from '../components/common/Icons';
import { Spinner } from '../components/common/Spinner';
import { useCart } from '../components/providers/CartProvider';
import { useNav } from '../components/providers/NavProvider';
import { useToast } from '../components/providers/ToastProvider';
import { apiFetch } from '../utils/api';
import { API, CITIES } from '../utils/constants';
import { CDN, fmt } from '../utils/helpers';

const CheckoutPage = () => {
    const { setPage } = useNav();
    const cart = useCart();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [deliveryLoading, setDeliveryLoading] = useState(false);
    const [form, setForm] = useState({
        name: "", email: "", phone: "",
        street: "", city: "", zipCode: "",
        paymentMethod: "cash_on_delivery", notes: ""
    });
    const [errors, setErrors] = useState({});

    const initialLoadDone = useRef(false);
    const debounceTimer = useRef(null);
    const lastFetchedCity = useRef("");

    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem("bh_checkout_info") || "{}");
            setForm(fd => ({
                ...fd,
                name: fd.name || saved.checkoutName || "",
                email: fd.email || saved.checkoutEmail || "",
                phone: fd.phone || saved.checkoutPhone || "",
                city: fd.city || saved.checkoutCity || cart.delivery?.city || ""
            }));
            initialLoadDone.current = true;
        } catch {
            initialLoadDone.current = true;
        }
    }, []);

    useEffect(() => {
        if (!initialLoadDone.current) return;
        if (!form.city) return;

        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        debounceTimer.current = setTimeout(() => {
            if (lastFetchedCity.current !== form.city) {
                lastFetchedCity.current = form.city;
                setDeliveryLoading(true);

                fetch(`${API}/api/delivery-charges/active?city=${encodeURIComponent(form.city)}&subtotal=${cart.subtotal}`)
                    .then(r => r.json())
                    .then(d => {
                        if (d.success && d.data) cart.setDelivery(d.data);
                    })
                    .catch(() => { })
                    .finally(() => setDeliveryLoading(false));
            }
        }, 500);

        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [form.city, cart.subtotal]);

    const upd = useCallback((k, v) => {
        setForm(prev => ({ ...prev, [k]: v }));
        setErrors(prev => ({ ...prev, [k]: "" }));
    }, []);

    const validate = useCallback(() => {
        const e = {};
        if (!form.name.trim()) e.name = "Name required";
        if (!form.phone.match(/^01[3-9]\d{8}$/)) e.phone = "Enter valid BD phone (01XXXXXXXXX)";
        if (form.email && !form.email.includes("@")) e.email = "Invalid email";
        if (!form.street.trim()) e.street = "Street address required";
        if (!form.city.trim()) e.city = "City required";
        if (!form.zipCode.trim()) e.zipCode = "Zip code required";
        setErrors(e);
        return !Object.keys(e).length;
    }, [form.name, form.phone, form.email, form.street, form.city, form.zipCode]);

    const placeOrder = async () => {
        if (!validate()) {
            toast("Please fix the errors", "error");
            return;
        }
        setLoading(true);
        try {
            const payload = {
                customer: {
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    address: {
                        street: form.street,
                        city: form.city,
                        zipCode: form.zipCode
                    }
                },
                items: cart.items.map((i) => ({
                    product: i._id,
                    name: i.name,
                    sku: i.sku || "",
                    quantity: i.qty,
                    price: i.price,
                    total: i.price * i.qty
                })),
                subtotal: cart.subtotal,
                deliveryCharge: cart.deliveryCharge,
                discount: cart.discount,
                total: Math.round(cart.total),
                paymentMethod: form.paymentMethod,
                notes: form.notes,
                couponCode: cart.coupon?.code,
            };
            const data = await apiFetch("/api/orders", { method: "POST", body: JSON.stringify(payload) });
            setSuccess(data.data || data);
            cart.clear();
            localStorage.removeItem("bh_checkout_info");
        } catch (e) {
            toast(e.message || "Failed to place order. Try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    const downloadSlip = useCallback((orderData) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = 800;
        canvas.height = 950;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#0D1B3E";
        ctx.fillRect(0, 0, canvas.width, 110);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 26px sans-serif";
        ctx.fillText("🍯 BeeHarvest", 40, 50);
        ctx.font = "13px sans-serif";
        ctx.fillText("Bangladesh's Trusted Honey Shop", 40, 78);

        let y = 145;
        ctx.fillStyle = "#F5A623";
        ctx.font = "bold 20px sans-serif";
        ctx.fillText(`Order: ${orderData.orderNumber || "—"}`, 40, y);
        y += 35;
        ctx.fillStyle = "#666";
        ctx.font = "13px sans-serif";
        ctx.fillText(`Date: ${new Date().toLocaleDateString("en-BD")}`, 40, y);
        y += 30;

        ctx.strokeStyle = "#eee";
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(760, y);
        ctx.stroke();
        y += 25;

        ctx.fillStyle = "#0D1B3E";
        ctx.font = "bold 16px sans-serif";
        ctx.fillText("Customer Info", 40, y);
        y += 25;
        ctx.fillStyle = "#333";
        ctx.font = "14px sans-serif";
        ctx.fillText(`Name: ${orderData.customer?.name || "—"}`, 40, y);
        y += 22;
        ctx.fillText(`Phone: ${orderData.customer?.phone || "—"}`, 40, y);
        y += 22;
        ctx.fillText(`Address: ${orderData.customer?.address?.street || ""}, ${orderData.customer?.address?.city || ""}`, 40, y);
        y += 30;

        ctx.strokeStyle = "#eee";
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(760, y);
        ctx.stroke();
        y += 25;

        ctx.fillStyle = "#0D1B3E";
        ctx.font = "bold 16px sans-serif";
        ctx.fillText("Items", 40, y);
        y += 25;

        ctx.fillStyle = "#1A2E5A";
        ctx.fillRect(40, y, 720, 34);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText("Product", 55, y + 22);
        ctx.fillText("Qty", 460, y + 22);
        ctx.fillText("Price", 540, y + 22);
        ctx.fillText("Total", 650, y + 22);
        y += 44;

        const itemsToShow = orderData.items || orderData.orderItems || [];
        ctx.font = "13px sans-serif";
        itemsToShow.forEach((item, idx) => {
            if (idx % 2 === 0) {
                ctx.fillStyle = "#f9f9f9";
                ctx.fillRect(40, y - 8, 720, 34);
            }
            ctx.fillStyle = "#333";
            let name = item.name || "Product";
            if (name.length > 40) name = name.slice(0, 37) + "...";
            ctx.fillText(name, 55, y + 14);
            ctx.fillText(`x${item.quantity || item.qty || 1}`, 460, y + 14);
            ctx.fillText(`${(item.price || 0).toLocaleString()} BDT`, 540, y + 14);
            ctx.fillText(`${((item.price || 0) * (item.quantity || item.qty || 1)).toLocaleString()} BDT`, 640, y + 14);
            y += 34;
        });

        y += 20;
        ctx.strokeStyle = "#eee";
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(760, y);
        ctx.stroke();
        y += 25;

        ctx.fillStyle = "#333";
        ctx.font = "14px sans-serif";
        ctx.fillText("Subtotal:", 100, y);
        ctx.fillText(`${Math.round(orderData.subtotal || 0).toLocaleString()} BDT`, 640, y);
        y += 22;

        if (orderData.discount > 0) {
            ctx.fillText("Discount:", 100, y);
            ctx.fillText(`-${Math.round(orderData.discount || 0).toLocaleString()} BDT`, 640, y);
            y += 22;
        }

        ctx.fillText("Delivery:", 100, y);
        ctx.fillText(`${Math.round(orderData.deliveryCharge || 0).toLocaleString()} BDT`, 640, y);
        y += 22;

        ctx.fillStyle = "#0D1B3E";
        ctx.font = "bold 16px sans-serif";
        ctx.fillText("Total:", 100, y);
        ctx.fillText(`${Math.round(orderData.total || 0).toLocaleString()} BDT`, 640, y);
        y += 50;

        ctx.fillStyle = "#666";
        ctx.font = "13px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Thank you for shopping with BeeHarvest!", 400, y);
        y += 22;
        ctx.fillText("Support: 01700-000000 | info@beeharvest.com", 400, y);

        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `beeharvest_order_${orderData.orderNumber || "slip"}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }, []);

    if (success) return (
        <div className="max-w-xl mx-auto text-center px-4 py-20" style={{ animation: "popIn .5s ease" }}>
            <div className="text-7xl mb-5">{success.fraudVerdict === "review" ? "🛡️" : "🎉"}</div>
            <h2 className="font-display text-2xl font-bold text-stone-900 mb-2">
                {success.fraudVerdict === "review" ? "Order Received!" : "Order Placed!"}
            </h2>
            {success.fraudVerdict === "review" && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-5 text-left">
                    <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm mb-1">
                        <I d={ic.shield} size={14} stroke="#6366F1" /> Under Security Review
                    </div>
                    <p className="text-indigo-600 text-xs">Your order is under review. We'll contact you within 24 hours.</p>
                </div>
            )}
            <p className="text-stone-500 text-sm mb-5">Your order number is:</p>
            <div className="bg-amber-50 border border-amber-200 text-stone-900 text-2xl font-bold py-4 px-6 rounded-2xl mb-5 tracking-widest inline-block">
                {success.orderNumber || success._id}
            </div>
            <p className="text-stone-400 text-sm mb-8">Save this number to track your order. We'll update you via email.</p>
            <div className="flex gap-3 justify-center flex-wrap">
                <button onClick={() => setPage("track")} className="bg-stone-900 text-white px-5 py-3 rounded-xl btn-bounce text-sm font-semibold flex items-center gap-2">
                    <I d={ic.truck} size={16} stroke="white" /> Track Order
                </button>
                <button onClick={() => downloadSlip({ ...success, items: cart.items })}
                    className="border border-stone-200 px-5 py-3 rounded-xl btn-bounce text-sm font-medium text-stone-600 hover:bg-stone-50 flex items-center gap-2">
                    <I d={ic.download} size={15} /> Download Slip
                </button>
                <button onClick={() => setPage("shop")}
                    className="border border-stone-200 px-5 py-3 rounded-xl btn-bounce text-sm font-medium text-stone-600 hover:bg-stone-50">
                    Continue Shopping
                </button>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mb-8">Checkout</h1>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
                <div className="space-y-5">
                    {/* Customer Info */}
                    <div className="bg-white rounded-2xl border border-stone-100 p-6">
                        <h3 className="font-semibold text-stone-800 mb-5 flex items-center gap-2">
                            <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                            Customer Information
                        </h3>
                        <div className="flex flex-wrap gap-4">
                            <FormField label="Full Name" k="name" value={form.name} error={errors.name} onChange={upd}
                                placeholder="Rahim Hossain" required />
                            <FormField label="Phone Number" k="phone" value={form.phone} error={errors.phone} onChange={upd}
                                placeholder="01XXXXXXXXX" required half />
                            <FormField label="Email Address" k="email" type="email" value={form.email} error={errors.email} onChange={upd}
                                placeholder="email@example.com" half />
                        </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="bg-white rounded-2xl border border-stone-100 p-6">
                        <h3 className="font-semibold text-stone-800 mb-5 flex items-center gap-2">
                            <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                            Delivery Address
                            {deliveryLoading && <span className="ml-auto text-xs text-stone-400"><Spinner /> Calculating...</span>}
                            {cart.delivery && !deliveryLoading && (
                                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${cart.deliveryCharge === 0 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                                    Delivery: {cart.deliveryCharge === 0 ? "Free" : fmt(cart.deliveryCharge)}
                                </span>
                            )}
                        </h3>
                        <div className="flex flex-wrap gap-4">
                            <FormField label="Street Address" k="street" value={form.street} error={errors.street} onChange={upd}
                                placeholder="House #, Road #, Area" required />
                            <FormField label="City/District" k="city" value={form.city} error={errors.city} onChange={upd}
                                placeholder="Select your city" required options={CITIES} />
                            <FormField label="Zip Code" k="zipCode" value={form.zipCode} error={errors.zipCode} onChange={upd}
                                placeholder="e.g. 1200" required />
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="bg-white rounded-2xl border border-stone-100 p-6">
                        <h3 className="font-semibold text-stone-800 mb-5 flex items-center gap-2">
                            <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                            Payment Method
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[{ v: "cash_on_delivery", l: "Cash on Delivery", i: "💵" },
                            { v: "bkash", l: "bKash", i: "🔴" },
                            { v: "nagad", l: "Nagad", i: "🟠" },
                            { v: "rocket", l: "Rocket", i: "🟣" }
                            ].map((m) => (
                                <label key={m.v} className={`flex flex-col items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all btn-bounce ${form.paymentMethod === m.v ? "border-amber-400 bg-amber-50" : "border-stone-200 hover:border-amber-200"
                                    }`}>
                                    <input type="radio" name="pay" value={m.v} checked={form.paymentMethod === m.v}
                                        onChange={(e) => upd("paymentMethod", e.target.value)} className="sr-only" />
                                    <span className="text-2xl">{m.i}</span>
                                    <span className="text-xs font-semibold text-stone-700 text-center">{m.l}</span>
                                </label>
                            ))}
                        </div>
                        <div className="mt-4">
                            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Special Instructions (optional)</label>
                            <textarea value={form.notes} onChange={(e) => upd("notes", e.target.value)} rows={3}
                                placeholder="Any delivery instructions…"
                                className="w-full px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm resize-none" />
                        </div>
                    </div>
                </div>

                {/* Order Summary Sidebar */}
                <div className="lg:sticky lg:top-20 bg-white rounded-2xl border border-stone-100 p-5">
                    <h3 className="font-semibold text-stone-800 mb-4">Order Summary</h3>
                    <div className="max-h-60 overflow-y-auto space-y-3 mb-4">
                        {cart.items.map((item) => {
                            const imgSrc = (() => {
                                if (!item.images?.length) return null;
                                const i = item.images[0];
                                return typeof i === "string" ? CDN(i) : CDN(i?.url);
                            })();
                            return (
                                <div key={item._id} className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                                        {imgSrc ? <img src={imgSrc} alt="" className="w-full h-full object-cover" /> : <span>🍯</span>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-semibold text-stone-800 line-clamp-2">{item.name}</div>
                                        <div className="text-xs text-stone-400">×{item.qty}</div>
                                    </div>
                                    <div className="text-xs font-bold text-stone-900">{fmt(item.price * item.qty)}</div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="border-t border-stone-100 pt-4 space-y-2.5 text-sm">
                        <div className="flex justify-between text-stone-500">
                            <span>Subtotal</span>
                            <span className="font-medium text-stone-800">{fmt(cart.subtotal)}</span>
                        </div>
                        {cart.discount > 0 && (
                            <div className="flex justify-between text-emerald-600">
                                <span>Discount</span>
                                <span>-{fmt(cart.discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-stone-500">
                            <span>Delivery <span className="text-xs text-amber-600">({form.city || "—"})</span></span>
                            <span className={`font-medium ${cart.deliveryCharge === 0 ? "text-emerald-600" : "text-stone-800"}`}>
                                {cart.deliveryCharge === 0 ? "Free" : fmt(cart.deliveryCharge)}
                            </span>
                        </div>
                        <div className="border-t border-stone-100 pt-3 flex justify-between font-bold text-stone-900 text-base">
                            <span>Total</span>
                            <span>{fmt(cart.total)}</span>
                        </div>
                    </div>
                    <button onClick={placeOrder} disabled={loading}
                        className="mt-5 w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-900 font-bold py-4 rounded-xl btn-bounce shadow-lg shadow-amber-200 transition-all flex items-center justify-center gap-2 text-sm">
                        {loading ? <><Spinner /> Placing Order…</> : `Place Order — ${fmt(cart.total)}`}
                    </button>
                    <p className="text-center text-stone-400 text-[11px] mt-2">🔒 Secure checkout — Your data is safe</p>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;