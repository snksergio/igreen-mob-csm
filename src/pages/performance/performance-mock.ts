import type { LucideIcon } from "lucide-react";
import { Briefcase, DollarSign, PlugZap, User, Zap } from "lucide-react";

/**
 * Mock da tela de Performance — números e rótulos MEDIDOS na referência.
 *
 * Medição de 2026-09-16 em `/pt/performance?period=thisMonth`, período 01/09–16/09/2026,
 * com todos os carregadores e locais selecionados. Os textos de ajuda são **literais** do
 * payload de i18n da origem (chave `performance.Tooltip`), não paráfrase: são o que
 * explica ao operador como cada número é calculado.
 *
 * ⚠️ Os AGREGADOS são os da referência, não gerados. O que é derivado é a **série diária**
 * de cada métrica — a origem só expõe a de Sessões no gráfico, e as outras seis precisam
 * de uma pra o gráfico reagir ao clique. A derivação está em `serieDerivada`, e a regra é
 * uma só: **a série tem que fechar com o número medido** (somando, ou pela média).
 */

/* ══════════════════════════════════════════════════════════════════════════
   A série medida — é dela que todas as outras derivam
   ══════════════════════════════════════════════════════════════════════════ */

/** Ponto do gráfico — um por dia do período. */
export interface PontoSerie {
  /** `DD/MM`. O eixo X rotula de 2 em 2 dias, mas há um ponto por dia. */
  dia: string;
  valor: number;
}

/** Os 16 dias do período medido. */
const DIAS = [
  "01/09", "02/09", "03/09", "04/09", "05/09", "06/09", "07/09", "08/09",
  "09/09", "10/09", "11/09", "12/09", "13/09", "14/09", "15/09", "16/09",
];

/**
 * Sessões por dia — a única série que a referência desenha.
 *
 * Soma **565**, o mesmo Total da métrica Sessões: invariante da origem, e é o que o teste
 * cobra. Um gráfico que não fecha com o número ao lado faz o operador duvidar dos dois.
 */
const SESSOES_POR_DIA = [
  28, 35, 41, 33, 46, 52, 38, 27, 31, 44, 39, 30, 25, 34, 36, 26,
];

const TOTAL_SESSOES = SESSOES_POR_DIA.reduce((a, b) => a + b, 0); // 565
const MEDIA_SESSOES = TOTAL_SESSOES / SESSOES_POR_DIA.length;

/**
 * Perfil de movimento do período: quanto cada dia desvia da média.
 *
 * É o que dá às séries derivadas a MESMA forma da real — picos no fim de semana, vale no
 * dia 13. Inventar uma forma nova por métrica faria sete gráficos que não conversam entre
 * si, quando na prática receita, energia e sessões sobem e descem juntas.
 */
const PERFIL = SESSOES_POR_DIA.map((s) => s / MEDIA_SESSOES);

/**
 * Como a série se relaciona com o número medido.
 *
 * `soma`  → os dias somam o Total (sessões, receita, energia).
 * `media` → os dias têm o valor medido como MÉDIA. É o caso das taxas e o de Motoristas:
 *           motorista único não soma entre dias (a mesma pessoa recarrega no dia 2 e no
 *           dia 9 e conta uma vez no período), então "somar 198" não significaria nada.
 */
type Agregacao = "soma" | "media";

/**
 * Deriva a série diária de uma métrica.
 *
 * `amplitude` comprime o desvio do perfil. Existe por causa das **porcentagens**: com o
 * perfil cru, Disponibilidade (média 78,58%) chegaria a **115%** no dia de pico — número
 * impossível, e o tipo de erro que passa desapercebido porque o gráfico continua bonito.
 * Com 0,25, o desvio máximo cai pra ±12% e o teto fica em ~88%.
 */
function serieDerivada(
  valor: number,
  agregacao: Agregacao,
  amplitude: number,
): PontoSerie[] {
  const base = agregacao === "soma" ? valor / SESSOES_POR_DIA.length : valor;
  return DIAS.map((dia, i) => ({
    dia,
    valor: base * (1 + amplitude * (PERFIL[i] - 1)),
  }));
}

/* ══════════════════════════════════════════════════════════════════════════
   Escala do eixo Y
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Teto e ticks do eixo, em 4 intervalos.
 *
 * ⚠️ Os dois saem da MESMA função de propósito. A **L-032 (4)** exige que o `domain`
 * máximo seja igual ao maior tick — senão o Recharts desenha uma linha-guia duplicada no
 * topo. Calculados em lugares separados, um dia divergem.
 */
export function escalaDoEixo(maior: number): { teto: number; ticks: number[] } {
  const bruto = maior / 4;
  const magnitude = 10 ** Math.floor(Math.log10(bruto));
  const passo = Math.ceil(bruto / magnitude) * magnitude;
  const teto = passo * 4;
  return { teto, ticks: [0, passo, passo * 2, passo * 3, teto] };
}

