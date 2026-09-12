import HistoricoAnalises from "@/components/HistoricoAnalises";
import PainelChurn from "@/components/PainelChurn";
import { useCallback, useState } from "react";
import { getResumoDashboard, type ResumoDashboard } from "@/data/repository";
import useDataset from "@/data/useDataset";
import type { Fatia, Reuniao } from "@/data/types";
import { INSIGHTS, type InsightTab } from "@/data/mockData";
import { useLocale } from "@/i18n/useLocale";
import { getActiveLocale, type TranslateFn } from "@/i18n/types";
import { capitalizar, formatarData, formatarDuracao } from "@/format";
import { ClockIcon, SmileIcon, TrendingUpIcon, UsersIcon } from "@/icons";
import Card from "@/components/ui/Card";
import { ErrorState, LoadingState } from "@/components/ui/DataState";

const TAB_ROW1 = [
  "overview",
  "opportunities",
  "churn",
  "products",
  "competitors",
  "sentiment",
  "pains",
] as const;

const TAB_ROW2 = [
  "journey",
  "meetingQuality",
  "dataQuality",
  "priorityClients",
  "recommendations",
] as const;

type TabId = (typeof TAB_ROW1)[number] | (typeof TAB_ROW2)[number];

/** Visão Geral e Churn usam dados reais; as demais abas ainda são ilustrativas. */
function isInsightTab(tab: TabId): tab is InsightTab {
  return tab !== "overview" && tab !== "churn";
}

/**
 * Apenas configuração VISUAL dos KPIs.
 * O valor, título e detalhe continuam vindo exatamente do repositório.
 */
const KPI_ESTILO: Record<
  string,
  {
    iconBg: string;
    iconColor: string;
    accent: string;
    icon: React.ReactNode;
  }
> = {
  reunioes: {
    iconBg: "bg-[#E8F0FF] dark:bg-[#14284A]",
    iconColor: "text-[#155EEF] dark:text-[#6EA8FF]",
    accent: "text-[#16A765]",
    icon: <TrendingUpIcon size={19} />,
  },
  horas: {
    iconBg: "bg-[#E8F8EE] dark:bg-[#123425]",
    iconColor: "text-[#13A35A] dark:text-[#4ADE80]",
    accent: "text-[#16A765]",
    icon: <ClockIcon size={19} />,
  },
  clientes: {
    iconBg: "bg-[#FFF1E6] dark:bg-[#3A2718]",
    iconColor: "text-[#E87522] dark:text-[#FB923C]",
    accent: "text-[#16A765]",
    icon: <UsersIcon size={19} />,
  },
  nps: {
    iconBg: "bg-[#FFF0F0] dark:bg-[#3A1D24]",
    iconColor: "text-[#EF4444] dark:text-[#F87171]",
    accent: "text-[#EF4444] dark:text-[#F87171]",
    icon: <SmileIcon size={19} />,
  },
};

const KPI_FALLBACK = {
  iconBg: "bg-[#EEF3FF] dark:bg-[#14284A]",
  iconColor: "text-[#155EEF] dark:text-[#6EA8FF]",
  accent: "text-[#16A765]",
  icon: <TrendingUpIcon size={19} />,
};

function TabBar({
  tabs,
  active,
  onSelect,
  labelOf,
}: {
  tabs: readonly TabId[];
  active: TabId;
  onSelect: (tab: TabId) => void;
  labelOf: (id: TabId) => string;
}) {
  return (
    <div className="flex min-w-max items-center gap-1">
      {tabs.map((tab) => {
        const selecionada = active === tab;

        return (
          <button
            key={tab}
            type="button"
            onClick={() => onSelect(tab)}
            className={`rounded-lg px-3 py-2 font-body text-[11px] font-medium transition-colors ${
              selecionada
                ? "bg-[#0B66E4] text-white shadow-sm"
                : "text-[#64748B] hover:bg-[#F5F8FC] hover:text-[#0F2B5B] dark:text-[#9FB0C9] dark:hover:bg-[#162640] dark:hover:text-[#E8F0FF]"
            }`}
          >
            {labelOf(tab)}
          </button>
        );
      })}
    </div>
  );
}

