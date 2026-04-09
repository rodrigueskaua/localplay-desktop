<template>
  <div class="min-h-screen flex flex-col bg-background text-foreground">
    <header class="sticky top-0 z-50 h-14 flex items-center px-6 bg-card border-b border-border">
      <NuxtLink to="/" class="flex items-center gap-2.5 font-bold text-[1.05rem] text-foreground">
        <PlayCircle class="w-5 h-5 text-primary" />
        <span>Local<span class="text-primary">Play</span></span>
      </NuxtLink>
    </header>

    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { PlayCircle } from "lucide-vue-next"
</script>
