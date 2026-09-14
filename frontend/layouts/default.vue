<script setup lang="ts">
import { Library, Settings } from "lucide-vue-next"

const route = useRoute()

const navItems = [
  { to: "/", label: "Biblioteca", icon: Library, match: (p: string) => p === "/" || p.startsWith("/curso/") },
  { to: "/configuracoes", label: "Configurações", icon: Settings, match: (p: string) => p === "/configuracoes" },
]
</script>

<template>
  <div class="h-screen flex bg-background text-foreground overflow-hidden">
    <aside class="w-56 shrink-0 flex flex-col bg-sidebar border-r border-border/60">
      <div class="h-[72px] shrink-0 flex items-end gap-2 px-4 pb-3" style="-webkit-app-region: drag">
        <div class="w-5 h-5 rounded-md bg-primary flex items-center justify-center shrink-0">
          <svg class="w-2.5 h-2.5 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
        <span class="text-sm font-semibold tracking-tight text-sidebar-foreground">LocalPlay</span>
      </div>

      <nav class="flex-1 px-2.5 py-1 flex flex-col gap-0.5">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors duration-100"
          :class="item.match(route.path)
            ? 'bg-primary/15 text-primary'
            : 'text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground'"
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
