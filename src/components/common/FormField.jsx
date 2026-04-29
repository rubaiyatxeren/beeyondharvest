export const FormField = ({ label, k, type = "text", placeholder, options, required = false, half = false, value, error, onChange }) => (
    <div className={half ? "w-full sm:w-[calc(50%-8px)]" : "w-full"}>
        <label className="block text-xs font-semibold text-stone-500 mb-1.5">
            {label}{required && " *"}
        </label>
        {options ? (
            <select
                value={value || ""}
                onChange={(e) => onChange(k, e.target.value)}
                className={`w-full px-3 py-3 rounded-xl border text-sm bg-white transition-all ${error ? "border-red-300" : "border-stone-200"}`}
            >
                <option value="">Select {label}</option>
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
        ) : (
            <input
                type={type}
                value={value || ""}
                onChange={(e) => onChange(k, e.target.value)}
                placeholder={placeholder}
                className={`w-full px-3 py-3 rounded-xl border text-sm transition-all ${error ? "border-red-300 bg-red-50" : "border-stone-200 bg-stone-50"}`}
            />
        )}
        {error && <span className="text-red-500 text-xs mt-1 block">{error}</span>}
    </div>
);