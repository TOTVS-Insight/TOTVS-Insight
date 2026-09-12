import { RELATORIOS } from "@/data/mockData";

import { useLocale } from "@/i18n/useLocale";

import { DownloadIcon } from "@/icons";

import Card from "@/components/ui/Card";

import StatusBadge from "@/components/ui/StatusBadge";

const RESUMO_KEYS = [
  { key: "totalGenerated", value: "5", icon: "◉", tone: "blue" },
  { key: "thisMonth", value: "1", icon: "◎", tone: "green" },
  { key: "totalExported", value: "14.7 MB", icon: "◇", tone: "violet" },
  { key: "pending", value: "1", icon: "!", tone: "red" },
] as const;

const COL_KEYS = ["name", "type", "generated", "size", "status", "action"] as const;

type Tone = "blue" | "green" | "violet" | "red" | "orange";

function KpiCard({
  title,
  value,
  tone,
  icon,
}: {
  title: string;
  value: string;
  tone: Tone;
  icon: string;
}) {
  const { t } = useLocale();
  const tones: Record<Tone, string> = {
    blue:
      "border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-400",
    green:
      "border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400",
    violet:
      "border-violet-100 bg-violet-50 text-violet-600 dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-violet-400",
    red:
      "border-red-100 bg-red-50 text-red-500 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400",
    orange:
      "border-orange-100 bg-orange-50 text-orange-500 dark:border-orange-900/40 dark:bg-orange-950/30 dark:text-orange-400",
  };

  return (
    <div className="rounded-[14px] border border-[#dfe7f3] bg-white px-4 py-4 shadow-[0_5px_16px_rgba(17,48,104,0.035)] transition-colors duration-200 dark:border-[#223652] dark:bg-[#0f1d31] dark:shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-base font-semibold ${tones[tone]}`}
          aria-hidden="true"
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="truncate text-[9px] font-semibold text-[#183b86] dark:text-[#c7d8f3]">
            {title}
          </p>
          <p className="mt-1 text-[22px] font-bold leading-none tracking-[-0.03em] text-[#071d66] dark:text-[#f3f7ff]">
            {value}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">↗</span>
        <span className="text-[8px] text-[#8290ae] dark:text-[#8396b3]">
          {t("kpi.vsPrevious")}
        </span>
      </div>
    </div>
  );
}

