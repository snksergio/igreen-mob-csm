import { GEO_DOS_LOCAIS } from "~/pages/monitoramento/monitoramento-mock";

/**
 * Mock da tela de Splits — medida em `/pt/financial/split?page=1` (2026-09-17).
 *
 * ## O que é um split, no domínio
 *
 * A receita de uma recarga não fica inteira com quem opera o ponto: parte vai pro dono do
 * imóvel, parte pra quem fez o investimento, parte pra rede. O split é a regra que divide
 * isso — uma lista de beneficiários com percentual e dados bancários.
 *
 * ## O detalhe que a referência esconde e que manda no desenho
 *
 * O subtítulo dela diz: *"Esta distribuição é aplicada sobre o saldo restante após as
 * distribuições de local."* Ou seja, **são dois níveis em cascata**:
 *
 * 1. o split do **LOCAL** corta primeiro, sobre a receita daquele ponto;
 * 2. o split da **EMPRESA** corta o que sobrou, e vale para todos os locais.
 *
 * Isso não é detalhe de implementação — é o que faz "100%" significar coisas diferentes em
 * cada nível, e é por isso que o rótulo do restante muda (`Restante empresa` × `Restante
 * do local`). Sem essa distinção na tela, alguém soma os dois níveis e conclui que a
 * distribuição passou de 100%.
 *
 * ## ⚠️ Dois defeitos da origem que não foram copiados
 *
 * | defeito | aqui |
 * |---|---|
 * | o título da tela de edição é literalmente **"Splits - undefined"** — o nome da empresa não resolve | o nome vem do registro, e o painel não abre sem ele |
 * | a lista tem 3 colunas e **nenhuma informação**: `Empresa`, `Local` ("39 locais") e `Ações` | a lista mostra beneficiários, distribuído e restante — o que se quer saber antes de abrir |
 *
 * ## Privacidade
 *
 * Códigos de banco são de registro público (001 BB, 341 Itaú…). Nomes de beneficiário,
 * agências, contas e chaves PIX são **fictícios por construção** — as contas não passam
 * pelo dígito verificador e as chaves apontam para o domínio do mock. Dado bancário real
 * num protótipo é o pior tipo de vazamento: parece plausível o suficiente para alguém
 * tentar usar.
 */

/* ────────────────────────────────────────────────────────────────────────────
   Bancos
   ──────────────────────────────────────────────────────────────────────────── */

/** Código COMPE → nome. Registro público do Banco Central. */
export const BANCOS: Record<string, string> = {
  "001": "Banco do Brasil",
  "033": "Santander",
  "077": "Banco Inter",
  "237": "Bradesco",
  "260": "Nu Pagamentos",
  "341": "Itaú Unibanco",
  "422": "Banco Safra",
  "748": "Sicredi",
};

export const CODIGOS_DE_BANCO = Object.keys(BANCOS);

/** `341` → `341 · Itaú Unibanco`. O formato que a linha do beneficiário mostra. */
export function rotuloDoBanco(codigo: string): string {
  const nome = BANCOS[codigo];
  return nome ? `${codigo} · ${nome}` : codigo;
}

/* ────────────────────────────────────────────────────────────────────────────
   Tipos
   ──────────────────────────────────────────────────────────────────────────── */

export interface Beneficiario {
  id: string;
  nome: string;
  /** Código COMPE. Vazio = beneficiário que recebe só por PIX. */
  banco: string;
  agencia: string;
  conta: string;
  /** Vazio = recebe por conta bancária. */
  chavePix: string;
  /** Fatia em pontos percentuais. */
  percentual: number;
}

/**
 * Nível em que o split corta.
 *
 * Ver o JSDoc do topo: a cascata é `local` → `empresa`, e é isso que muda o significado do
 * restante.
 */
export type NivelDoSplit = "empresa" | "local";

export const ROTULO_DO_NIVEL: Record<NivelDoSplit, string> = {
  empresa: "Nível empresa",
  local: "Nível local",
};

/**
 * O mesmo nível sem a palavra "Nível" — para dentro da coluna que já se chama assim.
 *
 * "Nível empresa" numa coluna `Nível` diz duas vezes a mesma coisa e come 40px de uma
 * largura que a tabela não tem de sobra. Fora da tabela (painéis, formulário) o rótulo
 * longo continua valendo: ali não há cabeçalho dando o contexto.
 */
export const ROTULO_CURTO_DO_NIVEL: Record<NivelDoSplit, string> = {
  empresa: "Empresa",
  local: "Local",
};

export interface Split {
  id: string;
  empresa: string;
  nivel: NivelDoSplit;
  /** `null` no nível empresa — ele vale para todos os locais. */
  local: string | null;
  beneficiarios: Beneficiario[];
  /** ISO `YYYY-MM-DD` da última alteração. */
  atualizadoEm: string;
}

/* ────────────────────────────────────────────────────────────────────────────
   Os splits
   ──────────────────────────────────────────────────────────────────────────── */

const LOCAIS = Object.keys(GEO_DOS_LOCAIS);

/**
 * Quatro splits, e cada um existe por um estado que a tela precisa conseguir mostrar.
 *
 * | split | o que exercita |
 * |---|---|
 * | PV MOB — nível empresa | o caso da referência: distribuição parcial, sobra para a empresa |
 * | Arena 7 BH | distribuição **fechada em 100%** — o restante é zero e o rótulo muda |
 * | SEDE | beneficiário que recebe **só por PIX**, sem agência nem conta |
 * | Duo FOOD | **nenhum beneficiário** — split criado e não configurado, o estado vazio |
 */
