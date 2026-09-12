/**
 * CAMADA ÚNICA DE ACESSO A DADOS
 * ══════════════════════════════
 *
 * Nenhum componente lê arquivo, faz fetch ou conhece o formato da origem. Todos
 * passam por estas funções. Para trocar os arquivos estáticos por uma API,
 * reescreva apenas `carregarIndice()` e `getTranscricao()` — as assinaturas
 * públicas e os tipos permanecem os mesmos.
 *
 * Origem atual: `public/data/`, gerado por `pnpm data:build` a partir do dump
 * NDJSON em `data-source/`.
 */

import { getActiveLocale } from "@/i18n/types";
import { translate } from "@/i18n/translate";
import { listarAnalises } from "./analises";
import { getTextoUpload, listarUploads } from "./sessionUploads";
import {
  DadosIndisponiveisError,
  type Cliente,
  type DetalheCliente,
  type Fatia,
  type IndiceReunioes,
  type Kpi,
  type ResumoNps,
  type Reuniao,
  type TranscricaoCompleta,
} from "./types";

const BASE = import.meta.env.BASE_URL;
const INDICE_URL = `${BASE}data/meetings-index.json`;
const TRANSCRICAO_URL = (id: string) => `${BASE}data/transcricoes/${id}.json`;

/** Campos que precisam existir em cada reunião para as telas funcionarem. */
const CAMPOS_ESPERADOS: (keyof Reuniao)[] = [
  "id",
  "data",
  "formato",
  "status",
  "duracao",
  "duracaoSegundos",
  "codt",
  "locutores",
];

// ─── Carga e cache ───────────────────────────────────────────────────────────

/*
 * O índice é imutável durante a sessão, então a promise é memoizada: várias
 * telas podem pedir os dados em paralelo e só um fetch acontece.
 */
let indicePromise: Promise<IndiceReunioes> | null = null;

async function carregarIndice(): Promise<IndiceReunioes> {
  let resposta: Response;
  try {
    resposta = await fetch(INDICE_URL);
  } catch {
    throw new DadosIndisponiveisError(
      translate("errors.unreachable"),
      translate("errors.unreachableHint"),
    );
  }

  if (!resposta.ok) {
    throw new DadosIndisponiveisError(
      translate("errors.notFoundHttp", { status: resposta.status }),
      translate("errors.buildHint"),
    );
  }

  /*
   * O dev server do Vite responde 200 com o index.html para qualquer caminho
   * desconhecido (fallback de SPA). Sem esta checagem, um arquivo ausente em
   * desenvolvimento vira um erro de parse enganoso em vez de "não encontrado".
   */
  const tipo = resposta.headers.get("content-type") ?? "";
  if (!tipo.includes("json")) {
    throw new DadosIndisponiveisError(translate("errors.notFound"), translate("errors.buildHint"));
  }

  let dados: IndiceReunioes;
  try {
    dados = await resposta.json();
  } catch {
    throw new DadosIndisponiveisError(translate("errors.corrupt"), translate("errors.rebuildHint"));
  }

  if (!dados || !Array.isArray(dados.reunioes)) {
    throw new DadosIndisponiveisError(
      translate("errors.unexpected"),
      translate("errors.scriptHint"),
    );
  }

  if (dados.reunioes.length === 0) {
    throw new DadosIndisponiveisError(translate("errors.empty"), translate("errors.sourceHint"));
  }

  /*
   * Valida o schema numa amostra. Se uma coluna esperada sumiu na origem, a
   * falha aparece aqui com o nome do campo, em vez de virar `undefined` no meio
   * de uma tabela.
   */
  const amostra = dados.reunioes[0];
  const ausentes = CAMPOS_ESPERADOS.filter((campo) => !(campo in amostra));
  if (ausentes.length > 0) {
    throw new DadosIndisponiveisError(
      translate("errors.schema", { fields: ausentes.join(", ") }),
      translate("errors.schemaHint"),
    );
  }

  return dados;
}

