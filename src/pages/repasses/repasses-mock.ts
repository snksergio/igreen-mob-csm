/**
 * Mock da tela de Repasses — medida em `/pt/financial/transfers` (2026-09-16).
 *
 * ## O que é medido e o que é derivado
 *
 * **Medido, linha por linha:** mês, ano, repasse líquido, take rate e status das 12 linhas
 * da lista. E, do detalhe de Setembro, as quatro caixas de "Base de cálculo do período"
 * (`R$ 14.659,30 · R$ 1.759,75 · R$ 12.899,55 · R$ 1.031,95`), o texto de ajuda do card de
 * repasse e os rótulos das nove colunas da tabela de transações.
 *
 * **Derivado:** a base de cálculo dos OUTROS onze meses, e a lista de transações de todos.
 *
 * A derivação não é chute — ela se pendura em duas **identidades exatas** que a medição de
 * Setembro revelou:
 *
 * ```
 * total vendido − cupons CPO = total pago      14.659,30 − 1.759,75 = 12.899,55  ✓
 * total pago − take rate     = repasse líquido 12.899,55 −  1.031,95 = 11.867,60  ✓
 * ```
 *
 * Como **repasse e take rate são medidos em toda linha**, `total pago` sai exato pra todas
 * elas. Só `cupons` precisa de uma razão, e ela vem de Setembro (12,003% do vendido). Os
 * testes cobram as duas identidades em todas as 12 linhas.
 */

/* ══════════════════════════════════════════════════════════════════════════
   Lista de repasses
   ══════════════════════════════════════════════════════════════════════════ */

export type StatusRepasse = "em-aberto" | "pago" | "processando";

export interface Repasse {
  id: string;
  mes: string;
  /** 1–12 — pro filtro de mês do painel e pra ordenação, que o nome não dá. */
  mesNumero: number;
  ano: number;
  /** Repasse líquido do período, em reais. MEDIDO. */
  repasseLiquido: number;
  /** Take rate líquido da plataforma, em reais. MEDIDO. */
  takeRate: number;
  status: StatusRepasse;
}

/**
 * As 12 linhas da referência, na ordem em que aparecem lá.
 *
 * ⚠️ **Meses repetidos são reais, não erro de captura.** Junho, Maio, Abril e Março
 * aparecem DUAS vezes, com valores diferentes — um deles sempre próximo de zero
 * (`-R$ 0,01`, `R$ 0,00`, `R$ 0,06`). A referência não mostra a coluna que os distingue,
 * então a distinção não foi medida; manter as duas linhas preserva o fato de que existem.
 * Inventar uma coluna "empresa" pra explicá-las seria inventar dado.
 *
 * E os centavos negativos ficam: `-R$ 0,01` é o tipo de valor que só aparece em sistema
 * real, e é exatamente o caso que a formatação tem que aguentar sem quebrar.
 */
export const REPASSES: Repasse[] = [
  { id: "r-2026-09", mes: "Setembro", mesNumero: 9, ano: 2026, repasseLiquido: 11867.6, takeRate: 1031.95, status: "em-aberto" },
  { id: "r-2026-08", mes: "Agosto", mesNumero: 8, ano: 2026, repasseLiquido: 25569.89, takeRate: 2223.47, status: "em-aberto" },
  { id: "r-2026-07", mes: "Julho", mesNumero: 7, ano: 2026, repasseLiquido: 26022.77, takeRate: 2262.83, status: "em-aberto" },
  { id: "r-2026-06b", mes: "Junho", mesNumero: 6, ano: 2026, repasseLiquido: -0.01, takeRate: 0, status: "em-aberto" },
  { id: "r-2026-06", mes: "Junho", mesNumero: 6, ano: 2026, repasseLiquido: 23933.82, takeRate: 2081.2, status: "em-aberto" },
  { id: "r-2026-05b", mes: "Maio", mesNumero: 5, ano: 2026, repasseLiquido: 0, takeRate: 0, status: "em-aberto" },
  { id: "r-2026-05", mes: "Maio", mesNumero: 5, ano: 2026, repasseLiquido: 15596.78, takeRate: 1356.23, status: "em-aberto" },
  { id: "r-2026-04b", mes: "Abril", mesNumero: 4, ano: 2026, repasseLiquido: -0.01, takeRate: 0, status: "em-aberto" },
  { id: "r-2026-04", mes: "Abril", mesNumero: 4, ano: 2026, repasseLiquido: 21038.99, takeRate: 2348.19, status: "em-aberto" },
  { id: "r-2026-03b", mes: "Março", mesNumero: 3, ano: 2026, repasseLiquido: 0.06, takeRate: 0, status: "em-aberto" },
  { id: "r-2026-03", mes: "Março", mesNumero: 3, ano: 2026, repasseLiquido: 18120.73, takeRate: 1777.04, status: "em-aberto" },
  { id: "r-2026-02", mes: "Fevereiro", mesNumero: 2, ano: 2026, repasseLiquido: 123.2, takeRate: 10.72, status: "em-aberto" },
];

