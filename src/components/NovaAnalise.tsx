import { useEffect, useState } from "react";
import {
  analisarReuniao,
  podeCriarAnalise,
  ServicoAnaliseIndisponivelError,
  type Analise,
} from "@/data/analises";
import { useLocale } from "@/i18n/useLocale";
import ResultadoAnalise from "./ResultadoAnalise";

export default function NovaAnalise() {
  const { t } = useLocale();
  const [texto, setTexto] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [semServico, setSemServico] = useState(false);
  /** `null` enquanto a sonda não respondeu; o card só aparece quando dá para analisar. */
  const [disponivel, setDisponivel] = useState<boolean | null>(null);
  useEffect(() => {
    let ativo = true;
    void podeCriarAnalise().then((ok) => {
      if (ativo) setDisponivel(ok);
    });
    return () => {
      ativo = false;
    };
  }, []);
  const [result, setResult] = useState<Analise | null>(null);
  async function executar() {
    if (!texto.trim() || busy) return;
    setBusy(true); setError(""); setResult(null);
    try { setResult(await analisarReuniao(`TEXTO-${crypto.randomUUID()}`, texto)); }
    catch (e) {
      if (e instanceof ServicoAnaliseIndisponivelError) setSemServico(true);
      else setError(e instanceof Error ? e.message : t("analysis.failed"));
    }
    finally { setBusy(false); }
  }
  if (!disponivel) return null;
  return <details className="mb-5 rounded-xl border border-gray-200 bg-brand-card p-4">
    <summary className="cursor-pointer font-heading text-sm font-semibold text-brand-text">{t("analysis.newTitle")}</summary>
    <label htmlFor="nova-transcricao" className="mt-4 block text-sm text-brand-text">{t("analysis.pasteLabel")}</label>
    <textarea id="nova-transcricao" value={texto} onChange={e => setTexto(e.target.value)} disabled={busy} maxLength={500000} rows={6} className="mt-2 w-full rounded-lg border border-gray-300 bg-brand-card p-3 text-sm text-brand-text" />
    <p className="my-2 text-xs text-gray-500">{t("analysis.limitNote")}</p>
    <button disabled={busy || !texto.trim()} onClick={executar} className="rounded-lg bg-brand-blue px-4 py-2 text-sm text-white disabled:opacity-50">{busy ? t("analysis.submitting") : t("analysis.submit")}</button>
    {busy && <p role="status" className="mt-3 text-sm">{t("analysis.processing")}</p>}
    {semServico && <p className="mt-3 text-sm text-gray-500">{t("analysis.errors.offlineNote")}</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    {result && <ResultadoAnalise analise={result} />}
  </details>;
}
