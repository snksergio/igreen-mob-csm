import { GEO_DOS_LOCAIS } from "~/pages/monitoramento/monitoramento-mock";

/**
 * Mock da tela de Permissões — medida em `/pt/permissions?page=1` (2026-09-16).
 *
 * ## O que foi COPIADO da referência e o que foi REDESENHADO
 *
 * Copiado, porque é vocabulário do negócio e não desenho: os **cinco perfis**, os **textos
 * de cada um** (a "Legenda do Perfil de Acesso"), o par de campos do formulário (e-mail +
 * lista de locais com um perfil por linha) e as três ações da linha.
 *
 * Redesenhado, a pedido do operador: **onde cada uma dessas coisas aparece**. Ver o JSDoc
 * de `PermissoesPage` pro raciocínio inteiro — em uma frase, a referência põe um card de
 * empresa com N chips de local DENTRO de uma célula de tabela, e o resultado é uma linha
 * que cresce sem teto, com scroll próprio, sobre a qual não dá pra ordenar nem filtrar.
 *
 * ## ⚠️ "Padrão" é perfil, não ausência de perfil
 *
 * Na origem, um local sem perfil escolhido mostra o badge `PADRÃO` e o select diz
 * "Selecionar perfil" — ou seja, o rótulo existe pra um estado que o formulário trata como
 * vazio. Aqui ele é o quinto perfil, com efeito declarado: é o piso de leitura que vale
 * quando ninguém escolheu nada. Estado que produz comportamento e não aparece na tabela de
 * comportamentos é a definição de armadilha.
 *
 * ## Nada de dado pessoal real
 *
 * A referência lista e-mails de pessoas de verdade (gmail, hotmail, domínios de cliente).
 * Nenhum deles está aqui: os endereços apontam pro domínio do mock, como no resto do
 * projeto.
 */

/* ────────────────────────────────────────────────────────────────────────────
   Os perfis
   ──────────────────────────────────────────────────────────────────────────── */

export const PERFIS = [
  "administrador",
  "colaborador",
  "tecnico",
  "parceiro",
  "padrao",
] as const;

export type PerfilId = (typeof PERFIS)[number];

export interface Perfil {
  id: PerfilId;
  nome: string;
  /** O texto literal da "Legenda do Perfil de Acesso" da referência. */
  descricao: string;
  /** Uma linha sobre PRA QUEM o perfil é — o que a legenda da origem não diz. */
  paraQuem: string;
  /** Cor do chip. `Chip` do DS; `neutral` é o piso. */
  cor: "danger" | "primary" | "info" | "warning" | "neutral";
}

/**
 * Ordem = do mais poderoso pro menos. Não é alfabética de propósito: numa lista de perfis,
 * a pergunta é sempre "quem pode mais", e a resposta tem de ser a primeira linha.
 */
export const PERFIL: Record<PerfilId, Perfil> = {
  administrador: {
    id: "administrador",
    nome: "Administrador",
    descricao: "Acesso total a todas as funcionalidades e telas do CMS.",
    paraQuem: "Quem responde pela operação inteira e configura o sistema.",
    cor: "danger",
  },
  colaborador: {
    id: "colaborador",
    nome: "Colaborador",
    descricao:
      "Acesso focado em operação e atendimento, com restrições às telas de Configuração, Resumo, Financeiro e receitas na Performance.",
    paraQuem: "Quem atende o motorista no dia a dia.",
    cor: "primary",
  },
  tecnico: {
    id: "tecnico",
    nome: "Técnico",
    descricao:
      "Acesso técnico aos Carregadores, Smart MOB e Monitoramento, sem permissão para editar preços.",
    paraQuem: "Quem vai ao campo e mexe no equipamento.",
    cor: "info",
  },
  parceiro: {
    id: "parceiro",
    nome: "Parceiro",
    descricao:
      "Acesso limitado à operação, com permissão apenas para Monitoramento (sem estornos) e Transações.",
    paraQuem: "O dono do ponto, que acompanha o próprio local.",
    cor: "warning",
  },
  padrao: {
    id: "padrao",
    nome: "Padrão",
    descricao:
      "Leitura do Resumo e das Transações do local. É o que vale quando nenhum perfil é escolhido.",
    paraQuem: "Quem só precisa acompanhar números, sem agir.",
    cor: "neutral",
  },
};

