// Fotos de produto do scanner (bucket público "scanner"). Só a equipe envia: o Storage confere o papel.
import { supabase } from '../../../../lib/supabase';

export const BUCKET_SCANNER = 'scanner';
export const TAMANHO_MAX_BYTES = 3 * 1024 * 1024;
const TIPOS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export function nomeArquivoFotoProduto(mime: string, agora = Date.now(), aleatorio = Math.random()): string | null {
  const ext = TIPOS[mime.toLowerCase()];
  return ext ? `produtos/${agora}-${aleatorio.toString(36).slice(2, 8)}.${ext}` : null;
}

export async function enviarFotoProduto(uri: string, mime = 'image/jpeg'): Promise<string> {
  const caminho = nomeArquivoFotoProduto(mime);
  if (!caminho) throw new Error('Formato não aceito. Use JPG, PNG ou WebP.');
  const buffer = await (await fetch(uri)).arrayBuffer();
  if (buffer.byteLength > TAMANHO_MAX_BYTES) {
    throw new Error(`A foto tem ${(buffer.byteLength / 1048576).toFixed(1)} MB. O máximo é 3 MB: escolha uma menor.`);
  }
  const { error } = await supabase.storage.from(BUCKET_SCANNER).upload(caminho, buffer, { contentType: mime, cacheControl: '31536000' });
  if (error) {
    if (/bucket/i.test(error.message) && /not found/i.test(error.message)) {
      throw new Error('O armazenamento de fotos ainda não foi criado. Rode a migration_scanner_fotos.sql no Supabase.');
    }
    throw error;
  }
  return supabase.storage.from(BUCKET_SCANNER).getPublicUrl(caminho).data.publicUrl;
}
