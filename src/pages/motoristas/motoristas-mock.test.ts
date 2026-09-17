import { describe, it, expect } from "vitest";
import {
  MOTORISTAS,
  TAGS_DISPONIVEIS,
  formatarDuracao,
} from "./motoristas-mock";

/**
 * Invariantes de Motoristas.
 *
 * ⛔ **O primeiro grupo é sobre PRIVACIDADE, não sobre formatação.** A referência mostra
 * pessoas reais — nome, e-mail, CPF e telefone. Estes testes travam que nada disso foi
 * copiado, porque é o tipo de coisa que volta sem querer num "só pra ficar mais parecido".
 */

describe("motoristas-mock — nenhum dado pessoal real", () => {
  /** Os dez e-mails que a referência expõe na primeira página. */
  const EMAILS_DA_ORIGEM = [
    "jmwmg2003@yahoo.com.br",
    "felipe.juridico@live.com",
    "leandrodelmondes13@gmail.com",
    "brunolbgn25@gmail.com",
    "janacarvgmbio@gmail.com",
    "alexsandro.correa22@gmail.com",
    "fccrisantino@gmail.com",
    "fleivercandido@gmail.com",
    "jpbproducao@gmail.com",
    "94y5chg82y@privaterelay.appleid.com",
  ];

  /** E os dez CPFs. */
  const CPFS_DA_ORIGEM = [
    "039.341.516-39",
    "092.520.586-99",
    "096.289.066-90",
    "108.407.506-76",
    "044.477.086-04",
    "072.929.906-65",
    "062.125.156-97",
    "035.898.656-79",
    "404.628.380-00",
    "097.018.016-01",
  ];

  it("nenhum e-mail da referência aparece no mock", () => {
    const meus = MOTORISTAS.map((m) => m.email.toLowerCase());
    for (const real of EMAILS_DA_ORIGEM) {
      expect(meus).not.toContain(real.toLowerCase());
    }
  });

  it("nenhum CPF da referência aparece no mock", () => {
    const meus = MOTORISTAS.map((m) => m.cpf);
    for (const real of CPFS_DA_ORIGEM) expect(meus).not.toContain(real);
  });

  it("todo e-mail usa domínio de exemplo", () => {
    // Domínio real num mock é um mock que alguém dispara sem querer num teste de integração.
    for (const m of MOTORISTAS) {
      expect(m.email).toMatch(/@(exemplo\.com|exemplo\.com\.br|mail\.exemplo\.com)$/);
    }
  });

  /**
   * ⚠️ O CPF é gerado com os 11 dígitos aleatórios, então os verificadores quase nunca
   * fecham. Um CPF válido é um CPF que existe, ou vai existir — e a tela só exibe o valor.
   */
  it("os CPFs não são válidos pelo dígito verificador", () => {
    const valido = (cpf: string) => {
      const n = cpf.replace(/\D/g, "");
      if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;
      const dv = (ate: number) => {
        let soma = 0;
        for (let i = 0; i < ate; i++) soma += Number(n[i]) * (ate + 1 - i);
        const r = (soma * 10) % 11;
        return r === 10 ? 0 : r;
      };
      return dv(9) === Number(n[9]) && dv(10) === Number(n[10]);
    };
    // Com 22 CPFs aleatórios, a chance de algum fechar por acaso é ~1%. Se este teste
    // falhar, é coincidência — regere a semente, não relaxe a asserção.
    expect(MOTORISTAS.filter((m) => valido(m.cpf)).length).toBe(0);
  });
});

describe("motoristas-mock — forma e domínio", () => {
  it("todo motorista tem id único", () => {
    const ids = MOTORISTAS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("tem motoristas suficientes pra paginar em 10 por página", () => {
    expect(MOTORISTAS.length).toBeGreaterThan(10);
  });

  it("todo CPF vem mascarado, como na referência", () => {
    for (const m of MOTORISTAS) expect(m.cpf).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
  });

  /**
   * A origem tem `(31) 98556-8104` e `31994641836` na mesma página. É dado digitado por
   * gente diferente, e normalizar esconderia que a coluna precisa aguentar as duas formas.
   */
  it("os dois formatos de telefone convivem", () => {
    const comMascara = MOTORISTAS.filter((m) => m.telefone.includes("("));
    const sem = MOTORISTAS.filter((m) => !m.telefone.includes("("));
    expect(comMascara.length).toBeGreaterThan(0);
    expect(sem.length).toBeGreaterThan(0);
  });

  it("existem motoristas com e sem tag — o filtro tem o que filtrar", () => {
    const com = MOTORISTAS.filter((m) => m.tags.length > 0);
    expect(com.length).toBeGreaterThan(0);
    expect(com.length).toBeLessThan(MOTORISTAS.length);
    for (const m of com) {
      for (const t of m.tags) expect(TAGS_DISPONIVEIS).toContain(t);
    }
  });

  /**
   * Valor e energia andam juntos: quem consumiu zero pagou zero, e cobrar de quem não
   * consumiu é o defeito que essa invariante impede de entrar no mock.
   */
  it("valor é zero exatamente quando a energia é zero", () => {
    for (const m of MOTORISTAS) {
      expect(m.valor === 0).toBe(m.energiaKwh === 0);
    }
  });

  it("a primeira linha reproduz o caso ZERADO da referência", () => {
    // `0,00 kWh`, `00min`, `R$ 0,00` — uma recarga que não consumiu nada. É o caso que
    // testa se a tela aguenta zero sem parecer defeito.
    const m = MOTORISTAS[0];
    expect(m.transacoes).toBe(1);
    expect(m.energiaKwh).toBe(0);
    expect(m.duracaoMin).toBe(0);
    expect(m.valor).toBe(0);
  });

  it("quem tem transação tem pelo menos um carregador", () => {
    for (const m of MOTORISTAS) {
      expect(m.carregadores).toBeGreaterThan(0);
      expect(m.transacoes).toBeGreaterThanOrEqual(m.carregadores === 0 ? 0 : 1);
    }
  });

  it("o complemento é vazio, como em 10/10 da referência", () => {
    for (const m of MOTORISTAS) expect(m.complemento).toBe("");
  });

  it("há cadastro de empresa na lista, não só de pessoa", () => {
    // A coluna se chama `Usuários`, e a origem tem uma LTDA entre elas.
    expect(MOTORISTAS.some((m) => /LTDA$/.test(m.nome))).toBe(true);
  });

  describe("formatarDuracao", () => {
    it("abaixo de uma hora mostra só os minutos", () => {
      // `00h 28min` gastaria três caracteres pra dizer "nenhuma hora".
      expect(formatarDuracao(28)).toBe("28min");
      expect(formatarDuracao(0)).toBe("0min");
      expect(formatarDuracao(59)).toBe("59min");
    });

    it("a partir de uma hora mostra horas com zero à esquerda", () => {
      expect(formatarDuracao(60)).toBe("01h 00min");
      expect(formatarDuracao(287)).toBe("04h 47min");
    });
  });
});
