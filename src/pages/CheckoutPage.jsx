/**
 * CheckoutPage.jsx  (refactored)
 * ─────────────────────────────────────────────────────────────
 * Widgets consumed:
 *   DeliveryBadge      ← widgets/DeliveryBadge (inline pill)
 *   DownloadSlipButton ← widgets/OrderSlip
 * ─────────────────────────────────────────────────────────────
 */

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
import { DeliveryBadge } from '../widgets/DeliveryBadge';
import { DownloadSlipButton } from '../widgets/OrderSlip';

const CheckoutPage = () => {
    const { setPage } = useNav();
    const cart = useCart();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [deliveryLoading, setDeliveryLoading] = useState(false);
    const [form, setForm] = useState({
        name: '', email: '', phone: '',
        street: '', city: '', zipCode: '',
        paymentMethod: 'cash_on_delivery', notes: '',
    });
    const [errors, setErrors] = useState({});

    const initialLoadDone = useRef(false);
    const debounceTimer = useRef(null);
    const lastFetchedCity = useRef('');

    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('bh_checkout_info') || '{}');
            setForm((fd) => ({
                ...fd,
                name: fd.name || saved.checkoutName || '',
                email: fd.email || saved.checkoutEmail || '',
                phone: fd.phone || saved.checkoutPhone || '',
                city: fd.city || saved.checkoutCity || cart.delivery?.city || '',
            }));
            initialLoadDone.current = true;
        } catch {
            initialLoadDone.current = true;
        }
    }, []);

    /* Debounced city→delivery fetch */
    useEffect(() => {
        if (!initialLoadDone.current || !form.city) return;
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            if (lastFetchedCity.current !== form.city) {
                lastFetchedCity.current = form.city;
                setDeliveryLoading(true);
                fetch(`${API}/api/delivery-charges/active?city=${encodeURIComponent(form.city)}&subtotal=${cart.subtotal}`)
                    .then((r) => r.json())
                    .then((d) => { if (d.success && d.data) cart.setDelivery(d.data); })
                    .catch(() => { })
                    .finally(() => setDeliveryLoading(false));
            }
        }, 500);
        return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
    }, [form.city, cart.subtotal]);

    const upd = useCallback((k, v) => {
        setForm((prev) => ({ ...prev, [k]: v }));
        setErrors((prev) => ({ ...prev, [k]: '' }));
    }, []);

    const validate = useCallback(() => {
        const e = {};
        if (!form.name.trim()) e.name = 'Name required';
        if (!form.phone.match(/^01[3-9]\d{8}$/)) e.phone = 'Enter valid BD phone (01XXXXXXXXX)';
        if (!form.email.trim()) e.email = 'Email required';
        else if (!form.email.includes('@')) e.email = 'Invalid email';
        if (!form.street.trim()) e.street = 'Street address required';
        if (!form.city.trim()) e.city = 'City required';
        if (!form.zipCode.trim()) e.zipCode = 'Zip code required';
        setErrors(e);
        return !Object.keys(e).length;
    }, [form]);

    const placeOrder = async () => {
        if (!validate()) { toast('Please fill all the fields', 'error'); return; }
        setLoading(true);
        try {
            const payload = {
                customer: {
                    name: form.name, email: form.email, phone: form.phone,
                    address: { street: form.street, city: form.city, zipCode: form.zipCode },
                },
                items: cart.items.map((i) => ({ product: i._id, name: i.name, sku: i.sku || '', quantity: i.qty, price: i.price, total: i.price * i.qty })),
                subtotal: cart.subtotal,
                deliveryCharge: cart.deliveryCharge,
                discount: cart.discount,
                total: Math.round(cart.total),
                paymentMethod: form.paymentMethod,
                notes: form.notes,
                couponCode: cart.coupon?.code,
            };
            const data = await apiFetch('/api/orders', { method: 'POST', body: JSON.stringify(payload) });
            setSuccess(data.data || data);
            cart.clear();
            localStorage.removeItem('bh_checkout_info');
        } catch (e) {
            toast(e.message || 'Failed to place order. Try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    /* ── Success screen ── */
    if (success) return (
        <div className="max-w-xl mx-auto text-center px-4 py-20" style={{ animation: 'popIn .5s ease' }}>
            <div className="text-7xl mb-5">{success.fraudVerdict === 'review' ? '🛡️' : '🎉'}</div>
            <h2 className="font-display text-2xl font-bold text-stone-900 mb-2">
                {success.fraudVerdict === 'review' ? 'Order Received!' : 'Order Placed!'}
            </h2>
            {success.fraudVerdict === 'review' && (
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
                <button onClick={() => setPage('track')} className="bg-stone-900 text-white px-5 py-3 rounded-xl btn-bounce text-sm font-semibold flex items-center gap-2">
                    <I d={ic.truck} size={16} stroke="white" /> Track Order
                </button>
                {/* ── Download slip widget ── */}
                <DownloadSlipButton orderData={{ ...success, items: cart.items }} />
                <button onClick={() => setPage('shop')} className="border border-stone-200 px-5 py-3 rounded-xl btn-bounce text-sm font-medium text-stone-600 hover:bg-stone-50">Continue Shopping</button>
            </div>
        </div>
    );

    /* ── Checkout form ── */
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
                            <FormField label="Full Name" k="name" value={form.name} error={errors.name} onChange={upd} placeholder="Rahim Hossain" required />
                            <FormField label="Phone Number" k="phone" value={form.phone} error={errors.phone} onChange={upd} placeholder="01XXXXXXXXX" required half />
                            <FormField label="Email Address" k="email" type="email" value={form.email} error={errors.email} onChange={upd} placeholder="email@example.com" required half />
                        </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="bg-white rounded-2xl border border-stone-100 p-6">
                        <h3 className="font-semibold text-stone-800 mb-5 flex items-center gap-2">
                            <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                            Delivery Address
                            {/* ── Delivery badge widget ── */}
                            <DeliveryBadge charge={cart.deliveryCharge} loading={deliveryLoading} city={form.city} />
                        </h3>
                        <div className="flex flex-wrap gap-4">
                            <FormField label="Street Address" k="street" value={form.street} error={errors.street} onChange={upd} placeholder="House #, Road #, Area" required />
                            <FormField label="City/District" k="city" value={form.city} error={errors.city} onChange={upd} placeholder="Select your city" required options={CITIES} />
                            <FormField label="Zip Code" k="zipCode" value={form.zipCode} error={errors.zipCode} onChange={upd} placeholder="e.g. 1200" required />
                        </div>
                    </div>

                    {/* Payment Section */}
                    <div className="bg-white rounded-3xl border border-stone-100 p-6 shadow-sm">
                        <h3 className="font-semibold text-stone-800 mb-6 flex items-center gap-2">
                            <span className="w-7 h-7 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">
                                3
                            </span>
                            Payment Method
                        </h3>

                        {/* COD */}
                        <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all
        ${form.paymentMethod === 'cash_on_delivery'
                                ? 'border-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-md'
                                : 'border-stone-200 hover:border-amber-200'}`}
                        >
                            <input
                                type="radio"
                                name="pay"
                                value="cash_on_delivery"
                                checked={form.paymentMethod === 'cash_on_delivery'}
                                onChange={(e) => upd('paymentMethod', e.target.value)}
                                className="sr-only"
                            />

                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl border shadow-sm">
                                💵
                            </div>

                            <div className="flex-1">
                                <div className="font-bold text-stone-800 text-sm">
                                    Cash on Delivery
                                </div>
                                <div className="text-xs text-stone-400 mt-0.5">
                                    Pay when your order arrives
                                </div>
                                <span className="inline-block mt-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    Available
                                </span>
                            </div>

                            <div className="w-5 h-5 rounded-full border-2 border-amber-500 flex items-center justify-center">
                                {form.paymentMethod === 'cash_on_delivery' && (
                                    <div className="w-2 h-2 bg-amber-500 rounded-full" />
                                )}
                            </div>
                        </label>

                        {/* Coming Soon */}
                        <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest mt-6 mb-3">
                            Digital Payments (Coming Soon)
                        </p>

                        <div className="grid grid-cols-3 gap-3">
                            {[
                                {
                                    l: "bKash",
                                    img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRw9NHMbueHMys-2mBENPIb28PNh3myV_Z3fw&s",
                                    bg: "bg-pink-50",
                                    border: "border-pink-100"
                                },
                                {
                                    l: "Nagad",
                                    img: "https://freelogopng.com/images/all_img/1679248787Nagad-Logo.png",
                                    bg: "bg-orange-50",
                                    border: "border-orange-100"
                                },
                                {
                                    l: "Rocket",
                                    img: "https://www.jvectors.com/upload/photos/2023/07/KmEbbj7Jrw8PVCNfS9fX_15_89bd0ac8863cc7850cf2eb5b0403f6a5_jvectors.webp?updated=1",
                                    bg: "bg-purple-50",
                                    border: "border-purple-100"
                                }
                            ].map((m) => (
                                <div
                                    key={m.l}
                                    className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border ${m.border} ${m.bg} cursor-not-allowed`}
                                >
                                    <img
                                        src={m.img}
                                        alt={m.l}
                                        className="h-8 object-contain"
                                        loading="lazy"
                                    />
                                    <span className="text-[10px] font-bold text-stone-400 bg-white/80 border px-2 py-0.5 rounded-full">
                                        Soon
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Notes */}
                        <div className="mt-6">
                            <label className="block text-xs font-semibold text-stone-500 mb-2 uppercase tracking-widest">
                                Special Instructions <span className="text-stone-300 normal-case">(optional)</span>
                            </label>

                            <textarea
                                value={form.notes}
                                onChange={(e) => upd("notes", e.target.value)}
                                rows={3}
                                placeholder="Any delivery instructions..."
                                className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-stone-50 text-sm resize-none focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
                            />
                        </div>
                    </div>
                </div>

                {/* Order summary */}
                <div className="lg:sticky lg:top-20 bg-white rounded-2xl border border-stone-100 p-5">
                    <h3 className="font-semibold text-stone-800 mb-4">Order Summary</h3>
                    <div className="max-h-60 overflow-y-auto space-y-3 mb-4">
                        {cart.items.map((item) => {
                            const imgSrc = (() => {
                                if (!item.images?.length) return null;
                                const i = item.images[0];
                                return typeof i === 'string' ? CDN(i) : CDN(i?.url);
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
                        <div className="flex justify-between text-stone-500"><span>Subtotal</span><span className="font-medium text-stone-800">{fmt(cart.subtotal)}</span></div>
                        {cart.discount > 0 && (
                            <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{fmt(cart.discount)}</span></div>
                        )}
                        <div className="flex justify-between text-stone-500">
                            <span>Delivery <span className="text-xs text-amber-600">({form.city || '—'})</span></span>
                            <span className={`font-medium ${cart.deliveryCharge === 0 ? 'text-emerald-600' : 'text-stone-800'}`}>
                                {cart.deliveryCharge === 0 ? 'Free' : fmt(cart.deliveryCharge)}
                            </span>
                        </div>
                        <div className="border-t border-stone-100 pt-3 flex justify-between font-bold text-stone-900 text-base"><span>Total</span><span>{fmt(cart.total)}</span></div>
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
