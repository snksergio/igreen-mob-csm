import { LOCAIS } from "~/pages/transacoes/transacoes-mock";

/**
 * Funil de implantação de um novo ponto de recarga — da proposta à instalação.
 *
 * ## O que esta tela modela
 *
 * Sete etapas ditadas pelo operador:
 *
 * `PROPOSTA → ACEITE → VIABILIDADE TÉCNICA → CONTRATO → PAGAMENTO → PROJETO → INSTALAÇÃO`
 *
 * Cada uma carrega um **checklist**, e é o checklist que dá sentido à etapa: sem ele o
 * funil vira sete caixas em que alguém arrasta cartão quando acha que terminou. Com ele,
 * "estou em CONTRATO" passa a significar algo verificável.
 *
 * ## A regra que faz o checklist valer
 *
 * Item marcado como **obrigatório** tranca o avanço. Mover para a etapa seguinte com
 * pendência obrigatória é bloqueado e a tela diz o que falta; **voltar é sempre livre** —
 * descobrir na viabilidade que a carga não fecha é motivo legítimo para regredir, e um
 * funil que só anda para a frente obriga o operador a mentir para continuar usando.
 *
 * Itens não-obrigatórios existem porque nem toda etapa tem só exigências: "simulação de
 * retorno apresentada" ajuda a fechar, mas não impede o aceite.
 *
 * ## Privacidade
 *
 * ⚠️ Empresas, responsáveis e valores são **inventados**. Não há CNPJ, telefone nem
 * e-mail em lugar nenhum deste arquivo — um funil comercial é justamente onde dado real
 * de cliente apareceria, e num protótipo isso não entra. Os LOCAIS reaproveitam o
 * cadastro de Transações para a tela não inventar uma segunda rede.
 */

/** Data fixa do mock — o funil inteiro é derivado dela. */
export const HOJE = new Date("2026-09-22T12:00:00Z");

export type EtapaId =
  | "proposta"
  | "aceite"
  | "viabilidade"
  | "contrato"
  | "pagamento"
  | "projeto"
  | "instalacao";

export interface Etapa {
  id: EtapaId;
  /** Rótulo completo, para chip e cabeçalho de coluna. */
  label: string;
  /** O que precisa ser verdade para a etapa estar cumprida. */
  resumo: string;
  /** Token de cor do DS — usado no dot da coluna do Kanban e no chip. */
  cor: string;
}

/**
 * ⚠️ A ORDEM deste array é a ordem do funil. `indiceDaEtapa` lê daqui, e as colunas do
 * Kanban também — não existe segunda lista para sair de sincronia.
 *
 * A rampa de cor é deliberada: cinza no começo (nada garantido), âmbar no meio
 * (compromisso assumido, dinheiro ainda não), verde no fim (obra acontecendo). Sete cores
 * categóricas transformariam o board num arco-íris sem hierarquia.
 */
export const ETAPAS: Etapa[] = [
  {
    id: "proposta",
    label: "Proposta",
    resumo: "Oportunidade levantada e proposta comercial na mão do cliente.",
    cor: "var(--color-fg-subtle)",
  },
  {
    id: "aceite",
    label: "Aceite",
    resumo: "Cliente aceitou a proposta e o modelo de parceria está definido.",
    cor: "var(--color-fg-muted)",
  },
  {
    id: "viabilidade",
    label: "Viabilidade técnica",
    resumo: "Visita feita, carga confirmada e ponto de conexão definido.",
    cor: "var(--color-fg-info)",
  },
  {
    id: "contrato",
    label: "Contrato",
    resumo: "Contrato assinado pelas duas partes e split cadastrado.",
    cor: "var(--color-fg-warning)",
  },
  {
    id: "pagamento",
    label: "Pagamento",
    resumo: "Entrada paga e compra do equipamento liberada.",
    cor: "var(--color-fg-caution)",
  },
  {
    id: "projeto",
    label: "Projeto",
    resumo: "Projeto elétrico aprovado, equipamento comprado, cronograma acordado.",
    cor: "var(--color-chart-4)",
  },
  {
    id: "instalacao",
    label: "Instalação",
    resumo: "Obra concluída, carregador energizado e publicado no app.",
    cor: "var(--color-fg-success)",
  },
];

export const ETAPA_POR_ID: Record<EtapaId, Etapa> = Object.fromEntries(
  ETAPAS.map((e) => [e.id, e]),
) as Record<EtapaId, Etapa>;

