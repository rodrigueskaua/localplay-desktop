<script setup lang="ts">
import { ArrowUpCircle, X } from "lucide-vue-next"

const { checarAtualizacao } = useApi()

const versao = ref<string | null>(null)
const atual = ref("")
const pagina = ref("")
const visivel = ref(false)

const CHAVE = "localplay:update-dispensado"
const DIAS_PARA_LEMBRAR = 7

onMounted(async () => {
  try {
    const r = await checarAtualizacao()
    if (!r.disponivel || !r.versao) return
    if (foiDispensada(r.versao)) return
    versao.value = r.versao
    atual.value = (r as any).atual ?? ""
    pagina.value = r.pagina
    visivel.value = true
  } catch {}
})

function foiDispensada(v: string) {
  try {
    const bruto = localStorage.getItem(CHAVE)
    if (!bruto) return false
    const { versao: dispensada, em } = JSON.parse(bruto)
    if (dispensada !== v) return false
    return Date.now() - em < DIAS_PARA_LEMBRAR * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

function dispensar() {
  visivel.value = false
  try {
    if (versao.value) {
      localStorage.setItem(CHAVE, JSON.stringify({ versao: versao.value, em: Date.now() }))
    }
  } catch {}
}

function abrir() {
  const ponte = (window as any).localplay
  if (ponte?.abrirExterno) ponte.abrirExterno(pagina.value)
  else window.open(pagina.value, "_blank")
  dispensar()
}
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-200"
    leave-active-class="transition-all duration-150"
    enter-from-class="opacity-0 -translate-y-1"
    leave-to-class="opacity-0 -translate-y-1"
  >
    <div
      v-if="visivel"
      class="shrink-0 flex items-center gap-2.5 px-5 py-2 bg-primary/10 border-b border-primary/20"
    >
      <ArrowUpCircle class="w-[18px] h-[18px] shrink-0 text-primary" />
      <div class="flex-1 min-w-0 flex flex-wrap items-baseline gap-x-1.5">
        <span class="text-[14px] font-semibold">Versão {{ versao }} disponível</span>
        <span class="text-[13px] text-muted-foreground">
          Você está na {{ atual }}. A atualização é manual.
        </span>
      </div>
      <button
        class="shrink-0 text-[13px] font-medium px-3 py-1 rounded-md bg-primary text-white hover:opacity-90 transition"
        @click="abrir"
      >
        Baixar
      </button>
      <button
        class="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground
               hover:bg-secondary hover:text-foreground transition"
        title="Lembrar depois"
        @click="dispensar"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  </Transition>
</template>
