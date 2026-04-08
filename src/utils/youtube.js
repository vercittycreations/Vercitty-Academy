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
  return url
}

export function getEmbedUrl(url) {
  const id = extractYouTubeId(url)
  if (!id) return null
  // disabledownload=1 hides download button on embed
  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&controls=1&disablekb=0&fs=1&iv_load_policy=3&disabledownload=1`
}