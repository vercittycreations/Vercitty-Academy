export function SkeletonBox({ className = '' }) {
  return (
    <div className={`relative overflow-hidden bg-dark-800 rounded-lg ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-dark-700/60 to-transparent animate-shimmer" />
    </div>
  )
}

export function CourseCardSkeleton() {
  return (
    <div className="card overflow-hidden flex flex-col">
      <SkeletonBox className="w-full aspect-video rounded-none" />
      <div className="p-5 space-y-3">
        <SkeletonBox className="h-4 w-3/4" />
        <SkeletonBox className="h-3 w-full" />
        <SkeletonBox className="h-3 w-2/3" />
        <div className="pt-2">
          <SkeletonBox className="h-1.5 w-full rounded-full" />
        </div>
        <SkeletonBox className="h-9 w-full mt-2" />
      </div>
    </div>
  )
}

export function LessonItemSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5">
      <SkeletonBox className="w-[18px] h-[18px] rounded-full shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2">
        <SkeletonBox className="h-3.5 w-3/4" />
        <SkeletonBox className="h-3 w-1/2" />
      </div>
    </div>
  )
}

export function CourseProgressCardSkeleton() {
  return (
    <div className="card border border-dark-800 p-5">
      <div className="flex items-start gap-4">
        <SkeletonBox className="w-16 h-16 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBox className="h-4 w-2/3" />
          <SkeletonBox className="h-3 w-1/3" />
          <SkeletonBox className="h-1.5 w-full rounded-full mt-3" />
        </div>
        <SkeletonBox className="w-12 h-12 rounded-full shrink-0" />
      </div>
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="card border p-6 flex flex-col gap-4">
      <SkeletonBox className="w-11 h-11 rounded-xl" />
      <div className="space-y-2">
        <SkeletonBox className="h-8 w-16" />
        <SkeletonBox className="h-3 w-24" />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ cols = 4 }) {
  return (
    <tr className="border-b border-dark-800/50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <SkeletonBox className="h-4 w-full max-w-[140px]" />
        </td>
      ))}
    </tr>
  )
}