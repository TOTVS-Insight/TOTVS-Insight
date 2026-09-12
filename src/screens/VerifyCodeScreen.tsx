import { useRef, useState, type KeyboardEvent } from "react";
import type { AuthScreen } from "@/navigation";
import { useLocale } from "@/i18n/useLocale";
import { ShieldCheckIcon } from "@/icons";

const CODE_LENGTH = 6;

export default function VerifyCodeScreen({
  onNav,
}: {
  onNav: (screen: AuthScreen) => void;
}) {
  const [digits, setDigits] = useState<string[]>(
    Array(CODE_LENGTH).fill("")
  );

  const { t } = useLocale();
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  function handleDigit(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;

    const next = [...digits];
    next[index] = value;

    setDigits(next);

    if (value && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (
      e.key === "Backspace" &&
      !digits[index] &&
      index > 0
    ) {
      inputs.current[index - 1]?.focus();
    }
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
      <div
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
          {/* ÍCONE ESCUDO */}
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
            <ShieldCheckIcon size={68} />
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
              src="/logo_azul.svg"
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
            {t("auth.verifySubtitle")}
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
            md:py-[45px]
          "
        >
          {/* TÍTULO */}
          <p
            className="
              mb-[18px]
              text-[18px]
              font-semibold
              text-[#17283e]
            "
          >
            {t("auth.verifyTitle")}
          </p>

          {/* CAMPOS DO CÓDIGO */}
          <div
            className="
              mb-[40px]
              flex
              items-center
              gap-2
              sm:gap-[14px]
            "
          >
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(element) => {
                  inputs.current[i] = element;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                aria-label={t("auth.verifyDigit", { i: i + 1, n: CODE_LENGTH })}
                onChange={(e) =>
                  handleDigit(i, e.target.value)
                }
                onKeyDown={(e) =>
                  handleKeyDown(i, e)
                }
                className="
                  h-[52px]
                  w-[40px]
                  sm:h-[58px]
                  sm:w-[52px]
                  rounded-[7px]
                  border
                  border-[#9caabb]
                  bg-white
                  text-center
                  text-[22px]
                  font-bold
                  text-[#17283e]
                  shadow-[0_2px_4px_rgba(0,0,0,0.10)]
                  outline-none
                  transition

                  focus:border-[#1452ab]
                  focus:ring-2
                  focus:ring-[#1452ab]/20
                "
              />
            ))}
          </div>

          {/* BOTÃO */}
          <button
            type="button"
            onClick={() => onNav("new-password")}
            className="
              flex
              h-[58px]
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
            "
          >
            {t("auth.verifySubmit")}
          </button>

          {/* LINKS */}
          <div
            className="
              mt-[14px]
              flex
              flex-col
              items-start
              gap-[10px]
            "
          >
            <button
              type="button"
              className="
                text-[13px]
                font-semibold
                text-[#064da5]
                transition
                hover:underline
              "
            >
              {t("auth.verifyResend")}
            </button>

            <button
              type="button"
              onClick={() => onNav("login")}
              className="
                text-[13px]
                font-semibold
                text-[#064da5]
                transition
                hover:underline
              "
            >
              {t("auth.backToLogin")}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}