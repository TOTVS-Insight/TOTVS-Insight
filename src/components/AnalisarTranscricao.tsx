import { useEffect, useState } from "react";
import {
  analisarReuniao,
  podeCriarAnalise,
  ServicoAnaliseIndisponivelError,
  type Analise,
} from "@/data/analises";
import { useLocale } from "@/i18n/useLocale";
import ResultadoAnalise from "./ResultadoAnalise";

export default function AnalisarTranscricao({ id, texto }: { id: string; texto: string }) {
  const { t } = useLocale();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [semServico, setSemServico] = useState(false);
  /** `null` enquanto a sonda não respondeu; o botão só aparece quando dá para analisar. */
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
  async function analisar() {
    setBusy(true); setError("");
    try { setResult(await analisarReuniao(id, texto)); }
    catch (e) {
      if (e instanceof ServicoAnaliseIndisponivelError) setSemServico(true);
      else setError(e instanceof Error ? e.message : t("analysis.failed"));
    }
    finally { setBusy(false); }
  }
  if (!disponivel) return null;
  return <div className="mb-5">
    <button onClick={analisar} disabled={busy} className="rounded-lg bg-brand-blue px-4 py-2 text-sm text-white disabled:opacity-50">
      {busy ? t("drawer.analyzing") : result ? t("drawer.analyzeAgain") : t("drawer.analyze")}
    </button>
    <p className="mt-2 text-xs text-gray-500" role="status">{busy ? t("drawer.analyzingHint") : t("drawer.analyzeNote")}</p>
    {semServico && <p className="mt-3 text-sm text-gray-500">{t("analysis.errors.offlineNote")}</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    {result && <ResultadoAnalise analise={result} />}
  </div>;
}
