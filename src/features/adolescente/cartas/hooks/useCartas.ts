import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { buscarCartas, marcarCartaVista } from '../services/cartasService';
import { contarNovas, progressoAlbum, type CartaGuia } from '../utils/cartas';

export function useCartas() {
  const { userId } = useAuth();
  const [cartas, setCartas] = useState<CartaGuia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  const carregar = useCallback(async () => {
    if (!userId) return;
    try {
      setErro(false);
      setCartas(await buscarCartas(userId));
    } catch (e) {
      console.error('Erro ao carregar cartas:', e);
      setErro(true);
    } finally {
      setCarregando(false);
    }
  }, [userId]);

  // recarrega sempre que a tela ganha foco (lições, refeições e receitas mudam em outras telas)
  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  /** Apaga o pontinho de "nova" na hora e avisa o banco. */
  const marcarVista = useCallback((cartaId: string) => {
    setCartas((atuais) => atuais.map((c) => (c.id === cartaId ? { ...c, nova: false } : c)));
    void marcarCartaVista(cartaId);
  }, []);

  const progresso = useMemo(() => progressoAlbum(cartas), [cartas]);
  const novas = useMemo(() => contarNovas(cartas), [cartas]);

  return { cartas, progresso, novas, carregando, erro, recarregar: carregar, marcarVista };
}
