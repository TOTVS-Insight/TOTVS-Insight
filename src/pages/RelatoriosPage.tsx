import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AlertTriangleIcon,
  BarChartIcon,
  CheckCircleIcon,
  ClockIcon,
  CloseIcon,
  FileTextIcon,
  SearchIcon,
  ShieldIcon,
  SmileIcon,
  TrendingUpIcon,
  UsersIcon,
} from "@/icons";
import { resumirNps } from "@/data/repository";
import type { Reuniao } from "@/data/types";
import type { Analise, ResumoAnalise } from "@/data/analises";
import {
  carregarAnaliseCompleta,
  carregarBaseRelatorios,
  carregarTranscricaoReuniao,
  filtrarAnalisesPorReunioes,
  filtrarReunioes,
  filtrarTextualPorReunioes,
  formatarDataHora,
  formatarNumero,
  formatarPercentual,
  labelContextoConcorrente,
  labelContextoProduto,
  listarConcorrentesDetalhados,
  listarCrossSellDetalhado,
  listarOportunidadesDetalhadas,
  listarProdutosDetalhados,
  listarUpsellDetalhado,
  motivoOportunidade,
  percentual,
  recomendacaoCrossSell,
  recomendacaoOportunidade,
  recomendacaoUpsell,
  type BaseRelatorios,
  type ConcorrenteDetalhado,
  type CrossSellDetalhado,
  type OportunidadeDetalhada,
  type PeriodoRelatorio,
  type ProdutoDetalhado,
  type RegistroRelatorioTextual,
  type TipoRelatorio,
  type UpsellDetalhado,
} from "@/data/relatorios";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/DataState";

const TABS: { id: TipoRelatorio; label: string }[] = [
  { id: "visao-geral", label: "Visão geral" },
  { id: "produtos", label: "Produtos TOTVS" },
  { id: "sentimento", label: "Sentimento do cliente" },
  { id: "oportunidades", label: "Oportunidades" },
  { id: "churn", label: "Risco de churn" },
  { id: "upsell-cross-sell", label: "Upsell e cross-sell" },
  { id: "concorrentes", label: "Concorrentes" },
  { id: "topicos", label: "Tópicos e necessidades" },
  { id: "cliente", label: "Por cliente" },
];

const CORES = ["#1877F2", "#16A765", "#FFB020", "#8B5CF6", "#0EA5E9", "#EF4444"];
const PAGE_SIZE = 20;

type Tone = "blue" | "green" | "red" | "orange" | "purple";

type AgregadoNome = {
  nome: string;
  mencoes: number;
  reunioes: number;
  clientes: number;
};

type AgregadoTopico = AgregadoNome & {
  oportunidades: number;
  produtosSugeridos: string[];
  reunioesComRisco: number;
};

type RiscoCliente = {
  cliente: string;
  alertas: number;
  reunioesComAlerta: number;
  reunioesAnalisadas: number;
  scoreMax: number | null;
};

type ClienteResumo = {
  cliente: string;
  reunioes: number;
  alertas: number;
  oportunidades: number;
  produtos: number;
  concorrentes: number;
  nps: number | null;
  ultimaReuniao: string;
};

type DetalheSelecionado =
  | { kind: "oportunidade"; item: OportunidadeDetalhada }
  | { kind: "produto"; item: ProdutoDetalhado }
  | { kind: "concorrente"; item: ConcorrenteDetalhado }
  | { kind: "upsell"; item: UpsellDetalhado }
  | { kind: "cross-sell"; item: CrossSellDetalhado }
  | { kind: "churn"; resumo: ResumoAnalise; reuniao: Reuniao }
  | { kind: "nps"; reuniao: Reuniao };

