import { describe, it, expect } from "vitest";
import {
  ANOS,
  BASE_SETEMBRO_MEDIDA,
  REPASSES,
  baseDeCalculo,
  transacoesDoRepasse,
} from "./repasses-mock";

/**
 * As invariantes que ligam o mock à referência. Não são testes de render — são o contrato
 * do dado, e cada um existe porque quebrá-lo produz uma tela que parece certa e mente.
 */

describe("repasses-mock — invariantes da referência", () => {
  it("tem as 12 linhas medidas, todas de 2026 e em aberto", () => {
    expect(REPASSES).toHaveLength(12);
    expect(REPASSES.every((r) => r.ano === 2026)).toBe(true);
    expect(REPASSES.every((r) => r.status === "em-aberto")).toBe(true);
  });

  it("todo id é único — é a chave que abre o painel", () => {
    const ids = REPASSES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  /**
   * A identidade mais importante da tela: `total pago = repasse + take rate`. Os dois
   * termos da direita são MEDIDOS em toda linha, então isto não é aproximação — é
   * aritmética, e é o que permite derivar a base de cálculo dos outros onze meses.
   */
  it("total pago = repasse líquido + take rate, em todas as linhas", () => {
    for (const r of REPASSES) {
      const b = baseDeCalculo(r);
      expect(b.totalPago).toBeCloseTo(r.repasseLiquido + r.takeRate, 2);
    }
  });

  it("total vendido − cupons = total pago, em todas as linhas", () => {
    for (const r of REPASSES) {
      const b = baseDeCalculo(r);
      expect(b.totalVendido - b.cuponsCpo).toBeCloseTo(b.totalPago, 2);
    }
  });

  /**
   * O teste que ancora a derivação: pra Setembro — o único mês cuja base foi medida — a
   * função tem que reproduzir os quatro valores da referência. Se a razão de cupom mudar,
   * é aqui que aparece.
   */
  it("a base derivada de Setembro reproduz os quatro valores medidos", () => {
    const setembro = REPASSES.find((r) => r.id === "r-2026-09")!;
    const b = baseDeCalculo(setembro);

    expect(b.totalPago).toBeCloseTo(BASE_SETEMBRO_MEDIDA.totalPago, 2);
    expect(b.takeRate).toBeCloseTo(BASE_SETEMBRO_MEDIDA.takeRate, 2);
    /* Vendido e cupons passam pela razão, então fecham em centavos, não em frações. */
    expect(b.totalVendido).toBeCloseTo(BASE_SETEMBRO_MEDIDA.totalVendido, 0);
    expect(b.cuponsCpo).toBeCloseTo(BASE_SETEMBRO_MEDIDA.cuponsCpo, 0);
  });

  /**
   * A identidade do extrato: `bruto − cupom = total pago`. Medida na referência
   * (`R$ 10,69 − R$ 3,21 = R$ 7,48`), e é o que explica por que a tabela tem três colunas
   * de dinheiro em vez de uma.
   */
  it("em toda transação, bruto − cupom = total pago", () => {
    for (const r of REPASSES) {
      for (const t of transacoesDoRepasse(r)) {
        expect(t.valorBruto - t.cupom).toBeCloseTo(t.totalPago, 2);
      }
    }
  });

  it("o extrato é determinístico — mesma linha, mesmo extrato", () => {
    const r = REPASSES[0];
    expect(transacoesDoRepasse(r)).toEqual(transacoesDoRepasse(r));
  });

  it("extratos de linhas diferentes não são iguais", () => {
    // Inclui o par de Junho, que só difere pelo sufixo `b` do id: a semente tem que
    // separá-los, senão os dois painéis mostram o mesmo extrato.
    const junhoA = REPASSES.find((r) => r.id === "r-2026-06")!;
    const junhoB = REPASSES.find((r) => r.id === "r-2026-06b")!;
    expect(transacoesDoRepasse(junhoA)).not.toEqual(transacoesDoRepasse(junhoB));
  });

  it("o extrato tem linhas suficientes pra paginar, com todos os campos", () => {
    const ts = transacoesDoRepasse(REPASSES[0]);
    /* Mais de uma página de 10: é o motivo de a tabela do painel ser `DataTable` e não o
       `Table` primitivo. */
    expect(ts.length).toBeGreaterThan(30);
    for (const t of ts) {
      expect(t.dataHora).toMatch(/^\d{2}\/\d{2}\/\d{4} • \d{2}h \d{2}m$/);
      expect(t.duracao).toMatch(/^\d{2}h \d{2}min$/);
      expect(t.local).toContain("MOB");
      expect(t.motorista.length).toBeGreaterThan(3);
      expect(t.energiaKwh).toBeGreaterThan(0);
      expect(t.valorBruto).toBeGreaterThan(0);
      expect(t.cupom).toBeGreaterThanOrEqual(0);
    }
  });

  it("repasse de centavo ganha extrato curto, não 40 linhas que não somam nada", () => {
    const centavo = REPASSES.find((r) => Math.abs(r.repasseLiquido) < 1)!;
    expect(transacoesDoRepasse(centavo).length).toBeLessThan(10);
  });

  it("guarda os centavos negativos e os zeros da referência", () => {
    // `-R$ 0,01` e `R$ 0,00` são valores reais da origem, e são o caso que a formatação
    // tem que aguentar. Arredondá-los pra fora seria perder o teste mais barato que existe.
    const valores = REPASSES.map((r) => r.repasseLiquido);
    expect(valores).toContain(-0.01);
    expect(valores).toContain(0);
    expect(valores).toContain(0.06);
  });

  it("o filtro é de ANO, com 2026 primeiro", () => {
    expect(ANOS[0]).toBe(2026);
    expect(ANOS).toContain(2025);
  });
});