function MiniBar({
  label,
  value,
  percent,
  tone,
}: {
  label: string;
  value: string;
  percent: number;
  tone: "green" | "blue" | "orange" | "violet" | "cyan";
}) {
  const toneClass = {
    green: "bg-emerald-500",
    blue: "bg-blue-500",
    orange: "bg-orange-500",
    violet: "bg-violet-500",
    cyan: "bg-cyan-500",
  }[tone];

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-[9px] font-medium text-[#354f85] dark:text-[#b7c9e8]">{label}</span>
        <span className="text-[9px] font-semibold text-[#102d72] dark:text-[#dce8fa]">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#edf2f8] dark:bg-[#22324a]">
        <div className={`h-full rounded-full ${toneClass}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function RelatoriosPage() {
  const { t } = useLocale();

  const concluidos = RELATORIOS.filter((r) => r.status === "Concluído").length;
  const pendentes = RELATORIOS.length - concluidos;

  return (
    <div className="-m-2 rounded-[18px] bg-[#f5f8fd] p-2 transition-colors duration-200 dark:bg-[#07111f] sm:-m-3 sm:p-3 lg:-m-4 lg:p-4">
      <div className="rounded-[16px] border border-[#dce5f2] bg-white px-5 py-5 shadow-[0_10px_30px_rgba(29,72,145,0.045)] transition-colors duration-200 dark:border-[#20334d] dark:bg-[#0f1d31] dark:shadow-[0_12px_30px_rgba(0,0,0,0.22)] sm:px-6">
        {/* CABEÇALHO */}
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[10px] font-semibold text-[#1b4fc6] dark:text-[#6ea8ff]">
              {t("dashboard.welcome")}
            </p>

            <h1 className="mt-1 text-[30px] font-bold leading-none tracking-[-0.035em] text-[#071d66] dark:text-[#f3f7ff]">
              {t("reports.title")}
            </h1>

            <p className="mt-2 text-[11px] text-[#6576a5] dark:text-[#9aaccc]">
              {t("reports.subtitle")}
            </p>
          </div>

          {/* Botões apenas visuais. Não foi adicionada lógica nova. */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-lg border border-[#d6e0ef] bg-white px-4 text-[11px] font-semibold text-[#153b94] transition-colors hover:bg-[#f8faff] dark:border-[#2a3e5d] dark:bg-[#0f1d31] dark:text-[#c7d8f3] dark:hover:bg-[#162640]"
            >
              <span aria-hidden="true">⇩</span>
              {t("reports.exportPdf")}
            </button>

            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-lg border border-[#d6e0ef] bg-white px-4 text-[11px] font-semibold text-[#153b94] transition-colors hover:bg-[#f8faff] dark:border-[#2a3e5d] dark:bg-[#0f1d31] dark:text-[#c7d8f3] dark:hover:bg-[#162640]"
            >
              <span aria-hidden="true">▦</span>
              {t("reports.exportCsv")}
            </button>

            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-lg bg-[#0d57e7] px-4 text-[11px] font-semibold text-white shadow-[0_5px_12px_rgba(13,87,231,0.16)] transition-colors hover:bg-[#0b4dd0]"
            >
              <span aria-hidden="true">▥</span>
              {t("reports.customReport")}
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
          {RESUMO_KEYS.map((c) => (
            <KpiCard
              key={c.key}
              title={t(`reports.${c.key}`)}
              value={c.value}
              tone={c.tone as Tone}
              icon={c.icon}
            />
          ))}

          <KpiCard
            title={t("reports.done")}
            value={concluidos.toLocaleString()}
            tone="green"
            icon="✓"
          />
        </div>

        {/* ABAS VISUAIS */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {(
            [
              "overview",
              "trend",
              "products",
              "clients",
              "competitors",
              "sentiment",
              "opportunities",
              "pains",
            ] as const
          ).map((tab, index) => (
            <span
              key={t(`reports.tabs.${tab}`)}
              className={`rounded-md px-3 py-2 text-[9px] font-semibold ${
                index === 0
                  ? "bg-[#0d57e7] text-white"
                  : "border border-[#dbe4f1] bg-white text-[#53658f] dark:border-[#2a3e5d] dark:bg-[#111f34] dark:text-[#9fb0c9]"
              }`}
            >
              {tab}
            </span>
          ))}
        </div>

        {/* ÁREA PRINCIPAL */}
        <div className="mt-4 grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-4">
            {/* GRÁFICOS SUPERIORES */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Card className="rounded-[14px] !border-[#dce5f2] !bg-white p-4 !shadow-[0_4px_16px_rgba(23,58,118,0.035)] dark:!border-[#20334d] dark:!bg-[#0f1d31] dark:!shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
                <div className="flex items-center justify-between">
                  <h2 className="text-[13px] font-bold text-[#071d66] dark:text-[#f3f7ff]">
                    {t("reports.trendTitle")}
                  </h2>
                  <span className="rounded-md border border-[#dbe4f1] px-2 py-1 text-[8px] text-[#53658f] dark:border-[#2a3e5d] dark:text-[#9fb0c9]">
                    {t("reports.last6")}
                  </span>
                </div>

                <div className="mt-4 flex h-[180px] items-end gap-3 border-b border-[#e7edf6] px-2 pb-2 dark:border-[#223652]">
                  {[42, 58, 49, 72, 61, 79].map((h, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
                      <div
                        className="w-full max-w-[44px] rounded-t-md bg-gradient-to-t from-[#0d57e7] to-[#25a5e8]"
                        style={{ height: `${h}%` }}
                      />
                      <span className="text-[8px] text-[#8290ae] dark:text-[#8396b3]">
                        {["Dez", "Jan", "Fev", "Mar", "Abr", "Mai"][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="rounded-[14px] !border-[#dce5f2] !bg-white p-4 !shadow-[0_4px_16px_rgba(23,58,118,0.035)] dark:!border-[#20334d] dark:!bg-[#0f1d31] dark:!shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
                <div className="flex items-center justify-between">
                  <h2 className="text-[13px] font-bold text-[#071d66] dark:text-[#f3f7ff]">
                    {t("reports.distribution")}
                  </h2>
                  <span className="rounded-md border border-[#dbe4f1] px-2 py-1 text-[8px] text-[#53658f] dark:border-[#2a3e5d] dark:text-[#9fb0c9]">
                    {t("reports.currentBase")}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-[150px_1fr] sm:items-center">
                  <div className="mx-auto flex h-[130px] w-[130px] items-center justify-center rounded-full bg-[conic-gradient(#0d57e7_0_42%,#22c55e_42%_68%,#f59e0b_68%_84%,#8b5cf6_84%_100%)]">
                    <div className="flex h-[78px] w-[78px] flex-col items-center justify-center rounded-full bg-white dark:bg-[#0f1d31]">
                      <span className="text-[19px] font-bold text-[#071d66] dark:text-[#f3f7ff]">
                        {RELATORIOS.length}
                      </span>
                      <span className="text-[8px] text-[#8290ae] dark:text-[#8396b3]">Total</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <MiniBar label={t("reports.done")} value={String(concluidos)} percent={76} tone="green" />
                    <MiniBar label={t("reports.pendingPlural")} value={String(pendentes)} percent={24} tone="orange" />
                    <MiniBar label="PDF" value="42%" percent={42} tone="blue" />
                    <MiniBar label="CSV" value="31%" percent={31} tone="violet" />
                  </div>
                </div>
              </Card>
            </div>

            {/* CARDS SECUNDÁRIOS */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <Card className="rounded-[14px] !border-[#dce5f2] !bg-white p-4 !shadow-[0_4px_16px_rgba(23,58,118,0.035)] dark:!border-[#20334d] dark:!bg-[#0f1d31]">
                <h2 className="text-[12px] font-bold text-[#071d66] dark:text-[#f3f7ff]">
                  {t("reports.mostGenerated")}
                </h2>
                <div className="mt-4 space-y-3">
                  <MiniBar label={t("reports.kind.executive")} value="32" percent={88} tone="green" />
                  <MiniBar label={t("reports.kind.churn")} value="24" percent={72} tone="blue" />
                  <MiniBar label={t("reports.kind.products")} value="18" percent={58} tone="orange" />
                  <MiniBar label={t("reports.kind.sentiment")} value="12" percent={42} tone="violet" />
                </div>
              </Card>

              <Card className="rounded-[14px] !border-[#dce5f2] !bg-white p-4 !shadow-[0_4px_16px_rgba(23,58,118,0.035)] dark:!border-[#20334d] dark:!bg-[#0f1d31]">
                <h2 className="text-[12px] font-bold text-[#071d66] dark:text-[#f3f7ff]">
                  {t("reports.statusTitle")}
                </h2>
                <div className="mt-4 space-y-3">
                  <MiniBar label={t("reports.done")} value={String(concluidos)} percent={80} tone="green" />
                  <MiniBar label={t("reports.pendingPlural")} value={String(pendentes)} percent={20} tone="orange" />
                  <MiniBar label={t("reports.exported")} value="14.7 MB" percent={66} tone="cyan" />
                </div>
              </Card>

              <Card className="rounded-[14px] !border-[#dce5f2] !bg-white p-4 !shadow-[0_4px_16px_rgba(23,58,118,0.035)] dark:!border-[#20334d] dark:!bg-[#0f1d31]">
                <h2 className="text-[12px] font-bold text-[#071d66] dark:text-[#f3f7ff]">
                  {t("reports.summaryTitle")}
                </h2>
                <div className="mt-4 space-y-3 text-[9px] leading-relaxed text-[#60729c] dark:text-[#9aaccc]">
                  <p>{t("reports.summary1")}</p>
                  <p>{t("reports.summary2")}</p>
                  <p>{t("reports.summary3")}</p>
                  <p>{t("reports.summary4")}</p>
                </div>
              </Card>
            </div>

            {/* TABELA ORIGINAL */}
            <Card className="overflow-hidden rounded-[14px] !border-[#dce5f2] !bg-white !shadow-[0_4px_16px_rgba(23,58,118,0.035)] dark:!border-[#20334d] dark:!bg-[#0f1d31] dark:!shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
              <div className="flex items-center justify-between gap-3 border-b border-[#e7edf6] px-5 py-3 dark:border-[#223652]">
                <p className="font-heading text-sm font-semibold text-[#071d66] dark:text-[#f3f7ff]">
                  {t("reports.tableTitle")}
                </p>

                <button className="rounded-lg bg-[#0d57e7] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#0b4dd0]">
                  {t("reports.generate")}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-xs">
                  <thead>
                    <tr className="border-b border-[#e7edf6] bg-[#fbfcff] dark:border-[#223652] dark:bg-[#111f34]">
                      {COL_KEYS.map((key) => (
                        <th
                          key={key}
                          className="px-4 py-3 text-left font-medium whitespace-nowrap text-[#49608f] dark:text-[#9fb0c9]"
                        >
                          {t(`reports.col.${key}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {RELATORIOS.map((r, i) => (
                      <tr
                        key={i}
                        className="border-b border-[#edf1f7] transition-colors hover:bg-blue-50/30 dark:border-[#20334d] dark:hover:bg-[#162640]"
                      >
                        <td className="px-4 py-3 font-medium text-[#183b86] dark:text-[#c7d8f3]">
                          {r.nome}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-[#52658f] dark:text-[#9fb0c9]">
                          {r.tipo}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-[#52658f] dark:text-[#9fb0c9]">
                          {r.gerado}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-[#52658f] dark:text-[#9fb0c9]">
                          {r.tamanho}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-4 py-3">
                          {r.status === "Concluído" && (
                            <button className="flex items-center gap-1 text-micro text-brand-blue hover:underline dark:text-[#6ea8ff]">
                              <DownloadIcon size={11} />
                              {t("reports.download")}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* FILTROS LATERAIS */}
          <aside className="space-y-4">
            <Card className="rounded-[14px] !border-[#dce5f2] !bg-white p-4 !shadow-[0_4px_16px_rgba(23,58,118,0.035)] dark:!border-[#20334d] dark:!bg-[#0f1d31]">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-bold text-[#071d66] dark:text-[#f3f7ff]">
                  {t("reports.advancedFilters")}
                </h2>
                <span className="text-[8px] font-semibold text-[#1458e5] dark:text-[#6ea8ff]">
                  {t("reports.clearFilters")}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-1">
                {(
                  [
                    "period",
                    "client",
                    "product",
                    "seller",
                    "segment",
                    "priority",
                    "sentiment",
                    "churnRisk",
                    "opportunityType",
                    "competitor",
                    "analysisStatus",
                    "insightType",
                  ] as const
                ).map((campo) => (
                  <div key={campo}>
                    <p className="mb-1.5 text-[8px] font-medium text-[#6b7ca5] dark:text-[#91a3be]">
                      {t(`reports.filter.${campo}`)}
                    </p>
                    <div className="flex h-9 items-center justify-between rounded-lg border border-[#dbe4f1] bg-white px-3 text-[9px] text-[#354f85] dark:border-[#2a3e5d] dark:bg-[#111f34] dark:text-[#b7c9e8]">
                      <span>{t("common.allM")}</span>
                      <span>⌄</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="mt-4 h-9 w-full rounded-lg bg-[#0d57e7] text-[9px] font-semibold text-white transition-colors hover:bg-[#0b4dd0]"
              >
                {t("reports.applyFilters")}
              </button>
            </Card>

            <Card className="rounded-[14px] !border-[#dce5f2] !bg-white p-4 !shadow-[0_4px_16px_rgba(23,58,118,0.035)] dark:!border-[#20334d] dark:!bg-[#0f1d31]">
              <h2 className="text-[13px] font-bold text-[#071d66] dark:text-[#f3f7ff]">
                {t("reports.quickReports")}
              </h2>

              <div className="mt-3 space-y-2">
                {(["executive", "churn", "opportunities", "sentiment"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-lg border border-[#dbe4f1] bg-white px-3 py-3 text-left text-[9px] font-medium text-[#183b86] transition-colors hover:bg-[#f8faff] dark:border-[#2a3e5d] dark:bg-[#111f34] dark:text-[#c7d8f3] dark:hover:bg-[#162640]"
                  >
                    <span className="text-[#1458e5] dark:text-[#6ea8ff]">▧</span>
                    {t(`reports.quick.${item}`)}
                  </button>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
