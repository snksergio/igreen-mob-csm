import { useEffect, useState } from "react";
import {
  AtSign,
  Building2,
  Clock,
  CreditCard,
  FileText,
  Phone,
  Plug,
  Receipt,
  Save,
  Tag,
  Wallet,
  Zap,
} from "lucide-react";
import {
  Button,
  FloatingPanel,
  FormFieldSelect,
} from "@snksergio/design-system";
import { CampoDeTags } from "~/components/CampoDeTags";
import { LinhaDeDispositivo } from "~/pages/carregadores/carregadores-ui";
import {
  TAGS_DISPONIVEIS,
  TAGS_MODAL,
  formatarDuracao,
  type Motorista,
} from "./motoristas-mock";
import { TagsEditaveis } from "./motoristas-ui";

/**
 * Painel de detalhe de um motorista — **`dsgreen-paneldetail-2`**, como as outras telas.
 *
 * ## Traz TUDO que a tabela tem, e a origem não trazia
 *
 * Na referência, clicar numa linha abre um modal com três coisas: nome, e-mail e um campo de
 * tags. Todo o resto — CPF, telefone, quantos carregadores, quantas transações, energia,
 * duração, valor — fica só na tabela, que é justamente o lugar onde não se lê com calma.
 *
 * Aqui o painel repete a linha inteira em forma de ficha. Não é redundância: a tabela é pra
 * comparar motoristas, o painel é pra entender um.
 *
 * ## As tags aparecem duas vezes, de propósito
 *
 * Na **ficha**, editáveis no lugar (lápis no hover → popover). Na seção **Editar**, o mesmo
 * campo aberto. Os dois escrevem o mesmo estado — ver o comentário em `TagsEditaveis`.
 */

interface Props {
  motorista: Motorista | null;
  onClose: () => void;
}

