/** Um contador exibido no cartão de perfil, ex.: "128 Análises". */
export interface EstatisticaUsuario {
  label: string;
  value: string;
}

/** Usuário autenticado. */
export interface Usuario {
  id: string;
  nome: string;
  cargo: string;
  email: string;
  telefone: string;
  departamento: string;
  localizacao: string;
  /** Iniciais exibidas no avatar, ex.: "RA". */
  iniciais: string;
  foto?: string | null;
  stats: EstatisticaUsuario[];
}

export interface Credenciais {
  email: string;
  senha: string;
}

/**
 * Resultado de uma tentativa de login.
 *
 * União discriminada em vez de `throw`: um erro de credencial é um caminho
 * esperado do fluxo, não uma exceção.
 */
export interface LoginBemSucedido {
  ok: true;
  usuario: Usuario;
}

export interface LoginRecusado {
  ok: false;
  erro: string;
}

export type ResultadoLogin = LoginBemSucedido | LoginRecusado;

/** Erros de validação por campo, antes de chamar o backend. */
export interface ErrosFormulario {
  email?: string;
  senha?: string;
}
