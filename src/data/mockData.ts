/**
 * Dados-exemplo das telas que ainda não têm origem real.
 *
 * O que já vem da base de reuniões (`repository.ts`) foi removido daqui:
 * transcrições, KPIs, reuniões recentes e fila de processamento.
 *
 * O que sobrou não tem coluna correspondente em `ANON_transcricao.json` e
 * continuaria sendo invenção se fosse "derivado":
 *
 *   • HISTORICO   — a base não registra eventos de auditoria.
 *   • RELATORIOS  — não há relatórios gerados na origem.
 *   • ASSISTENTE  — respostas exigiriam um modelo de linguagem sobre os textos.
 *   • INSIGHTS    — sentimento, oportunidades etc. não têm coluna na base. A aba de
 *                   churn saiu daqui: usa as análises do backend (`PainelChurn`).
 *
 * Textos de insight, eventos do histórico e sugestões do assistente vêm de
 * `src/i18n/locales/`.
 * Aqui ficam só valores numéricos (e respostas mock do assistente).
 */

/** Abas de insight do dashboard (exceto Visão Geral, que usa a base real). */
export type InsightTab =
  | "opportunities"
  | "products"
  | "competitors"
  | "sentiment"
  | "pains"
  | "journey"
  | "meetingQuality"
  | "dataQuality"
  | "priorityClients"
  | "recommendations";

/** Valores dos 4 KPIs de cada aba — rótulos e cópia vêm do dicionário i18n. */
export const INSIGHTS: Record<InsightTab, { values: [string, string, string, string] }> = {
  opportunities: { values: ["128", "17", "R$ 2,4M", "23%"] },
  products: { values: ["18", "64%", "21%", "37"] },
  competitors: { values: ["89", "7", "14", "6"] },
  sentiment: { values: ["72%", "19%", "9%", "+9 pp"] },
  pains: { values: ["56", "31", "25", "9"] },
  journey: { values: ["22%", "31%", "27%", "20%"] },
  meetingQuality: { values: ["42 min", "61%", "54%", "38%"] },
  dataQuality: { values: ["67%", "81%", "74%", "88%"] },
  priorityClients: { values: ["15", "9", "11", "6"] },
  recommendations: { values: ["24", "11", "5", "8"] },
};

export type TipoEvento = "sucesso" | "info" | "alerta" | "erro";

export interface EventoHistorico {
  data: string;
  /** Chave em `history.events` — ação e detalhe vêm do dicionário. */
  chave: string;
  tipo: TipoEvento;
}

export interface Relatorio {
  nome: string;
  tipo: string;
  gerado: string;
  tamanho: string;
  status: string;
}

export const HISTORICO: EventoHistorico[] = [
  { data: "05/08/2026", chave: "e0", tipo: "sucesso" },
  { data: "05/08/2026", chave: "e1", tipo: "info" },
  { data: "04/08/2026", chave: "e2", tipo: "alerta" },
  { data: "04/08/2026", chave: "e3", tipo: "info" },
  { data: "03/08/2026", chave: "e4", tipo: "sucesso" },
  { data: "02/08/2026", chave: "e5", tipo: "sucesso" },
  { data: "01/08/2026", chave: "e6", tipo: "erro" },
  { data: "31/07/2026", chave: "e7", tipo: "sucesso" },
  { data: "30/07/2026", chave: "e8", tipo: "info" },
  { data: "29/07/2026", chave: "e9", tipo: "info" },
];

export const RELATORIOS: Relatorio[] = [
  {
    nome: "Relatório Mensal — Julho 2026",
    tipo: "Mensal",
    gerado: "01/08/2026",
    tamanho: "2.4 MB",
    status: "Concluído",
  },
  {
    nome: "Análise de Churn — Q2 2026",
    tipo: "Trimestral",
    gerado: "15/07/2026",
    tamanho: "5.1 MB",
    status: "Concluído",
  },
  {
    nome: "Sentimento por Cliente — Jun 2026",
    tipo: "Mensal",
    gerado: "01/07/2026",
    tamanho: "1.8 MB",
    status: "Concluído",
  },
  {
    nome: "Oportunidades Identificadas — Q2",
    tipo: "Trimestral",
    gerado: "30/06/2026",
    tamanho: "3.3 MB",
    status: "Concluído",
  },
  {
    nome: "Relatório Mensal — Junho 2026",
    tipo: "Mensal",
    gerado: "01/07/2026",
    tamanho: "2.1 MB",
    status: "Concluído",
  },
  {
    nome: "Relatório Agosto 2026",
    tipo: "Mensal",
    gerado: "—",
    tamanho: "—",
    status: "Pendente",
  },
];

/** Ids estáveis das sugestões — rótulos em `assistant.suggestion.*`. */
export const SUGESTOES_ASSISTENTE = ["churn", "opportunities", "sentiment", "products"] as const;

export type SugestaoAssistente = (typeof SUGESTOES_ASSISTENTE)[number];

export const RESPOSTAS_ASSISTENTE: Record<SugestaoAssistente, string> = {
  churn:
    "Com base nas últimas 30 reuniões analisadas, os clientes com maior risco de churn são:\n\n1. **Votorantim** — sentimento negativo por 3 semanas consecutivas, menciona concorrente 4x.\n2. **Unimed** — queda de 40% no engajamento das reuniões.\n3. **Porto Seguro** — 2 reuniões canceladas e tom neutro/negativo recente.\n\nRecomendo priorizar contato proativo com Votorantim ainda esta semana.",
  opportunities:
    "Foram identificadas **128 oportunidades** na última semana, sendo:\n\n• **Upsell ERP** — Embraer (alta prioridade)\n• **Expansão licenças** — Vale S.A.\n• **Novo módulo BI** — Itaú BBA\n\nTotal de potencial mapeado: R$ 2,4M em ARR.",
  sentiment:
    "O sentimento médio de julho foi **72% positivo**, acima dos 63% de junho.\n\nDistribuição:\n• Positivo: 72%\n• Neutro: 19%\n• Negativo: 9%\n\nDestaques positivos: reuniões de proposta e renovação. Pontos de atenção: reuniões de suporte técnico.",
  products:
    "Top 5 produtos mais mencionados em julho:\n\n1. TOTVS Protheus — 48 menções\n2. TOTVS RH — 31 menções\n3. TOTVS Analytics (BI) — 27 menções\n4. TOTVS CRM — 19 menções\n5. TOTVS Logística — 12 menções\n\nProtheus lidera em todos os segmentos.",
};
