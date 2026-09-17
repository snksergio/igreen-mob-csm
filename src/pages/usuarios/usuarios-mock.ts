import { MOTORISTAS, type Motorista } from "~/pages/motoristas/motoristas-mock";

/**
 * Mock da tela de Usuários — medida em `/pt/settings/users?page=1` (2026-09-16).
 *
 * ## A referência estava VAZIA, e é por isso que este arquivo existe
 *
 * A tela da origem mostrava "Sem resultados": os três filtros no topo vinham com um recorte
 * que não casava com nada. Então o que é medido aqui são só a **estrutura** e os **rótulos**
 * — as sete colunas, os nomes dos três filtros e as opções de cada um. Os dados são
 * inventados, a pedido do operador.
 *
 * ## É o MESMO motorista da tela de Motoristas
 *
 * `MOTORISTAS` já tem nome, e-mail, CPF, tags, transações e valor gasto. Este arquivo só
 * acrescenta o que a tela de Usuários mostra a mais: carteira, veículo favorito e
 * satisfação. Duas listas de pessoa divergiriam no primeiro cadastro novo — e "o motorista
 * existe numa tela e não na outra" é o defeito que ninguém reproduz.
 *
 * ⚠️ Nada de dado pessoal real, como no resto do projeto: os nomes vêm da lista fictícia de
 * Motoristas, e os e-mails apontam pro domínio do mock.
 */

/** Recorte por atividade — o primeiro filtro da referência, com os rótulos dela. */
export type AtividadeDoUsuario = "com-recargas" | "sem-recargas";

export const ROTULO_DA_ATIVIDADE: Record<AtividadeDoUsuario, string> = {
  "com-recargas": "Com recargas realizadas",
  "sem-recargas": "Sem recargas (novos)",
};

/** Recorte por saldo — o segundo filtro, também com os rótulos medidos. */
export type SaldoDoUsuario = "positivo" | "negativo" | "zerada";

export const ROTULO_DO_SALDO: Record<SaldoDoUsuario, string> = {
  positivo: "Saldo positivo",
  negativo: "Saldo negativo",
  zerada: "Carteira zerada",
};

export interface Usuario extends Motorista {
  empresa: string;
  /** Saldo da carteira em reais. Negativo = consumo a faturar. */
  carteira: number;
  /** Modelo mais usado. `null` quando o usuário nunca recarregou. */
  veiculoFavorito: string | null;
  /** Média das avaliações, de 1 a 5. `null` sem avaliação. */
  satisfacao: number | null;
  /** Reais gastos no total — acumulado, não o do período. */
  totalGasto: number;
}

/** PRNG determinístico — mesma semente, mesmo usuário. */
function prng(semente: number) {
  let s = semente;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const VEICULOS = [
  "BYD Dolphin",
  "Volvo EX30",
  "Jaecoo 7",
  "GWM Ora 03",
  "Renault Kwid E-Tech",
  "BYD Seal",
  "Fiat 500e",
];

export const USUARIOS: Usuario[] = MOTORISTAS.map((m, i) => {
  const rnd = prng(4200 + i * 97);

  /* Dois "novos" na lista: sem recarga, sem veículo favorito e sem satisfação. Sem eles,
     a visão `Sem recargas` e os três estados de célula vazia nasceriam sem exercício. */
  const novo = i === 3 || i === 8;

  /* Três faixas de carteira, uma por estado do filtro. A distribuição não é aleatória:
     ela garante pelo menos um de cada, senão as visões abririam vazias — que é
     exatamente o defeito da tela de origem. */
  const carteira =
    i % 5 === 0
      ? 0
      : i % 5 === 1
        ? -Math.round(rnd() * 8000) / 100
        : Math.round(rnd() * 25000) / 100;

  return {
    ...m,
    empresa: "PV MOB",
    carteira,
    veiculoFavorito: novo ? null : VEICULOS[i % VEICULOS.length],
    /* 3,0 a 5,0 com uma casa — nota abaixo de 3 num mock de 10 linhas faria parecer que a
       operação vai mal, e a tela não é sobre isso. */
    satisfacao: novo ? null : Math.round((3 + rnd() * 2) * 10) / 10,
    totalGasto: novo ? 0 : Math.round((m.valor * (2 + rnd() * 6)) * 100) / 100,
    transacoes: novo ? 0 : m.transacoes,
  };
});

/** Em que faixa de saldo um usuário cai. Fonte única do filtro e do chip. */
export function saldoDoUsuario(u: Usuario): SaldoDoUsuario {
  if (u.carteira === 0) return "zerada";
  return u.carteira > 0 ? "positivo" : "negativo";
}

/** Se ele já recarregou alguma vez. */
export function atividadeDoUsuario(u: Usuario): AtividadeDoUsuario {
  return u.transacoes > 0 ? "com-recargas" : "sem-recargas";
}

export const USUARIOS_TEXTOS = {
  aviso:
    "Dados correspondentes aos locais selecionados no topo. Para alterar, use o seletor no topo da página.",
  buscar: "Buscar motorista",
  baixarDados: "Baixar dados",
  /**
   * ⚠️ O texto do modal de exclusão.
   *
   * Ele nomeia a consequência em vez de perguntar "tem certeza?": quem lê "tem certeza"
   * já clicou em excluir e vai clicar de novo. O que faz alguém parar é descobrir que o
   * histórico de recarga fica e a carteira some.
   */
  excluirTitulo: "Excluir usuário",
  excluirDescricao:
    "O cadastro e a carteira são removidos. O histórico de recargas permanece nos relatórios, sem vínculo com o usuário. Esta ação não pode ser desfeita.",
} as const;
