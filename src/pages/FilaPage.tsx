import { useEffect, useMemo, useState } from "react";

import { getReunioes } from "@/data/repository";
import useDataset from "@/data/useDataset";
import type { Reuniao } from "@/data/types";
import {
  alterarPrioridadeJob,
  iniciarFila,
  obterFila,
  pausarFila,
  reprocessarJob,
  sincronizarFila,
  type EstadoFilaApi,
  type JobFila,
  type PrioridadeJobFila,
  type StatusJobFila,
} from "@/data/fila";
import { useLocale } from "@/i18n/useLocale";
import { formatarData, formatarDuracao } from "@/format";
import Card from "@/components/ui/Card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/DataState";

const POR_PAGINA = 25;

type Idioma = "pt" | "en" | "es";
type FiltroStatus = "TODOS" | StatusJobFila;

const COPY = {
  pt: {
    start: "Iniciar fila",
    pause: "Pausar fila",
    sync: "Sincronizar",
    queueRunning: "Fila em execução",
    queuePaused: "Fila pausada",
    pauseNote: "O job atual termina; nenhum novo job será iniciado.",
    total: "Transcrições filtradas",
    waiting: "Na fila",
    processing: "Processando",
    completed: "Concluídas",
    failures: "Falhas",
    successRate: "Taxa de sucesso",
    avgTime: "Tempo médio de análise",
    pipeline: "Pipeline real de processamento",
    raw: "Transcrição bruta",
    filtered: "Filtro ML concluído",
    queued: "Fila de análise",
    analysis: "Análise IA",
    persistence: "Persistência",
    jobs: "Jobs da fila",
    search: "Buscar por ID, cliente ou unidade...",
    all: "Todos",
    colJob: "ID do job",
    colClient: "Cliente",
    colMeeting: "Reunião",
    colDate: "Data",
    colStage: "Etapa atual",
    colPriority: "Prioridade",
    colAttempts: "Tentativas",
    colStatus: "Status",
    colDuration: "Áudio",
    colActions: "Ações",
    waitingStage: "Aguardando análise",
    processingStage: "Análise IA",
    completedStage: "Persistida",
    failedStage: "Falha na análise",
    retry: "Tentar novamente",
    details: "Erro",
    worker: "Worker real",
    workerStatus: "Status",
    workerJob: "Job atual",
    available: "Disponível",
    busy: "Ocupado",
    paused: "Pausado",
    events: "Eventos da fila",
    noEvents: "Nenhum evento ainda.",
    showed: "Mostrando",
    jobsLabel: "job(s)",
    previous: "Anterior",
    next: "Próxima",
    low: "Baixa",
    medium: "Média",
    high: "Alta",
    noMeeting: "Reunião não encontrada no índice",
    syncHint: "Lê as transcrições já filtradas e cria jobs que ainda não existem.",
  },
  en: {
    start: "Start queue",
    pause: "Pause queue",
    sync: "Sync",
    queueRunning: "Queue running",
    queuePaused: "Queue paused",
    pauseNote: "The current job finishes; no new job will start.",
    total: "Filtered transcripts",
    waiting: "Queued",
    processing: "Processing",
    completed: "Completed",
    failures: "Failures",
    successRate: "Success rate",
    avgTime: "Average analysis time",
    pipeline: "Real processing pipeline",
    raw: "Raw transcript",
    filtered: "ML filter complete",
    queued: "Analysis queue",
    analysis: "AI analysis",
    persistence: "Persistence",
    jobs: "Queue jobs",
    search: "Search by ID, client or unit...",
    all: "All",
    colJob: "Job ID",
    colClient: "Client",
    colMeeting: "Meeting",
    colDate: "Date",
    colStage: "Current stage",
    colPriority: "Priority",
    colAttempts: "Attempts",
    colStatus: "Status",
    colDuration: "Audio",
    colActions: "Actions",
    waitingStage: "Waiting for analysis",
    processingStage: "AI analysis",
    completedStage: "Persisted",
    failedStage: "Analysis failed",
    retry: "Retry",
    details: "Error",
    worker: "Real worker",
    workerStatus: "Status",
    workerJob: "Current job",
    available: "Available",
    busy: "Busy",
    paused: "Paused",
    events: "Queue events",
    noEvents: "No events yet.",
    showed: "Showing",
    jobsLabel: "job(s)",
    previous: "Previous",
    next: "Next",
    low: "Low",
    medium: "Medium",
    high: "High",
    noMeeting: "Meeting not found in index",
    syncHint: "Reads filtered transcripts and creates missing jobs.",
  },
  es: {
    start: "Iniciar cola",
    pause: "Pausar cola",
    sync: "Sincronizar",
    queueRunning: "Cola en ejecución",
    queuePaused: "Cola pausada",
    pauseNote: "El job actual termina; no se iniciará uno nuevo.",
    total: "Transcripciones filtradas",
    waiting: "En cola",
    processing: "Procesando",
    completed: "Concluidas",
    failures: "Fallos",
    successRate: "Tasa de éxito",
    avgTime: "Tiempo medio de análisis",
    pipeline: "Pipeline real de procesamiento",
    raw: "Transcripción bruta",
    filtered: "Filtro ML concluido",
    queued: "Cola de análisis",
    analysis: "Análisis IA",
    persistence: "Persistencia",
    jobs: "Jobs de la cola",
    search: "Buscar por ID, cliente o unidad...",
    all: "Todos",
    colJob: "ID del job",
    colClient: "Cliente",
    colMeeting: "Reunión",
    colDate: "Fecha",
    colStage: "Etapa actual",
    colPriority: "Prioridad",
    colAttempts: "Intentos",
    colStatus: "Estado",
    colDuration: "Audio",
    colActions: "Acciones",
    waitingStage: "Esperando análisis",
    processingStage: "Análisis IA",
    completedStage: "Persistida",
    failedStage: "Fallo en el análisis",
    retry: "Reintentar",
    details: "Error",
    worker: "Worker real",
    workerStatus: "Estado",
    workerJob: "Job actual",
    available: "Disponible",
    busy: "Ocupado",
    paused: "Pausado",
    events: "Eventos de la cola",
    noEvents: "Todavía no hay eventos.",
    showed: "Mostrando",
    jobsLabel: "job(s)",
    previous: "Anterior",
    next: "Siguiente",
    low: "Baja",
    medium: "Media",
    high: "Alta",
    noMeeting: "Reunión no encontrada en el índice",
    syncHint: "Lee las transcripciones filtradas y crea los jobs que faltan.",
  },
} as const;

