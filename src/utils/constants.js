export const API = "https://beeyond-harvest-admin.onrender.com";

export const CITIES = [
  "Dhaka", "Chittagong", "Rajshahi", "Sylhet", "Khulna",
  "Barishal", "Rangpur", "Mymensingh", "Comilla", "Narayanganj",
  "Gazipur", "Cox's Bazar", "Jessore", "Bogra", "Dinajpur"
];

export const STATUS_LABELS = {
  open: { label: "Open", cls: "bg-blue-100 text-blue-700" },
  under_review: { label: "Under Review", cls: "bg-violet-100 text-violet-700" },
  on_hold: { label: "On Hold", cls: "bg-amber-100 text-amber-700" },
  escalated: { label: "Escalated", cls: "bg-orange-100 text-orange-700" },
  resolved: { label: "Resolved ✅", cls: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rejected", cls: "bg-stone-100 text-stone-600" },
  closed: { label: "Closed 🔒", cls: "bg-stone-100 text-stone-500" },
};

export const COMPLAINT_CATEGORIES = [
  { key: "wrong_product", icon: "📦", label: "Wrong Product" },
  { key: "damaged_product", icon: "💔", label: "Damaged Product" },
  { key: "missing_item", icon: "🔍", label: "Missing Item" },
  { key: "delivery_issue", icon: "🚚", label: "Delivery Issue" },
  { key: "payment_issue", icon: "💳", label: "Payment Issue" },
  { key: "refund_request", icon: "💰", label: "Refund Request" },
  { key: "quality_issue", icon: "⚠️", label: "Quality Issue" },
  { key: "late_delivery", icon: "⏰", label: "Late Delivery" },
  { key: "rude_behavior", icon: "😤", label: "Rude Behavior" },
  { key: "other", icon: "📝", label: "Other" },
];