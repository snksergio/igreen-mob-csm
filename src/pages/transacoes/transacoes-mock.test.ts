import { describe, expect, it } from "vitest";
import { TETO_KWH, TETO_VALOR, TRANSACOES_MOCK } from "./transacoes-mock";

describe("TRANSACOES_MOCK", () => {
  it("tem volume suficiente pra exercitar paginação de 10/20/50", () => {
    expect(TRANSACOES_MOCK.length).toBeGreaterThanOrEqual(60);
  });

  it("tem id único em toda linha", () => {
    const ids = new Set(TRANSACOES_MOCK.map((t) => t.id));
    expect(ids.size).toBe(TRANSACOES_MOCK.length);
  });

  it("nunca tem SoC final menor que o inicial", () => {
    for (const t of TRANSACOES_MOCK) {
      expect(t.socFinal).toBeGreaterThanOrEqual(t.socInicial);
    }
  });

  it("mantém SoC dentro de 0–100", () => {
    for (const t of TRANSACOES_MOCK) {
      expect(t.socInicial).toBeGreaterThanOrEqual(0);
      expect(t.socFinal).toBeLessThanOrEqual(100);
    }
  });

  it("nunca tem energia ou valor negativos, e respeita o teto observado", () => {
    for (const t of TRANSACOES_MOCK) {
      expect(t.energiaKwh).toBeGreaterThanOrEqual(0);
      // Derivado da constante do gerador, nao repetido a mao: o teto e estrutural la
      // (clamp), entao o teste afirma a MESMA coisa que o codigo garante.
      expect(t.energiaKwh).toBeLessThanOrEqual(TETO_KWH);
      expect(t.valor).toBeGreaterThanOrEqual(0);
      expect(t.valor).toBeLessThanOrEqual(TETO_VALOR);
    }
  });

  it("faz a janela de horário bater com a duração", () => {
    for (const t of TRANSACOES_MOCK) {
      const [hi, mi] = t.horaInicio.split(":").map(Number);
      const [hf, mf] = t.horaFim.split(":").map(Number);
      let delta = hf * 60 + mf - (hi * 60 + mi);
      if (delta < 0) delta += 24 * 60; // sessão que cruza a meia-noite
      expect(delta).toBe(t.duracaoMin);
    }
  });

  it("inclui sessões de energia zero — elas existem na base real", () => {
    const zeradas = TRANSACOES_MOCK.filter((t) => t.energiaKwh === 0);
    expect(zeradas.length).toBeGreaterThan(0);
  });

  it("tem ao menos uma linha de CADA status — nenhuma visão da tela é aba morta", () => {
    // A tela tem as visões "Em andamento" e "Falhas", que filtram por status. Status
    // sem nenhuma linha faz a aba abrir vazia e parecer defeito do filtro.
    for (const s of ["finalizado", "em-andamento", "falha"] as const) {
      expect(
        TRANSACOES_MOCK.filter((t) => t.status === s).length,
        `nenhuma linha com status "${s}"`,
      ).toBeGreaterThan(0);
    }
  });

  it("não dá término nem motivo a sessão em andamento", () => {
    // Recarga em curso não terminou. Preencher com o "previsto" faria o operador ler
    // estimativa como fato.
    for (const t of TRANSACOES_MOCK.filter((x) => x.status === "em-andamento")) {
      expect(t.terminoRecarga).toBe("");
      expect(t.terminoTransacao).toBe("");
      expect(t.motivo).toBe("");
    }
  });

  it("fecha a soma dos itens de cobrança com o valor da transação", () => {
    for (const t of TRANSACOES_MOCK) {
      const soma = t.itensCobranca.reduce((acc, i) => acc + i.valor, 0);
      // Centavos, não float: 35.49 + 2.5 não é exatamente 37.99 em binário, e comparar
      // direto reprovaria por representação, não por defeito.
      expect(Math.round(soma * 100)).toBe(Math.round(t.valor * 100));
    }
  });

  it("não cobra nada nas sessões de valor zero", () => {
    const zeradas = TRANSACOES_MOCK.filter((t) => t.valor === 0);
    expect(zeradas.length).toBeGreaterThan(0);
    for (const t of zeradas) expect(t.itensCobranca).toEqual([]);
  });

  it("dá pelo menos 2 pontos de série em toda transação", () => {
    // 1 ponto não desenha linha — e as sessões de falha têm 1–2 min de duração.
    for (const t of TRANSACOES_MOCK) {
      expect(t.serie.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("mantém potência e corrente com a mesma forma de curva", () => {
    // Corrente é derivada da potência (I = P/V a 400 V). Se as duas divergirem de
    // forma, o gráfico mente sobre a física da recarga.
    for (const t of TRANSACOES_MOCK) {
      for (const p of t.serie) {
        expect(p.correnteA).toBe(Math.round((p.potenciaKw * 1000) / 400));
      }
    }
  });

  it("não usa nome de pessoa real da referência", () => {
    const reais = ["wagner", "mariana stela", "tiago ferreira", "william james"];
    for (const t of TRANSACOES_MOCK) {
      const nome = t.motorista.toLowerCase();
      for (const r of reais) expect(nome).not.toContain(r);
    }
  });
});
