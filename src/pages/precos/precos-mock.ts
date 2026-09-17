/**
 * Mock da tela de Preços — medida em `/pt/price?page=1` (2026-09-16).
 *
 * ## O que é medido
 *
 * **A lista:** as sete colunas (`Empresa · Local · Nome · Padrão · Recarga grátis · Tags ·
 * Ações`), os 10 locais da primeira página, `Perfil padrão` em Nome E em Padrão, `Sim`/`Não`
 * em Recarga grátis, `–` em Tags, e a paginação de 5 páginas (≈50 perfis).
 *
 * **O painel de edição**, inteiro — os prints cobrem as três abas: os três pares de opção do
 * cabeçalho, o preço da energia (`R$ 3 / kWh`), a cobrança por uso vazia, a taxa de ativação
 * (`R$ 3 / USO`, tolerância de `15` minutos), a ociosidade desligada, a visualização semanal
 * sem nenhuma regra, e o único carregador (`AC 7,4 KW · Cpcode 19171-1 · Offline`).
 *
 * **Os dois modais:** `Criar perfil de preço` e `Nova regra de cobrança`, com todos os
 * rótulos, placeholders e o texto do resumo.
 *
 * ## Duas colunas com o mesmo conteúdo é MEDIÇÃO
 *
 * `Nome` e `Padrão` trazem as duas `Perfil padrão` em todas as 10 linhas. Parece defeito e
 * pode ser um — mas é o que a referência mostra, e colapsar as duas numa aqui esconderia a
 * pergunta em vez de responder. Ver o comentário na coluna.
 *
 * ## O parque de locais é o MESMO de Gestão de Carga
 *
 * ⚠️ Os nomes abaixo repetem os de `gestao-carga-mock` e acrescentam os sete que só
 * apareceram aqui. São o mesmo parque no produto, e hoje ele está declarado duas vezes —
 * dívida conhecida: uma fonte compartilhada de locais é o certo, e o momento de extraí-la é
 * quando uma terceira tela pedir a mesma lista.
 */

/** Disponibilidade do carregador — os dois rótulos do par segmentado da origem. */
export type Disponibilidade = "disponivel" | "desativado";
/** Modo de cobrança — `Cobrança normal` / `Recarga grátis`. */
export type ModoDeCobranca = "normal" | "gratis";
/** Uso de cupons — `Permitir cupom` / `Bloquear cupom`. */
export type UsoDeCupons = "permitir" | "bloquear";

/** Dias da semana como a origem rotula, na ordem dela (domingo primeiro). */
export const DIAS_DA_SEMANA = [
  "Dom.",
  "Seg.",
  "Ter.",
  "Qua.",
  "Qui.",
  "Sex.",
  "Sáb.",
] as const;
export type DiaDaSemana = (typeof DIAS_DA_SEMANA)[number];

/**
 * Taxa de ativação (uso).
 *
 * `modo` é um ESCOLHA-UM entre tolerância e isenção — na origem são dois radios, não dois
 * campos independentes, e é o que faz sentido: os dois respondem "quando o usuário não paga
 * a ativação", por tempo ou por consumo.
 */
export interface TaxaDeAtivacao {
  ativa: boolean;
  /** R$ por uso. */
  valor: number;
  modo: "tolerancia" | "isencao";
  /** Minutos entre uma recarga e outra. Medido: `15`. */
  toleranciaMin: number;
  /** kWh mínimos pra isentar. */
  isencaoKwh: number;
}

/** Regra de cobrança por período — o que o modal `Nova regra de cobrança` cria. */
export interface RegraDeCobranca {
  id: string;
  /** `HH:MM`. */
  horaInicial: string;
  horaFinal: string;
  dias: DiaDaSemana[];
  disponibilidade: Disponibilidade;
  modoDeCobranca: ModoDeCobranca;
  usoDeCupons: UsoDeCupons;
  /** `null` = o tipo de cobrança está desligado na regra. */
  precoEnergia: number | null;
  usoDoCarregador: number | null;
  taxaDeAtivacao: number | null;
  toleranciaMin: number;
  isencaoKwh: number;
  ociosidade: number | null;
}

