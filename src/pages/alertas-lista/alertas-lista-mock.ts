import { PLUGUES } from "~/pages/monitoramento/monitoramento-mock";
import { TIPOS_DE_ALERTA, type TipoDeAlerta } from "~/pages/alertas/alertas-mock";

/**
 * Mock da tela de Alertas — medida em `/pt/alerts` (2026-09-16).
 *
 * ## Esta é a lista AO VIVO; a outra tela é a REGRA
 *
 * `~/pages/alertas` é "Configuração de grupos de alertas": quem escuta o quê. Aqui são as
 * **ocorrências** — o alerta que de fato disparou, com início, fim e duração. Os dois têm
 * "alerta" no nome e não são a mesma coisa, e é por isso que os tipos vêm de lá em vez de
 * serem redigitados: se um grupo escuta `Offline`, é este arquivo que tem de conseguir
 * produzir uma linha `Offline`. Duas listas de tipo divergiriam no primeiro tipo novo.
 *
 * ## As dez colunas da referência não cabem em 1100px
 *
 * Ela tem `Empresa · Local · Nome do carregador · ID do carregador · Plugue · Alerta ·
 * Data do alerta · Término · Duração · Status`, e resolve o excesso com scroll horizontal.
 * Ver o JSDoc de `AlertasListaPage` pro que foi fundido e pro que foi pro painel.
 *
 * ## Por que os dados são derivados de `PLUGUES`
 *
 * Um alerta é um evento DE UM PLUGUE. Inventar uma lista paralela de carregadores faria a
 * tela de Alertas citar equipamento que Monitoramento não conhece — o defeito clássico de
 * mock por tela, que só aparece quando alguém clica no ID e não acha nada.
 */

/** Estado da ocorrência. `ativo` = ainda não normalizou. */
export type SituacaoDoAlerta = "ativo" | "resolvido";

export const ROTULO_DA_SITUACAO: Record<SituacaoDoAlerta, string> = {
  ativo: "Ativo",
  resolvido: "Resolvido",
};

export interface Alerta {
  id: string;
  empresa: string;
  local: string;
  /** Nome comercial do equipamento — `AC 7,4 KW Vaga 1`. */
  carregador: string;
  /** Identificador longo, o `ID do carregador` da referência. */
  idCarregador: string;
  /** `36194-0` — o conector. */
  plugue: string;
  tipo: TipoDeAlerta;
  /** ISO local com segundos. A referência mostra `dd/MM/yyyy às HH:mm:ss`. */
  inicio: string;
  /** `null` enquanto `situacao === "ativo"` — é o que a origem mostra como `–`. */
  fim: string | null;
  situacao: SituacaoDoAlerta;
}

/**
 * Quais tipos a lista ao vivo consegue produzir.
 *
 * ⚠️ É um SUBCONJUNTO de `TIPOS_DE_ALERTA`, e de propósito: `Alerta desconhecido` existe
 * como regra que se pode ligar, mas uma ocorrência com esse rótulo não ajudaria ninguém a
 * agir. Os cinco abaixo são os que a referência de fato mostra na coluna `Alerta`.
 */
export const TIPOS_OBSERVADOS: TipoDeAlerta[] = [
  "Offline",
  "Conector preparando",
  "Com falha",
  "Conector indisponível",
  "Intermitente",
];

/**
 * Cor de cada tipo — a mesma escolha da referência, traduzida pros tokens.
 *
 * Ela pinta `Offline` de vermelho e `Preparando` de azul-claro; o resto não apareceu no
 * print. O critério aqui é **o que exige ação**: indisponibilidade é `danger`, transição é
 * `info`, degradação é `warning`. Cor por gravidade, não por tipo, é o que deixa varrer a
 * coluna sem ler.
 */
export const COR_DO_TIPO: Record<
  string,
  "danger" | "warning" | "info" | "neutral"
> = {
  Offline: "danger",
  "Com falha": "danger",
  "Conector indisponível": "danger",
  Intermitente: "warning",
  "Conector preparando": "info",
};

