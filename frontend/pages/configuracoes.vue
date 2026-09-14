<script setup lang="ts">
import { FolderOpen, Trash2, FolderPlus } from "lucide-vue-next"

const { getSettings, addLibraryPath, removeLibraryPath } = useApi()

const libraries = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref("")

async function load() {
  const data = await getSettings()
  libraries.value = data.libraries
  loading.value = false
}

onMounted(load)

async function chooseFolder() {
  const path = await (window as any).localplay?.chooseLibraryFolder?.()
  if (!path) return

  saving.value = true
  error.value = ""
  try {
    await addLibraryPath(path)
    await load()
  } catch (err: any) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}

async function remove(id: number) {
  saving.value = true
  try {
    await removeLibraryPath(id)
    await load()
  } catch (err: any) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0">
    <header class="h-11 shrink-0 flex items-center px-5 border-b border-border/50">
      <h1 class="text-lg font-semibold">Configurações</h1>
    </header>

    <div class="flex-1 overflow-y-auto px-5 py-6">
      <div class="max-w-lg flex flex-col gap-6">

        <section class="flex flex-col gap-2.5">
          <div class="flex items-center justify-between px-0.5">
            <h2 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Pastas de vídeos
            </h2>
            <button
              class="flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-md
                     border border-border/60 hover:border-primary/60 bg-secondary/60 hover:bg-secondary
                     transition-colors duration-150 disabled:opacity-50"
              :disabled="saving"
              @click="chooseFolder"
            >
              <FolderPlus class="w-3.5 h-3.5" />
              Adicionar
            </button>
          </div>

          <p class="text-xs text-muted-foreground px-0.5">
            Os cursos de todas as pastas abaixo aparecem juntos na Biblioteca.
          </p>

          <div v-if="!loading && !libraries.length"
               class="rounded-lg border border-dashed border-border/60 px-4 py-6 flex flex-col items-center gap-2 text-center">
            <FolderOpen class="w-5 h-5 text-muted-foreground" />
            <p class="text-sm text-muted-foreground">Nenhuma pasta adicionada ainda</p>
          </div>

          <div v-else class="rounded-lg border border-border/50 bg-card overflow-hidden">
            <div
              v-for="(lib, i) in libraries"
              :key="lib.id"
              class="flex items-center justify-between gap-3 px-4 py-2.5"
              :class="{ 'border-t border-border/40': i > 0 }"
            >
              <span class="truncate text-sm text-foreground/90">{{ lib.path }}</span>
              <button
                class="shrink-0 text-muted-foreground hover:text-red-400 transition-colors duration-100"
                :disabled="saving"
                title="Remover pasta"
                @click="remove(lib.id)"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <p v-if="error" class="text-xs text-red-400 px-0.5">{{ error }}</p>
        </section>

      </div>
    </div>
  </div>
</template>
