import { GEO_DOS_LOCAIS } from "~/pages/monitoramento/monitoramento-mock";

/**
 * Leads de recarga — dados e regras.
 *
 * ## O que esta tela é, e o que ela não é
 *
 * Quando alguém toca em "Carregar aqui" no app, vira um lead do licenciado. Hoje isso
 * dispara uma mensagem de WhatsApp e acaba: não existe lista, não dá para filtrar por
 * data, não fica registro de quem foi contatado. A tela existe para dar as três coisas.
 *
 * ⚠️ **Não é um funil de vendas.** O benchmark de 29/09 (`docs/2026-09-29-benchmark-leads-de-recarga.md`)
 * mediu o que decide a forma: contatar em 5 minutos em vez de 30 multiplica por 21 a
 * chance de qualificar o lead. O trabalho do licenciado quando um lead chega é um só —
 * falar com a pessoa, rápido. Kanban convida a arrumar cartões; **lista ordenada por
 * prazo diz quem é o próximo.** Por isso a visão que abre é "Precisa de ação", e o board
 * é a segunda visão, não a primeira.
 *
 * ## ⚠️ Duas regras de atribuição em conflito — ninguém decidiu ainda
 *
 * | Fonte | Quem fica com o lead |
 * |---|---|
 * | `01-contexts/igreen/conexao-mobi/CONTEXT.md` ✅ | quem **cadastrou o motorista** |
 * | Regra recebida do time de produto | quem **comercializou o eletroposto** |
 *
 * São pessoas diferentes. Pela primeira, a tela lista "motoristas que eu trouxe"; pela
 * segunda, "quem recarregou no meu posto" — e aí o mesmo motorista pode virar lead de
 * vários licenciados ao mesmo tempo.
 *
 * **Este mock assume a segunda** (lead nasce do posto), porque é a regra que chegou por
 * escrito e porque o CMS é o console de quem opera o posto. A escolha muda quais LINHAS
 * existem, não quais COLUNAS — então a tela serve para as duas enquanto a decisão não vem.
 * É a dúvida D1 do benchmark, marcada como P0.
 *
 * ## A janela de 7 dias é PRAZO, não inatividade
 *
 * O Pipedrive tem a mecânica mais parecida do mercado ("rotting"), e ela é diferente da
 * nossa: lá o relógio mede tempo sem atividade e **qualquer contato zera o contador**.
 * Aqui o prazo corre do pré-cadastro e **contato nenhum estende** — só concluir a recarga
 * ou ativar outra conexão encerra a janela, convertendo.
 *
 * Por isso `diasRestantes` olha só para `criadoEm`, e é de propósito. Copiar o rótulo do
 * Pipedrive ("parado há 4 dias") diria a coisa errada: o certo é "expira em 3 dias".
 *
 * ## Nada aqui é dado de gente real
 *
 * Nome, telefone e valor são fictícios e determinísticos. Telefone segue o gerador dos
 * outros mocks (DDD de MG/SP, prefixo 9). `leads-mock.test.ts` reprova se entrar
 * e-mail de domínio real ou telefone fora do padrão fictício.
 */

/** O prazo da janela de fidelização, em dias corridos. 🟡 Placeholder até a iGreen decidir. */
export const JANELA_EM_DIAS = 7;

/**
 * "Agora" congelado.
 *
 * Toda a tela deriva prazo desta data. Com `new Date()` os testes quebrariam sozinhos no
 * dia seguinte e as faixas de prazo mudariam de cor sem ninguém mexer em nada.
 */
export const HOJE = new Date("2026-09-29T14:00:00Z");

/* ─── Tipos ──────────────────────────────────────────────────────────────── */

