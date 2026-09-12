import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { SIDEBAR_WIDTH } from "@/theme";
import type { NavId } from "@/navigation";
import { DASHBOARD_PATHS, navFromPath, pathForNav } from "@/navigation";
import { useLocale } from "@/i18n/useLocale";
import useMediaQuery from "@/hooks/useMediaQuery";
import { ChevronLeftIcon } from "@/icons";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import PageRouter from "@/pages/PageRouter";

/** Metade da largura do botão — o que o faz montar sobre a borda da sidebar. */
const TOGGLE_OVERLAP = 12;

/** Tailwind `md` — a partir daqui a sidebar volta a ser docked. */
const DESKTOP_MQ = "(min-width: 768px)";

function isKnownDashboardPath(pathname: string): boolean {
  const p = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return p === "/" || DASHBOARD_PATHS.includes(p);
}

export default function DashboardScreen({ onLogout }: { onLogout: () => void }) {
  const { t } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery(DESKTOP_MQ);
  /** Desktop: sidebar recolhida. */
  const [collapsed, setCollapsed] = useState(false);
  /** Mobile: drawer aberto. */
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeNav = navFromPath(location.pathname);
  const onNav = (id: NavId) => {
    navigate(pathForNav(id));
  };

  useEffect(() => {
    if (isDesktop) setDrawerOpen(false);
  }, [isDesktop]);

  if (!isKnownDashboardPath(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  const sidebarOpen = isDesktop ? !collapsed : drawerOpen;
  const sidebarMode = isDesktop ? "dock" : "drawer";
  const contentOffset = isDesktop && !collapsed ? SIDEBAR_WIDTH : 0;
  const toggleLabel = collapsed ? t("sidebar.expand") : t("sidebar.collapse");
  const toggleLeft = collapsed ? 8 : SIDEBAR_WIDTH - TOGGLE_OVERLAP;

  return (
    <div className="flex min-h-screen bg-brand-surface">
      <Sidebar
        active={activeNav}
        onNav={onNav}
        onLogout={onLogout}
        open={sidebarOpen}
        mode={sidebarMode}
        onClose={() => setDrawerOpen(false)}
      />

      {/* Backdrop do drawer mobile */}
      {!isDesktop && drawerOpen && (
        <button
          type="button"
          aria-label={t("header.closeMenu")}
          className="fixed inset-0 z-30 bg-black/45 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/*
       * Botão de recolher/expandir — só no desktop.
       *
       * Vive aqui, e não dentro da Sidebar, porque o modo `dock` usa
       * `overflow:hidden` para animar a largura.
       */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        title={toggleLabel}
        aria-label={toggleLabel}
        aria-expanded={!collapsed}
        className="fixed top-1/2 z-30 hidden h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-brand-blue text-white shadow-md transition-colors hover:bg-brand-dark md:flex"
        style={{
          left: toggleLeft,
          transform: "translateY(-50%)",
          transition: "left 0.3s ease, background-color 0.2s ease",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
          }}
        >
          <ChevronLeftIcon size={10} />
        </span>
      </button>

      <div
        className="flex min-w-0 flex-1 flex-col"
        style={{
          marginLeft: contentOffset,
          transition: isDesktop ? "margin-left 0.3s ease" : undefined,
        }}
      >
        <Header
          onLogout={onLogout}
          onNav={onNav}
          onMenuClick={() => setDrawerOpen((o) => !o)}
          menuOpen={drawerOpen}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <PageRouter activeNav={activeNav} onNav={onNav} />
          </div>
        </main>
      </div>
    </div>
  );
}
