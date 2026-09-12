import NovaAnalise from "@/components/NovaAnalise";
import { useCallback, useMemo, useRef, useState } from "react";
import { getReunioes } from "@/data/repository";
import { adicionarUpload, getTextoUpload, parseArquivoUpload } from "@/data/sessionUploads";
import useDataset from "@/data/useDataset";
import type { Reuniao } from "@/data/types";
import { useLocale } from "@/i18n/useLocale";
import { capitalizar, formatarData, formatarDuracao, formatarFaixa, ouTraco } from "@/format";
import { SearchIcon, UploadIcon } from "@/icons";
import Card from "@/components/ui/Card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/DataState";
import TranscricaoDrawer from "@/components/TranscricaoDrawer";

const POR_PAGINA = 25;

const COL_KEYS = [
  "id",
  "client",
  "date",
  "duration",
  "speakers",
  "unit",
  "segment",
  "uf",
  "size",
  "nps",
] as const;

/** Sentinelas estáveis dos filtros "todos" — só o rótulo é traduzido. */
const ALL_SEGMENTO = "__all__";
const ALL_UF = "__all__";

/** Opções de filtro montadas a partir dos valores que existem na base. */
function opcoesDe(reunioes: Reuniao[], campo: keyof Reuniao): string[] {
  const set = new Set<string>();
  for (const r of reunioes) {
    const v = r[campo];
    if (v !== null && v !== undefined && v !== "") set.add(String(v));
  }
  return [...set].sort();
}

function npsClass(nps: number) {
  if (nps >= 9) return "text-emerald-600";
  if (nps >= 7) return "text-amber-600";
  return "text-red-500";
}

function npsBadgeClass(nps: number) {
  if (nps >= 9) return "border-emerald-100 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400";
  if (nps >= 7) return "border-amber-100 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-400";
  return "border-red-100 bg-red-50 dark:bg-red-950/30 text-red-500 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400";
}

