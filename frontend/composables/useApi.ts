export function useApi() {
  const base = (typeof window !== "undefined" && (window as any).localplay?.apiBase)
    || useRuntimeConfig().public.apiBase

  async function getLibrary() {
    const res = await fetch(`${base}/api/library`, { cache: "no-store" })
    if (!res.ok) throw new Error("Falha ao carregar biblioteca")
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
    return Object.fromEntries(list.map((p) => [p.video_id, p]))
  }

  async function saveProgress(videoId: string, currentTime: number, duration: number, completed: boolean) {
    await fetch(`${base}/api/progress/${encodeVideoId(videoId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_time: currentTime, duration, completed }),
    })
  }

  async function uploadCover(cursoNome: string, file: File) {
    const form = new FormData()
    form.append("file", file)
    const res = await fetch(`${base}/api/cover/${encodeURIComponent(cursoNome)}`, {
      method: "POST",
      body: form,
    })
    if (!res.ok) throw new Error("Falha no upload da capa")
    return res.json()
  }

  function videoUrl(videoId: string) {
    return `${base}/api/video/${encodeVideoId(videoId)}`
  }

  async function getSettings() {
    const res = await fetch(`${base}/api/settings`)
    if (!res.ok) throw new Error("Falha ao carregar configurações")
    return res.json()
  }

  async function addLibraryPath(path: string, name?: string) {
    const res = await fetch(`${base}/api/settings/libraries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, name }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Falha ao adicionar a pasta de vídeos")
    return data
  }

  async function removeLibraryPath(id: number) {
    const res = await fetch(`${base}/api/settings/libraries/${id}`, { method: "DELETE" })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Falha ao remover a pasta")
    return data
  }

  function coverUrl(cover: string) {
    return `${base}${cover}`
  }

  return {
    getLibrary, getProgress, getAllProgress, saveProgress, uploadCover, videoUrl, coverUrl,
    getSettings, addLibraryPath, removeLibraryPath,
  }
}

function encodeVideoId(id: string) {
  return id.split("/").map(encodeURIComponent).join("/")
}
