import { CARREGADORES } from "~/pages/carregadores/carregadores-mock";

/**
 * Mock da tela de Monitoramento — medida em `/pt/monitoring?page=1` (2026-09-16).
 *
 * ## A linha é o PLUGUE, não o carregador
 *
 * É o que a referência mostra sem dizer: `0106012543001010007` aparece em duas linhas
 * seguidas, com `99286-1` e `99286-2`. Um carregador Dual tem dois conectores, e cada um
 * pode estar num estado diferente — é justamente isso que a tela monitora. Por isso as
 * linhas saem de `CARREGADORES.flatMap(c => c.plugues)`, e não da lista de carregadores.
 *
 * Reaproveitar `CARREGADORES` não é economia: `local`, `identificador`, `cpcode` e
 * `potenciaKw` já vivem lá, e uma segunda cópia deles significaria um carregador com um ID
 * na tela de cadastro e outro na de monitoramento.
 *
 * ## Um vocabulário de status, não dois
 *
 * ⚠️ **Desvio consciente da referência.** Lá a tabela usa `DISPONÍVEL`/`DESCONECTADO`/`FALHA`
 * e a barra de plugues usa outros seis (`Disponível`, `Preparando`, `Carregando`,
 * `Finalizando`, `Offline`, `Indisponível`). São dois vocabulários pro mesmo campo na mesma
 * tela: o operador vê `FALHA` na linha e procura `Falha` na legenda, que não existe.
 *
 * Aqui é um só, de sete valores, e a barra e a tabela leem dele. `Desconectado` da
 * referência é o `offline` daqui — mesma coisa com dois nomes.
 *
 * ## `conectado` é campo separado de propósito
 *
 * Na referência a linha `FALHA` tem o ponto de conexão VERDE. Não é bug: o carregador está
 * falando com a plataforma (link OCPP de pé) e reportando que o conector falhou. Fundir os
 * dois campos perderia exatamente o caso que o operador precisa distinguir — "não responde"
 * pede visita técnica, "responde e acusa falha" pede reset remoto.
 */

export type StatusPlugue =
  | "disponivel"
  | "preparando"
  | "carregando"
  | "finalizando"
  | "falha"
  | "offline"
  | "indisponivel";

/** Ordem canônica — legenda, barra e opções de filtro leem daqui. */
export const STATUS_NA_ORDEM: StatusPlugue[] = [
  "disponivel",
  "preparando",
  "carregando",
  "finalizando",
  "falha",
  "offline",
  "indisponivel",
];

export const ROTULO_STATUS: Record<StatusPlugue, string> = {
  disponivel: "Disponível",
  preparando: "Preparando",
  carregando: "Carregando",
  finalizando: "Finalizando",
  falha: "Falha",
  offline: "Offline",
  indisponivel: "Indisponível",
};

/**
 * Cor de cada status, em CSS var de token.
 *
 * ⚠️ Valor inline e não classe utilitária porque o consumidor é o `style.background` de cada
 * tick da barra — é a mesma exceção que a receita `StatusBars` do `ChartShowcaseDoc` usa, e
 * a mesma que o `ChoroplethMap` documenta pra cor vinda de dado.
 *
 * A escolha da paleta segue a semântica da receita (operacional → degradado → queda →
 * inativo), não a ordem dos `chart-*`:
 *
 * | família | quem | por quê |
 * |---|---|---|
 * | frios (`chart-1/2/3/5`) | os quatro estados de operação normal | recarga acontecendo não é alerta |
 * | âmbar (`chart-4`) | `falha` | conectado, mas degradado — atenção, não emergência |
 * | vermelho (`fg-danger`) | `offline` | o equipamento sumiu; é o que interrompe serviço |
 * | `fg-subtle` | `indisponivel` | desligado de propósito — o "Maintenance" da receita |
 *
 * ⚠️ **`indisponivel` NÃO usa `bg-bg-muted`**, que é o que a receita do DS põe no
 * "Maintenance". Medido: no dark ele resolve pra `oklch(1 0 0 / 0.03)` — 3% de branco sobre
 * um card de `oklch(0.225 0 0)`. O traço fica invisível, e uma barra em que um estado some
 * não é uma barra incompleta: ela lê como um BURACO, e quem conta os traços conta errado.
 * `fg-subtle` é o cinza que o próprio tema usa pra texto de apoio — apagado de propósito,
 * mas visível.
 *
 * ⛔ Não pinte `falha` e `offline` do mesmo vermelho. Eles pedem ações diferentes (reset
 * remoto × visita técnica) e a barra existe pra separar isso a olho.
 */