export interface ItemDeChecklist {
  /** `etapa.n` — estável, é o que fica gravado em `Implantacao.feitos`. */
  id: string;
  etapa: EtapaId;
  texto: string;
  /** Obrigatório tranca o avanço para a etapa seguinte. */
  obrigatorio: boolean;
}

/**
 * Os checklists.
 *
 * ⚠️ São **modelo**, não dado da implantação: toda implantação usa os mesmos itens, e o
 * que varia é quais estão marcados (`Implantacao.feitos`). Guardar uma cópia da lista por
 * registro pareceria mais flexível e criaria o problema clássico — mudar o processo
 * deixaria de valer para quem já está no funil.
 */
function itens(
  etapa: EtapaId,
  linhas: [texto: string, obrigatorio: boolean][],
): ItemDeChecklist[] {
  return linhas.map(([texto, obrigatorio], i) => ({
    id: `${etapa}.${i + 1}`,
    etapa,
    texto,
    obrigatorio,
  }));
}

export const CHECKLIST_POR_ETAPA: Record<EtapaId, ItemDeChecklist[]> = {
  proposta: itens("proposta", [
    ["Demanda do local levantada (perfil de público e horários)", true],
    ["Proposta comercial enviada", true],
    ["Simulação de retorno apresentada", false],
  ]),
  aceite: itens("aceite", [
    ["Aceite formal do cliente registrado", true],
    ["Modelo de parceria definido (divisão de receita)", true],
    ["Quantidade de pontos e potência acordadas", true],
  ]),
  viabilidade: itens("viabilidade", [
    ["Visita técnica realizada", true],
    ["Carga disponível confirmada com a distribuidora", true],
    ["Ponto de conexão definido", true],
    ["Necessidade de obra civil avaliada", false],
  ]),
  contrato: itens("contrato", [
    ["Minuta enviada para o cliente", false],
    ["Contrato assinado pelas duas partes", true],
    ["Split cadastrado no sistema", true],
  ]),
  pagamento: itens("pagamento", [
    ["Nota fiscal emitida", true],
    ["Entrada confirmada", true],
    ["Compra do equipamento liberada", true],
  ]),
  projeto: itens("projeto", [
    ["Projeto elétrico aprovado", true],
    ["Equipamento adquirido", true],
    ["ART emitida", false],
    ["Cronograma de instalação acordado", true],
  ]),
  instalacao: itens("instalacao", [
    ["Obra civil concluída", false],
    ["Carregador instalado e energizado", true],
    ["Comissionamento OCPP concluído", true],
    ["Carregador publicado no app", true],
  ]),
};

/** Todos os itens, na ordem do funil. Base de `progressoGeral`. */
export const TODOS_OS_ITENS: ItemDeChecklist[] = ETAPAS.flatMap(
  (e) => CHECKLIST_POR_ETAPA[e.id],
);

export interface Implantacao {
  /** `IMP-2026-001`. */
  id: string;
  /** Empresa que hospeda o ponto. Fictícia — ver o JSDoc do topo. */
  cliente: string;
  /** Local do cadastro de Transações, ou nome novo quando ainda não existe na rede. */
  local: string;
  cidade: string;
  uf: string;
  etapa: EtapaId;
  /** Quantos pontos de recarga o projeto prevê. */
  pontos: number;
  potenciaKw: number;
  /** Investimento previsto, em reais. */
  investimento: number;
  responsavel: string;
  /** ISO `YYYY-MM-DD`. */
  abertaEm: string;
  /** Desde quando está na etapa atual — base de `diasNaEtapa`. */
  etapaDesde: string;
  previsaoDeInstalacao: string;
  /** Ids de `ItemDeChecklist` já cumpridos, de qualquer etapa. */
  feitos: string[];
  observacao?: string;
}

/** Todos os itens das etapas ANTERIORES à informada — o que já ficou para trás. */
function itensAte(etapa: EtapaId): string[] {
  const i = ETAPAS.findIndex((e) => e.id === etapa);
  return ETAPAS.slice(0, i).flatMap((e) =>
    CHECKLIST_POR_ETAPA[e.id].map((x) => x.id),
  );
}

/** Os `n` primeiros itens da etapa — atalho para montar progresso parcial no mock. */
function primeiros(etapa: EtapaId, n: number): string[] {
  return CHECKLIST_POR_ETAPA[etapa].slice(0, n).map((x) => x.id);
}

/**
 * Quatorze implantações cobrindo as sete etapas.
 *
 * O elenco existe para exercitar os estados que a tela precisa desenhar, não para parecer
 * um relatório: há pelo menos uma **atrasada**, uma **travada por pendência obrigatória**
 * logo no começo, uma **recém-aberta sem nada marcado** e uma **concluída**. Sem esses
 * quatro, o board fica bonito e não prova nada.
 */
