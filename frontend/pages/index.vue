<script setup lang="ts">
import { ServerCrash, FolderOpen, Settings, Search, LayoutGrid, Rows3, X } from "lucide-vue-next"

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

const prefsAberto = useState("prefsAberto", () => false)
const busca = ref("")
const modo = ref<"grade" | "lista">("grade")

const cursosFiltrados = computed(() => {
  const q = busca.value.trim().toLowerCase()
  if (!q) return library.value
  return library.value.filter((c: any) => nomeLimpo(c.nome).toLowerCase().includes(q))
})

function nomeLimpo(nome: string) {
  return nome
    .replace(/[_]+/g, " ")
    .replace(/\s*\[[^\]]*\]\s*/g, " ")
    .replace(/-\d{8}T\d{6}Z.*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim()
}

function iniciais(nome: string) {
  const limpo = nomeLimpo(nome).replace(/[^\p{L}\p{N} ]/gu, "").trim()
  const partes = limpo.split(/\s+/).filter(Boolean)
  if (!partes.length) return "?"
  return (partes[0][0] + (partes[1]?.[0] ?? "")).toUpperCase()
}

function tomDoNome(nome: string) {
  let h = 0
  for (const ch of nome) h = (h * 31 + ch.charCodeAt(0)) % 360
  return `hsl(${h} 32% 26%)`
}

onMounted(() => {
  loadLibrary()
  try { modo.value = (localStorage.getItem("localplay:modo") as any) || "grade" } catch {}
  window.addEventListener("localplay:biblioteca-mudou", loadLibrary)
})
onUnmounted(() => window.removeEventListener("localplay:biblioteca-mudou", loadLibrary))
onActivated(loadLibrary)

