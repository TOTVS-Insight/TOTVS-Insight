import {
  listarAnalises,
  obterAnalise,
  type Analise,
  type ResumoAnalise,
} from "./analises";

import {
  getClientes,
  getReunioes,
  getTranscricao,
} from "./repository";

import type {
  Cliente,
  Reuniao,
  TranscricaoCompleta,
} from "./types";

export type TipoRelatorio =
  | "visao-geral"
  | "produtos"
  | "sentimento"
  | "oportunidades"
  | "churn"
  | "upsell-cross-sell"
  | "concorrentes"
  | "topicos"
  | "cliente";

export type PeriodoRelatorio =
  | "30"
  | "90"
  | "180"
  | "todos";

export type ContextoProduto =
  | "uso-atual"
  | "problema-reclamacao"
  | "interesse-oportunidade"
  | "integracao"
  | "expansao"
  | "mencao";

export type ContextoConcorrente =
  | "migracao-troca"
  | "avaliacao-comercial"
  | "comparacao"
  | "uso-atual"
  | "mencao";

export interface EvidenciaBase {
  trecho: string;
  inicio: number;
  fim: number;
  relevancia: number;
}

export interface EvidenciaProduto
  extends EvidenciaBase {
  produto: string;
  contexto: ContextoProduto;
}

export interface EvidenciaConcorrente
  extends EvidenciaBase {
  concorrente: string;
  contexto: ContextoConcorrente;
}

export interface EvidenciaOportunidade
  extends EvidenciaBase {
  topico: string;
  termo: string;
  sinal: string;
  produtosSugeridos: string[];
}

export interface EvidenciaUpsell
  extends EvidenciaBase {
  sinal: string;
  produtosRelacionados: string[];
}

export interface EvidenciaCrossSell
  extends EvidenciaBase {
  topico: string;
  produtosContexto: string[];
  produtosSugeridos: string[];
}

export interface ProdutoExtraido {
  nome: string;
  mencoes: number;
  evidencias: EvidenciaProduto[];
}

export interface ConcorrenteExtraido {
  nome: string;
  mencoes: number;
  evidencias: EvidenciaConcorrente[];
}

export interface TopicoExtraido {
  nome: string;
  mencoes: number;
  sinaisOportunidade: number;
  produtosSugeridos: string[];
  oportunidades: EvidenciaOportunidade[];
}

export interface RegistroRelatorioTextual {
  idReuniao: string;
  produtos: ProdutoExtraido[];
  concorrentes: ConcorrenteExtraido[];
  topicos: TopicoExtraido[];
  upsell: EvidenciaUpsell[];
  crossSell: EvidenciaCrossSell[];
}

export interface IndiceRelatoriosTextuais {
  versao?: number;
  geradoEm: string;
  origem: string;
  observacao: string;
  records: RegistroRelatorioTextual[];
}

export interface BaseRelatorios {
  reunioes: Reuniao[];
  analises: ResumoAnalise[];
  clientes: Cliente[];
  textual: IndiceRelatoriosTextuais | null;
}

export interface OportunidadeDetalhada {
  idReuniao: string;
  reuniao: Reuniao;
  evidencia: EvidenciaOportunidade;
}

export interface ProdutoDetalhado {
  idReuniao: string;
  reuniao: Reuniao;
  evidencia: EvidenciaProduto;
}

export interface ConcorrenteDetalhado {
  idReuniao: string;
  reuniao: Reuniao;
  evidencia: EvidenciaConcorrente;
}

export interface UpsellDetalhado {
  idReuniao: string;
  reuniao: Reuniao;
  evidencia: EvidenciaUpsell;
}

export interface CrossSellDetalhado {
  idReuniao: string;
  reuniao: Reuniao;
  evidencia: EvidenciaCrossSell;
}

const BASE =
  import.meta.env.BASE_URL;

const URL_RELATORIOS =
  `${BASE}data/reports-index.json`;

let basePromise:
  Promise<BaseRelatorios> | null =
  null;

const analiseCache =
  new Map<
    string,
    Promise<Analise>
  >();

