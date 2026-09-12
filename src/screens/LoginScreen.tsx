import { useState, type FormEvent } from "react";
import type { AuthScreen } from "@/navigation";
import { useAuth } from "@/auth/AuthContext";
import { validarCredenciais } from "@/auth/authService";
import type { ErrosFormulario } from "@/auth/types";
import { useLocale } from "@/i18n/useLocale";
import { AlertTriangleIcon, EyeIcon } from "@/icons";
import logo from "../assets/logo.svg";

export interface LoginScreenProps {
  onNav: (screen: AuthScreen) => void;
}

export default function LoginScreen({ onNav }: LoginScreenProps) {
  const { entrar } = useAuth();
  const { t } = useLocale();

  const [email, setEmail] = useState("rafael.almeida@totvs.com.br");
  const [senha, setSenha] = useState("Totvs@2026");
  const [showPass, setShowPass] = useState(false);

  const [erros, setErros] = useState<ErrosFormulario>({});
  const [erroLogin, setErroLogin] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function submeter(e?: FormEvent) {
    e?.preventDefault();

    if (carregando) return;

    setErroLogin(null);

    const errosCampos = validarCredenciais({
      email,
      senha,
    });

    setErros(errosCampos);

    if (Object.keys(errosCampos).length > 0) {
      return;
    }

    setCarregando(true);

    const erro = await entrar({
      email,
      senha,
    });

    setCarregando(false);

    if (erro) {
      setErroLogin(erro);
      setSenha("");
    }
  }

  function aoDigitar(
    campo: keyof ErrosFormulario,
    setter: (valor: string) => void
  ) {
    return (valor: string) => {
      setter(valor);

      if (erros[campo]) {
        setErros((estadoAtual) => ({
          ...estadoAtual,
          [campo]: undefined,
        }));
      }

      if (erroLogin) {
        setErroLogin(null);
      }
    };
  }

  return (
    <main
      className="
        flex
        min-h-screen
        w-full
        items-center
        justify-center
        overflow-hidden
        bg-[linear-gradient(110deg,#20236f_0%,#183b80_35%,#0878b4_68%,#06aede_100%)]
      "
    >
      <form
        onSubmit={submeter}
        className="
          flex
          h-[92vh]
          max-h-[710px]
          min-h-[620px]
          aspect-[0.92]
          justify-between
          flex-col
          rounded-[42px]
          bg-[linear-gradient(145deg,#eef5ff_0%,#dceeff_100%)]
          px-[68px]
          pb-[42px]
          pt-[45px]
          shadow-[0_15px_35px_rgba(0,0,0,0.12)]
        "
      >
        <div>
          {/* LOGO */}
          <div className="mb-[10px] flex items-center justify-center gap-[10px]">
            <img
              src={logo}
              alt="TOTVS"
              className="h-[65px] w-[65px] object-contain"
            />

            <span className="text-[35px] font-bold tracking-[-0.8px] text-[#17283e]">
              TOTVS Insight
            </span>
          </div>

          {/* SUBTÍTULO */}
          <p
            className="
      text-center
      text-[15px]
      font-medium
      leading-[16px]
      text-[#314156]
    "
          >
            Ativos, nível de serviços
            <br />
            e inventário inteligentes.
          </p>
        </div>

        <div>

        {/* ERRO DE LOGIN */}
        {erroLogin && (
          <div
            role="alert"
            className="
              mb-[16px]
              flex
              items-start
              gap-[8px]
              rounded-[7px]
              border
              border-red-200
              bg-red-50
              px-[12px]
              py-[10px]
            "
          >
            <span className="mt-[2px] shrink-0 text-red-500">
              <AlertTriangleIcon size={14} />
            </span>

            <p className="text-[11px] leading-[15px] text-red-600">
              {t(`auth.errors.${erroLogin}`)}
            </p>
          </div>
        )}

        {/* EMAIL */}
        <div className="mb-[21px]">
          <label
            htmlFor="email"
            className="
              mb-[7px]
              block
              text-[20px]
              font-semibold
              text-[#17283e]
            "
          >
            E-mail corporativo
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(evento) =>
              aoDigitar("email", setEmail)(evento.target.value)
            }
            disabled={carregando}
            autoComplete="username"
            className={`
              h-[54px]
              w-full
              rounded-[6px]
              border
              bg-white
              px-[14px]
              text-[14px]
              font-normal
              text-[#25364b]
              shadow-[0_2px_5px_rgba(0,0,0,0.16)]
              outline-none
              transition
              duration-150

              focus:border-[#1452ab]
              focus:ring-1
              focus:ring-[#1452ab]/20

              disabled:cursor-not-allowed
              disabled:opacity-70

              ${erros.email
                ? "border-red-400"
                : "border-[#9caabb]"
              }
            `}
          />

          {erros.email && (
            <p className="mt-[5px] text-[11px] text-red-500">
              {t(`auth.errors.${erros.email}`)}
            </p>
          )}
        </div>

        {/* SENHA */}
        <div className="mb-[30px]">
          <label
            htmlFor="senha"
            className="
              mb-[7px]
              block
              text-[20px]
              font-semibold
              text-[#17283e]
            "
          >
            Senha
          </label>

          <div className="relative">
            <input
              id="senha"
              type={showPass ? "text" : "password"}
              value={senha}
              onChange={(evento) =>
                aoDigitar("senha", setSenha)(evento.target.value)
              }
              disabled={carregando}
              autoComplete="current-password"
              className={`
                h-[54px]
                w-full
                rounded-[6px]
                border
                bg-white
                px-[14px]
                pr-[48px]
                text-[14px]
                text-[#25364b]
                shadow-[0_2px_5px_rgba(0,0,0,0.16)]
                outline-none
                transition
                duration-150

                focus:border-[#1452ab]
                focus:ring-1
                focus:ring-[#1452ab]/20

                disabled:cursor-not-allowed
                disabled:opacity-70

                ${erros.senha
                  ? "border-red-400"
                  : "border-[#9caabb]"
                }
              `}
            />

            </div>

            <button
              type="button"
              onClick={() => setShowPass((valorAtual) => !valorAtual)}
              disabled={carregando}
              aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
              className="
                absolute
                right-[14px]
                top-1/2
                flex
                -translate-y-1/2
                items-center
                justify-center
                text-[#435269]
                transition
                hover:text-[#17283e]
                disabled:opacity-50
              "
            >
              <EyeIcon open={showPass} />
            </button>
          </div>

          {erros.senha && (
            <p className="mt-[5px] text-[11px] text-red-500">
              {t(`auth.errors.${erros.senha}`)}
            </p>
          )}
        </div>

      <div>
        {/* BOTÃO ENTRAR */}
        <button
          type="submit"
          disabled={carregando}
          className="
            flex
            h-[55px]
            w-full
            shrink-0
            items-center
            justify-center
            rounded-[6px]
            bg-[#064da5]
            text-[20px]
            font-semibold
            text-white
            shadow-[0_3px_6px_rgba(0,0,0,0.20)]
            transition
            duration-150

            hover:bg-[#043f8a]

            active:translate-y-[1px]

            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>

        {/* ESQUECI MINHA SENHA */}
        <div className="mt-[18px] text-center">
          <button
            type="button"
            onClick={() => onNav("forgot")}
            disabled={carregando}
            className="
              text-[15px]
              font-medium
              text-[#1452ab]
              transition
              hover:underline
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            Esqueci minha senha
          </button>
          </div>
        </div>
      </form>
    </main>
  );
}