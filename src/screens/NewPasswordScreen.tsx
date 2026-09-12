import { useState } from "react";
import type { AuthScreen } from "@/navigation";
import { useLocale } from "@/i18n/useLocale";
import { CheckIcon, EyeIcon, LockIcon } from "@/icons";
import logo from "../assets/logo.svg";

/** Regras de força da senha. */
export function passwordChecks(password: string) {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    special:
      /[^a-zA-Z0-9]/.test(password) &&
      /[0-9]/.test(password),
  };
}

export default function NewPasswordScreen({
  onNav,
}: {
  onNav: (screen: AuthScreen) => void;
}) {
  const { t } = useLocale();
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const checks = passwordChecks(pass);

  const senhasIguais =
    pass.length > 0 &&
    confirm.length > 0 &&
    pass === confirm;

  const podeSalvar =
    checks.length &&
    checks.upper &&
    checks.special &&
    senhasIguais;

  function salvarSenha(e: React.FormEvent) {
    e.preventDefault();

    if (!podeSalvar) return;

    onNav("login");
  }

  return (
    <main
      className="
        flex
        min-h-screen
        w-full
        items-center
        justify-center
        py-6
        bg-[linear-gradient(110deg,#20236f_0%,#183b80_35%,#0878b4_68%,#06aede_100%)]
        px-6
      "
    >
      <form
        onSubmit={salvarSenha}
        className="
          grid
          w-full
          max-w-[1120px]
          grid-cols-1
          overflow-hidden
          rounded-[28px]
          md:h-[72vh]
          md:max-h-[570px]
          md:min-h-[470px]
          md:w-[86vw]
          md:grid-cols-[42%_58%]
          md:rounded-[42px]
          bg-[linear-gradient(120deg,#eef4ff_0%,#d9efff_100%)]
          shadow-[0_15px_35px_rgba(0,0,0,0.12)]
        "
      >
        {/* LADO ESQUERDO */}
        <section
          className="
            relative
            flex
            flex-col
            items-center
            justify-center
            px-6
            pt-8
            md:px-[55px]
            md:pt-0
          "
        >
          {/* ÍCONE DE CADEADO */}
          <div
            className="
              mb-[28px]
              hidden
              md:flex
              h-[110px]
              w-[110px]
              items-center
              justify-center
              rounded-full
              border-[2px]
              border-white
              text-[#13273e]
            "
          >
            <LockIcon size={64} />
          </div>

          {/* LOGO */}
          <div
            className="
              mb-[28px]
              flex
              items-center
              justify-center
              gap-[10px]
            "
          >
            <img
              src={logo}
              alt=""
              className="
                h-[42px]
                w-[42px]
                object-contain
              "
            />

            <span
              className="
                text-[23px]
                font-bold
                tracking-[-0.5px]
                text-[#17283e]
              "
            >
              TOTVS Insight
            </span>
          </div>

          {/* TEXTO */}
          <p
            className="
              max-w-[280px]
              text-center
              text-[15px]
              md:text-left
              md:text-[18px]
              font-semibold
              leading-[1.7]
              text-[#17283e]
            "
          >
            {t("auth.newPassSubtitle")}
          </p>

          {/* DIVISÓRIA */}
          <div
            className="
              absolute
              right-0
              top-[10%]
              hidden
              md:block
              h-[80%]
              w-[2px]
              bg-white/90
            "
          />
        </section>

        {/* LADO DIREITO */}
        <section
          className="
            flex
            flex-col
            justify-center
            px-6
            py-8
            md:px-[68px]
            md:py-[38px]
          "
        >
          {/* NOVA SENHA */}
          <div className="mb-[18px]">
            <label
              htmlFor="new-password"
              className="
                mb-[7px]
                block
                text-[16px]
                font-semibold
                text-[#17283e]
              "
            >
              {t("auth.newPassField")}
            </label>

            <div className="relative">
              <input
                id="new-password"
                type={showPass ? "text" : "password"}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                autoComplete="new-password"
                placeholder="••••••••••••"
                className="
                  h-[52px]
                  w-full
                  rounded-[7px]
                  border
                  border-[#9caabb]
                  bg-white
                  px-[16px]
                  pr-[48px]
                  text-[15px]
                  text-[#17283e]
                  shadow-[0_2px_5px_rgba(0,0,0,0.14)]
                  outline-none
                  transition
                  focus:border-[#1452ab]
                  focus:ring-2
                  focus:ring-[#1452ab]/20
                "
              />

              <button
                type="button"
                onClick={() =>
                  setShowPass((valor) => !valor)
                }
                aria-label={
                  showPass
                    ? t("auth.hidePassword")
                    : t("auth.showPassword")
                }
                className="
                  absolute
                  right-[14px]
                  top-1/2
                  -translate-y-1/2
                  text-[#435269]
                  transition
                  hover:text-[#17283e]
                "
              >
                <EyeIcon open={showPass} />
              </button>
            </div>
          </div>

          {/* CONFIRMAR SENHA */}
          <div className="mb-[22px]">
            <label
              htmlFor="confirm-password"
              className="
                mb-[7px]
                block
                text-[16px]
                font-semibold
                text-[#17283e]
              "
            >
              {t("auth.newPassConfirm")}
            </label>

            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) =>
                  setConfirm(e.target.value)
                }
                autoComplete="new-password"
                placeholder="••••••••••••"
                className={`
                  h-[52px]
                  w-full
                  rounded-[7px]
                  border
                  bg-white
                  px-[16px]
                  pr-[48px]
                  text-[15px]
                  text-[#17283e]
                  shadow-[0_2px_5px_rgba(0,0,0,0.14)]
                  outline-none
                  transition
                  focus:border-[#1452ab]
                  focus:ring-2
                  focus:ring-[#1452ab]/20

                  ${confirm.length > 0 &&
                    pass !== confirm
                    ? "border-red-400"
                    : "border-[#9caabb]"
                  }
                `}
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirm((valor) => !valor)
                }
                aria-label={
                  showConfirm
                    ? t("auth.hidePassword")
                    : t("auth.showPassword")
                }
                className="
                  absolute
                  right-[14px]
                  top-1/2
                  -translate-y-1/2
                  text-[#435269]
                  transition
                  hover:text-[#17283e]
                "
              >
                <EyeIcon open={showConfirm} />
              </button>
            </div>
          </div>

          {/* REGRAS */}
          <div
            className="
              mb-[26px]
              flex
              flex-col
              gap-[12px]
            "
          >
            <RuleItem
              ok={checks.length}
              label={t("auth.ruleMin")}
            />

            <RuleItem
              ok={checks.upper}
              label={t("auth.ruleUpper")}
            />

            <RuleItem
              ok={checks.special}
              label={t("auth.ruleSpecial")}
            />
          </div>
          

          {/* BOTÃO */}
          <button
            type="submit"
            disabled={!podeSalvar}
            className="
              flex
              h-[55px]
              w-full
              items-center
              justify-center
              rounded-[7px]
              bg-[#064da5]
              text-[16px]
              font-semibold
              text-white
              shadow-[0_3px_6px_rgba(0,0,0,0.16)]
              transition
              hover:bg-[#043f8a]
              active:translate-y-[1px]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {t("auth.newPassSubmit")}
          </button>
          <div className="mt-[12px] text-center">
            <button
              type="button"
              onClick={() => onNav("verify-code")}
              className="
      text-[13px]
      font-semibold
      text-[#064da5]
      transition
      hover:underline
    "
            >
              {t("auth.back")}
            </button>
          </div>
        </section>
      </form>
    </main>
  );
}

/* ITEM DAS REGRAS */
function RuleItem({
  ok,
  label,
}: {
  ok: boolean;
  label: string;
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-[10px]
      "
    >
      <div
        className={`
          flex
          h-[20px]
          w-[20px]
          shrink-0
          items-center
          justify-center
          rounded-full
          transition

          ${ok
            ? "bg-[#16c73b] text-white"
            : "bg-[#aeb8c4] text-white"
          }
        `}
      >
        <CheckIcon size={12} />
      </div>

      <span
        className="
          text-[14px]
          font-semibold
          text-[#17283e]
        "
      >
        {label}
      </span>
    </div>
  );
}