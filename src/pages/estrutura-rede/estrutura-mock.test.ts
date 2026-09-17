import { describe, expect, it } from "vitest";
import { GEO_DOS_LOCAIS } from "~/pages/monitoramento/monitoramento-mock";
import {
  ESTRUTURA,
  caminhoDoNo,
  filhosDe,
  locaisDaEmpresa,
  type NoDaRede,
} from "./estrutura-mock";

/**
 * O que estes testes protegem:
 *
 * 1. a árvore é uma ÁRVORE — sem órfão, sem ciclo, um caminho por nó;
 * 2. os locais são os mesmos do Monitoramento, e continuam sendo;
 * 3. nenhum dado real da referência entrou.
 */

describe("a árvore", () => {
  it("tem exatamente uma raiz", () => {
    const raizes = ESTRUTURA.filter((n) => n.paiId === null);
    expect(raizes).toHaveLength(1);
    expect(raizes[0].nivel).toBe("rede");
  });

  it("não tem órfão — todo pai existe", () => {
    const ids = new Set(ESTRUTURA.map((n) => n.id));
    const orfaos = ESTRUTURA.filter((n) => n.paiId && !ids.has(n.paiId));
    expect(orfaos.map((o) => o.nome)).toEqual([]);
  });

  it("os ids são únicos", () => {
    expect(new Set(ESTRUTURA.map((n) => n.id)).size).toBe(ESTRUTURA.length);
  });

  it("cada nível só pendura no nível de cima", () => {
    const porId = new Map(ESTRUTURA.map((n) => [n.id, n]));
    for (const n of ESTRUTURA) {
      if (!n.paiId) continue;
      const pai = porId.get(n.paiId)!;
      /* Local pendurado direto na rede, ou empresa dentro de empresa, seria uma árvore que
         renderiza e mente sobre a estrutura. */
      if (n.nivel === "empresa") expect(pai.nivel).toBe("rede");
      if (n.nivel === "local") expect(pai.nivel).toBe("empresa");
    }
  });

  it("o caminho vai da raiz até o próprio nó", () => {
    const local = ESTRUTURA.find((n) => n.nivel === "local")!;
    const caminho = caminhoDoNo(local);
    expect(caminho).toHaveLength(3);
    expect(caminho[0]).toBe("rede");
    expect(caminho[caminho.length - 1]).toBe(local.id);
  });

  it("o caminho da raiz tem só ela", () => {
    const raiz = ESTRUTURA.find((n) => n.paiId === null)!;
    expect(caminhoDoNo(raiz)).toEqual([raiz.id]);
  });

  it("ciclo não trava — o caminho para em vez de rodar pra sempre", () => {
    /* Um ciclo num `while` de subida congela o navegador DURANTE o render, sem stack
       trace útil. O mock não cria ciclo; esta guarda é pro dado que vier de uma edição. */
    const a: NoDaRede = { ...ESTRUTURA[1], id: "a", paiId: "b" };
    const b: NoDaRede = { ...ESTRUTURA[1], id: "b", paiId: "a" };
    const caminho = caminhoDoNo(a, [a, b]);
    expect(caminho).toHaveLength(2);
  });

  it("todo nó tem um caminho único", () => {
    const caminhos = ESTRUTURA.map((n) => caminhoDoNo(n).join("/"));
    expect(new Set(caminhos).size).toBe(ESTRUTURA.length);
  });
});

describe("empresas e locais", () => {
  it("os filhos da rede são as empresas", () => {
    const raiz = ESTRUTURA.find((n) => n.paiId === null)!;
    const filhos = filhosDe(raiz.id);
    expect(filhos.length).toBeGreaterThan(0);
    expect(filhos.every((f) => f.nivel === "empresa")).toBe(true);
  });

  it("os locais são os MESMOS do Monitoramento", () => {
    /* Um local cadastrado aqui e ausente lá é exatamente o defeito que uma tela de
       estrutura deveria impedir. */
    const daEstrutura = ESTRUTURA.filter((n) => n.nivel === "local")
      .map((n) => n.nome)
      .sort();
    expect(daEstrutura).toEqual(Object.keys(GEO_DOS_LOCAIS).sort());
  });

  it("todo local tem cidade e UF", () => {
    for (const l of ESTRUTURA.filter((n) => n.nivel === "local")) {
      expect(l.cidade, l.nome).toBeTruthy();
      expect(l.uf, l.nome).toBeTruthy();
    }
  });

  it("`locaisDaEmpresa` devolve só locais, e só os dela", () => {
    const empresa = ESTRUTURA.find((n) => n.nivel === "empresa")!;
    const locais = locaisDaEmpresa(empresa.id);
    expect(locais.length).toBe(Object.keys(GEO_DOS_LOCAIS).length);
    expect(locais.every((l) => l.nivel === "local")).toBe(true);
    expect(locais.every((l) => l.paiId === empresa.id)).toBe(true);
  });

  it("empresa sem local devolve lista vazia, não estoura", () => {
    expect(locaisDaEmpresa("empresa-que-nao-existe")).toEqual([]);
  });

  it("há pelo menos um local inativo", () => {
    /* Sem ele o chip "Inativo" e o switch do formulário nasceriam sem exercício. */
    expect(ESTRUTURA.some((n) => n.nivel === "local" && !n.ativo)).toBe(true);
  });
});

describe("privacidade", () => {
  it("nenhum CNPJ é válido — os dígitos verificadores são forçados a falhar", () => {
    /* Um CNPJ que passa na validação é o CNPJ de alguém. */
    for (const n of ESTRUTURA) {
      const d = n.cnpj.replace(/\D/g, "");
      expect(d, n.nome).toHaveLength(14);
      expect(validaCnpj(d), `${n.nome} tem CNPJ VÁLIDO: ${n.cnpj}`).toBe(false);
    }
  });

  it("todo e-mail aponta pro domínio do mock", () => {
    for (const n of ESTRUTURA) {
      expect(n.email, n.nome).toMatch(/@exemplo\.com\.br$/);
    }
  });

  it("a palavra da marca de origem não aparece em lugar nenhum", () => {
    const tudo = JSON.stringify(ESTRUTURA).toLowerCase();
    expect(tudo).not.toContain("spott");
  });
});

/** Validação real de CNPJ (módulo 11) — usada só pra provar que os nossos FALHAM. */
function validaCnpj(d: string): boolean {
  if (/^(\d)\1{13}$/.test(d)) return false;
  const digito = (base: string) => {
    let peso = base.length - 7;
    let soma = 0;
    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * peso--;
      if (peso < 2) peso = 9;
    }
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return (
    digito(d.slice(0, 12)) === Number(d[12]) &&
    digito(d.slice(0, 13)) === Number(d[13])
  );
}
