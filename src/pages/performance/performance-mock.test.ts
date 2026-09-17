import { describe, it, expect } from "vitest";
import {
  CARREGADORES,
  CARREGADORES_POR_LOCAL,
  GRUPOS_DE_METRICAS,
  METRICAS_CARREGADORES,
  METRICAS_OPERACAO,
  TICKS_EIXO_DIAS,
  TODAS_AS_METRICAS,
  escalaDoEixo,
} from "./performance-mock";

/**
 * O que estes testes protegem: as invariantes que ligam o mock à REFERÊNCIA.
 *
 * Não são testes de render — são o contrato do dado. Cada um existe porque quebrá-lo
 * produz uma tela que parece certa e mente: uma série que não fecha com o número ao lado,
 * um eixo com linha-guia duplicada, uma porcentagem passando de 100%.
 */

/** Desfaz a formatação pt-BR pra comparar com o número da série. */
const numero = (s: string) =>
  Number(s.replace(/[R$\s%]/g, "").replace(/\./g, "").replace(",", "."));

describe("performance-mock — invariantes da referência", () => {
  it("a série de Sessões soma exatamente o Total medido (565)", () => {
    const sessoes = METRICAS_OPERACAO.find((m) => m.id === "sessoes")!;
    const soma = sessoes.serie.reduce((a, p) => a + p.valor, 0);

    expect(sessoes.total).toBe("565");
    expect(soma).toBe(565);
  });

  it("toda série tem um ponto por dia do período medido (16, de 01/09 a 16/09)", () => {
    for (const m of TODAS_AS_METRICAS) {
      expect(m.serie).toHaveLength(16);
      expect(m.serie[0].dia).toBe("01/09");
      expect(m.serie[15].dia).toBe("16/09");
    }
  });

  /**
   * Receita e Energia são ADITIVAS: a série tem que somar o Total medido. Tolerância de
   * 1 centavo/0,01 kWh por causa do ponto flutuante da derivação.
   */
  it("Receita e Energia fecham a soma com o Total medido", () => {
    for (const id of ["receita", "energia"]) {
      const m = METRICAS_OPERACAO.find((x) => x.id === id)!;
      const soma = m.serie.reduce((a, p) => a + p.valor, 0);
      expect(soma).toBeCloseTo(numero(m.total!), 1);
    }
  });

  /**
   * Motoristas e as três taxas NÃO somam — motorista único não se acumula entre dias, e
   * "total de disponibilidade" não significa nada. Nesses, a série fecha pela MÉDIA.
   */
  it("Motoristas e as taxas fecham a MÉDIA com o valor medido", () => {
    const porMedia = [
      METRICAS_OPERACAO.find((m) => m.id === "motoristas")!,
      ...METRICAS_CARREGADORES,
    ];
    for (const m of porMedia) {
      const media = m.serie.reduce((a, p) => a + p.valor, 0) / m.serie.length;
      expect(media).toBeCloseTo(numero(m.media), 2);
    }
  });

  /** Porcentagem acima de 100% é o erro que a `amplitude` da derivação existe pra evitar. */
  it("nenhuma métrica percentual passa de 100% em nenhum dia", () => {
    for (const m of METRICAS_CARREGADORES) {
      expect(m.formato).toBe("porcentagem");
      for (const p of m.serie) {
        expect(p.valor).toBeGreaterThan(0);
        expect(p.valor).toBeLessThanOrEqual(100);
      }
    }
  });

  /**
   * L-032 (4): o `domain` máximo do eixo Y tem que ser igual ao maior tick, senão o
   * Recharts desenha uma linha-guia duplicada no topo. A página usa `escalaDoEixo` pros
   * dois, então o que se testa é a função — e que ela cobre o maior ponto de cada série.
   */
  it("escalaDoEixo devolve teto = maior tick, e cobre o pico de toda série", () => {
    for (const m of TODAS_AS_METRICAS) {
      const maior = Math.max(...m.serie.map((p) => p.valor));
      const { teto, ticks } = escalaDoEixo(maior);
      expect(Math.max(...ticks)).toBe(teto);
      expect(ticks[0]).toBe(0);
      expect(teto).toBeGreaterThanOrEqual(maior);
    }
  });

  it("Operação tem Total em TODAS as métricas; Carregadores em NENHUMA", () => {
    // É o que distingue os dois grupos na referência: taxa e percentual não somam.
    expect(METRICAS_OPERACAO.every((m) => m.total !== undefined)).toBe(true);
    expect(METRICAS_CARREGADORES.every((m) => m.total === undefined)).toBe(true);
  });

  it("toda variação traz sinal explícito e unidade de porcentagem", () => {
    for (const m of TODAS_AS_METRICAS) {
      expect(m.variacao).toMatch(/^[+-]\d+,\d{2}%$/);
    }
  });

  it("toda métrica se explica, por ajuda ou por unidade", () => {
    for (const m of TODAS_AS_METRICAS) {
      expect(Boolean(m.ajuda || m.unidade)).toBe(true);
    }
  });

  it("todo id de métrica é único — é a chave da seleção do gráfico", () => {
    const ids = TODAS_AS_METRICAS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("os dois grupos cobrem todas as métricas, sem sobra", () => {
    const somaDosGrupos = GRUPOS_DE_METRICAS.reduce(
      (a, g) => a + g.metricas.length,
      0,
    );
    expect(somaDosGrupos).toBe(TODAS_AS_METRICAS.length);
    expect(TODAS_AS_METRICAS).toHaveLength(7);
  });

  it("o eixo X rotula os dias PARES, de 2 em 2, como a referência", () => {
    expect(TICKS_EIXO_DIAS).toHaveLength(8);
    expect(TICKS_EIXO_DIAS[0]).toBe("02/09");
    expect(TICKS_EIXO_DIAS[7]).toBe("16/09");
  });

  it("a lista achatada de carregadores bate com os grupos, sem duplicata", () => {
    const esperado = CARREGADORES_POR_LOCAL.reduce(
      (a, g) => a + g.carregadores.length,
      0,
    );
    expect(CARREGADORES).toHaveLength(esperado);
    expect(new Set(CARREGADORES).size).toBe(esperado);
  });

  it("todo carregador é rotulado com o local dele", () => {
    // O dropdown agrupa por local, e o mesmo nome repete entre locais ("60 KW Dual") —
    // sem o prefixo, dois locais diferentes viram a mesma chave de seleção.
    for (const c of CARREGADORES) {
      expect(c).toContain(" · ");
    }
  });
});
