<script setup lang="ts">
import {
  CheckCircle2, Circle,
  PanelRightClose, PanelRightOpen,
  ChevronLeft, ChevronRight,
} from "lucide-vue-next"

const route = useRoute()
const { getLibrary, getAllProgress, saveProgress, videoUrl } = useApi()

const cursoId = computed(() => decodeURIComponent(route.params.id as string))

const curso       = ref<any>(null)
const ready       = ref(false)
const allProgress = ref<Record<string, any>>({})
const currentAula = ref<any>(null)
const sidebarOpen = ref(true)
const saveTimer   = ref<ReturnType<typeof setInterval> | null>(null)
const videoEl     = ref<HTMLVideoElement | null>(null)

let plyr: any = null

const todasAulas = computed(() =>
  curso.value ? curso.value.modulos.flatMap((m: any) => m.aulas) : []
)

const currentIndex = computed(() =>
  todasAulas.value.findIndex((a: any) => a.id === currentAula.value?.id)
)

const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < todasAulas.value.length - 1)

const courseProgressPercent = computed(() => {
  const aulas = todasAulas.value
  if (!aulas.length) return 0
  const done = aulas.filter((a: any) => allProgress.value[a.id]?.completed).length
  return Math.round((done / aulas.length) * 100)
})

onMounted(async () => {
  const [library, progress, ] = await Promise.all([
    getLibrary(),
    getAllProgress(),
    new Promise(r => setTimeout(r, 600)),
  ])
  allProgress.value = progress
  curso.value = library.find((c: any) => c.id === cursoId.value)
  if (!curso.value) return

  ready.value = true
  await nextTick()
  await initPlyr()

  const aulas = todasAulas.value
  const resume = aulas.find(
    (a: any) => progress[a.id] && !progress[a.id].completed && progress[a.id].current_time > 0
  )
  selectAula(resume || aulas[0])
})

onUnmounted(() => {
  stopSaving()
  flushProgress()
  plyr?.destroy()
})

async function initPlyr() {
  const Plyr = (await import("plyr")).default
  await import("plyr/dist/plyr.css")

  plyr = new Plyr(videoEl.value!, {
    controls: [
      "play-large", "play", "rewind", "fast-forward", "progress",
      "current-time", "duration", "mute", "volume",
      "settings", "pip", "fullscreen",
    ],
    settings: ["speed", "quality"],
    speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
    keyboard: { focused: true, global: true },
    tooltips: { controls: true, seek: true },
    i18n: {
      play: "Reproduzir",
      pause: "Pausar",
      rewind: "Voltar 10s",
      fastForward: "Avançar 10s",
      mute: "Silenciar",
      unmute: "Ativar som",
      volume: "Volume",
      settings: "Configurações",
      pip: "Picture in Picture",
      enterFullscreen: "Tela cheia",
      exitFullscreen: "Sair da tela cheia",
      speed: "Velocidade",
      quality: "Qualidade",
      normal: "Normal",
      goToBeginning: "Início",
      captions: "Legendas",
      enableCaptions: "Ativar legendas",
      disableCaptions: "Desativar legendas",
      download: "Baixar",
      loop: "Repetir",
      start: "Início",
      end: "Fim",
      all: "Tudo",
      reset: "Redefinir",
      disabled: "Desabilitado",
      advertisement: "Anúncio",
      buffered: "Carregado",
      currentTime: "Tempo atual",
      duration: "Duração",
      seekLabel: "{currentTime} de {duration}",
    },
  })

  plyr.on("play",  () => startSaving())
  plyr.on("pause", () => { stopSaving(); flushProgress() })
  plyr.on("ended", () => onEnded())

  document.addEventListener("keydown", (e) => {
    if ((e.target as HTMLElement).tagName === "INPUT") return
    if (e.shiftKey && e.code === "ArrowRight" && hasNext.value) {
      e.preventDefault()
      selectAula(todasAulas.value[currentIndex.value + 1])
    } else if (e.shiftKey && e.code === "ArrowLeft" && hasPrev.value) {
      e.preventDefault()
      selectAula(todasAulas.value[currentIndex.value - 1])
    }
  })
}

async function selectAula(aula: any) {
  if (currentAula.value?.id === aula.id) return
  await flushProgress()
  stopSaving()
  currentAula.value = aula
  await nextTick()

  if (!plyr || !videoEl.value) return

  videoEl.value.src = videoUrl(aula.id)
  plyr.once("loadedmetadata", () => {
    const p = allProgress.value[aula.id]
    if (p?.current_time > 0 && !p.completed) {
      plyr.currentTime = p.current_time
    }
    plyr.play()
  })
}

function startSaving() {
  if (saveTimer.value) return
  saveTimer.value = setInterval(flushProgress, 5000)
}

function stopSaving() {
  if (saveTimer.value) { clearInterval(saveTimer.value); saveTimer.value = null }
}