/* ────────────────────────────────────────────────────────────────────────────
   A matriz de capacidade
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * O que um perfil pode num módulo.
 *
 * Três níveis e não dois porque a legenda da origem descreve os três: "acesso total",
 * "sem permissão para editar preços" (leitura) e "restrições às telas de Configuração"
 * (nenhum). Reduzir a ligado/desligado apagaria justamente as ressalvas, que são o que
 * distingue Técnico de Colaborador.
 */
export type Nivel = "total" | "leitura" | "nenhum";

export const ROTULO_DO_NIVEL: Record<Nivel, string> = {
  total: "Acesso total",
  leitura: "Somente leitura",
  nenhum: "Sem acesso",
};

export interface Modulo {
  id: string;
  nome: string;
  /**
   * Ressalvas que a legenda cita nominalmente — **por perfil**, não por módulo.
   *
   * ⚠️ Foi mapa e não string porque a 1ª versão era string e o checklist do Administrador
   * exibia "Colaborador não vê as receitas" na linha de Performance: verdade sobre OUTRO
   * perfil, mostrada no painel de quem não tem a restrição. Ressalva fora do contexto de
   * quem ela restringe é pior que ressalva ausente — ela sugere um limite que não existe.
   */
  ressalvas?: Partial<Record<PerfilId, string>>;
  niveis: Record<PerfilId, Nivel>;
}

/**
 * Os doze módulos do CMS × os cinco perfis.
 *
 * ⚠️ Esta tabela é DERIVADA dos quatro textos da legenda, não inventada: cada `nenhum` de
 * Colaborador corresponde a uma palavra da frase dele ("Configuração, Resumo, Financeiro"),
 * e o `leitura` de Preços no Técnico é o "sem permissão para editar preços" literal. O que
 * a legenda não menciona (Cupons, Motoristas, Gestão de Carga) foi resolvido pelo princípio
 * que ela estabelece — Parceiro só enxerga o próprio ponto, Técnico só toca em equipamento.
 *
 * É esta tabela que substitui o banner de legenda da referência: quatro parágrafos em prosa
 * não respondem "o Técnico vê o Financeiro?" sem que o leitor reconstrua a regra de cabeça.
 */
export const MODULOS: Modulo[] = [
  {
    id: "resumo",
    nome: "Resumo",
    niveis: {
      administrador: "total",
      colaborador: "nenhum",
      tecnico: "nenhum",
      parceiro: "nenhum",
      padrao: "leitura",
    },
  },
  {
    id: "transacoes",
    nome: "Transações",
    niveis: {
      administrador: "total",
      colaborador: "total",
      tecnico: "nenhum",
      parceiro: "leitura",
      padrao: "leitura",
    },
  },
  {
    id: "performance",
    nome: "Performance",
    ressalvas: { colaborador: "Sem as receitas." },
    niveis: {
      administrador: "total",
      colaborador: "leitura",
      tecnico: "nenhum",
      parceiro: "nenhum",
      padrao: "nenhum",
    },
  },
  {
    id: "financeiro",
    nome: "Financeiro",
    niveis: {
      administrador: "total",
      colaborador: "nenhum",
      tecnico: "nenhum",
      parceiro: "nenhum",
      padrao: "nenhum",
    },
  },
  {
    id: "monitoramento",
    nome: "Monitoramento",
    ressalvas: { parceiro: "Acompanha, mas não estorna." },
    niveis: {
      administrador: "total",
      colaborador: "total",
      tecnico: "total",
      parceiro: "leitura",
      padrao: "nenhum",
    },
  },
  {
    id: "carregadores",
    nome: "Carregadores",
    niveis: {
      administrador: "total",
      colaborador: "leitura",
      tecnico: "total",
      parceiro: "nenhum",
      padrao: "nenhum",
    },
  },
  {
    id: "smart-mob",
    nome: "Smart MOB",
    niveis: {
      administrador: "total",
      colaborador: "leitura",
      tecnico: "total",
      parceiro: "nenhum",
      padrao: "nenhum",
    },
  },
  {
    id: "gestao-carga",
    nome: "Gestão de Carga",
    niveis: {
      administrador: "total",
      colaborador: "leitura",
      tecnico: "total",
      parceiro: "nenhum",
      padrao: "nenhum",
    },
  },
  {
    id: "precos",
    nome: "Preços",
    ressalvas: { colaborador: "Consulta, mas não altera.", tecnico: "Consulta, mas não altera." },
    niveis: {
      administrador: "total",
      colaborador: "leitura",
      tecnico: "leitura",
      parceiro: "nenhum",
      padrao: "nenhum",
    },
  },
  {
    id: "cupons",
    nome: "Cupons",
    niveis: {
      administrador: "total",
      colaborador: "total",
      tecnico: "nenhum",
      parceiro: "nenhum",
      padrao: "nenhum",
    },
  },
  {
    id: "motoristas",
    nome: "Motoristas",
    niveis: {
      administrador: "total",
      colaborador: "total",
      tecnico: "nenhum",
      parceiro: "nenhum",
      padrao: "nenhum",
    },
  },
  {
    id: "configuracoes",
    nome: "Configurações",
    niveis: {
      administrador: "total",
      colaborador: "nenhum",
      tecnico: "nenhum",
      parceiro: "nenhum",
      padrao: "nenhum",
    },
  },
];