/**
 * Anos do filtro.
 *
 * A referência mostra só `2026` — é um seletor de ANO, não de período (diferente de
 * Transações e Performance, que filtram por intervalo de datas). Os anteriores entram pra
 * o controle ter função; 2026 é o default, como lá.
 */
export const ANOS = [2026, 2025, 2024];

/* ══════════════════════════════════════════════════════════════════════════
   Detalhe de um repasse
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Razão `cupons CPO / total vendido`, medida em Setembro.
 *
 * É o ÚNICO número derivado da base de cálculo — os outros três saem das identidades
 * exatas. Anotado como constante e não inline pra ficar claro que há exatamente uma
 * suposição aqui, e de onde ela vem.
 */
const RAZAO_CUPOM = 1759.75 / 14659.3; // 0,12003

export interface BaseDeCalculo {
  totalVendido: number;
  cuponsCpo: number;
  totalPago: number;
  takeRate: number;
}

/**
 * Base de cálculo de um repasse, pelas identidades medidas.
 *
 * `pago` e `takeRate` são exatos (os dois vêm da linha). `vendido` e `cupons` saem da razão
 * de Setembro — e pra Setembro reproduzem os valores medidos dentro do arredondamento, que
 * é o que o teste confere.
 */
export function baseDeCalculo(r: Repasse): BaseDeCalculo {
  const totalPago = r.repasseLiquido + r.takeRate;
  const totalVendido = totalPago / (1 - RAZAO_CUPOM);
  return {
    totalVendido,
    cuponsCpo: totalVendido - totalPago,
    totalPago,
    takeRate: r.takeRate,
  };
}

/** Uma transação do extrato do período. */
export interface TransacaoDoRepasse {
  id: string;
  /** `DD/MM/AAAA • HHh MMm` — o formato da referência, com o bullet. */
  dataHora: string;
  local: string;
  carregador: string;
  motorista: string;
  energiaKwh: number;
  /** `HHh MMmin` — o formato da referência. */
  duracao: string;
  valorBruto: number;
  /** Desconto do cupom CPO. `0` quando a referência mostra "-". */
  cupom: number;
  /** ⚠️ SEMPRE `valorBruto - cupom`. Identidade medida, e invariante testada. */
  totalPago: number;
}

/* Vocabulário medido no extrato de Setembro da referência — locais, carregadores e
   motoristas reais que aparecem lá. Reusado pra as transações derivadas dos outros meses
   ficarem plausíveis em vez de genéricas. */
const LOCAIS_EXTRATO = [
  "IGREEN MOB - BIG MAIS Gov Valadares",
  "IGREEN MOB - Restaurante Fazendinha Brumadinho MG",
  "IGREEN MOB - Posto Via Dupla",
  "IGREEN MOB - Chofferando",
  "IGREEN MOB - SEDE",
  "IGREEN MOB - Duo FOOD",
];

const CARREGADORES_EXTRATO = [
  "FZ2503000145",
  "325110001503",
  "C06010E2EAFG",
  "202304220244",
  "202304220119",
];

const MOTORISTAS_EXTRATO = [
  "Ricardo pecly Castro",
  "ALEXANDRE CONDE",
  "Carlos Fernandes",
  "Ronald Ângelo",
  "VINICIUS RAMOS",
  "Débora Nunes Alencar",
  "Caio Figueiredo Lima",
];

