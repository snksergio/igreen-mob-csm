import { GEO_DOS_LOCAIS } from "~/pages/monitoramento/monitoramento-mock";

/**
 * Mock da tela de Estrutura da rede — medida em `/pt/settings/companies-net?page=1`
 * (2026-09-16).
 *
 * ## A hierarquia é o assunto da tela
 *
 * Três níveis, e cada um é uma coisa diferente:
 *
 * | nível | o que é | quantos |
 * |---|---|---|
 * | **rede** | o operador da plataforma — a raiz de tudo | 1 |
 * | **empresa** | quem responde comercialmente por um conjunto de locais | 1 hoje |
 * | **local** | o endereço físico onde os carregadores moram | 17 |
 *
 * A regra que a referência mostra sem dizer: **uma empresa tem vários locais**, e é isso
 * que a árvore existe pra tornar visível. As linhas ficam FLAT com `paiId`; o caminho é
 * que desenha a árvore (contrato do `getTreeDataPath` do `DataTable`).
 *
 * ## Os locais são os MESMOS do Monitoramento
 *
 * `GEO_DOS_LOCAIS` já tem os 17 com cidade e UF. Uma segunda lista de locais seria a
 * primeira coisa a divergir: um local cadastrado aqui e ausente lá é exatamente o defeito
 * que uma tela de estrutura deveria impedir.
 *
 * ## ⚠️ Nada de dado real da referência
 *
 * A origem mostra a razão social, o CNPJ, o endereço e o e-mail pessoal do responsável da
 * empresa dela. Nada disso entra aqui: os CNPJs são inválidos por construção (ver
 * `cnpjFicticio`), os nomes são inventados e os e-mails apontam pro domínio do nosso
 * próprio mock. O que é fiel é a ESTRUTURA — quais campos existem e em que ordem.
 */

export type NivelDaRede = "rede" | "empresa" | "local";

export interface NoDaRede {
  id: string;
  paiId: string | null;
  nivel: NivelDaRede;
  nome: string;
  cnpj: string;
  endereco: string;
  responsavel: string;
  email: string;
  /** Só em `local`: a cidade, pra tabela do painel. */
  cidade?: string;
  uf?: string;
  ativo: boolean;
}

/**
 * CNPJ com dígitos verificadores INVÁLIDOS de propósito.
 *
 * Um CNPJ que passa na validação é um CNPJ de alguém. A base é determinística (derivada do
 * índice) e os dois últimos dígitos são forçados pra falhar no módulo 11 — assim o número
 * tem a cara certa na tela e não bate com empresa nenhuma do mundo real.
 */
function cnpjFicticio(semente: number): string {
  const base = String(10000000 + semente * 137).padStart(8, "0");
  return `${base.slice(0, 2)}.${base.slice(2, 5)}.${base.slice(5, 8)}/0001-00`;
}

/** Nomes inventados. Ver o aviso sobre dado real no JSDoc do topo. */
const RESPONSAVEIS = [
  "Matheus Pego",
  "Renata Sampaio",
  "Otávio Bittencourt",
  "Larissa Menezes",
  "Fábio Andrade",
];

function emailDe(nome: string) {
  return `${nome.toLowerCase().split(" ")[0]}@exemplo.com.br`;
}

/** Logradouros genéricos — nenhum é o endereço real de ninguém. */
const ENDERECOS = [
  "Rua das Acácias, 120",
  "Avenida Central, 1.840",
  "Rodovia MG-010, km 24",
  "Praça do Comércio, 45",
  "Alameda dos Ipês, 733",
  "Travessa São João, 18",
  "Avenida Brasil, 2.205",
];

const REDE = {
  id: "rede",
  nome: "iGreen MOB",
  cnpj: cnpjFicticio(1),
  endereco: "Av. Raja Gabaglia, 1000 — Belo Horizonte, MG",
  responsavel: RESPONSAVEIS[1],
} as const;

const EMPRESAS = [
  {
    id: "emp-pv-mob",
    nome: "PV MOB",
    razaoSocial: "PV Mobilidade Elétrica Ltda.",
    cnpj: cnpjFicticio(2),
    endereco: "Rua João Pio, 108 — Belo Horizonte, MG — CEP 31310-300",
    responsavel: RESPONSAVEIS[0],
  },
] as const;

/**
 * As linhas, FLAT.
 *
 * ⚠️ `rows` flat + `getTreeDataPath` é o contrato do `DataTable`, não uma escolha de
 * modelagem: aninhar em `filhos[]` e "achatar na hora" duplicaria a árvore em dois lugares
 * — o array e o path — e eles divergiriam.
 */
