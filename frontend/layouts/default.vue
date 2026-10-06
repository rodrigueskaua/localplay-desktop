<script setup lang="ts">
import { Library, Settings } from "lucide-vue-next"

const route = useRoute()
const router = useRouter()

onMounted(() => {
  const ponte = (window as any).localplay
  if (!ponte) return
  ponte.onNavegar?.((rota: string) => router.push(rota))
  ponte.onAdicionarPasta?.(() => router.push("/configuracoes?adicionar=1"))
})

const navItems = [
  { to: "/", label: "Biblioteca", icon: Library, match: (p: string) => p === "/" || p.startsWith("/curso/") },
  { to: "/configuracoes", label: "Configurações", icon: Settings, match: (p: string) => p === "/configuracoes" },
]
</script>

<template>
  <div class="h-screen flex bg-background text-foreground overflow-hidden">
    <aside class="w-56 shrink-0 flex flex-col bg-sidebar border-r border-border/60">
      <div class="h-[52px] shrink-0 flex items-center gap-2 pl-[78px] pr-3" style="-webkit-app-region: drag">
        <div class="w-[18px] h-[18px] rounded-[5px] bg-primary flex items-center justify-center shrink-0">
          <svg class="w-2 h-2 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
        <span class="text-[13px] font-semibold tracking-tight text-sidebar-foreground">LocalPlay</span>
      </div>

      <nav class="flex-1 px-2.5 pt-1 pb-2 flex flex-col gap-px">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2.5 px-2 py-[5px] rounded-md text-[13px] font-medium transition-colors duration-100"
          :class="item.match(route.path)
            ? 'bg-white/[0.11] text-sidebar-foreground'
            : 'text-sidebar-foreground/65 hover:bg-white/[0.055] hover:text-sidebar-foreground'"
        >
          <component :is="item.icon" class="w-4 h-4 shrink-0" />
          {{ item.label }}
        </NuxtLink>
      </nav>
    </aside>

    <main class="flex-1 min-w-0 flex flex-col overflow-hidden">
      <slot />
    </main>
  </div>
</template>
