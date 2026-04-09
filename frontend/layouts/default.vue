<template>
  <div class="app-shell">
    <header class="topbar">
      <NuxtLink to="/" class="logo">
        <span class="logo-icon">▶</span>
        <span class="logo-text">LocalPlay</span>
      </NuxtLink>
    </header>

    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--text);
}

.topbar {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--text);
  font-weight: 700;
  font-size: 1.1rem;
}

.logo-icon {
  color: var(--accent);
  font-size: 1.3rem;
}

.main-content {
  flex: 1;
  padding: 32px 24px;
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
}
</style>