/**
 * Os cinco estados.
 *
 * Os oito padrão do HubSpot (`New`, `Attempted to Contact`, `Connected`, `Open Deal`,
 * `In Progress`, `Open`, `Unqualified`, `Bad Timing`) existem para time com papéis
 * separados — e dois deles, `Open` e `In Progress`, nem o material do próprio HubSpot
 * distingue bem. Aqui é uma pessoa só trabalhando os leads dela; cada estado a mais é uma
 * decisão a mais na hora errada.
 *
 * ⚠️ `expirado` **não está aqui de propósito**: é derivado do prazo, não declarado. Um
 * estado armazenado que depende do relógio fica velho no banco. Ver `estadoEfetivo`.
 */
export type EstadoDoLead =
  | "novo"
  | "tentei-contato"
  | "em-conversa"
  | "convertido"
  | "perdido";

/** O estado como a TELA mostra — os cinco mais o derivado do relógio. */
export type EstadoVisivel = EstadoDoLead | "expirado";

/**
 * Os produtos iGreen que um cliente pode ter.
 *
 * ⚠️ **MOB não está na lista**, e não é esquecimento: recarga é serviço, não produto de
 * assinatura — ninguém paga para ter acesso. O que se vende ao lead é o que está aqui.
 */
export type ProdutoIGreen = "energia" | "seguros" | "telecom" | "placas";

export const PRODUTO_LABEL: Record<ProdutoIGreen, string> = {
  energia: "Energia",
  seguros: "Seguros",
  telecom: "Telecom",
  placas: "Placas",
};

export const TODOS_OS_PRODUTOS: ProdutoIGreen[] = [
  "energia",
  "seguros",
  "telecom",
  "placas",
];

/** Como o contato terminou. É isto que muda o estado, não o clique no botão. */
export type ResultadoDoContato = "sem-resposta" | "respondeu" | "recusou";

export interface Contato {
  id: string;
  /** ISO. */
  quando: string;
  canal: "whatsapp" | "ligacao" | "presencial";
  resultado: ResultadoDoContato;
  nota?: string;
}

export interface Lead {
  id: string;
  cliente: string;
  /** Só dígitos, com DDI. É o formato que o `wa.me` exige. */
  telefone: string;
  /** Chave de `GEO_DOS_LOCAIS` — o posto onde a pessoa tocou em "Carregar aqui". */
  local: string;
  /** ISO. Início da janela de 7 dias. */
  criadoEm: string;
  /** A recarga que originou o lead. `concluida` é o que formaliza a atribuição. */
  recarga: { concluida: boolean; valor: number; kwh: number };
  /** Produtos iGreen que a pessoa JÁ tem. Pode ser vazio. */
  produtos: ProdutoIGreen[];
  estado: EstadoDoLead;
  /** Histórico, do mais antigo para o mais recente. */
  contatos: Contato[];
  /** Preenchido quando `estado === "convertido"`. */
  converteuEm?: ProdutoIGreen;
  /** Preenchido quando `estado === "perdido"`. */
  motivoDaPerda?: string;
}

/* ─── Geradores fictícios ────────────────────────────────────────────────── */

