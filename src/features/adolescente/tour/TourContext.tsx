// src/features/adolescente/tour/TourContext.tsx
//
// Orquestra o tour: guarda os alvos registrados pelas telas, navega entre Home -> Trilha ->
// Turma -> Home, espera/mede o alvo de cada passo e entrega tudo ao TourOverlay.
//
//  - useTourAlvo(id)  devolve um `ref` para pôr no componente a destacar; só registra quando a
//    tela está em foco (a Home continua montada atrás da Trilha, e os dois têm a mesma barra).
//  - <TourAlvo id>   atalho: um View com o ref.
//  - useTourRolagem  registra o ScrollView da Home para o tour rolar até o fim/topo.
//  - useTour         { ativo, iniciar, pular } para quem dispara (primeiro acesso, tela Mais).
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ScrollView, View, ViewProps } from 'react-native';
import { CommonActions, StackActions, useIsFocused, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { useRecompensasStore } from '../recompensas/store/recompensasStore';
import { PASSOS_TOUR, TOTAL_PASSOS_COM_ALVO, numeroDoPasso, type TelaTour } from './tourPassos';
import type { Retangulo } from './tourGeometria';
import { marcarTourVisto } from './tourStorage';
import { feedbackLeve, feedbackToque } from '../../../shared/audio/feedback';
import { tocarSom } from '../../../shared/audio/sons';
import TourOverlay from './TourOverlay';

type RefView = React.RefObject<View | null>;
type RefScroll = React.RefObject<ScrollView | null>;

type Registro = {
  registrar: (id: string, ref: RefView) => () => void;
  registrarRolagem: (ref: RefScroll) => () => void;
};

type TourApi = { ativo: boolean; iniciar: () => void; pular: () => void };

const RegistroContext = createContext<Registro | null>(null);
const TourContext = createContext<TourApi>({ ativo: false, iniciar: () => undefined, pular: () => undefined });

const INTERVALO_BUSCA_MS = 150;
const LIMITE_BUSCA_MS = 4000;
const ESPERA_TROCA_TELA_MS = 350;
const ESPERA_ROLAGEM_MS = 350;

const esperar = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function medir(ref: RefView): Promise<Retangulo | null> {
  return new Promise((resolve) => {
    const no = ref.current;
    if (!no) return resolve(null);
    no.measureInWindow((x, y, largura, altura) => {
      if (!Number.isFinite(x) || !Number.isFinite(y) || largura <= 0 || altura <= 0) resolve(null);
      else resolve({ x, y, largura, altura });
    });
  });
}

const iguais = (a: Retangulo, b: Retangulo) =>
  Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1 && Math.abs(a.largura - b.largura) < 1 && Math.abs(a.altura - b.altura) < 1;

export function TourProvider({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation();
  const { userId } = useAuth();

  const [ativo, setAtivo] = useState(false);
  const [indice, setIndice] = useState(0);
  // o que está NA TELA: só troca quando o alvo do novo passo foi medido, então o buraco
  // "escorrega" do alvo antigo para o novo em vez de piscar
  const [exibido, setExibido] = useState<{ indice: number; rect: Retangulo | null } | null>(null);

  const alvosRef = useRef(new Map<string, { token: number; ref: RefView }[]>());
  const tokenRef = useRef(0);
  const rolagemRef = useRef<RefScroll | null>(null);
  const telaRef = useRef<TelaTour>('Home');
  const direcaoRef = useRef<1 | -1>(1);
  const ativoRef = useRef(false);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const registro = useMemo<Registro>(
    () => ({
      registrar: (id, ref) => {
        const token = ++tokenRef.current;
        const lista = alvosRef.current.get(id) ?? [];
        lista.push({ token, ref });
        alvosRef.current.set(id, lista);
        return () => {
          const atual = alvosRef.current.get(id);
          if (!atual) return;
          const resto = atual.filter((a) => a.token !== token);
          if (resto.length) alvosRef.current.set(id, resto);
          else alvosRef.current.delete(id);
        };
      },
      registrarRolagem: (ref) => {
        rolagemRef.current = ref;
        return () => {
          if (rolagemRef.current === ref) rolagemRef.current = null;
        };
      },
    }),
    [],
  );

  const navegar = useCallback(
    (tela: TelaTour) => {
      if (telaRef.current !== 'Home') navigation.dispatch(StackActions.popToTop());
      if (tela !== 'Home') navigation.dispatch(CommonActions.navigate({ name: tela }));
      telaRef.current = tela;
    },
    [navigation],
  );

  const rolar = useCallback((modo: 'topo' | 'fim') => {
    const scroll = rolagemRef.current?.current;
    if (!scroll) return;
    if (modo === 'fim') scroll.scrollToEnd({ animated: false });
    else scroll.scrollTo({ y: 0, animated: false });
  }, []);

  const finalizar = useCallback(() => {
    if (!ativoRef.current) return;
    ativoRef.current = false;
    setAtivo(false);
    setExibido(null);
    if (userIdRef.current) marcarTourVisto(userIdRef.current);
    if (telaRef.current !== 'Home') navegar('Home');
    rolar('topo');
    useRecompensasStore.getState().retomar('tour');
  }, [navegar, rolar]);

  const iniciar = useCallback(() => {
    if (ativoRef.current) return;
    ativoRef.current = true;
    telaRef.current = 'Home';
    direcaoRef.current = 1;
    setIndice(0);
    setExibido(null);
    setAtivo(true);
    useRecompensasStore.getState().pausar('tour');
  }, []);

  // se a tela que hospeda o provider for embora com o tour aberto, não deixa a fila pausada
  useEffect(() => () => useRecompensasStore.getState().retomar('tour'), []);

  const irPara = useCallback(
    (proximo: number, direcao: 1 | -1) => {
      if (proximo >= PASSOS_TOUR.length || proximo < 0) {
        finalizar();
        return;
      }
      direcaoRef.current = direcao;
      setIndice(proximo);
    },
    [finalizar],
  );

  // prepara o passo atual: navega, rola, procura e mede o alvo
  useEffect(() => {
    if (!ativo) return;
    const passo = PASSOS_TOUR[indice];
    let cancelado = false;

    (async () => {
      if (passo.tela !== telaRef.current) {
        navegar(passo.tela);
        await esperar(ESPERA_TROCA_TELA_MS);
        if (cancelado) return;
      }

      if (!passo.alvo) {
        setExibido({ indice, rect: null });
        return;
      }

      if (passo.rolar) {
        rolar(passo.rolar);
        await esperar(ESPERA_ROLAGEM_MS);
        if (cancelado) return;
      }

      // o alvo pode ainda estar montando/carregando: tenta a cada 150 ms por até 4 s e só aceita
      // a medida quando ela se repete (layout assentou)
      let ultima: Retangulo | null = null;
      const inicio = Date.now();
      while (!cancelado && Date.now() - inicio < LIMITE_BUSCA_MS) {
        const candidatos = alvosRef.current.get(passo.alvo) ?? [];
        let medida: Retangulo | null = null;
        for (let i = candidatos.length - 1; i >= 0 && !medida; i--) medida = await medir(candidatos[i].ref);
        if (cancelado) return;
        if (medida && ultima && iguais(medida, ultima)) {
          setExibido({ indice, rect: medida });
          return;
        }
        ultima = medida ?? ultima;
        await esperar(INTERVALO_BUSCA_MS);
      }
      if (cancelado) return;

      if (ultima) setExibido({ indice, rect: ultima });
      else if (passo.fallbackCentral) setExibido({ indice, rect: null });
      else irPara(indice + direcaoRef.current, direcaoRef.current); // sem alvo e sem plano B: pula
    })();

    return () => {
      cancelado = true;
    };
  }, [ativo, indice, navegar, rolar, irPara]);

  const pronto = ativo && exibido !== null && exibido.indice === indice;

  const proximo = useCallback(() => {
    if (!pronto) return;
    // último passo = botão "Começar": o som de comemoração já tocou quando a tela do fim apareceu
    if (indice < PASSOS_TOUR.length - 1) {
      tocarSom('avancar');
      feedbackLeve();
    }
    irPara(indice + 1, 1);
  }, [pronto, indice, irPara]);

  const voltar = useCallback(() => {
    if (!pronto) return;
    feedbackToque();
    irPara(Math.max(1, indice - 1), -1);
  }, [pronto, indice, irPara]);

  const pularTour = useCallback(() => {
    feedbackToque();
    finalizar();
  }, [finalizar]);

  const api = useMemo<TourApi>(() => ({ ativo, iniciar, pular: finalizar }), [ativo, iniciar, finalizar]);

  return (
    <RegistroContext.Provider value={registro}>
      <TourContext.Provider value={api}>
        {children}
        <TourOverlay
          visivel={ativo && exibido !== null}
          passo={PASSOS_TOUR[exibido?.indice ?? 0]}
          rect={exibido?.rect ?? null}
          numero={numeroDoPasso(exibido?.indice ?? 0)}
          total={TOTAL_PASSOS_COM_ALVO}
          variante={(exibido?.indice ?? 0) === 0 ? 'abertura' : 'fim'}
          podeVoltar={(exibido?.indice ?? 0) > 1}
          ocupado={!pronto}
          onProximo={proximo}
          onVoltar={voltar}
          onPular={pularTour}
        />
      </TourContext.Provider>
    </RegistroContext.Provider>
  );
}

/** Ref para o componente que um passo do tour destaca. `habilitado=false` não registra. */
export function useTourAlvo(id: string, habilitado = true): React.RefObject<View | null> {
  const ref = useRef<View>(null);
  const registro = useContext(RegistroContext);
  const focado = useIsFocused();

  useEffect(() => {
    if (!registro || !habilitado || !focado) return;
    return registro.registrar(id, ref);
  }, [registro, id, habilitado, focado]);

  return ref;
}

type TourAlvoProps = ViewProps & { id: string; habilitado?: boolean };

/** View que se registra como alvo do tour (collapsable=false: o Android não pode "achatá-la"). */
export function TourAlvo({ id, habilitado = true, children, ...resto }: TourAlvoProps) {
  const ref = useTourAlvo(id, habilitado);
  return (
    <View ref={ref} collapsable={false} {...resto}>
      {children}
    </View>
  );
}

/** Registra o ScrollView da tela para o tour poder rolar até o fim/topo. */
export function useTourRolagem(ref: RefScroll) {
  const registro = useContext(RegistroContext);
  useEffect(() => {
    if (!registro) return;
    return registro.registrarRolagem(ref);
  }, [registro, ref]);
}

export function useTour(): TourApi {
  return useContext(TourContext);
}
