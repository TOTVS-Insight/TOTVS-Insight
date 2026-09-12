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

/** Mesma quantidade por página das tabelas de clientes e transcrições. */
const POR_PAGINA = 25;

export default function HistoricoAnalises({ compacto = false }: { compacto?: boolean }) {
  const { t, locale } = useLocale();
  const [rows, setRows] = useState<ResumoAnalise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Analise | null>(null);
  const [opening, setOpening] = useState(false);
  /** Publicação sem o servidor de análise: avisa, não é erro da tela. */
  const [semServico, setSemServico] = useState(false);
  const [pagina, setPagina] = useState(0);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await listarAnalises();
        if (active) {
          setRows(data);
          setError("");
          setPagina(0);
        }
      }
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
  const totalPaginas = Math.max(Math.ceil(rows.length / POR_PAGINA), 1);
  const paginaAtual = Math.min(pagina, totalPaginas - 1);
  const visiveis = rows.slice(paginaAtual * POR_PAGINA, (paginaAtual + 1) * POR_PAGINA);
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
      {visiveis.map(r => <button key={r.id} disabled={opening} onClick={() => abrir(r.id)} className="block w-full rounded-lg border border-gray-200 p-3 text-left text-sm text-brand-text hover:bg-gray-50 disabled:opacity-50">
        <strong>{r.id_reuniao}</strong> · {new Date(r.criado_em).toLocaleString(locale)}<br />
        {t("history.row", { alerts: r.trechos_com_alerta, total: r.total_trechos })}
      </button>)}
      {rows.length > POR_PAGINA && <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <p className="text-xs text-gray-500">{t("history.pagination", {
          total: rows.length.toLocaleString(locale),
          from: paginaAtual * POR_PAGINA + 1,
          to: Math.min((paginaAtual + 1) * POR_PAGINA, rows.length),
        })}</p>
        <div className="flex items-center gap-2">
          <button onClick={() => setPagina(p => Math.max(p - 1, 0))} disabled={paginaAtual === 0} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-brand-text hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300">{t("common.prev")}</button>
          <span className="text-xs text-gray-500">{paginaAtual + 1} / {totalPaginas}</span>
          <button onClick={() => setPagina(p => Math.min(p + 1, totalPaginas - 1))} disabled={paginaAtual >= totalPaginas - 1} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-brand-text hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300">{t("common.next")}</button>
        </div>
      </div>}
      {opening && <p role="status">{t("history.opening")}</p>}
      {selected && <><button onClick={() => setSelected(null)} className="mt-3 text-sm text-brand-blue">{t("history.closeResult")}</button><ResultadoAnalise analise={selected} /></>}
    </div>}
  </section>;
}
