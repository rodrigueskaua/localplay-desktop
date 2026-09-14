<script setup lang="ts">
import { ServerCrash, FolderOpen, Settings } from "lucide-vue-next"

const { getLibrary, getAllProgress, uploadCover, coverUrl } = useApi()

const library = ref<any[]>([])
const allProgress = ref<Record<string, any>>({})
const loading = ref(true)
const error = ref("")

async function loadLibrary() {
  loading.value = true
  error.value = ""
  try {
    const [lib, prog] = await Promise.all([getLibrary(), getAllProgress()])
    library.value = lib
    allProgress.value = prog
    generateMissingThumbs(lib)
  } catch {
    error.value = "Não foi possível conectar ao servidor."
  } finally {
    loading.value = false
  }
}

onMounted(loadLibrary)
onActivated(loadLibrary)

function extractFrame(videoSrc: string): Promise<File | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video")
    video.muted = true
    video.preload = "auto"
    video.crossOrigin = "anonymous"

    let done = false
    const finish = (file: File | null) => {
      if (done) return
      done = true
      clearTimeout(timer)
      video.src = ""
      resolve(file)
    }

    const timer = setTimeout(() => finish(null), 8000)

    const seekToFrame = () => {
      const target = Math.min(1, (video.duration || 2) * 0.1)
      video.currentTime = target
    }

    const capture = () => {
      try {
        const canvas = document.createElement("canvas")
        canvas.width = 480
        canvas.height = 270
        canvas.getContext("2d")!.drawImage(video, 0, 0, 480, 270)
        canvas.toBlob(
          (blob) => finish(blob ? new File([blob], "thumb.jpg", { type: "image/jpeg" }) : null),
          "image/jpeg",
          0.7
        )
      } catch { finish(null) }
    }

    video.addEventListener("loadedmetadata", seekToFrame, { once: true })
    video.addEventListener("seeked", capture, { once: true })
    video.addEventListener("error", () => finish(null), { once: true })
    video.src = videoSrc
  })
}

async function generateMissingThumbs(lib: any[]) {
  const { videoUrl } = useApi()
  const sem_capa = lib.filter((c: any) => !c.cover && c.firstVideo)
  if (!sem_capa.length) return

  const BATCH = 2
  for (let i = 0; i < sem_capa.length; i += BATCH) {
    await Promise.all(
      sem_capa.slice(i, i + BATCH).map(async (curso: any) => {
        try {
          const file = await extractFrame(videoUrl(curso.firstVideo))
          if (!file) return
          const res = await uploadCover(curso.id, file)
          const idx = library.value.findIndex((c: any) => c.id === curso.id)
          if (idx !== -1 && res?.cover) {
            library.value[idx] = { ...library.value[idx], cover: res.cover }
          }
        } catch {}
      })
    )
  }
}

function courseProgress(curso: any): number {
  const aulas = curso.modulos.flatMap((m: any) => m.aulas)
  if (!aulas.length) return 0
  const done = aulas.filter((a: any) => allProgress.value[a.id]?.completed).length
  return Math.round((done / aulas.length) * 100)
}
function totalAulas(curso: any): number {
  return curso.modulos.flatMap((m: any) => m.aulas).length
}

const totalCursos = computed(() => library.value.length)
const cursosEmAndamento = computed(() =>
  library.value.filter(c => { const p = courseProgress(c); return p > 0 && p < 100 }).length
)
const cursosConcluidos = computed(() =>
  library.value.filter(c => courseProgress(c) === 100).length
)
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">

    <header class="h-11 shrink-0 flex items-center justify-between px-5 border-b border-border/50">
      <h1 class="text-lg font-semibold">Biblioteca</h1>
      <div v-if="library.length" class="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{{ totalCursos }} {{ totalCursos === 1 ? 'curso' : 'cursos' }}</span>
        <span v-if="cursosEmAndamento" class="flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
          {{ cursosEmAndamento }} em andamento
        </span>
        <span v-if="cursosConcluidos" class="flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          {{ cursosConcluidos }} concluídos
        </span>
      </div>
    </header>

    <div class="flex-1 min-h-0 overflow-y-auto">

      <div v-if="loading" class="h-full flex flex-col items-center justify-center gap-3">
        <div class="relative flex items-center justify-center w-8 h-8">
          <svg class="absolute inset-0 w-full h-full animate-spin" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="13" stroke="hsl(var(--border))" stroke-width="2.5"/>
            <path d="M16 3 a13 13 0 0 1 13 13" stroke="hsl(var(--primary))" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
        <p class="text-sm text-muted-foreground">Carregando biblioteca…</p>
      </div>

      <div v-else-if="error" class="h-full flex items-center justify-center px-6">
        <div class="flex items-center gap-3 rounded-lg border border-red-900/50 bg-red-950/30
                    px-5 py-3.5 text-red-400 max-w-md w-full">
          <ServerCrash class="w-4 h-4 shrink-0" />
          <span class="text-sm">{{ error }}</span>
        </div>
      </div>

      <div v-else-if="!library.length" class="h-full flex flex-col items-center justify-center text-center gap-4 px-6">
        <div class="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center border border-border/50">
          <FolderOpen class="w-6 h-6 text-primary/50" />
        </div>
        <div class="flex flex-col gap-1.5">
          <h2 class="text-base font-semibold">Nenhum curso encontrado</h2>
          <p class="text-sm text-muted-foreground max-w-xs leading-relaxed">
            Escolha uma pasta de vídeos nas configurações para começar
          </p>
        </div>
        <NuxtLink
          to="/configuracoes"
          class="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md
                 border border-border/60 hover:border-primary/60 bg-secondary/60 hover:bg-secondary
                 transition-colors duration-150"
        >
          <Settings class="w-3.5 h-3.5" />
          Abrir configurações
        </NuxtLink>
      </div>

      <div
        v-else
        class="grid gap-x-4 gap-y-6 p-5 animate-fade-in"
        style="grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))"
      >
        <NuxtLink
          v-for="curso in library"
          :key="curso.id"
          :to="`/curso/${encodeURIComponent(curso.id)}`"
          class="group flex flex-col gap-2"
        >
          <div class="relative w-full overflow-hidden rounded-lg bg-card border border-border/40" style="aspect-ratio:16/9">
            <img
              v-if="curso.cover"
              :key="curso.cover"
              :src="coverUrl(curso.cover)"
              :alt="curso.nome"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-secondary">
              <svg class="w-9 h-9 text-primary/20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>

            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-150 flex items-center justify-center">
              <div class="w-9 h-9 rounded-full flex items-center justify-center bg-white/90
                          scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150">
                <svg class="w-4 h-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>

            <div v-if="courseProgress(curso) === 100"
                 class="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
              <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>

            <div v-else-if="courseProgress(curso) > 0" class="absolute bottom-0 left-0 right-0 h-[3px] bg-black/40">
              <div class="h-full bg-primary" :style="{ width: courseProgress(curso) + '%' }" />
            </div>
          </div>

          <div class="flex flex-col gap-0.5 min-w-0">
            <h2 class="text-sm font-medium leading-tight truncate text-foreground">
              {{ curso.nome }}
            </h2>
            <p class="text-xs text-muted-foreground truncate">
              {{ totalAulas(curso) }} {{ totalAulas(curso) === 1 ? 'aula' : 'aulas' }}
            </p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
