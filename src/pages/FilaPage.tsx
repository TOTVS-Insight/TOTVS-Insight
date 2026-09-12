import { listarAnalises } from "@/data/analises";
import { getReunioes } from "@/data/repository";
import useDataset from "@/data/useDataset";
import type { Reuniao } from "@/data/types";
import { useLocale } from "@/i18n/useLocale";
import { formatarData, formatarDuracao } from "@/format";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/DataState";

/** Quantas reuniões aguardando análise aparecem na lista. */
const MAX_LISTADAS = 20;

interface EstadoFila {
  reunioes: Reuniao[];
  /** IDs com ao menos uma análise salva; `null` se o serviço de análise não respondeu. */
  analisadas: Set<string> | null;
}

/*
 * "Processada" aqui é ter análise no histórico do backend. O `status` da origem
 * (COMPLETED) só diz que a reunião aconteceu — contá-lo dava 100% sem nenhuma
 * análise feita.
 */
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
  const { data, loading, error, sugestao } = useDataset<EstadoFila>(carregarFila);

  const reunioes = data?.reunioes ?? [];
  const analisadas = data?.analisadas ?? null;
  const pendentes = analisadas ? reunioes.filter((r) => !analisadas.has(r.id)) : [];
  const concluidas = analisadas ? reunioes.length - pendentes.length : null;
  const cobertura =
    concluidas === null || reunioes.length === 0 ? null : (concluidas / reunioes.length) * 100;

  return (
    <div>
      <PageHeader title={t("queue.title")} subtitle={t("queue.subtitle")} />

      {loading && <LoadingState label={t("queue.loading")} />}
      {error && <ErrorState error={error} sugestao={sugestao} />}

      {data && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-blue-50 p-5">
              <p className="font-heading text-2xl font-bold text-blue-600">
                {analisadas ? pendentes.length.toLocaleString(locale) : "—"}
              </p>
              <p className="font-body mt-1 text-xs text-gray-500">{t("queue.pending")}</p>
            </div>
            <div className="rounded-xl bg-green-50 p-5">
              <p className="font-heading text-2xl font-bold text-green-600">
                {concluidas !== null ? concluidas.toLocaleString(locale) : "—"}
              </p>
              <p className="font-body mt-1 text-xs text-gray-500">{t("queue.analyzed")}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-5">
              <p className="font-heading text-2xl font-bold text-brand-text">
                {cobertura !== null
                  ? `${cobertura.toLocaleString(locale, { maximumFractionDigits: 1 })}%`
                  : "—"}
              </p>
              <p className="font-body mt-1 text-xs text-gray-500">{t("queue.coverage")}</p>
            </div>
          </div>

          {!analisadas ? (
            <p
              role="alert"
              className="font-body rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-700"
            >
              {t("queue.serviceDown")}
            </p>
          ) : pendentes.length === 0 ? (
            <EmptyState
              titulo={t("queue.emptyTitle")}
              descricao={t("queue.emptyBody", { n: reunioes.length.toLocaleString(locale) })}
            />
          ) : (
            <>
              <p className="font-body mb-3 text-xs text-gray-500">
                {t("queue.more", {
                  shown: Math.min(MAX_LISTADAS, pendentes.length),
                  total: pendentes.length.toLocaleString(locale),
                })}
              </p>
              <div className="flex flex-col gap-3">
                {pendentes.slice(0, MAX_LISTADAS).map((item) => (
                  <Card key={item.id} className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="font-heading text-micro font-medium text-brand-blue">
                            {item.id}
                          </span>
                          <StatusBadge status="Pendente" />
                        </div>
                        <p className="font-heading text-sm font-semibold text-brand-text">
                          {item.unidade ?? t("common.unitUnknown")}
                        </p>
                        <p className="font-body mt-1 text-xs text-gray-500">
                          {t("queue.itemMeta", {
                            codt: item.codt,
                            data: formatarData(item.dataCriacao),
                          })}
                        </p>
                      </div>
                      <span className="font-body text-xs whitespace-nowrap text-gray-400">
                        {t("queue.audio", { dur: formatarDuracao(item.duracaoSegundos) })}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
