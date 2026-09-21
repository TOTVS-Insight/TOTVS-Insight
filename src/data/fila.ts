export type StatusJobFila = "AGUARDANDO" | "PROCESSANDO" | "CONCLUIDO" | "FALHA";
export type PrioridadeJobFila = "BAIXA" | "MEDIA" | "ALTA";

export interface JobFila {
  id_reuniao: string;
  status: StatusJobFila;
  prioridade: PrioridadeJobFila;
  tentativas: number;
  enfileirado_em: string;
  iniciado_em: string | null;
  finalizado_em: string | null;
  erro: string | null;
  atualizado_em: string;
}

export interface ResumoFila {
  total: number;
  aguardando: number;
  processando: number;
  concluidos: number;
  falhas: number;
  taxa_sucesso: number;
  tempo_medio_segundos: number;
}

export interface EstadoFilaApi {
  pausada: boolean;
  worker_ativo: boolean;
  resumo: ResumoFila;
  jobs: JobFila[];
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`/api${path}`, {
      cache: "no-store",
      ...options,
    });
  } catch {
    throw new Error("Serviço da fila indisponível. Inicie o backend Python.");
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error("O serviço da fila não respondeu em JSON.");
  }

  const payload = (await response.json()) as T & { erro?: string };

  if (!response.ok) {
    throw new Error(payload.erro ?? `Falha na fila (${response.status}).`);
  }

  return payload;
}

export function obterFila(): Promise<EstadoFilaApi> {
  return request<EstadoFilaApi>("/fila");
}

export function iniciarFila(): Promise<EstadoFilaApi> {
  return request<EstadoFilaApi>("/fila/iniciar", { method: "POST" });
}

export function pausarFila(): Promise<EstadoFilaApi> {
  return request<EstadoFilaApi>("/fila/pausar", { method: "POST" });
}

export async function sincronizarFila(): Promise<EstadoFilaApi> {
  const result = await request<{ fila: EstadoFilaApi }>("/fila/sincronizar", {
    method: "POST",
  });
  return result.fila;
}

export function reprocessarJob(idReuniao: string): Promise<EstadoFilaApi> {
  return request<EstadoFilaApi>(
    `/fila/jobs/${encodeURIComponent(idReuniao)}/retry`,
    { method: "POST" },
  );
}

export function alterarPrioridadeJob(
  idReuniao: string,
  prioridade: PrioridadeJobFila,
): Promise<EstadoFilaApi> {
  return request<EstadoFilaApi>(
    `/fila/jobs/${encodeURIComponent(idReuniao)}/prioridade`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prioridade }),
    },
  );
}
