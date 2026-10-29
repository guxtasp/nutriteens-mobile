// src/shared/painel/utils/baixarArquivo.ts
// Entrega um arquivo de texto ao usuário: download no navegador (web) ou
// folha de compartilhamento (celular). Requer `npx expo install expo-file-system`
// para o celular; na web nada extra é necessário.
import { Platform } from 'react-native';

const BOM = '﻿'; // faz o Excel abrir acentos corretamente

export async function baixarTexto(nome: string, texto: string, mime = 'text/csv;charset=utf-8'): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = new Blob([BOM + texto], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }

  // celular: grava no cache e abre o compartilhamento (Drive, e-mail, Arquivos...)
  const FS = require('expo-file-system');
  const Sharing = require('expo-sharing');
  const arquivo = new FS.File(FS.Paths.cache, nome);
  if (arquivo.exists) arquivo.delete();
  arquivo.create();
  arquivo.write(BOM + texto);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Compartilhamento indisponível neste aparelho.');
  await Sharing.shareAsync(arquivo.uri, { mimeType: 'text/csv', dialogTitle: nome, UTI: 'public.comma-separated-values-text' });
}