/** PRNG determinístico — mesmo idiom dos outros mocks do projeto. */
function prng(semente: number) {
  let s = semente;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/**
 * Telefone fictício em formato `wa.me`: DDI + DDD + 9 + oito dígitos, só números.
 *
 * ⚠️ Sem máscara aqui, ao contrário do mock de Motoristas, que guarda os dois formatos
 * de propósito. Aqui o valor armazenado alimenta o link do WhatsApp, que **não aceita**
 * parêntese, traço nem espaço. A máscara é assunto de exibição — ver `telefoneLegivel`.
 */
function telefoneFicticio(rnd: () => number): string {
  const ddds = [31, 32, 34, 35, 37, 11, 19];
  const ddd = ddds[Math.floor(rnd() * ddds.length)];
  const p1 = 90000 + Math.floor(rnd() * 9999);
  const p2 = 1000 + Math.floor(rnd() * 8999);
  return `55${ddd}${p1}${p2}`;
}

/** `5531988881234` → `(31) 98888-1234`. Só para ler; o link usa o cru. */
export function telefoneLegivel(tel: string): string {
  const semDdi = tel.replace(/^55/, "");
  const ddd = semDdi.slice(0, 2);
  const corpo = semDdi.slice(2);
  return `(${ddd}) ${corpo.slice(0, 5)}-${corpo.slice(5)}`;
}

const LOCAIS = Object.keys(GEO_DOS_LOCAIS);

/** ISO de N dias atrás, contado de `HOJE`. */
function diasAtras(n: number, hora = 10): string {
  const d = new Date(HOJE);
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(hora, 0, 0, 0);
  return d.toISOString();
}

/* ─── Os leads ───────────────────────────────────────────────────────────── */

/**
 * Dezesseis leads, escritos à mão.
 *
 * Não são gerados em massa de propósito: cada linha existe para exercitar um estado da
 * tela que sem ela nunca renderizaria. A coluna `por que existe` é o teste de que a
 * tabela aguenta o caso, não enfeite.
 *
 * | # | por que existe |
 * |---|---|
 * | 1-3 | **Novo dentro do prazo** — o caso comum, e o que a visão padrão mostra primeiro |
 * | 4 | **Novo expirando HOJE** — a faixa de perigo, e o KPI de 48h |
 * | 5 | **Novo com zero produtos** — a maior oportunidade e a coluna vazia |
 * | 6 | **Novo com os quatro produtos** — a linha mais cheia, e a menor oportunidade |
 * | 7-8 | **Tentei contato** — tem histórico mas ninguém respondeu |
 * | 9-10 | **Em conversa** — respondeu, prazo ainda correndo |
 * | 11-12 | **Convertido** — vem do FATO (recarga paga / produto ativado), não de declaração |
 * | 13 | **Perdido com motivo** — recusa explícita antes do prazo |
 * | 14-15 | **Expirado** — a janela fechou sem conversão. Sai da visão padrão |
 * | 16 | **Recarga NÃO concluída** — clicou em carregar e não pagou; pela regra a atribuição nem se formalizou |
 */
export const LEADS: Lead[] = [
  {
    id: "LD-0016",
    cliente: "Marina Alencar",
    telefone: telefoneFicticio(prng(9101)),
    local: LOCAIS[0],
    criadoEm: diasAtras(0, 12),
    recarga: { concluida: true, valor: 48.9, kwh: 19.56 },
    produtos: ["energia"],
    estado: "novo",
    contatos: [],
  },
  {
    id: "LD-0015",
    cliente: "Rafael Quintino",
    telefone: telefoneFicticio(prng(9102)),
    local: LOCAIS[1],
    criadoEm: diasAtras(1, 9),
    recarga: { concluida: true, valor: 31.2, kwh: 12.48 },
    produtos: ["telecom"],
    estado: "novo",
    contatos: [],
  },
  {
    id: "LD-0014",
    cliente: "Beatriz Camargo",
    telefone: telefoneFicticio(prng(9103)),
    local: LOCAIS[2],
    criadoEm: diasAtras(2, 17),
    recarga: { concluida: true, valor: 76.4, kwh: 30.56 },
    produtos: ["energia", "seguros"],
    estado: "novo",
    contatos: [],
  },
  {
    /* Expira HOJE: é esta linha que acende o KPI de 48h e a faixa de perigo. */
    id: "LD-0013",
    cliente: "Hugo Bettencourt",
    telefone: telefoneFicticio(prng(9104)),
    local: LOCAIS[3],
    criadoEm: diasAtras(7, 8),
    recarga: { concluida: true, valor: 22.75, kwh: 9.1 },
    produtos: ["placas"],
    estado: "novo",
    contatos: [],
  },
  {
    /* Zero produtos: a maior oportunidade da lista, e a célula vazia da coluna Produtos. */
    id: "LD-0012",
    cliente: "Solange Pedrosa",
    telefone: telefoneFicticio(prng(9105)),
    local: LOCAIS[4],
    criadoEm: diasAtras(3, 15),
    recarga: { concluida: true, valor: 58.0, kwh: 23.2 },
    produtos: [],
    estado: "novo",
    contatos: [],
  },
  {
    /* Os quatro produtos: fácil de abordar, e quase nada sobrou para vender. É o caso que
       mostra por que "temperatura" num número só não serve — ver o JSDoc de `leads-ui`. */
    id: "LD-0011",
    cliente: "Antônio Vilaça",
    telefone: telefoneFicticio(prng(9106)),
    local: LOCAIS[5],
    criadoEm: diasAtras(4, 11),
    recarga: { concluida: true, valor: 91.3, kwh: 36.52 },
    produtos: ["energia", "seguros", "telecom", "placas"],
    estado: "novo",
    contatos: [],
  },
  {
    id: "LD-0010",
    cliente: "Juliana Tavares",
    telefone: telefoneFicticio(prng(9107)),
    local: LOCAIS[6],
    criadoEm: diasAtras(2, 8),
    recarga: { concluida: true, valor: 44.1, kwh: 17.64 },
    produtos: ["energia"],
    estado: "tentei-contato",
    contatos: [
      {
        id: "c-1001",
        quando: diasAtras(1, 14),
        canal: "whatsapp",
        resultado: "sem-resposta",
        nota: "Mandei no WhatsApp, não visualizou.",
      },
    ],
  },
  {
    id: "LD-0009",
    cliente: "Cristiano Bahia",
    telefone: telefoneFicticio(prng(9108)),
    local: LOCAIS[7],
    criadoEm: diasAtras(5, 16),
    recarga: { concluida: true, valor: 67.8, kwh: 27.12 },
    produtos: [],
    estado: "tentei-contato",
    contatos: [
      { id: "c-1002", quando: diasAtras(4, 10), canal: "whatsapp", resultado: "sem-resposta" },
      {
        id: "c-1003",
        quando: diasAtras(2, 18),
        canal: "ligacao",
        resultado: "sem-resposta",
        nota: "Caixa postal nas duas tentativas.",
      },
    ],
  },
  {
    id: "LD-0008",
    cliente: "Patrícia Rezende",
    telefone: telefoneFicticio(prng(9109)),
    local: LOCAIS[8],
    criadoEm: diasAtras(3, 9),
    recarga: { concluida: true, valor: 52.6, kwh: 21.04 },
    produtos: ["telecom"],
    estado: "em-conversa",
    contatos: [
      { id: "c-1004", quando: diasAtras(2, 11), canal: "whatsapp", resultado: "sem-resposta" },
      {
        id: "c-1005",
        quando: diasAtras(1, 15),
        canal: "whatsapp",
        resultado: "respondeu",
        nota: "Quer saber de Energia. Vou mandar a simulação amanhã.",
      },
    ],
  },
  {
    id: "LD-0007",
    cliente: "Eduardo Mascarenhas",
    telefone: telefoneFicticio(prng(9110)),
    local: LOCAIS[9],
    criadoEm: diasAtras(6, 13),
    recarga: { concluida: true, valor: 38.4, kwh: 15.36 },
    produtos: ["energia", "placas"],
    estado: "em-conversa",
    contatos: [
      {
        id: "c-1006",
        quando: diasAtras(5, 9),
        canal: "ligacao",
        resultado: "respondeu",
        nota: "Pediu para retomar depois do dia 30.",
      },
    ],
  },
  {
    id: "LD-0006",
    cliente: "Larissa Fontoura",
    telefone: telefoneFicticio(prng(9111)),
    local: LOCAIS[10],
    criadoEm: diasAtras(4, 10),
    recarga: { concluida: true, valor: 83.2, kwh: 33.28 },
    produtos: ["energia", "seguros"],
    estado: "convertido",
    converteuEm: "seguros",
    contatos: [
      { id: "c-1007", quando: diasAtras(3, 12), canal: "whatsapp", resultado: "respondeu" },
      {
        id: "c-1008",
        quando: diasAtras(1, 16),
        canal: "presencial",
        resultado: "respondeu",
        nota: "Fechou o seguro auto na loja.",
      },
    ],
  },
  {
    id: "LD-0005",
    cliente: "Wilson Prates",
    telefone: telefoneFicticio(prng(9112)),
    local: LOCAIS[11],
    criadoEm: diasAtras(6, 8),
    recarga: { concluida: true, valor: 29.9, kwh: 11.96 },
    produtos: ["telecom"],
    estado: "convertido",
    converteuEm: "telecom",
    contatos: [
      {
        id: "c-1009",
        quando: diasAtras(5, 14),
        canal: "whatsapp",
        resultado: "respondeu",
        nota: "Migrou o plano da família.",
      },
    ],
  },
  {
    id: "LD-0004",
    cliente: "Gustavo Sanhudo",
    telefone: telefoneFicticio(prng(9113)),
    local: LOCAIS[12],
    criadoEm: diasAtras(5, 11),
    recarga: { concluida: true, valor: 61.5, kwh: 24.6 },
    produtos: ["energia"],
    estado: "perdido",
    motivoDaPerda: "Já tem contrato com outra distribuidora até 2028.",
    contatos: [
      {
        id: "c-1010",
        quando: diasAtras(4, 17),
        canal: "ligacao",
        resultado: "recusou",
        nota: "Pediu para não receber mais ofertas.",
      },
    ],
  },
  {
    /* Expirados: a janela fechou sem conversão. Saem da visão padrão e continuam em Todos. */
    id: "LD-0003",
    cliente: "Renata Bicalho",
    telefone: telefoneFicticio(prng(9114)),
    local: LOCAIS[13],
    criadoEm: diasAtras(9, 10),
    recarga: { concluida: true, valor: 35.7, kwh: 14.28 },
    produtos: [],
    estado: "tentei-contato",
    contatos: [
      { id: "c-1011", quando: diasAtras(8, 15), canal: "whatsapp", resultado: "sem-resposta" },
    ],
  },
  {
    id: "LD-0002",
    cliente: "Fábio Penido",
    telefone: telefoneFicticio(prng(9115)),
    local: LOCAIS[14],
    criadoEm: diasAtras(12, 9),
    recarga: { concluida: true, valor: 47.3, kwh: 18.92 },
    produtos: ["placas"],
    estado: "novo",
    contatos: [],
  },
  {
    /* Recarga NÃO concluída: a pessoa tocou em carregar e não pagou. Pela regra recebida a
       atribuição só se formaliza no pagamento — então este lead existe, aparece, e a tela
       precisa dizer que ele é mais frágil que os outros. */
    id: "LD-0001",
    cliente: "Tereza Guimarães",
    telefone: telefoneFicticio(prng(9116)),
    local: LOCAIS[15],
    criadoEm: diasAtras(1, 19),
    recarga: { concluida: false, valor: 0, kwh: 0 },
    produtos: ["seguros"],
    estado: "novo",
    contatos: [],
  },
];

/* ─── Derivações ─────────────────────────────────────────────────────────── */

/** Dias inteiros entre duas datas, positivo quando `fim` é depois de `inicio`. */
function diferencaEmDias(inicio: Date, fim: Date): number {
  const MS = 24 * 60 * 60 * 1000;
  const a = Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth(), inicio.getUTCDate());
  const b = Date.UTC(fim.getUTCFullYear(), fim.getUTCMonth(), fim.getUTCDate());
  return Math.round((b - a) / MS);
}

