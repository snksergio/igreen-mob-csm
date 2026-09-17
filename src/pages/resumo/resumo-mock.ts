import { CARREGADORES as CARREGADORES_CADASTRADOS } from "~/pages/carregadores/carregadores-mock";
import { TRANSACOES_MOCK, type Transacao } from "~/pages/transacoes/transacoes-mock";

/**
 * Indicadores da tela de Resumo — medidos em `/pt/resume?period=thisMonth` (2026-09-16).
 *
 * ## Tudo é DERIVADO das transações, e por isso os números não batem com a referência
 *
 * A origem mostra `R$ 13.099,77`, `6.220,78 kWh`, `202` clientes e `576` transações — os
 * totais de 576 recargas reais. O mock tem 64. Copiar os cinco números medidos daria um
 * cabeçalho que **contradiz a tabela logo abaixo dele**: `576 transações` sobre uma lista de
 * 64, e um faturamento que não é a soma de nenhuma coluna.
 *
 * Num resumo, o KPI é a soma do que está embaixo. Se ele diverge, a tela deixa de ser um
 * resumo e vira dois dados que discordam — e quem confere sempre acha que o errado é a
 * tabela. Então os cinco saem de `TRANSACOES_MOCK`, e o teste trava isso.
 *
 * O que É medido e está fiel: os cinco rótulos, a ordem deles, e o sentido da seta de cada
 * um (faturamento e energia caindo, clientes e transações subindo).
 */

export interface IndicadorDoResumo {
  id: string;
  /** Rótulo literal da referência. */
  label: string;
  /** Já formatado — cada um tem unidade própria. */
  valor: string;
  /** A linha de detalhe abaixo do valor. */
  detalhe: string;
  /**
   * Variação no período. `null` no status dos carregadores: ele é uma contagem do parque
   * AGORA, não um acumulado do recorte — uma seta ali sugeriria tendência onde não há.
   */
  variacao: { pct: number; sobe: boolean } | null;
  /**
   * ⚠️ `subirEhBom` é DECISÃO, não derivação (regra do `Kpi` no DS). Aqui os quatro que têm
   * seta são bons subindo — mas se um dia entrar "tempo médio de espera", subir será ruim.
   */
  subirEhBom: boolean;
  tone: "brand" | "success" | "info" | "warning" | "neutral";
  icone: "carregador" | "dinheiro" | "energia" | "clientes" | "transacoes";
}

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const numero = (n: number, casas = 0) =>
  n.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });

/** Totais do período — a fonte única dos cinco cards. */
export function totaisDoPeriodo(linhas: Transacao[] = TRANSACOES_MOCK) {
  const faturamento = linhas.reduce((a, t) => a + t.valor, 0);
  const energia = linhas.reduce((a, t) => a + t.energiaKwh, 0);
  /* Clientes ATENDIDOS, não cadastrados: quem aparece na lista do período. Contar a base
     inteira daria um número que não muda com o filtro de data. */
  const clientes = new Set(linhas.map((t) => t.motorista)).size;
  const carregadoresAtivos = CARREGADORES_CADASTRADOS.filter((c) => c.ativo).length;

  return {
    faturamento,
    energia,
    clientes,
    transacoes: linhas.length,
    carregadoresAtivos,
    carregadoresTotal: CARREGADORES_CADASTRADOS.length,
  };
}

/**
 * Os cinco indicadores, na ordem da referência.
 *
 * As variações são as ÚNICAS coisas não derivadas aqui — não há período anterior no mock pra
 * comparar. Os sentidos (dois caindo, dois subindo) são os medidos; os percentuais são
 * plausíveis e fixos, não aleatórios, pra que a tela não mude de humor a cada render.
 */
export function indicadoresDoResumo(
  linhas: Transacao[] = TRANSACOES_MOCK,
): IndicadorDoResumo[] {
  const t = totaisDoPeriodo(linhas);

  return [
    {
      id: "carregadores",
      label: "Status dos Carregadores",
      valor: numero(t.carregadoresAtivos),
      /* Plural concordado: com 1 carregador fora, "1 desativados" é o tipo de erro que
         faz o leitor duvidar do número ao lado. */
      detalhe: (() => {
        const fora = t.carregadoresTotal - t.carregadoresAtivos;
        return `${numero(t.carregadoresTotal)} no parque · ${numero(fora)} ${
          fora === 1 ? "desativado" : "desativados"
        }`;
      })(),
      variacao: null,
      subirEhBom: true,
      tone: "brand",
      icone: "carregador",
    },
    {
      id: "faturamento",
      label: "Faturamento",
      valor: brl.format(t.faturamento),
      detalhe: `${brl.format(
        t.transacoes ? t.faturamento / t.transacoes : 0,
      )} por recarga`,
      variacao: { pct: 8.4, sobe: false },
      subirEhBom: true,
      tone: "success",
      icone: "dinheiro",
    },
    {
      id: "energia",
      label: "Consumo de Energia",
      valor: `${numero(t.energia, 2)} kWh`,
      detalhe: `${numero(
        t.transacoes ? t.energia / t.transacoes : 0,
        2,
      )} kWh por recarga`,
      variacao: { pct: 5.1, sobe: false },
      subirEhBom: true,
      tone: "info",
      icone: "energia",
    },
    {
      id: "clientes",
      label: "Clientes Atendidos",
      valor: numero(t.clientes),
      detalhe: `${numero(
        t.clientes ? t.transacoes / t.clientes : 0,
        1,
      )} recargas por cliente`,
      variacao: { pct: 12.6, sobe: true },
      subirEhBom: true,
      tone: "brand",
      icone: "clientes",
    },
    {
      id: "transacoes",
      label: "Total de Transações",
      valor: numero(t.transacoes),
      detalhe: `${numero(
        linhas.filter((l) => l.status === "finalizado").length,
      )} finalizadas`,
      variacao: { pct: 9.3, sobe: true },
      subirEhBom: true,
      tone: "neutral",
      icone: "transacoes",
    },
  ];
}

export const RESUMO_TEXTOS = {
  baixarDados: "Baixar dados",
} as const;
