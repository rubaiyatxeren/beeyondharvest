import React, { useEffect, useState } from 'react';
import { I, ic } from '../components/common/Icons';
import { Spinner } from '../components/common/Spinner';
import { apiFetch } from '../utils/api';
import { API } from '../utils/constants';
import { fmt, formatAddress } from '../utils/helpers';

const TrackPage = () => {
    const [input, setInput] = useState("");
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [phoneInput, setPhoneInput] = useState("");
    const [mobileOrders, setMobileOrders] = useState([]);
    const [mobileLoading, setMobileLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("order");
    const [refreshInterval, setRefreshInterval] = useState(null);

    const steps = ["pending", "confirmed", "processing", "shipped", "delivered"];
    const statusLabels = {
        pending: "Order Received",
        confirmed: "Order Confirmed",
        processing: "Processing",
        shipped: "Shipped",
        delivered: "Delivered",
        cancelled: "Cancelled"
    };

    const statusDetails = {
        pending: "We've received your order and are preparing it for processing.",
        confirmed: "Your order has been confirmed and is being processed.",
        processing: "Your items are being packed and prepared for shipment.",
        shipped: "Your order is on the way! Track your delivery below.",
        delivered: "Your order has been successfully delivered.",
        cancelled: "This order has been cancelled."
    };

    const statusBg = {
        pending: "bg-amber-100 text-amber-700",
        confirmed: "bg-blue-100 text-blue-700",
        processing: "bg-violet-100 text-violet-700",
        shipped: "bg-cyan-100 text-cyan-700",
        delivered: "bg-emerald-100 text-emerald-700",
        cancelled: "bg-red-100 text-red-700"
    };

    useEffect(() => {
        if (order && !["delivered", "cancelled"].includes(order.orderStatus)) {
            const interval = setInterval(() => {
                track();
            }, 30000);
            setRefreshInterval(interval);
            return () => clearInterval(interval);
        }
        return () => clearInterval(refreshInterval);
    }, [order]);

    const track = async (orderNumber = null) => {
        const num = orderNumber || input.trim().toUpperCase();
        if (!num) { setErr("Please enter your order number"); return; }
        setLoading(true); setErr("");
        try {
            const data = await apiFetch(`/api/orders/track/${encodeURIComponent(num)}`);
            setOrder(data.data || data);
        } catch (e) { setErr(e.message || "Order not found."); }
        finally { setLoading(false); }
    };

    const trackByPhone = async () => {
        if (!/^01[3-9]\d{8}$/.test(phoneInput)) { return; }
        setMobileLoading(true);
        try {
            const res = await fetch(`${API}/api/orders/phone/${encodeURIComponent(phoneInput)}`);
            const data = await res.json();
            setMobileOrders(data.data || []);
        } catch (e) { setMobileOrders([]); } finally { setMobileLoading(false); }
    };

    const handleOrderSelect = (orderData) => {
        setInput(orderData.orderNumber);
        setActiveTab("order");
        setTimeout(() => {
            track(orderData.orderNumber);
        }, 100);
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-12">
            <div className="text-center mb-8">
                <div className="text-5xl mb-3">📦</div>
                <h1 className="font-display text-3xl font-bold text-stone-900 mb-2">Track Your Order</h1>
                <p className="text-stone-500">Real-time order status and tracking</p>
            </div>

            <div className="flex rounded-xl border border-stone-200 overflow-hidden mb-6 bg-white">
                <button onClick={() => setActiveTab("order")}
                    className={`flex-1 py-2.5 text-sm font-semibold transition-all ${activeTab === "order" ? "bg-amber-500 text-stone-900" : "text-stone-500 hover:bg-stone-50"}`}>
                    By Order Number
                </button>
                <button onClick={() => setActiveTab("mobile")}
                    className={`flex-1 py-2.5 text-sm font-semibold transition-all ${activeTab === "mobile" ? "bg-amber-500 text-stone-900" : "text-stone-500 hover:bg-stone-50"}`}>
                    By Mobile Number
                </button>
            </div>

            {activeTab === "order" && (
                <>
                    <div className="bg-white rounded-2xl border border-stone-100 p-6 mb-6 shadow-sm">
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <input value={input} onChange={(e) => setInput(e.target.value.toUpperCase())}
                                    onKeyDown={(e) => e.key === "Enter" && track()}
                                    placeholder="e.g. ORD-202501-00001"
                                    className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-stone-200 bg-stone-50 text-sm font-medium" />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2"><I d={ic.box} size={17} className="text-stone-400" /></div>
                            </div>
                            <button onClick={() => track()} disabled={loading}
                                className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-5 rounded-xl btn-bounce shadow-md shadow-amber-200 transition-colors flex items-center gap-2 text-sm disabled:opacity-60">
                                {loading ? <Spinner /> : <I d={ic.search} size={16} stroke="#1a1a1a" />}{loading ? "…" : "Track"}
                            </button>
                        </div>
                        {err && <p className="text-red-500 text-sm mt-3">{err}</p>}
                    </div>

                    {order && (
                        <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm" style={{ animation: "fadeIn .3s ease" }}>
                            {!["delivered", "cancelled"].includes(order.orderStatus) && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-center gap-3">
                                    <I d={ic.refresh} size={16} className="text-blue-600 animate-spin" />
                                    <div className="text-blue-700 text-xs">
                                        <span className="font-semibold">Live Tracking:</span> This page updates automatically every 30 seconds
                                    </div>
                                </div>
                            )}

                            {order.fraudVerdict === "review" && (
                                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 mb-4 flex items-center gap-3">
                                    <I d={ic.shield} size={16} stroke="#6366F1" />
                                    <div><div className="text-indigo-700 font-semibold text-xs">Under Security Review</div>
                                        <div className="text-indigo-600 text-xs">We'll confirm your order within 24 hours.</div></div>
                                </div>
                            )}

                            {order.fraudVerdict === "blocked" && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-3">
                                    <I d={ic.shield} size={16} stroke="#ef4444" />
                                    <div><div className="text-red-700 font-semibold text-xs">Order Cancelled — Security Check Failed</div>
                                        <div className="text-red-600 text-xs">Contact support: 01700-000000</div></div>
                                </div>
                            )}

                            <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
                                <div>
                                    <p className="text-xs text-stone-400 mb-0.5">Order Number</p>
                                    <p className="font-bold text-lg text-stone-900">{order.orderNumber}</p>
                                    <p className="text-xs text-stone-400 mt-1">
                                        Placed on {new Date(order.createdAt).toLocaleDateString("en-BD", {
                                            year: "numeric", month: "long", day: "numeric", hour: '2-digit', minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize ${statusBg[order.orderStatus] || "bg-stone-100 text-stone-700"}`}>
                                        {statusLabels[order.orderStatus] || order.orderStatus}
                                    </span>
                                    <p className="text-xs text-stone-400 mt-1">{statusDetails[order.orderStatus]}</p>
                                </div>
                            </div>

                            {order.orderStatus !== "cancelled" && (
                                <div className="mb-7">
                                    <div className="flex justify-between relative">
                                        <div className="absolute top-4 left-[5%] right-[5%] h-0.5 bg-stone-100 z-0" />
                                        {steps.map((s, i) => {
                                            const currentIdx = steps.indexOf(order.orderStatus || "pending");
                                            const done = currentIdx >= i;
                                            const active = currentIdx === i;
                                            return (
                                                <div key={s} className="flex-1 text-center relative z-10">
                                                    <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-xs font-bold transition-all ${done ? "bg-amber-500 text-white shadow-md shadow-amber-200" :
                                                        active ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-400"
                                                        }`}>
                                                        {done ? <I d={ic.check} size={14} stroke="white" /> : i + 1}
                                                    </div>
                                                    <div className={`text-[10px] mt-1.5 font-medium capitalize ${done || active ? "text-stone-700" : "text-stone-400"}`}>
                                                        {statusLabels[s]}
                                                    </div>
                                                    {active && order.estimatedDelivery && (
                                                        <div className="text-[9px] text-amber-600 mt-1">Est: {new Date(order.estimatedDelivery).toLocaleDateString()}</div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {order.trackingNumber && (
                                <div className="bg-stone-50 rounded-xl p-4 mb-5">
                                    <div className="flex items-center gap-3 mb-2">
                                        <I d={ic.truck} size={16} className="text-amber-600" />
                                        <div>
                                            <div className="font-semibold text-stone-800 text-sm">Tracking Number</div>
                                            <div className="text-stone-600 text-sm font-mono">{order.trackingNumber}</div>
                                        </div>
                                    </div>
                                    {order.deliveryPartner && <div className="text-xs text-stone-500">Delivery Partner: {order.deliveryPartner}</div>}
                                    {order.deliveryDate && <div className="text-xs text-stone-500 mt-1">Expected Delivery: {new Date(order.deliveryDate).toLocaleDateString()}</div>}
                                </div>
                            )}

                            {/* Customer Info - Fix address overflow */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                                <div className="bg-stone-50 rounded-xl p-4">
                                    <p className="text-xs text-stone-400 mb-1">Customer</p>
                                    <p className="font-semibold text-stone-800 text-sm break-words">{order.customer?.name}</p>
                                    <p className="text-stone-500 text-xs break-words">{order.customer?.phone}</p>
                                    {order.customer?.email && (
                                        <p className="text-stone-500 text-xs break-words overflow-wrap break-word">{order.customer.email}</p>
                                    )}
                                </div>

                                <div className="bg-stone-50 rounded-xl p-4">
                                    <p className="text-xs text-stone-400 mb-1">Delivery Address</p>
                                    <p className="text-stone-600 text-xs leading-relaxed break-words whitespace-normal">
                                        {formatAddress(order.customer?.address)}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-stone-50 rounded-xl p-4 mb-5">
                                <p className="text-xs text-stone-400 mb-1">Payment Information</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-stone-600 capitalize">{order.paymentMethod?.replace(/_/g, ' ')}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                        order.paymentStatus === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {order.paymentStatus}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-stone-100 pt-4">
                                <p className="font-semibold text-stone-800 mb-3 text-sm">Items Ordered</p>
                                {order.items?.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm mb-3 pb-2 border-b border-stone-50 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">🍯</div>
                                            <div>
                                                <div className="font-semibold text-stone-800 text-sm">{item.name}</div>
                                                <div className="text-stone-400 text-xs">Qty: {item.quantity} × {fmt(item.price)}</div>
                                            </div>
                                        </div>
                                        <span className="font-semibold text-stone-800">{fmt(item.total)}</span>
                                    </div>
                                ))}
                                {order.discount > 0 && (
                                    <div className="flex justify-between text-sm text-emerald-600 mb-2 pt-2">
                                        <span>Coupon Discount</span>
                                        <span>-{fmt(order.discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm text-stone-500 mb-2"><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
                                <div className="flex justify-between text-sm text-stone-500 mb-2"><span>Delivery Charge</span><span>{fmt(order.deliveryCharge)}</span></div>
                                <div className="border-t border-stone-100 mt-3 pt-3 flex justify-between font-bold text-stone-900 text-base">
                                    <span>Total</span><span>{fmt(order.total)}</span>
                                </div>
                            </div>

                            <div className="mt-5 bg-amber-50 rounded-xl p-4 text-center">
                                <p className="text-xs text-amber-700">Need help? Contact support at <strong>01700-000000</strong> or email <strong>support@beeharvest.com</strong></p>
                            </div>
                        </div>
                    )}
                </>
            )}

            {activeTab === "mobile" && (
                <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm">
                    <h3 className="font-semibold text-stone-800 mb-4 text-sm">Find orders by mobile number</h3>
                    <div className="flex gap-3 mb-4">
                        <input value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && trackByPhone()}
                            placeholder="01XXXXXXXXX" className="flex-1 px-3 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm" />
                        <button onClick={trackByPhone} disabled={mobileLoading}
                            className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-5 rounded-xl btn-bounce text-sm disabled:opacity-60 flex items-center gap-2">
                            {mobileLoading ? <Spinner /> : <I d={ic.search} size={16} stroke="#1a1a1a" />} {mobileLoading ? "…" : "Search"}
                        </button>
                    </div>
                    {mobileOrders.length === 0 && !mobileLoading && (
                        <p className="text-stone-400 text-sm text-center py-6">Enter your mobile number to see all orders</p>
                    )}
                    {mobileOrders.map((o) => (
                        <div key={o._id} className="border border-stone-100 rounded-xl p-4 mb-3 cursor-pointer hover:border-amber-200 transition-colors" onClick={() => handleOrderSelect(o)}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-stone-800 text-sm font-mono">{o.orderNumber}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${statusBg[o.orderStatus] || "bg-stone-100 text-stone-700"}`}>
                                    {(o.orderStatus || "").replace(/_/g, " ")}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-stone-400">
                                <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                                <span className="font-semibold text-stone-700">{fmt(o.total)}</span>
                            </div>
                            {o.fraudVerdict === "review" && (
                                <div className="mt-2 text-xs text-indigo-600 flex items-center gap-1">
                                    <I d={ic.shield} size={11} stroke="#6366F1" /> Under review
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TrackPage;