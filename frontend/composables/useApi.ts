function getApiBase(): string {
  if (typeof window !== 'undefined' && (window as any).__LOCALPLAY__) {
    return (window as any).__LOCALPLAY__.getApiBase()
  }
  return useRuntimeConfig().public.apiBase
}

export function useApi() {
  const base = getApiBase()

  async function getLibrary() {
    const res = await fetch(`${base}/api/library`)
    if (!res.ok) throw new Error('Falha ao carregar biblioteca')
    return res.json()
  }

  async function getProgress(videoId: string) {
    const res = await fetch(`${base}/api/progress/${encodeVideoId(videoId)}`)
    if (!res.ok) return { current_time: 0, duration: 0, completed: false }
    return res.json()
  }

  async function getAllProgress(): Promise<Record<string, any>> {
    const res = await fetch(`${base}/api/progress`)
    if (!res.ok) return {}
    const list: any[] = await res.json()
    return Object.fromEntries(list.map(p => [p.video_id, p]))
  }

  async function saveProgress(videoId: string, currentTime: number, duration: number, completed: boolean) {
    await fetch(`${base}/api/progress/${encodeVideoId(videoId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_time: currentTime, duration, completed }),
    })
  }

  async function uploadCover(cursoNome: string, file: File) {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${base}/api/cover/${encodeURIComponent(cursoNome)}`, {
      method: 'POST',
      body: form,
    })
    if (!res.ok) throw new Error('Falha no upload da capa')
    return res.json()
  }

  function videoUrl(videoId: string) {
    return `${base}/api/video/${encodeVideoId(videoId)}`
  }

  return { getLibrary, getProgress, getAllProgress, saveProgress, uploadCover, videoUrl }
}

function encodeVideoId(id: string) {
  return id.split('/').map(encodeURIComponent).join('/')
}
