import { useState } from "react";
import { analisarReuniao, type Analise } from "@/data/analises";
import ResultadoAnalise from "./ResultadoAnalise";

export default function AnalisarTranscricao({ id, texto }: { id: string; texto: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Analise | null>(null);
  async function analisar() {
    setBusy(true); setError("");
    try { setResult(await analisarReuniao(id, texto)); }
    catch (e) { setError(e instanceof Error ? e.message : "Falha ao analisar."); }
    finally { setBusy(false); }
  }
  return <div className="mb-5">
    <button onClick={analisar} disabled={busy} className="rounded-lg bg-brand-blue px-4 py-2 text-sm text-white disabled:opacity-50">
      {busy ? "Analisando reunião…" : result ? "Analisar novamente" : "Analisar reunião"}
    </button>
    <p className="mt-2 text-xs text-gray-500" role="status">{busy ? "Aguarde. O texto está sendo processado." : "A análise será salva no histórico deste computador."}</p>
    {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    {result && <ResultadoAnalise analise={result} />}
  </div>;
}
