import type { ReactNode } from "react";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/useLocale";
import type { NavId } from "@/navigation";

import {
  AlertTriangleIcon,
  BarChartIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  FileTextIcon,
  UsersIcon,
  VideoIcon,
} from "@/icons";

interface InicioPageProps {
  onNav: (id: NavId) => void;
}

interface QuickActionProps {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

interface SectionCardProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  children: ReactNode;
  onSeeAll?: () => void;
  seeAllLabel: string;
}

type Tone =
  | "red"
  | "orange"
  | "green"
  | "blue"
  | "purple";

type AgendaId =
  | "prioridade"
  | "analises"
  | "churn"
  | "oportunidades";

interface AgendaItem {
  id: AgendaId;
  title: string;
  description: string;
  value: string;
  tone: Tone;
  icon: ReactNode;
}



type UiLanguage = "pt" | "en" | "es";

const UI_TRANSLATIONS: Record<string, { en: string; es: string }> = {
  "Bom dia": { en: "Good morning", es: "Buenos días" },
  "Início": { en: "Home", es: "Inicio" },
  "Aqui você centraliza suas principais ações e prioridades do dia.": {
    en: "Centralize your main actions and priorities for the day here.",
    es: "Aquí centralizas tus principales acciones y prioridades del día.",
  },
  "“Grandes resultados nascem de grandes conversas.”": {
    en: "“Great results start with great conversations.”",
    es: "“Los grandes resultados nacen de grandes conversaciones.”",
  },
  "Ver todos": { en: "View all", es: "Ver todos" },
  "Iniciar reunião": { en: "Start meeting", es: "Iniciar reunión" },
  "Capture e analise sua reunião em tempo real com o TOTVIS.": {
    en: "Capture and analyze your meeting in real time with TOTVS.",
    es: "Captura y analiza tu reunión en tiempo real con TOTVS.",
  },
  "Nova transcrição": { en: "New transcript", es: "Nueva transcripción" },
  "Envie um arquivo de áudio ou vídeo para análise.": {
    en: "Upload an audio or video file for analysis.",
    es: "Sube un archivo de audio o video para su análisis.",
  },
  "Ver análises pendentes": { en: "View pending analyses", es: "Ver análisis pendientes" },
  "Acompanhe suas reuniões em processamento.": {
    en: "Track meetings that are still being processed.",
    es: "Acompaña las reuniones que están en procesamiento.",
  },
  "Abrir relatórios": { en: "Open reports", es: "Abrir informes" },
  "Acesse insights e relatórios estratégicos.": {
    en: "Access insights and strategic reports.",
    es: "Accede a insights e informes estratégicos.",
  },
  "Seu dia": { en: "Your day", es: "Tu día" },
  "Prioridades e oportunidades para hoje.": {
    en: "Priorities and opportunities for today.",
    es: "Prioridades y oportunidades para hoy.",
  },
  "Atividade recente": { en: "Recent activity", es: "Actividad reciente" },
  "Últimas movimentações na sua conta.": {
    en: "Latest activity in your account.",
    es: "Últimos movimientos de tu cuenta.",
  },
  "Alertas importantes": { en: "Important alerts", es: "Alertas importantes" },
  "Pontos de atenção que precisam da sua ação.": {
    en: "Items that require your attention.",
    es: "Puntos de atención que requieren tu acción.",
  },
  "Reuniões recentes": { en: "Recent meetings", es: "Reuniones recientes" },
  "Suas últimas reuniões e respectivos status.": {
    en: "Your latest meetings and their current status.",
    es: "Tus últimas reuniones y sus respectivos estados.",
  },
  "Clientes prioritários": { en: "Priority clients", es: "Clientes prioritarios" },
  "Contas que merecem sua atenção no momento.": {
    en: "Accounts that deserve your attention right now.",
    es: "Cuentas que merecen tu atención en este momento.",
  },
  "Reuniões com prioridade alta": { en: "High-priority meetings", es: "Reuniones con prioridad alta" },
  "Reuniões que precisam de atenção": { en: "Meetings that require attention", es: "Reuniones que necesitan atención" },
  "Análises aguardando revisão": { en: "Analyses awaiting review", es: "Análisis pendientes de revisión" },
  "Reuniões aguardando processamento ou revisão": { en: "Meetings awaiting processing or review", es: "Reuniones pendientes de procesamiento o revisión" },
  "Clientes com risco de churn": { en: "Clients at risk of churn", es: "Clientes con riesgo de churn" },
  "Clientes que precisam de atenção": { en: "Clients that require attention", es: "Clientes que necesitan atención" },
  "Oportunidades novas detectadas": { en: "New opportunities detected", es: "Nuevas oportunidades detectadas" },
  "Oportunidades identificadas nas reuniões": { en: "Opportunities identified in meetings", es: "Oportunidades identificadas en las reuniones" },
  "Reunião analisada": { en: "Meeting analyzed", es: "Reunión analizada" },
  "Novo alerta crítico": { en: "New critical alert", es: "Nueva alerta crítica" },
  "Concorrente mencionado": { en: "Competitor mentioned", es: "Competidor mencionado" },
  "Oportunidade de cross-sell identificada": { en: "Cross-sell opportunity identified", es: "Oportunidad de cross-sell identificada" },
  "Transcrição enviada": { en: "Transcript uploaded", es: "Transcripción enviada" },
  "Aumento de risco de churn · Construtora Delta": { en: "Increased churn risk · Construtora Delta", es: "Aumento del riesgo de churn · Construtora Delta" },
  "Senior Sistemas citado em reunião": { en: "Senior Sistemas mentioned in a meeting", es: "Senior Sistemas mencionado en una reunión" },
  "12 novas oportunidades · Indústria Ativa": { en: "12 new opportunities · Indústria Ativa", es: "12 nuevas oportunidades · Indústria Ativa" },
  "Aumento de risco de churn": { en: "Increase in churn risk", es: "Aumento del riesgo de churn" },
  "3 clientes apresentaram aumento significativo no risco nas últimas 24h.": { en: "3 clients showed a significant increase in risk in the last 24 hours.", es: "3 clientes presentaron un aumento significativo del riesgo en las últimas 24 h." },
  "Queda de sentimento": { en: "Sentiment decline", es: "Caída del sentimiento" },
  "Cliente Omega S.A. com queda de 15pp no sentimento em relação à semana anterior.": { en: "Omega S.A. showed a 15pp drop in sentiment compared with the previous week.", es: "Omega S.A. presentó una caída de 15 pp en el sentimiento frente a la semana anterior." },
  "Senior Sistemas foi mencionado em 5 reuniões nas últimas 24h.": { en: "Senior Sistemas was mentioned in 5 meetings in the last 24 hours.", es: "Senior Sistemas fue mencionado en 5 reuniones durante las últimas 24 h." },
  "Reunião importante sem análise": { en: "Important meeting without analysis", es: "Reunión importante sin análisis" },
  "Reunião com Varejo Mais Ltda. ainda não foi processada.": { en: "The meeting with Varejo Mais Ltda. has not been processed yet.", es: "La reunión con Varejo Mais Ltda. todavía no ha sido procesada." },
  "Reunião": { en: "Meeting", es: "Reunión" },
  "Cliente": { en: "Client", es: "Cliente" },
  "Data": { en: "Date", es: "Fecha" },
  "Status": { en: "Status", es: "Estado" },
  "Ações": { en: "Actions", es: "Acciones" },
  "Abrir reunião": { en: "Open meeting", es: "Abrir reunión" },
  "Analisada": { en: "Analyzed", es: "Analizada" },
  "Processando": { en: "Processing", es: "Procesando" },
  "Falha": { en: "Failed", es: "Error" },
  "Risco": { en: "Risk", es: "Riesgo" },
  "Oportunidades": { en: "Opportunities", es: "Oportunidades" },
  "Última reunião": { en: "Last meeting", es: "Última reunión" },
  "Alto": { en: "High", es: "Alto" },
  "Médio": { en: "Medium", es: "Medio" },
  "Baixo": { en: "Low", es: "Bajo" },
};

