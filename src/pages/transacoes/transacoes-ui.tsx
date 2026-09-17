import { Avatar, Chip } from "@snksergio/design-system";
import type { TransacaoStatus } from "./transacoes-mock";

/**
 * Vocabulário visual da tela de Transações.
 *
 * Existe como arquivo próprio — e não dentro de `transacoes-columns.tsx` — porque a
 * tabela E o painel de detalhe usam os mesmos tratamentos: chip de status, dinheiro em
 * verde, avatar de motorista. Duas cópias divergem na primeira alteração, e aí a mesma
 * informação passa a ter duas aparências na mesma tela.
 *
 * É o padrão do VP (`mapa-clientes-ui.tsx`), que separa exatamente por isso.
 */

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const ROTULO_STATUS: Record<TransacaoStatus, string> = {
  finalizado: "Finalizado",
  "em-andamento": "Em andamento",
  falha: "Falha",
};

/**
 * Cor por status. `info` no meio de propósito: "em andamento" não é sucesso nem erro, e
 * pintá-lo de `warning` diria ao operador que há algo a corrigir.
 */
const COR_STATUS: Record<TransacaoStatus, "success" | "info" | "danger"> = {
  finalizado: "success",
  "em-andamento": "info",
  falha: "danger",
};

/**
 * Chip, não Badge — é o padrão do VP (`mapa-clientes-ui.tsx`): `variant="soft"`,
 * `size="sm"`, `shape="pill"`. O `Badge` tem outra escala de altura e canto reto, e numa
 * tabela densa as duas formas lado a lado ficam visivelmente desalinhadas.
 */
export function StatusChip({ status }: { status: TransacaoStatus }) {
  return (
    <Chip color={COR_STATUS[status]} variant="soft" size="sm" shape="pill">
      {ROTULO_STATUS[status]}
    </Chip>
  );
}

/**
 * Categoria curta (empresa, aplicativo, motivo, perfil de preço) → chip neutro.
 *
 * O ponto não é enfeitar: é marcar que o valor pertence a um CONJUNTO FECHADO, e não é
 * texto livre. Na tabela isso separa "PV MOB" (uma de N empresas) de "IGREEN MOB - Usina
 * Solar Vinhedo" (nome próprio do local), que hoje leem igual.
 */
export function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <Chip color="neutral" variant="soft" size="sm">
      {children}
    </Chip>
  );
}

/** Dinheiro no padrão da tela de finance do DS: semibold + tabular + success. */
export function Dinheiro({ valor }: { valor: number }) {
  return (
    <span className="font-semibold tabular-nums text-fg-success">{BRL.format(valor)}</span>
  );
}

/** Iniciais do nome: primeira + última palavra. */
export function iniciaisDe(nome: string): string {
  const p = nome.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
}

/**
 * Paleta de avatar, escolhida DETERMINISTICAMENTE pelo nome.
 *
 * Hash simples em vez de `Math.random`: o mesmo motorista tem sempre a mesma cor, em
 * qualquer reload, na tabela e no painel. Cor que muda a cada render deixa de ser
 * identidade e vira ruído. O `Avatar` resolve o contraste do texto por WCAG a partir do
 * hex (L-027), então não há par cor/texto pra acertar na mão.
 */
const PALETA_AVATAR = ["#2563EB", "#7C3AED", "#DB2777", "#EA580C", "#0891B2", "#65A30D"];

export function corDoNome(nome: string): string {
  let h = 0;
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) % 9973;
  return PALETA_AVATAR[h % PALETA_AVATAR.length];
}

/**
 * Identidade do motorista: avatar + nome.
 *
 * `size="md"` (28px) é o mesmo da célula de licenciado do `example-finance`
 * (`finance-screen.tsx:126`) — que é o precedente do DS pra identidade em tabela. Era
 * `xs` (20px), pequeno demais pra as iniciais lerem.
 *
 * `min-w-0` + `truncate` no nome e `shrink-0` no avatar: sem isso o nome longo empurra
 * o avatar pra fora em vez de reticenciar.
 *
 * ⚠️ No PAINEL este mesmo componente aparece num campo largo, então o `truncate` não
 * dispara lá — é o mesmo componente servindo os dois contextos, que é o ponto de ele
 * morar aqui.
 */
export function MotoristaCelula({ nome }: { nome: string }) {
  return (
    <span className="flex min-w-0 items-center gap-gp-md">
      <Avatar size="md" colorHex={corDoNome(nome)} className="shrink-0" aria-label={nome}>
        {iniciaisDe(nome)}
      </Avatar>
      <span className="truncate">{nome}</span>
    </span>
  );
}
