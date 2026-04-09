<script setup lang="ts">
import { PlayCircle, Image, Loader2, ServerCrash, FolderOpen, BookOpen, GraduationCap } from "lucide-vue-next"

const { getLibrary, getAllProgress, uploadCover } = useApi()

const library = ref<any[]>([])
const allProgress = ref<Record<string, any>>({})
const loading = ref(true)
const error = ref("")
const uploadingFor = ref<string | null>(null)
const config = useRuntimeConfig()

onMounted(async () => {
  try {
    const [lib, prog] = await Promise.all([getLibrary(), getAllProgress()])
    library.value = lib
    allProgress.value = prog
  } catch {
    error.value = "Não foi possível conectar ao servidor."
  } finally {
    loading.value = false
  }
})

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

async function handleCoverUpload(cursoNome: string, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploadingFor.value = cursoNome
  try {
    await uploadCover(cursoNome, file)
    library.value = await getLibrary()
  } finally {
    uploadingFor.value = null
    input.value = ""
  }
}

const totalCursos = computed(() => library.value.length)
const cursosEmAndamento = computed(() =>
  library.value.filter(c => {
    const p = courseProgress(c)
    return p > 0 && p < 100
  }).length
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
        <h2 class="text-lg font-semibold text-foreground">Nenhum curso encontrado</h2>
        <p class="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Adicione pastas com vídeos em
          <code class="bg-muted text-primary px-1.5 py-0.5 rounded text-xs">videos/</code>
        </p>
        <p class="text-xs text-muted-foreground/60">
          Estrutura: <code class="bg-muted text-primary/70 px-1.5 py-0.5 rounded text-xs">videos/Curso/Módulo/aula.mp4</code>
        </p>
      </div>
    </div>

    <!-- Biblioteca -->
    <div v-else class="flex-1 flex flex-col animate-fade-in">

      <!-- Stats badges -->
      <div class="flex items-center justify-center gap-3 py-5 px-6 border-b border-border/30">
        <div class="flex items-center gap-2 px-3.5 py-1.5 rounded-full
                    bg-primary/10 border border-primary/20 text-primary">
          <BookOpen class="w-3.5 h-3.5" />
          <span class="text-xs font-semibold">{{ totalCursos }}</span>
          <span class="text-xs font-medium">{{ totalCursos === 1 ? 'curso' : 'cursos' }}</span>
        </div>

        <div class="flex items-center gap-2 px-3.5 py-1.5 rounded-full
                    bg-amber-500/10 border border-amber-500/25 text-amber-400">
          <div class="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
          <span class="text-xs font-semibold">{{ cursosEmAndamento }}</span>
          <span class="text-xs font-medium">em andamento</span>
        </div>

        <div class="flex items-center gap-2 px-3.5 py-1.5 rounded-full
                    bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
          <div class="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
          <span class="text-xs font-semibold">{{ cursosConcluidos }}</span>
          <span class="text-xs font-medium">{{ cursosConcluidos === 1 ? 'concluído' : 'concluídos' }}</span>
        </div>
      </div>

      <!-- Grid de cursos -->
      <div class="flex-1 flex justify-center px-8 py-8">
        <div class="w-full max-w-screen-xl">
          <div class="grid gap-6" style="grid-template-columns: repeat(auto-fill, minmax(220px, 220px)); justify-content: center">
            <NuxtLink
              v-for="curso in library"
              :key="curso.id"
              :to="`/curso/${encodeURIComponent(curso.id)}`"
              class="group flex flex-col rounded-2xl border border-border/50 bg-card overflow-hidden
                     transition-all duration-300 cursor-pointer w-full
                     hover:border-primary/60 hover:-translate-y-2
                     hover:shadow-2xl hover:shadow-primary/20
                     hover:bg-card/90"
            >
              <!-- Thumbnail -->
              <div class="relative aspect-video bg-muted overflow-hidden">
                <img
                  v-if="curso.cover"
                  :src="`${config.public.apiBase}${curso.cover}`"
                  :alt="curso.nome"
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                />
                <div v-else class="w-full h-full flex flex-col items-center justify-center gap-2
                                   bg-gradient-to-br from-muted via-secondary to-muted/60
                                   group-hover:from-primary/10 group-hover:via-primary/5
                                   transition-all duration-300">
                  <div class="relative">
                    <div class="absolute inset-0 rounded-full bg-primary/20 blur-md scale-150
                                opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <PlayCircle class="relative w-12 h-12 text-primary/30 group-hover:text-primary/60 transition-colors duration-300" />
                  </div>
                </div>

                <!-- Barra de progresso -->
                <div v-if="courseProgress(curso) > 0" class="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                  <div
                    class="h-full transition-[width] duration-700 ease-out"
                    :class="courseProgress(curso) === 100 ? 'bg-emerald-500' : 'bg-primary'"
                    :style="{ width: courseProgress(curso) + '%' }"
                  />
                </div>

                <!-- Badge concluído -->
                <div
                  v-if="courseProgress(curso) === 100"
                  class="absolute top-2 left-2 flex items-center gap-1 bg-emerald-500/90 text-white
                         text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm shadow-lg"
                >
                  ✓ Concluído
                </div>

                <!-- Overlay play no hover -->
                <div class="absolute inset-0 flex items-center justify-center
                            bg-black/0 group-hover:bg-black/20 transition-all duration-300">
                  <div class="w-14 h-14 rounded-full bg-white/0 group-hover:bg-white/15
                              flex items-center justify-center backdrop-blur-sm
                              scale-75 group-hover:scale-100 opacity-0 group-hover:opacity-100
                              transition-all duration-300 border border-white/0 group-hover:border-white/20">
                    <svg class="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>

                <!-- Botão trocar capa -->
                <label
                  class="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-md
                         cursor-pointer transition-all duration-200 select-none
                         bg-black/70 border border-white/10 text-white/60
                         hover:bg-primary hover:border-primary hover:text-white
                         opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0"
                  title="Clique para trocar a capa"
                  @click.prevent
                >
                  <Loader2 v-if="uploadingFor === curso.nome" class="w-3 h-3 animate-spin" />
                  <Image v-else class="w-3 h-3" />
                  <span>{{ uploadingFor === curso.nome ? "Enviando…" : "Capa" }}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    class="sr-only"
                    @change="handleCoverUpload(curso.nome, $event)"
                    @click.stop
                  />
                </label>
              </div>

              <!-- Informações do curso -->
              <div class="flex flex-col gap-3 p-4 flex-1">
                <h2 class="font-semibold text-sm leading-snug line-clamp-2
                           text-foreground group-hover:text-primary
                           transition-colors duration-200">
                  {{ curso.nome }}
                </h2>

                <div class="flex items-center gap-2 text-xs text-muted-foreground/70">
                  <span>{{ totalAulas(curso) }} aulas</span>
                  <span class="text-border">·</span>
                  <span>{{ totalModulos(curso) }} {{ totalModulos(curso) === 1 ? 'módulo' : 'módulos' }}</span>
                </div>

                <!-- Progresso -->
                <div class="mt-auto flex flex-col gap-2">
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-muted-foreground/60">Progresso</span>
                    <span
                      :class="[
                        'font-semibold transition-colors duration-200',
                        courseProgress(curso) === 100
                          ? 'text-emerald-500'
                          : courseProgress(curso) > 0
                            ? 'text-primary'
                            : 'text-muted-foreground/50'
                      ]"
                    >
                      {{ courseProgress(curso) === 100 ? '✓ 100%' : courseProgress(curso) + '%' }}
                    </span>
                  </div>
                  <div class="h-1.5 rounded-full bg-border/50 overflow-hidden">
                    <div
                      class="h-full rounded-full transition-[width] duration-700 ease-out"
                      :class="courseProgress(curso) === 100 ? 'bg-emerald-500' : 'bg-primary'"
                      :style="{ width: (courseProgress(curso) || 0) + '%' }"
                    />
                  </div>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