/* ══════════════════════════════════════════════════════════════════════════
   As métricas
   ══════════════════════════════════════════════════════════════════════════ */

/** Como formatar o valor — decide separador, decimais e sufixo. */
export type FormatoMetrica = "inteiro" | "moeda" | "decimal" | "porcentagem";

export interface Metrica {
  id: string;
  /** Nome como aparece na referência. */
  rotulo: string;
  /** Unidade entre parênteses, quando a referência mostra uma ao lado do nome. */
  unidade?: string;
  /** Texto de ajuda literal da origem, quando existe. */
  ajuda?: string;
  /** Já formatado em pt-BR, como a referência exibe. Ausente nas taxas — ver `SEM_TOTAL`. */
  total?: string;
  /** Média por dia (Operação) ou média do período (Carregadores). */
  media: string;
  /** Variação em ponto percentual, com sinal. */
  variacao: string;
  formato: FormatoMetrica;
  /** Série diária pro gráfico. */
  serie: PontoSerie[];
  /** O que o gráfico mostra no cabeçalho quando esta métrica está ativa. */
  rotuloDoEixo: string;
  /**
   * Rótulo do número grande, no cabeçalho da esquerda.
   *
   * Escrito por extenso em cada métrica em vez de montado (``)
   * porque a montagem produz frases ruins em português: "Média de Tx. de Ocupação".
   * Ele CARREGA o nome da métrica — é o que permitiu tirar o título e o subtítulo
   * separados da esquerda e deixar de ter dois títulos disputando tamanho no card.
   */
  rotuloDoDestaque: string;
  /**
   * Ícone da linha na lista. A referência põe um em cada métrica — e as três de
   * Carregadores compartilham o MESMO (tomada), o que é informação: elas falam do
   * equipamento, não da operação.
   */
  icone: LucideIcon;
}

/**
 * Tabela/lista `Operação` — 4 métricas, com Total e Média por dia.
 */
export const METRICAS_OPERACAO: Metrica[] = [
  {
    id: "sessoes",
    rotulo: "Sessões",
    ajuda: "Número total de sessões de recarga realizadas.",
    total: "565",
    media: "33,24",
    variacao: "+0,91%",
    formato: "inteiro",
    icone: Briefcase,
    // A única série NÃO derivada: são os valores medidos.
    serie: DIAS.map((dia, i) => ({ dia, valor: SESSOES_POR_DIA[i] })),
    rotuloDoEixo: "sessões por dia",
    rotuloDoDestaque: "Total de sessões no período",
  },
  {
    id: "receita",
    rotulo: "Receita",
    unidade: "(R$)",
    total: "12.838,96",
    media: "755,23",
    variacao: "-2,58%",
    formato: "moeda",
    icone: DollarSign,
    serie: serieDerivada(12838.96, "soma", 1),
    rotuloDoEixo: "receita por dia",
    rotuloDoDestaque: "Receita total no período (R$)",
  },
  {
    id: "energia",
    rotulo: "Energia",
    unidade: "(kWh)",
    total: "6.103,55",
    media: "359,03",
    variacao: "-8,90%",
    formato: "decimal",
    icone: Zap,
    serie: serieDerivada(6103.55, "soma", 1),
    rotuloDoEixo: "kWh por dia",
    rotuloDoDestaque: "Energia total no período (kWh)",
  },
  {
    id: "motoristas",
    rotulo: "Motoristas",
    ajuda: "Quantidade de motoristas únicos.",
    total: "198",
    media: "22,56",
    variacao: "+3,68%",
    formato: "inteiro",
    icone: User,
    /* `media`, não `soma`: motorista único não soma entre dias. A série tem 22,56 como
       média, e por isso NÃO fecha 198 — o 198 é a contagem de distintos no período. */
    serie: serieDerivada(22.56, "media", 0.6),
    rotuloDoEixo: "motoristas únicos por dia",
    rotuloDoDestaque: "Motoristas únicos no período",
  },
];

/**
 * Tabela/lista `Carregadores` — 3 métricas, só Média e Variação.
 *
 * ⚠️ **Não tem Total, e é isso que distingue as duas.** Taxa e percentual não somam —
 * "total de disponibilidade" não significa nada. Era a pergunta aberta nº 1 do inventário.
 */
