const { app, Menu, shell, dialog } = require("electron");

const TEXTOS = {
  pt: {
    sobre: "Sobre o LocalPlay",
    servicos: "Serviços",
    ocultar: "Ocultar LocalPlay",
    ocultarOutros: "Ocultar Outros",
    mostrarTodos: "Mostrar Todos",
    sair: "Sair do LocalPlay",
    arquivo: "Arquivo",
    adicionarPasta: "Adicionar Pasta de Vídeos…",
    fecharJanela: "Fechar Janela",
    editar: "Editar",
    copiar: "Copiar",
    selecionarTudo: "Selecionar Tudo",
    exibir: "Exibir",
    biblioteca: "Biblioteca",
    configuracoes: "Configurações",
    recarregar: "Recarregar Biblioteca",
    telaCheia: "Tela Cheia",
    janela: "Janela",
    minimizar: "Minimizar",
    zoom: "Zoom",
    ajuda: "Ajuda",
    idioma: "Idioma",
    reportar: "Reportar um Problema",
    repositorio: "Repositório no GitHub",
    reinicieTitulo: "Idioma alterado",
    reinicieMsg: "O menu será exibido no novo idioma na próxima vez que o LocalPlay for aberto.",
  },
  en: {
    sobre: "About LocalPlay",
    servicos: "Services",
    ocultar: "Hide LocalPlay",
    ocultarOutros: "Hide Others",
    mostrarTodos: "Show All",
    sair: "Quit LocalPlay",
    arquivo: "File",
    adicionarPasta: "Add Video Folder…",
    fecharJanela: "Close Window",
    editar: "Edit",
    copiar: "Copy",
    selecionarTudo: "Select All",
    exibir: "View",
    biblioteca: "Library",
    configuracoes: "Settings",
    recarregar: "Reload Library",
    telaCheia: "Full Screen",
    janela: "Window",
    minimizar: "Minimize",
    zoom: "Zoom",
    ajuda: "Help",
    idioma: "Language",
    reportar: "Report an Issue",
    repositorio: "GitHub Repository",
    reinicieTitulo: "Language changed",
    reinicieMsg: "The menu will use the new language the next time LocalPlay is opened.",
  },
};

const REPO = "https://github.com/rodrigueskaua/localplay-desktop";

function idiomaPadrao(store) {
  const salvo = store.get();
  if (salvo) return salvo;
  return app.getLocale().startsWith("pt") ? "pt" : "en";
}

function construirMenu({ window, store, onNavigate, onAddFolder }) {
  const idioma = idiomaPadrao(store);
  const t = TEXTOS[idioma];

  const trocarIdioma = async (novo) => {
    if (novo === idioma) return;
    store.set(novo);
    aplicarMenu({ window, store, onNavigate, onAddFolder });
    await dialog.showMessageBox(window, {
      type: "info",
      message: TEXTOS[novo].reinicieTitulo,
      detail: TEXTOS[novo].reinicieMsg,
      buttons: ["OK"],
    });
  };

  return Menu.buildFromTemplate([
    {
      label: "LocalPlay",
      submenu: [
        { label: t.sobre, role: "about" },
        { type: "separator" },
        {
          label: t.idioma,
          submenu: [
            { label: "Português", type: "radio", checked: idioma === "pt", click: () => trocarIdioma("pt") },
            { label: "English", type: "radio", checked: idioma === "en", click: () => trocarIdioma("en") },
          ],
        },
        { type: "separator" },
        { label: t.servicos, role: "services" },
        { type: "separator" },
        { label: t.ocultar, role: "hide" },
        { label: t.ocultarOutros, role: "hideOthers" },
        { label: t.mostrarTodos, role: "unhide" },
        { type: "separator" },
        { label: t.sair, role: "quit" },
      ],
    },
    {
      label: t.arquivo,
      submenu: [
        { label: t.adicionarPasta, accelerator: "CmdOrCtrl+O", click: () => onAddFolder() },
        { type: "separator" },
        { label: t.fecharJanela, role: "close" },
      ],
    },
    {
      label: t.editar,
      submenu: [
        { label: t.copiar, role: "copy" },
        { label: t.selecionarTudo, role: "selectAll" },
      ],
    },
    {
      label: t.exibir,
      submenu: [
        { label: t.biblioteca, accelerator: "CmdOrCtrl+1", click: () => onNavigate("/") },
        { label: t.configuracoes, accelerator: "CmdOrCtrl+,", click: () => onNavigate("/configuracoes") },
        { type: "separator" },
        { label: t.recarregar, accelerator: "CmdOrCtrl+R", click: () => window?.webContents.reload() },
        { type: "separator" },
        { label: t.telaCheia, role: "togglefullscreen" },
      ],
    },
    {
      label: t.janela,
      submenu: [
        { label: t.minimizar, role: "minimize" },
        { label: t.zoom, role: "zoom" },
      ],
    },
    {
      label: t.ajuda,
      role: "help",
      submenu: [
        { label: t.repositorio, click: () => shell.openExternal(REPO) },
        { label: t.reportar, click: () => shell.openExternal(`${REPO}/issues/new`) },
      ],
    },
  ]);
}

function aplicarMenu(opcoes) {
  Menu.setApplicationMenu(construirMenu(opcoes));
}

module.exports = { aplicarMenu };
