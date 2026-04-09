<script setup lang="ts">
const { getLibrary, getAllProgress, uploadCover } = useApi()

const library = ref<any[]>([])
const allProgress = ref<Record<string, any>>({})
const error = ref('')
const uploadingFor = ref<string | null>(null)

onMounted(async () => {
  try {
    [library.value, allProgress.value] = await Promise.all([getLibrary(), getAllProgress()])
  } catch {
    error.value = 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.'
  }
})

function courseProgress(curso: any): number {
  const aulas = curso.modulos.flatMap((m: any) => m.aulas)
  if (!aulas.length) return 0
  const done = aulas.filter((a: any) => allProgress.value[a.id]?.completed).length
  return Math.round((done / aulas.length) * 100)
}

function lastWatched(curso: any): any {
  const aulas = curso.modulos.flatMap((m: any) => m.aulas)
  const inProgress = aulas.find(
    (a: any) => allProgress.value[a.id] && !allProgress.value[a.id].completed
  )
  return inProgress || aulas[0]
}

async function handleCoverUpload(cursoNome: string, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploadingFor.value = cursoNome
  try {
    const { uploadCover } = useApi()
    await uploadCover(cursoNome, file)
    library.value = await getLibrary()
  } catch {
    alert('Falha ao fazer upload da capa.')
  } finally {
    uploadingFor.value = null
    input.value = ''
  }
}
</script>

<template>
  <div>
    <div v-if="error" class="error-banner">{{ error }}</div>

    <div v-else-if="!library.length" class="empty-state">
      <div class="empty-icon">📂</div>
      <h2>Nenhum curso encontrado</h2>
      <p>
        Adicione pastas com vídeos em <code>videos/</code>.<br />
        Estrutura: <code>videos/Nome do Curso/Módulo/aula.mp4</code>
      </p>
    </div>

    <div v-else>
      <h1 class="page-title">Minha Biblioteca</h1>

      <div class="course-grid">
        <NuxtLink
          v-for="curso in library"
          :key="curso.id"
          :to="`/curso/${encodeURIComponent(curso.id)}`"
          class="course-card"
        >
          <div class="course-cover">
            <img v-if="curso.cover" :src="`${useRuntimeConfig().public.apiBase}${curso.cover}`" :alt="curso.nome" />
            <div v-else class="cover-placeholder">
              <span>▶</span>
            </div>

            <label
              class="cover-upload-btn"
              :title="'Trocar capa de ' + curso.nome"
              @click.prevent
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                class="sr-only"
                @change="handleCoverUpload(curso.nome, $event)"
              />
              <span v-if="uploadingFor === curso.nome">...</span>
              <span v-else>🖼</span>
            </label>
          </div>

          <div class="course-info">
            <h2 class="course-name">{{ curso.nome }}</h2>

            <div class="course-meta">
              <span>{{ curso.modulos.length }} módulo{{ curso.modulos.length !== 1 ? 's' : '' }}</span>
              <span class="dot">·</span>
              <span>
                {{ curso.modulos.flatMap((m: any) => m.aulas).length }} aulas
              </span>
            </div>

            <div class="progress-bar-wrap">
              <div class="progress-bar" :style="{ width: courseProgress(curso) + '%' }" />
            </div>
            <span class="progress-label">{{ courseProgress(curso) }}% concluído</span>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-title {
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 28px;
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.course-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: border-color 0.15s, transform 0.15s;
  display: flex;
  flex-direction: column;
}
.course-card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}

.course-cover {
  position: relative;
  aspect-ratio: 16 / 9;
  background: var(--surface-2);
  overflow: hidden;
}
.course-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: var(--text-muted);
}

.cover-upload-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0,0,0,0.65);
  border-radius: var(--radius-sm);
  padding: 4px 8px;
  font-size: 0.85rem;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
}
.course-cover:hover .cover-upload-btn {
  opacity: 1;
}

.course-info {
  padding: 14px 16px 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.course-name {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
}

.course-meta {
  font-size: 0.8rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
}
.dot { opacity: 0.5; }

.progress-bar-wrap {
  height: 4px;
  background: var(--border);
  border-radius: 99px;
  margin-top: 4px;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  background: var(--accent);
  border-radius: 99px;
  transition: width 0.4s;
}
.progress-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-muted);
}
.empty-icon { font-size: 3rem; margin-bottom: 16px; }
.empty-state h2 { color: var(--text); margin-bottom: 8px; }
.empty-state code {
  background: var(--surface);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.85rem;
}

.error-banner {
  background: #3f1212;
  border: 1px solid #7f1d1d;
  color: #fca5a5;
  padding: 16px 20px;
  border-radius: var(--radius);
  margin-bottom: 24px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
}
</style>
