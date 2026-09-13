/**
 * Exportação de CSV feita no próprio navegador, sem servidor.
 *
 * Separador `;` e BOM no início: é o que faz o Excel em português abrir o
 * arquivo com acentuação correta e uma coluna por campo.
 */

function escapar(valor: string | number | null | undefined): string {
  const texto = valor === null || valor === undefined ? "" : String(valor);
  return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

export function baixarCsv(
  nome: string,
  cabecalho: string[],
  linhas: (string | number | null)[][],
): void {
  const conteudo = [cabecalho, ...linhas].map((linha) => linha.map(escapar).join(";")).join("\r\n");
  const url = URL.createObjectURL(
    new Blob([`﻿${conteudo}`], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Data no formato que o Excel entende sem reinterpretar como texto. */
export function dataParaCsv(iso: string): string {
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? iso : data.toLocaleString("pt-BR");
}
