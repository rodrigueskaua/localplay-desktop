<script setup lang="ts">
withDefaults(defineProps<{ tamanho?: number; pulsando?: boolean }>(), {
  tamanho: 24,
  pulsando: false,
})
</script>

<template>
  <svg
    :width="tamanho"
    :height="tamanho"
    viewBox="375 302 420 420"
    fill="none"
    :class="pulsando && 'marca-pulsa'"
  >
    <defs>
      <linearGradient :id="`mp${tamanho}`" x1="0.1" y1="0" x2="0.9" y2="1">
        <stop offset="0" stop-color="#58A6FF" />
        <stop offset="1" stop-color="#1C6FD6" />
      </linearGradient>
    </defs>
    <path
      d="M426 356 L426 668 Q426 702 455 685 L716 528 Q745 511 716 494 L455 339 Q426 322 426 356 Z"
      :fill="`url(#mp${tamanho})`"
    />
  </svg>
</template>

<style scoped>
.marca-pulsa {
  animation: marca-pulsa 1.4s ease-in-out infinite;
}

@keyframes marca-pulsa {
  0%, 100% { opacity: 0.35; transform: scale(0.92); }
  50%      { opacity: 1;    transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .marca-pulsa { animation: none; opacity: 0.8; }
}
</style>
