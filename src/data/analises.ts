export interface TrechoAnalise {
  trecho: number;
  texto: string;
  inicio: number;
  fim: number;
  rotulo_modelo: "risco" | "neutro" | null;
  score_modelo: number | null;
  motivo: string;
  recomendacao: string;
}
export interface ResumoAnalise {
  id: string;
  id_reuniao: string;
  criado_em: string;
  total_trechos: number;
  trechos_com_alerta: number;
  trechos_sem_contexto: number;
  versao_modelo: string;
}
export interface Analise extends ResumoAnalise {
  aviso: string;
  trechos: TrechoAnalise[];
}
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, options);
  } catch {
    throw new Error("Serviço de análise indisponível. Inicie o servidor local e tente novamente.");
  }
  if (!response.headers.get("content-type")?.includes("application/json")) {
    throw new Error("Serviço de análise indisponível. Abra o site pelo servidor local.");
  }
  const result = await response.json();
  if (!response.ok) throw new Error(result.erro || "Não foi possível concluir a solicitação.");
  return result as T;
}
export const listarAnalises = () => request<ResumoAnalise[]>("/analises");
export const obterAnalise = (id: string) => request<Analise>(`/analises/${encodeURIComponent(id)}`);
export async function analisarReuniao(id_reuniao: string, texto: string): Promise<Analise> {
  const result = await request<Analise>("/analises", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_reuniao, texto }),
  });
  window.dispatchEvent(new Event("analises-atualizadas"));
  return result;
}