/** PRNG determinístico — mesma semente, mesmo alerta entre renders. */
function prng(semente: number) {
  let s = semente;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** Momento de referência do mock. Fixo pra a tela não mudar entre execuções. */
export const AGORA = new Date("2026-09-16T21:00:00");

function iso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(
    d.getHours(),
  )}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function construirAlertas(): Alerta[] {
  const rnd = prng(20260916);
  const alertas: Alerta[] = [];

  /**
   * 67 ocorrências — a referência mostrava "1 de 67" no rodapé, e o número importa: com
   * 10 a paginação nunca é exercitada e a coluna de data nunca mostra dois dias.
   *
   * ⚠️ As **6 primeiras são forçadas pra janela recente**, e isso não é conveniência.
   * A regra do mock é que só alerta recente pode estar ativo (ver abaixo), e espalhar 67
   * ocorrências por 15 dias dá ~1% de chance de cair nas últimas 4 horas: a primeira
   * versão sorteou **zero ativos**, e a tela inteira — chip vermelho do header, cor da
   * duração, visão "Ativos", o "Ainda em curso" do painel — nunca renderizava. Estado
   * que a tela mostra é estado que o mock garante, não que ele torce pra sair.
   */
  const RECENTES = 6;

  for (let i = 0; i < 67; i++) {
    const p = PLUGUES[Math.floor(rnd() * PLUGUES.length)];
    const tipo = TIPOS_OBSERVADOS[Math.floor(rnd() * TIPOS_OBSERVADOS.length)];

    /* As primeiras caem nas últimas ~4h; o resto espalha por ~15 dias pra trás, em
       MINUTOS — o suficiente pra ordenação por data ter o que ordenar e pro recorte de
       período fazer sentido. */
    const minutosAtras =
      i < RECENTES
        ? 5 + Math.floor(rnd() * 230)
        : Math.floor(rnd() * 15 * 24 * 60);
    const inicio = new Date(AGORA.getTime() - minutosAtras * 60_000);
    /* Segundos determinísticos e distintos: com segundos sempre em :00, duas ocorrências
       do mesmo minuto ficam com carimbo idêntico e parecem duplicata. */
    inicio.setSeconds(Math.floor(rnd() * 60));

    /* Só os mais recentes podem estar ativos. Um alerta "ativo" de 12 dias seria ou um
       bug do mock ou uma operação abandonada — nos dois casos, ruído na leitura.

       Dentro da janela recente, alterna em vez de sortear: garante que os DOIS estados
       apareçam, em vez de depender de o dado cair dos dois lados. */
    const naJanela = minutosAtras < 240;
    const situacao: SituacaoDoAlerta =
      naJanela && i % 2 === 0 ? "ativo" : "resolvido";

    /* Teto pela distância até agora: sem isso, um resolvido que começou há 5 min podia
       ganhar 180 min de duração e terminar no futuro. */
    const duracaoMin = 1 + Math.floor(rnd() * Math.min(180, minutosAtras || 1));
    const fim =
      situacao === "resolvido"
        ? new Date(inicio.getTime() + duracaoMin * 60_000)
        : null;

    alertas.push({
      id: `al-${i + 1}`,
      empresa: p.empresa,
      local: p.local,
      carregador: `${p.potenciaKw >= 30 ? "DC" : "AC"} ${p.potenciaKw
        .toString()
        .replace(".", ",")} kW`,
      idCarregador: p.idCarregador,
      plugue: p.id,
      tipo,
      inicio: iso(inicio),
      fim: fim ? iso(fim) : null,
      situacao,
    });
  }

  /* Mais recente primeiro — é a ordem em que a referência abre, e é a única defensável:
     numa lista de ocorrências, o que acabou de acontecer é o que se procura. */
  return alertas.sort((a, b) => b.inicio.localeCompare(a.inicio));
}

export const ALERTAS: Alerta[] = construirAlertas();

/* ────────────────────────────────────────────────────────────────────────────
   Derivações
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Duração em minutos. Alerta ativo conta até `AGORA` — é o que a referência indica com o
 * sufixo `+` ("2h 29min +").
 */
export function duracaoEmMinutos(a: Alerta): number {
  const ini = new Date(a.inicio).getTime();
  const fim = a.fim ? new Date(a.fim).getTime() : AGORA.getTime();
  return Math.max(1, Math.round((fim - ini) / 60_000));
}

/** `149` → `2h 29min`. Sem `Intl.RelativeTimeFormat`: aqui é duração, não distância. */
export function duracaoLegivel(a: Alerta): string {
  const m = duracaoEmMinutos(a);
  const h = Math.floor(m / 60);
  const texto = h > 0 ? `${h}h ${m % 60}min` : `${m}min`;
  /* O `+` é do original e carrega informação: diz que o número ainda cresce. */
  return a.situacao === "ativo" ? `${texto} +` : texto;
}

/** `2026-09-16T20:25:50` → `{ data: "16/09/2026", hora: "20:25:50" }`. */
export function carimbo(isoLocal: string): { data: string; hora: string } {
  const [d, h] = isoLocal.split("T");
  const [ano, mes, dia] = d.split("-");
  return { data: `${dia}/${mes}/${ano}`, hora: h };
}

export function alertasAtivos(lista: Alerta[] = ALERTAS): number {
  return lista.filter((a) => a.situacao === "ativo").length;
}

/** Ocorrências por tipo, na ordem de `TIPOS_OBSERVADOS`. Alimenta o resumo do topo. */
export function contagemPorTipo(
  lista: Alerta[] = ALERTAS,
): { tipo: TipoDeAlerta; total: number }[] {
  return TIPOS_OBSERVADOS.map((tipo) => ({
    tipo,
    total: lista.filter((a) => a.tipo === tipo).length,
  }));
}

export const ALERTAS_LISTA_TEXTOS = {
  aviso:
    "Toda ocorrência registrada nos locais selecionados. O que dispara cada uma é definido em Configurar alertas.",
  vazio: "Nenhum alerta no período.",
  detalhe: "Detalhes do alerta",
} as const;

/** Reexporta pra a página não precisar importar de dois lugares. */
export { TIPOS_DE_ALERTA };
export type { TipoDeAlerta };
