/**
 * Mock da tela de Gestão de Carga — medida em `/pt/smartspott?page=1` (2026-09-16).
 *
 * ## O que é medido
 *
 * **A lista:** as quatro colunas (`Empresa · Local · Potência em uso · Ações`), os 10 nomes
 * de local da primeira página, o valor `0,0 kW` em todas as linhas e a paginação de 4
 * páginas (≈38 locais).
 *
 * **O painel de detalhe**, inteiro: o texto de advertência literal, os quatro parâmetros de
 * entrada (`40A · 220V · 40A · 40A`), o estado do medidor, o vazio de grupos de carga
 * (`Nenhum subgrupo adicionado`) e a lista de carregadores com corrente, potência e status
 * (`125020001153 · 0,0 A · 0,0 kW · Disponível`).
 *
 * ## O que é derivado
 *
 * Os parâmetros e os carregadores dos OUTROS locais — a referência só expõe um por vez, e
 * medi o de `Arena 7 BH`. A derivação é por semente do id, e o de Arena 7 BH reproduz os
 * valores medidos (é o que o teste cobra).
 *
 * ## `0,0 kW` na referência, e o que esta tela mostra
 *
 * A referência marcava `0,0 kW` em TODAS as linhas — a rede estava inteira ociosa na hora da
 * captura. `Arena 7 BH` reproduz isso à risca, porque é o único local cujo painel eu vi: os
 * três carregadores dele estão parados e a soma dá zero.
 *
 * Os outros quinze **derivam atividade**. Não é enfeite: uma tela de 16 linhas todas em
 * `0,0 kW` não exercita nada do que ela existe pra fazer — nem a ordenação da coluna, nem o
 * verde da potência em uso, nem o vocabulário de status do painel. Uma captura de rede ociosa
 * é um INSTANTE, não uma propriedade do sistema, e mockar o instante esconderia justamente os
 * estados que o operador abre esta tela pra ver.
 */

/** Status de carregador — vocabulário literal do i18n da origem (`ChargerStatus`). */
export type StatusCarregador =
  | "disponivel"
  | "carregando"
  | "preparando"
  | "aguardando"
  | "finalizando"
  | "indisponivel"
  | "falha";

/** Carregador dentro do painel de um local. */
export interface CarregadorDeCarga {
  id: string;
  /** Identificador como aparece na origem: `125020001153`. */
  codigo: string;
  correnteA: number;
  potenciaKw: number;
  status: StatusCarregador;
}

/**
 * Parâmetros do nível de entrada.
 *
 * São os quatro campos que a advertência da referência protege — os valores da rede
 * elétrica do local. Medidos em `Arena 7 BH`.
 */
export interface NivelDeEntrada {
  correnteMaximaA: number;
  tensaoV: number;
  limiteFixoA: number;
  reservaDinamicaA: number;
  /** `Medidor ativado` / `Medidor desativado` — os dois rótulos do i18n da origem. */
  medidorAtivo: boolean;
}

/**
 * Local da lista.
 *
 * ⚠️ **Não tem campo de potência.** Potência em uso é DERIVADA dos carregadores
 * (`potenciaEmUso()`) — guardá-la aqui criaria duas fontes pro mesmo número, e a que a
 * ordenação lê não seria necessariamente a que a célula mostra.
 */
export interface LocalDeCarga {
  id: string;
  empresa: string;
  local: string;
}

/**
 * Locais da lista.
 *
 * ⚠️ São **16**, contra ≈38 da referência (4 páginas de 10). Todos os nomes são MEDIDOS —
 * os 10 da primeira página desta tela, mais os que apareceram no dropdown de carregadores
 * de Performance e no seletor de locais do topo. Não inventei nome de local: um nome falso
 * numa lista de instalações elétricas é o tipo de dado que alguém tenta procurar depois.
 *
 * Dezesseis já dá duas páginas, que é o que a tela precisa exercitar.
 *
 * E o espaço duplo em `IGREEN MOB -  Rua Santa Juliana` é da ORIGEM — mantido de propósito:
 * é o caso que testa se a coluna aguenta dado sujo sem quebrar o alinhamento.
 */