/**
 * Quantos dias ainda restam da janela. Negativo = já passou.
 *
 * ⚠️ Olha **só** para `criadoEm`. Contato não estende o prazo — é a diferença entre a
 * nossa regra e o "rotting" do Pipedrive, onde qualquer atividade zera o contador.
 */
export function diasRestantes(lead: Lead, agora: Date = HOJE): number {
  return JANELA_EM_DIAS - diferencaEmDias(new Date(lead.criadoEm), agora);
}

/** A janela acabou sem conversão? Convertido e perdido não expiram — já terminaram. */
export function expirado(lead: Lead, agora: Date = HOJE): boolean {
  if (lead.estado === "convertido" || lead.estado === "perdido") return false;
  return diasRestantes(lead, agora) < 0;
}

/**
 * O estado que a tela mostra.
 *
 * `expirado` é derivado aqui, e não gravado no lead, porque depende do relógio: um estado
 * armazenado que depende do tempo fica velho no banco e passa a mentir sem ninguém tocar
 * em nada.
 */
export function estadoEfetivo(lead: Lead, agora: Date = HOJE): EstadoVisivel {
  return expirado(lead, agora) ? "expirado" : lead.estado;
}

export const ESTADO_LABEL: Record<EstadoVisivel, string> = {
  novo: "Novo",
  "tentei-contato": "Tentei contato",
  "em-conversa": "Em conversa",
  convertido: "Convertido",
  perdido: "Perdido",
  expirado: "Expirado",
};