export const COR_DO_STATUS: Record<StatusPlugue, string> = {
  disponivel: "var(--color-chart-1)",
  preparando: "var(--color-chart-2)",
  carregando: "var(--color-chart-3)",
  finalizando: "var(--color-chart-5)",
  falha: "var(--color-chart-4)",
  offline: "var(--color-fg-danger)",
  indisponivel: "var(--color-fg-subtle)",
};

/** Os status que pedem ação — o número do "exigem atenção" no cabeçalho da barra. */
export const STATUS_DE_ATENCAO: StatusPlugue[] = ["falha", "offline"];

/* ── Faixas de potência ──────────────────────────────────────────────────── */

export type FaixaDePotencia = "ate29" | "de30a70" | "acima70";

/**
 * As três faixas, com os MESMOS cortes da referência (até 29 · 30 a 70 · acima de 70).
 *
 * ## Cor, não tamanho
 *
 * ⚠️ A primeira versão diferenciava as faixas por **tamanho de pin** (20 / 26 / 32px), como
 * a legenda da referência sugere. O operador pediu pins iguais com cores diferentes
 * (2026-09-16), e é melhor assim por um motivo que não é preferência: tamanho e cor no
 * mesmo glifo dão duas variáveis pra ler de uma vez, e num pin de 20px a diferença de 6px
 * entre faixas vizinhas não se percebe sem duas delas lado a lado — o que num mapa quase
 * nunca acontece.
 *
 * ## Por que uma RAMPA da marca, e não três cores distintas
 *
 * Potência é grandeza **ordenada**, ao contrário de status, que é categoria. Rampa
 * monocromática é o que o `chart-patterns` do DS manda pra isso, e resolve de quebra a
 * colisão: os sete status já ocupam `chart-1..5` + `fg-danger` + `fg-subtle`, e três hues
 * novos disputariam leitura com eles.
 *
 * `color-mix` porque não existem três degraus tokenizados da marca — é a mesma exceção de
 * cor derivada de dado que o `ChoroplethMap` documenta.
 */
export const FAIXAS_DE_POTENCIA: {
  id: FaixaDePotencia;
  rotulo: string;
  cor: string;
}[] = [
  {
    id: "ate29",
    rotulo: "Até 29 kW",
    cor: "color-mix(in oklab, var(--color-fg-brand) 40%, transparent)",
  },
  {
    id: "de30a70",
    rotulo: "De 30 a 70 kW",
    cor: "color-mix(in oklab, var(--color-fg-brand) 70%, transparent)",
  },
  { id: "acima70", rotulo: "Superior a 70 kW", cor: "var(--color-fg-brand)" },
];

/** Em que faixa uma potência cai. Fonte única do filtro e da legenda. */
export function faixaDaPotencia(kw: number): FaixaDePotencia {
  return kw <= 29 ? "ate29" : kw <= 70 ? "de30a70" : "acima70";
}

export interface Plugue {
  /** `99286-1` — cpcode do carregador mais o número do conector. */
  id: string;
  empresa: string;
  local: string;
  /** Identificador longo do equipamento, o que a coluna `ID Carregador` mostra. */
  idCarregador: string;
  /** Placa/modelo do veículo plugado. `null` = a célula mostra `–`, como na origem. */
  veiculo: string | null;
  /** Link OCPP de pé. Ver o JSDoc: é campo SEPARADO do status. */
  conectado: boolean;
  status: StatusPlugue;
  /** ISO local — a origem mostra em duas linhas (`dd/MM/yyyy` e `HH:mm:ss`). */
  ultimoStatus: string;
  /** Percentual de tempo disponível no período. */
  disponibilidade: number;
  tipoDeConector: string;
  potenciaKw: number;
}

