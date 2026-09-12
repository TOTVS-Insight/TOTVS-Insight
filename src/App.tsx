import { useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router";
import type { AuthScreen } from "@/navigation";
import { pathForAuth } from "@/navigation";
import { useAuth } from "@/auth/AuthContext";
import Preloader from "@/screens/Preloader";
import LoginScreen from "@/screens/LoginScreen";
import ForgotScreen from "@/screens/ForgotScreen";
import VerifyCodeScreen from "@/screens/VerifyCodeScreen";
import NewPasswordScreen from "@/screens/NewPasswordScreen";
import FirstAccessScreen from "@/screens/FirstAccessScreen";
import DashboardScreen from "@/screens/DashboardScreen";

function AuthNav({
  children,
}: {
  children: (onNav: (screen: AuthScreen) => void) => React.ReactNode;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const onNav = (screen: AuthScreen) => {
    // Leva junto a rota de origem: trocar de tela de autenticação não pode perdê-la.
    navigate(pathForAuth(screen), { state: location.state });
  };
  return <>{children(onNav)}</>;
}

/** Rota guardada ao barrar alguém no login, para voltar a ela depois de entrar. */
interface OrigemDaRota {
  de?: string;
}

function ProtectedDashboard({ onLogout }: { onLogout: () => void }) {
  const { autenticado } = useAuth();
  const location = useLocation();
  if (!autenticado) {
    /*
     * Só guarda a origem quando a pessoa chegou direto pela URL: `key` é
     * "default" apenas na primeira navegação da aba. Sair pelo menu acontece no
     * meio da sessão, e aí o login leva para o início, não para a última página.
     */
    const veioDeLinkDireto = location.key === "default";
    const origem: OrigemDaRota | null = veioDeLinkDireto ? { de: location.pathname } : null;
    return <Navigate to={pathForAuth("login")} replace state={origem} />;
  }
  return <DashboardScreen onLogout={onLogout} />;
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  const { autenticado } = useAuth();
  const location = useLocation();
  if (autenticado) {
    // Só rotas do dashboard chegam aqui como origem, então não há risco de voltar ao login.
    const origem = (location.state as OrigemDaRota | null)?.de;
    return <Navigate to={origem ?? "/"} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { sair } = useAuth();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  if (!ready) return <Preloader onDone={() => setReady(true)} />;

  /*
   * O dashboard é alcançável apenas por `autenticado`, que só o `authService`
   * consegue tornar verdadeiro. Rotas protegidas redirecionam para /login.
   */
  const logout = () => {
    sair();
    navigate(pathForAuth("login"), { replace: true });
  };

  return (
    <Routes>
      <Route
        path={pathForAuth("login")}
        element={
          <GuestOnly>
            <AuthNav>{(onNav) => <LoginScreen onNav={onNav} />}</AuthNav>
          </GuestOnly>
        }
      />
      <Route
        path={pathForAuth("forgot")}
        element={
          <GuestOnly>
            <AuthNav>{(onNav) => <ForgotScreen onNav={onNav} />}</AuthNav>
          </GuestOnly>
        }
      />
      <Route
        path={pathForAuth("verify-code")}
        element={
          <GuestOnly>
            <AuthNav>{(onNav) => <VerifyCodeScreen onNav={onNav} />}</AuthNav>
          </GuestOnly>
        }
      />
      <Route
        path={pathForAuth("new-password")}
        element={
          <GuestOnly>
            <AuthNav>{(onNav) => <NewPasswordScreen onNav={onNav} />}</AuthNav>
          </GuestOnly>
        }
      />
      <Route
        path={pathForAuth("first-access")}
        element={
          <GuestOnly>
            <AuthNav>{(onNav) => <FirstAccessScreen onNav={onNav} />}</AuthNav>
          </GuestOnly>
        }
      />
      <Route path="/*" element={<ProtectedDashboard onLogout={logout} />} />
    </Routes>
  );
}
