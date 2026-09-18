import { GRADIENT_BRAND } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";
import { useLocale } from "@/i18n/useLocale";
import type { NavId } from "@/navigation";

import {
  MenuIcon,
  MoonIcon,
  SearchIcon,
  SunIcon,
} from "@/icons";

import NotificationsDropdown from "./NotificationsDropdown";
import UserDropdown from "./UserDropdown";

export interface HeaderProps {
  onLogout?: () => void;
  onNav?: (id: NavId) => void;
  onMenuClick?: () => void;
  menuOpen?: boolean;
}

export default function Header({
  onLogout,
  onNav,
  onMenuClick,
  menuOpen,
}: HeaderProps) {
  const { resolvido, alternar } =
    useTheme();

  const { t } = useLocale();

  const escuro =
    resolvido === "escuro";

  const themeTitle = escuro
    ? t("header.themeToLight")
    : t("header.themeToDark");

  const menuLabel = menuOpen
    ? t("header.closeMenu")
    : t("header.openMenu");

  return (
    <header
      className="
        sticky top-0 z-10
        flex h-[66px]
        items-center gap-3
        px-4
        sm:px-6
      "
      style={{
        background: GRADIENT_BRAND,
      }}
    >
      {onMenuClick && (
        <button
          type="button"
          onClick={onMenuClick}
          title={menuLabel}
          aria-label={menuLabel}
          aria-expanded={menuOpen}
          className="rounded-lg p-1.5 text-white transition-colors hover:bg-white/10 md:hidden"
        >
          <MenuIcon size={22} />
        </button>
      )}

      {/* Busca central */}
      <div className="hidden min-w-0 flex-1 justify-center md:flex">
        <div
          className="
            flex h-[40px]
            w-full max-w-[460px]
            items-center gap-3
            rounded-[10px]
            border border-white/10
            bg-[#071A51]/65
            px-4
            text-white
            shadow-sm
          "
        >
          <SearchIcon size={19} />

          <input
            type="text"
            placeholder="Buscar reuniões, clientes, análises..."
            className="
              min-w-0 flex-1
              border-none
              bg-transparent
              font-body text-[13px]
              text-white
              outline-none
              placeholder:text-white/65
            "
          />

          <span className="shrink-0 font-body text-[12px] text-white/60">
            Ctrl + K
          </span>
        </div>
      </div>

      {/* Direita */}
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={alternar}
          title={themeTitle}
          aria-label={themeTitle}
          className="rounded-lg p-2 text-white transition-colors hover:bg-white/10"
        >
          {escuro ? (
            <SunIcon size={19} />
          ) : (
            <MoonIcon size={19} />
          )}
        </button>

        <NotificationsDropdown />

        <UserDropdown
          onLogout={onLogout}
          onNav={onNav}
        />
      </div>
    </header>
  );
}