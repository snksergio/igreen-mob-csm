import { NOME_DO_PERFIL_PADRAO } from "~/pages/precos/precos-mock";
import { MOTORISTAS } from "~/pages/transacoes/transacoes-mock";

/**
 * Mock da tela de Carregadores — medida em `/pt/chargers?page=1` (2026-09-16).
 *
 * ## O que é medido
 *
 * **A lista inteira:** as nove colunas (`Empresa · Local · Nome · ID · CPCODE · Status ·
 * Modelo · Preço · Ações`) e as 10 linhas da primeira página, com ID, CPCODE e modelo reais
 * de cada uma. A paginação diz "1 de 4" — ≈38 carregadores.
 *
 * **Os três modais/painel:** `Adicionar carregador` (campo, placeholder, botão `Gerar`),
 * a edição (dois blocos de campos mais a ficha de dispositivo com 10 linhas) e
 * `Excluir Carregador`, com o texto de permanência.
 *
 * **A aba Plugues:** chip `ATIVO`, `ID: 46868-1`, `Conector Tipo2`, a URL pública e os dois
 * botões.
 *
 * ## A URL pública é a ÚNICA coisa reescrita
 *
 * Na referência ela aponta pro domínio da marca de origem. Aqui vira `app.igreenmob.com.br`
 * — é texto de produto visível na tela, e o nome da outra marca não entra. O formato
 * (`/ch/<cpcode>-<conector>`) é o medido.
 */

/** Status de conexão do carregador — o que a coluna Status mostra. */
export type StatusConexao = "Online" | "Offline";

/** Plugue (conector) de um carregador — a aba `Plugues` do painel. */
export interface Plugue {
  /** `46868-1` — CPCODE do carregador mais o número do conector. */
  id: string;
  /** `Conector Tipo2` — literal da origem. */
  tipo: string;
  ativo: boolean;
}

export interface Carregador {
  id: string;
  empresa: string;
  local: string;
  /** Nome de exibição: `7,4 kW`, `60 KW Dual`, `AC 7,4 KW`. Inconsistente na origem — ver abaixo. */
  nome: string;
  /** Identificador longo do equipamento, copiável na lista. */
  identificador: string;
  /** Código curto usado em chamado e na URL pública. */
  cpcode: string;
  status: StatusConexao;
  modelo: string;
  /** Nome do perfil de preço vinculado. `null` = a coluna mostra `–`. */
  perfilDePreco: string | null;
  ativo: boolean;
  /** Potência nominal em kW — o teto do modelo. */
  potenciaKw: number;
  /** Limite diferenciado em kW. `null` = "Sem limite diferenciado". */
  limiteKw: number | null;
  marca: string;
  numeroDeSerie: string;
  versaoDeFirmware: string;
  iccid: string;
  imsi: string;
  tipoDeMedidor: string;
  qrCodeAlternativo: string;
  plugues: Plugue[];
}

/**
 * As 10 linhas MEDIDAS da primeira página, na ordem dela.
 *
 * ⚠️ **`7,4 kW`, `60 KW Dual` e `AC 7,4 KW` convivem, e isso é dado, não descuido meu.** O
 * nome é digitado por quem cadastra o equipamento, e a referência tem as três grafias na
 * mesma tela. Normalizar aqui esconderia que a tela precisa aguentar nome livre — e é
 * justamente o campo `Nome` que o painel de edição deixa editar.
 */
