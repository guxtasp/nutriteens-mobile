// src/features/adolescente/metricas/demo.ts
//
// Liga os dados fictícios na tela "Minha jornada" SÓ para teste local.
// Para usar: troque `null` por um cenário, salve e recarregue o app.
//   'natural' | 'mistura' | 'industrializado' | 'poucos' | 'vazio'
// Em build de produção (`__DEV__` falso) isto é ignorado, qualquer que seja o valor.
// Lembre de voltar para `null` antes de commitar.
import type { CenarioDemo } from './dadosDemo';

export const CENARIO_DEMO: CenarioDemo | null = 'mistura';

