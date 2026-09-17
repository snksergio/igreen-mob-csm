/** Status da recarga. Extraido pra tipo proprio: colunas e painel derivam dele. */
export type TransacaoStatus = "finalizado" | "em-andamento" | "falha";

/**
 * Linha da tabela "Item da cobranca" do painel de detalhe.
 *
 * A soma dos `valor` SEMPRE fecha com o `valor` da transacao — e isso e invariante
 * testado, nao coincidencia: na referencia, R$ 37,99 da transacao = R$ 35,49 de energia
 * + R$ 2,50 de taxa. Um detalhe que nao soma faz o operador desconfiar do numero certo.
 */
export interface ItemCobranca {
  id: string;
  item: string;
  /** Preco unitario ja formatado com a unidade: "R$ 2,50 / kWh". */
  precoUnidade: string;
  /** Quantidade ja formatada com a unidade: "14,19 kWh" / "1 un.". */
  quantidade: string;
  valor: number;
}

/** Ponto da serie de potencia e corrente, pra aba de graficos. */
export interface PontoSerie {
  /** `HH:mm` — rotulo do eixo X. */
  hora: string;
  potenciaKw: number;
  correnteA: number;
}

export interface Transacao {
  id: string;
  data: string;
  empresa: string;
  local: string;
  aplicativo: string;
  motorista: string;
  carregador: string;
  energiaKwh: number;
  socInicial: number;
  socFinal: number;
  valor: number;
  veiculo: string;
  cupomValor: number | null;
  cupomTipo: string | null;
  duracaoMin: number;
  horaInicio: string;
  horaFim: string;
  status: TransacaoStatus;

  /* ── Campos que so aparecem no painel de detalhe ──────────────────────────
   * Medidos na referencia em 2026-09-16 (aba "Detalhes"), na ordem em que ela
   * lista. Nao estao na tabela de proposito: a linha tem 12 colunas e estes 10
   * campos sao o que o "Ver detalhes" existe pra mostrar. */

  /** Numero curto, distinto do `id` (`TRX-1000`). Na referencia: `617828`. */
  idTransacao: string;
  /** `dd/MM/yyyy as HH:mm:ss` — a referencia usa "as", nao um travessao. */
  inicioTransacao: string;
  terminoRecarga: string;
  terminoTransacao: string;
  /** Por que a sessao encerrou. Na referencia: `Other`. */
  motivo: string;
  /** `HH:mm:ss:ms` — formato da referencia (`00:00:34:15`), distinto do `00h 34min`
   *  que a COLUNA mostra. Os dois convivem: a tabela e leitura rapida, o painel e
   *  registro. */
  duracaoRecarga: string;
  perfilPreco: string;
  idCarregador: string;
  codigoCP: string;
  idConector: string;

  itensCobranca: ItemCobranca[];
  serie: PontoSerie[];
}

/** Maximo de energia observado na referencia: 39,58 kWh. */
export const TETO_KWH = 39.58;

/** Maximo de valor observado na referencia: R$ 62,71. */
export const TETO_VALOR = 62.71;