const transcricaoCache =
  new Map<
    string,
    Promise<TranscricaoCompleta | null>
  >();

async function carregarIndiceTextual():
  Promise<
    IndiceRelatoriosTextuais | null
  > {
  try {
    const resposta =
      await fetch(
        URL_RELATORIOS,
      );

    if (!resposta.ok) {
      return null;
    }

    const tipo =
      resposta.headers.get(
        "content-type",
      ) ?? "";

    if (!tipo.includes("json")) {
      return null;
    }

    return (
      await resposta.json()
    ) as IndiceRelatoriosTextuais;
  } catch {
    return null;
  }
}

export function carregarBaseRelatorios():
  Promise<BaseRelatorios> {
  basePromise ??=
    Promise.all([
      getReunioes(),

      listarAnalises().catch(
        () => [],
      ),

      getClientes(),

      carregarIndiceTextual(),
    ])
      .then(
        ([
          reunioes,
          analises,
          clientes,
          textual,
        ]) => ({
          reunioes,
          analises,
          clientes,
          textual,
        }),
      )
      .catch((erro) => {
        basePromise = null;
        throw erro;
      });

  return basePromise;
}

export function invalidarBaseRelatorios() {
  basePromise = null;
}

export function dataReferencia(
  reunioes: Reuniao[],
): Date | null {
  if (reunioes.length === 0) {
    return null;
  }

  const maior =
    reunioes.reduce(
      (
        atual,
        reuniao,
      ) =>
        reuniao.data > atual
          ? reuniao.data
          : atual,

      reunioes[0].data,
    );

  const data =
    new Date(
      maior.replace(
        " ",
        "T",
      ),
    );

  return Number.isNaN(
    data.getTime(),
  )
    ? null
    : data;
}

export function filtrarReunioes(
  reunioes: Reuniao[],
  periodo: PeriodoRelatorio,
  cliente: string,
): Reuniao[] {
  let filtradas =
    cliente === "todos"
      ? reunioes
      : reunioes.filter(
          (reuniao) =>
            reuniao.codt ===
            cliente,
        );

  if (periodo === "todos") {
    return filtradas;
  }

  const referencia =
    dataReferencia(reunioes);

  if (!referencia) {
    return filtradas;
  }

  const inicio =
    new Date(referencia);

  inicio.setDate(
    inicio.getDate() -
      Number(periodo) +
      1,
  );

  filtradas =
    filtradas.filter(
      (reuniao) => {
        const data =
          new Date(
            reuniao.data.replace(
              " ",
              "T",
            ),
          );

        return (
          !Number.isNaN(
            data.getTime(),
          ) &&
          data >= inicio &&
          data <= referencia
        );
      },
    );

  return filtradas;
}

export function filtrarAnalisesPorReunioes(
  analises: ResumoAnalise[],
  reunioes: Reuniao[],
): ResumoAnalise[] {
  const ids =
    new Set(
      reunioes.map(
        (reuniao) =>
          reuniao.id,
      ),
    );

  const vistas =
    new Set<string>();

  const resultado:
    ResumoAnalise[] = [];

  for (
    const analise of
    analises
  ) {
    if (
      !ids.has(
        analise.id_reuniao,
      ) ||
      vistas.has(
        analise.id_reuniao,
      )
    ) {
      continue;
    }

    vistas.add(
      analise.id_reuniao,
    );

    resultado.push(
      analise,
    );
  }

  return resultado;
}

export function filtrarTextualPorReunioes(
  textual:
    IndiceRelatoriosTextuais | null,
  reunioes: Reuniao[],
): RegistroRelatorioTextual[] {
  if (!textual) {
    return [];
  }

  const ids =
    new Set(
      reunioes.map(
        (reuniao) =>
          reuniao.id,
      ),
    );

  return textual.records.filter(
    (registro) =>
      ids.has(
        registro.idReuniao,
      ),
  );
}

export function mapaReunioes(
  reunioes: Reuniao[],
): Map<string, Reuniao> {
  return new Map(
    reunioes.map(
      (reuniao) => [
        reuniao.id,
        reuniao,
      ],
    ),
  );
}

