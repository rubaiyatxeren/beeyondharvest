import { API } from './constants';

export const fmt = (n) => {
  const num = Number(n || 0);
  const rounded = Math.round(num);
  return "৳" + rounded.toLocaleString("en-BD");
};

export const CDN = (image) => {
  if (!image) return null;
  if (typeof image === "object" && image.url) {
    const u = image.url;
    if (!u?.trim()) return null;
    return u.startsWith("http") ? u : `${API}${u}`;
  }
  if (typeof image === "string") {
    if (!image.trim()) return null;
    return image.startsWith("http") ? image : `${API}${image}`;
  }
  return null;
};

export const formatAddress = (address) => {
    if (!address) return "No address provided";
    
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.area) parts.push(address.area);
    if (address.city) parts.push(address.city);
    if (address.district) parts.push(address.district);
    if (address.division) parts.push(address.division);
    if (address.postalCode) parts.push(address.postalCode);
    
    return parts.join(', ');
  };