/** A ordem do trabalho, não a alfabética. Usada para ordenar a coluna Estado. */
export const ORDEM_DOS_ESTADOS: EstadoVisivel[] = [
  "novo",
  "tentei-contato",
  "em-conversa",
  "convertido",
  "perdido",
  "expirado",
];

/** As faixas do prazo. Governa a cor e o peso do texto na célula. */
export type FaixaDoPrazo = "tranquilo" | "atencao" | "perigo" | "expirado" | "encerrado";

export function faixaDoPrazo(lead: Lead, agora: Date = HOJE): FaixaDoPrazo {
  if (lead.estado === "convertido" || lead.estado === "perdido") return "encerrado";
  const dias = diasRestantes(lead, agora);
  if (dias < 0) return "expirado";
  if (dias <= 1) return "perigo";
  if (dias <= 3) return "atencao";
  return "tranquilo";
}

/**
 * O texto do prazo.
 *
 * ⚠️ "expira em", nunca "parado há". A frase carrega o significado: prazo de validade é
 * do contrato, tempo sem atividade é culpa de quem não agiu. Trocar o rótulo trocaria a
 * mensagem, e a nossa regra é a primeira.
 */
export function rotuloDoPrazo(lead: Lead, agora: Date = HOJE): string {
  if (lead.estado === "convertido") return "Convertido";
  if (lead.estado === "perdido") return "Encerrado";
  const dias = diasRestantes(lead, agora);
  if (dias < 0) {
    const passados = Math.abs(dias);
    return `Expirou há ${passados} ${passados === 1 ? "dia" : "dias"}`;
  }
  if (dias === 0) return "Expira hoje";
  if (dias === 1) return "Expira amanhã";
  return `Expira em ${dias} dias`;
}

