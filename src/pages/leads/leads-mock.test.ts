import { describe, expect, it } from "vitest";
import {
  HOJE,
  JANELA_EM_DIAS,
  LEADS,
  ORDEM_DOS_ESTADOS,
  TODOS_OS_PRODUTOS,
  diasRestantes,
  estadoEfetivo,
  expirado,
  expirandoEm48h,
  faixaDoPrazo,
  interrupcaoDaTrilha,
  linkDoWhatsApp,
  marcosDoLead,
  precisaDeAcao,
  produtosEmAberto,
  rotuloDoPrazo,
  situacaoDaJanela,
  telefoneLegivel,
  ultimoContato,
  type Lead,
} from "./leads-mock";

/**
 * Testes do mock de Leads.
 *
 * Dois grupos, com propósitos diferentes:
 *
 * 1. **Dados fictícios** — trava que nenhum dado de pessoa real entrou. Telefone é o
 *    campo central desta tela e o mais fácil de alguém colar "só para testar".
 * 2. **Regras** — trava as decisões que o benchmark produziu, especialmente as duas que
 *    são contraintuitivas e que alguém "corrigiria" sem saber: contato NÃO estende o
 *    prazo, e conversão NÃO se declara arrastando.
 */

describe("dados fictícios", () => {
  it("todo telefone segue o padrão fictício: DDI 55 + DDD + 9 + oito dígitos", () => {
    for (const l of LEADS) {
      expect(l.telefone, `${l.id} ${l.cliente}`).toMatch(/^55\d{2}9\d{8}$/);
    }
  });

  it("os DDDs saem da lista de MG e SP usada pelos outros mocks", () => {
    const permitidos = ["31", "32", "34", "35", "37", "11", "19"];
    for (const l of LEADS) {
      expect(permitidos).toContain(l.telefone.slice(2, 4));
    }
  });

  it("nenhum lead carrega e-mail ou CPF — a tela não pede", () => {
    const bruto = JSON.stringify(LEADS);
    expect(bruto).not.toMatch(/@/);
    expect(bruto).not.toMatch(/\d{3}\.\d{3}\.\d{3}-\d{2}/);
  });

  it("os ids são únicos", () => {
    const ids = LEADS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("a janela de 7 dias", () => {
  it("um lead criado hoje tem a janela inteira", () => {
    const hoje = LEADS.find((l) => diasRestantes(l) === JANELA_EM_DIAS);
    expect(hoje, "o mock precisa de um lead criado hoje").toBeDefined();
  });

  /**
   * ⚠️ **A regra que mais parece defeito e não é.**
   *
   * No Pipedrive, que tem a mecânica mais parecida do mercado, qualquer atividade zera o
   * contador. Aqui não: o prazo corre do pré-cadastro e contato não estende. Se alguém
   * "consertar" isso um dia, este teste cai.
   */
  it("contato NÃO estende o prazo", () => {
    const comContato = LEADS.find((l) => l.contatos.length > 0)!;
    const semContato: Lead = { ...comContato, contatos: [] };
    expect(diasRestantes(comContato)).toBe(diasRestantes(semContato));
  });

  it("convertido e perdido nunca expiram — já terminaram", () => {
    for (const l of LEADS) {
      if (l.estado === "convertido" || l.estado === "perdido") {
        expect(expirado(l), l.id).toBe(false);
        expect(estadoEfetivo(l)).toBe(l.estado);
      }
    }
  });

  it("expirado é DERIVADO do relógio, não gravado no lead", () => {
    const expirados = LEADS.filter((l) => expirado(l));
    expect(expirados.length, "o mock precisa de leads expirados").toBeGreaterThan(0);
    for (const l of expirados) {
      /* O campo armazenado continua sendo o último estado de TRABALHO. */
      expect(ORDEM_DOS_ESTADOS).toContain(l.estado);
      expect(l.estado).not.toBe("convertido");
      expect(estadoEfetivo(l)).toBe("expirado");
    }
  });

  it("as faixas do prazo cobrem as quatro situações", () => {
    const faixas = new Set(LEADS.map((l) => faixaDoPrazo(l)));
    for (const f of ["tranquilo", "atencao", "perigo", "expirado", "encerrado"]) {
      expect(faixas, `falta um lead na faixa ${f}`).toContain(f);
    }
  });

  it("o rótulo fala de PRAZO, nunca de abandono", () => {
    const abertos = LEADS.filter((l) => precisaDeAcao(l));
    for (const l of abertos) {
      const r = rotuloDoPrazo(l);
      expect(r, l.id).toMatch(/^Expira/);
      expect(r).not.toMatch(/parado/i);
    }
  });

  it("expirandoEm48h pega só quem ainda dá para salvar", () => {
    for (const l of LEADS) {
      if (!expirandoEm48h(l)) continue;
      expect(precisaDeAcao(l)).toBe(true);
      expect(diasRestantes(l)).toBeGreaterThanOrEqual(0);
      expect(diasRestantes(l)).toBeLessThanOrEqual(1);
    }
  });
});

describe("situação e estado respondem a perguntas diferentes", () => {
  it("situação fala da janela; estado fala do trabalho", () => {
    for (const l of LEADS) {
      const s = situacaoDaJanela(l);
      if (s === "Precisa de ação") expect(precisaDeAcao(l)).toBe(true);
      if (s === "Expirado") expect(expirado(l)).toBe(true);
      if (s === "Convertido") expect(l.estado).toBe("convertido");
    }
  });

  it("todo estado visível tem lugar na ordem do trabalho", () => {
    for (const l of LEADS) {
      expect(ORDEM_DOS_ESTADOS).toContain(estadoEfetivo(l));
    }
  });
});

describe("oportunidade", () => {
  it("produtos que tem e produtos em aberto somam os quatro", () => {
    for (const l of LEADS) {
      expect(l.produtos.length + produtosEmAberto(l).length).toBe(
        TODOS_OS_PRODUTOS.length,
      );
    }
  });

  it("existe o lead com zero produtos e o lead com os quatro", () => {
    expect(LEADS.some((l) => l.produtos.length === 0)).toBe(true);
    expect(LEADS.some((l) => l.produtos.length === TODOS_OS_PRODUTOS.length)).toBe(true);
  });

  it("todo lead convertido registra em qual produto converteu", () => {
    for (const l of LEADS) {
      if (l.estado === "convertido") expect(l.converteuEm).toBeDefined();
    }
  });

  it("todo lead perdido registra o motivo", () => {
    for (const l of LEADS) {
      if (l.estado === "perdido") expect(l.motivoDaPerda).toBeTruthy();
    }
  });
});

describe("contato", () => {
  it("o histórico está em ordem cronológica, e ultimoContato pega o mais recente", () => {
    for (const l of LEADS) {
      const datas = l.contatos.map((c) => c.quando);
      expect([...datas].sort()).toEqual(datas);
      if (datas.length > 0) {
        expect(ultimoContato(l)!.quando).toBe(datas[datas.length - 1]);
      } else {
        expect(ultimoContato(l)).toBeNull();
      }
    }
  });

  it("nenhum contato é do futuro", () => {
    for (const l of LEADS) {
      for (const c of l.contatos) {
        expect(new Date(c.quando).getTime()).toBeLessThanOrEqual(HOJE.getTime());
      }
    }
  });

  it("quem tem contato não está em Novo", () => {
    for (const l of LEADS) {
      if (l.contatos.length > 0) expect(l.estado).not.toBe("novo");
    }
  });
});

describe("link do WhatsApp", () => {
  it("usa wa.me com o número só em dígitos e a mensagem codificada", () => {
    const l = LEADS[0];
    const url = linkDoWhatsApp(l);
    expect(url.startsWith(`https://wa.me/${l.telefone}?text=`)).toBe(true);
    /* Nada de espaço cru: o parâmetro tem que sobreviver à barra de endereço. */
    expect(url).not.toMatch(/ /);
  });

  it("a mensagem cita o primeiro nome e o posto, sem o prefixo da rede", () => {
    const l = LEADS[0];
    const texto = decodeURIComponent(linkDoWhatsApp(l).split("?text=")[1]);
    expect(texto).toContain(l.cliente.split(" ")[0]);
    expect(texto).not.toContain("IGREEN MOB -");
  });
});

describe("formatação", () => {
  it("telefoneLegivel devolve a máscara brasileira sem o DDI", () => {
    expect(telefoneLegivel("5531988881234")).toBe("(31) 98888-1234");
  });
});

/**
 * A trilha de marcos.
 *
 * Estes testes existem porque a decisão é contraintuitiva: o operador pediu "uma linha
 * de progresso dos estados", e o que foi entregue é uma linha de MARCOS — quatro, não
 * cinco. Quem vier depois vai querer "completar" a trilha com `Tentei contato` e
 * `Perdido`. Estes testes são o argumento em forma executável.
 */
describe("a trilha de marcos", () => {
  it("tem sempre os mesmos quatro marcos, nesta ordem", () => {
    for (const l of LEADS) {
      expect(marcosDoLead(l).map((m) => m.id)).toEqual([
        "recebido",
        "contatado",
        "respondeu",
        "convertido",
      ]);
    }
  });

  /**
   * ⚠️ A propriedade que sustenta o desenho: **um marco cumprido implica todos os
   * anteriores cumpridos**. Se alguém acrescentar um marco que viole isto, a trilha
   * passa a poder acender fora de ordem e vira enfeite.
   */
  it("é monotônica: nenhum marco acende com um anterior apagado", () => {
    for (const l of LEADS) {
      const cumpridos = marcosDoLead(l).map((m) => m.cumprido);
      const primeiroApagado = cumpridos.indexOf(false);
      if (primeiroApagado === -1) continue;
      for (let i = primeiroApagado; i < cumpridos.length; i++) {
        expect(cumpridos[i], `${l.id} marco ${i}`).toBe(false);
      }
    }
  });

  it("'Recebido' está sempre cumprido — o lead existe", () => {
    for (const l of LEADS) expect(marcosDoLead(l)[0].cumprido).toBe(true);
  });

  it("'Contatado' segue o histórico, não o estado", () => {
    for (const l of LEADS) {
      expect(marcosDoLead(l)[1].cumprido, l.id).toBe(l.contatos.length > 0);
    }
  });

  it("'Respondeu' exige uma resposta de verdade no histórico", () => {
    for (const l of LEADS) {
      const temResposta = l.contatos.some((c) => c.resultado === "respondeu");
      expect(marcosDoLead(l)[2].cumprido, l.id).toBe(temResposta);
    }
  });

  it("marco cumprido sempre tem data; marco pendente nunca tem", () => {
    for (const l of LEADS) {
      for (const m of marcosDoLead(l)) {
        if (m.cumprido) expect(m.quando, `${l.id} ${m.id}`).toBeTruthy();
        else expect(m.quando, `${l.id} ${m.id}`).toBeNull();
      }
    }
  });

  it("quem responde de primeira acende dois marcos de uma vez", () => {
    const deUmaVez = LEADS.find(
      (l) => l.contatos.length === 1 && l.contatos[0].resultado === "respondeu",
    );
    expect(deUmaVez, "o mock precisa deste caso").toBeDefined();
    const m = marcosDoLead(deUmaVez!);
    expect(m[1].cumprido).toBe(true);
    expect(m[2].cumprido).toBe(true);
    expect(m[1].quando).toBe(m[2].quando);
  });
});

describe("interrupção da trilha", () => {
  it("perdido e expirado interrompem; os demais seguem andando", () => {
    for (const l of LEADS) {
      const motivo = interrupcaoDaTrilha(l);
      const deveriaParar = l.estado === "perdido" || expirado(l);
      expect(motivo !== null, l.id).toBe(deveriaParar);
    }
  });

  it("convertido NUNCA interrompe — ele completa", () => {
    for (const l of LEADS) {
      if (l.estado === "convertido") {
        expect(interrupcaoDaTrilha(l)).toBeNull();
        expect(marcosDoLead(l).every((m) => m.cumprido)).toBe(true);
      }
    }
  });

  it("o motivo da perda é o texto mostrado, quando existe", () => {
    const perdido = LEADS.find((l) => l.estado === "perdido")!;
    expect(interrupcaoDaTrilha(perdido)).toBe(perdido.motivoDaPerda);
  });
});
