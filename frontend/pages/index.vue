<script setup lang="ts">
import { BookOpen, PlayCircle, Image, Loader2, ServerCrash, FolderOpen } from "lucide-vue-next"

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
</script>

<template>
  <div class="max-w-screen-xl mx-auto px-6 py-8">

    <div v-if="loading" class="flex items-center justify-center py-32">
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

    <div v-else-if="error" class="flex items-center gap-3 rounded-lg border border-red-900/50 bg-red-950/40 px-5 py-4 text-red-400">
      <ServerCrash class="w-5 h-5 shrink-0" />
      <span>{{ error }}</span>
    </div>

    <div v-else-if="!library.length" class="flex flex-col items-center justify-center py-32 text-center gap-4">
      <FolderOpen class="w-14 h-14 text-primary/30" />
      <h2 class="text-lg font-semibold text-foreground">Nenhum curso encontrado</h2>
      <p class="text-sm text-muted-foreground max-w-sm leading-relaxed">
        Adicione pastas com vídeos em <code class="bg-muted text-primary px-1.5 py-0.5 rounded text-xs">videos/</code>.<br/>
        Estrutura: <code class="bg-muted text-primary px-1.5 py-0.5 rounded text-xs">videos/Curso/Módulo/aula.mp4</code>
      </p>
    </div>

    <div v-else class="animate-fade-in">
      <div class="flex items-center gap-3 mb-8">
        <div class="p-1.5 rounded-md bg-primary/10 border border-primary/20">
          <BookOpen class="w-5 h-5 text-primary" />
        </div>
        <h1 class="text-2xl font-bold">Minha Biblioteca</h1>
      </div>

      <div class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
        <NuxtLink
          v-for="curso in library"
          :key="curso.id"
          :to="`/curso/${encodeURIComponent(curso.id)}`"
          class="group flex flex-col rounded-lg border border-border bg-card overflow-hidden
                 transition-all duration-200 hover:border-primary/50 hover:-translate-y-0.5
                 hover:shadow-xl hover:shadow-primary/10"
        >
          <div class="relative aspect-video bg-muted overflow-hidden">
            <img
              v-if="curso.cover"
              :src="`${config.public.apiBase}${curso.cover}`"
              :alt="curso.nome"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
            <div v-else class="w-full h-full flex flex-col items-center justify-center gap-2
                               bg-gradient-to-br from-muted to-secondary">
              <PlayCircle class="w-10 h-10 text-primary/40" />
              <span class="text-[10px] text-muted-foreground/50 group-hover:text-muted-foreground/80 transition-colors">
                Sem capa
              </span>
            </div>

            <div
              v-if="courseProgress(curso) > 0"
              class="absolute bottom-0 left-0 right-0 h-1 bg-black/30"
            >
              <div
                class="h-full transition-[width] duration-500"
                :class="courseProgress(curso) === 100 ? 'bg-emerald-500' : 'bg-primary'"
                :style="{ width: courseProgress(curso) + '%' }"
              />
            </div>

            <div
              v-if="courseProgress(curso) === 100"
              class="absolute top-2 left-2 flex items-center gap-1 bg-emerald-500/90 text-white
                     text-[10px] font-semibold px-2 py-0.5 rounded-full"
            >
              ✓ Concluído
            </div>

            <label
              class="absolute bottom-2 right-2 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md
                     cursor-pointer transition-all duration-150 select-none
                     bg-black/60 border border-white/10 text-white/70
                     hover:bg-primary hover:border-primary hover:text-white
                     opacity-0 group-hover:opacity-100"
              title="Clique para trocar a capa"
            >
              <Loader2 v-if="uploadingFor === curso.nome" class="w-3.5 h-3.5 animate-spin" />
              <Image v-else class="w-3.5 h-3.5" />
              <span>{{ uploadingFor === curso.nome ? "Enviando…" : "Trocar capa" }}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                class="sr-only"
                @change="handleCoverUpload(curso.nome, $event)"
                @click.stop
              />
            </label>
          </div>

          <div class="flex flex-col gap-2.5 p-4 flex-1">
            <h2 class="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-150">
              {{ curso.nome }}
            </h2>

            <div class="flex items-center gap-1.5 text-xs">
              <span class="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-medium">
                {{ curso.modulos.length }} módulo{{ curso.modulos.length !== 1 ? "s" : "" }}
              </span>
              <span class="text-muted-foreground/40">·</span>
              <span class="text-muted-foreground">{{ totalAulas(curso) }} aulas</span>
            </div>

            <div class="mt-auto flex flex-col gap-1.5">
              <div class="flex justify-between text-[11px]">
                <span class="text-muted-foreground">Progresso</span>
                <span
                  :class="courseProgress(curso) === 100
                    ? 'text-emerald-500 font-semibold'
                    : courseProgress(curso) > 0
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground'"
                >
                  {{ courseProgress(curso) === 100 ? "✓ Completo" : courseProgress(curso) + "%" }}
                </span>
              </div>
              <div class="h-1 rounded-full bg-border overflow-hidden">
                <div
                  class="h-full rounded-full transition-[width] duration-500"
                  :class="courseProgress(curso) === 100 ? 'bg-emerald-500' : 'bg-primary'"
                  :style="{ width: courseProgress(curso) + '%' }"
                />
              </div>
            </div>
          </div>

          <div class="h-px bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
        </NuxtLink>
      </div>
    </div>

  </div>
</template>
