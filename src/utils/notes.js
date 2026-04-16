export function downloadNotes(text, lessonTitle) {
  if (!text?.trim()) return

  const content = [
    `Lesson Notes — ${lessonTitle}`,
    `Downloaded: ${new Date().toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })}`,
    '',
    '─'.repeat(50),
    '',
    text.trim(),
    '',
    '─'.repeat(50),
    'EduCrek Academy',
  ].join('\n')

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `Notes — ${lessonTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}