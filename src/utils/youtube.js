export function extractYouTubeId(url) {
  if (!url) return null
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return url // assume it's already an ID
}

export function getEmbedUrl(url) {
  const id = extractYouTubeId(url)
  return id
    ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&controls=1`
    : null
}