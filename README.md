<img src="docs/screenshots/icon.png" alt="LocalPlay" width="72" height="72">

# LocalPlay

[![Release](https://img.shields.io/github/v/release/rodrigueskaua/localplay-desktop?label=release)](https://github.com/rodrigueskaua/localplay-desktop/releases/latest)
[![Platform](https://img.shields.io/badge/platform-macOS-lightgrey)](https://github.com/rodrigueskaua/localplay-desktop/releases/latest)
[![License](https://img.shields.io/github/license/rodrigueskaua/localplay-desktop)](LICENSE)

**Player desktop para cursos, treinamentos e conteúdos em vídeo.**

O LocalPlay transforma **qualquer pasta de vídeos em uma experiência semelhante a uma plataforma de cursos**, com biblioteca, aulas, progresso na aula e conclusão.

Basta selecionar uma pasta e começar a assistir. **Tudo fica salvo localmente no seu Mac**, sem upload, servidor ou internet.

## Features

- Seleção de uma ou mais pastas de vídeo
- Biblioteca organizada como uma plataforma de cursos
- Capas geradas automaticamente a partir dos próprios vídeos
- Progresso por aula, retomada de onde parou e avanço automático para a próxima aula
- Marcação de aulas concluídas
- Velocidade de reprodução
- Material de apoio junto da aula: arquivos de texto lidos na própria tela e demais arquivos abertos no app do sistema
- 100% offline, nenhum dado sai da máquina

<div align="center">
  <img src="docs/screenshots/biblioteca.png" alt="Tela da Biblioteca" width="800">
  <img src="docs/screenshots/curso.png" alt="Tela de um curso" width="800">
</div>

## Download

Acesse a [página de releases](https://github.com/rodrigueskaua/localplay-desktop/releases/latest) e baixe o instalador do seu Mac:

| Mac | Arquivo |
|---|---|
| Apple Silicon (M1, M2, M3, M4) | `LocalPlay-<versão>-arm64.dmg` |
| Intel | `LocalPlay-<versão>.dmg` |

1. Abra o `.dmg` e arraste o LocalPlay para a pasta Aplicativos
2. Na primeira abertura, remova a quarentena do download:

```sh
sudo xattr -dr com.apple.quarantine /Applications/LocalPlay.app
```

O app ainda não é assinado pela Apple, e por isso o macOS pode mostrar a mensagem "LocalPlay está danificado e não pode ser aberto". O arquivo está íntegro: a mensagem vem da quarentena aplicada a downloads, que o comando acima remove. Em versões recentes do macOS, o atalho de clicar com o botão direito e escolher "Abrir" pode não resolver nesse caso.

## Stack

<a href="https://www.electronjs.org/" target="_blank">
  <img src="https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=electron&logoColor=white" alt="Electron Badge" />
</a>
<a href="https://nuxt.com/" target="_blank">
  <img src="https://img.shields.io/badge/Nuxt-00DC82?style=for-the-badge&logo=nuxtdotjs&logoColor=white" alt="Nuxt Badge" />
</a>
<a href="https://vuejs.org/" target="_blank">
  <img src="https://img.shields.io/badge/Vue.js-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white" alt="Vue Badge" />
</a>
<a href="https://www.fastify.io/" target="_blank">
  <img src="https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white" alt="Fastify Badge" />
</a>
<a href="https://tailwindcss.com/" target="_blank">
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind Badge" />
</a>
<a href="https://www.sqlite.org/" target="_blank">
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite Badge" />
</a>
<a href="https://orm.drizzle.team/" target="_blank">
  <img src="https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black" alt="Drizzle Badge" />
</a>

### Bibliotecas complementares

[better-sqlite3](https://github.com/WiseLibs/better-sqlite3) <br>
[electron-builder](https://www.electron.build/) <br>
[Plyr](https://plyr.io/) <br>
[Lucide Icons](https://lucide.dev/) <br>
[VueUse](https://vueuse.org/) <br>

## Roadmap

Em andamento:

- [ ] Windows e Linux
- [ ] Auto-update via `electron-updater` (depende da assinatura)

Próximos:

- [ ] Reconhecer vídeos pelo conteúdo, e não só pela extensão, para arquivos de download sem extensão
- [ ] Favoritar e ocultar bibliotecas
- [ ] Testes automatizados (backend e fluxo de biblioteca)
- [ ] CI no GitHub Actions (lint, testes e build da release)

## Desenvolvimento

### Pré-requisitos

- Node.js >= 20
- npm >= 10

### Instalação

```sh
git clone https://github.com/rodrigueskaua/localplay-desktop.git
cd localplay-desktop
npm run install:all
```

### Rodar em modo desenvolvimento

```sh
npm run dev
```

### Gerar o instalador (.dmg) para Mac

```sh
cd frontend && npm run generate
cd ../electron && npm run dist:mac
```

O instalador é gerado em `electron/dist/`.
