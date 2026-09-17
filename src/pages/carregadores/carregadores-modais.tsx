import { useState } from "react";
import { Info, Plug, Trash2 } from "lucide-react";
import { Button, Modal } from "@snksergio/design-system";
import {
  ADICIONAR,
  EXCLUIR,
  gerarIdDeCarregador,
  type Carregador,
} from "./carregadores-mock";

/**
 * Os dois modais de Carregadores — `Adicionar carregador` e `Excluir Carregador`.
 */

/**
 * Modal de cadastro.
 *
 * ## Um campo só, e é de propósito
 *
 * A referência pede APENAS o ID aqui, e o botão é `Continuar`, não `Salvar`: cadastrar um
 * carregador é um fluxo, e este é o primeiro passo. Todo o resto (nome, modelo, preço) vem
 * depois que o equipamento se conecta e se identifica — pedir tudo aqui seria pedir dados
 * que quem está com a chave de fenda na mão ainda não tem.
 *
 * ## O botão `Gerar` existe porque o ID precisa ser único
 *
 * Seis caracteres no mínimo, e não pode colidir com nenhum outro da base. Quem instala não
 * tem como saber o que já existe, então a ferramenta gera.
 */
export function ModalAdicionarCarregador({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [id, setId] = useState("");
  const curto = id.trim().length > 0 && id.trim().length < 6;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={ADICIONAR.titulo}
      icon={<Plug className="size-icon-md" strokeWidth={1.7} />}
      size="lg"
      secondaryAction={{ label: "Cancelar" }}
      /* Desabilitado enquanto não há um ID válido: `Continuar` sem ID não continua pra
         lugar nenhum, e botão que não faz nada ensina a desconfiar do botão. */
      primaryAction={{
        label: ADICIONAR.continuar,
        onClick: onClose,
        disabled: id.trim().length < 6,
      }}
    >
      <div className="flex flex-col gap-gp-md">
        <span className="text-body-sm font-semibold tracking-[0.01em] text-fg-default dark:text-fg-muted">
          {ADICIONAR.label}
        </span>
        {/* Campo e botão na mesma linha, como na referência — `Gerar` preenche o campo ao
            lado, e separá-los faria parecer duas ações independentes. */}
        <div className="flex flex-wrap items-start gap-gp-md">
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder={ADICIONAR.placeholder}
            aria-label={ADICIONAR.label}
            className="min-h-form-lg min-w-0 flex-1 rounded-radius-lg border border-border-input bg-bg-input px-pad-xl text-body-sm tabular-nums text-fg-default outline-none transition-[border-color,box-shadow] placeholder:text-fg-subtle focus-visible:border-border-brand focus-visible:shadow-sh-ring dark:bg-bg-muted"
          />
          <Button
            variant="outline"
            color="secondary"
            size="lg"
            onClick={() => setId(gerarIdDeCarregador())}
          >
            {ADICIONAR.gerar}
          </Button>
        </div>
        <span
          className={`text-caption-md ${curto ? "text-fg-danger" : "text-fg-muted"}`}
        >
          {curto
            ? `O ID precisa ter 6 caracteres ou mais — ${ADICIONAR.placeholder.toLowerCase()}.`
            : ADICIONAR.ajuda}
        </span>
      </div>
    </Modal>
  );
}

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
