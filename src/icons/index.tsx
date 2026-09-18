/**
 * Biblioteca de ícones da aplicação.
 *
 * Todos os ícones herdam a cor do texto (`currentColor`), então a cor é
 * controlada pela classe do elemento pai (`text-white`, `text-brand-blue`…).
 * O tamanho padrão é 16px e pode ser sobrescrito via prop `size`.
 */

export interface IconProps {
  /** Lado do ícone em px. Padrão: 16. */
  size?: number;
  className?: string;
}

/** Base para ícones traçados (stroke), que é o padrão do conjunto. */
function StrokeIcon({
  size = 16,
  className,
  strokeWidth = 2,
  viewBox = "0 0 24 24",
  children,
}: IconProps & {
  strokeWidth?: number;
  viewBox?: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

// ─── Navegação ───────────────────────────────────────────────────────────────

export function GridIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </StrokeIcon>
  );
}

export function FileTextIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </StrokeIcon>
  );
}

export function QueueIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </StrokeIcon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <polyline points="12 8 12 12 14 14" />
      <path d="M3.05 11a9 9 0 111.294 4.547" />
      <polyline points="3 7 3 11 7 11" />
    </StrokeIcon>
  );
}

export function BarChartIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </StrokeIcon>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </StrokeIcon>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 00-14.14 0M4.93 19.07a10 10 0 0014.14 0M12 2v2M12 20v2M2 12H4M20 12h2" />
    </StrokeIcon>
  );
}

// ─── Ações e interface ───────────────────────────────────────────────────────

export function SearchIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </StrokeIcon>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
    </StrokeIcon>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </StrokeIcon>
  );
}

export function HelpIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </StrokeIcon>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </StrokeIcon>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </StrokeIcon>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </StrokeIcon>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </StrokeIcon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <polyline points="6 9 12 15 18 9" />
    </StrokeIcon>
  );
}

/** Chevron apontando para a esquerda. Gire 180° para apontar à direita. */
export function ChevronLeftIcon({ size = 10, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M6.5 1.5L3 5l3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EyeIcon({ open, ...props }: IconProps & { open: boolean }) {
  return open ? (
    <StrokeIcon {...props}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </StrokeIcon>
  ) : (
    <StrokeIcon {...props}>
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </StrokeIcon>
  );
}

// ─── Autenticação ────────────────────────────────────────────────────────────

export function MailIcon(props: IconProps) {
  return (
    <StrokeIcon strokeWidth={1.8} {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
    </StrokeIcon>
  );
}

export function ShieldCheckIcon(props: IconProps) {
  return (
    <StrokeIcon strokeWidth={1.8} {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </StrokeIcon>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </StrokeIcon>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <StrokeIcon strokeWidth={1.8} {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </StrokeIcon>
  );
}

// ─── Status e feedback ───────────────────────────────────────────────────────

export function InfoIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </StrokeIcon>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </StrokeIcon>
  );
}

export function AlertTriangleIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </StrokeIcon>
  );
}

export function XCircleIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </StrokeIcon>
  );
}

export function CheckIcon({ size = 8, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 8 8"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M1.5 4l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// ─── Indicadores de KPI ──────────────────────────────────────────────────────

export function TrendingUpIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </StrokeIcon>
  );
}

export function SmileIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
    </StrokeIcon>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </StrokeIcon>
  );
}

/** Triângulo cheio usado como seta de variação nos cards de KPI. */
export function TriangleIcon({ size = 10, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 1l4 5H1l4-5z" fill="currentColor" />
    </svg>
  );
}

// ─── Tema ────────────────────────────────────────────────────────────────────

export function SunIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </StrokeIcon>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M21 14.5A8.5 8.5 0 1110.5 3a7 7 0 0010.5 11.5z" />
    </StrokeIcon>
  );
}

/** Três barras — menu hamburger no header mobile. */
export function MenuIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </StrokeIcon>
  );
}

/** X de fechar (drawer mobile). */
export function CloseIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </StrokeIcon>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10.5V20h14v-9.5" />
      <path d="M9 20v-6h6v6" />
    </StrokeIcon>
  );
}

export function VideoIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="m16 10 5-3v10l-5-3z" />
    </StrokeIcon>
  );
}

export function ChevronRightIcon({
  size = 16,
  className,
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M12 3l1.1 3.1L16 7.2l-2.9 1.1L12 11.5l-1.1-3.2L8 7.2l2.9-1.1L12 3z" />
      <path d="M18 13l.8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8L18 13z" />
      <path d="M6 13l.7 1.8 1.8.7-1.8.7L6 18l-.7-1.8-1.8-.7 1.8-.7L6 13z" />
    </StrokeIcon>
  );
}