function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 overflow-hidden rounded-[14px] border border-[#DCE6F2] bg-white shadow-[0_3px_12px_rgba(15,44,90,0.035)] dark:border-[#243B58] dark:bg-[#0F1D31] ${className}`}
    >
      <div className="flex items-start justify-between gap-4 border-b border-[#EDF2F7] px-5 py-4 dark:border-[#24364E]">
        <div className="min-w-0">
          <h2 className="font-heading text-[18px] font-semibold text-[#082477] dark:text-white">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 font-body text-[13px] leading-relaxed text-[#6A7C98] dark:text-[#A5B4CA]">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function KpiCard({
  title,
  value,
  detail,
  icon,
  tone = "blue",
}: {
  title: string;
  value: string;
  detail: string;
  icon: ReactNode;
  tone?: Tone;
}) {
  const tones: Record<Tone, string> = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
    red: "bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-300",
    orange: "bg-orange-50 text-orange-500 dark:bg-orange-950/40 dark:text-orange-300",
    purple: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300",
  };

  return (
    <div className="min-w-0 rounded-[14px] border border-[#DCE6F2] bg-white px-5 py-4 shadow-[0_3px_12px_rgba(15,44,90,0.035)] dark:border-[#243B58] dark:bg-[#0F1D31]">
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${tones[tone]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-body text-[13px] font-semibold leading-tight text-[#244487] dark:text-[#C5D6EE]">
            {title}
          </p>
          <p className="mt-2 font-heading text-[26px] font-bold leading-none tracking-[-0.03em] text-[#071F72] dark:text-white">
            {value}
          </p>
        </div>
      </div>
      <p className="mt-3 font-body text-[12px] leading-relaxed text-[#71819A] dark:text-[#9FAFC5]">
        {detail}
      </p>
    </div>
  );
}

function Badge({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  const classes: Record<Tone, string> = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200",
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
    red: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-200",
    orange: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-200",
    purple: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-200",
  };

  return (
    <span className={`inline-flex rounded-md px-2.5 py-1 font-body text-[11px] font-semibold ${classes[tone]}`}>
      {children}
    </span>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return <div className="px-5 py-10 text-center font-body text-[14px] text-[#71819A]">{text}</div>;
}

function HorizontalBars({
  data,
  valueLabel = (value) => formatarNumero(value),
}: {
  data: { label: string; value: number; secondary?: string }[];
  valueLabel?: (value: number) => string;
}) {
  const max = Math.max(1, ...data.map((item) => item.value));
  if (data.length === 0) return <EmptyPanel text="Nenhum dado disponível para os filtros selecionados." />;

  return (
    <div className="space-y-4 px-5 py-5">
      {data.map((item, index) => (
        <div key={item.label}>
          <div className="mb-2 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate font-body text-[14px] font-semibold text-[#173A82] dark:text-[#D7E4F6]">
                {item.label}
              </p>
              {item.secondary && (
                <p className="mt-0.5 font-body text-[12px] text-[#7A89A1]">{item.secondary}</p>
              )}
            </div>
            <span className="shrink-0 font-heading text-[14px] font-semibold text-[#0B2A75] dark:text-white">
              {valueLabel(item.value)}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[#EDF2F8] dark:bg-[#24354C]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(3, (item.value / max) * 100)}%`,
                backgroundColor: CORES[index % CORES.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({
  center,
  label,
  data,
}: {
  center: string;
  label: string;
  data: { label: string; value: number; color: string }[];
}) {
  const total = data.reduce((s, item) => s + item.value, 0);
  let cursor = 0;
  const gradientes = data.map((item) => {
    const inicio = total > 0 ? (cursor / total) * 100 : 0;
    cursor += item.value;
    const fim = total > 0 ? (cursor / total) * 100 : 0;
    return `${item.color} ${inicio}% ${fim}%`;
  });

  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-5 px-5 py-6">
      <div
        className="relative flex h-[150px] w-[150px] shrink-0 items-center justify-center rounded-full"
        style={{ background: total > 0 ? `conic-gradient(${gradientes.join(",")})` : "#E8EEF6" }}
      >
        <div className="flex h-[94px] w-[94px] flex-col items-center justify-center rounded-full bg-white text-center dark:bg-[#0F1D31]">
          <strong className="font-heading text-[24px] text-[#0A2877] dark:text-white">{center}</strong>
          <span className="mt-1 max-w-[80px] font-body text-[11px] leading-tight text-[#74839C]">{label}</span>
        </div>
      </div>

      <div className="w-full min-w-0 space-y-3">
        {data.map((item) => (
          <div key={item.label} className="flex w-full min-w-0 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="min-w-0 font-body text-[13px] leading-snug text-[#455F90] dark:text-[#B8C7DB]">
                {item.label}
              </span>
            </div>
            <span className="shrink-0 font-heading text-[13px] font-semibold text-[#0A2A78] dark:text-white">
              {total > 0 ? `${Math.round((item.value / total) * 100)}%` : "0%"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendChart({
  labels,
  series,
}: {
  labels: string[];
  series: { label: string; values: number[]; color: string }[];
}) {
  if (labels.length === 0) return <EmptyPanel text="Sem dados suficientes para montar a evolução." />;

  const width = 720;
  const height = 230;
  const left = 46;
  const top = 22;
  const chartWidth = width - left - 20;
  const chartHeight = height - top - 42;

  function points(values: number[]) {
    return values
      .map((value, index) => {
        const x = left + (labels.length <= 1 ? chartWidth / 2 : (index / (labels.length - 1)) * chartWidth);
        const y = top + chartHeight - (Math.max(0, Math.min(100, value)) / 100) * chartHeight;
        return `${x},${y}`;
      })
      .join(" ");
  }

  return (
    <div className="w-full min-w-0 overflow-hidden px-4 pb-4 pt-3">
      <div className="mb-3 flex flex-wrap gap-x-5 gap-y-2 px-2">
        {series.map((s) => (
          <span key={s.label} className="flex items-center gap-2 font-body text-[12px] text-[#536B99]">
            <span className="h-2 w-5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="block h-auto w-full max-w-full">
        {[0, 25, 50, 75, 100].map((tick) => {
          const y = top + chartHeight - (tick / 100) * chartHeight;
          return (
            <g key={tick}>
              <line x1={left} x2={width - 20} y1={y} y2={y} stroke="#E6EDF6" strokeWidth="1" />
              <text x={left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#71819A">{tick}%</text>
            </g>
          );
        })}

        {series.map((s) => {
          const seriePoints = points(s.values);
          const parsedPoints = seriePoints.split(" ").map((point) => point.split(",").map(Number));
          return (
            <g key={s.label}>
              <polyline points={seriePoints} fill="none" stroke={s.color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
              {parsedPoints.map(([x, y], index) => (
                <circle key={`${s.label}-${index}`} cx={x} cy={y} r="3" fill="white" stroke={s.color} strokeWidth="2" />
              ))}
            </g>
          );
        })}

        {labels.map((label, index) => {
          const x = left + (labels.length <= 1 ? chartWidth / 2 : (index / (labels.length - 1)) * chartWidth);
          return <text key={label} x={x} y={height - 10} textAnchor="middle" fontSize="10" fill="#71819A">{label}</text>;
        })}
      </svg>
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="flex h-10 min-w-0 items-center gap-2 rounded-[9px] border border-[#D9E4F1] bg-white px-3 dark:border-[#30445E] dark:bg-[#102037]">
      <SearchIcon size={17} className="shrink-0 text-[#5570A6]" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent font-body text-[13px] text-[#173A82] outline-none placeholder:text-[#8A9AB2] dark:text-white"
      />
    </label>
  );
}

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (page: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[#EDF2F7] px-5 py-4 dark:border-[#24364E]">
      <span className="font-body text-[12px] text-[#71819A]">Página {page} de {totalPages}</span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="rounded-md border border-[#D9E4F1] px-3 py-2 font-body text-[12px] font-semibold text-[#244487] disabled:opacity-40 dark:border-[#30445E] dark:text-[#C7D6ED]"
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="rounded-md bg-[#0B5CFF] px-3 py-2 font-body text-[12px] font-semibold text-white disabled:opacity-40"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}

function TableShell({ children }: { children: ReactNode }) {
  return <div className="w-full max-w-full min-w-0 overflow-x-auto">{children}</div>;
}

function RowButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-[#D8E4F2] bg-white px-3 py-2 font-body text-[11px] font-semibold text-[#0B5CFF] transition-colors hover:bg-blue-50 dark:border-[#34506F] dark:bg-[#102038] dark:hover:bg-[#142A49]"
    >
      {children}
    </button>
  );
}

function cortar(texto: string, limite = 120) {
  if (texto.length <= limite) return texto;
  return `${texto.slice(0, limite).trim()}…`;
}

function agregarProdutos(registros: RegistroRelatorioTextual[], reunioes: Reuniao[]): AgregadoNome[] {
  const mapaReuniao = new Map(reunioes.map((r) => [r.id, r]));
  const mapa = new Map<string, { mencoes: number; reunioes: Set<string>; clientes: Set<string> }>();

  for (const registro of registros) {
    const reuniao = mapaReuniao.get(registro.idReuniao);
    if (!reuniao) continue;
    for (const produto of registro.produtos ?? []) {
      const atual = mapa.get(produto.nome) ?? { mencoes: 0, reunioes: new Set(), clientes: new Set() };
      atual.mencoes += produto.mencoes;
      atual.reunioes.add(registro.idReuniao);
      atual.clientes.add(reuniao.codt);
      mapa.set(produto.nome, atual);
    }
  }

  return [...mapa.entries()]
    .map(([nome, valor]) => ({ nome, mencoes: valor.mencoes, reunioes: valor.reunioes.size, clientes: valor.clientes.size }))
    .sort((a, b) => b.mencoes - a.mencoes);
}

function agregarConcorrentes(registros: RegistroRelatorioTextual[], reunioes: Reuniao[]): AgregadoNome[] {
  const mapaReuniao = new Map(reunioes.map((r) => [r.id, r]));
  const mapa = new Map<string, { mencoes: number; reunioes: Set<string>; clientes: Set<string> }>();

  for (const registro of registros) {
    const reuniao = mapaReuniao.get(registro.idReuniao);
    if (!reuniao) continue;
    for (const concorrente of registro.concorrentes ?? []) {
      const atual = mapa.get(concorrente.nome) ?? { mencoes: 0, reunioes: new Set(), clientes: new Set() };
      atual.mencoes += concorrente.mencoes;
      atual.reunioes.add(registro.idReuniao);
      atual.clientes.add(reuniao.codt);
      mapa.set(concorrente.nome, atual);
    }
  }

  return [...mapa.entries()]
    .map(([nome, valor]) => ({ nome, mencoes: valor.mencoes, reunioes: valor.reunioes.size, clientes: valor.clientes.size }))
    .sort((a, b) => b.mencoes - a.mencoes);
}

function agregarTopicos(
  registros: RegistroRelatorioTextual[],
  reunioes: Reuniao[],
  analises: ResumoAnalise[],
): AgregadoTopico[] {
  const mapaReuniao = new Map(reunioes.map((r) => [r.id, r]));
  const idsRisco = new Set(analises.filter((a) => a.trechos_com_alerta > 0).map((a) => a.id_reuniao));
  const mapa = new Map<string, {
    mencoes: number;
    oportunidades: number;
    reunioes: Set<string>;
    clientes: Set<string>;
    produtos: Set<string>;
    risco: Set<string>;
  }>();

  for (const registro of registros) {
    const reuniao = mapaReuniao.get(registro.idReuniao);
    if (!reuniao) continue;
    for (const topico of registro.topicos ?? []) {
      const atual = mapa.get(topico.nome) ?? {
        mencoes: 0,
        oportunidades: 0,
        reunioes: new Set(),
        clientes: new Set(),
        produtos: new Set(),
        risco: new Set(),
      };
      atual.mencoes += topico.mencoes;
      atual.oportunidades += topico.sinaisOportunidade;
      atual.reunioes.add(registro.idReuniao);
      atual.clientes.add(reuniao.codt);
      topico.produtosSugeridos.forEach((produto) => atual.produtos.add(produto));
      if (idsRisco.has(registro.idReuniao)) atual.risco.add(registro.idReuniao);
      mapa.set(topico.nome, atual);
    }
  }

  return [...mapa.entries()]
    .map(([nome, valor]) => ({
      nome,
      mencoes: valor.mencoes,
      oportunidades: valor.oportunidades,
      reunioes: valor.reunioes.size,
      clientes: valor.clientes.size,
      produtosSugeridos: [...valor.produtos],
      reunioesComRisco: valor.risco.size,
    }))
    .sort((a, b) => b.mencoes - a.mencoes);
}

function agregarRiscoPorCliente(analises: ResumoAnalise[], reunioes: Reuniao[]): RiscoCliente[] {
  const mapaReuniao = new Map(reunioes.map((r) => [r.id, r]));
  const mapa = new Map<string, RiscoCliente>();

  for (const analise of analises) {
    const reuniao = mapaReuniao.get(analise.id_reuniao);
    if (!reuniao) continue;
    const atual = mapa.get(reuniao.codt) ?? {
      cliente: reuniao.codt,
      alertas: 0,
      reunioesComAlerta: 0,
      reunioesAnalisadas: 0,
      scoreMax: null,
    };
    atual.reunioesAnalisadas += 1;
    atual.alertas += analise.trechos_com_alerta;
    if (analise.trechos_com_alerta > 0) atual.reunioesComAlerta += 1;
    if (analise.score_max !== null && (atual.scoreMax === null || analise.score_max > atual.scoreMax)) {
      atual.scoreMax = analise.score_max;
    }
    mapa.set(reuniao.codt, atual);
  }

  return [...mapa.values()].filter((item) => item.alertas > 0).sort((a, b) => b.alertas - a.alertas);
}

function gerarSerieMensal(
  reunioes: Reuniao[],
  oportunidades: OportunidadeDetalhada[],
  analises: ResumoAnalise[],
) {
  const meses = [...new Set(reunioes.map((r) => r.data.slice(0, 7)))].sort().slice(-6);
  const mapaReuniao = new Map(reunioes.map((r) => [r.id, r]));

  const labels = meses.map((mes) => {
    const [ano, numero] = mes.split("-");
    const data = new Date(Number(ano), Number(numero) - 1, 1);
    return data.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
  });

  const oportunidadesPorMes = meses.map((mes) => oportunidades.filter((item) => item.reuniao.data.startsWith(mes)).length);
  const riscoPorMes = meses.map((mes) =>
    analises.filter((analise) => {
      const reuniao = mapaReuniao.get(analise.id_reuniao);
      return reuniao?.data.startsWith(mes) && analise.trechos_com_alerta > 0;
    }).length,
  );
  const promotoresPorMes = meses.map((mes) => {
    const notas = reunioes.filter((r) => r.data.startsWith(mes) && r.nps !== null).map((r) => r.nps as number);
    if (notas.length === 0) return 0;
    return percentual(notas.filter((nota) => nota >= 9).length, notas.length);
  });

  const maxOportunidades = Math.max(1, ...oportunidadesPorMes);
  const maxRisco = Math.max(1, ...riscoPorMes);

  return {
    labels,
    series: [
      { label: "Oportunidades", values: oportunidadesPorMes.map((v) => percentual(v, maxOportunidades)), color: "#16A765" },
      { label: "Reuniões com risco", values: riscoPorMes.map((v) => percentual(v, maxRisco)), color: "#EF4444" },
      { label: "Promotores no NPS", values: promotoresPorMes, color: "#1877F2" },
    ],
  };
}

function InsightDrawer({ detalhe, onClose }: { detalhe: DetalheSelecionado | null; onClose: () => void }) {
  const [analise, setAnalise] = useState<Analise | null>(null);
  const [carregandoAnalise, setCarregandoAnalise] = useState(false);
  const [transcricao, setTranscricao] = useState<string | null>(null);
  const [carregandoTranscricao, setCarregandoTranscricao] = useState(false);
  const [mostrarTranscricao, setMostrarTranscricao] = useState(false);

  useEffect(() => {
    setAnalise(null);
    setTranscricao(null);
    setMostrarTranscricao(false);
    if (!detalhe || detalhe.kind !== "churn") return;
    setCarregandoAnalise(true);
    carregarAnaliseCompleta(detalhe.resumo)
      .then(setAnalise)
      .finally(() => setCarregandoAnalise(false));
  }, [detalhe]);

  if (!detalhe) return null;

  const reuniao = "item" in detalhe ? detalhe.item.reuniao : detalhe.reuniao;

  async function carregarTranscricao() {
    setMostrarTranscricao(true);
    if (transcricao !== null || carregandoTranscricao) return;
    setCarregandoTranscricao(true);
    try {
      const resultado = await carregarTranscricaoReuniao(reuniao.id);
      setTranscricao(resultado?.texto ?? "Transcrição não disponível nesta cópia do projeto.");
    } finally {
      setCarregandoTranscricao(false);
    }
  }

  let title = "Detalhe do insight";
  let badge: ReactNode = null;
  let evidence: string | null = null;
  let motivo: string | null = null;
  let recomendacao: string | null = null;
  let extra: ReactNode = null;

  if (detalhe.kind === "oportunidade") {
    const item = detalhe.item.evidencia;
    title = "Oportunidade detectada";
    badge = <Badge tone="green">Sinal de oportunidade</Badge>;
    evidence = item.trecho;
    motivo = motivoOportunidade(item);
    recomendacao = recomendacaoOportunidade(item);
    extra = (
      <>
        <Field label="Necessidade detectada" value={item.topico} />
        <Field label="Sinal encontrado" value={item.sinal} />
        <Field label="Produtos TOTVS relacionados" value={item.produtosSugeridos.join(", ") || "Nenhum mapeamento automático"} />
        <Field label="Relevância heurística" value={`${item.relevancia}/100`} />
      </>
    );
  } else if (detalhe.kind === "produto") {
    const item = detalhe.item.evidencia;
    title = `Menção a ${item.produto}`;
    badge = <Badge tone="blue">Produto TOTVS</Badge>;
    evidence = item.trecho;
    motivo = `A menção foi classificada como “${labelContextoProduto(item.contexto)}” de acordo com palavras próximas na conversa.`;
    recomendacao = item.contexto === "problema-reclamacao"
      ? "Investigar a causa da insatisfação e registrar a ação de acompanhamento."
      : item.contexto === "interesse-oportunidade" || item.contexto === "expansao"
        ? "Validar o interesse e avaliar a próxima ação comercial."
        : "Usar o trecho como contexto para entender a relação do cliente com o produto.";
    extra = <Field label="Contexto da menção" value={labelContextoProduto(item.contexto)} />;
  } else if (detalhe.kind === "concorrente") {
    const item = detalhe.item.evidencia;
    title = `Menção a ${item.concorrente}`;
    badge = <Badge tone="orange">Marca / concorrente</Badge>;
    evidence = item.trecho;
    motivo = `A marca apareceu em contexto classificado como “${labelContextoConcorrente(item.contexto)}”. A classificação é textual e não significa automaticamente ameaça competitiva.`;
    recomendacao = item.contexto === "migracao-troca" || item.contexto === "avaliacao-comercial"
      ? "Priorizar validação do contexto com o cliente e entender critérios de decisão, prazo e motivos da comparação."
      : "Consultar o trecho e confirmar o papel da marca antes de tomar uma ação comercial.";
    extra = <Field label="Contexto" value={labelContextoConcorrente(item.contexto)} />;
  } else if (detalhe.kind === "upsell") {
    const item = detalhe.item.evidencia;
    title = "Sinal de upsell";
    badge = <Badge tone="purple">Upsell potencial</Badge>;
    evidence = item.trecho;
    motivo = `Foi identificado o sinal de expansão “${item.sinal}” no trecho.`;
    recomendacao = recomendacaoUpsell(item);
    extra = <Field label="Produtos relacionados" value={item.produtosRelacionados.join(", ") || "A validar"} />;
  } else if (detalhe.kind === "cross-sell") {
    const item = detalhe.item.evidencia;
    title = "Potencial de cross-sell";
    badge = <Badge tone="purple">Cross-sell potencial</Badge>;
    evidence = item.trecho;
    motivo = `A reunião cita ${item.produtosContexto.join(", ")} e também apresenta uma necessidade em “${item.topico}” que pode ter aderência com outra solução TOTVS.`;
    recomendacao = recomendacaoCrossSell(item);
    extra = (
      <>
        <Field label="Necessidade detectada" value={item.topico} />
        <Field label="Produtos citados no contexto" value={item.produtosContexto.join(", ")} />
        <Field label="Produtos sugeridos" value={item.produtosSugeridos.join(", ")} />
      </>
    );
  } else if (detalhe.kind === "nps") {
    title = "Satisfação do cliente";
    badge = detalhe.reuniao.nps !== null && detalhe.reuniao.nps <= 6 ? <Badge tone="red">NPS detrator</Badge> : <Badge tone="green">NPS</Badge>;
    extra = (
      <>
        <Field label="Nota NPS" value={detalhe.reuniao.nps === null ? "Sem resposta" : String(detalhe.reuniao.nps)} />
        <Field label="Data da última pesquisa" value={detalhe.reuniao.dataUltimaPesquisa ?? "—"} />
        <Field label="Segmento" value={detalhe.reuniao.segmento ?? "—"} />
      </>
    );
    motivo = "Este dado vem da nota NPS disponível na base; não é uma classificação automática de sentimento textual.";
    recomendacao = detalhe.reuniao.nps !== null && detalhe.reuniao.nps <= 6
      ? "Cruzar a insatisfação com os alertas de churn e tópicos discutidos nas reuniões mais recentes."
      : "Usar o NPS como contexto adicional junto às análises das reuniões.";
  } else if (detalhe.kind === "churn") {
    title = "Risco de churn";
    badge = <Badge tone="red">Alerta do modelo</Badge>;
    extra = (
      <>
        <Field label="Trechos classificados como risco" value={formatarNumero(detalhe.resumo.trechos_com_alerta)} />
        <Field label="Termos mais recorrentes" value={detalhe.resumo.termos_risco.join(" · ") || "—"} />
        <Field
          label="Score máximo do modelo"
          value={detalhe.resumo.score_max === null ? "—" : detalhe.resumo.score_max.toLocaleString("pt-BR", { maximumFractionDigits: 3 })}
        />
      </>
    );
    motivo = "O modelo classificou um ou mais trechos desta reunião como risco. O score é um score de classificação do trecho e não uma probabilidade de cancelamento.";
    recomendacao = "Leia os trechos sinalizados abaixo e use as recomendações do modelo como apoio para priorizar a investigação e a ação de retenção.";
  }

  const riscos = analise?.trechos.filter((trecho) => trecho.rotulo_modelo === "risco") ?? [];

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-[#06122A]/35" onMouseDown={onClose}>
      <aside
        className="h-full w-full max-w-[560px] overflow-y-auto bg-[#F8FAFD] shadow-[-18px_0_55px_rgba(8,25,60,0.22)] dark:bg-[#081526]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#DCE6F2] bg-white px-6 py-5 dark:border-[#243B58] dark:bg-[#0F1D31]">
          <div>
            <div className="mb-2">{badge}</div>
            <h2 className="font-heading text-[24px] font-bold text-[#071F72] dark:text-white">{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-[#60749B] hover:bg-[#EEF4FF] dark:hover:bg-[#162842]">
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <Panel title="Contexto da reunião">
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              <Field label="Cliente" value={reuniao.codt} />
              <Field label="Reunião" value={reuniao.id} />
              <Field label="Data" value={formatarDataHora(reuniao.data)} />
              <Field label="Segmento" value={reuniao.segmento ?? "—"} />
              {extra}
            </div>
          </Panel>

          {evidence && (
            <Panel title="Evidência" subtitle="Trecho real da transcrição que originou este sinal.">
              <blockquote className="m-5 rounded-[12px] border-l-4 border-[#0B5CFF] bg-[#F4F8FF] px-4 py-4 font-body text-[14px] leading-relaxed text-[#344D77] dark:bg-[#13253D] dark:text-[#D5E1F1]">
                “{evidence}”
              </blockquote>
            </Panel>
          )}

          {detalhe.kind === "churn" && (
            <Panel title="Trechos classificados como risco" subtitle="Evidências retornadas pelo modelo atual.">
              {carregandoAnalise ? (
                <div className="p-5 font-body text-[13px] text-[#71819A]">Carregando análise…</div>
              ) : riscos.length === 0 ? (
                <EmptyPanel text="Não foi possível carregar os trechos detalhados desta análise." />
              ) : (
                <div className="divide-y divide-[#EDF2F7] dark:divide-[#24364E]">
                  {riscos.map((trecho) => (
                    <div key={trecho.trecho} className="p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <Badge tone="red">Trecho {trecho.trecho}</Badge>
                        <span className="font-body text-[12px] text-[#6E809C]">
                          score {trecho.score_modelo?.toLocaleString("pt-BR", { maximumFractionDigits: 3 }) ?? "—"}
                        </span>
                      </div>
                      <p className="mt-3 font-body text-[14px] leading-relaxed text-[#344D77] dark:text-[#D5E1F1]">“{trecho.texto}”</p>
                      <div className="mt-4 rounded-[10px] bg-[#F8FAFD] p-4 dark:bg-[#13233A]">
                        <p className="font-body text-[12px] font-semibold uppercase tracking-wide text-[#6A7D9B]">Motivo</p>
                        <p className="mt-1 font-body text-[13px] leading-relaxed text-[#405A84] dark:text-[#C0CDE0]">{trecho.motivo}</p>
                        <p className="mt-3 font-body text-[12px] font-semibold uppercase tracking-wide text-[#6A7D9B]">Recomendação</p>
                        <p className="mt-1 font-body text-[13px] leading-relaxed text-[#405A84] dark:text-[#C0CDE0]">{trecho.recomendacao}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          )}

          {motivo && (
            <Panel title="Por que isso foi sinalizado?">
              <p className="p-5 font-body text-[14px] leading-relaxed text-[#425B85] dark:text-[#C4D0E1]">{motivo}</p>
            </Panel>
          )}

          {recomendacao && (
            <Panel title="Próxima ação sugerida">
              <div className="m-5 rounded-[12px] bg-[#EEF8F3] p-4 dark:bg-emerald-950/30">
                <p className="font-body text-[14px] leading-relaxed text-[#276348] dark:text-emerald-200">{recomendacao}</p>
              </div>
            </Panel>
          )}

          <button
            type="button"
            onClick={carregarTranscricao}
            className="w-full rounded-[10px] bg-[#0B5CFF] px-4 py-3 font-body text-[14px] font-semibold text-white transition-colors hover:bg-[#084EDB]"
          >
            {mostrarTranscricao ? "Atualizar transcrição" : "Abrir transcrição completa"}
          </button>

          {mostrarTranscricao && (
            <Panel title="Transcrição completa">
              <div className="max-h-[360px] overflow-y-auto whitespace-pre-wrap p-5 font-body text-[12px] leading-relaxed text-[#4B628A] dark:text-[#B9C8DC]">
                {carregandoTranscricao ? "Carregando transcrição…" : transcricao ?? "—"}
              </div>
            </Panel>
          )}
        </div>
      </aside>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="font-body text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7A8BA5]">{label}</p>
      <p className="mt-1 break-words font-body text-[13px] font-medium text-[#24447C] dark:text-[#D5E1F1]">{value}</p>
    </div>
  );
}

function RelatorioOverview({
  reunioes,
  registros,
  analises,
  oportunidades,
  produtos,
  topicos,
  onDetalhe,
}: {
  reunioes: Reuniao[];
  registros: RegistroRelatorioTextual[];
  analises: ResumoAnalise[];
  oportunidades: OportunidadeDetalhada[];
  produtos: AgregadoNome[];
  topicos: AgregadoTopico[];
  onDetalhe: (detalhe: DetalheSelecionado) => void;
}) {
  const nps = resumirNps(reunioes);
  const risco = analises.filter((a) => a.trechos_com_alerta > 0);
  const mencoesProdutos = produtos.reduce((s, item) => s + item.mencoes, 0);
  const promotores = nps.respondentes > 0 ? percentual(nps.promotores, nps.respondentes) : 0;
  const trend = gerarSerieMensal(reunioes, oportunidades, analises);
  const detalhesProdutos = listarProdutosDetalhados(registros, reunioes);
  const resumosRisco = risco
    .map((resumo) => ({ resumo, reuniao: reunioes.find((r) => r.id === resumo.id_reuniao) }))
    .filter((item): item is { resumo: ResumoAnalise; reuniao: Reuniao } => Boolean(item.reuniao));

  return (
    <div className="space-y-4">
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard title="Reuniões no período" value={formatarNumero(reunioes.length)} detail="Base usada neste relatório." icon={<UsersIcon size={20} />} />
        <KpiCard title="Sinais de oportunidade" value={formatarNumero(oportunidades.length)} detail="Sinais textuais que podem ser investigados." icon={<TrendingUpIcon size={20} />} tone="green" />
        <KpiCard title="Reuniões com alerta de churn" value={formatarNumero(risco.length)} detail={`${formatarNumero(risco.reduce((s, a) => s + a.trechos_com_alerta, 0))} trechos classificados como risco.`} icon={<ShieldIcon size={20} />} tone="red" />
        <KpiCard title="Menções a produtos TOTVS" value={formatarNumero(mencoesProdutos)} detail={`${produtos.length} produtos identificados.`} icon={<FileTextIcon size={20} />} tone="purple" />
        <KpiCard title="Promotores no NPS" value={formatarPercentual(promotores)} detail={`${formatarNumero(nps.respondentes)} reuniões com NPS disponível.`} icon={<SmileIcon size={20} />} tone="green" />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel title="Evolução dos principais indicadores" subtitle="Tendência normalizada para comparação visual." className="xl:col-span-1">
          <TrendChart labels={trend.labels} series={trend.series} />
        </Panel>
        <Panel title="Distribuição dos temas nas reuniões" subtitle="Temas identificados diretamente nas transcrições.">
          <DonutChart
            center={formatarNumero(reunioes.length)}
            label="reuniões no filtro"
            data={topicos.slice(0, 5).map((item, index) => ({ label: item.nome, value: item.mencoes, color: CORES[index % CORES.length] }))}
          />
        </Panel>
        <Panel title="Sentimento / satisfação" subtitle="Recorte real baseado no NPS disponível na base.">
          <DonutChart
            center={nps.score === null ? "—" : String(nps.score)}
            label="NPS"
            data={[
              { label: "Promotores", value: nps.promotores, color: "#16A765" },
              { label: "Neutros", value: nps.neutros, color: "#FFB020" },
              { label: "Detratores", value: nps.detratores, color: "#EF4444" },
            ]}
          />
        </Panel>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel title="Produtos TOTVS mais mencionados" subtitle="Volume real de menções nas transcrições.">
          <HorizontalBars data={produtos.slice(0, 6).map((item) => ({ label: item.nome, value: item.mencoes, secondary: `${item.reunioes} reuniões · ${item.clientes} clientes` }))} />
        </Panel>
        <Panel title="Principais oportunidades identificadas" subtitle="Sinais textuais com maior relevância heurística.">
          {oportunidades.length === 0 ? <EmptyPanel text="Nenhuma oportunidade encontrada." /> : (
            <div className="divide-y divide-[#EDF2F7] dark:divide-[#24364E]">
              {oportunidades.slice(0, 5).map((item, index) => (
                <button key={`${item.idReuniao}-${item.evidencia.inicio}-${index}`} type="button" onClick={() => onDetalhe({ kind: "oportunidade", item })} className="block w-full px-5 py-4 text-left hover:bg-[#F8FBFF] dark:hover:bg-[#13233A]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-heading text-[14px] font-semibold text-[#173A82] dark:text-white">{item.evidencia.topico}</p>
                      <p className="mt-1 font-body text-[12px] text-[#72829B]">{item.reuniao.codt} · {formatarDataHora(item.reuniao.data)}</p>
                    </div>
                    <Badge tone="green">{item.evidencia.relevancia}/100</Badge>
                  </div>
                  <p className="mt-2 font-body text-[13px] leading-relaxed text-[#536B91] dark:text-[#B9C7DA]">“{cortar(item.evidencia.trecho, 120)}”</p>
                </button>
              ))}
            </div>
          )}
        </Panel>
        <Panel title="Clientes com mais alertas de churn" subtitle="Baseado nos trechos classificados pelo modelo atual.">
          <div className="divide-y divide-[#EDF2F7] dark:divide-[#24364E]">
            {resumosRisco.slice(0, 5).map(({ resumo, reuniao }) => (
              <button key={resumo.id} type="button" onClick={() => onDetalhe({ kind: "churn", resumo, reuniao })} className="block w-full px-5 py-4 text-left hover:bg-[#F8FBFF] dark:hover:bg-[#13233A]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-heading text-[14px] font-semibold text-[#173A82] dark:text-white">{reuniao.codt}</p>
                    <p className="mt-1 font-body text-[12px] text-[#72829B]">{formatarDataHora(reuniao.data)}</p>
                  </div>
                  <Badge tone="red">{resumo.trechos_com_alerta} alerta(s)</Badge>
                </div>
                <p className="mt-2 font-body text-[12px] text-[#536B91] dark:text-[#B9C7DA]">{resumo.termos_risco.slice(0, 5).join(" · ") || "Abra para ver os trechos detalhados."}</p>
              </button>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Evidências recentes" subtitle="Algumas das evidências que sustentam os números acima.">
        <TableShell>
          <table className="w-full min-w-[920px] border-collapse">
            <thead>
              <tr className="border-b border-[#E8EEF6] bg-[#FBFCFE] dark:border-[#24364E] dark:bg-[#102038]">
                {['Tipo', 'Cliente', 'Data', 'Evidência', 'Ação'].map((head) => <th key={head} className="px-5 py-3 text-left font-body text-[11px] font-semibold uppercase tracking-wide text-[#70829F]">{head}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                ...oportunidades.slice(0, 4).map((item) => ({ type: "Oportunidade", tone: "green" as Tone, client: item.reuniao.codt, date: item.reuniao.data, text: item.evidencia.trecho, open: () => onDetalhe({ kind: "oportunidade", item }) })),
                ...detalhesProdutos.slice(0, 4).map((item) => ({ type: `Produto: ${item.evidencia.produto}`, tone: "blue" as Tone, client: item.reuniao.codt, date: item.reuniao.data, text: item.evidencia.trecho, open: () => onDetalhe({ kind: "produto", item }) })),
              ].map((row, index) => (
                <tr key={`${row.type}-${index}`} className="border-b border-[#EDF2F7] last:border-0 dark:border-[#24364E]">
                  <td className="px-5 py-3"><Badge tone={row.tone}>{row.type}</Badge></td>
                  <td className="px-5 py-3 font-body text-[13px] font-semibold text-[#254680] dark:text-[#D3E0F1]">{row.client}</td>
                  <td className="px-5 py-3 font-body text-[12px] text-[#6D7E99]">{formatarDataHora(row.date)}</td>
                  <td className="max-w-[420px] px-5 py-3 font-body text-[12px] leading-relaxed text-[#536B91] dark:text-[#B9C7DA]">“{cortar(row.text, 150)}”</td>
                  <td className="px-5 py-3"><RowButton onClick={row.open}>Ver detalhe</RowButton></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      </Panel>
    </div>
  );
}

function RelatorioProdutos({
  reunioes,
  registros,
  agregados,
  itens,
  busca,
  setBusca,
  page,
  setPage,
  onDetalhe,
}: {
  reunioes: Reuniao[];
  registros: RegistroRelatorioTextual[];
  agregados: AgregadoNome[];
  itens: ProdutoDetalhado[];
  busca: string;
  setBusca: (value: string) => void;
  page: number;
  setPage: (page: number) => void;
  onDetalhe: (detalhe: DetalheSelecionado) => void;
}) {
  const filtrados = itens.filter((item) => {
    const q = busca.trim().toLocaleLowerCase("pt-BR");
    if (!q) return true;
    return [item.evidencia.produto, item.reuniao.codt, item.evidencia.contexto, item.evidencia.trecho].some((valor) => valor.toLocaleLowerCase("pt-BR").includes(q));
  });
  const pagina = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const reunioesComProduto = new Set(registros.filter((r) => (r.produtos ?? []).length > 0).map((r) => r.idReuniao)).size;
  const clientes = new Set(itens.map((item) => item.reuniao.codt)).size;
  const total = agregados.reduce((s, item) => s + item.mencoes, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Menções a produtos" value={formatarNumero(total)} detail="Ocorrências encontradas nas transcrições." icon={<FileTextIcon size={20} />} tone="purple" />
        <KpiCard title="Reuniões com produtos citados" value={formatarNumero(reunioesComProduto)} detail={`${formatarPercentual(percentual(reunioesComProduto, reunioes.length))} das reuniões do filtro.`} icon={<UsersIcon size={20} />} />
        <KpiCard title="Produtos identificados" value={formatarNumero(agregados.length)} detail="Produtos distintos encontrados." icon={<BarChartIcon size={20} />} tone="green" />
        <KpiCard title="Clientes envolvidos" value={formatarNumero(clientes)} detail="Clientes com pelo menos uma menção." icon={<UsersIcon size={20} />} tone="orange" />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,.75fr)_minmax(0,1.25fr)]">
        <Panel title="Produtos mais mencionados" subtitle="Volume, reuniões e clientes associados.">
          <HorizontalBars data={agregados.slice(0, 8).map((item) => ({ label: item.nome, value: item.mencoes, secondary: `${item.reunioes} reuniões · ${item.clientes} clientes` }))} />
        </Panel>
        <Panel title="Contexto das menções" subtitle="Como as menções aparecem na conversa.">
          <DonutChart
            center={formatarNumero(itens.length)}
            label="evidências"
            data={Object.entries(
              itens.reduce<Record<string, number>>((acc, item) => {
                const label = labelContextoProduto(item.evidencia.contexto);
                acc[label] = (acc[label] ?? 0) + 1;
                return acc;
              }, {}),
            ).map(([label, value], index) => ({ label, value, color: CORES[index % CORES.length] }))}
          />
        </Panel>
      </div>

      <Panel
        title="Menções detalhadas"
        subtitle="Cada linha aponta para o trecho real da reunião. Clique para investigar."
        action={<div className="w-[300px] max-w-full"><SearchBox value={busca} onChange={(value) => { setBusca(value); setPage(1); }} placeholder="Buscar produto, cliente, trecho..." /></div>}
      >
        <TableShell>
          <table className="w-full min-w-[980px] border-collapse">
            <thead><tr className="border-b border-[#E8EEF6] bg-[#FBFCFE] dark:border-[#24364E] dark:bg-[#102038]">{['Produto', 'Cliente', 'Data', 'Contexto', 'Evidência', 'Ação'].map((h) => <th key={h} className="px-5 py-3 text-left font-body text-[11px] font-semibold uppercase tracking-wide text-[#70829F]">{h}</th>)}</tr></thead>
            <tbody>
              {pagina.map((item, index) => (
                <tr key={`${item.idReuniao}-${item.evidencia.inicio}-${index}`} className="border-b border-[#EDF2F7] last:border-0 dark:border-[#24364E]">
                  <td className="px-5 py-3 font-heading text-[13px] font-semibold text-[#173A82] dark:text-white">{item.evidencia.produto}</td>
                  <td className="px-5 py-3 font-body text-[13px] text-[#405A84] dark:text-[#C0CDE0]">{item.reuniao.codt}</td>
                  <td className="px-5 py-3 font-body text-[12px] text-[#6D7E99]">{formatarDataHora(item.reuniao.data)}</td>
                  <td className="px-5 py-3"><Badge tone={item.evidencia.contexto === 'problema-reclamacao' ? 'red' : item.evidencia.contexto === 'interesse-oportunidade' || item.evidencia.contexto === 'expansao' ? 'green' : 'blue'}>{labelContextoProduto(item.evidencia.contexto)}</Badge></td>
                  <td className="max-w-[380px] px-5 py-3 font-body text-[12px] leading-relaxed text-[#536B91] dark:text-[#B9C7DA]">“{cortar(item.evidencia.trecho, 150)}”</td>
                  <td className="px-5 py-3"><RowButton onClick={() => onDetalhe({ kind: "produto", item })}>Ver detalhe</RowButton></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
        <Pagination page={page} total={filtrados.length} onChange={setPage} />
      </Panel>
    </div>
  );
}

function RelatorioOportunidades({
  reunioes,
  itens,
  topicos,
  busca,
  setBusca,
  page,
  setPage,
  onDetalhe,
}: {
  reunioes: Reuniao[];
  itens: OportunidadeDetalhada[];
  topicos: AgregadoTopico[];
  busca: string;
  setBusca: (value: string) => void;
  page: number;
  setPage: (page: number) => void;
  onDetalhe: (detalhe: DetalheSelecionado) => void;
}) {
  const clientes = new Set(itens.map((item) => item.reuniao.codt)).size;
  const reunioesCom = new Set(itens.map((item) => item.idReuniao)).size;
  const filtrados = itens.filter((item) => {
    const q = busca.trim().toLocaleLowerCase("pt-BR");
    if (!q) return true;
    return [item.evidencia.topico, item.evidencia.sinal, item.evidencia.trecho, item.reuniao.codt, item.evidencia.produtosSugeridos.join(" ")].some((valor) => valor.toLocaleLowerCase("pt-BR").includes(q));
  });
  const pagina = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const temaLider = [...topicos].sort((a, b) => b.oportunidades - a.oportunidades)[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Sinais de oportunidade" value={formatarNumero(itens.length)} detail="Sinais textuais; devem ser validados pelo responsável." icon={<TrendingUpIcon size={20} />} tone="green" />
        <KpiCard title="Reuniões com oportunidades" value={formatarNumero(reunioesCom)} detail={`${formatarPercentual(percentual(reunioesCom, reunioes.length))} das reuniões do filtro.`} icon={<UsersIcon size={20} />} />
        <KpiCard title="Clientes envolvidos" value={formatarNumero(clientes)} detail="Clientes com pelo menos um sinal." icon={<UsersIcon size={20} />} tone="purple" />
        <KpiCard title="Tema líder" value={temaLider?.nome ?? "—"} detail={temaLider ? `${formatarNumero(temaLider.oportunidades)} sinais detectados.` : "Sem sinais."} icon={<BarChartIcon size={20} />} tone="orange" />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
        <Panel title="Oportunidades por necessidade" subtitle="Quais dores e intenções aparecem mais vezes.">
          <HorizontalBars data={[...topicos].sort((a, b) => b.oportunidades - a.oportunidades).filter((item) => item.oportunidades > 0).slice(0, 8).map((item) => ({ label: item.nome, value: item.oportunidades, secondary: item.produtosSugeridos.join(", ") || "Sem produto mapeado" }))} />
        </Panel>
        <Panel title="Como interpretar" subtitle="O número deixa de ser uma caixa-preta.">
          <div className="space-y-3 p-5 font-body text-[13px] leading-relaxed text-[#4C638B] dark:text-[#BBC9DB]">
            <p><strong className="text-[#173A82] dark:text-white">O que conta como sinal:</strong> um tema de negócio aparece no mesmo trecho de uma expressão de necessidade, busca, avaliação ou intenção.</p>
            <p><strong className="text-[#173A82] dark:text-white">O que não significa:</strong> não é oportunidade comercial confirmada. O vendedor ou CS precisa validar o contexto.</p>
            <p><strong className="text-[#173A82] dark:text-white">O que você consegue fazer abaixo:</strong> abrir exatamente o trecho, ver produtos relacionados e consultar a transcrição inteira.</p>
          </div>
        </Panel>
      </div>

      <Panel
        title="Oportunidades detectadas"
        subtitle="Cliente, necessidade, produto relacionado e evidência real da conversa."
        action={<div className="w-[310px] max-w-full"><SearchBox value={busca} onChange={(value) => { setBusca(value); setPage(1); }} placeholder="Buscar cliente, necessidade, produto..." /></div>}
      >
        <TableShell>
          <table className="w-full min-w-[1050px] border-collapse">
            <thead><tr className="border-b border-[#E8EEF6] bg-[#FBFCFE] dark:border-[#24364E] dark:bg-[#102038]">{['Cliente', 'Data', 'Necessidade', 'Produtos relacionados', 'Evidência', 'Relevância', 'Ação'].map((h) => <th key={h} className="px-5 py-3 text-left font-body text-[11px] font-semibold uppercase tracking-wide text-[#70829F]">{h}</th>)}</tr></thead>
            <tbody>
              {pagina.map((item, index) => (
                <tr key={`${item.idReuniao}-${item.evidencia.inicio}-${index}`} className="border-b border-[#EDF2F7] last:border-0 dark:border-[#24364E]">
                  <td className="px-5 py-3 font-heading text-[13px] font-semibold text-[#173A82] dark:text-white">{item.reuniao.codt}</td>
                  <td className="px-5 py-3 font-body text-[12px] text-[#6D7E99]">{formatarDataHora(item.reuniao.data)}</td>
                  <td className="px-5 py-3 font-body text-[13px] text-[#405A84] dark:text-[#C0CDE0]">{item.evidencia.topico}</td>
                  <td className="px-5 py-3 font-body text-[12px] text-[#405A84] dark:text-[#C0CDE0]">{item.evidencia.produtosSugeridos.join(", ") || "—"}</td>
                  <td className="max-w-[360px] px-5 py-3 font-body text-[12px] leading-relaxed text-[#536B91] dark:text-[#B9C7DA]">“{cortar(item.evidencia.trecho, 145)}”</td>
                  <td className="px-5 py-3"><Badge tone={item.evidencia.relevancia >= 80 ? 'green' : 'orange'}>{item.evidencia.relevancia}/100</Badge></td>
                  <td className="px-5 py-3"><RowButton onClick={() => onDetalhe({ kind: "oportunidade", item })}>Ver detalhe</RowButton></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
        <Pagination page={page} total={filtrados.length} onChange={setPage} />
      </Panel>
    </div>
  );
}

function RelatorioChurn({
  reunioes,
  analises,
  busca,
  setBusca,
  page,
  setPage,
  onDetalhe,
}: {
  reunioes: Reuniao[];
  analises: ResumoAnalise[];
  busca: string;
  setBusca: (value: string) => void;
  page: number;
  setPage: (page: number) => void;
  onDetalhe: (detalhe: DetalheSelecionado) => void;
}) {
  const mapa = new Map(reunioes.map((r) => [r.id, r]));
  const risco = analises.filter((a) => a.trechos_com_alerta > 0);
  const clientes = new Set(risco.map((a) => mapa.get(a.id_reuniao)?.codt).filter(Boolean)).size;
  const trechos = risco.reduce((s, a) => s + a.trechos_com_alerta, 0);
  const riscoClientes = agregarRiscoPorCliente(analises, reunioes);
  const rows = risco
    .map((resumo) => ({ resumo, reuniao: mapa.get(resumo.id_reuniao) }))
    .filter((item): item is { resumo: ResumoAnalise; reuniao: Reuniao } => Boolean(item.reuniao))
    .filter((item) => {
      const q = busca.trim().toLocaleLowerCase("pt-BR");
      if (!q) return true;
      return [item.reuniao.codt, item.resumo.termos_risco.join(" "), item.reuniao.segmento ?? ""].some((valor) => valor.toLocaleLowerCase("pt-BR").includes(q));
    });
  const pagina = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Reuniões analisadas" value={formatarNumero(analises.length)} detail="Reuniões com resultado do modelo." icon={<ShieldIcon size={20} />} />
        <KpiCard title="Reuniões com alerta" value={formatarNumero(risco.length)} detail={`${formatarPercentual(percentual(risco.length, analises.length))} das reuniões analisadas.`} icon={<AlertTriangleIcon size={20} />} tone="red" />
        <KpiCard title="Trechos classificados como risco" value={formatarNumero(trechos)} detail="Contagem de trechos; não equivale a clientes em risco." icon={<FileTextIcon size={20} />} tone="orange" />
        <KpiCard title="Clientes com alerta" value={formatarNumero(clientes)} detail="Clientes com pelo menos uma reunião sinalizada." icon={<UsersIcon size={20} />} tone="purple" />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,.75fr)_minmax(0,1.25fr)]">
        <Panel title="Clientes com maior concentração de alertas" subtitle="Priorize onde há mais trechos classificados como risco.">
          <HorizontalBars data={riscoClientes.slice(0, 8).map((item) => ({ label: item.cliente, value: item.alertas, secondary: `${item.reunioesComAlerta} reuniões com alerta` }))} />
        </Panel>
        <Panel title="Leitura correta do score" subtitle="Evita transformar o modelo em algo que ele não é.">
          <div className="space-y-3 p-5 font-body text-[13px] leading-relaxed text-[#4C638B] dark:text-[#BBC9DB]">
            <p>O <strong className="text-[#173A82] dark:text-white">score do modelo</strong> é usado na classificação de trechos. Ele <strong>não representa probabilidade de cancelamento</strong>.</p>
            <p>O dado mais acionável é a combinação de <strong className="text-[#173A82] dark:text-white">trecho sinalizado + motivo + recomendação</strong>.</p>
            <p>Clique em uma reunião abaixo para abrir os trechos exatos que sustentam o alerta.</p>
          </div>
        </Panel>
      </div>

      <Panel
        title="Riscos identificados"
        subtitle="Reuniões com alerta. O detalhe mostra o que foi dito, motivo e recomendação do modelo."
        action={<div className="w-[300px] max-w-full"><SearchBox value={busca} onChange={(value) => { setBusca(value); setPage(1); }} placeholder="Buscar cliente ou termo de risco..." /></div>}
      >
        <TableShell>
          <table className="w-full min-w-[930px] border-collapse">
            <thead><tr className="border-b border-[#E8EEF6] bg-[#FBFCFE] dark:border-[#24364E] dark:bg-[#102038]">{['Cliente', 'Data', 'Trechos de risco', 'Termos recorrentes', 'Score máx.', 'Ação'].map((h) => <th key={h} className="px-5 py-3 text-left font-body text-[11px] font-semibold uppercase tracking-wide text-[#70829F]">{h}</th>)}</tr></thead>
            <tbody>
              {pagina.map(({ resumo, reuniao }) => (
                <tr key={resumo.id} className="border-b border-[#EDF2F7] last:border-0 dark:border-[#24364E]">
                  <td className="px-5 py-3 font-heading text-[13px] font-semibold text-[#173A82] dark:text-white">{reuniao.codt}</td>
                  <td className="px-5 py-3 font-body text-[12px] text-[#6D7E99]">{formatarDataHora(reuniao.data)}</td>
                  <td className="px-5 py-3"><Badge tone="red">{resumo.trechos_com_alerta}</Badge></td>
                  <td className="max-w-[320px] px-5 py-3 font-body text-[12px] text-[#536B91] dark:text-[#B9C7DA]">{resumo.termos_risco.slice(0, 7).join(" · ") || "—"}</td>
                  <td className="px-5 py-3 font-body text-[12px] text-[#536B91]">{resumo.score_max === null ? "—" : resumo.score_max.toLocaleString("pt-BR", { maximumFractionDigits: 3 })}</td>
                  <td className="px-5 py-3"><RowButton onClick={() => onDetalhe({ kind: "churn", resumo, reuniao })}>Ver riscos</RowButton></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
        <Pagination page={page} total={rows.length} onChange={setPage} />
      </Panel>
    </div>
  );
}

function RelatorioUpsellCrossSell({
  itensUpsell,
  itensCrossSell,
  busca,
  setBusca,
  page,
  setPage,
  onDetalhe,
}: {
  itensUpsell: UpsellDetalhado[];
  itensCrossSell: CrossSellDetalhado[];
  busca: string;
  setBusca: (value: string) => void;
  page: number;
  setPage: (page: number) => void;
  onDetalhe: (detalhe: DetalheSelecionado) => void;
}) {
  type ComercialRow =
    | { tipo: "Upsell"; item: UpsellDetalhado }
    | { tipo: "Cross-sell"; item: CrossSellDetalhado };

  const rows: ComercialRow[] = [
    ...itensUpsell.map((item): ComercialRow => ({ tipo: "Upsell", item })),
    ...itensCrossSell.map((item): ComercialRow => ({ tipo: "Cross-sell", item })),
  ];

  const rowsFiltrados = rows.filter((row) => {
    const q = busca.trim().toLocaleLowerCase("pt-BR");
    if (!q) return true;
    const text = row.tipo === "Upsell"
      ? [
          row.item.reuniao.codt,
          row.item.evidencia.trecho,
          row.item.evidencia.produtosRelacionados.join(" "),
          row.item.evidencia.sinal,
        ]
      : [
          row.item.reuniao.codt,
          row.item.evidencia.trecho,
          row.item.evidencia.produtosContexto.join(" "),
          row.item.evidencia.produtosSugeridos.join(" "),
          row.item.evidencia.topico,
        ];
    return text.some((value) => value.toLocaleLowerCase("pt-BR").includes(q));
  });
  const pagina = rowsFiltrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const clientes = new Set(rowsFiltrados.map((row) => row.item.reuniao.codt)).size;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Sinais de upsell" value={formatarNumero(itensUpsell.length)} detail="Expansão de usuários, módulos, licenças ou unidades." icon={<TrendingUpIcon size={20} />} tone="purple" />
        <KpiCard title="Potenciais cross-sell" value={formatarNumero(itensCrossSell.length)} detail="Necessidades relacionadas a outras soluções TOTVS." icon={<CheckCircleIcon size={20} />} tone="green" />
        <KpiCard title="Clientes envolvidos" value={formatarNumero(clientes)} detail="Clientes com algum dos dois tipos de sinal." icon={<UsersIcon size={20} />} />
        <KpiCard title="Total de sinais" value={formatarNumero(itensUpsell.length + itensCrossSell.length)} detail="Sinais para investigação comercial." icon={<BarChartIcon size={20} />} tone="orange" />
      </div>

      <Panel title="Diferença entre os sinais" subtitle="Para a tela não chamar qualquer coisa de venda.">
        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
          <div className="rounded-[12px] bg-violet-50 p-4 dark:bg-violet-950/25">
            <p className="font-heading text-[15px] font-semibold text-violet-700 dark:text-violet-200">Upsell</p>
            <p className="mt-2 font-body text-[13px] leading-relaxed text-[#5A5F80] dark:text-[#C9C9DE]">Sinais de expansão do uso: mais usuários, licenças, módulos, unidades ou upgrade.</p>
          </div>
          <div className="rounded-[12px] bg-emerald-50 p-4 dark:bg-emerald-950/25">
            <p className="font-heading text-[15px] font-semibold text-emerald-700 dark:text-emerald-200">Cross-sell potencial</p>
            <p className="mt-2 font-body text-[13px] leading-relaxed text-[#4F6D62] dark:text-[#C8DDD4]">Uma reunião cita produto(s) TOTVS e também uma necessidade associada a outra solução. É preciso validar quais produtos o cliente realmente possui.</p>
          </div>
        </div>
      </Panel>

      <Panel
        title="Sinais detalhados"
        subtitle="Trecho, cliente e produto ficam visíveis antes de qualquer ação."
        action={<div className="w-[300px] max-w-full"><SearchBox value={busca} onChange={(value) => { setBusca(value); setPage(1); }} placeholder="Buscar cliente, produto ou trecho..." /></div>}
      >
        <TableShell>
          <table className="w-full min-w-[1000px] border-collapse">
            <thead><tr className="border-b border-[#E8EEF6] bg-[#FBFCFE] dark:border-[#24364E] dark:bg-[#102038]">{['Tipo', 'Cliente', 'Data', 'Necessidade / sinal', 'Produtos', 'Evidência', 'Ação'].map((h) => <th key={h} className="px-5 py-3 text-left font-body text-[11px] font-semibold uppercase tracking-wide text-[#70829F]">{h}</th>)}</tr></thead>
            <tbody>
              {pagina.map((row, index) => {
                const necessidade = row.tipo === "Upsell"
                  ? row.item.evidencia.sinal
                  : row.item.evidencia.topico;
                const produtos = row.tipo === "Upsell"
                  ? row.item.evidencia.produtosRelacionados
                  : row.item.evidencia.produtosSugeridos;
                const trecho = row.item.evidencia.trecho;
                const inicio = row.item.evidencia.inicio;
                return (
                  <tr key={`${row.tipo}-${row.item.idReuniao}-${inicio}-${index}`} className="border-b border-[#EDF2F7] last:border-0 dark:border-[#24364E]">
                    <td className="px-5 py-3"><Badge tone="purple">{row.tipo}</Badge></td>
                    <td className="px-5 py-3 font-heading text-[13px] font-semibold text-[#173A82] dark:text-white">{row.item.reuniao.codt}</td>
                    <td className="px-5 py-3 font-body text-[12px] text-[#6D7E99]">{formatarDataHora(row.item.reuniao.data)}</td>
                    <td className="px-5 py-3 font-body text-[13px] text-[#405A84] dark:text-[#C0CDE0]">{necessidade}</td>
                    <td className="px-5 py-3 font-body text-[12px] text-[#405A84] dark:text-[#C0CDE0]">{produtos.join(", ") || "A validar"}</td>
                    <td className="max-w-[340px] px-5 py-3 font-body text-[12px] leading-relaxed text-[#536B91] dark:text-[#B9C7DA]">“{cortar(trecho, 135)}”</td>
                    <td className="px-5 py-3"><RowButton onClick={() => onDetalhe(row.tipo === "Upsell" ? { kind: "upsell", item: row.item as UpsellDetalhado } : { kind: "cross-sell", item: row.item as CrossSellDetalhado })}>Ver detalhe</RowButton></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableShell>
        <Pagination page={page} total={rowsFiltrados.length} onChange={setPage} />
      </Panel>
    </div>
  );
}

function RelatorioConcorrentes({
  reunioes,
  agregados,
  itens,
  busca,
  setBusca,
  page,
  setPage,
  onDetalhe,
}: {
  reunioes: Reuniao[];
  agregados: AgregadoNome[];
  itens: ConcorrenteDetalhado[];
  busca: string;
  setBusca: (value: string) => void;
  page: number;
  setPage: (page: number) => void;
  onDetalhe: (detalhe: DetalheSelecionado) => void;
}) {
  const reunioesCom = new Set(itens.map((item) => item.idReuniao)).size;
  const clientes = new Set(itens.map((item) => item.reuniao.codt)).size;
  const filtrados = itens.filter((item) => {
    const q = busca.trim().toLocaleLowerCase("pt-BR");
    if (!q) return true;
    return [item.evidencia.concorrente, item.reuniao.codt, item.evidencia.contexto, item.evidencia.trecho].some((v) => v.toLocaleLowerCase("pt-BR").includes(q));
  });
  const pagina = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Menções de mercado" value={formatarNumero(itens.length)} detail="Menções às marcas monitoradas." icon={<UsersIcon size={20} />} tone="orange" />
        <KpiCard title="Reuniões com menção" value={formatarNumero(reunioesCom)} detail={`${formatarPercentual(percentual(reunioesCom, reunioes.length))} das reuniões no filtro.`} icon={<FileTextIcon size={20} />} />
        <KpiCard title="Clientes envolvidos" value={formatarNumero(clientes)} detail="Clientes com pelo menos uma marca citada." icon={<UsersIcon size={20} />} tone="purple" />
        <KpiCard title="Marca mais citada" value={agregados[0]?.nome ?? "—"} detail={agregados[0] ? `${formatarNumero(agregados[0].mencoes)} menções.` : "Sem menções."} icon={<BarChartIcon size={20} />} tone="green" />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,.75fr)_minmax(0,1.25fr)]">
        <Panel title="Marcas mais mencionadas" subtitle="Volume de menções, não ranking de ameaça.">
          <HorizontalBars data={agregados.slice(0, 8).map((item) => ({ label: item.nome, value: item.mencoes, secondary: `${item.reunioes} reuniões · ${item.clientes} clientes` }))} />
        </Panel>
        <Panel title="Contexto das menções" subtitle="Ajuda a diferenciar uso atual, comparação e avaliação comercial.">
          <DonutChart
            center={formatarNumero(itens.length)}
            label="menções"
            data={Object.entries(itens.reduce<Record<string, number>>((acc, item) => {
              const label = labelContextoConcorrente(item.evidencia.contexto);
              acc[label] = (acc[label] ?? 0) + 1;
              return acc;
            }, {})).map(([label, value], index) => ({ label, value, color: CORES[index % CORES.length] }))}
          />
        </Panel>
      </div>

      <Panel
        title="Menções detalhadas"
        subtitle="A marca só vira alerta quando o contexto sustenta essa leitura."
        action={<div className="w-[300px] max-w-full"><SearchBox value={busca} onChange={(value) => { setBusca(value); setPage(1); }} placeholder="Buscar marca, cliente ou trecho..." /></div>}
      >
        <TableShell>
          <table className="w-full min-w-[980px] border-collapse">
            <thead><tr className="border-b border-[#E8EEF6] bg-[#FBFCFE] dark:border-[#24364E] dark:bg-[#102038]">{['Marca', 'Cliente', 'Data', 'Contexto', 'Evidência', 'Ação'].map((h) => <th key={h} className="px-5 py-3 text-left font-body text-[11px] font-semibold uppercase tracking-wide text-[#70829F]">{h}</th>)}</tr></thead>
            <tbody>
              {pagina.map((item, index) => (
                <tr key={`${item.idReuniao}-${item.evidencia.inicio}-${index}`} className="border-b border-[#EDF2F7] last:border-0 dark:border-[#24364E]">
                  <td className="px-5 py-3 font-heading text-[13px] font-semibold text-[#173A82] dark:text-white">{item.evidencia.concorrente}</td>
                  <td className="px-5 py-3 font-body text-[13px] text-[#405A84] dark:text-[#C0CDE0]">{item.reuniao.codt}</td>
                  <td className="px-5 py-3 font-body text-[12px] text-[#6D7E99]">{formatarDataHora(item.reuniao.data)}</td>
                  <td className="px-5 py-3"><Badge tone={item.evidencia.contexto === 'migracao-troca' || item.evidencia.contexto === 'avaliacao-comercial' ? 'red' : 'orange'}>{labelContextoConcorrente(item.evidencia.contexto)}</Badge></td>
                  <td className="max-w-[380px] px-5 py-3 font-body text-[12px] leading-relaxed text-[#536B91] dark:text-[#B9C7DA]">“{cortar(item.evidencia.trecho, 145)}”</td>
                  <td className="px-5 py-3"><RowButton onClick={() => onDetalhe({ kind: "concorrente", item })}>Ver detalhe</RowButton></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
        <Pagination page={page} total={filtrados.length} onChange={setPage} />
      </Panel>
    </div>
  );
}

function RelatorioSentimento({
  reunioes,
  analises,
  registros,
  onDetalhe,
}: {
  reunioes: Reuniao[];
  analises: ResumoAnalise[];
  registros: RegistroRelatorioTextual[];
  onDetalhe: (detalhe: DetalheSelecionado) => void;
}) {
  const nps = resumirNps(reunioes);
  const mapaAnalise = new Map(analises.map((a) => [a.id_reuniao, a]));
  const mapaRegistro = new Map(registros.map((r) => [r.idReuniao, r]));
  const comNps = reunioes.filter((r) => r.nps !== null).sort((a, b) => (a.nps ?? 0) - (b.nps ?? 0));
  const detratores = comNps.filter((r) => (r.nps ?? 10) <= 6);

  const segmentos = new Map<string, number[]>();
  for (const reuniao of comNps) {
    const segmento = reuniao.segmento ?? "Sem segmento";
    const atual = segmentos.get(segmento) ?? [];
    atual.push(reuniao.nps as number);
    segmentos.set(segmento, atual);
  }
  const porSegmento = [...segmentos.entries()]
    .map(([nome, notas]) => ({ nome, media: notas.reduce((s, n) => s + n, 0) / notas.length, respostas: notas.length }))
    .sort((a, b) => a.media - b.media);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Respostas NPS" value={formatarNumero(nps.respondentes)} detail={`${formatarPercentual(percentual(nps.respondentes, reunioes.length))} das reuniões têm nota.`} icon={<SmileIcon size={20} />} />
        <KpiCard title="NPS" value={nps.score === null ? "—" : String(nps.score)} detail="Promotores % menos detratores %." icon={<TrendingUpIcon size={20} />} tone="green" />
        <KpiCard title="Promotores" value={formatarPercentual(percentual(nps.promotores, nps.respondentes))} detail={`${formatarNumero(nps.promotores)} respostas com nota 9–10.`} icon={<CheckCircleIcon size={20} />} tone="green" />
        <KpiCard title="Detratores" value={formatarPercentual(percentual(nps.detratores, nps.respondentes))} detail={`${formatarNumero(nps.detratores)} respostas com nota 0–6.`} icon={<AlertTriangleIcon size={20} />} tone="red" />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,.75fr)_minmax(0,1.25fr)]">
        <Panel title="Distribuição NPS" subtitle="Dado real disponível na base.">
          <DonutChart center={nps.score === null ? "—" : String(nps.score)} label="NPS" data={[
            { label: "Promotores", value: nps.promotores, color: "#16A765" },
            { label: "Neutros", value: nps.neutros, color: "#FFB020" },
            { label: "Detratores", value: nps.detratores, color: "#EF4444" },
          ]} />
        </Panel>
        <Panel title="Segmentos com menor média de NPS" subtitle="Ajuda a direcionar investigação por perfil de cliente.">
          <HorizontalBars data={porSegmento.slice(0, 8).map((item) => ({ label: item.nome, value: Math.round(item.media * 10), secondary: `${item.respostas} respostas · média ${item.media.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}` }))} valueLabel={(value) => (value / 10).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} />
        </Panel>
      </div>

      <Panel title="Clientes detratores que merecem atenção" subtitle="Cruza NPS com alertas de churn e temas encontrados nas reuniões.">
        <TableShell>
          <table className="w-full min-w-[980px] border-collapse">
            <thead><tr className="border-b border-[#E8EEF6] bg-[#FBFCFE] dark:border-[#24364E] dark:bg-[#102038]">{['Cliente', 'NPS', 'Data da reunião', 'Alertas de churn', 'Tópicos encontrados', 'Ação'].map((h) => <th key={h} className="px-5 py-3 text-left font-body text-[11px] font-semibold uppercase tracking-wide text-[#70829F]">{h}</th>)}</tr></thead>
            <tbody>
              {detratores.slice(0, 50).map((reuniao) => {
                const analise = mapaAnalise.get(reuniao.id);
                const registro = mapaRegistro.get(reuniao.id);
                const topicos = [...(registro?.topicos ?? [])].sort((a, b) => b.mencoes - a.mencoes).slice(0, 3).map((t) => t.nome);
                return (
                  <tr key={reuniao.id} className="border-b border-[#EDF2F7] last:border-0 dark:border-[#24364E]">
                    <td className="px-5 py-3 font-heading text-[13px] font-semibold text-[#173A82] dark:text-white">{reuniao.codt}</td>
                    <td className="px-5 py-3"><Badge tone="red">{reuniao.nps}</Badge></td>
                    <td className="px-5 py-3 font-body text-[12px] text-[#6D7E99]">{formatarDataHora(reuniao.data)}</td>
                    <td className="px-5 py-3 font-body text-[13px] text-[#405A84] dark:text-[#C0CDE0]">{analise?.trechos_com_alerta ?? 0}</td>
                    <td className="px-5 py-3 font-body text-[12px] text-[#536B91] dark:text-[#B9C7DA]">{topicos.join(" · ") || "—"}</td>
                    <td className="px-5 py-3"><RowButton onClick={() => onDetalhe({ kind: "nps", reuniao })}>Ver contexto</RowButton></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableShell>
      </Panel>
    </div>
  );
}

function RelatorioTopicos({ topicos }: { topicos: AgregadoTopico[] }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Tópicos identificados" value={formatarNumero(topicos.length)} detail="Categorias monitoradas com ocorrência." icon={<BarChartIcon size={20} />} />
        <KpiCard title="Menções a tópicos" value={formatarNumero(topicos.reduce((s, t) => s + t.mencoes, 0))} detail="Ocorrências dos temas na conversa." icon={<FileTextIcon size={20} />} tone="purple" />
        <KpiCard title="Sinais de oportunidade" value={formatarNumero(topicos.reduce((s, t) => s + t.oportunidades, 0))} detail="Sinais associados a necessidades e intenções." icon={<TrendingUpIcon size={20} />} tone="green" />
        <KpiCard title="Tópicos ligados a risco" value={formatarNumero(topicos.filter((t) => t.reunioesComRisco > 0).length)} detail="Tópicos presentes em reuniões com alerta de churn." icon={<AlertTriangleIcon size={20} />} tone="red" />
      </div>

      <Panel title="Mapa de temas e necessidades" subtitle="Mostra volume, oportunidade, risco e produtos relacionados.">
        <TableShell>
          <table className="w-full min-w-[940px] border-collapse">
            <thead><tr className="border-b border-[#E8EEF6] bg-[#FBFCFE] dark:border-[#24364E] dark:bg-[#102038]">{['Tópico', 'Menções', 'Reuniões', 'Clientes', 'Oportunidades', 'Reuniões com risco', 'Produtos relacionados'].map((h) => <th key={h} className="px-5 py-3 text-left font-body text-[11px] font-semibold uppercase tracking-wide text-[#70829F]">{h}</th>)}</tr></thead>
            <tbody>
              {topicos.map((item) => (
                <tr key={item.nome} className="border-b border-[#EDF2F7] last:border-0 dark:border-[#24364E]">
                  <td className="px-5 py-3 font-heading text-[13px] font-semibold text-[#173A82] dark:text-white">{item.nome}</td>
                  <td className="px-5 py-3 font-body text-[13px] text-[#405A84]">{formatarNumero(item.mencoes)}</td>
                  <td className="px-5 py-3 font-body text-[13px] text-[#405A84]">{formatarNumero(item.reunioes)}</td>
                  <td className="px-5 py-3 font-body text-[13px] text-[#405A84]">{formatarNumero(item.clientes)}</td>
                  <td className="px-5 py-3"><Badge tone="green">{formatarNumero(item.oportunidades)}</Badge></td>
                  <td className="px-5 py-3"><Badge tone={item.reunioesComRisco > 0 ? 'red' : 'blue'}>{formatarNumero(item.reunioesComRisco)}</Badge></td>
                  <td className="px-5 py-3 font-body text-[12px] text-[#536B91] dark:text-[#B9C7DA]">{item.produtosSugeridos.join(", ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      </Panel>
    </div>
  );
}

function RelatorioCliente({
  clienteSelecionado,
  reunioes,
  registros,
  analises,
  oportunidades,
  produtosDetalhados,
  concorrentesDetalhados,
  onDetalhe,
}: {
  clienteSelecionado: string;
  reunioes: Reuniao[];
  registros: RegistroRelatorioTextual[];
  analises: ResumoAnalise[];
  oportunidades: OportunidadeDetalhada[];
  produtosDetalhados: ProdutoDetalhado[];
  concorrentesDetalhados: ConcorrenteDetalhado[];
  onDetalhe: (detalhe: DetalheSelecionado) => void;
}) {
  if (clienteSelecionado === "todos") {
    const clientes = new Map<string, ClienteResumo>();
    const mapaRegistro = new Map(registros.map((r) => [r.idReuniao, r]));
    const mapaAnalise = new Map(analises.map((a) => [a.id_reuniao, a]));

    for (const reuniao of reunioes) {
      const registro = mapaRegistro.get(reuniao.id);
      const analise = mapaAnalise.get(reuniao.id);
      const atual = clientes.get(reuniao.codt) ?? {
        cliente: reuniao.codt,
        reunioes: 0,
        alertas: 0,
        oportunidades: 0,
        produtos: 0,
        concorrentes: 0,
        nps: null,
        ultimaReuniao: reuniao.data,
      };
      atual.reunioes += 1;
      atual.alertas += analise?.trechos_com_alerta ?? 0;
      atual.oportunidades += (registro?.topicos ?? []).reduce((s, t) => s + t.sinaisOportunidade, 0);
      atual.produtos += (registro?.produtos ?? []).reduce((s, p) => s + p.mencoes, 0);
      atual.concorrentes += (registro?.concorrentes ?? []).reduce((s, c) => s + c.mencoes, 0);
      if (reuniao.nps !== null) atual.nps = reuniao.nps;
      if (reuniao.data > atual.ultimaReuniao) atual.ultimaReuniao = reuniao.data;
      clientes.set(reuniao.codt, atual);
    }

    const ranking = [...clientes.values()].sort((a, b) => b.alertas - a.alertas || b.oportunidades - a.oportunidades || b.reunioes - a.reunioes);
    return (
      <Panel title="Visão por cliente" subtitle="Selecione um cliente no filtro do topo para abrir o dossiê completo daquela conta.">
        <TableShell>
          <table className="w-full min-w-[980px] border-collapse">
            <thead><tr className="border-b border-[#E8EEF6] bg-[#FBFCFE] dark:border-[#24364E] dark:bg-[#102038]">{['Cliente', 'Reuniões', 'Alertas de churn', 'Oportunidades', 'Menções a produtos', 'Concorrentes', 'NPS', 'Última reunião'].map((h) => <th key={h} className="px-5 py-3 text-left font-body text-[11px] font-semibold uppercase tracking-wide text-[#70829F]">{h}</th>)}</tr></thead>
            <tbody>
              {ranking.slice(0, 100).map((item) => (
                <tr key={item.cliente} className="border-b border-[#EDF2F7] last:border-0 dark:border-[#24364E]">
                  <td className="px-5 py-3 font-heading text-[13px] font-semibold text-[#173A82] dark:text-white">{item.cliente}</td>
                  <td className="px-5 py-3 font-body text-[13px] text-[#405A84]">{item.reunioes}</td>
                  <td className="px-5 py-3"><Badge tone={item.alertas > 0 ? 'red' : 'blue'}>{item.alertas}</Badge></td>
                  <td className="px-5 py-3"><Badge tone="green">{item.oportunidades}</Badge></td>
                  <td className="px-5 py-3 font-body text-[13px] text-[#405A84]">{item.produtos}</td>
                  <td className="px-5 py-3 font-body text-[13px] text-[#405A84]">{item.concorrentes}</td>
                  <td className="px-5 py-3 font-body text-[13px] text-[#405A84]">{item.nps ?? "—"}</td>
                  <td className="px-5 py-3 font-body text-[12px] text-[#6D7E99]">{formatarDataHora(item.ultimaReuniao)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      </Panel>
    );
  }

  const nps = resumirNps(reunioes);
  const alertas = analises.reduce((s, a) => s + a.trechos_com_alerta, 0);
  const oportunidadesCliente = oportunidades.filter((item) => item.reuniao.codt === clienteSelecionado);
  const produtosCliente = produtosDetalhados.filter((item) => item.reuniao.codt === clienteSelecionado);
  const concorrentesCliente = concorrentesDetalhados.filter((item) => item.reuniao.codt === clienteSelecionado);
  const mapaAnalise = new Map(analises.map((a) => [a.id_reuniao, a]));

  return (
    <div className="space-y-4">
      <div className="rounded-[14px] border border-[#DCE6F2] bg-gradient-to-r from-[#F7FAFF] to-white px-6 py-5 dark:border-[#243B58] dark:from-[#102038] dark:to-[#0F1D31]">
        <p className="font-body text-[12px] font-semibold uppercase tracking-[0.08em] text-[#5573AB]">Dossiê do cliente</p>
        <h2 className="mt-1 font-heading text-[28px] font-bold text-[#071F72] dark:text-white">{clienteSelecionado}</h2>
        <p className="mt-2 font-body text-[13px] text-[#647794]">Consolidação das reuniões, riscos, oportunidades, produtos e satisfação disponíveis no sistema.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard title="Reuniões" value={formatarNumero(reunioes.length)} detail="Histórico no filtro atual." icon={<UsersIcon size={20} />} />
        <KpiCard title="Trechos de risco" value={formatarNumero(alertas)} detail="Classificados pelo modelo de churn." icon={<ShieldIcon size={20} />} tone="red" />
        <KpiCard title="Oportunidades" value={formatarNumero(oportunidadesCliente.length)} detail="Sinais textuais a validar." icon={<TrendingUpIcon size={20} />} tone="green" />
        <KpiCard title="Menções a produtos" value={formatarNumero(produtosCliente.length)} detail="Evidências nas transcrições." icon={<FileTextIcon size={20} />} tone="purple" />
        <KpiCard title="NPS" value={nps.score === null ? "—" : String(nps.score)} detail={`${nps.respondentes} respostas disponíveis.`} icon={<SmileIcon size={20} />} tone="orange" />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Oportunidades da conta" subtitle="Necessidades e evidências mais relevantes.">
          <div className="divide-y divide-[#EDF2F7] dark:divide-[#24364E]">
            {oportunidadesCliente.slice(0, 8).map((item, index) => (
              <button key={`${item.idReuniao}-${item.evidencia.inicio}-${index}`} type="button" onClick={() => onDetalhe({ kind: "oportunidade", item })} className="block w-full px-5 py-4 text-left hover:bg-[#F8FBFF] dark:hover:bg-[#13233A]">
                <div className="flex items-center justify-between gap-3"><p className="font-heading text-[14px] font-semibold text-[#173A82] dark:text-white">{item.evidencia.topico}</p><Badge tone="green">{item.evidencia.relevancia}/100</Badge></div>
                <p className="mt-2 font-body text-[12px] leading-relaxed text-[#536B91] dark:text-[#B9C7DA]">“{cortar(item.evidencia.trecho, 140)}”</p>
              </button>
            ))}
            {oportunidadesCliente.length === 0 && <EmptyPanel text="Nenhuma oportunidade textual encontrada para este cliente." />}
          </div>
        </Panel>

        <Panel title="Produtos e concorrentes citados" subtitle="Contexto comercial acumulado da conta.">
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <div>
              <p className="font-heading text-[14px] font-semibold text-[#173A82] dark:text-white">Produtos TOTVS</p>
              <div className="mt-3 flex flex-wrap gap-2">{[...new Set(produtosCliente.map((item) => item.evidencia.produto))].map((produto) => <Badge key={produto} tone="blue">{produto}</Badge>)}{produtosCliente.length === 0 && <span className="font-body text-[12px] text-[#7A89A1]">Nenhum produto citado.</span>}</div>
            </div>
            <div>
              <p className="font-heading text-[14px] font-semibold text-[#173A82] dark:text-white">Marcas / concorrentes</p>
              <div className="mt-3 flex flex-wrap gap-2">{[...new Set(concorrentesCliente.map((item) => item.evidencia.concorrente))].map((concorrente) => <Badge key={concorrente} tone="orange">{concorrente}</Badge>)}{concorrentesCliente.length === 0 && <span className="font-body text-[12px] text-[#7A89A1]">Nenhuma marca monitorada citada.</span>}</div>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Histórico de reuniões" subtitle="Clique nos alertas para abrir os trechos exatos do modelo.">
        <TableShell>
          <table className="w-full min-w-[900px] border-collapse">
            <thead><tr className="border-b border-[#E8EEF6] bg-[#FBFCFE] dark:border-[#24364E] dark:bg-[#102038]">{['Data', 'Reunião', 'NPS', 'Alertas de churn', 'Segmento', 'Ação'].map((h) => <th key={h} className="px-5 py-3 text-left font-body text-[11px] font-semibold uppercase tracking-wide text-[#70829F]">{h}</th>)}</tr></thead>
            <tbody>
              {[...reunioes].sort((a, b) => b.data.localeCompare(a.data)).map((reuniao) => {
                const analise = mapaAnalise.get(reuniao.id);
                return (
                  <tr key={reuniao.id} className="border-b border-[#EDF2F7] last:border-0 dark:border-[#24364E]">
                    <td className="px-5 py-3 font-body text-[12px] text-[#6D7E99]">{formatarDataHora(reuniao.data)}</td>
                    <td className="px-5 py-3 font-heading text-[13px] font-semibold text-[#173A82] dark:text-white">{reuniao.id}</td>
                    <td className="px-5 py-3 font-body text-[13px] text-[#405A84]">{reuniao.nps ?? "—"}</td>
                    <td className="px-5 py-3"><Badge tone={analise && analise.trechos_com_alerta > 0 ? 'red' : 'blue'}>{analise?.trechos_com_alerta ?? 0}</Badge></td>
                    <td className="px-5 py-3 font-body text-[12px] text-[#536B91]">{reuniao.segmento ?? "—"}</td>
                    <td className="px-5 py-3">{analise && analise.trechos_com_alerta > 0 ? <RowButton onClick={() => onDetalhe({ kind: "churn", resumo: analise, reuniao })}>Ver riscos</RowButton> : <RowButton onClick={() => onDetalhe({ kind: "nps", reuniao })}>Ver contexto</RowButton>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableShell>
      </Panel>
    </div>
  );
}

export default function RelatoriosPage() {
  const [base, setBase] = useState<BaseRelatorios | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tipo, setTipo] = useState<TipoRelatorio>("visao-geral");
  const [periodo, setPeriodo] = useState<PeriodoRelatorio>("30");
  const [cliente, setCliente] = useState("todos");
  const [busca, setBusca] = useState("");
  const [page, setPage] = useState(1);
  const [detalhe, setDetalhe] = useState<DetalheSelecionado | null>(null);

  useEffect(() => {
    carregarBaseRelatorios().then(setBase).catch((error) => setErro(error instanceof Error ? error.message : String(error)));
  }, []);

  useEffect(() => {
    setBusca("");
    setPage(1);
  }, [tipo, periodo, cliente]);

  const dados = useMemo(() => {
    if (!base) return null;
    const reunioes = filtrarReunioes(base.reunioes, periodo, cliente);
    const analises = filtrarAnalisesPorReunioes(base.analises, reunioes);
    const registros = filtrarTextualPorReunioes(base.textual, reunioes);
    const oportunidades = listarOportunidadesDetalhadas(registros, reunioes);
    const produtosDetalhados = listarProdutosDetalhados(registros, reunioes);
    const concorrentesDetalhados = listarConcorrentesDetalhados(registros, reunioes);
    const upsell = listarUpsellDetalhado(registros, reunioes);
    const crossSell = listarCrossSellDetalhado(registros, reunioes);
    const produtos = agregarProdutos(registros, reunioes);
    const concorrentes = agregarConcorrentes(registros, reunioes);
    const topicos = agregarTopicos(registros, reunioes, analises);
    return { reunioes, analises, registros, oportunidades, produtosDetalhados, concorrentesDetalhados, upsell, crossSell, produtos, concorrentes, topicos };
  }, [base, periodo, cliente]);

  if (erro) return <ErrorState error={erro} sugestao="Verifique se public/data foi gerado corretamente." />;
  if (!base || !dados) return <LoadingState label="Montando relatórios a partir das reuniões e análises reais…" />;
  if (dados.reunioes.length === 0) return <EmptyState titulo="Nenhuma reunião encontrada" descricao="Altere o período ou o cliente selecionado." />;

  const clientesOrdenados = [...base.clientes].sort((a, b) => a.codt.localeCompare(b.codt));

  return (
    <div className="-m-2 w-auto min-w-0 max-w-full overflow-x-hidden rounded-[18px] bg-[#F6F9FD] p-2 dark:bg-[#07111F] sm:-m-3 sm:p-3 lg:-m-4 lg:p-4">
      <div className="w-full min-w-0 max-w-full overflow-hidden rounded-[18px] border border-[#DCE5F0] bg-[#FBFCFE] p-6 shadow-[0_8px_28px_rgba(15,44,90,0.04)] dark:border-[#1F334E] dark:bg-[#07111F] lg:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="font-body text-[14px] font-medium text-[#214C9B] dark:text-[#B6C9E8]">TOTVS Insight</p>
            <h1 className="mt-1 font-heading text-[36px] font-bold leading-none tracking-[-0.035em] text-[#072074] dark:text-white">Relatórios</h1>
            <p className="mt-3 max-w-3xl font-body text-[15px] leading-relaxed text-[#627493] dark:text-[#AAB7C9]">Dos números para a evidência: veja o que foi identificado, em qual cliente, em qual reunião e qual trecho sustenta cada insight.</p>
          </div>

          <div className="grid w-full gap-2 sm:grid-cols-2 xl:w-auto xl:min-w-[470px]">
            <label className="min-w-0">
              <span className="sr-only">Período</span>
              <select value={periodo} onChange={(event) => setPeriodo(event.target.value as PeriodoRelatorio)} className="h-11 w-full rounded-[9px] border border-[#D9E4F1] bg-white px-3 font-body text-[13px] font-medium text-[#23437E] outline-none dark:border-[#30445E] dark:bg-[#102037] dark:text-white">
                <option value="30">Últimos 30 dias da base</option>
                <option value="90">Últimos 90 dias da base</option>
                <option value="180">Últimos 180 dias da base</option>
                <option value="todos">Todo o período</option>
              </select>
            </label>
            <label className="min-w-0">
              <span className="sr-only">Cliente</span>
              <select value={cliente} onChange={(event) => setCliente(event.target.value)} className="h-11 w-full rounded-[9px] border border-[#D9E4F1] bg-white px-3 font-body text-[13px] font-medium text-[#23437E] outline-none dark:border-[#30445E] dark:bg-[#102037] dark:text-white">
                <option value="todos">Todos os clientes</option>
                {clientesOrdenados.map((item) => <option key={item.codt} value={item.codt}>{item.codt}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-6 w-full min-w-0 overflow-x-auto pb-1">
          <div className="flex min-w-max gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTipo(tab.id)}
                className={`rounded-[8px] border px-4 py-2.5 font-body text-[12px] font-semibold transition-colors ${tipo === tab.id ? "border-[#0B5CFF] bg-[#0B5CFF] text-white" : "border-[#D9E4F1] bg-white text-[#31538E] hover:bg-[#F4F8FF] dark:border-[#30445E] dark:bg-[#102037] dark:text-[#C7D6ED]"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {(!base.textual || base.textual.versao !== 2) && (
          <div className="mt-4 rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 font-body text-[13px] leading-relaxed text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200">
            O índice detalhado de relatórios ainda não foi gerado nesta cópia. Substitua <code>scripts/build-reports.mjs</code> pela versão nova e execute <code>npm run reports:build</code>.
          </div>
        )}

        <div className="mt-5 min-w-0">
          {tipo === "visao-geral" && <RelatorioOverview reunioes={dados.reunioes} registros={dados.registros} analises={dados.analises} oportunidades={dados.oportunidades} produtos={dados.produtos} topicos={dados.topicos} onDetalhe={setDetalhe} />}
          {tipo === "produtos" && <RelatorioProdutos reunioes={dados.reunioes} registros={dados.registros} agregados={dados.produtos} itens={dados.produtosDetalhados} busca={busca} setBusca={setBusca} page={page} setPage={setPage} onDetalhe={setDetalhe} />}
          {tipo === "sentimento" && <RelatorioSentimento reunioes={dados.reunioes} analises={dados.analises} registros={dados.registros} onDetalhe={setDetalhe} />}
          {tipo === "oportunidades" && <RelatorioOportunidades reunioes={dados.reunioes} itens={dados.oportunidades} topicos={dados.topicos} busca={busca} setBusca={setBusca} page={page} setPage={setPage} onDetalhe={setDetalhe} />}
          {tipo === "churn" && <RelatorioChurn reunioes={dados.reunioes} analises={dados.analises} busca={busca} setBusca={setBusca} page={page} setPage={setPage} onDetalhe={setDetalhe} />}
          {tipo === "upsell-cross-sell" && <RelatorioUpsellCrossSell itensUpsell={dados.upsell} itensCrossSell={dados.crossSell} busca={busca} setBusca={setBusca} page={page} setPage={setPage} onDetalhe={setDetalhe} />}
          {tipo === "concorrentes" && <RelatorioConcorrentes reunioes={dados.reunioes} agregados={dados.concorrentes} itens={dados.concorrentesDetalhados} busca={busca} setBusca={setBusca} page={page} setPage={setPage} onDetalhe={setDetalhe} />}
          {tipo === "topicos" && <RelatorioTopicos topicos={dados.topicos} />}
          {tipo === "cliente" && <RelatorioCliente clienteSelecionado={cliente} reunioes={dados.reunioes} registros={dados.registros} analises={dados.analises} oportunidades={dados.oportunidades} produtosDetalhados={dados.produtosDetalhados} concorrentesDetalhados={dados.concorrentesDetalhados} onDetalhe={setDetalhe} />}
        </div>
      </div>

      <InsightDrawer detalhe={detalhe} onClose={() => setDetalhe(null)} />
    </div>
  );
}