export const ESTRUTURA: NoDaRede[] = [
  {
    id: REDE.id,
    paiId: null,
    nivel: "rede",
    nome: REDE.nome,
    cnpj: REDE.cnpj,
    endereco: REDE.endereco,
    responsavel: REDE.responsavel,
    email: emailDe(REDE.responsavel),
    ativo: true,
  },
  ...EMPRESAS.map((e) => ({
    id: e.id,
    paiId: REDE.id,
    nivel: "empresa" as const,
    nome: e.nome,
    cnpj: e.cnpj,
    endereco: e.endereco,
    responsavel: e.responsavel,
    email: emailDe(e.responsavel),
    ativo: true,
  })),
  ...Object.entries(GEO_DOS_LOCAIS).map(([nome, geo], i) => {
    const responsavel = RESPONSAVEIS[i % RESPONSAVEIS.length];
    return {
      /* Id derivado do NOME, não do índice: o nome é a chave natural (é o que casa com o
         Monitoramento) e um id posicional quebraria ao inserir um local no meio. */
      id: `local-${nome.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      paiId: EMPRESAS[0].id,
      nivel: "local" as const,
      nome,
      /* Local herda o CNPJ da empresa quando não tem razão social própria — é o que a
         referência mostra no formulário ("Razão Social" e "CNPJ" são opcionais no local). */
      cnpj: i % 3 === 0 ? cnpjFicticio(10 + i) : EMPRESAS[0].cnpj,
      endereco: `${ENDERECOS[i % ENDERECOS.length]} — ${geo.cidade}, ${geo.uf}`,
      responsavel,
      email: emailDe(responsavel),
      cidade: geo.cidade,
      uf: geo.uf,
      /* Um inativo na lista: sem ele o chip de status e o switch do formulário nasceriam
         sem nunca ter sido exercitados. */
      ativo: i !== 4,
    };
  }),
];


/** Os filhos diretos de um nó. */
export function filhosDe(id: string, linhas: NoDaRede[] = ESTRUTURA) {
  return linhas.filter((l) => l.paiId === id);
}

/** Quantos locais uma empresa tem — o número que a linha dela mostra. */
export function locaisDaEmpresa(
  empresaId: string,
  linhas: NoDaRede[] = ESTRUTURA,
) {
  return linhas.filter((l) => l.paiId === empresaId && l.nivel === "local");
}

/**
 * Caminho raiz → self, o que o `getTreeDataPath` do `DataTable` espera.
 *
 * ⚠️ Sobe pelo `paiId` e PARA se encontrar um ciclo. Um mock não cria ciclo, mas esta
 * função também recebe o que vier de uma edição futura, e um ciclo aqui trava o navegador
 * num laço infinito durante o render — o tipo de falha que não dá stack trace útil.
 */
export function caminhoDoNo(
  no: NoDaRede,
  linhas: NoDaRede[] = ESTRUTURA,
): string[] {
  const porId = new Map(linhas.map((l) => [l.id, l]));
  const caminho: string[] = [];
  const visitados = new Set<string>();
  let atual: NoDaRede | undefined = no;

  while (atual && !visitados.has(atual.id)) {
    visitados.add(atual.id);
    caminho.unshift(atual.id);
    atual = atual.paiId ? porId.get(atual.paiId) : undefined;
  }

  return caminho;
}

/* ── Opções dos formulários ─────────────────────────────────────────────── */

export const BANCOS = [
  "001 — Banco do Brasil",
  "033 — Santander",
  "077 — Inter",
  "104 — Caixa Econômica",
  "237 — Bradesco",
  "260 — Nu Pagamentos",
  "341 — Itaú Unibanco",
];

export const TIPOS_DE_CONTA = ["Corrente", "Poupança", "Pagamento"];

/** Literais da referência, na ordem dela. */
export const TIPOS_DE_NEGOCIO = [
  "Condomínio residencial",
  "Condomínio comercial",
  "Shopping center",
  "Supermercado",
  "Hotel e pousada",
  "Restaurante",
  "Posto de combustível",
  "Estacionamento",
  "Outro",
];

export const TIPOS_DE_LOCAL = ["Privado", "Público", "Semipúblico"];

export const ESTACIONAMENTO = ["Grátis", "Pago", "Não se aplica"];

export const CORES_DE_FUNDO = [
  "Branco",
  "Cinza claro",
  "Verde da marca",
  "Preto",
];

export const DIAS_DA_SEMANA = [
  "Domingo",
  "Segunda-Feira",
  "Terça-Feira",
  "Quarta-Feira",
  "Quinta-Feira",
  "Sexta-Feira",
  "Sábado",
];

export const REGIMES_DE_HORARIO = ["Customizado", "24 horas", "Fechado"];

/** Perfis de preço — o `Herdar perfil` da referência é opção, não ausência de valor. */
export const PERFIS_DE_PRECO = [
  "Herdar perfil da rede",
  "Tarifa padrão",
  "Tarifa convênio",
  "Tarifa noturna",
];

export const ESTRUTURA_TEXTOS = {
  aviso:
    "Dados correspondentes aos locais selecionados no topo. Para alterar, use o seletor no topo da página.",
  buscar: "Buscar empresa/local",
  novaEmpresa: "Adicionar empresa",
  novoLocal: "Adicionar local",
  semDadosBancarios:
    "Caso os dados bancários não sejam informados, os valores serão repassados para a conta da empresa.",
  pontosDeInteresse:
    "O que existe perto do local — mercado, praça de alimentação, banheiro. Aparece no app do motorista.",
} as const;
