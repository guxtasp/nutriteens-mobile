// src/shared/utils/confirmarSaida.ts
//
// Texto da confirmação de "Sair da conta". Sair limpa as cópias locais do aparelho; se houver
// registros guardados esperando internet, eles seriam perdidos, então o aviso destaca isso.
export function mensagemSairDaConta(pendentes: number): string {
  if (pendentes > 0) {
    const registros = pendentes === 1 ? '1 registro ainda não foi enviado' : `${pendentes} registros ainda não foram enviados`;
    return `${registros} por falta de internet. Se você sair agora, ${pendentes === 1 ? 'ele será perdido' : 'eles serão perdidos'}. Quer sair mesmo assim?`;
  }
  return 'Você vai precisar entrar de novo para usar o app. Quer sair?';
}
