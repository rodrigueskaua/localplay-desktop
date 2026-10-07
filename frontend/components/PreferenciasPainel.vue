<script setup lang="ts">
import { FolderOpen, FolderPlus, Trash2, X } from "lucide-vue-next"

const aberto = defineModel<boolean>({ required: true })
const { getSettings, addLibraryPath, removeLibraryPath } = useApi()

const libraries = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref("")

async function load() {
  loading.value = true
  try {
    libraries.value = (await getSettings()).libraries
  } finally {
    loading.value = false
  }
}

async function chooseFolder() {
  const path = await (window as any).localplay?.chooseLibraryFolder?.()
  if (!path) return
  saving.value = true
  error.value = ""
  try {
    libraries.value = (await addLibraryPath(path)).libraries
    emitirAtualizacao()
  } catch (e: any) {
    error.value = e.message ?? "Não foi possível adicionar a pasta."
  } finally {
    saving.value = false
  }
}

async function remove(id: number) {
  saving.value = true
  error.value = ""
  try {
    libraries.value = (await removeLibraryPath(id)).libraries
    emitirAtualizacao()
  } catch (e: any) {
    error.value = e.message ?? "Não foi possível remover a pasta."
  } finally {
    saving.value = false
  }
}

function emitirAtualizacao() {
  window.dispatchEvent(new CustomEvent("localplay:biblioteca-mudou"))
}

function nomeDaPasta(caminho: string) {
  return caminho.split("/").filter(Boolean).pop() ?? caminho
}

watch(aberto, (v) => { if (v) load() })

function onKey(e: KeyboardEvent) {
  if (e.key === "Escape" && aberto.value) aberto.value = false
  if ((e.metaKey || e.ctrlKey) && e.key === ",") {
    e.preventDefault()
    aberto.value = !aberto.value
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKey)
  window.addEventListener("localplay:adicionar-pasta", chooseFolder as EventListener)
})
onUnmounted(() => {
  window.removeEventListener("keydown", onKey)
  window.removeEventListener("localplay:adicionar-pasta", chooseFolder as EventListener)
})
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-150"
    leave-active-class="transition-opacity duration-100"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="aberto"
      class="absolute inset-0 z-50 flex items-start justify-center bg-black/35 backdrop-blur-[2px] pt-[72px]"
      @click.self="aberto = false"
    >
      <div
        class="w-[520px] max-h-[calc(100%-120px)] flex flex-col rounded-xl bg-card
               ring-1 ring-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.55)] overflow-hidden"
      >
        <header class="h-[44px] shrink-0 flex items-center justify-center relative border-b border-border/40">
          <h2 class="text-[15px] font-semibold">Preferências</h2>
          <button
            class="absolute right-2.5 w-6 h-6 flex items-center justify-center rounded-md
                   text-muted-foreground hover:bg-secondary hover:text-foreground transition"
            title="Fechar"
            @click="aberto = false"
          >
            <X class="w-[18px] h-[18px]" />
          </button>
        </header>

        <div class="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2">
          <div class="flex items-end justify-between gap-3">
            <div class="flex flex-col gap-0.5">
              <h3 class="text-[15px] font-medium">Pastas de vídeos</h3>
              <p class="text-[14px] text-muted-foreground leading-snug">
                Os cursos de todas as pastas aparecem juntos na Biblioteca.
              </p>
            </div>
            <button
              class="shrink-0 flex items-center gap-1.5 text-[14px] font-medium px-2.5 py-[5px]
                     rounded-md bg-secondary hover:bg-border transition disabled:opacity-40"
              :disabled="saving"
              @click="chooseFolder"
            >
              <FolderPlus class="w-[18px] h-[18px]" />
              Adicionar
            </button>
          </div>

          <div class="rounded-lg bg-background/60 ring-1 ring-border/50 overflow-hidden mt-1">
            <p v-if="loading" class="px-4 py-6 text-center text-[15px] text-muted-foreground">
              Carregando…
            </p>
            <div
              v-else-if="!libraries.length"
              class="px-4 py-7 flex flex-col items-center gap-1.5 text-center"
            >
              <FolderOpen class="w-5 h-5 text-muted-foreground/70" />
              <p class="text-[15px] text-muted-foreground">Nenhuma pasta adicionada</p>
            </div>

            <div
              v-for="(lib, i) in libraries"
              v-else
              :key="lib.id"
              class="group flex items-center gap-2.5 pl-3 pr-1.5 py-2 min-h-[40px]"
              :class="{ 'border-t border-border/30': i > 0 }"
            >
              <FolderOpen class="w-5 h-5 shrink-0 text-muted-foreground/80" />
              <div class="flex-1 min-w-0 flex flex-col">
                <span class="text-[15px] truncate">{{ nomeDaPasta(lib.path) }}</span>
                <span class="text-[13px] text-muted-foreground truncate">{{ lib.path }}</span>
              </div>
              <button
                class="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground
                       opacity-0 group-hover:opacity-100 focus:opacity-100
                       hover:bg-border hover:text-red-400 transition disabled:opacity-40"
                :disabled="saving"
                title="Remover pasta"
                @click="remove(lib.id)"
              >
                <Trash2 class="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>

          <p v-if="error" class="text-[14px] text-red-400">{{ error }}</p>
        </div>
      </div>
    </div>
  </Transition>
</template>
