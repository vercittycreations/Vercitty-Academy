export default function ProgressRing({
  percent = 0,
  size    = 56,
  stroke  = 4,
  label   = true,
}) {
  const radius      = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset      = circumference - (percent / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#6370f1" />
            <stop offset="100%" stopColor="#818af8" />
          </linearGradient>
        </defs>
      </svg>
      {label && (
        <span className="absolute text-[11px] font-display font-700 text-white">
          {percent}%
        </span>
      )}
    </div>
  )
}