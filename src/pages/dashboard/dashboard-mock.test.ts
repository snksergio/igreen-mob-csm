import { describe, expect, it } from "vitest";
import type { DateRange } from "@snksergio/design-system";
import { CARREGADORES } from "~/pages/carregadores/carregadores-mock";
import {
  DIAS_DA_SEMANA,
  JANELAS_DE_DISPONIBILIDADE,
  LOCAIS_DO_DASHBOARD,
  carregadoresPorCorrente,
  carregadoresPorStatus,
  diasNoPeriodo,
  disponibilidadeDaFrota,
  duracaoDhm,
  duracaoHm,
  horariosDePico,
  metricasDeOcupacao,
  rankingDeCarregadores,
  rankingDeLocais,
  rankingDeMotoristas,
  rankingDeOcupacao,
  receitaPorOrigem,
  receitaPorTipo,
  serieAnterior,
  serieDoPeriodo,
  totais,
  usoDeCupons,
  variacao,
} from "./dashboard-mock";

/** Recorte fixo de 16 dias — o mesmo tamanho do print da referência. */
const PERIODO: DateRange = {
  from: new Date(2026, 8, 1),
  to: new Date(2026, 8, 16),
};

const SERIE = serieDoPeriodo(PERIODO);

describe("série diária", () => {
  it("tem um ponto por dia do recorte, inclusive as duas pontas", () => {
    expect(diasNoPeriodo(PERIODO)).toBe(16);
    expect(SERIE).toHaveLength(16);
  });

  it("é determinística — duas chamadas dão o mesmo resultado", () => {
    expect(serieDoPeriodo(PERIODO)).toEqual(SERIE);
  });

  it("as datas são consecutivas e sem buraco", () => {
    for (let i = 1; i < SERIE.length; i++) {
      const a = new Date(SERIE[i - 1].data).getTime();
      const b = new Date(SERIE[i].data).getTime();
      expect(b - a).toBe(86_400_000);
    }
  });

  it("nenhum dia é negativo", () => {
    SERIE.forEach((d) => {
      expect(d.recargasApp).toBeGreaterThanOrEqual(0);
      expect(d.recargasRoaming).toBeGreaterThanOrEqual(0);
      expect(d.brutoApp).toBeGreaterThan(0);
      expect(d.energiaKwh).toBeGreaterThan(0);
    });
  });

  /* A regra do gerador: fim de semana rende menos. Sem isso o gráfico de barras vira uma
     cerca e "Horários de pico" por dia da semana não tem o que mostrar. */
  it("o fim de semana rende menos que a média dos dias úteis", () => {
    const dia = (d: (typeof SERIE)[number]) => new Date(d.data).getUTCDay();
    const fds = SERIE.filter((d) => dia(d) === 0 || dia(d) === 6);
    const uteis = SERIE.filter((d) => dia(d) !== 0 && dia(d) !== 6);
    const media = (xs: typeof SERIE) =>
      xs.reduce((a, d) => a + d.recargasApp, 0) / xs.length;
    expect(media(fds)).toBeLessThan(media(uteis));
  });

  it("nunca há mais recargas com cupom do que recargas", () => {
    SERIE.forEach((d) =>
      expect(d.comCupom).toBeLessThanOrEqual(d.recargasApp + d.recargasRoaming),
    );
  });

  it("sem período selecionado, cai no mês corrente em vez de quebrar", () => {
    const s = serieDoPeriodo(undefined);
    expect(s.length).toBeGreaterThanOrEqual(28);
    expect(s.length).toBeLessThanOrEqual(31);
  });
});

describe("período anterior", () => {
  it("tem o mesmo tamanho do recorte", () => {
    expect(serieAnterior(PERIODO)).toHaveLength(SERIE.length);
  });

  it("termina no dia imediatamente anterior ao início do recorte", () => {
    const anterior = serieAnterior(PERIODO);
    const ultimo = new Date(anterior[anterior.length - 1].data).getTime();
    const primeiro = new Date(SERIE[0].data).getTime();
    expect(primeiro - ultimo).toBe(86_400_000);
  });

  it("não se sobrepõe ao recorte", () => {
    const datas = new Set(SERIE.map((d) => d.data));
    serieAnterior(PERIODO).forEach((d) => expect(datas.has(d.data)).toBe(false));
  });
});

