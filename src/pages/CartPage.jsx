import React, { useEffect, useState } from 'react';
import { I, ic } from '../components/common/Icons';
import { Spinner } from '../components/common/Spinner';
import { useCart } from '../components/providers/CartProvider';
import { useNav } from '../components/providers/NavProvider';
import { useToast } from '../components/providers/ToastProvider';
import { apiFetch } from '../utils/api';
import { API, CITIES } from '../utils/constants';
import { CDN, fmt } from '../utils/helpers';

const CartPage = () => {
    const { setPage } = useNav();
    const cart = useCart();
    const toast = useToast();
    const [couponCode, setCouponCode] = useState("");
    const [couponLoading, setCouponLoading] = useState(false);
    const [selectedCity, setSelectedCity] = useState(cart.delivery?.city || "");
    const [deliveryLoading, setDeliveryLoading] = useState(false);
    const [deliveryError, setDeliveryError] = useState("");

    useEffect(() => {
        if (!selectedCity) {
            cart.setDelivery(null);
            return;
        }

        setDeliveryLoading(true);
        setDeliveryError("");
        const params = new URLSearchParams({ city: selectedCity, subtotal: cart.subtotal });

        fetch(`${API}/api/delivery-charges/active?${params}`)
            .then(r => r.json())
            .then(d => {
                if (d.success && d.data) {
                    cart.setDelivery({ ...d.data, city: selectedCity });
                } else {
                    setDeliveryError("Delivery not available for this location");
                    cart.setDelivery(null);
                }
            })
            .catch(() => {
                setDeliveryError("Error calculating delivery");
                cart.setDelivery(null);
            })
            .finally(() => setDeliveryLoading(false));
    }, [selectedCity, cart.subtotal]);

    const applyCoupon = async () => {
        if (!couponCode.trim()) return;
        setCouponLoading(true);
        try {
            const data = await apiFetch("/api/coupons/validate", {
                method: "POST",
                body: JSON.stringify({ code: couponCode, subtotal: cart.subtotal })
            });

            const discountAmount = data.data?.discount || 0;
            const discountType = data.data?.discountType || "fixed";

            if (discountAmount > 0) {
                cart.setCoupon({ code: couponCode, type: discountType, value: discountAmount });
                toast(`Coupon applied! You save ${fmt(discountAmount)} 🎉`);
            } else {
                toast("Coupon applied but no discount applicable", "warn");
            }
        } catch (e) {
            toast(e.message || "Invalid coupon code", "error");
        } finally {
            setCouponLoading(false);
        }
    };

    const proceedToCheckout = () => {
        if (!selectedCity) {
            toast("Please select a delivery location", "error");
            return;
        }
        if (!cart.delivery) {
            toast("Please wait for delivery calculation", "error");
            return;
        }

        localStorage.setItem("bh_checkout_info", JSON.stringify({
            checkoutCity: selectedCity,
            checkoutDelivery: cart.delivery
        }));
        setPage("checkout");
    };

    if (cart.items.length === 0) return (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="text-7xl mb-5">🛒</div>
            <h2 className="font-display text-2xl font-bold text-stone-800 mb-2">Your cart is empty</h2>
            <p className="text-stone-400 text-sm mb-7">Add some delicious honey to get started!</p>
            <button onClick={() => setPage("shop")} className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-7 py-3 rounded-xl btn-bounce transition-colors shadow-lg shadow-amber-200">
                Browse Products
            </button>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mb-8">
                Shopping Cart <span className="text-stone-400 font-normal text-xl">({cart.count})</span>
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
                {/* Cart Items */}
                <div className="space-y-4">
                    {cart.items.map((item) => {
                        const imgSrc = (() => {
                            if (!item.images?.length) return null;
                            const i = item.images[0];
                            return typeof i === "string" ? CDN(i) : CDN(i?.url);
                        })();
                        return (
                            <div key={item._id} className="bg-white rounded-2xl border border-stone-100 p-4 flex gap-4 items-center" style={{ animation: "fadeIn .2s ease" }}>
                                <div className="w-20 h-20 rounded-xl overflow-hidden bg-amber-50 flex-shrink-0 flex items-center justify-center">
                                    {imgSrc ? <img src={imgSrc} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-3xl">🍯</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-stone-800 text-sm mb-0.5 line-clamp-2">{item.name}</h3>
                                    <p className="text-amber-600 text-xs font-medium mb-3">{fmt(item.price)} each</p>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden">
                                            <button onClick={() => cart.update(item._id, item.qty - 1)} className="w-8 h-8 bg-stone-50 flex items-center justify-center hover:bg-stone-100 btn-bounce text-stone-600">
                                                <I d={ic.minus} size={13} />
                                            </button>
                                            <span className="w-9 text-center text-sm font-bold text-stone-900">{item.qty}</span>
                                            <button onClick={() => cart.update(item._id, item.qty + 1)} className="w-8 h-8 bg-stone-50 flex items-center justify-center hover:bg-stone-100 btn-bounce text-stone-600">
                                                <I d={ic.plus} size={13} />
                                            </button>
                                        </div>
                                        <button onClick={() => { cart.remove(item._id); toast(`${item.name} removed`, "warn"); }}
                                            className="p-1.5 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 btn-bounce">
                                            <I d={ic.trash} size={14} stroke="#ef4444" />
                                        </button>
                                    </div>
                                </div>
                                <div className="font-bold text-stone-900 text-base flex-shrink-0">{fmt(item.price * item.qty)}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Order Summary */}
                <div className="lg:sticky lg:top-20 space-y-4">
                    {/* Delivery Location */}
                    <div className="bg-white rounded-2xl border border-stone-100 p-5">
                        <h3 className="font-semibold text-stone-800 mb-3 text-sm flex items-center gap-2">
                            <I d={ic.map} size={16} className="text-amber-600" /> Delivery Location *
                        </h3>
                        <select
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm bg-stone-50"
                            required
                        >
                            <option value="">Select your city</option>
                            {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                        </select>
                        {deliveryLoading && <div className="mt-2 text-xs text-stone-400 flex items-center gap-1"><Spinner /> Calculating delivery...</div>}
                        {deliveryError && <div className="mt-2 text-xs text-red-500">{deliveryError}</div>}
                        {cart.delivery && !deliveryLoading && !deliveryError && (
                            <div className={`mt-3 text-xs flex items-center gap-1.5 ${cart.delivery.amount === 0 ? "text-emerald-600" : "text-amber-600"}`}>
                                <I d={ic.truck} size={12} />
                                {cart.delivery.amount === 0 ? "Free Delivery" : `Delivery Fee: ${fmt(cart.delivery.amount)}`}
                            </div>
                        )}
                    </div>

                    {/* Coupon */}
                    <div className="bg-white rounded-2xl border border-stone-100 p-5">
                        <h3 className="font-semibold text-stone-800 mb-3 text-sm flex items-center gap-2">
                            <I d={ic.tag} size={16} className="text-amber-600" /> Coupon Code
                        </h3>
                        {cart.coupon ? (
                            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
                                <span className="text-emerald-600">✓</span>
                                <span className="flex-1 text-emerald-700 font-semibold text-sm">{cart.coupon.code} — Save {fmt(cart.discount)}</span>
                                <button onClick={() => cart.setCoupon(null)} className="text-emerald-400 hover:text-emerald-600 btn-bounce">
                                    <I d={ic.x} size={14} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                                    placeholder="Enter code…" className="flex-1 px-3 py-2.5 rounded-xl border border-stone-200 text-sm bg-stone-50" />
                                <button onClick={applyCoupon} disabled={couponLoading}
                                    className="bg-stone-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold btn-bounce hover:bg-stone-700 transition-colors disabled:opacity-60 flex items-center gap-1.5">
                                    {couponLoading ? <Spinner /> : "Apply"}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Total */}
                    <div className="bg-white rounded-2xl border border-stone-100 p-5">
                        <h3 className="font-semibold text-stone-800 mb-4">Order Summary</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-stone-600">
                                <span>Subtotal</span>
                                <span className="font-semibold text-stone-900">{fmt(cart.subtotal)}</span>
                            </div>
                            {cart.discount > 0 && (
                                <div className="flex justify-between text-emerald-600">
                                    <span>Discount</span>
                                    <span className="font-semibold">-{fmt(cart.discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-stone-600">
                                <span>Delivery</span>
                                <span className={`font-semibold ${cart.deliveryCharge === 0 ? "text-emerald-600" : "text-stone-900"}`}>
                                    {cart.deliveryCharge === 0 ? "Free" : fmt(cart.deliveryCharge)}
                                </span>
                            </div>
                            <div className="border-t border-stone-100 pt-3 flex justify-between font-bold text-stone-900 text-base">
                                <span>Total</span>
                                <span>{fmt(cart.total)}</span>
                            </div>
                        </div>
                        <button onClick={proceedToCheckout} disabled={!selectedCity || !cart.delivery || deliveryLoading}
                            className="mt-5 w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-900 font-bold py-3.5 rounded-xl btn-bounce shadow-lg shadow-amber-200 transition-colors flex items-center justify-center gap-2">
                            <I d={ic.check} size={18} stroke="#1a1a1a" /> Proceed to Checkout
                        </button>
                        <button onClick={() => setPage("shop")}
                            className="mt-2 w-full py-2.5 rounded-xl text-stone-500 text-sm hover:bg-stone-50 btn-bounce transition-colors">
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;