/** Índice completo, já ordenado da reunião mais recente para a mais antiga. */
export function getIndice(): Promise<IndiceReunioes> {
  indicePromise ??= carregarIndice().catch((err) => {
    // Não guarda a falha em cache: a próxima tentativa refaz o fetch.
    indicePromise = null;
    throw err;
  });
  return indicePromise;
}

/** Todas as reuniões, da mais recente para a mais antiga (uploads locais no topo). */
export async function getReunioes(): Promise<Reuniao[]> {
  const base = (await getIndice()).reunioes;
  const extras = listarUploads().map((u) => u.reuniao);
  if (extras.length === 0) return base;
  const ids = new Set(extras.map((r) => r.id));
  return [...extras, ...base.filter((r) => !ids.has(r.id))];
}

/**
 * Se os textos das transcrições foram publicados junto com o índice.
 *
 * Builds gerados com `--sem-transcricoes` trazem só metadados, para não expor
 * conversas de clientes num deploy sem autenticação de servidor.
 */
export async function transcricoesDisponiveis(): Promise<boolean> {
  return (await getIndice()).transcricoesDisponiveis !== false;
}

/**
 * Texto completo de uma reunião. Cada transcrição vive num arquivo próprio e é
 * buscada só quando alguém realmente abre a reunião. Uploads da sessão têm
 * prioridade sobre o disco. Devolve `null` quando o arquivo não existe nesta
 * cópia do projeto.
 */
export async function getTranscricao(id: string): Promise<TranscricaoCompleta | null> {
  const local = getTextoUpload(id);
  if (local !== undefined) return { id, texto: local };

  let resposta: Response;
  try {
    resposta = await fetch(TRANSCRICAO_URL(id));
  } catch {
    throw new DadosIndisponiveisError(
      translate("errors.transcriptLoad"),
      translate("errors.transcriptLoadHint"),
    );
  }

  const tipo = resposta.headers.get("content-type") ?? "";

  /*
   * O índice versionado anuncia os textos, mas `transcricoes/` fica fora do git.
   * Num clone sem `data:build` o arquivo não existe (404, ou o index.html do
   * fallback de SPA no Vite): mostra "não publicado" em vez de erro.
   */
  if (resposta.status === 404 || (resposta.ok && !tipo.includes("json"))) return null;

  if (!resposta.ok) {
    throw new DadosIndisponiveisError(
      translate("errors.transcriptNotFound", { id }),
      translate("errors.transcriptRebuild"),
    );
  }

  return resposta.json();
}

// ─── Agregações ──────────────────────────────────────────────────────────────

function formatarHoras(segundos: number): string {
  const horas = segundos / 3600;
  if (horas >= 100) return `${Math.round(horas).toLocaleString(getActiveLocale())} h`;
  return `${horas.toFixed(1).replace(".", ",")} h`;
}

function formatarMinutos(segundos: number): string {
  return `${Math.round(segundos / 60)} min`;
}

/**
 * Indicadores do topo do dashboard.
 *
 * Todos saem direto da base. Os cards antigos — Oportunidades, Risco de Churn,
 * Sentimento e Prioridade Alta — foram trocados porque nenhum deles tem coluna
 * de origem: derivá-los exigiria análise de linguagem sobre as transcrições.
 */
