/**
 * DeliveryBadge.jsx
 * ─────────────────────────────────────────────────────────────
 * Delivery-related UI widgets:
 *
 *   DeliveryBadge  — small pill showing Free / charge amount
 *   DeliveryPicker — city select + live charge fetch (CartPage)
 *
 * Used in: CartPage, CheckoutPage
 * ─────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState } from 'react';
import { I, ic } from '../components/common/Icons';
import { Spinner } from '../components/common/Spinner';
import { API, CITIES } from '../utils/constants';
import { fmt } from '../utils/helpers';

/* ── DeliveryBadge ──────────────────────────────────────────── */
/**
 * Tiny pill used inline in checkout sidebar and section headers.
 *
 * @param {number}  charge          delivery fee (0 = free)
 * @param {boolean} [loading=false]
 * @param {string}  [city]          shown in brackets when provided
 */
export const DeliveryBadge = ({ charge, loading = false, city }) => {
    if (loading) return (
        <span className="ml-auto text-xs text-stone-400 flex items-center gap-1">
            <Spinner /> Calculating...
        </span>
    );

    if (charge === undefined || charge === null) return null;

    return (
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${charge === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            {city && <span className="opacity-60 mr-1">({city})</span>}
            Delivery: {charge === 0 ? 'Free' : fmt(charge)}
        </span>
    );
};

/* ── DeliveryPicker ─────────────────────────────────────────── */
/**
 * City select + async charge fetcher.
 * Calls onDelivery(deliveryData | null) when result arrives.
 *
 * @param {string}   value              controlled city value
 * @param {function} onChange(city)     parent state setter
 * @param {number}   subtotal           cart subtotal (affects free-delivery threshold)
 * @param {function} onDelivery(data)   receives { amount, city, … } or null
 */
export const DeliveryPicker = ({ value, onChange, subtotal, onDelivery }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!value) {
            onDelivery?.(null);
            return;
        }

        setLoading(true);
        setError('');
        const params = new URLSearchParams({ city: value, subtotal });

        fetch(`${API}/api/delivery-charges/active?${params}`)
            .then((r) => r.json())
            .then((d) => {
                if (d.success && d.data) {
                    onDelivery?.({ ...d.data, city: value });
                } else {
                    setError('Delivery not available for this location');
                    onDelivery?.(null);
                }
            })
            .catch(() => {
                setError('Error calculating delivery');
                onDelivery?.(null);
            })
            .finally(() => setLoading(false));
    }, [value, subtotal]);

    return (
        <div>
            <h3 className="font-semibold text-stone-800 mb-3 text-sm flex items-center gap-2">
                <I d={ic.map} size={16} className="text-amber-600" /> Delivery Location *
            </h3>

            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm bg-stone-50"
                required
            >
                <option value="">Select your city</option>
                {CITIES.map((city) => (
                    <option key={city} value={city}>{city}</option>
                ))}
            </select>

            {loading && (
                <div className="mt-2 text-xs text-stone-400 flex items-center gap-1">
                    <Spinner /> Calculating delivery...
                </div>
            )}
            {error && <div className="mt-2 text-xs text-red-500">{error}</div>}
        </div>
    );
};