describe("totais", () => {
  const t = totais(SERIE);

  it("as médias são coerentes com os totais", () => {
    expect(t.kwhMedio).toBeCloseTo(t.energiaKwh / t.recargas, 6);
    expect(t.ticketMedio).toBeCloseTo(t.bruto / t.recargas, 6);
  });

  /* O bug que o fator de retorno evita: somar motoristas/dia dava ~700 num recorte de 16
     dias, e a tela dizia que a base cresce todo dia. */
  it("motoristas únicos é menor que a soma dos diários", () => {
    const somaDiaria = SERIE.reduce((a, d) => a + d.motoristas, 0);
    expect(t.motoristas).toBeLessThan(somaDiaria);
    expect(t.motoristas).toBeGreaterThan(0);
  });

  /* O defeito que o campo próprio evita: "tempo do período menos ocupado" dava 12h26min
     por sessão — media a frota parada de madrugada, que é a operação fechada e não
     ociosidade. */
  it("o ocioso médio por recarga fica na ordem de uma a três horas", () => {
    expect(t.ociosoMedio).toBeGreaterThan(30);
    expect(t.ociosoMedio).toBeLessThan(180);
  });

  it("recargas com cupom não passam do total de recargas", () => {
    expect(t.comCupom).toBeLessThanOrEqual(t.recargas);
  });

  it("período vazio não divide por zero", () => {
    const t0 = totais([]);
    expect(Number.isFinite(t0.kwhMedio)).toBe(true);
    expect(t0.kwhMedio).toBe(0);
  });
});

describe("variação", () => {
  it("devolve null sem base de comparação, em vez de Infinity", () => {
    expect(variacao(10, 0)).toBeNull();
  });

  it("calcula a diferença relativa", () => {
    expect(variacao(110, 100)).toBeCloseTo(10, 6);
    expect(variacao(90, 100)).toBeCloseTo(-10, 6);
  });
});

describe("frota", () => {
  it("os três status somam a frota inteira", () => {
    const soma = carregadoresPorStatus().reduce((a, f) => a + f.valor, 0);
    expect(soma).toBe(CARREGADORES.length);
  });

  it("nenhum status fica negativo", () => {
    carregadoresPorStatus().forEach((f) =>
      expect(f.valor).toBeGreaterThanOrEqual(0),
    );
  });

  it("as correntes somam a frota inteira", () => {
    const soma = carregadoresPorCorrente().reduce((a, f) => a + f.valor, 0);
    expect(soma).toBe(CARREGADORES.length);
  });
});

describe("monetização", () => {
  it("o uso de cupons fecha exatamente com o total do período", () => {
    const total = SERIE.reduce((a, d) => a + d.comCupom, 0);
    expect(usoDeCupons(SERIE).reduce((a, f) => a + f.valor, 0)).toBe(total);
  });

  it("a receita por tipo fecha com o bruto", () => {
    const bruto = SERIE.reduce((a, d) => a + d.brutoApp + d.brutoCpo, 0);
    const soma = receitaPorTipo(SERIE).reduce((a, f) => a + f.valor, 0);
    expect(soma).toBeCloseTo(bruto, 1);
  });

  it("a receita por origem fecha com o bruto", () => {
    const bruto = SERIE.reduce((a, d) => a + d.brutoApp + d.brutoCpo, 0);
    const soma = receitaPorOrigem(SERIE).reduce((a, f) => a + f.valor, 0);
    expect(soma).toBeCloseTo(bruto, 1);
  });
});

describe("horários de pico", () => {
  it("devolve as 24 horas, inclusive as zeradas", () => {
    DIAS_DA_SEMANA.forEach((d) => {
      const h = horariosDePico(SERIE, d);
      expect(h).toHaveLength(24);
      expect(h[0].hora).toBe("00");
      expect(h[23].hora).toBe("23");
    });
  });

  it("o pico de um dia útil é de manhã, não de madrugada", () => {
    const qua = horariosDePico(SERIE, "QUA");
    const pico = qua.reduce((a, b) => (b.recargas > a.recargas ? b : a));
    expect(Number(pico.hora)).toBeGreaterThanOrEqual(7);
    expect(Number(pico.hora)).toBeLessThanOrEqual(19);
  });
});

