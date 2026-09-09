import FotoPerfil from "@/components/FotoPerfil";
import { useState } from "react";
import { GRADIENT_BRAND } from "@/theme";
import { useAuth } from "@/auth/AuthContext";
import type { Usuario } from "@/auth/types";
import { useLocale } from "@/i18n/useLocale";
import { CheckCircleIcon } from "@/icons";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";

/** Campos editáveis do perfil. O e-mail é gerido pelo diretório corporativo. */
const CAMPO_KEYS: {
  chave: keyof Pick<
    Usuario,
    "nome" | "cargo" | "email" | "telefone" | "departamento" | "localizacao"
  >;
  labelKey: string;
  type?: string;
  bloqueado?: boolean;
  ajudaKey?: string;
}[] = [
  { chave: "nome", labelKey: "profile.name" },
  { chave: "cargo", labelKey: "profile.role" },
  {
    chave: "email",
    labelKey: "profile.email",
    type: "email",
    bloqueado: true,
    ajudaKey: "profile.emailLocked",
  },
  { chave: "telefone", labelKey: "profile.phone", type: "tel" },
  { chave: "departamento", labelKey: "profile.department" },
  { chave: "localizacao", labelKey: "profile.location" },
];

/** Tempo que o aviso de sucesso fica visível, em ms. */
const FEEDBACK_MS = 2500;

export default function PerfilPage() {
  const { usuario, atualizarUsuario } = useAuth();

  // O dashboard só renderiza com sessão ativa; esta guarda satisfaz o tipo.
  if (!usuario) return null;

  return <PerfilForm usuario={usuario} onSalvar={atualizarUsuario} />;
}

function PerfilForm({
  usuario,
  onSalvar,
}: {
  usuario: Usuario;
  onSalvar: (dados: Partial<Usuario>) => void;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState({
    nome: usuario.nome,
    cargo: usuario.cargo,
    email: usuario.email,
    telefone: usuario.telefone,
    departamento: usuario.departamento,
    localizacao: usuario.localizacao,
  });
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const alterado = CAMPO_KEYS.some(
    ({ chave, bloqueado }) => !bloqueado && form[chave] !== usuario[chave],
  );

  /** Iniciais acompanham o nome enquanto ele é editado. */
  const iniciais =
    form.nome
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0] ?? "")
      .join("")
      .toUpperCase() || usuario.iniciais;

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!alterado || salvando) return;

    setSalvando(true);
    /*
     * PONTO DE INTEGRAÇÃO: trocar por `PATCH /api/usuarios/:id` com o corpo do
     * formulário. O estado local já reflete o que o servidor deve receber.
     */
    await new Promise((r) => setTimeout(r, 600));

    // O e-mail é somente leitura, então não vai no payload.
    const { email: _ignorado, ...editaveis } = form;
    onSalvar({ ...editaveis, iniciais });

    setSalvando(false);
    setSalvo(true);
    setTimeout(() => setSalvo(false), FEEDBACK_MS);
  }

  return (
    <div>
      <PageHeader title={t("profile.title")} subtitle={t("profile.subtitle")} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Cartão do usuário */}
        <Card className="overflow-hidden lg:col-span-1">
          <div
            className="flex flex-col items-center px-6 py-7 text-center"
            style={{ background: GRADIENT_BRAND }}
          >
            <FotoPerfil iniciais={iniciais} />
            <p className="font-heading mt-3 text-base font-semibold text-white">
              {form.nome || "—"}
            </p>
            <p className="font-body text-xs text-white/70">{form.cargo || "—"}</p>
            <p className="font-body mt-1 text-meta break-all text-white/50">{usuario.email}</p>
          </div>

          <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
            {usuario.stats.map((s) => (
              <div key={s.label} className="px-2 py-4 text-center">
                <p className="font-heading text-lg font-bold text-brand-text">{s.value}</p>
                <p className="font-body text-micro text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2.5 px-6 py-5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-body text-meta text-gray-500">{t("profile.department")}</span>
              <span className="font-body truncate text-meta font-medium text-brand-text">
                {form.departamento || "—"}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-body text-meta text-gray-500">{t("profile.location")}</span>
              <span className="font-body truncate text-meta font-medium text-brand-text">
                {form.localizacao || "—"}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-body text-meta text-gray-500">{t("profile.phone")}</span>
              <span className="font-body truncate text-meta font-medium text-brand-text">
                {form.telefone || "—"}
              </span>
            </div>
          </div>
        </Card>

        {/* Formulário */}
        <Card className="p-6 lg:col-span-2">
          <p className="font-heading mb-5 text-sm font-semibold text-brand-text">
            {t("profile.formSection")}
          </p>

          <form onSubmit={salvar}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {CAMPO_KEYS.map(({ chave, labelKey, type, bloqueado, ajudaKey }) => (
                <div key={chave}>
                  <label
                    htmlFor={`perfil-${chave}`}
                    className="font-body mb-1 block text-micro text-gray-500"
                  >
                    {t(labelKey)}
                  </label>
                  <input
                    id={`perfil-${chave}`}
                    type={type ?? "text"}
                    value={form[chave]}
                    disabled={bloqueado || salvando}
                    onChange={(e) => setForm((f) => ({ ...f, [chave]: e.target.value }))}
                    className={`font-body w-full rounded-lg border px-3 py-2 text-xs transition-colors outline-none ${
                      bloqueado
                        ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400"
                        : "border-gray-200 text-brand-text focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                    }`}
                  />
                  {ajudaKey && (
                    <p className="font-body mt-1 text-micro text-gray-400">{t(ajudaKey)}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-5">
              <button
                type="submit"
                disabled={!alterado || salvando}
                className="font-heading flex items-center gap-2 rounded-lg bg-brand-blue px-6 py-2.5 text-xs text-white transition-colors hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-brand-blue"
              >
                {salvando && (
                  <span
                    className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white"
                    aria-hidden="true"
                  />
                )}
                {salvando ? t("common.saving") : t("common.save")}
              </button>

              {salvo && (
                <span
                  role="status"
                  className="font-body flex items-center gap-1.5 text-xs text-green-600"
                >
                  <CheckCircleIcon size={14} />
                  {t("profile.saved")}
                </span>
              )}

              {!alterado && !salvo && !salvando && (
                <span className="font-body text-xs text-gray-400">{t("profile.noChanges")}</span>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
