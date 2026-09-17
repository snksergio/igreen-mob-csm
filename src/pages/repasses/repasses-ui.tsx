import { Chip } from "@snksergio/design-system";
import type { StatusRepasse } from "./repasses-mock";

/**
 * Vocabulário visual de Repasses — dinheiro e status.
 *
 * Arquivo próprio pelo mesmo motivo do `transacoes-ui.tsx`: a tabela da tela E a tabela do
 * painel de detalhe usam os mesmos tratamentos, e duas cópias divergem na primeira
 * alteração.
 */

/** Formatador único de moeda. Exportado porque o painel também precisa dele. */
export const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const ROTULO_STATUS: Record<StatusRepasse, string> = {
  "em-aberto": "Em aberto",
  pago: "Pago",
  processando: "Processando",
};

/**
 * Cor por status.
 *
 * `warning` em "Em aberto" — que é o status de TODAS as 12 linhas medidas. Não é sucesso
 * (o dinheiro não saiu) nem erro (nada falhou): é pendência, e pendência é warning.
 */
const COR_STATUS: Record<StatusRepasse, "warning" | "success" | "info"> = {
  "em-aberto": "warning",
  pago: "success",
  processando: "info",
};

/** `Chip`, não `Badge` — o mesmo padrão de status da tela de Transações. */
export function StatusChip({ status }: { status: StatusRepasse }) {
  return (
    <Chip color={COR_STATUS[status]} variant="soft" size="sm" shape="pill">
      {ROTULO_STATUS[status]}
    </Chip>
  );
}

/**
 * Valor monetário.
 *
 * ⚠️ **Verde só no positivo.** A referência tem `-R$ 0,01` em duas linhas, e pintar um
 * valor negativo de `fg-success` diria "entrou dinheiro" sobre uma saída. Zero fica neutro
 * — `R$ 0,00` não é ganho.
 */
export function Dinheiro({ valor }: { valor: number }) {
  const cor =
    valor > 0 ? "text-fg-success" : valor < 0 ? "text-fg-danger" : "text-fg-muted";

  return (
    <span className={`font-semibold tabular-nums ${cor}`}>{brl.format(valor)}</span>
  );
}
