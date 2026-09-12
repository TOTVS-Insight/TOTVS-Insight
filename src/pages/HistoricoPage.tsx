import HistoricoAnalises from "@/components/HistoricoAnalises";

import { HISTORICO, type TipoEvento } from "@/data/mockData";

import { useLocale } from "@/i18n/useLocale";

import { AlertTriangleIcon, CheckCircleIcon, InfoIcon, XCircleIcon } from "@/icons";

import Card from "@/components/ui/Card";

const TIPO_ESTILO: Record<
  TipoEvento,
  {
    dot: string;
    text: string;
    icon: React.ReactNode;
  }
> = {
  sucesso: {
    dot: "bg-green-400",
    text: "text-green-600 dark:text-green-400",
    icon: <CheckCircleIcon size={12} />,
  },
  info: {
    dot: "bg-blue-400",
    text: "text-blue-600 dark:text-blue-400",
    icon: <InfoIcon size={12} />,
  },
  alerta: {
    dot: "bg-orange-400",
    text: "text-orange-600 dark:text-orange-400",
    icon: <AlertTriangleIcon size={12} />,
  },
  erro: {
    dot: "bg-red-400",
    text: "text-red-600 dark:text-red-400",
    icon: <XCircleIcon size={12} />,
  },
};

type Tone = "blue" | "orange" | "green" | "red" | "violet";

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
  tone: Tone;
  icon: string;
}) {
  const tones: Record<Tone, string> = {
    blue:
      "border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-400",
    orange:
      "border-orange-100 bg-orange-50 text-orange-500 dark:border-orange-900/40 dark:bg-orange-950/30 dark:text-orange-400",
    green:
      "border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400",
    red:
      "border-red-100 bg-red-50 text-red-500 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400",
    violet:
      "border-violet-100 bg-violet-50 text-violet-600 dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-violet-400",
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
          <p className="truncate text-[10px] font-semibold text-[#183b86] dark:text-[#c7d8f3]">
            {title}
          </p>
          <p className="mt-0.5 text-[22px] font-bold leading-none tracking-[-0.03em] text-[#071d66] dark:text-[#f3f7ff]">
            {value}
          </p>
        </div>
      </div>

      <p className="mt-3 text-[9px] font-medium text-[#6f7ea7] dark:text-[#91a3be]">
        {caption}
      </p>
    </div>
  );
}