export const IMPLANTACOES: Implantacao[] = [
  {
    id: "IMP-2026-001",
    cliente: "Rede Boa Praça Supermercados",
    local: "Boa Praça - Loja Centro",
    cidade: "Belo Horizonte",
    uf: "MG",
    etapa: "proposta",
    pontos: 2,
    potenciaKw: 22,
    investimento: 78000,
    responsavel: "Matheus Pego",
    abertaEm: "2026-09-15",
    etapaDesde: "2026-09-15",
    previsaoDeInstalacao: "2026-12-10",
    /* Recém-aberta: nada marcado. É o estado em que o card nasce. */
    feitos: [],
  },
  {
    id: "IMP-2026-002",
    cliente: "Pousada Serra Azul",
    local: "Pousada Serra Azul",
    cidade: "Monte Verde",
    uf: "MG",
    etapa: "proposta",
    pontos: 1,
    potenciaKw: 7.4,
    investimento: 21500,
    responsavel: "Carla Nogueira",
    abertaEm: "2026-09-02",
    etapaDesde: "2026-09-02",
    previsaoDeInstalacao: "2026-11-20",
    feitos: [...primeiros("proposta", 2)],
    observacao:
      "Cliente pediu simulação de retorno antes de responder. Sem a simulação não avança.",
  },
  {
    id: "IMP-2026-003",
    cliente: "Grupo Via Norte",
    local: "Posto Via Norte - Km 42",
    cidade: "Contagem",
    uf: "MG",
    etapa: "aceite",
    pontos: 4,
    potenciaKw: 60,
    investimento: 412000,
    responsavel: "Matheus Pego",
    abertaEm: "2026-08-11",
    etapaDesde: "2026-09-08",
    previsaoDeInstalacao: "2026-12-01",
    feitos: [...itensAte("aceite"), ...primeiros("aceite", 1)],
  },
  {
    id: "IMP-2026-004",
    cliente: "Condomínio Parque das Águas",
    local: "Parque das Águas - Torre A",
    cidade: "Nova Lima",
    uf: "MG",
    etapa: "aceite",
    pontos: 2,
    potenciaKw: 22,
    investimento: 96000,
    responsavel: "Rafael Prado",
    abertaEm: "2026-07-28",
    etapaDesde: "2026-08-30",
    /* Atrasada: a previsão já passou e a implantação está longe do fim. */
    previsaoDeInstalacao: "2026-09-10",
    feitos: [...itensAte("aceite"), ...primeiros("aceite", 2)],
    observacao:
      "Assembleia do condomínio adiada duas vezes. Previsão original não se sustenta.",
  },
  {
    id: "IMP-2026-005",
    cliente: "Shopping Colombo",
    local: "IGREEN MOB - Shopping Colombo",
    cidade: "Belo Horizonte",
    uf: "MG",
    etapa: "viabilidade",
    pontos: 6,
    potenciaKw: 60,
    investimento: 638000,
    responsavel: "Carla Nogueira",
    abertaEm: "2026-06-19",
    etapaDesde: "2026-09-01",
    previsaoDeInstalacao: "2026-11-05",
    feitos: [...itensAte("viabilidade"), ...primeiros("viabilidade", 2)],
  },
  {
    id: "IMP-2026-006",
    cliente: "Arena 7",
    local: "IGREEN MOB - Arena 7 BH",
    cidade: "Belo Horizonte",
    uf: "MG",
    etapa: "viabilidade",
    pontos: 3,
    potenciaKw: 40,
    investimento: 268000,
    responsavel: "Rafael Prado",
    abertaEm: "2026-07-03",
    etapaDesde: "2026-08-25",
    previsaoDeInstalacao: "2026-10-28",
    feitos: [...itensAte("viabilidade"), ...CHECKLIST_POR_ETAPA.viabilidade.map((x) => x.id)],
    observacao: "Tudo cumprido — aguardando só a minuta de contrato ser gerada.",
  },
  {
    id: "IMP-2026-007",
    cliente: "Duo FOOD",
    local: "IGREEN MOB - Duo FOOD",
    cidade: "Betim",
    uf: "MG",
    etapa: "contrato",
    pontos: 2,
    potenciaKw: 22,
    investimento: 104000,
    responsavel: "Matheus Pego",
    abertaEm: "2026-06-02",
    etapaDesde: "2026-09-12",
    previsaoDeInstalacao: "2026-10-15",
    feitos: [...itensAte("contrato"), ...primeiros("contrato", 1)],
  },
  {
    id: "IMP-2026-008",
    cliente: "Rede Pejoal",
    local: "IGREEN MOB - Supermercado Pejoal Super Vale",
    cidade: "Governador Valadares",
    uf: "MG",
    etapa: "contrato",
    pontos: 2,
    potenciaKw: 40,
    investimento: 188000,
    responsavel: "Carla Nogueira",
    abertaEm: "2026-05-20",
    etapaDesde: "2026-08-19",
    /* Atrasada e parada há mais de um mês no contrato. */
    previsaoDeInstalacao: "2026-09-05",
    feitos: [...itensAte("contrato"), ...primeiros("contrato", 2)],
    observacao: "Jurídico do cliente pediu revisão da cláusula de exclusividade.",
  },
  {
    id: "IMP-2026-009",
    cliente: "Posto Via Dupla",
    local: "IGREEN MOB - Posto Via Dupla",
    cidade: "Sete Lagoas",
    uf: "MG",
    etapa: "pagamento",
    pontos: 2,
    potenciaKw: 60,
    investimento: 302000,
    responsavel: "Rafael Prado",
    abertaEm: "2026-05-04",
    etapaDesde: "2026-09-10",
    previsaoDeInstalacao: "2026-10-20",
    feitos: [...itensAte("pagamento"), ...primeiros("pagamento", 1)],
  },
  {
    id: "IMP-2026-010",
    cliente: "BIG MAIS",
    local: "IGREEN MOB - BIG MAIS Gov Valadares",
    cidade: "Governador Valadares",
    uf: "MG",
    etapa: "pagamento",
    pontos: 3,
    potenciaKw: 40,
    investimento: 246000,
    responsavel: "Matheus Pego",
    abertaEm: "2026-04-15",
    etapaDesde: "2026-09-16",
    previsaoDeInstalacao: "2026-10-08",
    feitos: [...itensAte("pagamento"), ...CHECKLIST_POR_ETAPA.pagamento.map((x) => x.id)],
  },
  {
    id: "IMP-2026-011",
    cliente: "Usina Solar Vinhedo",
    local: "IGREEN MOB - Usina Solar Vinhedo",
    cidade: "Vinhedo",
    uf: "SP",
    etapa: "projeto",
    pontos: 4,
    potenciaKw: 60,
    investimento: 468000,
    responsavel: "Carla Nogueira",
    abertaEm: "2026-03-09",
    etapaDesde: "2026-09-05",
    previsaoDeInstalacao: "2026-10-12",
    feitos: [...itensAte("projeto"), ...primeiros("projeto", 2)],
  },
  {
    id: "IMP-2026-012",
    cliente: "Estacionamento PV",
    local: "PV MOB - Estacionamento",
    cidade: "Belo Horizonte",
    uf: "MG",
    etapa: "projeto",
    pontos: 2,
    potenciaKw: 22,
    investimento: 112000,
    responsavel: "Rafael Prado",
    abertaEm: "2026-04-01",
    etapaDesde: "2026-08-28",
    previsaoDeInstalacao: "2026-09-30",
    feitos: [...itensAte("projeto"), ...primeiros("projeto", 3)],
  },
  {
    id: "IMP-2026-013",
    cliente: "Padaria Cipó",
    local: "IGREEN MOB - Padaria Cipó - Padaria na Serra",
    cidade: "Serra do Cipó",
    uf: "MG",
    etapa: "instalacao",
    pontos: 1,
    potenciaKw: 22,
    investimento: 58000,
    responsavel: "Matheus Pego",
    abertaEm: "2026-02-17",
    etapaDesde: "2026-09-18",
    previsaoDeInstalacao: "2026-09-29",
    feitos: [...itensAte("instalacao"), ...primeiros("instalacao", 2)],
  },
  {
    id: "IMP-2026-014",
    cliente: "iGreen MOB",
    local: "IGREEN MOB - SEDE",
    cidade: "Belo Horizonte",
    uf: "MG",
    etapa: "instalacao",
    pontos: 3,
    potenciaKw: 40,
    investimento: 214000,
    responsavel: "Carla Nogueira",
    abertaEm: "2026-01-22",
    etapaDesde: "2026-09-11",
    previsaoDeInstalacao: "2026-09-19",
    /* Concluída: tudo marcado, do primeiro ao último item. */
    feitos: TODOS_OS_ITENS.map((x) => x.id),
  },
];

