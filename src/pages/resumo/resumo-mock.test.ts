import { describe, expect, it } from "vitest";
import { TRANSACOES_MOCK } from "~/pages/transacoes/transacoes-mock";
import { CARREGADORES } from "~/pages/carregadores/carregadores-mock";
import { indicadoresDoResumo, totaisDoPeriodo } from "./resumo-mock";

/**
 * O que estes testes protegem é UMA afirmação: **o cabeçalho é a soma da tabela.**
 *
 * É a única coisa que pode quebrar em silêncio nesta tela. Se alguém trocar um número
 * derivado por uma constante "pra bater com a referência", nada avisa — a tela continua
 * renderizando, bonita, com um faturamento que não é a soma de coluna nenhuma. Quem
 * conferir vai achar que a errada é a tabela.
 */

describe("totais do período", () => {
  it("faturamento é a soma exata dos valores das linhas recebidas", () => {
    const linhas = TRANSACOES_MOCK.slice(0, 5);
    const esperado = linhas.reduce((a, t) => a + t.valor, 0);
    expect(totaisDoPeriodo(linhas).faturamento).toBe(esperado);
  });

  it("energia é a soma exata dos kWh das linhas recebidas", () => {
    const linhas = TRANSACOES_MOCK.slice(0, 7);
    const esperado = linhas.reduce((a, t) => a + t.energiaKwh, 0);
    expect(totaisDoPeriodo(linhas).energia).toBe(esperado);
  });

  it("transações é a contagem das linhas, não um número fixo", () => {
    expect(totaisDoPeriodo(TRANSACOES_MOCK.slice(0, 3)).transacoes).toBe(3);
    expect(totaisDoPeriodo(TRANSACOES_MOCK).transacoes).toBe(
      TRANSACOES_MOCK.length,
    );
  });

  it("clientes conta motoristas DISTINTOS, não linhas", () => {
    const linhas = TRANSACOES_MOCK;
    const distintos = new Set(linhas.map((t) => t.motorista)).size;
    expect(totaisDoPeriodo(linhas).clientes).toBe(distintos);
    /* Se fosse contagem de linhas, o mock teria motorista único em todas — o teste
       acima passaria por coincidência. Esta asserção garante que há repetição. */
    expect(distintos).toBeLessThan(linhas.length);
  });

  it("recorte vazio zera tudo em vez de estourar", () => {
    const t = totaisDoPeriodo([]);
    expect(t.faturamento).toBe(0);
    expect(t.energia).toBe(0);
    expect(t.clientes).toBe(0);
    expect(t.transacoes).toBe(0);
  });

  it("carregadores vêm do parque cadastrado, não das transações", () => {
    /* O card de status é o único que NÃO muda com o período: ele conta o parque agora. */
    const comTudo = totaisDoPeriodo(TRANSACOES_MOCK);
    const semNada = totaisDoPeriodo([]);
    expect(semNada.carregadoresAtivos).toBe(comTudo.carregadoresAtivos);
    expect(comTudo.carregadoresTotal).toBe(CARREGADORES.length);
    expect(comTudo.carregadoresAtivos).toBe(
      CARREGADORES.filter((c) => c.ativo).length,
    );
  });
});

describe("indicadores", () => {
  it("são cinco, na ordem medida na referência", () => {
    expect(indicadoresDoResumo().map((i) => i.id)).toEqual([
      "carregadores",
      "faturamento",
      "energia",
      "clientes",
      "transacoes",
    ]);
  });

  it("o valor exibido é o total formatado, não um literal", () => {
    const linhas = TRANSACOES_MOCK.slice(0, 9);
    const t = totaisDoPeriodo(linhas);
    const por = Object.fromEntries(
      indicadoresDoResumo(linhas).map((i) => [i.id, i.valor]),
    );
    expect(por.transacoes).toBe("9");
    expect(por.clientes).toBe(String(t.clientes));
    /* Bate o número, não a string inteira: o espaço do `R$` do `Intl` é NBSP. */
    expect(por.faturamento).toContain(
      t.faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
    );
  });

  it("mudar o recorte muda os valores — é o que liga os cards à tabela", () => {
    const a = indicadoresDoResumo(TRANSACOES_MOCK.slice(0, 5));
    const b = indicadoresDoResumo(TRANSACOES_MOCK.slice(0, 20));
    const valor = (l: typeof a, id: string) =>
      l.find((i) => i.id === id)!.valor;
    for (const id of ["faturamento", "energia", "clientes", "transacoes"]) {
      expect(valor(a, id)).not.toBe(valor(b, id));
    }
  });

  it("o status dos carregadores NÃO tem variação", () => {
    /* Uma seta ali sugeriria tendência sobre uma contagem instantânea. */
    const status = indicadoresDoResumo().find((i) => i.id === "carregadores")!;
    expect(status.variacao).toBeNull();
  });

  it("os outros quatro têm variação, com os sentidos medidos", () => {
    const sentido = Object.fromEntries(
      indicadoresDoResumo()
        .filter((i) => i.variacao)
        .map((i) => [i.id, i.variacao!.sobe]),
    );
    expect(sentido).toEqual({
      faturamento: false,
      energia: false,
      clientes: true,
      transacoes: true,
    });
  });

  it("a variação é fixa: dois renders seguidos dão o mesmo número", () => {
    /* Percentual aleatório faria a tela mudar de humor a cada navegação. */
    expect(indicadoresDoResumo().map((i) => i.variacao?.pct ?? null)).toEqual(
      indicadoresDoResumo().map((i) => i.variacao?.pct ?? null),
    );
  });

  it("recorte vazio não divide por zero nos detalhes", () => {
    for (const i of indicadoresDoResumo([])) {
      expect(i.detalhe).not.toContain("NaN");
      expect(i.valor).not.toContain("NaN");
    }
  });

  it("subirEhBom é declarado em todos — o tom do delta depende dele", () => {
    for (const i of indicadoresDoResumo()) {
      expect(typeof i.subirEhBom).toBe("boolean");
    }
  });
});
