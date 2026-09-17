import type { DateRange } from "@snksergio/design-system";
import { mesCorrente } from "~/components/periodo";
import { GEO_DOS_LOCAIS } from "~/pages/monitoramento/monitoramento-mock";
import { CARREGADORES } from "~/pages/carregadores/carregadores-mock";
import { MOTORISTAS } from "~/pages/motoristas/motoristas-mock";

/**
 * Mock do Dashboard — medido em `/pt/dashboard` (2026-09-16).
 *
 * ## Tudo aqui é FUNÇÃO DO PERÍODO, e isso é a decisão central do arquivo
 *
 * A referência tem **quatro** seletores de data espalhados pela tela: um no topo, um em
 * "Evolução no período", um por aba e um só pra "Disponibilidade dos carregadores". Eles
 * não conversam — dá pra deixar o topo em setembro e a evolução em agosto, e a tela não
 * avisa. A pedido do operador, aqui existe **um** recorte, no cabeçalho, e ele manda em
 * tudo (a exceção é a disponibilidade, que é uma janela de 24h e não um intervalo — ver
 * `JANELAS_DE_DISPONIBILIDADE`).
 *
 * A consequência é que nada pode ser número fixo: cada KPI, cada barra e cada linha de
 * ranking se recalcula a partir de `serieDoPeriodo(periodo)`. Números cravados no código
 * pareceriam funcionar e mentiriam no primeiro clique no seletor.
 *
 * ## O delta compara com o período ANTERIOR DE MESMO TAMANHO
 *
 * A referência escreve "último período" nas pílulas sem dizer qual é. Aqui é literal: um
 * intervalo de 16 dias compara com os 16 dias imediatamente anteriores. Qualquer outra
 * definição (mês anterior, mesmo período do ano passado) daria um número diferente pro
 * mesmo rótulo.
 *
 * ## ⚠️ 579 recargas aqui × 64 transações na tela de Transações
 *
 * Não é inconsistência por descuido, é escala. A referência faz o mesmo: o dashboard soma
 * o período inteiro e a tabela pagina. Nosso `transacoes-mock` materializa 64 linhas
 * COMPLETAS (cada uma com série de potência, itens de cobrança e dez campos de painel);
 * gerar as ~579 pra bater o total multiplicaria o bundle por nove para que 515 delas nunca
 * fossem abertas. O dashboard agrega por dia, que é o que ele precisa.
 *
 * ## Vocabulário
 *
 * As séries da referência se chamam `Spott`/`CPO` e `Conta PluGo`/`Spott`. Aqui são
 * **App MOB** (o app próprio) e **Roaming** (quem chega por outra rede) — a distinção que
 * os nomes originais faziam, sem citar produto de terceiro nem a marca proibida.
 */

/* ────────────────────────────────────────────────────────────────────────────
   Base
   ──────────────────────────────────────────────────────────────────────────── */

export const LOCAIS_DO_DASHBOARD = Object.keys(GEO_DOS_LOCAIS);

/** As duas origens de uma recarga. Ver o JSDoc do topo pro porquê dos nomes. */
export const ORIGENS = ["App MOB", "Roaming"] as const;
export type Origem = (typeof ORIGENS)[number];