export const METRICAS_CARREGADORES: Metrica[] = [
  {
    id: "disponibilidade",
    rotulo: "Disponibilidade",
    ajuda:
      "% do tempo em que os carregadores estiveram disponíveis para uso (24hrs).",
    media: "78,58%",
    variacao: "-2,63%",
    formato: "porcentagem",
    icone: PlugZap,
    serie: serieDerivada(78.58, "media", 0.25),
    rotuloDoEixo: "% de disponibilidade por dia",
    rotuloDoDestaque: "Disponibilidade média no período",
  },
  {
    id: "ocupacao",
    rotulo: "Tx. de Ocupação",
    ajuda:
      "% do tempo em que os carregadores estiveram ocupados conectados a um veículo (24hrs).",
    media: "3,36%",
    variacao: "-0,59%",
    formato: "porcentagem",
    icone: PlugZap,
    serie: serieDerivada(3.36, "media", 0.5),
    rotuloDoEixo: "% de ocupação por dia",
    rotuloDoDestaque: "Taxa de ocupação média no período",
  },
  {
    id: "utilizacao",
    rotulo: "Tx. de Utilização",
    ajuda:
      "% de utilização de energia (kWh) disponível nas estações de recarga (24hrs).",
    media: "1,67%",
    variacao: "-8,74%",
    formato: "porcentagem",
    icone: PlugZap,
    serie: serieDerivada(1.67, "media", 0.5),
    rotuloDoEixo: "% de utilização por dia",
    rotuloDoDestaque: "Taxa de utilização média no período",
  },
];

/** As duas listas, na ordem da referência, com o título de cada uma. */
export const GRUPOS_DE_METRICAS = [
  {
    id: "operacao",
    titulo: "Operação",
    /* Subtítulo nosso, não medido: diz QUAIS colunas o grupo tem, que é justamente o
       que separa os dois. O padrão vem do card "Report" do showcase de gráficos do DS,
       onde a coluna da direita tem título + linha de contexto. */
    subtitulo: "Total e média por dia",
    metricas: METRICAS_OPERACAO,
  },
  {
    id: "carregadores",
    titulo: "Carregadores",
    /* Curto de propósito: a célula do título tem ~204px na coluna da lista, e a
       versão longa ("Médias do período — taxas não somam") quebrava em duas linhas e
       desalinhava as faixas de coluna ao lado. */
    subtitulo: "Médias — taxas não somam",
    metricas: METRICAS_CARREGADORES,
  },
];

/** Toda métrica, achatada — pra resolver a selecionada por id. */
export const TODAS_AS_METRICAS = GRUPOS_DE_METRICAS.flatMap((g) => g.metricas);

/**
 * Texto de ajuda do cabeçalho `Variação`, literal da origem.
 * Vale pras DUAS listas — é a mesma chave `performance.Tooltip.variation` nas duas.
 */
export const AJUDA_VARIACAO =
  "Variação entre a média do período selecionado vs. média do período anterior equivalente - Ex.: Se período selecionado for de 8/04 a 14/04 (uma semana), o período anterior equivalente será de 01/04 a 07/04 (a semana anterior à selecionada).";

/**
 * Rótulos do eixo X — de 2 em 2 dias, começando no SEGUNDO ponto.
 *
 * A referência rotula `02/09 · 04/09 … 16/09`, os dias pares. O `interval={1}` do Recharts
 * espaça igual, mas começa no índice 0 e produziria os ímpares. Derivado dos dias, não
 * escrito à mão: mudar o período reajusta sozinho.
 */
export const TICKS_EIXO_DIAS = DIAS.filter((_, i) => i % 2 === 1);

/* ══════════════════════════════════════════════════════════════════════════
   Carregadores do filtro
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Carregadores agrupados por local — a forma do dropdown da referência.
 *
 * Lá são 31 carregadores em 22 locais, cada um com nome e potência. Aqui ficam 8 locais
 * (os mesmos do escopo global) com 12 carregadores: o bastante pra exercitar agrupamento,
 * busca e rótulo composto sem virar lista infinita no mock.
 */
export interface GrupoDeCarregadores {
  local: string;
  carregadores: string[];
}

export const CARREGADORES_POR_LOCAL: GrupoDeCarregadores[] = [
  {
    local: "IGREEN MOB - Usina Solar Vinhedo",
    carregadores: ["AC 7,4 KW Vaga 1", "DC 40 KW Vaga 2"],
  },
  {
    local: "IGREEN MOB - BIG MAIS Gov Valadares",
    carregadores: ["AC 7,4 KW", "DC 40 KW"],
  },
  {
    local: "IGREEN MOB - SEDE",
    carregadores: ["DC 40 KW - 1", "AC 7,4 KW - 2"],
  },
  { local: "IGREEN MOB - Posto Via Dupla", carregadores: ["60 KW Dual"] },
  {
    local: "IGREEN MOB - Arena 7 BH",
    carregadores: ["AC 7,4 KW Vaga 1", "AC 7,4 KW Vaga 2"],
  },
  { local: "IGREEN MOB - Duo FOOD", carregadores: ["60 KW Dual"] },
  {
    local: "IGREEN MOB - Shopping Colombo",
    carregadores: ["DC 40kW - VAGA 1 - ESQUERDA"],
  },
  { local: "PV MOB - Estacionamento", carregadores: ["AC 7,4 KW - Carga lenta"] },
];

/** Lista achatada — o que o estado de seleção guarda. */
export const CARREGADORES = CARREGADORES_POR_LOCAL.flatMap((g) =>
  g.carregadores.map((c) => `${g.local} · ${c}`),
);
