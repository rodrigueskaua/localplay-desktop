<script setup lang="ts">
import { ChevronLeft } from "lucide-vue-next"

const route = useRoute()
const isInsideCurso = computed(() => route.path.startsWith("/curso/"))
</script>

<template>
  <div class="min-h-screen flex flex-col bg-background text-foreground">
    <header class="sticky top-0 z-50 flex items-center py-3 px-4
                   border-b border-border/40 bg-background/80 backdrop-blur-md
                   supports-[backdrop-filter]:bg-background/60">

      <!-- Voltar (só aparece dentro de curso) -->
      <NuxtLink
        v-if="isInsideCurso"
        to="/"
        class="flex items-center gap-1.5 text-xs font-medium text-foreground/80 hover:text-foreground
               transition-all duration-150 px-3 py-1.5 rounded-md
               border border-border/60 hover:border-border bg-secondary/60 hover:bg-secondary"
      >
        <ChevronLeft class="w-3.5 h-3.5" />
        Biblioteca
      </NuxtLink>
      <div v-else class="w-24" />

      <!-- Logo centralizado -->
      <NuxtLink to="/" class="flex-1 flex items-center justify-center gap-2.5 select-none">
        <div class="relative flex items-center justify-center w-7 h-7">
          <div class="absolute inset-0 rounded-full bg-primary/20 blur-sm"></div>
          <svg class="relative w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
        <span class="text-sm font-bold tracking-tight text-foreground">
          Local<span class="text-primary">Play</span>
        </span>
      </NuxtLink>

      <!-- Espaço direito para balancear -->
      <div class="w-24" />
    </header>

    <main class="flex-1 flex flex-col">
      <slot />
    </main>
  </div>
</template>