/** PRNG com semente fixa — mock estável entre reloads. */
function prng(semente: number) {
  let s = semente;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/** Fonte unica das opcoes do filtro multiSelect de Local. */
export const LOCAIS = [
  "IGREEN MOB - Usina Solar Vinhedo",
  "IGREEN MOB - BIG MAIS Gov Valadares",
  "IGREEN MOB - SEDE",
  "IGREEN MOB - Posto Via Dupla",
  "IGREEN MOB - Arena 7 BH",
  "IGREEN MOB - Duo FOOD",
  "IGREEN MOB - Shopping Colombo",
  "PV MOB - Estacionamento",
];

/** Empresas da referencia. Uma so hoje, mas o filtro multiSelect precisa da lista. */
export const EMPRESAS = ["PV MOB"];

/** Fonte unica das opcoes do filtro multiSelect de Carregador. */
export const CARREGADORES = [
  "DC 40 KW - 1",
  "AC 7,4 KW - 1",
  "60 kW Dual - 1",
  "AC 22 KW - 1",
];

/** Nomes fictícios — §7 da spec. A referência tem nomes reais de clientes. */
/** Motoristas do mock. Exportado porque o select de "Iniciar recarga" em Carregadores
 *  precisa dos mesmos nomes — dois elencos diferentes fariam o operador procurar em
 *  Transações um motorista que só existe lá. */
export const MOTORISTAS = [
  "Ana Beatriz Moreira",
  "Caio Figueiredo Lima",
  "Débora Nunes Alencar",
  "Eduardo Paiva Ramos",
  "Fernanda Quintela Sá",
  "Gustavo Rebelo Pinto",
  "Helena Vasconcelos Dias",
  "Ícaro Mendonça Freitas",
  "Juliana Tavares Rocha",
  "Lucas Andrade Coutinho",
];

const VEICULOS = ["Geely", "Jaecoo7", "BYD Dolphin", "GWM Ora 03", "", "Volvo EX30"];
const PLACAS = ["TYF9I53", "RQK4B82", "", "MZP7D10"];

function hhmm(minutosDoDia: number) {
  const h = Math.floor(minutosDoDia / 60) % 24;
  const m = minutosDoDia % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const BRL2 = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const NUM2 = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Perfis de preco da referencia ("Nome do perfil de preco"). */
const PERFIS_PRECO = ["Perfil padrão", "Perfil noturno", "Perfil parceiro"];

/** Motivos de encerramento. A referencia mostra `Other` — mantido como veio. */
const MOTIVOS = ["Other", "Local", "Remote", "EVDisconnected"];

/** Taxa de servico fixa, como na referencia (R$ 2,50 por unidade). */
const TAXA_SERVICO = 2.5;

/**
 * Itens de cobranca que SOMAM o valor da transacao.
 *
 * O preco por kWh e DERIVADO (`valorEnergia / energiaKwh`) em vez de fixo em 2,50:
 * fixar o preco quebraria a soma, porque o `valor` desta linha vem do teto observado
 * na referencia e implica precos diferentes por sessao (medido: 14,20 kWh → R$ 37,99
 * da ~2,50/kWh, mas 39,58 kWh → R$ 62,71 da ~1,58/kWh — a referencia tem perfis de
 * preco distintos). Derivar mantem o detalhe fechando com o total, que e o que o
 * operador confere.
 */
function itensCobrancaDe(valor: number, energiaKwh: number): ItemCobranca[] {
  if (valor <= 0) return [];

  const temTaxa = valor > TAXA_SERVICO;
  const taxa = temTaxa ? TAXA_SERVICO : 0;
  const valorEnergia = Math.round((valor - taxa) * 100) / 100;
  const precoKwh = energiaKwh > 0 ? valorEnergia / energiaKwh : 0;

  const itens: ItemCobranca[] = [
    {
      id: "energia",
      item: "Uso da energia",
      precoUnidade: `${BRL2(Math.round(precoKwh * 100) / 100)} / kWh`,
      quantidade: `${NUM2(energiaKwh)} kWh`,
      valor: valorEnergia,
    },
  ];

  if (temTaxa) {
    itens.push({
      id: "taxa",
      item: "Taxa de serviço",
      precoUnidade: `${BRL2(TAXA_SERVICO)} / unidade`,
      quantidade: "1 un.",
      valor: taxa,
    });
  }

  return itens;
}

/**
 * Serie de potencia e corrente ao longo da sessao.
 *
 * Curva DECRESCENTE por degraus, como na referencia: a potencia comeca no teto do
 * carregador e cai conforme a bateria enche (taper de carga real). Corrente derivada
 * da potencia a 400 V — se as duas curvas nao tiverem a mesma forma, o grafico mente
 * sobre a fisica.
 *
 * Amostra a cada ~5 min, com no minimo 2 pontos: um grafico de 1 ponto nao desenha
 * linha, e sessao de falha tem 1-2 min.
 */
function serieDe(
  inicioDoDia: number,
  duracaoMin: number,
  potenciaTetoKw: number,
): PontoSerie[] {
  const passos = Math.max(2, Math.round(duracaoMin / 5));
  const pontos: PontoSerie[] = [];

  for (let p = 0; p <= passos; p++) {
    const frac = p / passos;
    // 3 degraus: 100% → ~58% → ~55% → ~33% do teto. Os patamares sao o que faz a
    // curva parecer carga real em vez de rampa linear.
    const fator =
      frac < 0.25 ? 1 : frac < 0.5 ? 0.58 : frac < 0.75 ? 0.56 : 0.33;
    const potenciaKw = Math.round(potenciaTetoKw * fator * 100) / 100;
    pontos.push({
      hora: hhmm(inicioDoDia + Math.round(frac * duracaoMin)),
      potenciaKw,
      // P = V x I  →  I = P / V, a 400 V (DC rapido tipico)
      correnteA: Math.round((potenciaKw * 1000) / 400),
    });
  }

  return pontos;
}

/** Teto de potencia lido do nome do carregador ("DC 40 KW - 1" → 40). */
function tetoDoCarregador(nome: string): number {
  const m = nome.match(/(\d+[,.]?\d*)\s*kW/i);
  return m ? Number(m[1].replace(",", ".")) : 22;
}

function gerar(total: number): Transacao[] {
  const r = prng(20260916);
  const linhas: Transacao[] = [];

  for (let i = 0; i < total; i++) {
    // 1 em 8 é sessão falha: energia zero, 1-2 min. Existe na base real.
    const falha = i % 8 === 3;

    /**
     * As 2 primeiras sao EM ANDAMENTO — e isso nao e enfeite de dado.
     *
     * A visao "Em andamento" da tela filtra por este status; sem nenhuma linha, a aba
     * abre vazia e parece defeito. Sao as 2 primeiras porque o mock esta ordenado da
     * data mais recente pra tras, e recarga em curso e sempre a mais nova.
     *
     * Invariante coberta por teste: existe ao menos 1 linha de CADA status, pra que
     * nenhuma visao da tela seja uma aba morta.
     */
    const emAndamento = !falha && i < 2;

    const socInicial = falha ? 0 : Math.floor(r() * 70);
    const ganho = falha ? 0 : Math.floor(r() * (100 - socInicial));
    const socFinal = socInicial + ganho;

    // Tetos EXPLICITOS, do maximo observado na referencia (secao 7 da spec).
    // Sem o clamp o teto nao seria estrutural: ganho chega a 99, e 99 * 0.42 = 41.58 kWh,
    // acima do teto que o teste afirma. Passava por sorte da semente (max 36.96 com a
    // semente 20260916) e reprovaria ao trocar semente ou total, sem bug nenhum novo.
    const energiaKwh = falha
      ? 0
      : Math.round(Math.min(ganho * 0.42, TETO_KWH) * 100) / 100;
    const valor = falha ? 0 : Math.round(Math.min(energiaKwh * 1.6, TETO_VALOR) * 100) / 100;

    const duracaoMin = falha ? 1 + Math.floor(r() * 2) : 4 + Math.floor(r() * 81);
    const inicioDoDia = 6 * 60 + Math.floor(r() * 16 * 60);

    const temCupom = !falha && i % 11 === 5;
    const diaDoMes = 16 - Math.floor(i / 4);
    const dataBR = `${String(Math.max(diaDoMes, 1)).padStart(2, "0")}/09/2026`;
    const carregador = CARREGADORES[i % CARREGADORES.length];

    // Os segundos existem porque a referencia os mostra ("21:42:27"). Deterministicos
    // pelo indice, nao por `r()`: assim a ordem de leitura do PRNG nao muda e o mock
    // das outras colunas continua identico ao que o teste ja fixou.
    const seg = (i * 7) % 60;
    const segFim = (i * 13) % 60;
    const horaInicio = hhmm(inicioDoDia);
    const horaFim = hhmm(inicioDoDia + duracaoMin);
    // "Termino da recarga" vem ANTES do "termino da transacao" na referencia: a recarga
    // para, e a transacao fecha ~1 min depois (desconexao do cabo).
    const horaFimRecarga = hhmm(inicioDoDia + Math.max(duracaoMin - 1, 0));

    linhas.push({
      id: `TRX-${String(1000 + i)}`,
      data: `2026-09-${String(Math.max(diaDoMes, 1)).padStart(2, "0")}`,
      empresa: EMPRESAS[0],
      local: LOCAIS[i % LOCAIS.length],
      aplicativo: "iGreen MOB",
      motorista: MOTORISTAS[i % MOTORISTAS.length],
      carregador,
      energiaKwh,
      socInicial,
      socFinal,
      valor,
      veiculo: i % 3 === 0 ? PLACAS[i % PLACAS.length] : VEICULOS[i % VEICULOS.length],
      cupomValor: temCupom ? Math.round(valor * 0.43 * 100) / 100 : null,
      cupomTipo: temCupom ? "CPO" : null,
      duracaoMin,
      horaInicio,
      horaFim,
      status: falha ? "falha" : emAndamento ? "em-andamento" : "finalizado",

      idTransacao: String(617828 - i * 137),
      inicioTransacao: `${dataBR} às ${horaInicio}:${String(seg).padStart(2, "0")}`,
      /* Sessao em curso nao TEM termino — string vazia, nao uma data inventada. O
         painel renderiza `–` nos campos vazios; preencher com o "previsto" faria o
         operador ler estimativa como fato. */
      terminoRecarga: emAndamento
        ? ""
        : `${dataBR} às ${horaFimRecarga}:${String(segFim).padStart(2, "0")}`,
      terminoTransacao: emAndamento
        ? ""
        : `${dataBR} às ${horaFim}:${String(segFim).padStart(2, "0")}`,
      motivo: falha ? "EVDisconnected" : emAndamento ? "" : MOTIVOS[i % MOTIVOS.length],
      duracaoRecarga: `00:${String(Math.floor(duracaoMin / 60)).padStart(2, "0")}:${String(
        duracaoMin % 60,
      ).padStart(2, "0")}:${String((i * 3) % 60).padStart(2, "0")}`,
      perfilPreco: PERFIS_PRECO[i % PERFIS_PRECO.length],
      idCarregador: `FZ${String(2503000138 + i * 11)}`,
      codigoCP: String(52192 + i * 3),
      idConector: String((i % 2) + 1),

      itensCobranca: itensCobrancaDe(valor, energiaKwh),
      serie: serieDe(inicioDoDia, duracaoMin, tetoDoCarregador(carregador)),
    });
  }

  return linhas;
}

export const TRANSACOES_MOCK: Transacao[] = gerar(64);