/* ══ Derivados ═══════════════════════════════════════════════════════════════ */

export function indiceDaEtapa(e: EtapaId): number {
  return ETAPAS.findIndex((x) => x.id === e);
}

export function proximaEtapa(e: EtapaId): EtapaId | null {
  return ETAPAS[indiceDaEtapa(e) + 1]?.id ?? null;
}

export function etapaAnterior(e: EtapaId): EtapaId | null {
  const i = indiceDaEtapa(e);
  return i > 0 ? ETAPAS[i - 1].id : null;
}

/** Quantos itens da etapa estão cumpridos. */
export function progressoDaEtapa(
  imp: Implantacao,
  etapa: EtapaId = imp.etapa,
): { feitos: number; total: number } {
  const lista = CHECKLIST_POR_ETAPA[etapa];
  const feitos = lista.filter((i) => imp.feitos.includes(i.id)).length;
  return { feitos, total: lista.length };
}

/**
 * Progresso do funil inteiro, de 0 a 1.
 *
 * ⚠️ Conta ITENS, não etapas. Contar etapas daria saltos de 14% e faria uma implantação
 * com três de quatro itens do projeto parecer idêntica a uma que acabou de entrar nele.
 */
export function progressoGeral(imp: Implantacao): number {
  return imp.feitos.length / TODOS_OS_ITENS.length;
}