watch(modo, (v) => { try { localStorage.setItem("localplay:modo", v) } catch {} })

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

    <header
      class="h-[52px] shrink-0 flex items-center gap-3 pl-[88px] pr-4 border-b border-border/40"
      style="-webkit-app-region: drag"
    >
      <div class="flex items-center gap-2.5 shrink-0">
        <MarcaLogo :tamanho="19" />
        <h1 class="text-[19px] font-semibold tracking-tight">Biblioteca</h1>
      </div>

      <div class="flex-1" />

      <div class="flex items-center gap-2" style="-webkit-app-region: no-drag">
        <div class="relative">
          <Search class="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            v-model="busca"
            type="text"
            placeholder="Buscar"
            class="w-[260px] h-[34px] pl-8 pr-7 rounded-md bg-secondary/80 text-[14px]
                   placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/60
                   focus:bg-secondary transition"
          />
          <button
            v-if="busca"
            class="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            @click="busca = ''"
          >
            <X class="w-3 h-3" />
          </button>
        </div>

        <div class="flex items-center p-[2px] rounded-md bg-secondary/80">
          <button
            v-for="opcao in (['grade', 'lista'] as const)"
            :key="opcao"
            class="w-[34px] h-[28px] flex items-center justify-center rounded-[5px] transition"
            :class="modo === opcao
              ? 'bg-border text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.35)]'
              : 'text-muted-foreground hover:text-foreground'"
            :title="opcao === 'grade' ? 'Grade' : 'Lista'"
            @click="modo = opcao"
          >
            <LayoutGrid v-if="opcao === 'grade'" class="w-[18px] h-[18px]" />
            <Rows3 v-else class="w-[18px] h-[18px]" />
          </button>
        </div>

        <button
          class="w-[34px] h-[34px] flex items-center justify-center rounded-md
                 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
          title="Preferências (⌘,)"
          @click="prefsAberto = true"
        >
          <Settings class="w-5 h-5" />
        </button>
      </div>
    </header>

    <AvisoAtualizacao />

    <div class="flex-1 min-h-0 overflow-y-auto">

      <div v-if="loading" class="h-full flex flex-col items-center justify-center gap-3">
        <MarcaLogo :tamanho="40" pulsando />
        <p class="text-[15px] text-muted-foreground">Carregando biblioteca…</p>
      </div>

      <div v-else-if="error" class="h-full flex items-center justify-center px-6">
        <div class="flex items-center gap-3 rounded-lg ring-1 ring-red-900/50 bg-red-950/30
                    px-5 py-3.5 text-red-400 max-w-md w-full">
          <ServerCrash class="w-5 h-5 shrink-0" />
          <span class="text-[15px]">{{ error }}</span>
        </div>
      </div>

      <div v-else-if="!library.length" class="h-full flex flex-col items-center justify-center text-center gap-4 px-6">
        <div class="w-16 h-16 rounded-[18px] bg-secondary flex items-center justify-center">
          <MarcaLogo :tamanho="30" />
        </div>
        <div class="flex flex-col gap-1.5">
          <h2 class="text-[19px] font-semibold">Nenhum curso ainda</h2>
          <p class="text-[15px] text-muted-foreground max-w-[280px] leading-relaxed">
            Escolha uma pasta com seus vídeos e o LocalPlay organiza tudo em cursos.
          </p>
        </div>
        <button
          class="flex items-center gap-1.5 text-[15px] font-medium px-3 py-1.5 rounded-md
                 bg-primary text-white hover:opacity-90 transition"
          @click="prefsAberto = true"
        >
          <FolderOpen class="w-[18px] h-[18px]" />
          Escolher pasta
        </button>
      </div>

      <div v-else-if="!cursosFiltrados.length" class="h-full flex flex-col items-center justify-center gap-2 px-6">
        <p class="text-[15px] text-muted-foreground">Nenhum curso para “{{ busca }}”</p>
        <button class="text-[14px] text-primary hover:underline" @click="busca = ''">Limpar busca</button>
      </div>

      <div
        v-else-if="modo === 'grade'"
        class="grid gap-x-5 gap-y-6 px-6 py-6 animate-fade-in"
        style="grid-template-columns: repeat(auto-fill, minmax(260px, 1fr))"
      >
        <NuxtLink
          v-for="curso in cursosFiltrados"
          :key="curso.id"
          :to="`/curso/${encodeURIComponent(curso.id)}`"
          class="group flex flex-col gap-2"
        >
          <div
            class="relative w-full overflow-hidden rounded-[7px] ring-1 ring-white/[0.07]
                   shadow-[0_1px_3px_rgba(0,0,0,0.4)] transition-shadow duration-150
                   group-hover:shadow-[0_6px_16px_rgba(0,0,0,0.5)]"
            style="aspect-ratio:16/9"
          >
            <img
              v-if="curso.cover"
              :key="curso.cover"
              :src="coverUrl(curso.cover)"
              :alt="nomeLimpo(curso.nome)"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center"
              :style="{ background: tomDoNome(curso.nome) }"
            >
              <span class="text-[26px] font-semibold text-white/85 tracking-wide">
                {{ iniciais(curso.nome) }}
              </span>
            </div>

            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-150 flex items-center justify-center">
              <div class="w-9 h-9 rounded-full flex items-center justify-center bg-white/90
                          scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150">
                <svg class="w-5 h-5 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>

            <div v-if="courseProgress(curso) === 100"
                 class="absolute top-1.5 right-1.5 w-[18px] h-[18px] rounded-full bg-emerald-500 flex items-center justify-center">
              <svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" stroke-width="3.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <div v-else-if="courseProgress(curso) > 0" class="absolute bottom-0 left-0 right-0 h-[3px] bg-black/45">
              <div class="h-full bg-primary" :style="{ width: courseProgress(curso) + '%' }" />
            </div>
          </div>

          <div class="flex flex-col gap-[2px] min-w-0 px-0.5">
            <h2 class="text-[15px] font-medium leading-[1.3] line-clamp-2">
              {{ nomeLimpo(curso.nome) }}
            </h2>
            <p class="text-[14px] text-muted-foreground truncate">
              {{ totalAulas(curso) }} {{ totalAulas(curso) === 1 ? 'aula' : 'aulas' }}
            </p>
          </div>
        </NuxtLink>
      </div>

      <div v-else class="px-3 py-2 animate-fade-in">
        <NuxtLink
          v-for="curso in cursosFiltrados"
          :key="curso.id"
          :to="`/curso/${encodeURIComponent(curso.id)}`"
          class="flex items-center gap-3 px-2.5 py-1.5 rounded-md hover:bg-white/[0.055] transition-colors"
        >
          <div class="relative w-[64px] shrink-0 overflow-hidden rounded ring-1 ring-white/[0.07]" style="aspect-ratio:16/9">
            <img v-if="curso.cover" :src="coverUrl(curso.cover)" :alt="nomeLimpo(curso.nome)" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center" :style="{ background: tomDoNome(curso.nome) }">
              <span class="text-[13px] font-semibold text-white/85">{{ iniciais(curso.nome) }}</span>
            </div>
          </div>
          <span class="flex-1 min-w-0 truncate text-[15px]">{{ nomeLimpo(curso.nome) }}</span>
          <span class="shrink-0 text-[14px] text-muted-foreground tabular-nums">
            {{ totalAulas(curso) }} {{ totalAulas(curso) === 1 ? 'aula' : 'aulas' }}
          </span>
          <span class="shrink-0 w-10 text-right text-[14px] text-muted-foreground tabular-nums">
            {{ courseProgress(curso) }}%
          </span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
