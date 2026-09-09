import HistoricoAnalises from "@/components/HistoricoAnalises";
import { HISTORICO, type TipoEvento } from "@/data/mockData";
import { useLocale } from "@/i18n/useLocale";
import { AlertTriangleIcon, CheckCircleIcon, InfoIcon, XCircleIcon } from "@/icons";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";

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
    text: "text-green-600",
    icon: <CheckCircleIcon size={12} />,
  },
  info: {
    dot: "bg-blue-400",
    text: "text-blue-600",
    icon: <InfoIcon size={12} />,
  },
  alerta: {
    dot: "bg-orange-400",
    text: "text-orange-600",
    icon: <AlertTriangleIcon size={12} />,
  },
  erro: {
    dot: "bg-red-400",
    text: "text-red-600",
    icon: <XCircleIcon size={12} />,
  },
};

export default function HistoricoPage() {
  const { t } = useLocale();

  return (
    <div>
      <PageHeader title={t("history.title")} subtitle={t("history.subtitle")} />

      <HistoricoAnalises />
      <p className="mb-3 text-xs text-gray-500">Eventos de demonstração do site</p>
      <Card className="p-6">
        <div className="relative">
          {/* Linha vertical da timeline, alinhada ao centro dos marcadores */}
          <div className="absolute top-0 bottom-0 left-[5px] w-px bg-gray-100" />

          <div className="flex flex-col gap-5">
            {HISTORICO.map((h, i) => {
              const estilo = TIPO_ESTILO[h.tipo];
              return (
                <div key={i} className="flex items-start gap-4">
                  <div className={`z-10 mt-1 h-3 w-3 flex-shrink-0 rounded-full ${estilo.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={estilo.text}>{estilo.icon}</span>
                      <p className="font-heading text-xs font-semibold text-brand-text">{h.acao}</p>
                      <span className="font-body ml-auto text-micro whitespace-nowrap text-gray-400">
                        {h.data}
                      </span>
                    </div>
                    <p className="font-body mt-1 text-meta text-gray-500">{h.detalhe}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
