import { useState } from "react";
import { Info, Trash2 } from "lucide-react";
import { Button, Modal } from "@snksergio/design-system";
import { EXCLUIR, type Carregador } from "./carregadores-mock";

/**
 * Modal de exclusão de Carregadores.
 *
 * ⚠️ O `Adicionar carregador` saiu deste arquivo em 2026-09-17: ele virou um fluxo de três
 * passos e mora em `ModalAdicionarCarregador.tsx`. Este arquivo ficou só com a exclusão.
 */

/**
 * Confirmação de exclusão.
 *
 * ## Por que NÃO é o `AlertModal`
 *
 * O `AlertModal` do DS resolve pergunta + descrição + dois botões, e é o que as outras
 * confirmações deste projeto usam. Aqui a referência mostra três blocos distintos — a
 * pergunta, a nota de permanência e **qual carregador** está sendo excluído — e o nome do
 * equipamento é o que separa "excluí o certo" de "excluí o errado". O `AlertModal` não tem
 * slot de corpo pra ele.
 *
 * ## `danger`, e é o único da tela
 *
 * Os guardas de Preços são `warning` porque tudo lá volta atrás. Este não: o texto da própria
 * origem diz que a ação é permanente. Vermelho aqui é a informação, não decoração.
 */
export function ModalExcluirCarregador({
  carregador,
  open,
  onClose,
}: {
  carregador: Carregador;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={EXCLUIR.titulo}
      icon={<Trash2 className="size-icon-md" strokeWidth={1.7} />}
      size="md"
      secondaryAction={{ label: EXCLUIR.cancelar }}
      primaryAction={{
        label: EXCLUIR.confirmar,
        onClick: onClose,
        danger: true,
      }}
    >
      <div className="flex flex-col gap-gp-xs">
        <span className="text-body-sm font-semibold text-fg-default">
          {EXCLUIR.pergunta}
        </span>
        <span className="text-body-sm text-fg-muted">{EXCLUIR.descricao}</span>
      </div>

      <div className="flex items-start gap-gp-md rounded-radius-lg border border-border-danger-muted bg-bg-danger-muted px-pad-2xl py-pad-xl text-caption-md text-fg-danger">
        <Info className="mt-[1px] size-icon-sm shrink-0" aria-hidden />
        {EXCLUIR.nota}
      </div>

      {/* Qual carregador — o bloco que o `AlertModal` não teria onde pôr, e o que impede
          excluir o vizinho de lista por engano. */}
      <div className="flex flex-wrap items-baseline gap-gp-sm rounded-radius-lg bg-bg-muted px-pad-2xl py-pad-xl text-body-sm">
        <span className="text-fg-muted">Carregador</span>
        <span className="font-semibold text-fg-default">
          {carregador.nome}
        </span>
        <span className="tabular-nums text-fg-muted">
          · CPCODE {carregador.cpcode}
        </span>
      </div>
    </Modal>
  );
}
