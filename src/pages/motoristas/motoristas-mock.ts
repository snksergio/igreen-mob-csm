/**
 * Mock da tela de Motoristas — medida em `/pt/drivers?page=1` (2026-09-16).
 *
 * ## ⛔ Os dados pessoais da referência NÃO foram copiados
 *
 * A primeira página da origem traz dez pessoas reais: nome completo, e-mail, **CPF** e
 * telefone. Isso é dado pessoal de gente que existe, e não entra num mock por três motivos
 * que valem separados:
 *
 * 1. **CPF identifica uma pessoa.** Copiar onze dígitos de um sistema de teste para um
 *    repositório é vazamento, mesmo que o repositório seja interno e nunca publicado.
 * 2. **E-mail e telefone são endereçáveis.** Um mock com e-mail real é um mock que alguém
 *    pode disparar sem querer num teste de integração.
 * 3. **O mock não fica pior sem eles.** O que a tela precisa exercitar é a FORMA — CPF
 *    mascarado, e-mail longo que trunca, telefone com e sem máscara — e forma é o que
 *    reproduzo abaixo, campo a campo.
 *
 * O que É medido e está fiel: as onze colunas, a ordem delas, os formatos (`0,00 kWh`,
 * `04h 47min`, `R$ 339,63`), o `–` nas colunas vazias, a inconsistência de máscara do
 * telefone, e todos os rótulos dos dois modais.
 *
 * ## A inconsistência do telefone é MEDIÇÃO
 *
 * A origem tem `(31) 98556-8104` e `31994641836` na mesma página — uns com máscara, outros
 * sem. É dado digitado por gente diferente em momentos diferentes, e normalizar aqui
 * esconderia que a coluna precisa aguentar as duas formas.
 */

export interface Motorista {
  id: string;
  nome: string;
  email: string;
  /** Mascarado, `000.000.000-00`. Fictício — ver a nota no topo. */
  cpf: string;
  tags: string[];
  /** Campo livre da origem. Medido vazio (`–`) em 10/10. */
  complemento: string;
  telefone: string;
  /** Quantos carregadores distintos ele usou. */
  carregadores: number;
  transacoes: number;
  /** kWh somados no período. */
  energiaKwh: number;
  /** Minutos somados no período. */
  duracaoMin: number;
  /** Reais somados no período. */
  valor: number;
}

/**
 * Nomes fictícios.
 *
 * Alguns são de pessoa e um é de empresa (`UTLD PRODUCAO DE FILMES LTDA` na origem vira
 * `PRODUTORA CENTRO OESTE LTDA` aqui): a coluna se chama `Usuários`, não `Pessoas`, e
 * cadastro de CNPJ aparece nela. Uma lista só de nomes de pessoa esconderia isso.
 */
const NOMES = [
  "Adriana Peixoto Vasques",
  "Bruno Sacramento Vilela",
  "Camila Ferrari do Amparo",
  "Diogo Tavares Bicalho",
  "Elisa Quirino Marcondes",
  "PRODUTORA CENTRO OESTE LTDA",
  "Fabrício Anhaia Sobral",
  "Giovana Pestana Ruivo",
  "Heitor Calmon Teixeira",
  "Isabela Fontoura Prado",
  "João Vitor Sampaio Rios",
  "Karina Belfort Azeredo",
  "Lucas Andrade Portela",
  "Mariana Cordeiro Vidal",
  "Nelson Bittencourt Faria",
  "Olívia Tancredo Bastos",
  "TRANSPORTES SERRA AZUL LTDA",
  "Paulo Renato Guimarães",
  "Queila Monteiro Rangel",
  "Rafael Toledo Bandeira",
  "Sofia Almeida Quintanilha",
  "Thiago Vasconcelos Pires",
];

/** Tags de preço, o que o filtro da referência oferece. */
export const TAGS_DISPONIVEIS = [
  "Frota",
  "Convênio",
  "Funcionário",
  "Parceiro",
  "Visitante",
];

