import { useState } from "react";
import { GRADIENT_PANEL, SIDEBAR_WIDTH } from "@/theme";
import type { NavId } from "@/navigation";
import { useLocale } from "@/i18n/useLocale";
import { TotvsLogoLockup } from "@/components/TotvsLogo";

import {
  BarChartIcon,
  ClockIcon,
  CloseIcon,
  FileTextIcon,
  HomeIcon,
  QueueIcon,
  SettingsIcon,
  UsersIcon,
  VideoIcon,
} from "@/icons";

const LOGO_HOME_MS = 420;

const NAV_IDS: {
  id: NavId;
  key: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "inicio",
    key: "nav.home",
    icon: <HomeIcon size={20} />,
  },
  {
    id: "transcricoes",
    key: "nav.transcripts",
    icon: <FileTextIcon size={20} />,
  },
  {
    id: "fila",
    key: "nav.queue",
    icon: <QueueIcon size={20} />,
  },
  {
    id: "historico",
    key: "nav.history",
    icon: <ClockIcon size={20} />,
  },
  {
    id: "relatorios",
    key: "nav.reports",
    icon: <BarChartIcon size={20} />,
  },
  {
    id: "clientes",
    key: "nav.clients",
    icon: <UsersIcon size={20} />,
  },
  {
    id: "configuracoes",
    key: "nav.settings",
    icon: <SettingsIcon size={20} />,
  },
];

export interface SidebarProps {
  active: NavId;
  onNav: (id: NavId) => void;
  onLogout: () => void;
  open: boolean;
  mode: "dock" | "drawer";
  onClose?: () => void;
}

export default function Sidebar({
  active,
  onNav,
  open,
  mode,
  onClose,
}: SidebarProps) {
  const { t } = useLocale();

  const isDrawer = mode === "drawer";

  const [logoBump, setLogoBump] = useState(false);

  function navigate(id: NavId) {
    onNav(id);

    if (isDrawer) {
      onClose?.();
    }
  }

  function irParaInicio() {
    setLogoBump(true);

    window.setTimeout(
      () => setLogoBump(false),
      LOGO_HOME_MS,
    );

    navigate("inicio");
  }

  return (
    <aside
      className={`fixed left-0 top-0 flex h-screen flex-shrink-0 flex-col overflow-hidden ${
        isDrawer ? "z-40 shadow-2xl" : "z-20"
      }`}
      style={{
        width: SIDEBAR_WIDTH,
        background: GRADIENT_PANEL,

        ...(isDrawer
          ? {
              transform: open
                ? "translateX(0)"
                : "translateX(-100%)",

              transition: "transform 0.3s ease",
            }
          : {
              width: open
                ? SIDEBAR_WIDTH
                : 0,

              transition: "width 0.3s ease",
            }),
      }}
      aria-hidden={!open}
    >
      {/* Logo */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-5">
        <button
          type="button"
          onClick={irParaInicio}
          aria-label={t("nav.home")}
          className={`logo-home-btn min-w-0 rounded-md text-left ${
            logoBump
              ? "logo-home-bump"
              : ""
          }`}
        >
          <TotvsLogoLockup
            logoClassName="h-8 w-8"
            tone="light"
          />
        </button>

        {isDrawer && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t("header.closeMenu")}
            className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <CloseIcon size={20} />
          </button>
        )}
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto py-4">
        {NAV_IDS.map((item) => {
          const isActive =
            active === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                navigate(item.id)
              }
              aria-current={
                isActive
                  ? "page"
                  : undefined
              }
              className={`
                flex w-full items-center gap-3
                px-4 py-[13px]
                text-left
                font-body text-[14px]
                font-medium
                transition-colors

                ${
                  isActive
                    ? "bg-[#0868F7] text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              <span className="flex shrink-0">
                {item.icon}
              </span>

              <span className="truncate">
                {t(item.key)}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Card TOTVIS */}
      <div className="m-3 rounded-[12px] bg-[#082A74]/80 p-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0B63F6] text-white">
            <VideoIcon size={21} />
          </div>

          <div>
            <p className="font-heading text-[14px] font-semibold leading-[1.35] text-white">
              Iniciar reunião
              <br />
              com o TOTVIS
            </p>

            <p className="mt-2 font-body text-[12px] leading-[1.45] text-white/70">
              Capture e analise sua reunião em tempo real.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate("reuniao")
          }
          className="
            mt-4 w-full rounded-[7px]
            bg-[#0868F7]
            py-3
            font-body text-[14px]
            font-semibold text-white
            transition-colors
            hover:bg-[#0757D0]
          "
        >
          Iniciar reunião
        </button>
      </div>
    </aside>
  );
}