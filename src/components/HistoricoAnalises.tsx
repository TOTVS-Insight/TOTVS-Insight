import { useEffect, useState } from "react";
import { listarAnalises, obterAnalise, type Analise, type ResumoAnalise } from "@/data/analises";
import ResultadoAnalise from "./ResultadoAnalise";

export default function HistoricoAnalises({ compacto = false }: { compacto?: boolean }) {
  const [rows, setRows] = useState<ResumoAnalise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Analise | null>(null);
  const [opening, setOpening] = useState(false);
  useEffect(() => {
    let active = true;
    async function load() {
      try { const data = await listarAnalises(); if (active) { setRows(data); setError(""); } }
      catch (e) { if (active) setError(e instanceof Error ? e.message : "Falha ao carregar histórico."); }
      finally { if (active) setLoading(false); }
    }
    void load(); window.addEventListener("analises-atualizadas", load);
    return () => { active = false; window.removeEventListener("analises-atualizadas", load); };
  }, []);
  async function abrir(id: string) {
    setOpening(true); setError(""); setSelected(null);
    try { setSelected(await obterAnalise(id)); }
    catch (e) { setError(e instanceof Error ? e.message : "Falha ao abrir resultado."); }
    finally { setOpening(false); }
  }
  const latest = [...new Map([...rows].reverse().map(r => [r.id_reuniao, r])).values()];
  return <section className="mb-5 rounded-xl border border-gray-200 bg-brand-card p-5">
    <h2 className="font-heading font-semibold text-brand-text">{compacto ? "Análises de transcrições" : "Histórico de análises"}</h2>
    {loading && <p role="status" className="mt-3 text-sm">Carregando análises…</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    {!loading && !error && <>
      <p className="mt-2 text-sm text-brand-text">{latest.length} reuniões analisadas · {latest.filter(r => r.trechos_com_alerta > 0).length} com sinais de risco</p>
      <p className="mt-1 text-xs text-gray-500">Considera a análise mais recente de cada reunião. Sinais de risco exigem revisão.</p>
      {rows.length === 0 && <p className="mt-4 text-sm text-gray-500">Abra uma transcrição e clique em “Analisar reunião” para começar.</p>}
    </>}
    {!compacto && <div className="mt-4 space-y-2">
      {rows.map(r => <button key={r.id} disabled={opening} onClick={() => abrir(r.id)} className="block w-full rounded-lg border border-gray-200 p-3 text-left text-sm text-brand-text hover:bg-gray-50 disabled:opacity-50">
        <strong>{r.id_reuniao}</strong> · {new Date(r.criado_em).toLocaleString()}<br />
        {r.trechos_com_alerta} trechos com sinais de risco / {r.total_trechos} trechos
      </button>)}
      {opening && <p role="status">Abrindo análise…</p>}
      {selected && <><button onClick={() => setSelected(null)} className="mt-3 text-sm text-brand-blue">Fechar resultado</button><ResultadoAnalise analise={selected} /></>}
    </div>}
  </section>;
}
