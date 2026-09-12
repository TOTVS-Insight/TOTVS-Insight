import { useCallback, useState } from "react";
import {
  listarAnalises,
  obterQualidadeModelo,
  ServicoAnaliseIndisponivelError,
  type QualidadeModelo,
  type ResumoAnalise,
} from "@/data/analises";
import { getReunioes } from "@/data/repository";
import useDataset from "@/data/useDataset";
import type { Reuniao } from "@/data/types";
import { useLocale } from "@/i18n/useLocale";
import { formatarData } from "@/format";
import Card, { CardHeader } from "@/components/ui/Card";
import { ErrorState, LoadingState } from "@/components/ui/DataState";
import TranscricaoDrawer from "@/components/TranscricaoDrawer";

const MAX_REUNIOES = 10;
const MAX_TERMOS = 12;

interface ReuniaoAnalisada {
  reuniao: Reuniao;
  analise: ResumoAnalise;
}

interface DadosChurn {
  totalBase: number;
  /** Análise mais recente de cada reunião da base (textos avulsos ficam de fora). */
  analisadas: ReuniaoAnalisada[];
  qualidade: QualidadeModelo | null;
  /** Publicação sem o servidor de análise: o painel explica em vez de dar erro. */
  semServico: boolean;
}

async function carregarChurn(): Promise<DadosChurn> {
  const [reunioes, analises, qualidade] = await Promise.all([
    getReunioes(),
    listarAnalises().catch((erro) => {
      if (erro instanceof ServicoAnaliseIndisponivelError) return null;
      throw erro;
    }),
    obterQualidadeModelo().catch(() => null),
  ]);
  const porId = new Map(reunioes.map((r) => [r.id, r]));
  // A API devolve da análise mais recente para a mais antiga: a primeira de cada reunião vale.
  const vistas = new Map<string, ReuniaoAnalisada>();
  for (const analise of analises ?? []) {
    const reuniao = porId.get(analise.id_reuniao);
    if (reuniao && !vistas.has(analise.id_reuniao)) vistas.set(analise.id_reuniao, { reuniao, analise });
  }
  return {
    totalBase: reunioes.length,
    analisadas: [...vistas.values()],
    qualidade,
    semServico: analises === null,
  };
}

/**
 * Aba "Churn e Retenção" com o que o modelo de fato calcula: trechos classificados
 * como sinal de risco. Não há probabilidade de cancelamento — só sinais para revisão.
 */
