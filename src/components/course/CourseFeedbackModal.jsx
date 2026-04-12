import { useState } from 'react'
import { Star, X, Send } from 'lucide-react'

export default function CourseFeedbackModal({ course, onSubmit, onSkip }) {
  const [rating,    setRating]    = useState(0)
  const [hovered,   setHovered]   = useState(0)
  const [comment,   setComment]   = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) return
    setSubmitting(true)
    await onSubmit({ rating, comment: comment.trim() })
    setSubmitting(false)
  }

  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-dark-950/85 backdrop-blur-sm" onClick={onSkip} />
      <div className="relative w-full max-w-md card border border-dark-700 shadow-2xl p-8
                      animate-slide-up">
        {/* Close */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-dark-800 hover:bg-dark-700
                     flex items-center justify-center text-dark-400 hover:text-white transition-all"
        >
          <X size={14} />
        </button>

        {/* Celebration */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🎓</div>
          <h2 className="text-xl font-display font-700 text-white mb-1">
            Course Complete!
          </h2>
          <p className="text-dark-400 text-sm font-body">
            You finished <span className="text-white font-600">{course?.title}</span>.
            How was it?
          </p>
        </div>

        {/* Star rating */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={36}
                  className={`transition-colors duration-150
                               ${star <= (hovered || rating)
                                 ? 'text-amber-400 fill-amber-400'
                                 : 'text-dark-700'
                               }`}
                />
              </button>
            ))}
          </div>
          <p className={`text-sm font-display font-600 transition-colors
                         ${rating > 0 ? 'text-amber-400' : 'text-dark-600'}`}>
            {labels[hovered || rating] || 'Tap a star to rate'}
          </p>
        </div>

        {/* Comment */}
        <div className="mb-6">
          <label className="label">Your feedback (optional)</label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="What did you like? What could be improved?"
            rows={3}
            className="input resize-none w-full text-sm font-body leading-relaxed"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="btn-secondary flex-1 justify-center text-sm"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className={`btn-primary flex-1 justify-center text-sm
                        ${rating === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <><Send size={14} /> Submit Feedback</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}