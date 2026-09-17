import { GEO_DOS_LOCAIS } from "~/pages/monitoramento/monitoramento-mock";

/**
 * Mock da tela de Configuração de grupos de alertas — medida em `/pt/alert-groups?page=1`
 * (2026-09-16).
 *
 * ## A lista da referência estava VAZIA
 *
 * Como em Usuários, a tela da origem mostrava "Sem resultados". O que é medido aqui são as
 * **cinco colunas** e, sobretudo, o **formulário**: os dez interruptores de tipo de alerta,
 * o select de empresa, a lista de locais com `Todos`, e o campo de e-mails com "aperte
 * ENTER". Os grupos são inventados, a pedido do operador.
 *
 * ## ⚠️ A origem repete "Alerta desconhecido" duas vezes
 *
 * São dez interruptores no print e dois têm exatamente o mesmo rótulo. Isso é defeito dela,
 * não vocabulário: dois controles com o mesmo nome e efeitos diferentes é a pior forma de
 * configuração — ninguém sabe qual desligou. Aqui são **nove**, com o duplicado removido.
 *
 * ## Um grupo é um trio: o QUE, ONDE e PRA QUEM
 *
 * Tipos de alerta × locais cobertos × e-mails notificados. É esse trio que a lista precisa
 * mostrar, e é por isso que as três colunas centrais são multi-valor — ver o JSDoc de
 * `AlertasPage` pro desenho que resolve isso.
 */

/** Os tipos, com os rótulos literais da referência (menos o duplicado). */
export const TIPOS_DE_ALERTA = [
  "Offline",
  "Intermitente",
  "Com falha",
  "Conector preparando",
  "Transações concorrentes",
  "Conector indisponível",
  "Recarga sem autorização",
  "Potência acima do cadastro",
  "Alerta desconhecido",
] as const;

export type TipoDeAlerta = (typeof TIPOS_DE_ALERTA)[number];

/**
 * Quais tipos são de INDISPONIBILIDADE.
 *
 * Serve pro chip do grupo: um grupo que só escuta falha é operação; um que escuta tudo é
 * monitoramento. A distinção não existe na referência e é o que dá à lista alguma
 * informação além de contagem.
 */
export const TIPOS_CRITICOS: TipoDeAlerta[] = [
  "Offline",
  "Com falha",
  "Conector indisponível",
];

export interface GrupoDeAlertas {
  id: string;
  nome: string;
  empresa: string;
  tipos: TipoDeAlerta[];
  /** Vazio = todos os locais. É o estado que o `Todos` do formulário produz. */
  locais: string[];
  emails: string[];
  ativo: boolean;
}

const TODOS_OS_LOCAIS = Object.keys(GEO_DOS_LOCAIS);

/**
 * Quatro grupos, escolhidos pra exercitar os quatro casos que a lista precisa aguentar.
 *
 * ⚠️ Não é enfeite: cada um existe por um estado de célula que sem ele nunca renderizaria.
 *
 * | grupo | o que exercita |
 * |---|---|
 * | Plantão de operação | cobertura TOTAL (lista vazia = todos) e muitos e-mails |
 * | Equipe de campo — MG | cobertura parcial com muitos locais |
 * | Comercial | UM local só, UM e-mail só — o caso mínimo |
 * | Diretoria | grupo DESATIVADO, e só os tipos críticos |
 */
export const GRUPOS_DE_ALERTAS: GrupoDeAlertas[] = [
  {
    id: "grp-plantao",
    nome: "Plantão de operação",
    empresa: "PV MOB",
    tipos: [...TIPOS_DE_ALERTA],
    locais: [],
    emails: [
      "plantao@exemplo.com.br",
      "noc@exemplo.com.br",
      "renata@exemplo.com.br",
      "matheus@exemplo.com.br",
    ],
    ativo: true,
  },
  {
    id: "grp-campo-mg",
    nome: "Equipe de campo — MG",
    empresa: "PV MOB",
    tipos: ["Offline", "Com falha", "Conector indisponível", "Intermitente"],
    locais: TODOS_OS_LOCAIS.filter((l) => GEO_DOS_LOCAIS[l].uf === "MG"),
    emails: ["campo.mg@exemplo.com.br", "otavio@exemplo.com.br"],
    ativo: true,
  },
  {
    id: "grp-comercial",
    nome: "Comercial — Arena 7",
    empresa: "PV MOB",
    tipos: ["Recarga sem autorização", "Transações concorrentes"],
    locais: ["IGREEN MOB - Arena 7 BH"],
    emails: ["comercial@exemplo.com.br"],
    ativo: true,
  },
  {
    id: "grp-diretoria",
    nome: "Diretoria",
    empresa: "PV MOB",
    tipos: [...TIPOS_CRITICOS],
    locais: [],
    emails: ["diretoria@exemplo.com.br", "larissa@exemplo.com.br"],
    ativo: false,
  },
];

/** Quantos locais o grupo cobre. Lista vazia = todos, e é isso que o número diz. */
export function locaisCobertos(g: GrupoDeAlertas): number {
  return g.locais.length === 0 ? TODOS_OS_LOCAIS.length : g.locais.length;
}

/** Cobertura total? É o estado que o `Todos` do formulário produz. */
export function cobreTudo(g: GrupoDeAlertas): boolean {
  return g.locais.length === 0;
}

export const LOCAIS_DISPONIVEIS = TODOS_OS_LOCAIS;

export const ALERTAS_TEXTOS = {
  aviso:
    "Dados correspondentes aos locais selecionados no topo. Para alterar, use o seletor no topo da página.",
  buscar: "Pesquisar por grupo de alerta",
  novoGrupo: "Adicionar grupo de alertas",
  /** Literal da referência, no campo de e-mails. */
  dicaDeEmail: "Digite o e-mail e aperte ENTER para adicionar na lista",
  ajudaDaCobertura:
    "Quais locais o grupo vigia. Sem nenhum marcado, ele cobre todos — inclusive os que forem cadastrados depois.",
  ajudaDoNome: "Aparece no assunto do e-mail que a equipe recebe.",
  ajudaDosTipos:
    "Cada tipo é um evento do carregador. Desligar um aqui silencia só este grupo; os outros continuam recebendo.",
  excluirTitulo: "Excluir grupo de alertas",
  excluirDescricao:
    "Os e-mails deste grupo param de receber notificação imediatamente. Os alertas continuam sendo registrados no Monitoramento. Esta ação não pode ser desfeita.",
} as const;
