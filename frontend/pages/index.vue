<script setup lang="ts">
import { ServerCrash, FolderOpen, ChevronLeft, ChevronRight } from "lucide-vue-next"

const { getLibrary, getAllProgress, uploadCover } = useApi()

const library = ref<any[]>([])
const allProgress = ref<Record<string, any>>({})
const loading = ref(true)
const error = ref("")
const config = useRuntimeConfig()

const page = ref(0)
const perPage = ref(4)

function updatePerPage() {
  const w = window.innerWidth
  if (w < 640) perPage.value = 1
  else if (w < 1024) perPage.value = 2
  else if (w < 1400) perPage.value = 3
  else perPage.value = 4
}

onMounted(async () => {
  updatePerPage()
  window.addEventListener("resize", updatePerPage)

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
})

onUnmounted(() => window.removeEventListener("resize", updatePerPage))

const totalPages = computed(() => Math.ceil(library.value.length / perPage.value))
const visibleCursos = computed(() => {
  const start = page.value * perPage.value
  return library.value.slice(start, start + perPage.value)
})

const slideDir = ref<'left' | 'right'>('right')
const sliding = ref(false)

async function changePage(next: number) {
  if (sliding.value) return
  slideDir.value = next > page.value ? 'right' : 'left'
  sliding.value = true
  await nextTick()
  page.value = next
  setTimeout(() => { sliding.value = false }, 320)
}

function prevPage() { if (page.value > 0) changePage(page.value - 1) }
function nextPage() { if (page.value < totalPages.value - 1) changePage(page.value + 1) }

