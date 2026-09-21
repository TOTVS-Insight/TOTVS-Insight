import NovaAnalise from "@/components/NovaAnalise";
import { useCallback, useMemo, useRef, useState } from "react";
import { getReunioes } from "@/data/repository";
import { carregarTranscricaoReuniao } from "@/data/relatorios";
import { adicionarUpload, getTextoUpload, parseArquivoUpload } from "@/data/sessionUploads";
import useDataset from "@/data/useDataset";
import type { Reuniao } from "@/data/types";
import { useLocale } from "@/i18n/useLocale";
import { capitalizar, formatarData, formatarDuracao, formatarFaixa, ouTraco } from "@/format";
import { SearchIcon, UploadIcon } from "@/icons";
import Card from "@/components/ui/Card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/DataState";
import TranscricaoDrawer from "@/components/TranscricaoDrawer";
import {
  carregarTranscricaoProcessada,
  type TranscricaoProcessada,
} from "@/data/transcricoesProcessadas";

const POR_PAGINA = 25;

const COL_KEYS = [
  "id",
  "client",
  "date",
  "duration",
  "speakers",
  "unit",
  "segment",
  "uf",
  "size",
  "nps",
] as const;

const ALL = "__all__";

type NpsFiltro = "todos" | "comNps" | "promotores" | "detratores";
type PeriodoFiltro = "todos" | "7d" | "30d" | "90d";
type IdiomaLocal = "pt" | "en" | "es";

interface Filtros {
  search: string;
  segmento: string;
  uf: string;
  unidade: string;
  faturamento: string;
  status: string;
  nps: NpsFiltro;
  periodo: PeriodoFiltro;
}

const FILTROS_INICIAIS: Filtros = {
  search: "",
  segmento: ALL,
  uf: ALL,
  unidade: ALL,
  faturamento: ALL,
  status: ALL,
  nps: "todos",
  periodo: "todos",
};

const COPY = {
  pt: {
    all: "Todos",
    actions: "Ações",
    view: "Ver detalhes",
    compare: "Comparar antes/depois",

    filters: "Filtros",
    advancedFilters: "Filtros de negócio",
    filtersDescription:
      "Refine a base por contexto comercial e operacional relevante para a TOTVS.",
    applyFilters: "Aplicar filtros",
    clearFilters: "Limpar",
    activeFilters: "filtros ativos",
    results: "resultados",

    search: "Buscar reunião, cliente ou ID",
    segment: "Segmento",
    state: "UF",
    unit: "Unidade / produto",
    revenue: "Faixa de faturamento",
    processingStatus: "Status de processamento",
    nps: "Perfil NPS",
    period: "Período da base",
    last7: "Últimos 7 dias",
    last30: "Últimos 30 dias",
    last90: "Últimos 90 dias",

    compareTitle: "Comparação pré-análise",
    compareSubtitle:
      "O texto original é comparado com a versão filtrada pelo modelo semântico antes da análise de IA.",
    original: "Transcrição original",
    filtered: "Após filtro ML",
    originalHint: "Conteúdo bruto preservado.",
    filteredHint:
      "Ruído conversacional é reduzido e o conteúdo de negócio é priorizado.",
    unavailableTitle: "Texto da transcrição não disponível",
    unavailableBody:
      "Não foi possível carregar o texto desta transcrição. O sistema tentou primeiro a sessão atual e depois a base da aplicação.",
    mlPreparing: "Processando transcrição...",
    mlRunning: "Carregando versões armazenadas...",
    mlReady: "Versão filtrada disponível",
    mlError: "Não foi possível carregar a versão processada",
    mlModel: "Modelo",
    mlKept: "Conteúdo mantido",
    mlRemoved: "Linhas removidas",
    mlConfidence: "Confiança média",
    copyOriginal: "Copiar original",
    copyFiltered: "Copiar filtrada",
    copied: "Copiado!",
    close: "Fechar",
    openDetail: "Abrir detalhes",

    baseSummary: "Resumo da base",
    baseSummaryHelper: "Distribuição da base conforme o NPS disponível.",
    promoters: "Promotores (9–10)",
    neutrals: "Neutros (7–8)",
    detractors: "Detratores (0–6)",
    withoutNps: "Sem NPS",

    segments: "Segmentos da base",
    noSegments: "Sem segmentos disponíveis.",
    quickActions: "Ações rápidas",
    quickImport: "Importar transcrição",
    quickImportHelper: "Envie um TXT ou JSON e execute o pré-processamento ML.",
    quickFilter: "Abrir filtros",
    quickFilterHelper: "Refine por segmento, porte, unidade, status e NPS.",
    quickCompare: "Comparar transcrição",
    quickCompareHelper: "Abra rapidamente a primeira transcrição disponível.",

    mlBadge: "Pré-filtro ML ativo",
    mlBadgeHelper: "Embeddings multilíngues executados no navegador.",
  },

  en: {
    all: "All",
    actions: "Actions",
    view: "View details",
    compare: "Compare before/after",

    filters: "Filters",
    advancedFilters: "Business filters",
    filtersDescription:
      "Refine the dataset using commercial and operational context relevant to TOTVS.",
    applyFilters: "Apply filters",
    clearFilters: "Clear",
    activeFilters: "active filters",
    results: "results",

    search: "Search meeting, client or ID",
    segment: "Segment",
    state: "State",
    unit: "Unit / product",
    revenue: "Revenue range",
    processingStatus: "Processing status",
    nps: "NPS profile",
    period: "Dataset period",
    last7: "Last 7 days",
    last30: "Last 30 days",
    last90: "Last 90 days",

    compareTitle: "Pre-analysis comparison",
    compareSubtitle:
      "The original text is compared with the version filtered by the semantic model before AI analysis.",
    original: "Original transcript",
    filtered: "After ML filter",
    originalHint: "Raw content is preserved.",
    filteredHint:
      "Conversational noise is reduced and business content is prioritized.",
    unavailableTitle: "Transcript text is unavailable",
    unavailableBody:
      "This transcript text could not be loaded. The system tried the current session first and then the application data source.",
    mlPreparing: "Processing transcript...",
    mlRunning: "Loading stored versions...",
    mlReady: "Filtered version available",
    mlError: "The processed version could not be loaded",
    mlModel: "Model",
    mlKept: "Content kept",
    mlRemoved: "Lines removed",
    mlConfidence: "Average confidence",
    copyOriginal: "Copy original",
    copyFiltered: "Copy filtered",
    copied: "Copied!",
    close: "Close",
    openDetail: "Open details",

    baseSummary: "Database summary",
    baseSummaryHelper: "Dataset distribution based on available NPS.",
    promoters: "Promoters (9–10)",
    neutrals: "Passives (7–8)",
    detractors: "Detractors (0–6)",
    withoutNps: "No NPS",

    segments: "Database segments",
    noSegments: "No segments available.",
    quickActions: "Quick actions",
    quickImport: "Import transcript",
    quickImportHelper: "Upload TXT or JSON and run ML preprocessing.",
    quickFilter: "Open filters",
    quickFilterHelper: "Filter by segment, size, unit, status and NPS.",
    quickCompare: "Compare transcript",
    quickCompareHelper: "Quickly open the first available transcript.",

    mlBadge: "ML pre-filter active",
    mlBadgeHelper: "Multilingual embeddings run in the browser.",
  },

  es: {
    all: "Todos",
    actions: "Acciones",
    view: "Ver detalles",
    compare: "Comparar antes/después",

    filters: "Filtros",
    advancedFilters: "Filtros de negocio",
    filtersDescription:
      "Refina la base usando contexto comercial y operativo relevante para TOTVS.",
    applyFilters: "Aplicar filtros",
    clearFilters: "Limpiar",
    activeFilters: "filtros activos",
    results: "resultados",

    search: "Buscar reunión, cliente o ID",
    segment: "Segmento",
    state: "Estado",
    unit: "Unidad / producto",
    revenue: "Rango de facturación",
    processingStatus: "Estado de procesamiento",
    nps: "Perfil NPS",
    period: "Período de la base",
    last7: "Últimos 7 días",
    last30: "Últimos 30 días",
    last90: "Últimos 90 días",

    compareTitle: "Comparación previa al análisis",
    compareSubtitle:
      "El texto original se compara con la versión filtrada por el modelo semántico antes del análisis de IA.",
    original: "Transcripción original",
    filtered: "Después del filtro ML",
    originalHint: "El contenido bruto se conserva.",
    filteredHint:
      "Se reduce el ruido conversacional y se prioriza el contenido de negocio.",
    unavailableTitle: "El texto de la transcripción no está disponible",
    unavailableBody:
      "No fue posible cargar el texto de esta transcripción. El sistema intentó primero la sesión actual y después la fuente de datos de la aplicación.",
    mlPreparing: "Procesando transcripción...",
    mlRunning: "Cargando versiones almacenadas...",
    mlReady: "Versión filtrada disponible",
    mlError: "No fue posible cargar la versión procesada",
    mlModel: "Modelo",
    mlKept: "Contenido conservado",
    mlRemoved: "Líneas eliminadas",
    mlConfidence: "Confianza media",
    copyOriginal: "Copiar original",
    copyFiltered: "Copiar filtrada",
    copied: "¡Copiado!",
    close: "Cerrar",
    openDetail: "Abrir detalles",

    baseSummary: "Resumen de la base",
    baseSummaryHelper: "Distribución de la base según el NPS disponible.",
    promoters: "Promotores (9–10)",
    neutrals: "Neutros (7–8)",
    detractors: "Detractores (0–6)",
    withoutNps: "Sin NPS",

    segments: "Segmentos de la base",
    noSegments: "No hay segmentos disponibles.",
    quickActions: "Acciones rápidas",
    quickImport: "Importar transcripción",
    quickImportHelper: "Sube TXT o JSON y ejecuta el preprocesamiento ML.",
    quickFilter: "Abrir filtros",
    quickFilterHelper: "Filtra por segmento, tamaño, unidad, estado y NPS.",
    quickCompare: "Comparar transcripción",
    quickCompareHelper: "Abre rápidamente la primera transcripción disponible.",

    mlBadge: "Prefiltro ML activo",
    mlBadgeHelper: "Embeddings multilingües ejecutados en el navegador.",
  },
} as const;

