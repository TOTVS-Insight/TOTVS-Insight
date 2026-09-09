import { useState } from "react";
import { analisarReuniao, type Analise } from "@/data/analises";
import ResultadoAnalise from "./ResultadoAnalise";

export default function NovaAnalise() {
  const [texto, setTexto] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Analise | null>(null);
  async function executar() {
    if (!texto.trim() || busy) return;
    setBusy(true); setError(""); setResult(null);
    try { setResult(await analisarReuniao(`TEXTO-${crypto.randomUUID()}`, texto)); }
    catch (e) { setError(e instanceof Error ? e.message : "Falha ao analisar."); }
    finally { setBusy(false); }
  }
  return <details className="mb-5 rounded-xl border border-gray-200 bg-brand-card p-4">
    <summary className="cursor-pointer font-heading text-sm font-semibold text-brand-text">Analisar um texto novo</summary>
    <label htmlFor="nova-transcricao" className="mt-4 block text-sm text-brand-text">Cole a transcrição</label>
    <textarea id="nova-transcricao" value={texto} onChange={e => setTexto(e.target.value)} disabled={busy} maxLength={100000} rows={6} className="mt-2 w-full rounded-lg border border-gray-300 bg-brand-card p-3 text-sm text-brand-text" />
    <p className="my-2 text-xs text-gray-500">Até 100 mil caracteres. O resultado e os trechos serão salvos no histórico deste computador.</p>
    <button disabled={busy || !texto.trim()} onClick={executar} className="rounded-lg bg-brand-blue px-4 py-2 text-sm text-white disabled:opacity-50">{busy ? "Analisando…" : "Analisar texto"}</button>
    {busy && <p role="status" className="mt-3 text-sm">Processando a transcrição…</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    {result && <ResultadoAnalise analise={result} />}
  </details>;
}
