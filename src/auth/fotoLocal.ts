const PREFIX = "totvs-insight:foto:";

export function lerFotoLocal(id: string): string | null {
  try {
    const value = localStorage.getItem(PREFIX + id);
    return value?.startsWith("data:image/jpeg;base64,") && value.length < 500000 ? value : null;
  } catch { return null; }
}

export function salvarFotoLocal(id: string, foto: string | null): void {
  try {
    if (foto) localStorage.setItem(PREFIX + id, foto);
    else localStorage.removeItem(PREFIX + id);
  } catch {
    throw new Error("O navegador não permitiu salvar a foto. Confira o espaço e as permissões de armazenamento.");
  }
}

/** Decodifica e reduz a imagem no próprio navegador, sem upload. */
export async function prepararFoto(file: File): Promise<string> {
  if (!["image/jpeg", "image/png"].includes(file.type)) throw new Error("Selecione uma imagem JPG ou PNG.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Selecione uma imagem de até 5 MB.");
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    try { await img.decode(); } catch { throw new Error("Não foi possível abrir essa imagem. Escolha outro JPG ou PNG."); }
    const size = Math.min(img.naturalWidth, img.naturalHeight);
    if (!size) throw new Error("A imagem está vazia.");
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não foi possível preparar a foto neste navegador.");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 256, 256);
    ctx.drawImage(img, (img.naturalWidth - size) / 2, (img.naturalHeight - size) / 2, size, size, 0, 0, 256, 256);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally { URL.revokeObjectURL(url); }
}
