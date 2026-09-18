/** Páginas alcançáveis dentro da aplicação. */
export type NavId =
  | "inicio"
  | "dashboard"
  | "clientes"
  | "transcricoes"
  | "fila"
  | "historico"
  | "relatorios"
  | "reuniao"
  | "assistente"
  | "configuracoes"
  | "perfil"
  | "ajuda";

/** Telas do fluxo de autenticação. */
export type AuthScreen =
  | "login"
  | "forgot"
  | "verify-code"
  | "new-password"
  | "first-access";

/** Path da URL para cada tela interna. */
export const PATH_BY_NAV: Record<NavId, string> = {
  inicio: "/",

  // Dashboard antigo continua existindo.
  dashboard: "/dashboard",

  clientes: "/clientes",
  transcricoes: "/transcricoes",
  fila: "/fila",
  historico: "/historico",
  relatorios: "/relatorios",

  reuniao: "/reuniao",

  // Mantido para não quebrar o projeto antigo.
  assistente: "/assistente",

  configuracoes: "/configuracoes",
  perfil: "/perfil",
  ajuda: "/ajuda",
};

export const PATH_BY_AUTH: Record<AuthScreen, string> = {
  login: "/login",
  forgot: "/forgot",
  "verify-code": "/verify-code",
  "new-password": "/new-password",
  "first-access": "/first-access",
};

const NAV_BY_PATH: Record<string, NavId> = Object.fromEntries(
  Object.entries(PATH_BY_NAV).map(([id, path]) => [
    path,
    id as NavId,
  ]),
) as Record<string, NavId>;

const AUTH_BY_PATH: Record<string, AuthScreen> =
  Object.fromEntries(
    Object.entries(PATH_BY_AUTH).map(([id, path]) => [
      path,
      id as AuthScreen,
    ]),
  ) as Record<string, AuthScreen>;

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname || "/";
}

export function pathForNav(id: NavId): string {
  return PATH_BY_NAV[id];
}

export function pathForAuth(screen: AuthScreen): string {
  return PATH_BY_AUTH[screen];
}

export function navFromPath(pathname: string): NavId {
  return NAV_BY_PATH[normalizePath(pathname)] ?? "inicio";
}

export function authFromPath(
  pathname: string,
): AuthScreen | null {
  return AUTH_BY_PATH[normalizePath(pathname)] ?? null;
}

export const DASHBOARD_PATHS = (
  Object.keys(NAV_BY_PATH) as string[]
).filter((p) => p !== "/");