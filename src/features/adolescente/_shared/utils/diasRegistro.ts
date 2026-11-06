// src/features/adolescente/_shared/utils/diasRegistro.ts
//
// Dias que o adolescente pode escolher ao registrar algo que esqueceu de anotar:
// hoje, ontem e anteontem. Função pura (recebe "hoje" por parâmetro) para ser testável.
import { formatarDataISO } from '../../../../shared/utils/data';

export const DIAS_RETROATIVOS = 3; // hoje + 2 anteriores

const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const ROTULOS = ['Hoje', 'Ontem', 'Anteontem'];

export type OpcaoDiaRegistro = {
  /** AAAA-MM-DD (fuso do aparelho) */
  iso: string;
  rotulo: string;
  /** ex.: "sex, 06/11" */
  detalhe: string;
};

export function opcoesDiaRegistro(hoje: Date = new Date()): OpcaoDiaRegistro[] {
  return Array.from({ length: DIAS_RETROATIVOS }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - i);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    return { iso: formatarDataISO(d), rotulo: ROTULOS[i], detalhe: `${SEMANA[d.getDay()]}, ${dia}/${mes}` };
  });
}

/** Texto curto do botão: "Hoje", "Ontem", "Anteontem" ou a data. */
export function rotuloDoDia(iso: string | null, hoje: Date = new Date()): string {
  if (!iso) return 'Hoje';
  return opcoesDiaRegistro(hoje).find((o) => o.iso === iso)?.rotulo ?? iso.split('-').reverse().slice(0, 2).join('/');
}
