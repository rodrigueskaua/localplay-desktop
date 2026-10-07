import { APP_VERSION, RELEASES_API, RELEASES_PAGE } from "../config.js";

const INTERVALO_CACHE = 6 * 60 * 60 * 1000;

let cache = { em: 0, dados: null };

function partes(versao) {
  return String(versao).replace(/^v/, "").split(".").map((n) => parseInt(n, 10) || 0);
}

export function eMaisNova(remota, local) {
  const a = partes(remota);
  const b = partes(local);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x !== y) return x > y;
  }
  return false;
}

export async function verificarAtualizacao() {
  const agora = Date.now();
  if (cache.dados && agora - cache.em < INTERVALO_CACHE) return cache.dados;

  const controlador = new AbortController();
  const limite = setTimeout(() => controlador.abort(), 5000);

  try {
    const res = await fetch(RELEASES_API, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controlador.signal,
    });
    if (!res.ok) throw new Error(String(res.status));

    const release = await res.json();
    const versao = String(release.tag_name ?? "").replace(/^v/, "");

    const dados = {
      atual: APP_VERSION,
      disponivel: versao && eMaisNova(versao, APP_VERSION),
      versao: versao || null,
      pagina: release.html_url ?? RELEASES_PAGE,
    };

    cache = { em: agora, dados };
    return dados;
  } catch {
    return { atual: APP_VERSION, disponivel: false, versao: null, pagina: RELEASES_PAGE };
  } finally {
    clearTimeout(limite);
  }
}
