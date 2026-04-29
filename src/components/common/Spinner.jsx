export const Spinner = () => (
    <svg style={{ animation: "spin .7s linear infinite" }} className="inline-block" width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <circle cx={12} cy={12} r={10} strokeOpacity={0.25} />
        <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
);