<script setup lang="ts">
const route = useRoute()
const { getLibrary, getAllProgress, saveProgress, videoUrl } = useApi()

const cursoId = computed(() => decodeURIComponent(route.params.id as string))

const curso = ref<any>(null)
const allProgress = ref<Record<string, any>>({})
const currentAula = ref<any>(null)
const videoEl = ref<HTMLVideoElement | null>(null)
const saveTimer = ref<ReturnType<typeof setInterval> | null>(null)
const sidebarOpen = ref(true)

onMounted(async () => {
  const [library, progress] = await Promise.all([getLibrary(), getAllProgress()])
  allProgress.value = progress
  curso.value = library.find((c: any) => c.id === cursoId.value)

  if (!curso.value) return

  const aulas = todasAulas.value
  const inProgress = aulas.find(a => progress[a.id] && !progress[a.id].completed && progress[a.id].current_time > 0)
  selectAula(inProgress || aulas[0])
})

const todasAulas = computed(() => {
  if (!curso.value) return []
  return curso.value.modulos.flatMap((m: any) => m.aulas)
})

async function selectAula(aula: any) {
  currentAula.value = aula

  await nextTick()
  if (!videoEl.value) return

  const p = allProgress.value[aula.id]
  if (p && p.current_time > 0 && !p.completed) {
    videoEl.value.currentTime = p.current_time
  }
  videoEl.value.play().catch(() => {})
}

function startSaving() {
  if (saveTimer.value) return
  saveTimer.value = setInterval(async () => {
    if (!videoEl.value || !currentAula.value) return
    const t = videoEl.value.currentTime
    const d = videoEl.value.duration || 0
    if (d > 0) {
      const completed = t / d >= 0.92
      await saveProgress(currentAula.value.id, t, d, completed)
      allProgress.value[currentAula.value.id] = { current_time: t, duration: d, completed }
    }
  }, 5000)
}

function stopSaving() {
  if (saveTimer.value) {
    clearInterval(saveTimer.value)
    saveTimer.value = null
  }
}

async function onPause() {
  if (!videoEl.value || !currentAula.value) return
  const t = videoEl.value.currentTime
  const d = videoEl.value.duration || 0
  if (d > 0) {
    const completed = t / d >= 0.92
    await saveProgress(currentAula.value.id, t, d, completed)
    allProgress.value[currentAula.value.id] = { current_time: t, duration: d, completed }
  }
}

async function onEnded() {
  if (!currentAula.value) return
  await saveProgress(currentAula.value.id, videoEl.value!.duration, videoEl.value!.duration, true)
  allProgress.value[currentAula.value.id] = { completed: true }

  const idx = todasAulas.value.findIndex(a => a.id === currentAula.value.id)
  const next = todasAulas.value[idx + 1]
  if (next) selectAula(next)
}

onUnmounted(() => {
  stopSaving()
  onPause()
})

function aulaProgress(aula: any) {
  const p = allProgress.value[aula.id]
  if (!p || !p.duration) return 0
  return Math.min(100, Math.round((p.current_time / p.duration) * 100))
}

function aulaCompleted(aula: any) {
  return !!allProgress.value[aula.id]?.completed
}

const courseProgressPercent = computed(() => {
  const aulas = todasAulas.value
  if (!aulas.length) return 0
  const done = aulas.filter(a => allProgress.value[a.id]?.completed).length
  return Math.round((done / aulas.length) * 100)
})
</script>