/** O último contato registrado, ou `null` se nunca ninguém falou com a pessoa. */
export function ultimoContato(lead: Lead): Contato | null {
  if (lead.contatos.length === 0) return null;
  return lead.contatos[lead.contatos.length - 1];
}

/**
 * O lead ainda espera uma ação do licenciado?
 *
 * É o filtro da visão padrão. Convertido e perdido já terminaram; expirado não tem mais o
 * que salvar. Sobram os que estão com o relógio correndo.
 */
export function precisaDeAcao(lead: Lead, agora: Date = HOJE): boolean {
  const estado = estadoEfetivo(lead, agora);
  return estado === "novo" || estado === "tentei-contato" || estado === "em-conversa";
}

/** Expira nas próximas 48h e ainda dá para agir. É o KPI de aviso. */
export function expirandoEm48h(lead: Lead, agora: Date = HOJE): boolean {
  if (!precisaDeAcao(lead, agora)) return false;
  const dias = diasRestantes(lead, agora);
  return dias >= 0 && dias <= 1;
}

/**
 * O valor da coluna Situação — o que as visões salvas filtram.
 *
 * Existe separado de `estadoEfetivo` porque responde a outra pergunta: *estado* é o que o
 * licenciado fez, *situação* é onde o lead está na janela. É a separação que o HubSpot faz
 * entre `Lead Status` e `Lifecycle Stage`, e é o que evita a pergunta sem resposta "está
 * em Aguardando porque eu espero ele, ou porque a recarga não terminou?".
 */
