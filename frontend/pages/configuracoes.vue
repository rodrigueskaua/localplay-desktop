<script setup lang="ts">
import { FolderOpen, Check } from "lucide-vue-next"

const { getSettings, setLibraryPath } = useApi()

const active = ref<any>(null)
const libraries = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref("")

async function load() {
  const data = await getSettings()
  active.value = data.active
  libraries.value = data.libraries
  loading.value = false
}

onMounted(load)

async function chooseFolder() {
  const path = await (window as any).localplay?.chooseLibraryFolder?.()
  if (!path) return
  await selectPath(path)
}

async function selectPath(path: string) {
  saving.value = true
  error.value = ""
  try {
    await setLibraryPath(path)
    await load()
  } catch (err: any) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="flex-1 flex flex-col items-center px-6 py-10 gap-8">
    <h1 class="text-lg font-semibold">Configurações</h1>

    <div class="w-full max-w-xl flex flex-col gap-4">
      <div class="rounded-2xl border border-border/50 bg-card p-5 flex flex-col gap-3">
        <span class="text-sm font-semibold">Pasta de vídeos</span>
        <p v-if="active" class="text-xs text-muted-foreground break-all">{{ active.path }}</p>
        <p v-else class="text-xs text-muted-foreground">Nenhuma pasta configurada.</p>

        <button
          class="self-start flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-md
                 border border-border/60 hover:border-primary/60 bg-secondary/60 hover:bg-secondary
                 transition-colors duration-150 disabled:opacity-50"
          :disabled="saving"
          @click="chooseFolder"
        >
          <FolderOpen class="w-3.5 h-3.5" />
          Escolher pasta
        </button>

        <p v-if="error" class="text-xs text-red-400">{{ error }}</p>
      </div>

      <div v-if="!loading && libraries.length > 1" class="rounded-2xl border border-border/50 bg-card p-5 flex flex-col gap-2">
        <span class="text-sm font-semibold mb-1">Pastas recentes</span>
        <button
          v-for="lib in libraries"
          :key="lib.id"
          class="flex items-center justify-between gap-2 text-xs px-3 py-2 rounded-md
                 border border-border/40 hover:border-primary/40 transition-colors duration-150 text-left"
          :disabled="saving"
          @click="selectPath(lib.path)"
        >
          <span class="truncate">{{ lib.path }}</span>
          <Check v-if="active?.id === lib.id" class="w-3.5 h-3.5 text-primary shrink-0" />
        </button>
      </div>
    </div>
  </div>
</template>