<template>
  <div v-if="!curso" class="loading">Carregando…</div>

  <div v-else class="player-layout">
    <div class="player-area">
      <div class="video-wrapper">
        <video
          ref="videoEl"
          :src="currentAula ? videoUrl(currentAula.id) : ''"
          controls
          preload="metadata"
          class="video-el"
          @play="startSaving"
          @pause="onPause"
          @ended="onEnded"
        />
      </div>

      <div v-if="currentAula" class="aula-info">
        <h1 class="aula-nome">{{ currentAula.nome }}</h1>
        <div class="curso-nome-small">{{ curso.nome }}</div>
      </div>

      <div class="course-progress-bar-wrap">
        <div class="course-progress-meta">
          <span>Progresso do curso</span>
          <span>{{ courseProgressPercent }}%</span>
        </div>
        <div class="course-progress-track">
          <div class="course-progress-fill" :style="{ width: courseProgressPercent + '%' }" />
        </div>
      </div>
    </div>

    <aside class="sidebar" :class="{ closed: !sidebarOpen }">
      <button class="sidebar-toggle" @click="sidebarOpen = !sidebarOpen">
        {{ sidebarOpen ? '✕' : '☰' }}
      </button>

      <div v-if="sidebarOpen" class="sidebar-inner">
        <h2 class="sidebar-title">{{ curso.nome }}</h2>

        <div v-for="modulo in curso.modulos" :key="modulo.nome" class="modulo-section">
          <div class="modulo-nome">{{ modulo.nome }}</div>

          <button
            v-for="aula in modulo.aulas"
            :key="aula.id"
            class="aula-item"
            :class="{
              active: currentAula?.id === aula.id,
              completed: aulaCompleted(aula),
            }"
            @click="selectAula(aula)"
          >
            <span class="aula-status-icon">
              {{ aulaCompleted(aula) ? '✓' : currentAula?.id === aula.id ? '▶' : '○' }}
            </span>

            <div class="aula-item-info">
              <span class="aula-item-nome">{{ aula.nome }}</span>
              <div v-if="!aulaCompleted(aula) && aulaProgress(aula) > 0" class="aula-mini-bar">
                <div class="aula-mini-fill" :style="{ width: aulaProgress(aula) + '%' }" />
              </div>
            </div>
          </button>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.loading {
  text-align: center;
  padding: 60px;
  color: var(--text-muted);
}

.player-layout {
  display: flex;
  gap: 0;
  min-height: calc(100vh - 56px - 64px);
  margin: -32px -24px;
}

.player-area {
  flex: 1;
  min-width: 0;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.video-wrapper {
  background: #000;
  border-radius: var(--radius);
  overflow: hidden;
  aspect-ratio: 16 / 9;
  width: 100%;
}
.video-el {
  width: 100%;
  height: 100%;
  display: block;
}

.aula-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.aula-nome {
  font-size: 1.25rem;
  font-weight: 700;
}
.curso-nome-small {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.course-progress-bar-wrap {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.course-progress-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  color: var(--text-muted);
}
.course-progress-track {
  height: 6px;
  background: var(--border);
  border-radius: 99px;
  overflow: hidden;
}
.course-progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 99px;
  transition: width 0.5s;
}

.sidebar {
  width: 320px;
  flex-shrink: 0;
  background: var(--surface);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: relative;
  transition: width 0.2s;
  overflow: hidden;
}
.sidebar.closed {
  width: 40px;
}

.sidebar-toggle {
  position: absolute;
  top: 12px;
  right: 10px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: var(--radius-sm);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  z-index: 10;
}

.sidebar-inner {
  overflow-y: auto;
  flex: 1;
  padding: 16px 0 16px;
}

.sidebar-title {
  font-size: 0.95rem;
  font-weight: 700;
  padding: 0 16px 12px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 8px;
}

.modulo-section {
  margin-bottom: 8px;
}
.modulo-nome {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  padding: 10px 16px 4px;
}

.aula-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  text-align: left;
  padding: 9px 16px;
  background: transparent;
  border: none;
  color: var(--text);
  font-size: 0.85rem;
  line-height: 1.35;
  border-left: 3px solid transparent;
  transition: background 0.1s, border-color 0.1s;
}
.aula-item:hover {
  background: var(--surface-2);
}
.aula-item.active {
  background: rgba(124, 58, 237, 0.15);
  border-left-color: var(--accent);
}
.aula-item.completed .aula-status-icon {
  color: var(--success);
}

.aula-status-icon {
  font-size: 0.75rem;
  margin-top: 2px;
  flex-shrink: 0;
  color: var(--text-muted);
}
.aula-item.active .aula-status-icon {
  color: var(--accent);
}

.aula-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.aula-item-nome {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.aula-mini-bar {
  height: 3px;
  background: var(--border);
  border-radius: 99px;
  overflow: hidden;
}
.aula-mini-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 99px;
}
</style>
