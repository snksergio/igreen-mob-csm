import { describe, expect, it } from "vitest";
import { GEO_DOS_LOCAIS } from "~/pages/monitoramento/monitoramento-mock";
import {
  BANCOS,
  ROTULO_CURTO_DO_NIVEL,
  ROTULO_DO_NIVEL,
  SPLITS,
  beneficiarioVazio,
  comoRecebe,
  dataCurta,
  locaisAlcancados,
  percentual,
  restante,
  rotuloDoBanco,
  situacao,
  totalDistribuido,
} from "./splits-mock";

describe("splits", () => {
  it("ids são únicos, e os dos beneficiários também dentro de cada split", () => {
    expect(new Set(SPLITS.map((s) => s.id)).size).toBe(SPLITS.length);
    SPLITS.forEach((s) => {
      const ids = s.beneficiarios.map((b) => b.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  it("todo local citado existe no cadastro de Monitoramento", () => {
    const conhecidos = new Set(Object.keys(GEO_DOS_LOCAIS));
    SPLITS.filter((s) => s.local).forEach((s) =>
      expect(conhecidos.has(s.local!)).toBe(true),
    );
  });

  /* A cascata do domínio: nível empresa vale para todos, nível local para um. */
  it("nível empresa não tem local; nível local tem", () => {
    SPLITS.forEach((s) =>
      expect(s.local === null).toBe(s.nivel === "empresa"),
    );
  });

  it("locaisAlcancados reflete o nível", () => {
    const total = Object.keys(GEO_DOS_LOCAIS).length;
    SPLITS.forEach((s) =>
      expect(locaisAlcancados(s)).toBe(s.nivel === "empresa" ? total : 1),
    );
  });

  it("exercita as quatro situações que a tela precisa desenhar", () => {
    const vistas = new Set(SPLITS.map(situacao));
    expect(vistas.has("vazio")).toBe(true);
    expect(vistas.has("parcial")).toBe(true);
    expect(vistas.has("fechado")).toBe(true);
  });

  it("nenhum split do mock nasce estourado", () => {
    SPLITS.forEach((s) => expect(totalDistribuido(s)).toBeLessThanOrEqual(100));
  });

  it("todo percentual é positivo", () => {
    SPLITS.flatMap((s) => s.beneficiarios).forEach((b) =>
      expect(b.percentual).toBeGreaterThan(0),
    );
  });
});

describe("contas", () => {
  it("total e restante somam 100", () => {
    SPLITS.forEach((s) =>
      expect(totalDistribuido(s) + restante(s)).toBeCloseTo(100, 6),
    );
  });

  /* O defeito que o arredondamento na SOMA evita: 33,33 três vezes dá
     99.99000000000001 em ponto flutuante, e a tela acusaria "não fecha". */
  it("a soma é arredondada, então três fatias de 33,33 dão 99,99 e não 99,99000000000001", () => {
    const s = {
      ...SPLITS[0],
      beneficiarios: [33.33, 33.33, 33.33].map((percentual, i) => ({
        ...beneficiarioVazio(i),
        nome: `B${i}`,
        percentual,
      })),
    };
    expect(totalDistribuido(s)).toBe(99.99);
  });

  it("uma distribuição de 100 exatos fecha e sobra zero", () => {
    const fechado = SPLITS.find((s) => totalDistribuido(s) === 100);
    expect(fechado).toBeDefined();
    expect(restante(fechado!)).toBe(0);
    expect(situacao(fechado!)).toBe("fechado");
  });

  it("acima de 100 é estourado e o restante fica negativo", () => {
    const s = {
      ...SPLITS[0],
      beneficiarios: [
        { ...beneficiarioVazio(0), nome: "A", percentual: 70 },
        { ...beneficiarioVazio(1), nome: "B", percentual: 45 },
      ],
    };
    expect(situacao(s)).toBe("estourado");
    expect(restante(s)).toBe(-15);
  });

  it("split sem beneficiários é vazio, não parcial", () => {
    const vazio = SPLITS.find((s) => s.beneficiarios.length === 0);
    expect(vazio).toBeDefined();
    expect(situacao(vazio!)).toBe("vazio");
    expect(totalDistribuido(vazio!)).toBe(0);
  });
});

describe("recebimento", () => {
  it("quem tem chave PIX recebe por PIX; quem tem banco, por conta", () => {
    SPLITS.flatMap((s) => s.beneficiarios).forEach((b) => {
      const texto = comoRecebe(b);
      if (b.chavePix) expect(texto.startsWith("PIX")).toBe(true);
      else if (b.banco) expect(texto).toContain("ag.");
      else expect(texto).toBe("Sem dados de recebimento");
    });
  });

  it("existe um beneficiário que recebe só por PIX — o caso sem agência e conta", () => {
    const pix = SPLITS.flatMap((s) => s.beneficiarios).filter((b) => b.chavePix);
    expect(pix.length).toBeGreaterThan(0);
    pix.forEach((b) => {
      expect(b.banco).toBe("");
      expect(b.agencia).toBe("");
      expect(b.conta).toBe("");
    });
  });

  it("todo código de banco usado existe na tabela COMPE", () => {
    SPLITS.flatMap((s) => s.beneficiarios)
      .filter((b) => b.banco)
      .forEach((b) => expect(BANCOS[b.banco]).toBeDefined());
  });

  it("rotuloDoBanco junta código e nome, e devolve o código quando não conhece", () => {
    expect(rotuloDoBanco("341")).toBe("341 · Itaú Unibanco");
    expect(rotuloDoBanco("999")).toBe("999");
  });
});

describe("privacidade", () => {
  /* ⚠️ Dado bancário real num protótipo é o pior tipo de vazamento: parece plausível o
     bastante para alguém tentar usar. */
  it("nenhuma conta ou agência real — todas mascaradas", () => {
    SPLITS.flatMap((s) => s.beneficiarios)
      .filter((b) => b.banco)
      .forEach((b) => {
        expect(b.agencia).toBe("0001");
        expect(b.conta).toBe("00000-0");
      });
  });

  it("chaves PIX apontam para o domínio do mock", () => {
    SPLITS.flatMap((s) => s.beneficiarios)
      .filter((b) => b.chavePix)
      .forEach((b) => expect(b.chavePix.endsWith("@exemplo.com.br")).toBe(true));
  });

  it("a palavra proibida não aparece em nenhum texto", () => {
    expect(JSON.stringify(SPLITS).toLowerCase()).not.toContain("spott");
  });
});

describe("formatação", () => {
  it("percentual usa duas casas e vírgula", () => {
    expect(percentual(22.5)).toBe("22,50%");
    expect(percentual(100)).toBe("100,00%");
    expect(percentual(0)).toBe("0,00%");
  });

  it("dataCurta inverte sem passar por Date", () => {
    expect(dataCurta("2026-09-12")).toBe("12/09/2026");
  });

  /* A coluna se chama "Nível"; o chip dentro dela não repete a palavra. */
  it("o rótulo curto do nível não contém a palavra Nível, e o longo contém", () => {
    Object.values(ROTULO_CURTO_DO_NIVEL).forEach((r) =>
      expect(r.toLowerCase()).not.toContain("nível"),
    );
    Object.values(ROTULO_DO_NIVEL).forEach((r) =>
      expect(r.toLowerCase()).toContain("nível"),
    );
    expect(Object.keys(ROTULO_CURTO_DO_NIVEL)).toEqual(
      Object.keys(ROTULO_DO_NIVEL),
    );
  });

  it("beneficiarioVazio nasce em branco e com fatia zero", () => {
    const b = beneficiarioVazio(0);
    expect(b.nome).toBe("");
    expect(b.percentual).toBe(0);
    expect(b.banco).toBe("");
  });

  it("dois beneficiarioVazio seguidos não colidem de id", () => {
    expect(beneficiarioVazio(0).id).not.toBe(beneficiarioVazio(1).id);
  });
});
