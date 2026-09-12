import { useState } from "react";
import type { AuthScreen } from "@/navigation";
import { useLocale } from "@/i18n/useLocale";
import { MailIcon, InfoIcon } from "@/icons";

export default function ForgotScreen({
  onNav,
}: {
  onNav: (screen: AuthScreen) => void;
}) {
  const { t } = useLocale();
  const [email, setEmail] = useState("");

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
          {/* Ícone de e-mail */}
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
            <MailIcon size={65} />
          </div>

          {/* Logo */}
          <div className="mb-[28px] flex items-center justify-center gap-[10px]">
            <img
              src="/logo_azul.svg"
              alt=""
              className="h-[42px] w-[42px] object-contain"
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

          {/* Texto */}
          <p
            className="
              max-w-[260px]
              text-center
              text-[15px]
              md:text-left
              md:text-[18px]
              font-semibold
              leading-[1.7]
              text-[#17283e]
            "
          >
            {t("auth.forgotSubtitle")}
          </p>

          {/* Linha divisória */}
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
          {/* E-mail */}
          <div className="mb-[28px]">
            <label
              htmlFor="email"
              className="
                mb-[12px]
                block
                text-[18px]
                font-semibold
                text-[#17283e]
              "
            >
              {t("auth.email")}
            </label>

            <input
              id="email"
              type="email"
              placeholder={t("auth.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              className="
                h-[58px]
                w-full
                rounded-[7px]
                border
                border-[#9caabb]
                bg-white
                px-[18px]
                text-[14px]
                font-medium
                text-[#25364b]
                shadow-[0_2px_5px_rgba(0,0,0,0.15)]
                outline-none
                transition
                placeholder:text-[#25364b]
                focus:border-[#1452ab]
              "
            />
          </div>

          {/* Receber código */}
          <button
            type="button"
            onClick={() => onNav("verify-code")}
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
            {t("auth.forgotSubmit")}
          </button>

          {/* Voltar */}
          <div className="mb-[24px] mt-[14px] text-center">
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

          {/* Informação */}
          <div
            className="
              flex
              min-h-[105px]
              w-full
              items-center
              gap-[20px]
              rounded-[7px]
              bg-[#064da5]
              px-4
              md:px-[28px]
              py-[18px]
              text-white
              shadow-[0_2px_5px_rgba(0,0,0,0.10)]
            "
          >
            <div
              className="
                flex
                h-[32px]
                w-[32px]
                shrink-0
                items-center
                justify-center
                rounded-full
                border-[2px]
                border-white
              "
            >
              <InfoIcon size={18} />
            </div>

            <p
              className="
                text-[13px]
                font-semibold
                leading-[1.35]
                md:text-[15px]
              "
            >
              {t("auth.forgotInfo")}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}