export default function ReuniaoPage() {
  return (
    <div className="rounded-[18px] border border-[#DCE5F0] bg-white p-8 dark:border-[#233750] dark:bg-[#0F1D31]">
      <p className="font-body text-[14px] font-medium text-[#3156A0]">
        TOTVIS
      </p>

      <h1 className="mt-1 font-heading text-[32px] font-bold text-[#071F74] dark:text-white">
        Reunião com o TOTVIS
      </h1>

      <p className="mt-3 max-w-2xl font-body text-[15px] leading-relaxed text-[#697B95] dark:text-[#A6B5C9]">
        Esta área será utilizada para acompanhar a reunião em
        tempo real, visualizar a transcrição e receber alertas,
        oportunidades e sugestões contextuais do TOTVIS.
      </p>
    </div>
  );
}