function initials(value: string) {
  const clean = value.trim();
  if (!clean) return "—";
  return clean
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function MetricCard({
  title,
  value,
  caption,
  tone,
  icon,
}: {
  title: string;
  value: string;
  caption: string;
  tone: "blue" | "cyan" | "violet" | "green" | "amber" | "red";
  icon: string;
}) {
  const tones = {
    blue: "border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-400",
    cyan: "border-cyan-100 bg-cyan-50 text-cyan-600 dark:border-cyan-900/40 dark:bg-cyan-950/30 dark:text-cyan-400",
    violet: "border-violet-100 bg-violet-50 text-violet-600 dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-violet-400",
    green: "border-emerald-100 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400",
    amber: "border-amber-100 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-400",
    red: "border-red-100 bg-red-50 dark:bg-red-950/30 text-red-500 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400",
  } as const;

  return (
    <div className="rounded-[14px] border border-[#dfe7f3] dark:border-[#223652] bg-white dark:bg-[#0f1d31] px-4 py-4 shadow-[0_5px_16px_rgba(17,48,104,0.035)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-base font-semibold ${tones[tone]}`}
          aria-hidden="true"
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold text-[#183b86] dark:text-[#c7d8f3]">{title}</p>
          <p className="mt-0.5 text-[22px] font-bold leading-none tracking-[-0.03em] text-[#071d66] dark:text-[#f3f7ff]">
            {value}
          </p>
        </div>
      </div>

      <p className="mt-3 text-[9px] font-medium text-[#6f7ea7] dark:text-[#91a3be]">{caption}</p>
    </div>
  );
}

export default function TranscricoesPage() {
  const { t, locale } = useLocale();
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [segmento, setSegmento] = useState(ALL_SEGMENTO);
  const [uf, setUf] = useState(ALL_UF);
  const [pagina, setPagina] = useState(0);
  const [aberta, setAberta] = useState<Reuniao | null>(null);
  /** Texto do upload aberto no drawer (Pages não tem arquivos de transcrição). */
  const [textoLocalAberto, setTextoLocalAberto] = useState<string | undefined>(undefined);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [uploadErro, setUploadErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const { data, loading, error, sugestao } = useDataset<Reuniao[]>(
    useCallback(() => getReunioes(), []),
  );

  const reunioes = data ?? [];

  const segmentos = useMemo(() => opcoesDe(reunioes, "segmento"), [reunioes]);
  const ufs = useMemo(() => opcoesDe(reunioes, "uf"), [reunioes]);

  const filtradas = useMemo(() => {
    const termo = search.trim().toLowerCase();
    return reunioes.filter(
      (r) =>
        (segmento === ALL_SEGMENTO || r.segmento === segmento) &&
        (uf === ALL_UF || r.uf === uf) &&
        (termo === "" ||
          r.codt.toLowerCase().includes(termo) ||
          r.id.includes(termo) ||
          (r.unidade ?? "").toLowerCase().includes(termo)),
    );
  }, [reunioes, search, segmento, uf]);

  const totalPaginas = Math.ceil(filtradas.length / POR_PAGINA);
  const paginaAtual = Math.min(pagina, Math.max(totalPaginas - 1, 0));
  const visiveis = filtradas.slice(paginaAtual * POR_PAGINA, (paginaAtual + 1) * POR_PAGINA);

  /**
   * Somente dados derivados da própria base já carregada.
   * Nenhuma chamada nova, nenhuma alteração em repository/useDataset/backend.
   */
  const resumoVisual = useMemo(() => {
    const comNps = reunioes.filter((r) => r.nps !== null);
    const promotores = comNps.filter((r) => (r.nps ?? 0) >= 9).length;
    const neutros = comNps.filter((r) => (r.nps ?? 0) >= 7 && (r.nps ?? 0) < 9).length;
    const detratores = comNps.filter((r) => (r.nps ?? 10) < 7).length;
    const unidades = new Set(
      reunioes
        .map((r) => r.unidade)
        .filter((valor): valor is string => Boolean(valor && valor.trim())),
    ).size;

    return {
      total: reunioes.length,
      comNps: comNps.length,
      promotores,
      neutros,
      detratores,
      unidades,
    };
  }, [reunioes]);

  const distribuicaoSegmentos = useMemo(() => {
    const mapa = new Map<string, number>();

    for (const reuniao of reunioes) {
      const chave = reuniao.segmento ? capitalizar(reuniao.segmento) : "Não informado";
      mapa.set(chave, (mapa.get(chave) ?? 0) + 1);
    }

    return [...mapa.entries()]
      .map(([label, quantidade]) => ({
        label,
        quantidade,
        percentual: reunioes.length ? Math.round((quantidade / reunioes.length) * 100) : 0,
      }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);
  }, [reunioes]);

  function aoFiltrar<T>(setter: (v: T) => void) {
    return (valor: T) => {
      setter(valor);
      setPagina(0);
    };
  }

  async function aoEscolherArquivo(file: File | null) {
    if (!file) return;
    setUploadErro(null);
    setUploadMsg(null);
    setEnviando(true);
    try {
      const texto = await file.text();
      const upload = parseArquivoUpload(file.name, texto);
      adicionarUpload(upload);
      setUploadMsg(t("transcripts.uploadOk", { id: upload.reuniao.id }));
      setPagina(0);
      setTextoLocalAberto(upload.texto);
      setAberta(upload.reuniao);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("transcripts.uploadFail");
      setUploadErro(msg);
    } finally {
      setEnviando(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="-m-2 rounded-[18px] bg-[#f5f8fd] p-2 transition-colors duration-200 dark:bg-[#07111f] sm:-m-3 sm:p-3 lg:-m-4 lg:p-4">
      {/* Cabeçalho no mesmo ritmo visual do protótipo. */}
      <div className="rounded-[16px] border border-[#dce5f2] dark:border-[#20334d] bg-white dark:bg-[#0f1d31] px-5 py-5 shadow-[0_10px_30px_rgba(29,72,145,0.045)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.22)] sm:px-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[10px] font-semibold text-[#1b4fc6]">
              Bem-vindo ao TOTVS Insight
            </p>

            <h1 className="mt-1 text-[30px] font-bold leading-none tracking-[-0.035em] text-[#071d66] dark:text-[#f3f7ff]">
              {t("transcripts.title")}
            </h1>

            <p className="mt-2 text-[11px] text-[#6576a5] dark:text-[#9aaccc]">{t("transcripts.subtitle")}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.json,text/plain,application/json"
              className="hidden"
              onChange={(e) => void aoEscolherArquivo(e.target.files?.[0] ?? null)}
            />

            <button
              type="button"
              disabled={enviando}
              onClick={() => fileRef.current?.click()}
              title={t("transcripts.uploadHint")}
              className="flex h-10 items-center gap-2 rounded-lg border border-[#d6e0ef] dark:border-[#2a3e5d] bg-white dark:bg-[#0f1d31] px-4 text-[11px] font-semibold text-[#153b94] dark:text-[#c7d8f3] shadow-[0_1px_2px_rgba(30,64,120,0.03)] dark:shadow-none transition-colors hover:bg-[#f8faff] dark:hover:bg-[#162640] dark:bg-[#162640] disabled:opacity-60"
            >
              <UploadIcon size={14} />
              {enviando ? t("transcripts.uploading") : t("transcripts.upload")}
            </button>

            {/*
              Mantém o componente funcional já existente.
              Apenas recebe um contêiner para aproximar visualmente do protótipo.
            */}
            <div className="[&_*]:!shadow-none">
              <NovaAnalise />
            </div>

            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-lg bg-[#0d57e7] px-4 text-[11px] font-semibold text-white shadow-[0_5px_12px_rgba(13,87,231,0.16)] transition-colors hover:bg-[#0b4dd0]"
            >
              <span aria-hidden="true">▽</span>
              Aplicar filtros
            </button>
          </div>
        </div>

        {loading && <div className="mt-5"><LoadingState label={t("transcripts.loading")} /></div>}
        {error && <div className="mt-5"><ErrorState error={error} sugestao={sugestao} /></div>}

        {data && (
          <>
            {/* KPIs: todos calculados somente a partir da base já carregada. */}
            <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-6">
              <MetricCard
                title="Total de transcrições"
                value={resumoVisual.total.toLocaleString(locale)}
                caption="registros na base atual"
                tone="blue"
                icon="▤"
              />
              <MetricCard
                title="Com NPS"
                value={resumoVisual.comNps.toLocaleString(locale)}
                caption="reuniões com avaliação"
                tone="cyan"
                icon="◎"
              />
              <MetricCard
                title="Promotores"
                value={resumoVisual.promotores.toLocaleString(locale)}
                caption="NPS igual ou superior a 9"
                tone="green"
                icon="✓"
              />
              <MetricCard
                title="Neutros"
                value={resumoVisual.neutros.toLocaleString(locale)}
                caption="NPS entre 7 e 8"
                tone="violet"
                icon="○"
              />
              <MetricCard
                title="Detratores"
                value={resumoVisual.detratores.toLocaleString(locale)}
                caption="NPS abaixo de 7"
                tone="red"
                icon="!"
              />
              <MetricCard
                title="Unidades"
                value={resumoVisual.unidades.toLocaleString(locale)}
                caption="unidades identificadas"
                tone="amber"
                icon="⌂"
              />
            </div>

            {uploadMsg && (
              <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                {uploadMsg}
              </p>
            )}

            {uploadErro && (
              <p className="mt-4 rounded-lg border border-red-100 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-[10px] font-medium text-red-600 dark:text-red-400">
                {uploadErro}
              </p>
            )}

            {/* Área principal: tabela + painel lateral como no protótipo. */}
            <div className="mt-4 grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_260px]">
              <div className="min-w-0">
                <Card className="overflow-hidden rounded-[14px] !border-[#dce5f2] dark:!border-[#20334d] dark:border-[#20334d] !bg-white dark:!bg-[#0f1d31] dark:bg-[#0f1d31] !shadow-[0_4px_16px_rgba(23,58,118,0.035)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.18)] dark:!shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
                  {/* Barra superior da lista */}
                  <div className="border-b border-[#e7edf6] dark:border-[#223652] px-3 py-3">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          className="rounded-md bg-[#0d57e7] px-3 py-2 text-[9px] font-semibold text-white"
                        >
                          Todas
                          <span className="ml-1.5 rounded-full bg-white dark:bg-[#0f1d31]/16 px-1.5 py-0.5">
                            {reunioes.length}
                          </span>
                        </button>

                        <span className="rounded-md border border-[#dfe7f2] dark:border-[#223652] bg-white dark:bg-[#0f1d31] px-3 py-2 text-[9px] font-semibold text-[#53658f] dark:text-[#9fb0c9]">
                          Com NPS
                          <span className="ml-1.5 text-[#8290ae] dark:text-[#8396b3]">{resumoVisual.comNps}</span>
                        </span>

                        <span className="rounded-md border border-[#dfe7f2] dark:border-[#223652] bg-white dark:bg-[#0f1d31] px-3 py-2 text-[9px] font-semibold text-[#53658f] dark:text-[#9fb0c9]">
                          Promotores
                          <span className="ml-1.5 text-[#8290ae] dark:text-[#8396b3]">{resumoVisual.promotores}</span>
                        </span>

                        <span className="rounded-md border border-[#dfe7f2] dark:border-[#223652] bg-white dark:bg-[#0f1d31] px-3 py-2 text-[9px] font-semibold text-[#53658f] dark:text-[#9fb0c9]">
                          Detratores
                          <span className="ml-1.5 text-[#8290ae] dark:text-[#8396b3]">{resumoVisual.detratores}</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative min-w-[190px] flex-1 xl:w-[250px]">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7382a7] dark:text-[#91a3be]">
                            <SearchIcon size={12} />
                          </span>
                          <input
                            value={search}
                            onChange={(e) => aoFiltrar(setSearch)(e.target.value)}
                            placeholder={t("transcripts.searchPlaceholder")}
                            aria-label={t("transcripts.searchAria")}
                            className="h-9 w-full rounded-lg border border-[#dbe4f1] dark:border-[#2a3e5d] bg-white dark:bg-[#0f1d31] py-2 pl-9 pr-3 text-[10px] text-[#102d72] dark:text-[#dce8fa] outline-none transition-colors placeholder:text-[#93a0ba] dark:placeholder:text-[#6f819e] dark:text-[#7f93b2] focus:border-[#0d57e7]"
                          />
                        </div>

                        <select
                          value={segmento}
                          onChange={(e) => aoFiltrar(setSegmento)(e.target.value)}
                          aria-label={t("transcripts.filterSegment")}
                          className="h-9 rounded-lg border border-[#dbe4f1] dark:border-[#2a3e5d] bg-white dark:bg-[#0f1d31] px-3 text-[10px] text-[#244178] dark:text-[#b7c9e8] outline-none focus:border-[#0d57e7]"
                        >
                          <option value={ALL_SEGMENTO}>{t("common.allM")}</option>
                          {segmentos.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>

                        <select
                          value={uf}
                          onChange={(e) => aoFiltrar(setUf)(e.target.value)}
                          aria-label={t("transcripts.filterState")}
                          className="h-9 rounded-lg border border-[#dbe4f1] dark:border-[#2a3e5d] bg-white dark:bg-[#0f1d31] px-3 text-[10px] text-[#244178] dark:text-[#b7c9e8] outline-none focus:border-[#0d57e7]"
                        >
                          <option value={ALL_UF}>{t("common.allF")}</option>
                          {ufs.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {filtradas.length === 0 ? (
                    <div className="p-5">
                      <EmptyState
                        titulo={t("transcripts.emptyTitle")}
                        descricao={t("transcripts.emptyBody")}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[1050px] table-auto text-[10px]">
                          <thead>
                            <tr className="border-b border-[#e5ebf4] dark:border-[#223652] bg-[#fbfcff] dark:bg-[#111f34]">
                              {COL_KEYS.map((key) => (
                                <th
                                  key={key}
                                  className="px-3 py-3 text-left font-semibold whitespace-nowrap text-[#49608f] dark:text-[#9fb0c9]"
                                >
                                  {t(`transcripts.col.${key}`)}
                                </th>
                              ))}
                            </tr>
                          </thead>

                          <tbody>
                            {visiveis.map((r) => (
                              <tr
                                key={r.id}
                                onClick={() => {
                                  setTextoLocalAberto(getTextoUpload(r.id));
                                  setAberta(r);
                                }}
                                className="cursor-pointer border-b border-[#edf1f7] dark:border-[#20334d] bg-white dark:bg-[#0f1d31] transition-colors hover:bg-[#f7faff] dark:hover:bg-[#162640] dark:bg-[#162640]"
                              >
                                <td className="px-3 py-3">
                                  <div className="flex items-center gap-2">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#155be7] text-[8px] font-bold text-white">
                                      {initials(r.id)}
                                    </span>
                                    <span className="font-semibold whitespace-nowrap text-[#0b48cb]">
                                      {r.id}
                                    </span>
                                  </div>
                                </td>

                                <td className="px-3 py-3 font-medium whitespace-nowrap text-[#183b86] dark:text-[#c7d8f3]">
                                  {r.codt}
                                </td>

                                <td className="px-3 py-3 whitespace-nowrap text-[#52658f] dark:text-[#9fb0c9]">
                                  {formatarData(r.data)}
                                </td>

                                <td className="px-3 py-3 whitespace-nowrap text-[#52658f] dark:text-[#9fb0c9]">
                                  {formatarDuracao(r.duracaoSegundos)}
                                </td>

                                <td className="px-3 py-3 text-center text-[#52658f] dark:text-[#9fb0c9]">{r.locutores}</td>

                                <td className="max-w-44 truncate px-3 py-3 font-medium text-[#183b86] dark:text-[#c7d8f3]">
                                  {ouTraco(r.unidade)}
                                </td>

                                <td className="px-3 py-3 whitespace-nowrap">
                                  <span className="rounded-md bg-[#f1f5fb] dark:bg-[#1a2a43] px-2 py-1 text-[9px] font-medium text-[#50648f] dark:text-[#9fb0c9]">
                                    {capitalizar(r.segmento)}
                                  </span>
                                </td>

                                <td className="px-3 py-3 text-[#52658f] dark:text-[#9fb0c9]">{ouTraco(r.uf)}</td>

                                <td className="px-3 py-3 whitespace-nowrap text-[#52658f] dark:text-[#9fb0c9]">
                                  {formatarFaixa(r.faixaFaturamento)}
                                </td>

                                <td className="px-3 py-3">
                                  {r.nps !== null ? (
                                    <span
                                      className={`inline-flex rounded-md border px-2 py-1 text-[9px] font-semibold ${npsBadgeClass(r.nps)} ${npsClass(r.nps)}`}
                                    >
                                      {r.nps}
                                    </span>
                                  ) : (
                                    <span className="text-[#bcc5d6] dark:text-[#657791]">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex flex-col gap-3 border-t border-[#e7edf6] dark:border-[#223652] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-[9px] font-medium text-[#6b7ca5] dark:text-[#91a3be]">
                          {t("transcripts.pagination", {
                            total: filtradas.length.toLocaleString(locale),
                            from: paginaAtual * POR_PAGINA + 1,
                            to: Math.min((paginaAtual + 1) * POR_PAGINA, filtradas.length),
                          })}
                        </p>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPagina((p) => Math.max(p - 1, 0))}
                            disabled={paginaAtual === 0}
                            className="rounded-md border border-[#dbe4f1] dark:border-[#2a3e5d] bg-white dark:bg-[#0f1d31] px-3 py-1.5 text-[9px] font-semibold text-[#28457d] dark:text-[#b7c9e8] transition-colors hover:bg-[#f8faff] dark:hover:bg-[#162640] dark:bg-[#162640] disabled:cursor-not-allowed disabled:text-[#bcc6d9] dark:text-[#657791]"
                          >
                            {t("common.prev")}
                          </button>

                          <span className="rounded-md bg-[#0d57e7] px-3 py-1.5 text-[9px] font-semibold text-white">
                            {paginaAtual + 1}
                          </span>

                          <span className="text-[9px] font-medium text-[#8290ae] dark:text-[#8396b3]">/ {totalPaginas}</span>

                          <button
                            onClick={() => setPagina((p) => Math.min(p + 1, totalPaginas - 1))}
                            disabled={paginaAtual >= totalPaginas - 1}
                            className="rounded-md border border-[#dbe4f1] dark:border-[#2a3e5d] bg-white dark:bg-[#0f1d31] px-3 py-1.5 text-[9px] font-semibold text-[#28457d] dark:text-[#b7c9e8] transition-colors hover:bg-[#f8faff] dark:hover:bg-[#162640] dark:bg-[#162640] disabled:cursor-not-allowed disabled:text-[#bcc6d9] dark:text-[#657791]"
                          >
                            {t("common.next")}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </Card>
              </div>

              {/* Painéis laterais — somente resumo derivado dos mesmos dados já carregados. */}
              <aside className="flex flex-col gap-3">
                <Card className="rounded-[14px] !border-[#dce5f2] dark:!border-[#20334d] dark:border-[#20334d] !bg-white dark:!bg-[#0f1d31] dark:bg-[#0f1d31] p-4 !shadow-[0_4px_16px_rgba(23,58,118,0.035)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.18)] dark:!shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
                  <h2 className="text-[13px] font-bold text-[#071d66] dark:text-[#f3f7ff]">Resumo da base</h2>
                  <p className="mt-1 text-[9px] leading-relaxed text-[#7080a5] dark:text-[#91a3be]">
                    Distribuição dos registros com base no NPS já disponível.
                  </p>

                  <div className="mt-4 space-y-3">
                    {[
                      {
                        label: "Promotores (9-10)",
                        value: resumoVisual.promotores,
                        tone: "bg-emerald-50 dark:bg-emerald-950/300",
                      },
                      {
                        label: "Neutros (7-8)",
                        value: resumoVisual.neutros,
                        tone: "bg-amber-400",
                      },
                      {
                        label: "Detratores (0-6)",
                        value: resumoVisual.detratores,
                        tone: "bg-red-50 dark:bg-red-950/300",
                      },
                      {
                        label: "Sem NPS",
                        value: Math.max(resumoVisual.total - resumoVisual.comNps, 0),
                        tone: "bg-slate-300",
                      },
                    ].map((item) => {
                      const pct = resumoVisual.total
                        ? Math.round((item.value / resumoVisual.total) * 100)
                        : 0;

                      return (
                        <div key={item.label}>
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <span className="text-[9px] font-medium text-[#354f85] dark:text-[#b7c9e8]">{item.label}</span>
                            <span className="text-[9px] font-semibold text-[#102d72] dark:text-[#dce8fa]">
                              {item.value} <span className="ml-1 font-medium text-[#8290ae] dark:text-[#8396b3]">{pct}%</span>
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-[#edf2f8] dark:bg-[#22324a]">
                            <div
                              className={`h-full rounded-full ${item.tone}`}
                              style={{ width: `${Math.max(pct, item.value ? 3 : 0)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <Card className="rounded-[14px] !border-[#dce5f2] dark:!border-[#20334d] dark:border-[#20334d] !bg-white dark:!bg-[#0f1d31] dark:bg-[#0f1d31] p-4 !shadow-[0_4px_16px_rgba(23,58,118,0.035)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.18)] dark:!shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
                  <h2 className="text-[13px] font-bold text-[#071d66] dark:text-[#f3f7ff]">Ações rápidas</h2>

                  <div className="mt-3 space-y-3">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex w-full items-start gap-3 rounded-lg p-1.5 text-left transition-colors hover:bg-[#f7faff] dark:hover:bg-[#162640] dark:bg-[#162640]"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#edf3ff] dark:bg-[#14284a] text-[#1458e5]">
                        ↑
                      </span>
                      <span>
                        <span className="block text-[9px] font-semibold text-[#183b86] dark:text-[#c7d8f3]">
                          Importar transcrição
                        </span>
                        <span className="mt-0.5 block text-[8px] leading-relaxed text-[#8290ae] dark:text-[#8396b3]">
                          Adicione TXT ou JSON usando o fluxo já existente.
                        </span>
                      </span>
                    </button>

                    <div className="flex items-start gap-3 rounded-lg p-1.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f3efff] dark:bg-[#2a234a] text-[#7047e8]">
                        ✦
                      </span>
                      <span>
                        <span className="block text-[9px] font-semibold text-[#183b86] dark:text-[#c7d8f3]">
                          Filtrar a base
                        </span>
                        <span className="mt-0.5 block text-[8px] leading-relaxed text-[#8290ae] dark:text-[#8396b3]">
                          Use busca, segmento e UF na barra acima da tabela.
                        </span>
                      </span>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg p-1.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ebf8f2] dark:bg-[#123425] text-[#0da66b]">
                        ✓
                      </span>
                      <span>
                        <span className="block text-[9px] font-semibold text-[#183b86] dark:text-[#c7d8f3]">
                          Abrir transcrição
                        </span>
                        <span className="mt-0.5 block text-[8px] leading-relaxed text-[#8290ae] dark:text-[#8396b3]">
                          Clique em qualquer linha para abrir o drawer atual.
                        </span>
                      </span>
                    </div>
                  </div>
                </Card>

                <Card className="rounded-[14px] !border-[#dce5f2] dark:!border-[#20334d] dark:border-[#20334d] !bg-white dark:!bg-[#0f1d31] dark:bg-[#0f1d31] p-4 !shadow-[0_4px_16px_rgba(23,58,118,0.035)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.18)] dark:!shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
                  <h2 className="text-[13px] font-bold text-[#071d66] dark:text-[#f3f7ff]">Segmentos da base</h2>
                  <div className="mt-4 space-y-3">
                    {distribuicaoSegmentos.length === 0 && (
                      <p className="text-[9px] text-[#8290ae] dark:text-[#8396b3]">Sem segmentos disponíveis.</p>
                    )}

                    {distribuicaoSegmentos.map((item) => (
                      <div key={item.label}>
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <span className="truncate text-[9px] font-medium text-[#354f85] dark:text-[#b7c9e8]">
                            {item.label}
                          </span>
                          <span className="shrink-0 text-[9px] font-semibold text-[#102d72] dark:text-[#dce8fa]">
                            {item.quantidade}
                            <span className="ml-1 font-medium text-[#8290ae] dark:text-[#8396b3]">
                              {item.percentual}%
                            </span>
                          </span>
                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-[#edf2f8] dark:bg-[#22324a]">
                          <div
                            className="h-full rounded-full bg-[#0d57e7]"
                            style={{ width: `${Math.max(item.percentual, 3)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </aside>
            </div>

            {/* Faixa inferior inspirada no protótipo, sem inventar integração. */}
            <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-[14px] border border-[#dce5f2] dark:border-[#20334d] bg-white dark:bg-[#0f1d31] px-4 py-4 shadow-[0_4px_16px_rgba(23,58,118,0.035)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edf3ff] dark:bg-[#14284a] text-[#1458e5]">
                    ✦
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold text-[#164ec8]">Dica</p>
                    <p className="mt-1 text-[9px] leading-relaxed text-[#60729c] dark:text-[#9aaccc]">
                      Use os filtros existentes para revisar a base antes de abrir uma transcrição.
                      Nenhuma regra de processamento foi alterada nesta tela.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[14px] border border-[#dce5f2] dark:border-[#20334d] bg-white dark:bg-[#0f1d31] px-4 py-4 shadow-[0_4px_16px_rgba(23,58,118,0.035)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.18)]">
                <p className="text-[10px] font-bold text-[#071d66] dark:text-[#f3f7ff]">Fluxo de trabalho</p>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
                  {[
                    ["1", "Importe ou selecione uma transcrição"],
                    ["2", "Filtre por segmento ou UF"],
                    ["3", "Abra o registro desejado"],
                    ["4", "Revise os detalhes no drawer"],
                  ].map(([number, label]) => (
                    <div key={number} className="flex items-start gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#edf3ff] dark:bg-[#14284a] text-[10px] font-bold text-[#1458e5]">
                        {number}
                      </span>
                      <span className="pt-0.5 text-[8px] leading-relaxed text-[#53658f] dark:text-[#9fb0c9]">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {aberta && (
        <TranscricaoDrawer
          reuniao={aberta}
          textoLocal={textoLocalAberto}
          onClose={() => {
            setAberta(null);
            setTextoLocalAberto(undefined);
          }}
        />
      )}
    </div>
  );
}
