export default function ProgressBar({
  percent   = 0,
  showLabel = true,
  size      = 'md',
  color     = 'brand',
  animated  = true,
}) {
  const heights = { sm: 'h-1', md: 'h-1.5', lg: 'h-2.5' }
  const colors  = {
    brand:   'from-brand-500 to-brand-400',
    emerald: 'from-emerald-500 to-emerald-400',
    amber:   'from-amber-500 to-amber-400',
  }

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-dark-400 font-body">Progress</span>
          <span className={`text-xs font-display font-600 ${
            percent === 100 ? 'text-emerald-400' : 'text-brand-400'
          }`}>
            {percent}%
          </span>
        </div>
      )}
      <div className={`w-full bg-dark-800 rounded-full overflow-hidden ${heights[size]} relative`}>
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colors[color]}
                      ${animated ? 'transition-all duration-700 ease-out' : ''}`}
          style={{ width: `${percent}%` }}
        />
        {/* Shimmer on 100% */}
        {percent === 100 && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        )}
      </div>
    </div>
  )
}