/** Carregador que usa o perfil — aba `Carregadores` do painel. */
export interface CarregadorDoPerfil {
  id: string;
  /** Nome do modelo, como a origem mostra: `AC 7,4 KW`. */
  nome: string;
  /** `Cpcode: 19171-1` — o identificador que se cola num chamado. */
  cpcode: string;
  status: "Online" | "Offline";
}

export interface PerfilDePreco {
  id: string;
  empresa: string;
  local: string;
  nome: string;
  /** Nome do perfil marcado como padrão do local. Medido igual ao `nome` em 10/10. */
  padrao: string;
  tags: string[];
  disponibilidade: Disponibilidade;
  modoDeCobranca: ModoDeCobranca;
  usoDeCupons: UsoDeCupons;
  /** R$/kWh. `null` = não configurado (o card fica no estado "clique para adicionar"). */
  precoEnergia: number | null;
  /** R$/hora. Medido `null` — o card aparece vazio na referência. */
  usoDoCarregador: number | null;
  taxaDeAtivacao: TaxaDeAtivacao;
  /** Taxa de ociosidade (overstay), R$/hora. `null` = switch desligado. */
  ociosidade: number | null;
  regras: RegraDeCobranca[];
  carregadores: CarregadorDoPerfil[];
}

/** Rótulo literal do perfil, em todas as linhas medidas. */
export const NOME_DO_PERFIL_PADRAO = "Perfil padrão";

/**
 * Locais com perfil de preço.
 *
 * Os **10 primeiros** são os medidos na primeira página, na ordem dela. Os sete seguintes
 * vieram das outras telas — juntos dão duas páginas, que é o que a tela precisa exercitar.
 */
const LOCAIS = [
  "PV MOB - Estacionamento Chale do Chopp",
  "IGREEN MOB - Montes Claros",
  "PV MOB - IATE TENIS CLUBE",
  "IGREEN MOB - Duo FOOD",
  "IGREEN MOB - Supermercado Mais Opção - Jaboticatubas",
  "IGREEN MOB - Rua Santa Juliana - Sete Lagoas",
  "IGREEN MOB - Pousada Flores da Mantiqueira",
  "IGREEN MOB - Restaurante Fazendinha Brumadinho MG",
  "IGREEN MOB - Arena 7 BH",
  "IGREEN MOB - MAPLE Monte Verde",
  "IGREEN MOB - Assis Plaza Shopping Assis",
  "IGREEN MOB - Boulevard Shopping Bauru",
  "IGREEN MOB - Chofferando",
  "IGREEN MOB - Colombo Park Shopping Colombo",
  "IGREEN MOB - Hotel Panorama Ipatinga",
  "IGREEN MOB - SEDE",
  "PV MOB - Estacionamento",
];

/**
 * ÍNDICES dos locais medidos com `Recarga grátis: Sim`.
 *
 * São dois: `Montes Claros` e `IATE TENIS CLUBE`. A coluna da lista é DERIVADA do
 * `modoDeCobranca` (ver `temRecargaGratis`), então ela não pode divergir do par segmentado
 * que o painel mostra — é o mesmo cuidado da potência em uso em Gestão de Carga.
 */
const COM_RECARGA_GRATIS = new Set([1, 2]);