export type SituacaoDaJanela = "Precisa de ação" | "Convertido" | "Perdido" | "Expirado";

export function situacaoDaJanela(lead: Lead, agora: Date = HOJE): SituacaoDaJanela {
  if (lead.estado === "convertido") return "Convertido";
  if (lead.estado === "perdido") return "Perdido";
  return expirado(lead, agora) ? "Expirado" : "Precisa de ação";
}

/**
 * Os produtos que o cliente **ainda não tem** — o que sobrou para vender.
 *
 * É este número, e não uma chama de "lead quente", que responde "quanto vale falar com
 * essa pessoa". Ver o JSDoc de `ChipsDeProdutos` em `leads-ui.tsx`.
 */
export function produtosEmAberto(lead: Lead): ProdutoIGreen[] {
  return TODOS_OS_PRODUTOS.filter((p) => !lead.produtos.includes(p));
}

/**
 * O link de WhatsApp com a mensagem já escrita.
 *
 * ⚠️ **Isto abre a conversa; não envia nada.** O `wa.me` apenas pré-preenche o campo de
 * texto — quem toca em enviar é a pessoa, dentro do WhatsApp, e o CMS não fica sabendo.
 * Por isso clicar aqui **não pode** mudar o estado do lead: seria registrar intenção como
 * se fosse ato, e em uma semana a lista estaria mentindo. Registrar contato é ação
 * separada e explícita.
 */
export function linkDoWhatsApp(lead: Lead): string {
  const local = lead.local.replace(/^(IGREEN|PV) MOB - /, "");
  const texto =
    `Olá, ${lead.cliente.split(" ")[0]}! Vi que você recarregou no ${local}. ` +
    `Sou parceiro iGreen e queria te apresentar nossas soluções.`;
  return `https://wa.me/${lead.telefone}?text=${encodeURIComponent(texto)}`;
}

/* ─── Os marcos do lead ──────────────────────────────────────────────────── */

export type MarcoId = "recebido" | "contatado" | "respondeu" | "convertido";

export interface Marco {
  id: MarcoId;
  label: string;
  /** Já aconteceu? */
  cumprido: boolean;
  /** Quando aconteceu, em ISO. `null` enquanto não aconteceu. */
  quando: string | null;
}

/**
 * O progresso do lead, em quatro marcos.
 *
 * ## ⚠️ Por que NÃO são os cinco estados
 *
 * A pergunta "em que passo esta pessoa está" é legítima, mas os cinco estados não
 * formam uma escada. Desenhá-los como passos mentiria em três lugares:
 *
 * | estado | por que não é um degrau |
 * |---|---|
 * | `Tentei contato` | é uma **falha**, não um marco. Um passo aceso por "liguei e ninguém atendeu" premiaria não ter conseguido falar |
 * | `Perdido` | é **saída**, não avanço. Ficaria no fim da trilha parecendo o objetivo |
 * | `Expirado` | idem, e ainda por cima ninguém executou: o relógio executou |
 *
 * E o caminho bom **pula degrau**: quando a pessoa responde na primeira tentativa, o
 * lead vai de `Novo` direto a `Em conversa`. Numa escada de cinco, o melhor resultado
 * apareceria como um passo faltando.
 *
 * Os quatro marcos abaixo são **monotônicos por construção** — cada um só é possível
 * se o anterior aconteceu, e nenhum volta atrás:
 *
 * ```
 * Recebido  →  Contatado  →  Respondeu  →  Convertido
 *  (sempre)    (≥1 contato)  (≥1 resposta)  (fato: pagou/ativou)
 * ```
 *
 * Quem responde de primeira acende **dois** marcos de uma vez, que é a leitura certa:
 * andou mais rápido, não pulou etapa.
 *
 * `Perdido` e `Expirado` não entram na trilha: eles a **interrompem**, e quem mostra
 * isso é a própria tela, apagando o que restou — ver `TrilhaDoLead`.
 */
