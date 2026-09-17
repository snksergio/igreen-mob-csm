import { describe, expect, it } from "vitest";
import { PLUGUES } from "~/pages/monitoramento/monitoramento-mock";
import { TIPOS_DE_ALERTA } from "~/pages/alertas/alertas-mock";
import {
  AGORA,
  ALERTAS,
  COR_DO_TIPO,
  TIPOS_OBSERVADOS,
  alertasAtivos,
  carimbo,
  contagemPorTipo,
  duracaoEmMinutos,
  duracaoLegivel,
} from "./alertas-lista-mock";

describe("tipos", () => {
  it("todo tipo observado existe no vocabulário de Configurar alertas", () => {
    TIPOS_OBSERVADOS.forEach((t) =>
      expect(TIPOS_DE_ALERTA).toContain(t),
    );
  });

  it("todo tipo observado tem cor declarada", () => {
    TIPOS_OBSERVADOS.forEach((t) => expect(COR_DO_TIPO[t]).toBeDefined());
  });

  it("os cinco tipos aparecem em pelo menos uma ocorrência", () => {
    contagemPorTipo().forEach(({ total }) => expect(total).toBeGreaterThan(0));
  });
});

describe("ocorrências", () => {
  it("são 67, como o rodapé da referência", () => {
    expect(ALERTAS).toHaveLength(67);
  });

  it("ids são únicos", () => {
    expect(new Set(ALERTAS.map((a) => a.id)).size).toBe(ALERTAS.length);
  });

  it("todo plugue citado existe em Monitoramento", () => {
    const conhecidos = new Set(PLUGUES.map((p) => p.id));
    ALERTAS.forEach((a) => expect(conhecidos.has(a.plugue)).toBe(true));
  });

  it("vêm ordenadas do mais recente pro mais antigo", () => {
    for (let i = 1; i < ALERTAS.length; i++) {
      expect(ALERTAS[i - 1].inicio >= ALERTAS[i].inicio).toBe(true);
    }
  });

  it("ativo não tem fim, resolvido tem", () => {
    ALERTAS.forEach((a) =>
      expect(a.fim === null).toBe(a.situacao === "ativo"),
    );
  });

  it("o fim nunca é anterior ao início", () => {
    ALERTAS.filter((a) => a.fim).forEach((a) =>
      expect(a.fim! > a.inicio).toBe(true),
    );
  });

  it("nenhuma ocorrência começa no futuro", () => {
    ALERTAS.forEach((a) =>
      expect(new Date(a.inicio).getTime()).toBeLessThanOrEqual(AGORA.getTime()),
    );
  });

  /* A regra do mock: alerta ativo é recente. Um "ativo" de 12 dias seria bug ou operação
     abandonada — nos dois casos, ruído na leitura da tela. */
  it("todo alerta ativo começou nas últimas 4 horas", () => {
    ALERTAS.filter((a) => a.situacao === "ativo").forEach((a) =>
      expect(duracaoEmMinutos(a)).toBeLessThanOrEqual(240),
    );
  });

  it("exercita os dois estados", () => {
    expect(alertasAtivos()).toBeGreaterThan(0);
    expect(alertasAtivos()).toBeLessThan(ALERTAS.length);
  });

  /* Com granularidade de minuto o mock produzia carimbos idênticos que pareciam
     duplicata. Os segundos são o que separa. */
  it("não há dois alertas com o mesmo carimbo de início", () => {
    const ini = ALERTAS.map((a) => a.inicio);
    expect(new Set(ini).size).toBe(ini.length);
  });
});

describe("derivações", () => {
  it("duracaoLegivel marca o ativo com + e o resolvido sem", () => {
    const ativo = ALERTAS.find((a) => a.situacao === "ativo")!;
    const resolvido = ALERTAS.find((a) => a.situacao === "resolvido")!;
    expect(duracaoLegivel(ativo).endsWith("+")).toBe(true);
    expect(duracaoLegivel(resolvido).endsWith("+")).toBe(false);
  });

  it("duracaoLegivel usa horas só acima de 60 minutos", () => {
    ALERTAS.forEach((a) => {
      const m = duracaoEmMinutos(a);
      expect(duracaoLegivel(a).includes("h")).toBe(m >= 60);
    });
  });

  it("carimbo separa data e hora sem passar por Date", () => {
    expect(carimbo("2026-09-16T20:25:50")).toEqual({
      data: "16/09/2026",
      hora: "20:25:50",
    });
  });

  it("a soma das contagens por tipo é o total", () => {
    const soma = contagemPorTipo().reduce((a, c) => a + c.total, 0);
    expect(soma).toBe(ALERTAS.length);
  });
});

describe("vocabulário", () => {
  it("a palavra proibida não aparece em nenhum campo", () => {
    expect(JSON.stringify(ALERTAS).toLowerCase()).not.toContain("spott");
  });
});