function translateUi(text: string, locale: string) {
  const language: UiLanguage = locale.toLowerCase().startsWith("en")
    ? "en"
    : locale.toLowerCase().startsWith("es")
      ? "es"
      : "pt";

  if (language === "pt") return text;
  return UI_TRANSLATIONS[text]?.[language] ?? text;
}

const toneStyles: Record<
  Tone,
  {
    icon: string;
    badge: string;
  }
> = {
  red: {
    icon: "bg-red-50 text-red-500",
    badge: "bg-red-50 text-red-500",
  },

  orange: {
    icon: "bg-orange-50 text-orange-500",
    badge: "bg-orange-50 text-orange-500",
  },

  green: {
    icon: "bg-green-50 text-green-600",
    badge: "bg-green-50 text-green-600",
  },

  blue: {
    icon: "bg-blue-50 text-blue-600",
    badge: "bg-blue-50 text-blue-600",
  },

  purple: {
    icon: "bg-purple-50 text-purple-600",
    badge: "bg-purple-50 text-purple-600",
  },
};

function QuickAction({
  icon,
  title,
  description,
  onClick,
}: QuickActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group flex min-h-[116px] w-full items-center gap-4
        rounded-[14px] border border-[#DCE7F5]
        bg-white px-5 py-5 text-left
        shadow-[0_2px_8px_rgba(19,60,120,0.035)]
        transition-all duration-200
        hover:-translate-y-[1px]
        hover:border-[#B8D3F5]
        hover:shadow-[0_8px_20px_rgba(0,71,171,0.08)]
        dark:border-[#243B5A]
        dark:bg-[#0F1D31]
      "
    >
      <div
        className="
          flex h-12 w-12 shrink-0 items-center justify-center
          rounded-full bg-[#EAF3FF] text-[#0B5CFF]
        "
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-heading text-[16px] font-semibold leading-[1.2] text-[#09206C] dark:text-white">
          {title}
        </h3>

        <p className="mt-2 font-body text-[13px] leading-[1.45] text-[#61718A] dark:text-[#A8B7CC]">
          {description}
        </p>
      </div>

      <ChevronRightIcon
        size={20}
        className="
          shrink-0 text-[#0B5CFF]
          transition-transform
          group-hover:translate-x-1
        "
      />
    </button>
  );
}

function SectionCard({
  title,
  subtitle,
  icon,
  children,
  onSeeAll,
  seeAllLabel,
}: SectionCardProps) {
  return (
    <section
      className="
        overflow-hidden rounded-[14px]
        border border-[#E0E8F2]
        bg-white
        shadow-[0_2px_8px_rgba(15,44,90,0.035)]
        dark:border-[#24364E]
        dark:bg-[#0F1D31]
      "
    >
      <div className="flex items-start justify-between gap-4 border-b border-[#EEF2F7] px-5 py-4 dark:border-[#23344A]">
        <div className="flex gap-3">
          <div className="mt-[2px] text-[#064FE7]">
            {icon}
          </div>

          <div>
            <h2 className="font-heading text-[18px] font-semibold leading-tight text-[#071F74] dark:text-white">
              {title}
            </h2>

            <p className="mt-1 font-body text-[13px] text-[#6E7F99] dark:text-[#A1B0C7]">
              {subtitle}
            </p>
          </div>
        </div>

        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="
              shrink-0
              font-body text-[12px] font-semibold
              text-[#0064F7]
              transition-colors
              hover:text-[#003FAF]
            "
          >
            {seeAllLabel}
          </button>
        )}
      </div>

      {children}
    </section>
  );
}

const agenda: AgendaItem[] = [
  {
    id: "prioridade",
    title: "Reuniões com prioridade alta",
    description: "Reuniões que precisam de atenção",
    value: "3",
    tone: "red",
    icon: <AlertTriangleIcon size={19} />,
  },

  {
    id: "analises",
    title: "Análises aguardando revisão",
    description:
      "Reuniões aguardando processamento ou revisão",
    value: "5",
    tone: "purple",
    icon: <FileTextIcon size={19} />,
  },

  {
    id: "churn",
    title: "Clientes com risco de churn",
    description: "Clientes que precisam de atenção",
    value: "2",
    tone: "orange",
    icon: <UsersIcon size={19} />,
  },

  {
    id: "oportunidades",
    title: "Oportunidades novas detectadas",
    description:
      "Oportunidades identificadas nas reuniões",
    value: "12",
    tone: "green",
    icon: <CheckCircleIcon size={19} />,
  },
];

const atividades = [
  {
    title: "Reunião analisada",
    description:
      "Reunião Comercial Q2 2026 · Omega S.A.",
    time: "10:24",
    tone: "green" as Tone,
    icon: <FileTextIcon size={16} />,
  },

  {
    title: "Novo alerta crítico",
    description:
      "Aumento de risco de churn · Construtora Delta",
    time: "09:41",
    tone: "red" as Tone,
    icon: <AlertTriangleIcon size={16} />,
  },

  {
    title: "Concorrente mencionado",
    description:
      "Senior Sistemas citado em reunião",
    time: "08:32",
    tone: "orange" as Tone,
    icon: <UsersIcon size={16} />,
  },

  {
    title: "Oportunidade de cross-sell identificada",
    description:
      "12 novas oportunidades · Indústria Ativa",
    time: "07:58",
    tone: "green" as Tone,
    icon: <CheckCircleIcon size={16} />,
  },

  {
    title: "Transcrição enviada",
    description:
      'Arquivo "Reuniao_VarejoMais.mp4"',
    time: "07:12",
    tone: "purple" as Tone,
    icon: <FileTextIcon size={16} />,
  },
];

const alertas = [
  {
    id: "churn",
    title: "Aumento de risco de churn",
    description:
      "3 clientes apresentaram aumento significativo no risco nas últimas 24h.",
    time: "09:41",
    tone: "red" as Tone,
  },

  {
    id: "sentimento",
    title: "Queda de sentimento",
    description:
      "Cliente Omega S.A. com queda de 15pp no sentimento em relação à semana anterior.",
    time: "08:30",
    tone: "orange" as Tone,
  },

  {
    id: "concorrentes",
    title: "Concorrente mencionado",
    description:
      "Senior Sistemas foi mencionado em 5 reuniões nas últimas 24h.",
    time: "08:32",
    tone: "orange" as Tone,
  },

  {
    id: "fila",
    title: "Reunião importante sem análise",
    description:
      "Reunião com Varejo Mais Ltda. ainda não foi processada.",
    time: "07:18",
    tone: "red" as Tone,
  },
];

const reunioes = [
  {
    meeting: "Reunião Comercial Q2 2026",
    client: "Omega S.A.",
    date: "19/05/2026 10:30",
    status: "Analisada",
    tone: "green" as Tone,
  },

  {
    meeting: "Acompanhamento de Obras",
    client: "Construtora Delta",
    date: "19/05/2026 09:15",
    status: "Analisada",
    tone: "green" as Tone,
  },

  {
    meeting: "Planejamento Estratégico",
    client: "Varejo Mais Ltda.",
    date: "18/05/2026 16:45",
    status: "Processando",
    tone: "blue" as Tone,
  },

  {
    meeting: "Kickoff Projeto Insight AI",
    client: "TechSolutions",
    date: "18/05/2026 14:20",
    status: "Analisada",
    tone: "green" as Tone,
  },

  {
    meeting: "Revisão de Resultados",
    client: "Indústria Ativa",
    date: "18/05/2026 11:05",
    status: "Falha",
    tone: "red" as Tone,
  },
];

const clientes = [
  {
    name: "Omega S.A.",
    initials: "O",
    risk: "Alto",
    tone: "red" as Tone,
    opportunities: 4,
    lastMeeting: "19/05/2026",
  },

  {
    name: "Construtora Delta",
    initials: "C",
    risk: "Médio",
    tone: "orange" as Tone,
    opportunities: 2,
    lastMeeting: "19/05/2026",
  },

  {
    name: "Varejo Mais Ltda.",
    initials: "V",
    risk: "Alto",
    tone: "red" as Tone,
    opportunities: 3,
    lastMeeting: "18/05/2026",
  },

  {
    name: "Indústria Ativa",
    initials: "I",
    risk: "Baixo",
    tone: "green" as Tone,
    opportunities: 5,
    lastMeeting: "18/05/2026",
  },

  {
    name: "Banco Safira",
    initials: "B",
    risk: "Médio",
    tone: "orange" as Tone,
    opportunities: 2,
    lastMeeting: "17/05/2026",
  },
];

export default function InicioPage({
  onNav,
}: InicioPageProps) {
  const { usuario } = useAuth();
  const { locale } = useLocale();
  const tr = (value: string) => translateUi(value, locale);

  const primeiroNome =
    usuario?.nome?.split(" ")[0] ||
    "Rafael";

  const dataHoje =
    new Intl.DateTimeFormat(
      locale,
      {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      },
    ).format(new Date());

  const dataFormatada =
    dataHoje.charAt(0).toUpperCase() +
    dataHoje.slice(1);

  /*
   * ============================================================
   * NAVEGAÇÃO DO BLOCO "SEU DIA"
   * ============================================================
   */
  function abrirItemDoDia(
    id: AgendaId,
  ) {
    switch (id) {
      /*
       * Por enquanto abre Transcrições.
       *
       * Depois podemos fazer a própria
       * TranscricoesPage ler esse filtro
       * e abrir mostrando apenas
       * prioridade alta.
       */
      case "prioridade":
        sessionStorage.setItem(
          "totvs:transcricoes:filtro",
          "prioridade-alta",
        );

        onNav("transcricoes");
        return;

      /*
       * A própria fila já é o lugar
       * correto para analisar pendências.
       */
      case "analises":
        onNav("fila");
        return;

      /*
       * Salva qual relatório deve abrir
       * antes de navegar.
       */
      case "churn":
        sessionStorage.setItem(
          "totvs:relatorios:tipo",
          "churn",
        );

        onNav("relatorios");
        return;

      case "oportunidades":
        sessionStorage.setItem(
          "totvs:relatorios:tipo",
          "oportunidades",
        );

        onNav("relatorios");
        return;

      default:
        return;
    }
  }

  /*
   * ============================================================
   * ALERTAS IMPORTANTES
   *
   * Aproveitei e deixei esses clicáveis também.
   * ============================================================
   */
  function abrirAlerta(
    id: string,
  ) {
    switch (id) {
      case "churn":
        sessionStorage.setItem(
          "totvs:relatorios:tipo",
          "churn",
        );

        onNav("relatorios");
        return;

      case "sentimento":
        sessionStorage.setItem(
          "totvs:relatorios:tipo",
          "sentimento",
        );

        onNav("relatorios");
        return;

      case "concorrentes":
        sessionStorage.setItem(
          "totvs:relatorios:tipo",
          "concorrentes",
        );

        onNav("relatorios");
        return;

      case "fila":
        onNav("fila");
        return;

      default:
        onNav("relatorios");
    }
  }

  return (
    <div
      className="
        min-w-0
        rounded-[18px]
        border border-[#DCE5F0]
        bg-[#F8FAFE]
        p-6
        shadow-[0_8px_28px_rgba(15,44,90,0.04)]
        dark:border-[#1F334E]
        dark:bg-[#07111F]
        lg:p-7
      "
    >
      {/* ==================== CABEÇALHO ==================== */}

      <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="font-body text-[14px] font-medium text-[#214C9B] dark:text-[#B6C9E8]">
            {tr("Bom dia")}, {primeiroNome}! 👋
          </p>

          <h1 className="mt-1 font-heading text-[36px] font-bold leading-none tracking-[-0.035em] text-[#072074] dark:text-white">
            {tr("Início")}
          </h1>

          <p className="mt-3 font-body text-[15px] text-[#627493] dark:text-[#AAB7C9]">
            {tr("Aqui você centraliza suas principais ações e prioridades do dia.")}
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <span className="font-body text-[13px] font-medium text-[#3459A3] dark:text-[#AFC4E6]">
            {dataFormatada}
          </span>

          <div className="flex items-center gap-3 rounded-[10px] bg-[#EEF4FF] px-5 py-3 text-[#274AA0] dark:bg-[#12233E] dark:text-[#C1D4F3]">
            <BarChartIcon size={18} />

            <span className="font-body text-[13px]">
              {tr("“Grandes resultados nascem de grandes conversas.”")}
            </span>
          </div>
        </div>
      </div>

      {/* ==================== AÇÕES RÁPIDAS ==================== */}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <QuickAction
          icon={<VideoIcon size={23} />}
          title={tr("Iniciar reunião")}
          description={tr("Capture e analise sua reunião em tempo real com o TOTVIS.")}
          onClick={() =>
            onNav("reuniao")
          }
        />

        <QuickAction
          icon={
            <FileTextIcon
              size={23}
            />
          }
          title={tr("Nova transcrição")}
          description={tr("Envie um arquivo de áudio ou vídeo para análise.")}
          onClick={() =>
            onNav("transcricoes")
          }
        />

        <QuickAction
          icon={
            <BarChartIcon
              size={23}
            />
          }
          title={tr("Ver análises pendentes")}
          description={tr("Acompanhe suas reuniões em processamento.")}
          onClick={() =>
            onNav("fila")
          }
        />

        <QuickAction
          icon={
            <FileTextIcon
              size={23}
            />
          }
          title={tr("Abrir relatórios")}
          description={tr("Acesse insights e relatórios estratégicos.")}
          onClick={() =>
            onNav("relatorios")
          }
        />
      </div>

      {/* ==================== LINHA PRINCIPAL ==================== */}

      <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-3">

        {/* SEU DIA */}

        <SectionCard
          title={tr("Seu dia")}
          subtitle={tr("Prioridades e oportunidades para hoje.")}
          icon={
            <ClockIcon size={21} />
          }
          seeAllLabel={tr("Ver todos")}
        >
          <div>
            {agenda.map(
              (item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() =>
                    abrirItemDoDia(
                      item.id,
                    )
                  }
                  className="
                    group flex w-full
                    items-center gap-4
                    border-b
                    border-[#EFF3F8]
                    px-5 py-4
                    text-left
                    transition-colors
                    last:border-0
                    hover:bg-[#F5F9FF]
                    dark:border-[#22344C]
                    dark:hover:bg-[#13233B]
                  "
                >
                  <div
                    className={`
                      flex h-10 w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      ${toneStyles[
                        item.tone
                      ].icon
                      }
                    `}
                  >
                    {item.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-heading text-[14px] font-semibold text-[#0A2B77] dark:text-white">
                      {tr(item.title)}
                    </p>

                    <p className="mt-1 font-body text-[12.5px] text-[#71809A] dark:text-[#A2B0C4]">
                      {
                        item.description
                      }
                    </p>
                  </div>

                  <span
                    className={`
                      flex h-8 min-w-8
                      items-center
                      justify-center
                      rounded-full px-2
                      font-body
                      text-[13px]
                      font-semibold
                      ${toneStyles[
                        item.tone
                      ].badge
                      }
                    `}
                  >
                    {item.value}
                  </span>

                  <ChevronRightIcon
                    size={16}
                    className="
                      shrink-0
                      text-[#95A8C3]
                      transition-all
                      group-hover:translate-x-1
                      group-hover:text-[#0B63F6]
                    "
                  />
                </button>
              ),
            )}
          </div>
        </SectionCard>

        {/* ATIVIDADE RECENTE */}

        <SectionCard
          title={tr("Atividade recente")}
          subtitle={tr("Últimas movimentações na sua conta.")}
          icon={
            <ClockIcon size={21} />
          }
          onSeeAll={() =>
            onNav("historico")
          }
          seeAllLabel={tr("Ver todos")}
        >
          <div>
            {atividades.map(
              (item) => (
                <div
                  key={`${tr(item.title)}-${item.time}`}
                  className="
                    flex gap-3
                    border-b
                    border-[#EFF3F8]
                    px-5 py-[13px]
                    last:border-0
                    dark:border-[#22344C]
                  "
                >
                  <div
                    className={`
                      flex h-9 w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      ${toneStyles[
                        item.tone
                      ].icon
                      }
                    `}
                  >
                    {item.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-heading text-[14px] font-semibold text-[#0A2B77] dark:text-white">
                      {tr(item.title)}
                    </p>

                    <p className="mt-1 truncate font-body text-[12.5px] text-[#71809A] dark:text-[#A2B0C4]">
                      {
                        item.description
                      }
                    </p>
                  </div>

                  <span className="shrink-0 font-body text-[12px] text-[#5C78BC]">
                    {item.time}
                  </span>
                </div>
              ),
            )}
          </div>
        </SectionCard>

        {/* ALERTAS IMPORTANTES */}

        <SectionCard
          title={tr("Alertas importantes")}
          subtitle={tr("Pontos de atenção que precisam da sua ação.")}
          icon={
            <AlertTriangleIcon
              size={21}
            />
          }
          onSeeAll={() =>
            onNav("relatorios")
          }
          seeAllLabel={tr("Ver todos")}
        >
          <div>
            {alertas.map(
              (alerta) => (
                <button
                  type="button"
                  key={`${tr(alerta.title)}-${alerta.time}`}
                  onClick={() =>
                    abrirAlerta(
                      alerta.id,
                    )
                  }
                  className="
                    group flex w-full
                    gap-3
                    border-b
                    border-[#EFF3F8]
                    px-5 py-[13px]
                    text-left
                    transition-colors
                    last:border-0
                    hover:bg-[#F5F9FF]
                    dark:border-[#22344C]
                    dark:hover:bg-[#13233B]
                  "
                >
                  <div
                    className={`
                      flex h-9 w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      ${toneStyles[
                        alerta.tone
                      ].icon
                      }
                    `}
                  >
                    <AlertTriangleIcon
                      size={17}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-heading text-[14px] font-semibold text-[#0A2B77] dark:text-white">
                      {tr(alerta.title)}
                    </p>

                    <p className="mt-1 font-body text-[12.5px] leading-[1.35] text-[#71809A] dark:text-[#A2B0C4]">
                      {
                        alerta.description
                      }
                    </p>
                  </div>

                  <div className="flex shrink-0 items-start gap-2">
                    <span className="font-body text-[12px] text-[#5C78BC]">
                      {alerta.time}
                    </span>

                    <ChevronRightIcon
                      size={15}
                      className="
                        mt-[1px]
                        text-[#95A8C3]
                        transition-all
                        group-hover:translate-x-1
                        group-hover:text-[#0B63F6]
                      "
                    />
                  </div>
                </button>
              ),
            )}
          </div>
        </SectionCard>
      </div>

      {/* ==================== PARTE INFERIOR ==================== */}

      <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">

        {/* REUNIÕES RECENTES */}

        <SectionCard
          title={tr("Reuniões recentes")}
          subtitle={tr("Suas últimas reuniões e respectivos status.")}
          icon={
            <FileTextIcon
              size={21}
            />
          }
          onSeeAll={() =>
            onNav("transcricoes")
          }
          seeAllLabel={tr("Ver todos")}
        >
          <div className="w-full max-w-full overflow-x-auto">
            <table className="w-full min-w-[650px] border-collapse">
              <thead>
                <tr className="border-b border-[#EDF2F7] dark:border-[#22344C]">
                  <th className="px-5 py-3 text-left font-body text-[12px] font-medium text-[#637594]">
                    {tr("Reunião")}
                  </th>

                  <th className="px-3 py-3 text-left font-body text-[12px] font-medium text-[#637594]">
                    {tr("Cliente")}
                  </th>

                  <th className="px-3 py-3 text-left font-body text-[12px] font-medium text-[#637594]">
                    {tr("Data")}
                  </th>

                  <th className="px-3 py-3 text-left font-body text-[12px] font-medium text-[#637594]">
                    {tr("Status")}
                  </th>

                  <th className="px-5 py-3 text-center font-body text-[12px] font-medium text-[#637594]">
                    {tr("Ações")}
                  </th>
                </tr>
              </thead>

              <tbody>
                {reunioes.map(
                  (reuniao) => (
                    <tr
                      key={`${reuniao.meeting}-${reuniao.date}`}
                      className="border-b border-[#F0F3F7] last:border-0 dark:border-[#203149]"
                    >
                      <td className="px-5 py-3 font-body text-[13px] font-medium text-[#173B84] dark:text-[#D9E5F7]">
                        {
                          reuniao.meeting
                        }
                      </td>

                      <td className="px-3 py-3 font-body text-[13px] text-[#536C9F] dark:text-[#A6B6CC]">
                        {
                          reuniao.client
                        }
                      </td>

                      <td className="px-3 py-3 font-body text-[13px] text-[#536C9F] dark:text-[#A6B6CC]">
                        {
                          reuniao.date
                        }
                      </td>

                      <td className="px-3 py-3">
                        <span
                          className={`
                            rounded-md
                            px-3 py-1
                            font-body
                            text-[12px]
                            font-medium
                            ${toneStyles[
                              reuniao
                                .tone
                            ].badge
                            }
                          `}
                        >
                          {
                            reuniao.status
                          }
                        </span>
                      </td>

                      <td className="px-5 py-3 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            onNav(
                              "transcricoes",
                            )
                          }
                          className="
                            font-heading
                            text-[16px]
                            text-[#164EC1]
                            hover:text-[#06369E]
                          "
                          aria-label={tr("Abrir reunião")}
                        >
                          •••
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* CLIENTES PRIORITÁRIOS */}

        <SectionCard
          title={tr("Clientes prioritários")}
          subtitle={tr("Contas que merecem sua atenção no momento.")}
          icon={
            <UsersIcon size={21} />
          }
          onSeeAll={() =>
            onNav("clientes")
          }
          seeAllLabel={tr("Ver todos")}
        >
          <div className="w-full max-w-full overflow-x-auto">
            <table className="w-full min-w-[580px] border-collapse">
              <thead>
                <tr className="border-b border-[#EDF2F7] dark:border-[#22344C]">
                  <th className="px-5 py-3 text-left font-body text-[12px] font-medium text-[#637594]">
                    {tr("Cliente")}
                  </th>

                  <th className="px-3 py-3 text-left font-body text-[12px] font-medium text-[#637594]">
                    {tr("Risco")}
                  </th>

                  <th className="px-3 py-3 text-center font-body text-[12px] font-medium text-[#637594]">
                    {tr("Oportunidades")}
                  </th>

                  <th className="px-5 py-3 text-right font-body text-[12px] font-medium text-[#637594]">
                    {tr("Última reunião")}
                  </th>
                </tr>
              </thead>

              <tbody>
                {clientes.map(
                  (cliente) => (
                    <tr
                      key={
                        cliente.name
                      }
                      className="
                        cursor-pointer
                        border-b
                        border-[#F0F3F7]
                        transition-colors
                        last:border-0
                        hover:bg-[#F7FAFF]
                        dark:border-[#203149]
                        dark:hover:bg-[#13233B]
                      "
                      onClick={() =>
                        onNav(
                          "clientes",
                        )
                      }
                    >
                      <td className="px-5 py-[10px]">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1261E8] font-heading text-[11px] font-semibold text-white">
                            {
                              cliente.initials
                            }
                          </div>

                          <span className="font-body text-[13px] font-semibold text-[#133C8D] dark:text-[#D9E5F7]">
                            {
                              cliente.name
                            }
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-[10px]">
                        <span
                          className={`
                            rounded-md
                            px-3 py-1
                            font-body
                            text-[12px]
                            font-medium
                            ${toneStyles[
                              cliente
                                .tone
                            ].badge
                            }
                          `}
                        >
                          {
                            cliente.risk
                          }
                        </span>
                      </td>

                      <td className="px-3 py-[10px] text-center font-body text-[13px] text-[#173B84] dark:text-[#D4E1F4]">
                        {
                          cliente.opportunities
                        }
                      </td>

                      <td className="px-5 py-[10px] text-right font-body text-[13px] text-[#536C9F] dark:text-[#A6B6CC]">
                        {
                          cliente.lastMeeting
                        }
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}