export default function HistoricoPage() {
  const { t } = useLocale();

  /*
   * Somente resumo visual derivado do mock HISTORICO já existente.
   * Nenhuma integração, chamada de backend ou comportamento foi alterado.
   */
  const totalEventos = HISTORICO.length;
  const sucessos = HISTORICO.filter((h) => h.tipo === "sucesso").length;
  const infos = HISTORICO.filter((h) => h.tipo === "info").length;
  const alertas = HISTORICO.filter((h) => h.tipo === "alerta").length;
  const erros = HISTORICO.filter((h) => h.tipo === "erro").length;

  return (
    <div className="-m-2 rounded-[18px] bg-[#f5f8fd] p-2 transition-colors duration-200 dark:bg-[#07111f] sm:-m-3 sm:p-3 lg:-m-4 lg:p-4">
      <div className="rounded-[16px] border border-[#dce5f2] bg-white px-5 py-5 shadow-[0_10px_30px_rgba(29,72,145,0.045)] transition-colors duration-200 dark:border-[#20334d] dark:bg-[#0f1d31] dark:shadow-[0_12px_30px_rgba(0,0,0,0.22)] sm:px-6">
        {/* CABEÇALHO */}
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[10px] font-semibold text-[#1b4fc6] dark:text-[#6ea8ff]">
              Bem-vindo ao TOTVS Insight
            </p>

            <h1 className="mt-1 text-[30px] font-bold leading-none tracking-[-0.035em] text-[#071d66] dark:text-[#f3f7ff]">
              {t("history.title")}
            </h1>

            <p className="mt-2 text-[11px] text-[#6576a5] dark:text-[#9aaccc]">
              {t("history.subtitle")}
            </p>
          </div>

          {/* Elementos visuais, sem lógica nova */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-lg border border-[#d6e0ef] bg-white px-4 text-[11px] font-semibold text-[#153b94] shadow-[0_1px_2px_rgba(30,64,120,0.03)] transition-colors hover:bg-[#f8faff] dark:border-[#2a3e5d] dark:bg-[#0f1d31] dark:text-[#c7d8f3] dark:hover:bg-[#162640]"
            >
              <span aria-hidden="true">⇩</span>
              Exportar histórico
            </button>

            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-lg bg-[#0d57e7] px-4 text-[11px] font-semibold text-white shadow-[0_5px_12px_rgba(13,87,231,0.16)] transition-colors hover:bg-[#0b4dd0]"
            >
              <span aria-hidden="true">▽</span>
              Filtros
            </button>
          </div>
        </div>

        {/* KPIs visuais */}
        <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            title="Eventos registrados"
            value={totalEventos.toLocaleString()}
            caption="total de eventos disponíveis"
            tone="blue"
            icon="◎"
          />
          <MetricCard
            title="Concluídos"
            value={sucessos.toLocaleString()}
            caption="eventos de sucesso"
            tone="green"
            icon="✓"
          />
          <MetricCard
            title="Informativos"
            value={infos.toLocaleString()}
            caption="eventos informativos"
            tone="violet"
            icon="i"
          />
          <MetricCard
            title="Alertas"
            value={alertas.toLocaleString()}
            caption="eventos de atenção"
            tone="orange"
            icon="!"
          />
          <MetricCard
            title="Erros"
            value={erros.toLocaleString()}
            caption="eventos com falha"
            tone="red"
            icon="×"
          />
        </div>

        {/* CONTEÚDO PRINCIPAL */}
        <div className="mt-4 grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-4">
            {/* FILTROS VISUAIS */}
            <Card className="rounded-[14px] !border-[#dce5f2] !bg-white p-4 !shadow-[0_4px_16px_rgba(23,58,118,0.035)] dark:!border-[#20334d] dark:!bg-[#0f1d31] dark:!shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {["Cliente", "Reunião", "Responsável", "Status"].map((label) => (
                  <div key={label}>
                    <p className="mb-1.5 text-[8px] font-medium text-[#6b7ca5] dark:text-[#91a3be]">
                      {label}
                    </p>
                    <div className="flex h-9 items-center justify-between rounded-lg border border-[#dbe4f1] bg-white px-3 text-[9px] text-[#354f85] dark:border-[#2a3e5d] dark:bg-[#111f34] dark:text-[#b7c9e8]">
                      <span>
                        {label === "Cliente"
                          ? "Todos os clientes"
                          : label === "Reunião"
                            ? "Todas as reuniões"
                            : label === "Responsável"
                              ? "Todos os responsáveis"
                              : "Todos os status"}
                      </span>
                      <span>⌄</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* HISTÓRICO ORIGINAL PRESERVADO */}
            <div className="[&_*]:transition-colors [&_*]:duration-200">
              <HistoricoAnalises />
            </div>
          </div>

          {/* PAINEL LATERAL */}
          <aside className="space-y-4">
            <Card className="rounded-[14px] !border-[#dce5f2] !bg-white p-4 !shadow-[0_4px_16px_rgba(23,58,118,0.035)] dark:!border-[#20334d] dark:!bg-[#0f1d31] dark:!shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[14px] font-bold text-[#071d66] dark:text-[#f3f7ff]">
                    Histórico da reunião
                  </h2>
                  <p className="mt-1 text-[9px] text-[#7080a5] dark:text-[#91a3be]">
                    Linha do tempo dos eventos registrados
                  </p>
                </div>

                <span className="text-[16px] text-[#7b89aa] dark:text-[#8296b5]">×</span>
              </div>

              <div className="mt-4 flex items-center gap-3 border-b border-[#e7edf6] pb-4 dark:border-[#223652]">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#155be7] text-[9px] font-bold text-white">
                  HI
                </span>
                <div>
                  <p className="text-[10px] font-semibold text-[#183b86] dark:text-[#c7d8f3]">
                    Linha do tempo
                  </p>
                  <p className="mt-0.5 text-[8px] text-[#8290ae] dark:text-[#8396b3]">
                    {totalEventos} evento(s)
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="relative">
                  <div className="absolute bottom-0 left-[5px] top-0 w-px bg-[#e5ebf4] dark:bg-[#223652]" />

                  <div className="flex flex-col gap-4">
                    {HISTORICO.map((h, i) => {
                      const estilo = TIPO_ESTILO[h.tipo];

                      return (
                        <div key={i} className="flex items-start gap-3">
                          <div
                            className={`z-10 mt-1 h-3 w-3 shrink-0 rounded-full ring-4 ring-white dark:ring-[#0f1d31] ${estilo.dot}`}
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={estilo.text}>{estilo.icon}</span>
                              <p className="truncate text-[9px] font-semibold text-[#183b86] dark:text-[#c7d8f3]">
                                {h.acao}
                              </p>
                            </div>

                            <p className="mt-1 text-[8px] leading-relaxed text-[#60729c] dark:text-[#9aaccc]">
                              {h.detalhe}
                            </p>

                            <p className="mt-1 text-[8px] text-[#8290ae] dark:text-[#8396b3]">
                              {h.data}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          </aside>
        </div>

        {/* EVENTOS DE DEMONSTRAÇÃO */}
        <div className="mt-4">
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
            Eventos de demonstração do site
          </p>

          <Card className="rounded-[14px] !border-[#dce5f2] !bg-white p-6 !shadow-[0_4px_16px_rgba(23,58,118,0.035)] dark:!border-[#20334d] dark:!bg-[#0f1d31] dark:!shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
            <div className="relative">
              {/* Linha vertical da timeline, alinhada ao centro dos marcadores */}
              <div className="absolute bottom-0 left-[5px] top-0 w-px bg-gray-100 dark:bg-[#223652]" />

              <div className="flex flex-col gap-5">
                {HISTORICO.map((h, i) => {
                  const estilo = TIPO_ESTILO[h.tipo];

                  return (
                    <div key={i} className="flex items-start gap-4">
                      <div className={`z-10 mt-1 h-3 w-3 flex-shrink-0 rounded-full ${estilo.dot}`} />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={estilo.text}>{estilo.icon}</span>

                          <p className="font-heading text-xs font-semibold text-brand-text dark:text-[#f3f7ff]">
                            {h.acao}
                          </p>

                          <span className="ml-auto whitespace-nowrap font-body text-micro text-gray-400 dark:text-[#8396b3]">
                            {h.data}
                          </span>
                        </div>

                        <p className="mt-1 font-body text-meta text-gray-500 dark:text-[#9aaccc]">
                          {h.detalhe}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