/** Quantos módulos o perfil alcança de algum jeito — o numerador da faixa do painel. */
export function modulosAlcancados(perfil: PerfilId): number {
  return MODULOS.filter((m) => m.niveis[perfil] !== "nenhum").length;
}

/* ────────────────────────────────────────────────────────────────────────────
   Os acessos concedidos
   ──────────────────────────────────────────────────────────────────────────── */

export const LOCAIS_DISPONIVEIS = Object.keys(GEO_DOS_LOCAIS);

export interface Acesso {
  id: string;
  email: string;
  /** `null` = convite enviado e ainda não aceito. A referência tem esse estado implícito. */
  nome: string | null;
  empresa: string;
  /**
   * Perfil POR LOCAL — é assim que a origem modela, e é o que torna a célula dela ilegível.
   *
   * Chave vazia nunca acontece: um acesso sem local nenhum não seria acesso. O caso
   * "todos os locais" é representado explicitamente, com as 17 chaves, e não por ausência —
   * diferente de Alertas, onde lista vazia significa cobertura total. Aqui cada local carrega
   * um perfil próprio, então não há como colapsar em "vazio = tudo" sem perder o perfil.
   */
  porLocal: Record<string, PerfilId>;
  /** ISO `YYYY-MM-DD`. */
  concedidoEm: string;
  /** ISO `YYYY-MM-DD`, ou `null` pra quem nunca entrou. */
  ultimoAcesso: string | null;
}

function comPerfilUnico(
  locais: string[],
  perfil: PerfilId,
): Record<string, PerfilId> {
  return Object.fromEntries(locais.map((l) => [l, perfil]));
}

/**
 * Sete acessos, e cada um existe por um estado de célula que sem ele nunca renderizaria.
 *
 * | acesso | o que exercita |
 * |---|---|
 * | Ana (administradora) | perfil único em TODOS os locais — o caso "acesso total" |
 * | Bruno | Colaborador em muitos locais, mas não em todos |
 * | Carla | **perfis MISTOS** — o caso que a referência não consegue mostrar |
 * | Diego | UM local só — o caso mínimo |
 * | Elisa | perfil Padrão, isto é, ninguém escolheu nada |
 * | Fábio | convite pendente: sem nome e sem último acesso |
 * | Gisele | Técnico em três locais, com último acesso antigo |
 */