export const SPLITS: Split[] = [
  {
    id: "sp-empresa",
    empresa: "PV MOB",
    nivel: "empresa",
    local: null,
    atualizadoEm: "2026-09-12",
    beneficiarios: [
      {
        id: "bf-1",
        nome: "Investidora Solar Vinhedo",
        banco: "341",
        agencia: "0001",
        conta: "00000-0",
        chavePix: "",
        percentual: 22.5,
      },
      {
        id: "bf-2",
        nome: "Fundo de Expansão MOB",
        banco: "077",
        agencia: "0001",
        conta: "00000-0",
        chavePix: "",
        percentual: 12,
      },
    ],
  },
  {
    id: "sp-arena",
    empresa: "PV MOB",
    nivel: "local",
    local: LOCAIS[0],
    atualizadoEm: "2026-09-15",
    beneficiarios: [
      {
        id: "bf-3",
        nome: "Arena Administradora",
        banco: "237",
        agencia: "0001",
        conta: "00000-0",
        chavePix: "",
        percentual: 60,
      },
      {
        id: "bf-4",
        nome: "Condomínio Arena 7",
        banco: "001",
        agencia: "0001",
        conta: "00000-0",
        chavePix: "",
        percentual: 40,
      },
    ],
  },
  {
    id: "sp-sede",
    empresa: "PV MOB",
    nivel: "local",
    local: LOCAIS[7],
    atualizadoEm: "2026-08-30",
    beneficiarios: [
      {
        id: "bf-5",
        nome: "Manutenção Predial SEDE",
        banco: "",
        agencia: "",
        conta: "",
        chavePix: "financeiro.sede@exemplo.com.br",
        percentual: 8.75,
      },
    ],
  },
  {
    id: "sp-duofood",
    empresa: "PV MOB",
    nivel: "local",
    local: LOCAIS[1],
    atualizadoEm: "2026-09-16",
    beneficiarios: [],
  },
];

/* ────────────────────────────────────────────────────────────────────────────
   Derivações
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Soma dos percentuais.
 *
 * ⚠️ Arredondada a duas casas de propósito. Com 33,33 três vezes, a soma em ponto
 * flutuante dá `99.99000000000001` — e sem o arredondamento a tela acusaria "não fecha"
 * numa distribuição que fecha. O arredondamento é na SOMA, não em cada fatia: arredondar
 * cada uma perderia a diferença que a soma precisa enxergar.
 */
export function totalDistribuido(s: Split): number {
  return Math.round(s.beneficiarios.reduce((a, b) => a + b.percentual, 0) * 100) / 100;
}

/** O que sobra para o titular do nível. Negativo quando a distribuição estourou. */
export function restante(s: Split): number {
  return Math.round((100 - totalDistribuido(s)) * 100) / 100;
}

/**
 * Situação da distribuição — o que decide a cor e o texto do resumo.
 *
 * Três estados e não dois: "fechada" (exatos 100%) é diferente de "com sobra", porque na
 * primeira **não há saldo para o titular** — e isso é uma decisão, não um erro. Tratar as
 * duas como "ok" esconderia de quem configura que ele zerou a própria parte.
 */
export type SituacaoDoSplit = "vazio" | "parcial" | "fechado" | "estourado";

export function situacao(s: Split): SituacaoDoSplit {
  if (s.beneficiarios.length === 0) return "vazio";
  const total = totalDistribuido(s);
  if (total > 100) return "estourado";
  if (total === 100) return "fechado";
  return "parcial";
}

export const TEXTO_DA_SITUACAO: Record<SituacaoDoSplit, string> = {
  vazio: "Sem beneficiários",
  parcial: "Distribuição parcial",
  fechado: "Distribuição fechada",
  estourado: "Acima de 100%",
};

/** Quantos locais o split alcança. No nível empresa, todos. */
export function locaisAlcancados(s: Split): number {
  return s.nivel === "empresa" ? LOCAIS.length : 1;
}

/** Como o beneficiário recebe — é o que a linha resume em uma frase. */
export function comoRecebe(b: Beneficiario): string {
  if (b.chavePix) return `PIX · ${b.chavePix}`;
  if (!b.banco) return "Sem dados de recebimento";
  return `${rotuloDoBanco(b.banco)} · ag. ${b.agencia} · c/c ${b.conta}`;
}

export function dataCurta(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export const percentual = (v: number) =>
  `${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

/** Um beneficiário novo, em branco — o que o "Adicionar split" empilha. */
export function beneficiarioVazio(indice: number): Beneficiario {
  return {
    id: `novo-${indice}-${Date.now()}`,
    nome: "",
    banco: "",
    agencia: "",
    conta: "",
    chavePix: "",
    percentual: 0,
  };
}

export const SPLITS_TEXTOS = {
  aviso:
    "Como a receita de cada recarga é dividida. O split do local corta primeiro; o da empresa corta o que sobrou.",
  novo: "Novo split",
  adicionar: "Adicionar beneficiário",
  salvar: "Salvar alterações",
  totalLabel: "Total distribuído",
  vazio: "Nenhum beneficiário configurado. A receita fica inteira com o titular.",
  ajudaDaEmpresa:
    "Esta distribuição é aplicada sobre o saldo restante após as distribuições de local.",
  ajudaDoLocal:
    "Esta distribuição corta primeiro, sobre a receita bruta deste local.",
  excluirTitulo: "Excluir este split?",
  excluirDescricao:
    "a regra de divisão deixa de valer e a receita passa a ficar inteira com o titular do nível.",
} as const;
