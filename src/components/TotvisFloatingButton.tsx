import { FormEvent, useState } from "react";

import {
  CloseIcon,
  SendIcon,
  SparklesIcon,
} from "@/icons";

interface Message {
  id: number;
  author: "user" | "totvis";
  text: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    author: "totvis",
    text: "Olá! Sou o TOTVIS. Posso ajudar com reuniões, clientes, análises e recomendações.",
  },
];

export default function TotvisFloatingButton() {
  const [open, setOpen] = useState(false);

  const [message, setMessage] = useState("");

  const [messages, setMessages] =
    useState<Message[]>(INITIAL_MESSAGES);

  function generateTotvisResponse(
    userMessage: string,
  ): string {
    const text =
      userMessage.toLowerCase();

    if (
      text.includes("churn") ||
      text.includes("risco")
    ) {
      return "Posso verificar os clientes com maior risco de churn e destacar os sinais identificados nas reuniões recentes.";
    }

    if (
      text.includes("oportunidade") ||
      text.includes("cross") ||
      text.includes("upsell")
    ) {
      return "Posso consultar as oportunidades identificadas nas análises e mostrar quais clientes apresentaram maior potencial de upsell ou cross-sell.";
    }

    if (
      text.includes("reunião") ||
      text.includes("reuniao")
    ) {
      return "Posso ajudar com informações das reuniões analisadas, transcrições, alertas detectados e recomendações geradas pelo TOTVS Insight.";
    }

    if (text.includes("cliente")) {
      return "Posso consultar o histórico do cliente, reuniões recentes, riscos, oportunidades e outros insights disponíveis na plataforma.";
    }

    if (
      text.includes("relatório") ||
      text.includes("relatorio")
    ) {
      return "Posso ajudar a interpretar os relatórios e encontrar os insights mais relevantes para sua operação.";
    }

    return "Entendi. Posso usar as informações disponíveis no TOTVS Insight para ajudar com reuniões, clientes, riscos, oportunidades e análises.";
  }

  function sendMessage(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedMessage =
      message.trim();

    if (!trimmedMessage) {
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      author: "user",
      text: trimmedMessage,
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setMessage("");

    /*
      Resposta temporária para o protótipo.

      Quando conectarmos o TOTVIS à IA de verdade,
      essa parte será substituída por uma chamada
      para o backend/API.
    */
    window.setTimeout(() => {
      const totvisMessage: Message = {
        id: Date.now() + 1,
        author: "totvis",
        text: generateTotvisResponse(
          trimmedMessage,
        ),
      };

      setMessages((current) => [
        ...current,
        totvisMessage,
      ]);
    }, 500);
  }

  return (
    <>
      {open && (
        <div
          className="
            fixed bottom-[96px]
            right-6 z-50
            flex h-[520px]
            w-[390px]
            max-w-[calc(100vw-32px)]
            flex-col overflow-hidden
            rounded-[18px]
            border border-[#DDE7F4]
            bg-white
            shadow-[0_20px_60px_rgba(5,31,88,0.22)]
            dark:border-[#263C58]
            dark:bg-[#0C192C]
          "
        >
          {/* Header */}
          <div
            className="
              flex items-center gap-3
              bg-[#071E63]
              px-5 py-4
              text-white
            "
          >
            <div
              className="
                flex h-9 w-9
                items-center
                justify-center
                rounded-full
                bg-[#0C68FF]
              "
            >
              <SparklesIcon size={19} />
            </div>

            <div className="flex-1">
              <p
                className="
                  font-heading
                  text-[16px]
                  font-semibold
                "
              >
                TOTVIS
              </p>

              <p
                className="
                  font-body
                  text-[12px]
                  text-white/65
                "
              >
                Assistente contextual
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setOpen(false)
              }
              className="
                rounded-lg p-1.5
                text-white/70
                transition-colors
                hover:bg-white/10
                hover:text-white
              "
            >
              <CloseIcon size={18} />
            </button>
          </div>

          {/* Conversa */}
          <div
            className="
              flex-1
              space-y-4
              overflow-y-auto
              bg-[#F7F9FC]
              p-5
              dark:bg-[#0C192C]
            "
          >
            {messages.map((item) => {
              const isUser =
                item.author === "user";

              return (
                <div
                  key={item.id}
                  className={`flex ${
                    isUser
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`
                      max-w-[85%]
                      rounded-[14px]
                      px-4 py-3
                      shadow-sm

                      ${
                        isUser
                          ? `
                            rounded-tr-sm
                            bg-[#0964F5]
                            text-white
                          `
                          : `
                            rounded-tl-sm
                            bg-white
                            text-[#40526C]
                            dark:bg-[#14253D]
                            dark:text-[#D4DEEC]
                          `
                      }
                    `}
                  >
                    <p
                      className="
                        font-body
                        text-[14px]
                        leading-relaxed
                      "
                    >
                      {item.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input */}
          <form
            onSubmit={sendMessage}
            className="
              flex gap-2
              border-t
              border-[#E6EDF5]
              bg-white
              p-4
              dark:border-[#263A55]
              dark:bg-[#0F1D31]
            "
          >
            <input
              value={message}
              onChange={(event) =>
                setMessage(
                  event.target.value,
                )
              }
              placeholder="Pergunte ao TOTVIS..."
              className="
                min-w-0 flex-1
                rounded-[10px]
                border
                border-[#D9E4F1]
                bg-white
                px-4 py-3
                font-body
                text-[14px]
                text-[#263B59]
                outline-none
                transition-colors
                focus:border-[#1767F3]
                dark:border-[#304966]
                dark:bg-[#13253D]
                dark:text-white
              "
            />

            <button
              type="submit"
              disabled={
                !message.trim()
              }
              className="
                flex h-11 w-11
                items-center
                justify-center
                rounded-[10px]
                bg-[#0964F5]
                text-white
                transition-all
                hover:bg-[#0753CF]
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
              aria-label="Enviar mensagem"
            >
              <SendIcon size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Botão flutuante */}
      <div
        className="
          group
          fixed bottom-6 right-6
          z-50
        "
      >
        <span
          className="
            pointer-events-none
            absolute
            bottom-[72px]
            right-0
            whitespace-nowrap
            rounded-[6px]
            bg-[#081435]
            px-3 py-2
            font-body
            text-[12px]
            text-white
            opacity-0
            shadow-lg
            transition-opacity
            group-hover:opacity-100
          "
        >
          Falar com o TOTVIS
        </span>

        <button
          type="button"
          onClick={() =>
            setOpen((value) => !value)
          }
          aria-label="Falar com o TOTVIS"
          className="
            flex h-[64px]
            w-[64px]
            items-center
            justify-center
            rounded-full
            border-[3px]
            border-white/70
            bg-gradient-to-br
            from-[#0868F7]
            to-[#6739EC]
            text-white
            shadow-[0_8px_28px_rgba(48,60,220,0.38)]
            transition-transform
            hover:scale-105
          "
        >
          <SparklesIcon size={27} />
        </button>
      </div>
    </>
  );
}