export const ACESSOS: Acesso[] = [
  {
    id: "ac-1",
    email: "ana.prado@exemplo.com.br",
    nome: "Ana Prado",
    empresa: "PV MOB",
    porLocal: comPerfilUnico(LOCAIS_DISPONIVEIS, "administrador"),
    concedidoEm: "2025-02-11",
    ultimoAcesso: "2026-09-15",
  },
  {
    id: "ac-2",
    email: "bruno.tavares@exemplo.com.br",
    nome: "Bruno Tavares",
    empresa: "PV MOB",
    porLocal: comPerfilUnico(LOCAIS_DISPONIVEIS.slice(0, 9), "colaborador"),
    concedidoEm: "2025-06-03",
    ultimoAcesso: "2026-09-16",
  },
  {
    id: "ac-3",
    email: "carla.menezes@exemplo.com.br",
    nome: "Carla Menezes",
    empresa: "PV MOB",
    porLocal: {
      [LOCAIS_DISPONIVEIS[0]]: "administrador",
      [LOCAIS_DISPONIVEIS[1]]: "colaborador",
      [LOCAIS_DISPONIVEIS[4]]: "colaborador",
      [LOCAIS_DISPONIVEIS[7]]: "tecnico",
      [LOCAIS_DISPONIVEIS[11]]: "parceiro",
    },
    concedidoEm: "2025-09-22",
    ultimoAcesso: "2026-09-12",
  },
  {
    id: "ac-4",
    email: "diego.rocha@exemplo.com.br",
    nome: "Diego Rocha",
    empresa: "PV MOB",
    porLocal: { [LOCAIS_DISPONIVEIS[12]]: "parceiro" },
    concedidoEm: "2026-01-19",
    ultimoAcesso: "2026-09-10",
  },
  {
    id: "ac-5",
    email: "elisa.barros@exemplo.com.br",
    nome: "Elisa Barros",
    empresa: "PV MOB",
    porLocal: comPerfilUnico(LOCAIS_DISPONIVEIS.slice(2, 5), "padrao"),
    concedidoEm: "2026-03-07",
    ultimoAcesso: "2026-08-28",
  },
  {
    id: "ac-6",
    email: "fabio.andrade@exemplo.com.br",
    nome: null,
    empresa: "PV MOB",
    porLocal: comPerfilUnico(LOCAIS_DISPONIVEIS.slice(5, 7), "colaborador"),
    concedidoEm: "2026-09-14",
    ultimoAcesso: null,
  },
  {
    id: "ac-7",
    email: "gisele.nunes@exemplo.com.br",
    nome: "Gisele Nunes",
    empresa: "PV MOB",
    porLocal: comPerfilUnico(LOCAIS_DISPONIVEIS.slice(9, 12), "tecnico"),
    concedidoEm: "2025-11-30",
    ultimoAcesso: "2026-05-04",
  },
];

/* ────────────────────────────────────────────────────────────────────────────
   Derivações — tudo que a tabela mostra sai daqui, nada é campo guardado
   ──────────────────────────────────────────────────────────────────────────── */

export function locaisDoAcesso(a: Acesso): string[] {
  return Object.keys(a.porLocal);
}

/** Os perfis distintos que o acesso usa, do mais forte pro mais fraco. */
export function perfisDoAcesso(a: Acesso): PerfilId[] {
  const usados = new Set(Object.values(a.porLocal));
  return PERFIS.filter((p) => usados.has(p));
}

/**
 * O perfil que representa o acesso na linha da tabela, ou `null` quando há mais de um.
 *
 * ⚠️ `null` NÃO é "sem perfil" — é **misto**, e a distinção importa: sem perfil é um
 * problema de cadastro, misto é uma escolha deliberada. A célula tem de dizer coisas
 * diferentes nos dois casos, e por isso a função devolve `null` em vez de `"padrao"`.
 */
export function perfilPredominante(a: Acesso): PerfilId | null {
  const perfis = perfisDoAcesso(a);
  return perfis.length === 1 ? perfis[0] : null;
}

/**
 * O perfil mais forte que o acesso carrega em algum local.
 *
 * É o que a revisão de segurança pergunta: "quem é administrador em algum lugar?". Um
 * acesso misto com um único local de administrador é, na prática, um administrador — e a
 * coluna de perfil predominante, sozinha, esconde exatamente isso.
 */
export function perfilMaisForte(a: Acesso): PerfilId {
  return perfisDoAcesso(a)[0] ?? "padrao";
}

export function cobreTudo(a: Acesso): boolean {
  return locaisDoAcesso(a).length === LOCAIS_DISPONIVEIS.length;
}

/** `2026-09-15` → `15/09/2026`. Sem `Date`: fuso não tem o que fazer numa data pura. */
export function dataCurta(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export const PERMISSOES_TEXTOS = {
  aviso:
    "Quem entra no CMS, com qual perfil e em quais locais. O acesso vale por local — a mesma pessoa pode administrar um ponto e só acompanhar outro.",
  conceder: "Conceder acesso",
  verPerfis: "Perfis de acesso",
  revogarTitulo: "Revogar este acesso?",
  revogarDescricao:
    "a pessoa perde o acesso a todos os locais imediatamente. Conceder de novo depois exige refazer a escolha de perfil local a local.",
  ajudaDoEmail:
    "O acesso é concedido ao e-mail. Se ainda não houver conta, a pessoa recebe o convite e o acesso passa a valer quando ela entrar.",
  ajudaDoPerfil:
    "Escolha um perfil para aplicar aos locais marcados. Depois dá para trocar o perfil de um local específico na lista abaixo.",
  ajudaDosLocais:
    "Marque onde o acesso vale. Cada local guarda o próprio perfil, então a mesma pessoa pode ter papéis diferentes em pontos diferentes.",
} as const;
