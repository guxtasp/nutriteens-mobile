// src/features/adolescente/hooks/usePerfilUsuario.ts
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../shared/contexts/AuthContext';

interface PerfilUsuario {
  nome: string | null;
  dataNascimento: string | null; // YYYY-MM-DD
  tipoInstituicao: string | null; // 'PUBLICA' | 'PRIVADA' | 'FILANTROPICA'
  instituicaoEnsino: string | null; // nome real da escola, se preenchido
  codigoParticipante: string | null; // NT-000001
}

export function usePerfilUsuario() {
  const { userId } = useAuth();
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!userId) return;

    let ativo = true;
    setCarregando(true);

    supabase
      .from('profiles')
      .select('nome, data_nascimento, tipo_instituicao, instituicao_ensino, codigo_participante')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (!ativo) return;
        if (error) {
          console.error('Erro ao carregar perfil:', error);
          setPerfil(null);
        } else {
          setPerfil({
            nome: data.nome,
            dataNascimento: data.data_nascimento,
            tipoInstituicao: mapTipoInstituicao(data.tipo_instituicao),
            instituicaoEnsino: data.instituicao_ensino,
            codigoParticipante: data.codigo_participante,
          });
        }
        setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [userId]);

  return { perfil, carregando };
}

function mapTipoInstituicao(tipo: string | null): string | null {
  switch (tipo) {
    case 'PUBLICA':
      return 'Pública';
    case 'PRIVADA':
      return 'Privada';
    case 'FILANTROPICA':
      return 'Filantrópica';
    default:
      return null;
  }
}