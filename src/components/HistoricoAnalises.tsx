import { useEffect, useState } from "react";
import {
  listarAnalises,
  obterAnalise,
  ServicoAnaliseIndisponivelError,
  type Analise,
  type ResumoAnalise,
} from "@/data/analises";
import { useLocale } from "@/i18n/useLocale";
import { translate } from "@/i18n/translate";
import ResultadoAnalise from "./ResultadoAnalise";

export default function HistoricoAnalises({ compacto = false }: { compacto?: boolean }) {
  const { t, locale } = useLocale();
  const [rows, setRows] = useState<ResumoAnalise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Analise | null>(null);
  const [opening, setOpening] = useState(false);
  /** Publicação sem o servidor de análise: avisa, não é erro da tela. */
  const [semServico, setSemServico] = useState(false);
  useEffect(() => {
    let active = true;
    async function load() {
      try { const data = await listarAnalises(); if (active) { setRows(data); setError(""); } }
      catch (e) {
        if (!active) return;
        if (e instanceof ServicoAnaliseIndisponivelError) setSemServico(true);
        else setError(e instanceof Error ? e.message : translate("history.loadFail"));
      }
      finally { if (active) setLoading(false); }
    }
    void load(); window.addEventListener("analises-atualizadas", load);
    return () => { active = false; window.removeEventListener("analises-atualizadas", load); };
  }, []);
  async function abrir(id: string) {
    setOpening(true); setError(""); setSelected(null);
    try { setSelected(await obterAnalise(id)); }
    catch (e) { setError(e instanceof Error ? e.message : t("history.openFail")); }
    finally { setOpening(false); }
  }
  const latest = [...new Map([...rows].reverse().map(r => [r.id_reuniao, r])).values()];
  return <section className="mb-5 rounded-xl border border-gray-200 bg-brand-card p-5">
    <h2 className="font-heading font-semibold text-brand-text">{compacto ? t("history.analysesCompactTitle") : t("history.analysesTitle")}</h2>
    {loading && <p role="status" className="mt-3 text-sm">{t("history.loading")}</p>}
    {semServico && <p className="mt-3 text-sm text-gray-500">{t("analysis.errors.offlineNote")}</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    {!loading && !error && !semServico && <>
      <p className="mt-2 text-sm text-brand-text">{t("history.summary", { meetings: latest.length, risk: latest.filter(r => r.trechos_com_alerta > 0).length })}</p>
      <p className="mt-1 text-xs text-gray-500">{t("history.note")}</p>
      {rows.length === 0 && <p className="mt-4 text-sm text-gray-500">{t("history.empty")}</p>}
    </>}
    {!compacto && !semServico && <div className="mt-4 space-y-2">
      {rows.map(r => <button key={r.id} disabled={opening} onClick={() => abrir(r.id)} className="block w-full rounded-lg border border-gray-200 p-3 text-left text-sm text-brand-text hover:bg-gray-50 disabled:opacity-50">
        <strong>{r.id_reuniao}</strong> · {new Date(r.criado_em).toLocaleString(locale)}<br />
        {t("history.row", { alerts: r.trechos_com_alerta, total: r.total_trechos })}
      </button>)}
      {opening && <p role="status">{t("history.opening")}</p>}
      {selected && <><button onClick={() => setSelected(null)} className="mt-3 text-sm text-brand-blue">{t("history.closeResult")}</button><ResultadoAnalise analise={selected} /></>}
    </div>}
  </section>;
}