function idiomaDaLocale(locale: string): Idioma {
  const value = locale.toLowerCase();
  if (value.startsWith("en")) return "en";
  if (value.startsWith("es")) return "es";
  return "pt";
}

interface EstadoFilaTela {
  reunioes: Reuniao[];
  fila: EstadoFilaApi;
}

async function carregarFila(): Promise<EstadoFilaTela> {
  const [reunioes, fila] = await Promise.all([getReunioes(), obterFila()]);
  return { reunioes, fila };
}

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
  tone: "blue" | "orange" | "green" | "red" | "violet";
  icon: string;
}) {
  const tones = {
    blue: "border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-400",
    orange:
      "border-orange-100 bg-orange-50 text-orange-500 dark:border-orange-900/40 dark:bg-orange-950/30 dark:text-orange-400",
    green:
      "border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400",
    red: "border-red-100 bg-red-50 text-red-500 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400",
    violet:
      "border-violet-100 bg-violet-50 text-violet-600 dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-violet-400",
  } as const;

  return (
    <div className="rounded-[14px] border border-[#dfe7f3] bg-white px-4 py-4 shadow-[0_5px_18px_rgba(17,48,104,0.035)] dark:border-[#223652] dark:bg-[#0f1d31]">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-base font-bold ${tones[tone]}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold text-[#183b86] dark:text-[#c7d8f3]">
            {label}
          </p>
          <p className="mt-1 text-[22px] font-bold leading-none tracking-[-0.03em] text-[#071d66] dark:text-[#f3f7ff]">
            {value}
          </p>
        </div>
      </div>
      <p className="mt-3 text-[10px] font-medium text-[#6f7ea7] dark:text-[#91a3be]">
        {helper}
      </p>
    </div>
  );
}

function PipelineStep({
  title,
  value,
  helper,
  active,
}: {
  title: string;
  value: string;
  helper: string;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-4 ${
        active
          ? "border-[#1d70ff] bg-[#f7faff] shadow-[0_6px_18px_rgba(29,112,255,0.08)] dark:bg-[#14233a]"
          : "border-[#dfe7f3] bg-white dark:border-[#223652] dark:bg-[#0f1d31]"
      }`}
    >
      <p className="text-[11px] font-semibold text-[#53658f] dark:text-[#9fb0c9]">{title}</p>
      <p className="mt-2 text-[22px] font-bold text-[#071d66] dark:text-[#f3f7ff]">{value}</p>
      <p className="mt-2 text-[10px] text-[#71809a] dark:text-[#91a3be]">{helper}</p>
    </div>
  );
}

function statusStyle(status: StatusJobFila) {
  switch (status) {
    case "PROCESSANDO":
      return "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300";
    case "CONCLUIDO":
      return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300";
    case "FALHA":
      return "bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-300";
    default:
      return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  }
}

function stageFor(status: StatusJobFila, copy: (typeof COPY)[Idioma]) {
  if (status === "PROCESSANDO") return copy.processingStage;
  if (status === "CONCLUIDO") return copy.completedStage;
  if (status === "FALHA") return copy.failedStage;
  return copy.waitingStage;
}

function priorityLabel(priority: PrioridadeJobFila, copy: (typeof COPY)[Idioma]) {
  if (priority === "ALTA") return copy.high;
  if (priority === "BAIXA") return copy.low;
  return copy.medium;
}

function tempoEvento(value: string | null, locale: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export default function FilaPage() {
  const { t, locale } = useLocale();
  const copy = COPY[idiomaDaLocale(locale)];
  const { data, loading, error, sugestao, recarregar } =
    useDataset<EstadoFilaTela>(carregarFila);

  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<FiltroStatus>("TODOS");
  const [pagina, setPagina] = useState(0);

  const reunioes = data?.reunioes ?? [];
  const fila = data?.fila ?? null;

  const porId = useMemo(
    () => new Map(reunioes.map((reuniao) => [reuniao.id, reuniao])),
    [reunioes],
  );

  const jobsFiltrados = useMemo(() => {
    if (!fila) return [];
    const termo = search.trim().toLowerCase();

    return fila.jobs.filter((job) => {
      if (statusFiltro !== "TODOS" && job.status !== statusFiltro) return false;
      if (!termo) return true;

      const reuniao = porId.get(job.id_reuniao);
      return (
        job.id_reuniao.toLowerCase().includes(termo) ||
        (reuniao?.codt ?? "").toLowerCase().includes(termo) ||
        (reuniao?.unidade ?? "").toLowerCase().includes(termo)
      );
    });
  }, [fila, porId, search, statusFiltro]);

  const totalPaginas = Math.max(1, Math.ceil(jobsFiltrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas - 1);
  const jobsVisiveis = jobsFiltrados.slice(
    paginaAtual * POR_PAGINA,
    (paginaAtual + 1) * POR_PAGINA,
  );

  const eventos = useMemo(() => {
    if (!fila) return [];
    return [...fila.jobs]
      .sort((a, b) => b.atualizado_em.localeCompare(a.atualizado_em))
      .slice(0, 8);
  }, [fila]);

  const jobAtual = fila?.jobs.find((job) => job.status === "PROCESSANDO") ?? null;

  useEffect(() => {
    if (!fila || fila.pausada) return;
    if (fila.resumo.aguardando === 0 && fila.resumo.processando === 0) return;

    const interval = window.setInterval(() => recarregar(), 1500);
    return () => window.clearInterval(interval);
  }, [fila?.pausada, fila?.resumo.aguardando, fila?.resumo.processando, recarregar]);

  useEffect(() => {
    setPagina(0);
  }, [search, statusFiltro]);

  async function executar(nome: string, action: () => Promise<unknown>) {
    setBusyAction(nome);
    setActionError(null);
    try {
      await action();
      recarregar();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Falha ao atualizar a fila.");
    } finally {
      setBusyAction(null);
    }
  }

  async function mudarPrioridade(job: JobFila, prioridade: PrioridadeJobFila) {
    if (job.prioridade === prioridade) return;
    await executar(`priority:${job.id_reuniao}`, () =>
      alterarPrioridadeJob(job.id_reuniao, prioridade),
    );
  }

  const totalReunioes = reunioes.length;
  const totalFiltradas = fila?.resumo.total ?? 0;
  const coverageFiltered = totalReunioes
    ? Math.round((totalFiltradas / totalReunioes) * 100)
    : 0;

  return (
    <div className="-m-2 rounded-[18px] bg-[#f5f8fd] p-2 transition-colors duration-200 dark:bg-[#07111f] sm:-m-3 sm:p-3 lg:-m-4 lg:p-4">
      <div className="rounded-[16px] border border-[#dce5f2] bg-white px-4 py-5 shadow-[0_10px_30px_rgba(29,72,145,0.045)] dark:border-[#20334d] dark:bg-[#0f1d31] sm:px-5 lg:px-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#1b4fc6] dark:text-[#6ea8ff]">
              {t("dashboard.welcome")}
            </p>
            <h1 className="mt-1 text-[30px] font-bold leading-none tracking-[-0.035em] text-[#071d66] dark:text-[#f3f7ff]">
              {t("queue.title")}
            </h1>
            <p className="mt-2 text-[12px] text-[#6576a5] dark:text-[#9aaccc]">
              {t("queue.subtitle")}
            </p>

            {fila && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1.5 text-[10px] font-semibold ${
                    fila.pausada
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                  }`}
                >
                  {fila.pausada ? copy.queuePaused : copy.queueRunning}
                </span>
                {fila.pausada && fila.resumo.processando > 0 && (
                  <span className="text-[10px] text-[#71809a] dark:text-[#91a3be]">
                    {copy.pauseNote}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={!fila || !fila.pausada || busyAction !== null}
              onClick={() => void executar("start", iniciarFila)}
              className="flex h-10 items-center gap-2 rounded-lg bg-[#0d57e7] px-4 text-[11px] font-semibold text-white shadow-[0_5px_12px_rgba(13,87,231,0.16)] transition-colors hover:bg-[#0b4dd0] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span>▷</span>
              {busyAction === "start" ? "..." : copy.start}
            </button>

            <button
              type="button"
              disabled={!fila || fila.pausada || busyAction !== null}
              onClick={() => void executar("pause", pausarFila)}
              className="flex h-10 items-center gap-2 rounded-lg border border-[#d6e0ef] bg-white px-4 text-[11px] font-semibold text-[#153b94] transition-colors hover:bg-[#f8faff] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#2a3e5d] dark:bg-[#0f1d31] dark:text-[#c7d8f3] dark:hover:bg-[#162640]"
            >
              <span>Ⅱ</span>
              {busyAction === "pause" ? "..." : copy.pause}
            </button>

            <button
              type="button"
              disabled={busyAction !== null}
              title={copy.syncHint}
              onClick={() => void executar("sync", sincronizarFila)}
              className="flex h-10 items-center gap-2 rounded-lg border border-[#d6e0ef] bg-white px-4 text-[11px] font-semibold text-[#153b94] transition-colors hover:bg-[#f8faff] disabled:opacity-40 dark:border-[#2a3e5d] dark:bg-[#0f1d31] dark:text-[#c7d8f3] dark:hover:bg-[#162640]"
            >
              <span>↻</span>
              {busyAction === "sync" ? "..." : copy.sync}
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

        {actionError && (
          <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-[11px] font-medium text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
            {actionError}
          </div>
        )}

        {fila && (
          <>
            <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
              <KpiCard
                label={copy.waiting}
                value={fila.resumo.aguardando.toLocaleString(locale)}
                helper={`${fila.resumo.total.toLocaleString(locale)} ${copy.total.toLowerCase()}`}
                tone="blue"
                icon="◎"
              />
              <KpiCard
                label={copy.processing}
                value={fila.resumo.processando.toLocaleString(locale)}
                helper={jobAtual?.id_reuniao ?? "—"}
                tone="orange"
                icon="••"
              />
              <KpiCard
                label={copy.completed}
                value={fila.resumo.concluidos.toLocaleString(locale)}
                helper={copy.persistence}
                tone="green"
                icon="✓"
              />
              <KpiCard
                label={copy.successRate}
                value={`${fila.resumo.taxa_sucesso.toLocaleString(locale, {
                  maximumFractionDigits: 1,
                })}%`}
                helper={`${fila.resumo.falhas.toLocaleString(locale)} ${copy.failures.toLowerCase()}`}
                tone="green"
                icon="↗"
              />
              <KpiCard
                label={copy.failures}
                value={fila.resumo.falhas.toLocaleString(locale)}
                helper={copy.retry}
                tone="red"
                icon="!"
              />
              <KpiCard
                label={copy.avgTime}
                value={formatarDuracao(Math.round(fila.resumo.tempo_medio_segundos))}
                helper="worker-01"
                tone="violet"
                icon="◷"
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-w-0 space-y-4">
                <Card className="rounded-[14px] !border-[#dce5f2] !bg-white p-4 dark:!border-[#20334d] dark:!bg-[#0f1d31]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-[14px] font-bold text-[#071d66] dark:text-[#f3f7ff]">
                        {copy.pipeline}
                      </h2>
                      <p className="mt-1 text-[10px] text-[#71809a] dark:text-[#91a3be]">
                        {copy.raw} → {copy.filtered} → {copy.queued} → {copy.analysis} → {copy.persistence}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#eef4ff] px-3 py-1.5 text-[9px] font-semibold text-[#155be7] dark:bg-[#14284a] dark:text-[#6ea8ff]">
                      {coverageFiltered}% filtradas
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <PipelineStep
                      title={copy.raw}
                      value={totalReunioes.toLocaleString(locale)}
                      helper="meetings-index.json"
                    />
                    <PipelineStep
                      title={copy.filtered}
                      value={fila.resumo.total.toLocaleString(locale)}
                      helper="texto_filtrado persistido"
                    />
                    <PipelineStep
                      title={copy.queued}
                      value={fila.resumo.aguardando.toLocaleString(locale)}
                      helper="SQLite queue_jobs"
                    />
                    <PipelineStep
                      title={copy.analysis}
                      value={fila.resumo.processando.toLocaleString(locale)}
                      helper="worker-01"
                      active={fila.resumo.processando > 0}
                    />
                    <PipelineStep
                      title={copy.persistence}
                      value={fila.resumo.concluidos.toLocaleString(locale)}
                      helper="analyses.sqlite3"
                    />
                  </div>
                </Card>

                <Card className="overflow-hidden rounded-[14px] !border-[#dce5f2] !bg-white dark:!border-[#20334d] dark:!bg-[#0f1d31]">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e7edf6] px-4 py-3 dark:border-[#223652]">
                    <div>
                      <h2 className="text-[14px] font-bold text-[#071d66] dark:text-[#f3f7ff]">
                        {copy.jobs}
                      </h2>
                      <p className="mt-1 text-[10px] text-[#8290ae] dark:text-[#8396b3]">
                        {jobsFiltrados.length.toLocaleString(locale)} {copy.jobsLabel}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={copy.search}
                        className="h-9 min-w-[230px] rounded-lg border border-[#dbe4f1] bg-white px-3 text-[11px] text-[#173b84] outline-none focus:border-[#0d57e7] dark:border-[#2a3e5d] dark:bg-[#111f34] dark:text-[#c7d8f3]"
                      />

                      <select
                        value={statusFiltro}
                        onChange={(event) => setStatusFiltro(event.target.value as FiltroStatus)}
                        className="h-9 rounded-lg border border-[#dbe4f1] bg-white px-3 text-[11px] text-[#173b84] dark:border-[#2a3e5d] dark:bg-[#111f34] dark:text-[#c7d8f3]"
                      >
                        <option value="TODOS">{copy.all}</option>
                        <option value="AGUARDANDO">{copy.waiting}</option>
                        <option value="PROCESSANDO">{copy.processing}</option>
                        <option value="CONCLUIDO">{copy.completed}</option>
                        <option value="FALHA">{copy.failures}</option>
                      </select>
                    </div>
                  </div>

                  {jobsFiltrados.length === 0 ? (
                    <div className="p-5">
                      <EmptyState
                        titulo={t("queue.emptyTitle")}
                        descricao={t("queue.emptyBody", { n: fila.resumo.concluidos.toLocaleString(locale) })}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[1120px] text-[10px]">
                          <thead>
                            <tr className="border-b border-[#e6edf6] bg-[#fbfcff] dark:border-[#223652] dark:bg-[#111f34]">
                              <th className="px-3 py-3 text-left font-semibold text-[#49608f] dark:text-[#9fb0c9]">{copy.colJob}</th>
                              <th className="px-3 py-3 text-left font-semibold text-[#49608f] dark:text-[#9fb0c9]">{copy.colClient}</th>
                              <th className="px-3 py-3 text-left font-semibold text-[#49608f] dark:text-[#9fb0c9]">{copy.colMeeting}</th>
                              <th className="px-3 py-3 text-left font-semibold text-[#49608f] dark:text-[#9fb0c9]">{copy.colDate}</th>
                              <th className="px-3 py-3 text-left font-semibold text-[#49608f] dark:text-[#9fb0c9]">{copy.colStage}</th>
                              <th className="px-3 py-3 text-left font-semibold text-[#49608f] dark:text-[#9fb0c9]">{copy.colPriority}</th>
                              <th className="px-3 py-3 text-center font-semibold text-[#49608f] dark:text-[#9fb0c9]">{copy.colAttempts}</th>
                              <th className="px-3 py-3 text-left font-semibold text-[#49608f] dark:text-[#9fb0c9]">{copy.colStatus}</th>
                              <th className="px-3 py-3 text-left font-semibold text-[#49608f] dark:text-[#9fb0c9]">{copy.colDuration}</th>
                              <th className="px-3 py-3 text-right font-semibold text-[#49608f] dark:text-[#9fb0c9]">{copy.colActions}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {jobsVisiveis.map((job) => {
                              const reuniao = porId.get(job.id_reuniao);
                              return (
                                <tr
                                  key={job.id_reuniao}
                                  className="border-b border-[#edf1f7] bg-white transition-colors hover:bg-[#f8faff] dark:border-[#20334d] dark:bg-[#0f1d31] dark:hover:bg-[#162640]"
                                >
                                  <td className="px-3 py-3 font-semibold text-[#174cbd] dark:text-[#6ea8ff]">
                                    {job.id_reuniao}
                                  </td>
                                  <td className="max-w-[150px] truncate px-3 py-3 font-medium text-[#183b86] dark:text-[#c7d8f3]">
                                    {reuniao?.codt ?? "—"}
                                  </td>
                                  <td className="max-w-[190px] px-3 py-3 text-[#354f85] dark:text-[#b7c9e8]">
                                    <div className="line-clamp-2">
                                      {reuniao?.unidade ?? copy.noMeeting}
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 whitespace-nowrap text-[#52658f] dark:text-[#9fb0c9]">
                                    {reuniao ? formatarData(reuniao.dataCriacao) : "—"}
                                  </td>
                                  <td className="px-3 py-3 font-medium whitespace-nowrap text-[#1458e5] dark:text-[#6ea8ff]">
                                    <div className="flex items-center gap-2">
                                      {job.status === "PROCESSANDO" && (
                                        <span className="h-2 w-2 animate-pulse rounded-full bg-[#1458e5]" />
                                      )}
                                      {stageFor(job.status, copy)}
                                    </div>
                                  </td>
                                  <td className="px-3 py-3">
                                    <select
                                      value={job.prioridade}
                                      disabled={job.status === "PROCESSANDO" || busyAction !== null}
                                      onChange={(event) =>
                                        void mudarPrioridade(
                                          job,
                                          event.target.value as PrioridadeJobFila,
                                        )
                                      }
                                      className="rounded-md border border-[#dbe4f1] bg-white px-2 py-1.5 text-[9px] font-semibold text-[#34558f] disabled:opacity-50 dark:border-[#2a3e5d] dark:bg-[#111f34] dark:text-[#b7c9e8]"
                                    >
                                      <option value="ALTA">{copy.high}</option>
                                      <option value="MEDIA">{copy.medium}</option>
                                      <option value="BAIXA">{copy.low}</option>
                                    </select>
                                  </td>
                                  <td className="px-3 py-3 text-center font-semibold text-[#53658f] dark:text-[#9fb0c9]">
                                    {job.tentativas}
                                  </td>
                                  <td className="px-3 py-3">
                                    <span className={`rounded-md px-2 py-1.5 text-[9px] font-semibold ${statusStyle(job.status)}`}>
                                      {job.status}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 whitespace-nowrap text-[#52658f] dark:text-[#9fb0c9]">
                                    {reuniao ? formatarDuracao(reuniao.duracaoSegundos) : "—"}
                                  </td>
                                  <td className="px-3 py-3 text-right">
                                    {job.status === "FALHA" ? (
                                      <button
                                        type="button"
                                        title={job.erro ?? copy.details}
                                        disabled={busyAction !== null}
                                        onClick={() =>
                                          void executar(`retry:${job.id_reuniao}`, () =>
                                            reprocessarJob(job.id_reuniao),
                                          )
                                        }
                                        className="rounded-lg bg-[#0d57e7] px-3 py-2 text-[9px] font-semibold text-white hover:bg-[#0b4dd0] disabled:opacity-40"
                                      >
                                        {copy.retry}
                                      </button>
                                    ) : job.erro ? (
                                      <span title={job.erro} className="text-red-500">!</span>
                                    ) : (
                                      <span className="text-[#a5b1c5]">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e7edf6] px-4 py-3 dark:border-[#223652]">
                        <p className="text-[10px] font-medium text-[#6b7ca5] dark:text-[#91a3be]">
                          {copy.showed} {jobsVisiveis.length.toLocaleString(locale)} / {jobsFiltrados.length.toLocaleString(locale)} {copy.jobsLabel}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={paginaAtual === 0}
                            onClick={() => setPagina((value) => Math.max(0, value - 1))}
                            className="rounded-md border border-[#dbe4f1] bg-white px-3 py-2 text-[9px] font-semibold text-[#34558f] disabled:opacity-40 dark:border-[#2a3e5d] dark:bg-[#111f34] dark:text-[#b7c9e8]"
                          >
                            {copy.previous}
                          </button>
                          <span className="rounded-md bg-[#0d57e7] px-3 py-2 text-[9px] font-semibold text-white">
                            {paginaAtual + 1} / {totalPaginas}
                          </span>
                          <button
                            type="button"
                            disabled={paginaAtual >= totalPaginas - 1}
                            onClick={() =>
                              setPagina((value) => Math.min(totalPaginas - 1, value + 1))
                            }
                            className="rounded-md border border-[#dbe4f1] bg-white px-3 py-2 text-[9px] font-semibold text-[#34558f] disabled:opacity-40 dark:border-[#2a3e5d] dark:bg-[#111f34] dark:text-[#b7c9e8]"
                          >
                            {copy.next}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </Card>
              </div>

              <aside className="space-y-4">
                <Card className="rounded-[14px] !border-[#dce5f2] !bg-white p-4 dark:!border-[#20334d] dark:!bg-[#0f1d31]">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[14px] font-bold text-[#071d66] dark:text-[#f3f7ff]">
                      {copy.worker}
                    </h2>
                    <span
                      className={`rounded-md px-2 py-1 text-[8px] font-semibold ${
                        fila.pausada
                          ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-300"
                          : jobAtual
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300"
                            : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300"
                      }`}
                    >
                      {fila.pausada ? copy.paused : jobAtual ? copy.busy : copy.available}
                    </span>
                  </div>

                  <div className="mt-4 rounded-lg border border-[#e8edf5] p-3 dark:border-[#223652]">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-[#183b86] dark:text-[#c7d8f3]">worker-01</span>
                      <span className="text-[#6f7ea7] dark:text-[#91a3be]">
                        {fila.worker_ativo ? "thread online" : "offline"}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-[90px_1fr] gap-y-2 text-[9px]">
                      <span className="text-[#8290ae] dark:text-[#8396b3]">{copy.workerStatus}</span>
                      <strong className="text-[#183b86] dark:text-[#c7d8f3]">
                        {fila.pausada ? copy.paused : jobAtual ? copy.busy : copy.available}
                      </strong>
                      <span className="text-[#8290ae] dark:text-[#8396b3]">{copy.workerJob}</span>
                      <strong className="truncate text-[#183b86] dark:text-[#c7d8f3]">
                        {jobAtual?.id_reuniao ?? "—"}
                      </strong>
                    </div>
                  </div>
                </Card>

                <Card className="rounded-[14px] !border-[#dce5f2] !bg-white p-4 dark:!border-[#20334d] dark:!bg-[#0f1d31]">
                  <h2 className="text-[14px] font-bold text-[#071d66] dark:text-[#f3f7ff]">
                    {copy.events}
                  </h2>

                  <div className="mt-4 space-y-3">
                    {eventos.map((job) => (
                      <div
                        key={`${job.id_reuniao}-${job.atualizado_em}`}
                        className="flex gap-2 border-b border-[#edf1f7] pb-3 last:border-0 dark:border-[#20334d]"
                      >
                        <span className="mt-0.5 shrink-0 text-[8px] font-medium text-[#7b89aa] dark:text-[#8296b5]">
                          {tempoEvento(job.atualizado_em, locale)}
                        </span>
                        <span className={`h-fit rounded px-1.5 py-0.5 text-[7px] font-bold ${statusStyle(job.status)}`}>
                          {job.status}
                        </span>
                        <p className="min-w-0 text-[8px] leading-relaxed text-[#53658f] dark:text-[#9fb0c9]">
                          <strong className="text-[#183b86] dark:text-[#c7d8f3]">{job.id_reuniao}</strong>{" "}
                          {stageFor(job.status, copy)}
                          {job.erro && (
                            <span className="mt-1 block truncate text-red-500" title={job.erro}>
                              {job.erro}
                            </span>
                          )}
                        </p>
                      </div>
                    ))}

                    {eventos.length === 0 && (
                      <p className="py-6 text-center text-[9px] text-[#8290ae] dark:text-[#8396b3]">
                        {copy.noEvents}
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
