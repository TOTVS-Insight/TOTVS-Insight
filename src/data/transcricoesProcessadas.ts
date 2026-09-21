/**
 * Acesso às DUAS versões já processadas da transcrição.
 *
 * Este arquivo NÃO executa ML.
 * Ele apenas lê o resultado do pipeline offline/server-side.
 */

const BASE = import.meta.env.BASE_URL;

export type NivelFiltragem = "LEVE" | "MEDIO" | "AGRESSIVO";

export interface TranscricaoProcessada {
    id_reuniao: string;
    codt?: string | null;
    data_reuniao?: string | null;
    status_reuniao?: string | null;
    unidade?: string | null;
    segmento?: string | null;
    uf?: string | null;

    /** Sempre preservada. */
    texto_original: string;

    /** Gerada pelo estágio 2 do pipeline. */
    texto_filtrado: string;

    nivel_filtragem: NivelFiltragem;
    status_transcricao: string;

    filtro_ml: {
        modelo: string;
        threshold: number;
        processado_em: string;
        total_linhas: number;
        linhas_mantidas: number;
        linhas_removidas: number;
        percentual_mantido: number;
        confianca_media: number;
    };

    detalhes_filtragem?: Array<{
        linha: string;
        mantida: boolean;
        probabilidade_relevancia: number;
        motivo: string;
    }>;
}

function idSeguro(id: string) {
    return encodeURIComponent(String(id).trim());
}

/**
 * Usado pela tela "Comparar antes/depois".
 * É APENAS leitura; nenhum modelo roda aqui.
 */
export async function carregarTranscricaoProcessada(
    reuniaoId: string,
): Promise<TranscricaoProcessada | null> {
    const response = await fetch(
        `${BASE}data/transcricoes-processadas/${idSeguro(reuniaoId)}.json`,
        {
            method: "GET",
            cache: "no-store",
            headers: {
                Accept: "application/json",
            },
        },
    );

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error(
            `Falha ao carregar transcrição processada (${response.status}).`,
        );
    }

    return (await response.json()) as TranscricaoProcessada;
}

/**
 * Entrada oficial da etapa 3 do pipeline.
 *
 * A análise de IA deve usar esta função (ou a mesma regra no backend),
 * pois ela devolve SOMENTE texto_filtrado.
 *
 * Se não existe filtragem armazenada, a análise não deve prosseguir.
 */
export async function carregarTextoParaAnalise(
    reuniaoId: string,
): Promise<string> {
    const transcricao = await carregarTranscricaoProcessada(reuniaoId);

    if (!transcricao?.texto_filtrado?.trim()) {
        throw new Error(
            "A transcrição ainda não possui versão filtrada. Execute o estágio de filtragem antes da análise.",
        );
    }

    return transcricao.texto_filtrado;
}