/** Barras horizontais de uma distribuição — sem dependência de lib de gráfico. */
function BarraDistribuicao({ fatias, t }: { fatias: Fatia[]; t: TranslateFn }) {
  if (fatias.length === 0) {
    return (
      <p className="py-6 text-center font-body text-xs text-[#94A3B8] dark:text-[#7F93B2]">
        {t("dashboard.emptyChart")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {fatias.map((f) => (
        <div key={f.rotulo}>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <span className="truncate font-body text-[10px] text-[#64748B] dark:text-[#9FB0C9]">
              {capitalizar(f.rotulo)}
            </span>
            <span className="flex-shrink-0 font-heading text-[10px] font-semibold text-[#102A5E] dark:text-[#DCE8FA]">
              {f.quantidade.toLocaleString(getActiveLocale())}
              <span className="ml-1 font-normal text-[#94A3B8] dark:text-[#7F93B2]">{f.percentual}%</span>
            </span>
          </div>

          <div className="h-[5px] w-full overflow-hidden rounded-full bg-[#EDF2F7] dark:bg-[#22324A]">
            <div
              className="h-full rounded-full bg-[#155EEF]"
              style={{ width: `${Math.max(f.percentual, 2)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Colunas de volume mensal. */
function VolumeMensal({ meses, t }: { meses: Fatia[]; t: TranslateFn }) {
  const maior = Math.max(...meses.map((m) => m.quantidade), 1);
  const ALTURA_MAX = 132;

  return (
    <div className="flex h-[188px] items-end justify-between gap-2 border-b border-[#E8EDF5] dark:border-[#223652] pt-3">
      {meses.map((m) => (
        <div
          key={m.rotulo}
          className="group flex h-full flex-1 flex-col items-center justify-end"
          title={t("dashboard.volumeTooltip", { n: m.quantidade, month: m.rotulo })}
        >
          <span className="mb-1.5 font-heading text-[9px] font-semibold text-[#102A5E] dark:text-[#DCE8FA]">
            {m.quantidade}
          </span>

          <div
            className="w-[72%] max-w-[58px] rounded-t-[4px] bg-gradient-to-t from-[#0B5ED7] to-[#25A5E8] transition-[filter] duration-200 group-hover:brightness-105"
            style={{ height: Math.max((m.quantidade / maior) * ALTURA_MAX, 4) }}
          />

          <span className="mt-2 whitespace-nowrap pb-2 font-body text-[9px] text-[#8795AA] dark:text-[#8396B3]">
            {m.rotulo.slice(5)}/{m.rotulo.slice(2, 4)}
          </span>
        </div>
      ))}
    </div>
  );
}

function LinhaReuniao({ reuniao, t }: { reuniao: Reuniao; t: TranslateFn }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-[#EEF2F6] dark:border-[#20334D] py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate font-heading text-[10px] font-semibold text-[#163B75] dark:text-[#C7D8F3]">
          {reuniao.unidade ?? t("common.unitUnknown")}
        </p>
        <p className="mt-1 truncate font-body text-[9px] text-[#8795AA] dark:text-[#8396B3]">
          {t("dashboard.recentMeta", {
            codt: reuniao.codt,
            data: formatarData(reuniao.data),
            dur: formatarDuracao(reuniao.duracaoSegundos),
          })}
        </p>
      </div>

      {reuniao.nps !== null && (
        <span
          className={`rounded-md px-2 py-1 font-body text-[9px] font-semibold ${
            reuniao.nps >= 9
              ? "bg-[#E8F8EE] text-[#159A55] dark:bg-[#123425] dark:text-[#4ADE80]"
              : reuniao.nps >= 7
                ? "bg-[#EEF4FF] text-[#2563EB] dark:bg-[#14284A] dark:text-[#6EA8FF]"
                : "bg-[#FFF0F0] text-[#E5484D] dark:bg-[#3A1D24] dark:text-[#F87171]"
          }`}
        >
          NPS {reuniao.nps}
        </span>
      )}
    </div>
  );
}

function KpiPrototipo({
  kpi,
}: {
  kpi: ResumoDashboard["kpis"][number];
}) {
  const estilo = KPI_ESTILO[kpi.id] ?? KPI_FALLBACK;

  return (
    <div className="min-w-0 rounded-xl border border-[#E2E8F2] dark:border-[#223652] bg-white dark:bg-[#0F1D31] px-4 py-4 shadow-[0_2px_8px_rgba(15,39,80,0.035)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${estilo.iconBg} ${estilo.iconColor}`}
        >
          {estilo.icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-body text-[9px] font-semibold text-[#173B77] dark:text-[#C7D8F3]">
            {kpi.titulo}
          </p>
          <p className="mt-1 font-heading text-[23px] font-bold leading-none tracking-[-0.02em] text-[#071D63] dark:text-[#F3F7FF]">
            {kpi.valor}
          </p>
        </div>
      </div>

      <div className="mt-3 flex min-w-0 items-center gap-2">
        <span className={`font-body text-[9px] font-semibold ${estilo.accent}`}>↗</span>
        <span className="truncate font-body text-[9px] text-[#7F8DA3] dark:text-[#8396B3]">{kpi.detalhe}</span>
      </div>
    </div>
  );
}

function PainelDistribuicoes({ data, t }: { data: ResumoDashboard; t: TranslateFn }) {
  return (
    <Card className="rounded-xl border border-[#E2E8F2] dark:border-[#223652] bg-white dark:bg-[#0F1D31] p-0 shadow-[0_2px_8px_rgba(15,39,80,0.035)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
      <div className="border-b border-[#E8EDF5] dark:border-[#223652] px-5 py-4">
        <h3 className="font-heading text-[13px] font-semibold text-[#08266A] dark:text-[#EAF2FF]">
          Distribuição dos dados
        </h3>
      </div>

      <div className="grid grid-cols-1 divide-y divide-[#EEF2F6] dark:divide-[#20334D] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        <div className="p-5">
          <p className="mb-4 font-body text-[10px] font-semibold text-[#173B77] dark:text-[#C7D8F3]">
            {t("dashboard.bySegment")}
          </p>
          <BarraDistribuicao fatias={data.porSegmento} t={t} />
        </div>

        <div className="p-5">
          <p className="mb-4 font-body text-[10px] font-semibold text-[#173B77] dark:text-[#C7D8F3]">
            {t("dashboard.byState")}
          </p>
          <BarraDistribuicao fatias={data.porUf} t={t} />
        </div>

        <div className="p-5">
          <p className="mb-4 font-body text-[10px] font-semibold text-[#173B77] dark:text-[#C7D8F3]">
            {t("dashboard.byUnit")}
          </p>
          <BarraDistribuicao fatias={data.porUnidade} t={t} />
        </div>
      </div>
    </Card>
  );
}

function VisaoGeral({ data, t }: { data: ResumoDashboard; t: TranslateFn }) {
  return (
    <div className="flex flex-col gap-3">
      {/* KPIs: mesmos dados do banco/repositório, apenas com o visual do protótipo. */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi) => (
          <KpiPrototipo key={kpi.id} kpi={kpi} />
        ))}
      </section>

      {/* Miolo do dashboard seguindo a composição do Figma/protótipo. */}
      <section className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Card className="rounded-xl border border-[#E2E8F2] dark:border-[#223652] bg-white dark:bg-[#0F1D31] p-0 shadow-[0_2px_8px_rgba(15,39,80,0.035)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.18)] xl:col-span-5">
          <div className="flex items-center justify-between border-b border-[#E8EDF5] dark:border-[#223652] px-5 py-4">
            <div>
              <h2 className="font-heading text-[13px] font-semibold text-[#08266A] dark:text-[#EAF2FF]">
                {t("dashboard.recentTitle")}
              </h2>
              <p className="mt-0.5 font-body text-[9px] text-[#8795AA] dark:text-[#8396B3]">
                Informações mais recentes processadas pelo sistema
              </p>
            </div>
            <span className="font-body text-[9px] font-semibold text-[#0B66E4] dark:text-[#6EA8FF]">Ver todas</span>
          </div>

          <div className="px-5">
            {data.recentes.slice(0, 5).map((r) => (
              <LinhaReuniao key={r.id} reuniao={r} t={t} />
            ))}
          </div>
        </Card>

        <Card className="rounded-xl border border-[#E2E8F2] dark:border-[#223652] bg-white dark:bg-[#0F1D31] p-0 shadow-[0_2px_8px_rgba(15,39,80,0.035)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.18)] xl:col-span-7">
          <div className="flex items-center justify-between border-b border-[#E8EDF5] dark:border-[#223652] px-5 py-4">
            <div>
              <h2 className="font-heading text-[13px] font-semibold text-[#08266A] dark:text-[#EAF2FF]">
                {t("dashboard.volumeTitle")}
              </h2>
              <p className="mt-0.5 font-body text-[9px] text-[#8795AA] dark:text-[#8396B3]">
                Tendência das reuniões analisadas
              </p>
            </div>
            <span className="rounded-md border border-[#E2E8F2] dark:border-[#223652] px-2.5 py-1.5 font-body text-[9px] text-[#39537D] dark:text-[#AFC2E2]">
              {t("dashboard.fullBase")}
            </span>
          </div>

          <div className="px-5 pb-4">
            <VolumeMensal meses={data.volumeMensal} t={t} />
          </div>
        </Card>
      </section>

      <PainelDistribuicoes data={data} t={t} />
    </div>
  );
}

/** Visões de insight do dashboard. */
function InsightPanel({ tab, t }: { tab: InsightTab; t: TranslateFn }) {
  const insight = INSIGHTS[tab];
  const base = `insights.${tab}`;

  const kpis = insight.values.map((value, i) => ({
    label: t(`${base}.k${i}`),
    value,
    detalhe: t(`${base}.d${i}`),
  }));

  const itens = [0, 1, 2, 3].map((i) => ({
    titulo: t(`${base}.i${i}t`),
    detalhe: t(`${base}.i${i}d`),
    tag: t(`${base}.i${i}g`),
  }));

  return (
    <div className="flex flex-col gap-3">
      <Card className="rounded-xl border border-[#E2E8F2] dark:border-[#223652] bg-white dark:bg-[#0F1D31] p-5 shadow-[0_2px_8px_rgba(15,39,80,0.035)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-heading text-[17px] font-bold text-[#071D63] dark:text-[#F3F7FF]">
              {t(`dashboard.tabs.${tab}`)}
            </h2>
            <p className="mt-1 font-body text-[10px] text-[#6F7F96] dark:text-[#9AACCA]">
              {t(`${base}.description`)}
            </p>
          </div>

          <span className="rounded-full border border-[#F3D7A3] dark:border-[#6B5626] bg-[#FFF8E8] dark:bg-[#392E16] px-2.5 py-1 font-body text-[9px] font-medium text-[#A26812] dark:text-[#F4C66A]">
            {t("dashboard.mockBadge")}
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, index) => {
          const visuais = [
            ["bg-[#E8F8EE] dark:bg-[#123425]", "text-[#159A55] dark:text-[#4ADE80]"],
            ["bg-[#FFF0EA] dark:bg-[#3A2718]", "text-[#EA5B2A] dark:text-[#FB923C]"],
            ["bg-[#EEE9FF] dark:bg-[#2A234A]", "text-[#6C43E0] dark:text-[#A78BFA]"],
            ["bg-[#FFEAEA] dark:bg-[#3A1D24]", "text-[#E5484D] dark:text-[#F87171]"],
          ][index % 4];

          return (
            <Card
              key={kpi.label}
              className="rounded-xl border border-[#E2E8F2] dark:border-[#223652] bg-white dark:bg-[#0F1D31] p-4 shadow-[0_2px_8px_rgba(15,39,80,0.035)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.18)]"
            >
              <div className="flex items-start gap-3">
                <div className={`h-9 w-9 flex-shrink-0 rounded-full ${visuais[0]}`} />
                <div className="min-w-0">
                  <p className="font-body text-[9px] font-semibold text-[#173B77] dark:text-[#C7D8F3]">{kpi.label}</p>
                  <p className="mt-1 font-heading text-[22px] font-bold leading-none text-[#071D63] dark:text-[#F3F7FF]">
                    {kpi.value}
                  </p>
                </div>
              </div>
              <p className={`mt-3 font-body text-[9px] ${visuais[1]}`}>{kpi.detalhe}</p>
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden rounded-xl border border-[#E2E8F2] dark:border-[#223652] bg-white dark:bg-[#0F1D31] p-0 shadow-[0_2px_8px_rgba(15,39,80,0.035)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
        <div className="border-b border-[#E8EDF5] dark:border-[#223652] px-5 py-4">
          <h3 className="font-heading text-[13px] font-semibold text-[#08266A] dark:text-[#EAF2FF]">{t(`${base}.listTitle`)}</h3>
        </div>

        <div className="divide-y divide-[#EEF2F6] px-5 dark:divide-[#20334D]">
          {itens.map((item) => (
            <div key={item.titulo} className="flex items-start justify-between gap-4 py-3.5">
              <div className="min-w-0">
                <p className="font-heading text-[10px] font-semibold text-[#173B77] dark:text-[#C7D8F3]">
                  {item.titulo}
                </p>
                <p className="mt-1 font-body text-[9px] text-[#8795AA] dark:text-[#8396B3]">{item.detalhe}</p>
              </div>
              <span className="flex-shrink-0 rounded-md bg-[#F3F6FA] dark:bg-[#1A2A43] px-2 py-1 font-body text-[9px] text-[#5E6F86] dark:text-[#9AACCA]">
                {item.tag}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const { t, locale } = useLocale();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  /*
   * INTEGRAÇÃO ORIGINAL PRESERVADA.
   * Não foi alterado o repository, useDataset, locale, tratamento de erro,
   * carregamento, formato dos dados nem seleção das abas.
   */
  const { data, loading, error, sugestao } = useDataset<ResumoDashboard>(
    useCallback(() => getResumoDashboard(), [locale]),
  );

  function selecionarTab(tab: TabId) {
    setActiveTab(tab);
  }

  function labelOf(id: TabId) {
    return t(`dashboard.tabs.${id}`);
  }

  return (
    <div className="-m-1 rounded-[16px] bg-[#F8FAFD] p-1 transition-colors duration-200 dark:bg-[#07111F] sm:-m-2 sm:p-2">
      <div className="flex flex-col gap-3 rounded-[14px] border border-[#DFE7F1] bg-[#FBFCFE] p-4 transition-colors duration-200 dark:border-[#20334D] dark:bg-[#0B1628] shadow-[0_8px_28px_rgba(22,54,101,0.04)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.22)] sm:p-5">
        {/* Cabeçalho do conteúdo, espelhando o protótipo. */}
        <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="font-body text-[10px] font-medium text-[#173B77] dark:text-[#C7D8F3]">
              {t("dashboard.welcome")}
            </p>
            <h1 className="mt-1 font-heading text-[28px] font-bold leading-none tracking-[-0.035em] text-[#071D63] dark:text-[#F3F7FF]">
              {t("dashboard.title")}
            </h1>
            <p className="mt-2 max-w-2xl font-body text-[10px] text-[#667892] dark:text-[#9EB0CA]">
              {t("dashboard.explore")} {" "}
              <span className="text-[#8795AA] dark:text-[#8396B3]">{t("dashboard.exploreHint")}</span>
            </p>
          </div>

          {/* Somente visual. Sem onClick e sem qualquer alteração de lógica. */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-9 items-center gap-2 rounded-lg border border-[#DCE5F0] dark:border-[#2A3E5D] bg-white dark:bg-[#0F1D31] px-3 font-body text-[10px] font-semibold text-[#173B77] dark:text-[#C7D8F3] shadow-[0_1px_3px_rgba(15,39,80,0.03)] dark:shadow-none">
              <span aria-hidden>▣</span>
              Últimos 30 dias
              <span className="text-[#71819A] dark:text-[#91A3BE]">⌄</span>
            </div>
            <div className="flex h-9 items-center gap-2 rounded-lg border border-[#DCE5F0] dark:border-[#2A3E5D] bg-white dark:bg-[#0F1D31] px-3 font-body text-[10px] font-semibold text-[#173B77] dark:text-[#C7D8F3] shadow-[0_1px_3px_rgba(15,39,80,0.03)] dark:shadow-none">
              <span aria-hidden>↻</span>
              Atualizar dados
            </div>
          </div>
        </section>

        {/* Abas originais preservadas, porém visualmente discretas. */}
        <div className="overflow-x-auto rounded-xl border border-[#E2E8F2] dark:border-[#223652] bg-white dark:bg-[#0F1D31] p-1.5 shadow-[0_2px_8px_rgba(15,39,80,0.025)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.16)]">
          <div className="flex min-w-max flex-col gap-1">
            <TabBar
              tabs={TAB_ROW1}
              active={activeTab}
              onSelect={selecionarTab}
              labelOf={labelOf}
            />
            <TabBar
              tabs={TAB_ROW2}
              active={activeTab}
              onSelect={selecionarTab}
              labelOf={labelOf}
            />
          </div>
        </div>

        {activeTab === "overview" && (
          <>
            {/*
             * Componente original mantido por completo porque ele pode depender do backend.
             * Apenas foi reposicionado dentro da hierarquia visual da página.
             */}
            <div className="overflow-hidden rounded-xl [&>*]:!mb-0">
              <HistoricoAnalises compacto />
            </div>

            {loading && <LoadingState label={t("dashboard.loading")} />}
            {error && <ErrorState error={error} sugestao={sugestao} />}
            {data && <VisaoGeral data={data} t={t} />}
          </>
        )}

        {activeTab === "churn" && <PainelChurn />}

        {isInsightTab(activeTab) && <InsightPanel tab={activeTab} t={t} />}
      </div>
    </div>
  );
}
