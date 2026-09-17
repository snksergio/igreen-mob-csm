import { describe, it, expect } from "vitest";
import {
  CARREGADORES_ARENA_MEDIDOS,
  ENTRADA_ARENA_MEDIDA,
  LOCAIS_DE_CARGA,
  carregadoresDoLocal,
  nivelDeEntrada,
  potenciaEmUso,
} from "./gestao-carga-mock";

/**
 * Invariantes que ligam o mock à referência — e, nesta tela, duas delas são de DOMÍNIO
 * ELÉTRICO, não de formatação. Parâmetro implausível aqui não é detalhe estético: é o que
 * faz um eletricista desconfiar da tela inteira.
 */

describe("gestao-carga-mock — invariantes da referência", () => {
  it("todo local tem id único — é a chave que abre o painel", () => {
    const ids = LOCAIS_DE_CARGA.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("tem locais suficientes pra paginar em 10 por página", () => {
    expect(LOCAIS_DE_CARGA.length).toBeGreaterThan(10);
  });

  it("todo nome de local vem de uma empresa MOB, como na referência", () => {
    for (const l of LOCAIS_DE_CARGA) {
      expect(l.local).toMatch(/^(IGREEN|PV) MOB - /);
    }
  });

  it("preserva o espaço duplo do nome que a origem tem sujo", () => {
    // `IGREEN MOB -  Rua Santa Juliana` tem DOIS espaços na origem. Normalizar seria
    // "consertar" o dado do cliente — e é o caso que testa se a coluna aguenta.
    expect(LOCAIS_DE_CARGA.some((l) => l.local.includes(" -  "))).toBe(true);
  });

  /** Âncora: Arena 7 BH é o único local cujo painel a referência mostrou. */
  it("Arena 7 BH devolve os parâmetros e carregadores MEDIDOS", () => {
    const arena = LOCAIS_DE_CARGA.find(
      (l) => l.local === "IGREEN MOB - Arena 7 BH",
    )!;

    expect(nivelDeEntrada(arena)).toEqual(ENTRADA_ARENA_MEDIDA);
    expect(carregadoresDoLocal(arena)).toEqual(CARREGADORES_ARENA_MEDIDOS);
    /* Os três medidos estão em `0,0 kW`, então a potência em uso do local é zero — como a
       referência mostra na coluna. */
    expect(potenciaEmUso(arena)).toBe(0);
  });

  /**
   * Limite fixo é um TETO. Acima da corrente máxima seria configuração que a própria tela
   * deveria recusar — e mostrá-la como válida ensina o operador a confiar num valor
   * inválido.
   */
  it("limite fixo e reserva nunca passam da corrente máxima", () => {
    for (const l of LOCAIS_DE_CARGA) {
      const e = nivelDeEntrada(l);
      expect(e.limiteFixoA).toBeLessThanOrEqual(e.correnteMaximaA);
      expect(e.reservaDinamicaA).toBeLessThanOrEqual(e.correnteMaximaA);
    }
  });

  it("tensão é plausível pra corrente: 380V em rede alta, 220V nas outras", () => {
    for (const l of LOCAIS_DE_CARGA) {
      const e = nivelDeEntrada(l);
      expect([220, 380]).toContain(e.tensaoV);
      if (e.correnteMaximaA >= 63) expect(e.tensaoV).toBe(380);
    }
  });

  /**
   * Carregador parado não puxa corrente. Mostrar `12,4 A` num carregador disponível seria
   * mentira sobre o estado da rede — e é o número que o operador usa pra decidir se pode
   * ligar mais um equipamento.
   */
  it("corrente e potência são zero em tudo que não está carregando", () => {
    for (const l of LOCAIS_DE_CARGA) {
      for (const c of carregadoresDoLocal(l)) {
        if (c.status !== "carregando") {
          expect(c.correnteA).toBe(0);
          expect(c.potenciaKw).toBe(0);
        } else {
          expect(c.correnteA).toBeGreaterThan(0);
          expect(c.potenciaKw).toBeGreaterThan(0);
        }
      }
    }
  });

  /** P = V × I / 1000, com a tensão do próprio local. */
  it("potência de quem carrega fecha com tensão × corrente", () => {
    for (const l of LOCAIS_DE_CARGA) {
      const tensao = nivelDeEntrada(l).tensaoV;
      for (const c of carregadoresDoLocal(l)) {
        if (c.status === "carregando") {
          expect(c.potenciaKw).toBeCloseTo((tensao * c.correnteA) / 1000, 1);
        }
      }
    }
  });

  /**
   * O defeito mais fácil de produzir numa tela mestre-detalhe: o número da lista e o do
   * painel divergirem. Aqui não pode, porque a coluna é DERIVADA dos carregadores.
   */
  it("a potência da lista é a soma dos carregadores do painel", () => {
    for (const l of LOCAIS_DE_CARGA) {
      const soma = carregadoresDoLocal(l).reduce((a, c) => a + c.potenciaKw, 0);
      expect(potenciaEmUso(l)).toBeCloseTo(soma, 1);
    }
  });

  /**
   * Trava a decisão do mock contra a captura: a referência estava com a rede toda ociosa,
   * e reproduzir isso literalmente daria 16 linhas de `0,0 kW` — uma tela que não exercita
   * a própria coluna. Arena fica no zero medido; o resto tem vida.
   */
  it("nem toda a rede está parada — a coluna tem o que mostrar", () => {
    const comCarga = LOCAIS_DE_CARGA.filter((l) => potenciaEmUso(l) > 0);
    expect(comCarga.length).toBeGreaterThan(0);
    expect(comCarga.length).toBeLessThan(LOCAIS_DE_CARGA.length);
  });

  it("todo código de carregador tem 12 dígitos, como na origem", () => {
    // `125020001153` — 12 dígitos. Código de tamanho variável denunciaria o mock, e é o
    // valor que se cola num chamado de suporte.
    for (const l of LOCAIS_DE_CARGA) {
      for (const c of carregadoresDoLocal(l)) {
        expect(c.codigo).toMatch(/^\d{12}$/);
      }
    }
  });

  it("todo local tem pelo menos um carregador", () => {
    for (const l of LOCAIS_DE_CARGA) {
      expect(carregadoresDoLocal(l).length).toBeGreaterThan(0);
    }
  });

  it("o painel é determinístico — mesmo local, mesmos dados", () => {
    const l = LOCAIS_DE_CARGA[5];
    expect(nivelDeEntrada(l)).toEqual(nivelDeEntrada(l));
    expect(carregadoresDoLocal(l)).toEqual(carregadoresDoLocal(l));
  });
});
