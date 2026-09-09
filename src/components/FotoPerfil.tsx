import { useRef, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { prepararFoto } from "@/auth/fotoLocal";

export default function FotoPerfil({ iniciais }: { iniciais: string }) {
  const { usuario, atualizarFoto } = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const foto = preview ?? usuario?.foto;

  async function escolher(file?: File) {
    if (!file) return;
    setBusy(true); setError(""); setMessage(""); setPreview(null);
    try { setPreview(await prepararFoto(file)); }
    catch (e) { setError(e instanceof Error ? e.message : "Erro ao abrir a imagem."); }
    finally { setBusy(false); }
  }
  function salvar(value: string | null) {
    setError(""); setMessage("");
    try {
      atualizarFoto(value); setPreview(null);
      setMessage(value ? "Foto salva neste navegador." : "Foto removida deste navegador.");
    } catch (e) { setError(e instanceof Error ? e.message : "Erro ao salvar a foto."); }
  }
  return <div className="flex flex-col items-center gap-3">
    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-white/30 bg-brand-blue">
      {foto ? <img src={foto} alt="Foto do perfil" className="h-full w-full object-cover" /> : <span className="font-heading text-2xl font-bold text-white">{iniciais}</span>}
    </div>
    <input ref={input} type="file" accept="image/jpeg,image/png" className="hidden" aria-label="Selecionar foto de perfil" onChange={e => { void escolher(e.target.files?.[0]); e.target.value = ""; }} />
    <div className="flex flex-wrap justify-center gap-2">
      <button type="button" disabled={busy} onClick={() => input.current?.click()} className="rounded-lg border border-white/40 px-3 py-2 text-xs text-white disabled:opacity-50">{busy ? "Preparando…" : "Alterar foto"}</button>
      {preview && <>
        <button type="button" onClick={() => salvar(preview)} className="rounded-lg bg-white px-3 py-2 text-xs text-blue-800">Salvar foto</button>
        <button type="button" onClick={() => setPreview(null)} className="rounded-lg border border-white/40 px-3 py-2 text-xs text-white">Cancelar</button>
      </>}
      {usuario?.foto && !preview && <button type="button" disabled={busy} onClick={() => salvar(null)} className="rounded-lg border border-white/40 px-3 py-2 text-xs text-white">Remover foto</button>}
    </div>
    <p className="max-w-xs text-xs text-white/80">JPG ou PNG, até 5 MB. A foto fica apenas neste navegador, sem envio ao servidor.</p>
    {message && <p role="status" className="text-xs text-white">{message}</p>}
    {error && <p role="alert" className="rounded bg-white px-2 py-1 text-xs text-red-700">{error}</p>}
  </div>;
}