const MEDIDOS = [
  {
    local: "IGREEN MOB - Arena 7 BH",
    nome: "7,4 kW",
    identificador: "125020001210",
    cpcode: "46868",
    modelo: "PEVC2108E",
    perfilDePreco: null,
  },
  {
    local: "IGREEN MOB - Arena 7 BH",
    nome: "7,4 kW",
    identificador: "125020001214",
    cpcode: "34933",
    modelo: "PEVC2108E",
    perfilDePreco: null,
  },
  {
    local: "IGREEN MOB - Duo FOOD",
    nome: "60 KW Dual",
    identificador: "01060125460010110002",
    cpcode: "73116",
    modelo: "PointModel",
    perfilDePreco: NOME_DO_PERFIL_PADRAO,
  },
  {
    local: "IGREEN MOB - Posto Via Dupla",
    nome: "60 kW Dual",
    identificador: "C06010E2EAFG",
    cpcode: "89742",
    modelo: "NDC60-W2b",
    perfilDePreco: NOME_DO_PERFIL_PADRAO,
  },
  {
    local: "IGREEN MOB - Supermercado Pejoal Super Varejista",
    nome: "7,4 kW",
    identificador: "125020001218",
    cpcode: "97496",
    modelo: "PEVC2108E",
    perfilDePreco: null,
  },
  {
    local: "IGREEN MOB - Pousada Cipo Prata",
    nome: "AC 7,4 KW",
    identificador: "125020001278",
    cpcode: "17421",
    modelo: "PEVC2108E",
    perfilDePreco: NOME_DO_PERFIL_PADRAO,
  },
  {
    local: "IGREEN MOB - Pousada Flores da Mantiqueira",
    nome: "AC 7,4 KW",
    identificador: "125070001340",
    cpcode: "99598",
    modelo: "PEVC2108E",
    perfilDePreco: NOME_DO_PERFIL_PADRAO,
  },
  {
    local: "IGREEN MOB - Padaria Cipó - Padaria na Serra do Cipó",
    nome: "AC 7,4 KW",
    identificador: "202304220250",
    cpcode: "19654",
    modelo: "ACCharger",
    perfilDePreco: NOME_DO_PERFIL_PADRAO,
  },
  {
    local: "IGREEN MOB - SEDE",
    nome: "AC 7,4 KW",
    identificador: "202303050028",
    cpcode: "22988",
    modelo: "ANACE1",
    perfilDePreco: NOME_DO_PERFIL_PADRAO,
  },
  {
    local: "IGREEN MOB - MAPLE Monte Verde",
    nome: "AC 7,4 KW",
    identificador: "125110000747",
    cpcode: "66160",
    modelo: "PEVC2108E",
    perfilDePreco: NOME_DO_PERFIL_PADRAO,
  },
];

/** Locais que só aparecem nas outras telas — usados nas linhas derivadas da 2ª página. */
const LOCAIS_EXTRA = [
  "IGREEN MOB - Assis Plaza Shopping Assis",
  "IGREEN MOB - Boulevard Shopping Bauru",
  "IGREEN MOB - Chofferando",
  "IGREEN MOB - Colombo Park Shopping Colombo",
  "IGREEN MOB - Hotel Panorama Ipatinga",
  "IGREEN MOB - Rua Santa Juliana - Sete Lagoas",
  "PV MOB - Estacionamento",
  "PV MOB - IATE TENIS CLUBE",
];

