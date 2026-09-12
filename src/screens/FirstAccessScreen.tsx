import { useState } from "react";
import type { AuthScreen } from "@/navigation";
import { useLocale } from "@/i18n/useLocale";
import { EyeIcon, UserIcon } from "@/icons";
import { AuthCard, AuthHeading, AuthLeftPanel, GradientBg } from "@/components/layout/AuthLayout";
import InputField from "@/components/ui/InputField";
import InfoBox from "@/components/ui/InfoBox";
import LinkBtn from "@/components/ui/LinkBtn";
import PrimaryBtn from "@/components/ui/PrimaryBtn";


export default function FirstAccessScreen({ onNav }: { onNav: (screen: AuthScreen) => void }) {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [tempPass, setTempPass] = useState("");
  const [showPass, setShowPass] = useState(false);

  return (
    <GradientBg>
      <AuthCard wide>
        <AuthLeftPanel subtitle={t("auth.firstSubtitle")} />

        <div className="flex flex-1 flex-col gap-5 p-5 sm:p-8">
          <AuthHeading icon={<UserIcon size={28} />} title={t("auth.firstTitle")} />

          <InputField
            label={t("auth.email")}
            type="email"
            placeholder={t("auth.emailPlaceholder")}
            value={email}
            onChange={setEmail}
            autoComplete="username"
          />
          <InputField
            label={t("auth.tempPassword")}
            type={showPass ? "text" : "password"}
            placeholder="••••••••••••"
            value={tempPass}
            onChange={setTempPass}
            autoComplete="current-password"
            icon={<EyeIcon open={showPass} />}
            onIconClick={() => setShowPass((v) => !v)}
          />

          <InfoBox>{t("auth.firstInfo")}</InfoBox>

          <PrimaryBtn onClick={() => onNav("new-password")}>{t("common.continue")}</PrimaryBtn>

          <div className="text-center">
            <LinkBtn onClick={() => onNav("login")}>{t("auth.backToLogin")}</LinkBtn>
          </div>
        </div>
      </AuthCard>
    </GradientBg>
  );
}