export default function PainelChurn() {
  const { t, locale } = useLocale();
  const { data, loading, error, sugestao } = useDataset<DadosChurn>(carregarChurn);
  const [aberta, setAberta] = useState<Reuniao | null>(null);
  const fechar = useCallback(() => setAberta(null), []);

  if (loading) return <LoadingState label={t("churnPanel.loading")} />;
  if (error || !data) return <ErrorState error={error ?? ""} sugestao={sugestao} />;

  const n = (valor: number) => valor.toLocaleString(locale);
  const { analisadas } = data;
  const emRisco = analisadas.filter((a) => a.analise.trechos_com_alerta > 0);
  const clientes = new Set(analisadas.map((a) => a.reuniao.codt));
  const clientesEmRisco = new Set(emRisco.map((a) => a.reuniao.codt));
  const trechos = analisadas.reduce((s, a) => s + a.analise.total_trechos, 0);
  const alertas = analisadas.reduce((s, a) => s + a.analise.trechos_com_alerta, 0);
  const taxa = analisadas.length === 0 ? 0 : (emRisco.length / analisadas.length) * 100;

  const ranking = [...emRisco]
    .sort(
      (a, b) =>
        b.analise.trechos_com_alerta - a.analise.trechos_com_alerta ||
        (b.analise.score_max ?? 0) - (a.analise.score_max ?? 0),
    )
    .slice(0, MAX_REUNIOES);

  // Em quantas reuniões em alerta cada termo aparece entre os que mais pesaram para o risco.
  const contagemTermos = new Map<string, number>();
  for (const { analise } of emRisco) {
    for (const termo of analise.termos_risco) {
      contagemTermos.set(termo, (contagemTermos.get(termo) ?? 0) + 1);
    }
  }
  const termos = [...contagemTermos].sort((a, b) => b[1] - a[1]).slice(0, MAX_TERMOS);

  const kpis = [
    { label: t("churnPanel.kMeetings"), value: n(emRisco.length), detalhe: t("churnPanel.dMeetings", { n: n(analisadas.length) }) },
    { label: t("churnPanel.kClients"), value: n(clientesEmRisco.size), detalhe: t("churnPanel.dClients", { n: n(clientes.size) }) },
    { label: t("churnPanel.kSegments"), value: n(alertas), detalhe: t("churnPanel.dSegments", { n: n(trechos) }) },
    {
      label: t("churnPanel.kRate"),
      value: `${taxa.toLocaleString(locale, { maximumFractionDigits: 1 })}%`,
      detalhe: t("churnPanel.dRate"),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-heading text-base font-semibold text-brand-text">
              {t("dashboard.tabs.churn")}
            </h2>
            <p className="font-body mt-1 text-xs text-gray-500">
              {t("churnPanel.description", { n: n(analisadas.length), total: n(data.totalBase) })}
            </p>
          </div>
          <span className="font-body flex-shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-micro text-green-700">
            {t("churnPanel.realBadge")}
          </span>
        </div>
        {data.qualidade && (
          <p className="font-body mt-3 rounded-lg bg-amber-50 px-3 py-2 text-micro text-amber-700">
            {t("churnPanel.quality", {
              p: Math.round(data.qualidade.precision * 10),
              r: Math.round(data.qualidade.recall * 10),
              n: data.qualidade.n_treino,
            })}
          </p>
        )}
        <p className="font-body mt-3 text-micro text-gray-400">{t("analysis.disclaimer")}</p>
      </Card>

      {data.semServico ? (
        <Card className="p-5">
          <p className="font-body text-xs text-gray-500">{t("analysis.errors.offlineNote")}</p>
        </Card>
      ) : analisadas.length === 0 ? (
        <Card className="p-5">
          <p className="font-body text-xs text-gray-500">{t("churnPanel.empty")}</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => (
              <Card key={kpi.label} className="flex flex-col gap-2 p-5">
                <p className="font-heading text-xs text-gray-500">{kpi.label}</p>
                <p className="font-heading text-2xl font-bold text-brand-text">{kpi.value}</p>
                <p className="font-body text-micro text-gray-400">{kpi.detalhe}</p>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="p-5 xl:col-span-2">
              <CardHeader title={t("churnPanel.listTitle")} />
              {ranking.length === 0 ? (
                <p className="font-body text-xs text-gray-500">{t("churnPanel.noRisk")}</p>
              ) : (
                <div className="flex flex-col divide-y divide-gray-100">
                  {ranking.map(({ reuniao, analise }) => (
                    <button
                      key={reuniao.id}
                      type="button"
                      onClick={() => setAberta(reuniao)}
                      className="flex items-start justify-between gap-3 rounded-md py-3 text-left transition-colors hover:bg-gray-50"
                    >
                      <div className="min-w-0">
                        <p className="font-heading truncate text-xs font-medium text-brand-text">
                          {reuniao.unidade ?? t("common.unitUnknown")}
                        </p>
                        <p className="font-body mt-0.5 text-micro text-gray-400">
                          {t("churnPanel.itemMeta", {
                            id: reuniao.id,
                            codt: reuniao.codt,
                            data: formatarData(reuniao.data),
                          })}
                        </p>
                      </div>
                      <span className="font-body flex-shrink-0 rounded-full bg-orange-50 px-2 py-0.5 text-micro text-orange-700">
                        {t("churnPanel.itemTag", {
                          alerts: analise.trechos_com_alerta,
                          total: analise.total_trechos,
                        })}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5">
              <CardHeader title={t("churnPanel.termsTitle")} />
              <p className="font-body mb-3 text-micro text-gray-400">{t("churnPanel.termsHint")}</p>
              <div className="flex flex-wrap gap-2">
                {termos.map(([termo, qtd]) => (
                  <span
                    key={termo}
                    className="font-body rounded-full bg-gray-50 px-2.5 py-1 text-micro text-gray-600"
                  >
                    {termo} · {n(qtd)}
                  </span>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      {aberta && <TranscricaoDrawer reuniao={aberta} onClose={fechar} />}
    </div>
  );
}
