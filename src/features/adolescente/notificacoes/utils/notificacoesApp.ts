// src/features/adolescente/notificacoes/utils/notificacoesApp.ts
//
// Regras puras da Central de Notificações do app (sem Supabase, sem React).
// Cada item sabe para qual tela levar: tocar nele abre a tela que resolve aquilo.
import type { ReceitaRecebida } from '../../social/utils/receitaCompartilhada';
import type { ChamaDupla } from '../../social/utils/chamaDupla';
import { HORA_LEMBRETE, mensagemAviso, textoLembreteFimDeDia } from '../../social/utils/chamaDupla';

export type DestinoNotificacao = 'Social' | 'Missoes' | 'Home' | 'Receita';

export type TipoNotificacaoApp =
  | 'pedido_amizade'
  | 'convite_chama'
  | 'receita_amigo'
  | 'aviso_chama'
  | 'lembrete_chama'
  | 'missao_diaria'
  | 'missao_semanal'
  | 'missao_mensal';

export type NotificacaoApp = {
  id: string;
  tipo: TipoNotificacaoApp;
  /** nome de um ícone do Ionicons */
  icone: string;
  titulo: string;
  texto: string;
  destino: DestinoNotificacao;
  /** dados para abrir o destino (ex.: qual receita) */
  params?: { receitaId: string };
};

export type NotificacaoComLeitura = NotificacaoApp & { lida: boolean };

export type PedidoRecebido = { amizadeId: string; apelido: string };
export type MissaoPendente = { titulo: string };

export type EntradaNotificacoes = {
  chamas: ChamaDupla[];
  pedidosRecebidos: PedidoRecebido[];
  receitasRecebidas?: ReceitaRecebida[];
  /** null = ainda não carregou / não se aplica (não gera itens de missão) */
  missoes: {
    diaria: (MissaoPendente & { concluida: boolean }) | null;
    semanais: (MissaoPendente & { concluida: boolean })[];
    mensais: (MissaoPendente & { concluida: boolean })[];
  } | null;
  agora: Date;
};

/** Dia local no formato AAAA-MM-DD (usado nos ids que "renovam" todo dia). */
function chaveDia(d: Date): string {
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/** "A, B e C" — no máximo 2 nomes, o resto vira "+N". */
function resumirTitulos(titulos: string[]): string {
  if (titulos.length <= 2) return titulos.join(' e ');
  return `${titulos[0]}, ${titulos[1]} e mais ${titulos.length - 2}`;
}

function missoesPeriodicas(
  tipo: 'missao_semanal' | 'missao_mensal',
  pendentes: MissaoPendente[],
  dia: string
): NotificacaoApp | null {
  if (pendentes.length === 0) return null;
  const semanal = tipo === 'missao_semanal';
  const n = pendentes.length;
  return {
    id: `${tipo}-${dia}`,
    tipo,
    icone: semanal ? 'calendar-outline' : 'calendar-number-outline',
    titulo: semanal
      ? `${n} ${n === 1 ? 'missão da semana' : 'missões da semana'} em andamento`
      : `${n} ${n === 1 ? 'missão do mês' : 'missões do mês'} em andamento`,
    texto: resumirTitulos(pendentes.map((p) => p.titulo)),
    destino: 'Missoes',
  };
}

/** Ordem: o que depende de outra pessoa primeiro, depois lembretes e missões. */
export function montarNotificacoesApp({ chamas, pedidosRecebidos, receitasRecebidas = [], missoes, agora }: EntradaNotificacoes): NotificacaoApp[] {
  const lista: NotificacaoApp[] = [];
  const dia = chaveDia(agora);

  for (const p of pedidosRecebidos) {
    lista.push({
      id: `pedido-${p.amizadeId}`,
      tipo: 'pedido_amizade',
      icone: 'person-add',
      titulo: 'Pedido de amizade',
      texto: `${p.apelido} quer ser seu amigo.`,
      destino: 'Social',
    });
  }

  for (const c of chamas.filter((x) => x.situacao === 'recebido')) {
    lista.push({
      id: `convite-${c.id}`,
      tipo: 'convite_chama',
      icone: 'flame',
      titulo: 'Convite para Chama em Dupla',
      texto: `${c.apelido} quer manter uma sequência com você.`,
      destino: 'Social',
    });
  }

  for (const r of receitasRecebidas) {
    lista.push({
      id: `receita-${r.id}`,
      tipo: 'receita_amigo',
      icone: 'restaurant',
      titulo: `${r.remetente} te mandou uma receita`,
      texto: `${r.titulo}. Que tal cozinharem juntos?`,
      destino: 'Receita',
      params: { receitaId: r.receitaId },
    });
  }

  const ativa = chamas.find((c) => c.situacao === 'ativa');
  if (ativa?.aviso) {
    lista.push({
      id: `aviso-${ativa.id}-${ativa.aviso}-${ativa.vidasRestantes}-${dia}`,
      tipo: 'aviso_chama',
      icone: 'flame',
      titulo: 'Chama em Dupla',
      texto: mensagemAviso(ativa.aviso, ativa.vidasRestantes),
      destino: 'Social',
    });
  }
  if (ativa && !ativa.concluidaHoje && agora.getHours() >= HORA_LEMBRETE) {
    lista.push({
      id: `lembrete-${ativa.id}-${dia}`,
      tipo: 'lembrete_chama',
      icone: 'alarm',
      titulo: 'Acender a sequência',
      texto: textoLembreteFimDeDia(ativa.apelido),
      destino: 'Home',
    });
  }

  if (missoes) {
    if (missoes.diaria && !missoes.diaria.concluida) {
      lista.push({
        id: `missao-diaria-${dia}`,
        tipo: 'missao_diaria',
        icone: 'flag',
        titulo: 'Missão do dia ainda não cumprida',
        texto: missoes.diaria.titulo,
        destino: 'Missoes',
      });
    }
    const semanal = missoesPeriodicas('missao_semanal', missoes.semanais.filter((m) => !m.concluida), dia);
    const mensal = missoesPeriodicas('missao_mensal', missoes.mensais.filter((m) => !m.concluida), dia);
    if (semanal) lista.push(semanal);
    if (mensal) lista.push(mensal);
  }

  return lista;
}

/** Marca cada item como lido ou não e coloca os não lidos primeiro (ordem original mantida). */
export function aplicarLeitura(lista: NotificacaoApp[], lidas: ReadonlySet<string>): NotificacaoComLeitura[] {
  const marcadas = lista.map((n) => ({ ...n, lida: lidas.has(n.id) }));
  return [...marcadas.filter((n) => !n.lida), ...marcadas.filter((n) => n.lida)];
}

export function contarNaoLidas(lista: NotificacaoComLeitura[]): number {
  return lista.filter((n) => !n.lida).length;
}