export function marcosDoLead(lead: Lead): Marco[] {
  const primeiroContato = lead.contatos[0] ?? null;
  const primeiraResposta =
    lead.contatos.find((c) => c.resultado === "respondeu") ?? null;
  const ultimo = lead.contatos[lead.contatos.length - 1] ?? null;

  return [
    {
      id: "recebido",
      label: "Recebido",
      cumprido: true,
      quando: lead.criadoEm,
    },
    {
      id: "contatado",
      label: "Contatado",
      cumprido: primeiroContato !== null,
      quando: primeiroContato?.quando ?? null,
    },
    {
      id: "respondeu",
      label: "Respondeu",
      cumprido: primeiraResposta !== null,
      quando: primeiraResposta?.quando ?? null,
    },
    {
      id: "convertido",
      label: "Convertido",
      cumprido: lead.estado === "convertido",
      /* A conversão não tem carimbo próprio no mock: usa o último contato quando há,
         senão o pré-cadastro. 🟡 Quando a regra real existir, isto vira campo. */
      quando:
        lead.estado === "convertido" ? (ultimo?.quando ?? lead.criadoEm) : null,
    },
  ];
}

/**
 * A trilha parou antes do fim? Devolve o motivo, ou `null` se ainda está andando.
 *
 * É o que a tela mostra no lugar dos marcos que não vão mais acontecer — sem isso um
 * lead perdido ficaria com dois círculos vazios parecendo tarefa pendente.
 */
export function interrupcaoDaTrilha(
  lead: Lead,
  agora: Date = HOJE,
): string | null {
  if (lead.estado === "perdido")
    return lead.motivoDaPerda ?? "O cliente recusou.";
  if (expirado(lead, agora))
    return "A janela de 7 dias fechou sem conversão.";
  return null;
}

/* ─── Formatação ─────────────────────────────────────────────────────────── */

export function moeda(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function dataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function dataHora(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

/** "há 2 dias", "hoje", "ontem". Para a coluna Última ação. */
export function tempoRelativo(iso: string, agora: Date = HOJE): string {
  const dias = diferencaEmDias(new Date(iso), agora);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  return `há ${dias} dias`;
}

export const CANAL_LABEL: Record<Contato["canal"], string> = {
  whatsapp: "WhatsApp",
  ligacao: "Ligação",
  presencial: "Presencial",
};

export const RESULTADO_LABEL: Record<ResultadoDoContato, string> = {
  "sem-resposta": "Sem resposta",
  respondeu: "Respondeu",
  recusou: "Recusou",
};

export const LEADS_TEXTOS = {
  aviso:
    "Quem tocou em “Carregar aqui” nos seus postos. A janela de fidelização é de 7 dias a partir do pré-cadastro.",
  buscar: "Buscar por nome, telefone ou posto",
  vazioPrecisaDeAcao: "Nenhum lead esperando você. Bom sinal.",
  registrarTitulo: "Registrar contato",
  registrarDescricao:
    "O WhatsApp abre numa aba separada e o envio acontece lá — o CMS não fica sabendo. Registre aqui o que aconteceu de verdade.",
};