export const LOCAIS_DE_CARGA: LocalDeCarga[] = [
  "IGREEN MOB -  Rua Santa Juliana - Sete Lagoas",
  "IGREEN MOB - Arena 7 BH",
  "IGREEN MOB - Assis Plaza Shopping Assis",
  "IGREEN MOB - BIG MAIS Gov Valadares",
  "IGREEN MOB - Boulevard Shopping Bauru",
  "IGREEN MOB - Chofferando",
  "IGREEN MOB - Colombo Park Shopping Colombo",
  "IGREEN MOB - Duo FOOD",
  "IGREEN MOB - ESPAÇO 356 (Entrada 4º andar) - Carga rápida",
  "IGREEN MOB - Estadio MINEIRÃO G1 (Av Rei Pele)",
  "IGREEN MOB - Estadio MINEIRÃO G2 ( Entrada Av. Coronel Paschoal)",
  "IGREEN MOB - Hotel Panorama Ipatinga",
  "IGREEN MOB - Posto Via Dupla",
  "IGREEN MOB - SEDE",
  "IGREEN MOB - Usina Solar Vinhedo",
  "PV MOB - Estacionamento",
].map((local, i) => ({
  id: `local-${i}`,
  /* MEDIDO: a coluna Empresa da referência traz `PV MOB` em TODAS as linhas — é a conta
     dona da rede, e o prefixo do nome do local (`IGREEN MOB` / `PV MOB`) é da instalação,
     não da empresa. Um ternário aqui sugeriria uma variação que a referência não tem. */
  empresa: "PV MOB",
  local,
}));

