import { describe, it, expect } from "vitest";
import { NOME_DO_PERFIL_PADRAO } from "~/pages/precos/precos-mock";
import {
  CARREGADORES,
  DISPOSITIVO_MEDIDO,
  DOMINIO_PUBLICO,
  gerarIdDeCarregador,
  urlDoPlugue,
} from "./carregadores-mock";

/**
 * Invariantes que ligam o mock à referência.
 *
 * A mais importante não é de formatação: o nome da marca de ORIGEM não pode vazar em texto
 * de produto, e a URL pública do plugue é o único lugar desta tela onde ela apareceria.
 */

describe("carregadores-mock — invariantes da referência", () => {
  it("todo carregador tem id único — é a chave que abre o painel", () => {
    const ids = CARREGADORES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("CPCODE é único — é o que vai na URL pública do QR", () => {
    const codes = CARREGADORES.map((c) => c.cpcode);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("tem carregadores suficientes pra paginar em 10 por página", () => {
    expect(CARREGADORES.length).toBeGreaterThan(10);
  });

  /** Âncora: a primeira linha medida, com a ficha de dispositivo inteira do print. */
  it("o carregador âncora reproduz a ficha MEDIDA", () => {
    const c = CARREGADORES[0];

    expect(c.identificador).toBe("125020001210");
    expect(c.cpcode).toBe("46868");
    expect(c.nome).toBe("7,4 kW");
    expect(c.modelo).toBe("PEVC2108E");
    expect(c.status).toBe("Online");
    /* A coluna Preço mostra `–` nas duas primeiras linhas. */
    expect(c.perfilDePreco).toBeNull();

    expect(c.potenciaKw).toBe(DISPOSITIVO_MEDIDO.potenciaKw);
    expect(c.marca).toBe(DISPOSITIVO_MEDIDO.marca);
    expect(c.versaoDeFirmware).toBe(DISPOSITIVO_MEDIDO.versaoDeFirmware);
    expect(c.iccid).toBe(DISPOSITIVO_MEDIDO.iccid);
    expect(c.imsi).toBe(DISPOSITIVO_MEDIDO.imsi);
    expect(c.tipoDeMedidor).toBe(DISPOSITIVO_MEDIDO.tipoDeMedidor);
    /* `Sem limite diferenciado` é o estado medido. */
    expect(c.limiteKw).toBeNull();

    /* A aba Plugues mostrou UM conector, `46868-1`, Tipo2 e ativo. */
    expect(c.plugues).toEqual([
      { id: "46868-1", tipo: "Conector Tipo2", ativo: true },
    ]);
  });

  /**
   * ⛔ **A marca do sistema de origem não entra em texto de produto.** Na referência a URL
   * pública aponta pro domínio dela, e essa string aparece na tela, copiável, dentro da aba
   * Plugues — é o lugar mais fácil de a marca errada vazar sem ninguém notar.
   */
  it("nenhuma URL pública carrega o domínio da marca de origem", () => {
    for (const c of CARREGADORES) {
      for (const p of c.plugues) {
        const url = urlDoPlugue(p);
        expect(url.startsWith(DOMINIO_PUBLICO)).toBe(true);
        expect(url.toLowerCase()).not.toContain("spott");
      }
    }
  });

  it("a URL do plugue é montada com o id dele, no formato da origem", () => {
    // `.../ch/46868-1` — CPCODE do carregador + número do conector.
    const p = CARREGADORES[0].plugues[0];
    expect(urlDoPlugue(p)).toBe(`${DOMINIO_PUBLICO}/46868-1`);
  });

  it("todo plugue pertence ao CPCODE do próprio carregador", () => {
    // Um plugue com o código de outro carregador mandaria o motorista pro equipamento
    // errado ao escanear o QR.
    for (const c of CARREGADORES) {
      for (const p of c.plugues) {
        expect(p.id.startsWith(`${c.cpcode}-`)).toBe(true);
      }
    }
  });

  /** `Dual` no nome significa dois conectores — a palavra diz, e a aba Plugues mostra. */
  it("carregador Dual tem dois plugues; os outros, um", () => {
    for (const c of CARREGADORES) {
      const dual = /dual/i.test(c.nome);
      expect(c.plugues.length).toBe(dual ? 2 : 1);
    }
  });

  it("a potência bate com o que o nome anuncia", () => {
    for (const c of CARREGADORES) {
      if (/60/.test(c.nome)) expect(c.potenciaKw).toBe(60);
      else expect(c.potenciaKw).toBe(7.4);
    }
  });

  /**
   * A referência mostrou as 10 linhas `Online` e todas ativas. Reproduzir só isso deixaria a
   * coluna Status sem nada pra mostrar e o switch do painel sempre ligado — as linhas
   * derivadas existem pra exercitar os dois estados.
   */
  it("existem carregadores online e offline", () => {
    const online = CARREGADORES.filter((c) => c.status === "Online");
    expect(online.length).toBeGreaterThan(0);
    expect(online.length).toBeLessThan(CARREGADORES.length);
  });

  it("as 10 primeiras linhas — as MEDIDAS — estão todas online e ativas", () => {
    for (const c of CARREGADORES.slice(0, 10)) {
      expect(c.status).toBe("Online");
      expect(c.ativo).toBe(true);
    }
  });

  it("existem carregadores com e sem perfil de preço", () => {
    // A coluna Preço mostra `–` quando não há perfil, e um link quando há.
    const com = CARREGADORES.filter((c) => c.perfilDePreco !== null);
    expect(com.length).toBeGreaterThan(0);
    expect(com.length).toBeLessThan(CARREGADORES.length);
    for (const c of com) expect(c.perfilDePreco).toBe(NOME_DO_PERFIL_PADRAO);
  });

  it("todo nome de local vem de uma empresa MOB, como na referência", () => {
    for (const c of CARREGADORES) {
      expect(c.local).toMatch(/^(IGREEN|PV) MOB - /);
    }
  });

  it("as três grafias de nome da origem convivem", () => {
    // `7,4 kW`, `60 KW Dual` e `AC 7,4 KW` aparecem na mesma página da referência. É dado
    // digitado por quem cadastra, e normalizar esconderia que a tela aguenta nome livre.
    const nomes = new Set(CARREGADORES.slice(0, 10).map((c) => c.nome));
    expect(nomes.has("7,4 kW")).toBe(true);
    expect(nomes.has("AC 7,4 KW")).toBe(true);
    expect([...nomes].some((n) => /dual/i.test(n))).toBe(true);
  });

  describe("gerarIdDeCarregador", () => {
    it("gera 12 dígitos, o formato dos IDs medidos", () => {
      expect(gerarIdDeCarregador()).toMatch(/^\d{12}$/);
    });

    it("passa do mínimo de 6 caracteres que o modal exige", () => {
      expect(gerarIdDeCarregador().length).toBeGreaterThanOrEqual(6);
    });

    it("não repete em chamadas seguidas", () => {
      // Colisão de ID é o defeito que o botão `Gerar` existe pra evitar.
      const gerados = new Set(
        Array.from({ length: 50 }, () => gerarIdDeCarregador()),
      );
      expect(gerados.size).toBeGreaterThan(40);
    });
  });
});
