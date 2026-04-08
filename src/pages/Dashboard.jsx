import { BookOpen, TrendingUp, CheckCircle } from 'lucide-react'
import PageWrapper        from '../components/layout/PageWrapper'
import CourseCard         from '../components/course/CourseCard'
import CourseProgressCard from '../components/progress/CourseProgressCard'
import EmptyState         from '../components/ui/EmptyState'
import {
  CourseCardSkeleton,
  CourseProgressCardSkeleton,
  StatCardSkeleton,
} from '../components/ui/Skeleton'
import { useAuth }        from '../context/AuthContext'
import { useUserCourses } from '../hooks/useCourses'

function StatCard({ icon: Icon, label, value, accent }) {
  const map = {
    brand:   'bg-brand-600/10 border-brand-600/20 text-brand-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber:   'bg-amber-500/10 border-amber-500/20 text-amber-400',
  }
  return (
    <div className={`card flex items-center gap-4 px-5 py-4 border ${map[accent]}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${map[accent]}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-2xl font-display font-800 text-white">{value}</p>
        <p className="text-xs text-dark-400">{label}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user, profile }    = useAuth()
  const { courses, loading } = useUserCourses(user?.uid)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <PageWrapper>
      <div className="mb-8">
        <p className="text-dark-500 text-sm font-body mb-1">{greeting()},</p>
        <h1 className="page-title text-3xl">
          {profile?.name?.split(' ')[0] || 'Learner'} 👋
        </h1>
        <p className="text-dark-400 text-sm mt-1.5">
          Track your progress and continue learning.
        </p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[0,1,2].map(i => <StatCardSkeleton key={i} />)}
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatCard icon={BookOpen}    label="Assigned Courses" value={courses.length} accent="brand"   />
          <StatCard icon={TrendingUp}  label="In Progress"      value={courses.length} accent="amber"   />
          <StatCard icon={CheckCircle} label="Completed"        value="—"             accent="emerald" />
        </div>
      ) : null}

      {/* Course grid */}
      <div className="flex items-center gap-4 mb-6">
        <h2 className="section-title whitespace-nowrap">My Courses</h2>
        <div className="flex-1 h-px bg-dark-800" />
        {!loading && (
          <span className="text-xs text-dark-600 font-body whitespace-nowrap">
            {courses.length} course{courses.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[0,1,2].map(i => <CourseCardSkeleton key={i} />)}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses assigned yet"
          description="Your administrator hasn't assigned any courses yet. Check back soon."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {courses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}

      {/* Progress overview */}
      {!loading && courses.length > 0 && (
        <>
          <div className="flex items-center gap-4 mb-6">
            <h2 className="section-title whitespace-nowrap">Progress Overview</h2>
            <div className="flex-1 h-px bg-dark-800" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {courses.map(course => (
              <CourseProgressCard key={course.id} course={course} />
            ))}
          </div>
        </>
      )}
    </PageWrapper>
  )
}