export interface LocalGeo {
  cidade: string;
  uf: string;
  lat: number;
  lng: number;
}

/**
 * Coordenada de cada local.
 *
 * São as cidades REAIS que os nomes dos locais citam — Arena 7 é em BH, Colombo Park é no
 * Paraná, Monte Verde é em Camanducaia. Coordenada inventada faria o pin cair no lugar
 * errado, e num mapa isso não é detalhe: é a única informação que o mapa dá.
 *
 * ⚠️ Onde o nome não identifica a cidade (`SEDE`, `Chofferando`, `PV MOB - Estacionamento`),
 * usei a região metropolitana de Belo Horizonte, que é onde a operação da referência se
 * concentra. Está declarado aqui pra não virar precisão falsa.
 */
export const GEO_DOS_LOCAIS: Record<string, LocalGeo> = {
  "IGREEN MOB - Arena 7 BH": { cidade: "Belo Horizonte", uf: "MG", lat: -19.865, lng: -43.96 },
  "IGREEN MOB - Duo FOOD": { cidade: "Nova Lima", uf: "MG", lat: -19.9857, lng: -43.8464 },
  "IGREEN MOB - Posto Via Dupla": { cidade: "Betim", uf: "MG", lat: -19.9678, lng: -44.1983 },
  "IGREEN MOB - Supermercado Pejoal Super Varejista": { cidade: "Pedro Leopoldo", uf: "MG", lat: -19.6178, lng: -44.0428 },
  "IGREEN MOB - Pousada Cipo Prata": { cidade: "Santana do Riacho", uf: "MG", lat: -19.1697, lng: -43.7128 },
  "IGREEN MOB - Pousada Flores da Mantiqueira": { cidade: "Camanducaia", uf: "MG", lat: -22.755, lng: -46.145 },
  "IGREEN MOB - Padaria Cipó - Padaria na Serra do Cipó": { cidade: "Santana do Riacho", uf: "MG", lat: -19.175, lng: -43.705 },
  "IGREEN MOB - SEDE": { cidade: "Belo Horizonte", uf: "MG", lat: -19.932, lng: -43.938 },
  "IGREEN MOB - MAPLE Monte Verde": { cidade: "Camanducaia", uf: "MG", lat: -22.76, lng: -46.14 },
  "IGREEN MOB - Assis Plaza Shopping Assis": { cidade: "Assis", uf: "SP", lat: -22.6617, lng: -50.4119 },
  "IGREEN MOB - Boulevard Shopping Bauru": { cidade: "Bauru", uf: "SP", lat: -22.3147, lng: -49.0606 },
  "IGREEN MOB - Chofferando": { cidade: "Contagem", uf: "MG", lat: -19.9317, lng: -44.0536 },
  "IGREEN MOB - Colombo Park Shopping Colombo": { cidade: "Colombo", uf: "PR", lat: -25.2917, lng: -49.2242 },
  "IGREEN MOB - Hotel Panorama Ipatinga": { cidade: "Ipatinga", uf: "MG", lat: -19.4683, lng: -42.5369 },
  "IGREEN MOB - Rua Santa Juliana - Sete Lagoas": { cidade: "Sete Lagoas", uf: "MG", lat: -19.4658, lng: -44.2469 },
  "PV MOB - Estacionamento": { cidade: "Belo Horizonte", uf: "MG", lat: -19.92, lng: -43.94 },
  "PV MOB - IATE TENIS CLUBE": { cidade: "Belo Horizonte", uf: "MG", lat: -19.86, lng: -43.99 },
};

