import { describe, it, expect } from "vitest";
import {
  ATIVACAO_MEDIDA,
  CARREGADOR_MEDIDO,
  DIAS_DA_SEMANA,
  INDICE_DO_PERFIL_MEDIDO,
  NOME_DO_PERFIL_PADRAO,
  PERFIS_DE_PRECO,
  resumoDaRegra,
  temRecargaGratis,
} from "./precos-mock";

/**
 * Invariantes que ligam o mock à referência.
 *
 * As duas mais importantes são de DOMÍNIO, não de formatação: recarga grátis não cobra
 * energia, e a coluna da lista não pode divergir do par segmentado do painel. As duas são o
 * tipo de defeito que passa em revisão visual porque cada tela, olhada sozinha, parece certa.
 */

describe("precos-mock — invariantes da referência", () => {
  it("todo perfil tem id único — é a chave que abre o painel", () => {
    const ids = PERFIS_DE_PRECO.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("tem perfis suficientes pra paginar em 10 por página", () => {
    expect(PERFIS_DE_PRECO.length).toBeGreaterThan(10);
  });

  it("Nome e Padrão trazem o literal medido em todas as linhas", () => {
    // A referência mostra `Perfil padrão` nas DUAS colunas, em 10/10. Ver a nota na coluna.
    for (const p of PERFIS_DE_PRECO) {
      expect(p.nome).toBe(NOME_DO_PERFIL_PADRAO);
      expect(p.padrao).toBe(NOME_DO_PERFIL_PADRAO);
    }
  });

  it("todo nome de local vem de uma empresa MOB, como na referência", () => {
    for (const p of PERFIS_DE_PRECO) {
      expect(p.local).toMatch(/^(IGREEN|PV) MOB - /);
    }
  });

  /** Âncora: o perfil dos prints, com as três abas medidas. */
  it("o perfil âncora reproduz o painel MEDIDO nos prints", () => {
    const p = PERFIS_DE_PRECO[INDICE_DO_PERFIL_MEDIDO];

    expect(p.disponibilidade).toBe("disponivel");
    expect(p.modoDeCobranca).toBe("normal");
    expect(p.usoDeCupons).toBe("permitir");
    expect(p.precoEnergia).toBe(3);
    /* Medido VAZIO — o card aparece no estado "Clique para adicionar". */
    expect(p.usoDoCarregador).toBeNull();
    expect(p.taxaDeAtivacao).toEqual(ATIVACAO_MEDIDA);
    /* Switch da ociosidade desligado. */
    expect(p.ociosidade).toBeNull();
    /* `Nenhuma regra encontrada.` na visualização semanal. */
    expect(p.regras).toEqual([]);
    expect(p.carregadores).toEqual([CARREGADOR_MEDIDO]);
    expect(p.tags).toEqual([]);
  });

  /**
   * O defeito mais fácil de produzir nesta tela: a coluna `Recarga grátis` dizer uma coisa e
   * o par `Modo de cobrança` do painel dizer outra. Aqui não pode, porque a coluna é
   * DERIVADA do modo.
   */
  it("a coluna Recarga grátis é derivada do modo de cobrança", () => {
    for (const p of PERFIS_DE_PRECO) {
      expect(temRecargaGratis(p)).toBe(p.modoDeCobranca === "gratis");
    }
  });

  it("existem perfis com e sem recarga grátis — a coluna tem o que mostrar", () => {
    const comGratis = PERFIS_DE_PRECO.filter(temRecargaGratis);
    expect(comGratis.length).toBeGreaterThan(0);
    expect(comGratis.length).toBeLessThan(PERFIS_DE_PRECO.length);
  });

  /**
   * Recarga grátis não cobra energia. Guardar um preço num perfil grátis criaria um número
   * que a tela nunca mostra e que alguém leria num debug achando que é o que o motorista
   * paga.
   */
  it("perfil com recarga grátis não tem preço de energia nem taxa de ativação", () => {
    for (const p of PERFIS_DE_PRECO.filter(temRecargaGratis)) {
      expect(p.precoEnergia).toBeNull();
      expect(p.taxaDeAtivacao.ativa).toBe(false);
    }
  });

  /**
   * Trava o que a tela precisa exercitar: se TODOS os perfis tivessem zero regras, a
   * visualização semanal nunca pintaria um bloco e ninguém veria que ela funciona; se todos
   * tivessem, o vazio `Nenhuma regra encontrada.` — que é o estado MEDIDO no perfil âncora —
   * nunca apareceria. Medido: 9 com regra, 8 sem.
   */
  it("existem perfis com e sem regra de período", () => {
    const comRegra = PERFIS_DE_PRECO.filter((p) => p.regras.length > 0);
    expect(comRegra.length).toBeGreaterThan(0);
    expect(comRegra.length).toBeLessThan(PERFIS_DE_PRECO.length);
  });

  it("toda regra se aplica a pelo menos um dia", () => {
    // Regra de zero dias é o que a origem resume como "aplicada em nenhum dia" — estado de
    // rascunho no formulário, nunca de regra salva.
    for (const p of PERFIS_DE_PRECO) {
      for (const r of p.regras) {
        expect(r.dias.length).toBeGreaterThan(0);
        for (const d of r.dias) expect(DIAS_DA_SEMANA).toContain(d);
      }
    }
  });

  it("toda regra termina depois de começar", () => {
    const min = (s: string) => {
      const [h, m] = s.split(":").map(Number);
      return h * 60 + m;
    };
    for (const p of PERFIS_DE_PRECO) {
      for (const r of p.regras) {
        expect(min(r.horaFinal)).toBeGreaterThan(min(r.horaInicial));
      }
    }
  });

  it("regra com recarga grátis não carrega preço de energia", () => {
    for (const p of PERFIS_DE_PRECO) {
      for (const r of p.regras.filter((x) => x.modoDeCobranca === "gratis")) {
        expect(r.precoEnergia).toBeNull();
      }
    }
  });

  it("todo perfil tem pelo menos um carregador, com cpcode no formato da origem", () => {
    for (const p of PERFIS_DE_PRECO) {
      expect(p.carregadores.length).toBeGreaterThan(0);
      for (const c of p.carregadores) {
        // `19171-1` — número do carregador e do conector.
        expect(c.cpcode).toMatch(/^\d{5}-\d$/);
      }
    }
  });

  /** O resumo do modal é a única parte gerada que o usuário LÊ pra decidir se salva. */
  describe("resumoDaRegra", () => {
    const base = {
      dias: [...DIAS_DA_SEMANA],
      horaInicial: "00:00",
      horaFinal: "00:30",
      modoDeCobranca: "normal" as const,
      usoDeCupons: "permitir" as const,
      precoEnergia: 3,
      usoDoCarregador: null,
      taxaDeAtivacao: 3,
      ociosidade: null,
    };

    it("diz 'nenhum dia' quando nenhum dia está marcado", () => {
      // Literal da referência, e honesto: sem dia, a regra não se aplica a dia nenhum.
      expect(resumoDaRegra({ ...base, dias: [] })).toContain("em nenhum dia");
    });

    it("colapsa a semana inteira em 'todos os dias'", () => {
      expect(resumoDaRegra(base)).toContain("em todos os dias");
    });

    it("lista só as cobranças ligadas", () => {
      const t = resumoDaRegra({ ...base, dias: ["Seg."] });
      expect(t).toContain("Cobranças: Energia, Taxa de ativação.");
      expect(t).not.toContain("Uso do carregador");
      expect(t).not.toContain("Ociosidade");
    });

    it("traz o valor base formatado em real", () => {
      expect(resumoDaRegra({ ...base, dias: ["Seg."] })).toContain("/kWh.");
      expect(resumoDaRegra({ ...base, dias: ["Seg."] })).toMatch(/R\$\s?3,00/);
    });

    it("sem nenhuma cobrança ligada, diz isso em vez de listar vazio", () => {
      const t = resumoDaRegra({
        ...base,
        dias: ["Seg."],
        precoEnergia: null,
        taxaDeAtivacao: null,
      });
      expect(t).toContain("Sem cobranças.");
      expect(t).not.toContain("Valor base");
    });

    /**
     * Encontrado MEDINDO o modal, não lendo o código: com "Recarga grátis" o resumo ainda
     * listava "Cobranças: Energia … Valor base: R$ 3,00/kWh". Os switches de tipo de cobrança
     * são independentes do modo no formulário, então a frase se contradizia no meio — e é a
     * frase pela qual se confere a regra antes de salvar.
     */
    it("recarga grátis não lista cobrança nem valor base", () => {
      const t = resumoDaRegra({
        ...base,
        dias: ["Seg."],
        modoDeCobranca: "gratis",
      });
      expect(t).toContain("com recarga grátis");
      expect(t).toContain("Sem cobranças.");
      expect(t).not.toContain("Energia");
      expect(t).not.toContain("Valor base");
    });

    it("reflete o modo de cobrança e o uso de cupons", () => {
      const t = resumoDaRegra({
        ...base,
        dias: ["Seg."],
        modoDeCobranca: "gratis",
        usoDeCupons: "bloquear",
      });
      expect(t).toContain("com recarga grátis");
      expect(t).toContain("Cupons bloqueados.");
    });
  });

  it("o mock é determinístico — mesma leitura, mesmos dados", () => {
    const p = PERFIS_DE_PRECO[4];
    expect(PERFIS_DE_PRECO[4]).toBe(p);
    expect(p.regras).toEqual(PERFIS_DE_PRECO[4].regras);
  });
});
