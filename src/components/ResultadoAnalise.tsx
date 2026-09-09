import type { Analise } from "@/data/analises";

export default function ResultadoAnalise({ analise }: { analise: Analise }) {
  function baixar() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(analise, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `analise-${analise.id}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section className="my-4 rounded-xl border border-gray-200 p-4 text-brand-text" aria-label="Resultado da análise">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="font-heading font-semibold">Resultado da análise</h3>
      <button onClick={baixar} className="rounded-lg border border-gray-200 px-3 py-2 text-xs">Baixar resultado</button>
    </div>
    <p className="mt-2 text-sm">{analise.total_trechos} trechos · {analise.trechos_com_alerta} com sinais de risco · {analise.trechos_sem_contexto} com contexto insuficiente</p>
    <p className="mt-2 text-xs text-gray-500">Análise exploratória. Os sinais encontrados precisam de revisão e não representam uma probabilidade de cancelamento.</p>
    <div className="mt-4 space-y-3">
      {analise.trechos.map(t => <details key={t.trecho} className="rounded-lg border border-gray-200 p-3">
        <summary className="cursor-pointer text-sm font-medium">
          Trecho {t.trecho} — <span className={t.rotulo_modelo === "risco" ? "text-orange-700" : "text-brand-blue"}>
            {t.rotulo_modelo === "risco" ? "Sinais de risco" : t.rotulo_modelo === "neutro" ? "Sem alerta automático" : "Contexto insuficiente"}
          </span>
        </summary>
        <p className="mt-3 whitespace-pre-wrap text-sm">{t.texto}</p>
        {!t.rotulo_modelo && <p className="mt-2 text-xs text-gray-500">{t.motivo}</p>}
        <p className="mt-3 text-sm"><strong>Próximo passo:</strong> {t.recomendacao}</p>
      </details>)}
    </div>
  </section>;
}