/** PRNG determinístico — mesma semente, mesmo carregador. */
function prng(semente: number) {
  let s = semente;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/** Domínio público do QR — ver a nota no topo sobre a reescrita. */
export const DOMINIO_PUBLICO = "https://app.igreenmob.com.br/ch";

/** URL pública de um plugue, como aparece na aba Plugues. */
export function urlDoPlugue(p: Plugue): string {
  return `${DOMINIO_PUBLICO}/${p.id}`;
}

/**
 * Dados MEDIDOS na ficha de dispositivo do carregador `125020001210`.
 *
 * É o âncora do teste: os outros derivam, este reproduz o print campo a campo.
 */
export const DISPOSITIVO_MEDIDO = {
  potenciaKw: 7.4,
  marca: "SINO",
  numeroDeSerie: "125020001210",
  versaoDeFirmware: "V4.01 0xB985",
  /* `WIFI` nos dois: o equipamento medido não tem chip celular, e a origem preenche o campo
     com o meio de conexão em vez de deixar vazio. */
  iccid: "WIFI",
  imsi: "WIFI",
  tipoDeMedidor: "AC meter",
} as const;

const MARCAS = ["SINO", "ENEL X", "WEG", "INTELBRAS"];
const MEDIDORES = ["AC meter", "DC meter"];

function construir(
  base: (typeof MEDIDOS)[number],
  i: number,
  empresa: string,
): Carregador {
  const rnd = prng(500 + i * 91);
  const medido = i === 0;
  /* A potência sai do NOME, que é onde a origem a escreve: `60 KW Dual` → 60. */
  const potenciaKw = /60/.test(base.nome) ? 60 : 7.4;
  const dual = /dual/i.test(base.nome);

  return {
    id: `cp-${base.cpcode}`,
    empresa,
    local: base.local,
    nome: base.nome,
    identificador: base.identificador,
    cpcode: base.cpcode,
    /* Medido: `Online` em 10/10. Ver a nota do teste. */
    status: "Online",
    modelo: base.modelo,
    perfilDePreco: base.perfilDePreco,
    ativo: true,
    potenciaKw,
    /* `null` = "Sem limite diferenciado", que é o estado medido. */
    limiteKw: null,
    marca: medido ? DISPOSITIVO_MEDIDO.marca : MARCAS[Math.floor(rnd() * 4)],
    numeroDeSerie: base.identificador,
    versaoDeFirmware: medido
      ? DISPOSITIVO_MEDIDO.versaoDeFirmware
      : `V${3 + Math.floor(rnd() * 3)}.0${Math.floor(rnd() * 9)} 0x${Math.floor(
          rnd() * 60000,
        )
          .toString(16)
          .toUpperCase()}`,
    iccid: medido ? DISPOSITIVO_MEDIDO.iccid : rnd() < 0.5 ? "WIFI" : `89550${Math.floor(rnd() * 1e10)}`,
    imsi: medido ? DISPOSITIVO_MEDIDO.imsi : rnd() < 0.5 ? "WIFI" : `72406${Math.floor(rnd() * 1e9)}`,
    tipoDeMedidor: medido
      ? DISPOSITIVO_MEDIDO.tipoDeMedidor
      : potenciaKw >= 60
        ? "DC meter"
        : MEDIDORES[0],
    qrCodeAlternativo: "",
    /* `Dual` no nome significa DOIS conectores — é o que a palavra diz, e o plugue é o que a
       aba Plugues lista. Um carregador "Dual" com um plugue só seria contradição na tela. */
    plugues: Array.from({ length: dual ? 2 : 1 }, (_, c) => ({
      id: `${base.cpcode}-${c + 1}`,
      tipo: potenciaKw >= 60 ? "Conector CCS2" : "Conector Tipo2",
      ativo: true,
    })),
  };
}

/**
 * Carregadores.
 *
 * As 10 primeiras linhas são MEDIDAS. As 8 seguintes derivam, pra dar a segunda página que
 * a tela precisa exercitar — e são as únicas com `Offline` e com carregador desativado, que
 * a primeira página não tinha.
 */
export const CARREGADORES: Carregador[] = [
  ...MEDIDOS.map((m, i) => construir(m, i, "PV MOB")),
  ...LOCAIS_EXTRA.map((local, k) => {
    const i = MEDIDOS.length + k;
    const rnd = prng(900 + i * 53);
    const dual = rnd() < 0.25;
    const potenciaKw = dual ? 60 : 7.4;
    const cpcode = String(10000 + Math.floor(rnd() * 89999));
    const c = construir(
      {
        local,
        nome: dual ? "60 kW Dual" : "AC 7,4 KW",
        identificador: `1250${String(Math.floor(rnd() * 1e8)).padStart(8, "0")}`,
        cpcode,
        modelo: dual ? "NDC60-W2b" : "PEVC2108E",
        perfilDePreco: rnd() < 0.7 ? NOME_DO_PERFIL_PADRAO : null,
      },
      i,
      "PV MOB",
    );
    /* Só aqui existe variação de estado: a referência mostrou tudo online e ativo, e uma
       tela em que o Status nunca muda não exercita nem a cor da célula nem o switch do
       painel. Invariante testada. */
    return {
      ...c,
      status: (rnd() < 0.75 ? "Online" : "Offline") as StatusConexao,
      ativo: rnd() < 0.85,
      potenciaKw,
    };
  }),
];

/* ── Textos literais da referência ──────────────────────────────────────────────── */

/** Modal `Adicionar carregador`. */
export const ADICIONAR = {
  titulo: "Adicionar carregador",
  label: "ID do Carregador",
  placeholder: "6 caracteres ou mais",
  ajuda: "Copie as informações para configurar seu carregador",
  gerar: "Gerar",
  continuar: "Continuar",
} as const;

/**
 * Os três passos do cadastro de carregador — medidos em `/pt/chargers` (2026-09-17).
 *
 * ## É um fluxo, não um formulário, e a ordem é imposta pelo mundo
 *
 * A referência encadeia três telas e não deixa pular nenhuma, porque cada passo depende
 * fisicamente do anterior:
 *
 * 1. **Identificação** — gera o ID. Sem ele não há o que configurar no equipamento.
 * 2. **Conexão** — entrega a URL OCPP e o ID para quem está com o carregador na mão.
 *    Este passo é de LEITURA: os dois campos são copiados para dentro do equipamento.
 * 3. **Configurações** — nome, descrição e local. Só faz sentido depois que o
 *    equipamento existe e se conecta; é o batismo, não o cadastro.
 *
 * ⚠️ Pedir os três de uma vez, num formulário só, inverteria a ordem real: quem está com
 * a chave de fenda na mão ainda não escolheu o nome, e quem escolhe o nome não está no
 * poste. Era o que o nosso modal fazia antes — um campo só e `Continuar` que fechava.
 */
export const PASSOS_DO_CADASTRO = [
  {
    id: "identificar",
    rotulo: "Identificação",
    descricao: "Gere o ID do equipamento",
  },
  {
    id: "conectar",
    rotulo: "Conexão",
    descricao: "Configure o carregador",
  },
  {
    id: "finalizar",
    rotulo: "Configurações",
    descricao: "Dê nome e vincule ao local",
  },
] as const;

export type PassoDoCadastro = (typeof PASSOS_DO_CADASTRO)[number]["id"];

/**
 * Endpoint OCPP que o carregador usa para falar com o servidor.
 *
 * ⚠️ O host é NOSSO, não o da referência. A origem mostra o domínio dela, que carrega a
 * marca que este projeto não usa — e um endereço de terceiro num campo com botão "Copiar"
 * é o tipo de coisa que alguém cola num equipamento de verdade.
 */
export const URL_OCPP = "ws://ocpp.igreenmob.com.br:80/";

export const CONECTAR = {
  titulo: "Conectar carregador",
  intro:
    "Vamos configurar seu carregador e estabelecer conexão com o iGreen MOB.",
  labelUrl: "URL OCPP",
  labelId: "ID do Carregador",
  copiar: "Copiar",
  copiado: "Copiado!",
  ajuda: "Copie as informações para configurar seu carregador",
} as const;

export const FINALIZAR = {
  titulo: "Configurações finais",
  labelNome: "Nome do carregador",
  placeholderNome: "Defina um nome para este carregador",
  labelDescricao: "Descrição",
  placeholderDescricao: "Defina uma descrição para este carregador",
  labelLocal: "Local do carregador",
  placeholderLocal: "Vincule este carregador a um local",
  /* ⚠️ "locais", não "sites" como na origem: este projeto tem uma tela chamada Locais, e
     duas palavras para a mesma coisa no mesmo produto é o começo de todo glossário
     inconsistente. */
  aviso:
    "Exibindo apenas os locais marcados no seletor global. Para ver os outros, ajuste o seletor no topo da página.",
  voltar: "Voltar",
  concluir: "Concluir cadastro",
} as const;

/** Modal `Excluir Carregador` — o texto de permanência é o que separa este dos outros. */
export const EXCLUIR = {
  titulo: "Excluir Carregador",
  pergunta: "Você deseja realmente excluir?",
  descricao:
    "Os dados de uso e consumo serão mantidos em nosso sistema para futuras cobranças e análise dos dados.",
  nota: "Esta é uma ação permanente. Não será possível desfazer a exclusão.",
  cancelar: "Não excluir",
  confirmar: "Excluir",
} as const;

/** Placeholder e ajuda do limite de potência. */
export const SEM_LIMITE = "Sem limite diferenciado";
export const PERSONALIZAR_MOTORISTAS = "Personalizar motoristas do carregador";

/**
 * Gera um ID de carregador no formato que a origem aceita.
 *
 * O botão `Gerar` existe porque o ID precisa ser único e ter 6+ caracteres, e quem está
 * instalando o equipamento não tem como inventar um que não colida. 12 dígitos é o formato
 * dos IDs medidos.
 */
export function gerarIdDeCarregador(): string {
  const agora = Date.now().toString().slice(-8);
  const sufixo = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${agora}${sufixo}`;
}

/* ═══════════════════════════════════════════════════════════════════════════════════
 * Comandos remotos — medidos nos modais de Iniciar recarga, Reiniciar, Comandos e Logs
 * ═══════════════════════════════════════════════════════════════════════════════════ */

/**
 * Comandos OCPP do select — **os cinco literais da referência, na ordem dela**.
 *
 * São operações do protocolo que o carregador fala, não rótulos que alguém escolheu: mudar
 * a ordem ou o texto aqui faria o operador procurar por um comando que o equipamento não
 * reconhece pelo nome mostrado.
 */
export const COMANDOS_OCPP = [
  "Mensagem de disparo",
  "Parar transação remotamente",
  "Alterar configuração",
  "Obter configuração",
  "Atualizar firmware",
] as const;

/**
 * E-mails dos motoristas, para o select de `Iniciar recarga`.
 *
 * Derivados dos MESMOS nomes de Transações — dois elencos diferentes fariam o operador
 * procurar aqui um motorista que só existe lá. O domínio é fictício e genérico de
 * propósito: e-mail é dado pessoal, e um domínio real convidaria a testar envio.
 */
export const EMAILS_DE_MOTORISTA = MOTORISTAS.map(
  (nome) =>
    `${nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(" ")
      .slice(0, 2)
      .join(".")}@exemplo.com`,
);

/** Uma entrada do log OCPP — o que a tabela de `Logs` lista. */
export interface LinhaDeLog {
  id: string;
  /** `2026-09-16 17:33:49` — como a origem formata. */
  dataHora: string;
  /** Número do plugue no carregador. Vazio quando a mensagem é do equipamento inteiro. */
  idDoPlugue: string;
  /** `2` = requisição do carregador, `3` = resposta do servidor (OCPP call/result). */
  tipo: 2 | 3;
  comando: string;
  /** JSON cru, como aparece na coluna. */
  payload: string;
}

/**
 * Log de um carregador.
 *
 * ## Por que quase tudo é `Heartbeat`
 *
 * É o que a referência mostra: o carregador manda um heartbeat por minuto e o servidor
 * responde com a hora — e por isso o log real é 90% disso. Encher o mock de comandos
 * variados deixaria a tela mais "interessante" e menos verdadeira: quem abre os logs
 * precisa saber que vai ter que filtrar heartbeat pra achar o que procura.
 *
 * O par 2/3 na mesma marca de tempo também é medido: a requisição vem vazia (`{}`) e a
 * resposta traz o `currentTime`.
 */
export function logsDoCarregador(c: Carregador, quantos = 60): LinhaDeLog[] {
  const rnd = prng(semearPorTexto(c.cpcode));
  const base = new Date("2026-09-16T17:33:49");
  const linhas: LinhaDeLog[] = [];

  for (let i = 0; i < quantos / 2; i++) {
    const t = new Date(base.getTime() - i * 60_000 - Math.floor(rnd() * 900));
    const carimbo = formatarDataHora(t);
    const iso = t.toISOString().replace("Z", "Z");
    /* A resposta (3) vem ANTES na lista porque a ordem é do mais recente pro mais antigo, e
       ela acontece depois da requisição. */
    linhas.push({
      id: `${c.cpcode}-${i}-3`,
      dataHora: carimbo,
      idDoPlugue: "",
      tipo: 3,
      comando: "Heartbeat",
      payload: `{"currentTime":"${iso}"}`,
    });
    linhas.push({
      id: `${c.cpcode}-${i}-2`,
      dataHora: carimbo,
      idDoPlugue: "",
      tipo: 2,
      comando: "Heartbeat",
      payload: "{}",
    });
  }

  /* Umas poucas mensagens de operação no meio — é o que se procura no log, e sem elas a
     tabela não exercita nem o filtro de comando nem o payload longo. */
  const plugue = c.plugues[0]?.id ?? "";
  linhas.splice(6, 0, {
    id: `${c.cpcode}-status`,
    dataHora: formatarDataHora(new Date(base.getTime() - 7 * 60_000)),
    idDoPlugue: plugue,
    tipo: 2,
    comando: "StatusNotification",
    payload: `{"connectorId":1,"errorCode":"NoError","status":"Available"}`,
  });
  linhas.splice(14, 0, {
    id: `${c.cpcode}-meter`,
    dataHora: formatarDataHora(new Date(base.getTime() - 15 * 60_000)),
    idDoPlugue: plugue,
    tipo: 2,
    comando: "MeterValues",
    payload: `{"connectorId":1,"meterValue":[{"sampledValue":[{"value":"0.00","unit":"kWh"}]}]}`,
  });

  return linhas;
}

/** `2026-09-16 17:33:49` — o formato da coluna Data/Hora. */
function formatarDataHora(d: Date): string {
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(
    d.getHours(),
  )}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
}

/** Semente estável a partir de um texto. */
function semearPorTexto(s: string): number {
  return [...s].reduce((a, c) => a + c.charCodeAt(0), 0);
}

/* ── Textos literais dos modais de comando ─────────────────────────────────────── */

export const INICIAR_RECARGA = {
  titulo: "Iniciar recarga",
  labelEmail: "Informe o email do motorista para atrelar a carga",
  placeholderEmail: "email@motorista.com",
  labelPlugue: "Plugue",
  enviar: "Enviar comando",
  respostaLabel: "Resposta do comando",
  copiar: "Copiar",
  /* O que o campo de resposta mostra antes de qualquer envio. A origem deixa a área
     simplesmente preta; um vazio mudo parece falha de carregamento. */
  respostaVazia: "Aguardando envio do comando…",
  ajuda:
    "O motorista precisa ter conta no aplicativo — a recarga é atrelada ao e-mail informado.",
} as const;

export const REINICIAR = {
  titulo: "Reiniciar Carregador",
  pergunta: "Você deseja reiniciar o carregador?",
  descricao:
    "O equipamento ficará indisponível momentaneamente até concluir a operação.",
  cancelar: "Cancelar",
  confirmar: "Reiniciar",
} as const;

export const COMANDOS_MODAL = {
  titulo: "Comandos",
  label: "Comandos",
  ajuda:
    "O comando é enviado direto ao equipamento pelo protocolo OCPP. A resposta aparece abaixo.",
} as const;

export const LOGS = {
  titulo: "Logs",
  ajuda:
    "Mensagens trocadas entre o carregador e o servidor. Tipo 2 é requisição do equipamento; tipo 3 é a resposta.",
  dataInicial: "Data Inicial",
  dataFinal: "Data Final",
  verDetalhes: "Ver detalhes",
  vazio: "Nenhuma mensagem no período.",
} as const;

export const PERSONALIZAR = {
  titulo: "Personalizar",
  descricao:
    "Adicione um perfil de preço exclusivo para alguns usuários do carregador",
  email: "Email",
  perfil: "Selecione um perfil de preço",
  conceder: "Conceder acesso",
  adicionados: "Usuários adicionados",
  pesquisar: "Pesquisar",
  vazio: "Sem resultados",
} as const;
