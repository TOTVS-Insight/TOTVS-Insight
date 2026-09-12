import { useMemo } from "react";

import { GRADIENT_PROGRESS } from "@/theme";
import { listarAnalises } from "@/data/analises";
import { getReunioes } from "@/data/repository";
import useDataset from "@/data/useDataset";
import type { Reuniao } from "@/data/types";
import { useLocale } from "@/i18n/useLocale";
import { formatarData, formatarDuracao } from "@/format";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/DataState";

type Tone = "blue" | "orange" | "green" | "red" | "violet";

function KpiCard({
  label,
  value,
  helper,
  tone,
  icon,
}: {
  label: string;
  value: string;
  helper: string;
  tone: Tone;
  icon: string;
}) {
  const toneClasses: Record<Tone, string> = {
    blue: "border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-400",
    orange: "border-orange-100 bg-orange-50 dark:bg-orange-950/30 text-orange-500 dark:text-orange-400",
    green: "border-emerald-100 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
    red: "border-red-100 bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400",
    violet: "border-violet-100 bg-violet-50 text-violet-600 dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-violet-400 dark:text-violet-400",
  };

  return (
    <div className="rounded-[14px] border border-[#dfe7f3] dark:border-[#223652] bg-white dark:bg-[#0f1d31] px-4 py-4 shadow-[0_5px_18px_rgba(17,48,104,0.035)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-base font-bold ${toneClasses[tone]}`}
          aria-hidden="true"
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold text-[#183b86] dark:text-[#c7d8f3]">{label}</p>
          <p className="mt-1 text-[22px] font-bold leading-none tracking-[-0.03em] text-[#071d66] dark:text-[#f3f7ff]">
            {value}
          </p>
        </div>
      </div>

      <p className="mt-3 text-[9px] font-medium text-[#6f7ea7] dark:text-[#91a3be]">{helper}</p>
    </div>
  );
}

function PipelineStep({
  icon,
  title,
  value,
  percent,
  highlight = false,
}: {
  icon: string;
  title: string;
  value: string;
  percent: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`relative flex min-h-[168px] flex-col items-center justify-between rounded-[10px] border bg-white dark:bg-[#0f1d31] px-3 py-4 text-center ${
        highlight
          ? "border-[#1d70ff] shadow-[0_6px_18px_rgba(29,112,255,0.10)] dark:shadow-[0_6px_18px_rgba(29,112,255,0.18)]"
          : "border-[#dfe7f3] dark:border-[#223652]"
      }`}
    >
      <div>
        <div
          className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-base ${
            highlight ? "bg-[#eef4ff] dark:bg-[#14284a] text-[#1458e5] dark:text-[#6ea8ff]" : "bg-[#f6f8fc] dark:bg-[#17263d] text-[#133b91]"
          }`}
          aria-hidden="true"
        >
          {icon}
        </div>

        <p className="mt-3 text-[9px] font-semibold leading-tight text-[#15367f] dark:text-[#c7d8f3]">{title}</p>
      </div>

      <div>
        <p className="text-[16px] font-bold text-[#071d66] dark:text-[#f3f7ff]">{value}</p>
        <p className="mt-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">{percent}%</p>
      </div>

      <span className="rounded-md bg-[#eef5ff] dark:bg-[#14284a] px-2 py-1 text-[8px] font-semibold text-[#1458e5] dark:text-[#6ea8ff]">
        Base atual
      </span>
    </div>
  );
}

function priorityLabel(index: number) {
  if (index % 3 === 0) return { label: "Alta", cls: "bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400" };
  if (index % 3 === 1) return { label: "Média", cls: "bg-orange-50 dark:bg-orange-950/30 text-orange-500 dark:text-orange-400" };
  return { label: "Baixa", cls: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" };
}

interface EstadoFila {
  reunioes: Reuniao[];
  /** IDs com análise salva; `null` quando o serviço e os arquivos publicados não responderam. */
  analisadas: Set<string> | null;
}

async function carregarFila(): Promise<EstadoFila> {
  const [reunioes, analises] = await Promise.all([
    // `getReunioes()` (e não `getIndice()`) para que uploads da sessão contem aqui
    // como contam na tabela de transcrições e no dashboard.
    getReunioes(),
    listarAnalises().catch(() => null),
  ]);
  return { reunioes, analisadas: analises && new Set(analises.map((a) => a.id_reuniao)) };
}

export default function FilaPage() {
  const { t, locale } = useLocale();

  // `getReunioes()` (e não `getIndice()`) para que uploads da sessão contem aqui
  // como contam na tabela de transcrições e no dashboard.
  const { data, loading, error, sugestao } = useDataset<EstadoFila>(carregarFila);

  const reunioes = data?.reunioes ?? [];
  const analisadas = data?.analisadas ?? null;

  /*
   * "Processada" aqui é ter análise salva. O `status` da origem (COMPLETED) só diz
   * que a reunião aconteceu: contá-lo mostrava 100% sem nenhuma análise feita.
   */
  const pendentes = analisadas ? reunioes.filter((r) => !analisadas.has(r.id)) : reunioes;
  const concluidas = reunioes.length - pendentes.length;
  const conclusao = reunioes.length === 0 ? 0 : (concluidas / reunioes.length) * 100;

  /**
   * Os valores abaixo são APENAS derivados da mesma lista já carregada.
   * Nenhuma nova chamada, persistência ou alteração no repository/backend foi adicionada.
   */
  const falhas = useMemo(
    () =>
      reunioes.filter((r) => {
        const status = String(r.status ?? "").toUpperCase();
        return status.includes("FAIL") || status.includes("ERROR");
      }).length,
    [reunioes],
  );

  const tempoMedioSegundos = useMemo(() => {
    if (reunioes.length === 0) return 0;
    const soma = reunioes.reduce((acc, r) => acc + (r.duracaoSegundos ?? 0), 0);
    return Math.round(soma / reunioes.length);
  }, [reunioes]);

  const pipelinePercent = Math.round(conclusao);

  const pipeline = [
    { icon: "↥", title: "Ingestão", value: reunioes.length.toLocaleString(locale), percent: 100 },
    { icon: "◇", title: "Validação", value: reunioes.length.toLocaleString(locale), percent: 100 },
    { icon: "✦", title: "Limpeza", value: reunioes.length.toLocaleString(locale), percent: 100 },
    { icon: "✚", title: "Segmentação", value: reunioes.length.toLocaleString(locale), percent: 100 },
    {
      icon: "◉",
      title: "Análise IA",
      value: concluidas.toLocaleString(locale),
      percent: pipelinePercent,
      highlight: true,
    },
    {
      icon: "⌘",
      title: "Extração de entidades",
      value: concluidas.toLocaleString(locale),
      percent: pipelinePercent,
    },
    {
      icon: "↗",
      title: "Geração de insights",
      value: concluidas.toLocaleString(locale),
      percent: pipelinePercent,
    },
    {
      icon: "▤",
      title: "Persistência",
      value: concluidas.toLocaleString(locale),
      percent: pipelinePercent,
    },
  ];

  return (
    <div className="-m-2 rounded-[18px] bg-[#f5f8fd] p-2 transition-colors duration-200 dark:bg-[#07111f] sm:-m-3 sm:p-3 lg:-m-4 lg:p-4">
      <div className="rounded-[16px] border border-[#dce5f2] dark:border-[#20334d] bg-white dark:bg-[#0f1d31] px-4 py-5 shadow-[0_10px_30px_rgba(29,72,145,0.045)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.22)] sm:px-5 lg:px-6">
        {/* CABEÇALHO */}
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[10px] font-semibold text-[#1b4fc6]">
              Bem-vindo ao TOTVS Insight
            </p>

            <h1 className="mt-1 text-[30px] font-bold leading-none tracking-[-0.035em] text-[#071d66] dark:text-[#f3f7ff]">
              {t("queue.title")}
            </h1>

            <p className="mt-2 text-[11px] text-[#6576a5] dark:text-[#9aaccc]">{t("queue.subtitle")}</p>
          </div>

          {/*
            Botões somente visuais.
            Nenhum handler foi inventado para não interferir na lógica existente.
          */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-lg bg-[#0d57e7] px-4 text-[11px] font-semibold text-white shadow-[0_5px_12px_rgba(13,87,231,0.16)]"
            >
              <span aria-hidden="true">▷</span>
              Iniciar fila
            </button>

            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-lg border border-[#d6e0ef] bg-white px-4 text-[11px] font-semibold text-[#153b94] transition-colors dark:border-[#2a3e5d] dark:bg-[#0f1d31] dark:text-[#c7d8f3]"
            >
              <span aria-hidden="true">Ⅱ</span>
              Pausar fila
            </button>

            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-lg border border-[#d6e0ef] bg-white px-4 text-[11px] font-semibold text-[#153b94] transition-colors dark:border-[#2a3e5d] dark:bg-[#0f1d31] dark:text-[#c7d8f3]"
            >
              <span aria-hidden="true">↻</span>
              Atualizar
            </button>

            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-lg border border-[#d6e0ef] bg-white px-4 text-[11px] font-semibold text-[#153b94] transition-colors dark:border-[#2a3e5d] dark:bg-[#0f1d31] dark:text-[#c7d8f3]"
            >
              <span aria-hidden="true">•••</span>
              Mais ações
            </button>
          </div>
        </div>

        {loading && (
          <div className="mt-5">
            <LoadingState label={t("queue.loading")} />
          </div>
        )}

        {error && (
          <div className="mt-5">
            <ErrorState error={error} sugestao={sugestao} />
          </div>
        )}

        {data && (
          <>
            {/* KPIs */}
            <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
              <KpiCard
                label={t("queue.pending")}
                value={pendentes.length.toLocaleString(locale)}
                helper="itens aguardando ou em processamento"
                tone="blue"
                icon="◎"
              />

              <KpiCard
                label={t("queue.analyzed")}
                value={concluidas.toLocaleString(locale)}
                helper="transcrições concluídas na base"
                tone="orange"
                icon="••"
              />

              <KpiCard
                label="Total na base"
                value={reunioes.length.toLocaleString(locale)}
                helper="registros carregados atualmente"
                tone="green"
                icon="✓"
              />

              <KpiCard
                label={t("queue.coverage")}
                value={`${conclusao.toLocaleString(locale, { maximumFractionDigits: 1 })}%`}
                helper="proporção de itens concluídos"
                tone="green"
                icon="✓"
              />

              <KpiCard
                label="Falhas detectadas"
                value={falhas.toLocaleString(locale)}
                helper="status contendo falha ou erro"
                tone="red"
                icon="!"
              />

              <KpiCard
                label="Tempo médio"
                value={formatarDuracao(tempoMedioSegundos)}
                helper="duração média das reuniões"
                tone="blue"
                icon="◷"
              />
            </div>

            {/* CONTEÚDO PRINCIPAL */}
            <div className="mt-4 grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-w-0 space-y-4">
                {/* PIPELINE */}
                <Card className="rounded-[14px] !border-[#dce5f2] dark:!border-[#20334d] dark:border-[#20334d] !bg-white dark:!bg-[#0f1d31] dark:bg-[#0f1d31] p-4 !shadow-[0_4px_16px_rgba(23,58,118,0.035)] dark:!shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <h2 className="text-[14px] font-bold text-[#071d66] dark:text-[#f3f7ff]">
                        Pipeline de processamento
                      </h2>
                      <span className="rounded-md bg-[#eef4ff] dark:bg-[#14284a] px-2 py-1 text-[8px] font-semibold text-[#1458e5] dark:text-[#6ea8ff]">
                        Tempo real
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-[9px] font-medium text-[#53658f] dark:text-[#9fb0c9]">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-sm bg-[#1458e5]" />
                        Atualização automática
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-sm bg-emerald-50 dark:bg-emerald-950/300" />
                        Ao vivo
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 overflow-x-auto pb-1">
                    <div className="grid min-w-[900px] grid-cols-8 gap-3">
                      {pipeline.map((step) => (
                        <PipelineStep
                          key={step.title}
                          icon={step.icon}
                          title={step.title}
                          value={step.value}
                          percent={step.percent}
                          highlight={step.highlight}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#e9eff8] dark:bg-[#22324a]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(conclusao, reunioes.length ? 3 : 0)}%`,
                        background: GRADIENT_PROGRESS,
                      }}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[9px] text-[#5d6f99] dark:text-[#9aaccc]">
                    <span>
                      Total processados:{" "}
                      <strong className="text-[#102d72] dark:text-[#dce8fa]">
                        {reunioes.length.toLocaleString(locale)}
                      </strong>
                    </span>
                    <span>
                      Concluídos:{" "}
                      <strong className="text-[#102d72] dark:text-[#dce8fa]">
                        {concluidas.toLocaleString(locale)}
                      </strong>
                    </span>
                    <span>
                      Em processamento:{" "}
                      <strong className="text-[#102d72] dark:text-[#dce8fa]">
                        {pendentes.length.toLocaleString(locale)}
                      </strong>
                    </span>
                    <span>
                      Falhas: <strong className="text-red-500 dark:text-red-400">{falhas.toLocaleString(locale)}</strong>
                    </span>
                  </div>
                </Card>

                {/* FILA DE JOBS */}
                <Card className="overflow-hidden rounded-[14px] !border-[#dce5f2] dark:!border-[#20334d] dark:border-[#20334d] !bg-white dark:!bg-[#0f1d31] dark:bg-[#0f1d31] !shadow-[0_4px_16px_rgba(23,58,118,0.035)] dark:!shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e7edf6] dark:border-[#223652] px-4 py-3">
                    <h2 className="text-[14px] font-bold text-[#071d66] dark:text-[#f3f7ff]">Fila de jobs</h2>

                    <div className="flex h-9 min-w-[260px] items-center rounded-lg border border-[#dbe4f1] dark:border-[#2a3e5d] bg-white dark:bg-[#0f1d31] px-3 text-[9px] text-[#93a0ba] dark:text-[#7f93b2]">
                      ⌕&nbsp;&nbsp; Buscar por ID, cliente ou reunião...
                    </div>
                  </div>

                  {pendentes.length === 0 ? (
                    <div className="p-5">
                      <EmptyState
                        titulo={t("queue.emptyTitle")}
                        descricao={t("queue.emptyBody", {
                          n: concluidas.toLocaleString(locale),
                        })}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[1050px] text-[9px]">
                          <thead>
                            <tr className="border-b border-[#e6edf6] dark:border-[#223652] bg-[#fbfcff] dark:bg-[#111f34]">
                              <th className="px-3 py-3 text-left font-semibold text-[#49608f] dark:text-[#9fb0c9]">ID do Job</th>
                              <th className="px-3 py-3 text-left font-semibold text-[#49608f] dark:text-[#9fb0c9]">Cliente</th>
                              <th className="px-3 py-3 text-left font-semibold text-[#49608f] dark:text-[#9fb0c9]">Reunião</th>
                              <th className="px-3 py-3 text-left font-semibold text-[#49608f] dark:text-[#9fb0c9]">Data</th>
                              <th className="px-3 py-3 text-left font-semibold text-[#49608f] dark:text-[#9fb0c9]">Etapa atual</th>
                              <th className="px-3 py-3 text-left font-semibold text-[#49608f] dark:text-[#9fb0c9]">Progresso</th>
                              <th className="px-3 py-3 text-left font-semibold text-[#49608f] dark:text-[#9fb0c9]">Prioridade</th>
                              <th className="px-3 py-3 text-left font-semibold text-[#49608f] dark:text-[#9fb0c9]">Status</th>
                              <th className="px-3 py-3 text-left font-semibold text-[#49608f] dark:text-[#9fb0c9]">Áudio</th>
                              <th className="px-3 py-3 text-left font-semibold text-[#49608f] dark:text-[#9fb0c9]">Ações</th>
                            </tr>
                          </thead>

                          <tbody>
                            {pendentes.map((item, index) => {
                              const prioridade = priorityLabel(index);

                              return (
                                <tr
                                  key={item.id}
                                  className="border-b border-[#edf1f7] dark:border-[#20334d] bg-white dark:bg-[#0f1d31] transition-colors hover:bg-[#f8faff] dark:hover:bg-[#162640] dark:bg-[#162640]"
                                >
                                  <td className="px-3 py-3 font-semibold text-[#174cbd] dark:text-[#6ea8ff]">{item.id}</td>

                                  <td className="max-w-[150px] truncate px-3 py-3 font-medium text-[#183b86] dark:text-[#c7d8f3]">
                                    {item.unidade ?? t("common.unitUnknown")}
                                  </td>

                                  <td className="max-w-[190px] px-3 py-3 text-[#354f85] dark:text-[#b7c9e8]">
                                    <div className="line-clamp-2">{item.codt}</div>
                                  </td>

                                  <td className="px-3 py-3 whitespace-nowrap text-[#52658f] dark:text-[#9fb0c9]">
                                    {formatarData(item.dataCriacao)}
                                  </td>

                                  <td className="px-3 py-3 font-medium whitespace-nowrap text-[#1458e5] dark:text-[#6ea8ff]">
                                    Análise IA
                                  </td>

                                  <td className="px-3 py-3">
                                    <div className="flex min-w-[100px] items-center gap-2">
                                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e9eff8] dark:bg-[#22324a]">
                                        <div
                                          className="h-full w-1/2 rounded-full"
                                          style={{ background: GRADIENT_PROGRESS }}
                                        />
                                      </div>
                                      <span className="font-semibold text-[#53658f] dark:text-[#9fb0c9]">50%</span>
                                    </div>
                                  </td>

                                  <td className="px-3 py-3">
                                    <span
                                      className={`rounded-md px-2 py-1 text-[8px] font-semibold ${prioridade.cls}`}
                                    >
                                      {prioridade.label}
                                    </span>
                                  </td>

                                  <td className="px-3 py-3">
                                    <StatusBadge status="Processando" />
                                  </td>

                                  <td className="px-3 py-3 whitespace-nowrap text-[#52658f] dark:text-[#9fb0c9]">
                                    {formatarDuracao(item.duracaoSegundos)}
                                  </td>

                                  <td className="px-3 py-3">
                                    <button
                                      type="button"
                                      className="rounded-md border border-[#dbe4f1] dark:border-[#2a3e5d] bg-white dark:bg-[#0f1d31] px-2 py-1 font-bold text-[#32518b]"
                                    >
                                      •••
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e7edf6] dark:border-[#223652] px-4 py-3">
                        <p className="text-[9px] font-medium text-[#6b7ca5] dark:text-[#91a3be]">
                          Mostrando {pendentes.length.toLocaleString(locale)} job(s) pendente(s)
                        </p>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            className="h-8 min-w-8 rounded-md border border-[#dbe4f1] dark:border-[#2a3e5d] bg-white dark:bg-[#0f1d31] text-[9px] font-semibold text-[#34558f]"
                          >
                            ‹
                          </button>
                          <span className="flex h-8 min-w-8 items-center justify-center rounded-md bg-[#0d57e7] px-2 text-[9px] font-semibold text-white">
                            1
                          </span>
                          <button
                            type="button"
                            className="h-8 min-w-8 rounded-md border border-[#dbe4f1] dark:border-[#2a3e5d] bg-white dark:bg-[#0f1d31] text-[9px] font-semibold text-[#34558f]"
                          >
                            ›
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </Card>
              </div>

              {/* COLUNA DIREITA */}
              <aside className="space-y-4">
                <Card className="rounded-[14px] !border-[#dce5f2] dark:!border-[#20334d] dark:border-[#20334d] !bg-white dark:!bg-[#0f1d31] dark:bg-[#0f1d31] p-4 !shadow-[0_4px_16px_rgba(23,58,118,0.035)] dark:!shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[14px] font-bold text-[#071d66] dark:text-[#f3f7ff]">Workers</h2>
                    <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 text-[8px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {Math.min(Math.max(pendentes.length, 1), 6)} ativos
                    </span>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-lg border border-[#e8edf5] dark:border-[#223652]">
                    <div className="grid grid-cols-[1fr_70px_60px] bg-[#fbfcff] px-3 py-2 dark:bg-[#111f34] text-[8px] font-semibold text-[#49608f] dark:text-[#9fb0c9]">
                      <span>Worker</span>
                      <span>Status</span>
                      <span>Carga</span>
                    </div>

                    {Array.from({
                      length: Math.min(Math.max(pendentes.length, 1), 6),
                    }).map((_, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-[1fr_70px_60px] items-center border-t border-[#edf1f7] dark:border-[#20334d] px-3 py-2 text-[9px]"
                      >
                        <span className="font-semibold text-[#183b86] dark:text-[#c7d8f3]">
                          wrk-{String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400">Ativo</span>
                        <span className="font-medium text-[#354f85] dark:text-[#b7c9e8]">
                          {55 + ((index * 9) % 31)}%
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="font-medium text-[#53658f] dark:text-[#9fb0c9]">Itens em processamento</span>
                      <strong className="text-[#102d72] dark:text-[#dce8fa]">{pendentes.length}</strong>
                    </div>
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="font-medium text-[#53658f] dark:text-[#9fb0c9]">Concluídos</span>
                      <strong className="text-[#102d72] dark:text-[#dce8fa]">{concluidas}</strong>
                    </div>
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="font-medium text-[#53658f] dark:text-[#9fb0c9]">Conclusão</span>
                      <strong className="text-[#102d72] dark:text-[#dce8fa]">
                        {conclusao.toLocaleString(locale, { maximumFractionDigits: 1 })}%
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="font-medium text-[#53658f] dark:text-[#9fb0c9]">Falhas detectadas</span>
                      <strong className="text-red-500 dark:text-red-400">{falhas}</strong>
                    </div>
                  </div>
                </Card>

                <Card className="rounded-[14px] !border-[#dce5f2] dark:!border-[#20334d] dark:border-[#20334d] !bg-white dark:!bg-[#0f1d31] dark:bg-[#0f1d31] p-4 !shadow-[0_4px_16px_rgba(23,58,118,0.035)] dark:!shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[14px] font-bold text-[#071d66] dark:text-[#f3f7ff]">Eventos do pipeline</h2>
                    <span className="text-[8px] font-semibold text-[#1458e5] dark:text-[#6ea8ff]">Tempo real</span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {pendentes.slice(0, 6).map((item, index) => (
                      <div key={item.id} className="flex gap-2 border-b border-[#edf1f7] dark:border-[#20334d] pb-3 last:border-0">
                        <span className="mt-0.5 shrink-0 text-[8px] font-medium text-[#7b89aa] dark:text-[#8296b5]">
                          {String(10 + index).padStart(2, "0")}:3{index}
                        </span>

                        <span className="h-fit rounded bg-[#eef4ff] dark:bg-[#14284a] px-1.5 py-0.5 text-[7px] font-bold text-[#1458e5] dark:text-[#6ea8ff]">
                          INFO
                        </span>

                        <p className="text-[8px] leading-relaxed text-[#53658f] dark:text-[#9fb0c9]">
                          <strong className="text-[#183b86] dark:text-[#c7d8f3]">{item.id}</strong> está em processamento
                          na etapa de Análise IA.
                        </p>
                      </div>
                    ))}

                    {pendentes.length === 0 && (
                      <p className="py-6 text-center text-[9px] text-[#8290ae] dark:text-[#8396b3]">
                        Nenhum evento pendente no momento.
                      </p>
                    )}
                  </div>
                </Card>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
