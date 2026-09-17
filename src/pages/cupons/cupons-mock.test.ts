import { describe, it, expect } from "vitest";
import {
  CUPONS,
  HOJE,
  LOCAIS_DO_CUPOM,
  gerarCodigo,
  statusDoCupom,
} from "./cupons-mock";

/**
 * Invariantes de Cupons.
 *
 * ⚠️ Esta é a primeira tela do projeto **sem âncora de dado**: a referência não tinha nenhum
 * cupom cadastrado. Então não há teste comparando com uma linha medida — o que estes cobrem
 * são as regras de DOMÍNIO, que é o que sobra quando não há o que copiar.
 */

describe("cupons-mock — invariantes de domínio", () => {
  it("todo cupom tem id e código únicos", () => {
    const ids = CUPONS.map((c) => c.id);
    const codigos = CUPONS.map((c) => c.codigo);
    expect(new Set(ids).size).toBe(ids.length);
    // Código duplicado faria dois cupons responderem à mesma digitação do motorista.
    expect(new Set(codigos).size).toBe(codigos.length);
  });

  it("todo código é caixa alta, sem espaço e sem acento", () => {
    // É o que o motorista digita na recarga — espaço ou acento quebram na aplicação.
    for (const c of CUPONS) expect(c.codigo).toMatch(/^[A-Z0-9]+$/);
  });

  /**
   * O status é DERIVADO das datas. Um campo gravado envelheceria sozinho: o cupom venceria
   * e a coluna continuaria dizendo "Ativo" até alguém rodar um job.
   */
  describe("statusDoCupom", () => {
    it("é agendado quando o início ainda não chegou", () => {
      const c = CUPONS.find((x) => x.inicio > HOJE);
      expect(c && statusDoCupom(c)).toBe("agendado");
    });

    it("é inativo quando o término já passou", () => {
      const c = CUPONS.find(
        (x) => x.inicio <= HOJE && x.termino !== null && x.termino < HOJE,
      );
      expect(c && statusDoCupom(c)).toBe("inativo");
    });

    it("`nunca expira` é ativo mesmo sem término", () => {
      const c = CUPONS.find((x) => x.regras.nuncaExpira);
      expect(c?.termino).toBeNull();
      expect(c && statusDoCupom(c)).toBe("ativo");
    });

    it("muda com o tempo — é isso que um campo gravado não faria", () => {
      const c = CUPONS.find((x) => x.termino !== null && statusDoCupom(x) === "ativo")!;
      const depoisDoFim = new Date(c.termino!.getTime() + 1000);
      expect(statusDoCupom(c, depoisDoFim)).toBe("inativo");
    });
  });

  /**
   * As três abas de status precisam ter conteúdo, senão uma aba vazia parece defeito da
   * tela e não recorte do dado.
   */
  it("há cupons nos três status", () => {
    const status = new Set(CUPONS.map((c) => statusDoCupom(c)));
    expect(status.has("ativo")).toBe(true);
    expect(status.has("agendado")).toBe(true);
    expect(status.has("inativo")).toBe(true);
  });

  it("os dois tipos aparecem — o filtro de tipo tem o que filtrar", () => {
    const tipos = new Set(CUPONS.map((c) => c.tipo));
    expect(tipos.size).toBe(2);
  });

  /**
   * Cupom de primeira recarga libera a recarga inteira; percentual nele seria um número que
   * a tela nunca mostra e que alguém leria como desconto.
   */
  it("só o cupom de desconto tem percentual", () => {
    for (const c of CUPONS) {
      if (c.tipo === "desconto") {
        expect(c.percentual).toBeGreaterThan(0);
        expect(c.percentual).toBeLessThanOrEqual(100);
      } else {
        expect(c.percentual).toBeNull();
      }
    }
  });

  it("todo cupom vale em pelo menos um local", () => {
    // É a regra que o formulário cobra com "É necessário selecionar pelo menos um local".
    for (const c of CUPONS) {
      expect(c.locais.length).toBeGreaterThan(0);
      for (const l of c.locais) expect(LOCAIS_DO_CUPOM).toContain(l);
    }
  });

  it("existem cupons em todos os locais e em poucos", () => {
    // O seletor desenha diferente nos dois casos — "todos marcados" e "alguns marcados".
    const todos = CUPONS.filter((c) => c.locais.length === LOCAIS_DO_CUPOM.length);
    const poucos = CUPONS.filter((c) => c.locais.length < LOCAIS_DO_CUPOM.length);
    expect(todos.length).toBeGreaterThan(0);
    expect(poucos.length).toBeGreaterThan(0);
  });

  it("o término é sempre depois do início, quando existe", () => {
    for (const c of CUPONS) {
      if (c.termino) expect(c.termino.getTime()).toBeGreaterThan(c.inicio.getTime());
    }
  });

  it("os usos nunca passam do limite declarado", () => {
    // Um contador acima do teto diria que o cupom foi usado depois de esgotado.
    for (const c of CUPONS) {
      if (c.regras.limiteDeUsos !== null) {
        expect(c.usos).toBeLessThanOrEqual(c.regras.limiteDeUsos);
      }
    }
  });

  it("a lista de locais não tem repetido e está ordenada", () => {
    expect(new Set(LOCAIS_DO_CUPOM).size).toBe(LOCAIS_DO_CUPOM.length);
    const ordenada = [...LOCAIS_DO_CUPOM].sort((a, b) => a.localeCompare(b, "pt-BR"));
    expect(LOCAIS_DO_CUPOM).toEqual(ordenada);
  });

  it("há locais suficientes pra lista precisar de busca e scroll", () => {
    expect(LOCAIS_DO_CUPOM.length).toBeGreaterThan(20);
  });

  describe("gerarCodigo", () => {
    it("tem 8 caracteres, todos em caixa alta", () => {
      expect(gerarCodigo()).toMatch(/^[A-Z0-9]{8}$/);
    });

    it("não usa os caracteres ambíguos O, 0, I e 1", () => {
      // O código é ditado por telefone e digitado à mão — `O`/`0` e `I`/`1` se confundem.
      const amostra = Array.from({ length: 200 }, gerarCodigo).join("");
      expect(amostra).not.toMatch(/[O0I1]/);
    });

    it("não repete em chamadas seguidas", () => {
      const gerados = new Set(Array.from({ length: 50 }, gerarCodigo));
      expect(gerados.size).toBeGreaterThan(45);
    });
  });
});