/** Itens obrigatórios da etapa atual que ainda faltam. Vazio = pode avançar. */
export function pendenciasObrigatorias(imp: Implantacao): ItemDeChecklist[] {
  return CHECKLIST_POR_ETAPA[imp.etapa].filter(
    (i) => i.obrigatorio && !imp.feitos.includes(i.id),
  );
}

export function podeAvancar(imp: Implantacao): boolean {
  return proximaEtapa(imp.etapa) !== null && pendenciasObrigatorias(imp).length === 0;
}

/**
 * Concluída = está na última etapa e não deve mais nada.
 *
 * Não existe etapa "Concluído" no funil ditado pelo operador, e inventar uma oitava
 * coluna mudaria o processo dele. O estado terminal é derivado.
 */
export function concluida(imp: Implantacao): boolean {
  return imp.etapa === "instalacao" && pendenciasObrigatorias(imp).length === 0;
}

function diasEntre(deISO: string, ate: Date): number {
  const de = new Date(`${deISO}T12:00:00Z`);
  return Math.round((ate.getTime() - de.getTime()) / 86_400_000);
}

export function diasNaEtapa(imp: Implantacao, agora: Date = HOJE): number {
  return Math.max(0, diasEntre(imp.etapaDesde, agora));
}

/**
 * Atrasada = a previsão de instalação já passou e a implantação **não** terminou.
 *
 * Uma implantação concluída depois da previsão não é um atraso aberto — é histórico. Ela
 * pintada de vermelho eternamente treinaria o operador a ignorar a cor.
 */
export function atrasada(imp: Implantacao, agora: Date = HOJE): boolean {
  if (concluida(imp)) return false;
  return new Date(`${imp.previsaoDeInstalacao}T12:00:00Z`).getTime() < agora.getTime();
}

/** Dias até a previsão. Negativo quando já passou. */
export function diasParaPrevisao(imp: Implantacao, agora: Date = HOJE): number {
  return -diasEntre(imp.previsaoDeInstalacao, agora);
}

/* ══ Formatação ══════════════════════════════════════════════════════════════ */

export const moeda = (v: number): string =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

/** `2026-09-12` → `12/09/2026`, sem passar por `Date` (fuso não muda o dia). */
export const dataCurta = (iso: string): string =>
  iso.split("-").reverse().join("/");

export const potencia = (kw: number): string =>
  `${kw.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kW`;

/* ══ Textos ══════════════════════════════════════════════════════════════════ */

export const IMPLANTACOES_TEXTOS = {
  aviso:
    "Da proposta à instalação. Cada etapa tem um checklist, e item obrigatório pendente trava o avanço.",
  travadaTitulo: "Falta cumprir o checklist",
  excluirTitulo: "Excluir implantação?",
  excluirDescricao:
    "O funil perde o histórico deste ponto. A ação não tem desfazer neste protótipo.",
};

/** Responsáveis do mock — fictícios, e são só três para o filtro ter serventia. */
export const RESPONSAVEIS = ["Matheus Pego", "Carla Nogueira", "Rafael Prado"];

/** Locais já cadastrados na rede, para o formulário oferecer em vez de texto livre. */
export const LOCAIS_DA_REDE = LOCAIS;
