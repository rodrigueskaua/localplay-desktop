<script setup lang="ts">
import { FileText, ChevronDown } from "lucide-vue-next"

const props = defineProps<{
  docs: { id: string; nome: string; tipo: string }[]
}>()

const { getDoc } = useApi()

const aberto     = ref(false)
const ativoId    = ref<string | null>(null)
const carregando = ref(false)
const erro       = ref<string | null>(null)
const html       = ref("")
const textoPuro  = ref("")

const MARCACAO_MD = /(\*\*|__|^#{1,6}\s|^[-*+]\s|^\d+\.\s|\[.+\]\(.+\)|`)/m

function deveRenderizarMarkdown(tipo: string, conteudo: string) {
  if (tipo !== ".txt") return true
  return MARCACAO_MD.test(conteudo)
}

const cache = new Map<string, string>()

let render: ((md: string) => string) | null = null

async function initRenderer() {
  if (render) return render
  const [{ default: MarkdownIt }, { default: DOMPurify }] = await Promise.all([
    import("markdown-it"),
    import("dompurify"),
  ])
  const md = new MarkdownIt({ html: false, linkify: true, breaks: true })
  render = (src: string) => DOMPurify.sanitize(md.render(src))
  return render
}

async function abrirDoc(id: string) {
  const doc = props.docs.find((d) => d.id === id)
  ativoId.value = id
  erro.value = null
  html.value = ""
  textoPuro.value = ""

  let conteudo = cache.get(id)
  if (conteudo === undefined) {
    carregando.value = true
    try {
      conteudo = (await getDoc(id)).conteudo
      cache.set(id, conteudo)
    } catch (e: any) {
      if (ativoId.value === id) erro.value = e.message ?? "Não foi possível carregar o material."
      return
    } finally {
      if (ativoId.value === id) carregando.value = false
    }
  }

  if (ativoId.value !== id) return

  if (deveRenderizarMarkdown(doc?.tipo ?? "", conteudo)) {
    const r = await initRenderer()
    if (ativoId.value !== id) return
    html.value = r(conteudo)
  } else {
    textoPuro.value = conteudo
  }
}

async function toggle() {
  aberto.value = !aberto.value
  if (aberto.value && !ativoId.value && props.docs.length) {
    await abrirDoc(props.docs[0].id)
  }
}

watch(() => props.docs, () => {
  ativoId.value = null
  html.value = ""
  textoPuro.value = ""
  erro.value = null
  cache.clear()
})
</script>

<template>
  <section v-if="docs.length" class="shrink-0 border-t border-border bg-card">
    <button
      class="w-full flex items-center gap-2 px-4 sm:px-6 py-2.5 text-left
             text-muted-foreground hover:text-foreground transition-colors duration-100"
      @click="toggle"
    >
      <FileText class="w-4 h-4 shrink-0" />
      <span class="text-sm font-semibold text-foreground">Material</span>
      <span class="text-xs text-muted-foreground">{{ docs.length }}</span>
      <ChevronDown
        class="w-4 h-4 ml-auto shrink-0 transition-transform duration-200"
        :class="aberto && 'rotate-180'"
      />
    </button>

    <div v-if="aberto" class="border-t border-border/50">
      <div v-if="docs.length > 1" class="flex gap-1 px-4 sm:px-6 pt-3 flex-wrap">
        <button
          v-for="doc in docs"
          :key="doc.id"
          class="text-xs font-medium px-2.5 py-1 rounded-md border transition"
          :class="ativoId === doc.id
            ? 'border-primary bg-primary/10 text-foreground'
            : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary'"
          @click="abrirDoc(doc.id)"
        >
          {{ doc.nome }}
        </button>
      </div>

      <div class="px-4 sm:px-6 py-4 max-h-[40vh] overflow-y-auto">
        <p v-if="carregando" class="text-sm text-muted-foreground">Carregando…</p>
        <p v-else-if="erro" class="text-sm text-red-400">{{ erro }}</p>
        <pre
          v-else-if="textoPuro"
          class="text-sm leading-relaxed whitespace-pre-wrap break-words font-sans text-foreground/90"
        >{{ textoPuro }}</pre>
        <div v-else class="material-prose" v-html="html" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.material-prose {
  font-size: 0.875rem;
  line-height: 1.7;
  color: hsl(var(--foreground) / 0.9);
}
.material-prose :deep(h1),
.material-prose :deep(h2),
.material-prose :deep(h3) {
  font-weight: 700;
  color: hsl(var(--foreground));
  margin: 1.2em 0 0.5em;
  line-height: 1.3;
}
.material-prose :deep(h1) { font-size: 1.15rem; }
.material-prose :deep(h2) { font-size: 1.05rem; }
.material-prose :deep(h3) { font-size: 0.95rem; }
.material-prose :deep(h1:first-child),
.material-prose :deep(h2:first-child),
.material-prose :deep(h3:first-child) { margin-top: 0; }
.material-prose :deep(p) { margin: 0.7em 0; }
.material-prose :deep(ul),
.material-prose :deep(ol) { margin: 0.7em 0; padding-left: 1.4em; }
.material-prose :deep(ul) { list-style: disc; }
.material-prose :deep(ol) { list-style: decimal; }
.material-prose :deep(li) { margin: 0.25em 0; }
.material-prose :deep(a) {
  color: hsl(var(--primary));
  text-decoration: underline;
  text-underline-offset: 2px;
}
.material-prose :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.85em;
  background: hsl(var(--secondary));
  border: 1px solid hsl(var(--border));
  border-radius: 4px;
  padding: 0.1em 0.35em;
}
.material-prose :deep(pre) {
  background: hsl(var(--secondary));
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
  padding: 0.85em 1em;
  overflow-x: auto;
  margin: 0.8em 0;
}
.material-prose :deep(pre code) {
  background: none;
  border: none;
  padding: 0;
}
.material-prose :deep(blockquote) {
  border-left: 3px solid hsl(var(--border));
  padding-left: 1em;
  margin: 0.8em 0;
  color: hsl(var(--muted-foreground));
}
.material-prose :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0.8em 0;
  font-size: 0.85rem;
}
.material-prose :deep(th),
.material-prose :deep(td) {
  border: 1px solid hsl(var(--border));
  padding: 0.4em 0.6em;
  text-align: left;
}
.material-prose :deep(th) { background: hsl(var(--secondary)); font-weight: 600; }
.material-prose :deep(img) { max-width: 100%; border-radius: 6px; }
.material-prose :deep(hr) { border: 0; border-top: 1px solid hsl(var(--border)); margin: 1.2em 0; }
</style>
