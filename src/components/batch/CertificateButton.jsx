import { useState } from 'react'
import { Award, Lock, Download, Clock } from 'lucide-react'

// jsPDF loaded from CDN via script tag in index.html
// or dynamically here
async function loadJsPDF() {
  if (window.jspdf) return window.jspdf.jsPDF
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src   = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    s.onload  = () => resolve(window.jspdf.jsPDF)
    s.onerror = reject
    document.head.appendChild(s)
  })
}

function generateCertificate({ studentName, courseName, batchName }) {
  return loadJsPDF().then(JsPDF => {
    const doc = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const W = 297, H = 210

    // Background
    doc.setFillColor(10, 10, 15)
    doc.rect(0, 0, W, H, 'F')

    // Outer border
    doc.setDrawColor(99, 112, 241)
    doc.setLineWidth(1.5)
    doc.rect(8, 8, W - 16, H - 16)

    // Inner border (thin)
    doc.setDrawColor(99, 112, 241, 0.3)
    doc.setLineWidth(0.3)
    doc.rect(12, 12, W - 24, H - 24)

    // Header accent bar
    doc.setFillColor(99, 112, 241)
    doc.rect(8, 8, W - 16, 2, 'F')

    // EduCrek Academy header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(160, 165, 248)
    doc.text('EDUCREK ACADEMY', W / 2, 32, { align: 'center' })

    // Divider line
    doc.setDrawColor(99, 112, 241)
    doc.setLineWidth(0.5)
    doc.line(W / 2 - 50, 36, W / 2 + 50, 36)

    // Certificate of Completion
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 140)
    doc.text('CERTIFICATE OF COMPLETION', W / 2, 44, { align: 'center' })

    // "This is to certify"
    doc.setFontSize(12)
    doc.setTextColor(200, 200, 220)
    doc.text('This is to certify that', W / 2, 60, { align: 'center' })

    // Student name
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(32)
    doc.setTextColor(255, 255, 255)
    const name = studentName || 'Student'
    doc.text(name, W / 2, 82, { align: 'center' })

    // Underline for name
    const nameW = doc.getStringUnitWidth(name) * 32 * 0.352778
    doc.setDrawColor(99, 112, 241)
    doc.setLineWidth(0.8)
    doc.line(W / 2 - nameW / 2, 86, W / 2 + nameW / 2, 86)

    // "has successfully completed"
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(200, 200, 220)
    doc.text('has successfully completed the', W / 2, 98, { align: 'center' })

    // Course name
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(160, 165, 248)
    const cName = courseName || 'Web Development with AI Internship Program'
    doc.text(cName, W / 2, 112, { align: 'center' })

    // Batch name
    if (batchName) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(120, 120, 140)
      doc.text(batchName, W / 2, 122, { align: 'center' })
    }

    // 30-day program mention
    doc.setFontSize(10)
    doc.setTextColor(140, 140, 160)
    doc.text('30-Day Structured Internship Program', W / 2, 132, { align: 'center' })

    // Date
    const today = new Date().toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 120)
    doc.text(`Issued on: ${today}`, W / 2, 145, { align: 'center' })

    // Bottom decorative line
    doc.setDrawColor(99, 112, 241)
    doc.setLineWidth(0.5)
    doc.line(30, 165, W - 30, 165)

    // Footer text
    doc.setFontSize(8)
    doc.setTextColor(80, 80, 100)
    doc.text('EduCrek Creations  •  educrek.com', W / 2, 172, { align: 'center' })

    // Save
    const safeName = (studentName || 'certificate').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    doc.save(`${safeName}_educrek_certificate.pdf`)
  })
}

export default function CertificateButton({
  status,          // 'no-batch' | 'locked' | 'available' | 'expired'
  currentDay = 0,
  studentName = '',
  courseName  = '',
  batchName   = '',
}) {
  const [generating, setGenerating] = useState(false)

  const handleDownload = async () => {
    setGenerating(true)
    try {
      await generateCertificate({ studentName, courseName, batchName })
    } catch (err) {
      console.error('Certificate generation failed:', err)
    } finally {
      setGenerating(false)
    }
  }

  if (status === 'no-batch') return null

  if (status === 'locked') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-800 border border-dark-700">
        <Lock size={16} className="text-dark-600 shrink-0" />
        <div>
          <p className="text-sm font-display font-600 text-dark-400">Certificate — Day 30</p>
          <p className="text-xs text-dark-600 mt-0.5">
            {30 - currentDay} more day{30 - currentDay !== 1 ? 's' : ''} remaining
          </p>
        </div>
      </div>
    )
  }

  if (status === 'expired') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-600/8 border border-red-600/15">
        <Clock size={16} className="text-red-400 shrink-0" />
        <div>
          <p className="text-sm font-display font-600 text-red-400">Certificate Expired</p>
          <p className="text-xs text-red-500/70 mt-0.5">Available window (45 days) has passed.</p>
        </div>
      </div>
    )
  }

  // status === 'available'
  return (
    <button
      onClick={handleDownload}
      disabled={generating}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
                  ${generating
                    ? 'bg-brand-600/10 border-brand-600/20 cursor-wait'
                    : 'bg-brand-600/15 border-brand-600/30 hover:bg-brand-600/25 hover:border-brand-600/50'
                  }`}
    >
      <div className="w-9 h-9 rounded-lg bg-brand-600/20 flex items-center justify-center shrink-0">
        {generating
          ? <span className="w-4 h-4 border-2 border-brand-400/30 border-t-brand-400 rounded-full animate-spin"/>
          : <Award size={18} className="text-brand-400"/>
        }
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-display font-600 text-brand-300">
          {generating ? 'Generating...' : 'Download Certificate'}
        </p>
        <p className="text-xs text-brand-500 mt-0.5">PDF • EduCrek Academy</p>
      </div>
      {!generating && <Download size={15} className="text-brand-400 shrink-0"/>}
    </button>
  )
}