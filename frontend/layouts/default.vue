<script setup lang="ts">
const router = useRouter()
const prefsAberto = useState("prefsAberto", () => false)

onMounted(() => {
  const ponte = (window as any).localplay
  if (!ponte) return
  ponte.onNavegar?.((rota: string) => {
    if (rota === "/configuracoes") prefsAberto.value = true
    else router.push(rota)
  })
  ponte.onAdicionarPasta?.(() => {
    prefsAberto.value = true
    nextTick(() => window.dispatchEvent(new CustomEvent("localplay:adicionar-pasta")))
  })
})
</script>

<template>
  <div class="h-screen flex flex-col bg-background text-foreground overflow-hidden">
    <main class="flex-1 min-h-0 flex flex-col overflow-hidden">
      <slot />
    </main>
    <PreferenciasPainel v-model="prefsAberto" />
  </div>
</template>
