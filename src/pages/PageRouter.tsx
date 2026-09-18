import type { NavId } from "@/navigation";

import AjudaPage from "./AjudaPage";
import AssistentePage from "./AssistentePage";
import ClientesPage from "./ClientesPage";
import ConfiguracoesPage from "./ConfiguracoesPage";
import DashboardPage from "./DashboardPage";
import FilaPage from "./FilaPage";
import HistoricoPage from "./HistoricoPage";
import InicioPage from "./InicioPage";
import PerfilPage from "./PerfilPage";
import RelatoriosPage from "./RelatoriosPage";
import ReuniaoPage from "./ReuniaoPage";
import TranscricoesPage from "./TranscricoesPage";

export default function PageRouter({
  activeNav,
  onNav,
}: {
  activeNav: NavId;
  onNav: (id: NavId) => void;
}) {
  switch (activeNav) {
    case "inicio":
      return <InicioPage onNav={onNav} />;

    case "dashboard":
      return <DashboardPage />;

    case "clientes":
      return <ClientesPage />;

    case "transcricoes":
      return <TranscricoesPage />;

    case "fila":
      return <FilaPage />;

    case "historico":
      return <HistoricoPage />;

    case "relatorios":
      return <RelatoriosPage />;

    case "reuniao":
      return <ReuniaoPage />;

    case "assistente":
      return <AssistentePage />;

    case "configuracoes":
      return <ConfiguracoesPage onNav={onNav} />;

    case "perfil":
      return <PerfilPage />;

    case "ajuda":
      return <AjudaPage onNav={onNav} />;

    default:
      return <InicioPage onNav={onNav} />;
  }
}