function extractFrame(videoSrc: string): Promise<File | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video")
    video.muted = true
    video.preload = "metadata"
    video.crossOrigin = "anonymous"
    video.currentTime = 0

    let done = false
    const finish = (file: File | null) => {
      if (done) return
      done = true
      clearTimeout(timer)
      video.src = ""
      resolve(file)
    }

    const timer = setTimeout(() => finish(null), 8000)

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

    video.addEventListener("loadeddata", capture, { once: true })
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
function totalModulos(curso: any): number {
  return curso.modulos.length
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
  <div class="flex-1 flex flex-col">

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex flex-col items-center justify-center gap-4">
      <div class="relative flex items-center justify-center w-20 h-20">
        <svg class="absolute inset-0 w-full h-full animate-spin" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="34" stroke="hsl(var(--border))" stroke-width="3"/>
          <path d="M40 6 a34 34 0 0 1 34 34" stroke="hsl(var(--primary))" stroke-width="3" stroke-linecap="round"/>
        </svg>
        <svg class="w-7 h-7 text-primary" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </div>
      <p class="text-sm text-muted-foreground animate-pulse">Carregando biblioteca…</p>
    </div>

    <!-- Erro -->
    <div v-else-if="error" class="flex-1 flex items-center justify-center px-6">
      <div class="flex items-center gap-3 rounded-xl border border-red-900/50 bg-red-950/30
                  px-6 py-4 text-red-400 max-w-md w-full">
        <ServerCrash class="w-5 h-5 shrink-0" />
        <span class="text-sm">{{ error }}</span>
      </div>
    </div>

    <!-- Vazio -->
    <div v-else-if="!library.length" class="flex-1 flex flex-col items-center justify-center text-center gap-5 px-6">
      <div class="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center border border-border/50">
        <FolderOpen class="w-10 h-10 text-primary/40" />
      </div>
      <div class="flex flex-col gap-2">
        <h2 class="text-lg font-semibold">Nenhum curso encontrado</h2>
        <p class="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Adicione pastas com vídeos em
          <code class="bg-muted text-primary px-1.5 py-0.5 rounded text-xs">videos/</code>
        </p>
      </div>
    </div>

    <!-- Biblioteca -->
    <div v-else class="flex-1 flex flex-col items-center justify-center animate-fade-in py-8 px-6 gap-8">

      <!-- Stats -->
      <div class="flex gap-4 w-full max-w-4xl">

        <div class="flex-1 rounded-2xl border border-border/50 bg-card px-6 py-5 flex flex-col gap-4">
          <div class="flex items-start justify-between">
            <span class="text-5xl font-bold tracking-tight text-primary leading-none">{{ totalCursos }}</span>
            <span class="text-[10px] font-semibold uppercase tracking-widest text-primary/60 bg-primary/10
                         px-2 py-1 rounded-md mt-1">Total</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-sm font-semibold text-foreground">{{ totalCursos === 1 ? 'Curso' : 'Cursos' }}</span>
            <div class="h-px rounded-full bg-border/40 overflow-hidden">
              <div class="h-full rounded-full bg-primary" style="width:100%" />
            </div>
          </div>
        </div>

        <div class="flex-1 rounded-2xl border border-border/50 bg-card px-6 py-5 flex flex-col gap-4">
          <div class="flex items-start justify-between">
            <span class="text-5xl font-bold tracking-tight text-primary leading-none">{{ cursosEmAndamento }}</span>
            <span class="text-[10px] font-semibold uppercase tracking-widest text-amber-400/80 bg-amber-400/10
                         px-2 py-1 rounded-md mt-1">Ativo</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-sm font-semibold text-foreground">Em andamento</span>
            <div class="h-px rounded-full bg-border/40 overflow-hidden">
              <div class="h-full rounded-full bg-primary transition-[width] duration-700"
                   :style="{ width: totalCursos ? (cursosEmAndamento / totalCursos * 100) + '%' : '0%' }" />
            </div>
          </div>
        </div>

        <div class="flex-1 rounded-2xl border border-border/50 bg-card px-6 py-5 flex flex-col gap-4">
          <div class="flex items-start justify-between">
            <span class="text-5xl font-bold tracking-tight text-primary leading-none">{{ cursosConcluidos }}</span>
            <span class="text-[10px] font-semibold uppercase tracking-widest text-emerald-400/80 bg-emerald-400/10
                         px-2 py-1 rounded-md mt-1">Feito</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-sm font-semibold text-foreground">Concluídos</span>
            <div class="h-px rounded-full bg-border/40 overflow-hidden">
              <div class="h-full rounded-full bg-emerald-500 transition-[width] duration-700"
                   :style="{ width: totalCursos ? (cursosConcluidos / totalCursos * 100) + '%' : '0%' }" />
            </div>
          </div>
        </div>

      </div>

      <!-- Carrossel -->
      <div class="w-full max-w-4xl flex flex-col gap-5">

        <!-- Trilha com setas sobrepostas -->
        <div class="relative group/carousel">

          <!-- Seta esquerda -->
          <div
            class="absolute left-0 top-0 bottom-0 w-20 z-10 flex items-center justify-start
                   bg-gradient-to-r from-background/80 to-transparent
                   opacity-0 group-hover/carousel:opacity-100 transition-all duration-200"
            :class="page === 0 ? 'pointer-events-none !opacity-0' : 'cursor-pointer'"
            @click="prevPage"
          >
            <ChevronLeft class="w-9 h-9 text-foreground/70 hover:text-primary transition-colors duration-150 ml-1" />
          </div>

          <!-- Seta direita -->
          <div
            class="absolute right-0 top-0 bottom-0 w-20 z-10 flex items-center justify-end
                   bg-gradient-to-l from-background/80 to-transparent
                   opacity-0 group-hover/carousel:opacity-100 transition-all duration-200"
            :class="page >= totalPages - 1 ? 'pointer-events-none !opacity-0' : 'cursor-pointer'"
            @click="nextPage"
          >
            <ChevronRight class="w-9 h-9 text-foreground/70 hover:text-primary transition-colors duration-150 mr-1" />
          </div>

          <!-- Cards -->
          <Transition :name="slideDir === 'right' ? 'slide-right' : 'slide-left'" mode="out-in">
          <div :key="page" class="grid gap-4"
            :style="`grid-template-columns: repeat(${perPage}, 1fr)`"
          >
            <NuxtLink
              v-for="curso in visibleCursos"
              :key="curso.id"
              :to="`/curso/${encodeURIComponent(curso.id)}`"
              class="group flex flex-col rounded-2xl border border-border/50 bg-card overflow-hidden
                     cursor-pointer transition-all duration-200
                     hover:border-primary/40 hover:-translate-y-1
                     hover:shadow-lg hover:shadow-primary/10"
            >
              <!-- Capa — ocupa a maior parte -->
              <div class="relative w-full overflow-hidden rounded-t-2xl" style="aspect-ratio:16/9">
                <img
                  v-if="curso.cover"
                  :key="curso.cover"
                  :src="`${config.public.apiBase}${curso.cover}`"
                  :alt="curso.nome"
                  class="w-full h-full object-cover animate-fade-in"
                />
                <div v-else class="w-full h-full flex items-center justify-center
                                   bg-gradient-to-br from-muted to-secondary">
                  <svg class="w-16 h-16 text-primary/15 group-hover:text-primary/30 transition-colors duration-300"
                       fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>

                <!-- Gradiente inferior sobre a capa -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent
                            opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                <!-- Overlay play -->
                <div class="absolute inset-0 flex items-center justify-center
                            opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div class="w-16 h-16 rounded-full flex items-center justify-center
                              bg-white/20 border border-white/30 backdrop-blur-sm
                              scale-75 group-hover:scale-100 transition-transform duration-300">
                    <svg class="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>

                <!-- Badge concluído -->
                <div v-if="courseProgress(curso) === 100"
                     class="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full
                            bg-emerald-500/90 text-white backdrop-blur-sm shadow-sm">
                  ✓ Concluído
                </div>

                <!-- Barra de progresso -->
                <div v-if="courseProgress(curso) > 0" class="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                  <div
                    class="h-full transition-[width] duration-700"
                    :class="courseProgress(curso) === 100 ? 'bg-emerald-500' : 'bg-primary'"
                    :style="{ width: courseProgress(curso) + '%' }"
                  />
                </div>
              </div>

              <!-- Info — linha única compacta abaixo da capa -->
              <div class="flex items-center justify-between gap-3 px-4 py-3">
                <div class="flex flex-col gap-0.5 min-w-0">
                  <h2 class="font-semibold text-sm leading-tight truncate
                             text-foreground group-hover:text-primary transition-colors duration-200">
                    {{ curso.nome }}
                  </h2>
                  <p class="text-xs text-muted-foreground/60 truncate">
                    {{ totalAulas(curso) }} aulas · {{ totalModulos(curso) }} {{ totalModulos(curso) === 1 ? 'módulo' : 'módulos' }}
                  </p>
                </div>

                <!-- Mini progresso circular -->
                <div class="shrink-0 relative w-9 h-9">
                  <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none"
                            stroke="hsl(var(--border))" stroke-width="3"/>
                    <circle cx="18" cy="18" r="15" fill="none"
                            :stroke="courseProgress(curso) === 100 ? '#10b981' : 'hsl(var(--primary))'"
                            stroke-width="3"
                            stroke-linecap="round"
                            :stroke-dasharray="`${courseProgress(curso) * 0.942} 100`"/>
                  </svg>
                  <span class="absolute inset-0 flex items-center justify-center
                               text-[9px] font-bold"
                        :class="courseProgress(curso) === 100 ? 'text-emerald-500' : 'text-primary'">
                    {{ courseProgress(curso) }}%
                  </span>
                </div>
              </div>
            </NuxtLink>
          </div>
          </Transition>

        </div>

        <!-- Dots -->
        <div v-if="totalPages > 1" class="flex items-center justify-center gap-2">
          <button
            v-for="i in totalPages"
            :key="i"
            class="rounded-full transition-all duration-250"
            :class="page === i - 1 ? 'w-6 h-2 bg-primary' : 'w-2 h-2 bg-border/60 hover:bg-primary/40'"
            @click="changePage(i - 1)"
          />
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
.slide-right-enter-active,
.slide-right-leave-active,
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.28s ease;
}

.slide-right-enter-from { opacity: 0; transform: translateX(40px); }
.slide-right-leave-to   { opacity: 0; transform: translateX(-40px); }
.slide-left-enter-from  { opacity: 0; transform: translateX(-40px); }
.slide-left-leave-to    { opacity: 0; transform: translateX(40px); }
</style>
