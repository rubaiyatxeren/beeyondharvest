import React from 'react';
import { useAPI } from '../../hooks/useAPI';
import { fmt } from '../../utils/helpers';
import { I, ic } from '../common/Icons';
import { Spinner } from '../common/Spinner';

export const DeliveryChargesModal = ({ onClose }) => {
    const { data: raw } = useAPI("/api/delivery-charges");
    const charges = raw?.data || raw || [];
    const activeCharges = Array.isArray(charges) ? charges.filter(c => c.isActive) : [];

    const zoneInfo = {
        inside_dhaka: { label: "Inside Dhaka", icon: "🏙️", color: "bg-blue-50 border-blue-200", textColor: "text-blue-700" },
        outside_dhaka: { label: "Outside Dhaka", icon: "🌿", color: "bg-violet-50 border-violet-200", textColor: "text-violet-700" },
        default: { label: "Special Offer", icon: "🎁", color: "bg-amber-50 border-amber-200", textColor: "text-amber-700" },
    };

    return (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/50" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden" style={{ animation: "popIn .3s ease" }}>
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-5 flex items-center justify-between">
                    <div className="flex items-center gap-2"><I d={ic.truck} size={20} stroke="white" /><span className="text-white font-semibold">Delivery Charges</span></div>
                    <button onClick={onClose} className="text-white/70 hover:text-white btn-bounce"><I d={ic.x} size={18} /></button>
                </div>
                <div className="p-5 space-y-3">
                    {activeCharges.length === 0 ? (
                        <div className="text-center py-6"><Spinner /><p className="text-stone-400 text-sm mt-2">Loading…</p></div>
                    ) : (
                        activeCharges.map((c, i) => {
                            const info = zoneInfo[c.name] || { label: c.name, icon: "🚚", color: "bg-stone-50 border-stone-200", textColor: "text-stone-700" };
                            return (
                                <div key={i} className={`border rounded-xl p-4 flex items-center justify-between ${info.color}`}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{info.icon}</span>
                                        <div>
                                            <div className={`font-semibold text-sm ${info.textColor}`}>{info.label}</div>
                                            {c.minOrderAmount > 0 && <div className="text-xs text-stone-400">Min order: {fmt(c.minOrderAmount)}</div>}
                                        </div>
                                    </div>
                                    <div className={`text-xl font-bold ${info.textColor}`}>{fmt(c.amount)}</div>
                                </div>
                            );
                        })
                    )}
                    <div className="bg-stone-50 rounded-xl p-3 text-xs text-stone-500 leading-relaxed">
                        💡 Delivery charge is automatically calculated based on your location at checkout.
                    </div>
                    <button onClick={onClose} className="w-full bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold py-3 rounded-xl btn-bounce transition-colors text-sm">Got it!</button>
                </div>
            </div>
        </div>
    );
};