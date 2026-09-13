import { useState } from "react";
import type { NavId } from "@/navigation";
import { useAuth } from "@/auth/AuthContext";
import { useLocale } from "@/i18n/useLocale";
import type { Locale } from "@/i18n/types";
import { useTheme, type TemaPreferencia } from "@/theme/ThemeContext";
import { LockIcon, MoonIcon, ShieldIcon, SunIcon } from "@/icons";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Toggle from "@/components/ui/Toggle";

/** Quanto tempo o aviso de "salvo" permanece visível, em ms. */
const SAVED_FEEDBACK_MS = 2500;

export default function ConfiguracoesPage({ onNav }: { onNav?: (id: NavId) => void }) {
  const { usuario } = useAuth();
  const { preferencia, setPreferencia, resolvido } = useTheme();
  const { t, locale, setLocale, locales, labels } = useLocale();

  const [notifEmail, setNotifEmail] = useState(true);
  const [notifChurn, setNotifChurn] = useState(true);
  const [notifOport, setNotifOport] = useState(false);
  const [draftLocale, setDraftLocale] = useState<Locale>(locale);
  const [saved, setSaved] = useState(false);

  const temas: { id: TemaPreferencia; label: string; desc: string }[] = [
    { id: "claro", label: t("settings.themeLight"), desc: t("settings.themeLightDesc") },
    { id: "escuro", label: t("settings.themeDark"), desc: t("settings.themeDarkDesc") },
    { id: "sistema", label: t("settings.themeSystem"), desc: t("settings.themeSystemDesc") },
  ];

  const notificacoes = [
    {
      label: t("settings.notifEmail"),
      desc: t("settings.notifEmailDesc"),
      on: notifEmail,
      toggle: () => setNotifEmail((v) => !v),
    },
    {
      label: t("settings.notifChurn"),
      desc: t("settings.notifChurnDesc"),
      on: notifChurn,
      toggle: () => setNotifChurn((v) => !v),
    },
    {
      label: t("settings.notifOpp"),
      desc: t("settings.notifOppDesc"),
      on: notifOport,
      toggle: () => setNotifOport((v) => !v),
    },
  ];

  function save() {
    setLocale(draftLocale);
    setSaved(true);
    setTimeout(() => setSaved(false), SAVED_FEEDBACK_MS);
  }

  return (
    <div>
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Perfil — somente leitura: a edição vive em "Meu perfil" */}
        <Card className="p-5">
          <p className="font-heading mb-4 text-sm font-semibold text-brand-text">
            {t("settings.profileSection")}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border-2 border-brand-blue/20 bg-brand-blue">
              <span className="font-heading text-lg font-bold text-white">
                {usuario?.iniciais ?? "—"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-heading text-sm font-semibold text-brand-text">
                {usuario?.nome ?? "—"}
              </p>
              <p className="font-body text-xs text-gray-500">{usuario?.cargo ?? "—"}</p>
              <p className="font-body truncate text-meta text-gray-400">{usuario?.email ?? "—"}</p>
            </div>
          </div>

          <button
            onClick={() => onNav?.("perfil")}
            className="font-body mt-5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-brand-blue transition-colors hover:bg-gray-50"
          >
            {t("settings.editProfile")}
          </button>
        </Card>

        {/* Notificações */}
        <Card className="p-5">
          <p className="font-heading mb-4 text-sm font-semibold text-brand-text">
            {t("settings.notifSection")}
          </p>
          <div className="flex flex-col gap-4">
            {notificacoes.map((n) => (
              <div key={n.label} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-body text-xs font-medium text-brand-text">{n.label}</p>
                  <p className="font-body mt-0.5 text-micro text-gray-400">{n.desc}</p>
                </div>
                <Toggle on={n.on} onChange={n.toggle} label={n.label} />
              </div>
            ))}
          </div>
        </Card>

        {/* Preferências */}
        <Card className="p-5">
          <p className="font-heading mb-4 text-sm font-semibold text-brand-text">
            {t("settings.prefsSection")}
          </p>
          <label className="font-body mb-1 block text-micro text-gray-500">
            {t("settings.language")}
          </label>
          <select
            value={draftLocale}
            onChange={(e) => setDraftLocale(e.target.value as Locale)}
            className="font-body mb-5 w-full rounded-lg border border-gray-200 bg-brand-card px-3 py-2 text-xs text-brand-text transition-colors outline-none focus:border-brand-blue"
          >
            {locales.map((code) => (
              <option key={code} value={code}>
                {labels[code]}
              </option>
            ))}
          </select>

          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="font-body block text-micro text-gray-500">
              {t("settings.appearance")}
            </label>
            <span className="font-body flex items-center gap-1 text-micro text-gray-400">
              {resolvido === "escuro" ? <MoonIcon size={12} /> : <SunIcon size={12} />}
              {t("settings.activeTheme", {
                theme:
                  resolvido === "escuro" ? t("settings.themeDarkWord") : t("settings.themeLightWord"),
              })}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {temas.map((tema) => {
              const ativo = preferencia === tema.id;
              return (
                <button
                  key={tema.id}
                  type="button"
                  onClick={() => setPreferencia(tema.id)}
                  className={`rounded-lg border px-2 py-2.5 text-center transition-colors ${
                    ativo
                      ? "border-brand-blue bg-brand-blue/10 text-brand-blue"
                      : "border-gray-200 text-brand-text hover:bg-gray-50"
                  }`}
                >
                  <p className="font-heading text-xs font-medium">{tema.label}</p>
                  <p className="font-body mt-0.5 text-micro text-gray-400">{tema.desc}</p>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Segurança */}
        <Card className="p-5">
          <p className="font-heading mb-4 text-sm font-semibold text-brand-text">
            {t("settings.securitySection")}
          </p>
          <div className="flex flex-col gap-3">
            {/* Trocar senha e 2FA exigem autenticação no servidor, que não existe. */}
            <button
              disabled
              title={t("common.demoOnly")}
              className="font-body flex w-full items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-left text-xs text-brand-text opacity-50"
            >
              <span className="text-brand-blue">
                <LockIcon size={13} />
              </span>
              {t("settings.changePassword")}
            </button>
            <button
              disabled
              title={t("common.demoOnly")}
              className="font-body flex w-full items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-left text-xs text-brand-text opacity-50"
            >
              <span className="text-brand-blue">
                <ShieldIcon size={13} />
              </span>
              {t("settings.mfa")}
              <span className="ml-auto rounded bg-gray-100 px-1.5 py-0.5 text-micro text-gray-600">
                {t("common.unavailable")}
              </span>
            </button>
          </div>
        </Card>
      </div>

      {/* Salvar */}
      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={save}
          className="font-heading rounded-lg bg-brand-blue px-6 py-2.5 text-xs text-white transition-colors hover:bg-brand-blue-dark"
        >
          {t("common.save")}
        </button>
        {saved && (
          <span className="font-body text-xs text-green-600">{t("settings.saved")}</span>
        )}
      </div>
    </div>
  );
}
