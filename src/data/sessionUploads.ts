/**
 * Uploads feitos no browser — valem só nesta sessão (somem no refresh).
 *
 * Sem backend: o arquivo nunca sai da máquina do usuário; só entra na lista
 * em memória e, se houver texto, no drawer da transcrição.
 */

import { translate } from "@/i18n/translate";
import type { Reuniao } from "./types";

export interface UploadLocal {
  reuniao: Reuniao;
  texto: string;
}

const uploads: UploadLocal[] = [];
const listeners = new Set<() => void>();

function avisar() {
  for (const fn of listeners) fn();
}

/** Inscreve um listener; devolve função para cancelar. */
export function onUploadsChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function listarUploads(): UploadLocal[] {
  return uploads;
}

export function getTextoUpload(id: string): string | undefined {
  return uploads.find((u) => u.reuniao.id === id)?.texto;
}

export function adicionarUpload(upload: UploadLocal): void {
  const i = uploads.findIndex((u) => u.reuniao.id === upload.reuniao.id);
  if (i >= 0) uploads.splice(i, 1);
  uploads.unshift(upload);
  avisar();
}

/** Conta rótulos `[LOCUTOR N]` distintos — mesmo critério do build-data. */
export function contarLocutores(texto: string): number {
  const set = new Set<string>();
  for (const m of texto.matchAll(/\[LOCUTOR\s+(\d+)\]/gi)) {
    set.add(m[1]);
  }
  return set.size;
}

function agoraIsoLocal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function segundosDeDuracao(hhmmss: string | undefined): number {
  if (!hhmmss) return 0;
  const partes = hhmmss.split(":").map(Number);
  if (partes.length !== 3 || partes.some((n) => Number.isNaN(n))) return 0;
  return partes[0] * 3600 + partes[1] * 60 + partes[2];
}

/**
 * Interpreta `.txt` (texto puro) ou `.json` com campos comuns.
 * Gera id `LOCAL-…` quando o arquivo não traz um.
 *
 * As mensagens de erro vão direto para a tela, então passam pelo dicionário —
 * mesmo padrão de `repository.ts`.
 */
export function parseArquivoUpload(nome: string, conteudo: string): UploadLocal {
  const baseNome = nome.replace(/\.[^.]+$/, "") || "upload";
  let texto = conteudo.trim();
  let id = `LOCAL-${Date.now()}`;
  let data = agoraIsoLocal();
  let duracao = "00:00:00";
  let codt = baseNome.slice(0, 24).toUpperCase() || "LOCAL";
  let formato = "LINK";
  let status = "COMPLETED";
  let statusId = "local";
  let externo = false;
  let tipoRecurso: string | null = null;
  let uf: string | null = null;
  let cnae: string | null = null;
  let unidade: string | null = null;
  let segmento: string | null = null;
  let faixaFaturamento: string | null = null;
  let nps: number | null = null;
  let dataUltimaPesquisa: string | null = null;

  if (nome.toLowerCase().endsWith(".json")) {
    let json: unknown;
    try {
      json = JSON.parse(conteudo);
    } catch {
      throw new Error(translate("transcripts.uploadInvalidJson"));
    }
    if (!json || typeof json !== "object") {
      throw new Error(translate("transcripts.uploadInvalidJson"));
    }
    const o = json as Record<string, unknown>;
    const rawTexto = o.texto ?? o.text ?? o.transcricao ?? o.transcript ?? o.ANON_TRANSCRICAO;
    if (typeof rawTexto !== "string" || !rawTexto.trim()) {
      throw new Error(translate("transcripts.uploadNoText"));
    }
    texto = rawTexto.trim();
    if (typeof o.id === "string" && o.id.trim()) id = o.id.trim();
    else if (typeof o.ID_MEETING === "string" && o.ID_MEETING.trim()) id = o.ID_MEETING.trim();
    if (typeof o.data === "string") data = o.data;
    else if (typeof o.DT_MEETING === "string") data = o.DT_MEETING;
    if (typeof o.duracao === "string") duracao = o.duracao;
    else if (typeof o.DURACAO_MEETING === "string") duracao = o.DURACAO_MEETING;
    if (typeof o.codt === "string") codt = o.codt;
    else if (typeof o.CODT === "string") codt = o.CODT;
    if (typeof o.formato === "string") formato = o.formato;
    if (typeof o.unidade === "string") unidade = o.unidade;
    if (typeof o.segmento === "string") segmento = o.segmento;
    if (typeof o.uf === "string") uf = o.uf;
    if (typeof o.nps === "number") nps = o.nps;
  }

  if (!texto) throw new Error(translate("transcripts.uploadEmpty"));

  const duracaoSegundos = segundosDeDuracao(duracao);
  const reuniao: Reuniao = {
    id,
    data,
    dataCriacao: data,
    formato,
    status,
    statusId,
    duracao,
    duracaoSegundos,
    codt,
    externo,
    tipoRecurso,
    uf,
    cnae,
    unidade,
    segmento,
    faixaFaturamento,
    nps,
    dataUltimaPesquisa,
    locutores: contarLocutores(texto),
    tamanhoTranscricao: texto.length,
  };

  return { reuniao, texto };
}
