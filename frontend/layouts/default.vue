<template>
  <div class="min-h-screen flex flex-col bg-background text-foreground">
    <header class="sticky top-0 z-50 flex items-center justify-center py-4 px-6
                   border-b border-border/40 bg-background/80 backdrop-blur-md
                   supports-[backdrop-filter]:bg-background/60">
      <div class="flex items-center gap-2.5 select-none">
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="absolute inset-0 rounded-full bg-primary/20 blur-sm"></div>
          <svg class="relative w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
        <span class="text-base font-bold tracking-tight text-foreground">
          Local<span class="text-primary">Play</span>
        </span>
      </div>
    </header>

    <main class="flex-1 flex flex-col">
      <slot />
    </main>
  </div>
</template>
