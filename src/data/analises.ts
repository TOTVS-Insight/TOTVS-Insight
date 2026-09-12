import { translate } from "@/i18n/translate";

/** Site publicado sem o servidor de análise, ou servidor parado. */
export class ServicoAnaliseIndisponivelError extends Error {}

export interface TrechoAnalise {
  trecho: number;
  texto: string;
  inicio: number;
  fim: number;
  rotulo_modelo: "risco" | "neutro" | null;
  score_modelo: number | null;
  motivo: string;
  recomendacao: string;
}
export interface ResumoAnalise {
  id: string;
  id_reuniao: string;
  criado_em: string;
  total_trechos: number;
  trechos_com_alerta: number;
  trechos_sem_contexto: number;
  versao_modelo: string;
  /** Maior score entre os trechos classificados; `null` se nenhum foi. */
  score_max: number | null;
  /** Termos mais frequentes nos trechos de risco (vem só na listagem). */
  termos_risco: string[];
}
export interface Analise extends ResumoAnalise {
  aviso: string;
  trechos: TrechoAnalise[];
}
/** O backend responde só em português; a mensagem exibida sai do status HTTP. */
const ERRO_POR_STATUS: Record<number, string> = {
  400: "analysis.errors.badRequest",
  403: "analysis.errors.forbidden",
  404: "analysis.errors.notFound",
  413: "analysis.errors.tooLarge",
  415: "analysis.errors.badRequest",
  500: "analysis.errors.server",
};
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, options);
  } catch {
    throw new ServicoAnaliseIndisponivelError(translate("analysis.errors.unavailable"));
  }
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new ServicoAnaliseIndisponivelError(translate("analysis.errors.openLocal"));
  }
  const result = await response.json();
  if (!response.ok) throw new Error(translate(ERRO_POR_STATUS[response.status] ?? "analysis.errors.generic"));
  return result as T;
}
/** Métricas de validação do modelo em uso (`null` se o backend não tiver o arquivo). */
export interface QualidadeModelo {
  precision: number;
  recall: number;
  n_treino: number;
}
export async function obterQualidadeModelo(): Promise<QualidadeModelo | null> {
  try {
    return (await request<{ qualidade: QualidadeModelo | null }>("/health")).qualidade;
  } catch (erro) {
    if (!(erro instanceof ServicoAnaliseIndisponivelError)) throw erro;
    return publicado<QualidadeModelo>(URL_QUALIDADE);
  }
}

/*
 * Publicação sem o servidor de análise: `backend/exportar_analises.py` grava as
 * análises já feitas em `public/data/analises/`, e a leitura cai para lá quando
 * a API não responde. Gerar análise nova continua exigindo o servidor.
 */
const BASE = import.meta.env.BASE_URL;
const URL_INDICE = `${BASE}data/analises/index.json`;
const URL_QUALIDADE = `${BASE}data/analises/qualidade.json`;
const URL_ANALISE = (id: string) => `${BASE}data/analises/${encodeURIComponent(id)}.json`;
const URL_TRANSCRICAO = (id: string) => `${BASE}data/transcricoes/${encodeURIComponent(id)}.json`;

/** Lê um arquivo publicado junto com o site. `null` quando ele não existe. */
async function publicado<T>(url: string): Promise<T | null> {
  let resposta: Response;
  try {
    resposta = await fetch(url);
  } catch {
    return null;
  }
  // O dev server responde index.html para caminho desconhecido; checar o tipo evita erro de parse.
  if (!resposta.ok || !resposta.headers.get("content-type")?.includes("json")) return null;
  return (await resposta.json()) as T;
}

/**
 * O export não repete o texto de cada trecho: ele é recortado da transcrição
 * pelos campos `inicio` e `fim`. Sem a transcrição publicada, o texto fica vazio
 * e o resto da análise continua legível.
 */
async function comTextoDosTrechos(analise: Analise): Promise<Analise> {
  if (analise.trechos.every((t) => t.texto)) return analise;
  const transcricao = await publicado<{ texto: string }>(URL_TRANSCRICAO(analise.id_reuniao));
  if (!transcricao) return analise;
  return {
    ...analise,
    trechos: analise.trechos.map((t) => ({
      ...t,
      texto: t.texto || transcricao.texto.slice(t.inicio, t.fim),
    })),
  };
}

/*
 * Criar análise exige o servidor Python. Num site publicado ele não existe, e a
 * UI esconde essas ações em vez de oferecer um botão que só mostra aviso.
 * A resposta é guardada: uma sonda por carregamento de página basta.
 */
let sondaServico: Promise<boolean> | null = null;

export function podeCriarAnalise(): Promise<boolean> {
  sondaServico ??= request<unknown>("/health")
    .then(() => true)
    .catch((erro) => {
      if (erro instanceof ServicoAnaliseIndisponivelError) return false;
      throw erro;
    });
  return sondaServico;
}

export async function listarAnalises(): Promise<ResumoAnalise[]> {
  try {
    return await request<ResumoAnalise[]>("/analises");
  } catch (erro) {
    if (!(erro instanceof ServicoAnaliseIndisponivelError)) throw erro;
    const estatico = await publicado<ResumoAnalise[]>(URL_INDICE);
    if (!estatico) throw erro;
    return estatico;
  }
}

export async function obterAnalise(id: string): Promise<Analise> {
  try {
    return await request<Analise>(`/analises/${encodeURIComponent(id)}`);
  } catch (erro) {
    if (!(erro instanceof ServicoAnaliseIndisponivelError)) throw erro;
    const estatico = await publicado<Analise>(URL_ANALISE(id));
    if (!estatico) throw erro;
    return comTextoDosTrechos(estatico);
  }
}
export async function analisarReuniao(id_reuniao: string, texto: string): Promise<Analise> {
  const result = await request<Analise>("/analises", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_reuniao, texto }),
  });
  window.dispatchEvent(new Event("analises-atualizadas"));
  return result;
}
