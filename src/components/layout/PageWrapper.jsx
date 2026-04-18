import Sidebar from './Sidebar'

// Updated PageWrapper: sidebar width matches new compact 240px sidebar
// Mobile: proper top padding so hamburger button doesn't overlap content
// Overflow: hidden on outer to prevent horizontal scroll on mobile
export default function PageWrapper({ children }) {
  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <Sidebar />
      <main className="flex-1 lg:ml-60 min-h-screen w-full overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  )
}