/** PRNG determinístico — mesma semente, mesmo plugue. Nada aqui muda entre renders. */
function prng(semente: number) {
  let s = semente;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/**
 * Disponibilidade MEDIDA, por plugue, na primeira página da referência.
 *
 * Só estas dez existem na origem; o resto deriva. A linha de 66,0% é a do plugue
 * desconectado — a queda derruba a média, e é o que faz o número valer a coluna.
 */
const DISPONIBILIDADE_MEDIDA: Record<string, number> = {
  "73116-1": 94.6,
  "73116-2": 94.6,
  "46868-1": 91.8,
  "34933-1": 84.4,
  "97496-1": 95.7,
  "17421-1": 99.5,
};

/**
 * Status por plugue.
 *
 * ⚠️ **O estado de operação é semeado, e isso é decisão.** Na referência, `Preparando`,
 * `Carregando` e `Finalizando` marcavam `0` no instante da captura — plausível num sábado à
 * noite, e péssimo como mock: quatro dos sete status nunca renderizariam, e a barra, a
 * legenda e o filtro nasceriam sem nunca terem sido exercitados. Os quatro `offline` e o
 * único `indisponivel` NÃO são semeados: vêm de `status`/`ativo` do cadastro, então a tela
 * de Carregadores e esta concordam sobre qual equipamento caiu.
 */
const STATUS_SEMEADO: Record<string, StatusPlugue> = {
  "73116-1": "carregando",
  "73116-2": "preparando",
  "46868-1": "carregando",
  "34933-1": "falha",
  "89742-1": "finalizando",
};

function construirPlugues(): Plugue[] {
  const agora = new Date("2026-09-16T18:43:00");

  return CARREGADORES.flatMap((c, iC) =>
    c.plugues.map((p, iP): Plugue => {
      const rnd = prng(7000 + iC * 131 + iP * 17);

      /* A ordem importa: cadastro manda, semente só preenche o resto. Um carregador
         `Offline` no cadastro não pode aparecer `Carregando` aqui. */
      const status: StatusPlugue = !c.ativo
        ? "indisponivel"
        : c.status === "Offline"
          ? "offline"
          : (STATUS_SEMEADO[p.id] ?? "disponivel");

      /* `falha` é o caso em que o link está de pé e o conector não — ver o JSDoc do topo. */
      const conectado = status !== "offline" && status !== "indisponivel";

      const disponibilidade =
        DISPONIBILIDADE_MEDIDA[p.id] ??
        (status === "offline"
          ? Math.round((60 + rnd() * 15) * 10) / 10
          : status === "falha"
            ? Math.round((80 + rnd() * 8) * 10) / 10
            : Math.round((90 + rnd() * 9.8) * 10) / 10);

      /* Quem está offline parou de reportar — o carimbo é velho, e é o que faz a coluna
         `Último status` valer alguma coisa. Quem está de pé reportou há minutos.
       *
       * ⚠️ **Granularidade em SEGUNDOS, não minutos.** A referência mostra `18:43:07`,
       * `18:43:16`, `18:43:20`, `18:43:02` — mesmo minuto, segundos diferentes, porque cada
       * equipamento reporta no próprio ritmo. Com atraso em minutos inteiros o mock só
       * tinha 12 carimbos possíveis e as linhas colidiam: a tabela ficava com meia dúzia de
       * horários repetidos, e ordenar por `Último status` não ordenava nada. */
      const atrasoSeg = conectado
        ? Math.floor(rnd() * 900)
        : 3600 * (8 + Math.floor(rnd() * 40));

      return {
        id: p.id,
        empresa: c.empresa,
        local: c.local,
        idCarregador: c.identificador,
        veiculo: null,
        conectado,
        status,
        ultimoStatus: new Date(agora.getTime() - atrasoSeg * 1_000).toISOString(),
        disponibilidade,
        tipoDeConector: p.tipo,
        potenciaKw: c.potenciaKw,
      };
    }),
  );
}

export const PLUGUES: Plugue[] = construirPlugues();

/** Contagem por status, na ordem canônica. Fonte única da barra, da legenda e dos chips. */
export function resumoDosPlugues(linhas: Plugue[] = PLUGUES) {
  const porStatus = Object.fromEntries(
    STATUS_NA_ORDEM.map((s) => [s, linhas.filter((l) => l.status === s).length]),
  ) as Record<StatusPlugue, number>;

  return {
    porStatus,
    total: linhas.length,
    atencao: STATUS_DE_ATENCAO.reduce((a, s) => a + porStatus[s], 0),
  };
}

/** Um local no mapa — agrega os plugues que moram nele. */
export interface LocalNoMapa extends LocalGeo {
  local: string;
  plugues: number;
  /** O status mais grave do local: é ele que colore o pin. */
  pior: StatusPlugue;
  potenciaKw: number;
}

/**
 * Gravidade crescente — o pin do local assume o PIOR status que existe nele.
 *
 * Um local com nove plugues disponíveis e um offline pintado de verde esconderia a única
 * coisa que o mapa deveria gritar. A média também esconderia; o máximo é o certo aqui.
 */
const GRAVIDADE: Record<StatusPlugue, number> = {
  disponivel: 0,
  preparando: 1,
  carregando: 2,
  finalizando: 3,
  indisponivel: 4,
  falha: 5,
  offline: 6,
};

export function locaisNoMapa(linhas: Plugue[] = PLUGUES): LocalNoMapa[] {
  const porLocal = new Map<string, Plugue[]>();
  for (const p of linhas) {
    const lista = porLocal.get(p.local);
    if (lista) lista.push(p);
    else porLocal.set(p.local, [p]);
  }

  return [...porLocal.entries()]
    .map(([local, lista]): LocalNoMapa | null => {
      const geo = GEO_DOS_LOCAIS[local];
      /* Local sem coordenada some do mapa em vez de cair em (0,0) — no Atlântico, na
         altura da África, que é exatamente o defeito visível no mapa da referência. */
      if (!geo) return null;
      const pior = lista.reduce(
        (a, p) => (GRAVIDADE[p.status] > GRAVIDADE[a] ? p.status : a),
        "disponivel" as StatusPlugue,
      );
      return {
        ...geo,
        local,
        plugues: lista.length,
        pior,
        potenciaKw: Math.max(...lista.map((p) => p.potenciaKw)),
      };
    })
    .filter((l): l is LocalNoMapa => l !== null);
}

/**
 * Histórico de status de um plugue — a tabela rolável do painel.
 *
 * A referência mostra pares `DESCONECTADO` → `DISPONÍVEL` → `CONECTADO` com segundos de
 * diferença: é uma reconexão, e ela sempre vem em três eventos. Reproduzir o trio é o que
 * faz o log parecer log; eventos soltos e aleatórios pareceriam ruído.
 */
export interface RegistroDeStatus {
  id: string;
  dataHora: string;
  rotulo: string;
  tom: "ok" | "ruim";
}

export function historicoDoPlugue(plugue: Plugue): RegistroDeStatus[] {
  const rnd = prng(plugue.id.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0));
  const base = new Date(plugue.ultimoStatus).getTime();
  const linhas: RegistroDeStatus[] = [];

  for (let q = 0; q < 3; q++) {
    const inicio = base - q * (6 + Math.floor(rnd() * 20)) * 3_600_000;
    /* Ordem decrescente na tela, então o evento mais novo do trio entra primeiro. */
    linhas.push(
      { id: `${plugue.id}-${q}-c`, dataHora: new Date(inicio).toISOString(), rotulo: "Conectado", tom: "ok" },
      { id: `${plugue.id}-${q}-d`, dataHora: new Date(inicio - 7_000).toISOString(), rotulo: "Disponível", tom: "ok" },
      { id: `${plugue.id}-${q}-x`, dataHora: new Date(inicio - 25_000 - Math.floor(rnd() * 200_000)).toISOString(), rotulo: "Desconectado", tom: "ruim" },
    );
  }

  return linhas;
}

export const MONITORAMENTO_TEXTOS = {
  aviso:
    "Dados correspondentes aos locais selecionados no topo. Para alterar, use o seletor no topo da página.",
  filtroDosLocais: "Filtro dos locais",
  buscarLocal: "Buscar por nome do local",
  tituloDaBarra: "Plugues por status",
  ajudaDaBarra:
    "Um traço por plugue conectado à plataforma. A cor é o estado atual de cada um.",
  legendaDoMapa: "Legenda",
  mapaPendente: "Imagem do mapa não encontrada",
  mapaPendenteAjuda:
    "Salve o arquivo em public/mapa-monitoramento.png. A área já está no tamanho final e os pins aparecem sobre a imagem assim que ela existir.",
} as const;
