import { describe, expect, it } from "vitest";
import { GEO_DOS_LOCAIS } from "~/pages/monitoramento/monitoramento-mock";
import {
  ACESSOS,
  LOCAIS_DISPONIVEIS,
  MODULOS,
  PERFIL,
  PERFIS,
  cobreTudo,
  dataCurta,
  locaisDoAcesso,
  modulosAlcancados,
  perfilMaisForte,
  perfilPredominante,
  perfisDoAcesso,
} from "./permissoes-mock";

describe("perfis", () => {
  it("tem os cinco, e o mapa cobre todos", () => {
    expect(PERFIS).toHaveLength(5);
    PERFIS.forEach((p) => expect(PERFIL[p].id).toBe(p));
  });

  it("está ordenado do mais poderoso pro menos — administrador primeiro, padrão por último", () => {
    expect(PERFIS[0]).toBe("administrador");
    expect(PERFIS[PERFIS.length - 1]).toBe("padrao");
  });

  it("o alcance decresce junto com a ordem", () => {
    const alcances = PERFIS.map(modulosAlcancados);
    const ordenado = [...alcances].sort((a, b) => b - a);
    expect(alcances).toEqual(ordenado);
  });

  it("administrador alcança tudo e nenhum perfil fica sem nada", () => {
    expect(modulosAlcancados("administrador")).toBe(MODULOS.length);
    PERFIS.forEach((p) => expect(modulosAlcancados(p)).toBeGreaterThan(0));
  });
});

describe("matriz", () => {
  it("todo módulo declara nível pros cinco perfis", () => {
    MODULOS.forEach((m) =>
      PERFIS.forEach((p) => expect(m.niveis[p]).toBeDefined()),
    );
  });

  it("toda ressalva pertence a um perfil que tem algum acesso ao módulo", () => {
    MODULOS.forEach((m) =>
      Object.keys(m.ressalvas ?? {}).forEach((p) =>
        expect(m.niveis[p as keyof typeof m.niveis]).not.toBe("nenhum"),
      ),
    );
  });

  it("ids de módulo são únicos", () => {
    const ids = MODULOS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("administrador tem acesso total em todos os módulos", () => {
    MODULOS.forEach((m) => expect(m.niveis.administrador).toBe("total"));
  });

  it("respeita as restrições que a legenda da referência cita nominalmente", () => {
    const por = (id: string) => MODULOS.find((m) => m.id === id)!;
    /* "restrições às telas de Configuração, Resumo, Financeiro" */
    expect(por("configuracoes").niveis.colaborador).toBe("nenhum");
    expect(por("resumo").niveis.colaborador).toBe("nenhum");
    expect(por("financeiro").niveis.colaborador).toBe("nenhum");
    /* "sem permissão para editar preços" */
    expect(por("precos").niveis.tecnico).toBe("leitura");
    /* "permissão apenas para Monitoramento (sem estornos) e Transações" */
    expect(por("monitoramento").niveis.parceiro).toBe("leitura");
    expect(por("transacoes").niveis.parceiro).toBe("leitura");
    expect(por("carregadores").niveis.parceiro).toBe("nenhum");
  });
});

describe("acessos", () => {
  it("ids e e-mails são únicos", () => {
    expect(new Set(ACESSOS.map((a) => a.id)).size).toBe(ACESSOS.length);
    expect(new Set(ACESSOS.map((a) => a.email)).size).toBe(ACESSOS.length);
  });

  it("todo local citado existe no cadastro de Monitoramento", () => {
    const conhecidos = new Set(Object.keys(GEO_DOS_LOCAIS));
    ACESSOS.forEach((a) =>
      locaisDoAcesso(a).forEach((l) => expect(conhecidos.has(l)).toBe(true)),
    );
  });

  it("nenhum acesso fica sem local — acesso sem local não é acesso", () => {
    ACESSOS.forEach((a) => expect(locaisDoAcesso(a).length).toBeGreaterThan(0));
  });

  it("exercita os estados que a tela precisa renderizar", () => {
    expect(ACESSOS.some(cobreTudo)).toBe(true);
    expect(ACESSOS.some((a) => !cobreTudo(a))).toBe(true);
    expect(ACESSOS.some((a) => perfilPredominante(a) === null)).toBe(true);
    expect(ACESSOS.some((a) => locaisDoAcesso(a).length === 1)).toBe(true);
    expect(ACESSOS.some((a) => a.ultimoAcesso === null)).toBe(true);
    expect(ACESSOS.some((a) => a.nome === null)).toBe(true);
  });

  it("todos os cinco perfis aparecem em algum acesso", () => {
    const usados = new Set(ACESSOS.flatMap(perfisDoAcesso));
    PERFIS.forEach((p) => expect(usados.has(p)).toBe(true));
  });
});

describe("derivações", () => {
  it("perfilPredominante devolve null só quando há mais de um perfil", () => {
    ACESSOS.forEach((a) => {
      const n = perfisDoAcesso(a).length;
      expect(perfilPredominante(a) === null).toBe(n > 1);
    });
  });

  it("perfilMaisForte devolve o primeiro da ordem de poder", () => {
    const misto = ACESSOS.find((a) => perfilPredominante(a) === null)!;
    expect(perfilMaisForte(misto)).toBe("administrador");
  });

  it("cobreTudo só é verdade com os 17 locais", () => {
    ACESSOS.forEach((a) =>
      expect(cobreTudo(a)).toBe(
        locaisDoAcesso(a).length === LOCAIS_DISPONIVEIS.length,
      ),
    );
  });

  it("dataCurta inverte a data sem passar por Date (fuso não interfere)", () => {
    expect(dataCurta("2026-09-15")).toBe("15/09/2026");
    expect(dataCurta("2025-01-01")).toBe("01/01/2025");
  });
});

describe("privacidade e vocabulário", () => {
  it("nenhum e-mail real — todos apontam pro domínio do mock", () => {
    ACESSOS.forEach((a) => expect(a.email.endsWith("@exemplo.com.br")).toBe(true));
  });

  it("a palavra proibida não aparece em nenhum texto da tela", () => {
    const tudo = JSON.stringify({ ACESSOS, MODULOS, PERFIL });
    expect(tudo.toLowerCase()).not.toContain("spott");
    expect(tudo.toLowerCase()).not.toContain("spot ");
  });
});
