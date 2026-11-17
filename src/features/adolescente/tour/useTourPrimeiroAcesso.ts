// src/features/adolescente/tour/useTourPrimeiroAcesso.ts
//
// Oferece o tour logo depois das boas-vindas do primeiro acesso: quando `boasVindasPendente`
// vira false (o aluno fechou o modal) e a Home pode mostrar animações cheias, espera 500 ms e
// inicia o tour, uma vez só. Só dispara para quem VIU as boas-vindas nesta montagem da Home e
// ainda não viu o tour; contas antigas não recebem o tour automático (rever fica em Mais).
import { useEffect, useRef, useState } from 'react';
import { useTour } from './TourContext';
import { jaViuTour } from './tourStorage';

type Params = {
  userId: string | null;
  boasVindasPendente: boolean;
  podeIniciar: boolean;
};

const ATRASO_MS = 500;

export function useTourPrimeiroAcesso({ userId, boasVindasPendente, podeIniciar }: Params) {
  const { iniciar, ativo } = useTour();
  const viuBoasVindasRef = useRef(false);
  const disparouRef = useRef(false);
  // espelho de disparouRef em estado, para a Home poder reagir (ver `aguardandoTour`)
  const [resolvido, setResolvido] = useState(false);

  if (boasVindasPendente) viuBoasVindasRef.current = true;

  useEffect(() => {
    if (!userId || boasVindasPendente || !podeIniciar || ativo) return;
    if (!viuBoasVindasRef.current || disparouRef.current) return;

    let cancelado = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      if (await jaViuTour(userId)) {
        disparouRef.current = true;
        setResolvido(true);
        return;
      }
      if (cancelado) return;
      timer = setTimeout(() => {
        if (cancelado) return;
        disparouRef.current = true;
        setResolvido(true);
        iniciar();
      }, ATRASO_MS);
    })();

    return () => {
      cancelado = true;
      if (timer) clearTimeout(timer);
    };
  }, [userId, boasVindasPendente, podeIniciar, ativo, iniciar]);

  // true entre "fechou as boas-vindas" e "o tour começou (ou foi dispensado por já ter sido visto)":
  // quem mostra outras telas cheias na Home espera esse intervalo para não passar na frente do tour
  return { aguardandoTour: viuBoasVindasRef.current && !resolvido };
}
