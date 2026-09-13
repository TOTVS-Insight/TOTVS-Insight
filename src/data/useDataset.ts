import { useEffect, useState } from "react";
import { translate } from "@/i18n/translate";
import { onUploadsChange } from "./sessionUploads";
import { DadosIndisponiveisError } from "./types";

export interface EstadoDados<T> {
  data: T | null;
  loading: boolean;
  /** Mensagem pronta para exibição, ou `null` se deu tudo certo. */
  error: string | null;
  /** Sugestão de como resolver, quando o erro traz uma. */
  sugestao: string | null;
}

export interface DadosComRecarga<T> extends EstadoDados<T> {
  /** Refaz a consulta — é o que os botões de "Atualizar" chamam. */
  recarregar: () => void;
}

/**
 * Roda um carregador do `repository` e devolve `{ data, loading, error }`.
 *
 * Uso:
 *
 *     const { data, loading, error } = useDataset(getKpis);
 *
 * `carregar` precisa ser estável entre renders — passe uma função de módulo ou
 * envolva num `useCallback`. Reage também a uploads locais da sessão.
 *
 * Em refresh por upload, mantém os dados anteriores na tela (sem “piscar”
 * loading) — no Pages isso fazia o botão/lista sumirem e o drawer parecer
 * quebrado.
 */
export default function useDataset<T>(carregar: () => Promise<T>): DadosComRecarga<T> {
  const [estado, setEstado] = useState<EstadoDados<T>>({
    data: null,
    loading: true,
    error: null,
    sugestao: null,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => onUploadsChange(() => setTick((n) => n + 1)), []);

  useEffect(() => {
    let ativo = true;

    setEstado((prev) => ({
      data: prev.data,
      loading: prev.data === null,
      error: null,
      sugestao: null,
    }));

    carregar()
      .then((data) => {
        if (!ativo) return;
        setEstado({ data, loading: false, error: null, sugestao: null });
      })
      .catch((err: unknown) => {
        if (!ativo) return;
        const error = err instanceof Error ? err.message : translate("errors.genericTitle");
        const sugestao = err instanceof DadosIndisponiveisError ? err.sugestao : null;
        setEstado({ data: null, loading: false, error, sugestao });
      });

    return () => {
      ativo = false;
    };
  }, [carregar, tick]);

  return { ...estado, recarregar: () => setTick((n) => n + 1) };
}
