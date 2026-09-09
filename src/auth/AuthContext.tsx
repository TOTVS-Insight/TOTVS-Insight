import { lerFotoLocal, salvarFotoLocal } from "./fotoLocal";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { login as loginService, logout as logoutService } from "./authService";
import type { Credenciais, Usuario } from "./types";

interface AuthContextValue {
  usuario: Usuario | null;
  autenticado: boolean;
  /** Devolve `null` em caso de sucesso, ou a mensagem de erro. */
  entrar: (credenciais: Credenciais) => Promise<string | null>;
  sair: () => void;
  /** Atualiza os dados do usuário logado (usado pela página de perfil). */
  atualizarUsuario: (dados: Partial<Usuario>) => void;
  atualizarFoto: (foto: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const entrar = useCallback(async (credenciais: Credenciais) => {
    const resultado = await loginService(credenciais);
    if (!resultado.ok) return resultado.erro;
    setUsuario({ ...resultado.usuario, foto: lerFotoLocal(resultado.usuario.id) });
    return null;
  }, []);

  const sair = useCallback(() => {
    void logoutService();
    setUsuario(null);
  }, []);

  const atualizarUsuario = useCallback((dados: Partial<Usuario>) => {
    setUsuario((atual) => (atual ? { ...atual, ...dados } : atual));
  }, []);

  const atualizarFoto = useCallback((foto: string | null) => {
    if (!usuario) return;
    salvarFotoLocal(usuario.id, foto);
    setUsuario(atual => atual ? { ...atual, foto } : atual);
  }, [usuario]);

  const value = useMemo(
    () => ({
      usuario,
      autenticado: usuario !== null,
      entrar,
      sair,
      atualizarUsuario,
      atualizarFoto,
    }),
    [usuario, entrar, sair, atualizarUsuario, atualizarFoto],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Acessa a sessão. Lança se usado fora do `AuthProvider`. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>.");
  return ctx;
}
