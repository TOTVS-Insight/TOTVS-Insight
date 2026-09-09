import { useCallback, useState } from "react";
import { GRADIENT_BRAND } from "@/theme";
import type { NavId } from "@/navigation";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/useLocale";
import useClickOutside from "@/hooks/useClickOutside";
import { ChevronDownIcon, HelpIcon, LogoutIcon, SettingsIcon, UserIcon } from "@/icons";

interface ItemMenu {
  icon: React.ReactNode;
  label: string;
  /** Página para onde o item navega. Omitido em itens ainda sem destino. */
  destino?: NavId;
}

export interface UserDropdownProps {
  onLogout?: () => void;
  /** Navega para uma página do dashboard. */
  onNav?: (id: NavId) => void;
}

export default function UserDropdown({ onLogout, onNav }: UserDropdownProps) {
  const { usuario } = useAuth();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useClickOutside<HTMLDivElement>(open, close);

  // O dropdown só existe dentro do dashboard, que exige sessão ativa.
  if (!usuario) return null;

  const menuItems: ItemMenu[] = [
    { icon: <UserIcon size={14} />, label: t("userMenu.profile"), destino: "perfil" },
    {
      icon: <SettingsIcon size={14} />,
      label: t("userMenu.settings"),
      destino: "configuracoes",
    },
    { icon: <HelpIcon size={14} />, label: t("userMenu.help"), destino: "ajuda" },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-white/10"
      >
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-white/30 bg-brand-blue">
          {usuario.foto ? <img src={usuario.foto} alt="Foto do perfil" className="h-full w-full rounded-full object-cover" /> : <span className="font-heading text-micro font-bold text-white">{usuario.iniciais}</span>}
        </div>
        <div className="hidden flex-col text-left sm:flex">
          <span className="font-heading text-meta leading-tight font-medium text-white">
            {usuario.nome}
          </span>
          <span className="font-body text-micro leading-tight text-white/60">{usuario.cargo}</span>
        </div>
        <span
          className="flex-shrink-0 text-white/60"
          style={{
            display: "inline-flex",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          <ChevronDownIcon size={12} />
        </span>
      </button>

      {/* Painel */}
      <div
        role="menu"
        className="absolute top-full right-0 z-50 mt-2 w-[min(16rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-gray-100 bg-brand-card shadow-xl"
        style={{
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0) scale(1)" : "translateY(-8px) scale(0.97)",
          transition: "opacity 0.18s ease, transform 0.18s ease",
          pointerEvents: open ? "all" : "none",
        }}
      >
        {/* Cabeçalho com o perfil */}
        <div className="px-4 py-4" style={{ background: GRADIENT_BRAND }}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-2 border-white/30 bg-brand-blue">
              {usuario.foto ? <img src={usuario.foto} alt="Foto do perfil" className="h-full w-full rounded-full object-cover" /> : <span className="font-heading text-sm font-bold text-white">{usuario.iniciais}</span>}
            </div>
            <div className="min-w-0">
              <p className="font-heading text-sm leading-tight font-semibold text-white">
                {usuario.nome}
              </p>
              <p className="font-body text-meta text-white/70">{usuario.cargo}</p>
              <p className="font-body mt-0.5 truncate text-micro text-white/50">{usuario.email}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            {usuario.stats.map((s) => (
              <div key={s.label} className="flex-1 rounded-lg bg-white/10 px-2 py-1.5 text-center">
                <p className="font-heading text-sm font-bold text-white">{s.value}</p>
                <p className="font-body text-micro text-white/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Itens do menu */}
        <div className="py-1">
          {menuItems.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              onClick={() => {
                close();
                if (item.destino) onNav?.(item.destino);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-brand-text transition-colors hover:bg-gray-50"
            >
              <span className="text-gray-400">{item.icon}</span>
              <span className="font-body flex-1 text-xs">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Sair */}
        <div className="border-t border-gray-100 py-1">
          <button
            role="menuitem"
            onClick={() => {
              close();
              onLogout?.();
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-red-500 transition-colors hover:bg-red-50"
          >
            <LogoutIcon size={14} />
            <span className="font-body text-xs">{t("userMenu.logout")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
