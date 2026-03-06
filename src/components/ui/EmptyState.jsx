export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-dark-800 border border-dark-700 flex items-center justify-center mb-5">
        <Icon size={28} className="text-dark-500" />
      </div>
      <h3 className="text-lg font-display font-600 text-white mb-2">{title}</h3>
      <p className="text-dark-400 text-sm max-w-xs">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}