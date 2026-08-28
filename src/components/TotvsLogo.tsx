import logoUrl from "../assets/Vector.svg";

/*
 * PONTO ÚNICO DE TROCA DA LOGO
 * ────────────────────────────
 * Símbolo TOTVS (ícone com recorte), sem wordmark — PNG local com fundo
 * transparente em `src/assets/totvs-logo.png`.
 */

export interface TotvsLogoProps {
  className?: string;
  /**
   * `light` = branco (fundos escuros). `dark` = preto/navy (fundos claros).
   */
  tone?: "light" | "dark";
}

export default function TotvsLogo({ className = "h-8 w-8", tone = "light" }: TotvsLogoProps) {
  return (
    <img
      src={logoUrl}
      alt="TOTVS"
      className={`object-contain ${className}`}
      /*
       * O asset já é branco sobre transparente. Em tom escuro, brightness(0)
       * transforma o branco em preto para contraste em fundo claro.
       */
      style={tone === "dark" ? { filter: "brightness(0)" } : undefined}
    />
  );
}

/** Logo + wordmark "TOTVS Insight", travados no mesmo alinhamento vertical. */
export function TotvsLogoLockup({
  className = "",
  logoClassName = "h-8 w-8",
  tone = "light",
}: TotvsLogoProps & { logoClassName?: string }) {
  return (
    <div className={`flex min-w-0 items-center gap-2.5 ${className}`}>
      <TotvsLogo className={`flex-shrink-0 ${logoClassName}`} tone={tone} />
      <span
        className={`font-heading truncate text-sm leading-tight ${
          tone === "light" ? "text-white" : "text-brand-text"
        }`}
      >
        TOTVS Insight
      </span>
    </div>
  );
}