describe("rankings", () => {
  it("o de locais cobre todos e vem ordenado por receita", () => {
    const r = rankingDeLocais(SERIE);
    expect(r).toHaveLength(LOCAIS_DO_DASHBOARD.length);
    for (let i = 1; i < r.length; i++) {
      expect(r[i - 1].receita).toBeGreaterThanOrEqual(r[i].receita);
    }
  });

  it("o de carregadores cobre a frota e vem ordenado por receita", () => {
    const r = rankingDeCarregadores(SERIE);
    expect(r).toHaveLength(CARREGADORES.length);
    for (let i = 1; i < r.length; i++) {
      expect(r[i - 1].receita).toBeGreaterThanOrEqual(r[i].receita);
    }
  });

  it("o de ocupação vem ordenado por ocupação e nenhuma passa de 100%", () => {
    const r = rankingDeOcupacao(SERIE);
    for (let i = 1; i < r.length; i++) {
      expect(r[i - 1].ocupacao).toBeGreaterThanOrEqual(r[i].ocupacao);
    }
    r.forEach((l) => expect(l.ocupacao).toBeLessThanOrEqual(100));
  });

  /* ⚠️ Privacidade: a referência lista nome, e-mail e telefone reais. */
  it("os motoristas do ranking usam o cadastro fictício", () => {
    rankingDeMotoristas(SERIE).forEach((m) => {
      expect(m.email).toContain("@");
      expect(m.email.toLowerCase()).not.toContain("gmail");
      expect(m.email.toLowerCase()).not.toContain("outlook");
      expect(m.email.toLowerCase()).not.toContain("hotmail");
    });
  });

  it("o ranking muda quando o recorte muda", () => {
    const outro = serieDoPeriodo({
      from: new Date(2026, 7, 1),
      to: new Date(2026, 7, 16),
    });
    expect(rankingDeLocais(outro)[0].receita).not.toBe(
      rankingDeLocais(SERIE)[0].receita,
    );
  });
});

describe("ocupação e disponibilidade", () => {
  it("a ocupação média fica entre 0 e 100", () => {
    const m = metricasDeOcupacao(SERIE);
    expect(m.ocupacaoMedia).toBeGreaterThan(0);
    expect(m.ocupacaoMedia).toBeLessThan(100);
  });

  JANELAS_DE_DISPONIBILIDADE.forEach((j) => {
    it(`a janela ${j.id} dá ${j.blocos} blocos por carregador`, () => {
      disponibilidadeDaFrota(j.id).forEach((c) =>
        expect(c.blocos).toHaveLength(j.blocos),
      );
    });
  });

  it("a contagem de quedas bate com as transições no-ar → fora", () => {
    disponibilidadeDaFrota("24h").forEach((c) => {
      let esperado = 0;
      c.blocos.forEach((b, i) => {
        if (!b && (i === 0 || c.blocos[i - 1])) esperado++;
      });
      expect(c.quedas).toBe(esperado);
    });
  });

  /* A barra não pode contradizer a coluna de status da tela de Carregadores. */
  it("quem está Offline no cadastro aparece fora a janela inteira", () => {
    const offline = CARREGADORES.filter((c) => c.status === "Offline").map(
      (c) => c.id,
    );
    disponibilidadeDaFrota("24h")
      .filter((c) => offline.includes(c.id))
      .forEach((c) => {
        expect(c.disponibilidade).toBe(0);
        expect(c.offlineAgora).toBe(true);
      });
  });

  it("vem ordenada da pior disponibilidade para a melhor", () => {
    const d = disponibilidadeDaFrota("24h");
    for (let i = 1; i < d.length; i++) {
      expect(d[i - 1].disponibilidade).toBeLessThanOrEqual(
        d[i].disponibilidade,
      );
    }
  });
});

describe("formatação", () => {
  it("duracaoHm usa duas casas em cada campo", () => {
    expect(duracaoHm(51)).toBe("00h 51m");
    expect(duracaoHm(96)).toBe("01h 36m");
  });

  it("duracaoDhm separa dias", () => {
    expect(duracaoDhm(0)).toBe("0d 0h 0min");
    expect(duracaoDhm(1440)).toBe("1d 0h 0min");
    expect(duracaoDhm(122)).toBe("0d 2h 2min");
  });
});
