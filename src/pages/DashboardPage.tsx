import HistoricoAnalises from "@/components/HistoricoAnalises";
import { useCallback, useState } from "react";
import { getResumoDashboard, type ResumoDashboard } from "@/data/repository";
import useDataset from "@/data/useDataset";
import type { Fatia, Reuniao } from "@/data/types";
import { INSIGHTS, type InsightTab } from "@/data/mockData";
import { useLocale } from "@/i18n/useLocale";
import { getActiveLocale, type TranslateFn } from "@/i18n/types";
import { capitalizar, formatarData, formatarDuracao } from "@/format";
import { ClockIcon, SmileIcon, TrendingUpIcon, UsersIcon } from "@/icons";
import Card, { CardHeader } from "@/components/ui/Card";
import KpiCard from "@/components/ui/KpiCard";
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

function isInsightTab(tab: TabId): tab is InsightTab {
  return tab !== "overview";
}

/** Estilo de cada KPI, casado pelo `id` que o repositório devolve. */
const KPI_ESTILO: Record<
  string,
  {
    iconBg: string;
    iconColor: string;
    icon: React.ReactNode;
  }
> = {
  reunioes: {
    iconBg: "#D2E4FF",
    iconColor: "text-brand-blue",
    icon: <TrendingUpIcon size={14} />,
  },
  horas: {
    iconBg: "#D7FFDB",
    iconColor: "text-[#0AB310]",
    icon: <ClockIcon size={14} />,
  },
  clientes: {
    iconBg: "#FDD6B4",
    iconColor: "text-[#B33D0A]",
    icon: <UsersIcon size={14} />,
  },
  nps: {
    iconBg: "#FFCDCD",
    iconColor: "text-[#B3180A]",
    icon: <SmileIcon size={14} />,
  },
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
    <Card className="p-1">
      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5 sm:flex-wrap sm:overflow-visible">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onSelect(tab)}
            className={`font-body shrink-0 rounded-lg px-3 py-1.5 text-xs transition-colors ${
              active === tab ? "bg-brand-blue text-white" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            {labelOf(tab)}
          </button>
        ))}
      </div>
    </Card>
  );
}

/** Barras horizontais de uma distribuição — sem dependência de lib de gráfico. */
function BarraDistribuicao({ fatias, t }: { fatias: Fatia[]; t: TranslateFn }) {
  if (fatias.length === 0) {
    return (
      <p className="font-body py-6 text-center text-xs text-gray-400">
        {t("dashboard.emptyChart")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {fatias.map((f) => (
        <div key={f.rotulo}>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="font-body truncate text-meta text-gray-600">
              {capitalizar(f.rotulo)}
            </span>
            <span className="font-heading flex-shrink-0 text-meta font-semibold text-brand-text">
              {f.quantidade.toLocaleString(getActiveLocale())}
              <span className="ml-1 font-normal text-gray-400">{f.percentual}%</span>
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100">
            <div
              className="h-1.5 rounded-full bg-brand-blue"
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

  /*
   * Altura em pixels, não em porcentagem: dentro de uma coluna flex o `%` se
   * resolveria contra uma altura indefinida e achataria todas as barras.
   */
  const ALTURA_MAX = 132;

  return (
    <div className="flex items-end justify-between gap-2">
      {meses.map((m) => (
        <div
          key={m.rotulo}
          className="flex flex-1 flex-col items-center justify-end gap-1.5"
          title={t("dashboard.volumeTooltip", { n: m.quantidade, month: m.rotulo })}
        >
          <span className="font-heading text-micro font-semibold text-brand-text">
            {m.quantidade}
          </span>
          <div
            className="w-full rounded-t bg-gradient-to-t from-brand-blue to-brand-bright"
            style={{ height: Math.max((m.quantidade / maior) * ALTURA_MAX, 4) }}
          />
          <span className="font-body text-micro whitespace-nowrap text-gray-400">
            {m.rotulo.slice(5)}/{m.rotulo.slice(2, 4)}
          </span>
        </div>
      ))}
    </div>
  );
}

function LinhaReuniao({ reuniao, t }: { reuniao: Reuniao; t: TranslateFn }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="font-heading truncate text-xs font-medium text-brand-text">
          {reuniao.unidade ?? t("common.unitUnknown")}
        </p>
        <p className="font-body text-micro text-gray-400">
          {t("dashboard.recentMeta", {
            codt: reuniao.codt,
            data: formatarData(reuniao.data),
            dur: formatarDuracao(reuniao.duracaoSegundos),
          })}
        </p>
      </div>
      {reuniao.nps !== null && (
        <span
          className={`font-body flex-shrink-0 rounded-full px-2 py-0.5 text-micro ${
            reuniao.nps >= 9
              ? "bg-green-50 text-green-600"
              : reuniao.nps >= 7
                ? "bg-gray-50 text-gray-500"
                : "bg-red-50 text-red-600"
          }`}
        >
          NPS {reuniao.nps}
        </span>
      )}
    </div>
  );
}

function VisaoGeral({ data, t }: { data: ResumoDashboard; t: TranslateFn }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi) => {
          const estilo = KPI_ESTILO[kpi.id];
          return (
            <KpiCard
              key={kpi.id}
              title={kpi.titulo}
              value={kpi.valor}
              hint={kpi.detalhe}
              iconBg={estilo.iconBg}
              iconColor={estilo.iconColor}
              icon={estilo.icon}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card className="p-5">
            <CardHeader
              title={t("dashboard.volumeTitle")}
              action={
                <span className="font-body text-meta text-gray-400">{t("dashboard.fullBase")}</span>
              }
            />
            <VolumeMensal meses={data.volumeMensal} t={t} />
          </Card>

          <Card className="p-5">
            <CardHeader title={t("dashboard.recentTitle")} />
            <div className="flex flex-col divide-y divide-gray-100">
              {data.recentes.map((r) => (
                <LinhaReuniao key={r.id} reuniao={r} t={t} />
              ))}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <CardHeader title={t("dashboard.bySegment")} />
            <BarraDistribuicao fatias={data.porSegmento} t={t} />
          </Card>

          <Card className="p-5">
            <CardHeader title={t("dashboard.byState")} />
            <BarraDistribuicao fatias={data.porUf} t={t} />
          </Card>

          <Card className="p-5">
            <CardHeader title={t("dashboard.byUnit")} />
            <BarraDistribuicao fatias={data.porUnidade} t={t} />
          </Card>
        </div>
      </div>
    </>
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
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        {/*
         * O selo é obrigatório: os números desta aba vêm de `mockData.ts`, não da
         * base. Sem ele, "R$ 2,4M em oportunidades" fica indistinguível dos KPIs
         * reais da Visão Geral.
         */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-heading text-base font-semibold text-brand-text">
              {t(`dashboard.tabs.${tab}`)}
            </h2>
            <p className="font-body mt-1 text-xs text-gray-500">{t(`${base}.description`)}</p>
          </div>
          <span className="font-body flex-shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-micro text-amber-700">
            {t("dashboard.mockBadge")}
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="flex flex-col gap-2 p-5">
            <p className="font-heading text-xs text-gray-500">{kpi.label}</p>
            <p className="font-heading text-2xl font-bold text-brand-text">{kpi.value}</p>
            <p className="font-body text-micro text-gray-400">{kpi.detalhe}</p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <CardHeader title={t(`${base}.listTitle`)} />
        <div className="flex flex-col divide-y divide-gray-100">
          {itens.map((item) => (
            <div key={item.titulo} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-heading text-xs font-medium text-brand-text">{item.titulo}</p>
                <p className="font-body mt-0.5 text-micro text-gray-400">{item.detalhe}</p>
              </div>
              <span className="font-body flex-shrink-0 rounded-full bg-gray-50 px-2 py-0.5 text-micro text-gray-600">
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
    <div className="flex flex-col gap-5">
      <div>
        <p className="font-body text-xs font-medium text-brand-blue">{t("dashboard.welcome")}</p>
        <h1 className="font-heading text-xl font-bold text-brand-text">{t("dashboard.title")}</h1>
        <p className="font-body mt-1 text-xs text-gray-500">
          {t("dashboard.explore")}{" "}
          <span className="text-gray-400">{t("dashboard.exploreHint")}</span>
        </p>
      </div>

      <TabBar tabs={TAB_ROW1} active={activeTab} onSelect={selecionarTab} labelOf={labelOf} />
      <TabBar tabs={TAB_ROW2} active={activeTab} onSelect={selecionarTab} labelOf={labelOf} />

      {activeTab === "overview" && (
        <>
          <HistoricoAnalises compacto />
          {loading && <LoadingState label={t("dashboard.loading")} />}
          {error && <ErrorState error={error} sugestao={sugestao} />}
          {data && <VisaoGeral data={data} t={t} />}
        </>
      )}

      {isInsightTab(activeTab) && <InsightPanel tab={activeTab} t={t} />}
    </div>
  );
}