/** PRNG determinístico — mesma semente, mesmo painel. */
function prng(semente: number) {
  let s = semente;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/** Soma dos códigos do id, pra semente estável sem depender da posição no array. */
function semente(id: string): number {
  return [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
}

/** Valores MEDIDOS em `IGREEN MOB - Arena 7 BH`. Exportados pro teste ancorar a derivação. */
export const ENTRADA_ARENA_MEDIDA: NivelDeEntrada = {
  correnteMaximaA: 40,
  tensaoV: 220,
  limiteFixoA: 40,
  reservaDinamicaA: 40,
  medidorAtivo: false,
};

/** Carregadores MEDIDOS em `IGREEN MOB - Arena 7 BH`. */
export const CARREGADORES_ARENA_MEDIDOS: CarregadorDeCarga[] = [
  { id: "arena-1", codigo: "125020001153", correnteA: 0, potenciaKw: 0, status: "disponivel" },
  { id: "arena-2", codigo: "125020001210", correnteA: 0, potenciaKw: 0, status: "disponivel" },
  { id: "arena-3", codigo: "125020001214", correnteA: 0, potenciaKw: 0, status: "falha" },
];

const ARENA = "IGREEN MOB - Arena 7 BH";

/**
 * Nível de entrada de um local.
 *
 * ⚠️ Pra `Arena 7 BH` devolve os valores MEDIDOS, sem passar pela derivação — é o único
 * local cujo painel a referência mostrou, e é o âncora do teste. Os outros derivam de uma
 * escala plausível de rede (corrente 32/40/63/100A, tensão 220 ou 380V).
 */
export function nivelDeEntrada(l: LocalDeCarga): NivelDeEntrada {
  if (l.local === ARENA) return ENTRADA_ARENA_MEDIDA;

  const rnd = prng(semente(l.id));
  const correnteMaximaA = [32, 40, 63, 100][Math.floor(rnd() * 4)];
  return {
    correnteMaximaA,
    /* 380V só em rede de corrente alta: 100A em 220V monofásico não existe na prática, e
       parâmetro elétrico implausível é o tipo de detalhe que faz um eletricista desconfiar
       da tela inteira. */
    tensaoV: correnteMaximaA >= 63 ? 380 : 220,
    /* Limite fixo nunca acima da corrente máxima — é um teto, não um alvo. Invariante
       testada: limite > máxima seria configuração que a própria tela deveria recusar. */
    limiteFixoA: correnteMaximaA,
    reservaDinamicaA: correnteMaximaA,
    medidorAtivo: rnd() < 0.45,
  };
}

/**
 * Carregadores de um local.
 *
 * `Arena 7 BH` devolve os três medidos. Os outros derivam 1 a 4 carregadores, com código no
 * formato da origem (12 dígitos começando em `1250` ou `2023`) e status do vocabulário dela.
 *
 * ⚠️ **Corrente e potência são 0 quando o status não é `carregando`.** Não é preenchimento
 * de campo vazio: carregador disponível não puxa corrente, e mostrar `12,4 A` num
 * carregador parado seria mentira sobre o estado da rede. Invariante testada.
 */
export function carregadoresDoLocal(l: LocalDeCarga): CarregadorDeCarga[] {
  if (l.local === ARENA) return CARREGADORES_ARENA_MEDIDOS;

  const rnd = prng(semente(l.id) * 31);
  const quantidade = 1 + Math.floor(rnd() * 4);
  const statusPossiveis: StatusCarregador[] = [
    "disponivel",
    "disponivel",
    "carregando",
    "preparando",
    "indisponivel",
    "falha",
  ];

  return Array.from({ length: quantidade }, (_, i) => {
    const status = statusPossiveis[Math.floor(rnd() * statusPossiveis.length)];
    const carregando = status === "carregando";
    const correnteA = carregando ? Number((8 + rnd() * 24).toFixed(1)) : 0;
    return {
      id: `${l.id}-c${i}`,
      codigo: `${rnd() < 0.5 ? "1250" : "2023"}${String(
        Math.floor(rnd() * 100000000),
      ).padStart(8, "0")}`,
      correnteA,
      /* P = V × I / 1000, com a tensão do próprio local — é a conta real, e é o que faz o
         número no card conversar com os parâmetros logo acima dele. */
      potenciaKw: carregando
        ? Number(((nivelDeEntrada(l).tensaoV * correnteA) / 1000).toFixed(1))
        : 0,
      status,
    };
  });
}

/**
 * Potência em uso de um local — a soma dos carregadores.
 *
 * A referência mostra `0,0 kW` em todas as linhas porque a rede estava ociosa. Aqui a
 * coluna é DERIVADA dos carregadores, não um campo solto: assim o número da lista e o do
 * painel não podem divergir. Invariante testada.
 */
export function potenciaEmUso(l: LocalDeCarga): number {
  return Number(
    carregadoresDoLocal(l)
      .reduce((a, c) => a + c.potenciaKw, 0)
      .toFixed(1),
  );
}

/**
 * Texto de advertência do painel — **literal da referência**.
 *
 * Fica no mock, e não no componente, pelo mesmo motivo dos outros textos medidos: é conteúdo
 * da origem, não cópia nossa. E é o texto mais importante desta tela: são os parâmetros que
 * podem causar sobrecarga numa instalação elétrica real.
 */
export const AVISO_NIVEL_DE_ENTRADA =
  "Os parâmetros desta tela são relativos à rede elétrica do seu local e devem ser informados corretamente, caso contrário, podem afetar a instalação elétrica causando riscos de sobrecarga e curto-circuito. Em caso de dúvida, consulte um profissional elétrico antes de realizar a parametrização.";

/** Vazio de grupos de carga — literal da origem (`LoadGroups.NoSubgroupAdded`). */
export const VAZIO_GRUPOS_DE_CARGA = "Nenhum subgrupo adicionado";

/** Vazio de carregadores — literal da origem (`LoadGroups.NoConnectors`). */
export const VAZIO_CARREGADORES = "Nenhum carregador";

/**
 * Nome do grupo no nível de entrada.
 *
 * Aparece como placeholder num campo DESABILITADO: o nível de entrada é a raiz da
 * instalação, não um grupo criado por alguém, então ele tem nome mas não tem renomeação.
 */
export const NOME_DO_GRUPO_RAIZ = "Nível de entrada";

/**
 * Vazio do modal de vínculo de carregadores — literal da origem.
 *
 * Ela abriu vazia na captura, e aqui é sempre vazia pelo mesmo motivo: todo carregador do
 * mock já pertence a um local. Ver o JSDoc do `ModalAdicionarCarregadores`.
 */
export const VAZIO_CARREGADORES_DISPONIVEIS =
  "Não há carregadores disponíveis para adicionar.";

/**
 * Opções do select "Modelo do medidor".
 *
 * ⚠️ **NÃO MEDIDO — é a única lista inventada desta tela.** Não abri o dropdown na
 * referência, então não sei quais modelos a iGreen homologa. Um select de zero opções seria
 * um controle quebrado, e nomes de produto reais aqui virariam informação falsa sobre
 * homologação de equipamento — que é o tipo de dado que alguém repete numa compra. Os três
 * abaixo são genéricos de propósito: descrevem a CLASSE do medidor, não um fabricante.
 */
export const MODELOS_DE_MEDIDOR = [
  { value: "monofasico", label: "Medidor monofásico" },
  { value: "bifasico", label: "Medidor bifásico" },
  { value: "trifasico", label: "Medidor trifásico" },
];
