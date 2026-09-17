import { useState } from "react";
import { Plug, Zap } from "lucide-react";
import {
  FormFieldInput,
  FormFieldSelect,
  FormFieldSwitch,
  Modal,
} from "@snksergio/design-system";
import {
  MODELOS_DE_MEDIDOR,
  NOME_DO_GRUPO_RAIZ,
  VAZIO_CARREGADORES_DISPONIVEIS,
  nivelDeEntrada,
  type LocalDeCarga,
} from "./gestao-carga-mock";

/**
 * Os três modais de Gestão de Carga — medidos na referência (2026-09-16).
 *
 * ## Modal, e não um segundo painel
 *
 * Os três **interrompem** o painel de detalhe pra pedir input e voltam pra ele. É a definição
 * de modal no DS (`Modal/USAGE.md`: "input que interrompe o fluxo"), e empilhar
 * `FloatingPanel` sobre `FloatingPanel` daria dois níveis de painel lateral com dois `X`
 * diferentes — o usuário perde qual fecha o quê.
 *
 * ## Rótulos literais, inclusive o que parece errado
 *
 * `Tensão ( Volts )` tem espaço dentro dos parênteses na origem, enquanto todos os vizinhos
 * são `(Amperes)` colado. Mantido: rótulo é conteúdo da referência, e "consertar" copy sem
 * pedir é o tipo de melhoria que some no diff e reaparece como divergência.
 *
 * ## Formulário de mockup, e o que isso significa aqui
 *
 * Nenhum dos três persiste — `Salvar`/`Adicionar` só fecham. Os campos são **não
 * controlados** (`defaultValue`), com uma exceção deliberada: o switch do medidor, porque
 * dele depende o estado dos outros quatro campos. Ver abaixo.
 */

/**
 * Modal de alteração dos parâmetros do nível de entrada.
 *
 * ## O switch do medidor governa quatro campos
 *
 * Na referência `ID do medidor`, `Modelo do medidor`, `Login` e `Senha` aparecem esmaecidos
 * enquanto o medidor está desativado — e é a única parte desta tela com comportamento, não só
 * forma. Reproduzido com estado de verdade: ligar o switch habilita os quatro.
 *
 * Deixá-los sempre habilitados seria mostrar credenciais de um medidor que não existe; deixá-
 * los sempre desabilitados esconderia o motivo de eles estarem ali.
 *
 * `Nome do grupo` é o único permanentemente desabilitado: o nível de entrada é a raiz da
 * instalação, não um grupo que alguém criou, e o nome dele não se renomeia.
 */
export function ModalAlterarParametros({
  local,
  open,
  onClose,
}: {
  local: LocalDeCarga;
  open: boolean;
  onClose: () => void;
}) {
  const entrada = nivelDeEntrada(local);
  const [medidorAtivo, setMedidorAtivo] = useState(entrada.medidorAtivo);

  return (
    <Modal
      open={open}
      onClose={onClose}
      /* O título é o LOCAL, não a ação: o modal abre por cima do painel de um local
         específico, e é o nome dele que ancora o que está sendo alterado. */
      title={local.local}
      icon={<Zap className="size-icon-md" strokeWidth={1.7} />}
      description="Alterar parâmetros"
      /* `lg` (720px) — as linhas são de dois campos, e em `md` (540px) cada um ficaria com
         ~250px, estreito demais pro rótulo `Corrente máxima disponível (Amperes)`. */
      size="lg"
      secondaryAction={{ label: "Cancelar" }}
      primaryAction={{ label: "Salvar", onClick: onClose }}
    >
      <FormFieldInput
        label="Nome do grupo"
        defaultValue=""
        placeholder={NOME_DO_GRUPO_RAIZ}
        disabled
        helperText="O nível de entrada é a raiz da instalação e não se renomeia."
      />

      {/* `gap-form-gap` (20px) entre campos, também no grid — L-024. */}
      <div className="grid grid-cols-1 gap-form-gap sm:grid-cols-2">
        <FormFieldInput
          label="Corrente máxima disponível (Amperes)"
          type="number"
          defaultValue={entrada.correnteMaximaA}
        />
        {/* Espaçamento LITERAL da origem — ver o JSDoc do arquivo. */}
        <FormFieldInput
          label="Tensão ( Volts )"
          type="number"
          defaultValue={entrada.tensaoV}
        />
        <FormFieldInput
          label="Limite fixo (Amperes)"
          type="number"
          defaultValue={entrada.limiteFixoA}
        />
        <FormFieldInput
          label="Reserva dinâmica (Amperes)"
          type="number"
          defaultValue={entrada.reservaDinamicaA}
        />
      </div>

      {/* O rótulo do switch é o ESTADO, como na origem: "Medidor desativado" quando está
          desligado. Rótulo fixo ("Medidor") com switch ao lado diria menos. */}
      <FormFieldSwitch
        label={medidorAtivo ? "Medidor ativado" : "Medidor desativado"}
        checked={medidorAtivo}
        onCheckedChange={setMedidorAtivo}
        switchPosition="end"
      />

      <div className="grid grid-cols-1 gap-form-gap sm:grid-cols-2">
        <FormFieldInput
          label="ID do medidor"
          defaultValue=""
          disabled={!medidorAtivo}
        />
        <FormFieldSelect
          label="Modelo do medidor"
          placeholder="Selecione o modelo"
          options={MODELOS_DE_MEDIDOR}
          disabled={!medidorAtivo}
        />
        <FormFieldInput label="Login" defaultValue="" disabled={!medidorAtivo} />
        <FormFieldInput
          label="Senha"
          type="password"
          defaultValue=""
          disabled={!medidorAtivo}
        />
      </div>
    </Modal>
  );
}