export function listarOportunidadesDetalhadas(
  registros:
    RegistroRelatorioTextual[],
  reunioes: Reuniao[],
): OportunidadeDetalhada[] {
  const mapa =
    mapaReunioes(reunioes);

  const itens:
    OportunidadeDetalhada[] =
    [];

  for (
    const registro of
    registros
  ) {
    const reuniao =
      mapa.get(
        registro.idReuniao,
      );

    if (!reuniao) {
      continue;
    }

    for (
      const topico of
      registro.topicos ?? []
    ) {
      for (
        const evidencia of
        topico.oportunidades ??
        []
      ) {
        itens.push({
          idReuniao:
            registro.idReuniao,

          reuniao,

          evidencia,
        });
      }
    }
  }

  return itens.sort(
    (a, b) =>
      b.evidencia.relevancia -
        a.evidencia.relevancia ||
      b.reuniao.data.localeCompare(
        a.reuniao.data,
      ),
  );
}

export function listarProdutosDetalhados(
  registros:
    RegistroRelatorioTextual[],
  reunioes: Reuniao[],
): ProdutoDetalhado[] {
  const mapa =
    mapaReunioes(reunioes);

  const itens:
    ProdutoDetalhado[] = [];

  for (
    const registro of
    registros
  ) {
    const reuniao =
      mapa.get(
        registro.idReuniao,
      );

    if (!reuniao) {
      continue;
    }

    for (
      const produto of
      registro.produtos ?? []
    ) {
      for (
        const evidencia of
        produto.evidencias ??
        []
      ) {
        itens.push({
          idReuniao:
            registro.idReuniao,

          reuniao,

          evidencia,
        });
      }
    }
  }

  return itens.sort(
    (a, b) =>
      b.reuniao.data.localeCompare(
        a.reuniao.data,
      ),
  );
}

export function listarConcorrentesDetalhados(
  registros:
    RegistroRelatorioTextual[],
  reunioes: Reuniao[],
): ConcorrenteDetalhado[] {
  const mapa =
    mapaReunioes(reunioes);

  const itens:
    ConcorrenteDetalhado[] =
    [];

  for (
    const registro of
    registros
  ) {
    const reuniao =
      mapa.get(
        registro.idReuniao,
      );

    if (!reuniao) {
      continue;
    }

    for (
      const concorrente of
      registro.concorrentes ??
      []
    ) {
      for (
        const evidencia of
        concorrente.evidencias ??
        []
      ) {
        itens.push({
          idReuniao:
            registro.idReuniao,

          reuniao,

          evidencia,
        });
      }
    }
  }

  return itens.sort(
    (a, b) =>
      b.evidencia.relevancia -
        a.evidencia.relevancia ||
      b.reuniao.data.localeCompare(
        a.reuniao.data,
      ),
  );
}

export function listarUpsellDetalhado(
  registros:
    RegistroRelatorioTextual[],
  reunioes: Reuniao[],
): UpsellDetalhado[] {
  const mapa =
    mapaReunioes(reunioes);

  const itens:
    UpsellDetalhado[] = [];

  for (
    const registro of
    registros
  ) {
    const reuniao =
      mapa.get(
        registro.idReuniao,
      );

    if (!reuniao) {
      continue;
    }

    for (
      const evidencia of
      registro.upsell ?? []
    ) {
      itens.push({
        idReuniao:
          registro.idReuniao,

        reuniao,

        evidencia,
      });
    }
  }

  return itens.sort(
    (a, b) =>
      b.evidencia.relevancia -
        a.evidencia.relevancia ||
      b.reuniao.data.localeCompare(
        a.reuniao.data,
      ),
  );
}