/** PRNG determinístico — mesma semente, mesmo extrato. Sem isto o painel muda a cada render. */
function prng(semente: number) {
  let s = semente;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/**
 * As transações do período — 34 a 51 por mês, o bastante pra paginar.
 *
 * ⚠️ **Não somam o total do mês, e é de propósito.** Forçar a soma a fechar exigiria gerar
 * a base inteira com a distribuição real; quem quer o total lê o card de repasse no topo,
 * que é exato. A quantidade varia por mês (semente do id) porque extrato de tamanho fixo
 * em todos os meses é o tipo de detalhe que denuncia mock.
 *
 * O que É invariante aqui, e testado: **`valorBruto − cupom = totalPago`** em toda linha.
 * Medido na referência (`R$ 10,69 − R$ 3,21 = R$ 7,48`), e é a identidade que explica por
 * que existem três colunas de dinheiro em vez de uma.
 */
export function transacoesDoRepasse(r: Repasse): TransacaoDoRepasse[] {
  /* Semente derivada do id: cada repasse tem seu extrato, estável entre renders. */
  const rnd = prng(r.mesNumero * 7919 + r.ano + (r.id.endsWith("b") ? 101 : 0));
  const ultimoDia = 16; // a referência abre no dia da medição

  /* Repasse perto de zero quase não teve movimento — as linhas de centavo (`-R$ 0,01`,
     `R$ 0,00`) ganham extrato curto, e não 40 transações que não somariam nada. */
  const quantidade = Math.abs(r.repasseLiquido) < 1 ? 3 : 34 + Math.floor(rnd() * 18);

  return Array.from({ length: quantidade }, (_, i) => {
    /* Vários dias por transação: com 40 linhas em 16 dias, mais de uma cai no mesmo dia —
       que é o que acontece de verdade num extrato. */
    const dia = Math.max(1, ultimoDia - Math.floor(i / 3));
    const hora = 8 + Math.floor(rnd() * 12);
    const minuto = Math.floor(rnd() * 60);
    const energiaKwh = Number((1 + rnd() * 18).toFixed(2));
    const minutos = 5 + Math.floor(rnd() * 90);
    /* R$ 2,50/kWh é a tarifa que a tela de Transações usa — as duas telas falam da mesma
       operação, então divergir de preço entre elas seria incoerência interna. */
    const valorBruto = Number((energiaKwh * 2.5).toFixed(2));
    /* ~40% das linhas têm cupom, na proporção de 30% do bruto — as duas coisas medidas no
       extrato de Setembro (3 de 8 linhas com cupom, R$ 3,21 sobre R$ 10,69 = 30%). */
    const temCupom = rnd() < 0.4;
    const cupom = temCupom ? Number((valorBruto * 0.3).toFixed(2)) : 0;

    return {
      id: `${r.id}-t${i}`,
      dataHora: `${String(dia).padStart(2, "0")}/${String(r.mesNumero).padStart(2, "0")}/${r.ano} • ${String(hora).padStart(2, "0")}h ${String(minuto).padStart(2, "0")}m`,
      local: LOCAIS_EXTRATO[Math.floor(rnd() * LOCAIS_EXTRATO.length)],
      carregador: CARREGADORES_EXTRATO[Math.floor(rnd() * CARREGADORES_EXTRATO.length)],
      motorista: MOTORISTAS_EXTRATO[Math.floor(rnd() * MOTORISTAS_EXTRATO.length)],
      energiaKwh,
      duracao: `${String(Math.floor(minutos / 60)).padStart(2, "0")}h ${String(minutos % 60).padStart(2, "0")}min`,
      valorBruto,
      cupom,
      totalPago: Number((valorBruto - cupom).toFixed(2)),
    };
  });
}

/**
 * Valores da base de cálculo MEDIDOS em Setembro.
 *
 * Exportados só pro teste: é contra eles que a derivação de `baseDeCalculo` é conferida.
 * Se um dia a razão de cupom mudar, é aqui que o teste acusa.
 */
export const BASE_SETEMBRO_MEDIDA = {
  totalVendido: 14659.3,
  cuponsCpo: 1759.75,
  totalPago: 12899.55,
  takeRate: 1031.95,
};

/** Texto literal da referência, no card de repasse. */
export const AJUDA_REPASSE =
  "Esse valor é uma soma do repasse dos locais que estão selecionados.";

/** Texto literal da referência, sob o título da base de cálculo. */
export const AJUDA_BASE_DE_CALCULO =
  "Valores que servem de base para o cálculo do repasse e das comissões.";
