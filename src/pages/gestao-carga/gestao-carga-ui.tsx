import { Chip } from "@snksergio/design-system";
import type { StatusCarregador } from "./gestao-carga-mock";

/**
 * Vocabulário visual de Gestão de Carga.
 *
 * Os rótulos de status são **literais do i18n da origem** (chave `ChargerStatus`) — não
 * tradução minha. Inclusive as duas colisões dela: `SuspendedEV` e `Finishing` mapeiam os
 * dois pra "Finalizando", e `Undefined` mapeia pra "Offline".
 */

const ROTULO_STATUS: Record<StatusCarregador, string> = {
  disponivel: "Disponível",
  carregando: "Carregando",
  preparando: "Preparando",
  aguardando: "Aguardando",
  finalizando: "Finalizando",
  indisponivel: "Indisponível",
  falha: "Falha",
};

/**
 * Cor por status.
 *
 * `carregando` é `success` e `disponivel` é `info`, não o contrário — e isso é decisão de
 * domínio, não estética: nesta tela o que se quer ver é **equipamento trabalhando**.
 * Carregador disponível é estado neutro saudável (informação), carregador carregando é o
 * resultado desejado. `indisponivel` fica `neutral` e `falha` fica `danger` — a diferença
 * entre "desligado de propósito" e "quebrado" é a que decide se alguém sai de casa, e é ela
 * que o par cinza/vermelho carrega.
 *
 * ⚠️ **O `Chip` não tem cor `caution`** — são seis (`primary neutral danger warning success
 * info`), enquanto os TOKENS têm a família `caution` inteira. `indisponivel` ficaria melhor
 * nela: é um estado que pede atenção sem ser falha, e `neutral` o achata junto de rótulo
 * comum. Gap do DS, e o segundo desta tela depois da variante `warning` do `Alert`.
 */
const COR_STATUS: Record<
  StatusCarregador,
  "success" | "info" | "warning" | "neutral" | "danger"
> = {
  carregando: "success",
  disponivel: "info",
  preparando: "warning",
  aguardando: "warning",
  finalizando: "warning",
  indisponivel: "neutral",
  falha: "danger",
};

/** `Chip` soft pill — o mesmo padrão de status de Transações e Repasses. */
export function StatusChip({ status }: { status: StatusCarregador }) {
  return (
    <Chip color={COR_STATUS[status]} variant="soft" size="sm" shape="pill">
      {ROTULO_STATUS[status]}
    </Chip>
  );
}

const UM_DECIMAL = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * Potência em kW.
 *
 * ⚠️ **Zero fica neutro, não verde.** A referência mostra `0,0 kW` em todas as linhas — a
 * rede estava ociosa — e pintar isso de sucesso diria "está tudo funcionando" sobre uma
 * frota parada. Verde só quando há potência de verdade.
 */
export function Potencia({ kw }: { kw: number }) {
  return (
    <span
      className={`font-semibold tabular-nums ${
        kw > 0 ? "text-fg-success" : "text-fg-muted"
      }`}
    >
      {UM_DECIMAL.format(kw)} kW
    </span>
  );
}

/** Corrente em ampères, no mesmo tratamento da potência. */
export function Corrente({ a }: { a: number }) {
  return (
    <span className={`tabular-nums ${a > 0 ? "text-fg-default" : "text-fg-muted"}`}>
      {UM_DECIMAL.format(a)} A
    </span>
  );
}