async function flushProgress() {
  if (!plyr || !currentAula.value) return
  const t = plyr.currentTime ?? 0
  const d = plyr.duration ?? 0
  if (d > 0) {
    const alreadyCompleted = !!allProgress.value[currentAula.value.id]?.completed
    const completed = alreadyCompleted || t / d >= 0.92
    await saveProgress(currentAula.value.id, t, d, completed)
    allProgress.value[currentAula.value.id] = { current_time: t, duration: d, completed }
  }
}

async function onEnded() {
  if (!plyr || !currentAula.value) return
  const d = plyr.duration ?? 0
  await saveProgress(currentAula.value.id, d, d, true)
  allProgress.value[currentAula.value.id] = { current_time: d, duration: d, completed: true }
  if (hasNext.value) selectAula(todasAulas.value[currentIndex.value + 1])
}

function aulaProgress(aula: any): number {
  const p = allProgress.value[aula.id]
  if (!p?.duration) return 0
  return Math.min(100, Math.round((p.current_time / p.duration) * 100))
}

function aulaCompleted(aula: any): boolean {
  return !!allProgress.value[aula.id]?.completed
}

async function toggleCompleted(aula: any, event: MouseEvent) {
  event.stopPropagation()
  const current = allProgress.value[aula.id] ?? { current_time: 0, duration: 0, completed: false }
  const next = !current.completed
  await saveProgress(aula.id, current.current_time ?? 0, current.duration ?? 0, next)
  allProgress.value[aula.id] = { ...current, completed: next }
}
</script>

<template>
  <div v-if="!ready" class="flex items-center justify-center h-[calc(100vh-56px)]">
    <div class="relative flex items-center justify-center w-24 h-24">
      <svg class="absolute inset-0 w-full h-full animate-spin" viewBox="0 0 96 96" fill="none">
        <circle cx="48" cy="48" r="42" stroke="hsl(var(--border))" stroke-width="4"/>
        <path d="M48 6 a42 42 0 0 1 42 42" stroke="hsl(var(--primary))" stroke-width="4" stroke-linecap="round"/>
      </svg>
      <svg class="w-9 h-9 text-primary ml-1" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z"/>
      </svg>
    </div>
  </div>

  <div v-else class="relative flex flex-col lg:flex-row h-[calc(100vh-56px)] overflow-hidden animate-fade-in">

    <div class="flex-1 min-w-0 flex flex-col min-h-0">

      <div class="flex-1 min-h-0 bg-black flex items-center justify-center">
        <video ref="videoEl" playsinline class="w-full h-full object-contain" />
      </div>

      <div class="shrink-0 px-4 sm:px-6 py-3 flex flex-col gap-2.5 border-t border-border bg-card">
        <div v-if="currentAula" class="flex flex-wrap items-center justify-between gap-3">
          <div class="min-w-0 flex-1">
            <h1 class="text-sm font-bold leading-snug truncate">{{ currentAula.nome }}</h1>
            <p class="text-xs text-muted-foreground mt-0.5 truncate">{{ curso.nome }}</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button
              :disabled="!hasPrev"
              class="flex items-center gap-1.5 text-sm font-medium px-3 sm:px-4 py-1.5 rounded-md border border-border
                     bg-secondary text-foreground hover:bg-border hover:border-muted-foreground transition
                     disabled:opacity-25 disabled:cursor-not-allowed"
              @click="hasPrev && selectAula(todasAulas[currentIndex - 1])"
            >
              <ChevronLeft class="w-4 h-4" />
              <span class="hidden sm:inline">Anterior</span>
            </button>
            <button
              :disabled="!hasNext"
              class="flex items-center gap-1.5 text-sm font-semibold px-3 sm:px-4 py-1.5 rounded-md
                     bg-primary text-white hover:opacity-90 transition
                     disabled:opacity-25 disabled:cursor-not-allowed"
              @click="hasNext && selectAula(todasAulas[currentIndex + 1])"
            >
              <span class="hidden sm:inline">Próxima</span>
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex-1 h-1 rounded-full bg-border overflow-hidden">
            <div
              class="h-full rounded-full bg-primary transition-[width] duration-500"
              :style="{ width: courseProgressPercent + '%' }"
            />
          </div>
          <span class="text-xs font-medium text-muted-foreground shrink-0 w-9 text-right">
            {{ courseProgressPercent }}%
          </span>
        </div>
      </div>
    </div>

    <!-- Botão abrir sidebar quando fechada -->
    <button
      v-if="!sidebarOpen"
      class="hidden lg:flex absolute right-3 top-[calc(56px+12px)] z-20
             w-8 h-8 items-center justify-center rounded-md border border-border
             bg-card text-muted-foreground hover:text-foreground hover:bg-secondary transition"
      @click="sidebarOpen = true"
    >
      <PanelRightOpen class="w-4 h-4" />
    </button>

    <aside
      class="flex flex-col border-t lg:border-t-0 lg:border-l border-border bg-card
             lg:transition-[width,opacity] lg:duration-200 overflow-hidden
             h-64 lg:h-auto shrink-0"
      :class="sidebarOpen ? 'lg:w-80 lg:opacity-100' : 'lg:w-0 lg:opacity-0 lg:border-l-0'"
    >
      <div class="hidden lg:flex h-11 items-center justify-between px-4 shrink-0 border-b border-border">
        <span class="text-xs font-semibold text-foreground/70 uppercase tracking-wider truncate mr-2">
          {{ curso.nome }}
        </span>
        <button
          class="text-muted-foreground hover:text-foreground transition shrink-0"
          @click="sidebarOpen = !sidebarOpen"
        >
          <PanelRightClose class="w-4 h-4" />
        </button>
      </div>

      <div class="flex lg:hidden h-10 items-center justify-between px-4 shrink-0 border-b border-border">
        <span class="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Aulas</span>
        <span class="text-xs text-muted-foreground">{{ currentIndex + 1 }} / {{ todasAulas.length }}</span>
      </div>

      <div class="flex-1 overflow-y-auto" :class="{ 'hidden lg:block': !sidebarOpen && false }">
        <template v-if="sidebarOpen || true">
          <div v-for="modulo in curso.modulos" :key="modulo.nome">
            <div class="px-4 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-foreground/50 bg-card sticky top-0 z-10">
              {{ modulo.nome }}
            </div>

            <div
              v-for="aula in modulo.aulas"
              :key="aula.id"
              role="button"
              tabindex="0"
              class="w-full text-left flex items-start gap-3 px-4 py-2.5 border-l-2 transition-all duration-100 cursor-pointer"
              :class="currentAula?.id === aula.id
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-transparent hover:bg-secondary text-foreground/60 hover:text-foreground'"
              @click="selectAula(aula)"
              @keydown.enter="selectAula(aula)"
            >
              <button
                class="shrink-0 mt-0.5 rounded-full transition-all duration-150 hover:scale-110 focus:outline-none group/check"
                :title="aulaCompleted(aula) ? 'Marcar como não concluída' : 'Marcar como concluída'"
                @click.stop="toggleCompleted(aula, $event)"
              >
                <CheckCircle2 v-if="aulaCompleted(aula)" class="w-4 h-4 text-primary" />
                <Circle v-else class="w-4 h-4 text-foreground/25 group-hover/check:text-primary/70 transition-colors" />
              </button>

              <div class="flex-1 min-w-0 flex flex-col gap-1.5">
                <span class="text-sm leading-snug line-clamp-2">{{ aula.nome }}</span>
                <div v-if="!aulaCompleted(aula) && aulaProgress(aula) > 0" class="h-0.5 rounded-full bg-border overflow-hidden">
                  <div class="h-full bg-primary rounded-full" :style="{ width: aulaProgress(aula) + '%' }" />
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </aside>

  </div>