/** PRNG determinístico — mesma semente, mesmo dia, mesmo número. */
function prng(semente: number) {
  let s = semente;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** `Date` → semente estável. É o que faz um dia ter sempre os mesmos números. */
function sementeDoDia(d: Date): number {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function iso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** `2026-09-16` → `16/09`. Rótulo curto do eixo X. */
export function diaCurto(isoLocal: string): string {
  const [, mes, dia] = isoLocal.split("-");
  return `${dia}/${mes}`;
}

/* ────────────────────────────────────────────────────────────────────────────
   A série diária — a fonte de tudo
   ──────────────────────────────────────────────────────────────────────────── */

export interface DiaDoDashboard {
  /** `yyyy-MM-dd`. */
  data: string;
  recargasApp: number;
  recargasRoaming: number;
  /** Reais faturados via app próprio. */
  brutoApp: number;
  /** Reais faturados via CPO/roaming. */
  brutoCpo: number;
  energiaKwh: number;
  /** Quantas das recargas do dia usaram cupom. */
  comCupom: number;
  /** Minutos somados de sessão no dia. */
  duracaoMin: number;
  /**
   * Minutos somados de OCIOSIDADE — cabo conectado depois que a carga terminou.
   *
   * ⚠️ É campo próprio, e não "tempo do período menos tempo ocupado". A 1ª versão
   * calculava assim e dava **12h 26min** por sessão: ela media a frota parada de
   * madrugada, que não é ociosidade — é a operação fechada. Ociosidade no domínio de
   * recarga é o que a tarifa de ociosidade cobra: o carro que ficou plugado depois de
   * carregar, ocupando a vaga. É também o que alimenta a fatia "Ociosidade" da receita
   * por tipo, então o mesmo número explica as duas telas.
   */
  ociosoMin: number;
  /** Motoristas distintos que recarregaram no dia. */
  motoristas: number;
}

/**
 * Um dia de operação.
 *
 * ⚠️ O fim de semana rende menos, de propósito: com volume liso todos os dias, o gráfico
 * de barras vira uma cerca e não se lê nada dele — e o "Horários de pico" por dia da
 * semana não teria o que mostrar. A referência tem essa variação.
 */
function gerarDia(d: Date): DiaDoDashboard {
  const rnd = prng(sementeDoDia(d));
  const fimDeSemana = d.getDay() === 0 || d.getDay() === 6;
  const fator = fimDeSemana ? 0.55 : 1;

  const recargasApp = Math.round((26 + rnd() * 22) * fator);
  const recargasRoaming = Math.round(rnd() * 4 * fator);
  const recargas = recargasApp + recargasRoaming;

  /* Ticket em torno de R$ 29 — o "Ticket médio por recarga" da referência é R$ 29,11, e
     este é o número do qual ele cai por média, não um valor separado. */
  const ticket = 24 + rnd() * 11;
  const bruto = recargas * ticket;
  /* O CPO é fatia pequena e constante na referência (a série azul quase some). */
  const brutoCpo = bruto * (0.02 + rnd() * 0.04);

  return {
    data: iso(d),
    recargasApp,
    recargasRoaming,
    brutoApp: Math.round((bruto - brutoCpo) * 100) / 100,
    brutoCpo: Math.round(brutoCpo * 100) / 100,
    energiaKwh: Math.round(recargas * (9 + rnd() * 3.5) * 100) / 100,
    comCupom: Math.round(recargas * (0.28 + rnd() * 0.12)),
    duracaoMin: Math.round(recargas * (42 + rnd() * 20)),
    ociosoMin: Math.round(recargas * (60 + rnd() * 75)),
    motoristas: Math.max(1, Math.round(recargas * (0.55 + rnd() * 0.25))),
  };
}

/** Normaliza o recorte: sem seleção, o mês corrente — a mesma regra das outras telas. */
function intervalo(periodo: DateRange | undefined): { de: Date; ate: Date } {
  const p = periodo?.from ? periodo : mesCorrente();
  const de = p.from as Date;
  return { de, ate: p.to ?? de };
}

/** Quantos dias o recorte cobre, inclusive as duas pontas. */
export function diasNoPeriodo(periodo: DateRange | undefined): number {
  const { de, ate } = intervalo(periodo);
  return Math.max(
    1,
    Math.round((ate.getTime() - de.getTime()) / 86_400_000) + 1,
  );
}

export function serieDoPeriodo(periodo: DateRange | undefined): DiaDoDashboard[] {
  const { de } = intervalo(periodo);
  const total = diasNoPeriodo(periodo);
  return Array.from({ length: total }, (_, i) =>
    gerarDia(new Date(de.getFullYear(), de.getMonth(), de.getDate() + i)),
  );
}

/**
 * Os mesmos N dias imediatamente antes do recorte — a base do "último período".
 *
 * Existe como função separada, e não como um segundo parâmetro de `serieDoPeriodo`, porque
 * o deslocamento é regra de negócio: mudar "período anterior" de posição é mudar o
 * significado de toda pílula de delta da tela, e isso tem de acontecer num lugar só.
 */
export function serieAnterior(periodo: DateRange | undefined): DiaDoDashboard[] {
  const { de } = intervalo(periodo);
  const total = diasNoPeriodo(periodo);
  const inicio = new Date(
    de.getFullYear(),
    de.getMonth(),
    de.getDate() - total,
  );
  return Array.from({ length: total }, (_, i) =>
    gerarDia(
      new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i),
    ),
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Totais e KPIs
   ──────────────────────────────────────────────────────────────────────────── */

export interface TotaisDoPeriodo {
  recargas: number;
  bruto: number;
  energiaKwh: number;
  motoristas: number;
  comCupom: number;
  /** kWh por recarga. */
  kwhMedio: number;
  /** Minutos por recarga. */
  duracaoMedia: number;
  /** Reais por recarga. */
  ticketMedio: number;
  /** Reais por carregador ativo no período. */
  brutoPorCarregador: number;
  /** Minutos de ociosidade por recarga. */
  ociosoMedio: number;
}

export function totais(serie: DiaDoDashboard[]): TotaisDoPeriodo {
  const soma = (f: (d: DiaDoDashboard) => number) =>
    serie.reduce((a, d) => a + f(d), 0);

  const recargas = soma((d) => d.recargasApp + d.recargasRoaming);
  const bruto = soma((d) => d.brutoApp + d.brutoCpo);
  const energiaKwh = soma((d) => d.energiaKwh);
  const duracaoMin = soma((d) => d.duracaoMin);
  const ociosoMin = soma((d) => d.ociosoMin);

  /* ⚠️ Motoristas ÚNICOS não é a soma dos diários: quem recarrega em três dias contaria
     três vezes. O fator 0,42 é a taxa de retorno embutida no mock — sem ele, o KPI
     passaria de 200 para ~700 num período de 16 dias e a tela diria que a base cresce
     todo dia. */
  const motoristas = Math.round(soma((d) => d.motoristas) * 0.42);

  return {
    recargas,
    bruto: Math.round(bruto * 100) / 100,
    energiaKwh: Math.round(energiaKwh * 100) / 100,
    motoristas,
    comCupom: soma((d) => d.comCupom),
    kwhMedio: recargas ? energiaKwh / recargas : 0,
    duracaoMedia: recargas ? duracaoMin / recargas : 0,
    ticketMedio: recargas ? bruto / recargas : 0,
    ociosoMedio: recargas ? ociosoMin / recargas : 0,
    brutoPorCarregador: CARREGADORES.length
      ? bruto / CARREGADORES.length
      : 0,
  };
}

/** Variação percentual entre dois períodos. `null` quando não há base de comparação. */
export function variacao(atual: number, anterior: number): number | null {
  if (!anterior) return null;
  return ((atual - anterior) / anterior) * 100;
}

/* ────────────────────────────────────────────────────────────────────────────
   Carregadores — estado da frota (não depende do período)
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Distribuição por status.
 *
 * ⚠️ `Carregando` sai do mock de Monitoramento, não do de Carregadores: lá o status é só
 * `Online`/`Offline`, e "carregando" é estado do PLUGUE. Somar os três a partir de fontes
 * diferentes daria total maior que a frota — aqui os três saem da MESMA contagem.
 */
export function carregadoresPorStatus() {
  const total = CARREGADORES.length;
  const offline = CARREGADORES.filter((c) => c.status === "Offline").length;
  /* Carregando é uma fração dos online, determinística pela frota. */
  const carregando = Math.max(1, Math.round((total - offline) * 0.04));
  const disponivel = total - offline - carregando;
  return [
    { chave: "disponivel", rotulo: "Disponível", valor: disponivel },
    { chave: "carregando", rotulo: "Carregando", valor: carregando },
    { chave: "offline", rotulo: "Offline", valor: offline },
  ];
}

/**
 * AC × DC × Desconhecido, pelo NOME do equipamento.
 *
 * ⚠️ Pela potência, "Desconhecido" era sempre zero e a fatia sumia da rosca — o operador
 * notou a ausência. E zero por construção é pior que zero por acaso: o rótulo existe na
 * referência justamente porque parte da frota não declara a corrente.
 *
 * Aqui o critério é o mesmo que a operação usa: o nome do carregador diz `AC 7,4 KW` ou
 * `DC 40 KW` quando alguém preencheu, e diz só `7,4 kW` quando não preencheu. Os sem
 * prefixo são os desconhecidos — e é informação real do cadastro, não enfeite. A tela de
 * Carregadores registra essa inconsistência de nomenclatura da origem.
 *
 * ⚠️ A fatia zerada continua saindo da lista: uma fatia de 0% desenha uma linha de 0px na
 * rosca e uma linha na legenda dizendo "0". Só que agora ela não é zero.
 */
export function carregadoresPorCorrente() {
  const prefixo = (nome: string) => nome.trim().toUpperCase();
  const ac = CARREGADORES.filter((c) => prefixo(c.nome).startsWith("AC")).length;
  const dc = CARREGADORES.filter((c) => prefixo(c.nome).startsWith("DC")).length;
  return [
    { chave: "ac", rotulo: "AC", valor: ac },
    { chave: "dc", rotulo: "DC", valor: dc },
    {
      chave: "desconhecido",
      rotulo: "Desconhecido",
      valor: CARREGADORES.length - ac - dc,
    },
  ].filter((f) => f.valor > 0);
}

/* ────────────────────────────────────────────────────────────────────────────
   Movimentação por UF — o mapa de calor da rede
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Código IBGE de cada UF. É a chave que a malha do IBGE usa (`properties.codarea`).
 *
 * ⚠️ O `ChoroplethMap` do DS chaveia `values` pelo **código**, não pela sigla — a malha
 * baixada com `qualidade=minima` não traz nome nenhum, só `codarea`. Sem esta tabela o
 * mapa renderiza cinza inteiro, sem erro.
 */
export const CODIGO_DA_UF: Record<string, string> = {
  RO: "11", AC: "12", AM: "13", RR: "14", PA: "15", AP: "16", TO: "17",
  MA: "21", PI: "22", CE: "23", RN: "24", PB: "25", PE: "26", AL: "27",
  SE: "28", BA: "29", MG: "31", ES: "32", RJ: "33", SP: "35",
  PR: "41", SC: "42", RS: "43", MS: "50", MT: "51", GO: "52", DF: "53",
};

export const SIGLA_DA_UF: Record<string, string> = Object.fromEntries(
  Object.entries(CODIGO_DA_UF).map(([sigla, codigo]) => [codigo, sigla]),
);

export interface MovimentacaoDeUf {
  uf: string;
  /** Código IBGE — o que o mapa consome. */
  codigo: string;
  recargas: number;
  receita: number;
  locais: number;
}

/**
 * Recargas e receita somadas por estado, a partir do ranking de locais.
 *
 * Deriva do MESMO `rankingDeLocais`, e não de uma distribuição própria: dois números
 * para "quanto rende São Paulo" numa tela só é o defeito que ninguém reproduz, porque
 * cada um parece certo onde está.
 */
export function movimentacaoPorUf(
  serie: DiaDoDashboard[],
): MovimentacaoDeUf[] {
  const porUf = new Map<string, MovimentacaoDeUf>();

  for (const linha of rankingDeLocais(serie)) {
    const uf = GEO_DOS_LOCAIS[linha.local]?.uf;
    if (!uf) continue;
    const atual = porUf.get(uf) ?? {
      uf,
      codigo: CODIGO_DA_UF[uf] ?? "",
      recargas: 0,
      receita: 0,
      locais: 0,
    };
    atual.recargas += linha.recargas;
    atual.receita += linha.receita;
    atual.locais += 1;
    porUf.set(uf, atual);
  }

  return [...porUf.values()]
    .map((u) => ({ ...u, receita: Math.round(u.receita * 100) / 100 }))
    .sort((a, b) => b.recargas - a.recargas);
}

/* ────────────────────────────────────────────────────────────────────────────
   Financeiro — monetização e comportamento
   ──────────────────────────────────────────────────────────────────────────── */

/** Os quatro cupons da referência, com os códigos dela (não há dado pessoal aqui). */
export const CUPONS_DO_PERIODO = [
  "PVMOB30",
  "FERNANDO100",
  "MAT100",
  "ALEMDOCOMBUSTIVEL20",
];

/**
 * Uso de cupom por código.
 *
 * A referência tem uma fatia dominante (95%) e três resíduos. Isso é informação e não
 * acidente: um cupom carrega a campanha e os outros três não pegaram. Preservado.
 */
export function usoDeCupons(serie: DiaDoDashboard[]) {
  const total = serie.reduce((a, d) => a + d.comCupom, 0);
  const pesos = [0.9541, 0.0204, 0.0204, 0.0051];
  const fatias = CUPONS_DO_PERIODO.map((codigo, i) => ({
    chave: codigo,
    rotulo: codigo,
    valor: Math.round(total * pesos[i]),
  }));
  /* Sobra do arredondamento vai pra maior fatia — a soma tem de fechar com o total. */
  const soma = fatias.reduce((a, f) => a + f.valor, 0);
  fatias[0].valor += total - soma;
  return fatias;
}

/** Receita por tipo de cobrança — recarga, ociosidade e ativação. */
export function receitaPorTipo(serie: DiaDoDashboard[]) {
  const bruto = serie.reduce((a, d) => a + d.brutoApp + d.brutoCpo, 0);
  const ociosidade = Math.round(bruto * 0.0429 * 100) / 100;
  const ativacao = Math.round(bruto * 0.0153 * 100) / 100;
  return [
    {
      chave: "recarga",
      rotulo: "Recarga",
      valor: Math.round((bruto - ociosidade - ativacao) * 100) / 100,
    },
    { chave: "ociosidade", rotulo: "Ociosidade", valor: ociosidade },
    { chave: "ativacao", rotulo: "Ativação", valor: ativacao },
  ];
}

/** Receita por origem — App MOB × Roaming. */
export function receitaPorOrigem(serie: DiaDoDashboard[]) {
  return [
    {
      chave: "app",
      rotulo: "App MOB",
      valor: Math.round(serie.reduce((a, d) => a + d.brutoApp, 0) * 100) / 100,
    },
    {
      chave: "roaming",
      rotulo: "Roaming",
      valor: Math.round(serie.reduce((a, d) => a + d.brutoCpo, 0) * 100) / 100,
    },
  ];
}

export const DIAS_DA_SEMANA = [
  "SEG",
  "TER",
  "QUA",
  "QUI",
  "SEX",
  "SÁB",
  "DOM",
] as const;
export type DiaDaSemana = (typeof DIAS_DA_SEMANA)[number];

/**
 * Recargas por hora num dia da semana.
 *
 * ⚠️ As 24 horas SEMPRE aparecem, inclusive as zeradas. Um gráfico que omite as horas sem
 * recarga comprime a madrugada e faz o pico das 10h parecer colado no das 15h — some
 * justamente a informação de que a operação tem vales.
 */
export function horariosDePico(
  serie: DiaDoDashboard[],
  dia: DiaDaSemana,
): { hora: string; recargas: number }[] {
  const indice = DIAS_DA_SEMANA.indexOf(dia);
  const doDia = serie.filter((d) => {
    const [a, m, x] = d.data.split("-").map(Number);
    /* `getDay()` é 0=domingo; a lista começa na segunda. */
    return (new Date(a, m - 1, x).getDay() + 6) % 7 === indice;
  });
  const recargas = doDia.reduce(
    (a, d) => a + d.recargasApp + d.recargasRoaming,
    0,
  );

  /* Curva de dia útil: vale de madrugada, pico às 10h, segundo pico às 15h. Os pesos
     somam ~1 e são reescalados pelo volume real do recorte. */
  const PESOS = [
    0.004, 0.003, 0.008, 0.003, 0.004, 0.004, 0.012, 0.02, 0.035, 0.06, 0.145,
    0.075, 0.06, 0.025, 0.06, 0.095, 0.05, 0.075, 0.015, 0.03, 0.02, 0.018,
    0.03, 0.015,
  ];
  const somaPesos = PESOS.reduce((a, p) => a + p, 0);

  return PESOS.map((peso, h) => ({
    hora: String(h).padStart(2, "0"),
    recargas: Math.round((recargas * peso) / somaPesos),
  }));
}

/* ────────────────────────────────────────────────────────────────────────────
   Rankings
   ──────────────────────────────────────────────────────────────────────────── */

export interface LinhaDeRankingDeLocal {
  local: string;
  empresa: string;
  recargas: number;
  energiaKwh: number;
  receita: number;
}

/**
 * Distribui o total do período pelos locais com uma curva de cauda longa.
 *
 * ⚠️ Não é distribuição uniforme: num ranking uniforme o 1º e o 20º empatam e a coluna `#`
 * não significa nada. A curva `1/(i+1.6)` reproduz o que a referência mostra — o topo
 * concentra e a cauda é residual.
 */
function pesosDeCaudaLonga(n: number): number[] {
  const brutos = Array.from({ length: n }, (_, i) => 1 / (i + 1.6));
  const soma = brutos.reduce((a, b) => a + b, 0);
  return brutos.map((b) => b / soma);
}

export function rankingDeLocais(
  serie: DiaDoDashboard[],
): LinhaDeRankingDeLocal[] {
  const t = totais(serie);
  const pesos = pesosDeCaudaLonga(LOCAIS_DO_DASHBOARD.length);
  return LOCAIS_DO_DASHBOARD.map((local, i) => ({
    local,
    empresa: "PV MOB",
    recargas: Math.round(t.recargas * pesos[i]),
    energiaKwh: Math.round(t.energiaKwh * pesos[i] * 100) / 100,
    receita: Math.round(t.bruto * pesos[i] * 100) / 100,
  })).sort((a, b) => b.receita - a.receita);
}

export interface LinhaDeRankingDeMotorista {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  transacoes: number;
  energiaKwh: number;
  totalGasto: number;
}

/**
 * Top motoristas — vem de `MOTORISTAS`, o mesmo cadastro fictício das outras telas.
 *
 * ⚠️ A referência lista nome, e-mail e telefone REAIS de pessoas. Nada disso entra aqui:
 * os nomes são inventados, os e-mails apontam pro domínio do mock e os telefones são
 * inválidos por construção. É a mesma regra do resto do projeto.
 */
export function rankingDeMotoristas(
  serie: DiaDoDashboard[],
): LinhaDeRankingDeMotorista[] {
  const t = totais(serie);
  const top = [...MOTORISTAS]
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 12);
  const pesos = pesosDeCaudaLonga(top.length);
  return top.map((m, i) => ({
    id: m.id,
    nome: m.nome,
    email: m.email,
    telefone: m.telefone,
    /* O ranking usa a fatia do período, não o acumulado do cadastro — senão ele não
       mudaria ao trocar o recorte, que é o contrato desta tela. */
    transacoes: Math.max(1, Math.round(t.recargas * pesos[i] * 0.55)),
    energiaKwh: Math.round(t.energiaKwh * pesos[i] * 0.55 * 100) / 100,
    totalGasto: Math.round(t.bruto * pesos[i] * 0.55 * 100) / 100,
  }));
}

export interface LinhaDeRankingDeCarregador {
  id: string;
  carregador: string;
  local: string;
  empresa: string;
  receita: number;
  transacoes: number;
  /** kWh por sessão. */
  kwhMedio: number;
  /** Minutos por recarga. */
  tempoMedioMin: number;
}

export function rankingDeCarregadores(
  serie: DiaDoDashboard[],
): LinhaDeRankingDeCarregador[] {
  const t = totais(serie);
  const pesos = pesosDeCaudaLonga(CARREGADORES.length);
  return CARREGADORES.map((c, i) => {
    const transacoes = Math.max(1, Math.round(t.recargas * pesos[i]));
    const energia = t.energiaKwh * pesos[i];
    return {
      id: c.id,
      carregador: c.nome,
      local: c.local,
      empresa: c.empresa,
      receita: Math.round(t.bruto * pesos[i] * 100) / 100,
      transacoes,
      kwhMedio: Math.round((energia / transacoes) * 100) / 100,
      tempoMedioMin: Math.round(t.duracaoMedia),
    };
  }).sort((a, b) => b.receita - a.receita);
}

/* ────────────────────────────────────────────────────────────────────────────
   Aba Carregadores — ocupação e disponibilidade
   ──────────────────────────────────────────────────────────────────────────── */

export interface LinhaDeOcupacao {
  id: string;
  local: string;
  carregador: string;
  /** Percentual do tempo do período com sessão ativa. */
  ocupacao: number;
  energiaKwh: number;
  receita: number;
}

export function rankingDeOcupacao(serie: DiaDoDashboard[]): LinhaDeOcupacao[] {
  const t = totais(serie);
  const minutosDoPeriodo = serie.length * 24 * 60;
  const pesos = pesosDeCaudaLonga(CARREGADORES.length);
  return CARREGADORES.map((c, i) => {
    const minutosOcupado = t.duracaoMedia * (t.recargas * pesos[i]);
    return {
      id: c.id,
      local: c.local,
      carregador: c.nome,
      ocupacao:
        Math.round((minutosOcupado / minutosDoPeriodo) * 100 * 100) / 100,
      energiaKwh: Math.round(t.energiaKwh * pesos[i] * 100) / 100,
      receita: Math.round(t.bruto * pesos[i] * 100) / 100,
    };
  }).sort((a, b) => b.ocupacao - a.ocupacao);
}

/** Métricas da aba, todas derivadas da série e da frota. */
export function metricasDeOcupacao(serie: DiaDoDashboard[]) {
  const t = totais(serie);
  const minutosDoPeriodo = serie.length * 24 * 60 * CARREGADORES.length;
  const minutosOcupado = t.duracaoMedia * t.recargas;
  return {
    ocupacaoMedia: minutosDoPeriodo
      ? (minutosOcupado / minutosDoPeriodo) * 100
      : 0,
    ociosoMin: t.ociosoMedio,
    sessoesPorDia:
      serie.length && CARREGADORES.length
        ? t.recargas / serie.length / CARREGADORES.length
        : 0,
  };
}

/**
 * Janela de disponibilidade — 24 blocos por carregador, cada um uma hora.
 *
 * ⚠️ Esta é a ÚNICA coisa da tela que não obedece ao recorte do cabeçalho, e o motivo é de
 * significado: disponibilidade é uma janela deslizante que termina agora ("24 horas atrás"
 * → "Agora"), não um intervalo entre duas datas. Aplicar um recorte de 16 dias a uma barra
 * de 24 blocos daria 16 dias por bloco, e o gráfico deixaria de dizer o que promete. Por
 * isso ela tem seletor próprio — que é a única duplicação de filtro que sobrevive aqui.
 */
export const JANELAS_DE_DISPONIBILIDADE = [
  { id: "24h", rotulo: "Últimas 24 horas", blocos: 24, minutosPorBloco: 60 },
  { id: "7d", rotulo: "Últimos 7 dias", blocos: 28, minutosPorBloco: 360 },
  { id: "15d", rotulo: "Últimos 15 dias", blocos: 30, minutosPorBloco: 720 },
  { id: "30d", rotulo: "Últimos 30 dias", blocos: 30, minutosPorBloco: 1440 },
  { id: "60d", rotulo: "Últimos 60 dias", blocos: 30, minutosPorBloco: 2880 },
  { id: "90d", rotulo: "Últimos 90 dias", blocos: 30, minutosPorBloco: 4320 },
] as const;

/**
 * ⚠️ O número de BLOCOS fica entre 24 e 30 em todas as janelas, e o que muda é quanto
 * tempo cada bloco vale.
 *
 * Não é preguiça de gerar mais pontos: a faixa tem largura fixa, e 90 blocos nela dariam
 * ~9px cada — fatias finas demais para distinguir uma queda de um artefato de
 * arredondamento. Trinta blocos de três dias dizem a mesma coisa com granularidade que o
 * olho resolve. É o mesmo motivo pelo qual o `StatusBars` do DS usa 60 a 72 ticks em
 * cards de largura inteira e nós usamos 24 no nosso, mais estreito.
 */

export type JanelaId = (typeof JANELAS_DE_DISPONIBILIDADE)[number]["id"];

export interface DisponibilidadeDeCarregador {
  id: string;
  local: string;
  carregador: string;
  /** `true` em cada bloco em que o equipamento esteve no ar. */
  blocos: boolean[];
  quedas: number;
  offlineMin: number;
  /** Está fora AGORA — o último bloco é `false`. */
  offlineAgora: boolean;
  /** Percentual de blocos no ar. */
  disponibilidade: number;
}

export function disponibilidadeDaFrota(
  janela: JanelaId,
): DisponibilidadeDeCarregador[] {
  const def = JANELAS_DE_DISPONIBILIDADE.find((j) => j.id === janela)!;

  return CARREGADORES.map((c, i) => {
    /* A semente inclui a janela: sem isso, "24 horas" e "90 dias" desenhariam a MESMA
       faixa, e trocar o filtro não mudaria nada na tela. */
    const rnd = prng(7000 + i * 131 + def.blocos * 17);
    /* Quem está Offline no cadastro fica fora a janela inteira — a barra tem de concordar
       com a coluna de status da tela de Carregadores, senão as duas telas se contradizem
       sobre o mesmo equipamento. */
    const foraSempre = c.status === "Offline";

    const blocos = Array.from({ length: def.blocos }, () =>
      foraSempre ? false : rnd() > 0.06,
    );

    let quedas = 0;
    for (let b = 0; b < blocos.length; b++) {
      if (!blocos[b] && (b === 0 || blocos[b - 1])) quedas++;
    }
    const fora = blocos.filter((b) => !b).length;

    return {
      id: c.id,
      local: c.local,
      carregador: c.nome,
      blocos,
      quedas,
      offlineMin: fora * def.minutosPorBloco,
      offlineAgora: !blocos[blocos.length - 1],
      disponibilidade: ((blocos.length - fora) / blocos.length) * 100,
    };
  }).sort((a, b) => a.disponibilidade - b.disponibilidade);
}

/** Abaixo disto, o carregador entra na contagem de "disponibilidade baixa". */
export const PISO_DE_DISPONIBILIDADE = 95;

/* ────────────────────────────────────────────────────────────────────────────
   Formatação
   ──────────────────────────────────────────────────────────────────────────── */

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });

export const numero = (v: number, casas = 0) =>
  v.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });

export const percentual = (v: number, casas = 2) => `${numero(v, casas)}%`;

/** `51` → `00h 51m` · `96` → `01h 36m`. O formato da referência. */
export function duracaoHm(minutos: number): string {
  const m = Math.round(minutos);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}h ${String(m % 60).padStart(2, "0")}m`;
}

/** `1440` → `1d 0h 0min`. O formato da coluna "TEMPO OFFLINE" da referência. */
export function duracaoDhm(minutos: number): string {
  const d = Math.floor(minutos / 1440);
  const h = Math.floor((minutos % 1440) / 60);
  return `${d}d ${h}h ${minutos % 60}min`;
}

export const DASHBOARD_TEXTOS = {
  aviso:
    "Dados dos locais selecionados no topo, no período escolhido aqui. As três abas obedecem ao mesmo recorte.",
  deltaBase: "vs. período anterior",
} as const;
