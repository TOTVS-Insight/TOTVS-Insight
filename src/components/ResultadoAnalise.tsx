import type { Analise, TrechoAnalise } from "@/data/analises";
import { useLocale } from "@/i18n/useLocale";

/** Motivos fixos gerados por `backend/insight.py` → chave do dicionário. */
const MOTIVOS: Record<string, string> = {
  "Trecho curto: menos de 20 palavras úteis": "analysis.reason.short",
  "Repetição excessiva: conferir qualidade da transcrição": "analysis.reason.repetition",
  "Vocabulário não reconhecido pelo modelo": "analysis.reason.vocabulary",
};

/** O backend devolve uma recomendação fixa por rótulo, então o rótulo basta. */
function chaveRotulo(trecho: TrechoAnalise) {
  if (trecho.rotulo_modelo === "risco") return "risk";
  if (trecho.rotulo_modelo === "neutro") return "neutral";
  return "noContext";
}

export default function ResultadoAnalise({ analise }: { analise: Analise }) {
  const { t } = useLocale();
  function baixar() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(analise, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `analise-${analise.id}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="my-4 rounded-xl border border-gray-200 p-4 text-brand-text" aria-label={t("analysis.resultTitle")}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="font-heading font-semibold">{t("analysis.resultTitle")}</h3>
      <button onClick={baixar} className="rounded-lg border border-gray-200 px-3 py-2 text-xs">{t("analysis.download")}</button>
    </div>
    <p className="mt-2 text-sm">{t("analysis.summary", { total: analise.total_trechos, alerts: analise.trechos_com_alerta, noContext: analise.trechos_sem_contexto })}</p>
    <p className="mt-2 text-xs text-gray-500">{t("analysis.disclaimer")}</p>
    <div className="mt-4 space-y-3">
      {analise.trechos.map(trecho => {
        const rotulo = chaveRotulo(trecho);
        return <details key={trecho.trecho} className="rounded-lg border border-gray-200 p-3">
          <summary className="cursor-pointer text-sm font-medium">
            {t("analysis.segment", { n: trecho.trecho })} — <span className={rotulo === "risk" ? "text-orange-700" : "text-brand-blue"}>
              {t(`analysis.label.${rotulo}`)}
            </span>
          </summary>
          <p className="mt-3 whitespace-pre-wrap text-sm">{trecho.texto}</p>
          {!trecho.rotulo_modelo && <p className="mt-2 text-xs text-gray-500">{MOTIVOS[trecho.motivo] ? t(MOTIVOS[trecho.motivo]) : trecho.motivo}</p>}
          <p className="mt-3 text-sm"><strong>{t("analysis.nextStep")}</strong> {t(`analysis.rec.${rotulo}`)}</p>
        </details>;
      })}
    </div>
  </section>;
}