export async function getKpis(): Promise<Kpi[]> {
  const [reunioes, analises] = await Promise.all([
    getReunioes(),
    // Sem o serviço de análise o dashboard continua abrindo; só este KPI fica "—".
    listarAnalises().catch(() => null),
  ]);
  const locale = getActiveLocale();
  const idsAnalisados = analises && new Set(analises.map((a) => a.id_reuniao));
  const analisadas = idsAnalisados ? reunioes.filter((r) => idsAnalisados.has(r.id)).length : null;

  const segundosTotais = reunioes.reduce((s, r) => s + r.duracaoSegundos, 0);
  const clientes = new Set(reunioes.map((r) => r.codt)).size;
  const nps = resumirNps(reunioes);
  const mediaMin = formatarMinutos(segundosTotais / reunioes.length);
  const reunioesPorCliente = (reunioes.length / clientes).toLocaleString(locale, {
    maximumFractionDigits: 1,
  });

  return [
    {
      id: "reunioes",
      titulo: translate("kpi.meetings"),
      valor: analisadas !== null ? analisadas.toLocaleString(locale) : "—",
      detalhe: translate("kpi.meetingsDetail", {
        total: reunioes.length.toLocaleString(locale),
        periodo: periodoCoberto(reunioes),
      }),
    },
    {
      id: "horas",
      titulo: translate("kpi.hours"),
      valor: formatarHoras(segundosTotais),
      detalhe: translate("kpi.hoursDetail", { min: mediaMin }),
    },
    {
      id: "clientes",
      titulo: translate("kpi.clients"),
      valor: clientes.toLocaleString(locale),
      detalhe: translate("kpi.clientsDetail", { n: reunioesPorCliente }),
    },
    {
      id: "nps",
      titulo: translate("kpi.nps"),
      valor: nps.score !== null ? String(nps.score) : "—",
      detalhe:
        nps.respondentes > 0
          ? translate("kpi.npsDetail", {
              n: nps.respondentes,
              m: nps.media?.toLocaleString(locale, { maximumFractionDigits: 1 }) ?? "—",
            })
          : translate("kpi.npsEmpty"),
    },
  ];
}

/** Intervalo de datas coberto pela base, ex.: "nov/2025 – abr/2026". */
function periodoCoberto(reunioes: Reuniao[]): string {
  if (reunioes.length === 0) return "—";
  // O índice já vem ordenado do mais recente para o mais antigo.
  const recente = reunioes[0].data;
  const antiga = reunioes[reunioes.length - 1].data;
  return `${mesAno(antiga)} – ${mesAno(recente)}`;
}

