export default defineNuxtConfig({
  devtools: { enabled: false },

  ssr: false,

  modules: [
    "@nuxtjs/tailwindcss",
    "shadcn-nuxt",
  ],

  vite: {
    optimizeDeps: {
      include: ["plyr"],
    },
    css: {
      preprocessorOptions: {},
    },
  },

  tailwindcss: {
    cssPath: "~/assets/css/main.css",
  },


  shadcn: {
    prefix: "",
    componentDir: "./components/ui",
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? "http://localhost:8000",
    },
  },

  app: {
    head: {
      title: "LocalPlay",
      meta: [{ name: "viewport", content: "width=device-width, initial-scale=1" }],
      link: [],
    },
  },
})
