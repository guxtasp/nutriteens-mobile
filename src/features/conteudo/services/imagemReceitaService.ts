// src/features/conteudo/services/imagemReceitaService.ts
// Envia fotos de receitas para o Supabase Storage (bucket público "receitas") e devolve a URL
// pública, que é o que vai para receitas.foto_url / receita_passos.foto_url.
import { supabase } from '../../../lib/supabase';

export const BUCKET_RECEITAS = 'receitas';
export const TAMANHO_MAX_BYTES = 3 * 1024 * 1024;
const TIPOS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** Nome único por envio: trocar a foto gera outra URL, então nada fica "preso" em cache. */
export function nomeArquivoFoto(mime: string, agora = Date.now(), aleatorio = Math.random()): string | null {
  const ext = TIPOS[mime.toLowerCase()];
  if (!ext) return null;
  return `fotos/${agora}-${aleatorio.toString(36).slice(2, 8)}.${ext}`;
}

export async function enviarFotoReceita(uri: string, mime = 'image/jpeg'): Promise<string> {
  const caminho = nomeArquivoFoto(mime);
  if (!caminho) throw new Error('Formato não aceito. Use JPG, PNG ou WebP.');
  const buffer = await (await fetch(uri)).arrayBuffer();
  if (buffer.byteLength > TAMANHO_MAX_BYTES) {
    throw new Error(`A foto tem ${(buffer.byteLength / 1048576).toFixed(1)} MB. O máximo é 3 MB: escolha uma menor.`);
  }
  const { error } = await supabase.storage.from(BUCKET_RECEITAS).upload(caminho, buffer, { contentType: mime, cacheControl: '31536000' });
  if (error) {
    if (/bucket/i.test(error.message) && /not found/i.test(error.message)) {
      throw new Error('O armazenamento de fotos ainda não foi criado. Rode a migration_receitas_imagens.sql no Supabase.');
    }
    throw error;
  }
  return supabase.storage.from(BUCKET_RECEITAS).getPublicUrl(caminho).data.publicUrl;
}