/** PRNG determinístico — mesma semente, mesmo perfil. */
function prng(semente: number) {
  let s = semente;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/**
 * ÍNDICE do perfil que reproduz o painel MEDIDO nos prints.
 *
 * Os prints não dizem de qual local é o perfil que eles mostram, então ancoro no primeiro da
 * lista: é o que uma pessoa abre primeiro ao conferir a tela.
 */
export const INDICE_DO_PERFIL_MEDIDO = 0;

/**
 * Taxa de ativação MEDIDA: `R$ 3 / USO`, no modo tolerância, `15` minutos.
 */
export const ATIVACAO_MEDIDA: TaxaDeAtivacao = {
  ativa: true,
  valor: 3,
  modo: "tolerancia",
  toleranciaMin: 15,
  isencaoKwh: 0,
};

/** Carregador MEDIDO na aba `Carregadores` do perfil dos prints. */
export const CARREGADOR_MEDIDO: CarregadorDoPerfil = {
  id: "cp-19171-1",
  nome: "AC 7,4 KW",
  cpcode: "19171-1",
  status: "Offline",
};

/** Modelos de carregador que o mock distribui pelos outros perfis. */
const MODELOS = ["AC 7,4 KW", "AC 22 KW", "DC 60 KW", "AC 11 KW"];

/**
 * Tags de perfil.
 *
 * ⚠️ **NÃO MEDIDO.** A referência mostra `–` nas 10 linhas da primeira página — nenhum perfil
 * tinha tag. Três perfis daqui recebem tag, pelo mesmo motivo que a rede de Gestão de Carga
 * não ficou toda ociosa: uma coluna inteira de `–` não exercita nem o render da célula nem o
 * `Tags:` do cabeçalho do painel. Os nomes descrevem a CLASSE do local, não inventam
 * campanha comercial.
 */
const TAGS_POSSIVEIS = [["Shopping"], ["Frota"], ["Hotel", "Parceiro"]];

function regrasDerivadas(id: string, rnd: () => number): RegraDeCobranca[] {
  const quantas = Math.floor(rnd() * 3);
  return Array.from({ length: quantas }, (_, i) => {
    const inicio = 6 + Math.floor(rnd() * 12);
    const duracao = 2 + Math.floor(rnd() * 6);
    const gratis = rnd() < 0.3;
    const desativado = rnd() < 0.15;
    /* Sempre pelo menos um dia: regra de zero dias é a que a origem resume como "aplicada em
       nenhum dia" — verdadeira, mas é estado de rascunho, não de regra salva. */
    const dias = DIAS_DA_SEMANA.filter(() => rnd() < 0.5);
    return {
      id: `${id}-r${i}`,
      horaInicial: `${String(inicio).padStart(2, "0")}:00`,
      horaFinal: `${String(Math.min(inicio + duracao, 23)).padStart(2, "0")}:00`,
      dias: dias.length ? dias : [DIAS_DA_SEMANA[1]],
      disponibilidade: desativado ? "desativado" : "disponivel",
      modoDeCobranca: gratis ? "gratis" : "normal",
      usoDeCupons: rnd() < 0.8 ? "permitir" : "bloquear",
      /* Recarga grátis não tem preço de energia — o modo de cobrança manda no que existe. */
      precoEnergia: gratis ? null : Number((2 + rnd() * 2).toFixed(2)),
      usoDoCarregador: rnd() < 0.3 ? Number((4 + rnd() * 6).toFixed(2)) : null,
      taxaDeAtivacao: gratis ? null : rnd() < 0.5 ? 3 : null,
      toleranciaMin: 15,
      isencaoKwh: 0,
      ociosidade: rnd() < 0.25 ? Number((8 + rnd() * 12).toFixed(2)) : null,
    };
  });
}

export const PERFIS_DE_PRECO: PerfilDePreco[] = LOCAIS.map((local, i) => {
  const id = `perfil-${i}`;
  const rnd = prng(80 + i * 37);
  const medido = i === INDICE_DO_PERFIL_MEDIDO;
  const gratis = COM_RECARGA_GRATIS.has(i);

  if (medido) {
    /* O perfil âncora vem INTEIRO dos prints, sem passar pela derivação. */
    return {
      id,
      empresa: "PV MOB",
      local,
      nome: NOME_DO_PERFIL_PADRAO,
      padrao: NOME_DO_PERFIL_PADRAO,
      tags: [],
      disponibilidade: "disponivel",
      modoDeCobranca: "normal",
      usoDeCupons: "permitir",
      precoEnergia: 3,
      /* Medido VAZIO: o card aparece no estado "Clique para adicionar". */
      usoDoCarregador: null,
      taxaDeAtivacao: ATIVACAO_MEDIDA,
      /* Switch da ociosidade desligado na referência. */
      ociosidade: null,
      /* `Nenhuma regra encontrada.` — a visualização semanal estava vazia. */
      regras: [],
      carregadores: [CARREGADOR_MEDIDO],
    };
  }

  return {
    id,
    empresa: "PV MOB",
    local,
    nome: NOME_DO_PERFIL_PADRAO,
    padrao: NOME_DO_PERFIL_PADRAO,
    tags: i % 5 === 3 ? TAGS_POSSIVEIS[i % TAGS_POSSIVEIS.length] : [],
    disponibilidade: rnd() < 0.9 ? "disponivel" : "desativado",
    modoDeCobranca: gratis ? "gratis" : "normal",
    usoDeCupons: rnd() < 0.85 ? "permitir" : "bloquear",
    /* Recarga grátis não cobra energia — o painel esconde o preço, e guardar um valor aqui
       criaria um número que a tela nunca mostra e que alguém leria num debug. */
    precoEnergia: gratis ? null : Number((2.5 + rnd() * 2).toFixed(2)),
    usoDoCarregador: rnd() < 0.35 ? Number((5 + rnd() * 5).toFixed(2)) : null,
    taxaDeAtivacao: {
      ativa: !gratis && rnd() < 0.7,
      valor: 3,
      modo: rnd() < 0.7 ? "tolerancia" : "isencao",
      toleranciaMin: 15,
      isencaoKwh: 5,
    },
    ociosidade: rnd() < 0.3 ? Number((10 + rnd() * 20).toFixed(2)) : null,
    regras: gratis ? [] : regrasDerivadas(id, rnd),
    carregadores: Array.from(
      { length: 1 + Math.floor(rnd() * 3) },
      (_, c) => ({
        id: `${id}-cp${c}`,
        nome: MODELOS[Math.floor(rnd() * MODELOS.length)],
        /* Formato da origem: `19171-1` — número do carregador e do conector. */
        cpcode: `${19000 + Math.floor(rnd() * 900)}-${c + 1}`,
        status: rnd() < 0.5 ? "Online" : ("Offline" as const),
      }),
    ),
  };
});

/**
 * Recarga grátis, para a coluna da lista.
 *
 * DERIVADA do modo de cobrança, não um campo solto: é o mesmo dado visto de dois lugares, e
 * dois campos divergiriam no primeiro perfil que alguém editasse. Invariante testada.
 */
export function temRecargaGratis(p: PerfilDePreco): boolean {
  return p.modoDeCobranca === "gratis";
}

/**
 * Resumo da regra, como a origem escreve — o texto do card verde no fim do modal.
 *
 * ⚠️ **O "nenhum dia" é literal da referência, e é honesto.** Com nenhum dia marcado a regra
 * não se aplica a dia nenhum, e é exatamente isso que o resumo precisa dizer — trocar por
 * "todos os dias" seria inventar um default que o formulário não tem, e alguém salvaria uma
 * regra achando que ela vale sempre.
 */
export function resumoDaRegra(r: {
  dias: DiaDaSemana[];
  horaInicial: string;
  horaFinal: string;
  modoDeCobranca: ModoDeCobranca;
  usoDeCupons: UsoDeCupons;
  precoEnergia: number | null;
  usoDoCarregador: number | null;
  taxaDeAtivacao: number | null;
  ociosidade: number | null;
}): string {
  const dias = r.dias.length
    ? r.dias.length === DIAS_DA_SEMANA.length
      ? "todos os dias"
      : r.dias.join(", ")
    : "nenhum dia";

  /**
   * ⚠️ **Recarga grátis zera as cobranças no resumo — MEDIDO na tela, não suposto.**
   *
   * Os quatro switches de tipo de cobrança são independentes do par `Modo de cobrança`, e
   * nada no formulário impede ligar "Preço da energia R$ 3" com "Recarga grátis". Medido
   * aqui: o resumo saía *"com recarga grátis. Cobranças: Energia … Valor base: R$ 3,00/kWh"*
   * — uma frase que se contradiz no meio, e é justamente a frase que a pessoa lê pra decidir
   * se salva.
   *
   * O modo de cobrança manda: grátis é grátis. É a mesma regra que o mock aplica aos perfis
   * (`precoEnergia: null` quando `gratis`), agora também no texto.
   */
  const gratis = r.modoDeCobranca === "gratis";

  const cobrancas = gratis
    ? []
    : [
        r.precoEnergia !== null && "Energia",
        r.usoDoCarregador !== null && "Uso do carregador",
        r.taxaDeAtivacao !== null && "Taxa de ativação",
        r.ociosidade !== null && "Ociosidade",
      ].filter(Boolean);

  const base =
    !gratis && r.precoEnergia !== null
      ? ` Valor base: ${r.precoEnergia.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}/kWh.`
      : "";

  return [
    `Esta regra será aplicada em ${dias}, das ${r.horaInicial} às ${r.horaFinal},`,
    ` com ${gratis ? "recarga grátis" : "cobrança normal"}.`,
    cobrancas.length ? ` Cobranças: ${cobrancas.join(", ")}.` : " Sem cobranças.",
    base,
    r.usoDeCupons === "permitir" ? " Cupons permitidos." : " Cupons bloqueados.",
  ].join("");
}

/* ── Textos literais da referência ──────────────────────────────────────────────── */

/**
 * Aviso que repete embaixo de CADA card de taxa.
 *
 * Repete porque cada card salva sozinho: é o aviso do botão `Salvar alterações` que está
 * logo abaixo dele, não um aviso da tela. Mostrá-lo uma vez no topo diria que um salvar
 * único sincroniza tudo — e não é o que os três botões fazem.
 */
export const AVISO_SINCRONIZAR =
  "As regras acima serão aplicadas automaticamente para todos os locais onde este perfil de preço está ativo. Certifique-se de salvar as alterações para sincronizar com os carregadores.";

export const VAZIO_TAGS = "Sem tags vinculadas";
export const VAZIO_REGRAS = "Nenhuma regra encontrada.";
export const AJUDA_TAGS =
  "Digite uma tag e pressione Enter. Use o X para remover um item da lista.";
export const SUB_PERIODOS =
  "Ao configurar, suas cobranças serão personalizadas para dias e horários específicos";
export const SUB_VISUALIZACAO =
  "Resumo visual das regras configuradas ao longo da semana.";

/**
 * Confirmações dos três pares de opção do painel — **as seis trocas possíveis**.
 *
 * ## Por que os dois sentidos, e não só o "desligar"
 *
 * As três opções mudam o comportamento de equipamento em campo e valem pro perfil INTEIRO,
 * ou seja, pra todos os carregadores vinculados a ele. Não há um lado inofensivo: ligar
 * recarga grátis deixa de cobrar de todo mundo, e voltar a cobrar surpreende quem estava
 * carregando de graça. Um clique num par de botões é barato demais pra qualquer um dos seis.
 *
 * A nota de reversibilidade é literal do print e é verdadeira nas seis: o medo de errar é o
 * que faz alguém não mexer numa configuração que precisa mexer.
 *
 * ⚠️ Cada texto descreve o EFEITO, não repete o rótulo do botão. "Desativar carregadores?"
 * seguido de "os carregadores ficarão desativados" seria a mesma frase duas vezes; o que a
 * pessoa precisa ler é o que muda pro motorista que chega no local.
 */
export const NOTA_REVERSIVEL = "Fique tranquilo, esta ação é reversível.";

export const CONFIRMACOES = {
  disponibilidade: {
    desativado: {
      titulo: "Desativar carregadores?",
      descricao:
        "Os carregadores vinculados a este perfil ficarão desativados e indisponíveis para uso.",
    },
    disponivel: {
      titulo: "Ativar carregadores?",
      descricao:
        "Os carregadores vinculados a este perfil voltarão a aceitar recargas.",
    },
  },
  cobranca: {
    gratis: {
      titulo: "Ativar recarga grátis?",
      descricao:
        "As recargas deste perfil deixarão de ser cobradas — energia, ativação e ociosidade.",
    },
    normal: {
      titulo: "Voltar a cobrar?",
      descricao:
        "As taxas configuradas neste perfil voltarão a ser aplicadas nas recargas.",
    },
  },
  cupons: {
    bloquear: {
      titulo: "Bloquear cupons?",
      descricao:
        "Os motoristas não poderão aplicar cupons de desconto nas recargas deste perfil.",
    },
    permitir: {
      titulo: "Permitir cupons?",
      descricao:
        "Os motoristas poderão aplicar cupons de desconto nas recargas deste perfil.",
    },
  },
} as const;
