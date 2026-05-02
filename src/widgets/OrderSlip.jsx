/**
 * OrderSlip.jsx
 * ─────────────────────────────────────────────────────────────
 * Canvas-based downloadable PNG order slip generator.
 *
 * Used in: CheckoutPage (success screen)
 *
 * Exports:
 *   downloadOrderSlip(orderData)  — imperative function, no UI
 *   DownloadSlipButton            — ready-to-use button component
 *
 * orderData shape:
 *   orderNumber    {string}
 *   customer       { name, phone, address: { street, city } }
 *   items          [{ name, price, quantity|qty }]
 *   subtotal       {number}
 *   discount       {number}
 *   deliveryCharge {number}
 *   total          {number}
 * ─────────────────────────────────────────────────────────────
 */

import React from 'react';
import { I, ic } from '../components/common/Icons';

/* ── Core canvas renderer ── */
export const downloadOrderSlip = (orderData) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 950;

    /* Background */
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    /* Header band */
    ctx.fillStyle = '#0D1B3E';
    ctx.fillRect(0, 0, canvas.width, 110);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('🍯 BeeHarvest', 40, 50);
    ctx.font = '13px sans-serif';
    ctx.fillText("Bangladesh's Trusted Honey Shop", 40, 78);

    let y = 145;

    /* Order number */
    ctx.fillStyle = '#F5A623';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`Order: ${orderData.orderNumber || '—'}`, 40, y);
    y += 35;
    ctx.fillStyle = '#666';
    ctx.font = '13px sans-serif';
    ctx.fillText(`Date: ${new Date().toLocaleDateString('en-BD')}`, 40, y);
    y += 30;

    /* Divider */
    const rule = (yPos) => {
        ctx.strokeStyle = '#eee';
        ctx.beginPath();
        ctx.moveTo(40, yPos);
        ctx.lineTo(760, yPos);
        ctx.stroke();
    };

    rule(y); y += 25;

    /* Customer info */
    ctx.fillStyle = '#0D1B3E';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Customer Info', 40, y); y += 25;
    ctx.fillStyle = '#333';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Name: ${orderData.customer?.name || '—'}`, 40, y); y += 22;
    ctx.fillText(`Phone: ${orderData.customer?.phone || '—'}`, 40, y); y += 22;
    ctx.fillText(
        `Address: ${orderData.customer?.address?.street || ''}, ${orderData.customer?.address?.city || ''}`,
        40, y
    ); y += 30;

    rule(y); y += 25;

    /* Items header */
    ctx.fillStyle = '#0D1B3E';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Items', 40, y); y += 25;

    ctx.fillStyle = '#1A2E5A';
    ctx.fillRect(40, y, 720, 34);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('Product', 55, y + 22);
    ctx.fillText('Qty', 460, y + 22);
    ctx.fillText('Price', 540, y + 22);
    ctx.fillText('Total', 650, y + 22);
    y += 44;

    /* Items rows */
    const items = orderData.items || orderData.orderItems || [];
    ctx.font = '13px sans-serif';
    items.forEach((item, idx) => {
        if (idx % 2 === 0) {
            ctx.fillStyle = '#f9f9f9';
            ctx.fillRect(40, y - 8, 720, 34);
        }
        ctx.fillStyle = '#333';
        let name = item.name || 'Product';
        if (name.length > 40) name = name.slice(0, 37) + '...';
        const qty = item.quantity || item.qty || 1;
        ctx.fillText(name, 55, y + 14);
        ctx.fillText(`x${qty}`, 460, y + 14);
        ctx.fillText(`${(item.price || 0).toLocaleString()} BDT`, 540, y + 14);
        ctx.fillText(`${((item.price || 0) * qty).toLocaleString()} BDT`, 640, y + 14);
        y += 34;
    });

    y += 20;
    rule(y); y += 25;

    /* Totals */
    ctx.fillStyle = '#333';
    ctx.font = '14px sans-serif';
    ctx.fillText('Subtotal:', 100, y);
    ctx.fillText(`${Math.round(orderData.subtotal || 0).toLocaleString()} BDT`, 640, y);
    y += 22;

    if (orderData.discount > 0) {
        ctx.fillText('Discount:', 100, y);
        ctx.fillText(`-${Math.round(orderData.discount || 0).toLocaleString()} BDT`, 640, y);
        y += 22;
    }

    ctx.fillText('Delivery:', 100, y);
    ctx.fillText(`${Math.round(orderData.deliveryCharge || 0).toLocaleString()} BDT`, 640, y);
    y += 22;

    ctx.fillStyle = '#0D1B3E';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Total:', 100, y);
    ctx.fillText(`${Math.round(orderData.total || 0).toLocaleString()} BDT`, 640, y);
    y += 50;

    /* Footer */
    ctx.fillStyle = '#666';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Thank you for shopping with BeeHarvest!', 400, y); y += 22;
    ctx.fillText('Support: 01700-000000 | info@beeharvest.com', 400, y);

    /* Download */
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `beeharvest_order_${orderData.orderNumber || 'slip'}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
};

/* ── Convenience button component ── */
export const DownloadSlipButton = ({ orderData, className = '' }) => (
    <button
        onClick={() => downloadOrderSlip(orderData)}
        className={`border border-stone-200 px-5 py-3 rounded-xl btn-bounce text-sm font-medium text-stone-600 hover:bg-stone-50 flex items-center gap-2 ${className}`}
    >
        <I d={ic.download} size={15} /> Download Slip
    </button>
);