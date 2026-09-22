import { describe, expect, it } from "vitest";
import {
  CHECKLIST_POR_ETAPA,
  ETAPAS,
  ETAPA_POR_ID,
  HOJE,
  IMPLANTACOES,
  RESPONSAVEIS,
  TODOS_OS_ITENS,
  atrasada,
  concluida,
  dataCurta,
  diasNaEtapa,
  diasParaPrevisao,
  etapaAnterior,
  indiceDaEtapa,
  moeda,
  pendenciasObrigatorias,
  podeAvancar,
  potencia,
  progressoDaEtapa,
  progressoGeral,
  proximaEtapa,
  situacaoDoPrazo,
  type Implantacao,
} from "./implantacoes-mock";

/** Atalho para montar um caso de borda sem repetir o objeto inteiro. */
const com = (p: Partial<Implantacao>): Implantacao => ({ ...IMPLANTACOES[0], ...p });

describe("etapas", () => {
  it("são as sete ditadas pelo operador, nesta ordem", () => {
    expect(ETAPAS.map((e) => e.id)).toEqual([
      "proposta",
      "aceite",
      "viabilidade",
      "contrato",
      "pagamento",
      "projeto",
      "instalacao",
    ]);
  });

  it("indiceDaEtapa acompanha a ordem do array, que é a fonte única", () => {
    ETAPAS.forEach((e, i) => expect(indiceDaEtapa(e.id)).toBe(i));
  });

  it("a primeira não tem anterior e a última não tem próxima", () => {
    expect(etapaAnterior("proposta")).toBeNull();
    expect(proximaEtapa("instalacao")).toBeNull();
    expect(proximaEtapa("proposta")).toBe("aceite");
    expect(etapaAnterior("instalacao")).toBe("projeto");
  });

  it("toda etapa tem rótulo, resumo e cor", () => {
    ETAPAS.forEach((e) => {
      expect(e.label.length).toBeGreaterThan(0);
      expect(e.resumo.length).toBeGreaterThan(0);
      expect(e.cor).toMatch(/^var\(--color-/);
    });
  });
});

describe("checklists", () => {
  it("toda etapa tem checklist, e todo item aponta para a própria etapa", () => {
    ETAPAS.forEach((e) => {
      const lista = CHECKLIST_POR_ETAPA[e.id];
      expect(lista.length).toBeGreaterThan(0);
      lista.forEach((i) => expect(i.etapa).toBe(e.id));
    });
  });

  /* Id duplicado faria marcar um item marcar outro em outra etapa. */
  it("ids de item são únicos no sistema inteiro", () => {
    const ids = TODOS_OS_ITENS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("toda etapa tem ao menos um item obrigatório — senão a trava não trava nada", () => {
    ETAPAS.forEach((e) =>
      expect(CHECKLIST_POR_ETAPA[e.id].some((i) => i.obrigatorio)).toBe(true),
    );
  });

  it("existe ao menos um item opcional, senão a distinção seria decorativa", () => {
    expect(TODOS_OS_ITENS.some((i) => !i.obrigatorio)).toBe(true);
  });
});

describe("a trava do funil", () => {
  it("pendência obrigatória impede avançar", () => {
    const travada = com({ etapa: "aceite", feitos: [] });
    expect(pendenciasObrigatorias(travada).length).toBeGreaterThan(0);
    expect(podeAvancar(travada)).toBe(false);
  });

  it("com todos os obrigatórios cumpridos, avança — mesmo faltando opcional", () => {
    const soObrigatorios = CHECKLIST_POR_ETAPA.viabilidade
      .filter((i) => i.obrigatorio)
      .map((i) => i.id);
    const pronta = com({ etapa: "viabilidade", feitos: soObrigatorios });
    expect(pendenciasObrigatorias(pronta)).toEqual([]);
    expect(podeAvancar(pronta)).toBe(true);
    /* O opcional continua pendente e isso é justamente o ponto. */
    expect(progressoDaEtapa(pronta).feitos).toBeLessThan(
      progressoDaEtapa(pronta).total,
    );
  });

  it("a última etapa nunca pode avançar, mesmo cumprida", () => {
    const fim = com({ etapa: "instalacao", feitos: TODOS_OS_ITENS.map((i) => i.id) });
    expect(podeAvancar(fim)).toBe(false);
    expect(proximaEtapa("instalacao")).toBeNull();
  });
});

describe("progresso", () => {
  it("progressoDaEtapa conta só os itens da etapa pedida", () => {
    const imp = com({
      etapa: "aceite",
      feitos: CHECKLIST_POR_ETAPA.proposta.map((i) => i.id),
    });
    expect(progressoDaEtapa(imp, "proposta")).toEqual({
      feitos: CHECKLIST_POR_ETAPA.proposta.length,
      total: CHECKLIST_POR_ETAPA.proposta.length,
    });
    expect(progressoDaEtapa(imp, "aceite").feitos).toBe(0);
  });

  /* Conta ITENS e não etapas — é o que dá granularidade dentro de uma etapa longa. */
  it("progressoGeral vai de 0 a 1 sobre o total de itens", () => {
    expect(progressoGeral(com({ feitos: [] }))).toBe(0);
    expect(progressoGeral(com({ feitos: TODOS_OS_ITENS.map((i) => i.id) }))).toBe(1);
  });
});

describe("estado terminal e atraso", () => {
  it("concluída = última etapa sem pendência obrigatória", () => {
    expect(
      concluida(com({ etapa: "instalacao", feitos: TODOS_OS_ITENS.map((i) => i.id) })),
    ).toBe(true);
    expect(concluida(com({ etapa: "instalacao", feitos: [] }))).toBe(false);
    expect(
      concluida(com({ etapa: "projeto", feitos: TODOS_OS_ITENS.map((i) => i.id) })),
    ).toBe(false);
  });

  /* Concluída depois do prazo é histórico, não atraso aberto — pintar de vermelho
     para sempre treinaria o operador a ignorar a cor. */
  it("concluída nunca conta como atrasada, mesmo com previsão vencida", () => {
    const tarde = com({
      etapa: "instalacao",
      previsaoDeInstalacao: "2026-01-01",
      feitos: TODOS_OS_ITENS.map((i) => i.id),
    });
    expect(atrasada(tarde)).toBe(false);
  });

  it("previsão vencida e não concluída é atraso", () => {
    expect(atrasada(com({ previsaoDeInstalacao: "2026-01-01", feitos: [] }))).toBe(true);
  });

  it("diasParaPrevisao é negativo quando já passou", () => {
    expect(diasParaPrevisao(com({ previsaoDeInstalacao: "2026-09-12" }))).toBe(-10);
    expect(diasParaPrevisao(com({ previsaoDeInstalacao: "2026-10-02" }))).toBe(10);
  });

  it("diasNaEtapa nunca é negativo", () => {
    IMPLANTACOES.forEach((i) => expect(diasNaEtapa(i)).toBeGreaterThanOrEqual(0));
  });
});

describe("o elenco do mock", () => {
  it("ids são únicos", () => {
    expect(new Set(IMPLANTACOES.map((i) => i.id)).size).toBe(IMPLANTACOES.length);
  });

  it("cobre as sete etapas — senão o board abre com coluna vazia sem motivo", () => {
    const vistas = new Set(IMPLANTACOES.map((i) => i.etapa));
    ETAPAS.forEach((e) => expect(vistas.has(e.id)).toBe(true));
  });

  /* Os quatro estados que a tela precisa desenhar. Sem eles o board fica bonito e
     não prova nada. */
  it("tem uma recém-aberta, uma travada, uma atrasada e uma concluída", () => {
    expect(IMPLANTACOES.some((i) => i.feitos.length === 0)).toBe(true);
    expect(
      IMPLANTACOES.some((i) => !concluida(i) && pendenciasObrigatorias(i).length > 0),
    ).toBe(true);
    expect(IMPLANTACOES.some((i) => atrasada(i))).toBe(true);
    expect(IMPLANTACOES.some((i) => concluida(i))).toBe(true);
  });

  it("todo item marcado existe no catálogo de checklists", () => {
    const catalogo = new Set(TODOS_OS_ITENS.map((i) => i.id));
    IMPLANTACOES.forEach((imp) =>
      imp.feitos.forEach((f) => expect(catalogo.has(f)).toBe(true)),
    );
  });

  /* Estar em CONTRATO com a viabilidade por fazer seria um funil que mente. */
  it("nenhuma tem pendência OBRIGATÓRIA em etapa já ultrapassada", () => {
    IMPLANTACOES.forEach((imp) => {
      const ate = indiceDaEtapa(imp.etapa);
      ETAPAS.slice(0, ate).forEach((e) => {
        const faltando = CHECKLIST_POR_ETAPA[e.id].filter(
          (i) => i.obrigatorio && !imp.feitos.includes(i.id),
        );
        expect({ imp: imp.id, etapa: e.id, faltando: faltando.length }).toEqual({
          imp: imp.id,
          etapa: e.id,
          faltando: 0,
        });
      });
    });
  });

  it("marcações nunca se repetem dentro da mesma implantação", () => {
    IMPLANTACOES.forEach((i) =>
      expect(new Set(i.feitos).size).toBe(i.feitos.length),
    );
  });

  it("valores e prazos são coerentes", () => {
    IMPLANTACOES.forEach((i) => {
      expect(i.pontos).toBeGreaterThan(0);
      expect(i.potenciaKw).toBeGreaterThan(0);
      expect(i.investimento).toBeGreaterThan(0);
      expect(RESPONSAVEIS).toContain(i.responsavel);
      /* Entrou na etapa atual depois de ter sido aberta. */
      expect(i.etapaDesde >= i.abertaEm).toBe(true);
      expect(new Date(`${i.abertaEm}T12:00:00Z`).getTime()).toBeLessThanOrEqual(
        HOJE.getTime(),
      );
    });
  });
});

describe("situação de prazo", () => {
  /* Três estados, não dois — ver o JSDoc de . */
  it("concluída não é atrasada nem em dia, mesmo com previsão vencida", () => {
    const fim = IMPLANTACOES.find((i) => concluida(i));
    expect(fim).toBeDefined();
    expect(situacaoDoPrazo(fim!)).toBe("Concluída");
  });

  it("previsão vencida e em andamento é Atrasada", () => {
    const atrasadas = IMPLANTACOES.filter((i) => atrasada(i));
    expect(atrasadas.length).toBeGreaterThan(0);
    atrasadas.forEach((i) => expect(situacaoDoPrazo(i)).toBe("Atrasada"));
  });

  it("o elenco cobre os três estados — senão as visões salvas abririam vazias", () => {
    const vistos = new Set(IMPLANTACOES.map((i) => situacaoDoPrazo(i)));
    expect(vistos.has("Atrasada")).toBe(true);
    expect(vistos.has("Em dia")).toBe(true);
    expect(vistos.has("Concluída")).toBe(true);
  });
});

describe("privacidade", () => {
  /* ⚠️ Um funil comercial é exatamente onde dado real de cliente apareceria. */
  it("não há CPF, CNPJ, telefone nem e-mail em lugar nenhum", () => {
    const texto = JSON.stringify(IMPLANTACOES);
    expect(texto).not.toMatch(/\d{3}\.\d{3}\.\d{3}-\d{2}/);
    expect(texto).not.toMatch(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
    expect(texto).not.toMatch(/@/);
    expect(texto).not.toMatch(/\(\d{2}\)\s?\d{4,5}-\d{4}/);
  });

  it("a palavra proibida não aparece", () => {
    expect(JSON.stringify(IMPLANTACOES).toLowerCase()).not.toContain("spott");
  });
});

describe("formatação", () => {
  it("moeda sai em real, sem centavos", () => {
    expect(moeda(78000).replace(/ /g, " ")).toBe("R$ 78.000");
    expect(moeda(0).replace(/ /g, " ")).toBe("R$ 0");
  });

  it("dataCurta inverte sem passar por Date", () => {
    expect(dataCurta("2026-09-12")).toBe("12/09/2026");
  });

  it("potência não mostra casa decimal quando não precisa", () => {
    expect(potencia(22)).toBe("22 kW");
    expect(potencia(7.4)).toBe("7,4 kW");
  });

  it("ETAPA_POR_ID responde por todas as etapas", () => {
    ETAPAS.forEach((e) => expect(ETAPA_POR_ID[e.id]).toBe(e));
  });
});