/** PRNG determinístico. */
function prng(semente: number) {
  let s = semente;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/**
 * CPF fictício com a máscara da origem.
 *
 * ⚠️ **Os dígitos verificadores são gerados junto com o resto — o CPF NÃO é válido.** É
 * deliberado: um CPF com dígito correto é um CPF que existe, ou vai existir, e nenhum mock
 * precisa disso. A tela só exibe o valor mascarado; validar CPF é problema de quem cadastra.
 */
function cpfFicticio(rnd: () => number): string {
  const d = () => Math.floor(rnd() * 10);
  const bloco = () => `${d()}${d()}${d()}`;
  return `${bloco()}.${bloco()}.${bloco()}-${d()}${d()}`;
}

/**
 * Telefone fictício, com ou sem máscara.
 *
 * Os dois formatos convivem na origem — ver a nota no topo. O DDD sai de uma lista de
 * códigos de Minas e São Paulo, que é de onde vêm os locais do parque.
 */
function telefoneFicticio(rnd: () => number, comMascara: boolean): string {
  const ddds = [31, 32, 34, 35, 37, 38, 11, 19];
  const ddd = ddds[Math.floor(rnd() * ddds.length)];
  const p1 = 90000 + Math.floor(rnd() * 9999);
  const p2 = 1000 + Math.floor(rnd() * 8999);
  return comMascara ? `(${ddd}) ${p1}-${p2}` : `${ddd}9${p1}${p2}`;
}

/** E-mail fictício a partir do nome, em domínio de exemplo. */
function emailFicticio(nome: string, rnd: () => number): string {
  const base = nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .join(".");
  const dominios = ["exemplo.com", "exemplo.com.br", "mail.exemplo.com"];
  return `${base}${Math.floor(rnd() * 90) + 10}@${
    dominios[Math.floor(rnd() * dominios.length)]
  }`;
}

export const MOTORISTAS: Motorista[] = NOMES.map((nome, i) => {
  const rnd = prng(2200 + i * 83);
  /* A primeira linha da referência tem tudo zerado: uma recarga que não consumiu nada.
     É o caso que testa se a tela aguenta zero sem parecer defeito. */
  const zerado = i === 0;
  const transacoes = zerado ? 1 : 1 + Math.floor(rnd() * 14);
  const energiaKwh = zerado
    ? 0
    : Number((transacoes * (4 + rnd() * 10)).toFixed(2));
  const duracaoMin = zerado ? 0 : Math.round(transacoes * (20 + rnd() * 25));

  return {
    id: `motorista-${i}`,
    nome,
    email: emailFicticio(nome, rnd),
    cpf: cpfFicticio(rnd),
    /* Medido `–` em 10/10 — mas sem nenhuma tag o filtro da referência não teria o que
       filtrar e a edição de tags do painel não teria o que mostrar. Um terço recebe tag. */
    tags: rnd() < 0.34 ? [TAGS_DISPONIVEIS[Math.floor(rnd() * 5)]] : [],
    /* Medido vazio em 10/10, e aqui também: é campo livre que ninguém preenche, e inventar
       conteúdo faria parecer que ele serve pra alguma coisa. */
    complemento: "",
    telefone: telefoneFicticio(rnd, rnd() < 0.6),
    carregadores: 1 + Math.floor(rnd() * 3),
    transacoes,
    energiaKwh,
    duracaoMin,
    /* ~R$ 2,50/kWh, a ordem de grandeza da referência (18,39 kWh → R$ 45,96). Invariante
       testada: valor e energia andam juntos. */
    valor: Number((energiaKwh * 2.5).toFixed(2)),
  };
});

/**
 * Duração no formato da origem: `28min`, `04h 47min`.
 *
 * Abaixo de uma hora some a parte de horas — `00h 28min` gastaria três caracteres pra dizer
 * "nenhuma hora". Acima, as horas vêm com zero à esquerda, que é o que alinha a coluna.
 */
export function formatarDuracao(min: number): string {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}min`;
}

/* ── Textos literais da referência ──────────────────────────────────────────────── */

export const MOTORISTAS_TEXTOS = {
  aviso:
    "Exibindo motoristas que realizaram recargas nos sites selecionados no seletor global.",
  baixarDados: "Baixar dados",
  buscar: "Buscar por nome, e-mail, telefone ou CPF",
} as const;

export const EXPORTAR = {
  titulo: "Exportar dados",
  incluirLocais: "Incluir locais de recarga",
  incluirLocaisAjuda:
    "Inclui na tabela os locais que o motorista realizou recargas",
  csv: "Baixar CSV",
  pdf: "Baixar PDF",
} as const;

export const TAGS_MODAL = {
  titulo: "Tags do usuário por empresa",
  empresa: "Empresa",
  tags: "Tags",
  placeholder: "Digite uma tag e pressione Enter",
  ajuda: "Pressione Enter para adicionar cada tag. Use o X para remover antes de salvar.",
} as const;