</template>

<style>
:root {
  --plyr-color-main:                  hsl(213, 85%, 62%);
  --plyr-video-background:            #000;
  --plyr-video-controls-background:   linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.85));
  --plyr-control-radius:              6px;
  --plyr-font-family:                 "Inter", system-ui, sans-serif;
  --plyr-font-size-base:              13px;
  --plyr-font-size-small:             12px;
  --plyr-control-spacing:             10px;
  --plyr-control-icon-size:           18px;

  --plyr-video-control-color:         #fff;
  --plyr-video-control-color-hover:   #fff;
  --plyr-video-control-background-hover: rgba(255,255,255,0.15);

  --plyr-range-fill-background:       hsl(213, 85%, 62%);
  --plyr-range-thumb-background:      #fff;
  --plyr-range-thumb-height:          14px;
  --plyr-range-track-height:          4px;
  --plyr-range-thumb-shadow:          0 1px 4px rgba(0,0,0,0.5);

  --plyr-menu-background:             hsl(0, 0%, 12%);
  --plyr-menu-color:                  hsl(0, 0%, 92%);
  --plyr-menu-border-color:           hsl(0, 0%, 22%);
  --plyr-menu-shadow:                 0 8px 32px rgba(0,0,0,0.6);
  --plyr-menu-arrow-color:            hsl(0, 0%, 40%);

  --plyr-tooltip-background:          hsl(0, 0%, 12%);
  --plyr-tooltip-color:               #fff;
  --plyr-tooltip-shadow:              0 4px 12px rgba(0,0,0,0.5);
  --plyr-tooltip-border-radius:       6px;
  --plyr-tooltip-padding:             6px 10px;
}

.plyr--video,
.plyr__video-wrapper,
.plyr {
  width: 100% !important;
  height: 100% !important;
  border-radius: 0;
}

.plyr__video-wrapper {
  background: #000;
}

.plyr__time {
  color: rgba(255,255,255,0.9) !important;
  font-weight: 500;
}

.plyr__menu__container [data-plyr="speed"][value="2"] {
  color: hsl(213, 85%, 62%);
  font-weight: 700;
}

.plyr__menu__container .plyr__control {
  color: hsl(0, 0%, 90%);
}
.plyr__menu__container .plyr__control:hover {
  background: hsl(0, 0%, 20%);
  color: #fff;
}
.plyr__menu__container .plyr__control[aria-checked="true"] {
  color: hsl(213, 85%, 62%);
}
</style>
