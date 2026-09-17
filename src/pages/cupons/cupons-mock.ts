import { PERFIS_DE_PRECO } from "~/pages/precos/precos-mock";

/**
 * Mock da tela de Cupons — medida em `/pt/coupons?page=1` (2026-09-16).
 *
 * ## O que é medido, e o que não dava pra medir
 *
 * **A lista:** as oito colunas (`Nome · Tipo · Código · Status · Validade · Utilizações ·
 * Empresa · Ações`), os dois filtros do topo e o vazio `Sem resultados`.
 *
 * ⚠️ **A referência não tinha nenhum cupom cadastrado** — `0 de 0`. Então não há uma única
 * linha medida aqui: os dez cupons abaixo são DERIVADOS, e é a primeira tela do projeto sem
 * âncora de dado. Ficar fiel ao vazio deixaria a tela inteira sem prova de que funciona —
 * nem as abas de status, nem o filtro de tipo, nem a coluna de utilizações.
 *
 * O que É medido: os nomes das colunas, os dois tipos de cupom, todos os rótulos, exemplos e
 * textos de ajuda do formulário, e os cinco modificadores de validade.
 *
 * ## Os nomes de campanha são genéricos de propósito
 *
 * `Boas-vindas`, `Primeira recarga`, `Frota corporativa`. Nada de nome de cliente ou de
 * campanha real: cupom vale dinheiro, e um código plausível demais num mock é o tipo de
 * coisa que alguém tenta usar.
 */

/** Os dois tipos do seletor de cards — rótulos literais da origem. */
export type TipoDeCupom = "desconto" | "primeira-recarga";

export const ROTULO_TIPO: Record<TipoDeCupom, string> = {
  desconto: "Cupom de desconto",
  "primeira-recarga": "Cupom de primeira recarga",
};

/**
 * Status de um cupom.
 *
 * ⚠️ **Derivado das datas, nunca armazenado.** Um campo `status` gravado envelheceria sozinho
 * — o cupom venceria e a coluna continuaria dizendo "Ativo". Ver `statusDoCupom`.
 */
export type StatusDeCupom = "ativo" | "agendado" | "inativo";

export const ROTULO_STATUS: Record<StatusDeCupom, string> = {
  ativo: "Ativo",
  agendado: "Agendado",
  inativo: "Inativo",
};

/** Modificadores opcionais da validade — os cinco checkboxes da origem. */
export interface RegrasDeUso {
  nuncaExpira: boolean;
  /** Teto de usos do cupom inteiro. `null` = sem limite. */
  limiteDeUsos: number | null;
  /** Teto por motorista. `null` = sem limite. */
  limitePorMotorista: number | null;
  /** `HH:MM`–`HH:MM` quando o cupom só vale numa faixa do dia. */
  faixaHoraria: { de: string; ate: string } | null;
  /** Valor mínimo da recarga, em reais. `null` = qualquer valor. */
  valorMinimo: number | null;
}

export interface Cupom {
  id: string;
  nome: string;
  tipo: TipoDeCupom;
  /** O que o motorista digita na recarga. Maiúsculas, sem espaço. */
  codigo: string;
  empresa: string;
  /** Locais onde o cupom vale. Lista vazia nunca acontece — ver o teste. */
  locais: string[];
  /** Percentual de desconto. `null` no cupom de primeira recarga. */
  percentual: number | null;
  inicio: Date;
  /** `null` quando `nuncaExpira`. */
  termino: Date | null;
  regras: RegrasDeUso;
  /** Quantas vezes já foi usado. */
  usos: number;
}

/**
 * Locais válidos para cupom — a lista do seletor.
 *
 * São os MESMOS do parque das outras telas (via `PERFIS_DE_PRECO`, que já os declara), mais
 * os onze que só apareceram neste seletor. A referência lista 34; aqui são 28, o suficiente
 * pra lista precisar de busca e scroll — que é o ponto do componente.
 */
const LOCAIS_SO_DAQUI = [
  "IGREEN MOB - Jaboticabal Shopping",
  "IGREEN MOB - Limeira Shopping",
  "IGREEN MOB - Madero Container T4",
  "IGREEN MOB - Matheus Salum",
  "IGREEN MOB - Niraj Shopping Rondonópolis",
  "IGREEN MOB - Posto Rodeadouro",
  "IGREEN MOB - Pousada Dona Bendita",
  "IGREEN MOB - Restaurante Fazenda Mineira",
  "IGREEN MOB - Santo Mercado Santo Amaro",
  "IGREEN MOB - Shopping Franco da Rocha",
  "IGREEN MOB - Shopping Jaraguá Araraquara",
  "IGREEN MOB - Shopping Jaraguá CENESP",
  "IGREEN MOB - Shopping Jaraguá Indaiatuba Indaiatuba",
  "IGREEN MOB - Villa Barril Monte Verde",
];

export const LOCAIS_DO_CUPOM: string[] = [
  ...new Set([...PERFIS_DE_PRECO.map((p) => p.local), ...LOCAIS_SO_DAQUI]),
].sort((a, b) => a.localeCompare(b, "pt-BR"));