function mesAno(data: string): string {
  const d = new Date(data.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return data.slice(0, 7);
  return d
    .toLocaleDateString(getActiveLocale(), { month: "short", year: "numeric" })
    .replace(".", "");
}

/** Recorte de NPS. Considera apenas as reuniões que têm nota. */
export function resumirNps(reunioes: Reuniao[]): ResumoNps {
  const notas = reunioes.map((r) => r.nps).filter((n): n is number => n !== null);

  if (notas.length === 0) {
    return {
      respondentes: 0,
      media: null,
      promotores: 0,
      neutros: 0,
      detratores: 0,
      score: null,
    };
  }

  const promotores = notas.filter((n) => n >= 9).length;
  const neutros = notas.filter((n) => n >= 7 && n <= 8).length;
  const detratores = notas.filter((n) => n <= 6).length;
  const media = notas.reduce((s, n) => s + n, 0) / notas.length;

  return {
    respondentes: notas.length,
    media,
    promotores,
    neutros,
    detratores,
    score: Math.round((promotores / notas.length) * 100 - (detratores / notas.length) * 100),
  };
}

/** Distribuição das reuniões por um campo, da fatia maior para a menor. */
export function distribuirPor(reunioes: Reuniao[], campo: keyof Reuniao, limite = 6): Fatia[] {
  const contagem = new Map<string, number>();

  for (const r of reunioes) {
    const valor = r[campo];
    if (valor === null || valor === undefined || valor === "") continue;
    const chave = String(valor);
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
  }

  const total = [...contagem.values()].reduce((s, n) => s + n, 0);
  if (total === 0) return [];

  return [...contagem.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limite)
    .map(([rotulo, quantidade]) => ({
      rotulo,
      quantidade,
      percentual: Math.round((quantidade / total) * 100),
    }));
}

/** Volume de reuniões por mês, do mais antigo para o mais recente. */
export async function getVolumeMensal(): Promise<Fatia[]> {
  const reunioes = await getReunioes();
  const contagem = new Map<string, number>();

  for (const r of reunioes) {
    const chave = r.data.slice(0, 7); // AAAA-MM
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
  }

  const total = reunioes.length;
  return [...contagem.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([rotulo, quantidade]) => ({
      rotulo,
      quantidade,
      percentual: Math.round((quantidade / total) * 100),
    }));
}

/** Tudo que o dashboard precisa, numa chamada só. */
export interface ResumoDashboard {
  kpis: Kpi[];
  recentes: Reuniao[];
  volumeMensal: Fatia[];
  porSegmento: Fatia[];
  porUf: Fatia[];
  porUnidade: Fatia[];
}

/**
 * Ponto de entrada do dashboard.
 *
 * Concentra aqui toda a agregação para que a página seja só apresentação — e
 * para que trocar a origem por uma API não exija tocar em nenhum componente.
 */
export async function getResumoDashboard(): Promise<ResumoDashboard> {
  const reunioes = await getReunioes();

  return {
    kpis: await getKpis(),
    recentes: reunioes.slice(0, 5),
    volumeMensal: await getVolumeMensal(),
    porSegmento: distribuirPor(reunioes, "segmento", 6),
    porUf: distribuirPor(reunioes, "uf", 6),
    porUnidade: distribuirPor(reunioes, "unidade", 5),
  };
}

// ─── Clientes ────────────────────────────────────────────────────────────────

/**
 * Agrupa as reuniões por `CODT`.
 *
 * Não há cadastro de clientes na origem: o cliente é uma projeção das reuniões
 * que compartilham o código. Campos como unidade e segmento são esparsos (~64%
 * de cobertura), então pegamos o valor da reunião mais recente que o informa em
 * vez de simplesmente ler a primeira.
 */
function agruparClientes(reunioes: Reuniao[]): Cliente[] {
  const porCodt = new Map<string, Reuniao[]>();

  for (const r of reunioes) {
    const lista = porCodt.get(r.codt);
    if (lista) lista.push(r);
    else porCodt.set(r.codt, [r]);
  }

  const clientes: Cliente[] = [];

  for (const [codt, lista] of porCodt) {
    // Mais recente primeiro — o índice já vem ordenado, mas uploads entram no topo.
    const ordenadas = [...lista].sort((a, b) => b.data.localeCompare(a.data));

    /** Primeiro valor não nulo, varrendo da reunião mais recente para trás. */
    const maisRecente = <K extends keyof Reuniao>(campo: K): Reuniao[K] | null => {
      for (const r of ordenadas) {
        const v = r[campo];
        if (v !== null && v !== undefined && v !== "") return v;
      }
      return null;
    };

    const notas = ordenadas.map((r) => r.nps).filter((n): n is number => n !== null);

    clientes.push({
      codt,
      reunioes: ordenadas.length,
      segundosTotais: ordenadas.reduce((s, r) => s + r.duracaoSegundos, 0),
      primeiraReuniao: ordenadas[ordenadas.length - 1].data,
      ultimaReuniao: ordenadas[0].data,
      unidade: maisRecente("unidade") as string | null,
      segmento: maisRecente("segmento") as string | null,
      uf: maisRecente("uf") as string | null,
      faixaFaturamento: maisRecente("faixaFaturamento") as string | null,
      npsUltimo: notas.length > 0 ? notas[0] : null,
      npsMedia: notas.length > 0 ? notas.reduce((s, n) => s + n, 0) / notas.length : null,
      npsRespostas: notas.length,
    });
  }

  // Mais reuniões primeiro: a distribuição é bem torta (1 cliente com 116,
  // a maioria com 1–3), então volume é a ordenação útil por padrão.
  return clientes.sort((a, b) => b.reunioes - a.reunioes || b.segundosTotais - a.segundosTotais);
}

/** Todos os clientes, do que teve mais reuniões para o que teve menos. */
export async function getClientes(): Promise<Cliente[]> {
  return agruparClientes(await getReunioes());
}

/** Um cliente e o histórico completo dele. `null` se o código não existir. */
export async function getDetalheCliente(codt: string): Promise<DetalheCliente | null> {
  const reunioes = (await getReunioes()).filter((r) => r.codt === codt);
  if (reunioes.length === 0) return null;

  return {
    cliente: agruparClientes(reunioes)[0],
    reunioes: [...reunioes].sort((a, b) => b.data.localeCompare(a.data)),
  };
}
