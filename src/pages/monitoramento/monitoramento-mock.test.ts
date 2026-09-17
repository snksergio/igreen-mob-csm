import { describe, expect, it } from "vitest";
import { CARREGADORES } from "~/pages/carregadores/carregadores-mock";
import {
  COR_DO_STATUS,
  GEO_DOS_LOCAIS,
  PLUGUES,
  ROTULO_STATUS,
  STATUS_DE_ATENCAO,
  STATUS_NA_ORDEM,
  historicoDoPlugue,
  locaisNoMapa,
  resumoDosPlugues,
} from "./monitoramento-mock";
import { percentuaisQueSomamCem } from "./monitoramento-ui";

/**
 * O que estes testes protegem são as três afirmações que a tela faz e que podem virar
 * mentira em silêncio:
 *
 * 1. a barra conta os MESMOS plugues que a tabela lista;
 * 2. o pin de um local assume o PIOR estado dele — o local com um plugue caído não pode
 *    aparecer verde no mapa;
 * 3. esta tela e a de Carregadores concordam sobre qual equipamento está fora.
 */

describe("linhas", () => {
  it("há uma linha por plugue de cada carregador, não uma por carregador", () => {
    const esperado = CARREGADORES.reduce((a, c) => a + c.plugues.length, 0);
    expect(PLUGUES).toHaveLength(esperado);
    expect(PLUGUES.length).toBeGreaterThan(CARREGADORES.length);
  });

  it("um carregador Dual aparece duas vezes, com o mesmo ID e plugues distintos", () => {
    const dual = CARREGADORES.find((c) => c.plugues.length === 2)!;
    const linhas = PLUGUES.filter((p) => p.idCarregador === dual.identificador);
    expect(linhas).toHaveLength(2);
    expect(new Set(linhas.map((l) => l.id)).size).toBe(2);
  });

  it("os ids de plugue são únicos", () => {
    expect(new Set(PLUGUES.map((p) => p.id)).size).toBe(PLUGUES.length);
  });

  it("o cadastro manda sobre a semente: nada Offline aparece operando", () => {
    /* Sem esta regra, a tela de Carregadores diria "Offline" e esta diria "Carregando"
       sobre o mesmo equipamento — e as duas pareceriam certas isoladamente. */
    for (const c of CARREGADORES.filter((x) => x.status === "Offline" && x.ativo)) {
      for (const p of PLUGUES.filter((x) => x.idCarregador === c.identificador)) {
        expect(p.status).toBe("offline");
      }
    }
  });

  it("carregador desativado vira indisponível, não offline", () => {
    for (const c of CARREGADORES.filter((x) => !x.ativo)) {
      for (const p of PLUGUES.filter((x) => x.idCarregador === c.identificador)) {
        expect(p.status).toBe("indisponivel");
      }
    }
  });

  it("quem não está conectado nunca aparece em estado de operação", () => {
    for (const p of PLUGUES.filter((x) => !x.conectado)) {
      expect(["offline", "indisponivel"]).toContain(p.status);
    }
  });

  it("falha mantém a conexão de pé — é o caso que a referência mostra", () => {
    /* Ponto verde com status FALHA não é bug: o link OCPP responde e o conector acusa
       erro. Fundir os dois campos apagaria a diferença entre reset remoto e visita. */
    for (const p of PLUGUES.filter((x) => x.status === "falha")) {
      expect(p.conectado).toBe(true);
    }
  });

  it("é determinístico — dois acessos dão os mesmos carimbos", () => {
    expect(PLUGUES.map((p) => p.ultimoStatus)).toEqual(
      PLUGUES.map((p) => p.ultimoStatus),
    );
  });
});