function idiomaDaLocale(locale: string): IdiomaLocal {
  const normalizada = locale.toLowerCase();
  if (normalizada.startsWith("en")) return "en";
  if (normalizada.startsWith("es")) return "es";
  return "pt";
}

function opcoesDe(reunioes: Reuniao[], campo: keyof Reuniao): string[] {
  const set = new Set<string>();

  for (const r of reunioes) {
    const v = r[campo];
    if (v !== null && v !== undefined && v !== "") set.add(String(v));
  }

  return [...set].sort();
}

function npsClass(nps: number) {
  if (nps >= 9) return "text-emerald-600 dark:text-emerald-400";
  if (nps >= 7) return "text-amber-600 dark:text-amber-400";
  return "text-red-500 dark:text-red-400";
}

function npsBadgeClass(nps: number) {
  if (nps >= 9) {
    return "border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400";
  }

  if (nps >= 7) {
    return "border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-400";
  }

  return "border-red-100 bg-red-50 text-red-500 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400";
}

function initials(value: string) {
  const clean = value.trim();
  if (!clean) return "—";

  return clean
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function dataTimestamp(value: Reuniao["data"]) {
  const time = new Date(String(value)).getTime();
  return Number.isFinite(time) ? time : null;
}

function MetricCard({
  title,
  value,
  caption,
  tone,
  icon,
}: {
  title: string;
  value: string;
  caption: string;
  tone: "blue" | "cyan" | "violet" | "green" | "amber" | "red";
  icon: string;
}) {
  const tones = {
    blue:
      "border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-400",
    cyan:
      "border-cyan-100 bg-cyan-50 text-cyan-600 dark:border-cyan-900/40 dark:bg-cyan-950/30 dark:text-cyan-400",
    violet:
      "border-violet-100 bg-violet-50 text-violet-600 dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-violet-400",
    green:
      "border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400",
    amber:
      "border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-400",
    red:
      "border-red-100 bg-red-50 text-red-500 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400",
  } as const;

  return (
    <div className="rounded-[14px] border border-[#dfe7f3] bg-white px-4 py-4 shadow-[0_5px_16px_rgba(17,48,104,0.035)] dark:border-[#223652] dark:bg-[#0f1d31]">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-lg font-semibold ${tones[tone]}`}
          aria-hidden="true"
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-[#183b86] dark:text-[#c7d8f3]">
            {title}
          </p>
          <p className="mt-1 text-[25px] font-bold leading-none tracking-[-0.03em] text-[#071d66] dark:text-[#f3f7ff]">
            {value}
          </p>
        </div>
      </div>

      <p className="mt-3 text-[11px] font-medium text-[#6f7ea7] dark:text-[#91a3be]">
        {caption}
      </p>
    </div>
  );
}

function ComparacaoTranscricao({
  reuniao,
  transcricao,
  carregando,
  erro,
  copy,
  onClose,
  onOpenDetail,
}: {
  reuniao: Reuniao;
  transcricao: TranscricaoProcessada | null;
  carregando: boolean;
  erro: string | null;
  copy: (typeof COPY)[IdiomaLocal];
  onClose: () => void;
  onOpenDetail: () => void;
}) {
  const [copiado, setCopiado] = useState<"original" | "filtrada" | null>(null);

  async function copiar(tipo: "original" | "filtrada") {
    const texto =
      tipo === "original"
        ? transcricao?.texto_original
        : transcricao?.texto_filtrado;

    if (!texto) return;

    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(tipo);
      window.setTimeout(() => setCopiado(null), 1300);
    } catch {
      // A visualização continua funcionando se clipboard não estiver disponível.
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#07111f]/65 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[94vh] w-full max-w-[1280px] flex-col overflow-hidden rounded-[18px] border border-[#dce5f2] bg-white shadow-2xl dark:border-[#2a3e5d] dark:bg-[#0f1d31]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e7edf6] px-6 py-5 dark:border-[#223652]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[13px] font-semibold text-[#155be7] dark:text-[#6ea8ff]">
                {reuniao.id} · {reuniao.codt}
              </p>

              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
                ML
              </span>

              {transcricao && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                  {transcricao.status_transcricao}
                </span>
              )}
            </div>

            <h2 className="mt-1 text-[22px] font-bold text-[#071d66] dark:text-[#f3f7ff]">
              {copy.compareTitle}
            </h2>

            <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-[#6576a5] dark:text-[#9aaccc]">
              {copy.compareSubtitle}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onOpenDetail}
              className="rounded-lg border border-[#dbe4f1] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#153b94] hover:bg-[#f7faff] dark:border-[#2a3e5d] dark:bg-[#111f34] dark:text-[#c7d8f3] dark:hover:bg-[#162640]"
            >
              {copy.openDetail}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-[#0d57e7] px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-[#0b4dd0]"
            >
              {copy.close}
            </button>
          </div>
        </div>

        {carregando ? (
          <div className="flex min-h-[380px] flex-col items-center justify-center px-6 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#d9e5f8] border-t-[#0d57e7]" />
            <h3 className="mt-4 text-[16px] font-bold text-[#071d66] dark:text-[#f3f7ff]">
              {copy.mlRunning}
            </h3>
            <p className="mt-2 text-[12px] text-[#7080a5] dark:text-[#91a3be]">
              Nenhum modelo é executado nesta tela.
            </p>
          </div>
        ) : erro || !transcricao ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-xl text-red-500 dark:bg-red-950/30">
              !
            </div>

            <h3 className="mt-4 text-[17px] font-bold text-[#071d66] dark:text-[#f3f7ff]">
              {copy.unavailableTitle}
            </h3>

            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-[#6576a5] dark:text-[#9aaccc]">
              {erro ?? copy.unavailableBody}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 border-b border-[#e7edf6] px-5 py-3 dark:border-[#223652] sm:grid-cols-4">
              <div className="rounded-lg bg-[#f7faff] p-3 dark:bg-[#111f34]">
                <p className="text-[10px] text-[#7080a5] dark:text-[#91a3be]">
                  {copy.mlKept}
                </p>
                <p className="mt-1 text-[16px] font-bold text-[#071d66] dark:text-[#f3f7ff]">
                  {transcricao.filtro_ml.percentual_mantido}%
                </p>
              </div>

              <div className="rounded-lg bg-[#f7faff] p-3 dark:bg-[#111f34]">
                <p className="text-[10px] text-[#7080a5] dark:text-[#91a3be]">
                  {copy.mlRemoved}
                </p>
                <p className="mt-1 text-[16px] font-bold text-[#071d66] dark:text-[#f3f7ff]">
                  {transcricao.filtro_ml.linhas_removidas}
                </p>
              </div>

              <div className="rounded-lg bg-[#f7faff] p-3 dark:bg-[#111f34]">
                <p className="text-[10px] text-[#7080a5] dark:text-[#91a3be]">
                  {copy.mlConfidence}
                </p>
                <p className="mt-1 text-[16px] font-bold text-[#071d66] dark:text-[#f3f7ff]">
                  {Math.round(transcricao.filtro_ml.confianca_media * 100)}%
                </p>
              </div>

              <div className="rounded-lg bg-[#f7faff] p-3 dark:bg-[#111f34]">
                <p className="text-[10px] text-[#7080a5] dark:text-[#91a3be]">
                  {copy.mlModel}
                </p>
                <p className="mt-1 truncate text-[11px] font-semibold text-[#155be7] dark:text-[#6ea8ff]">
                  {transcricao.filtro_ml.modelo}
                </p>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 overflow-auto lg:grid-cols-2">
              <section className="min-h-0 border-b border-[#e7edf6] p-5 dark:border-[#223652] lg:border-b-0 lg:border-r">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-[15px] font-bold text-[#071d66] dark:text-[#f3f7ff]">
                      {copy.original}
                    </h3>
                    <p className="mt-1 text-[11px] text-[#7080a5] dark:text-[#91a3be]">
                      {copy.originalHint}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void copiar("original")}
                    className="rounded-lg border border-[#dbe4f1] px-3 py-2 text-[11px] font-semibold text-[#153b94] hover:bg-[#f7faff] dark:border-[#2a3e5d] dark:text-[#c7d8f3] dark:hover:bg-[#162640]"
                  >
                    {copiado === "original" ? copy.copied : copy.copyOriginal}
                  </button>
                </div>

                <pre className="max-h-[52vh] overflow-auto whitespace-pre-wrap rounded-xl border border-[#e5ebf4] bg-[#fbfcff] p-4 font-mono text-[12px] leading-6 text-[#354f85] dark:border-[#223652] dark:bg-[#0b1628] dark:text-[#c7d8f3]">
                  {transcricao.texto_original}
                </pre>
              </section>

              <section className="min-h-0 p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-[15px] font-bold text-[#071d66] dark:text-[#f3f7ff]">
                      {copy.filtered}
                    </h3>
                    <p className="mt-1 text-[11px] text-[#7080a5] dark:text-[#91a3be]">
                      {copy.filteredHint}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void copiar("filtrada")}
                    className="rounded-lg border border-[#dbe4f1] px-3 py-2 text-[11px] font-semibold text-[#153b94] hover:bg-[#f7faff] dark:border-[#2a3e5d] dark:text-[#c7d8f3] dark:hover:bg-[#162640]"
                  >
                    {copiado === "filtrada" ? copy.copied : copy.copyFiltered}
                  </button>
                </div>

                <pre className="max-h-[52vh] overflow-auto whitespace-pre-wrap rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 font-mono text-[12px] leading-6 text-[#285e4a] dark:border-emerald-900/40 dark:bg-emerald-950/15 dark:text-emerald-200">
                  {transcricao.texto_filtrado}
                </pre>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function TranscricoesPage() {
  const { t, locale } = useLocale();
  const copy = COPY[idiomaDaLocale(locale)];

  const fileRef = useRef<HTMLInputElement>(null);
  const filtrosRef = useRef<HTMLDivElement>(null);

  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [rascunho, setRascunho] = useState<Filtros>(FILTROS_INICIAIS);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIAIS);

  const [pagina, setPagina] = useState(0);
  const [aberta, setAberta] = useState<Reuniao | null>(null);
  const [textoLocalAberto, setTextoLocalAberto] = useState<string | undefined>(undefined);

  const [comparando, setComparando] = useState<Reuniao | null>(null);
  const [transcricaoComparando, setTranscricaoComparando] =
    useState<TranscricaoProcessada | null>(null);
  const [comparacaoCarregando, setComparacaoCarregando] = useState(false);
  const [comparacaoErro, setComparacaoErro] = useState<string | null>(null);

  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [uploadErro, setUploadErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const { data, loading, error, sugestao } = useDataset<Reuniao[]>(
    useCallback(() => getReunioes(), []),
  );

  const reunioes = data ?? [];

  const segmentos = useMemo(() => opcoesDe(reunioes, "segmento"), [reunioes]);
  const ufs = useMemo(() => opcoesDe(reunioes, "uf"), [reunioes]);
  const unidades = useMemo(() => opcoesDe(reunioes, "unidade"), [reunioes]);
  const faturamentos = useMemo(
    () => opcoesDe(reunioes, "faixaFaturamento"),
    [reunioes],
  );
  const statuses = useMemo(() => opcoesDe(reunioes, "status"), [reunioes]);

  const dataMaisRecente = useMemo(() => {
    const datas = reunioes
      .map((r) => dataTimestamp(r.data))
      .filter((value): value is number => value !== null);

    return datas.length ? Math.max(...datas) : null;
  }, [reunioes]);

  const filtradas = useMemo(() => {
    const termo = filtros.search.trim().toLowerCase();

    const dias =
      filtros.periodo === "7d"
        ? 7
        : filtros.periodo === "30d"
          ? 30
          : filtros.periodo === "90d"
            ? 90
            : null;

    const limitePeriodo =
      dias !== null && dataMaisRecente !== null
        ? dataMaisRecente - dias * 24 * 60 * 60 * 1000
        : null;

    return reunioes.filter((r) => {
      const passouNps =
        filtros.nps === "todos" ||
        (filtros.nps === "comNps" && r.nps !== null) ||
        (filtros.nps === "promotores" && r.nps !== null && r.nps >= 9) ||
        (filtros.nps === "detratores" && r.nps !== null && r.nps < 7);

      const dataRegistro = dataTimestamp(r.data);
      const passouPeriodo =
        limitePeriodo === null ||
        (dataRegistro !== null && dataRegistro >= limitePeriodo);

      return (
        passouNps &&
        passouPeriodo &&
        (filtros.segmento === ALL || String(r.segmento ?? "") === filtros.segmento) &&
        (filtros.uf === ALL || String(r.uf ?? "") === filtros.uf) &&
        (filtros.unidade === ALL || String(r.unidade ?? "") === filtros.unidade) &&
        (filtros.faturamento === ALL ||
          String(r.faixaFaturamento ?? "") === filtros.faturamento) &&
        (filtros.status === ALL || String(r.status ?? "") === filtros.status) &&
        (termo === "" ||
          r.codt.toLowerCase().includes(termo) ||
          r.id.toLowerCase().includes(termo) ||
          (r.unidade ?? "").toLowerCase().includes(termo) ||
          (r.segmento ?? "").toLowerCase().includes(termo))
      );
    });
  }, [reunioes, filtros, dataMaisRecente]);

  const totalPaginas = Math.ceil(filtradas.length / POR_PAGINA);
  const paginaAtual = Math.min(pagina, Math.max(totalPaginas - 1, 0));
  const visiveis = filtradas.slice(
    paginaAtual * POR_PAGINA,
    (paginaAtual + 1) * POR_PAGINA,
  );

  const resumoVisual = useMemo(() => {
    const comNps = reunioes.filter((r) => r.nps !== null);
    const promotores = comNps.filter((r) => (r.nps ?? 0) >= 9).length;
    const neutros = comNps.filter((r) => (r.nps ?? 0) >= 7 && (r.nps ?? 0) < 9).length;
    const detratores = comNps.filter((r) => (r.nps ?? 10) < 7).length;
    const unidadesCount = new Set(
      reunioes
        .map((r) => r.unidade)
        .filter((valor): valor is string => Boolean(valor && valor.trim())),
    ).size;

    return {
      total: reunioes.length,
      comNps: comNps.length,
      promotores,
      neutros,
      detratores,
      unidades: unidadesCount,
    };
  }, [reunioes]);

  const distribuicaoSegmentos = useMemo(() => {
    const mapa = new Map<string, number>();

    for (const reuniao of reunioes) {
      const chave = reuniao.segmento
        ? capitalizar(reuniao.segmento)
        : t("transcripts.notInformed");

      mapa.set(chave, (mapa.get(chave) ?? 0) + 1);
    }

    return [...mapa.entries()]
      .map(([label, quantidade]) => ({
        label,
        quantidade,
        percentual: reunioes.length
          ? Math.round((quantidade / reunioes.length) * 100)
          : 0,
      }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);
  }, [reunioes, t]);

  const quantidadeFiltrosAtivos = Object.entries(filtros).filter(([key, value]) => {
    if (key === "search") return Boolean(String(value).trim());
    if (key === "nps") return value !== "todos";
    if (key === "periodo") return value !== "todos";
    return value !== ALL;
  }).length;

  async function carregarTextoDaReuniao(
    reuniao: Reuniao,
  ): Promise<string | undefined> {
    // 1. Upload da sessão: instantâneo e não faz chamada externa.
    const local = getTextoUpload(reuniao.id);
    if (local) return local;

    // 2. Fallback para a fonte de dados que o próprio projeto já usa em Relatórios.
    // Não cria endpoint novo e não altera o backend.
    try {
      const resultado = await carregarTranscricaoReuniao(reuniao.id);
      const texto = resultado?.texto?.trim();
      return texto ? texto : undefined;
    } catch {
      return undefined;
    }
  }

  async function abrirTranscricao(reuniao: Reuniao) {
    const texto = await carregarTextoDaReuniao(reuniao);
    setTextoLocalAberto(texto);
    setAberta(reuniao);
  }

  async function abrirComparacao(reuniao: Reuniao) {
    setComparando(reuniao);
    setTranscricaoComparando(null);
    setComparacaoErro(null);
    setComparacaoCarregando(true);

    try {
      /**
       * IMPORTANTE:
       * esta tela só lê o artefato criado pelo pipeline.
       * Nenhum modelo ML roda aqui.
       */
      const processada = await carregarTranscricaoProcessada(reuniao.id);

      if (!processada) {
        setComparacaoErro(
          "A versão processada ainda não está disponível para esta reunião. Execute o pipeline de filtragem antes da análise.",
        );
        return;
      }

      setTranscricaoComparando(processada);
    } catch (err) {
      setComparacaoErro(
        err instanceof Error
          ? err.message
          : "Falha ao carregar as versões armazenadas da transcrição.",
      );
    } finally {
      setComparacaoCarregando(false);
    }
  }

  function aplicarFiltros() {
    setFiltros(rascunho);
    setPagina(0);
    setFiltrosAbertos(false);
  }

  function limparFiltros() {
    setRascunho(FILTROS_INICIAIS);
    setFiltros(FILTROS_INICIAIS);
    setPagina(0);
  }

  function abrirPainelFiltros() {
    setFiltrosAbertos((value) => !value);

    window.setTimeout(() => {
      filtrosRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 50);
  }

  function compararPrimeiraDisponivel() {
    const primeira = visiveis[0] ?? reunioes[0];

    if (!primeira) {
      setUploadErro(copy.unavailableBody);
      return;
    }

    setUploadErro(null);
    void abrirComparacao(primeira);
  }

  async function aoEscolherArquivo(file: File | null) {
    if (!file) return;

    setUploadErro(null);
    setUploadMsg(null);
    setEnviando(true);

    try {
      const texto = await file.text();
      const upload = parseArquivoUpload(file.name, texto);

      adicionarUpload(upload);

      /**
       * A importação preserva a versão bruta.
       *
       * A filtragem NÃO acontece nesta tela. Ela pertence ao pipeline
       * de processamento (server-side/offline), que persiste texto_filtrado.
       */
      setUploadMsg(t("transcripts.uploadOk", { id: upload.reuniao.id }));
      setPagina(0);
      setTextoLocalAberto(upload.texto);
      setAberta(upload.reuniao);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("transcripts.uploadFail");
      setUploadErro(msg);
    } finally {
      setEnviando(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="-m-2 rounded-[18px] bg-[#f5f8fd] p-2 transition-colors duration-200 dark:bg-[#07111f] sm:-m-3 sm:p-3 lg:-m-4 lg:p-4">
      <div className="rounded-[16px] border border-[#dce5f2] bg-white px-5 py-5 shadow-[0_10px_30px_rgba(29,72,145,0.045)] dark:border-[#20334d] dark:bg-[#0f1d31] sm:px-6">
        {/* Cabeçalho: sem botão estranho de "Aplicar filtros". */}
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[12px] font-semibold text-[#1b4fc6] dark:text-[#6ea8ff]">
              {t("dashboard.welcome")}
            </p>

            <h1 className="mt-1 text-[32px] font-bold leading-none tracking-[-0.035em] text-[#071d66] dark:text-[#f3f7ff]">
              {t("transcripts.title")}
            </h1>

            <p className="mt-2 text-[13px] text-[#6576a5] dark:text-[#9aaccc]">
              {t("transcripts.subtitle")}
            </p>

            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
              <span>✦</span>
              <span>{copy.mlBadge}</span>
              <span className="font-normal opacity-75">Pipeline armazenado · a comparação não executa o modelo.</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.json,text/plain,application/json"
              className="hidden"
              onChange={(e) => void aoEscolherArquivo(e.target.files?.[0] ?? null)}
            />

            <button
              type="button"
              disabled={enviando}
              onClick={() => fileRef.current?.click()}
              title={t("transcripts.uploadHint")}
              className="flex h-11 items-center gap-2 rounded-lg border border-[#d6e0ef] bg-white px-4 text-[12px] font-semibold text-[#153b94] transition-colors hover:bg-[#f8faff] disabled:opacity-60 dark:border-[#2a3e5d] dark:bg-[#111f34] dark:text-[#c7d8f3] dark:hover:bg-[#162640]"
            >
              <UploadIcon size={15} />
              {enviando ? copy.mlPreparing : t("transcripts.upload")}
            </button>

            <div className="[&_*]:!shadow-none">
              <NovaAnalise />
            </div>

            <button
              type="button"
              onClick={abrirPainelFiltros}
              className={`flex h-11 items-center gap-2 rounded-lg border px-4 text-[12px] font-semibold transition-colors ${filtrosAbertos || quantidadeFiltrosAtivos > 0
                  ? "border-[#0d57e7] bg-[#eef4ff] text-[#0d57e7] dark:bg-[#14284a] dark:text-[#6ea8ff]"
                  : "border-[#d6e0ef] bg-white text-[#153b94] hover:bg-[#f8faff] dark:border-[#2a3e5d] dark:bg-[#111f34] dark:text-[#c7d8f3] dark:hover:bg-[#162640]"
                }`}
            >
              <span aria-hidden="true">⌄</span>
              {copy.filters}
              {quantidadeFiltrosAtivos > 0 && (
                <span className="rounded-full bg-[#0d57e7] px-2 py-0.5 text-[10px] text-white">
                  {quantidadeFiltrosAtivos}
                </span>
              )}
            </button>
          </div>
        </div>

        {loading && (
          <div className="mt-5">
            <LoadingState label={t("transcripts.loading")} />
          </div>
        )}

        {error && (
          <div className="mt-5">
            <ErrorState error={error} sugestao={sugestao} />
          </div>
        )}

        {data && (
          <>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <MetricCard
                title={t("transcripts.total")}
                value={resumoVisual.total.toLocaleString(locale)}
                caption={t("transcripts.totalHelper")}
                tone="blue"
                icon="▤"
              />
              <MetricCard
                title={t("transcripts.withNps")}
                value={resumoVisual.comNps.toLocaleString(locale)}
                caption={t("transcripts.withNpsHelper")}
                tone="cyan"
                icon="◎"
              />
              <MetricCard
                title={t("transcripts.promoters")}
                value={resumoVisual.promotores.toLocaleString(locale)}
                caption={t("transcripts.promotersHelper")}
                tone="green"
                icon="✓"
              />
              <MetricCard
                title={t("transcripts.neutrals")}
                value={resumoVisual.neutros.toLocaleString(locale)}
                caption={t("transcripts.neutralsHelper")}
                tone="violet"
                icon="○"
              />
              <MetricCard
                title={t("transcripts.detractors")}
                value={resumoVisual.detratores.toLocaleString(locale)}
                caption={t("transcripts.detractorsHelper")}
                tone="red"
                icon="!"
              />
              <MetricCard
                title={t("transcripts.units")}
                value={resumoVisual.unidades.toLocaleString(locale)}
                caption={t("transcripts.unitsHelper")}
                tone="amber"
                icon="⌂"
              />
            </div>

            {uploadMsg && (
              <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-[12px] font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400">
                {uploadMsg}
              </p>
            )}

            {uploadErro && (
              <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[12px] font-medium text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
                {uploadErro}
              </p>
            )}

            {/* Painel de filtros fica onde faz sentido: acima da lista. */}
            {filtrosAbertos && (
              <Card
                className="mt-4 rounded-[14px] !border-[#dce5f2] !bg-white p-5 dark:!border-[#20334d] dark:!bg-[#0f1d31]"
              >
                <div ref={filtrosRef} className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-[15px] font-bold text-[#071d66] dark:text-[#f3f7ff]">
                      {copy.advancedFilters}
                    </h2>
                    <p className="mt-1 text-[11px] text-[#7080a5] dark:text-[#91a3be]">
                      {copy.filtersDescription}
                    </p>
                  </div>

                  <span className="rounded-full bg-[#eef4ff] px-3 py-1.5 text-[10px] font-semibold text-[#155be7] dark:bg-[#14284a] dark:text-[#6ea8ff]">
                    {quantidadeFiltrosAtivos} {copy.activeFilters}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-semibold text-[#53658f] dark:text-[#9fb0c9]">
                      {copy.search}
                    </span>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7382a7]">
                        <SearchIcon size={14} />
                      </span>
                      <input
                        value={rascunho.search}
                        onChange={(e) =>
                          setRascunho((f) => ({ ...f, search: e.target.value }))
                        }
                        className="h-10 w-full rounded-lg border border-[#dbe4f1] bg-white pl-9 pr-3 text-[12px] text-[#102d72] outline-none focus:border-[#0d57e7] dark:border-[#2a3e5d] dark:bg-[#111f34] dark:text-[#dce8fa]"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-semibold text-[#53658f] dark:text-[#9fb0c9]">
                      {copy.segment}
                    </span>
                    <select
                      value={rascunho.segmento}
                      onChange={(e) =>
                        setRascunho((f) => ({ ...f, segmento: e.target.value }))
                      }
                      className="h-10 w-full rounded-lg border border-[#dbe4f1] bg-white px-3 text-[12px] text-[#244178] dark:border-[#2a3e5d] dark:bg-[#111f34] dark:text-[#b7c9e8]"
                    >
                      <option value={ALL}>{copy.all}</option>
                      {segmentos.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-semibold text-[#53658f] dark:text-[#9fb0c9]">
                      {copy.unit}
                    </span>
                    <select
                      value={rascunho.unidade}
                      onChange={(e) =>
                        setRascunho((f) => ({ ...f, unidade: e.target.value }))
                      }
                      className="h-10 w-full rounded-lg border border-[#dbe4f1] bg-white px-3 text-[12px] text-[#244178] dark:border-[#2a3e5d] dark:bg-[#111f34] dark:text-[#b7c9e8]"
                    >
                      <option value={ALL}>{copy.all}</option>
                      {unidades.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-semibold text-[#53658f] dark:text-[#9fb0c9]">
                      {copy.revenue}
                    </span>
                    <select
                      value={rascunho.faturamento}
                      onChange={(e) =>
                        setRascunho((f) => ({ ...f, faturamento: e.target.value }))
                      }
                      className="h-10 w-full rounded-lg border border-[#dbe4f1] bg-white px-3 text-[12px] text-[#244178] dark:border-[#2a3e5d] dark:bg-[#111f34] dark:text-[#b7c9e8]"
                    >
                      <option value={ALL}>{copy.all}</option>
                      {faturamentos.map((item) => (
                        <option key={item} value={item}>
                          {formatarFaixa(item)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-semibold text-[#53658f] dark:text-[#9fb0c9]">
                      {copy.processingStatus}
                    </span>
                    <select
                      value={rascunho.status}
                      onChange={(e) =>
                        setRascunho((f) => ({ ...f, status: e.target.value }))
                      }
                      className="h-10 w-full rounded-lg border border-[#dbe4f1] bg-white px-3 text-[12px] text-[#244178] dark:border-[#2a3e5d] dark:bg-[#111f34] dark:text-[#b7c9e8]"
                    >
                      <option value={ALL}>{copy.all}</option>
                      {statuses.map((item) => (
                        <option key={item} value={item}>
                          {capitalizar(item)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-semibold text-[#53658f] dark:text-[#9fb0c9]">
                      {copy.state}
                    </span>
                    <select
                      value={rascunho.uf}
                      onChange={(e) =>
                        setRascunho((f) => ({ ...f, uf: e.target.value }))
                      }
                      className="h-10 w-full rounded-lg border border-[#dbe4f1] bg-white px-3 text-[12px] text-[#244178] dark:border-[#2a3e5d] dark:bg-[#111f34] dark:text-[#b7c9e8]"
                    >
                      <option value={ALL}>{copy.all}</option>
                      {ufs.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-semibold text-[#53658f] dark:text-[#9fb0c9]">
                      {copy.nps}
                    </span>
                    <select
                      value={rascunho.nps}
                      onChange={(e) =>
                        setRascunho((f) => ({
                          ...f,
                          nps: e.target.value as NpsFiltro,
                        }))
                      }
                      className="h-10 w-full rounded-lg border border-[#dbe4f1] bg-white px-3 text-[12px] text-[#244178] dark:border-[#2a3e5d] dark:bg-[#111f34] dark:text-[#b7c9e8]"
                    >
                      <option value="todos">{copy.all}</option>
                      <option value="comNps">{t("transcripts.withNps")}</option>
                      <option value="promotores">{t("transcripts.promoters")}</option>
                      <option value="detratores">{t("transcripts.detractors")}</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-semibold text-[#53658f] dark:text-[#9fb0c9]">
                      {copy.period}
                    </span>
                    <select
                      value={rascunho.periodo}
                      onChange={(e) =>
                        setRascunho((f) => ({
                          ...f,
                          periodo: e.target.value as PeriodoFiltro,
                        }))
                      }
                      className="h-10 w-full rounded-lg border border-[#dbe4f1] bg-white px-3 text-[12px] text-[#244178] dark:border-[#2a3e5d] dark:bg-[#111f34] dark:text-[#b7c9e8]"
                    >
                      <option value="todos">{copy.all}</option>
                      <option value="7d">{copy.last7}</option>
                      <option value="30d">{copy.last30}</option>
                      <option value="90d">{copy.last90}</option>
                    </select>
                  </label>
                </div>

                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={limparFiltros}
                    className="h-10 rounded-lg border border-[#dbe4f1] bg-white px-4 text-[11px] font-semibold text-[#53658f] hover:bg-[#f7faff] dark:border-[#2a3e5d] dark:bg-[#111f34] dark:text-[#9fb0c9]"
                  >
                    {copy.clearFilters}
                  </button>

                  <button
                    type="button"
                    onClick={aplicarFiltros}
                    className="h-10 rounded-lg bg-[#0d57e7] px-5 text-[11px] font-semibold text-white hover:bg-[#0b4dd0]"
                  >
                    {copy.applyFilters}
                  </button>
                </div>
              </Card>
            )}

            <div className="mt-4 grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_280px]">
              <div className="min-w-0">
                <Card className="overflow-hidden rounded-[14px] !border-[#dce5f2] !bg-white dark:!border-[#20334d] dark:!bg-[#0f1d31]">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e7edf6] px-4 py-3 dark:border-[#223652]">
                    <div>
                      <p className="text-[12px] font-semibold text-[#183b86] dark:text-[#c7d8f3]">
                        {filtradas.length.toLocaleString(locale)} {copy.results}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#8290ae] dark:text-[#8396b3]">
                        {quantidadeFiltrosAtivos} {copy.activeFilters}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={abrirPainelFiltros}
                      className="rounded-lg border border-[#dbe4f1] bg-white px-3 py-2 text-[11px] font-semibold text-[#153b94] hover:bg-[#f7faff] dark:border-[#2a3e5d] dark:bg-[#111f34] dark:text-[#c7d8f3]"
                    >
                      {copy.filters}
                    </button>
                  </div>

                  {filtradas.length === 0 ? (
                    <div className="p-6">
                      <EmptyState
                        titulo={t("transcripts.emptyTitle")}
                        descricao={t("transcripts.emptyBody")}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[1120px] table-auto text-[12px]">
                          <thead>
                            <tr className="border-b border-[#e5ebf4] bg-[#fbfcff] dark:border-[#223652] dark:bg-[#111f34]">
                              {COL_KEYS.map((key) => (
                                <th
                                  key={key}
                                  className="px-3.5 py-3.5 text-left text-[11px] font-semibold whitespace-nowrap text-[#49608f] dark:text-[#9fb0c9]"
                                >
                                  {t(`transcripts.col.${key}`)}
                                </th>
                              ))}

                              {/* Ações sticky: ficam SEMPRE visíveis. */}
                              <th className="sticky right-0 z-20 min-w-[225px] border-l border-[#e5ebf4] bg-[#fbfcff] px-3.5 py-3.5 text-right text-[11px] font-semibold text-[#49608f] shadow-[-8px_0_18px_rgba(15,39,80,0.04)] dark:border-[#223652] dark:bg-[#111f34] dark:text-[#9fb0c9]">
                                {copy.actions}
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {visiveis.map((r) => (
                              <tr
                                key={r.id}
                                onClick={() => void abrirTranscricao(r)}
                                className="group cursor-pointer border-b border-[#edf1f7] bg-white transition-colors hover:bg-[#f7faff] dark:border-[#20334d] dark:bg-[#0f1d31] dark:hover:bg-[#162640]"
                              >
                                <td className="px-3.5 py-3.5">
                                  <div className="flex items-center gap-2.5">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#155be7] text-[9px] font-bold text-white">
                                      {initials(r.id)}
                                    </span>
                                    <span className="font-semibold whitespace-nowrap text-[#0b48cb] dark:text-[#6ea8ff]">
                                      {r.id}
                                    </span>
                                  </div>
                                </td>

                                <td className="px-3.5 py-3.5 font-medium whitespace-nowrap text-[#183b86] dark:text-[#c7d8f3]">
                                  {r.codt}
                                </td>

                                <td className="px-3.5 py-3.5 whitespace-nowrap text-[#52658f] dark:text-[#9fb0c9]">
                                  {formatarData(r.data)}
                                </td>

                                <td className="px-3.5 py-3.5 whitespace-nowrap text-[#52658f] dark:text-[#9fb0c9]">
                                  {formatarDuracao(r.duracaoSegundos)}
                                </td>

                                <td className="px-3.5 py-3.5 text-center text-[#52658f] dark:text-[#9fb0c9]">
                                  {r.locutores}
                                </td>

                                <td className="max-w-48 truncate px-3.5 py-3.5 font-medium text-[#183b86] dark:text-[#c7d8f3]">
                                  {ouTraco(r.unidade)}
                                </td>

                                <td className="px-3.5 py-3.5 whitespace-nowrap">
                                  <span className="rounded-md bg-[#f1f5fb] px-2.5 py-1.5 text-[11px] font-medium text-[#50648f] dark:bg-[#1a2a43] dark:text-[#9fb0c9]">
                                    {capitalizar(r.segmento)}
                                  </span>
                                </td>

                                <td className="px-3.5 py-3.5 text-[#52658f] dark:text-[#9fb0c9]">
                                  {ouTraco(r.uf)}
                                </td>

                                <td className="px-3.5 py-3.5 whitespace-nowrap text-[#52658f] dark:text-[#9fb0c9]">
                                  {formatarFaixa(r.faixaFaturamento)}
                                </td>

                                <td className="px-3.5 py-3.5">
                                  {r.nps !== null ? (
                                    <span
                                      className={`inline-flex rounded-md border px-2.5 py-1.5 text-[11px] font-semibold ${npsBadgeClass(r.nps)} ${npsClass(r.nps)}`}
                                    >
                                      {r.nps}
                                    </span>
                                  ) : (
                                    <span className="text-[#bcc5d6] dark:text-[#657791]">
                                      —
                                    </span>
                                  )}
                                </td>

                                <td
                                  className="sticky right-0 z-10 min-w-[225px] border-l border-[#edf1f7] bg-white px-3.5 py-3.5 shadow-[-8px_0_18px_rgba(15,39,80,0.04)] group-hover:bg-[#f7faff] dark:border-[#20334d] dark:bg-[#0f1d31]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => void abrirTranscricao(r)}
                                      className="rounded-lg border border-[#dbe4f1] bg-white px-3 py-2 text-[11px] font-semibold text-[#153b94] hover:bg-[#f7faff] dark:border-[#2a3e5d] dark:bg-[#111f34] dark:text-[#c7d8f3]"
                                    >
                                      {copy.view}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => void abrirComparacao(r)}
                                      className="rounded-lg bg-[#0d57e7] px-3 py-2 text-[11px] font-semibold text-white shadow-sm hover:bg-[#0b4dd0]"
                                    >
                                      ↔ {copy.compare}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex flex-col gap-3 border-t border-[#e7edf6] px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#223652]">
                        <p className="text-[11px] font-medium text-[#6b7ca5] dark:text-[#91a3be]">
                          {t("transcripts.pagination", {
                            total: filtradas.length.toLocaleString(locale),
                            from: paginaAtual * POR_PAGINA + 1,
                            to: Math.min(
                              (paginaAtual + 1) * POR_PAGINA,
                              filtradas.length,
                            ),
                          })}
                        </p>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPagina((p) => Math.max(p - 1, 0))}
                            disabled={paginaAtual === 0}
                            className="rounded-lg border border-[#dbe4f1] bg-white px-3 py-2 text-[11px] font-semibold text-[#28457d] disabled:opacity-40 dark:border-[#2a3e5d] dark:bg-[#111f34] dark:text-[#b7c9e8]"
                          >
                            {t("common.prev")}
                          </button>

                          <span className="rounded-lg bg-[#0d57e7] px-3 py-2 text-[11px] font-semibold text-white">
                            {paginaAtual + 1}
                          </span>

                          <span className="text-[11px] font-medium text-[#8290ae] dark:text-[#8396b3]">
                            / {totalPaginas}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              setPagina((p) => Math.min(p + 1, totalPaginas - 1))
                            }
                            disabled={paginaAtual >= totalPaginas - 1}
                            className="rounded-lg border border-[#dbe4f1] bg-white px-3 py-2 text-[11px] font-semibold text-[#28457d] disabled:opacity-40 dark:border-[#2a3e5d] dark:bg-[#111f34] dark:text-[#b7c9e8]"
                          >
                            {t("common.next")}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </Card>
              </div>

              <aside className="flex flex-col gap-3">
                <Card className="rounded-[14px] !border-[#dce5f2] !bg-white p-4 dark:!border-[#20334d] dark:!bg-[#0f1d31]">
                  <h2 className="text-[15px] font-bold text-[#071d66] dark:text-[#f3f7ff]">
                    {copy.baseSummary}
                  </h2>

                  <p className="mt-1 text-[11px] text-[#7080a5] dark:text-[#91a3be]">
                    {copy.baseSummaryHelper}
                  </p>

                  <div className="mt-4 space-y-4">
                    {[
                      {
                        label: copy.promoters,
                        value: resumoVisual.promotores,
                        tone: "bg-emerald-500",
                      },
                      {
                        label: copy.neutrals,
                        value: resumoVisual.neutros,
                        tone: "bg-amber-400",
                      },
                      {
                        label: copy.detractors,
                        value: resumoVisual.detratores,
                        tone: "bg-red-500",
                      },
                      {
                        label: copy.withoutNps,
                        value: Math.max(
                          resumoVisual.total - resumoVisual.comNps,
                          0,
                        ),
                        tone: "bg-slate-300",
                      },
                    ].map((item) => {
                      const pct = resumoVisual.total
                        ? Math.round((item.value / resumoVisual.total) * 100)
                        : 0;

                      return (
                        <div key={item.label}>
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <span className="text-[11px] font-medium text-[#354f85] dark:text-[#b7c9e8]">
                              {item.label}
                            </span>
                            <span className="text-[11px] font-semibold text-[#102d72] dark:text-[#dce8fa]">
                              {item.value}
                              <span className="ml-1 font-medium text-[#8290ae]">
                                {pct}%
                              </span>
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-[#edf2f8] dark:bg-[#22324a]">
                            <div
                              className={`h-full rounded-full ${item.tone}`}
                              style={{
                                width: `${Math.max(
                                  pct,
                                  item.value ? 3 : 0,
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <Card className="rounded-[14px] !border-[#dce5f2] !bg-white p-4 dark:!border-[#20334d] dark:!bg-[#0f1d31]">
                  <h2 className="text-[15px] font-bold text-[#071d66] dark:text-[#f3f7ff]">
                    {copy.quickActions}
                  </h2>

                  <div className="mt-3 space-y-2">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex w-full items-start gap-3 rounded-lg p-2.5 text-left hover:bg-[#f7faff] dark:hover:bg-[#162640]"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edf3ff] text-[#1458e5] dark:bg-[#14284a]">
                        ↑
                      </span>
                      <span>
                        <span className="block text-[12px] font-semibold text-[#183b86] dark:text-[#c7d8f3]">
                          {copy.quickImport}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-[#8290ae] dark:text-[#8396b3]">
                          {copy.quickImportHelper}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={abrirPainelFiltros}
                      className="flex w-full items-start gap-3 rounded-lg p-2.5 text-left hover:bg-[#f7faff] dark:hover:bg-[#162640]"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f3efff] text-[#7047e8] dark:bg-[#2a234a]">
                        ⌄
                      </span>
                      <span>
                        <span className="block text-[12px] font-semibold text-[#183b86] dark:text-[#c7d8f3]">
                          {copy.quickFilter}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-[#8290ae] dark:text-[#8396b3]">
                          {copy.quickFilterHelper}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={compararPrimeiraDisponivel}
                      className="flex w-full items-start gap-3 rounded-lg p-2.5 text-left hover:bg-[#f7faff] dark:hover:bg-[#162640]"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#0d57e7] dark:bg-blue-950/30 dark:text-blue-300">
                        ↔
                      </span>
                      <span>
                        <span className="block text-[12px] font-semibold text-[#183b86] dark:text-[#c7d8f3]">
                          {copy.quickCompare}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-[#8290ae] dark:text-[#8396b3]">
                          {copy.quickCompareHelper}
                        </span>
                      </span>
                    </button>
                  </div>
                </Card>

                <Card className="rounded-[14px] !border-[#dce5f2] !bg-white p-4 dark:!border-[#20334d] dark:!bg-[#0f1d31]">
                  <h2 className="text-[15px] font-bold text-[#071d66] dark:text-[#f3f7ff]">
                    {copy.segments}
                  </h2>

                  <div className="mt-4 space-y-4">
                    {distribuicaoSegmentos.length === 0 && (
                      <p className="text-[11px] text-[#8290ae] dark:text-[#8396b3]">
                        {copy.noSegments}
                      </p>
                    )}

                    {distribuicaoSegmentos.map((item) => (
                      <div key={item.label}>
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <span className="truncate text-[11px] font-medium text-[#354f85] dark:text-[#b7c9e8]">
                            {item.label}
                          </span>

                          <span className="shrink-0 text-[11px] font-semibold text-[#102d72] dark:text-[#dce8fa]">
                            {item.quantidade}
                            <span className="ml-1 font-medium text-[#8290ae]">
                              {item.percentual}%
                            </span>
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-[#edf2f8] dark:bg-[#22324a]">
                          <div
                            className="h-full rounded-full bg-[#0d57e7]"
                            style={{
                              width: `${Math.max(item.percentual, 3)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </aside>
            </div>
          </>
        )}
      </div>

      {aberta && (
        <TranscricaoDrawer
          reuniao={aberta}
          textoLocal={textoLocalAberto}
          onClose={() => {
            setAberta(null);
            setTextoLocalAberto(undefined);
          }}
        />
      )}

      {comparando && (
        <ComparacaoTranscricao
          reuniao={comparando}
          transcricao={transcricaoComparando}
          carregando={comparacaoCarregando}
          erro={comparacaoErro}
          copy={copy}
          onClose={() => {
            setComparando(null);
            setTranscricaoComparando(null);
            setComparacaoErro(null);
          }}
          onOpenDetail={() => {
            const reuniao = comparando;
            const texto = transcricaoComparando?.texto_original;

            setComparando(null);
            setTranscricaoComparando(null);
            setComparacaoErro(null);
            setTextoLocalAberto(texto);
            setAberta(reuniao);
          }}
        />
      )}
    </div>
  );
}