export function listarCrossSellDetalhado(
  registros:
    RegistroRelatorioTextual[],
  reunioes: Reuniao[],
): CrossSellDetalhado[] {
  const mapa =
    mapaReunioes(reunioes);

  const itens:
    CrossSellDetalhado[] = [];

  for (
    const registro of
    registros
  ) {
    const reuniao =
      mapa.get(
        registro.idReuniao,
      );

    if (!reuniao) {
      continue;
    }

    for (
      const evidencia of
      registro.crossSell ?? []
    ) {
      itens.push({
        idReuniao:
          registro.idReuniao,

        reuniao,

        evidencia,
      });
    }
  }

  return itens.sort(
    (a, b) =>
      b.evidencia.relevancia -
        a.evidencia.relevancia ||
      b.reuniao.data.localeCompare(
        a.reuniao.data,
      ),
  );
}

export async function carregarAnaliseCompleta(
  resumo: ResumoAnalise,
): Promise<Analise> {
  let promise =
    analiseCache.get(
      resumo.id,
    );

  if (!promise) {
    promise =
      obterAnalise(
        resumo.id,
      );

    analiseCache.set(
      resumo.id,
      promise,
    );
  }

  return promise;
}

export async function carregarTranscricaoReuniao(
  idReuniao: string,
): Promise<
  TranscricaoCompleta | null
> {
  let promise =
    transcricaoCache.get(
      idReuniao,
    );

  if (!promise) {
    promise =
      getTranscricao(
        idReuniao,
      );

    transcricaoCache.set(
      idReuniao,
      promise,
    );
  }

  return promise;
}

export function formatarDataHora(
  data: string | null,
): string {
  if (!data) {
    return "—";
  }

  const valor =
    new Date(
      data.replace(
        " ",
        "T",
      ),
    );

  if (
    Number.isNaN(
      valor.getTime(),
    )
  ) {
    return data;
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(valor);
}

export function formatarNumero(
  valor: number,
): string {
  return valor.toLocaleString(
    "pt-BR",
  );
}

export function formatarPercentual(
  valor: number | null,
  casas = 0,
): string {
  if (
    valor === null ||
    Number.isNaN(valor)
  ) {
    return "—";
  }

  return `${valor.toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits:
        casas,

      maximumFractionDigits:
        casas,
    },
  )}%`;
}

export function percentual(
  parte: number,
  total: number,
): number {
  return total > 0
    ? (parte / total) * 100
    : 0;
}

export function labelContextoProduto(
  contexto: ContextoProduto,
): string {
  return {
    "uso-atual":
      "Uso atual",

    "problema-reclamacao":
      "Problema / reclamação",

    "interesse-oportunidade":
      "Interesse / oportunidade",

    integracao:
      "Integração",

    expansao:
      "Expansão",

    mencao:
      "Menção",
  }[contexto];
}

export function labelContextoConcorrente(
  contexto: ContextoConcorrente,
): string {
  return {
    "migracao-troca":
      "Migração / troca",

    "avaliacao-comercial":
      "Avaliação comercial",

    comparacao:
      "Comparação",

    "uso-atual":
      "Uso atual",

    mencao:
      "Menção sem contexto conclusivo",
  }[contexto];
}

export function recomendacaoOportunidade(
  item: EvidenciaOportunidade,
): string {
  return item.produtosSugeridos
    .length > 0
    ? `Validar a necessidade com o cliente e avaliar aderência de ${item.produtosSugeridos.join(", ")}.`
    : "Validar a necessidade com o cliente antes de definir a próxima ação comercial.";
}

export function motivoOportunidade(
  item: EvidenciaOportunidade,
): string {
  return `O tema “${item.topico}” apareceu no mesmo trecho do sinal “${item.sinal}”. É um sinal textual de necessidade ou intenção e deve ser validado pelo responsável pela conta.`;
}

export function recomendacaoUpsell(
  item: EvidenciaUpsell,
): string {
  return item.produtosRelacionados
    .length > 0
    ? `Confirmar o escopo da expansão e avaliar ampliação de ${item.produtosRelacionados.join(", ")}.`
    : "Confirmar o escopo da expansão e identificar quais produtos ou módulos podem ser ampliados.";
}

export function recomendacaoCrossSell(
  item: EvidenciaCrossSell,
): string {
  return `Validar quais soluções o cliente já possui e, se fizer sentido, explorar ${item.produtosSugeridos.join(", ")} como potencial cross-sell.`;
}