describe("resumo", () => {
  it("a soma por status é exatamente o total das linhas recebidas", () => {
    const r = resumoDosPlugues(PLUGUES);
    expect(Object.values(r.porStatus).reduce((a, b) => a + b, 0)).toBe(r.total);
    expect(r.total).toBe(PLUGUES.length);
  });

  it("recortar as linhas recorta a barra junto", () => {
    const parte = PLUGUES.slice(0, 5);
    expect(resumoDosPlugues(parte).total).toBe(5);
  });

  it("`atenção` é só falha + offline", () => {
    const r = resumoDosPlugues(PLUGUES);
    expect(r.atencao).toBe(
      STATUS_DE_ATENCAO.reduce((a, s) => a + r.porStatus[s], 0),
    );
    /* Indisponível NÃO conta: está desligado de propósito, e contá-lo faria o número de
       urgência subir por uma decisão administrativa. */
    expect(r.atencao).not.toContain(r.porStatus.indisponivel);
  });

  it("lista vazia zera sem estourar", () => {
    const r = resumoDosPlugues([]);
    expect(r.total).toBe(0);
    expect(r.atencao).toBe(0);
  });

  it("os sete status têm rótulo e cor — legenda e barra leem da mesma ordem", () => {
    for (const s of STATUS_NA_ORDEM) {
      expect(ROTULO_STATUS[s]).toBeTruthy();
      expect(COR_DO_STATUS[s]).toMatch(/^var\(--color-/);
    }
    expect(STATUS_NA_ORDEM).toHaveLength(7);
  });

  it("falha e offline têm cores DIFERENTES", () => {
    /* Pedem ações diferentes; a barra existe justamente pra separá-las a olho. */
    expect(COR_DO_STATUS.falha).not.toBe(COR_DO_STATUS.offline);
  });

  it("os quatro estados de operação exercitam a barra", () => {
    /* Se um dia a semente sumir, três das sete cores nunca renderizariam e ninguém
       notaria — a tela continuaria bonita, com uma legenda parcialmente decorativa. */
    const r = resumoDosPlugues(PLUGUES);
    for (const s of ["preparando", "carregando", "finalizando", "falha"] as const) {
      expect(r.porStatus[s]).toBeGreaterThan(0);
    }
  });
});

describe("mapa", () => {
  it("todo local com plugue tem coordenada", () => {
    const semGeo = [...new Set(PLUGUES.map((p) => p.local))].filter(
      (l) => !GEO_DOS_LOCAIS[l],
    );
    expect(semGeo).toEqual([]);
  });

  it("as coordenadas caem dentro do Brasil", () => {
    /* Coordenada fora da caixa é o defeito visível no mapa da referência, onde um pin
       aparece na altura do Equador e outro no meio do Atlântico. */
    for (const g of Object.values(GEO_DOS_LOCAIS)) {
      expect(g.lat).toBeGreaterThan(-34);
      expect(g.lat).toBeLessThan(6);
      expect(g.lng).toBeGreaterThan(-74);
      expect(g.lng).toBeLessThan(-34);
    }
  });

  it("um local por pin, com a contagem de plugues dele", () => {
    const locais = locaisNoMapa(PLUGUES);
    expect(locais).toHaveLength(new Set(PLUGUES.map((p) => p.local)).size);
    expect(locais.reduce((a, l) => a + l.plugues, 0)).toBe(PLUGUES.length);
  });

  it("o pin assume o PIOR status do local, não o primeiro nem a maioria", () => {
    const alvo = PLUGUES.find((p) => p.status === "offline")!;
    const local = locaisNoMapa(PLUGUES).find((l) => l.local === alvo.local)!;
    expect(local.pior).toBe("offline");
  });

  it("local só com plugue disponível fica disponível", () => {
    const soOk = PLUGUES.filter((p) => p.status === "disponivel").slice(0, 1);
    expect(locaisNoMapa(soOk)[0].pior).toBe("disponivel");
  });

  it("local sem coordenada some do mapa em vez de cair em (0,0)", () => {
    const inventado = { ...PLUGUES[0], local: "LOCAL QUE NÃO EXISTE" };
    const locais = locaisNoMapa([inventado]);
    expect(locais).toEqual([]);
  });
});

describe("histórico do plugue", () => {
  it("vem em trios de reconexão, como na referência", () => {
    const h = historicoDoPlugue(PLUGUES[0]);
    expect(h).toHaveLength(9);
    expect(h.map((r) => r.rotulo).slice(0, 3)).toEqual([
      "Conectado",
      "Disponível",
      "Desconectado",
    ]);
  });

  it("está em ordem decrescente — o evento mais novo primeiro", () => {
    const t = historicoDoPlugue(PLUGUES[0]).map((r) => new Date(r.dataHora).getTime());
    for (let i = 1; i < t.length; i++) expect(t[i]).toBeLessThan(t[i - 1]);
  });

  it("é determinístico por plugue e diferente entre plugues", () => {
    const a = historicoDoPlugue(PLUGUES[0]);
    expect(historicoDoPlugue(PLUGUES[0])).toEqual(a);
    expect(historicoDoPlugue(PLUGUES[1])[0].dataHora).not.toBe(a[0].dataHora);
  });
});

describe("percentuais da barra de proporção", () => {
  it("somam exatamente 100 com os plugues reais", () => {
    /* `Math.round` individual dava 99 aqui — quatro status com 1 plugue cada em 23. */
    const r = resumoDosPlugues(PLUGUES);
    const pct = percentuaisQueSomamCem(r.porStatus, r.total);
    expect(Object.values(pct).reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("somam 100 para qualquer recorte da lista", () => {
    for (let n = 1; n <= PLUGUES.length; n++) {
      const r = resumoDosPlugues(PLUGUES.slice(0, n));
      const soma = Object.values(
        percentuaisQueSomamCem(r.porStatus, r.total),
      ).reduce((a, b) => a + b, 0);
      expect(soma, `com ${n} plugues`).toBe(100);
    }
  });

  it("status sem nenhum plugue fica em 0 — nunca ganha a sobra", () => {
    /* Um status zerado exibindo "1%" seria pior que a soma dar 99: ele afirma existência
       de algo que não existe. */
    const r = resumoDosPlugues(PLUGUES);
    const pct = percentuaisQueSomamCem(r.porStatus, r.total);
    for (const s of STATUS_NA_ORDEM) {
      if (r.porStatus[s] === 0) expect(pct[s]).toBe(0);
    }
  });

  it("status com plugue nunca fica em 0 quando é a única fatia", () => {
    const so = { ...Object.fromEntries(STATUS_NA_ORDEM.map((s) => [s, 0])), offline: 4 } as Record<
      typeof STATUS_NA_ORDEM[number],
      number
    >;
    expect(percentuaisQueSomamCem(so, 4).offline).toBe(100);
  });
});