export function MotoristaDetailPanel({ motorista, onClose }: Props) {
  const [tags, setTags] = useState<string[]>([]);
  const [empresa, setEmpresa] = useState("PV MOB");
  const [sujo, setSujo] = useState(false);

  useEffect(() => {
    if (!motorista) return;
    setTags(motorista.tags);
    setEmpresa("PV MOB");
    setSujo(false);
  }, [motorista]);

  if (!motorista) return null;

  const alterarTags = (t: string[]) => {
    setTags(t);
    setSujo(true);
  };

  const brl = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <FloatingPanel
      open={!!motorista}
      onOpenChange={(aberto) => !aberto && onClose()}
      side="right"
      /* 680px: a ficha é de duas colunas e o rótulo mais longo é "Carregadores usados". */
      size={680}
      resizable
      maximizable
      resizableMinWidth={560}
      resizableMaxWidth={1100}
      resizableStorageKey="igreen-mob-cms.motorista-detalhe.width"
      titleSlot={
        <div className="flex min-w-0 items-center gap-gp-sm text-body-sm text-fg-muted">
          <span className="truncate">Motoristas</span>
          <span className="opacity-50">/</span>
          <span className="truncate font-medium text-fg-default">
            {empresa}
          </span>
        </div>
      }
      footer={
        <>
          <Button variant="outline" color="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="filled"
            color="primary"
            size="sm"
            iconLeft={<Save />}
            disabled={!sujo}
            onClick={() => setSujo(false)}
          >
            Salvar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-gp-2xl">
        {/* Nome grande no corpo: é uma frase (nome completo, ou razão social), e não cabe
            numa linha de header. */}
        <div className="flex flex-col gap-gp-2xs">
          <h2 className="text-balance text-title-lg text-fg-default">
            {motorista.nome}
          </h2>
          <span className="truncate text-body-xs text-fg-muted">
            {motorista.email}
          </span>
        </div>

        {/* ── Cadastro ─────────────────────────────────────────────────────
            Mesma ficha do painel de Carregadores: lista plana, ícone à esquerda, sem card.
            `192px` na coluna de rótulo — o maior é "Carregadores usados". */}
        {/* `--col-rotulo` existe pra que a LINHA INTERATIVA (que ocupa as duas colunas)
            reproduza o mesmo template por dentro — sem ela, o valor da linha de tags sairia
            desalinhado do resto da ficha. */}
        <div
          className="grid grid-cols-1 gap-x-gp-md gap-y-gp-2xs sm:grid-cols-[var(--col-rotulo)_1fr] sm:items-center"
          style={{ ["--col-rotulo" as string]: "192px" }}
        >
          <LinhaDeDispositivo
            icone={AtSign}
            label="E-mail"
            valor={<span className="truncate">{motorista.email}</span>}
          />
          <LinhaDeDispositivo
            icone={CreditCard}
            label="CPF"
            valor={<span className="tabular-nums">{motorista.cpf}</span>}
          />
          <LinhaDeDispositivo
            icone={Phone}
            label="Telefone"
            valor={<span className="tabular-nums">{motorista.telefone}</span>}
          />
          <LinhaDeDispositivo
            icone={Building2}
            label="Empresa"
            valor={empresa}
          />
          <LinhaDeDispositivo
            icone={FileText}
            label="Complemento"
            valor={
              motorista.complemento || (
                <span className="text-fg-subtle">–</span>
              )
            }
          />
          {/* Editáveis no lugar — ver o JSDoc. `interativa` é o que pinta a linha
              inteira no hover e revela o lápis. */}
          <LinhaDeDispositivo
            interativa
            icone={Tag}
            label="Tags"
            valor={<TagsEditaveis tags={tags} onChange={alterarTags} />}
          />
        </div>

        {/* ── Atividade no período ─────────────────────────────────────────
            Separada do cadastro porque muda com o filtro de data do topo da lista: cadastro
            é do motorista, atividade é do recorte. Misturar as duas faria parecer que o CPF
            também depende do período.

            `border-t` + `pt`: a divisória é o que transforma "mais um bloco de texto" em
            CATEGORIA, e é o mesmo tratamento que o painel de detalhe do DS dá às seções. */}
        <div className="flex flex-col gap-gp-lg border-t border-border-default pt-pad-2xl">
          <span className="text-body-md font-semibold text-fg-default">
            Atividade no período
          </span>
          <div
            className="grid grid-cols-1 gap-x-gp-md gap-y-gp-2xs sm:grid-cols-[var(--col-rotulo)_1fr] sm:items-center"
            style={{ ["--col-rotulo" as string]: "192px" }}
          >
            <LinhaDeDispositivo
              icone={Plug}
              label="Carregadores usados"
              valor={
                <span className="tabular-nums">{motorista.carregadores}</span>
              }
            />
            <LinhaDeDispositivo
              icone={Receipt}
              label="Transações"
              valor={
                <span className="tabular-nums">{motorista.transacoes}</span>
              }
            />
            <LinhaDeDispositivo
              icone={Zap}
              label="Energia"
              valor={
                <span className="tabular-nums">
                  {motorista.energiaKwh.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  kWh
                </span>
              }
            />
            <LinhaDeDispositivo
              icone={Clock}
              label="Duração"
              valor={
                <span className="tabular-nums">
                  {formatarDuracao(motorista.duracaoMin)}
                </span>
              }
            />
            <LinhaDeDispositivo
              icone={Wallet}
              label="Valor"
              valor={
                <span
                  className={`tabular-nums font-semibold ${
                    motorista.valor > 0 ? "text-fg-success" : "text-fg-muted"
                  }`}
                >
                  {brl.format(motorista.valor)}
                </span>
              }
            />
          </div>
        </div>

        {/* ── Editar ───────────────────────────────────────────────────────
            O mesmo campo de tags do popover, aberto. É o caminho pra quem não descobre o
            lápis do hover — e é o único lugar onde a empresa se troca.

            Seção, não card: as três partes do painel (cadastro, atividade, edição) são
            categorias do MESMO registro, e uma delas com moldura sugeriria que ela vem de
            outro lugar. A divisória já separa. */}
        <section className="flex flex-col gap-form-gap border-t border-border-default pt-pad-2xl">
          <span className="text-body-md font-semibold text-fg-default">
            Editar
          </span>
          <FormFieldSelect
            label={TAGS_MODAL.empresa}
            options={[{ value: "PV MOB", label: "PV MOB" }]}
            value={empresa}
            onValueChange={(v) => {
              setEmpresa(v);
              setSujo(true);
            }}
            /* As tags são POR EMPRESA na origem (o modal se chama "Tags do usuário por
               empresa") — trocar a empresa troca o conjunto de tags que se está editando. */
            helperText="As tags valem para a empresa selecionada."
          />
          <div className="flex flex-col gap-gp-md">
            <span className="text-body-sm font-semibold tracking-[0.01em] text-fg-default dark:text-fg-muted">
              {TAGS_MODAL.tags}
            </span>
            <CampoDeTags
              tags={tags}
              onChange={alterarTags}
              placeholder={TAGS_MODAL.placeholder}
              sugestoes={TAGS_DISPONIVEIS}
            />
            <span className="text-caption-md text-fg-muted">
              {TAGS_MODAL.ajuda}
            </span>
          </div>
        </section>
      </div>
    </FloatingPanel>
  );
}
