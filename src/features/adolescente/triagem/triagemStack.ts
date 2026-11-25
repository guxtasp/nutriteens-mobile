
// Única fonte de verdade sobre A ORDEM da triagem. Se um dia a ordem mudar
// de novo (ex: voltar EBIA pra antes do Recordatório), é só editar aqui —
// nenhum arquivo dentro de features/recordatorio ou features/ebia precisa
// saber ou se importar com a posição deles na jornada.
// Consumido pelo RootNavigator dentro do case 'TRIAGEM' de renderStackLogado().

import BroxisConversaScreen from './screens/BroxisConversaScreen';
import RecordatorioRefeicaoScreen from './recordatorio/screens/RecordatorioRefeicaoScreen';
import EbiaPerguntaScreen from './ebia/screens/EbiaPerguntaScreen';

export const TRIAGEM_SCREENS = [
  // a rota continua 'TriagemIntro': nenhum outro ponto de navegação precisou mudar
  { name: 'TriagemIntro', component: BroxisConversaScreen },
  { name: 'RecordatorioRefeicao', component: RecordatorioRefeicaoScreen },
  { name: 'EbiaPergunta', component: EbiaPerguntaScreen },
] as const;