import { BookOpen, TrendingUp, CheckCircle, ClipboardList, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageWrapper        from '../components/layout/PageWrapper'
import CourseCard         from '../components/course/CourseCard'
import CourseProgressCard from '../components/progress/CourseProgressCard'
import AnnouncementBanner from '../components/batch/AnnouncementBanner'
import EmptyState         from '../components/ui/EmptyState'
import {
  CourseCardSkeleton,
  CourseProgressCardSkeleton,
  StatCardSkeleton,
} from '../components/ui/Skeleton'
import { useAuth }        from '../context/AuthContext'
import { useUserCourses } from '../hooks/useCourses'
import { useBatch }       from '../hooks/useBatch'

function StatCard({ icon: Icon, label, value, accent, onClick }) {
  const map = {
    brand:   'bg-brand-600/10 border-brand-600/20 text-brand-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber:   'bg-amber-500/10 border-amber-500/20 text-amber-400',
    purple:  'bg-purple-500/10 border-purple-500/20 text-purple-400',
  }
  return (
    <div
      onClick={onClick}
      className={`card flex items-center gap-3 px-4 py-3.5 border ${map[accent]}
                  ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-transform' : ''}`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${map[accent]}`}>
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-display font-700 text-white leading-tight">{value}</p>
        <p className="text-xs text-dark-400 leading-tight">{label}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate                     = useNavigate()
  const { user, profile }            = useAuth()
  const { courses, coursesMeta, loading } = useUserCourses(user?.uid)
  const { batch, currentDay, totalDays, daysRemaining, loading: batchLoading } = useBatch(user?.uid)

  const completedCourses = courses.filter(c => (coursesMeta[c.id]?.percent ?? 0) === 100).length

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <PageWrapper>
      {/* Announcements */}
      {!batchLoading && <AnnouncementBanner batchId={batch?.id || null}/>}

      {/* Greeting */}
      <div className="mb-6">
        <p className="text-dark-500 text-sm mb-0.5">{greeting()},</p>
        <h1 className="page-title text-2xl sm:text-3xl">
          {profile?.name?.split(' ')[0] || 'Learner'} 👋
        </h1>
      </div>

      {/* Batch day banner */}
      {!batchLoading && batch && (
        <div
          onClick={() => navigate(`/course/${batch.courseId}`)}
          className="card border border-brand-600/20 p-4 sm:p-5 cursor-pointer
                     hover:border-brand-600/35 transition-all mb-6 bg-brand-600/5
                     active:scale-[0.99]"
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-600/20 flex items-center justify-center shrink-0">
                <Calendar size={16} className="text-brand-400"/>
              </div>
              <div>
                <p className="text-white font-display font-600 text-sm">{batch.name}</p>
                <p className="text-dark-400 text-xs mt-0.5">
                  {daysRemaining > 0 ? `${daysRemaining} days left` : 'Batch complete'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xl font-display font-700 text-brand-400">{currentDay}</p>
                <p className="text-xs text-dark-500">of {totalDays} days</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-dark-800 border border-dark-700
                              flex items-center justify-center shrink-0">
                <span className="text-xs font-display font-700 text-dark-300">
                  {totalDays > 0 ? Math.round((currentDay / totalDays) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 h-1.5 bg-dark-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all"
              style={{ width: `${totalDays > 0 ? Math.round((currentDay/totalDays)*100) : 0}%` }}/>
          </div>
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[0,1,2,3].map(i => <StatCardSkeleton key={i}/>)}
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard icon={BookOpen}     label="Courses"     value={courses.length}   accent="brand"/>
          <StatCard icon={TrendingUp}   label="In Progress" value={courses.length - completedCourses} accent="amber"/>
          <StatCard icon={CheckCircle}  label="Completed"   value={completedCourses} accent="emerald"/>
          <StatCard icon={ClipboardList} label="Assignments"
            value={batch ? `Day ${currentDay}` : '—'}
            accent="purple"
            onClick={() => navigate('/assignments')}
          />
        </div>
      ) : null}

      {/* My Courses */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="section-title whitespace-nowrap">My Courses</h2>
        <div className="flex-1 h-px bg-dark-800"/>
        {!loading && (
          <span className="text-xs text-dark-600 whitespace-nowrap">
            {courses.length} course{courses.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10">
          {[0,1,2].map(i => <CourseCardSkeleton key={i}/>)}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState icon={BookOpen} title="No courses assigned yet"
          description="Your administrator hasn't assigned any courses yet."/>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10">
          {courses.map(course => (
            <CourseCard key={course.id} course={course} meta={coursesMeta[course.id]}/>
          ))}
        </div>
      )}

      {/* Progress Overview */}
      {!loading && courses.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="section-title whitespace-nowrap">Progress Overview</h2>
            <div className="flex-1 h-px bg-dark-800"/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {courses.map(course => (
              <CourseProgressCard key={course.id} course={course} meta={coursesMeta[course.id]}/>
            ))}
          </div>
        </>
      )}
    </PageWrapper>
  )
}