/**
 * Modal de criação de grupo de carga.
 *
 * Três dos quatro campos repetem os do nível de entrada — e é isso mesmo: um grupo de carga é
 * uma subdivisão da mesma rede, com o mesmo vocabulário elétrico. Só a tensão não aparece,
 * porque ela é do LOCAL e o grupo herda.
 */
export function ModalNovoGrupoDeCarga({
  local,
  open,
  onClose,
}: {
  local: LocalDeCarga;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={local.local}
      icon={<Zap className="size-icon-md" strokeWidth={1.7} />}
      description="Novo grupo de carga"
      size="lg"
      secondaryAction={{ label: "Cancelar" }}
      primaryAction={{ label: "Adicionar", onClick: onClose }}
    >
      <FormFieldInput label="Nome do grupo" placeholder="Adicione o nome" />
      {/* Largura inteira na origem, sozinha na linha — é o campo que define o teto do grupo,
          e os dois abaixo são recortes DELE. A hierarquia está no layout. */}
      <FormFieldInput label="Corrente máxima disponível (Amperes)" type="number" />
      <div className="grid grid-cols-1 gap-form-gap sm:grid-cols-2">
        <FormFieldInput label="Limite fixo (Amperes)" type="number" />
        <FormFieldInput label="Reserva dinâmica (Amperes)" type="number" />
      </div>
    </Modal>
  );
}

/**
 * Modal de vínculo de carregadores.
 *
 * ⚠️ **O vazio é o estado normal, não um caso de borda.** Todo carregador do mock já pertence
 * a um local — como na referência, onde este modal abriu vazio. Inventar um estoque de
 * carregadores soltos criaria equipamento que não existe em lugar nenhum da tela.
 *
 * E por isso `Adicionar` vem **desabilitado**: sem nada pra selecionar, um botão ativo é
 * controle morto — o usuário clica, nada acontece, e ele aprende a não confiar no botão.
 */
export function ModalAdicionarCarregadores({
  local,
  open,
  onClose,
}: {
  local: LocalDeCarga;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={local.local}
      icon={<Plug className="size-icon-md" strokeWidth={1.7} />}
      description="Adicionar carregadores"
      size="md"
      secondaryAction={{ label: "Cancelar" }}
      primaryAction={{ label: "Adicionar", disabled: true }}
    >
      <div className="flex flex-col gap-gp-md">
        <span className="text-body-xs font-semibold text-fg-muted">
          Carregadores disponíveis
        </span>
        <div className="flex flex-col items-center gap-gp-md rounded-radius-lg border border-dashed border-border-default px-pad-2xl py-pad-4xl">
          <Plug className="size-icon-lg text-fg-subtle" aria-hidden />
          <span className="text-center text-body-sm text-fg-muted">
            {VAZIO_CARREGADORES_DISPONIVEIS}
          </span>
        </div>
      </div>
    </Modal>
  );
}