/** PRNG determinístico. */
function prng(semente: number) {
  let s = semente;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/** "Hoje" do mock — a data da captura. Fixo pra que os status não mudem com o relógio. */
export const HOJE = new Date("2026-09-16T17:47:00");

const dias = (n: number) => n * 24 * 60 * 60 * 1000;

/**
 * Status de um cupom, **derivado** do par de datas.
 *
 * | | quando |
 * |---|---|
 * | `agendado` | o início ainda não chegou |
 * | `inativo` | o término já passou |
 * | `ativo` | está no meio, ou nunca expira |
 *
 * Guardar isso num campo faria a coluna mentir no dia seguinte à captura — é o mesmo
 * cuidado da potência em uso em Gestão de Carga e da recarga grátis em Preços.
 */
export function statusDoCupom(c: Cupom, agora: Date = HOJE): StatusDeCupom {
  if (c.inicio > agora) return "agendado";
  if (c.regras.nuncaExpira) return "ativo";
  if (c.termino && c.termino < agora) return "inativo";
  return "ativo";
}

const NOMES = [
  "Boas-vindas",
  "Primeira recarga",
  "Frota corporativa",
  "Fim de semana",
  "Madrugada",
  "Recarga cheia",
  "Hóspede parceiro",
  "Shopping Verão",
  "Dia do motorista",
  "Piloto interno",
];

export const CUPONS: Cupom[] = NOMES.map((nome, i) => {
  const rnd = prng(1200 + i * 67);
  const tipo: TipoDeCupom = i % 4 === 1 ? "primeira-recarga" : "desconto";
  const nuncaExpira = i === 2;
  /* Três recortes de data pra que as três abas de status tenham conteúdo — sem isso, a aba
     vazia pareceria defeito. Invariante testada. */
  const deslocamento = i % 3 === 0 ? -20 : i % 3 === 1 ? 6 : -60;
  const inicio = new Date(HOJE.getTime() + dias(deslocamento));
  const termino = nuncaExpira
    ? null
    : new Date(inicio.getTime() + dias(30 + Math.floor(rnd() * 60)));

  /* Quantos locais: alguns cupons valem em tudo, outros em poucos. É o que o seletor de
     locais precisa exercitar — "todos marcados" e "alguns marcados" desenham diferente. */
  const quantosLocais =
    i % 5 === 0
      ? LOCAIS_DO_CUPOM.length
      : 1 + Math.floor(rnd() * Math.min(6, LOCAIS_DO_CUPOM.length));

  return {
    id: `cupom-${i}`,
    nome,
    tipo,
    /* Código sem espaço e em caixa alta — é o que o motorista digita, e um código com
       espaço quebraria na hora de aplicar. Invariante testada. */
    codigo: nome
      .toUpperCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 10)
      .concat(String(2026).slice(-2)),
    empresa: "PV MOB",
    locais: LOCAIS_DO_CUPOM.slice(0, quantosLocais),
    /* Cupom de primeira recarga não tem percentual: o benefício dele é a recarga, não um
       desconto sobre ela. Invariante testada. */
    percentual: tipo === "desconto" ? 5 + Math.floor(rnd() * 4) * 5 : null,
    inicio,
    termino,
    regras: {
      nuncaExpira,
      limiteDeUsos: rnd() < 0.4 ? 100 * (1 + Math.floor(rnd() * 5)) : null,
      limitePorMotorista: rnd() < 0.5 ? 1 + Math.floor(rnd() * 3) : null,
      faixaHoraria: rnd() < 0.25 ? { de: "22:00", ate: "06:00" } : null,
      valorMinimo: rnd() < 0.3 ? 20 + Math.floor(rnd() * 5) * 10 : null,
    },
    usos: Math.floor(rnd() * 240),
  };
});

/**
 * Código de cupom gerado pelo botão `Gerar Código`.
 *
 * Caixa alta e sem ambiguidade visual: sem `O`/`0` e sem `I`/`1`, porque o código é ditado
 * por telefone e digitado à mão pelo motorista.
 */
export function gerarCodigo(): string {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 8 },
    () => alfabeto[Math.floor(Math.random() * alfabeto.length)],
  ).join("");
}

/* ── Textos literais da referência ──────────────────────────────────────────────── */

export const CUPOM_FORM = {
  titulo: "Criar novo cupom",
  tituloEdicao: "Editar cupom",
  locaisTitulo: "Locais da empresa válidos para o Cupom/Voucher",
  locaisAjuda:
    "O cupom só pode ser aplicado em recargas feitas nos locais marcados aqui.",
  empresa: "Empresa",
  buscarLocais: "Buscar locais",
  todosOsLocais: "Todos os locais",
  erroSemLocal: "É necessário selecionar pelo menos um local",
  tipo: "Tipo",
  nome: "Nome",
  nomeExemplo: "Ex: BlackFriday 2025",
  nomeAjuda:
    "Este nome aparece para o cliente e serve para o CPO gerenciar os cupons ativos.",
  /* A origem separa em card "Desconto" + label "Percentual Off (%)". Juntar os dois numa
     label só é o que o usuário pediu: o card não acrescentava nada que a label não diga. */
  desconto: "Desconto em percentual off (%)",
  descontoExemplo: "Ex: 10",
  descontoAjuda: "Valor a ser aplicado no desconto.",
  codigo: "Código de desconto",
  codigoExemplo: "Ex: BLACK2025",
  codigoAjuda: "Clientes entram este código na recarga para aplicar o desconto.",
  gerarCodigo: "Gerar Código",
  validade: "Validade",
  inicio: "Início",
  termino: "Término",
  validadeAjuda:
    "Datas e horários de início e término da validade do cupom.",
  nuncaExpira: "Nunca expira",
  limiteDeUsos: "Limite de utilizações",
  limitePorMotorista: "Limite de utilizações por motorista",
  faixaHoraria: "Válido somente no período",
  valorMinimo: "Válido somente para recargas acima de",
  salvar: "Salvar",
  cancelar: "Cancelar",
} as const;

export const CUPONS_LISTA = {
  novo: "Novo cupom",
  buscar: "Buscar cupom",
  vazio: "Sem resultados",
} as const;
